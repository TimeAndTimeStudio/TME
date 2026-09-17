# Getting Started with TSL

TSL (Tiny Script Language) เป็น small programming language ที่ transpiles เป็น JavaScript ใช้ indentation สำหรับ blocks, มี simple syntax และรันบน JavaScript runtime ใดๆ ได้

**Version:** 1.0.0
**File extension:** `.tsl`

---

## Installation

```bash
npm install
```

---

## Quick Start

สร้างไฟล์ `hello.tsl`:

```tsl
# Hello World
print("Hello, World!")
```

รัน:

```bash
node src/cli.js hello.tsl
```

Output:

```
Loaded: hello.tsl
Compilation successful!

--- Generated JavaScript ---
console.log("Hello, World!");
--- End of Generated Code ---
```

---

## Building to JavaScript

เพื่อสร้าง JavaScript file:

```bash
node src/cli.js hello.tsl -o hello.js
```

หรือใช้ build command:

```bash
node src/cli.js build hello.tsl -o hello.js
```

จากนั้นรัน JavaScript ที่สร้างด้วย Node.js:

```bash
node hello.js
```

---

## Checking Syntax

เพื่อ validate TSL file โดยไม่สร้าง output:

```bash
node src/cli.js check hello.tsl
```

Output เมื่อสำเร็จ:

```
Check passed: hello.tsl
```

---

## Version

```bash
node src/cli.js --version
```

Output:

```
TSL v1.0.0
```

---

## Language Basics

### Variables

Variables ถูกสร้างครั้งแรกที่ assign การ declare ครั้งแรกใช้ `let` ใน JavaScript ที่สร้าง

```tsl
name = "TSL"
version = 1
pi = 3.14
active = true
nothing = null
```

Reassignment ไม่ใช้ `let`:

```tsl
x = 10
x = 20  # reassignment, no let
```

### Data Types

**Numbers** — integers และ floats:

```tsl
x = 42
y = 3.14
```

**Strings** — double หรือ single quotes:

```tsl
a = "hello"
b = 'world'
```

**Booleans:**

```tsl
is_ready = true
is_done = false
```

**Null:**

```tsl
value = null
```

### Operators

**Arithmetic:**

```tsl
a = 10 + 5    # addition
b = 10 - 5    # subtraction
c = 10 * 5    # multiplication
d = 10 / 5    # division
e = 10 % 3    # modulo
```

**Comparison:**

```tsl
a == b    # equal
a != b    # not equal
a < b     # less than
a <= b    # less than or equal
a > b     # greater than
a >= b    # greater than or equal
```

**Logical:**

```tsl
result = (a > 10) and (b < 5)
result = (a > 10) or (b < 5)
result = not (a > 10)
```

**Operator Precedence** (high to low):

1. `()`
2. `not`
3. `*`, `/`, `%`
4. `+`, `-`
5. `<`, `<=`, `>`, `>=`
6. `==`, `!=`
7. `and`
8. `or`

### Comments

ใช้ `#` สำหรับ line comments:

```tsl
# This is a comment
x = 10  # inline comment
```

Compiler ignore comments

---

### Control Flow

**If / Else:**

```tsl
x = 15

if x > 10:
    print("big")
else:
    print("small")
```

Blocks ถูกกำหนดโดย indentation (spaces) และ colon `:`

**While:**

```tsl
counter = 3

while counter > 0:
    print(counter)
    counter = counter - 1

print("Go!")
```

**For (with range):**

```tsl
for i in range(5):
    print(i)
```

**Break / Continue:**

```tsl
for i in range(10):
    if i == 3:
        continue
    if i == 7:
        break
    print(i)
```

`break` และ `continue` ใช้ได้เฉพาะใน loops เท่านั้น

---

### Functions

**Declaration:**

```tsl
function add(a, b):
    return a + b

result = add(10, 20)
print(result)
```

**No return value:**

```tsl
function greet(name):
    print("Hello, " + name)

greet("TSL")
```

