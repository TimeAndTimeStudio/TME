# การเรนเดอร์

## `rect(x, y, width, height, color, rotation?, scale?, alpha?)`
วาดสี่เหลี่ยมเติมเต็มพร้อมการแปลงรูปทรงแบบเลือกได้ เรนเดอร์ผ่าน WebGPU พร้อม alpha blending

**Signature:**
```typescript
rect(x: number, y: number, width: number, height: number, color: string, rotation?: number, scale?: number, alpha?: number): void
```

**พารามิเตอร์:**
- `x` (number): พิกัด X ของมุมบนซ้าย
- `y` (number): พิกัด Y ของมุมบนซ้าย
- `width` (number): ความกว้าง
- `height` (number): ความสูง
- `color` (string): สีเติม รูปแบบ hex รองรับ `#RRGGBB` หรือ `#RRGGBBAA`
- `rotation` (number, ไม่บังคับ): มุมหมุนเป็นองศา ค่าเริ่มต้น `0`
- `scale` (number, ไม่บังคับ): อัตราส่วนขยายแบบเดียวกัน ค่าเริ่มต้น `1`
- `alpha` (number, ไม่บังคับ): ความทึบแสงจาก `0` (โปร่งใส) ถึง `1` (ทึบ) ค่าเริ่มต้นใช้ alpha ของสี

**พฤติกรรมค่าเริ่มต้น:**
หากไม่ใส่พารามิเตอร์การแปลงรูปทรง จะใช้ค่าเริ่มต้น (rotation: 0, scale: 1, alpha: alpha ของสี) สี่เหลี่ยมจะวาดด้วยความทึบเต็ม ไม่มีหมุนหรือขยาย

**ตัวอย่าง:**
```javascript
rect(100, 100, 64, 64, '#FF5733');
rect(200, 200, 50, 50, '#33FF57', 45, 2, 0.5);
```

## `image(src, x, y, width, height, rotation?, scale?, alpha?)`
โหลดและวาดภาพแบบขอใช้เมื่อจำเป็นพร้อมการแปลงรูปทรงแบบเลือกได้ ภาพโหลดแบบ asynchronous และเก็บใน LRU cache

**Signature:**
```typescript
image(src: string, x: number, y: number, width?: number, height?: number, rotation?: number, scale?: number, alpha?: number): void
```

**พารามิเตอร์:**
- `src` (string): เส้นทางไปยังไฟล์ภาพ (เช่น `'images/player.png'`)
- `x` (number): พิกัด X ของมุมบนซ้าย
- `y` (number): พิกัด Y ของมุมบนซ้าย
- `width` (number, ไม่บังคับ): ความกว้างที่แสดง ถ้าไม่ระบุใช้ความกว้างเดิมของภาพ
- `height` (number, ไม่บังคับ): ความสูงที่แสดง ถ้าไม่ระบุใช้ความสูงเดิมของภาพ
- `rotation` (number, ไม่บังคับ): มุมหมุนเป็นองศา ค่าเริ่มต้น `0`
- `scale` (number, ไม่บังคับ): อัตราส่วนขยายแบบเดียวกัน ค่าเริ่มต้น `1`
- `alpha` (number, ไม่บังคับ): ความทึบแสงจาก `0` ถึง `1` ค่าเริ่มต้น `1`

**พฤติกรรมค่าเริ่มต้น:**
หากไม่ใส่พารามิเตอร์การแปลงรูปทรง จะใช้ค่าเริ่มต้น (rotation: 0, scale: 1, alpha: 1) ภาพจะวาดที่ขนาดเดิม ความทึบเต็ม ไม่มีหมุน

**ตัวอย่าง:**
```javascript
image('images/player.png', 100, 100, 64, 64);
image('images/enemy.png', 200, 150, 90, 1.5, 0.8);
```

