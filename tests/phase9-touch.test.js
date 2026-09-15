/**
 * Phase 9 — Touch Input Tests
 *
 * Tests the touch API exposed by TEMF runtime:
 * - touch.x, touch.y
 * - touch.tap()
 * - touch.down()
 * - touch.drag()
 * - touch.up()
 */

'use strict';

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Simulate the runtime touch state
function createTouchState() {
  return {
    _x: 0,
    _y: 0,
    _down: false,
    _tapped: false,
    _dragging: false,
  };
}

function _touchX(touch) {
  return touch._x;
}

function _touchY(touch) {
  return touch._y;
}

function _touchTap(touch) {
  const tapped = touch._tapped;
  touch._tapped = false;
  return tapped;
}

function _touchDown(touch) {
  return touch._down;
}

function _touchDrag(touch) {
  const dragging = touch._dragging;
  touch._dragging = false;
  return dragging;
}

function _touchUp(touch) {
  return !touch._down && touch._tapped;
}

function _triggerTouchDown(touch, x, y) {
  touch._x = x;
  touch._y = y;
  touch._down = true;
  touch._tapped = false;
  touch._dragging = false;
}

function _triggerTouchMove(touch, x, y, wasDown = true) {
  const prevX = touch._x;
  const prevY = touch._y;
  touch._x = x;
  touch._y = y;
  if (wasDown && touch._down && (prevX !== touch._x || prevY !== touch._y)) {
    touch._dragging = true;
  }
}

function _triggerTouchUp(touch, x, y) {
  touch._x = x;
  touch._y = y;
  touch._tapped = true;
  touch._down = false;
  touch._dragging = false;
}

function _resetTouch(touch) {
  touch._x = 0;
  touch._y = 0;
  touch._down = false;
  touch._tapped = false;
  touch._dragging = false;
}

