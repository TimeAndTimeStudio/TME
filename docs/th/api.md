# การตั้งค่าเกม

## `setGame({ update: update, draw: draw })`

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

setGame({ update: update, draw: draw })
```

## `fps(value)`

กำหนด framerate (ค่าเริ่มต้น = 60)

```javascript
fps(60)  # 60 FPS (ค่าเริ่มต้น)
fps(30)  # 30 FPS เพื่อ performance ที่ดีขึ้น
```
