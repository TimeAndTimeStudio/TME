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
  _imageElements: new Map(),
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

function _getOrCreateTexture(path) {
  if (!TEMF._device) return null;

  if (TEMF._textureCache.has(path)) {
    const entry = TEMF._textureCache.get(path);
    if (entry.status === 'loaded') {
      return entry;
    }
    return null;
  }

  const entry = { status: 'pending' };
  TEMF._textureCache.set(path, entry);

  _loadImage(path)
    .then((img) => {
      const texture = _createTexture(TEMF._device, img);
      entry.status = 'loaded';
      entry.texture = texture;
      entry.width = img.width;
      entry.height = img.height;
    })
    .catch((err) => {
      entry.status = 'error';
      entry.error = err.message;
      console.error(err.message);
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

function _draw() {
  const device = TEMF._device;
  const context = TEMF._context;

  if (!device || !context) return;

  if (TEMF._drawList.length === 0) {
    // Clear frame even if no draws
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

  // Separate rects and images, preserving draw order info
  const rects = [];
  const images = [];

  for (let i = 0; i < TEMF._drawList.length; i++) {
    const item = TEMF._drawList[i];
    if (item.type === 'rect') {
      rects.push(item);
    } else if (item.type === 'image') {
      images.push(item);
    }
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

  // Draw rects first
  if (rects.length > 0) {
    const data = new Float32Array(rects.length * 3 * 4); // 3 vec4f per rect
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

    renderPass.setPipeline(TEMF._rectPipeline);
    renderPass.setBindGroup(0, TEMF._rectBindGroup);
    renderPass.setVertexBuffer(0, TEMF._rectVertexBuffer);
    renderPass.draw(6, rects.length, 0, 0);
  }

  // Draw images
  if (images.length > 0) {
    // Group images by texture for batching
    const byTexture = new Map();
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const texEntry = _getOrCreateTexture(img.path);
      if (!texEntry || texEntry.status !== 'loaded') continue;
      const texId = texEntry.texture.id || String(texEntry.texture);
      if (!byTexture.has(texId)) {
        byTexture.set(texId, { texture: texEntry.texture, items: [], uvs: [] });
      }
      const group = byTexture.get(texId);
      group.items.push(img);
      group.uvs.push({ u0: img.u0, v0: img.v0, u1: img.u1, v1: img.v1 });
    }

    // Draw each texture group
    for (const [, group] of byTexture) {
      const bindGroup = _getOrCreateImageBindGroup(group.texture);
      if (!bindGroup) continue;

      // Upload uniform data
      const uniformData = new Float32Array(group.items.length * 11);
      for (let i = 0; i < group.items.length; i++) {
        const item = group.items[i];
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
        group.items.length * 44
      );

      renderPass.setPipeline(TEMF._imagePipeline);
      renderPass.setBindGroup(0, bindGroup);
      renderPass.setVertexBuffer(0, TEMF._imageVertexBuffer);
      renderPass.draw(6, group.items.length, 0, 0);
    }
  }

  renderPass.end();
  device.queue.submit([commandEncoder.finish()]);

  // Clear draw list
  TEMF._drawList.length = 0;
}

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
    TEMF._lastTime = performance.now();
    gameLoop();
  }).catch(err => {
    console.error('TEMF initialization failed:', err.message);
  });
}

export { start, TEMF };

if (typeof window !== 'undefined') {
  window.start = start;
  window.TEMF = TEMF;
  window.rect = _rect;
  window.image = _image;
}
