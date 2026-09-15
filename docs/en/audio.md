# Audio

## Unified Audio Object
```javascript
audio.play(src)  // SFX
audio.play(src, { loop: true })  // BGM
audio.volume = 0.5
audio.pause()
audio.resume()
```

## SFX (Sound Effects)
Short sounds that can overlap. Play multiple SFX simultaneously.
```javascript
audio.play('sfx/jump.wav')
audio.play('sfx/click.wav')
```

## BGM (Background Music)
Longer music tracks. Only one BGM plays at a time. Starting a new BGM stops the previous one.
```javascript
audio.play('bgm/theme.mp3', { loop: true })
```

## Audio Control
```javascript
audio.volume = 0.7          // Set volume (0.0 to 1.0)
audio.pause()               // Pause BGM (preserves position)
audio.resume()              // Resume paused BGM
audio.stop()                // Stop BGM (resets position)
```

## Rules
- SFX playback does not stop or restart BGM
- BGM pause/resume/stop work correctly
- Audio buffers release when no longer referenced
