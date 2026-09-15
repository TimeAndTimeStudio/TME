# Rendering

## `rect(x, y, width, height, color)`
Draws a filled rectangle. Supports hex colors (e.g., `#FF5733`). Renders via WebGPU with transform support.

## `image(src, x, y, width, height)`
Loads and draws an image on-demand. Supports transforms:
```javascript
image(src, x, y, width, height, {
  rotation: 0,      // radians
  scale: 1,         // uniform or {x, y}
  alpha: 1          // 0 to 1
})
```

## Rendering Rules
- WebGPU only. No Canvas2D or WebGL fallback.
- Draw order determines depth (no z-buffer).
- Images load asynchronously and cache textures using an LRU strategy.
- Resources release automatically when no longer referenced.
