# สถาปัตยกรรม TSL

## ภาพรวม

TSL (TSLang) เป็นภาษาโปรแกรมขนาดเล็กและเรียบง่ายที่ transpile เป็น JavaScript
ออกแบบมาเพื่อการพัฒนาเกมและโปรแกรมเล็กๆ ด้วย syntax แบบ indentation-based ที่คล้าย Python

**Target**: JavaScript (ES6+)
**Runtime**: Node.js
**นามสกุลไฟล์**: `.tsl`
**เวอร์ชัน**: 1.0.0

---

## วัตถุประสงค์ภาษา

- เขียนและอ่านง่าย
- ใช้ indentation กำหนด block (ไม่มี keyword `end`)
- Transpile เป็น JavaScript
- รันบน JavaScript runtime
- รองรับการพัฒนาเกมและโปรแกรมเล็กๆ

TSL **ไม่ได้** ออกแบบมาเพื่อเป็นภาษาอเนกประสงค์ที่มีฟีเจอร์ซับซ้อน

---

## Compiler Pipeline

```
TSL Source
    ↓
    Lexer (src/lexer.js)
    ↓
    Tokens (TokenType + Token)
    ↓
    Parser (src/parser.js)
    ↓
    AST (src/ast.js)
    ↓
    Validator (src/validator.js)
    ↓
    Generator (src/generator.js)
    ↓
    JavaScript
```

### กฎ Pipeline

- AST เป็น central representation ที่แชร์ระหว่าง Parser และ Generator
- ไม่ใช้ string replacement เป็น compiler architecture
- ไม่มี VM, bytecode, JIT หรือ native compilation
- Output เป็น JavaScript ที่ถูกต้องและ deterministic

---

## โครงสร้างโปรเจกต์

```
Engine/
├── src/
│   ├── cli.js          # CLI entry point
│   ├── errors.js       # Error classes
│   ├── lexer.js        # Tokenizer
│   ├── parser.js       # Parser (precedence climbing)
│   ├── validator.js    # Semantic validator
│   ├── generator.js    # JavaScript code generator
│   └── ast.js          # AST node definitions
├── tests/              # Test files
├── docs/               # Documentation
├── examples/           # Example TSL programs
├── release-test/       # Release verification
├── package.json
└── README.md
```

---

## คำอธิบาย Module

### `src/lexer.js` — Tokenizer

Lexer อ่าน TSL source code และสร้าง stream ของ tokens

**หน้าที่หลัก**:

- ระบุ literals: numbers, strings, booleans, null
- ระบุ identifiers และ keywords
- ระบุ operators และ delimiters
- จัดการความคิดเห็น (`#` ถึงสุดบรรทัด)
- แปลงการเปลี่ยน indentation เป็น tokens `INDENT` / `DEDENT`
- ส่ง tokens `NEWLINE` ระหว่าง statements
- ส่ง `EOF` ที่สุด input

**Token Types**:

```
IDENTIFIER, NUMBER, STRING
IF, ELSE, FOR, IN, WHILE, FUNCTION, RETURN, BREAK, CONTINUE, PASS, TRUE, FALSE, NULL, AND, OR, NOT
PLUS, MINUS, STAR, SLASH, PERCENT
EQUAL, EQUAL_EQUAL, NOT_EQUAL
LESS, LESS_EQUAL, GREATER, GREATER_EQUAL
LPAREN, RPAREN, LBRACKET, RBRACKET, LBRACE, RBRACE
COMMA, DOT, COLON
NEWLINE, INDENT, DEDENT
EOF
```

**การจัดการ Indentation**:

- ใช้ `indentStack` เพื่อติดตามระดับ indentation
- นับ spaces; tabs รีเซ็ต indentation (non-space ตัวแรกชนะ)
- ส่ง `INDENT` เมื่อ indentation เพิ่มขึ้น
- ส่ง `DEDENT` เมื่อ indentation ลดลง
- Indentation ที่ไม่ตรงกันจะ throw `LexerError`

---

