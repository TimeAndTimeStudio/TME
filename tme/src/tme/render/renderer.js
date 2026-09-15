/**
 * TME Render — WebGPU rectangle renderer
 *
 * Renders rectangles using a unit-quad + uniform buffer approach.
 * All WebGPU objects remain internal.
 * Phase 6: Supports rotation, scale transforms.
 */

'use strict';

const RECT_VERTEX_SIZE = 5 * 4; // x, y, width, height, [r, g, b, a] packed
const RECT_MAX_INSTANCES = 1024;
const RECT_BUFFER_SIZE = RECT_VERTEX_SIZE * RECT_MAX_INSTANCES;

function createRenderer(device, canvasFormat, width, height) {
  if (!device) throw new Error('Renderer: device is required');

  const rectVertexShaderCode = `
    var<uniform> proj: mat4x4f;
    struct RectVertex {
      @builtin(vertex_index) vertexIndex: u32,
    };
    struct RectUniforms {
      x: f32,
      y: f32,
      w: f32,
      h: f32,
      r: f32,
      g: f32,
      b: f32,
      a: f32,
      rotation: f32,
      scale: f32,
    };
    var<uniform> rectData: array<RectUniforms, ${RECT_MAX_INSTANCES}>;
    struct VSOut {
      @builtin(position) position: vec4f,
      @location(0) color: vec4f,
    };
    @vertex
    fn vs(mainInput: RectVertex) -> VSOut {
      let idx = mainInput.vertexIndex % ${RECT_MAX_INSTANCES};
      let rect = rectData[idx];
      let x0 = rect.x;
      let y0 = rect.y;
      let x1 = rect.x + rect.w;
      let y1 = rect.y + rect.h;
      var pos: vec2f;
      if (mainInput.vertexIndex % 4u == 0u) {
        pos = vec2f(x0, y0);
      } else if (mainInput.vertexIndex % 4u == 1u) {
        pos = vec2f(x1, y0);
      } else if (mainInput.vertexIndex % 4u == 2u) {
        pos = vec2f(x0, y1);
      } else {
        pos = vec2f(x1, y1);
      }
      let cx = rect.x + rect.w * 0.5;
      let cy = rect.y + rect.h * 0.5;
      pos = pos - vec2f(cx, cy);
      pos = pos * rect.scale;
      let rad = rect.rotation * 3.14159265 / 180.0;
      let cos_r = cos(rad);
      let sin_r = sin(rad);
      pos = vec2f(pos.x * cos_r - pos.y * sin_r, pos.x * sin_r + pos.y * cos_r);
      pos = pos + vec2f(cx, cy);
      return VSOut(
        vec4f(pos, 0.0, 1.0),
        vec4f(rect.r, rect.g, rect.b, rect.a)
      );
    }
    @fragment
    fn fs(input: VSOut) -> @location(0) vec4f {
      return input.color;
    }
  `;

  const rectanglePipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: device.createShaderModule({
        code: rectVertexShaderCode
      }),
      entryPoint: 'vs',
    },
    fragment: {
      module: device.createShaderModule({
        code: rectVertexShaderCode
      }),
      entryPoint: 'fs',
      targets: [{
        format: canvasFormat,
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
        }
      }],
    },
    primitive: {
      topology: 'triangle-strip',
    },
  });

  const uniformBuffer = device.createBuffer({
    size: RECT_BUFFER_SIZE,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const vertexBuffer = device.createBuffer({
    size: 6 * 4 * 4, // 6 vertices (2 triangles) * 4 floats * 4 bytes
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  const vertexData = new Float32Array([
    0, 0,  1, 0,  0, 1,
    0, 1,  1, 0,  1, 1,
  ]);
  device.queue.writeBuffer(vertexBuffer, 0, vertexData);

  const bindGroupLayout = rectanglePipeline.getBindGroupLayout(0);
  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: { buffer: uniformBuffer },
      },
    ],
  });

  // Image pipeline
  const imageVertexShaderCode = `
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
      module: device.createShaderModule({
        code: imageVertexShaderCode
      }),
      entryPoint: 'vs',
    },
    fragment: {
      module: device.createShaderModule({
        code: imageVertexShaderCode
      }),
      entryPoint: 'fs',
      targets: [{
        format: canvasFormat,
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
        }
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

  const imageVertexData = new Float32Array([
    0, 0,  1, 0,  2, 1,
    2, 1,  1, 0,  3, 1,
  ]);
  const imageVertexBuffer = device.createBuffer({
    size: 6 * 4 * 4,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(imageVertexBuffer, 0, imageVertexData);

  const imageSampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
  });

  const imageBindGroupLayout = imagePipeline.getBindGroupLayout(0);
  const imageBindGroup = device.createBindGroup({
    layout: imageBindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: imageSampler,
      },
      {
        binding: 1,
        resource: null,
      },
    ],
  });

  const renderer = {
    _device: device,
    _pipeline: rectanglePipeline,
    _uniformBuffer: uniformBuffer,
    _vertexBuffer: vertexBuffer,
    _bindGroup: bindGroup,
    _bindGroupLayout: bindGroupLayout,
    _instanceCount: 0,
    _rects: new Float32Array(RECT_MAX_INSTANCES * 8),
    _rotations: new Float32Array(RECT_MAX_INSTANCES),
    _scales: new Float32Array(RECT_MAX_INSTANCES),
    _canvasFormat: canvasFormat,
    _width: width,
    _height: height,
    _imagePipeline: imagePipeline,
    _imageUniformBuffer: imageUniformBuffer,
    _imageVertexBuffer: imageVertexBuffer,
    _imageBindGroup: imageBindGroup,
    _imageBindGroupLayout: imageBindGroupLayout,
    _imageCount: 0,
    _images: [],
  };

  return renderer;
}

function resize(renderer, width, height) {
  renderer._width = width;
  renderer._height = height;
}

function clear(renderer) {
  renderer._instanceCount = 0;
  renderer._rects.fill(0);
  renderer._rotations.fill(0);
  renderer._scales.fill(1);
  renderer._imageCount = 0;
  renderer._images.length = 0;
}

function rect(renderer, x, y, width, height, r, g, b, a, rotation, scale) {
  const idx = renderer._instanceCount;
  if (idx >= RECT_MAX_INSTANCES) {
    return;
  }
  const base = idx * 8;
  renderer._rects[base + 0] = x;
  renderer._rects[base + 1] = y;
  renderer._rects[base + 2] = width;
  renderer._rects[base + 3] = height;
  renderer._rects[base + 4] = r;
  renderer._rects[base + 5] = g;
  renderer._rects[base + 6] = b;
  renderer._rects[base + 7] = a;
  renderer._rotations = renderer._rotations || new Float32Array(RECT_MAX_INSTANCES);
  renderer._scales = renderer._scales || new Float32Array(RECT_MAX_INSTANCES);
  renderer._rotations[idx] = rotation || 0;
  renderer._scales[idx] = scale || 1;
  renderer._instanceCount++;
}

function image(renderer, path, x, y, width, height, u0, v0, u1, v1, rotation, scale, alpha) {
  const idx = renderer._imageCount;
  if (idx >= 1024) {
    return;
  }
  renderer._images[idx] = {
    path: path,
    x: x,
    y: y,
    width: width,
    height: height,
    u0: u0,
    v0: v0,
    u1: u1,
    v1: v1,
    rotation: rotation || 0,
    scale: scale || 1,
    alpha: alpha !== undefined ? alpha : 1,
  };
  renderer._imageCount++;
}

function draw(renderer, canvasTextureView, textureMap) {
  const device = renderer._device;
  const count = renderer._instanceCount;
  const imageCount = renderer._imageCount;
  if (count === 0 && imageCount === 0) return;

  // Upload rect data
  if (count > 0) {
    const combined = new Float32Array(count * 10);
    const rects = renderer._rects;
    const rotations = renderer._rotations;
    const scales = renderer._scales;
    for (let i = 0; i < count; i++) {
      const base = i * 10;
      const rbase = i * 8;
      combined[base + 0] = rects[rbase + 0];
      combined[base + 1] = rects[rbase + 1];
      combined[base + 2] = rects[rbase + 2];
      combined[base + 3] = rects[rbase + 3];
      combined[base + 4] = rects[rbase + 4];
      combined[base + 5] = rects[rbase + 5];
      combined[base + 6] = rects[rbase + 6];
      combined[base + 7] = rects[rbase + 7];
      combined[base + 8] = rotations[i];
      combined[base + 9] = scales[i];
    }

    device.queue.writeBuffer(
      renderer._uniformBuffer,
      0,
      combined.buffer,
      0,
      count * 10 * 4
    );
  }

  const commandEncoder = device.createCommandEncoder();
  const renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [{
      view: canvasTextureView,
      clearValue: { r: 0, g: 0, b: 0, a: 1 },
      loadOp: 'clear',
      storeOp: 'store',
    }],
  });

  // Draw rects
  if (count > 0) {
    renderPass.setPipeline(renderer._pipeline);
    renderPass.setBindGroup(0, renderer._bindGroup);
    renderPass.setVertexBuffer(0, renderer._vertexBuffer);
    renderPass.draw(6, count, 0, 0);
  }

  // Draw images
  if (imageCount > 0) {
    const imageUniforms = new Float32Array(imageCount * 11);
    for (let i = 0; i < imageCount; i++) {
      const img = renderer._images[i];
      const base = i * 11;
      imageUniforms[base + 0] = img.x;
      imageUniforms[base + 1] = img.y;
      imageUniforms[base + 2] = img.width;
      imageUniforms[base + 3] = img.height;
      imageUniforms[base + 4] = img.u0;
      imageUniforms[base + 5] = img.v0;
      imageUniforms[base + 6] = img.u1;
      imageUniforms[base + 7] = img.v1;
      imageUniforms[base + 8] = img.rotation;
      imageUniforms[base + 9] = img.scale;
      imageUniforms[base + 10] = img.alpha;
    }

    device.queue.writeBuffer(
      renderer._imageUniformBuffer,
      0,
      imageUniforms.buffer,
      0,
      imageCount * 11 * 4
    );

    // Group images by texture and draw
    const textureGroups = new Map();
    for (let i = 0; i < imageCount; i++) {
      const img = renderer._images[i];
      const tex = textureMap.get(img.path);
      if (!tex) continue;
      if (!textureGroups.has(tex)) {
        textureGroups.set(tex, []);
      }
      textureGroups.get(tex).push(img);
    }

    for (const [texture, group] of textureGroups) {
      const bindGroup = device.createBindGroup({
        layout: renderer._imageBindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: renderer._imageBindGroup.entries[0].resource,
          },
          {
            binding: 1,
            resource: texture.createView(),
          },
        ],
      });

      renderPass.setPipeline(renderer._imagePipeline);
      renderPass.setBindGroup(0, bindGroup);
      renderPass.setVertexBuffer(0, renderer._imageVertexBuffer);
      renderPass.draw(6, group.length, 0, 0);
    }
  }

  renderPass.end();
  device.queue.submit([commandEncoder.finish()]);
}

function destroy(renderer) {
  const device = renderer._device;
  if (device) {
    if (renderer._uniformBuffer) renderer._uniformBuffer.destroy();
    if (renderer._vertexBuffer) renderer._vertexBuffer.destroy();
    if (renderer._imageUniformBuffer) renderer._imageUniformBuffer.destroy();
    if (renderer._imageVertexBuffer) renderer._imageVertexBuffer.destroy();
  }
}

module.exports = {
  createRenderer,
  resize,
  clear,
  rect,
  image,
  draw,
  destroy,
};
