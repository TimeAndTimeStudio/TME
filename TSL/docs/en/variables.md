# TSL Variables

## Overview

Variables in TSL are created on first assignment within a scope using `let` in the generated JavaScript. Reassignment in the same or outer scope does not use `let`.

```tsl
x = 10      # First assignment: let x = 10;
x = 20      # Reassignment: x = 20;
```

---

## Declaration

The first assignment to a variable name in any visible scope creates the variable. The generator emits `let`:

```tsl
x = 10
name = "TSL"
count = 0
```

Generates:

```js
let x = 10;
let name = "TSL";
let count = 0;
```

---

## Reassignment

Once a variable is declared in any visible scope, subsequent assignments to the same name do not use `let`:

```tsl
x = 10
x = 20
```

Generates:

```js
let x = 10;
x = 20;
```

The compiler tracks declared variables per scope using a stack of sets. `isDeclared()` checks from innermost to outermost scope.

---

## Scope Rules

TSL uses **lexical scope**. The compiler maintains a `scopeStack` — an array of sets, where each set tracks variable names declared in that scope.

### Scope Hierarchy

Scopes are created by:

- Function declarations
- `if` / `else` blocks
- `while` loops
- `for` loops
- Nested blocks

### Rules

1. **Inner scope can read outer scope variables** — `isDeclared()` checks all scopes from inner to outer.
2. **Inner scope can reassign outer scope variables** — if a name is declared in an outer scope, inner assignments do not use `let`.
3. **Inner scope can declare new variables** — first assignment in inner scope uses `let` and shadows outer names.
4. **Outer scope cannot see inner scope variables** — variables declared in inner scopes are not visible after the block ends.

### Example: Function Scope

```tsl
x = 10

function foo():
    y = 1       # let y = 1; (new scope)
    x = 20      # x = 20; (reassign outer)
    y = 2       # y = 2; (same scope, no let)
```

Generates:

```js
let x = 10;
function foo() {
  let y = 1;
  x = 20;
  y = 2;
}
```

### Example: Block Scope

```tsl
x = 1

if (true):
    x = 2       # x = 2; (reassign outer, no let)
    y = 3       # let y = 3; (new scope)
```

Generates:

```js
let x = 1;
if (true) {
  x = 2;
  let y = 3;
}
```

### Example: Variable Shadowing

```tsl
if (true):
    y = 10
else:
    y = 20
```

Generates:

```js
if (true) {
  let y = 10;
} else {
  let y = 20;
}
```

Each branch declares its own `y`. They do not shadow each other.

### Example: For Loop Variable

```tsl
for i in range(3):
    print(i)
print(i)
```

Generates:

```js
for (let i of range(3)) {
  print(i);
}
print(i);
```

The loop variable `i` is scoped to the `for` body by JavaScript `let` semantics.

---

## Member Assignment

Assigning to object properties does not use `let`:

```tsl
player.x = 100
player.y = 200
```

Generates:

```js
player.x = 100;
player.y = 200;
```

---

## Array Assignment

Assigning to array indices does not use `let`:

```tsl
arr[0] = 10
arr[1] = 20
```

Generates:

```js
arr[0] = 10;
arr[1] = 20;
```

---

## Function Parameters

Function parameters are automatically declared in the function scope. Assignments to parameters do not use `let`:

```tsl
function add(a):
    a = a + 1
    return a
```

Generates:

```js
function add(a) {
  a = (a + 1);
  return a;
}
```

---

## Implementation Details

The generator tracks scope using:

| Function | Description |
|---|---|
| `reset()` | Initializes `scopeStack = [new Set()]` |
| `pushScope()` | Creates new scope set, increments indent |
| `popScope()` | Removes current scope set, decrements indent |
| `declareVar(name)` | Adds name to current scope set |
| `isDeclared(name)` | Checks all scopes from inner to outer |

### Assignment Logic

```
if left is MemberExpression:
    emit "left = right;"
else if left is ArrayAccess:
    emit "left = right;"
else if isDeclared(left.name):
    emit "left = right;"
else:
    declareVar(left.name)
    emit "let left = right;"
```

---

## Summary Table

| TSL Code | Generated JavaScript |
|---|---|
| `x = 10` | `let x = 10;` |
| `x = 20` (after declaration) | `x = 20;` |
| `name = "TSL"` | `let name = "TSL";` |
| `player.x = 100` | `player.x = 100;` |
| `arr[0] = 10` | `arr[0] = 10;` |
| `function foo(): y = 1` | `function foo() { let y = 1; }` |
| `if (true): x = 1` (outer x) | `if (true) { x = 1; }` |
| `if (true): y = 1` (new) | `if (true) { let y = 1; }` |