### `src/parser.js` — Parser

Parser รับ tokens และสร้าง AST โดยใช้ **precedence climbing**

**หน้าที่หลัก**:

- Parse expressions ด้วย operator precedence ที่ถูกต้อง
- Parse statements: if, else, for, while, function, return, break, continue, pass, assignment
- Parse blocks ที่คั่นด้วย `:` + INDENT + ... + DEDENT
- จัดการ postfix operators: member access (`.prop`), function calls `(args)`, array access `[index]`
- Parse array literals `[...]` และ object literals `{...}`

**Parser Methods**:

| Method | จุดประสงค์ |
|---|---|
| `parseExpression()` | Expression parsing แบบ top-level |
| `parseBinary(minPrecedence)` | Precedence climbing สำหรับ binary operators |
| `parseUnary()` | จัดการ prefix operator `not` |
| `parsePrimary()` | Literals, identifiers, grouped expressions |
| `parsePostfix()` | Member access, calls, array access |
| `parseStatements()` | Parse รายการ statements |
| `parseStatement()` | Parse statement เดียว |
| `parseBlock()` | Parse `:` + INDENT + statements + DEDENT |

**Operator Precedence** (น้อยไปมาก):

```
or (1)
and (2)
==, !=, <, <=, >, >= (3)
+, - (4)
*, /, % (5)
not (unary, มากที่สุด)
```

---

### `src/ast.js` — AST Node Definitions

AST nodes ใช้รูปแบบ factory ง่ายๆ แต่ละ node มี `type` และ `location`

**Node Types**:

| หมวดหมู่ | Nodes |
|---|---|
| Program | `Program` |
| Literals | `NumberLiteral`, `StringLiteral`, `BooleanLiteral`, `NullLiteral` |
| Expressions | `Identifier`, `BinaryExpression`, `UnaryExpression`, `CallExpression`, `MemberExpression`, `ArrayAccess`, `ArrayExpression`, `ObjectExpression`, `Property` |
| Statements | `Assignment`, `IfStatement`, `WhileStatement`, `ForStatement`, `FunctionDeclaration`, `ReturnStatement`, `BreakStatement`, `ContinueStatement`, `ExpressionStatement` |
| Location | `Location(line, column, endLine, endColumn)` |

---

### `src/validator.js` — Semantic Validator

Validator ทำ semantic checks บน AST ก่อน code generation

**การตรวจสอบปัจจุบัน**:

| การตรวจสอบ | Error |
|---|---|
| `return` นอกฟังก์ชัน | `'return outside function'` |
| `break` นอก loop | `'break outside loop'` |
| `continue` นอก loop | `'continue outside loop'` |

**การติดตาม Context**:

- `inFunction` — ติดตามว่าอยู่ในฟังก์ชันหรือไม่
- `inLoop` — ติดตามว่าอยู่ใน loop หรือไม่

---

### `src/generator.js` — JavaScript Code Generator

Generator เดินผ่าน AST และสร้าง JavaScript source code

**หน้าที่หลัก**:

- แปลง AST nodes เป็น JavaScript ที่ถูกต้อง
- ติดตาม variable declarations (`let` ในการกำหนดครั้งแรก, bare assignment ในการกำหนดครั้งถัดไป)
- ติดตาม scope ผ่าน `scopeStack` (array of Sets)
- จัดการ indentation ด้วย `indentLevel`
- สร้าง output ที่ deterministic

**การจัดการ Scope**:

- `scopeStack` — array of Sets, หนึ่ง set ต่อ scope level
- `declareVar(name)` — เพิ่ม variable ไปยัง current scope
- `isDeclared(name)` — ตรวจสอบว่า variable มีอยู่ใน enclosing scope หรือไม่
- การกำหนดครั้งแรกใน scope สร้าง `let`; การกำหนดครั้งถัดไปใช้ bare `=`

**Code Mapping**:

