/**
 * TME Render — image() primitive
 *
 * Loads images from URLs, creates WebGPU textures, and caches them.
 * Supports: image(path, x, y), image(path, x, y, w, h),
 *           image(path, x, y, w, h, options...)
 *
 * Options: rotation (degrees), scale, alpha
 * Phase 6: Fixed rotation formula, proper options handling.
 */

'use strict';

const IMAGE_VERT_SIZE = 8; // x, y, w, h, u0, v0, u1, v1
const IMAGE_MAX = 1024;

const _textureCache = new Map();
const _images = new Map();
const _drawList = [];

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
  if (_images.has(path)) {
    return _images.get(path);
  }

  const base = _getBasePath();
  const url = base + path;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;

  await new Promise((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image: ' + path));
  });

  _images.set(path, img);
  return img;
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

function _getOrCreateTexture(device, path) {
  if (_textureCache.has(path)) {
    const entry = _textureCache.get(path);
    if (entry.status === 'loaded') {
      return entry;
    }
    return null;
  }

  const entry = { status: 'pending' };
  _textureCache.set(path, entry);

  _loadImage(path)
    .then((img) => {
      const texture = _createTexture(device, img);
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

function createImage(drawList) {
  return function image(
    path,
    x,
    y,
    width,
    height,
    rotation,
    scale,
    alpha
  ) {
    let srcX, srcY, srcW, srcH;
    let opts = {};

    if (typeof width === 'number' && typeof height === 'number') {
      srcX = 0;
      srcY = 0;
      srcW = width;
      srcH = height;
      opts = typeof rotation === 'object' ? rotation : {};
    } else {
      opts = typeof width === 'object' ? width : {};
      srcX = 0;
      srcY = 0;
      srcW = 0;
      srcH = 0;
    }

    const optRotation = opts.rotation || 0;
    const optScale = opts.scale || 1;
    const optAlpha = opts.alpha !== undefined ? opts.alpha : 1;

    const img = _images.get(path);
    let w = 0, h = 0;
    let texW = img ? img.width : 0;
    let texH = img ? img.height : 0;

    if (srcW > 0 && srcH > 0) {
      w = srcW * optScale;
      h = srcH * optScale;
    } else if (img) {
      w = texW * optScale;
      h = texH * optScale;
    } else {
      w = 64 * optScale;
      h = 64 * optScale;
    }

    const u0 = srcX / (texW || 1);
    const v0 = srcY / (texH || 1);
    const u1 = (srcX + (srcW || texW)) / (texW || 1);
    const v1 = (srcY + (srcH || texH)) / (texH || 1);

    if (drawList.length >= IMAGE_MAX) return;

    drawList.push({
      type: 'image',
      path: path,
      x: x,
      y: y,
      width: w,
      height: h,
      u0: u0,
      v0: v0,
      u1: u1,
      v1: v1,
      alpha: optAlpha,
      rotation: optRotation,
      scale: optScale,
    });
  };
}

function getTextureForPath(path) {
  return _textureCache.get(path);
}

function clearDraws() {
  _drawList.length = 0;
}

function getTextureCache() {
  return _textureCache;
}

function clearCache() {
  _textureCache.clear();
  _images.clear();
}

module.exports = {
  createImage,
  getTextureForPath,
  clearDraws,
  getTextureCache,
  clearCache,
};
