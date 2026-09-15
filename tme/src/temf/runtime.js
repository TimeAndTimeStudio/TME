/**
 * TEMF — Time Engine Mini Fast Runtime
 *
 * Minimal runtime that waits for explicit start() before
 * initializing WebGPU and starting the game loop.
 *
 * Phase 4: Rectangle + Image rendering with texture caching.
 * Phase 6: Transform (rotation, scale) and alpha for rect and image.
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
  _animationFrameId: null,
  _game: null,
  _rectPipeline: null,
  _rectBindGroupLayout: null,
  _rectUniformBuffer: null,
  _rectVertexBuffer: null,
  _rectBindGroup: null,
  _imagePipeline: null,
  _imageBindGroupLayout: null,
  _imageVertexBuffer: null,
  _imageSampler: null,
  _drawList: [],
  _rectMax: 1024,
  _textureCache: new Map(),
  _textureCacheMax: 64,
  _pendingImageDraws: [],
  _imageElements: new Map(),
  _keyPressed: new Set(),
  _mouseX: 0,
  _mouseY: 0,
  _mouseButtons: new Map(),
  _mouseClicks: new Map(),
  _mouseDragging: false,
  _touchX: 0,
  _touchY: 0,
  _touchState: { down: false, tapped: false, dragging: false },
  _audioContext: null,
  _audioInitialized: false,
  _audioCache: new Map(),
  _audioUsage: new Map(),
  _sfxNodes: [],
  _bgmSource: null,
  _bgmBuffer: null,
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

const RECT_VERTEX_SIZE = 8; // x, y, w, h, r, g, b, a
const IMAGE_VERT_SIZE = 48; // 6 vertices * 8 floats (quad with UV + padding)

const IMAGE_QUAD = new Float32Array([
  // pos(2) + padding(2) + uv(2) + padding(2) per vertex
  0, 0, 0, 0,  0, 0, 0, 0,
  1, 0, 0, 0,  1, 0, 0, 0,
  0, 1, 0, 0,  0, 1, 0, 0,
  0, 1, 0, 0,  0, 1, 0, 0,
  1, 0, 0, 0,  1, 0, 0, 0,
  1, 1, 0, 0,  1, 1, 0, 0,
]);

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

function _parseColor(color) {
  if (!color || typeof color !== 'string') {
    return [1, 1, 1, 1];
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
  return [1, 1, 1, 1];
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

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, width, height);

  const texture = device.createTexture({
    size: [width, height, 1],
    format: 'rgba8unorm',
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
  });

  device.queue.writeTexture(
    { texture: texture },
    imageData.data,
    { bytesPerRow: width * 4 },
    [width, height]
  );

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
    }
    TEMF._textureCache.delete(oldestKey);

    for (const bindGroup of TEMF._imageBindGroups) {
      if (bindGroup[1] === oldestKey) {
        TEMF._imageBindGroups.delete(oldestKey);
        break;
      }
    }
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

  _loadImage(path)
    .then((img) => {
      const texture = _createTexture(TEMF._device, img);
      entry.status = 'loaded';
      entry.texture = texture;
      entry.width = img.width;
      entry.height = img.height;
      entry.lastUsed = performance.now();

      if (TEMF._pendingImageDraws.length > 0) {
        const pending = TEMF._pendingImageDraws.filter(d => d.path === path);
        TEMF._pendingImageDraws = TEMF._pendingImageDraws.filter(d => d.path !== path);
        for (const draw of pending) {
          _queueImageDraw(draw);
        }
      }
    })
    .catch((err) => {
      entry.status = 'error';
      entry.error = err.message;
      console.error(err.message);

      if (TEMF._pendingImageDraws.length > 0) {
        const pending = TEMF._pendingImageDraws.filter(d => d.path === path);
        TEMF._pendingImageDraws = TEMF._pendingImageDraws.filter(d => d.path !== path);
      }
    });

  return null;
}

function _createRenderer() {
  const device = TEMF._device;
  const format = TEMF._canvasFormat;
  const max = TEMF._rectMax;

  // Rectangle pipeline
  const rectShaderCode = `
    var<uniform> rectData: array<vec4f, ${max * 3}>;
    struct VSOut {
      @builtin(position) position: vec4f,
      @location(0) color: vec4f,
    };
    @vertex
    fn vs(@builtin(vertex_index) vertexIndex: u32) -> VSOut {
      let rectIdx = vertexIndex / 4u;
      let cornerIdx = vertexIndex % 4u;
      let base = rectIdx * 3u;
      let x = rectData[base].x;
      let y = rectData[base].y;
      let w = rectData[base].z;
      let h = rectData[base].w;
      let r = rectData[base + 1u].x;
      let g = rectData[base + 1u].y;
      let b = rectData[base + 1u].z;
      let a = rectData[base + 1u].w;
      let rotation = rectData[base + 2u].x;
      let scale = rectData[base + 2u].y;
      var pos: vec2f;
      if (cornerIdx == 0u) {
        pos = vec2f(x, y);
      } else if (cornerIdx == 1u) {
        pos = vec2f(x + w, y);
      } else if (cornerIdx == 2u) {
        pos = vec2f(x, y + h);
      } else {
        pos = vec2f(x + w, y + h);
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
      return VSOut(vec4f(pos, 0.0, 1.0), vec4f(r, g, b, a));
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
      topology: 'triangle-strip',
    },
  });

  const uniformBufferSize = max * 3 * 4 * 4; // max rects * 3 vec4f * 4 floats * 4 bytes
  const uniformBuffer = device.createBuffer({
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const vertexBuffer = device.createBuffer({
    size: 6 * 4 * 4,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  const quadVerts = new Float32Array([
    0, 0,  1, 0,  0, 1,
    0, 1,  1, 0,  1, 1,
  ]);
  device.queue.writeBuffer(vertexBuffer, 0, quadVerts);

  const rectBindGroupLayout = rectPipeline.getBindGroupLayout(0);
  const rectBindGroup = device.createBindGroup({
    layout: rectBindGroupLayout,
    entries: [{
      binding: 0,
      resource: { buffer: uniformBuffer },
    }],
  });

  TEMF._rectPipeline = rectPipeline;
  TEMF._rectBindGroupLayout = rectBindGroupLayout;
  TEMF._rectUniformBuffer = uniformBuffer;
  TEMF._rectVertexBuffer = vertexBuffer;
  TEMF._rectBindGroup = rectBindGroup;

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
    var<uniform> imageData: array<ImageUniforms, 1024>;
    @group(1) @binding(0) var mySampler: sampler;
    @group(1) @binding(1) var myTexture: texture_2d<f32>;
    struct VSOut {
      @builtin(position) position: vec4f,
      @location(0) uv: vec2f,
    };
    @vertex
    fn vs(@builtin(vertex_index) vertexIndex: u32) -> VSOut {
      let imgIdx = vertexIndex / 6u;
      let vertIdx = vertexIndex % 6u;
      let base = imageData[imgIdx];
      let x0 = base.x;
      let y0 = base.y;
      let x1 = base.x + base.w;
      let y1 = base.y + base.h;
      var pos: vec2f;
      var uv: vec2f;
      if (vertIdx == 0u) {
        pos = vec2f(x0, y0); uv = vec2f(base.u0, base.v1);
      } else if (vertIdx == 1u) {
        pos = vec2f(x1, y0); uv = vec2f(base.u1, base.v1);
      } else if (vertIdx == 2u) {
        pos = vec2f(x0, y1); uv = vec2f(base.u0, base.v0);
      } else if (vertIdx == 3u) {
        pos = vec2f(x0, y1); uv = vec2f(base.u0, base.v0);
      } else if (vertIdx == 4u) {
        pos = vec2f(x1, y0); uv = vec2f(base.u1, base.v1);
      } else {
        pos = vec2f(x1, y1); uv = vec2f(base.u1, base.v0);
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
      return VSOut(vec4f(pos, 0.0, 1.0), uv);
    }
    @fragment
    fn fs(input: VSOut) -> @location(0) vec4f {
      let texColor = textureSample(myTexture, mySampler, input.uv);
      return vec4f(texColor.rgb, texColor.a);
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

  const imageUniformBuffer = device.createBuffer({
    size: 1024 * 11 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const imageVertexBuffer = device.createBuffer({
    size: IMAGE_QUAD.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(imageVertexBuffer, 0, IMAGE_QUAD);

  const imageBindGroupLayout = imagePipeline.getBindGroupLayout(0);

  const sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
  });

  TEMF._imagePipeline = imagePipeline;
  TEMF._imageBindGroupLayout = imageBindGroupLayout;
  TEMF._imageUniformBuffer = imageUniformBuffer;
  TEMF._imageVertexBuffer = imageVertexBuffer;
  TEMF._imageSampler = sampler;
  TEMF._imageBindGroups = new Map();
}

function _rect(x, y, width, height, color, opts) {
  if (TEMF._drawList.length >= TEMF._rectMax) return;
  const [r, g, b, a] = _parseColor(color);
  const optRotation = (opts && typeof opts.rotation === 'number') ? opts.rotation : 0;
  const optScale = (opts && typeof opts.scale === 'number') ? opts.scale : 1;
  const optAlpha = (opts && opts.alpha !== undefined) ? opts.alpha : a;
  TEMF._drawList.push({
    type: 'rect',
    x, y, width, height, r, g, b, a: optAlpha,
    rotation: optRotation,
    scale: optScale,
  });
}

function _image(path, x, y, width, height, rotation, scale, alpha) {
  let srcW, srcH;
  let opts = {};

  if (typeof width === 'number' && typeof height === 'number') {
    srcW = width;
    srcH = height;
    opts = typeof rotation === 'object' ? rotation : {};
  } else if (typeof width === 'number' && typeof height === 'undefined') {
    opts = typeof width === 'object' ? width : {};
    srcW = 0;
    srcH = 0;
  } else {
    opts = typeof width === 'object' ? width : {};
    srcW = 0;
    srcH = 0;
  }

  const optRotation = opts.rotation || 0;
  const optScale = opts.scale || 1;
  const optAlpha = opts.alpha !== undefined ? opts.alpha : 1;

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

async function initWebGPU() {
  if (!navigator.gpu) {
    throw new Error('WebGPU is not supported by this browser. Please use a browser with WebGPU support.');
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error('WebGPU: Failed to request adapter.');
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

function createResizeObserver() {
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(() => {
      resizeCanvas();
    });
    observer.observe(document.body);
  }
}

function _initKeyboard() {
  if (typeof window === 'undefined') return;

  window.addEventListener('keydown', (e) => {
    TEMF._keyPressed.add(e.key);
  });

  window.addEventListener('keyup', (e) => {
    TEMF._keyPressed.delete(e.key);
  });
}

function _keyDown(key) {
  return TEMF._keyPressed.has(key);
}

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
        TEMF._mouseButtons.set(btn, { down: false, clicked: false, dragging: false });
      }
      const state = TEMF._mouseButtons.get(btn);
      state.down = true;
      state.clicked = false;
      state.dragging = false;
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') {
      const prevX = TEMF._mouseX;
      const prevY = TEMF._mouseY;
      TEMF._mouseX = e.offsetX;
      TEMF._mouseY = e.offsetY;
      const buttons = e.buttons;
      for (const [btn, state] of TEMF._mouseButtons) {
        const btnNum = parseInt(btn, 10);
        if (btnNum >= 0 && btnNum <= 2 && (buttons & (1 << btnNum)) && state.down && (prevX !== TEMF._mouseX || prevY !== TEMF._mouseY)) {
          state.dragging = true;
        }
      }
    }
  });

  canvas.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'mouse') {
      const btn = e.button.toString();
      const state = TEMF._mouseButtons.get(btn);
      if (state) {
        state.clicked = true;
        state.down = false;
        state.dragging = false;
      }
    }
  });

  canvas.addEventListener('pointercancel', (e) => {
    if (e.pointerType === 'mouse') {
      for (const [btn, state] of TEMF._mouseButtons) {
        state.down = false;
        state.dragging = false;
      }
    }
  });

  canvas.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse') {
      for (const [btn, state] of TEMF._mouseButtons) {
        state.down = false;
        state.dragging = false;
      }
    }
  });
}

function _getMouseState(btn) {
  if (!TEMF._mouseButtons.has(btn)) {
    TEMF._mouseButtons.set(btn, { down: false, clicked: false, dragging: false });
  }
  return TEMF._mouseButtons.get(btn);
}

function _initTouch() {
  if (typeof window === 'undefined') return;

  const canvas = TEMF._canvas || document.getElementById('game');
  if (!canvas) return;

  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') {
      TEMF._touchX = e.offsetX;
      TEMF._touchY = e.offsetY;
      TEMF._touchState.down = true;
      TEMF._touchState.tapped = false;
      TEMF._touchState.dragging = false;
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') {
      const prevX = TEMF._touchX;
      const prevY = TEMF._touchY;
      TEMF._touchX = e.offsetX;
      TEMF._touchY = e.offsetY;
      if (TEMF._touchState.down && (prevX !== TEMF._touchX || prevY !== TEMF._touchY)) {
        TEMF._touchState.dragging = true;
      }
    }
  });

  canvas.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'touch') {
      TEMF._touchState.tapped = true;
      TEMF._touchState.down = false;
      TEMF._touchState.dragging = false;
    }
  });

  canvas.addEventListener('pointercancel', (e) => {
    if (e.pointerType === 'touch') {
      TEMF._touchState.down = false;
      TEMF._touchState.dragging = false;
    }
  });

  canvas.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'touch') {
      TEMF._touchState.down = false;
      TEMF._touchState.dragging = false;
    }
  });
}

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
      TEMF._bgmBuffer = buffer;
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

function _getOrCreateImageBindGroup(texture) {
  if (!texture) return null;

  const texId = texture.id || String(texture);
  if (TEMF._imageBindGroups.has(texId)) {
    return TEMF._imageBindGroups.get(texId);
  }

  const bindGroup = TEMF._device.createBindGroup({
    layout: TEMF._imageBindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: TEMF._imageSampler,
      },
      {
        binding: 1,
        resource: texture.createView(),
      },
    ],
  });

  TEMF._imageBindGroups.set(texId, bindGroup);
  return bindGroup;
}

function _drawRects(rects, rp) {
  const device = TEMF._device;
  if (!device || rects.length === 0) return;

  const data = new Float32Array(rects.length * 3 * 4);
  for (let i = 0; i < rects.length; i++) {
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
    rects.length * 3 * 16
  );

  rp.setPipeline(TEMF._rectPipeline);
  rp.setBindGroup(0, TEMF._rectBindGroup);
  rp.setVertexBuffer(0, TEMF._rectVertexBuffer);
  rp.draw(6, rects.length, 0, 0);
}

function _queueImageDraw(imgDraw) {
  const texEntry = _getOrCreateTexture(imgDraw.path);
  if (!texEntry || texEntry.status !== 'loaded') {
    if (texEntry && texEntry.status === 'pending') {
      if (!TEMF._pendingImageDraws) TEMF._pendingImageDraws = [];
      TEMF._pendingImageDraws.push(imgDraw);
    }
    return;
  }

  const texId = texEntry.texture.id || String(texEntry.texture);
  if (!TEMF._imageTextureGroups) TEMF._imageTextureGroups = new Map();
  if (!TEMF._imageTextureOrder) TEMF._imageTextureOrder = [];

  if (!TEMF._imageTextureGroups.has(texId)) {
    TEMF._imageTextureGroups.set(texId, []);
    TEMF._imageTextureOrder.push(texId);
  }
  TEMF._imageTextureGroups.get(texId).push(imgDraw);
}

function _drawImages(rp) {
  const device = TEMF._device;
  if (!device || !TEMF._imageTextureGroups || TEMF._imageTextureGroups.size === 0) return;

  for (const texId of TEMF._imageTextureOrder) {
    const items = TEMF._imageTextureGroups.get(texId);
    if (!items || items.length === 0) continue;

    let texEntry = null;
    for (const [, entry] of TEMF._textureCache) {
      if (entry.status === 'loaded') {
        const tid = entry.texture.id || String(entry.texture);
        if (tid === texId) {
          texEntry = entry;
          break;
        }
      }
    }
    if (!texEntry || !texEntry.texture) continue;

    const bindGroup = _getOrCreateImageBindGroup(texEntry.texture);
    if (!bindGroup) continue;

    const uniformData = new Float32Array(items.length * 11);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      uniformData[i * 11 + 0] = item.x;
      uniformData[i * 11 + 1] = item.y;
      uniformData[i * 11 + 2] = item.width;
      uniformData[i * 11 + 3] = item.height;
      uniformData[i * 11 + 4] = item.u0 || 0;
      uniformData[i * 11 + 5] = item.v0 || 0;
      uniformData[i * 11 + 6] = item.u1 || 1;
      uniformData[i * 11 + 7] = item.v1 || 1;
      uniformData[i * 11 + 8] = item.rotation || 0;
      uniformData[i * 11 + 9] = item.scale || 1;
      uniformData[i * 11 + 10] = item.alpha || 1;
    }

    device.queue.writeBuffer(
      TEMF._imageUniformBuffer,
      0,
      uniformData.buffer,
      0,
      items.length * 44
    );

    rp.setPipeline(TEMF._imagePipeline);
    rp.setBindGroup(0, bindGroup);
    rp.setVertexBuffer(0, TEMF._imageVertexBuffer);
    rp.draw(6, items.length, 0, 0);
  }

  TEMF._imageTextureGroups.clear();
  TEMF._imageTextureOrder.length = 0;
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

  const currentRects = [];

  for (let i = 0; i < TEMF._drawList.length; i++) {
    const item = TEMF._drawList[i];
    if (item.type === 'rect') {
      currentRects.push(item);
    } else if (item.type === 'image') {
      if (currentRects.length > 0) {
        _drawRects(currentRects, renderPass);
        currentRects.length = 0;
      }
      if (!TEMF._imageTextureGroups) {
        TEMF._imageTextureGroups = new Map();
        TEMF._imageTextureOrder = [];
      }
      _queueImageDraw(item);
    }
  }

  if (currentRects.length > 0) {
    _drawRects(currentRects, renderPass);
  }

  _drawImages(renderPass);

  renderPass.end();
  device.queue.submit([commandEncoder.finish()]);

  TEMF._drawList.length = 0;
}

const mouse = {
  get x() { return TEMF._mouseX; },
  get y() { return TEMF._mouseY; },
  click(btn) {
    const state = _getMouseState(btn || '0');
    return state.clicked;
  },
  down(btn) {
    const state = _getMouseState(btn || '0');
    return state.down;
  },
  drag(btn) {
    const state = _getMouseState(btn || '0');
    const dragging = state.dragging;
    state.dragging = false;
    return dragging;
  },
  up(btn) {
    const state = _getMouseState(btn || '0');
    return !state.down && !state.clicked;
  },
};

const touch = {
  get x() { return TEMF._touchX; },
  get y() { return TEMF._touchY; },
  tap() {
    const tapped = TEMF._touchState.tapped;
    TEMF._touchState.tapped = false;
    return tapped;
  },
  down() {
    return TEMF._touchState.down;
  },
  drag() {
    const dragging = TEMF._touchState.dragging;
    TEMF._touchState.dragging = false;
    return dragging;
  },
  up() {
    return !TEMF._touchState.down && TEMF._touchState.tapped;
  },
};

function gameLoop() {
  const now = performance.now();
  const elapsed = Math.min((now - TEMF._lastTime) / 1000, 0.25);
  TEMF._lastTime = now;
  TEMF._accumulator += elapsed;

  while (TEMF._accumulator >= TEMF._step) {
    if (TEMF._game && typeof TEMF._game.update === 'function') {
      TEMF._game.update(TEMF._step);
    }
    TEMF._accumulator -= TEMF._step;
  }

  if (TEMF._game && typeof TEMF._game.draw === 'function') {
    _cleanupSfxNodes();
    _draw();
  }

  TEMF._animationFrameId = requestAnimationFrame(gameLoop);
}

function start(game, fps) {
  if (TEMF._started) {
    return;
  }

  TEMF._started = true;
  TEMF._game = game;
  TEMF._fps = fps || 60;
  TEMF._step = 1 / TEMF._fps;
  TEMF._accumulator = 0;
  TEMF._lastTime = 0;

  initWebGPU().then(() => {
    createResizeObserver();
    window.addEventListener('resize', resizeCanvas);
    _initKeyboard();
    _initMouse();
    _initTouch();
    TEMF._lastTime = performance.now();
    gameLoop();
  }).catch(err => {
    console.error('TEMF initialization failed:', err.message);
  });
}

TEMF.cleanupTextures = _cleanupTextures;
TEMF.cleanupAudio = _cleanupAudio;

export { start, TEMF, mouse, touch, audio };

if (typeof window !== 'undefined') {
  window.start = start;
  window.TEMF = TEMF;
  window.rect = _rect;
  window.image = _image;
  window.key = { down: _keyDown };
  window.mouse = mouse;
  window.touch = touch;
  window.audio = audio;
}
