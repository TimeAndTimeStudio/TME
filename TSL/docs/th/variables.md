# TSL Variables

## ภาพรวม

Variables ใน TSL ถูกสร้างครั้งแรกที่ assign ภายใน scope โดยใช้ `let` ใน JavaScript ที่สร้าง การ reassign ใน scope เดิมหรือ outer scope ไม่ใช้ `let`

```tsl
x = 10      # First assignment: let x = 10;
x = 20      # Reassignment: x = 20;
```

---

## Declaration

การ assign ตัวแปรชื่อแรกใน visible scope ใดๆ สร้างตัวแปร Generator emit `let`:

```tsl
x = 10
name = "TSL"
count = 0
```

สร้าง:

```js
let x = 10;
let name = "TSL";
let count = 0;
```

---

## Reassignment

เมื่อ variable ถูก declare ใน visible scope ใดๆ การ assign ครั้งต่อไปด้วยชื่อเดียวกันไม่ใช้ `let`:

```tsl
x = 10
x = 20
```

สร้าง:

```js
let x = 10;
x = 20;
```

Compiler ติดตาม variables ที่ declare แล้วต่อ scope โดยใช้ stack ของ sets `isDeclared()` ตรวจสอบจาก innermost ไป outermost scope

---

## Scope Rules

TSL ใช้ **lexical scope** Compiler รักษา `scopeStack` — array ของ sets โดยแต่ละ set ติดตาม variable names ที่ declare ใน scope นั้น

### Scope Hierarchy

Scopes ถูกสร้างโดย:

- Function declarations
- `if` / `else` blocks
- `while` loops
- `for` loops
- Nested blocks

### กฎ

1. **Inner scope อ่าน outer scope variables ได้** — `isDeclared()` ตรวจสอบทุก scope จากในออกนอก
2. **Inner scope reassign outer scope variables ได้** — ถ้าชื่อ declare ใน outer scope การ assign ใน inner ไม่ใช้ `let`
3. **Inner scope declare ตัวแปรใหม่ได้** — การ assign ครั้งแรกใน inner scope ใช้ `let` และ shadow outer names
4. **Outer scope ไม่เห็น inner scope variables** — variables ที่ declare ใน inner scopes ไม่ visible หลัง block จบ

### ตัวอย่าง: Function Scope

```tsl
x = 10

function foo():
    y = 1       # let y = 1; (new scope)
    x = 20      # x = 20; (reassign outer)
    y = 2       # y = 2; (same scope, no let)
```

สร้าง:

```js
let x = 10;
function foo() {
  let y = 1;
  x = 20;
  y = 2;
}
```

### ตัวอย่าง: Block Scope

```tsl
x = 1

if (true):
    x = 2       # x = 2; (reassign outer, no let)
    y = 3       # let y = 3; (new scope)
```

สร้าง:

```js
let x = 1;
if (true) {
  x = 2;
  let y = 3;
}
```

### ตัวอย่าง: Variable Shadowing

```tsl
if (true):
    y = 10
else:
    y = 20
```

สร้าง:

```js
if (true) {
  let y = 10;
} else {
  let y = 20;
}
```

แต่ละ branch declare `y` ของตัวเอง ไม่ shadow กัน

### ตัวอย่าง: For Loop Variable

```tsl
for i in range(3):
    print(i)
print(i)
```

สร้าง:

```js
for (let i of range(3)) {
  print(i);
}
print(i);
```

Loop variable `i` ถูก scope กับ `for` body โดย JavaScript `let` semantics

---

## Member Assignment

การ assign object properties ไม่ใช้ `let`:

```tsl
player.x = 100
player.y = 200
```

สร้าง:

```js
player.x = 100;
player.y = 200;
```

---

## Array Assignment

การ assign array indices ไม่ใช้ `let`:

```tsl
arr[0] = 10
arr[1] = 20
```

สร้าง:

```js
arr[0] = 10;
arr[1] = 20;
```

---

## Function Parameters

Function parameters ถูก declare อัตโนมัติใน function scope การ assign กับ parameters ไม่ใช้ `let`:

```tsl
function add(a):
    a = a + 1
    return a
```

สร้าง:

```js
function add(a) {
  a = (a + 1);
  return a;
}
```

---

## Implementation Details

Generator ติดตาม scope ด้วย:

| Function | คำอธิบาย |
|---|---|
| `reset()` | Initializes `scopeStack = [new Set()]` |
| `pushScope()` | Creates new scope set, increments indent |
| `popScope()` | Removes current scope set, decrements indent |
| `declareVar(name)` | Adds name to current scope set |
| `isDeclared(name)` | Checks all scopes from inner to outer |

### Assignment Logic

```
if left is MemberExpression:
    emit "left = right;"
else if left is ArrayAccess:
    emit "left = right;"
else if isDeclared(left.name):
    emit "left = right;"
else:
    declareVar(left.name)
    emit "let left = right;"
```

---

## Summary Table

| TSL Code | Generated JavaScript |
|---|---|
| `x = 10` | `let x = 10;` |
| `x = 20` (after declaration) | `x = 20;` |
| `name = "TSL"` | `let name = "TSL";` |
| `player.x = 100` | `player.x = 100;` |
| `arr[0] = 10` | `arr[0] = 10;` |
| `function foo(): y = 1` | `function foo() { let y = 1; }` |
| `if (true): x = 1` (outer x) | `if (true) { x = 1; }` |
| `if (true): y = 1` (new) | `if (true) { let y = 1; }` |
