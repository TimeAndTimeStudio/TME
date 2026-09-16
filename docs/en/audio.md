# Audio

## `audio.play(path, type, loop?)`

Play audio.

```javascript
# Play SFX (short sound effect)
audio.play("assets/sfx/jump.mp3", "sfx")

# Play BGM (background music)
audio.play("assets/music/bgm.mp3", "bgm", true)  # loop=true
audio.play("assets/music/bgm.mp3", "bgm")        # loop defaults to true

# Play BGM without looping
audio.play("assets/music/bgm.mp3", "bgm", false)
```

## `audio.stop(type)`

```javascript
# Stop all SFX
audio.stop("sfx")

# Stop BGM
audio.stop("bgm")

# Stop everything
audio.stop()
```

## `audio.pause()` / `audio.resume()`

```javascript
# Pause temporarily
audio.pause()

# Resume playback
audio.resume()
```

## Volume & Mute

```javascript
# Set volume levels
audio.volume = 0.8      # Master volume (0-1)
audio.sfxVolume = 0.6   # SFX volume
audio.bgmVolume = 0.7   # BGM volume

# Mute
audio.muted = true      # Mute everything
audio.mutedSfx = true   # Mute SFX only
audio.mutedBgm = true   # Mute BGM only

# Check status
if audio.muted:
  print("Audio is muted")
```
