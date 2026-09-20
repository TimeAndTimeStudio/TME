# TME API Reference

> **Auto-generated from runtime source code**  
> Engine: Time Mini Engine Framework (TEMF)  
> Runtime: `runtime-webgl.js`, `runtime-webgpu.js`

---

## Table of Contents

- [Game Loop](#game-loop)
  - [`setGame`](#setgame)
  - [`fps`](#fps)
- [Render](#render)
  - [`getCanvasSize`](#getcanvassize)
  - [`rect`](#rect)
  - [`image`](#image)
- [Input](#input)
  - [`key`](#key)
  - [`mouse.x`](#mousex)
  - [`mouse.y`](#mousey)
  - [`mouse.down`](#mousedown)
  - [`touch.exists`](#toucheexists)
  - [`touch.down`](#touche-down)
  - [`touch.x`](#touchx)
  - [`touch.y`](#touchy)
- [Audio](#audio)
  - [`audio.play`](#audioplay)
  - [`audio.stop`](#audiostop)
  - [`audio.pause`](#audiopause)
  - [`audio.resume`](#audioresume)
  - [`audio.volume`](#audovolume)
  - [`audio.sfxVolume`](#audiosfxvolume)
  - [`audio.bgmVolume`](#audiobgmvolume)
  - [`audio.mutedSfx`](#audiomutedsfx)
  - [`audio.mutedBgm`](#audiomutedbgm)
- [Fullscreen](#fullscreen)
  - [`requestFullscreen`](#requestfullscreen)
  - [`exitFullscreen`](#exitfullscreen)
  - [`setFullscreenCallback`](#setfullscreencallback)
- [Visibility](#visibility)
  - [`hasTabSwitched`](#hastabswitched)
- [Preload](#preload)
  - [`preload`](#preload)
  - [`checkpreload`](#checkpreload)
  - [`preloadfailed`](#preloadfailed)
  - [`unload`](#unload)

---

## Game Loop

### `setGame`

Register the game's update and draw functions. Safe to call before or after engine initialization.

```typescript
setGame(gameObj: Object): void
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `gameObj` | `Object` | Yes | Object containing `update(dt)` and `draw()` functions |

**Returns:** `void`

---

### `fps`

Set the target frame rate for the game loop.

```typescript
fps(fpsValue: number): void
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `fpsValue` | `number` | Yes | Target frames per second (e.g., 60, 30) |

**Returns:** `void`

---

## Render

### `getCanvasSize`

Get the current canvas dimensions including device pixel ratio (DPR).

```typescript
getCanvasSize(): Object
```

**Returns:** `Object`

| Property | Type | Description |
|----------|------|-------------|
| `width` | `number` | Canvas width in pixels (including DPR multiplier) |
| `height` | `number` | Canvas height in pixels (including DPR multiplier) |

---

### `rect`

Draw a rectangle with optional rotation, scale, and alpha. Supports up to 1024 rectangles per frame.

```typescript
rect(x: number, y: number, width: number, height: number, color: string, rotation?: number, scale?: number, alpha?: number): void
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `x` | `number` | Yes | X coordinate of the rectangle's top-left corner |
| `y` | `number` | Yes | Y coordinate of the rectangle's top-left corner |
| `width` | `number` | Yes | Width of the rectangle in pixels |
| `height` | `number` | Yes | Height of the rectangle in pixels |
| `color` | `string` | Yes | Color in hex format: `'#rrggbb'` or `'#rrggbbaa'` |
| `rotation` | `number` | No | Rotation angle in degrees (default: 0) |
| `scale` | `number` | No | Scale multiplier (default: 1) |
| `alpha` | `number` | No | Opacity value 0-1 (default: from color alpha or 1) |

**Returns:** `void`

---

### `image`

Draw a loaded image with optional transforms and cropping. Images are cached by path with LRU eviction (max 64 textures).

```typescript
image(path: string, x: number, y: number, rotation?: number, scale?: number, alpha?: number, cropX?: number, cropY?: number, cropEndX?: number, cropEndY?: number): void
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `path` | `string` | Yes | Path to the image file |
| `x` | `number` | Yes | X coordinate of the image's top-left corner |
| `y` | `number` | Yes | Y coordinate of the image's top-left corner |
| `rotation` | `number` | No | Rotation angle in degrees (default: 0) |
| `scale` | `number` | No | Scale multiplier (default: 1) |
| `alpha` | `number` | No | Opacity value 0-1 (default: 1) |
| `cropX` | `number` | No | Crop start X coordinate (default: 0) |
| `cropY` | `number` | No | Crop start Y coordinate (default: 0) |
| `cropEndX` | `number` | No | Crop end X coordinate (default: image width) |
| `cropEndY` | `number` | No | Crop end Y coordinate (default: image height) |

**Returns:** `void`

---

## Input

### `key`

Check if a key is currently pressed. Supports shorthand names (SPACE, ENTER, ESC, etc.) and full DOM key names.

```typescript
key(key: string | number): boolean
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `key` | `string \| number` | Yes | Key name (e.g., 'ArrowLeft', 'SPACE', 'a') or number (0-9 maps to Digit0-Digit9) |

**Returns:** `boolean` — `true` if the key is pressed.

---

### `mouse.x`

Current X coordinate of the mouse cursor in canvas space (includes DPR scaling).

```typescript
mouse.x: number
```

---

### `mouse.y`

Current Y coordinate of the mouse cursor in canvas space (includes DPR scaling).

```typescript
mouse.y: number
```

---

### `mouse.down`

Check if a mouse button is currently pressed. Uses pointer events for cross-device compatibility.

```typescript
mouse.down(btn?: number): boolean
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `btn` | `number` | No | Mouse button index: 0=left, 1=middle/scroll, 2=right (default: 0) |

**Returns:** `boolean`

---

### `touch.exists`

Check if a touch finger is currently active at the given slot index.

```typescript
touch.exists(id: number): boolean
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `number` | Yes | Touch finger index (0-3) |

**Returns:** `boolean`

---

### `touch.down`

Check if a touch finger is currently pressed at the given slot index. Alias for `touch.exists()`.

```typescript
touch.down(id: number): boolean
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `number` | Yes | Touch finger index (0-3) |

**Returns:** `boolean`

---

### `touch.x`

Get the X coordinate of a specific touch finger.

```typescript
touch.x(id: number): number
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `number` | Yes | Touch finger index (0-3) |

**Returns:** `number` — Throws error if finger is not active.

---

### `touch.y`

Get the Y coordinate of a specific touch finger.

```typescript
touch.y(id: number): number
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `number` | Yes | Touch finger index (0-3) |

**Returns:** `number` — Throws error if finger is not active.

---

## Audio

### `audio.play`

Play an audio file. SFX supports overlapping instances, BGM stops previous instance when playing new one.

```typescript
audio.play(path: string, type: 'sfx' \| 'bgm', loop?: boolean): void
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `path` | `string` | Yes | Path to the audio file |
| `type` | `'sfx' \| 'bgm'` | Yes | Audio type: `'sfx'` for sound effects, `'bgm'` for background music |
| `loop` | `boolean` | No | Whether to loop the audio (only applies to `'bgm'`, default: `true`) |

**Returns:** `void`

---

### `audio.stop`

Stop audio playback.

```typescript
audio.stop(type?: 'sfx' \| 'bgm'): void
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `type` | `'sfx' \| 'bgm'` | No | Type to stop: `'sfx'`, `'bgm'`, or omit to stop both |

**Returns:** `void`

---

### `audio.pause`

Pause BGM playback by suspending the AudioContext.

```typescript
audio.pause(): void
```

**Returns:** `void`

---

### `audio.resume`

Resume BGM playback by resuming the AudioContext.

```typescript
audio.resume(): void
```

**Returns:** `void`

---

### `audio.volume`

Master volume level (0-1). Affects all audio output.

```typescript
audio.volume: number
```

---

### `audio.sfxVolume`

SFX volume level (0-1). Independent of BGM volume.

```typescript
audio.sfxVolume: number
```

---

### `audio.bgmVolume`

BGM volume level (0-1). Independent of SFX volume.

```typescript
audio.bgmVolume: number
```

---

### `audio.mutedSfx`

Mute SFX when `true`. Sets gain to 0 independently of volume setting.

```typescript
audio.mutedSfx: boolean
```

---

### `audio.mutedBgm`

Mute BGM when `true`. Sets gain to 0 independently of volume setting.

```typescript
audio.mutedBgm: boolean
```

---

## Fullscreen

### `requestFullscreen`

Request fullscreen mode for the document. Supports standard and vendor-prefixed APIs (webkit, ms).

```typescript
requestFullscreen(): void
```

**Returns:** `void`

---

### `exitFullscreen`

Exit fullscreen mode. Supports standard and vendor-prefixed APIs (webkit, ms).

```typescript
exitFullscreen(): void
```

**Returns:** `void`

---

### `setFullscreenCallback`

Set a callback function that executes when the fullscreen state changes.

```typescript
setFullscreenCallback(callback: Function): void
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `callback` | `Function` | Yes | Function to call when fullscreen state changes |

**Returns:** `void`

---

## Visibility

### `hasTabSwitched`

Check if the user has switched away from the browser tab at least once since page load.

```typescript
hasTabSwitched(reset?: boolean): boolean
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `reset` | `boolean` | No | If `false`, reset the tab-switched flag to `false` |

**Returns:** `boolean` — `true` if tab was switched.

---

## Preload

### `preload`

Preload images and audio files. Images are cached as GPU textures, audio as decoded AudioBuffers.

```typescript
preload(resources: string \| string[] \| Object[]): Promise<void>
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `resources` | `string \| string[] \| Object[]` | Yes | Resources to preload: single path, array of paths, or objects with `'images'`/`'audio'` arrays |

**Returns:** `Promise<void>`

---

### `checkpreload`

Check if all preloaded resources have finished loading.

```typescript
checkpreload(reset?: boolean): boolean
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `reset` | `boolean` | No | If `false`, reset preload state and return `false` |

**Returns:** `boolean` — `true` when all resources are loaded.

---

### `preloadfailed`

Check if any preloaded resources failed to load.

```typescript
preloadfailed(): boolean
```

**Returns:** `boolean` — `true` if any file in the preload list had errors.

---

### `unload`

Unload a loaded image or BGM resource to free memory.

```typescript
unload(path: string): void
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `path` | `string` | Yes | Path to the resource to unload (image or BGM) |

**Returns:** `void` — Throws error if trying to unload SFX or non-existent resource.

---

## Runtime Implementation Notes

- **WebGL Backend** (`runtime-webgl.js`): Default 2D canvas rendering with Canvas2D API
- **WebGPU Backend** (`runtime-webgpu.js`): Experimental WebGPU rendering pipeline
- **Texture Cache**: LRU eviction, max 64 textures
- **Draw Limits**: 1024 rectangles or images per frame
- **Touch Support**: Up to 5 simultaneous touches (slots 0-4)
- **Audio Context**: Auto-initialized on first `audio.play()` call
- **DPR Scaling**: Canvas dimensions multiplied by `window.devicePixelRatio`
