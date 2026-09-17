# TME (Time Mini Engine) — เอกสารภาษาไทย

## ภาพรวม
TME (Time Mini Engine) เป็นเกมเอนจินขนาดเล็กสำหรับสร้างเกม 2D รองรับทั้ง WebGPU และ WebGL สำหรับ rendering มี API สาธารณะสำหรับเรนเดอร์ รับอินพุต จัดการเสียง และควบคุมวงจรชีวิตของเกม ทำงานร่วมกับคอมไพเลอร์ TSL และรันไทม์ TEMF

## การติดตั้ง
```bash
git clone https://github.com/TimeAndTimeStudio/TSL.git
git clone https://github.com/TimeAndTimeStudio/TME.git
cd TME
```

## คำสั่ง TME CLI
คำสั่งที่มีใน `tme/bin/tme`:
- `tme init [project-directory]` — สร้างโปรเจกต์ TME ใหม่
- `tme build [project-directory]` — Build โปรเจกต์
- `tme --version` — แสดงเวอร์ชัน
- `tme --help` — แสดงความช่วยเหลือ

## สถาปัตยกรรม
```
TEMF Runtime
├── lifecycle
├── start()
└── game loop
       |
       v
     TME Engine
     ├── render (WebGPU/WebGL)
     ├── input (keyboard/mouse/touch)
     └── audio
```

- **TME**: ชื่อโปรเจกต์และตัวเอนจินหลัก
- **TEMF**: รันไทม์ที่ทำหน้าที่จัดการวงจรชีวิตและลูปเกม
- **TSL**: คอมไพเลอร์ภายนอกแบบอ่านอย่างเดียว ไฟล์ `game.tsl` จะถูกคอมไพล์โดย TSL ก่อนเริ่ม build
