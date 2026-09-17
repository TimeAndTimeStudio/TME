# Compiler Pipeline

TSL compile `.tsl` source files เป็น JavaScript ผ่าน five-stage pipeline:

```
Source (.tsl)
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
JavaScript (.js)
```

จุดเข้าคือ `compileSource(source, filename)` ใน `src/cli.js`

---

## Stage 1 — Lexer

**ไฟล์:** `src/lexer.js`

Lexer อ่าน TSL source code และสร้าง flat array ของ tokens

### สิ่งที่มันทำ

- สแกน source character by character
- สร้าง typed tokens: `IDENTIFIER`, `NUMBER`, `STRING`, `KEYWORD`, `OPERATOR`, `DELIMITER`, `NEWLINE`, `INDENT`, `DEDENT`, `EOF`
- จัดการความคิดเห็น (`#` ถึงสุดบรรทัด) — ความคิดเห็นถูก discard, ไม่ emit เป็น tokens
- จัดการ string literals พร้อม escape sequences: `\n`, `\t`, `\\`, `\"`, `\'`
- จัดการ integer และ decimal number literals
- แปลง indentation (spaces) เป็น tokens `INDENT` / `DEDENT` โดยใช้ stack
- ส่ง tokens `NEWLINE` ที่ line boundaries

### Token types

```
IDENTIFIER    NUMBER        STRING
PLUS          MINUS         STAR        SLASH       PERCENT
EQUAL         EQUAL_EQUAL   NOT_EQUAL
LESS          LESS_EQUAL    GREATER     GREATER_EQUAL
AND           OR            NOT
LPAREN        RPAREN        LBRACKET    RBRACKET    LBRACE      RBRACE
COMMA         DOT           COLON
NEWLINE       INDENT        DEDENT
EOF
```

### Keywords

```
if      else      for       in        while
function return   break     continue  pass
true    false     null      and       or      not
```

### Indentation handling

- Spaces-only indentation (tabs รีเซ็ต indent tracking)
- Indent stack ติดตาม nesting levels
- Indentation ที่ไม่ตรงกันจะ throw `LexerError`

### API

```js
const { tokenize } = require('./lexer');
const tokens = tokenize(source, filename);
```

### Error handling

Throw `LexerError` เมื่อ:

- String literals ไม่ถูก terminate
- Characters ที่ไม่คาดหวัง
- Indentation ที่ไม่ตรงกัน

---

## Stage 2 — Parser

**ไฟล์:** `src/parser.js`

Parser อ่าน tokens และสร้าง Abstract Syntax Tree (AST)

### สิ่งที่มันทำ

- ใช้ **precedence climbing** expression parser
- Parse statement types ทั้งหมด: `if`, `else`, `for`, `while`, `function`, `return`, `break`, `continue`, `pass`, assignment, expression statements
- Parse block structure โดยใช้ tokens `INDENT`/`DEDENT`
- Parse expressions: literals, identifiers, arrays, objects, member access, array access, function calls, binary/unary expressions
- จัดกลุ่ม statements เป็น `Program` node

### Expression parsing

ใช้ precedence climbing พร้อม levels เหล่านี้:

```
or      → 1
and     → 2
==  !=  <  <=  >  >=    → 3
+   -           → 4
*   /   %               → 5
```

Postfix operators (`.` , `()`, `[]`) มี precedence สูงสุด

### AST nodes ที่สร้าง

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

แต่ละ node มี `location` object: `{ line, column, endLine, endColumn }`

### API

```js
const { createParser } = require('./parser');
const parser = createParser(tokens, source, filename);
const body = parser.parseStatements();
```

### Error handling

Throw `ParserError` เมื่อ:

- Tokens ที่ไม่คาดหวัง
- Delimiters หายไป (`(`, `)`, `[`, `]`, `{`, `}`, `:`, `=`)
- โครงสร้าง statement ไม่ถูกต้อง

---

## Stage 3 — Validator

**ไฟล์:** `src/validator.js`

Validator ตรวจสอบ semantic rules บน AST

### สิ่งที่มันทำ

- เดินผ่าน AST แบบ recursive
- ตรวจสอบว่า `return` ปรากฏเฉพาะในฟังก์ชัน
- ตรวจสอบว่า `break` และ `continue` ปรากฏเฉพาะใน loop
- Propagate context (`inFunction`, `inLoop`) ผ่าน nested scopes

### Semantic rules

| Statement | Valid context | Error if outside |
|-----------|--------------|------------------|
| `return` | function | "return outside function" |
| `break` | loop | "break outside loop" |
| `continue` | loop | "continue outside loop" |

### Context propagation

```js
{ inFunction: false, inLoop: false }
```

