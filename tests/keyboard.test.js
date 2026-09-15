/**
 * Keyboard Input Tests
 *
 * Tests the key.down() API exposed by TEMF runtime.
 */

'use strict';

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Simulate the runtime keyboard state
const _testKeys = new Set();

function _testKeyDown(key) {
  return _testKeys.has(key);
}

function _testTriggerKeyDown(key) {
  _testKeys.add(key);
}

function _testTriggerKeyUp(key) {
  _testKeys.delete(key);
}

function _testClearKeys() {
  _testKeys.clear();
}

describe('Keyboard Input', () => {
  beforeEach(() => {
    _testClearKeys();
  });

  test('key.down() returns false when no keys are pressed', () => {
    assert.equal(_testKeyDown('ArrowLeft'), false);
    assert.equal(_testKeyDown('Space'), false);
    assert.equal(_testKeyDown('a'), false);
  });

  test('key.down() returns true after keydown event', () => {
    _testTriggerKeyDown('ArrowLeft');
    assert.equal(_testKeyDown('ArrowLeft'), true);
  });

  test('key.down() returns false after keyup event', () => {
    _testTriggerKeyDown('ArrowLeft');
    assert.equal(_testKeyDown('ArrowLeft'), true);
    _testTriggerKeyUp('ArrowLeft');
    assert.equal(_testKeyDown('ArrowLeft'), false);
  });

  test('key.down() tracks multiple keys independently', () => {
    _testTriggerKeyDown('ArrowLeft');
    _testTriggerKeyDown('ArrowRight');
    assert.equal(_testKeyDown('ArrowLeft'), true);
    assert.equal(_testKeyDown('ArrowRight'), true);
    assert.equal(_testKeyDown('Space'), false);

    _testTriggerKeyUp('ArrowLeft');
    assert.equal(_testKeyDown('ArrowLeft'), false);
    assert.equal(_testKeyDown('ArrowRight'), true);
  });

  test('key.down() handles special keys', () => {
    _testTriggerKeyDown('Enter');
    _testTriggerKeyDown('Escape');
    _testTriggerKeyDown(' ');
    assert.equal(_testKeyDown('Enter'), true);
    assert.equal(_testKeyDown('Escape'), true);
    assert.equal(_testKeyDown(' '), true);
  });

  test('key.down() handles repeated keydown events', () => {
    _testTriggerKeyDown('Space');
    assert.equal(_testKeyDown('Space'), true);
    _testTriggerKeyDown('Space');
    assert.equal(_testKeyDown('Space'), true);
    _testTriggerKeyUp('Space');
    assert.equal(_testKeyDown('Space'), false);
  });
});
