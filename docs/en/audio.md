# Audio

## Unified Audio Object
All audio functions are accessed through the `audio` object.

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

## SFX (Sound Effects)
Short sounds that can overlap. Play multiple SFX simultaneously.

**Signature:**
```typescript
audio.play(path: string, type: 'sfx', loop?: boolean): void
```

**Parameters:**
- `path` (string): Relative path to the audio file (e.g., `'sfx/jump.wav'`).
- `type` (string): Must be `'sfx'`.
- `loop` (boolean): Ignored for SFX. Default `false`.

**Example:**
```javascript
audio.play('sfx/jump.wav', 'sfx');
audio.play('sfx/click.wav', 'sfx');
```

## BGM (Background Music)
Longer music tracks. Only one BGM plays at a time. Starting a new BGM stops the previous one.

**Signature:**
```typescript
audio.play(path: string, type: 'bgm', loop?: boolean): void
```

**Parameters:**
- `path` (string): Relative path to the audio file (e.g., `'bgm/theme.mp3'`).
- `type` (string): Must be `'bgm'`.
- `loop` (boolean): Whether to loop. Default `true`.

**Example:**
```javascript
audio.play('bgm/theme.mp3', 'bgm', true);
```

## Audio Control

### `audio.stop(type?)`
Stops audio playback.

**Signature:**
```typescript
audio.stop(type?: 'sfx' | 'bgm'): void
```

**Parameters:**
- `type` (string, optional): 
  - `'sfx'` — Stops all SFX
  - `'bgm'` — Stops BGM and resets position
  - omitted — Stops both SFX and BGM

### `audio.pause()`
Pauses the current BGM playback. Preserves position.

**Signature:**
```typescript
audio.pause(): void
```

### `audio.resume()`
Resumes paused BGM playback.

**Signature:**
```typescript
audio.resume(): void
```

## Volume Control

### `audio.volume`
Master volume for all audio.

**Type:** `number` (0.0 to 1.0, default 1.0)

### `audio.sfxVolume`
Volume specifically for SFX playback.

**Type:** `number` (0.0 to 1.0, default 1.0)

### `audio.bgmVolume`
Volume specifically for BGM playback.

**Type:** `number` (0.0 to 1.0, default 1.0)

## Mute Control

### `audio.muted`
Mutes all audio.

**Type:** `boolean`

### `audio.mutedSfx`
Mutes only SFX playback.

**Type:** `boolean`

### `audio.mutedBgm`
Mutes only BGM playback.

**Type:** `boolean`

## Rules
- SFX playback does not stop or restart BGM
- BGM pause/resume/stop work independently
- Audio buffers cache and release automatically when unused
- AudioContext initializes on first `audio.play()` call
