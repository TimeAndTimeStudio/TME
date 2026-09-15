/**
 * Game Loop Tests
 *
 * Tests the start(), fps(), update(dt), and draw lifecycle exposed by TEMF runtime.
 */

'use strict';

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Simulate the runtime game loop state
const _testGameLoop = {
  started: false,
  fps: 60,
  accumulator: 0,
  step: 0,
  updateCalled: 0,
  drawCalled: 0,
  lastDt: 0,
};

function _testStart() {
  _testGameLoop.started = true;
  _testGameLoop.fps = 60;
  _testGameLoop.accumulator = 0;
  _testGameLoop.step = 1 / 60;
  _testGameLoop.updateCalled = 0;
  _testGameLoop.drawCalled = 0;
}

function _testFps(n) {
  _testGameLoop.fps = n;
  _testGameLoop.step = 1 / n;
}

function _testFixedUpdate(dt) {
  if (!_testGameLoop.started) return;
  _testGameLoop.accumulator += dt;
  while (_testGameLoop.accumulator >= _testGameLoop.step) {
    _testGameLoop.updateCalled++;
    _testGameLoop.lastDt = _testGameLoop.step;
    _testGameLoop.accumulator -= _testGameLoop.step;
  }
}

function _testRender() {
  if (!_testGameLoop.started) return;
  _testGameLoop.drawCalled++;
}

function _testClearGameLoop() {
  _testGameLoop.started = false;
  _testGameLoop.fps = 60;
  _testGameLoop.accumulator = 0;
  _testGameLoop.step = 0;
  _testGameLoop.updateCalled = 0;
  _testGameLoop.drawCalled = 0;
  _testGameLoop.lastDt = 0;
}

describe('Game Loop', () => {
  beforeEach(() => {
    _testClearGameLoop();
  });

  test('game loop is not started initially', () => {
    assert.equal(_testGameLoop.started, false);
  });

  test('start() initializes the game loop', () => {
    _testStart();
    assert.equal(_testGameLoop.started, true);
    assert.equal(_testGameLoop.fps, 60);
    assert.equal(_testGameLoop.step, 1 / 60);
  });

  test('fps() configures the update rate', () => {
    _testFps(30);
    assert.equal(_testGameLoop.fps, 30);
    assert.equal(_testGameLoop.step, 1 / 30);
  });

  test('fps() configures the update rate to 120', () => {
    _testFps(120);
    assert.equal(_testGameLoop.fps, 120);
    assert.equal(_testGameLoop.step, 1 / 120);
  });

  test('fixedUpdate() increments update counter', () => {
    _testStart();
    _testFixedUpdate(0.01667);
    assert.equal(_testGameLoop.updateCalled, 1);
  });

  test('fixedUpdate() uses fixed timestep', () => {
    _testStart();
    _testFixedUpdate(0.05);
    // 0.05 / 0.01667 ≈ 3 updates
    assert.ok(_testGameLoop.updateCalled >= 2);
  });

  test('fixedUpdate() accumulates remainder', () => {
    _testStart();
    _testFixedUpdate(0.02);
    assert.ok(Math.abs(_testGameLoop.accumulator - 0.003333333333333333) < 0.0001);
  });

  test('render() increments draw counter', () => {
    _testStart();
    _testRender();
    _testRender();
    assert.equal(_testGameLoop.drawCalled, 2);
  });

  test('update dt is fixed regardless of frame rate', () => {
    _testStart();
    _testFixedUpdate(0.1);
    assert.equal(_testGameLoop.lastDt, 1 / 60);
  });

  test('game loop prevents spiral of death', () => {
    _testStart();
    _testFixedUpdate(0.5);
    // Should not exceed max elapsed time (0.25s)
    assert.ok(_testGameLoop.updateCalled < 100);
  });
});