describe('Phase 9 — Touch Input', () => {
  let touch;

  beforeEach(() => {
    touch = createTouchState();
  });

  describe('touch position', () => {
    test('initial position is 0, 0', () => {
      assert.equal(_touchX(touch), 0);
      assert.equal(_touchY(touch), 0);
    });

    test('touch.x updates on touchdown', () => {
      _triggerTouchDown(touch, 100, 200);
      assert.equal(_touchX(touch), 100);
      assert.equal(_touchY(touch), 200);
    });

    test('touch.y updates on touchdown', () => {
      _triggerTouchDown(touch, 50, 150);
      assert.equal(_touchX(touch), 50);
      assert.equal(_touchY(touch), 150);
    });

    test('touch position updates on touchmove', () => {
      _triggerTouchDown(touch, 10, 20);
      _triggerTouchMove(touch, 100, 200, true);
      assert.equal(_touchX(touch), 100);
      assert.equal(_touchY(touch), 200);
    });
  });

  describe('touch.down()', () => {
    test('returns false when no touch is active', () => {
      assert.equal(_touchDown(touch), false);
    });

    test('returns true when finger is touching', () => {
      _triggerTouchDown(touch, 0, 0);
      assert.equal(_touchDown(touch), true);
    });

    test('returns false after touch is released', () => {
      _triggerTouchDown(touch, 0, 0);
      assert.equal(_touchDown(touch), true);
      _triggerTouchUp(touch, 0, 0);
      assert.equal(_touchDown(touch), false);
    });

    test('returns false after touch cancel', () => {
      _triggerTouchDown(touch, 0, 0);
      assert.equal(_touchDown(touch), true);
      touch._down = false;
      touch._dragging = false;
      assert.equal(_touchDown(touch), false);
    });
  });

  describe('touch.tap()', () => {
    test('returns false before any touch', () => {
      assert.equal(_touchTap(touch), false);
    });

    test('returns true after tap sequence (down + up)', () => {
      _triggerTouchDown(touch, 50, 50);
      assert.equal(_touchTap(touch), false);
      _triggerTouchUp(touch, 50, 50);
      assert.equal(_touchTap(touch), true);
    });

    test('returns false if finger is only down (no up yet)', () => {
      _triggerTouchDown(touch, 50, 50);
      assert.equal(_touchTap(touch), false);
      assert.equal(_touchDown(touch), true);
    });

    test('returns true only once per tap', () => {
      _triggerTouchDown(touch, 50, 50);
      _triggerTouchUp(touch, 50, 50);
      assert.equal(_touchTap(touch), true);
      assert.equal(_touchTap(touch), false);
    });

    test('returns false after tap has been consumed', () => {
      _triggerTouchDown(touch, 50, 50);
      _triggerTouchUp(touch, 50, 50);
      assert.equal(_touchTap(touch), true);
      assert.equal(_touchTap(touch), false);
    });
  });

  describe('touch.drag()', () => {
    test('returns false when not dragging', () => {
      assert.equal(_touchDrag(touch), false);
    });

    test('returns true after moving while finger is down', () => {
      _triggerTouchDown(touch, 0, 0);
      _triggerTouchMove(touch, 10, 0, true);
      assert.equal(_touchDrag(touch), true);
    });

    test('returns true after multiple moves while finger is down', () => {
      _triggerTouchDown(touch, 0, 0);
      _triggerTouchMove(touch, 10, 0, true);
      assert.equal(_touchDrag(touch), true);
      _triggerTouchMove(touch, 20, 10, true);
      assert.equal(_touchDrag(touch), true);
      _triggerTouchMove(touch, 30, 20, true);
      assert.equal(_touchDrag(touch), true);
    });

    test('returns false after touch is released', () => {
      _triggerTouchDown(touch, 0, 0);
      _triggerTouchMove(touch, 10, 0, true);
      _triggerTouchUp(touch, 10, 0);
      assert.equal(_touchDrag(touch), false);
    });

    test('does not set dragging if finger was not down', () => {
      _triggerTouchDown(touch, 0, 0);
      _triggerTouchUp(touch, 0, 0);
      _triggerTouchMove(touch, 10, 10, false);
      assert.equal(_touchDrag(touch), false);
    });

    test('consumes drag state on each call', () => {
      _triggerTouchDown(touch, 0, 0);
      _triggerTouchMove(touch, 10, 0, true);
      _triggerTouchMove(touch, 20, 10, true);
      assert.equal(_touchDrag(touch), true);
      assert.equal(_touchDrag(touch), false);
    });
  });

  describe('touch.up()', () => {
    test('returns false when no touch occurred', () => {
      assert.equal(_touchUp(touch), false);
    });

    test('returns true after tap sequence', () => {
      _triggerTouchDown(touch, 50, 50);
      _triggerTouchUp(touch, 50, 50);
      assert.equal(_touchUp(touch), true);
    });

    test('returns false when finger is still down', () => {
      _triggerTouchDown(touch, 50, 50);
      assert.equal(_touchUp(touch), false);
    });

    test('returns false after touch cancel', () => {
      _triggerTouchDown(touch, 50, 50);
      touch._down = false;
      touch._tapped = false;
      assert.equal(_touchUp(touch), false);
    });
  });

  describe('complete touch sequences', () => {
    test('single tap: down -> up -> tap()', () => {
      _triggerTouchDown(touch, 100, 100);
      assert.equal(_touchDown(touch), true);
      assert.equal(_touchTap(touch), false);

      _triggerTouchUp(touch, 100, 100);
      assert.equal(_touchDown(touch), false);
      assert.equal(_touchTap(touch), true);
    });

    test('touch drag: down -> move -> drag() -> up -> tap()', () => {
      _triggerTouchDown(touch, 0, 0);
      _triggerTouchMove(touch, 50, 50, true);
      assert.equal(_touchDown(touch), true);
      assert.equal(_touchDrag(touch), true);

      _triggerTouchUp(touch, 50, 50);
      assert.equal(_touchTap(touch), true);
    });

    test('tap then drag: two separate touches', () => {
      _triggerTouchDown(touch, 10, 10);
      _triggerTouchUp(touch, 10, 10);
      assert.equal(_touchTap(touch), true);

      _resetTouch(touch);
      _triggerTouchDown(touch, 0, 0);
      _triggerTouchMove(touch, 100, 100, true);
      assert.equal(_touchDrag(touch), true);
    });
  });

  describe('position tracking during sequences', () => {
    test('position updates during drag', () => {
      _triggerTouchDown(touch, 0, 0);
      assert.equal(_touchX(touch), 0);
      assert.equal(_touchY(touch), 0);

      _triggerTouchMove(touch, 100, 200, true);
      assert.equal(_touchX(touch), 100);
      assert.equal(_touchY(touch), 200);

      _triggerTouchMove(touch, 150, 250, true);
      assert.equal(_touchX(touch), 150);
      assert.equal(_touchY(touch), 250);
    });

    test('position updates on tap', () => {
      _triggerTouchDown(touch, 50, 50);
      assert.equal(_touchX(touch), 50);
      assert.equal(_touchY(touch), 50);

      _triggerTouchUp(touch, 50, 50);
      assert.equal(_touchX(touch), 50);
      assert.equal(_touchY(touch), 50);
    });
  });
});
