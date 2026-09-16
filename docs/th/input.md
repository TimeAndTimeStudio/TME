# Input

## Keyboard

```javascript
function update(dt):
  # ตรวจสอบว่ากดปุ่มหรือไม่
  if input.keyboard.is_down("ArrowLeft"):
    player.x -= 200 * dt
  if input.keyboard.is_down("ArrowRight"):
    player.x += 200 * dt
  if input.keyboard.is_down(" "):
    # กด spacebar
    player.jumping = true
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
- `touch.exists(0)` — นิ้วที่ 0 กดอยู่
- `touch.exists(1)` — นิ้วที่ 1 กดอยู่
- `touch.exists(2)` — นิ้วที่ 2 กดอยู่
- `touch.exists(3)` — นิ้วที่ 3 กดอยู่

```javascript
function update(dt):
  # ตรวจสอบ touch (รองรับหลายนิ้วสูงสุด 4 นิ้ว)
  if touch.exists(0):
    # นิ้วที่ 0 กดอยู่
    player.x = touch.x(0)
    player.y = touch.y(0)
  
  if touch.exists(1):
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
  if touch.exists(0):
    tx = touch.x(0)
    ty = touch.y(0)
    if tx > 50 and tx < 130:
      if ty > 500 and ty < 580:
        player.x -= 200 * dt
```
