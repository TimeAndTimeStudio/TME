# TME (Time Mini Engine) — English Documentation

## Overview
TME (Time Mini Engine) is a minimal WebGPU-based game engine designed for lightweight 2D games. It provides a clean public API for rendering, input, audio, and lifecycle management, built on top of the TSL compiler and run by the TEMF runtime.

## Architecture
```
TEMF Runtime
├── lifecycle
├── start()
└── game loop
       |
       v
     TME Engine
     ├── render (WebGPU)
     ├── input (keyboard/mouse/touch)
     └── audio
```

- **TME**: Project name and engine/core.
- **TEMF**: Runtime responsible for lifecycle and game loop.
- **TSL**: External read-only compiler. `game.tsl` is compiled by TSL before build.

## Public API

### `start()`
Initiates the game lifecycle. Before `start()`, no game loop or rendering runs. After `start()`, the engine enters the fixed-timestep update cycle.

### `update(dt)`
Called every frame with delta time. Used for game logic, physics, and state updates.

### `draw()`
Called after `update()`. Queues render commands for WebGPU execution.

### `fps(target)`
Sets the target frame rate for the fixed timestep loop.

## Rendering

### `rect(x, y, width, height, color)`
Draws a filled rectangle. Supports hex colors (e.g., `#FF5733`). Renders via WebGPU with transform support.

### `image(src, x, y, width, height)`
Loads and draws an image on-demand. Supports transforms:
```javascript
image(src, x, y, width, height, {
  rotation: 0,      // radians
  scale: 1,         // uniform or {x, y}
  alpha: 1          // 0 to 1
})
```

### Rendering Rules
- WebGPU only. No Canvas2D or WebGL fallback.
- Draw order determines depth (no z-buffer).
- Images load asynchronously and cache textures using an LRU strategy.
- Resources release automatically when no longer referenced.

## Input

### Keyboard
```javascript
input.keyboard.isDown(key)  // key: 'ArrowUp', 'KeyA', etc.
```

### Mouse
```javascript
input.mouse.x, input.mouse.y
input.mouse.isDown(button)  // 0: left, 1: middle, 2: right
```

### Touch
```javascript
input.touch.x, input.touch.y
input.touch.isDown
```

## Audio

### Unified Audio Object
```javascript
audio.play(src)  // SFX
audio.play(src, { loop: true })  // BGM
audio.volume = 0.5
audio.pause()
audio.resume()
```

## Build Process

### Requirements
- `TSL/` directory cloned from official repository.
- `game.tsl`, `index.html` (with `<canvas id="game">`), `style.css`.

### Commands
```bash
tme init [dir]      # Create starter template
tme build           # Compile TSL, package runtime, output to dist/
```

### Output
```
dist/
├── index.html
├── game.js
├── engine.js
├── style.css
└── <user files/directories>
```

## Resource Policies
- **Image Loading**: On-demand only. No preloading.
- **Memory Management**: Automatic cleanup of textures, buffers, and audio when unreferenced.
- **Static Export**: No npm dependencies at runtime. Self-contained `dist/` package.

## Limitations (MVP)
- No ECS, scenes, cameras, physics, or animation systems.
- No text rendering, UI frameworks, or shader graphs.
- Single touch support for touch input.
- No gamepad or advanced gesture handling.

## GitHub & Deployment
- Push only to: `https://github.com/TimeAndTimeStudio/TME`
- Never push to `game` repository.
- Exclude local docs: `AGENTS.md`, `SPEC.md`, `project.md`, `phase.md`.
- Use official `LICENSE` from repository.
