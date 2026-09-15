# TME — Time Mini Engine

**TME (Time Mini Engine)** is a minimal WebGPU game engine framework.

**TEMF (Time Engine Mini Fast)** is the runtime that runs TME games.

## Features

- WebGPU rendering only (no Canvas2D/WebGL fallback)
- Rectangle (`rect()`) and image (`image()`) rendering with correct draw order
- Texture caching with LRU eviction and bounded cache size
- Async texture loading with pending draw queue
- Keyboard, mouse, and touch input (tap, down, drag, up)
- Unified audio API with Sound Effects (SFX) and Background Music (BGM)
- Audio volume controls (master, SFX, BGM) and mute
- Audio looping for both SFX and BGM
- BGM pause, resume, and stop
- Audio caching to avoid repeated decoding
- Audio cache cleanup via `audio.clearCache()`
- Fixed timestep game loop with `start()`, `fps`, `update(dt)`, and `draw`
- Frame-rate independent movement (speed * dt)
- Spiral of death prevention (elapsed time clamped to 0.25s)
- Automatic SFX node cleanup
- Resource cleanup via `TEMF.cleanupTextures()` and `TEMF.cleanupAudio()`
- Static web export
- TSL (Time Script Language) compilation via Build Program

## Quick Start

### Prerequisites

- Node.js 18+
- A browser with WebGPU support (Chrome 113+, Edge 113+)

### Installation

```bash
git clone https://github.com/TimeAndTimeStudio/TME.git
cd TME
git clone https://github.com/TimeAndTimeStudio/TSL.git TSL
```

### Create a Project

```bash
node tme/bin/tme init my-game
cd my-game
```

### Build

```bash
node ../tme/bin/tme build
```

### Run

Open `dist/index.html` in a WebGPU-enabled browser.

## Game Loop

TME uses a fixed timestep game loop. The update rate is independent of the display refresh rate:

```tsl
game "Demo"

x = 0

update(dt):
    x += 100 * dt

draw:
    rect(x, 100, 100, 100, "#ff0000")
```

- `start()` is the explicit entry point — nothing runs before it
- `fps` configures the fixed update rate (default: 60)
- `update(dt)` receives a fixed delta time (e.g., 0.01667 for 60fps)
- `draw()` runs at the browser's animation frame rate via `requestAnimationFrame()`

## Audio API

TME provides a unified `audio` object for both Sound Effects (SFX) and Background Music (BGM):

```tsl
game "AudioDemo"

start:
    audio.play("audio/bgm/theme.mp3", type="bgm", loop=true)

update(dt):
    if key.down("Space"):
        audio.play("audio/sfx/jump.wav", type="sfx")
```

### Audio Controls

```tsl
audio.volume      # Master volume (0..1)
audio.sfxVolume   # SFX volume (0..1)
audio.bgmVolume   # BGM volume (0..1)
audio.muted       # Master mute (true/false)
```

### BGM Controls

```tsl
audio.pause()   # Pause BGM (preserves position)
audio.resume()  # Resume BGM from pause
audio.stop()    # Stop BGM (resets position)
```

### Audio Caching

Audio files are cached after first load. Repeated playback of the same file reuses the cached decoded audio data.

Call `audio.clearCache()` to release all audio resources.

## Resource Management

TME provides cleanup methods to minimize RAM usage:

```js
// Clean up texture cache (destroys GPU textures)
TEMF.cleanupTextures()

// Clean up audio cache and context
TEMF.cleanupAudio()
```

The texture cache uses LRU eviction with a default maximum of 64 textures. When the cache is full, the least recently used texture is evicted.

## Project Structure

```
project/
├── game.tsl        # Game source (TSL)
├── index.html      # HTML page (user-owned)
├── style.css       # CSS styles (user-owned)
├── assets/         # User-created directories (copied recursively)
│   └── images/
│       └── player.png
└── dist/           # Build output
    ├── index.html
    ├── game.js     # Compiled game code
    ├── engine.js   # TEMF runtime
    ├── style.css
    └── assets/
        └── images/
            └── player.png
```

## Build Behavior

- `tme build` compiles `game.tsl` via TSL, packages the TEMF runtime, and preserves all user files
- User `index.html` and `style.css` are never overwritten during builds
- All user-created directories and files are recursively copied to `dist/` preserving their relative paths
- `node_modules`, `.git`, and `dist` are excluded from the copy process
- Build fails explicitly if required outputs (`game.js`, `engine.js`) or user files are missing

## License

GPL-3.0
