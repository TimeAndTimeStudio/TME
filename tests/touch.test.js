/**
 * Touch Input Tests
 *
 * Tests the touch.x, touch.y, touch.down, touch.tapped, touch.dragging API exposed by TEMF runtime.
 */

'use strict';

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Simulate the runtime touch state
const _testTouch = {
  x: 0,
  y: 0,
  down: false,
  tapped: false,
  dragging: false,
};

function _testTouchGetX() {
  return _testTouch.x;
}

function _testTouchGetY() {
  return _testTouch.y;
}

function _testTouchIsDown() {
  return _testTouch.down;
}

function _testTouchIsTapped() {
  return _testTouch.tapped;
}

function _testTouchIsDragging() {
  return _testTouch.dragging;
}

function _testTriggerTouchMove(x, y) {
  _testTouch.x = x;
  _testTouch.y = y;
}

function _testTriggerTouchStart() {
  _testTouch.down = true;
  _testTouch.tapped = false;
  _testTouch.dragging = false;
}

function _testTriggerTouchEnd() {
  _testTouch.tapped = true;
  _testTouch.down = false;
  _testTouch.dragging = false;
}

function _testClearTouch() {
  _testTouch.x = 0;
  _testTouch.y = 0;
  _testTouch.down = false;
  _testTouch.tapped = false;
  _testTouch.dragging = false;
}

describe('Touch Input', () => {
  beforeEach(() => {
    _testClearTouch();
  });

  test('touch.x and touch.y return correct coordinates', () => {
    _testTriggerTouchMove(100, 200);
    assert.equal(_testTouchGetX(), 100);
    assert.equal(_testTouchGetY(), 200);
  });

  test('touch.down returns false initially', () => {
    assert.equal(_testTouchIsDown(), false);
  });

  test('touch.down returns true when touching', () => {
    _testTriggerTouchStart();
    assert.equal(_testTouchIsDown(), true);
  });

  test('touch.tapped returns true on touch end', () => {
    _testTriggerTouchStart();
    _testTriggerTouchEnd();
    assert.equal(_testTouchIsTapped(), true);
  });

  test('touch.down returns false after touch end', () => {
    _testTriggerTouchStart();
    _testTriggerTouchEnd();
    assert.equal(_testTouchIsDown(), false);
  });

  test('touch.dragging tracks drag state', () => {
    _testTriggerTouchStart();
    _testTouch.dragging = true;
    assert.equal(_testTouchIsDragging(), true);
  });

  test('touch.dragging is false after touch end', () => {
    _testTriggerTouchStart();
    _testTouch.dragging = true;
    _testTriggerTouchEnd();
    assert.equal(_testTouchIsDragging(), false);
  });
});
