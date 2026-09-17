# TSL Language Reference

## Overview

TSL (TSL Language) is a small programming language that transpiles to JavaScript.

- **Version:** 1.0
- **File extension:** `.tsl`
- **Backend:** JavaScript
- **Runtime:** Node.js (or any JavaScript runtime)

Design goals:

- Simple syntax
- Python-like but not Python
- Indentation-based blocks
- JavaScript backend
- No VM, no bytecode, no JIT
- Small and predictable

## What TSL Is Not

- Not a general-purpose language
- Not a replacement for Python or JavaScript
- Not a type system
- Not a framework

---

## Hello World

```tsl
print("Hello, World!")
```

---

## Comments

Comments start with `#` and extend to the end of the line.

```tsl
# This is a comment
x = 10  # inline comment
```

Comments have no effect on the AST.

---

## Identifiers

An identifier starts with a letter or `_`, followed by letters, digits, or `_`. Identifiers are case-sensitive.

Valid:

```tsl
x
player
player_x
_value
x2
```

Invalid:

```text
2x
player-name
```

Keywords cannot be used as identifiers.

---

## Keywords

```text
if      else      for       in        while
function return  break     continue  pass
true    false     null      and       or      not
```

---

## Literals

### Numbers

Integers and decimals. Both generate JavaScript `Number`.

```tsl
x = 10
y = 3.14
```

### Strings

Double quotes or single quotes. Supports escape sequences: `\n`, `\t`, `\\`, `\"`, `\'`.

```tsl
a = "hello"
b = 'world'
```

### Booleans

```tsl
a = true
b = false
```

Generates JavaScript `true` / `false`.

### Null

```tsl
x = null
```

Generates JavaScript `null`.

---

## Operators

### Arithmetic

```text
+   -   *   /   %
```

### Comparison

```text
<   <=   >   >=   ==   !=
```

### Logical

```text
and   or   not
```

### Operator Precedence (highest to lowest)

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

## Variables

Assignment uses `=`. The first assignment in a scope creates a variable (generates `let`). Reassignment in the same scope does not generate `let`.

```tsl
x = 10      # generates: let x = 10;
x = 20      # generates: x = 20;
```

---

## Variable Scope

- TSL uses lexical scope.
- `function` creates a local scope.
- Block scope follows JavaScript block semantics.
- First assignment in scope: generates `let`.
- Reassignment in same scope: no `let`.

```tsl
x = 10

function foo():
    y = 20      # y is local to foo
    x = 30      # x refers to outer scope

foo()
print(x)          # prints 30
```

---

## If / Else

```tsl
if condition:
    statement
else:
    statement
```

Example:

```tsl
if x > 10:
    print("big")
else:
    print("small")
```

Generates JavaScript `if` / `else`.

---

## For

```tsl
for variable in expression:
    statement
```

Example:

```tsl
for i in range(10):
    print(i)
```

Generates JavaScript `for ... of`.

---

## While

```tsl
while condition:
    statement
```

Generates JavaScript `while`.

---

## Break / Continue

```tsl
break
continue
```

- `break` exits the innermost loop.
- `continue` skips to the next iteration.
- Both are only valid inside a loop. Using them outside a loop is a semantic error.

Example:

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

A no-op statement. Generates a comment in JavaScript.

---

## Functions

```tsl
function name(params):
    body
```

Example:

```tsl
function add(a, b):
    return a + b

result = add(10, 20)
print(result)
```

Generates JavaScript `function`.

---

## Return

```tsl
return value
```

or:

```tsl
return
```

`return` outside a function is a semantic error.

---

## Function Calls

```tsl
result = add(10, 20)
```

Supports:

- Zero arguments
- One argument
- Multiple arguments
- Nested calls

---

## Arrays

```tsl
items = [10, 20, 30]
x = items[0]
```

Generates JavaScript arrays.

---

## Objects

Basic object literals:

```tsl
player = { x: 100, y: 200, name: "Hero" }
```

Generates JavaScript object literals.

v1.0 objects do not support:

- class
- method syntax
- inheritance
- generic object system

---

## Member Access

```tsl
player.x
```

Generates JavaScript member access.

---

## Array Access

```tsl
items[0]
```

Generates JavaScript bracket access.

---

## Built-in Functions

### print()

```tsl
print(value)
```

Generates `console.log(value)`.

### range()

```tsl
range(10)
```

Returns an array `[0, 1, 2, ..., 9]`.

---

## Error System

Errors are categorized:

```text
Lexer Error
Parser Error
Semantic Error
Generator Error
```

Every compiler error includes:

```text
filename
line
column
message
```

---

## Architecture

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

## AST Node Types

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

## Lexer Tokens

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

## Indentation

TSL uses indentation to define blocks.

- `:` ends a statement that introduces a block.
- `INDENT` marks the start of a block.
- `DEDENT` marks the end of a block.

```tsl
if x:
    if y:
        print(x)
    print(y)
print(x)
```

Mixing indentation in ambiguous ways is not allowed.

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

The compiler generates calls; the runtime implements them.

```text
clear()
rect(x, y, width, height, color, rotation?, scale?, alpha?)
image(src, x, y, rotation?, scale?, alpha?, cropX?, cropY?, cropEndX?, cropEndY?)
```

The compiler does not understand graphics implementation.

---

## Render Model

```tsl
function update():
    ...

function draw():
    ...
```

The runtime calls `update()` and `draw()` in a frame loop.

---

## Out of Scope for v1.0

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
