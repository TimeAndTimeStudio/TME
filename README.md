# TME — Time Mini Engine

**TME (Time Mini Engine)** is a minimal 2D game engine for the web.  
**TEMF (Time Engine Mini Fast)** is the runtime that executes TME games.  
**TSL (Time Script Language)** is the lightweight scripting language used to write games.

**Official Website**: [https://tme.timeandtime.online/](https://tme.timeandtime.online/)

---

## Overview

TME provides a lightweight, WebGPU-first rendering and input system for browser-based games. Games are written in TSL, compiled by the TSL compiler, and executed by the TEMF runtime.

### Features

- **WebGPU & WebGL Rendering** — `rect()` and `image()` with rotation, scale, and alpha transforms
- **Texture Management** — On-demand loading, LRU cache (max 64 textures), automatic eviction
- **Input System** — Keyboard, mouse (with button support), and touch (up to 4 fingers)
- **Unified Audio API** — SFX (stackable) and BGM (single track) with volume and mute controls
- **Fixed Timestep Game Loop** — Frame-rate independent updates via `setGame()` and `fps()`
- **Fullscreen API** — `requestFullscreen()`, `exitFullscreen()`, and exit callbacks
- **Responsive Canvas** — `getCanvasSize()` for dynamic sizing with DPR support
- **Tab Switch Detection** — `hasTabSwitched()` to detect when users switch tabs
- **Preload System** — Load images and audio assets before gameplay
- **Static Export** — Self-contained `dist/` output, no runtime dependencies

---

## Quick Start

### Prerequisites

- Node.js 18+
- WebGPU-enabled browser (Chrome 113+, Edge 113+) or WebGL fallback

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

---

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

---

## TSL Example

### Thai (ภาษาไทย)

```tsl
# game.tsl — ตัวอย่างเกมกระโดด

background = "#87CEEB"
player_x = 100
player_y = 200
gravity = 0.5
jump_force = -10
on_ground = true

function update(dt):
  # ตรวจสอบการกด space เพื่อกระโดด
  if key.pressed("space") and on_ground:
    player_y += jump_force
    on_ground = false

  # ใช้แรงโน้มถ่วง
  if not on_ground:
    player_y += gravity
    dt = dt

  # ตรวจสอบพื้น
  if player_y >= 200:
    player_y = 200
    on_ground = true

function draw():
  rect(player_x, player_y, 50, 50, "#FF5733")
```

### English

```tsl
# game.tsl — Jump game example

background = "#87CEEB"
player_x = 100
player_y = 200
gravity = 0.5
jump_force = -10
on_ground = true

function update(dt):
  # Check space press to jump
  if key.pressed("space") and on_ground:
    player_y += jump_force
    on_ground = false

  # Apply gravity
  if not on_ground:
    player_y += gravity
    dt = dt

  # Check ground collision
  if player_y >= 200:
    player_y = 200
    on_ground = true

function draw():
  rect(player_x, player_y, 50, 50, "#FF5733")
```

---

## API Reference

### Render

- **`rect(x, y, width, height, color, rotation?, scale?, alpha?)`** — Draw a rectangle with transforms
- **`image(src, x, y, rotation?, scale?, alpha?, cropX?, cropY?, cropEndX?, cropEndY?)`** — Load and draw images with cropping
- **`getCanvasSize()`** — Get current canvas size (including DPR)

### Input

- **`key.pressed(key)`** — Check if a key is currently pressed
- **`touch.down(index)`** — Check if touch point is active
- **`touch.x(index)`, `touch.y(index)`** — Get touch coordinates

### Audio

- **`audio.play(path, type, loop?)`** — Play audio (loop only works with "bgm" type)
- **`audio.stop(type?)`** — Stop SFX/BGM
- **`audio.pause()`, `audio.resume()`** — Pause/resume BGM
- **`audio.volume`, `audio.sfxVolume`, `audio.bgmVolume`** — Volume controls
- **`audio.mutedSfx`, `audio.mutedBgm`** — Mute controls

### Game Loop

- **`setGame({update, draw})`** — Register game functions
- **`fps(framesPerSecond)`** — Set target frame rate

### Fullscreen API

- **`requestFullscreen()`** — Enter fullscreen mode
- **`exitFullscreen()`** — Exit fullscreen mode
- **`setFullscreenCallback(callback)`** — Set fullscreen change callback

### Visibility

- **`hasTabSwitched(reset?)`** — Returns `true` if user switched tabs. Pass `false` to reset.

### Preload

- **`preload(paths)`** — Load images and audio assets before gameplay
- **`checkpreload(reset?)`** — Check if preloading is complete. Pass `false` to reset.

### Unload

- **`unload(path)`** — Unload loaded images or BGM to free memory (cannot unload SFX)

---

## CLI Commands

```bash
node tme/bin/tme init [project-directory]   # Initialize a new project
node tme/bin/tme build [project-directory]  # Build the project
node tme/bin/tme --version                  # Show version
node tme/bin/tme --help                     # Show help
```

---

## Documentation

- **Interactive Docs**: [docs.html](website/docs.html)
- **Official Website**: [https://tme.timeandtime.online/](https://tme.timeandtime.online/)

---

## License

GPL-3.0
