/**
 * TEMF — Time Engine Mini Fast Runtime (WebGL)
 *
 * Rendering: rect + image draw calls, transform (rotation, scale) and alpha
 * for both. Textures are cached by path (LRU-evicted) and uploaded via
 * Image element + texImage2D (no CPU canvas readback).
 * Rect and image data live in per-frame-reused vertex buffers and are
 * drawn with triangle strips (6 verts per quad) instead of one draw
 * call per object.
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
  _fps: 60,
  _accumulator: 0,
  _lastTime: 0,
  _step: 0,
  _game: null,
  _fullscreenCallback: null,
  _rectProgram: null,
  _rectLocs: null,
  _rectBuffer: null,
  _imageProgram: null,
  _imageLocs: null,
  _imageBuffer: null,
  _drawList: [],
  _rectMax: 1024,
  _imageMax: 1024,
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
    { x: 0, y: 0, down: false },
    { x: 0, y: 0, down: false },
    { x: 0, y: 0, down: false },
    { x: 0, y: 0, down: false },
  ],
  _touchPointerToSlot: new Map(),
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

function _loadImage(path) {
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

  // === Rectangle shader ===
  const rectVS = `
    attribute vec2 aPos;
    attribute vec4 aRect;
    attribute vec4 aColorAlpha;
    attribute vec2 aRotScale;
    uniform vec2 uCanvasSize;
    varying vec4 vColor;
    void main() {
      vec2 pos = aPos;
      vec2 center = aRect.xy + aRect.zw * 0.5;
      pos = (pos - center) * aRotScale.y;
      float rad = aRotScale.x * 3.14159265 / 180.0;
      float c = cos(rad);
      float s = sin(rad);
      pos = vec2(pos.x * c - pos.y * s, pos.x * s + pos.y * c) + center;
      float px = (pos.x / uCanvasSize.x) * 2.0 - 1.0;
      float py = 1.0 - (pos.y / uCanvasSize.y) * 2.0;
      gl_Position = vec4(px, py, 0.0, 1.0);
      vColor = aColorAlpha;
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
  const rectLocs = _getLocations(gl, rectProg, ['aPos', 'aRect', 'aColorAlpha', 'aRotScale'], ['uCanvasSize']);
  TEMF._rectProgram = rectProg;
  TEMF._rectLocs = rectLocs;
  TEMF._rectBuffer = gl.createBuffer();

  // === Image shader ===
  const imgVS = `
    attribute vec2 aPos;
    attribute vec4 aRect;
    attribute vec2 aUV;
    attribute float aAlpha;
    attribute vec2 aRotScale;
    uniform vec2 uCanvasSize;
    varying vec2 vUV;
    varying float vAlpha;
    void main() {
      vec2 pos = aPos;
      vec2 center = aRect.xy + aRect.zw * 0.5;
      pos = (pos - center) * aRotScale.y;
      float rad = aRotScale.x * 3.14159265 / 180.0;
      float c = cos(rad);
      float s = sin(rad);
      pos = vec2(pos.x * c - pos.y * s, pos.x * s + pos.y * c) + center;
      float px = (pos.x / uCanvasSize.x) * 2.0 - 1.0;
      float py = 1.0 - (pos.y / uCanvasSize.y) * 2.0;
      gl_Position = vec4(px, py, 0.0, 1.0);
      vUV = aUV;
      vAlpha = aAlpha;
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
  const imgLocs = _getLocations(gl, imgProg, ['aPos', 'aRect', 'aUV', 'aAlpha', 'aRotScale'], ['uCanvasSize', 'uTexture']);
  TEMF._imageProgram = imgProg;
  TEMF._imageLocs = imgLocs;
  TEMF._imageBuffer = gl.createBuffer();
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

  TEMF._canvas = canvas;
  TEMF._gl = gl;
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

function createResizeObserver() {
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(() => {
      resizeCanvas();
    });
    observer.observe(document.body);
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

function _image(path, x, y, width, height, rotation, scale, alpha) {
  let srcW, srcH;

  if (typeof width === 'number' && typeof height === 'number') {
    srcW = width;
    srcH = height;
  } else {
    srcW = 0;
    srcH = 0;
  }

  const optRotation = (typeof rotation === 'number') ? rotation : 0;
  const optScale = (typeof scale === 'number') ? scale : 1;
  const optAlpha = (alpha !== undefined && alpha !== null) ? alpha : 1;

  const img = TEMF._imageElements.get(path);
  let texW = 0, texH = 0;

  if (img) {
    texW = img.width;
    texH = img.height;
  }

  let displayW, displayH;
  if (srcW > 0 && srcH > 0) {
    displayW = srcW * optScale;
    displayH = srcH * optScale;
  } else if (img) {
    displayW = texW * optScale;
    displayH = texH * optScale;
  } else {
    displayW = 64 * optScale;
    displayH = 64 * optScale;
  }

  let u0 = 0, v0 = 0, u1 = 1, v1 = 1;
  if (img && srcW > 0 && srcH > 0) {
    u0 = 0;
    v0 = 0;
    u1 = srcW / texW;
    v1 = srcH / texH;
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

function _drawRects(count, locs) {
  const gl = TEMF._gl;
  if (!gl || count === 0) return;

  const verts = [
    [0, 0], [1, 0], [0, 1], [0, 1], [1, 0], [1, 1]
  ];

  const totalVerts = count * 6;
  const posData = new Float32Array(totalVerts * 2);
  const rectData = new Float32Array(totalVerts * 4);
  const colorAlphaData = new Float32Array(totalVerts * 4);
  const rotScaleData = new Float32Array(totalVerts * 2);

  for (let i = 0; i < count; i++) {
    const item = TEMF._drawList[i];
    const x = item.x, y = item.y, w = item.width, h = item.height;
    const r = item.r, g = item.g, b = item.b, a = item.a;
    const rot = item.rotation || 0;
    const sc = item.scale || 1;

    for (let v = 0; v < 6; v++) {
      const vi = (i * 6 + v) * 2;
      posData[vi + 0] = verts[v][0];
      posData[vi + 1] = verts[v][1];

      rectData[vi + 0] = x;
      rectData[vi + 1] = y;
      rectData[vi + 2] = w;
      rectData[vi + 3] = h;

      colorAlphaData[vi + 0] = r;
      colorAlphaData[vi + 1] = g;
      colorAlphaData[vi + 2] = b;
      colorAlphaData[vi + 3] = a;

      rotScaleData[vi + 0] = rot;
      rotScaleData[vi + 1] = sc;
    }
  }

  gl.useProgram(TEMF._rectProgram);
  gl.uniform2fv(locs.uCanvasSize, [TEMF._canvas.width, TEMF._canvas.height]);

  gl.bindBuffer(gl.ARRAY_BUFFER, TEMF._rectBuffer);

  gl.bufferData(gl.ARRAY_BUFFER, posData, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(locs.aPos);
  gl.vertexAttribPointer(locs.aPos, 2, gl.FLOAT, false, 0, 0);

  gl.bufferData(gl.ARRAY_BUFFER, rectData, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(locs.aRect);
  gl.vertexAttribPointer(locs.aRect, 4, gl.FLOAT, false, 0, 0);

  gl.bufferData(gl.ARRAY_BUFFER, colorAlphaData, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(locs.aColorAlpha);
  gl.vertexAttribPointer(locs.aColorAlpha, 4, gl.FLOAT, false, 0, 0);

  gl.bufferData(gl.ARRAY_BUFFER, rotScaleData, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(locs.aRotScale);
  gl.vertexAttribPointer(locs.aRotScale, 2, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.TRIANGLES, 0, totalVerts);
}

function _drawImageBatch(texture, items, locs) {
  const gl = TEMF._gl;
  if (!gl || items.length === 0) return;

  const count = items.length;
  const verts = [
    [0, 0], [1, 0], [0, 1], [0, 1], [1, 0], [1, 1]
  ];

  const totalVerts = count * 6;
  const posData = new Float32Array(totalVerts * 2);
  const rectData = new Float32Array(totalVerts * 4);
  const uvData = new Float32Array(totalVerts * 2);
  const alphaData = new Float32Array(totalVerts);
  const rotScaleData = new Float32Array(totalVerts * 2);

  for (let i = 0; i < count; i++) {
    const item = items[i];
    const x = item.x, y = item.y, w = item.width, h = item.height;
    const u0 = item.u0 || 0, v0 = item.v0 || 0;
    const u1 = item.u1 || 1, v1 = item.v1 || 1;
    const alpha = item.alpha || 1;
    const rot = item.rotation || 0;
    const sc = item.scale || 1;

    for (let v = 0; v < 6; v++) {
      const vi = (i * 6 + v) * 2;
      posData[vi + 0] = verts[v][0];
      posData[vi + 1] = verts[v][1];

      rectData[vi + 0] = x;
      rectData[vi + 1] = y;
      rectData[vi + 2] = w;
      rectData[vi + 3] = h;

      if (v === 0) { uvData[vi + 0] = u0; uvData[vi + 1] = v1; }
      else if (v === 1) { uvData[vi + 0] = u1; uvData[vi + 1] = v1; }
      else if (v === 2) { uvData[vi + 0] = u0; uvData[vi + 1] = v0; }
      else if (v === 3) { uvData[vi + 0] = u0; uvData[vi + 1] = v0; }
      else if (v === 4) { uvData[vi + 0] = u1; uvData[vi + 1] = v1; }
      else { uvData[vi + 0] = u1; uvData[vi + 1] = v0; }

      alphaData[i * 6 + v] = alpha;
      rotScaleData[vi + 0] = rot;
      rotScaleData[vi + 1] = sc;
    }
  }

  gl.useProgram(TEMF._imageProgram);
  gl.uniform2fv(locs.uCanvasSize, [TEMF._canvas.width, TEMF._canvas.height]);

  gl.bindBuffer(gl.ARRAY_BUFFER, TEMF._imageBuffer);

  gl.bufferData(gl.ARRAY_BUFFER, posData, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(locs.aPos);
  gl.vertexAttribPointer(locs.aPos, 2, gl.FLOAT, false, 0, 0);

  gl.bufferData(gl.ARRAY_BUFFER, rectData, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(locs.aRect);
  gl.vertexAttribPointer(locs.aRect, 4, gl.FLOAT, false, 0, 0);

  gl.bufferData(gl.ARRAY_BUFFER, uvData, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(locs.aUV);
  gl.vertexAttribPointer(locs.aUV, 2, gl.FLOAT, false, 0, 0);

  gl.bufferData(gl.ARRAY_BUFFER, alphaData, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(locs.aAlpha);
  gl.vertexAttribPointer(locs.aAlpha, 1, gl.FLOAT, false, 0, 0);

  gl.bufferData(gl.ARRAY_BUFFER, rotScaleData, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(locs.aRotScale);
  gl.vertexAttribPointer(locs.aRotScale, 2, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(locs.uTexture, 0);

  gl.drawArrays(gl.TRIANGLES, 0, totalVerts);
}

function _draw() {
  const gl = TEMF._gl;
  if (!gl) return;

  gl.viewport(0, 0, TEMF._canvas.width, TEMF._canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  if (TEMF._drawList.length === 0) return;

  let batchType = null;
  let batchTexture = null;
  let batchStart = 0;

  const flushBatch = () => {
    if (batchStart >= TEMF._drawList.length) return;
    let end = batchStart;
    while (end < TEMF._drawList.length) {
      const item = TEMF._drawList[end];
      if (item.type === 'rect') {
        if (batchType !== 'rect') break;
        end++;
      } else if (item.type === 'image') {
        const texEntry = _getOrCreateTexture(item.path);
        if (!texEntry || texEntry.status !== 'loaded') {
          if (texEntry && texEntry.status === 'pending') {
            TEMF._pendingImageDraws.push(item);
          }
          break;
        }
        if (batchType !== 'image' || batchTexture !== texEntry.texture) break;
        end++;
      }
    }

    const count = end - batchStart;
    if (count > 0) {
      if (batchType === 'rect') {
        _drawRects(count, TEMF._rectLocs);
      } else if (batchType === 'image') {
        _drawImageBatch(batchTexture, TEMF._drawList.slice(batchStart, end), TEMF._imageLocs);
      }
    }
    batchStart = end;
  };

  let i = 0;
  while (i < TEMF._drawList.length) {
    const item = TEMF._drawList[i];
    batchStart = i;

    if (item.type === 'rect') {
      batchType = 'rect';
      batchTexture = null;
      flushBatch();
    } else if (item.type === 'image') {
      const texEntry = _getOrCreateTexture(item.path);
      if (!texEntry || texEntry.status !== 'loaded') {
        if (texEntry && texEntry.status === 'pending') {
          TEMF._pendingImageDraws.push(item);
        }
        i++;
        continue;
      }
      batchType = 'image';
      batchTexture = texEntry.texture;
      flushBatch();
    }
    i = batchStart;
  }

  TEMF._drawList.length = 0;
}

// ============================================================
// Input: keyboard
// ============================================================

function _initKeyboard() {
  if (typeof window === 'undefined') return;

  window.addEventListener('keydown', (e) => {
    TEMF._keyPressed.add(e.key);
  });

  window.addEventListener('keyup', (e) => {
    TEMF._keyPressed.delete(e.key);
  });
}

function key(key) {
  if (typeof key === 'number') {
    if (key >= 0 && key <= 9) key = 'Digit' + key;
    else key = String(key);
  } else if (typeof key === 'string') {
    key = key.trim().toUpperCase();
    if (key.length === 1 && /[A-Z0-9]/.test(key)) {
      // keep as is
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
      TEMF._mouseX = e.offsetX;
      TEMF._mouseY = e.offsetY;
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
      TEMF._mouseX = e.offsetX;
      TEMF._mouseY = e.offsetY;
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
  return -1;
}

function _touchReleaseSlot(pointerId) {
  TEMF._touchPointerToSlot.delete(pointerId);
}

function _touchWipeSlot(slot) {
  slot.x = 0;
  slot.y = 0;
  slot.down = false;
}

function _initTouch() {
  if (typeof window === 'undefined') return;

  const canvas = TEMF._canvas || document.getElementById('game');
  if (!canvas) return;

  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    const slotIdx = _touchAllocateSlot(e.pointerId);
    if (slotIdx === -1) return;
    const slot = TEMF._touchSlots[slotIdx];
    slot.x = e.offsetX;
    slot.y = e.offsetY;
    slot.down = true;
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
    _touchWipeSlot(TEMF._touchSlots[slotIdx]);
    _touchReleaseSlot(e.pointerId);
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
    if (mappedIdx === idx) return true;
  }
  return false;
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
  x(id) {
    return _getTouchSlot(id).x;
  },
  y(id) {
    return _getTouchSlot(id).y;
  },
  down(id) {
    return _getTouchSlot(id).down;
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
  TEMF._audioMutedSfx = muted;
  TEMF._audioMutedBgm = muted;
  if (TEMF._masterGain) {
    TEMF._masterGain.gain.value = TEMF._audioMuted ? 0 : TEMF._audioVolume;
  }
  if (TEMF._sfxGain) {
    TEMF._sfxGain.gain.value = TEMF._audioMutedSfx ? 0 : TEMF._audioSfxVolume;
  }
  if (TEMF._bgmGain) {
    TEMF._bgmGain.gain.value = TEMF._audioMutedBgm ? 0 : TEMF._audioBgmVolume;
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
  get muted() {
    return TEMF._audioMuted;
  },
  set muted(val) {
    _setMuted(val);
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
// Game loop
// ============================================================

function gameLoop(now) {
  if (!TEMF._lastTime) TEMF._lastTime = now;
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

function _bootstrap() {
  if (TEMF._started) return;

  TEMF._fps = TEMF._fps || 60;
  TEMF._step = 1 / TEMF._fps;
  TEMF._accumulator = 0;
  TEMF._lastTime = 0;
  TEMF._started = true;

  console.log('[TEMF] bootstrap starting (webgl)...');
  initWebGL().then(() => {
    console.log('[TEMF] WebGL initialized, starting game loop.');
    createResizeObserver();
    window.addEventListener('resize', resizeCanvas);
    _initKeyboard();
    _initMouse();
    _initTouch();
    TEMF._lastTime = performance.now();
    gameLoop();
  }).catch(err => {
    console.error('TEMF initialization failed:', err);
  });
}

function setGame(gameObj) {
  console.log('[TEMF] setGame() called (webgl runtime).');
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

document.addEventListener('fullscreenchange', _handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', _handleFullscreenChange);
document.addEventListener('msfullscreenchange', _handleFullscreenChange);

// ============================================================
// Public API / global exports
// ============================================================

TEMF.cleanupTextures = _cleanupTextures;

TEMF.cleanupAudio = _cleanupAudio;

if (typeof window !== 'undefined') {
  console.log('[TEMF] runtime-webgl.js loaded, exposing globals...');
  window.setGame = setGame;
  window.fps = fps;
  window.getCanvasSize = getCanvasSize;
  window.requestFullscreen = requestFullscreen;
  window.exitFullscreen = exitFullscreen;
  window.setFullscreenCallback = setFullscreenCallback;
  window.rect = _rect;
  window.image = _image;
  window.key = key;
  window.mouse = mouse;
  window.touch = touch;
  window.audio = audio;

  import('./game.js').catch((err) => {
    console.error('Failed to load game.js:', err);
  });
}
