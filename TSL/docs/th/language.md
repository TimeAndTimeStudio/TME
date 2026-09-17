# ภาพรวมภาษา TSL

## ภาพรวม

TSL (TSL Language) เป็นภาษาโปรแกรมขนาดเล็กที่ transpile เป็น JavaScript

- **เวอร์ชัน:** 1.0
- **นามสกุลไฟล์:** `.tsl`
- **Backend:** JavaScript
- **Runtime:** Node.js (หรือ JavaScript runtime อื่นๆ)

เป้าหมายการออกแบบ:

- Syntax เรียบง่าย
- เหมือน Python แต่ไม่ใช่ Python
- ใช้ indentation กำหนด block
- Backend เป็น JavaScript
- ไม่มี VM, ไม่มี bytecode, ไม่มี JIT
- เล็กและคาดเดาได้

## TSL ไม่ใช่

- ไม่ใช่ภาษาอเนกประสงค์
- ไม่ใช่ตัวแทน Python หรือ JavaScript
- ไม่ใช่ระบบ type
- ไม่ใช่ framework

---

## Hello World

```tsl
print("Hello, World!")
```

---

## ความคิดเห็น (Comments)

ความคิดเห็นขึ้นต้นด้วย `#` และไปจนสุดบรรทัด

```tsl
# นี่คือความคิดเห็น
x = 10  # ความคิดเห็นแบบ inline
```

ความคิดเห็นไม่มีผลต่อ AST

---

## ตัวระบุ (Identifiers)

ตัวระบุเริ่มด้วยตัวอักษรหรือ `_` ตามด้วยตัวอักษร ตัวเลข หรือ `_` ตัวระบุแยกตัวพิมพ์ใหญ่-เล็ก

ใช้ได้:

```tsl
x
player
player_x
_value
x2
```

ใช้ไม่ได้:

```text
2x
player-name
```

keyword ใช้เป็นตัวระบุไม่ได้

---

## คำสงวน (Keywords)

```text
if      else      for       in        while
function return  break     continue  pass
true    false     null      and       or      not
```

---

## ค่าคงที่ (Literals)

### ตัวเลข

จำนวนเต็มและทศนิยม ทั้งสองแบบสร้าง JavaScript `Number`

```tsl
x = 10
y = 3.14
```

### สตริง

ใช้เครื่องหมายคำพูดคู่หรือเดี่ยว รองรับ escape sequences: `\n`, `\t`, `\\`, `\"`, `\'`

```tsl
a = "hello"
b = 'world'
```

### Boolean

```tsl
a = true
b = false
```

สร้าง JavaScript `true` / `false`

### Null

```tsl
x = null
```

สร้าง JavaScript `null`

---

## ตัวดำเนินการ (Operators)

### คณิตศาสตร์

```text
+   -   *   /   %
```

### เปรียบเทียบ

```text
<   <=   >   >=   ==   !=
```

### ตรรกะ

```text
and   or   not
```

### ลำดับความสำคัญตัวดำเนินการ (มากไปน้อย)

```
1.  ()
2.  not
3.  *   /   %
4.  +   -
5.  <   <=   >   >=
6.  ==   !=
7.  and
8.  or
```

---

## ตัวแปร

การกำหนดใช้ `=` การกำหนดครั้งแรกใน scope จะสร้างตัวแปร (สร้าง `let`) การกำหนดซ้ำใน scope เดิมจะไม่สร้าง `let`

```tsl
x = 10      # สร้าง: let x = 10;
x = 20      # สร้าง: x = 20;
```

---

## ขอบเขตตัวแปร (Variable Scope)

- TSL ใช้ lexical scope
- `function` สร้าง local scope
- Block scope ปฏิบัติตาม JavaScript block semantics
- การกำหนดครั้งแรกใน scope: สร้าง `let`
- การกำหนดซ้ำใน scope เดิม: ไม่มี `let`

```tsl
x = 10

function foo():
    y = 20      # y เป็น local ของ foo
    x = 30      # x อ้างถึง outer scope

foo()
print(x)          # พิมพ์ 30
```

---

## If / Else

```tsl
if condition:
    statement
else:
    statement
```

ตัวอย่าง:

```tsl
if x > 10:
    print("big")
else:
    print("small")
```

สร้าง JavaScript `if` / `else`

---

## For

```tsl
for variable in expression:
    statement
```

ตัวอย่าง:

```tsl
for i in range(10):
    print(i)
```

สร้าง JavaScript `for ... of`

---

## While

```tsl
while condition:
    statement
```

สร้าง JavaScript `while`

---

## Break / Continue

```tsl
break
continue
```

- `break` ออกจาก loop ที่สุดภายใน
- `continue` ข้ามไป iteration ถัดไป
- ทั้งสองใช้ได้ใน loop เท่านั้น การใช้นอก loop เป็น semantic error

ตัวอย่าง:

```tsl
for i in range(10):
    if i == 3:
        continue
    if i == 7:
        break
    print(i)
```

---

## Pass

```tsl
pass
```

statement ที่ไม่ทำอะไรเลย สร้าง comment ใน JavaScript

---

## ฟังก์ชัน

```tsl
function name(params):
    body
```

ตัวอย่าง:

```tsl
function add(a, b):
    return a + b

result = add(10, 20)
print(result)
```

สร้าง JavaScript `function`

---

## Return

```tsl
return value
```

หรือ:

```tsl
return
```

`return` นอกฟังก์ชันเป็น semantic error

---

## การเรียกฟังก์ชัน

```tsl
result = add(10, 20)
```

รองรับ:

- ไม่มี argument
- argument เดียว
- หลาย argument
- การเรียกซ้อน

---

## Arrays

```tsl
items = [10, 20, 30]
x = items[0]
```

สร้าง JavaScript arrays

---

## Objects

Object literals พื้นฐาน:

```tsl
player = { x: 100, y: 200, name: "Hero" }
```

สร้าง JavaScript object literals

v1.0 objects ไม่รองรับ:

- class
- method syntax
- inheritance
- generic object system

---

## การเข้าถึงสมาชิก (Member Access)

```tsl
player.x
```

สร้าง JavaScript member access

---

## การเข้าถึง Array (Array Access)

```tsl
items[0]
```

สร้าง JavaScript bracket access

---

## ฟังก์ชันสำเร็จรูป (Built-in Functions)

### print()

```tsl
print(value)
```

สร้าง `console.log(value)`

### range()

```tsl
range(10)
```

สร้าง array `[0, 1, 2, ..., 9]`

---

## ระบบ Error

Error แบ่งเป็น:

```text
Lexer Error
Parser Error
Semantic Error
Generator Error
```

compiler error ทุกตัวมี:

```text
filename
line
column
message
```

---

## สถาปัตยกรรม

```
TSL Source
    ↓
Lexer (tokenize)
    ↓
Tokens
    ↓
Parser (AST)
    ↓
AST
    ↓
Validator (semantic checks)
    ↓
JavaScript Generator
    ↓
JavaScript
```

---

## ประเภท AST Node

```
Program
NumberLiteral
StringLiteral
BooleanLiteral
NullLiteral
Identifier
ArrayExpression
ObjectExpression
Property
UnaryExpression
BinaryExpression
CallExpression
MemberExpression
ArrayAccess
Assignment
IfStatement
WhileStatement
ForStatement
FunctionDeclaration
ReturnStatement
BreakStatement
ContinueStatement
Pass
ExpressionStatement
```

---

## Tokens ของ Lexer

```
IDENTIFIER    NUMBER      STRING
PLUS          MINUS       STAR        SLASH     PERCENT
EQUAL         EQUAL_EQUAL NOT_EQUAL
LESS          LESS_EQUAL  GREATER     GREATER_EQUAL
AND           OR          NOT
LPAREN        RPAREN      LBRACKET    RBRACKET  LBRACE    RBRACE
COMMA         DOT         COLON
NEWLINE       INDENT      DEDENT
EOF
```

---

## การขยับ (Indentation)

TSL ใช้ indentation กำหนด blocks

- `:` จบ statement ที่เริ่ม block
- `INDENT` เริ่ม block
- `DEDENT` จบ block

```tsl
if x:
    if y:
        print(x)
    print(y)
print(x)
```

การขยับแบบกำกวมไม่อนุญาต

---

## CLI

```bash
tsl game.tsl
tsl build game.tsl
tsl build game.tsl -o game.js
tsl check game.tsl
tsl --version
```

---

## Engine API (v1.0)

compiler สร้างการเรียก; runtime ทำการ implement

```text
clear()
rect(x, y, width, height, color, rotation?, scale?, alpha?)
image(src, x, y, rotation?, scale?, alpha?, cropX?, cropY?, cropEndX?, cropEndY?)
```

compiler ไม่เข้าใจ graphics implementation

---

## Render Model

```tsl
function update():
    ...

function draw():
    ...
```

runtime เรียก `update()` และ `draw()` ใน frame loop

---

## ไม่อยู่ในขอบเขต v1.0

```
Garbage Collector
VM
Bytecode
JIT
Native Compiler
Static Type System
Generics
Classes
Inheritance
Interfaces
Modules (complex)
Package Manager
Macros
Decorators
Async Language
Threads
Coroutines
Pattern Matching
Destructuring
Operator Overloading
Metaprogramming
Optimizer
IDE
LSP
Debugger
Full ECS
```

---

## ตัวอย่าง

```tsl
# TSL program
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

## การ compile

```bash
node src/cli.js example.tsl
```

---

## การ build

```bash
node src/cli.js build example.tsl -o example.js
node example.js
```

---

## อ้างอิง

- **Getting Started:** [getting-started.md](getting-started.md)
- **Syntax:** [syntax.md](syntax.md)
