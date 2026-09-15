# เสียง

TME มีวัตถุ `audio` แบบรวมสำหรับเอฟเฟกต์เสียง (SFX) และดนตรีพื้นหลัง (BGM) โดยใช้ API เดียวกันผ่าน `audio.play()` โดยพารามิเตอร์ `type` จะกำหนดพฤติกรรมการเล่น

## เอฟเฟกต์เสียง (Sound Effects)

SFX คือเสียงเกมสั้นๆ ที่สามารถเรียกเล่นซ้ำได้หลายครั้ง SFX หลายตัวสามารถเล่นพร้อมกันได้โดยไม่รบกวนกันหรือ BGM

```tsl
audio.play("audio/sfx/jump.wav", type="sfx")
audio.play("audio/sfx/hit.wav", type="sfx", volume=0.8)
audio.play("audio/sfx/engine.wav", type="sfx", loop=true)
```

### พฤติกรรมของ SFX

- SFX สามารถเรียกเล่นซ้ำได้หลายครั้ง สร้างการเล่นที่ซ้อนทับกันได้
- การเล่น SFX ไม่หยุดหรือเริ่ม BGM ใหม่
- SFX มีตัวควบคุมเสียงแยกต่างหาก (`audio.sfxVolume`)
- ค่า loop เริ่มต้นคือ `false` — SFX เล่นหนึ่งครั้งเว้นแต่ระบุ `loop=true`
- SFX ที่ loop จะเล่นต่อไปจนกว่าจะหยุดด้วยคำสั่ง

### การหยุด SFX เฉพาะตัว

เมื่อ `loop=true` การเรียก `audio.play()` จะคืนค่า handle สำหรับการหยุด SFX ตัวนั้น:

```tsl
engine = audio.play("audio/sfx/engine.wav", type="sfx", loop=true)

update(dt):
    if key.down("E"):
        // หยุดเสียงเครื่องยนต์
```

## ดนตรีพื้นหลัง (Background Music)

BGM ใช้สำหรับเพลงยาวที่สามารถเล่นต่อเนื่องได้ มี BGM ได้เพียงหนึ่งแทร็กในเวลาเดียวกัน การเริ่ม BGM ใหม่จะหยุด BGM ตัวก่อนหน้าโดยอัตโนมัติ

```tsl
audio.play("audio/bgm/stage1.mp3", type="bgm")
audio.play("audio/bgm/stage2.mp3", type="bgm", loop=true)
```

### พฤติกรรมของ BGM

- มีเพียง BGM track ปัจจุบันที่ทำงานอยู่
- การเรียก `audio.play()` ด้วย `type="bgm"` ใหม่จะแทนที่ BGM ปัจจุบัน
- ค่า loop เริ่มต้นคือ `true` — BGM จะ loop เว้นแต่ระบุ `loop=false`
- BGM มีตัวควบคุมเสียงแยกต่างหาก (`audio.bgmVolume`)

### การควบคุม BGM

```tsl
audio.pause()   // หยุดชั่วคราว BGM (รักษาตำแหน่งการเล่น)
audio.resume()  // เล่น BGM ต่อจากจุดที่หยุด
audio.stop()    // หยุด BGM (รีเซ็ตตำแหน่งการเล่น)
```

## การควบคุมเสียง

TME มีตัวควบคุมเสียงสี่ตัวผ่านวัตถุ `audio` แบบรวม:

| คุณสมบัติ | ช่วง | คำอธิบาย |
|-----------|------|----------|
| `audio.volume` | 0..1 | เสียงหลัก (กระทบเสียงทั้งหมด) |
| `audio.sfxVolume` | 0..1 | เสียง SFX (แยกจาก BGM) |
| `audio.bgmVolume` | 0..1 | เสียง BGM (แยกจาก SFX) |
| `audio.muted` | true/false | ปิดเสียงหลัก (ตั้งค่าเสียงเป็น 0) |

```tsl
audio.volume = 0.8
audio.sfxVolume = 1.0
audio.bgmVolume = 0.6
audio.muted = false
```

ค่าจะถูกปรับเป็นช่วง 0..1 โดยอัตโนมัติ

## การเล่นซ้ำ (Looping)

ทั้ง SFX และ BGM รองรับการเล่นซ้ำผ่านตัวเลือก `loop`:

```tsl
// SFX — เล่นหนึ่งครั้งตามค่าเริ่มต้น
audio.play("audio/sfx/jump.wav", type="sfx")

// SFX — เล่นซ้ำจนกว่าจะหยุด
audio.play("audio/sfx/engine.wav", type="sfx", loop=true)

// BGM — เล่นซ้ำตามค่าเริ่มต้น
audio.play("audio/bgm/stage1.mp3", type="bgm")

// BGM — เล่นหนึ่งครั้ง
audio.play("audio/bgm/menu.mp3", type="bgm", loop=false)
```

### ค่าเริ่มต้นของ loop

- SFX: `loop = false`
- BGM: `loop = true`

## เส้นทางไฟล์เสียง

ไฟล์เสียงถูกโหลดโดยใช้เส้นทางที่อ้างอิงจาก root ของโปรเจกต์ ชื่อไดเรกทอรีไม่ถูกจำกัด — คุณสามารถตั้งชื่อโฟลเดอร์เสียงอะไรก็ได้

