# TSL Functions

## ภาพรวม

TSL functions ถูก declare ด้วย `function` keyword ตามด้วย name, parentheses สำหรับ parameters, colon และ indented body block

```tsl
function name(params):
    body
```

Functions สร้าง JavaScript `function` declarations

---

## Function Declaration

### Syntax

```tsl
function name(params):
    body
```

- `function` เป็น reserved keyword
- `name` เป็น identifier
- `params` เป็น comma-separated list ของ identifiers
- `:` จบ function signature line
- Body เป็น indented block ของ statements

### ตัวอย่าง

```tsl
function add(a, b):
    return a + b
```

สร้าง:

```js
function add(a, b) {
  return a + b;
}
```

### No Parameters

Function สามารถไม่มี parameters ได้

```tsl
function greet():
    print("Hello!")
```

สร้าง:

```js
function greet() {
  console.log("Hello!");
}
```

### Multiple Parameters

Parameters คั่นด้วย commas

```tsl
function sum(a, b, c):
    return a + b + c
```

สร้าง:

```js
function sum(a, b, c) {
  return a + b + c;
}
```

### Parameter Rules

- แต่ละ parameter ต้องเป็น valid identifier
- ไม่มี default values
- ไม่มี rest parameters
- ไม่มี type annotations (v1.0)

---

## Function Call

Function ถูกเรียกโดยเขียน name ตามด้วย parentheses ที่มี arguments

### Syntax

```tsl
name(args)
```

### ตัวอย่าง

```tsl
result = add(10, 20)
print(result)
```

สร้าง:

```js
let result = add(10, 20);
console.log(result);
```

### No Arguments

```tsl
greet()
```

สร้าง:

```js
greet();
```

### Nested Calls

Function calls สามารถ nested ได้

```tsl
result = add(multiply(2, 3), 5)
```

สร้าง:

```js
let result = add(multiply(2, 3), 5);
```

### Call as Expression

Function call ปรากฏได้ทุกที่ที่ expression ถูกต้อง

```tsl
x = add(1, 2) + multiply(3, 4)
```

สร้าง:

```js
let x = add(1, 2) + multiply(3, 4);
```

---

## Return

`return` statement ออกจาก function และ optionally return value

### With Value

```tsl
function multiply(x, y):
    return x * y
```

สร้าง:

```js
function multiply(x, y) {
  return x * y;
}
```

### Without Value

```tsl
function doSomething():
    print("doing something")
    return
    print("this line is unreachable")
```

สร้าง:

```js
function doSomething() {
  console.log("doing something");
  return;
  console.log("this line is unreachable");
}
```

### Return Rules

- `return` ต้องอยู่ใน function
- `return` นอก function เป็น **semantic error**
- `return` โดยไม่มี value สร้าง `return;`
- `return` พร้อม expression สร้าง `return <expression>;`

---

## Scope

แต่ละ function สร้าง new lexical scope

### Local Variables

Variables ที่ assign ภายใน function เป็น local ต่อ function นั้น

```tsl
function foo():
    x = 10
    print(x)

foo()
# print(x)  # Error: x is not defined here
```

สร้าง:

```js
function foo() {
  let x = 10;
  console.log(x);
}
foo();
```

### Accessing Outer Scope

Variables จาก outer scopes เข้าถึงได้ภายใน function

```tsl
outer = 100

function printOuter():
    print(outer)

printOuter()
```

สร้าง:

```js
let outer = 100;

function printOuter() {
  console.log(outer);
}
printOuter();
```

### Parameter Scope

Function parameters เป็น local ต่อ function body

```tsl
x = 10

function setX(x):
    x = 20
    print(x)

setX(5)
print(x)
```

สร้าง:

```js
let x = 10;

function setX(x) {
  x = 20;
  console.log(x);
}
setX(5);
console.log(x);
```

Output:
```
20
10
```

### Parameter Shadowing

Parameter shadow ใดๆ outer variable ที่มีชื่อเดียวกัน

```tsl
value = 1

function double(value):
    print(value)

double(5)
```

สร้าง:

```js
let value = 1;

function double(value) {
  console.log(value);
}
double(5);
```

---

## ตัวอย่างสมบูรณ์

```tsl
function greet(name):
    message = "Hello, " + name + "!"
    print(message)
    return message

result = greet("TSL")
print(result)
```

สร้าง:

```js
function greet(name) {
  let message = "Hello, " + name + "!";
  console.log(message);
  return message;
}
let result = greet("TSL");
console.log(result);
```

---

## Render Functions

TSL รองรับสอง special function names สำหรับ render loop: `update` และ `draw`

```tsl
function update():
    x = x + 1

function draw():
    clear()
    draw_rect(x, 0, 10, 10)
```

Runtime เรียก `update()` และ `draw()` ใน frame loop Compiler ไม่จัดการ functions เหล่านี้เป็นพิเศษ — สร้างเป็น regular JavaScript functions ธรรมดา

---

## Implementation Details

### AST Node

```js
FunctionDeclaration(name, parameters, body, location)
```

- `name` — Identifier
- `parameters` — Array ของ Identifier nodes
- `body` — Array ของ statement nodes
- `location` — Source location

### Parser

Parser จัดการ function declarations ใน statement level:

```
FUNCTION → IDENTIFIER → LPAREN → paramList → RPAREN → COLON → block
```

Parameters ถูก parse เป็น comma-separated list ของ identifiers ภายใน parentheses

Body ถูก parse เป็น block: `COLON → INDENT → statements → DEDENT`

### Generator

Generator สร้าง JavaScript ที่ถูกต้อง:

1. Output `function <name>(<params>) {`
2. Declare แต่ละ parameter ใน scope stack
3. Generate แต่ละ statement ใน body พร้อมเพิ่ม indentation
4. ปิด scope และ output `}`

### Scope Stack

Generator รักษา scope stack ไว้:

- `pushScope()` — เรียกเมื่อเข้า function
- `popScope()` — เรียกเมื่อออก function
- `declareVar()` — mark variable ว่า declare ใน current scope
- `isDeclared()` — ตรวจสอบว่า variable มีอยู่ใน current หรือ outer scope ใดๆ หรือไม่

Parameters ถูก declare ก่อน body ถูก generate ดังนั้นจึง visible ตลอด function body

---

## Error Handling

### Semantic Errors

| Condition | Error Type |
|-----------|-----------|
| `return` outside a function | Semantic Error |

### Parser Errors

| Condition | Error Type |
|-----------|-----------|
| Missing `:` after function signature | Parser Error |
| Missing `(` after function name | Parser Error |
| Missing `)` in parameter list | Parser Error |
| Non-identifier in parameter position | Parser Error |

---

## Out of Scope for v1.0

สิ่งต่อไปนี้ **ไม่** รองรับ:

- Default parameter values
- Rest parameters (`...args`)
- Variadic functions
- Closures (beyond lexical scoping)
- Anonymous functions
- Arrow functions
- Higher-order functions as first-class values (functions can be called but not assigned to variables)
- Function overloading
- Recursion (not explicitly prohibited, but not tested)
