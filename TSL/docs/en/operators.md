# TSL Operators

Operators in TSL are translated to their JavaScript equivalents by the compiler.
All operators generate valid JavaScript expressions.

## Arithmetic Operators

| TSL | JavaScript | Description |
|-----|------------|-------------|
| `+` | `+` | Addition |
| `-` | `-` | Subtraction |
| `*` | `*` | Multiplication |
| `/` | `/` | Division |
| `%` | `%` | Modulo (remainder) |

**Examples:**

```tsl
a = 10 + 5      # 15
b = 10 - 5      # 5
c = 10 * 5      # 50
d = 10 / 5      # 2
e = 10 % 3      # 1
```

Division and modulo with zero produce JavaScript's runtime behavior (`Infinity`, `NaN`, or `RangeError`).

## Comparison Operators

| TSL | JavaScript | Description |
|-----|------------|-------------|
| `==` | `==` | Equal (loose equality) |
| `!=` | `!=` | Not equal |
| `<` | `<` | Less than |
| `<=` | `<=` | Less than or equal |
| `>` | `>` | Greater than |
| `>=` | `>=` | Greater than or equal |

**Examples:**

```tsl
x == y
x != y
x < y
x <= y
x > y
x >= y
```

TSL uses JavaScript's loose equality (`==`) for the `==` operator.

## Logical Operators

| TSL | JavaScript | Description |
|-----|------------|-------------|
| `and` | `&&` | Logical AND |
| `or` | `\|\|` | Logical OR |
| `not` | `!` | Logical NOT (unary prefix) |

**Examples:**

```tsl
x and y
x or y
not x
```

### `not` (Unary)

`not` is a prefix operator applied to a single operand:

```tsl
if not flag:
    print("disabled")
```

Generates:

```js
if (!flag) {
```

### `and` / `or` (Binary)

`and` and `or` are infix binary operators. They generate JavaScript's `&&` and `||` respectively, which are short-circuit operators.

```tsl
if x > 10 and y < 20:
    print("valid")
```

Generates:

```js
if ((x > 10) && (y < 20)) {
```

## Assignment

| TSL | JavaScript | Description |
|-----|------------|-------------|
| `=` | `let x = ...` / `x = ...` | Assignment |

The first assignment to a variable generates `let`. Subsequent assignments reuse the existing variable.

```tsl
x = 10      # generates: let x = 10;
x = 20      # generates: x = 20;
```

## Operator Precedence

Operators are evaluated from highest to lowest precedence. Parentheses `()` can override precedence.

| Precedence | Operators | Associativity |
|------------|-----------|---------------|
| 1 (highest) | `()` | Grouping |
| 2 | `not` | Right-to-left |
| 3 | `*`, `/`, `%` | Left-to-right |
| 4 | `+`, `-` | Left-to-right |
| 5 | `<`, `<=`, `>`, `>=` | Left-to-right |
| 6 | `==`, `!=` | Left-to-right |
| 7 | `and` | Left-to-right |
| 8 (lowest) | `or` | Left-to-right |

### Precedence Examples

```tsl
# Multiplication binds tighter than addition
a = 1 + 2 * 3     # equivalent to: 1 + (2 * 3) => 7

# Comparison binds tighter than logical operators
if x > 10 and y < 20:
    print("valid")
# equivalent to: if (x > 10) and (y < 20):

# `not` binds tighter than `and`
result = not x and y
# equivalent to: (!x) && y

# Use parentheses to override precedence
a = (1 + 2) * 3   # 9
```

## Generated JavaScript

The compiler generates parenthesized binary and unary expressions for consistency:

| TSL | Generated JavaScript |
|-----|---------------------|
| `x and y` | `(x && y)` |
| `x or y` | `(x \|\| y)` |
| `not x` | `(!x)` |
| `a + b * c` | `((a + (b * c)))` |

## String Concatenation

TSL does not have a dedicated string concatenation operator. Use the `+` operator with string literals and variables:

```tsl
name = "world"
message = "hello " + name    # "hello world"
```

This generates JavaScript string concatenation.

## Integer Division

TSL does not distinguish between integer and floating-point division. The `/` operator always produces a JavaScript number (which may be a float):

```tsl
a = 10 / 3     # 3.333...
b = 10 / 2     # 5
```

For integer division, use `Math.floor()` or the `%` operator:

```tsl
a = Math.floor(10 / 3)    # 3
```

## Type Coercion

TSL does not perform explicit type conversion. Type coercion follows JavaScript rules:

```tsl
# Number coercion
result = "5" + 3     # "53" (string concatenation)
result = "5" - 3     # 2 (numeric subtraction)

# Boolean coercion in conditions
if 1:
    print("truthy")

if 0:
    print("never runs")
```
