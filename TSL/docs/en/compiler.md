# Compiler Pipeline

TSL compiles `.tsl` source files into JavaScript through a five-stage pipeline:

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

The entry point is `compileSource(source, filename)` in `src/cli.js`.

---

## Stage 1 — Lexer

**File:** `src/lexer.js`

The Lexer reads TSL source code and produces a flat array of tokens.

### What it does

- Scans source character by character
- Produces typed tokens: `IDENTIFIER`, `NUMBER`, `STRING`, `KEYWORD`, `OPERATOR`, `DELIMITER`, `NEWLINE`, `INDENT`, `DEDENT`, `EOF`
- Handles comments (`#` to end of line) — comments are discarded, not emitted as tokens
- Handles string literals with escape sequences: `\n`, `\t`, `\\`, `\"`, `\'`
- Handles integer and decimal number literals
- Converts indentation (spaces) into `INDENT` / `DEDENT` tokens using a stack
- Emits `NEWLINE` tokens at line boundaries

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

- Spaces-only indentation (tabs reset indent tracking)
- Indent stack tracks nesting levels
- Mismatched indentation throws a `LexerError`

### API

```js
const { tokenize } = require('./lexer');
const tokens = tokenize(source, filename);
```

### Error handling

Throws `LexerError` on:

- Unterminated string literals
- Unexpected characters
- Mismatched indentation

---

## Stage 2 — Parser

**File:** `src/parser.js`

The Parser reads tokens and builds an Abstract Syntax Tree (AST).

### What it does

- Implements a **precedence climbing** expression parser
- Parses all statement types: `if`, `else`, `for`, `while`, `function`, `return`, `break`, `continue`, `pass`, assignment, expression statements
- Parses block structure using `INDENT`/`DEDENT` tokens
- Parses expressions: literals, identifiers, arrays, objects, member access, array access, function calls, binary/unary expressions
- Groups statements into a `Program` node

### Expression parsing

Uses precedence climbing with these levels:

```
or      → 1
and     → 2
==  !=  <  <=  >  >=    → 3
+   -           → 4
*   /   %               → 5
```

Postfix operators (`.` , `()`, `[]`) have highest precedence.

### AST nodes produced

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

Every node includes a `location` object: `{ line, column, endLine, endColumn }`.

### API

```js
const { createParser } = require('./parser');
const parser = createParser(tokens, source, filename);
const body = parser.parseStatements();
```

### Error handling

Throws `ParserError` on:

- Unexpected tokens
- Missing delimiters (`(`, `)`, `[`, `]`, `{`, `}`, `:`, `=`)
- Invalid statement structure

---

## Stage 3 — Validator

**File:** `src/validator.js`

The Validator checks semantic rules on the AST.

### What it does

- Traverses the AST recursively
- Checks that `return` appears only inside a function
- Checks that `break` and `continue` appear only inside a loop
- Propagates context (`inFunction`, `inLoop`) through nested scopes

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

Context is cloned for each nested scope:

- `IfStatement` — context unchanged
- `WhileStatement` / `ForStatement` — `inLoop: true`
- `FunctionDeclaration` — `inFunction: true`

### API

```js
const { createValidator } = require('./validator');
const validator = createValidator(source, filename);
validator.validate(ast);
```

### Error handling

Throws `ValidationError` (first error encountered) on semantic violations.

---

## Stage 4 — Generator

**File:** `src/generator.js`

The Generator traverses the AST and produces JavaScript source code.

### What it does

- Depth-first traversal of AST nodes
- Generates valid, deterministic JavaScript
- Tracks variable declarations via `scopeStack` (array of Sets)
- Generates `let` for first assignment in scope, plain assignment for reassignments
- Handles scope push/pop for `if`, `while`, `for`, and `function` blocks
- Converts TSL operators to JavaScript equivalents (`and` → `&&`, `or` → `||`)
- Maps `print()` → `console.log()`, `range()` → JS array helper

### Scope tracking

```js
scopeStack = [new Set()];  // root scope
```

- `declareVar(name)` — adds to current scope
- `isDeclared(name)` — checks all scopes (lexical lookup)
- `pushScope()` / `popScope()` — manage block/function boundaries

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

Uses 2-space indentation per nesting level.

### API

```js
const { createGenerator } = require('./generator');
const generator = createGenerator(source, filename);
const jsCode = generator.generate(ast);
```

### Error handling

Throws `GeneratorError` on unknown node types or generation failures.

---

## Stage 5 — Output

The Generator returns a JavaScript string. This string is valid JavaScript that can be:

- Written to a `.js` file
- Evaluated via `require()` or `eval()`
- Executed via Node.js

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

Errors from any stage are caught and re-thrown with typed constructors:

```
LexerError → ParserError → ValidationError → GeneratorError
```

All errors extend the base `TSL` class and include:

```js
{
  name: 'LexerError',        // or ParserError, ValidationError, GeneratorError
  errorType: 'Lexer Error',  // or 'Parser Error', 'Semantic Error', 'Generator Error'
  filename: 'example.tsl',
  line: 5,
  column: 3,
  message: 'Unexpected token: IF',
  sourceLine: 'if x > 10:'
}
```

---

## Source files

| File | Responsibility |
|------|---------------|
| `src/lexer.js` | Tokenizer — source to tokens |
| `src/parser.js` | Parser — tokens to AST |
| `src/ast.js` | AST node constructors |
| `src/validator.js` | Validator — AST semantic checks |
| `src/generator.js` | Generator — AST to JavaScript |
| `src/errors.js` | Error classes and utilities |
| `src/cli.js` | Pipeline orchestrator and CLI |

---

## Constraints

- No string replacement — every transformation goes through AST
- No VM, bytecode, or JIT
- Output is deterministic — same input always produces same JavaScript
- Generator must produce valid JavaScript that preserves TSL semantics
