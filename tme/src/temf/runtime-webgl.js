/**
 * TEMF — Time Engine Mini Fast Runtime (WebGL)
 *
 * Rendering: rect + image draw calls, transform (rotation, scale) and alpha
 * for both. Textures are cached by path (LRU-evicted) and uploaded via
 * an Image element + texImage2D (no CPU canvas readback).
 * Rect and image data live in a per-frame-reused instanced vertex buffer
 * (one float slot per object, no per-vertex duplication) and are drawn
 * with a single instanced draw call per batch (6 verts, N instances) via
 * the ANGLE_instanced_arrays extension — mirrors the WebGPU backend's
 * storage-buffer + instancing approach as closely as WebGL1 allows.
 * Draw order matches call order: consecutive same-type/same-texture items
 * are batched into a single draw call, but the batch flushes whenever the
 * type or texture changes, so later rect()/image() calls always render on
 * top of earlier ones — different textures are never batched together.
 */

'use strict';

const TEMF = {
  _started: false,
  _canvas: null,
  _gl: null,
  _instancing: null, // ANGLE_instanced_arrays extension
  _fps: 60,
  _accumulator: 0,
  _lastTime: 0,
  _step: 0,
  _game: null,
  _fullscreenCallback: null,
  _rectProgram: null,
  _rectLocs: null,
  _rectQuadBuffer: null,
  _rectInstanceBuffer: null,
  _imageProgram: null,
  _imageLocs: null,
  _imageQuadBuffer: null,
  _imageInstanceBuffer: null,
  _drawList: [],
  _rectMax: 1024,
  _imageMax: 1024,
  _rectScratch: null,
  _imageScratch: null,
  _textureCache: new Map(),
  _textureCacheMax: 64,
  _pendingImageDraws: [],
  _imageElements: new Map(),
  _keyPressed: new Set(),
  _mouseX: 0,
  _mouseY: 0,
  _mouseButtons: new Map(),
  _touchMax: 4,
  _touchSlots: [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ],
  _touchPointerToSlot: new Map(), // native pointerId -> slot index (0-3)
  _audioContext: null,
  _audioInitialized: false,
  _audioCache: new Map(),
  _audioUsage: new Map(),
  _sfxNodes: [],
  _bgmSource: null,
  _bgmGain: null,
  _sfxGain: null,
  _masterGain: null,
  _audioVolume: 1,
  _audioSfxVolume: 1,
  _audioBgmVolume: 1,
  _audioMuted: false,
  _audioMutedSfx: false,
  _audioMutedBgm: false,
  _bgmWasPlaying: false,
  _preloadDone: true,
  _tabSwitched: false,
};

// ============================================================
// Utilities
// ============================================================

function _parseColor(color) {
  if (!color || typeof color !== 'string') {
    throw new Error(`_parseColor: invalid color value ${JSON.stringify(color)} (expected a hex string like "#rrggbb")`);
  }
  const hex = color.trim();
  const m8 = hex.match(/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
  if (m8) {
    return [
      parseInt(m8[1], 16) / 255,
      parseInt(m8[2], 16) / 255,
      parseInt(m8[3], 16) / 255,
      1,
    ];
  }
  const m16 = hex.match(/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
  if (m16) {
    return [
      parseInt(m16[1], 16) / 255,
      parseInt(m16[2], 16) / 255,
      parseInt(m16[3], 16) / 255,
      parseInt(m16[4], 16) / 255,
    ];
  }
  throw new Error(`_parseColor: invalid color format "${color}" (expected "#rrggbb" or "#rrggbbaa")`);
}

function _getBasePath() {
  if (typeof document !== 'undefined') {
    const scripts = document.querySelectorAll('script[src]');
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].src;
      const idx = src.lastIndexOf('/');
      if (idx !== -1) {
        return src.substring(0, idx + 1);
      }
    }
  }
  return '';
}

// ============================================================
// Rendering: texture loading & caching
// ============================================================

async function _loadImage(path) {
  if (TEMF._imageElements.has(path)) {
    return TEMF._imageElements.get(path);
  }

  const base = _getBasePath();
  const url = base + path;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;

  return new Promise((resolve, reject) => {
    img.onload = () => {
      TEMF._imageElements.set(path, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error('Failed to load image: ' + path));
  });
}

function _createTexture(gl, img) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  return texture;
}

function _evictTextureCache() {
  if (TEMF._textureCache.size <= TEMF._textureCacheMax) return;

  let oldestKey = null;
  let oldestTime = Infinity;
  for (const [key, entry] of TEMF._textureCache) {
    if (entry.lastUsed !== undefined && entry.lastUsed < oldestTime) {
      oldestTime = entry.lastUsed;
      oldestKey = key;
    }
  }

  if (oldestKey) {
    const entry = TEMF._textureCache.get(oldestKey);
    if (entry.texture) {
      TEMF._gl.deleteTexture(entry.texture);
    }
    TEMF._textureCache.delete(oldestKey);
  }
}

function _getOrCreateTexture(path) {
  if (!TEMF._gl) return null;

  if (TEMF._textureCache.has(path)) {
    const entry = TEMF._textureCache.get(path);
    entry.lastUsed = performance.now();
    if (entry.status === 'loaded') {
      return entry;
    }
    return null;
  }

  _evictTextureCache();

  const entry = { status: 'pending' };
  TEMF._textureCache.set(path, entry);

  let loadedWidth = 0, loadedHeight = 0;
  _loadImage(path)
    .then((img) => {
      loadedWidth = img.width;
      loadedHeight = img.height;
      return _createTexture(TEMF._gl, img);
    })
    .then((texture) => {
      entry.status = 'loaded';
      entry.texture = texture;
      entry.width = loadedWidth;
      entry.height = loadedHeight;
      entry.lastUsed = performance.now();
      // No need to replay _pendingImageDraws here: the game loop calls the
      // game's draw() again every tick, so the next _draw() call will simply
      // find this texture 'loaded' and draw it in its correct call order.
      TEMF._pendingImageDraws = TEMF._pendingImageDraws.filter(d => d.path !== path);
    })
    .catch((err) => {
      entry.status = 'error';
      entry.error = err.message;
      console.error(err.message);
      TEMF._pendingImageDraws = TEMF._pendingImageDraws.filter(d => d.path !== path);
    });

  return null;
}