### โครงสร้างโปรเจกต์

```
project/
├── game.tsl
├── index.html
├── style.css
├── audio/
│   ├── sfx/
│   │   ├── jump.wav
│   │   └── hit.wav
│   └── bgm/
│       └── stage1.mp3
└── sounds/
    └── ui/
        └── click.ogg
```

### หลังการ build

Build Program จะคัดลอกไดเรกทอรีและไฟล์ทั้งหมดที่ผู้ใช้สร้างเข้าไปใน `dist/` โดยรักษาเส้นทางสัมพัทธ์:

```
dist/
├── index.html
├── game.js
├── engine.js
├── style.css
├── audio/
│   ├── sfx/
│   │   ├── jump.wav
│   │   └── hit.wav
│   └── bgm/
│       └── stage1.mp3
└── sounds/
    └── ui/
        └── click.ogg
```

### รูปแบบที่รองรับ

รูปแบบเสียงทั่วไปรองรับ: `.wav`, `.mp3`, `.ogg`, `.m4a` เบราว์เซอร์เป็นผู้กำหนดการรองรับจริง

## การแคชเสียง

ไฟล์เสียงจะถูกแคชหลังจากโหลดครั้งแรก การเล่นไฟล์เดียวกันซ้ำจะข้อมูลเสียงที่ถอดรหัสแล้วจากแคช หลีกเลี่ยงการขอเครือข่ายและการถอดรหัสซ้ำ

```tsl
// การเรียกครั้งแรก — โหลดและถอดรหัสไฟล์
audio.play("audio/sfx/jump.wav", type="sfx")

// การเรียกถัดไป — ใช้ข้อมูลแคช
audio.play("audio/sfx/jump.wav", type="sfx")
audio.play("audio/sfx/jump.wav", type="sfx")
```

### การล้างแคช

เรียก `audio.clearCache()` เพื่อปล่อยทรัพยากรเสียงทั้งหมด:

```tsl
audio.clearCache()
```

คุณสามารถล้างผ่าน TEMF runtime ได้ด้วย:

```js
TEMF.cleanupAudio()
```

## ข้อจำกัด autoplay ของเบราว์เซอร์

เบราว์เซอร์อาจบล็อกการเล่นเสียงจนกว่าผู้ใช้จะมีปฏิกิริยากับหน้า (คลิก แตะ หรือกดปุ่ม) TME จัดการเรื่องนี้ได้อย่างราบรื่น:

- การเริ่มต้นเสียงจะถูกเลื่อนจนกว่าจะเรียก `audio.play()` ครั้งแรก
- หากเบราว์เซอร์บล็อกการเล่น TME จะพยายามเริ่ม audio context ใหม่เมื่อผู้ใช้มีปฏิกิริยา
- TME ไม่ค้างเมื่อ autoplay ถูกปฏิเสธ — จะรายงานข้อผิดพลาดในท้องถิ่นและอนุญาตให้เล่นหลังจากมีปฏิกิริยา
- ตัวจัดการเหตุการณ์คีย์บอร์ด เมาส์ และทัชจะเริ่ม audio context ที่หยุดทำงานโดยอัตโนมัติ

## ตัวอย่างครบถ้วน

```tsl
game "AudioDemo"

start:
    audio.play("audio/bgm/menu.mp3", type="bgm", loop=true)

update(dt):
    if key.down("Space"):
        audio.play("audio/sfx/jump.wav", type="sfx")

    if key.down("M"):
        audio.muted = !audio.muted

    if key.down("P"):
        audio.pause()

    if key.down("R"):
        audio.resume()
```

## อ้างอิง API

### `audio.play(path, type, options...)`

เล่นไฟล์เสียง

| พารามิเตอร์ | ประเภท | จำเป็น | คำอธิบาย |
|-----------|------|----------|----------|
| `path` | string | ใช่ | เส้นทางไฟล์เสียง (อ้างอิงจาก root ของโปรเจกต์) |
| `type` | string | ใช่ | `"sfx"` หรือ `"bgm"` |
| `options.loop` | boolean | ไม่ | เล่นซ้ำ (SFX เริ่มต้น: false, BGM เริ่มต้น: true) |
| `options.volume` | number | ไม่ | การควบคุมเสียงต่อการเล่น (0..1) |

### `audio.stop()`

หยุด BGM และ SFX ทั้งหมดที่กำลังเล่นอยู่ รีเซ็ตตำแหน่งการเล่น BGM

### `audio.pause()`

หยุดชั่วคราว BGM โดยไม่เสียตำแหน่งการเล่น

### `audio.resume()`

เล่น BGM ที่หยุดไว้ต่อจากตำแหน่งปัจจุบัน

### `audio.clearCache()`

ปล่อยข้อมูลเสียงทั้งหมดที่แคชไว้และปิด audio context

### คุณสมบัติ

| คุณสมบัติ | ประเภท | คำอธิบาย |
|----------|------|----------|
| `audio.volume` | number | เสียงหลัก (0..1) |
| `audio.sfxVolume` | number | เสียง SFX (0..1) |
| `audio.bgmVolume` | number | เสียง BGM (0..1) |
| `audio.muted` | boolean | ปิดเสียงหลัก |
