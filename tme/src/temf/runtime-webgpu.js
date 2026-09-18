/**
 * TEMF — Time Engine Mini Fast Runtime
 *
 * Rendering: rect + image draw calls, transform (rotation, scale) and alpha
 * for both. Textures are cached by path (LRU-evicted) and uploaded via
 * createImageBitmap + copyExternalImageToTexture (no CPU canvas readback).
 * Rect and image data live in per-frame-reused GPU storage buffers (no
 * uniform-buffer size ceiling) and are drawn with instancing (6 verts,
 * N instances) instead of one draw call per object.
 * Draw order matches call order: consecutive same-type/same-texture items
 * are batched into a single draw call, but the batch flushes whenever the
 * type or texture changes, so later rect()/image() calls always render on
 * top of earlier ones — different textures are never batched together.
 */

'use strict';

const TEMF = {
  _started: false,
  _canvas: null,
  _device: null,
  _context: null,
  _canvasFormat: null,
  _fps: 60,
  _accumulator: 0,
  _lastTime: 0,
  _step: 0,
  _game: null,
  _fullscreenCallback: null,
  _rectPipeline: null,
  _rectUniformBuffer: null,
  _rectBindGroup: null,
  _canvasSizeBuffer: null,
  _imagePipeline: null,
  _imageBindGroupLayout: null,
  _imageSampler: null,
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

async function _createTexture(device, img) {
  const width = img.width;
  const height = img.height;

  const texture = device.createTexture({
    size: [width, height, 1],
    format: 'rgba8unorm',
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
  });

  // createImageBitmap + copyExternalImageToTexture: decodes and uploads via
  // the GPU/compositor path, avoiding a 2D canvas + getImageData CPU readback.
  const bitmap = await createImageBitmap(img, { imageOrientation: 'none' });
  try {
    device.queue.copyExternalImageToTexture(
      { source: bitmap },
      { texture: texture },
      [width, height]
    );
  } finally {
    bitmap.close();
  }

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
      entry.texture.destroy();
      if (TEMF._imageBindGroups) {
        TEMF._imageBindGroups.delete(entry.texture);
      }
    }
    TEMF._textureCache.delete(oldestKey);
  }
}

function _getOrCreateTexture(path) {
  if (!TEMF._device) return null;

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
      return _createTexture(TEMF._device, img);
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
  for (const [, entry] of TEMF._textureCache) {
    if (entry.texture) {
      entry.texture.destroy();
      entry.texture = null;
    }
  }
  TEMF._textureCache.clear();
  if (TEMF._imageBindGroups) {
    TEMF._imageBindGroups.clear();
  }
}

// ============================================================
// Rendering: WebGPU setup & pipelines
// ============================================================

function _resize() {
  if (!TEMF._canvas || !TEMF._context) return;

  const dpr = window.devicePixelRatio || 1;
  const width = TEMF._canvas.clientWidth * dpr;
  const height = TEMF._canvas.clientHeight * dpr;

  if (TEMF._canvas.width !== width || TEMF._canvas.height !== height) {
    TEMF._canvas.width = width;
    TEMF._canvas.height = height;
  }
}

