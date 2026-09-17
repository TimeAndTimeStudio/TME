# TSL Operators

Operators ใน TSL ถูก translate เป็น JavaScript equivalents โดย compiler

Operators ทั้งหมดสร้าง valid JavaScript expressions

## Arithmetic Operators

| TSL | JavaScript | คำอธิบาย |
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

Division และ modulo กับ zero สร้าง JavaScript's runtime behavior (`Infinity`, `NaN`, หรือ `RangeError`)

## Comparison Operators

| TSL | JavaScript | คำอธิบาย |
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

TSL ใช้ JavaScript's loose equality (`==`) สำหรับ `==` operator

## Logical Operators

| TSL | JavaScript | คำอธิบาย |
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

`not` เป็น prefix operator ที่ apply กับ operand เดียว:

```tsl
if not flag:
    print("disabled")
```

สร้าง:

```js
if (!flag) {
```

### `and` / `or` (Binary)

`and` และ `or` เป็น infix binary operators สร้าง JavaScript's `&&` และ `||` ตามลำดับ ซึ่งเป็น short-circuit operators

```tsl
if x > 10 and y < 20:
    print("valid")
```

สร้าง:

```js
if ((x > 10) && (y < 20)) {
```

## Assignment

| TSL | JavaScript | คำอธิบาย |
|-----|------------|-------------|
| `=` | `let x = ...` / `x = ...` | Assignment |

การ assign ตัวแปรครั้งแรกสร้าง `let` การ assign ครั้งต่อไปใช้ variable เดิม

```tsl
x = 10      # สร้าง: let x = 10;
x = 20      # สร้าง: x = 20;
```

## Operator Precedence

Operators ถูก evaluate จาก precedence สูงสุดไปต่ำสุด Parentheses `()` สามารถ override precedence ได้

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

Compiler สร้าง parenthesized binary และ unary expressions เพื่อความสม่ำเสมอ:

| TSL | Generated JavaScript |
|-----|---------------------|
| `x and y` | `(x && y)` |
| `x or y` | `(x \|\| y)` |
| `not x` | `(!x)` |
| `a + b * c` | `((a + (b * c)))` |

## String Concatenation

TSL ไม่มี string concatenation operator แยก ใช้ `+` operator กับ string literals และ variables:

```tsl
name = "world"
message = "hello " + name    # "hello world"
```

สิ่งนี้สร้าง JavaScript string concatenation

## Integer Division

TSL ไม่แยก integer และ floating-point division `/` operator สร้าง JavaScript number เสมอ (ซึ่งอาจเป็น float):

```tsl
a = 10 / 3     # 3.333...
b = 10 / 2     # 5
```

สำหรับ integer division ใช้ `Math.floor()` หรือ `%` operator:

```tsl
a = Math.floor(10 / 3)    # 3
```

## Type Coercion

TSL ไม่ทำ explicit type conversion Type coercion ตาม JavaScript rules:

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
