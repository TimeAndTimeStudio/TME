# เสียง

## Audio Object แบบรวม
```javascript
audio.play(src)  // SFX
audio.play(src, { loop: true })  // BGM
audio.volume = 0.5
audio.pause()
audio.resume()
```

## SFX (เสียงเอฟเฟกต์)
เสียงสั้นที่สามารถทับกันได้ เล่นหลาย SFX พร้อมกันได้
```javascript
audio.play('sfx/jump.wav')
audio.play('sfx/click.wav')
```

## BGM (เพลงพื้นหลัง)
เพลงยาว เล่นได้ทีละหนึ่งเพลง การเริ่ม BGM ใหม่จะหยุดเพลงเก่าอัตโนมัติ
```javascript
audio.play('bgm/theme.mp3', { loop: true })
```

## การควบคุมเสียง
```javascript
audio.volume = 0.7          // ตั้งค่าเสียง (0.0 ถึง 1.0)
audio.pause()               // หยุดชั่วคราว BGM (รักษาตำแหน่ง)
audio.resume()              // เล่นต่อ BGM ที่หยุดชั่วคราว
audio.stop()                // หยุด BGM (รีเซ็ตตำแหน่ง)
```

## กฎ
- SFX ไม่หยุดหรือเริ่มใหม่ BGM
- BGM pause/resume/stop ทำงานถูกต้อง
- บัฟเฟอร์เสียงจะปล่อยเมื่อไม่มีการอ้างอิงถึง
