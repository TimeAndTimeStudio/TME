# เสียง

## Audio Object แบบรวม
ฟังก์ชันเสียงทั้งหมดเข้าถึงผ่าน object `audio`

```javascript
audio.play(path, type, loop?)
audio.stop(type?)
audio.pause()
audio.resume()
audio.volume = 0.7
audio.sfxVolume = 0.8
audio.bgmVolume = 0.9
audio.muted = false
audio.mutedSfx = true
audio.mutedBgm = true
```

## SFX (เสียงเอฟเฟกต์)
เสียงสั้นที่สามารถทับกันได้ เล่นหลาย SFX พร้อมกันได้

**Signature:**
```typescript
audio.play(path: string, type: 'sfx', loop?: boolean): void
```

**พารามิเตอร์:**
- `path` (string): เส้นทางไปยังไฟล์เสียง (เช่น `'sfx/jump.wav'`)
- `type` (string): ต้องเป็น `'sfx'`
- `loop` (boolean): ไม่ใช้กับ SFX ค่าเริ่มต้น `false`

**ตัวอย่าง:**
```javascript
audio.play('sfx/jump.wav', 'sfx');
audio.play('sfx/click.wav', 'sfx');
```

## BGM (เพลงพื้นหลัง)
เพลงยาว เล่นได้ทีละหนึ่งเพลง การเริ่ม BGM ใหม่จะหยุดเพลงเก่าอัตโนมัติ

**Signature:**
```typescript
audio.play(path: string, type: 'bgm', loop?: boolean): void
```

**พารามิเตอร์:**
- `path` (string): เส้นทางไปยังไฟล์เสียง (เช่น `'bgm/theme.mp3'`)
- `type` (string): ต้องเป็น `'bgm'`
- `loop` (boolean): ให้เล่นซ้ำ ค่าเริ่มต้น `true`

**ตัวอย่าง:**
```javascript
audio.play('bgm/theme.mp3', 'bgm', true);
```

## การควบคุมเสียง

### `audio.stop(type?)`
หยุดการเล่นเสียง

**Signature:**
```typescript
audio.stop(type?: 'sfx' | 'bgm'): void
```

**พารามิเตอร์:**
- `type` (string, ไม่บังคับ): 
  - `'sfx'` — หยุด SFX ทั้งหมด
  - `'bgm'` — หยุด BGM และรีเซ็ตตำแหน่ง
  - ไม่ระบุ — หยุดทั้ง SFX และ BGM

### `audio.pause()`
หยุดชั่วคราว BGM ที่กำลังเล่นอยู่ รักษาตำแหน่งการเล่นไว้

**Signature:**
```typescript
audio.pause(): void
```

### `audio.resume()`
เล่นต่อ BGM ที่หยุดชั่วคราวไว้

**Signature:**
```typescript
audio.resume(): void
```

## การควบคุมระดับเสียง

### `audio.volume`
ระดับเสียงรวมสำหรับเสียงทั้งหมด

**ประเภท:** `number` (0.0 ถึง 1.0, ค่าเริ่มต้น 1.0)

### `audio.sfxVolume`
ระดับเสียงเฉพาะสำหรับ SFX

**ประเภท:** `number` (0.0 ถึง 1.0, ค่าเริ่มต้น 1.0)

### `audio.bgmVolume`
ระดับเสียงเฉพาะสำหรับ BGM

**ประเภท:** `number` (0.0 ถึง 1.0, ค่าเริ่มต้น 1.0)

## การควบคุมการปิดเสียง

### `audio.muted`
ปิดเสียงทั้งหมด

**ประเภท:** `boolean`

### `audio.mutedSfx`
ปิดเสียง SFX เท่านั้น

**ประเภท:** `boolean`

### `audio.mutedBgm`
ปิดเสียง BGM เท่านั้น

**ประเภท:** `boolean`

## กฎ
- SFX ไม่หยุดหรือเริ่มใหม่ BGM
- BGM pause/resume/stop ทำงานอิสระ
- บัฟเฟอร์เสียงเก็บและปล่อยอัตโนมัติเมื่อไม่ใช้งาน
- AudioContext เริ่มทำงานเมื่อเรียก `audio.play()` ครั้งแรก
