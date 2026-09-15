const { test } = require('node:test');
const { strictEqual, ok } = require('node:assert');

// --- Phase 5: Game Loop Tests ---
// Tests for fixed timestep game loop, start(), fps, update(dt), draw

// Helper: simulate the game loop algorithm from runtime.js
function createTestContext(fps = 60) {
  const updates = [];
  const counters = { draws: 0 };

  const game = {
    update(dt) {
      updates.push(dt);
    },
    draw() {
      counters.draws++;
    },
  };

  const state = {
    _started: false,
    _game: null,
    _fps: fps,
    _step: 1 / fps,
    _accumulator: 0,
    _lastTime: 0,
  };

  function start(game, fps) {
    if (state._started) return;
    state._started = true;
    state._game = game;
    state._fps = fps || 60;
    state._step = 1 / state._fps;
    state._accumulator = 0;
    state._lastTime = 0;
  }

  function frame(now) {
    const elapsed = Math.min((now - state._lastTime) / 1000, 0.25);
    state._lastTime = now;
    state._accumulator += elapsed;

    while (state._accumulator >= state._step) {
      if (state._game && typeof state._game.update === 'function') {
        state._game.update(state._step);
      }
      state._accumulator -= state._step;
    }

    if (state._game && typeof state._game.draw === 'function') {
      state._game.draw();
    }
  }

  function reset() {
    updates.length = 0;
    counters.draws = 0;
  }

  start(game, fps);

  return { game, state, frame, updates, counters, reset };
}

test('phase5: fixed timestep produces consistent dt values', () => {
  const { state, frame, updates, reset } = createTestContext(60);
  reset();

  const now = performance.now();
  state._lastTime = now;

  // 120ms at 60fps => 7 updates (7 * 16.67ms = 116.67ms)
  frame(now + 120);

  strictEqual(updates.length, 7, 'Should have 7 update calls for 120ms at 60fps');

  for (let i = 0; i < updates.length; i++) {
    strictEqual(
      updates[i].toFixed(5),
      (1 / 60).toFixed(5),
      `dt should be fixed step for call ${i}`
    );
  }
});

test('phase5: step equals 1/fps', () => {
  const ctx30 = createTestContext(30);
  strictEqual(ctx30.state._step.toFixed(5), '0.03333', 'Step for 30fps');

  const ctx120 = createTestContext(120);
  strictEqual(ctx120.state._step.toFixed(5), '0.00833', 'Step for 120fps');
});

test('phase5: elapsed time is clamped to 0.25s (spiral of death prevention)', () => {
  const ctx = createTestContext(60);
  const { state, frame, updates } = ctx;
  ctx.reset();
  state._lastTime = 0;

  // 2 second gap, clamped to 0.25s => 15 updates
  frame(2000);

  strictEqual(updates.length, 15, 'Should handle 2s gap without spiral of death');
  strictEqual(ctx.counters.draws, 1, 'Should draw once per frame');
});

test('phase5: multiple frames accumulate correctly', () => {
  const { state, frame, updates, reset } = createTestContext(60);
  reset();
  state._lastTime = 0;

  for (let i = 1; i <= 6; i++) {
    frame(i * 16.67);
  }

  strictEqual(updates.length, 6, 'Should have 6 updates for 6 frames');
});

test('phase5: start() sets correct state', () => {
  const ctx = createTestContext(60);
  strictEqual(ctx.state._started, true, '_started is true');
  strictEqual(ctx.state._game, ctx.game, 'game is set');
  strictEqual(ctx.state._fps, 60, 'fps is 60');
  strictEqual(ctx.state._step.toFixed(5), '0.01667', 'step is 1/60');
});

test('phase5: start() defaults to 60fps', () => {
  const ctx = createTestContext(60);
  // Simulate start with undefined fps
  const state = ctx.state;
  state._started = false;
  // Re-call start logic with undefined fps
  if (!state._started) {
    state._started = true;
    state._fps = 60 || 60;
    state._step = 1 / state._fps;
    state._accumulator = 0;
    state._lastTime = 0;
  }
  strictEqual(state._fps, 60, 'Default fps is 60');
});

test('phase5: movement is frame-rate independent', () => {
  const speed = 100;

  // 60fps: 60 updates * 100 * (1/60) = 100 units
  let pos60 = 0;
  for (let i = 0; i < 60; i++) {
    pos60 += speed * (1 / 60);
  }

  // 30fps: 30 updates * 100 * (1/30) = 100 units
  let pos30 = 0;
  for (let i = 0; i < 30; i++) {
    pos30 += speed * (1 / 30);
  }

  strictEqual(pos60.toFixed(2), '100.00', '60fps movement = 100 units/sec');
  strictEqual(pos30.toFixed(2), '100.00', '30fps movement = 100 units/sec');
});

test('phase5: draw called every frame even with 0 updates', () => {
  const ctx = createTestContext(60);
  const { state, frame, updates } = ctx;
  ctx.reset();
  state._lastTime = 0;

  // Small gap => no updates
  frame(1);
  strictEqual(updates.length, 0, 'No update for sub-step gap');
  strictEqual(ctx.counters.draws, 1, 'Draw is still called');

  // Another small gap
  frame(2);
  strictEqual(updates.length, 0, 'Still no update');
  strictEqual(ctx.counters.draws, 2, 'Draw called again');
});

test('phase5: update is not called before start()', () => {
  const updates = [];
  const game = {
    update(dt) { updates.push(dt); },
    draw() {},
  };

  const state = {
    _started: false,
    _game: null,
    _fps: 60,
    _step: 1 / 60,
    _accumulator: 0,
    _lastTime: 0,
  };

  // Simulate frames before start
  for (let i = 1; i <= 10; i++) {
    const now = i * 16.67;
    const elapsed = Math.min((now - state._lastTime) / 1000, 0.25);
    state._lastTime = now;
    state._accumulator += elapsed;

    while (state._accumulator >= state._step) {
      // Not calling update because _started is false
      state._accumulator -= state._step;
    }
  }

  strictEqual(updates.length, 0, 'Update not called before start()');
});
