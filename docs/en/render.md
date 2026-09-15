# Rendering

## `rect(x, y, width, height, color, rotation?, scale?, alpha?)`
Draws a filled rectangle with optional transform parameters. Renders via WebGPU with alpha blending enabled.

**Signature:**
```typescript
rect(x: number, y: number, width: number, height: number, color: string, rotation?: number, scale?: number, alpha?: number): void
```

**Parameters:**
- `x` (number): X coordinate of the top-left corner.
- `y` (number): Y coordinate of the top-left corner.
- `width` (number): Width of the rectangle.
- `height` (number): Height of the rectangle.
- `color` (string): Fill color in hex format. Supports `#RRGGBB` or `#RRGGBBAA`.
- `rotation` (number, optional): Rotation angle in degrees. Default `0`.
- `scale` (number, optional): Uniform scale factor, supports decimals. Default `1`. Values less than `1` shrink, greater than `1` enlarge.
- `alpha` (number, optional): Overall opacity from `0` (transparent) to `1` (opaque). Default uses color alpha.

**Default Behavior:**
If transform parameters are omitted, they use default values (rotation: 0, scale: 1, alpha: color alpha). The rectangle renders at full opacity with no rotation or scaling.

**Example:**
```javascript
rect(100, 100, 64, 64, '#FF5733');
rect(200, 200, 50, 50, '#33FF57', 45, 2, 0.5);
```

## `image(src, x, y, width, height, rotation?, scale?, alpha?)`
Loads and draws an image on-demand with optional transform parameters. Images are loaded asynchronously and cached using LRU strategy.

**Signature:**
```typescript
image(src: string, x: number, y: number, width?: number, height?: number, rotation?: number, scale?: number, alpha?: number): void
```

**Parameters:**
- `src` (string): Relative path to the image file (e.g., `'images/player.png'`).
- `x` (number): X coordinate of the top-left corner.
- `y` (number): Y coordinate of the top-left corner.
- `width` (number, optional): Display width. If omitted, uses original image width.
- `height` (number, optional): Display height. If omitted, uses original image height.
- `rotation` (number, optional): Rotation angle in degrees. Default `0`.
- `scale` (number, optional): Uniform scale factor, supports decimals. Default `1`. Values less than `1` shrink, greater than `1` enlarge.
- `alpha` (number, optional): Overall opacity from `0` to `1`. Default `1`.

**Default Behavior:**
If transform parameters are omitted, they use default values (rotation: 0, scale: 1, alpha: 1). The image renders at original size, full opacity, with no rotation.

**Example:**
```javascript
image('images/player.png', 100, 100, 64, 64);
image('images/enemy.png', 200, 150, 90, 1.5, 0.8);
```


