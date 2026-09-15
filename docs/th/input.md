# อินพุต

## คีย์บอร์ด

### `key.down(key)`
ตรวจสอบว่าปุ่มใดปุ่มหนึ่งกำลังถูกกดอยู่ในขณะนั้น

**พารามิเตอร์:**
- `key` (string): ระบุชื่อปุ่ม รองรับชื่อมาตรฐาน DOM

**ค่าที่คืน:** `boolean` — `true` หากปุ่มกำลังถูกกด, `false` หากไม่ถูกกด

**ปุ่มที่รองรับ:**
- ลูกศร: `'ArrowUp'`, `'ArrowDown'`, `'ArrowLeft'`, `'ArrowRight'`
- ตัวอักษร: `'KeyA'`, `'KeyB'`, ..., `'KeyZ'`
- ตัวเลข: `'Digit0'`, `'Digit1'`, ..., `'Digit9'`
- พิเศษ: `'Space'`, `'Enter'`, `'Escape'`, `'Tab'`

**ตัวอย่าง:**
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

## เมาส์

### `mouse.x`, `mouse.y`
ตำแหน่งเมาส์ปัจจุบันเป็นพิกเซลเมื่อเทียบกับ canvas

**ประเภท:** `number`

### `mouse.click(button)`
คืนค่า `true` ในเฟรมเดียวเมื่อกดปุ่มเมาส์ แล้วรีเซ็ตเป็น `false` อัตโนมัติ

**พารามิเตอร์:**
- `button` (number, ไม่บังคับ): ระบุปุ่มเมาส์ ค่าเริ่มต้นคือ `0`
  - `0` — ปุ่มซ้าย
  - `1` — ปุ่มกลาง (ล้อเลื่อน)
  - `2` — ปุ่มขวา

**ค่าที่คืน:** `boolean` — `true` ในเฟรมที่คลิก, `false` ในเฟรมอื่น

**ตัวอย่าง:**
```javascript
function update(dt) {
  if (mouse.click(0)) {
    // ตรวจจับการคลิกซ้าย
    selectObjectAt(mouse.x, mouse.y);
  }
}
```

### `mouse.down(button)`
คืนค่า `true` ขณะปุ่มเมาส์ถูกกดค้างอยู่

**พารามิเตอร์:**
- `button` (number, ไม่บังคับ): ระบุปุ่มเมาส์ ค่าเริ่มต้นคือ `0`

**ค่าที่คืน:** `boolean` — `true` หากปุ่มกำลังถูกกด, `false` หากปล่อยแล้ว

**ตัวอย่าง:**
```javascript
function update(dt) {
  if (mouse.down(0)) {
    // กดค้างไว้ — ดำเนินการต่อเนื่อง
    dragObjectTo(mouse.x, mouse.y);
  }
}
```

### `mouse.drag(button)`
คืนค่า `true` ในเฟรมเดียวเมื่อผู้ใช้เริ่มลาก (กดปุ่มแล้วเลื่อนเมาส์) แล้วรีเซ็ตเป็น `false` อัตโนมัติ

**พารามิเตอร์:**
- `button` (number, ไม่บังคับ): ระบุปุ่มเมาส์ ค่าเริ่มต้นคือ `0`

**ค่าที่คืน:** `boolean` — `true` ในเฟรมที่เริ่มลาก, `false` ในเฟรมอื่น

**ตัวอย่าง:**
```javascript
function update(dt) {
  if (mouse.drag(0)) {
    // เริ่มลากแล้ว
    startDrag(mouse.x, mouse.y);
  }
}
```

### `mouse.up(button)`
คืนค่า `true` ในเฟรมเดียวเมื่อผู้ใช้ปล่อยปุ่มเมาส์ แล้วรีเซ็ตเป็น `false` อัตโนมัติ

**พารามิเตอร์:**
- `button` (number, ไม่บังคับ): ระบุปุ่มเมาส์ ค่าเริ่มต้นคือ `0`

**ค่าที่คืน:** `boolean` — `true` ในเฟรมที่ปล่อยปุ่ม, `false` ในเฟรมอื่น

**ตัวอย่าง:**
```javascript
function update(dt) {
  if (mouse.up(0)) {
    // ปล่อยปุ่มซ้าย
    endDrag();
  }
}
```

## หน้าจอสัมผัส

### `touch.x`, `touch.y`
ตำแหน่งสัมผัสปัจจุบันเป็นพิกเซลเมื่อเทียบกับ canvas รองรับเพียงจุดเดียว

**ประเภท:** `number`

### `touch.tap()`
คืนค่า `true` ในเฟรมเดียวเมื่อผู้ใช้แตะหน้าจอ แล้วรีเซ็ตเป็น `false` อัตโนมัติ

**ค่าที่คืน:** `boolean` — `true` ในเฟรมที่แตะ, `false` ในเฟรมอื่น

**ตัวอย่าง:**
```javascript
function update(dt) {
  if (touch.tap()) {
    // ตรวจจับการแตะ
    selectAt(touch.x, touch.y);
  }
}
```

### `touch.down()`
คืนค่า `true` ขณะที่มีนิ้วแตะอยู่บนหน้าจอ

**ค่าที่คืน:** `boolean` — `true` หากกำลังแตะ, `false` หากไม่แตะ

**ตัวอย่าง:**
```javascript
function update(dt) {
  if (touch.down()) {
    // มีนิ้วบนหน้าจอ — ดำเนินการต่อเนื่อง
    moveCharacterTo(touch.x, touch.y);
  }
}
```

### `touch.drag()`
คืนค่า `true` ในเฟรมเดียวเมื่อผู้ใช้เริ่มลาก (แตะแล้วเลื่อนนิ้ว) แล้วรีเซ็ตเป็น `false` อัตโนมัติ

**ค่าที่คืน:** `boolean` — `true` ในเฟรมที่เริ่มลาก, `false` ในเฟรมอื่น

**ตัวอย่าง:**
```javascript
function update(dt) {
  if (touch.drag()) {
    // เริ่มลากแล้ว
    startDrag(touch.x, touch.y);
  }
}
```

### `touch.up()`
คืนค่า `true` ในเฟรมเดียวเมื่อผู้ใช้ยกนิ้วออกจากหน้าจอ แล้วรีเซ็ตเป็น `false` อัตโนมัติ

**ค่าที่คืน:** `boolean` — `true` ในเฟรมที่หยุดแตะ, `false` ในเฟรมอื่น

**ตัวอย่าง:**
```javascript
function update(dt) {
  if (touch.up()) {
    // หยุดแตะแล้ว
    endDrag();
  }
}
```
