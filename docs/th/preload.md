# Preload

ระบบโหลดทรัพยากรล่วงหน้า (รูปภาพ, เสียง BGM, SFX) พร้อมระบบตรวจสอบสถานะ

## preload(resources, onProgress?)

โหลดไฟล์ที่กำหนดไว้ล่วงหน้า

```tsl
# โหลดไฟล์เดียว
preload("img/bg.png")

# โหลดหลายไฟล์ (ตรวจจับ type อัตโนมัติ)
preload([
  "img/bg.png",
  "img/character.png",
  "music/bgm.mp3",
  "sfx/click.wav"
])

# ระบุประเภทชัดเจน
preload({
  images: ["img/bg.png", "img/char.png"],
  bgm: ["music/menu.mp3"],
  sfx: ["sfx/jump.wav"]
})

# พร้อม progress callback
preload(["img/bg.png", "music/bgm.mp3"], function(info):
  print(info.path + " - " + info.loaded + " (" + info.completed + "/" + info.total + ")")
end)
```

### พารามิเตอร์

| พารามิเตอร์ | ประเภท | คำอธิบาย |
|-------------|--------|----------|
| `resources` | `string \| string[] \| object` | Path ของไฟล์ หรือ object ที่มี `images`, `bgm`, `sfx` เป็น array |
| `onProgress` | `function` | ฟังก์ชัน callback เมื่อมีข้อมูล progress |

### ข้อมูลใน callback (info object)

| property | ประเภท | คำอธิบาย |
|----------|--------|----------|
| `path` | `string` | Path ของไฟล์ |
| `loaded` | `boolean` | โหลดไฟล์นี้สำเร็จหรือไม่ |
| `total` | `number` | จำนวนไฟล์ทั้งหมดที่ต้องโหลด |
| `completed` | `number` | โหลดเสร็จแล้วกี่ไฟล์ |
| `progress` | `number` | อัตราความคืบหน้า (0-1) |
| `failed` | `string[]` | Array ของ path ที่โหลดล้มเหลว |

## checkpreload()

ตรวจสอบว่าโหลดทรัพยากรทั้งหมดเสร็จแล้วหรือยัง (คืนค่า `true` / `false`)

```tsl
preload(["img/bg.png", "music/bgm.mp3"])

while not checkpreload():
  # แสดง loading screen
  rect(0, 0, 800, 600, "#000000")
  print("Loading...")

print("โหลดเสร็จแล้ว!")
```

## preloadfailed()

ตรวจสอบว่ามีไฟล์ไหนโหลดล้มเหลวหรือไม่ (คืนค่า `true` ถ้ามีล้มเหลว, `false` ถ้าสำเร็จทั้งหมด)

```tsl
preload(["img/bg.png", "music/bgm.mp3"])

while not checkpreload():
  rect(0, 0, 800, 600, "#000000")

if preloadfailed():
  print("มีไฟล์โหลดไม่สำเร็จ!")
  # โหลดใหม่
  preload(["img/bg.png", "music/bgm.mp3"])
  while not checkpreload():
    rect(0, 0, 800, 600, "#000000")
else:
  print("โหลดสำเร็จทั้งหมด!")
```

## preloadisloaded(path)

ตรวจสอบว่าไฟล์เฉพาะโหลดเสร็จแล้วหรือยัง (คืนค่า `true` / `false`)

```tsl
preload(["img/bg.png", "music/bgm.mp3", "sfx/click.wav"])

while not checkpreload():
  rect(0, 0, 800, 600, "#000000")

if preloadisloaded("img/bg.png"):
  print("Background พร้อมใช้งาน")
else:
  print("Background ยังโหลดไม่เสร็จ")

if preloadisloaded("music/bgm.mp3"):
  audio.play("music/bgm.mp3", "bgm")
else:
  print("BGM ยังโหลดไม่พร้อม")
```

## ตัวอย่างเต็ม: Loading Screen

```tsl
function init():
  # โหลดทรัพยากรทั้งหมด
  preload([
    "img/bg.png",
    "img/character.png",
    "music/bgm.mp3",
    "sfx/click.wav",
    "sfx/explosion.wav"
  ])

function update(dt):
  # รอให้โหลดเสร็จ
  if not checkpreload():
    return
  
  # เช็คว่าโหลดล้มเหลวไหม
  if preloadfailed():
    # โหลดใหม่
    preload([
      "img/bg.png",
      "img/character.png",
      "music/bgm.mp3",
      "sfx/click.wav",
      "sfx/explosion.wav"
    ])
    return
  
  # โหลดเสร็จ ทั้งหมดพร้อมแล้ว
  print("Game Ready!")

function draw():
  if not checkpreload():
    # แสดง loading screen
    rect(0, 0, 800, 600, "#000000")
    print("Loading...")
    
    # แสดง progress
    rect(100, 300, 600, 20, "#333333")
    rect(100, 300, 600 * progress, 20, "#FF5733")
  else:
    # แสดงเกม
    rect(0, 0, 800, 600, "#87CEEB")
    image("img/character.png", 100, 200)
```
