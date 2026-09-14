# TME — Time Mini Engine

**TME (Time Mini Engine)** is a minimal WebGPU game engine framework.

**TEMF (Time Engine Mini Fast)** is the runtime that runs TME games.

## Features

- WebGPU rendering only (no Canvas2D/WebGL fallback)
- Rectangle and image rendering
- Keyboard, mouse, and touch input
- Fixed timestep game loop
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

## Project Structure

```
project/
├── game.tsl        # Game source (TSL)
├── index.html      # HTML page (user-owned)
├── style.css       # CSS styles (user-owned)
└── dist/           # Build output
    ├── index.html
    ├── game.js     # Compiled game code
    ├── engine.js   # TEMF runtime
    └── style.css
```

## License

GPL-3.0
