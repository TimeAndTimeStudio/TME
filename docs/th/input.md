# อินพุต

## คีย์บอร์ด

### `key.down(key)`
ตรวจสอบว่าปุ่มใดปุ่มหนึ่งกำลังถูกกดอยู่ในขณะนั้น

**Signature:**
```typescript
key.down(key: string | number): boolean
```

**พารามิเตอร์:**
- `key` (string | number): ระบุชื่อปุ่ม รองรับตัวอักษร ตัวเลข ปุ่มฟังก์ชัน และปุ่มพิเศษ

**ปุ่มที่รองรับ:**

| ประเภท | ค่า |
|----------|--------|
| ตัวอักษร | `'A'`–`'Z'` (ไม่สน case) |
| ตัวเลข | `0`–`9` หรือ `'0'`–`'9'` |
| ฟังก์ชัน | `'F1'`–`'F12'` |
| พิเศษ | `'SPACE'`, `'ENTER'`, `'ESC'`, `'TAB'`, `'CTRL'`, `'SHIFT'`, `'ALT'` |
| นำทาง | `'UP'`, `'DOWN'`, `'LEFT'`, `'RIGHT'`, `'HOME'`, `'END'`, `'PAGEUP'`, `'PAGEDOWN'` |
| แก้ไข | `'DELETE'`, `'BACKSPACE'`, `'CAPSLOCK'` |

**ค่าที่คืน:** `boolean` — `true` หากปุ่มกำลังถูกกด, `false` หากไม่ถูกกด

**ตัวอย่าง:**
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
    // กดปุ่ม '1'
    selectWeapon(1);
  }
}
```

## เมาส์

### `mouse.x`, `mouse.y`
ตำแหน่งเมาส์ปัจจุบันเป็นพิกเซลเมื่อเทียบกับ canvas

**ประเภท:** `number`

### `mouse.click(button)`
คืนค่า `true` ในเฟรมเดียวเมื่อกดปุ่มเมาส์ แล้วรีเซ็ตเป็น `false` อัตโนมัติ

**Signature:**
```typescript
mouse.click(button?: number): boolean
```

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
    selectObjectAt(mouse.x, mouse.y);
  }
}
```

### `mouse.down(button)`
คืนค่า `true` ขณะปุ่มเมาส์ถูกกดค้างอยู่

**Signature:**
```typescript
mouse.down(button?: number): boolean
```

**พารามิเตอร์:**
- `button` (number, ไม่บังคับ): ระบุปุ่มเมาส์ ค่าเริ่มต้นคือ `0`

**ค่าที่คืน:** `boolean` — `true` หากปุ่มกำลังถูกกด, `false` หากปล่อยแล้ว

### `mouse.drag(button)`
คืนค่า `true` ในเฟรมเดียวเมื่อผู้ใช้เริ่มลาก (กดปุ่มแล้วเลื่อนเมาส์) แล้วรีเซ็ตเป็น `false` อัตโนมัติ

**Signature:**
```typescript
mouse.drag(button?: number): boolean
```

**พารามิเตอร์:**
- `button` (number, ไม่บังคับ): ระบุปุ่มเมาส์ ค่าเริ่มต้นคือ `0`

**ค่าที่คืน:** `boolean` — `true` ในเฟรมที่เริ่มลาก, `false` ในเฟรมอื่น

### `mouse.up(button)`
คืนค่า `true` ในเฟรมเดียวเมื่อผู้ใช้ปล่อยปุ่มเมาส์ แล้วรีเซ็ตเป็น `false` อัตโนมัติ

**Signature:**
```typescript
mouse.up(button?: number): boolean
```

**พารามิเตอร์:**
- `button` (number, ไม่บังคับ): ระบุปุ่มเมาส์ ค่าเริ่มต้นคือ `0`

**ค่าที่คืน:** `boolean` — `true` ในเฟรมที่ปล่อยปุ่ม, `false` ในเฟรมอื่น

## หน้าจอสัมผัส

### `touch.x`, `touch.y`
ตำแหน่งสัมผัสปัจจุบันเป็นพิกเซลเมื่อเทียบกับ canvas รองรับเพียงจุดเดียว

**ประเภท:** `number`

### `touch.tap()`
คืนค่า `true` ในเฟรมเดียวเมื่อผู้ใช้แตะหน้าจอ แล้วรีเซ็ตเป็น `false` อัตโนมัติ

**Signature:**
```typescript
touch.tap(): boolean
```

**ค่าที่คืน:** `boolean` — `true` ในเฟรมที่แตะ, `false` ในเฟรมอื่น

### `touch.down()`
คืนค่า `true` ขณะที่มีนิ้วแตะอยู่บนหน้าจอ

**Signature:**
```typescript
touch.down(): boolean
```

**ค่าที่คืน:** `boolean` — `true` หากกำลังแตะ, `false` หากไม่แตะ

### `touch.drag()`
คืนค่า `true` ในเฟรมเดียวเมื่อผู้ใช้เริ่มลาก (แตะแล้วเลื่อนนิ้ว) แล้วรีเซ็ตเป็น `false` อัตโนมัติ

**Signature:**
```typescript
touch.drag(): boolean
```

**ค่าที่คืน:** `boolean` — `true` ในเฟรมที่เริ่มลาก, `false` ในเฟรมอื่น

### `touch.up()`
คืนค่า `true` ในเฟรมเดียวเมื่อผู้ใช้ยกนิ้วออกจากหน้าจอ แล้วรีเซ็ตเป็น `false` อัตโนมัติ

**Signature:**
```typescript
touch.up(): boolean
```

**ค่าที่คืน:** `boolean` — `true` ในเฟรมที่หยุดแตะ, `false` ในเฟรมอื่น
