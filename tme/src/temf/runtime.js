#!/usr/bin/env node

'use strict';

/**
 * TEMF — Time Engine Mini Fast Runtime
 * 
 * Minimal runtime that waits for explicit start() before
 * initializing WebGPU and starting the game loop.
 */

const TEMF = {
  _started: false,
  _canvas: null,
  _device: null,
  _context: null,
  _fps: 60,
  _accumulator: 0,
  _lastTime: 0,
  _step: 0,
  _animationFrameId: null,
  _game: null
};

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

  const displayFormat = navigator.gpu.getPreferredCanvasFormat();
  TEMF._context.configure({
    device: TEMF._device,
    format: displayFormat,
    alphaMode: 'premultiplied'
  });

  TEMF._resize();
}

function resizeCanvas() {
  if (TEMF._canvas && TEMF._context) {
    TEMF._resize();
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
    TEMF._gameLoop();
  }).catch(err => {
    console.error('TEMF initialization failed:', err.message);
  });
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
    TEMF._draw();
  }

  TEMF._animationFrameId = requestAnimationFrame(gameLoop);
}

function _draw() {
  if (!TEMF._device || !TEMF._context) {
    return;
  }

  const commandEncoder = TEMF._device.createCommandEncoder();
  const textureView = TEMF._context.getCurrentTexture().createView();

  const renderPassDescriptor = {
    colorAttachments: [{
      view: textureView,
      clearValue: { r: 0, g: 0, b: 0, a: 1 },
      loadOp: 'clear',
      storeOp: 'store'
    }]
  };

  const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor);
  renderPass.end();

  TEMF._device.queue.submit([commandEncoder.finish()]);
}

function _resize() {
  if (!TEMF._canvas || !TEMF._context) {
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  const width = TEMF._canvas.clientWidth * dpr;
  const height = TEMF._canvas.clientHeight * dpr;

  if (TEMF._canvas.width !== width || TEMF._canvas.height !== height) {
    TEMF._canvas.width = width;
    TEMF._canvas.height = height;
  }
}

module.exports = TEMF;
