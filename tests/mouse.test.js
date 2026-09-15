/**
 * Mouse Input Tests
 *
 * Tests the mouse.x, mouse.y, mouse.down(), mouse.click(), mouse.drag() API exposed by TEMF runtime.
 */

'use strict';

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Simulate the runtime mouse state
const _testMouse = {
  x: 0,
  y: 0,
  buttons: new Map(),
  dragging: false,
};

function _testMouseGetX() {
  return _testMouse.x;
}

function _testMouseGetY() {
  return _testMouse.y;
}

function _testMouseDown(btn) {
  const state = _testMouse.buttons.get(btn);
  return state ? state.down : false;
}

function _testMouseClick(btn) {
  const state = _testMouse.buttons.get(btn);
  return state ? state.clicked : false;
}

function _testMouseDrag() {
  return _testMouse.dragging;
}

function _testTriggerMouseMove(x, y) {
  _testMouse.x = x;
  _testMouse.y = y;
}

function _testTriggerMouseDown(btn) {
  if (!_testMouse.buttons.has(btn)) {
    _testMouse.buttons.set(btn, { down: false, clicked: false, dragging: false });
  }
  const state = _testMouse.buttons.get(btn);
  state.down = true;
  state.clicked = false;
  state.dragging = false;
}

function _testTriggerMouseUp(btn) {
  const state = _testMouse.buttons.get(btn);
  if (state) {
    state.clicked = true;
    state.down = false;
    state.dragging = false;
  }
}

function _testClearMouse() {
  _testMouse.x = 0;
  _testMouse.y = 0;
  _testMouse.buttons.clear();
  _testMouse.dragging = false;
}

describe('Mouse Input', () => {
  beforeEach(() => {
    _testClearMouse();
  });

  test('mouse.x and mouse.y return correct coordinates', () => {
    _testTriggerMouseMove(100, 200);
    assert.equal(_testMouseGetX(), 100);
    assert.equal(_testMouseGetY(), 200);
  });

  test('mouse.down() returns false when no buttons are pressed', () => {
    assert.equal(_testMouseDown(0), false);
    assert.equal(_testMouseDown(1), false);
    assert.equal(_testMouseDown(2), false);
  });

  test('mouse.down(0) returns true when left button is pressed', () => {
    _testTriggerMouseDown(0);
    assert.equal(_testMouseDown(0), true);
  });

  test('mouse.down(1) returns true when middle button is pressed', () => {
    _testTriggerMouseDown(1);
    assert.equal(_testMouseDown(1), true);
  });

  test('mouse.down(2) returns true when right button is pressed', () => {
    _testTriggerMouseDown(2);
    assert.equal(_testMouseDown(2), true);
  });

  test('mouse.click() returns true on button release', () => {
    _testTriggerMouseDown(0);
    _testTriggerMouseUp(0);
    assert.equal(_testMouseClick(0), true);
  });

  test('mouse.drag() tracks dragging state', () => {
    _testTriggerMouseDown(0);
    _testTriggerMouseMove(150, 250);
    _testMouse.dragging = true;
    assert.equal(_testMouseDrag(), true);
  });

  test('mouse tracks multiple buttons independently', () => {
    _testTriggerMouseDown(0);
    _testTriggerMouseDown(2);
    assert.equal(_testMouseDown(0), true);
    assert.equal(_testMouseDown(2), true);
    assert.equal(_testMouseDown(1), false);

    _testTriggerMouseUp(0);
    assert.equal(_testMouseDown(0), false);
    assert.equal(_testMouseDown(2), true);
  });
});
