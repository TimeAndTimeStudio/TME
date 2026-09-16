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

# Input

## Mouse

Supports 3 mouse buttons:
- `0` = Left Button (Left Click)
- `1` = Middle Button (Scroll Wheel)
- `2` = Right Button (Right Click)

```javascript
function draw():
  print(mouse.x, mouse.y)
  
  if mouse.down(0):  # Left button
    if mouse.x > 100 and mouse.x < 200:
      if mouse.y > 100 and mouse.y < 150:
        startGame()
  
  if mouse.down(2):  # Right button
    print("Right click detected")
```

## Touch

Supports up to 4 fingers simultaneously (Multi-Touch):
- `touch.exists(0)` — Finger 0 is pressed
- `touch.exists(1)` — Finger 1 is pressed
- `touch.exists(2)` — Finger 2 is pressed
- `touch.exists(3)` — Finger 3 is pressed

```javascript
function update(dt):
  if touch.exists(0):  # First finger
    player.x = touch.x(0)
    player.y = touch.y(0)
  
  if touch.exists(1):  # Second finger (Multi-Touch)
    fireBullet(touch.x(1), touch.y(1))
```
