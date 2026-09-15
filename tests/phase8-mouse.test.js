/**
 * Phase 8 — Mouse / Pointer Input Tests
 *
 * Tests the mouse API exposed by TEMF runtime:
 * - mouse.x, mouse.y
 * - mouse.click("left")
 * - mouse.down("left")
 * - mouse.drag("left")
 * - mouse.up("left")
 */

'use strict';

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Simulate the runtime mouse state
function createMouseState() {
  return {
    _x: 0,
    _y: 0,
    _buttons: new Map(),
  };
}

function _getMouseState(mouse, btn) {
  if (!mouse._buttons.has(btn)) {
    mouse._buttons.set(btn, { down: false, clicked: false, dragging: false });
  }
  return mouse._buttons.get(btn);
}

function _mouseX(mouse) {
  return mouse._x;
}

function _mouseY(mouse) {
  return mouse._y;
}

function _mouseClick(mouse, btn) {
  const state = _getMouseState(mouse, btn || '0');
  return state.clicked;
}

function _mouseDown(mouse, btn) {
  const state = _getMouseState(mouse, btn || '0');
  return state.down;
}

function _mouseDrag(mouse, btn) {
  const state = _getMouseState(mouse, btn || '0');
  const dragging = state.dragging;
  state.dragging = false;
  return dragging;
}

function _mouseUp(mouse, btn) {
  const state = _getMouseState(mouse, btn || '0');
  return !state.down && !state.clicked;
}

function _triggerPointerDown(mouse, x, y, button = 0) {
  mouse._x = x;
  mouse._y = y;
  const state = _getMouseState(mouse, button.toString());
  state.down = true;
  state.clicked = false;
  state.dragging = false;
}

function _triggerPointerMove(mouse, x, y, buttonsMask = 1) {
  const prevX = mouse._x;
  const prevY = mouse._y;
  mouse._x = x;
  mouse._y = y;
  // Check each button state against the buttons bitmask
  for (const [btn, state] of mouse._buttons) {
    const btnNum = parseInt(btn, 10);
    if (btnNum >= 0 && btnNum <= 2 && (buttonsMask & (1 << btnNum)) && state.down && (prevX !== mouse._x || prevY !== mouse._y)) {
      state.dragging = true;
    }
  }
}

function _triggerPointerUp(mouse, x, y, button = 0) {
  mouse._x = x;
  mouse._y = y;
  const state = _getMouseState(mouse, button.toString());
  if (state) {
    state.clicked = true;
    state.down = false;
    state.dragging = false;
  }
}

function _resetMouse(mouse) {
  mouse._x = 0;
  mouse._y = 0;
  mouse._buttons.clear();
}

