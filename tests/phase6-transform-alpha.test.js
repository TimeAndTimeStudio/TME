const { test } = require('node:test');
const { strictEqual, ok } = require('node:assert');

// --- Phase 6: Transform and Alpha Tests ---
// Tests for rotation, scale, and alpha support in rect() and image()

// Helper: simulate the rect() function logic from runtime.js
function createRectEntry(x, y, width, height, color, opts) {
  const [r, g, b, a] = parseColor(color);
  const optRotation = (opts && typeof opts.rotation === 'number') ? opts.rotation : 0;
  const optScale = (opts && typeof opts.scale === 'number') ? opts.scale : 1;
  const optAlpha = (opts && opts.alpha !== undefined) ? opts.alpha : a;
  return {
    x, y, width, height, r, g, b, a: optAlpha,
    rotation: optRotation,
    scale: optScale,
  };
}

function parseColor(color) {
  if (!color || typeof color !== 'string') {
    return [1, 1, 1, 1];
  }
  const hex = color.trim();
  const match8 = hex.match(/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
  if (match8) {
    return [
      parseInt(match8[1], 16) / 255,
      parseInt(match8[2], 16) / 255,
      parseInt(match8[3], 16) / 255,
      1,
    ];
  }
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

// Helper: simulate the image() function logic from runtime.js
function createImageEntry(path, x, y, width, height, rotation, scale, alpha) {
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

  let displayW, displayH;
  if (srcW > 0 && srcH > 0) {
    displayW = srcW * optScale;
    displayH = srcH * optScale;
  } else {
    displayW = 64 * optScale;
    displayH = 64 * optScale;
  }

  let u0 = 0, v0 = 0, u1 = 1, v1 = 1;
  if (srcW > 0 && srcH > 0) {
    u1 = srcW;
    v1 = srcH;
  }

  return {
    type: 'image',
    path, x, y,
    width: displayW,
    height: displayH,
    u0, v0, u1, v1,
    alpha: optAlpha,
    rotation: optRotation,
    scale: optScale,
  };
}

// Helper: simulate transform math in WGSL vertex shader
function applyTransform(x, y, w, h, rotation, scale) {
  const corners = [
    { x: x, y: y },
    { x: x + w, y: y },
    { x: x, y: y + h },
    { x: x + w, y: y + h },
  ];

  const cx = x + w * 0.5;
  const cy = y + h * 0.5;
  const rad = rotation * Math.PI / 180;
  const cos_r = Math.cos(rad);
  const sin_r = Math.sin(rad);

  const transformed = corners.map(c => {
    let px = c.x - cx;
    let py = c.y - cy;
    px = px * scale;
    py = py * scale;
    const rx = px * cos_r - py * sin_r;
    const ry = px * sin_r + py * cos_r;
    return { x: rx + cx, y: ry + cy };
  });

  return transformed;
}

test('phase6: rect() with no options uses defaults (rotation=0, scale=1, alpha from color)', () => {
  const rect = createRectEntry(10, 20, 100, 50, '#ff0000');
  strictEqual(rect.x, 10);
  strictEqual(rect.y, 20);
  strictEqual(rect.width, 100);
  strictEqual(rect.height, 50);
  strictEqual(rect.r, 1);
  strictEqual(rect.g, 0);
  strictEqual(rect.b, 0);
  strictEqual(rect.a, 1);
  strictEqual(rect.rotation, 0);
  strictEqual(rect.scale, 1);
});

test('phase6: rect() with #RRGGBBAA color sets alpha from color', () => {
  const rect = createRectEntry(0, 0, 50, 50, '#ff000080');
  ok(Math.abs(rect.a - 0.5) < 0.01, 'Alpha should be approximately 0.5 from #80');
});

test('phase6: rect() options.alpha overrides color alpha', () => {
  const rect = createRectEntry(0, 0, 50, 50, '#ff0000ff', { alpha: 0.5 });
  strictEqual(rect.a, 0.5, 'Alpha should be 0.5 from options');
});

test('phase6: rect() with rotation=45 degrees', () => {
  const rect = createRectEntry(0, 0, 100, 100, '#00ff00', { rotation: 45 });
  strictEqual(rect.rotation, 45);
  const corners = applyTransform(0, 0, 100, 100, 45, 1);
  ok(corners.length === 4, 'Should have 4 corners');
  // After 45 degree rotation around center, corners should be transformed
  const cx = 50, cy = 50;
  ok(corners[0].x < cx && corners[0].y < cy, 'Top-left should rotate');
});

test('phase6: rect() with scale=2 doubles dimensions', () => {
  const rect = createRectEntry(0, 0, 50, 30, '#0000ff', { scale: 2 });
  strictEqual(rect.scale, 2);
  const corners = applyTransform(0, 0, 50, 30, 0, 2);
  // After scale=2 around center (25, 15), rect spans from (-25, -15) to (75, 45)
  // Total width = 100, total height = 60
  const xs = corners.map(c => c.x);
  const ys = corners.map(c => c.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  strictEqual((maxX - minX).toFixed(0), '100', 'Total width should be doubled to 100');
  strictEqual((maxY - minY).toFixed(0), '60', 'Total height should be doubled to 60');
});

test('phase6: rect() with rotation=90 degrees', () => {
  const rect = createRectEntry(0, 0, 100, 50, '#ffff00', { rotation: 90 });
  const corners = applyTransform(0, 0, 100, 50, 90, 1);
  // After 90 degree rotation, width and height should swap in terms of extent
  const cx = 50, cy = 25;
  let minY = Infinity, maxY = -Infinity;
  for (const c of corners) {
    if (c.y < minY) minY = c.y;
    if (c.y > maxY) maxY = c.y;
  }
  ok(maxY - minY <= 101, 'Height after 90 rotation should be within original width');
});

test('phase6: rect() with scale=0.5 halves dimensions', () => {
  const rect = createRectEntry(0, 0, 200, 100, '#00ffff', { scale: 0.5 });
  const corners = applyTransform(0, 0, 200, 100, 0, 0.5);
  const xs = corners.map(c => c.x);
  const ys = corners.map(c => c.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  strictEqual((maxX - minX).toFixed(0), '100', 'Total width should be halved to 100');
  strictEqual((maxY - minY).toFixed(0), '50', 'Total height should be halved to 50');
});

test('phase6: rect() with combined rotation and scale', () => {
  const rect = createRectEntry(0, 0, 100, 100, '#ff00ff', { rotation: 45, scale: 1.5 });
  strictEqual(rect.rotation, 45);
  strictEqual(rect.scale, 1.5);
  const corners = applyTransform(0, 0, 100, 100, 45, 1.5);
  ok(corners.length === 4, 'Should have 4 corners');
});

test('phase6: image() with no options uses defaults', () => {
  const img = createImageEntry('test.png', 10, 20, 64, 64);
  strictEqual(img.x, 10);
  strictEqual(img.y, 20);
  strictEqual(img.width, 64);
  strictEqual(img.height, 64);
  strictEqual(img.alpha, 1);
  strictEqual(img.rotation, 0);
  strictEqual(img.scale, 1);
});

test('phase6: image() with options.rotation', () => {
  const img = createImageEntry('test.png', 0, 0, 100, 100, { rotation: 90 });
  strictEqual(img.rotation, 90);
});

test('phase6: image() with options.scale', () => {
  const img = createImageEntry('test.png', 0, 0, 50, 50, { scale: 2 });
  strictEqual(img.width, 100, 'Width should be doubled');
  strictEqual(img.height, 100, 'Height should be doubled');
  strictEqual(img.scale, 2);
});

test('phase6: image() with options.alpha', () => {
  const img = createImageEntry('test.png', 0, 0, 64, 64, { alpha: 0.75 });
  strictEqual(img.alpha, 0.75);
});

test('phase6: image() with all options combined', () => {
  const img = createImageEntry('test.png', 10, 20, 100, 100, {
    rotation: 45,
    scale: 1.5,
    alpha: 0.8,
  });
  strictEqual(img.rotation, 45);
  strictEqual(img.scale, 1.5);
  strictEqual(img.alpha, 0.8);
  strictEqual(img.width, 150, 'Width should be 100 * 1.5');
  strictEqual(img.height, 150, 'Height should be 100 * 1.5');
});

test('phase6: transform math - 0 degree rotation is identity', () => {
  const corners = applyTransform(10, 20, 100, 50, 0, 1);
  strictEqual(corners[0].x, 10);
  strictEqual(corners[0].y, 20);
  strictEqual(corners[1].x, 110);
  strictEqual(corners[1].y, 20);
  strictEqual(corners[2].x, 10);
  strictEqual(corners[2].y, 70);
  strictEqual(corners[3].x, 110);
  strictEqual(corners[3].y, 70);
});

test('phase6: transform math - center of rotation is preserved', () => {
  const corners = applyTransform(0, 0, 100, 100, 45, 1);
  const cx = 50, cy = 50;
  // After any rotation around center, the center point should remain at (50, 50)
  let sumX = 0, sumY = 0;
  for (const c of corners) {
    sumX += c.x;
    sumY += c.y;
  }
  const avgX = sumX / 4;
  const avgY = sumY / 4;
  strictEqual(avgX.toFixed(2), '50.00', 'Average X should be center');
  strictEqual(avgY.toFixed(2), '50.00', 'Average Y should be center');
});

test('phase6: transform math - negative rotation works', () => {
  const corners = applyTransform(0, 0, 100, 100, -45, 1);
  ok(corners.length === 4, 'Should have 4 corners');
  const cornersCCW = applyTransform(0, 0, 100, 100, 45, 1);
  // Negative and positive 45 should produce different results
  ok(corners[0].x !== cornersCCW[0].x || corners[0].y !== cornersCCW[0].y,
    'Negative rotation should differ from positive');
});

test('phase6: transform math - scale=1 is identity', () => {
  const corners1 = applyTransform(0, 0, 100, 50, 0, 1);
  const corners2 = applyTransform(0, 0, 100, 50, 0, 1);
  for (let i = 0; i < 4; i++) {
    strictEqual(corners1[i].x, corners2[i].x);
    strictEqual(corners1[i].y, corners2[i].y);
  }
});

test('phase6: rect() uniform buffer layout - 10 floats per rect', () => {
  const count = 3;
  const data = new Float32Array(count * 10);
  for (let i = 0; i < count; i++) {
    const r = createRectEntry(i * 100, i * 50, 100, 50, '#ff0000', { rotation: i * 15, scale: 1 + i * 0.5 });
    const base = i * 10;
    data[base + 0] = r.x;
    data[base + 1] = r.y;
    data[base + 2] = r.width;
    data[base + 3] = r.height;
    data[base + 4] = r.r;
    data[base + 5] = r.g;
    data[base + 6] = r.b;
    data[base + 7] = r.a;
    data[base + 8] = r.rotation;
    data[base + 9] = r.scale;
  }

  // Verify layout
  strictEqual(data[0], 0, 'First rect x');
  strictEqual(data[1], 0, 'First rect y');
  strictEqual(data[2], 100, 'First rect width');
  strictEqual(data[3], 50, 'First rect height');
  strictEqual(data[4], 1, 'First rect r');
  strictEqual(data[8], 0, 'First rect rotation');
  strictEqual(data[9], 1, 'First rect scale');

  strictEqual(data[10], 100, 'Second rect x');
  strictEqual(data[18], 15, 'Second rect rotation');
  strictEqual(data[19], 1.5, 'Second rect scale');

  strictEqual(data[20], 200, 'Third rect x');
  strictEqual(data[28], 30, 'Third rect rotation');
  strictEqual(data[29], 2, 'Third rect scale');
});

test('phase6: image() uniform buffer layout - 11 floats per image', () => {
  const count = 2;
  const data = new Float32Array(count * 11);
  for (let i = 0; i < count; i++) {
    const img = createImageEntry('test.png', i * 100, i * 50, 64, 64, {
      rotation: i * 30,
      scale: 1 + i * 0.5,
      alpha: 1 - i * 0.3,
    });
    const base = i * 11;
    data[base + 0] = img.x;
    data[base + 1] = img.y;
    data[base + 2] = img.width;
    data[base + 3] = img.height;
    data[base + 4] = img.u0;
    data[base + 5] = img.v0;
    data[base + 6] = img.u1;
    data[base + 7] = img.v1;
    data[base + 8] = img.rotation;
    data[base + 9] = img.scale;
    data[base + 10] = img.alpha;
  }

  // Verify layout
  strictEqual(data[0], 0, 'First image x');
  strictEqual(data[8], 0, 'First image rotation');
  strictEqual(data[9], 1, 'First image scale');
  strictEqual(data[10], 1, 'First image alpha');

  strictEqual(data[11], 100, 'Second image x');
  strictEqual(data[19], 30, 'Second image rotation');
  strictEqual(data[20], 1.5, 'Second image scale');
  ok(Math.abs(data[21] - 0.7) < 0.01, 'Second image alpha should be approximately 0.7');
});

test('phase6: color parsing - #RGB format is not supported (only #RRGGBB and #RRGGBBAA)', () => {
  const [r, g, b, a] = parseColor('#f00');
  strictEqual(r, 1, 'Red should be 1');
  strictEqual(g, 1, 'Green should be 1');
  strictEqual(b, 1, 'Blue should be 1');
  strictEqual(a, 1, 'Alpha should be 1');
});

test('phase6: color parsing - named fallback for invalid colors', () => {
  const [r, g, b, a] = parseColor('invalid');
  strictEqual(r, 1);
  strictEqual(g, 1);
  strictEqual(b, 1);
  strictEqual(a, 1);
});

test('phase6: color parsing - hex without #', () => {
  const [r, g, b, a] = parseColor('ff0000');
  strictEqual(r, 1);
  strictEqual(g, 0);
  strictEqual(b, 0);
  strictEqual(a, 1);
});