function _cleanupTextures() {
  const gl = TEMF._gl;
  if (!gl) return;
  for (const [, entry] of TEMF._textureCache) {
    if (entry.texture) {
      gl.deleteTexture(entry.texture);
      entry.texture = null;
    }
  }
  TEMF._textureCache.clear();
}

// ============================================================
// Rendering: WebGL setup & pipelines
// ============================================================

function _resize() {
  if (!TEMF._canvas || !TEMF._gl) return;

  const dpr = window.devicePixelRatio || 1;
  const width = TEMF._canvas.clientWidth * dpr;
  const height = TEMF._canvas.clientHeight * dpr;

  if (TEMF._canvas.width !== width || TEMF._canvas.height !== height) {
    TEMF._canvas.width = width;
    TEMF._canvas.height = height;
    TEMF._gl.viewport(0, 0, width, height);
  }
}

function _compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error('Shader compile failed: ' + info);
  }
  return shader;
}

function _linkProgram(gl, vs, fs) {
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error('Program link failed: ' + info);
  }
  return program;
}

function _getLocations(gl, program, attribs, uniforms) {
  const locs = {};
  for (const name of attribs) {
    locs[name] = gl.getAttribLocation(program, name);
  }
  for (const name of uniforms) {
    locs[name] = gl.getUniformLocation(program, name);
  }
  return locs;
}

function _createRenderer() {
  const gl = TEMF._gl;
  const max = TEMF._rectMax;

  // === Rectangle shader ===
  // Corner (aCorner) is per-vertex (divisor 0); every other attribute is
  // per-instance (divisor 1), same split as the WebGPU version's
  // per-vertex cornerIdx vs. per-instance storage-buffer item.
  const rectVS = `
    attribute vec2 aCorner;
    attribute vec4 aData0; // x, y, w, h
    attribute vec4 aData1; // r, g, b, a
    attribute vec2 aData2; // rotation, scale
    uniform vec2 uCanvasSize;
    varying vec4 vColor;
    void main() {
      vec2 pos = aData0.xy + aCorner * aData0.zw;
      vec2 center = aData0.xy + aData0.zw * 0.5;
      pos = (pos - center) * aData2.y;
      float rad = aData2.x * 3.14159265 / 180.0;
      float c = cos(rad);
      float s = sin(rad);
      pos = vec2(pos.x * c - pos.y * s, pos.x * s + pos.y * c) + center;
      float px = (pos.x / uCanvasSize.x) * 2.0 - 1.0;
      float py = 1.0 - (pos.y / uCanvasSize.y) * 2.0;
      gl_Position = vec4(px, py, 0.0, 1.0);
      vColor = aData1;
    }
  `;

  const rectFS = `
    precision mediump float;
    varying vec4 vColor;
    void main() {
      gl_FragColor = vColor;
    }
  `;

  const rectProg = _linkProgram(gl, _compileShader(gl, gl.VERTEX_SHADER, rectVS), _compileShader(gl, gl.FRAGMENT_SHADER, rectFS));
  const rectLocs = _getLocations(gl, rectProg, ['aCorner', 'aData0', 'aData1', 'aData2'], ['uCanvasSize']);
  TEMF._rectProgram = rectProg;
  TEMF._rectLocs = rectLocs;

  // Unit quad (0..1), uploaded once — reused every frame, no per-draw rebuild.
  const quadVerts = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]);
  TEMF._rectQuadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, TEMF._rectQuadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);

  TEMF._rectInstanceBuffer = gl.createBuffer();
  TEMF._rectScratch = new Float32Array(max * 10); // 10 floats/instance: x,y,w,h,r,g,b,a,rotation,scale

  // === Image shader ===
  const imgVS = `
    attribute vec2 aCorner;
    attribute vec4 aData0; // x, y, w, h
    attribute vec4 aData1; // u0, v0, u1, v1
    attribute vec4 aData2; // rotation, scale, alpha, padding
    uniform vec2 uCanvasSize;
    varying vec2 vUV;
    varying float vAlpha;
    void main() {
      vec2 pos = aData0.xy + aCorner * aData0.zw;
      vUV = mix(aData1.xy, aData1.zw, aCorner); // corner (0,0)=top-left samples (u0,v0)=top-left of image
      vec2 center = aData0.xy + aData0.zw * 0.5;
      pos = (pos - center) * aData2.y;
      float rad = aData2.x * 3.14159265 / 180.0;
      float c = cos(rad);
      float s = sin(rad);
      pos = vec2(pos.x * c - pos.y * s, pos.x * s + pos.y * c) + center;
      float px = (pos.x / uCanvasSize.x) * 2.0 - 1.0;
      float py = 1.0 - (pos.y / uCanvasSize.y) * 2.0;
      gl_Position = vec4(px, py, 0.0, 1.0);
      vAlpha = aData2.z;
    }
  `;

  const imgFS = `
    precision mediump float;
    uniform sampler2D uTexture;
    varying vec2 vUV;
    varying float vAlpha;
    void main() {
      vec4 texColor = texture2D(uTexture, vUV);
      gl_FragColor = vec4(texColor.rgb, texColor.a * vAlpha);
    }
  `;

  const imgProg = _linkProgram(gl, _compileShader(gl, gl.VERTEX_SHADER, imgVS), _compileShader(gl, gl.FRAGMENT_SHADER, imgFS));
  const imgLocs = _getLocations(gl, imgProg, ['aCorner', 'aData0', 'aData1', 'aData2'], ['uCanvasSize', 'uTexture']);
  TEMF._imageProgram = imgProg;
  TEMF._imageLocs = imgLocs;

  TEMF._imageQuadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, TEMF._imageQuadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);

  TEMF._imageInstanceBuffer = gl.createBuffer();
  const imageMax = TEMF._imageMax;
  TEMF._imageScratch = new Float32Array(imageMax * 12); // 12 floats/instance: x,y,w,h,u0,v0,u1,v1,rotation,scale,alpha,pad
}

