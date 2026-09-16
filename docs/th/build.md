# Build

## คำสั่ง

```bash
cd /path/to/TME
node tme/bin/tme build
```

## Output

```
dist/
├── index.html
├── game.js
├── engine.js
├── style.css
└── assets/
```

## กฎสำคัญ

- WebGPU เท่านั้น — ไม่มี fallback
- index.html ต้องมี canvas#game
- style.css เป็น user-owned — build ไม่ทับ