| TSL | JavaScript |
|---|---|
| `and` / `or` | `&&` / `\|\|` |
| `not x` | `(! x)` |
| `if cond:` | `if (cond) {` |
| `for var in expr:` | `for (let var of expr) {` |
| `while cond:` | `while (cond) {` |
| `function name(params):` | `function name(params) {` |
| `print(x)` | `console.log(x)` |
| `pass` | `// pass` |

**Indentation**: ใช้ 2 spaces ต่อ level

---

### `src/errors.js` — Error System

Error ทั้งหมดสืบทอดจาก base `TSL` class พร้อม structured metadata

**Error Classes**:

| Class | ประเภท Error |
|---|---|
| `LexerError` | `Lexer Error` |
| `ParserError` | `Parser Error` |
| `ValidationError` | `Semantic Error` |
| `GeneratorError` | `Generator Error` |

**Error Properties**:

- `errorType` — category string
- `filename` — source file name
- `line` — line number
- `column` — column number
- `sourceLine` — ข้อความ source line จริง
- `stack` — JavaScript stack trace

---

### `src/cli.js` — Command Line Interface

CLI ให้คำสั่ง `tsl` พร้อม commands ดังนี้:

| Command | คำอธิบาย |
|---|---|
| `tsl <file.tsl>` | Compile และแสดง JavaScript ที่สร้าง |
| `tsl build <file.tsl> [-o <output.js>]` | Build ไปยังไฟล์หรือ stdout |
| `tsl check <file.tsl>` | Validate โดยไม่สร้าง code |
| `tsl --version` | แสดงเวอร์ชัน |

**Compile Flow**:

```
read file → tokenize → parse → Program AST → validate → generate → JavaScript
```

---

## การตัดสินใจออกแบบ

### Indentation-Based Blocks

TSL ใช้ indentation เพื่อกำหนด blocks คล้าย Python

- เครื่องหมายคำพูดคู่ (`:`) ระบุจุดเริ่มต้นของ block
- Indentation สร้าง scope ใหม่
- Dedent ปิด current scope
- ไม่ต้องใช้ keyword `end`

### การประกาศตัวแปร

- การกำหนดครั้งแรกใน scope สร้างตัวแปร (`let`)
- การกำหนดครั้งถัดไปใช้ตัวแปรเดิม (`=`)
- ปฏิบัติตาม JavaScript `let` semantics

### ไม่มี Type System

- TSL ใช้ JavaScript types โดยตรง
- ไม่มี static typing, ไม่มี type annotations
- ไม่มี type coercion rules นอกเหนือจาก JavaScript

### ไม่มี Runtime Library

- TSL ไม่ได้มี runtime library
- ใช้ native JavaScript features (`console.log`, arrays, objects)
- Helper functions (`range()`) ให้โดย runtime layer ไม่ใช่ compiler

### Lexical Scope

- TSL scope ปฏิบัติตาม JavaScript lexical scoping rules
- ฟังก์ชันสร้าง local scope
- Blocks สร้าง scope ผ่าน JavaScript `let`/`const` semantics

---

## ไม่อยู่ในขอบเขต

สิ่งต่อไปนี้ **ไม่ใช่** ส่วนของ TSL v1.0:

```
VM, Bytecode, JIT, Native Compiler, Static Type System,
Generics, Classes, Inheritance, Interfaces, Complex Modules,
Package Manager, Macros, Decorators, Async Language,
Threads, Coroutines, Pattern Matching, Destructuring,
Operator Overloading, Metaprogramming, Optimizer,
IDE, LSP, Debugger, Full ECS
```

---

## การจัดการ Error

compiler error ทุกตัวมี:

```
filename
line
column
message
source line (เมื่อมี)
```

Error ถูก throw เป็น typed exceptions (`LexerError`, `ParserError`, ฯลฯ) และ catch โดย CLI

---

## การทดสอบ

Tests อยู่ใน `tests/` และรันด้วย:

```bash
npm test
```

Test files ใช้รูปแบบ `tests/**/*.test.js`

---

## ไฟล์ที่เปลี่ยนแปลง

- สร้าง: `docs/architecture.md`
