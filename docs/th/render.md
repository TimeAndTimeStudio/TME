# การเรนเดอร์

## `rect(x, y, width, height, color, opts?)`
วาดสี่เหลี่ยมเติมเต็มพร้อมการแปลงรูปทรงแบบเลือกได้ เรนเดอร์ผ่าน WebGPU พร้อม alpha blending

**Signature:**
```typescript
rect(x: number, y: number, width: number, height: number, color: string, opts?: TransformOptions): void
```

**พารามิเตอร์:**
- `x` (number): พิกัด X ของมุมบนซ้าย
- `y` (number): พิกัด Y ของมุมบนซ้าย
- `width` (number): ความกว้าง
- `height` (number): ความสูง
- `color` (string): สีเติม รูปแบบ hex รองรับ `#RRGGBB` หรือ `#RRGGBBAA`
- `opts` (object, ไม่บังคับ): ตัวเลือกการแปลงรูปทรง

**TransformOptions:**
- `rotation` (number): มุมหมุนเป็นองศา ค่าเริ่มต้น `0`
- `scale` (number): อัตราส่วนขยายแบบเดียวกัน ค่าเริ่มต้น `1`
- `alpha` (number): ความทึบแสงจาก `0` (โปร่งใส) ถึง `1` (ทึบ) ค่าเริ่มต้น `1`

**พฤติกรรมค่าเริ่มต้น:**
หากไม่ใส่ `opts` หรือใส่ `undefined` การแปลงรูปทรงทั้งหมดจะใช้ค่าเริ่มต้น (rotation: 0, scale: 1, alpha: 1) สี่เหลี่ยมจะวาดด้วยความทึบเต็ม ไม่มีหมุนหรือขยาย

**ตัวอย่าง:**
```javascript
rect(100, 100, 64, 64, '#FF5733');
rect(200, 200, 50, 50, '#33FF57', { rotation: 45, scale: 2, alpha: 0.5 });
```

## `image(src, x, y, width, height, opts?)`
โหลดและวาดภาพแบบขอใช้เมื่อจำเป็นพร้อมการแปลงรูปทรงแบบเลือกได้ ภาพโหลดแบบ asynchronous และเก็บใน LRU cache

**Signature:**
```typescript
image(src: string, x: number, y: number, width?: number, height?: number, opts?: TransformOptions): void
image(src: string, x: number, y: number, opts?: TransformOptions): void
```

**พารามิเตอร์:**
- `src` (string): เส้นทางไปยังไฟล์ภาพ (เช่น `'images/player.png'`)
- `x` (number): พิกัด X ของมุมบนซ้าย
- `y` (number): พิกัด Y ของมุมบนซ้าย
- `width` (number, ไม่บังคับ): ความกว้างที่แสดง ถ้าไม่ระบุใช้ความกว้างเดิมของภาพ
- `height` (number, ไม่บังคับ): ความสูงที่แสดง ถ้าไม่ระบุใช้ความสูงเดิมของภาพ
- `opts` (object, ไม่บังคับ): ตัวเลือกการแปลงรูปทรง

**TransformOptions:**
- `rotation` (number): มุมหมุนเป็นองศา ค่าเริ่มต้น `0`
- `scale` (number): อัตราส่วนขยายแบบเดียวกัน ค่าเริ่มต้น `1`
- `alpha` (number): ความทึบแสงจาก `0` ถึง `1` ค่าเริ่มต้น `1`

**พฤติกรรมค่าเริ่มต้น:**
หากไม่ใส่ `opts` หรือใส่ `undefined` การแปลงรูปทรงทั้งหมดจะใช้ค่าเริ่มต้น (rotation: 0, scale: 1, alpha: 1) ภาพจะวาดที่ขนาดเดิม ความทึบเต็ม ไม่มีหมุน

**ตัวอย่าง:**
```javascript
image('images/player.png', 100, 100, 64, 64);
image('images/enemy.png', 200, 150, { rotation: 90, scale: 1.5, alpha: 0.8 });
```

