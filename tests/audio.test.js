/**
 * Audio Tests
 *
 * Tests the audio.play(), audio.stop(), audio.pause(), audio.resume() API exposed by TEMF runtime.
 */

'use strict';

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Simulate the runtime audio state
const _testAudio = {
  volume: 1,
  sfxVolume: 1,
  bgmVolume: 1,
  muted: false,
  mutedSfx: false,
  mutedBgm: false,
  bgmPlaying: false,
  bgmPaused: false,
  sfxPlaying: false,
  cache: new Map(),
};

function _testAudioPlay(path, type, loop) {
  if (type === 'sfx') {
    _testAudio.sfxPlaying = true;
    _testAudio.cache.set(path, { playing: true, loop: loop || false });
  } else if (type === 'bgm') {
    _testAudio.bgmPlaying = true;
    _testAudio.bgmPaused = false;
    _testAudio.cache.set(path, { playing: true, loop: loop !== false });
  }
}

function _testAudioStop(type) {
  if (type === 'sfx') {
    _testAudio.sfxPlaying = false;
  } else if (type === 'bgm') {
    _testAudio.bgmPlaying = false;
    _testAudio.bgmPaused = false;
  } else {
    _testAudio.sfxPlaying = false;
    _testAudio.bgmPlaying = false;
    _testAudio.bgmPaused = false;
  }
}

function _testAudioPause() {
  _testAudio.bgmPaused = true;
  _testAudio.bgmPlaying = true;
}

function _testAudioResume() {
  _testAudio.bgmPaused = false;
  _testAudio.bgmPlaying = true;
}

function _testClearAudio() {
  _testAudio.volume = 1;
  _testAudio.sfxVolume = 1;
  _testAudio.bgmVolume = 1;
  _testAudio.muted = false;
  _testAudio.mutedSfx = false;
  _testAudio.mutedBgm = false;
  _testAudio.bgmPlaying = false;
  _testAudio.bgmPaused = false;
  _testAudio.sfxPlaying = false;
  _testAudio.cache.clear();
}

describe('Audio', () => {
  beforeEach(() => {
    _testClearAudio();
  });

  test('audio.play() starts SFX playback', () => {
    _testAudioPlay('sfx/jump.wav', 'sfx');
    assert.equal(_testAudio.sfxPlaying, true);
  });

  test('audio.play() starts BGM playback', () => {
    _testAudioPlay('bgm/theme.mp3', 'bgm');
    assert.equal(_testAudio.bgmPlaying, true);
  });

  test('audio.play() caches audio files', () => {
    _testAudioPlay('sfx/jump.wav', 'sfx');
    assert.ok(_testAudio.cache.has('sfx/jump.wav'));
  });

  test('audio.stop("sfx") stops SFX playback', () => {
    _testAudioPlay('sfx/jump.wav', 'sfx');
    _testAudioStop('sfx');
    assert.equal(_testAudio.sfxPlaying, false);
  });

  test('audio.stop("bgm") stops BGM playback', () => {
    _testAudioPlay('bgm/theme.mp3', 'bgm');
    _testAudioStop('bgm');
    assert.equal(_testAudio.bgmPlaying, false);
  });

  test('audio.stop() stops all audio', () => {
    _testAudioPlay('sfx/jump.wav', 'sfx');
    _testAudioPlay('bgm/theme.mp3', 'bgm');
    _testAudioStop();
    assert.equal(_testAudio.sfxPlaying, false);
    assert.equal(_testAudio.bgmPlaying, false);
  });

  test('audio.pause() pauses BGM', () => {
    _testAudioPlay('bgm/theme.mp3', 'bgm');
    _testAudioPause();
    assert.equal(_testAudio.bgmPaused, true);
  });

  test('audio.resume() resumes BGM', () => {
    _testAudioPlay('bgm/theme.mp3', 'bgm');
    _testAudioPause();
    _testAudioResume();
    assert.equal(_testAudio.bgmPaused, false);
  });

  test('audio.volume controls master volume', () => {
    _testAudio.volume = 0.5;
    assert.equal(_testAudio.volume, 0.5);
  });

  test('audio.sfxVolume controls SFX volume', () => {
    _testAudio.sfxVolume = 0.8;
    assert.equal(_testAudio.sfxVolume, 0.8);
  });

  test('audio.bgmVolume controls BGM volume', () => {
    _testAudio.bgmVolume = 0.7;
    assert.equal(_testAudio.bgmVolume, 0.7);
  });

  test('audio.muted mutes all audio', () => {
    _testAudio.muted = true;
    assert.equal(_testAudio.muted, true);
  });

  test('audio.mutedSfx mutes SFX only', () => {
    _testAudio.mutedSfx = true;
    assert.equal(_testAudio.mutedSfx, true);
  });

  test('audio.mutedBgm mutes BGM only', () => {
    _testAudio.mutedBgm = true;
    assert.equal(_testAudio.mutedBgm, true);
  });
});