async function initWebGL() {
  const canvas = document.getElementById('game');
  if (!canvas) {
    throw new Error('Canvas #game not found in DOM.');
  }

  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true });
  if (!gl) {
    throw new Error('WebGL is not supported by this browser.');
  }

  const instancing = gl.getExtension('ANGLE_instanced_arrays');
  if (!instancing) {
    throw new Error('WebGL: ANGLE_instanced_arrays is not supported by this browser.');
  }

  TEMF._canvas = canvas;
  TEMF._gl = gl;
  TEMF._instancing = instancing;
  gl.enable(gl.BLEND);
  // Match WebGPU's blend state: color blends by src-alpha, alpha channel
  // accumulates with srcFactor=one (matches the WebGPU pipeline's separate
  // color/alpha blend equations) so the two backends composite identically.
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  _resize();
  _createRenderer();
}

function resizeCanvas() {
  if (TEMF._canvas && TEMF._gl) {
    _resize();
  }
}

// ============================================================
// Rendering: draw API (rect/image) & per-frame draw calls
// ============================================================

function _rect(x, y, width, height, color, rotation, scale, alpha) {
  if (TEMF._drawList.length >= TEMF._rectMax) return;

  const [r, g, b, a] = _parseColor(color);
  const optRotation = (typeof rotation === 'number') ? rotation : 0;
  const optScale = (typeof scale === 'number') ? scale : 1;
  const optAlpha = (alpha !== undefined && alpha !== null) ? alpha : a;
  TEMF._drawList.push({
    type: 'rect',
    x, y, width, height, r, g, b, a: optAlpha,
    rotation: optRotation,
    scale: optScale,
  });
}

function _image(path, x, y, rotation, scale, alpha, cropX, cropY, cropEndX, cropEndY) {
  const optRotation = (typeof rotation === 'number') ? rotation : 0;
  const optScale = (typeof scale === 'number') ? scale : 1;
  const optAlpha = (alpha !== undefined && alpha !== null) ? alpha : 1;
  const optCropX = (typeof cropX === 'number') ? cropX : 0;
  const optCropY = (typeof cropY === 'number') ? cropY : 0;
  const optCropEndX = (typeof cropEndX === 'number') ? cropEndX : 0;
  const optCropEndY = (typeof cropEndY === 'number') ? cropEndY : 0;

  const img = TEMF._imageElements.get(path);
  let texW = 0, texH = 0;

  if (img) {
    texW = img.width;
    texH = img.height;
  }

  let displayW, displayH;
  if (img) {
    displayW = texW * optScale;
    displayH = texH * optScale;
  } else {
    displayW = 64 * optScale;
    displayH = 64 * optScale;
  }

  let u0 = 0, v0 = 0, u1 = 1, v1 = 1;
  if (img) {
    const endX = optCropEndX > 0 ? optCropEndX : texW;
    const endY = optCropEndY > 0 ? optCropEndY : texH;
    u0 = optCropX / texW;
    v0 = optCropY / texH;
    u1 = endX / texW;
    v1 = endY / texH;
  }

  if (TEMF._drawList.length >= TEMF._rectMax) return;

  TEMF._drawList.push({
    type: 'image',
    path: path,
    x: x,
    y: y,
    width: displayW,
    height: displayH,
    u0: u0,
    v0: v0,
    u1: u1,
    v1: v1,
    alpha: optAlpha,
    rotation: optRotation,
    scale: optScale,
  });
}

function _drawRects(rects, locs) {
  const gl = TEMF._gl;
  const ext = TEMF._instancing;
  if (!gl || rects.length === 0) return;

  const count = Math.min(rects.length, TEMF._rectMax);
  const data = TEMF._rectScratch; // reused every call/frame, no per-draw allocation
  for (let i = 0; i < count; i++) {
    const r = rects[i];
    data[i * 10 + 0] = r.x;
    data[i * 10 + 1] = r.y;
    data[i * 10 + 2] = r.width;
    data[i * 10 + 3] = r.height;
    data[i * 10 + 4] = r.r;
    data[i * 10 + 5] = r.g;
    data[i * 10 + 6] = r.b;
    data[i * 10 + 7] = r.a;
    data[i * 10 + 8] = r.rotation || 0;
    data[i * 10 + 9] = r.scale || 1;
  }

  gl.useProgram(TEMF._rectProgram);
  gl.uniform2fv(locs.uCanvasSize, [TEMF._canvas.width, TEMF._canvas.height]);

  // Per-vertex: the shared unit quad (divisor 0).
  gl.bindBuffer(gl.ARRAY_BUFFER, TEMF._rectQuadBuffer);
  gl.enableVertexAttribArray(locs.aCorner);
  gl.vertexAttribPointer(locs.aCorner, 2, gl.FLOAT, false, 0, 0);
  ext.vertexAttribDivisorANGLE(locs.aCorner, 0);

  // Per-instance: one write, three attribute views into the same buffer
  // (mirrors the WebGPU pipeline reading one RectData struct per instance).
  gl.bindBuffer(gl.ARRAY_BUFFER, TEMF._rectInstanceBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, data.buffer, gl.DYNAMIC_DRAW, 0, count * 10 * 4);
  const stride = 10 * 4;
  gl.enableVertexAttribArray(locs.aData0);
  gl.vertexAttribPointer(locs.aData0, 4, gl.FLOAT, false, stride, 0);
  ext.vertexAttribDivisorANGLE(locs.aData0, 1);
  gl.enableVertexAttribArray(locs.aData1);
  gl.vertexAttribPointer(locs.aData1, 4, gl.FLOAT, false, stride, 16);
  ext.vertexAttribDivisorANGLE(locs.aData1, 1);
  gl.enableVertexAttribArray(locs.aData2);
  gl.vertexAttribPointer(locs.aData2, 2, gl.FLOAT, false, stride, 32);
  ext.vertexAttribDivisorANGLE(locs.aData2, 1);

  ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, count); // 6 verts per quad, instanced N times
}

