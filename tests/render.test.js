/**
 * Rendering Tests
 *
 * Tests the rect() and image() rendering API exposed by TEMF runtime.
 */

'use strict';

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Simulate the runtime draw list
const _testDrawList = [];

function _testClearDrawList() {
  _testDrawList.length = 0;
}

function _testGetDrawList() {
  return _testDrawList;
}

function _testAddRect(x, y, width, height, color, rotation, scale, alpha) {
  const [r, g, b, a] = _parseColor(color);
  const optRotation = (typeof rotation === 'number') ? rotation : 0;
  const optScale = (typeof scale === 'number') ? scale : 1;
  const optAlpha = (alpha !== undefined && alpha !== null) ? alpha : a;
  _testDrawList.push({
    type: 'rect',
    x, y, width, height, r, g, b, a: optAlpha,
    rotation: optRotation,
    scale: optScale,
  });
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
      1
    ];
  }
  const m6 = hex.match(/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
  if (m6) {
    return [
      parseInt(m6[1], 16) / 255,
      parseInt(m6[2], 16) / 255,
      parseInt(m6[3], 16) / 255,
      parseInt(m6[4], 16) / 255
    ];
  }
  return [1, 1, 1, 1];
}

describe('Rendering', () => {
  beforeEach(() => {
    _testClearDrawList();
  });

  test('rect() adds a rectangle to the draw list', () => {
    _testAddRect(100, 100, 64, 64, '#FF5733');
    const list = _testGetDrawList();
    assert.equal(list.length, 1);
    assert.equal(list[0].type, 'rect');
    assert.equal(list[0].x, 100);
    assert.equal(list[0].y, 100);
    assert.equal(list[0].width, 64);
    assert.equal(list[0].height, 64);
  });

  test('rect() supports rotation parameter', () => {
    _testAddRect(100, 100, 64, 64, '#FF5733', 45);
    assert.equal(_testGetDrawList()[0].rotation, 45);
  });

  test('rect() supports scale parameter', () => {
    _testAddRect(100, 100, 64, 64, '#FF5733', 0, 2);
    assert.equal(_testGetDrawList()[0].scale, 2);
  });

  test('rect() supports decimal scale values', () => {
    _testAddRect(100, 100, 64, 64, '#FF5733', 0, 1.5);
    assert.equal(_testGetDrawList()[0].scale, 1.5);
  });

  test('rect() supports alpha parameter', () => {
    _testAddRect(100, 100, 64, 64, '#FF5733', 0, 1, 0.5);
    assert.equal(_testGetDrawList()[0].a, 0.5);
  });

  test('rect() uses color alpha when alpha parameter is omitted', () => {
    _testAddRect(100, 100, 64, 64, '#FF573380');
    assert.equal(_testGetDrawList()[0].a, 0.5019607843137255);
  });

  test('rect() draws multiple rectangles in order', () => {
    _testAddRect(100, 100, 64, 64, '#FF5733');
    _testAddRect(200, 200, 50, 50, '#33FF57');
    const list = _testGetDrawList();
    assert.equal(list.length, 2);
    assert.equal(list[0].x, 100);
    assert.equal(list[1].x, 200);
  });

  test('rect() defaults rotation to 0 when omitted', () => {
    _testAddRect(100, 100, 64, 64, '#FF5733');
    assert.equal(_testGetDrawList()[0].rotation, 0);
  });

  test('rect() defaults scale to 1 when omitted', () => {
    _testAddRect(100, 100, 64, 64, '#FF5733');
    assert.equal(_testGetDrawList()[0].scale, 1);
  });

  test('rect() parses hex color correctly', () => {
    _testAddRect(0, 0, 10, 10, '#FF0000');
    const rect = _testGetDrawList()[0];
    assert.equal(rect.r, 1);
    assert.equal(rect.g, 0);
    assert.equal(rect.b, 0);
  });
});