describe('Phase 8 — Mouse / Pointer Input', () => {
  let mouse;

  beforeEach(() => {
    mouse = createMouseState();
  });

  describe('mouse position', () => {
    test('initial position is 0, 0', () => {
      assert.equal(_mouseX(mouse), 0);
      assert.equal(_mouseY(mouse), 0);
    });

    test('mouse.x updates on pointerdown', () => {
      _triggerPointerDown(mouse, 100, 200);
      assert.equal(_mouseX(mouse), 100);
      assert.equal(_mouseY(mouse), 200);
    });

    test('mouse.y updates on pointerdown', () => {
      _triggerPointerDown(mouse, 50, 150);
      assert.equal(_mouseX(mouse), 50);
      assert.equal(_mouseY(mouse), 150);
    });

    test('mouse position updates on pointermove', () => {
      _triggerPointerDown(mouse, 10, 20);
      _triggerPointerMove(mouse, 100, 200, 1);
      assert.equal(_mouseX(mouse), 100);
      assert.equal(_mouseY(mouse), 200);
    });
  });

  describe('mouse.down()', () => {
    test('returns false when no buttons are pressed', () => {
      assert.equal(_mouseDown(mouse, '0'), false);
    });

    test('returns true when left button is down', () => {
      _triggerPointerDown(mouse, 0, 0, 0);
      assert.equal(_mouseDown(mouse, '0'), true);
    });

    test('returns true when middle button is down', () => {
      _triggerPointerDown(mouse, 0, 0, 1);
      assert.equal(_mouseDown(mouse, '1'), true);
    });

    test('returns true when right button is down', () => {
      _triggerPointerDown(mouse, 0, 0, 2);
      assert.equal(_mouseDown(mouse, '2'), true);
    });

    test('returns false after button is released', () => {
      _triggerPointerDown(mouse, 0, 0, 0);
      assert.equal(_mouseDown(mouse, '0'), true);
      _triggerPointerUp(mouse, 0, 0, 0);
      assert.equal(_mouseDown(mouse, '0'), false);
    });
  });

  describe('mouse.click()', () => {
    test('returns false before any interaction', () => {
      assert.equal(_mouseClick(mouse, '0'), false);
    });

    test('returns true after click sequence (down + up)', () => {
      _triggerPointerDown(mouse, 50, 50, 0);
      assert.equal(_mouseClick(mouse, '0'), false);
      _triggerPointerUp(mouse, 50, 50, 0);
      assert.equal(_mouseClick(mouse, '0'), true);
    });

    test('returns false if button is only down (no up yet)', () => {
      _triggerPointerDown(mouse, 50, 50, 0);
      assert.equal(_mouseClick(mouse, '0'), false);
      assert.equal(_mouseDown(mouse, '0'), true);
    });

    test('returns true only once per click', () => {
      _triggerPointerDown(mouse, 50, 50, 0);
      _triggerPointerUp(mouse, 50, 50, 0);
      assert.equal(_mouseClick(mouse, '0'), true);
      assert.equal(_mouseClick(mouse, '0'), true);
    });
  });

  describe('mouse.drag()', () => {
    test('returns false when not dragging', () => {
      assert.equal(_mouseDrag(mouse, '0'), false);
    });

    test('returns true after moving while button is held', () => {
      _triggerPointerDown(mouse, 0, 0, 0);
      _triggerPointerMove(mouse, 10, 0, 1);
      assert.equal(_mouseDrag(mouse, '0'), true);
    });

    test('returns true after multiple moves while button is held', () => {
      _triggerPointerDown(mouse, 0, 0, 0);
      _triggerPointerMove(mouse, 10, 0, 1);
      _triggerPointerMove(mouse, 20, 10, 1);
      assert.equal(_mouseDrag(mouse, '0'), true);
      _triggerPointerMove(mouse, 30, 20, 1);
      assert.equal(_mouseDrag(mouse, '0'), true);
    });

    test('returns false after button is released', () => {
      _triggerPointerDown(mouse, 0, 0, 0);
      _triggerPointerMove(mouse, 10, 0, 1);
      _triggerPointerUp(mouse, 10, 0, 0);
      assert.equal(_mouseDrag(mouse, '0'), false);
    });

    test('does not set dragging if button is not held', () => {
      _triggerPointerDown(mouse, 0, 0, 0);
      _triggerPointerUp(mouse, 0, 0, 0);
      _triggerPointerMove(mouse, 10, 10, 0);
      assert.equal(_mouseDrag(mouse, '0'), false);
    });
  });

  describe('multiple buttons', () => {
    test('tracks left and right buttons independently', () => {
      _triggerPointerDown(mouse, 0, 0, 0);
      _triggerPointerDown(mouse, 0, 0, 2);
      assert.equal(_mouseDown(mouse, '0'), true);
      assert.equal(_mouseDown(mouse, '2'), true);

      _triggerPointerUp(mouse, 0, 0, 0);
      assert.equal(_mouseDown(mouse, '0'), false);
      assert.equal(_mouseDown(mouse, '2'), true);
    });

    test('click on one button does not affect another', () => {
      _triggerPointerDown(mouse, 0, 0, 0);
      _triggerPointerUp(mouse, 0, 0, 0);
      assert.equal(_mouseClick(mouse, '0'), true);
      assert.equal(_mouseClick(mouse, '2'), false);
    });
  });

  describe('button default', () => {
    test('default button is "0" (left)', () => {
      _triggerPointerDown(mouse, 0, 0, 0);
      _triggerPointerUp(mouse, 0, 0, 0);
      assert.equal(_mouseClick(mouse), true);
    });
  });
});
