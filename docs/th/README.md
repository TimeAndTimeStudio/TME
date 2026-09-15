# TME (Time Mini Engine) — เอกสารภาษาไทย

## ภาพรวม
TME (Time Mini Engine) เป็นเกมเอนจินขนาดเล็กที่ใช้ WebGPU สำหรับเกม 2D ออกแบบมาเพื่อให้ความง่ายและประสิทธิภาพ มี API สาธารณะสำหรับเรนเดอร์ รับอินพุต จัดการเสียง และควบคุมวงจรชีวิตของเกม ทำงานร่วมกับคอมไพเลอร์ TSL และรันไทม์ TEMF

## สถาปัตยกรรม
```
TEMF Runtime
├── lifecycle
├── start()
└── game loop
       |
       v
     TME Engine
     ├── render (WebGPU)
     ├── input (keyboard/mouse/touch)
     └── audio
```

- **TME**: ชื่อโปรเจกต์และตัวเอนจินหลัก
- **TEMF**: รันไทม์ที่ทำหน้าที่จัดการวงจรชีวิตและลูปเกม
- **TSL**: คอมไพเลอร์ภายนอกแบบอ่านอย่างเดียว ไฟล์ `game.tsl` จะถูกคอมไพล์โดย TSL ก่อนเริ่ม build

## API สาธารณะ

### `start()`
เริ่มวงจรชีวิตของเกม ก่อนเรียก `start()` จะไม่มี game loop หรือการเรนเดอร์ หลังเรียกแล้วเอนจินจะเข้าสู่ลูป fixed-timestep

### `update(dt)`
เรียกทุกเฟรมพร้อมค่า delta time ใช้สำหรับลอจิกเกม ฟิสิกส์ และการอัปเดตสถานะ

### `draw()`
เรียกหลัง `update()` คิวคำสั่งเรนเดอร์ทั้งหมดเพื่อส่งไปยัง WebGPU

### `fps(target)`
ตั้งค่าอัตราเฟรมเป้าหมายสำหรับลูป fixed timestep

## การเรนเดอร์

### `rect(x, y, width, height, color)`
วาดสี่เหลี่ยมเติมเต็ม รองรับสีรูปแบบ hex เช่น `#FF5733` เรนเดอร์ผ่าน WebGPU พร้อมรองรับการแปลงรูปทรง

### `image(src, x, y, width, height)`
โหลดและวาดภาพแบบขอใช้เมื่อจำเป็น รองรับ transformation:
```javascript
image(src, x, y, width, height, {
  rotation: 0,      // เรเดียน
  scale: 1,         // ค่าเดียวหรือ {x, y}
  alpha: 1          // 0 ถึง 1
})
```

### กฎการเรนเดอร์
- ใช้ WebGPU เท่านั้น ไม่มี Canvas2D หรือ WebGL รองรับ
- ลำดับการวาดกำหนดความลึก (ไม่มี z-buffer)
- โหลดภาพแบบ asynchronous และเก็บเท็กซ์เจอร์ใน LRU cache
- ทรัพยากรจะถูกลบอัตโนมัติเมื่อไม่มีการอ้างอิงถึง

## อินพุต

### คีย์บอร์ด
```javascript
input.keyboard.isDown(key)  // key: 'ArrowUp', 'KeyA', ฯลฯ
```

### เมาส์
```javascript
input.mouse.x, input.mouse.y
input.mouse.isDown(button)  // 0: ซ้าย, 1: กลาง, 2: ขวา
```

### หน้าจอสัมผัส
```javascript
input.touch.x, input.touch.y
input.touch.isDown
```

## เสียง

### Audio Object แบบรวม
```javascript
audio.play(src)  // SFX
audio.play(src, { loop: true })  // BGM
audio.volume = 0.5
audio.pause()
audio.resume()
```

## กระบวนการ Build

### ข้อกำหนด
- มีไดเรกทอรี `TSL/` โคลนจากทางการ
- ไฟล์ `game.tsl`, `index.html` (ต้องมี `<canvas id="game">`), `style.css`

### คำสั่ง
```bash
tme init [dir]      # สร้างเทมเพลตเริ่มต้น
tme build           # คอมไพล์ TSL แพ็กเกจรันไทม์ ส่งออกไป dist/
```

### ผลลัพธ์
```
dist/
├── index.html
├── game.js
├── engine.js
├── style.css
└── <ไฟล์/ไดเรกทอรีของผู้ใช้>
```

## นโยบายทรัพยากร
- **โหลดภาพ**: โหลดเมื่อจำเป็นเท่านั้น ไม่มีการโหลดล่วงหน้า
- **จัดการหน่วยความจำ**: ลบเท็กซ์เจอร์ บัฟเฟอร์ และเสียงอัตโนมัติเมื่อไม่มีการอ้างอิง
- **Export แบบ Static**: ไม่มี npm dependencies ตอนรันไทม์ แพ็กเกจ `dist/` ทำงานได้เอง

## ข้อจำกัด (MVP)
- ไม่มี ECS, ฉาก, กล้อง, ฟิสิกส์, หรือระบบแอนิเมชัน
- ไม่มีตัวพิมพ์ UI framework หรือ shader graph
- รองรับหน้าจอสัมผัสเพียงจุดเดียว
- ไม่มีเกมแพดหรือ gesture ขั้นสูง

## GitHub และการเผยแพร่
- Push ได้เฉพาะ: `https://github.com/TimeAndTimeStudio/TME`
- ห้าม push ไปยัง repository `game`
- ไม่รวมเอกสารภายใน: `AGENTS.md`, `SPEC.md`, `project.md`, `phase.md`
- ใช้ไฟล์ `LICENSE` ทางการจาก repository
