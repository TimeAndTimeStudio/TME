# Build

## Commands

```bash
cd /path/to/TME
node tme/bin/tme build
```

## Output

```
dist/
├── index.html
├── game.js
├── engine.js
├── style.css
└── assets/
```

## Important Rules

- WebGPU only — no fallback
- index.html must have canvas#game
- style.css is user-owned — build does not overwrite
