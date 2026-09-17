# TSL Error System Reference

## ภาพรวม

TSL ใช้ five-tier error hierarchy ที่ map ตรงไปยัง compiler pipeline:

```text
TSL Source
    ↓
Lexer → LexerError
    ↓
Parser → ParserError
    ↓
Validator → ValidationError
    ↓
Generator → GeneratorError
```

แต่ละ error มี:

```text
message
line
column
filename (optional)
sourceLine (the source line where the error occurred)
```

## Error Class Hierarchy

```
TSL (base)
├── LexerError
├── ParserError
├── ValidationError
└── GeneratorError
```

Error classes ทั้งหมดสืบทอดจาก base `TSL` class จาก `src/errors.js` และ export จาก module เดียวกัน

### Base: TSL

Base error class Error ทั้งหมดของ TSL สืบทอดจากอันนี้

```js
class TSL extends Error {
  constructor(errorType, message, filename, line, column, sourceLine)
}
```

Properties:

| Property | Type | คำอธิบาย |
|---|---|---|
| `errorType` | string | Category label (e.g. `'Lexer Error'`) |
| `message` | string | Human-readable error description |
| `filename` | string \| undefined | Source file name |
| `line` | number | 1-based line number |
| `column` | number | 1-based column number |
| `sourceLine` | string | The actual source line content |
| `name` | string | Class name (e.g. `'LexerError'`) |

### LexerError

Raised โดย Lexer เมื่อเจอ invalid input ที่ป้องกัน tokenization

**Source:** `src/lexer.js`

**Error type label:** `'Lexer Error'`

**Scenarios:**

| Scenario | Example message |
|---|---|
| Unterminated string literal | `Unterminated string literal` |
| Unexpected/invalid character | `Unexpected character 'X'` |
| Unexpected indentation | `Unexpected indentation (expected 4, got 8)` |

**Example output:**

```
LexerError: Unexpected character '$'
  at main.tsl:3:7
```

### ParserError

Raised โดย Parser เมื่อ token stream ละเมิด TSL grammar rules

**Source:** `src/parser.js`

**Error type label:** `'Parser Error'`

**Scenarios:**

| Scenario | Example message |
|---|---|
| Missing expected token | `Expected COLON but found NEWLINE` |
| Missing expected token (alternate form) | `Expected RPAREN but found IDENTIFIER` |
| Unexpected token at expression position | `Unexpected token: EOF` |
| Expected expression but got something else | `Expected expression but found NEWLINE` |
| Missing colon at block start | `Expected ':' at start of block` |

**Example output:**

```
ParserError: Expected ':' at start of block
  at main.tsl:5:12
```

### ValidationError

Raised โดย Validator เมื่อละเมิด semantic rules ไม่ใช่ syntax errors — code ถูกต้องตาม syntax แต่ผิด semantic

**Source:** `src/validator.js`

**Error type label:** `'Semantic Error'`

**Scenarios:**

| Scenario | Example message |
|---|---|
| `return` outside function | `return outside function` |
| `break` outside loop | `break outside loop` |
| `continue` outside loop | `continue outside loop` |

**Example output:**

```
ValidationError: return outside function
  at main.tsl:10:1
```

### GeneratorError

Raised โดย Generator เมื่อไม่สามารถสร้าง JavaScript ที่ถูกต้องจาก AST ได้

**Source:** `src/generator.js`

**Error type label:** `'Generator Error'`

**Scenarios:**

| Scenario | Example message |
|---|---|
| Unknown AST node type | `Unknown node type: UnknownNode` |

**Example output:**

```
GeneratorError: Unknown node type: UnknownNode
  at main.tsl:1:1
```

## Error Output Format

Errors แสดงโดยใช้ JavaScript's default `Error.toString()` format ผ่าน `console.error()`:

```
ErrorName: message
  at filename:line:column
```

CLI จัดการ errors ใน three entry points:

| Command | Entry function | Error handler |
|---|---|---|
| `tsl file.tsl` | `runCommand()` | `console.error(err.toString())` |
| `tsl build file.tsl [-o out.js]` | `buildCommand()` | `console.error(err.toString())` |
| `tsl check file.tsl` | `checkCommand()` | `console.error(err.toString())` |

ทั้งสาม exit ด้วย code 1 เมื่อเกิด error

## Error Categories Reference

| Category | Class | Pipeline stage | Catchable by |
|---|---|---|---|
| Lexer Error | `LexerError` | Tokenization | Lexer |
| Parser Error | `ParserError` | Parsing | Parser |
| Semantic Error | `ValidationError` | Validation | Validator |
| Generator Error | `GeneratorError` | Code generation | Generator |

## Source Location

ทุก error มี:

- **filename** — The basename of the source file (e.g. `game.tsl`)
- **line** — 1-based line number
- **column** — 1-based column number
- **sourceLine** — The actual text of the offending line

`getSourceLine(source, lineNum)` helper ใน `src/errors.js` ดึง source line:

```js
function getSourceLine(source, lineNum) {
  const lines = source.split('\n');
  if (lineNum >= 1 && lineNum <= lines.length) {
    return lines[lineNum - 1];
  }
  return '';
}
```

## Using the Error Classes

### Direct Usage

```js
const { LexerError, ParserError, ValidationError, GeneratorError } = require('./src/errors');

throw new LexerError('Unexpected character', 'main.tsl', 5, 12, '    $x = 10');
```

### Checking Error Type

```js
try {
  compileSource(source, filename);
} catch (err) {
  if (err instanceof LexerError) {
    console.error(`Lexing failed at ${err.filename}:${err.line}:${err.column}`);
  } else if (err instanceof ParserError) {
    console.error(`Parsing failed at ${err.filename}:${err.line}:${err.column}`);
  } else if (err instanceof ValidationError) {
    console.error(`Validation failed at ${err.filename}:${err.line}:${err.column}`);
  } else if (err instanceof GeneratorError) {
    console.error(`Generation failed at ${err.filename}:${err.line}:${err.column}`);
  }
}
```

## Pipeline Error Flow

Compiler pipeline หยุดที่ error แรก ไม่มี stage หลัง execute:

```
1. Lexer runs → throws LexerError on invalid input
   ↓ (only on success)
2. Parser runs → throws ParserError on grammar violations
   ↓ (only on success)
3. Validator runs → throws ValidationError on semantic violations
   ↓ (only on success)
4. Generator runs → throws GeneratorError on generation failures
   ↓ (only on success)
5. JavaScript output returned
```

## ErrorType Enum

`ErrorType` object ให้ string constants สำหรับแต่ละ error category:

```js
const ErrorType = {
  LEXER: 'Lexer Error',
  PARSER: 'Parser Error',
  SEMANTIC: 'Semantic Error',
  GENERATOR: 'Generator Error',
};
```

## Exports

Error classes และ utilities ทั้งหมด export จาก `src/errors.js`:

```js
module.exports = {
  ErrorType,
  TSL,
  LexerError,
  ParserError,
  ValidationError,
  GeneratorError,
  getSourceLine,
};
```
