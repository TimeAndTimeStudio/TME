# Build Process

## Requirements
- `TSL/` directory cloned from official repository.
- `game.tsl`, `index.html` (with `<canvas id="game">`), `style.css`.

## Commands
```bash
tme init [dir]      # Create starter template
tme build           # Compile TSL, package runtime, output to dist/
```

## Output
```
dist/
├── index.html
├── game.js
├── engine.js
├── style.css
└── <user files/directories>
```

## Build Rules
- User HTML/CSS preserved across builds.
- User directories copied recursively with arbitrary names.
- Static export — no npm dependencies at runtime.
- TSL failure causes build failure, not fallback.
