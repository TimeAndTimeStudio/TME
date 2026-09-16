# TME — Time Mini Engine

**TME (Time Mini Engine)** is a minimal WebGPU game engine framework.  
**TEMF (Time Engine Mini Fast)** is the runtime that executes TME games.

**Live Demo**: [https://tme.timeandtime.online/](https://tme.timeandtime.online/)

## Overview

TME provides a lightweight, WebGPU-only rendering and input system for browser-based games. Games are written in TSL (Time Script Language), compiled by the TSL compiler, and executed by the TEMF runtime.

## Features

- **WebGPU Rendering** — `rect()` and `image()` with rotation, scale, and alpha transforms
- **Texture Management** — On-demand loading, LRU cache (max 64 textures), automatic eviction
- **Input System** — Keyboard, mouse (with button support), and touch (up to 4 fingers)
- **Unified Audio API** — SFX (stackable) and BGM (single track) with volume and mute controls
- **Fixed Timestep Game Loop** — Frame-rate independent updates via `setGame()` and `fps()`
- **Fullscreen API** — `requestFullscreen()`, `exitFullscreen()`, and exit callbacks
- **Responsive Canvas** — `getCanvasSize()` for dynamic sizing with DPR support
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

## Examples

| Example | Description |
|---------|-------------|
| [Jump Game](examples/jump-game/) | Simple jumping game with keyboard control |

## Documentation

| Resource | Link |
|----------|------|
| **Live Demo** | [https://tme.timeandtime.online/](https://tme.timeandtime.online/) |
| **Interactive Docs** | [docs.html](website/docs.html) |
| **English Docs** | [docs/en/](docs/en/) |
| **Thai Docs** | [docs/th/](docs/th/) |
| **API Reference** | [docs/en/api.md](docs/en/api.md) |
| **Rendering** | [docs/en/render.md](docs/en/render.md) |
| **Input** | [docs/en/input.md](docs/en/input.md) |
| **Audio** | [docs/en/audio.md](docs/en/audio.md) |
| **Fullscreen** | [docs/en/fullscreen-api.md](docs/en/fullscreen-api.md) |
| **Build** | [docs/en/build.md](docs/en/build.md) |

## License

GPL-3.0
