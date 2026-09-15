# API สาธารณะ

## `start()`
เริ่มวงจรชีวิตของเกม ก่อนเรียก `start()` จะไม่มี game loop หรือการเรนเดอร์ หลังเรียกแล้วเอนจินจะเข้าสู่ลูป fixed-timestep

**Signature:**
```typescript
start(game: object, fps?: number): void
```

**พารามิเตอร์:**
- `game` (object): วัตถุเกมที่มีเมธอด `update(dt)` และ `draw()`
- `fps` (number, ไม่บังคับ): อัตราเฟรมเป้าหมาย ค่าเริ่มต้นคือ `60`

**ตัวอย่าง:**
```javascript
start({
  update(dt) {
    // ลอจิกเกมที่นี่
  },
  draw() {
    // การเรนเดอร์ที่นี่
  }
}, 60);
```

## `update(dt)`
เรียกทุกเฟรมพร้อมค่า delta time ใช้สำหรับลอจิกเกม ฟิสิกส์ และการอัปเดตสถานะ

**Signature:**
```typescript
update(dt: number): void
```

**พารามิเตอร์:**
- `dt` (number): เวลาที่ผ่านไปตั้งแต่เฟรมก่อนหน้าเป็นวินาที

## `draw()`
เรียกหลัง `update()` คิวคำสั่งเรนเดอร์ทั้งหมดเพื่อส่งไปยัง WebGPU

**Signature:**
```typescript
draw(): void
```

## `fps(target)`
ตั้งค่าอัตราเฟรมเป้าหมายสำหรับลูป fixed timestep

**Signature:**
```typescript
fps(target: number): void
```

**พารามิเตอร์:**
- `target` (number): อัตราเฟรมเป้าหมาย