---

### Arrays

**Create:**

```tsl
numbers = [1, 2, 3, 4, 5]
```

**Access:**

```tsl
first = numbers[0]
last = numbers[4]
```

---

### Objects

**Create:**

```tsl
player = { x: 100, y: 200, name: "Hero" }
```

**Access properties:**

```tsl
print(player.x)
print(player.y)
print(player.name)
```

**Member access chaining:**

```tsl
matrix = { rows: 3, cols: 4, data: [1, 2, 3] }
print(matrix.data[0])
```

---

## ตัวอย่างสมบูรณ์

```tsl
# ตัวอย่างสมบูรณ์
max_value = 10
counter = 0

function check_number(n):
    if n > max_value:
        return "too big"
    else:
        return "ok"

for i in range(5):
    result = check_number(i * 3)
    print(i + " -> " + result)
    counter = counter + 1

print("Done: " + counter)
```

---

## CLI Reference

| Command | คำอธิบาย |
|---------|-------------|
| `node src/cli.js <file.tsl>` | Compile และแสดง JavaScript ที่สร้าง |
| `node src/cli.js <file.tsl> -o <output.js>` | Compile และเขียนไปยังไฟล์ |
| `node src/cli.js build <file.tsl>` | Build และพิมพ์ JavaScript |
| `node src/cli.js build <file.tsl> -o <output.js>` | Build และเขียนไปยังไฟล์ |
| `node src/cli.js check <file.tsl>` | Validate syntax |
| `node src/cli.js --version` | แสดง version |

---

## Compiler Pipeline

```
TSL Source
    ↓
Lexer  →  Tokens
    ↓
Parser  →  AST
    ↓
Validator  →  (semantic checks)
    ↓
Generator  →  JavaScript
```

แต่ละ stage สามารถ produce errors พร้อม filename, line, column และ source line information

---

## Error Types

| Type | คำอธิบาย |
|------|-------------|
| Lexer Error | Invalid characters หรือ unterminated strings |
| Parser Error | Unexpected tokens หรือ missing syntax |
| Semantic Error | `return` outside function, `break`/`continue` outside loop |
| Generator Error | Unknown AST node type |

---

## Out of Scope (v1.0)

สิ่งต่อไปนี้ **ไม่ใช่** ส่วนของ TSL v1.0:

- Classes, inheritance, interfaces
- Modules, packages
- Static typing
- Garbage collector, VM, bytecode
- JIT compilation, native compilation
- Async, threads, coroutines
- Pattern matching, destructuring

---

## วิธีรันและ Build โปรเจกต์ TME

การรันและ build โปรเจกต์เกม TME ในโฟลเดอร์ของคุณ:

### 1. โครงสร้างโฟลเดอร์

```
my-game/
├── game.tsl        # โค้ดเกมของคุณ
├── index.html      # ไฟล์ HTML ที่มี canvas#game
├── style.css       # CSS แบบ custom (ไม่บังคับ)
├── img/            # รูปภาพของคุณ
└── dist/           # Output (สร้างโดย build)
```

### 2. รันใน Development

เปิด `index.html` ในเบราว์เซอร์ได้เลย

### 3. Build สำหรับ Production

```bash
# จาก TME root:
node tme/bin/tme build /path/to/your-game

# หรือจากโฟลเดอร์เกม:
cd my-game
node ../tme/bin/tme build .
```

จะสร้าง `dist/` ที่มีไฟล์พร้อม deploy

### 4. Deploy

อัปโหลดโฟลเดอร์ `dist/` ขึ้น static host ใดก็ได้ (GitHub Pages, Netlify, Vercel, ฯลฯ)

---

## Examples

ดู `examples/` directory สำหรับเพิ่มเติม:

```
examples/
    hello.tsl
    functions.tsl
    arrays.tsl
    objects.tsl
    if.tsl
    for.tsl
    while.tsl
    strings.tsl
```
