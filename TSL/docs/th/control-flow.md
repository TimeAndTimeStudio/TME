# TSL Control Flow

Control flow statements กำหนดลำดับที่ code ถูก execute

## ภาพรวม

| Statement | Keyword(s) | AST Node |
|-----------|-----------|----------|
| Conditional | `if`, `else` | `IfStatement` |
| Loop (range) | `for ... in` | `ForStatement` |
| Loop (conditional) | `while` | `WhileStatement` |
| Early exit | `break` | `BreakStatement` |
| Skip iteration | `continue` | `ContinueStatement` |
| No-op | `pass` | `Pass` |

Control flow statements ทั้งหมดใช้ `:` ตามด้วย indented block

---

## If / Else

### Syntax

```tsl
if condition:
    statement
else:
    statement
```

### คำอธิบาย

`if` statement ประเมิน condition และ execute consequent block ถ้า truthy

`else` block ที่เลือกได้จะ execute เมื่อ condition เป็น falsy

### AST Node

```js
IfStatement {
    condition: Expression,
    consequent: Statement[],
    alternate: Statement[] | null,
    location: Location
}
```

### JavaScript ที่สร้าง

```js
if (condition) {
    // consequent
} else {
    // alternate
}
```

### ตัวอย่าง

```tsl
if x > 10:
    print("big")
else:
    print("small")
```

สร้าง:

```js
if (x > 10) {
    console.log("big");
} else {
    console.log("small");
}
```

### Nested If

```tsl
if x > 10:
    if x > 100:
        print("very big")
    else:
        print("medium")
else:
    print("small")
```

สร้าง:

```js
if (x > 10) {
    if (x > 100) {
        console.log("very big");
    } else {
        console.log("medium");
    }
} else {
    console.log("small");
}
```

### หมายเหตุ

- ไม่รองรับ `elif` ใช้ nested `if/else` แทน
- Condition ต้องเป็น expression ที่ประเมินเป็น truthy/falsy value

---

## While

### Syntax

```tsl
while condition:
    statement
```

### คำอธิบาย

`while` statement execute body ซ้ำๆ ตราบเท่าที่ condition เป็น truthy

### AST Node

```js
WhileStatement {
    condition: Expression,
    body: Statement[],
    location: Location
}
```

### JavaScript ที่สร้าง

```js
while (condition) {
    // body
}
```

### ตัวอย่าง

```tsl
x = 0
while x < 10:
    x = x + 1
```

สร้าง:

```js
x = 0;
while (x < 10) {
    x = x + 1;
}
```

### Infinite Loop

```tsl
while true:
    # body
```

สร้าง:

```js
while (true) {
    // body
}
```

---

## For (for-in)

### Syntax

```tsl
for variable in expression:
    statement
```

### คำอธิบาย

`for` statement วนซ้ำผ่าน iterable ใดๆ (arrays, range results, ฯลฯ)

### AST Node

```js
ForStatement {
    variable: Identifier,
    iterable: Expression,
    body: Statement[],
    location: Location
}
```

### JavaScript ที่สร้าง

```js
for (let variable of iterable) {
    // body
}
```

### ตัวอย่าง

```tsl
for item in items:
    print(item)
```

สร้าง:

```js
for (let item of items) {
    console.log(item);
}
```

### การใช้งานทั่วไปกับ range()

```tsl
for i in range(10):
    print(i)
```

สร้าง:

```js
for (let i of range(10)) {
    console.log(i);
}
```

### หมายเหตุ

- Loop variable ถูก declare ด้วย `let` ในแต่ละ iteration scope
- Iterable สามารถเป็น JavaScript iterable ใดๆ (array, range, ฯลฯ)

---

## Break

### Syntax

```tsl
break
```

### คำอธิบาย

`break` statement ออกจาก loop ที่สุดภายในทันที

### AST Node

```js
BreakStatement {
    location: Location
}
```

### JavaScript ที่สร้าง

```js
break;
```

### ตัวอย่าง

```tsl
for item in items:
    if item == target:
        break
    print(item)
```

สร้าง:

```js
for (let item of items) {
    if (item == target) {
        break;
    }
    console.log(item);
}
```

### หมายเหตุ

- `break` นอก loop เป็น **Semantic Error**
- ออกจากเฉพาะ loop ที่สุดภายใน

---

## Continue

### Syntax

```tsl
continue
```

### คำอธิบาย

`continue` statement ข้ามส่วนที่เหลือของ loop iteration ปัจจุบันและไป iteration ถัดไป

### AST Node

```js
ContinueStatement {
    location: Location
}
```

### JavaScript ที่สร้าง

```js
continue;
```

### ตัวอย่าง

```tsl
x = 0
while x < 10:
    x = x + 1
    if x % 2 == 0:
        continue
    print(x)
```

สร้าง:

```js
x = 0;
while (x < 10) {
    x = x + 1;
    if (x % 2 == 0) {
        continue;
    }
    console.log(x);
}
```

### หมายเหตุ

- `continue` นอก loop เป็น **Semantic Error**

---

## Pass

### Syntax

```tsl
pass
```

### คำอธิบาย

`pass` statement เป็น no-op ไม่ทำอะไรที่ runtime

### AST Node

```js
Pass {
    location: Location
}
```

### JavaScript ที่สร้าง

```js
// pass
```

### ตัวอย่าง

```tsl
if x > 10:
    pass
else:
    print("small")
```

สร้าง:

```js
if (x > 10) {
    // pass
} else {
    console.log("small");
}
```

### Use Cases

- Placeholder ใน empty blocks
- บ่งชี้โดยชัดว่าไม่ควรกระทำอะไร

---

## ตัวอย่างสมบูรณ์

```tsl
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
sum = 0
count = 0

for n in numbers:
    if n > 8:
        break
    if n % 2 == 0:
        continue
    sum = sum + n
    count = count + 1

if count > 0:
    average = sum / count
    print(average)
else:
    pass
```

สร้าง:

```js
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
sum = 0;
count = 0;

for (let n of numbers) {
    if (n > 8) {
        break;
    }
    if (n % 2 == 0) {
        continue;
    }
    sum = sum + n;
    count = count + 1;
}

if (count > 0) {
    average = sum / count;
    console.log(average);
} else {
    // pass
}
```

---

## Reference

- **Parser**: `src/parser.js` — `parseIf()`, `parseWhile()`, `parseFor()`, `parseBreak()`, `parseContinue()`, `parsePass()`
- **Generator**: `src/generator.js` — `generateIfStatement()`, `generateWhileStatement()`, `generateForStatement()`, `generateBreakStatement()`, `generateContinueStatement()`, `generatePass()`
- **AST**: `src/ast.js` — `IfStatement`, `WhileStatement`, `ForStatement`, `BreakStatement`, `ContinueStatement`, `Pass`
