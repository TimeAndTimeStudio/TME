# TME (Time Mini Engine) — English Documentation

## Overview
TME (Time Mini Engine) is a minimal game engine designed for lightweight 2D games. It supports both WebGPU and WebGL for rendering. It provides a clean public API for rendering, input, audio, and lifecycle management, built on top of the TSL compiler and run by the TEMF runtime.

## Installation
```bash
git clone https://github.com/TimeAndTimeStudio/TME.git
cd TME
git clone https://github.com/TimeAndTimeStudio/TSL.git
```

## TME CLI Commands
Available commands in `tme/bin/tme`:
- `tme init [project-directory]` — Initialize a new TME project
- `tme build [project-directory]` — Build the project
- `tme --version` — Show version
- `tme --help` — Show help

## Architecture
```
TEMF Runtime
├── lifecycle
├── start()
└── game loop
       |
       v
     TME Engine
     ├── render (WebGPU/WebGL)
     ├── input (keyboard/mouse/touch)
     └── audio
```

- **TME**: Project name and engine/core.
- **TEMF**: Runtime responsible for lifecycle and game loop.
- **TSL**: External read-only compiler. `game.tsl` is compiled by TSL before build.
