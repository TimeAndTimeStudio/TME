# การเรนเดอร์

## `rect(x, y, width, height, color, rotation?, scale?, alpha?)`

วาดสี่เหลี่ยมพร้อมการแปลงรูปทรง

```javascript
rect(100, 100, 64, 64, "#FF5733")
rect(200, 200, 50, 50, "#33FF57", 45, 2, 0.5)
# x=200, y=200, กว้าง=50, สูง=50, สี=เขียว, หมุน=45°, ขยาย=2 เท่า, โปร่ง=50%
```

## `image(src, x, y, width?, height?, rotation?, scale?, alpha?)`

โหลดและวาดภาพ

```javascript
image("assets/player.png", 100, 100, 64, 64)
image("assets/sprite.png", 200, 150, 90, 1.5, 0.8)
# src="assets/player.png", x=100, y=100, กว้าง=64, สูง=64
```

## `getCanvasSize()`

ดึงขนาด canvas ปัจจุบัน (รวม DPR)

```javascript
function draw():
  size = getCanvasSize()
  W = size.width
  H = size.height
  # ใช้ W, H ในการคำนวณตำแหน่ง
  rect(0, H-50, W, 50, "brown")
  # วาดพื้นด้านล่างตามขนาดจอ
```
