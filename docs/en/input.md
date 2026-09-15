# Input

## Keyboard

### `key.down(key)`
Checks whether a specific key is currently being pressed.

**Parameters:**
- `key` (string): The key identifier. Supports standard DOM key names.

**Returns:** `boolean` — `true` if the key is currently pressed, `false` otherwise.

**Supported Keys:**
- Arrow keys: `'ArrowUp'`, `'ArrowDown'`, `'ArrowLeft'`, `'ArrowRight'`
- Letters: `'KeyA'`, `'KeyB'`, ..., `'KeyZ'`
- Numbers: `'Digit0'`, `'Digit1'`, ..., `'Digit9'`
- Special: `'Space'`, `'Enter'`, `'Escape'`, `'Tab'`

**Example:**
```javascript
function update(dt) {
  if (key.down('ArrowLeft')) {
    player.x -= 100 * dt;
  }
  if (key.down('Space')) {
    jump();
  }
}
```

## Mouse

### `mouse.x`, `mouse.y`
Current mouse position in pixels relative to the canvas.

**Type:** `number`

### `mouse.click(button)`
Returns `true` for the single frame when a mouse button is clicked. Automatically resets after being read.

**Parameters:**
- `button` (number, optional): The mouse button index. Default is `0`.
  - `0` — Left button
  - `1` — Middle button (scroll wheel)
  - `2` — Right button

**Returns:** `boolean` — `true` on the frame the click occurred, `false` otherwise.

**Example:**
```javascript
function update(dt) {
  if (mouse.click(0)) {
    // Left click detected
    selectObjectAt(mouse.x, mouse.y);
  }
}
```

### `mouse.down(button)`
Returns `true` while a mouse button is currently held down.

**Parameters:**
- `button` (number, optional): The mouse button index. Default is `0`.

**Returns:** `boolean` — `true` if the button is currently pressed, `false` otherwise.

**Example:**
```javascript
function update(dt) {
  if (mouse.down(0)) {
    // Left button held — continuous action
    dragObjectTo(mouse.x, mouse.y);
  }
}
```

### `mouse.drag(button)`
Returns `true` for the single frame when the user starts dragging (holding button while moving). Automatically resets after being read.

**Parameters:**
- `button` (number, optional): The mouse button index. Default is `0`.

**Returns:** `boolean` — `true` on the frame dragging started, `false` otherwise.

**Example:**
```javascript
function update(dt) {
  if (mouse.drag(0)) {
    // Dragging just started
    startDrag(mouse.x, mouse.y);
  }
}
```

### `mouse.up(button)`
Returns `true` for the single frame when a mouse button is released. Automatically resets after being read.

**Parameters:**
- `button` (number, optional): The mouse button index. Default is `0`.

**Returns:** `boolean` — `true` on the frame the button was released, `false` otherwise.

**Example:**
```javascript
function update(dt) {
  if (mouse.up(0)) {
    // Left button released
    endDrag();
  }
}
```

## Touch

### `touch.x`, `touch.y`
Current touch position in pixels relative to the canvas. Single touch only.

**Type:** `number`

### `touch.tap()`
Returns `true` for the single frame when the user taps the screen. Automatically resets after being read.

**Returns:** `boolean` — `true` on the frame the tap occurred, `false` otherwise.

**Example:**
```javascript
function update(dt) {
  if (touch.tap()) {
    // Tap detected
    selectAt(touch.x, touch.y);
  }
}
```

### `touch.down()`
Returns `true` while the screen is currently being touched.

**Returns:** `boolean` — `true` if touching, `false` otherwise.

**Example:**
```javascript
function update(dt) {
  if (touch.down()) {
    // Finger on screen — continuous action
    moveCharacterTo(touch.x, touch.y);
  }
}
```

### `touch.drag()`
Returns `true` for the single frame when the user starts dragging (touching while moving). Automatically resets after being read.

**Returns:** `boolean` — `true` on the frame dragging started, `false` otherwise.

**Example:**
```javascript
function update(dt) {
  if (touch.drag()) {
    // Dragging just started
    startDrag(touch.x, touch.y);
  }
}
```

### `touch.up()`
Returns `true` for the single frame when the user lifts their finger from the screen. Automatically resets after being read.

**Returns:** `boolean` — `true` on the frame the touch ended, `false` otherwise.

**Example:**
```javascript
function update(dt) {
  if (touch.up()) {
    // Touch ended
    endDrag();
  }
}
```
