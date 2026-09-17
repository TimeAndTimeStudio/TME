# TSL Data Types

## ภาพรวม

TSL ไม่มี static type system Types ปฏิบัติตาม JavaScript semantics

TSL variables เป็น dynamically typed — type ถูกกำหนดที่ runtime โดย JavaScript engine

---

## Number

จำนวนเต็มและ floating-point numbers

```tsl
x = 10
pi = 3.14
```

สร้าง:

```js
let x = 10;
let pi = 3.14;
```

numbers ทั้งหมดใช้ JavaScript `Number` (IEEE 754 double precision)

### Literal Syntax

```tsl
42
0
-3
3.14
0.5
```

lexer รับ:

- Decimal integers: `10`, `42`, `0`
- Decimal floats: `3.14`, `0.5`

Scientific notation ไม่รองรับใน v1.0

---

## String

Text ที่ enclosed ใน double quotes หรือ single quotes

```tsl
name = "hello"
greeting = 'world'
```

สร้าง:

```js
let name = "hello";
let greeting = "world";
```

### Escape Sequences

| Escape | Meaning |
|--------|---------|
| `\\n`  | newline |
| `\\t`  | tab |
| `\\\\` | backslash |
| `\\"`  | double quote |
| `\\'`  | single quote |

ตัวอย่าง:

```tsl
msg = "line1\nline2"
path = 'C:\\Users\\name'
quote = "she said \"hi\""
```

สร้าง:

```js
let msg = "line1\nline2";
let path = "C:\\Users\\name";
let quote = "she said \"hi\"";
```

generator ใช้ `JSON.stringify()` เพื่อสร้าง JavaScript string literals ที่ถูกต้อง

---

## Boolean

Logical true/false values

```tsl
flag = true
disabled = false
```

สร้าง:

```js
let flag = true;
let disabled = false;
```

Keywords: `true`, `false`

ใช้ใน conditions:

```tsl
if flag:
    print("enabled")
```

---

## Null

แทนค่าที่ขาดหายหรือไม่กำหนด

```tsl
value = null
```

สร้าง:

```js
let value = null;
```

Keyword: `null`

---

## Arrays

Ordered collections ของ values

```tsl
items = [10, 20, 30]
names = ["a", "b", "c"]
```

สร้าง:

```js
let items = [10, 20, 30];
let names = ["a", "b", "c"];
```

### Indexing

```tsl
first = items[0]
```

สร้าง:

```js
let first = items[0];
```

### Assignment to Index

```tsl
items[0] = 99
```

สร้าง:

```js
items[0] = 99;
```

---

## Objects

Key-value collections

```tsl
player = {
    x: 100,
    y: 200
}
```

สร้าง:

```js
let player = {
    x: 100,
    y: 200
};
```

Keys ต้องเป็น identifiers Values เป็น expression ใดๆ ได้

### Member Access

```tsl
px = player.x
```

สร้าง:

```js
let px = player.x;
```

### Assignment to Member

```tsl
player.x = 300
```

สร้าง:

```js
player.x = 300;
```

---

## Type Summary

| Type   | TSL Literal    | JavaScript Output |
|--------|----------------|-------------------|
| Number | `10`, `3.14`   | `10`, `3.14`      |
| String | `"hi"`, `'hi'` | `"hi"`, `'hi'`    |
| Boolean | `true`, `false` | `true`, `false`  |
| Null   | `null`         | `null`            |
| Array  | `[1, 2]`       | `[1, 2]`          |
| Object | `{x: 1}`       | `{ x: 1 }`        |

---

## No Type Declarations

TSL ไม่ต้องการหรือรองรับ type declarations

```tsl
# ถูกต้อง - ไม่ต้องมี type
x = 10
x = "hello"
```

JavaScript engine จัดการ typing ทั้งหมดที่ runtime

---

## Implementation Notes

### Lexer

- Numbers: parsed โดย `readNumber()` ใน `src/lexer.js`
- Strings: parsed โดย `readString()` ใน `src/lexer.js`, รองรับ escape sequences
- Booleans: `true`/`false` recognized เป็น keywords
- Null: `null` recognized เป็น keyword

### AST

| Type      | AST Node         |
|-----------|------------------|
| Number    | `NumberLiteral`  |
| String    | `StringLiteral`  |
| Boolean   | `BooleanLiteral` |
| Null      | `NullLiteral`    |
| Array     | `ArrayExpression`|
| Object    | `ObjectExpression`|

### Generator

- Numbers: `String(node.value)`
- Strings: `JSON.stringify(node.value)`
- Booleans: `node.value ? 'true' : 'false'`
- Null: `'null'`
- Arrays: `'[${elements.join(', ')}]'`
- Objects: `'{ ${props.join(', ')} }'`
