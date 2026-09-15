# TME — Time Mini Engine

**TME (Time Mini Engine)** is a minimal WebGPU game engine framework.  
**TEMF (Time Engine Mini Fast)** is the runtime that executes TME games.

## Overview

TME provides a lightweight, WebGPU-only rendering and input system for browser-based games. Games are written in TSL (Time Script Language), compiled by the TSL compiler, and executed by the TEMF runtime.

## Features

- **WebGPU Rendering** — `rect()` and `image()` with rotation, scale, and alpha transforms
- **Texture Management** — On-demand loading, LRU cache (max 64 textures), automatic eviction
- **Input System** — Keyboard, mouse (with button support), and touch (single-touch)
- **Unified Audio API** — SFX (stackable) and BGM (single track) with volume and mute controls
- **Fixed Timestep Game Loop** — Frame-rate independent updates via `start()` and `fps()`
- **Static Export** — Self-contained `dist/` output, no runtime dependencies

## Quick Start

### Prerequisites

- Node.js 18+
- WebGPU-enabled browser (Chrome 113+, Edge 113+)

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

## Project Structure

```
project/
├── game.tsl         # Game source (TSL)
├── index.html       # HTML page (user-owned)
├── style.css        # CSS styles (user-owned)
├── <directories>/   # User assets (copied recursively)
└── dist/            # Build output
    ├── index.html
    ├── game.js      # Compiled game code
    ├── engine.js    # TEMF runtime
    └── style.css
```

## Game Loop

TME uses a fixed timestep game loop. The update rate is independent of the display refresh rate:

```tsl
game "MyGame"

speed = 200

update(dt):
    if key.down("D"):
        x += speed * dt

draw:
    rect(x, 100, 64, 64, "#ff0000")
```

### Lifecycle

- `start()` — Explicit entry point. Nothing runs before this call.
- `fps(n)` — Configures the fixed update rate (default: 60).
- `update(dt)` — Receives fixed delta time (e.g., 0.01667 for 60fps).
- `draw` — Runs at the browser's animation frame rate via `requestAnimationFrame()`.

## Rendering API

### `rect(x, y, width, height, color, rotation?, scale?, alpha?)`

Draws a filled rectangle with optional transforms.

```javascript
rect(100, 100, 64, 64, '#FF5733');
rect(100, 100, 64, 64, '#FF5733', 45, 2, 0.5);
```

**Parameters:**
- `x, y` — Top-left corner coordinates
- `width, height` — Dimensions
- `color` — Hex color (`#RRGGBB` or `#RRGGBBAA`)
- `rotation` — Angle in degrees (default: 0)
- `scale` — Uniform scale factor (default: 1)
- `alpha` — Opacity 0–1 (default: color alpha)

### `image(src, x, y, width, height, rotation?, scale?, alpha?)`

Loads and draws an image on-demand with optional transforms.

```javascript
image('images/player.png', 100, 100, 64, 64);
image('images/player.png', 100, 100, 64, 64, 90, 1.5, 0.8);
```

**Parameters:**
- `src` — Relative path to image file
- `x, y, width, height` — Position and dimensions
- `rotation, scale, alpha` — Same as `rect()`

## Input API

### Keyboard

```javascript
key.down("A")        // Returns true while key is held
key.down("SPACE")    // Special keys: SPACE, ENTER, ESC, TAB, CTRL, SHIFT, ALT
key.down("F1")       // Function keys: F1–F12
key.down("1")        // Number keys: 0–9
```

### Mouse

```javascript
mouse.x              // Current X position
mouse.y              // Current Y position
mouse.down()         // True while any button is held
mouse.click()        // True on click frame
mouse.drag()         // True while dragging
mouse.x, mouse.y     // Coordinates
```

**Button support (number only):**
```javascript
mouse.down(0)        // Left button
mouse.down(1)        // Middle button
mouse.down(2)        // Right button
```

### Touch

```javascript
touch.x              // Current X position
touch.y              // Current Y position
touch.down           // True while touching
touch.tapped         // True on tap frame
touch.dragging       // True while dragging
```

## Audio API

### Playback

```javascript
// SFX (stackable, short sounds)
audio.play("sfx/jump.wav", "sfx");

// BGM (single track, loops by default)
audio.play("bgm/theme.mp3", "bgm", true);
```

### Controls

```javascript
audio.volume         // Master volume (0–1)
audio.sfxVolume      // SFX volume (0–1)
audio.bgmVolume      // BGM volume (0–1)

audio.muted          // Master mute
audio.mutedSfx       // Mute SFX only
audio.mutedBgm       // Mute BGM only

audio.stop("bgm")    // Stop BGM
audio.pause()        // Pause BGM
audio.resume()       // Resume BGM
```

## Build System

### Commands

- `tme init [dir]` — Create a new project template
- `tme build [dir]` — Compile and package the project

### Build Process

1. Validates `index.html` contains `<canvas id="game">`
2. Compiles `game.tsl` via TSL compiler
3. Packages TEMF runtime and TME engine
4. Preserves user HTML/CSS without modification
5. Recursively copies user directories to `dist/`
6. Outputs static `dist/` package

### Build Rules

- User files (`index.html`, `style.css`, assets) are never overwritten
- Build fails explicitly on missing inputs or TSL errors
- No npm dependencies at runtime
- Static export runs in any browser

## Resource Management

### Texture Cache

- LRU eviction (max 64 textures)
- On-demand async loading
- Automatic eviction when full

### Cleanup

```javascript
TEMF.cleanupTextures()   // Release all GPU textures
TEMF.cleanupAudio()      // Release all audio resources
```

## License

GPL-3.0
