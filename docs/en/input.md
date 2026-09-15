# Input

## Keyboard

### `key.down(key)`
Checks whether a specific key is currently being pressed.

**Signature:**
```typescript
key.down(key: string | number): boolean
```

**Parameters:**
- `key` (string | number): Key identifier. Supports letters, numbers, function keys, and special keys.

**Supported Keys:**

| Category | Values |
|----------|--------|
| Letters | `'A'`–`'Z'` (case-insensitive) |
| Numbers | `0`–`9` or `'0'`–`'9'` |
| Function | `'F1'`–`'F12'` |
| Special | `'SPACE'`, `'ENTER'`, `'ESC'`, `'TAB'`, `'CTRL'`, `'SHIFT'`, `'ALT'` |
| Navigation | `'UP'`, `'DOWN'`, `'LEFT'`, `'RIGHT'`, `'HOME'`, `'END'`, `'PAGEUP'`, `'PAGEDOWN'` |
| Editing | `'DELETE'`, `'BACKSPACE'`, `'CAPSLOCK'` |

**Returns:** `boolean` — `true` if the key is currently pressed, `false` otherwise.

**Example:**
```javascript
function update(dt) {
  if (key.down('A') || key.down('ArrowLeft')) {
    player.x -= 200 * dt;
  }
  if (key.down('D') || key.down('ArrowRight')) {
    player.x += 200 * dt;
  }
  if (key.down('SPACE')) {
    jump();
  }
  if (key.down(1)) {
    // Pressing '1' key
    selectWeapon(1);
  }
}
```

## Mouse

### `mouse.x`, `mouse.y`
Current mouse position in pixels relative to the canvas.

**Type:** `number`

### `mouse.click(button)`
Returns `true` for the single frame when a mouse button is clicked. Automatically resets after being read.

**Signature:**
```typescript
mouse.click(button?: number): boolean
```

**Parameters:**
- `button` (number, optional): Mouse button index. Default `0`.
  - `0` — Left button
  - `1` — Middle button (scroll wheel)
  - `2` — Right button

**Returns:** `boolean` — `true` on the frame the click occurred, `false` otherwise.

**Example:**
```javascript
function update(dt) {
  if (mouse.click(0)) {
    selectObjectAt(mouse.x, mouse.y);
  }
}
```

### `mouse.down(button)`
Returns `true` while a mouse button is currently held down.

**Signature:**
```typescript
mouse.down(button?: number): boolean
```

**Parameters:**
- `button` (number, optional): Mouse button index. Default `0`.

**Returns:** `boolean` — `true` if the button is currently pressed, `false` otherwise.

### `mouse.drag(button)`
Returns `true` for the single frame when the user starts dragging. Automatically resets after being read.

**Signature:**
```typescript
mouse.drag(button?: number): boolean
```

**Parameters:**
- `button` (number, optional): Mouse button index. Default `0`.

**Returns:** `boolean` — `true` on the frame dragging started, `false` otherwise.

### `mouse.up(button)`
Returns `true` for the single frame when a mouse button is released. Automatically resets after being read.

**Signature:**
```typescript
mouse.up(button?: number): boolean
```

**Parameters:**
- `button` (number, optional): Mouse button index. Default `0`.

**Returns:** `boolean` — `true` on the frame the button was released, `false` otherwise.

## Touch

### `touch.x`, `touch.y`
Current touch position in pixels relative to the canvas. Single touch only.

**Type:** `number`

### `touch.tap()`
Returns `true` for the single frame when the user taps the screen. Automatically resets after being read.

**Signature:**
```typescript
touch.tap(): boolean
```

**Returns:** `boolean` — `true` on the frame the tap occurred, `false` otherwise.

### `touch.down()`
Returns `true` while the screen is currently being touched.

**Signature:**
```typescript
touch.down(): boolean
```

**Returns:** `boolean` — `true` if touching, `false` otherwise.

### `touch.drag()`
Returns `true` for the single frame when the user starts dragging. Automatically resets after being read.

**Signature:**
```typescript
touch.drag(): boolean
```

**Returns:** `boolean` — `true` on the frame dragging started, `false` otherwise.

### `touch.up()`
Returns `true` for the single frame when the user lifts their finger from the screen. Automatically resets after being read.

**Signature:**
```typescript
touch.up(): boolean
```

**Returns:** `boolean` — `true` on the frame the touch ended, `false` otherwise.
