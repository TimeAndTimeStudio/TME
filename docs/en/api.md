# Game Setup

## `setGame({ update, draw })`

Register the game object with update() and draw() functions.

```javascript
function update(dt):
  # dt = time elapsed per frame (seconds)
  # Use for movement, physics calculations
  
  player.x += player.vx * dt
  if player.x > 800:
    player.x = 0

function draw():
  # Draw every frame
  rect(0, 0, 800, 600, "#87CEEB")
  rect(player.x, player.y, 50, 50, "#FF5733")

setGame({ update, draw })
```

## `fps(value)`

Set the framerate (default = 60).

```javascript
fps(60)  # 60 FPS (default)
fps(30)  # 30 FPS for better performance
```
