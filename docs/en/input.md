# Input

## Keyboard

ใช้ฟังก์ชัน `key(key)` ตรวจสอบว่ากดปุ่มอยู่หรือไม่

```javascript
function update(dt):
  # ตรวจสอบว่ากดปุ่มหรือไม่
  if key("ArrowLeft"):
    player.x -= 200 * dt
  if key("ArrowRight"):
    player.x += 200 * dt
  if key(" "):
    # กด spacebar
    player.jumping = true
```

### List of Keys

| Key Name | Description |
|----------|-------------|
| `A-Z` | ตัวอักษร A ถึง Z |
| `0-9` | ตัวเลข 0 ถึง 9 |
| `Space` | Spacebar |
| `Enter` | Enter |
| `Escape` | Esc |
| `Backspace` | Backspace |
| `Tab` | Tab |
| `ArrowUp` | ลูกศรขึ้น |
| `ArrowDown` | ลูกศรลง |
| `ArrowLeft` | ลูกศรซ้าย |
| `ArrowRight` | ลูกศรขวา |
| `Home` | Home |
| `End` | End |
| `PageUp` | Page Up |
| `PageDown` | Page Down |
| `Insert` | Insert |
| `Delete` | Delete |
| `CapsLock` | Caps Lock |
| `NumLock` | Num Lock |
| `ScrollLock` | Scroll Lock |
| `Pause` | Pause |
| `PrintScreen` | Print Screen |
| `Control` or `Ctrl` | Ctrl |
| `Shift` | Shift |
| `Alt` | Alt |
| `Meta` | Meta (Win/Cmd) |
| `Fn` | Fn |
| `Numpad0`-`Numpad9` | ปุ่มตัวเลขบน Keypad |
| `NumpadAdd` | + บน Keypad |
| `NumpadSubtract` | - บน Keypad |
| `NumpadMultiply` | * บน Keypad |
| `NumpadDivide` | / บน Keypad |
| `NumpadDecimal` | . บน Keypad |
| `NumpadEnter` | Enter บน Keypad |

```javascript
function update(dt):
  # ตรวจสอบว่ากดปุ่มหรือไม่
  if key("ArrowLeft"):
    player.x -= 200 * dt
  if key("ArrowRight"):
    player.x += 200 * dt
  if key(" "):
    # กด spacebar
    player.jumping = true
```

### ตัวอย่าง: ย้ายตัวละครด้วย keyboard

```javascript
function update(dt):
  # ย้ายซ้าย/ขวา
  if key("ArrowLeft") or key("a"):
    player.x -= 300 * dt
  if key("ArrowRight") or key("d"):
    player.x += 300 * dt
  
  # กระโดด
  if key(" ") or key("ArrowUp"):
    player.jumping = true
```

### ตัวอย่าง: เกมเลื่อนที่แบบง่าย

```javascript
var player = { x: 100, y: 400, jumping: false, vy: 0 }
var gravity = 1500
var groundY = 450

function update(dt):
  # ย้ายซ้ายขวา
  if key("ArrowLeft"):
    player.x -= 300 * dt
  if key("ArrowRight"):
    player.x += 300 * dt
  
  # กระโดด
  if key(" ") and player.jumping == false:
    player.vy = -600
    player.jumping = true
  
  # คำนวณแรงโน้มถ่วง
  player.vy += gravity * dt
  player.y += player.vy * dt
  
  # ตรวจสอบพื้น
  if player.y >= groundY:
    player.y = groundY
    player.vy = 0
    player.jumping = false

function draw():
  # วาดพื้นหลัง
  rect(0, 0, 800, 600, "#87CEEB")
  
  # วาดพื้น
  rect(0, groundY + 50, 800, 100, "#8B4513")
  
  # วาดตัวละคร
  rect(player.x, player.y, 50, 50, "#FF5733")
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
- `touch.down(0)` — Finger 0 is pressed
- `touch.down(1)` — Finger 1 is pressed
- `touch.down(2)` — Finger 2 is pressed
- `touch.down(3)` — Finger 3 is pressed

```javascript
function update(dt):
  # Check touch (supports up to 4 fingers)
  if touch.down(0):
    # Finger 0 is pressed
    player.x = touch.x(0)
    player.y = touch.y(0)
  
  if touch.down(1):
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
  if touch.down(0):
    tx = touch.x(0)
    ty = touch.y(0)
    if tx > 50 and tx < 130:
      if ty > 500 and ty < 580:
        player.x -= 200 * dt
```
