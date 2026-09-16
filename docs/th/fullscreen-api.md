# Fullscreen API

ระบบจัดการโหมดเต็มหน้าจอและ callback เมื่อออกจาก fullscreen

## getCanvasSize()

ดึงขนาดปัจจุบันของ canvas (รวม DPR)

```javascript
function draw():
  size = getCanvasSize()
  W = size.width
  H = size.height
  # ใช้ W, H ในการคำนวณตำแหน่ง
  rect(0, H-50, W, 50, "brown")
```

## requestFullscreen()

เข้าสู่โหมดเต็มหน้าจอ

```javascript
# กดปุ่ม F11
if input.keyboard.is_down("f11"):
  requestFullscreen()
```

## exitFullscreen()

ออกจากโหมดเต็มหน้าจอ

```javascript
# กด ESC (browser ทำให้อัตโนมัติ)
# หรือกดปุ่มบนจอ
if input.keyboard.is_down("escape"):
  exitFullscreen()
```

## setFullscreenCallback()

ลงทะเบียนฟังก์ชันเมื่อออกจาก fullscreen

```javascript
function onFullscreenExit():
  print("ออกจาก fullscreen!")
  # ทำอย่างอื่น เช่น pause game

setFullscreenCallback(onFullscreenExit)
```

### ตัวอย่าง: แสดงเมนูเมื่อออกจาก fullscreen

```javascript
fullscreenMenu = { visible: false }

function onExitFullscreen():
  fullscreenMenu.visible = true

setFullscreenCallback(onExitFullscreen)

function draw():
  if fullscreenMenu.visible:
    # วาดเมนู
    rect(0, 0, 800, 600, "rgba(0,0,0,0.8)")
    text("กด Enter เพื่อกลับเข้าเกม", 100, 300)
    
    if input.keyboard.is_down("enter"):
      fullscreenMenu.visible = false
      requestFullscreen()
```