function _drawImageBatch(texture, items, locs) {
  const gl = TEMF._gl;
  const ext = TEMF._instancing;
  if (!gl || !texture || items.length === 0) return;

  const count = Math.min(items.length, TEMF._imageMax);
  const data = TEMF._imageScratch; // reused every call/frame, no per-draw allocation
  for (let i = 0; i < count; i++) {
    const item = items[i];
    data[i * 12 + 0] = item.x;
    data[i * 12 + 1] = item.y;
    data[i * 12 + 2] = item.width;
    data[i * 12 + 3] = item.height;
    data[i * 12 + 4] = item.u0 || 0;
    data[i * 12 + 5] = item.v0 || 0;
    data[i * 12 + 6] = item.u1 || 1;
    data[i * 12 + 7] = item.v1 || 1;
    data[i * 12 + 8] = item.rotation || 0;
    data[i * 12 + 9] = item.scale || 1;
    data[i * 12 + 10] = item.alpha || 1;
    data[i * 12 + 11] = 0; // padding, unused
  }

  gl.useProgram(TEMF._imageProgram);
  gl.uniform2fv(locs.uCanvasSize, [TEMF._canvas.width, TEMF._canvas.height]);

  gl.bindBuffer(gl.ARRAY_BUFFER, TEMF._imageQuadBuffer);
  gl.enableVertexAttribArray(locs.aCorner);
  gl.vertexAttribPointer(locs.aCorner, 2, gl.FLOAT, false, 0, 0);
  ext.vertexAttribDivisorANGLE(locs.aCorner, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, TEMF._imageInstanceBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, data.buffer, gl.DYNAMIC_DRAW, 0, count * 12 * 4);
  const stride = 12 * 4;
  gl.enableVertexAttribArray(locs.aData0);
  gl.vertexAttribPointer(locs.aData0, 4, gl.FLOAT, false, stride, 0);
  ext.vertexAttribDivisorANGLE(locs.aData0, 1);
  gl.enableVertexAttribArray(locs.aData1);
  gl.vertexAttribPointer(locs.aData1, 4, gl.FLOAT, false, stride, 16);
  ext.vertexAttribDivisorANGLE(locs.aData1, 1);
  gl.enableVertexAttribArray(locs.aData2);
  gl.vertexAttribPointer(locs.aData2, 4, gl.FLOAT, false, stride, 32);
  ext.vertexAttribDivisorANGLE(locs.aData2, 1);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(locs.uTexture, 0);

  ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, 6, count); // 6 verts per quad, instanced N times
}

function _draw() {
  const gl = TEMF._gl;
  if (!gl) return;

  gl.viewport(0, 0, TEMF._canvas.width, TEMF._canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  if (TEMF._drawList.length === 0) return;

  // Batch consecutive items of the same type (and, for images, the same
  // texture) into a single instanced draw call, but flush the current batch
  // the moment something different comes along. This keeps draw order
  // exactly matching call order: earlier rect()/image() calls end up below,
  // later calls end up on top, which a "draw everything of type A, then
  // everything of type B" approach cannot guarantee.
  let batchType = null;
  let batchTexture = null;
  let batch = [];

  const flushBatch = () => {
    if (batch.length === 0) return;
    if (batchType === 'rect') {
      _drawRects(batch, TEMF._rectLocs);
    } else if (batchType === 'image') {
      _drawImageBatch(batchTexture, batch, TEMF._imageLocs);
    }
    batch = [];
  };

  for (let i = 0; i < TEMF._drawList.length; i++) {
    const item = TEMF._drawList[i];
    if (item.type === 'rect') {
      if (batchType !== 'rect') {
        flushBatch();
        batchType = 'rect';
      }
      batch.push(item);
    } else if (item.type === 'image') {
      const texEntry = _getOrCreateTexture(item.path);
      if (!texEntry || texEntry.status !== 'loaded') {
        if (texEntry && texEntry.status === 'pending') {
          TEMF._pendingImageDraws.push(item);
        }
        continue; // not loaded yet (or failed) — skip this frame, keep order for the rest
      }
      if (batchType !== 'image' || batchTexture !== texEntry.texture) {
        flushBatch();
        batchType = 'image';
        batchTexture = texEntry.texture;
      }
      batch.push(item);
    }
  }
  flushBatch();

  TEMF._drawList.length = 0;
}

// ============================================================
// Input: keyboard
// ============================================================

function _initKeyboard() {
  if (typeof window === 'undefined') return;

  window.addEventListener('keydown', (e) => {
    TEMF._keyPressed.add(e.key.toLowerCase());
  });

  window.addEventListener('keyup', (e) => {
    TEMF._keyPressed.delete(e.key.toLowerCase());
  });
}

function key(key) {
  if (typeof key === 'number') {
    if (key >= 0 && key <= 9) key = 'Digit' + key;
    else key = String(key);
  } else if (typeof key === 'string') {
    key = key.trim().toUpperCase();
    if (key.length === 1 && /[A-Z0-9]/.test(key)) {
      key = key.toLowerCase();
    } else {
      const map = {
        'SPACE': ' ', 'ENTER': 'Enter', 'ESC': 'Escape',
        'CTRL': 'Control', 'SHIFT': 'Shift', 'ALT': 'Alt', 'META': 'Meta',
        'FN': 'Fn', 'CAPSLOCK': 'CapsLock', 'NUMLOCK': 'NumLock', 'SCROLLLOCK': 'ScrollLock',
        'TAB': 'Tab',
        'UP': 'ArrowUp', 'DOWN': 'ArrowDown', 'LEFT': 'ArrowLeft', 'RIGHT': 'ArrowRight',
        'HOME': 'Home', 'END': 'End', 'PAGEUP': 'PageUp', 'PAGEDOWN': 'PageDown',
        'BACKSPACE': 'Backspace', 'DELETE': 'Delete', 'INSERT': 'Insert', 'CLEAR': 'Clear',
        'PAUSE': 'Pause', 'PRINTSCREEN': 'PrintScreen',
        'NUMPAD0': 'Numpad0', 'NUMPAD1': 'Numpad1', 'NUMPAD2': 'Numpad2', 'NUMPAD3': 'Numpad3',
        'NUMPAD4': 'Numpad4', 'NUMPAD5': 'Numpad5', 'NUMPAD6': 'Numpad6', 'NUMPAD7': 'Numpad7',
        'NUMPAD8': 'Numpad8', 'NUMPAD9': 'Numpad9',
        'NUMPADADD': 'NumpadAdd', 'NUMPADSUB': 'NumpadSubtract', 'NUMPADMUL': 'NumpadMultiply',
        'NUMPADDIV': 'NumpadDivide', 'NUMPADDEC': 'NumpadDecimal', 'NUMPADENTER': 'NumpadEnter',
        'NUMPADEQUAL': 'NumpadEqual', 'NUMPADCOMMA': 'NumpadComma',
        'NUMPADPARENLEFT': 'NumpadParenLeft', 'NUMPADPARENRIGHT': 'NumpadParenRight',
      };
      key = map[key] || key;
    }
  }
  return TEMF._keyPressed.has(key);
}

// ============================================================
// Input: mouse
// ============================================================

function _initMouse() {
  if (typeof window === 'undefined') return;

  const canvas = TEMF._canvas || document.getElementById('game');
  if (!canvas) return;

  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') {
      TEMF._mouseX = e.offsetX * (canvas.width / canvas.clientWidth);
      TEMF._mouseY = e.offsetY * (canvas.height / canvas.clientHeight);
      const btn = e.button.toString();
      if (!TEMF._mouseButtons.has(btn)) {
        TEMF._mouseButtons.set(btn, { down: false });
      }
      const state = TEMF._mouseButtons.get(btn);
      state.down = true;
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') {
      TEMF._mouseX = e.offsetX * (canvas.width / canvas.clientWidth);
      TEMF._mouseY = e.offsetY * (canvas.height / canvas.clientHeight);
    }
  });

  canvas.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'mouse') {
      const btn = e.button.toString();
      const state = TEMF._mouseButtons.get(btn);
      if (state) {
        state.down = false;
      }
    }
  });

  canvas.addEventListener('pointercancel', (e) => {
    if (e.pointerType === 'mouse') {
      for (const [btn, state] of TEMF._mouseButtons) {
        state.down = false;
      }
    }
  });

  canvas.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse') {
      for (const [btn, state] of TEMF._mouseButtons) {
        state.down = false;
      }
    }
  });

  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
}

