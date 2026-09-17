# TSL Control Flow

Control flow statements determine the order in which code is executed.

## Overview

| Statement | Keyword(s) | AST Node |
|-----------|-----------|----------|
| Conditional | `if`, `else` | `IfStatement` |
| Loop (range) | `for ... in` | `ForStatement` |
| Loop (conditional) | `while` | `WhileStatement` |
| Early exit | `break` | `BreakStatement` |
| Skip iteration | `continue` | `ContinueStatement` |
| No-op | `pass` | `Pass` |

All control flow statements use `:` followed by an indented block.

---

## If / Else

### Syntax

```tsl
if condition:
    statement
else:
    statement
```

### Description

The `if` statement evaluates a condition and executes the consequent block if truthy.

The optional `else` block executes when the condition is falsy.

### AST Node

```js
IfStatement {
    condition: Expression,
    consequent: Statement[],
    alternate: Statement[] | null,
    location: Location
}
```

### Generated JavaScript

```js
if (condition) {
    // consequent
} else {
    // alternate
}
```

### Example

```tsl
if x > 10:
    print("big")
else:
    print("small")
```

Generates:

```js
if (x > 10) {
    console.log("big");
} else {
    console.log("small");
}
```

### Nested If

```tsl
if x > 10:
    if x > 100:
        print("very big")
    else:
        print("medium")
else:
    print("small")
```

Generates:

```js
if (x > 10) {
    if (x > 100) {
        console.log("very big");
    } else {
        console.log("medium");
    }
} else {
    console.log("small");
}
```

### Notes

- `elif` is not supported. Use nested `if/else` instead.
- The condition must be an expression that evaluates to a truthy/falsy value.

---

## While

### Syntax

```tsl
while condition:
    statement
```

### Description

The `while` statement repeatedly executes its body as long as the condition is truthy.

### AST Node

```js
WhileStatement {
    condition: Expression,
    body: Statement[],
    location: Location
}
```

### Generated JavaScript

```js
while (condition) {
    // body
}
```

### Example

```tsl
x = 0
while x < 10:
    x = x + 1
```

Generates:

```js
x = 0;
while (x < 10) {
    x = x + 1;
}
```

### Infinite Loop

```tsl
while true:
    # body
```

Generates:

```js
while (true) {
    // body
}
```

---

## For (for-in)

### Syntax

```tsl
for variable in expression:
    statement
```

### Description

The `for` statement iterates over any iterable (arrays, range results, etc.).

### AST Node

```js
ForStatement {
    variable: Identifier,
    iterable: Expression,
    body: Statement[],
    location: Location
}
```

### Generated JavaScript

```js
for (let variable of iterable) {
    // body
}
```

### Example

```tsl
for item in items:
    print(item)
```

Generates:

```js
for (let item of items) {
    console.log(item);
}
```

### Common Usage with range()

```tsl
for i in range(10):
    print(i)
```

Generates:

```js
for (let i of range(10)) {
    console.log(i);
}
```

### Notes

- The loop variable is declared with `let` in each iteration scope.
- The iterable can be any JavaScript iterable (array, range, etc.).

---

## Break

### Syntax

```tsl
break
```

### Description

The `break` statement exits the innermost enclosing loop immediately.

### AST Node

```js
BreakStatement {
    location: Location
}
```

### Generated JavaScript

```js
break;
```

### Example

```tsl
for item in items:
    if item == target:
        break
    print(item)
```

Generates:

```js
for (let item of items) {
    if (item == target) {
        break;
    }
    console.log(item);
}
```

### Notes

- `break` outside a loop is a **Semantic Error**.
- Only exits the innermost loop.

---

## Continue

### Syntax

```tsl
continue
```

### Description

The `continue` statement skips the rest of the current loop iteration and proceeds to the next iteration.

### AST Node

```js
ContinueStatement {
    location: Location
}
```

### Generated JavaScript

```js
continue;
```

### Example

```tsl
x = 0
while x < 10:
    x = x + 1
    if x % 2 == 0:
        continue
    print(x)
```

Generates:

```js
x = 0;
while (x < 10) {
    x = x + 1;
    if (x % 2 == 0) {
        continue;
    }
    console.log(x);
}
```

### Notes

- `continue` outside a loop is a **Semantic Error**.

---

## Pass

### Syntax

```tsl
pass
```

### Description

The `pass` statement is a no-op. It does nothing at runtime.

### AST Node

```js
Pass {
    location: Location
}
```

### Generated JavaScript

```js
// pass
```

### Example

```tsl
if x > 10:
    pass
else:
    print("small")
```

Generates:

```js
if (x > 10) {
    // pass
} else {
    console.log("small");
}
```

### Use Cases

- Placeholder in empty blocks
- Explicitly indicating no action should be taken

---

## Complete Example

```tsl
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
sum = 0
count = 0

for n in numbers:
    if n > 8:
        break
    if n % 2 == 0:
        continue
    sum = sum + n
    count = count + 1

if count > 0:
    average = sum / count
    print(average)
else:
    pass
```

Generates:

```js
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
sum = 0;
count = 0;

for (let n of numbers) {
    if (n > 8) {
        break;
    }
    if (n % 2 == 0) {
        continue;
    }
    sum = sum + n;
    count = count + 1;
}

if (count > 0) {
    average = sum / count;
    console.log(average);
} else {
    // pass
}
```

---

## Reference

- **Parser**: `src/parser.js` — `parseIf()`, `parseWhile()`, `parseFor()`, `parseBreak()`, `parseContinue()`, `parsePass()`
- **Generator**: `src/generator.js` — `generateIfStatement()`, `generateWhileStatement()`, `generateForStatement()`, `generateBreakStatement()`, `generateContinueStatement()`, `generatePass()`
- **AST**: `src/ast.js` — `IfStatement`, `WhileStatement`, `ForStatement`, `BreakStatement`, `ContinueStatement`, `Pass`
