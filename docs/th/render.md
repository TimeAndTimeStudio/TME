# การเรนเดอร์

## `rect(x, y, width, height, color)`
วาดสี่เหลี่ยมเติมเต็ม รองรับสีรูปแบบ hex เช่น `#FF5733` เรนเดอร์ผ่าน WebGPU พร้อมรองรับการแปลงรูปทรง

## `image(src, x, y, width, height)`
โหลดและวาดภาพแบบขอใช้เมื่อจำเป็น รองรับ transformation:
```javascript
image(src, x, y, width, height, {
  rotation: 0,      // เรเดียน
  scale: 1,         // ค่าเดียวหรือ {x, y}
  alpha: 1          // 0 ถึง 1
})
```

## กฎการเรนเดอร์
- ใช้ WebGPU เท่านั้น ไม่มี Canvas2D หรือ WebGL รองรับ
- ลำดับการวาดกำหนดความลึก (ไม่มี z-buffer)
- โหลดภาพแบบ asynchronous และเก็บเท็กซ์เจอร์ใน LRU cache
- ทรัพยากรจะถูกลบอัตโนมัติเมื่อไม่มีการอ้างอิงถึง