function _createRenderer() {
  const device = TEMF._device;
  const format = TEMF._canvasFormat;
  const max = TEMF._rectMax;

  // Rectangle pipeline
  const rectShaderCode = `
    struct RectData {
      x: f32, y: f32, w: f32, h: f32,
      r: f32, g: f32, b: f32, a: f32,
      rotation: f32, scale: f32, pad0: f32, pad1: f32,
    };
    @group(0) @binding(0) var<storage, read> rectData: array<RectData>;
    @group(0) @binding(1) var<uniform> canvasSize: vec2f;
    struct VSOut {
      @builtin(position) position: vec4f,
      @location(0) color: vec4f,
    };
    @vertex
    fn vs(@builtin(vertex_index) cornerIdx: u32, @builtin(instance_index) rectIdx: u32) -> VSOut {
      let item = rectData[rectIdx];
      let x = item.x;
      let y = item.y;
      let w = item.w;
      let h = item.h;
      let r = item.r;
      let g = item.g;
      let b = item.b;
      let a = item.a;
      let rotation = item.rotation;
      let scale = item.scale;
      var pos: vec2f;
      if (cornerIdx == 0u) {
        pos = vec2f(x, y);
      } else if (cornerIdx == 1u) {
        pos = vec2f(x + w, y);
      } else if (cornerIdx == 2u) {
        pos = vec2f(x, y + h);
      } else if (cornerIdx == 3u) {
        pos = vec2f(x + w, y);
      } else if (cornerIdx == 4u) {
        pos = vec2f(x + w, y + h);
      } else {
        pos = vec2f(x, y + h);
      }
      let cx = x + w * 0.5;
      let cy = y + h * 0.5;
      pos = pos - vec2f(cx, cy);
      pos = pos * scale;
      let rad = rotation * 3.14159265 / 180.0;
      let cos_r = cos(rad);
      let sin_r = sin(rad);
      pos = vec2f(pos.x * cos_r - pos.y * sin_r, pos.x * sin_r + pos.y * cos_r);
      pos = pos + vec2f(cx, cy);
      let clipPos = vec2f(
        (pos.x / canvasSize.x) * 2.0 - 1.0,
        1.0 - (pos.y / canvasSize.y) * 2.0
      );
      return VSOut(vec4f(clipPos, 0.0, 1.0), vec4f(r, g, b, a));
    }
    @fragment
    fn fs(input: VSOut) -> @location(0) vec4f {
      return input.color;
    }
  `;

  const rectPipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: device.createShaderModule({ code: rectShaderCode }),
      entryPoint: 'vs',
      buffers: [],
    },
    fragment: {
      module: device.createShaderModule({ code: rectShaderCode }),
      entryPoint: 'fs',
      targets: [{
        format: format,
        blend: {
          color: {
            srcFactor: 'src-alpha',
            dstFactor: 'one-minus-src-alpha',
            operation: 'add',
          },
          alpha: {
            srcFactor: 'one',
            dstFactor: 'one-minus-src-alpha',
            operation: 'add',
          },
        },
      }],
    },
    primitive: {
      topology: 'triangle-list',
      cullMode: 'none',
    },
  });

  const rectBufferSize = max * 12 * 4; // max rects * 12 floats * 4 bytes (storage buffer, no 64KB uniform ceiling)
  const uniformBuffer = device.createBuffer({
    size: rectBufferSize,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  TEMF._rectScratch = new Float32Array(max * 12);

  const rectBindGroupLayout = rectPipeline.getBindGroupLayout(0);
  const canvasSizeBuffer = device.createBuffer({
    size: 8,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const rectBindGroup = device.createBindGroup({
    layout: rectBindGroupLayout,
    entries: [{
      binding: 0,
      resource: { buffer: uniformBuffer },
    }, {
      binding: 1,
      resource: { buffer: canvasSizeBuffer },
    }],
  });

  TEMF._rectPipeline = rectPipeline;
  TEMF._rectUniformBuffer = uniformBuffer;
  TEMF._rectBindGroup = rectBindGroup;
  TEMF._canvasSizeBuffer = canvasSizeBuffer;

  // Image pipeline
  const imageShaderCode = `
    struct ImageUniforms {
      x: f32,
      y: f32,
      w: f32,
      h: f32,
      u0: f32,
      v0: f32,
      u1: f32,
      v1: f32,
      rotation: f32,
      scale: f32,
      alpha: f32,
      padding: f32,
    };
    @group(0) @binding(0) var<uniform> canvasSize: vec2f;
    @group(0) @binding(1) var<storage, read> imageData: array<ImageUniforms>;
    @group(0) @binding(2) var mySampler: sampler;
    @group(0) @binding(3) var myTexture: texture_2d<f32>;
    struct VSOut {
      @builtin(position) position: vec4f,
      @location(0) uv: vec2f,
      @location(1) alpha: f32,
    };
    @vertex
    fn vs(@builtin(vertex_index) vertIdx: u32, @builtin(instance_index) imgIdx: u32) -> VSOut {
      let base = imageData[imgIdx];
      let x0 = base.x;
      let y0 = base.y;
      let x1 = base.x + base.w;
      let y1 = base.y + base.h;
      var pos: vec2f;
      var uv: vec2f;
      if (vertIdx == 0u) {
        pos = vec2f(x0, y0); uv = vec2f(base.u0, base.v0);
      } else if (vertIdx == 1u) {
        pos = vec2f(x1, y0); uv = vec2f(base.u1, base.v0);
      } else if (vertIdx == 2u) {
        pos = vec2f(x0, y1); uv = vec2f(base.u0, base.v1);
      } else if (vertIdx == 3u) {
        pos = vec2f(x0, y1); uv = vec2f(base.u0, base.v1);
      } else if (vertIdx == 4u) {
        pos = vec2f(x1, y0); uv = vec2f(base.u1, base.v0);
      } else {
        pos = vec2f(x1, y1); uv = vec2f(base.u1, base.v1);
      }
      let cx = base.x + base.w * 0.5;
      let cy = base.y + base.h * 0.5;
      pos = pos - vec2f(cx, cy);
      pos = pos * base.scale;
      let rad = base.rotation * 3.14159265 / 180.0;
      let cos_r = cos(rad);
      let sin_r = sin(rad);
      pos = vec2f(pos.x * cos_r - pos.y * sin_r, pos.x * sin_r + pos.y * cos_r);
      pos = pos + vec2f(cx, cy);
      let clipPos = vec2f(
        (pos.x / canvasSize.x) * 2.0 - 1.0,
        1.0 - (pos.y / canvasSize.y) * 2.0
      );
      return VSOut(vec4f(clipPos, 0.0, 1.0), uv, base.alpha);
    }
    @fragment
    fn fs(input: VSOut) -> @location(0) vec4f {
      let texColor = textureSample(myTexture, mySampler, input.uv);
      return vec4f(texColor.rgb, texColor.a * input.alpha);
    }
  `;

  const imagePipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: device.createShaderModule({ code: imageShaderCode }),
      entryPoint: 'vs',
      buffers: [],
    },
    fragment: {
      module: device.createShaderModule({ code: imageShaderCode }),
      entryPoint: 'fs',
      targets: [{
        format: format,
        blend: {
          color: {
            srcFactor: 'src-alpha',
            dstFactor: 'one-minus-src-alpha',
            operation: 'add',
          },
          alpha: {
            srcFactor: 'one',
            dstFactor: 'one-minus-src-alpha',
            operation: 'add',
          },
        },
      }],
    },
    primitive: {
      topology: 'triangle-list',
    },
  });

  const imageMax = TEMF._imageMax;
  const imageUniformBuffer = device.createBuffer({
    size: imageMax * 12 * 4, // 12 floats/item (48-byte stride incl. padding); storage buffer, no 64KB ceiling
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  TEMF._imageScratch = new Float32Array(imageMax * 12);

  const imageBindGroupLayout = imagePipeline.getBindGroupLayout(0);

  const sampler = device.createSampler({
    magFilter: 'nearest',
    minFilter: 'nearest',
  });

  TEMF._imagePipeline = imagePipeline;
  TEMF._imageBindGroupLayout = imageBindGroupLayout;
  TEMF._imageUniformBuffer = imageUniformBuffer;
  TEMF._imageSampler = sampler;
  TEMF._imageBindGroups = new Map();
}

async function initWebGPU() {
  if (!navigator.gpu) {
    throw new Error('WebGPU is not supported by this browser. Please use a browser with WebGPU support.');
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    const isFileProtocol = location.protocol === 'file:';
    if (isFileProtocol) {
      throw new Error('WebGPU requires a local server. Run: npx serve . or python -m http.server');
    }
    throw new Error('WebGPU: Failed to request adapter. Check browser compatibility and permissions.');
  }

  TEMF._device = await adapter.requestDevice();
  if (!TEMF._device) {
    throw new Error('WebGPU: Failed to request device.');
  }

  TEMF._canvas = document.getElementById('game');
  if (!TEMF._canvas) {
    throw new Error('Canvas #game not found in DOM.');
  }

  TEMF._context = TEMF._canvas.getContext('webgpu');
  if (!TEMF._context) {
    throw new Error('WebGPU: Failed to get canvas context.');
  }

  TEMF._canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  TEMF._context.configure({
    device: TEMF._device,
    format: TEMF._canvasFormat,
    alphaMode: 'premultiplied',
  });

  _resize();
  _createRenderer();
}

function resizeCanvas() {
  if (TEMF._canvas && TEMF._context) {
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

function _getOrCreateImageBindGroup(texture) {
  if (!texture) return null;

  if (TEMF._imageBindGroups.has(texture)) {
    return TEMF._imageBindGroups.get(texture);
  }

  const bindGroup = TEMF._device.createBindGroup({
    layout: TEMF._imageBindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: { buffer: TEMF._canvasSizeBuffer },
      },
      {
        binding: 1,
        resource: { buffer: TEMF._imageUniformBuffer },
      },
      {
        binding: 2,
        resource: TEMF._imageSampler,
      },
      {
        binding: 3,
        resource: texture.createView(),
      },
    ],
  });

  TEMF._imageBindGroups.set(texture, bindGroup);
  return bindGroup;
}

function _drawRects(rects, rp) {
  const device = TEMF._device;
  if (!device || rects.length === 0) return;

  const count = Math.min(rects.length, TEMF._rectMax);
  const data = TEMF._rectScratch; // reused every call/frame, no per-draw allocation
  for (let i = 0; i < count; i++) {
    const r = rects[i];
    data[i * 12 + 0] = r.x;
    data[i * 12 + 1] = r.y;
    data[i * 12 + 2] = r.width;
    data[i * 12 + 3] = r.height;
    data[i * 12 + 4] = r.r;
    data[i * 12 + 5] = r.g;
    data[i * 12 + 6] = r.b;
    data[i * 12 + 7] = r.a;
    data[i * 12 + 8] = r.rotation || 0;
    data[i * 12 + 9] = r.scale || 1;
    data[i * 12 + 10] = 0;
    data[i * 12 + 11] = 0;
  }

  device.queue.writeBuffer(
    TEMF._rectUniformBuffer,
    0,
    data.buffer,
    0,
    count * 12 * 4
  );

  const canvasSizeData = new Float32Array([TEMF._canvas.width, TEMF._canvas.height]);
  device.queue.writeBuffer(TEMF._canvasSizeBuffer, 0, canvasSizeData);

  rp.setPipeline(TEMF._rectPipeline);
  rp.setBindGroup(0, TEMF._rectBindGroup);
  rp.draw(6, count, 0, 0); // 6 verts per quad, instanced N times
}

function _drawImageBatch(texture, items, rp) {
  const device = TEMF._device;
  if (!device || !texture || items.length === 0) return;

  const bindGroup = _getOrCreateImageBindGroup(texture);
  if (!bindGroup) return;

  const count = Math.min(items.length, TEMF._imageMax);
  const uniformData = TEMF._imageScratch; // reused every call/frame, no per-draw allocation
  for (let i = 0; i < count; i++) {
    const item = items[i];
    uniformData[i * 12 + 0] = item.x;
    uniformData[i * 12 + 1] = item.y;
    uniformData[i * 12 + 2] = item.width;
    uniformData[i * 12 + 3] = item.height;
    uniformData[i * 12 + 4] = item.u0 || 0;
    uniformData[i * 12 + 5] = item.v0 || 0;
    uniformData[i * 12 + 6] = item.u1 || 1;
    uniformData[i * 12 + 7] = item.v1 || 1;
    uniformData[i * 12 + 8] = item.rotation || 0;
    uniformData[i * 12 + 9] = item.scale || 1;
    uniformData[i * 12 + 10] = item.alpha || 1;
    uniformData[i * 12 + 11] = 0; // padding to match WGSL struct's 48-byte stride
  }

  device.queue.writeBuffer(
    TEMF._imageUniformBuffer,
    0,
    uniformData.buffer,
    0,
    count * 48
  );

  const canvasSizeData = new Float32Array([TEMF._canvas.width, TEMF._canvas.height]);
  device.queue.writeBuffer(TEMF._canvasSizeBuffer, 0, canvasSizeData);

  rp.setPipeline(TEMF._imagePipeline);
  rp.setBindGroup(0, bindGroup);
  rp.draw(6, count, 0, 0); // 6 verts per quad, instanced N times
}

function _draw() {
  const device = TEMF._device;
  const context = TEMF._context;

  if (!device || !context) return;

  if (TEMF._drawList.length === 0) {
    const commandEncoder = device.createCommandEncoder();
    const textureView = context.getCurrentTexture().createView();
    const renderPassDescriptor = {
      colorAttachments: [{
        view: textureView,
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
        loadOp: 'clear',
        storeOp: 'store',
      }],
    };
    const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor);
    renderPass.end();
    device.queue.submit([commandEncoder.finish()]);
    TEMF._drawList.length = 0;
    return;
  }

  const commandEncoder = device.createCommandEncoder();
  const textureView = context.getCurrentTexture().createView();

  const renderPassDescriptor = {
    colorAttachments: [{
      view: textureView,
      clearValue: { r: 0, g: 0, b: 0, a: 1 },
      loadOp: 'clear',
      storeOp: 'store',
    }],
  };

  const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor);

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
      _drawRects(batch, renderPass);
    } else if (batchType === 'image') {
      _drawImageBatch(batchTexture, batch, renderPass);
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

  renderPass.end();
  device.queue.submit([commandEncoder.finish()]);

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
          if (item.bgm) paths = paths.concat(item.bgm);
          if (item.sfx) paths = paths.concat(item.sfx);
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

            if (img && TEMF._device) {
              const texture = await _createTexture(TEMF._device, img);

              if (texture) {
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

function checkpreload() {
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

  initWebGPU().then(() => {
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

function hasTabSwitched() {
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

    if (entry && entry.texture) {
      try {
        entry.texture.destroy();
      } catch (e) {}

      if (TEMF._imageBindGroups) {
        TEMF._imageBindGroups.delete(entry.texture);
      }
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
