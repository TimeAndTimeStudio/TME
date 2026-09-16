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

### ตัวอย่าง: เกมกระโดดแบบง่าย

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

รองรับเมาส์ 3 ปุ่ม:
- `0` = ปุ่มซ้าย (Left Click)
- `1` = ปุ่มกลาง (Middle Click / Scroll Wheel)
- `2` = ปุ่มขวา (Right Click)

```javascript
function draw():
  # ตำแหน่งเมาส์
  print(mouse.x, mouse.y)
  
  # ตรวจสอบการคลิก
  if mouse.down(0):  # ปุ่มซ้าย
    # คลิกซ้าย
    if mouse.x > 100 and mouse.x < 200:
      if mouse.y > 100 and mouse.y < 150:
        # คลิกที่ปุ่ม
        startGame()
  
  if mouse.down(2):  # ปุ่มขวา
    print("Right click detected")
```

## Touch

รองรับสูงสุด 4 นิ้ว พร้อมกัน (Multi-Touch):
- `touch.down(0)` — นิ้วที่ 0 กดอยู่
- `touch.down(1)` — นิ้วที่ 1 กดอยู่
- `touch.down(2)` — นิ้วที่ 2 กดอยู่
- `touch.down(3)` — นิ้วที่ 3 กดอยู่

```javascript
function update(dt):
  # ตรวจสอบ touch (รองรับหลายนิ้วสูงสุด 4 นิ้ว)
  if touch.down(0):
    # นิ้วที่ 0 กดอยู่
    player.x = touch.x(0)
    player.y = touch.y(0)
  
  if touch.down(1):
    # นิ้วที่ 1 กดอยู่ (multi-touch)
    fireBullet(touch.x(1), touch.y(1))
```

### ตัวอย่าง: ปุ่มบนจอสำหรับ mobile

```javascript
function draw():
  # วาดปุ่มซ้าย
  rect(50, 500, 80, 80, "rgba(255,255,255,0.3)")
  text("◀", 60, 520)
  
  # วาดปุ่มขวา
  rect(670, 500, 80, 80, "rgba(255,255,255,0.3)")
  text("▶", 680, 520)
  
  # ตรวจสอบ touch ที่ปุ่ม
  if touch.down(0):
    tx = touch.x(0)
    ty = touch.y(0)
    if tx > 50 and tx < 130:
      if ty > 500 and ty < 580:
        player.x -= 200 * dt
```
