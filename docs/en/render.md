# Rendering

## `rect(x, y, width, height, color, rotation?, scale?, alpha?)`

Draw a rectangle with optional transforms.

```javascript
rect(100, 100, 64, 64, "#FF5733")
rect(200, 200, 50, 50, "#33FF57", 45, 2, 0.5)
# x=200, y=200, width=50, height=50, color=green, rotation=45°, scale=2x, alpha=50%
```

## `image(src, x, y, width?, height?, rotation?, scale?, alpha?)`

Load and draw an image.

```javascript
image("assets/player.png", 100, 100, 64, 64)
image("assets/sprite.png", 200, 150, 90, 1.5, 0.8)
# src="assets/player.png", x=100, y=100, width=64, height=64
```

## `getCanvasSize()`

Get current canvas size (including DPR).

```javascript
function draw():
  size = getCanvasSize()
  W = size.width
  H = size.height
  # Use W, H for positioning
  rect(0, H-50, W, 50, "brown")
  # Draw ground at bottom of screen
```