function _getMouseState(btn) {
  if (!TEMF._mouseButtons.has(btn)) {
    TEMF._mouseButtons.set(btn, { down: false });
  }
  return TEMF._mouseButtons.get(btn);
}

// ============================================================
// Input: touch
// ============================================================

function _touchAllocateSlot(pointerId) {
  if (TEMF._touchPointerToSlot.has(pointerId)) {
    return TEMF._touchPointerToSlot.get(pointerId);
  }
  const used = new Set(TEMF._touchPointerToSlot.values());
  for (let i = 0; i < TEMF._touchMax; i++) {
    if (!used.has(i)) {
      TEMF._touchPointerToSlot.set(pointerId, i);
      return i;
    }
  }
  return -1; // all 4 slots taken — this extra finger is ignored
}

function _touchReleaseSlot(pointerId) {
  TEMF._touchPointerToSlot.delete(pointerId);
}

function _touchWipeSlot(slot) {
  slot.x = 0;
  slot.y = 0;
}

function _initTouch() {
  if (typeof window === 'undefined') return;

  const canvas = TEMF._canvas || document.getElementById('game');
  if (!canvas) return;

  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    const slotIdx = _touchAllocateSlot(e.pointerId);
    if (slotIdx === -1) return; // over the cap — this finger is ignored entirely
    const slot = TEMF._touchSlots[slotIdx];
    slot.x = e.offsetX;
    slot.y = e.offsetY;
  });

  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'touch') return;
    const slotIdx = TEMF._touchPointerToSlot.get(e.pointerId);
    if (slotIdx === undefined) return;
    const slot = TEMF._touchSlots[slotIdx];
    slot.x = e.offsetX;
    slot.y = e.offsetY;
  });

  canvas.addEventListener('pointerup', (e) => {
    if (e.pointerType !== 'touch') return;
    const slotIdx = TEMF._touchPointerToSlot.get(e.pointerId);
    if (slotIdx === undefined) return;
    _touchWipeSlot(TEMF._touchSlots[slotIdx]); // discard immediately, nothing lingers for a later read
    _touchReleaseSlot(e.pointerId); // free the slot so a new finger can reuse it
  });

  canvas.addEventListener('pointercancel', (e) => {
    if (e.pointerType !== 'touch') return;
    const slotIdx = TEMF._touchPointerToSlot.get(e.pointerId);
    if (slotIdx === undefined) return;
    _touchWipeSlot(TEMF._touchSlots[slotIdx]);
    _touchReleaseSlot(e.pointerId);
  });

  canvas.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'touch') return;
    const slotIdx = TEMF._touchPointerToSlot.get(e.pointerId);
    if (slotIdx === undefined) return;
    _touchWipeSlot(TEMF._touchSlots[slotIdx]);
    _touchReleaseSlot(e.pointerId);
  });
}

// ============================================================
// Input: public API objects
// ============================================================

const mouse = {
  get x() { return TEMF._mouseX; },
  get y() { return TEMF._mouseY; },
  down(btn) {
    const btnNum = (typeof btn === 'number') ? btn : 0;
    const state = _getMouseState(String(btnNum));
    return state.down;
  },
};

function _touchSlotIsActive(idx) {
  for (const mappedIdx of TEMF._touchPointerToSlot.values()) {
    if (mappedIdx === idx) return true; // a real finger is currently held at this slot
  }
  return false; // no lingering state after release — matches Godot: index only exists while pressed
}

function _getTouchSlot(id) {
  const idx = (typeof id === 'number') ? id : 0;
  if (idx < 0 || idx >= TEMF._touchMax || !Number.isInteger(idx)) {
    throw new Error(`touch: invalid finger id ${id} (must be an integer 0-${TEMF._touchMax - 1})`);
  }
  if (!_touchSlotIsActive(idx)) {
    throw new Error(`touch: no finger currently tracked at id ${idx}`);
  }
  return TEMF._touchSlots[idx];
}

const touch = {
  exists(id) {
    const idx = (typeof id === 'number') ? id : 0;
    if (idx < 0 || idx >= TEMF._touchMax || !Number.isInteger(idx)) return false;
    return _touchSlotIsActive(idx);
  },
  down(id) {
    const idx = (typeof id === 'number') ? id : 0;
    if (idx < 0 || idx >= TEMF._touchMax || !Number.isInteger(idx)) return false;
    return _touchSlotIsActive(idx);
  },
  x(id) {
    return _getTouchSlot(id).x;
  },
  y(id) {
    return _getTouchSlot(id).y;
  },
};

