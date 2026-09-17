# Objects

Objects เป็น collections ของ key-value pairs Keys เป็น strings Values เป็น expression ใดๆ ได้

## การสร้าง Objects

ใช้ curly braces พร้อม quoted keys

```tsl
obj = { "key": value }
```

สร้าง:

```js
let obj = { "key": value };
```

### ตัวอย่าง

```tsl
player = { "name": "Alice", "score": 100 }
```

สร้าง:

```js
let player = { "name": "Alice", "score": 100 };
```

## Nested Objects

Objects สามารถ contain objects อื่นๆ ได้

```tsl
config = {
    "server": { "host": "localhost", "port": 8080 }
}
```

สร้าง:

```js
let config = { "server": { "host": "localhost", "port": 8080 } };
```

## การเข้าถึง Member

เข้าถึง object properties ด้วย dot notation

```tsl
name = player.name
```

สร้าง:

```js
name = player.name;
```

### ตัวอย่าง

```tsl
player = { "name": "Alice", "score": 100 }
print(player.name)
```

สร้าง:

```js
let player = { "name": "Alice", "score": 100 };
console.log(player.name);
```

## การกำหนดค่า Member

กำหนดค่า object properties ด้วย dot notation

```tsl
player.name = "TSL"
```

สร้าง:

```js
player.name = "TSL";
```

### ตัวอย่าง

```tsl
player = { "name": "Alice", "score": 100 }
print(player.name)
player.score = 200
print(player.score)
```

สร้าง:

```js
let player = { "name": "Alice", "score": 100 };
console.log(player.name);
player.score = 200;
console.log(player.score);
```

## Chained Member Access

Chain property access ผ่าน nested objects

```tsl
value = obj.prop1.prop2
```

สร้าง:

```js
value = obj.prop1.prop2;
```

### ตัวอย่าง

```tsl
config = { "server": { "host": "localhost", "port": 8080 } }
host = config.server.host
```

สร้าง:

```js
let config = { "server": { "host": "localhost", "port": 8080 } };
let host = config.server.host;
```
