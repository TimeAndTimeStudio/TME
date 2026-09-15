/**
 * TME Render — WebGPU rectangle renderer
 *
 * Renders rectangles using a unit-quad + uniform buffer approach.
 * All WebGPU objects remain internal.
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

  const renderer = {
    _device: device,
    _pipeline: rectanglePipeline,
    _uniformBuffer: uniformBuffer,
    _vertexBuffer: vertexBuffer,
    _bindGroup: bindGroup,
    _bindGroupLayout: bindGroupLayout,
    _instanceCount: 0,
    _rects: new Float32Array(RECT_MAX_INSTANCES * 8),
    _canvasFormat: canvasFormat,
    _width: width,
    _height: height,
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
}

function rect(renderer, x, y, width, height, r, g, b, a) {
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
  renderer._instanceCount++;
}

function draw(renderer, canvasTextureView) {
  const device = renderer._device;
  if (renderer._instanceCount === 0) return;

  device.queue.writeBuffer(
    renderer._uniformBuffer,
    0,
    renderer._rects.buffer,
    0,
    renderer._instanceCount * RECT_VERTEX_SIZE
  );

  const commandEncoder = device.createCommandEncoder();
  const renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [{
      view: canvasTextureView,
      clearValue: { r: 0, g: 0, b: 0, a: 1 },
      loadOp: 'clear',
      storeOp: 'store',
    }],
  });

  renderPass.setPipeline(renderer._pipeline);
  renderPass.setBindGroup(0, renderer._bindGroup);
  renderPass.setVertexBuffer(0, renderer._vertexBuffer);
  renderPass.draw(6, renderer._instanceCount, 0, 0);

  renderPass.end();
  device.queue.submit([commandEncoder.finish()]);
}

function destroy(renderer) {
  const device = renderer._device;
  if (device) {
    if (renderer._uniformBuffer) renderer._uniformBuffer.destroy();
    if (renderer._vertexBuffer) renderer._vertexBuffer.destroy();
  }
}

module.exports = {
  createRenderer,
  resize,
  clear,
  rect,
  draw,
  destroy,
};