// ============================================================
// Audio
// ============================================================

function _initAudio() {
  if (TEMF._audioInitialized) return;
  if (typeof AudioContext === 'undefined' && typeof webkitAudioContext !== 'undefined') {
    TEMF._audioContext = new webkitAudioContext();
  } else {
    TEMF._audioContext = new (AudioContext || webkitAudioContext)();
  }
  TEMF._audioInitialized = true;

  TEMF._masterGain = TEMF._audioContext.createGain();
  TEMF._masterGain.connect(TEMF._audioContext.destination);
  TEMF._masterGain.gain.value = TEMF._audioVolume;

  TEMF._sfxGain = TEMF._audioContext.createGain();
  TEMF._sfxGain.gain.value = TEMF._audioSfxVolume;
  TEMF._sfxGain.connect(TEMF._masterGain);

  TEMF._bgmGain = TEMF._audioContext.createGain();
  TEMF._bgmGain.gain.value = TEMF._audioBgmVolume;
  TEMF._bgmGain.connect(TEMF._masterGain);
}

function _resumeAudioContext() {
  if (TEMF._audioContext && TEMF._audioContext.state === 'suspended') {
    TEMF._audioContext.resume().catch(() => {});
  }
}

async function _decodeAudioData(arrayBuffer) {
  if (!TEMF._audioContext) return null;
  try {
    return await TEMF._audioContext.decodeAudioData(arrayBuffer);
  } catch (e) {
    console.error('Failed to decode audio:', e.message);
    return null;
  }
}

async function _loadAudioBuffer(path) {
  if (TEMF._audioCache.has(path)) {
    TEMF._audioUsage.set(path, (TEMF._audioUsage.get(path) || 0) + 1);
    return TEMF._audioCache.get(path);
  }

  const base = _getBasePath();
  const url = base + path;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load audio: ${url}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await _decodeAudioData(arrayBuffer);
    if (audioBuffer) {
      TEMF._audioCache.set(path, audioBuffer);
      TEMF._audioUsage.set(path, 1);
    }
    return audioBuffer;
  } catch (e) {
    console.error(e.message);
    return null;
  }
}

function _playSfx(path) {
  if (!TEMF._audioContext) return null;
  _resumeAudioContext();

  const audioBuffer = TEMF._audioCache.get(path);
  if (!audioBuffer) {
    return _loadAudioBuffer(path).then((buffer) => {
      if (buffer) {
        return _playSfxInstance(buffer, path);
      }
      return null;
    });
  }

  return _playSfxInstance(audioBuffer, path);
}

function _playSfxInstance(buffer, path) {
  let source = null;
  try {
    source = TEMF._audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = false;
    source.connect(TEMF._sfxGain);
    source.start(0);
  } catch (e) {
    console.error('SFX playback failed:', e.message);
    return null;
  }

  const node = { source, type: 'sfx', path };
  TEMF._sfxNodes.push(node);

  source.onended = () => {
    const idx = TEMF._sfxNodes.indexOf(node);
    if (idx !== -1) {
      TEMF._sfxNodes.splice(idx, 1);
    }
    _releaseAudioIfUnused(path);
  };

  return node;
}

function _stopSfxNode(node) {
  try {
    if (node && node.source) {
      node.source.onended = null;
      node.source.stop();
    }
  } catch (e) {}
  const idx = TEMF._sfxNodes.indexOf(node);
  if (idx !== -1) {
    TEMF._sfxNodes.splice(idx, 1);
  }
  if (node && node.path) {
    _releaseAudioIfUnused(node.path);
  }
}

function _stopAllSfx() {
  for (let i = TEMF._sfxNodes.length - 1; i >= 0; i--) {
    _stopSfxNode(TEMF._sfxNodes[i]);
  }
}

function _releaseAudioIfUnused(path) {
  let usage = TEMF._audioUsage.get(path) || 0;
  usage--;
  if (usage <= 0) {
    TEMF._audioUsage.delete(path);
    TEMF._audioCache.delete(path);
  } else {
    TEMF._audioUsage.set(path, usage);
  }
}

function _cleanupAudio() {
  _stopAllSfx();
  _stopBgm();
  if (TEMF._audioCache) {
    TEMF._audioCache.clear();
  }
  if (TEMF._audioUsage) {
    TEMF._audioUsage.clear();
  }
  if (TEMF._audioContext) {
    try {
      TEMF._audioContext.close();
    } catch (e) {}
    TEMF._audioContext = null;
  }
  TEMF._audioInitialized = false;
}

function _playBgm(path, loop) {
  if (!TEMF._audioContext) return;
  _resumeAudioContext();

  if (TEMF._bgmSource) {
    try {
      TEMF._bgmSource.onended = null;
      TEMF._bgmSource.stop();
    } catch (e) {}
    TEMF._bgmSource = null;
  }

  const audioBuffer = TEMF._audioCache.get(path);
  if (!audioBuffer) {
    return _loadAudioBuffer(path).then((buffer) => {
      if (buffer) {
        _playBgmInstance(buffer, loop !== false, path);
      }
    });
  }

  _playBgmInstance(audioBuffer, loop !== false, path);
}

function _playBgmInstance(buffer, loop, path) {
  let source = null;
  try {
    source = TEMF._audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = loop || true;
    source.connect(TEMF._bgmGain);
    source.start(0);
    TEMF._bgmSource = source;
    if (path) {
      TEMF._audioUsage.set(path, (TEMF._audioUsage.get(path) || 0) + 1);
    }
  } catch (e) {
    console.error('BGM playback failed:', e.message);
  }
}

function _stopBgm() {
  if (TEMF._bgmSource) {
    try {
      TEMF._bgmSource.onended = null;
      TEMF._bgmSource.stop();
    } catch (e) {}
    TEMF._bgmSource = null;
  }
}

function _pauseBgm() {
  if (!TEMF._audioContext || !TEMF._bgmSource) return;
  try {
    TEMF._audioContext.suspend();
  } catch (e) {}
}

