# Audio

TME provides a unified `audio` object for Sound Effects (SFX) and Background Music (BGM). Both use the same API through `audio.play()`, with the `type` parameter determining playback behavior.

## Sound Effects

SFX are short gameplay sounds that can be triggered repeatedly. Multiple SFX can play simultaneously without interfering with each other or BGM.

```tsl
audio.play("audio/sfx/jump.wav", type="sfx")
audio.play("audio/sfx/hit.wav", type="sfx", volume=0.8)
audio.play("audio/sfx/engine.wav", type="sfx", loop=true)
```

### SFX behavior

- SFX can be triggered multiple times, creating overlapping instances
- SFX playback does not stop or restart BGM
- SFX has an independent volume control (`audio.sfxVolume`)
- Default loop is `false` — SFX plays once unless `loop=true`
- A looping SFX continues until explicitly stopped

### Stopping a specific SFX

When `loop=true`, `audio.play()` returns a playback handle. Use it to stop that specific SFX:

```tsl
engine = audio.play("audio/sfx/engine.wav", type="sfx", loop=true)

update(dt):
    if key.down("E"):
        // stop the engine sound
```

## Background Music

BGM is for longer music tracks that can play continuously. Only one BGM track plays at a time. Starting a new BGM automatically stops the previous one.

```tsl
audio.play("audio/bgm/stage1.mp3", type="bgm")
audio.play("audio/bgm/stage2.mp3", type="bgm", loop=true)
```

### BGM behavior

- Only the currently selected BGM track is active
- Calling `audio.play()` with another `type="bgm"` replaces the current BGM
- Default loop is `true` — BGM loops unless `loop=false`
- BGM has an independent volume control (`audio.bgmVolume`)

### BGM controls

```tsl
audio.pause()   // Pause BGM (preserves playback position)
audio.resume()  // Resume BGM from pause
audio.stop()    // Stop BGM (resets playback position)
```

## Volume Control

TME provides four volume controls through the unified `audio` object:

| Property | Range | Description |
|----------|-------|-------------|
| `audio.volume` | 0..1 | Master volume (affects all audio) |
| `audio.sfxVolume` | 0..1 | SFX volume (independent from BGM) |
| `audio.bgmVolume` | 0..1 | BGM volume (independent from SFX) |
| `audio.muted` | true/false | Master mute (sets volume to 0) |

```tsl
audio.volume = 0.8
audio.sfxVolume = 1.0
audio.bgmVolume = 0.6
audio.muted = false
```

Values are automatically clamped to the 0..1 range.

## Looping

Both SFX and BGM support looping through the `loop` option:

```tsl
// SFX — plays once by default
audio.play("audio/sfx/jump.wav", type="sfx")

// SFX — loops until stopped
audio.play("audio/sfx/engine.wav", type="sfx", loop=true)

// BGM — loops by default
audio.play("audio/bgm/stage1.mp3", type="bgm")

// BGM — plays once
audio.play("audio/bgm/menu.mp3", type="bgm", loop=false)
```

### Loop defaults

- SFX: `loop = false`
- BGM: `loop = true`

## Audio File Paths

Audio files are loaded using paths relative to the project root. Directory names are unrestricted — you can name audio folders anything you want.

### Project structure

```
project/
├── game.tsl
├── index.html
├── style.css
├── audio/
│   ├── sfx/
│   │   ├── jump.wav
│   │   └── hit.wav
│   └── bgm/
│       └── stage1.mp3
└── sounds/
    └── ui/
        └── click.ogg
```

### After build

The Build Program recursively copies all user-created directories and files into `dist/`, preserving relative paths:

```
dist/
├── index.html
├── game.js
├── engine.js
├── style.css
├── audio/
│   ├── sfx/
│   │   ├── jump.wav
│   │   └── hit.wav
│   └── bgm/
│       └── stage1.mp3
└── sounds/
    └── ui/
        └── click.ogg
```

### Supported formats

Common audio formats are supported: `.wav`, `.mp3`, `.ogg`, `.m4a`. The browser determines actual support.

## Audio Caching

Audio files are cached after the first load. Repeated playback of the same file reuses the cached decoded audio data, avoiding redundant network requests and decoding.

```tsl
// First call — loads and decodes the file
audio.play("audio/sfx/jump.wav", type="sfx")

// Subsequent calls — uses cached data
audio.play("audio/sfx/jump.wav", type="sfx")
audio.play("audio/sfx/jump.wav", type="sfx")
```

### Clearing the cache

Call `audio.clearCache()` to release all audio resources:

```tsl
audio.clearCache()
```

You can also clean up via the TEMF runtime:

```js
TEMF.cleanupAudio()
```

## Browser Autoplay Restrictions

Browsers may block audio playback until the user interacts with the page (clicks, taps, or presses a key). TME handles this gracefully:

- Audio initialization is deferred until the first `audio.play()` call
- If the browser blocks playback, TME attempts to resume the audio context on user interaction
- TME does not crash on autoplay rejection — it reports the error locally and allows playback after interaction
- Keyboard, mouse, and touch input handlers automatically resume suspended audio contexts

## Complete Example

```tsl
game "AudioDemo"

start:
    audio.play("audio/bgm/menu.mp3", type="bgm", loop=true)

update(dt):
    if key.down("Space"):
        audio.play("audio/sfx/jump.wav", type="sfx")

    if key.down("M"):
        audio.muted = !audio.muted

    if key.down("P"):
        audio.pause()

    if key.down("R"):
        audio.resume()
```

## API Reference

### `audio.play(path, type, options...)`

Plays an audio file.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Path to the audio file (relative to project root) |
| `type` | string | Yes | `"sfx"` or `"bgm"` |
| `options.loop` | boolean | No | Loop playback (SFX default: false, BGM default: true) |
| `options.volume` | number | No | Per-playback volume override (0..1) |

### `audio.stop()`

Stops BGM and all currently playing SFX. Resets BGM playback position.

### `audio.pause()`

Pauses the current BGM without losing playback position.

### `audio.resume()`

Resumes a paused BGM from the current position.

### `audio.clearCache()`

Releases all cached audio data and closes the audio context.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `audio.volume` | number | Master volume (0..1) |
| `audio.sfxVolume` | number | SFX volume (0..1) |
| `audio.bgmVolume` | number | BGM volume (0..1) |
| `audio.muted` | boolean | Master mute |
