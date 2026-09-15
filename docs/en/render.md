# Rendering

## `rect(x, y, width, height, color, opts?)`
Draws a filled rectangle with optional transform parameters. Renders via WebGPU with alpha blending enabled.

**Signature:**
```typescript
rect(x: number, y: number, width: number, height: number, color: string, opts?: TransformOptions): void
```

**Parameters:**
- `x` (number): X coordinate of the top-left corner.
- `y` (number): Y coordinate of the top-left corner.
- `width` (number): Width of the rectangle.
- `height` (number): Height of the rectangle.
- `color` (string): Fill color in hex format. Supports `#RRGGBB` or `#RRGGBBAA`.
- `opts` (object, optional): Transform options.

**TransformOptions:**
- `rotation` (number): Rotation angle in degrees. Default `0`.
- `scale` (number): Uniform scale factor. Default `1`.
- `alpha` (number): Overall opacity from `0` (transparent) to `1` (opaque). Default `1`.

**Default Behavior:**
If `opts` is omitted or `undefined`, all transforms use default values (rotation: 0, scale: 1, alpha: 1). The rectangle renders at full opacity with no rotation or scaling.

**Example:**
```javascript
rect(100, 100, 64, 64, '#FF5733');
rect(200, 200, 50, 50, '#33FF57', { rotation: 45, scale: 2, alpha: 0.5 });
```

## `image(src, x, y, width, height, opts?)`
Loads and draws an image on-demand with optional transform parameters. Images are loaded asynchronously and cached using LRU strategy.

**Signature:**
```typescript
image(src: string, x: number, y: number, width?: number, height?: number, opts?: TransformOptions): void
image(src: string, x: number, y: number, opts?: TransformOptions): void
```

**Parameters:**
- `src` (string): Relative path to the image file (e.g., `'images/player.png'`).
- `x` (number): X coordinate of the top-left corner.
- `y` (number): Y coordinate of the top-left corner.
- `width` (number, optional): Display width. If omitted, uses original image width.
- `height` (number, optional): Display height. If omitted, uses original image height.
- `opts` (object, optional): Transform options.

**TransformOptions:**
- `rotation` (number): Rotation angle in degrees. Default `0`.
- `scale` (number): Uniform scale factor. Default `1`.
- `alpha` (number): Overall opacity from `0` to `1`. Default `1`.

**Default Behavior:**
If `opts` is omitted or `undefined`, all transforms use default values (rotation: 0, scale: 1, alpha: 1). The image renders at original size, full opacity, with no rotation.

**Example:**
```javascript
image('images/player.png', 100, 100, 64, 64);
image('images/enemy.png', 200, 150, { rotation: 90, scale: 1.5, alpha: 0.8 });
```

## Rendering Rules
- WebGPU only. No Canvas2D or WebGL fallback.
- Draw order determines depth (no z-buffer). Later draws appear on top.
- Images load asynchronously. If an image is not yet loaded, it renders when available.
- Textures are cached using LRU strategy (max 64 textures).
- Resources release automatically when no longer referenced.
- Alpha blending enabled for transparency effects.