function _resumeBgm() {
  if (!TEMF._audioContext) return;
  try {
    TEMF._audioContext.resume();
  } catch (e) {}
}

function _setMasterVolume(val) {
  TEMF._audioVolume = Math.max(0, Math.min(1, val));
  if (TEMF._masterGain) {
    TEMF._masterGain.gain.value = TEMF._audioMuted ? 0 : TEMF._audioVolume;
  }
}

function _setSfxVolume(val) {
  TEMF._audioSfxVolume = Math.max(0, Math.min(1, val));
  if (TEMF._sfxGain) {
    TEMF._sfxGain.gain.value = TEMF._audioMutedSfx ? 0 : TEMF._audioSfxVolume;
  }
}

function _setBgmVolume(val) {
  TEMF._audioBgmVolume = Math.max(0, Math.min(1, val));
  if (TEMF._bgmGain) {
    TEMF._bgmGain.gain.value = TEMF._audioMutedBgm ? 0 : TEMF._audioBgmVolume;
  }
}

function _setMuted(muted) {
  TEMF._audioMuted = !!muted;
  if (TEMF._masterGain) {
    TEMF._masterGain.gain.value = TEMF._audioMuted ? 0 : TEMF._audioVolume;
  }
}

function _cleanupSfxNodes() {
  for (let i = TEMF._sfxNodes.length - 1; i >= 0; i--) {
    const node = TEMF._sfxNodes[i];
    if (!node || !node.source) {
      TEMF._sfxNodes.splice(i, 1);
    }
  }
}

const _AUDIO_EXTS = ['mp3', 'wav', 'ogg', 'weba', 'm4a', 'aac', 'flac', 'wma'];

function _isAudio(path) {
  const ext = path.split('.').pop().toLowerCase();
  return _AUDIO_EXTS.includes(ext);
}

function preload(resources) {
  let paths = [];

  if (resources) {
    if (typeof resources === 'string') {
      paths = [resources];
    } else if (Array.isArray(resources)) {
      for (const item of resources) {
        if (typeof item === 'string') {
          paths.push(item);
        } else if (item && typeof item === 'object') {
          if (item.images) paths = paths.concat(item.images);
          if (item.audio) paths = paths.concat(item.audio);
          if (item.path) paths.push(item.path);
        }
      }
    }
  }

  TEMF._preloadFailed = [];

  if (paths.length === 0) {
    TEMF._preloadDone = true;
  } else {
    TEMF._preloadDone = false;
    Promise.all(
      paths.map(async (path) => {
        try {
          if (_isAudio(path)) {
            const buffer = await _loadAudioBuffer(path);

            if (!buffer) {
              TEMF._preloadFailed.push(path);
            }
          } else {
            const img = await _loadImage(path);

            if (img && TEMF._gl) {
              const texture = _createTexture(TEMF._gl, img);

              TEMF._textureCache.set(path, {
                status: 'loaded',
                texture: texture,
                width: img.width,
                height: img.height,
                lastUsed: performance.now()
              });
            } else {
              TEMF._preloadFailed.push(path);
            }
          }
        } catch (err) {
          TEMF._preloadFailed.push(path);
          console.error('Preload failed:', path, err);
        }
      })
    ).then(() => {
      TEMF._preloadDone = true;
    });
  }
}

function checkpreload(reset) {
  if (reset === false) {
    TEMF._preloadDone = false;
    return false;
  }
  return TEMF._preloadDone !== false;
}

function preloadfailed() {
  if (!TEMF._preloadFailed) return false;
  return TEMF._preloadFailed.length > 0;
}

function preloadisloaded(path) {
  if (!TEMF._preloadDone) return false;
  if (TEMF._preloadFailed && TEMF._preloadFailed.includes(path)) return false;
  if (path.startsWith('img/') || path.includes('.png') || path.includes('.jpg') || path.includes('.jpeg') || path.includes('.gif') || path.includes('.webp') || path.includes('.bmp')) {
    return TEMF._images && TEMF._images[path];
  }
  return true;
}

const audio = {
  play(path, type, loop) {
    if (!path || !type) return;

    if (type === 'sfx') {
      if (!TEMF._audioContext) _initAudio();
      _playSfx(path);
    } else if (type === 'bgm') {
      if (!TEMF._audioContext) _initAudio();
      const loopVal = (loop === false) ? false : true;
      _playBgm(path, loopVal);
    }
  },
  stop(type) {
    if (type === 'sfx') {
      _stopAllSfx();
    } else if (type === 'bgm') {
      _stopBgm();
    } else {
      _stopBgm();
      _stopAllSfx();
    }
  },
  pause() {
    _pauseBgm();
  },
  resume() {
    _resumeBgm();
  },
  get volume() {
    return TEMF._audioVolume;
  },
  set volume(val) {
    _setMasterVolume(val);
  },
  get sfxVolume() {
    return TEMF._audioSfxVolume;
  },
  set sfxVolume(val) {
    _setSfxVolume(val);
  },
  get bgmVolume() {
    return TEMF._audioBgmVolume;
  },
  set bgmVolume(val) {
    _setBgmVolume(val);
  },
  get mutedSfx() {
    return TEMF._audioMutedSfx;
  },
  set mutedSfx(val) {
    TEMF._audioMutedSfx = val;
    if (TEMF._sfxGain) {
      TEMF._sfxGain.gain.value = val ? 0 : TEMF._audioSfxVolume;
    }
  },
  get mutedBgm() {
    return TEMF._audioMutedBgm;
  },
  set mutedBgm(val) {
    TEMF._audioMutedBgm = val;
    if (TEMF._bgmGain) {
      TEMF._bgmGain.gain.value = val ? 0 : TEMF._audioBgmVolume;
    }
  },
};

// ============================================================
// Game loop & bootstrap
// ============================================================

function gameLoop() {
  const now = performance.now();
  const elapsed = Math.min((now - TEMF._lastTime) / 1000, 0.25);
  TEMF._lastTime = now;
  TEMF._accumulator += elapsed;

  while (TEMF._accumulator >= TEMF._step) {
    if (TEMF._game && typeof TEMF._game.update === 'function') {
      TEMF._game.update(TEMF._step);
    }
    if (TEMF._game && typeof TEMF._game.draw === 'function') {
      TEMF._game.draw();
    }
    _cleanupSfxNodes();
    _draw();
    TEMF._accumulator -= TEMF._step;
  }

  requestAnimationFrame(gameLoop);
}

