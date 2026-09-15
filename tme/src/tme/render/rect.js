/**
 * TME Render — rect() primitive
 *
 * Parses color strings (#RRGGBB / #RRGGBBAA) and queues
 * rectangle draw calls for the WebGPU renderer.
 * Phase 6: Supports rotation, scale, alpha options.
 */

'use strict';

function parseColor(color) {
  if (!color || typeof color !== 'string') {
    return [1, 1, 1, 1];
  }

  const hex = color.trim();

  // #RRGGBB
  const match8 = hex.match(/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
  if (match8) {
    return [
      parseInt(match8[1], 16) / 255,
      parseInt(match8[2], 16) / 255,
      parseInt(match8[3], 16) / 255,
      1,
    ];
  }

  // #RRGGBBAA
  const match16 = hex.match(/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
  if (match16) {
    return [
      parseInt(match16[1], 16) / 255,
      parseInt(match16[2], 16) / 255,
      parseInt(match16[3], 16) / 255,
      parseInt(match16[4], 16) / 255,
    ];
  }

  return [1, 1, 1, 1];
}

function createRect(rects) {
  return function rect(x, y, width, height, color, opts) {
    const [r, g, b, a] = parseColor(color);
    const optRotation = (opts && typeof opts.rotation === 'number') ? opts.rotation : 0;
    const optScale = (opts && typeof opts.scale === 'number') ? opts.scale : 1;
    const optAlpha = (opts && opts.alpha !== undefined) ? opts.alpha : a;
    rects.push({ x, y, width, height, r, g, b, a: optAlpha, rotation: optRotation, scale: optScale });
  };
}

module.exports = { parseColor, createRect };
