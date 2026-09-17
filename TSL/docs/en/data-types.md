# TSL Data Types

## Overview

TSL has no static type system. Types follow JavaScript semantics.

TSL variables are dynamically typed — the type is determined at runtime by the JavaScript engine.

---

## Number

Integers and floating-point numbers.

```tsl
x = 10
pi = 3.14
```

Generates:

```js
let x = 10;
let pi = 3.14;
```

All numbers use JavaScript `Number` (IEEE 754 double precision).

### Literal Syntax

```tsl
42
0
-3
3.14
0.5
```

The lexer accepts:

- Decimal integers: `10`, `42`, `0`
- Decimal floats: `3.14`, `0.5`

Scientific notation is not supported in v1.0.

---

## String

Text enclosed in double quotes or single quotes.

```tsl
name = "hello"
greeting = 'world'
```

Generates:

```js
let name = "hello";
let greeting = "world";
```

### Escape Sequences

| Escape | Meaning |
|--------|---------|
| `\\n`  | newline |
| `\\t`  | tab |
| `\\\\` | backslash |
| `\\"`  | double quote |
| `\\'`  | single quote |

Example:

```tsl
msg = "line1\nline2"
path = 'C:\\Users\\name'
quote = "she said \"hi\""
```

Generates:

```js
let msg = "line1\nline2";
let path = "C:\\Users\\name";
let quote = "she said \"hi\"";
```

The generator uses `JSON.stringify()` to produce valid JavaScript string literals.

---

## Boolean

Logical true/false values.

```tsl
flag = true
disabled = false
```

Generates:

```js
let flag = true;
let disabled = false;
```

Keywords: `true`, `false`

Used in conditions:

```tsl
if flag:
    print("enabled")
```

---

## Null

Represents absent or undefined value.

```tsl
value = null
```

Generates:

```js
let value = null;
```

Keyword: `null`

---

## Arrays

Ordered collections of values.

```tsl
items = [10, 20, 30]
names = ["a", "b", "c"]
```

Generates:

```js
let items = [10, 20, 30];
let names = ["a", "b", "c"];
```

### Indexing

```tsl
first = items[0]
```

Generates:

```js
let first = items[0];
```

### Assignment to Index

```tsl
items[0] = 99
```

Generates:

```js
items[0] = 99;
```

---

## Objects

Key-value collections.

```tsl
player = {
    x: 100,
    y: 200
}
```

Generates:

```js
let player = {
    x: 100,
    y: 200
};
```

Keys must be identifiers. Values can be any expression.

### Member Access

```tsl
px = player.x
```

Generates:

```js
let px = player.x;
```

### Assignment to Member

```tsl
player.x = 300
```

Generates:

```js
player.x = 300;
```

---

## Type Summary

| Type   | TSL Literal    | JavaScript Output |
|--------|----------------|-------------------|
| Number | `10`, `3.14`   | `10`, `3.14`      |
| String | `"hi"`, `'hi'` | `"hi"`, `'hi'`    |
| Boolean | `true`, `false` | `true`, `false`  |
| Null   | `null`         | `null`            |
| Array  | `[1, 2]`       | `[1, 2]`          |
| Object | `{x: 1}`       | `{ x: 1 }`        |

---

## No Type Declarations

TSL does not require or support type declarations.

```tsl
# Correct - no type needed
x = 10
x = "hello"
```

The JavaScript engine handles all typing at runtime.

---

## Implementation Notes

### Lexer

- Numbers: parsed by `readNumber()` in `src/lexer.js`
- Strings: parsed by `readString()` in `src/lexer.js`, supports escape sequences
- Booleans: `true`/`false` recognized as keywords
- Null: `null` recognized as keyword

### AST

| Type      | AST Node         |
|-----------|------------------|
| Number    | `NumberLiteral`  |
| String    | `StringLiteral`  |
| Boolean   | `BooleanLiteral` |
| Null      | `NullLiteral`    |
| Array     | `ArrayExpression`|
| Object    | `ObjectExpression`|

### Generator

- Numbers: `String(node.value)`
- Strings: `JSON.stringify(node.value)`
- Booleans: `node.value ? 'true' : 'false'`
- Null: `'null'`
- Arrays: `'[${elements.join(', ')}]'`
- Objects: `'{ ${props.join(', ')} }'`
