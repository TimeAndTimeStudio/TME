# TSL Language Syntax Reference

## Overview

TSL is an indentation-based scripting language. This document describes the complete syntax of TSL.

## Comments

Single-line comments start with `#` and extend to the end of the line.

```tsl
# This is a comment
```

Comments are ignored by the lexer.

## Identifiers

Identifiers name variables, functions, and properties.

**Rules:**

- Must start with a letter (`a-z`, `A-Z`) or underscore (`_`)
- Followed by zero or more letters, digits (`0-9`), or underscores
- Case sensitive (`x` and `X` are different)
- Cannot be a keyword

**Examples:**

```tsl
x
player
player_x
_value
x2
```

**Invalid examples:**

```tsl
1x      # starts with a digit
player-x # hyphen not allowed
```

## Keywords

Keywords are reserved words that have special meaning in the language. They cannot be used as identifiers.

| Keyword | Description |
|---------|-------------|
| `if` | Conditional statement |
| `else` | Alternate branch of condition |
| `for` | Loop over iterable |
| `in` | Used with `for` to specify iterable |
| `while` | Conditional loop |
| `function` | Function declaration |
| `return` | Return from function |
| `break` | Exit loop early |
| `continue` | Skip to next iteration |
| `pass` | No-op statement |
| `true` | Boolean true literal |
| `false` | Boolean false literal |
| `null` | Null literal |
| `and` | Logical AND operator |
| `or` | Logical OR operator |
| `not` | Logical NOT operator |

## Literals

### Numbers

Integers and floating-point numbers.

```tsl
10
42
3.14
0.5
```

Numbers are parsed as JavaScript `Number` type.

### Strings

Strings are delimited by double quotes (`"`) or single quotes (`'`).

```tsl
"hello"
'world'
```

**Escape sequences:**

| Escape | Meaning |
|--------|---------|
| `\\n` | Newline |
| `\\t` | Tab |
| `\\\\` | Backslash |
| `\\"` | Double quote |
| `\\'` | Single quote |

```tsl
"hello\nworld"
'say \'hi\''
```

### Booleans

Two boolean literals:

```tsl
true
false
```

### Null

The `null` literal represents absence of value:

```tsl
null
```

## Operators

### Arithmetic

| Operator | Description |
|----------|-------------|
| `+` | Addition |
| `-` | Subtraction |
| `*` | Multiplication |
| `/` | Division |
| `%` | Modulo |

### Comparison

| Operator | Description |
|----------|-------------|
| `<` | Less than |
| `<=` | Less than or equal |
| `>` | Greater than |
| `>=` | Greater than or equal |
| `==` | Equal |
| `!=` | Not equal |

### Logical

| Operator | Description |
|----------|-------------|
| `and` | Logical AND |
| `or` | Logical OR |
| `not` | Logical NOT (prefix) |

### Operator Precedence

From lowest to highest binding strength:

| Precedence | Operators | Associativity |
|------------|-----------|---------------|
| 1 | `or` | Left |
| 2 | `and` | Left |
| 3 | `==`, `!=`, `<`, `<=`, `>`, `>=` | Left |
| 4 | `+`, `-` | Left |
| 5 | `*`, `/`, `%` | Left |
| 6 | `not` | Right (prefix) |
| 7 | `()` | N/A |

### Examples

```tsl
# Low precedence: (true or false) and false
result = true or false and false

# High precedence: (2 * 3) + 1
result = 2 * 3 + 1

# not binds tighter than and
result = not x and y
```

## Delimiters

| Token | Symbol | Description |
|-------|--------|-------------|
| Left parenthesis | `(` | Start of grouping / argument list |
| Right parenthesis | `)` | End of grouping / argument list |
| Left bracket | `[` | Start of array literal / access |
| Right bracket | `]` | End of array literal / access |
| Left brace | `{` | Start of object literal |
| Right brace | `}` | End of object literal |
| Comma | `,` | Separator in lists |
| Dot | `.` | Member access |
| Colon | `:` | Block delimiter |
| Equals | `=` | Assignment |

## Block Structure

TSL uses **indentation** to define code blocks, not braces or keywords.

### Rules

1. A colon (`:`) marks the start of a block
2. The block body is defined by consistent indentation (spaces)
3. Deducing block end: a line with less (or equal) indentation ends the block
4. No `end` keyword is needed

### Example

```tsl
if x > 10:
    print(x)
```

### Block Syntax

```tsl
if condition:
    # body — indented
    pass
else:
    # else body — same indentation level
    pass
```

```tsl
for item in collection:
    print(item)

while x > 0:
    x = x - 1

function greet(name):
    print(name)
```

### Indentation

- Use spaces for indentation (tabs are not supported)
- Consistent indentation within a block is required
- Mixed indentation levels cause a lexer error

## Control Flow

### If Statement

```tsl
if x > 10:
    print("big")
else:
    print("small")
```

### For Loop

```tsl
for item in collection:
    print(item)
```

### While Loop

```tsl
while x > 0:
    x = x - 1
```

### Break and Continue

```tsl
for item in collection:
    if item == target:
        break
    if item == skip:
        continue
    print(item)
```

## Functions

### Declaration

```tsl
function add(a, b):
    return a + b
```

### Call

```tsl
result = add(1, 2)
```

### Return

```tsl
function square(x):
    return x * x
```

Return with no value:

```tsl
function doNothing():
    return
```

## Expressions

### Assignment

```tsl
x = 10
```

Member access assignment:

```tsl
player.x = 100
```

Array access assignment:

```tsl
arr[0] = 10
```

### Array Literals

```tsl
[1, 2, 3]
["a", "b", "c"]
```

### Array Access

```tsl
arr[0]
matrix[x][y]
```

### Object Literals

```tsl
{
    name: "Alice",
    age: 30
}
```

### Member Access

```tsl
player.x
player.name
```

### Function Calls

```tsl
print("hello")
math.sqrt(16)
```

### Chained Access

```tsl
# Chained member access
obj.prop.method()

# Chained array access
arr[0][1]

# Mixed access
arr[0].prop
```

## Complete Example

```tsl
# TSL program
function max(a, b):
    if a > b:
        return a
    else:
        return b

numbers = [1, 5, 3, 9, 2]
largest = null

for n in numbers:
    if largest == null:
        largest = n
    else:
        largest = max(largest, n)

print(largest)
```
