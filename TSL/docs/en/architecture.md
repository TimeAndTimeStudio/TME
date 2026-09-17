# TSL Architecture

## Overview

TSL (TSLang) is a small, simple programming language that transpiles to JavaScript.
It is designed for game development and small programs with Python-like indentation-based syntax.

**Target**: JavaScript (ES6+)
**Runtime**: Node.js
**File Extension**: `.tsl`
**Version**: 1.0.0

---

## Language Goals

- Easy to write and read
- Indentation-based blocks (no `end` keyword)
- Transpile to JavaScript
- Run on JavaScript runtime
- Support game development and small programs

TSL is **not** intended to be a general-purpose language with complex features.

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

### Pipeline Rules

- The AST is the central representation shared by the Parser and Generator.
- No string replacement is used as compiler architecture.
- No VM, bytecode, JIT, or native compilation.
- Output is valid, deterministic JavaScript.

---

## Project Structure

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

## Module Descriptions

### `src/lexer.js` — Tokenizer

The Lexer reads TSL source code and produces a stream of tokens.

**Key Responsibilities**:

- Recognize literals: numbers, strings, booleans, null
- Recognize identifiers and keywords
- Recognize operators and delimiters
- Handle comments (`#` to end of line)
- Convert indentation changes to `INDENT` / `DEDENT` tokens
- Emit `NEWLINE` tokens between statements
- Emit `EOF` at end of input

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

**Indentation Handling**:

- Uses an `indentStack` to track indentation levels
- Spaces are counted; tabs reset the indent (first non-space wins)
- `INDENT` is emitted when indentation increases
- `DEDENT` is emitted when indentation decreases
- Mismatched indentation throws a `LexerError`

---

### `src/parser.js` — Parser

The Parser consumes tokens and builds an AST using **precedence climbing**.

**Key Responsibilities**:

- Parse expressions with correct operator precedence
- Parse statements: if, else, for, while, function, return, break, continue, pass, assignment
- Parse blocks delimited by `:` + INDENT + ... + DEDENT
- Handle postfix operators: member access (`.prop`), function calls `(args)`, array access `[index]`
- Parse array literals `[...]` and object literals `{...}`

**Parser Methods**:

| Method | Purpose |
|---|---|
| `parseExpression()` | Top-level expression parsing |
| `parseBinary(minPrecedence)` | Precedence climbing for binary operators |
| `parseUnary()` | Handle `not` prefix operator |
| `parsePrimary()` | Literals, identifiers, grouped expressions |
| `parsePostfix()` | Member access, calls, array access |
| `parseStatements()` | Parse a list of statements |
| `parseStatement()` | Parse a single statement |
| `parseBlock()` | Parse `:` + INDENT + statements + DEDENT |

**Operator Precedence** (low to high):

```
or (1)
and (2)
==, !=, <, <=, >, >= (3)
+, - (4)
*, /, % (5)
not (unary, highest)
```

---

### `src/ast.js` — AST Node Definitions

AST nodes follow a simple factory pattern. Each node has a `type` and `location`.

**Node Types**:

| Category | Nodes |
|---|---|
| Program | `Program` |
| Literals | `NumberLiteral`, `StringLiteral`, `BooleanLiteral`, `NullLiteral` |
| Expressions | `Identifier`, `BinaryExpression`, `UnaryExpression`, `CallExpression`, `MemberExpression`, `ArrayAccess`, `ArrayExpression`, `ObjectExpression`, `Property` |
| Statements | `Assignment`, `IfStatement`, `WhileStatement`, `ForStatement`, `FunctionDeclaration`, `ReturnStatement`, `BreakStatement`, `ContinueStatement`, `ExpressionStatement` |
| Location | `Location(line, column, endLine, endColumn)` |

---

### `src/validator.js` — Semantic Validator

The Validator performs semantic checks on the AST before code generation.

**Current Checks**:

| Check | Error |
|---|---|
| `return` outside function | `'return outside function'` |
| `break` outside loop | `'break outside loop'` |
| `continue` outside loop | `'continue outside loop'` |

**Context Tracking**:

- `inFunction` — tracks whether currently inside a function
- `inLoop` — tracks whether currently inside a loop

---

### `src/generator.js` — JavaScript Code Generator

The Generator walks the AST and produces JavaScript source code.

**Key Responsibilities**:

- Convert AST nodes to valid JavaScript
- Track variable declarations (`let` on first assignment, bare assignment on subsequent)
- Track scope via `scopeStack` (array of Sets)
- Manage indentation with `indentLevel`
- Generate deterministic output

**Scope Management**:

- `scopeStack` — array of Sets, one per scope level
- `declareVar(name)` — adds a variable to the current scope
- `isDeclared(name)` — checks if a variable exists in any enclosing scope
- First assignment in a scope generates `let`; subsequent assignments use bare `=`

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

**Indentation**: Uses 2 spaces per level.

---

### `src/errors.js` — Error System

All errors extend a base `TSL` class with structured metadata.

**Error Classes**:

| Class | Error Type |
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
- `sourceLine` — the actual source line text
- `stack` — JavaScript stack trace

---

### `src/cli.js` — Command Line Interface

The CLI provides the `tsl` command with the following commands:

| Command | Description |
|---|---|
| `tsl <file.tsl>` | Compile and display generated JavaScript |
| `tsl build <file.tsl> [-o <output.js>]` | Build to file or stdout |
| `tsl check <file.tsl>` | Validate without generating code |
| `tsl --version` | Print version |

**Compile Flow**:

```
read file → tokenize → parse → Program AST → validate → generate → JavaScript
```

---

## Design Decisions

### Indentation-Based Blocks

TSL uses indentation to delimit blocks, similar to Python.

- A colon (`:`) marks the start of a block
- Indentation creates a new scope
- Dedent closes the current scope
- No `end` keyword needed

### Variable Declaration

- First assignment in a scope creates the variable (`let`)
- Subsequent assignments reuse the variable (`=`)
- This follows JavaScript `let` semantics

### No Type System

- TSL uses JavaScript types directly
- No static typing, no type annotations
- No type coercion rules beyond JavaScript's

### No Runtime Library

- TSL does not ship a runtime library
- Uses native JavaScript features (`console.log`, arrays, objects)
- Helper functions (`range()`) are provided by the runtime layer, not the compiler

### Lexical Scope

- TSL scope follows JavaScript lexical scoping rules
- Functions create local scope
- Blocks create scope via JavaScript `let`/`const` semantics

---

## Out of Scope

The following are **not** part of TSL v1.0:

```
VM, Bytecode, JIT, Native Compiler, Static Type System,
Generics, Classes, Inheritance, Interfaces, Complex Modules,
Package Manager, Macros, Decorators, Async Language,
Threads, Coroutines, Pattern Matching, Destructuring,
Operator Overloading, Metaprogramming, Optimizer,
IDE, LSP, Debugger, Full ECS
```

---

## Error Handling

Every compiler error includes:

```
filename
line
column
message
source line (when available)
```

Errors are thrown as typed exceptions (`LexerError`, `ParserError`, etc.) and caught by the CLI.

---

## Testing

Tests are located in `tests/` and run with:

```bash
npm test
```

Test files follow the pattern `tests/**/*.test.js`.

---

## Files Changed

- Created: `docs/architecture.md`
