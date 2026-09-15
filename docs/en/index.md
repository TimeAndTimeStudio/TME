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
