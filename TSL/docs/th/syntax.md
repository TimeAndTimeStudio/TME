# TSL Language Syntax Reference

## ภาพรวม

TSL เป็น indentation-based scripting language เอกสารนี้บรรยาย syntax ทั้งหมดของ TSL

## Comments

Single-line comments เริ่มด้วย `#` และไปสุดบรรทัด

```tsl
# This is a comment
```

Comments ถูก ignore โดย lexer

## Identifiers

Identifiers ใช้ชื่อ variables, functions, และ properties

**กฎ:**

- ต้องเริ่มด้วย letter (`a-z`, `A-Z`) หรือ underscore (`_`)
- ตามด้วย zero หรือมากกว่า letters, digits (`0-9`), หรือ underscores
- Case sensitive (`x` และ `X` แตกต่างกัน)
- ไม่ใช่ keyword

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

Keywords เป็น reserved words ที่มี special meaning ในภาษา ไม่สามารถใช้เป็น identifiers ได้

| Keyword | คำอธิบาย |
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

Integers และ floating-point numbers

```tsl
10
42
3.14
0.5
```

Numbers ถูก parse เป็น JavaScript `Number` type

### Strings

Strings ถูก delimited ด้วย double quotes (`"`) หรือ single quotes (`'`)

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

Boolean literals สองตัว:

```tsl
true
false
```

### Null

`null` literal แสดงถึง absence of value:

```tsl
null
```

## Operators

### Arithmetic

| Operator | คำอธิบาย |
|----------|-------------|
| `+` | Addition |
| `-` | Subtraction |
| `*` | Multiplication |
| `/` | Division |
| `%` | Modulo |

### Comparison

| Operator | คำอธิบาย |
|----------|-------------|
| `<` | Less than |
| `<=` | Less than or equal |
| `>` | Greater than |
| `>=` | Greater than or equal |
| `==` | Equal |
| `!=` | Not equal |

### Logical

| Operator | คำอธิบาย |
|----------|-------------|
| `and` | Logical AND |
| `or` | Logical OR |
| `not` | Logical NOT (prefix) |

### Operator Precedence

จาก lowest binding strength ไป highest:

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

| Token | Symbol | คำอธิบาย |
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

TSL ใช้ **indentation** เพื่อ define code blocks ไม่ใช่ braces หรือ keywords

### กฎ

1. Colon (`:`) เป็นตัวเริ่ม block
2. Block body ถูกกำหนดโดย consistent indentation (spaces)
3. การหาจุดจบ block: บรรทัดที่มี indentation น้อยกว่า (หรือเท่าเดิม) จบ block
4. ไม่ต้องการ `end` keyword

### ตัวอย่าง

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

- ใช้ spaces สำหรับ indentation (tabs ไม่รองรับ)
- ต้องการ consistent indentation ภายใน block
- Mixed indentation levels สร้าง lexer error

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

Return โดยไม่มี value:

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

## ตัวอย่างสมบูรณ์

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