Context ถูก clone สำหรับแต่ละ nested scope:

- `IfStatement` — context ไม่เปลี่ยนแปลง
- `WhileStatement` / `ForStatement` — `inLoop: true`
- `FunctionDeclaration` — `inFunction: true`

### API

```js
const { createValidator } = require('./validator');
const validator = createValidator(source, filename);
validator.validate(ast);
```

### Error handling

Throw `ValidationError` (error แรกที่พบ) เมื่อละเมิด semantic

---

## Stage 4 — Generator

**ไฟล์:** `src/generator.js`

Generator เดินผ่าน AST และสร้าง JavaScript source code

### สิ่งที่มันทำ

- Depth-first traversal ของ AST nodes
- สร้าง JavaScript ที่ถูกต้องและ deterministic
- ติดตาม variable declarations ผ่าน `scopeStack` (array of Sets)
- สร้าง `let` สำหรับการกำหนดครั้งแรกใน scope, plain assignment สำหรับการ reassignments
- จัดการ scope push/pop สำหรับ `if`, `while`, `for` และ `function` blocks
- แปลง TSL operators เป็น JavaScript equivalents (`and` → `&&`, `or` → `||`)
- Map `print()` → `console.log()`, `range()` → JS array helper

### Scope tracking

```js
scopeStack = [new Set()];  // root scope
```

- `declareVar(name)` — เพิ่มไปยัง current scope
- `isDeclared(name)` — ตรวจสอบทุก scopes (lexical lookup)
- `pushScope()` / `popScope()` — จัดการ block/function boundaries

### Code generation rules

| TSL | JavaScript |
|-----|-----------|
| `x = 10` (first in scope) | `let x = 10;` |
| `x = 20` (reassignment) | `x = 20;` |
| `if cond:` | `if (cond) {` |
| `for i in expr:` | `for (let i of expr) {` |
| `while cond:` | `while (cond) {` |
| `function name(p1, p2):` | `function name(p1, p2) {` |
| `return val` | `return val;` |
| `break` | `break;` |
| `continue` | `continue;` |
| `pass` | `// pass` |
| `a and b` | `(a && b)` |
| `a or b` | `(a \|\| b)` |
| `not a` | `(not a)` |
| `"string"` | `"string"` (JSON.stringify) |

### Indentation

ใช้ 2-space indentation ต่อ nesting level

### API

```js
const { createGenerator } = require('./generator');
const generator = createGenerator(source, filename);
const jsCode = generator.generate(ast);
```

### Error handling

Throw `GeneratorError` เมื่อ node types ไม่รู้จักหรือ generation ล้มเหลว

---

## Stage 5 — Output

Generator คืน JavaScript string String นี้เป็น JavaScript ที่ถูกต้องที่สามารถ:

- เขียนไปยังไฟล์ `.js`
- Evaluated ผ่าน `require()` หรือ `eval()`
- Executed ผ่าน Node.js

### Full pipeline example

```js
const { compileSource } = require('./cli');

const { ast, jsCode } = compileSource(`
print("Hello")
x = 10
if x > 5:
    print(x)
`, "example.tsl");

console.log(jsCode);
```

### Return value

```js
{
  ast: ASTNode,    // the full AST
  jsCode: string   // generated JavaScript source
}
```

---

## Error flow

Errors จากแต่ละ stage ถูก catch และ re-throw พร้อม typed constructors:

```
LexerError → ParserError → ValidationError → GeneratorError
```

Errors ทั้งหมดสืบทอดจาก base `TSL` class และมี:

```js
{
  name: 'LexerError',        // หรือ ParserError, ValidationError, GeneratorError
  errorType: 'Lexer Error',  // หรือ 'Parser Error', 'Semantic Error', 'Generator Error'
  filename: 'example.tsl',
  line: 5,
  column: 3,
  message: 'Unexpected token: IF',
  sourceLine: 'if x > 10:'
}
```

---

## Source files

| File | ความรับผิดชอบ |
|------|---------------|
| `src/lexer.js` | Tokenizer — source เป็น tokens |
| `src/parser.js` | Parser — tokens เป็น AST |
| `src/ast.js` | AST node constructors |
| `src/validator.js` | Validator — AST semantic checks |
| `src/generator.js` | Generator — AST เป็น JavaScript |
| `src/errors.js` | Error classes และ utilities |
| `src/cli.js` | Pipeline orchestrator และ CLI |

---

## Constraints

- ไม่ใช้ string replacement — ทุก transformation ผ่าน AST
- ไม่มี VM, bytecode หรือ JIT
- Output เป็น deterministic — input เดิมได้ JavaScript เดิมเสมอ
- Generator ต้องสร้าง JavaScript ที่ถูกต้องและรักษา TSL semantics
