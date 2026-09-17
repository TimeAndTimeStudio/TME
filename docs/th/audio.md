# Audio

## `audio.play(path, type, loop?)`

เล่นเสียง

```javascript
# เล่น SFX (เสียงสั้น)
audio.play("assets/sfx/jump.mp3", "sfx")

# เล่น BGM (เสียงพื้นหลัง)
audio.play("assets/music/bgm.mp3", "bgm", true)  # loop=true
audio.play("assets/music/bgm.mp3", "bgm")        # loop默认=true

# เล่น BGM ไม่ loop
audio.play("assets/music/bgm.mp3", "bgm", false)
```

## `audio.stop(type)`

```javascript
# หยุด SFX ทั้งหมด
audio.stop("sfx")

# หยุด BGM
audio.stop("bgm")

# หยุดทั้งหมด
audio.stop()
```

## `audio.pause()` / `audio.resume()`

```javascript
# หยุดชั่วคราว
audio.pause()

# เล่นต่อ
audio.resume()
```

## Volume & Mute

```javascript
# ตั้งค่าความดัง
audio.volume = 0.8      # ความดังรวม (0-1)
audio.sfxVolume = 0.6   # ความดัง SFX
audio.bgmVolume = 0.7   # ความดัง BGM

# Mute
audio.mutedSfx = true   # mute SFX
audio.mutedBgm = true   # mute BGM

# ตรวจสอบสถานะ
if audio.muted:
  print("เสียงถูก mute")
```