function _initVisibility() {
  if (typeof document === 'undefined') return;

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // จำไว้ว่าเคยสลับออกจาก tab แล้ว (ค่าจะเป็น true ค้างตลอด ไม่รีเซ็ตกลับ)
      TEMF._tabSwitched = true;

      // จำสถานะไว้ตอนออกจาก tab ว่าตอนนั้นเพลงกำลังเล่นอยู่หรือเปล่า
      TEMF._bgmWasPlaying = !!TEMF._bgmSource && TEMF._audioContext && TEMF._audioContext.state === 'running';
    }

    _setMuted(document.hidden);

    if (!document.hidden) {
      // เคลียร์ input ค้าง เพราะ keyup/pointerup อาจไม่ยิงมาถึงตอนอยู่นอก tab
      TEMF._keyPressed.clear();
      for (const [, state] of TEMF._mouseButtons) {
        state.down = false;
      }
      for (const slot of TEMF._touchSlots) {
        _touchWipeSlot(slot);
      }
      TEMF._touchPointerToSlot.clear();

      // ถ้าตอนออกไปเพลงกำลังเล่นอยู่ แต่กลับมาแล้วไม่เล่นแล้ว ให้ reload หน้าเว็บ
      if (TEMF._bgmWasPlaying) {
        const isPlayingNow = !!TEMF._bgmSource && TEMF._audioContext && TEMF._audioContext.state === 'running';
        if (!isPlayingNow) {
          location.reload();
        }
      }
    }
  });
}

function _bootstrap() {
  if (TEMF._started) return;

  TEMF._fps = TEMF._fps || 60;
  TEMF._step = 1 / TEMF._fps;
  TEMF._accumulator = 0;
  TEMF._lastTime = 0;
  TEMF._started = true;

  initWebGL().then(() => {
    window.addEventListener('orientationchange', resizeCanvas);
    window.addEventListener('resize', resizeCanvas);
    _initKeyboard();
    _initMouse();
    _initTouch();
    _initVisibility();
    TEMF._lastTime = performance.now();
    gameLoop();
  }).catch(err => {
    console.error('TEMF initialization failed:', err);
  });
}

// For game code written as its own ES module (top-level functions there
// are NOT auto-exposed on window the way a classic <script> would be),
// call setGame({ update, draw }) instead of assigning window.update/draw.
// Safe to call whether or not the engine has already auto-started: it
// always updates TEMF._game, and only runs the one-time bootstrap if
// nothing has started it yet.
function setGame(gameObj) {
  TEMF._game = gameObj || {};
  _bootstrap();
}

function fps(fpsValue) {
  TEMF._fps = fpsValue;
  TEMF._step = 1 / TEMF._fps;
}

function getCanvasSize() {
  if (!TEMF._canvas) {
    return { width: 0, height: 0 };
  }
  return {
    width: TEMF._canvas.width,
    height: TEMF._canvas.height
  };
}

function requestFullscreen() {
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen();
  } else if (document.documentElement.webkitRequestFullscreen) {
    document.documentElement.webkitRequestFullscreen();
  } else if (document.documentElement.msRequestFullscreen) {
    document.documentElement.msRequestFullscreen();
  }
}

function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
}

function setFullscreenCallback(callback) {
  TEMF._fullscreenCallback = callback;
}

function _handleFullscreenChange() {
  if (TEMF._fullscreenCallback) {
    TEMF._fullscreenCallback();
  }
}

function hasTabSwitched(reset) {
  if (reset === false) {
    TEMF._tabSwitched = false;
    return false;
  }
  return !!TEMF._tabSwitched;
}

function unload(path) {
  if (!path || typeof path !== 'string') {
    throw new Error('unload(): invalid path');
  }

  if (TEMF._imageElements.has(path)) {
    if (!TEMF._textureCache.has(path)) {
      throw new Error(`unload(): texture not found "${path}"`);
    }

    TEMF._imageElements.delete(path);

    const entry = TEMF._textureCache.get(path);

    if (entry && entry.texture && TEMF._gl) {
      try {
        TEMF._gl.deleteTexture(entry.texture);
      } catch (e) {}
    }

    TEMF._textureCache.delete(path);
    return;
  }

  if (TEMF._bgmPath === path) {
    if (TEMF._bgmSource) {
      _stopBgm();
    }

    TEMF._audioCache.delete(path);
    TEMF._bgmPath = null;
    return;
  }

  if (TEMF._audioCache.has(path)) {
    throw new Error(`unload(): cannot unload SFX "${path}"`);
  }

  throw new Error(`unload(): image not found "${path}"`);
}

document.addEventListener('fullscreenchange', _handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', _handleFullscreenChange);
document.addEventListener('msfullscreenchange', _handleFullscreenChange);

// ============================================================
// Public API / global exports
// ============================================================

TEMF.cleanupTextures = _cleanupTextures;

TEMF.cleanupAudio = _cleanupAudio;

if (typeof window !== 'undefined') {
  window.setGame = setGame;
  window.fps = fps;
  window.getCanvasSize = getCanvasSize;
  window.requestFullscreen = requestFullscreen;
  window.exitFullscreen = exitFullscreen;
  window.setFullscreenCallback = setFullscreenCallback;
  window.hasTabSwitched = hasTabSwitched;
  window.unload = unload;
  window.rect = _rect;
  window.image = _image;
  window.key = key;
  window.mouse = mouse;
  window.touch = touch;
  window.audio = audio;
  window.preload = preload;
  window.checkpreload = checkpreload;
  window.preloadfailed = preloadfailed;
  window.preloadisloaded = preloadisloaded;

  // Load game.js only after every window.* binding above is in place,
  // so game.js can safely call setGame()/rect()/touch.* etc. as soon as
  // it starts running, regardless of <script> ordering in index.html.
  import('./game.js').catch((err) => {
    console.error('Failed to load game.js:', err);
  });
}
