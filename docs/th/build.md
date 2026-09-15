# กระบวนการ Build

## ข้อกำหนด
- มีไดเรกทอรี `TSL/` โคลนจากทางการ
- ไฟล์ `game.tsl`, `index.html` (ต้องมี `<canvas id="game">`), `style.css`

## คำสั่ง
```bash
tme init [dir]      # สร้างเทมเพลตเริ่มต้น
tme build           # คอมไพล์ TSL แพ็กเกจรันไทม์ ส่งออกไป dist/
```

## ผลลัพธ์
```
dist/
├── index.html
├── game.js
├── engine.js
├── style.css
└── <ไฟล์/ไดเรกทอรีของผู้ใช้>
```

## กฎการ Build
- รักษา HTML/CSS ของผู้ใช้ระหว่าง build
- คัดลอกไดเรกทอรีผู้ใช้แบบ recursive พร้อมชื่ออะไรก็ได้
- Export แบบ static — ไม่มี npm dependencies ตอนรันไทม์
- TSL ล้มเหลว = build ล้มเหลว ไม่มีการ fallback
