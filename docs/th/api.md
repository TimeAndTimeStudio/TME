# การตั้งค่าเกม

## `setGame({ update, draw })`

ลงทะเบียน game object พร้อม update() และ draw()

```javascript
function update(dt):
  # dt = เวลาที่ผ่านไปต่อเฟรม (วินาที)
  # ใช้คำนวณ movement, physics
  
  player.x += player.vx * dt
  if player.x > 800:
    player.x = 0

function draw():
  # วาดทุกเฟรม
  rect(0, 0, 800, 600, "#87CEEB")
  rect(player.x, player.y, 50, 50, "#FF5733")

setGame({ update, draw })
```

## `fps(value)`

กำหนด framerate (ค่าเริ่มต้น = 60)

```javascript
fps(60)  # 60 FPS (ค่าเริ่มต้น)
fps(30)  # 30 FPS เพื่อ performance ที่ดีขึ้น
```

# Input

## Mouse

รองรับเมาส์ 3 ปุ่ม:
- `0` = ปุ่มซ้าย (Left Click)
- `1` = ปุ่มกลาง (Middle Click / Scroll Wheel)
- `2` = ปุ่มขวา (Right Click)

```javascript
function draw():
  print(mouse.x, mouse.y)
  
  if mouse.down(0):  # ปุ่มซ้าย
    if mouse.x > 100 and mouse.x < 200:
      if mouse.y > 100 and mouse.y < 150:
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
  if touch.exists(0):  # นิ้วแรก
    player.x = touch.x(0)
    player.y = touch.y(0)
  
  if touch.exists(1):  # นิ้วสอง (Multi-Touch)
    fireBullet(touch.x(1), touch.y(1))
```
