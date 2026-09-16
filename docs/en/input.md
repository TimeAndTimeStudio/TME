# Input

## Keyboard

```javascript
function update(dt):
  # Check if a key is pressed
  if input.keyboard.is_down("ArrowLeft"):
    player.x -= 200 * dt
  if input.keyboard.is_down("ArrowRight"):
    player.x += 200 * dt
  if input.keyboard.is_down(" "):
    # Spacebar pressed
    player.jumping = true
```

## Mouse

Supports 3 mouse buttons:
- `0` = Left Button (Left Click)
- `1` = Middle Button (Scroll Wheel)
- `2` = Right Button (Right Click)

```javascript
function draw():
  # Mouse position
  print(mouse.x, mouse.y)
  
  # Check for clicks
  if mouse.down(0):  # Left button
    # Left click
    if mouse.x > 100 and mouse.x < 200:
      if mouse.y > 100 and mouse.y < 150:
        # Clicked on button
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
  # Check touch (supports up to 4 fingers)
  if touch.exists(0):
    # Finger 0 is pressed
    player.x = touch.x(0)
    player.y = touch.y(0)
  
  if touch.exists(1):
    # Finger 1 is pressed (multi-touch)
    fireBullet(touch.x(1), touch.y(1))
```

### Example: On-screen buttons for mobile

```javascript
function draw():
  # Draw left button
  rect(50, 500, 80, 80, "rgba(255,255,255,0.3)")
  text("◀", 60, 520)
  
  # Draw right button
  rect(670, 500, 80, 80, "rgba(255,255,255,0.3)")
  text("▶", 680, 520)
  
  # Check touch on button
  if touch.exists(0):
    tx = touch.x(0)
    ty = touch.y(0)
    if tx > 50 and tx < 130:
      if ty > 500 and ty < 580:
        player.x -= 200 * dt
```
