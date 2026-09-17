# TSL Functions

## Overview

TSL functions are declared with the `function` keyword, followed by a name, parentheses for parameters, a colon, and an indented body block.

```tsl
function name(params):
    body
```

Functions generate JavaScript `function` declarations.

---

## Function Declaration

### Syntax

```tsl
function name(params):
    body
```

- `function` is a reserved keyword
- `name` is an identifier
- `params` is a comma-separated list of identifiers
- `:` ends the function signature line
- Body is an indented block of statements

### Example

```tsl
function add(a, b):
    return a + b
```

Generates:

```js
function add(a, b) {
  return a + b;
}
```

### No Parameters

A function can have zero parameters.

```tsl
function greet():
    print("Hello!")
```

Generates:

```js
function greet() {
  console.log("Hello!");
}
```

### Multiple Parameters

Parameters are separated by commas.

```tsl
function sum(a, b, c):
    return a + b + c
```

Generates:

```js
function sum(a, b, c) {
  return a + b + c;
}
```

### Parameter Rules

- Each parameter must be a valid identifier
- No default values
- No rest parameters
- No type annotations (v1.0)

---

## Function Call

A function is called by writing its name followed by parentheses containing arguments.

### Syntax

```tsl
name(args)
```

### Example

```tsl
result = add(10, 20)
print(result)
```

Generates:

```js
let result = add(10, 20);
console.log(result);
```

### No Arguments

```tsl
greet()
```

Generates:

```js
greet();
```

### Nested Calls

Function calls can be nested.

```tsl
result = add(multiply(2, 3), 5)
```

Generates:

```js
let result = add(multiply(2, 3), 5);
```

### Call as Expression

A function call can appear anywhere an expression is valid.

```tsl
x = add(1, 2) + multiply(3, 4)
```

Generates:

```js
let x = add(1, 2) + multiply(3, 4);
```

---

## Return

The `return` statement exits a function and optionally returns a value.

### With Value

```tsl
function multiply(x, y):
    return x * y
```

Generates:

```js
function multiply(x, y) {
  return x * y;
}
```

### Without Value

```tsl
function doSomething():
    print("doing something")
    return
    print("this line is unreachable")
```

Generates:

```js
function doSomething() {
  console.log("doing something");
  return;
  console.log("this line is unreachable");
}
```

### Return Rules

- `return` must be inside a function
- `return` outside a function is a **semantic error**
- `return` without a value generates `return;`
- `return` with an expression generates `return <expression>;`

---

## Scope

Each function creates a new lexical scope.

### Local Variables

Variables assigned inside a function are local to that function.

```tsl
function foo():
    x = 10
    print(x)

foo()
# print(x)  # Error: x is not defined here
```

Generates:

```js
function foo() {
  let x = 10;
  console.log(x);
}
foo();
```

### Accessing Outer Scope

Variables from outer scopes are accessible inside a function.

```tsl
outer = 100

function printOuter():
    print(outer)

printOuter()
```

Generates:

```js
let outer = 100;

function printOuter() {
  console.log(outer);
}
printOuter();
```

### Parameter Scope

Function parameters are local to the function body.

```tsl
x = 10

function setX(x):
    x = 20
    print(x)

setX(5)
print(x)
```

Generates:

```js
let x = 10;

function setX(x) {
  x = 20;
  console.log(x);
}
setX(5);
console.log(x);
```

Output:
```
20
10
```

### Parameter Shadowing

A parameter shadows any outer variable with the same name.

```tsl
value = 1

function double(value):
    print(value)

double(5)
```

Generates:

```js
let value = 1;

function double(value) {
  console.log(value);
}
double(5);
```

---

## Complete Example

```tsl
function greet(name):
    message = "Hello, " + name + "!"
    print(message)
    return message

result = greet("TSL")
print(result)
```

Generates:

```js
function greet(name) {
  let message = "Hello, " + name + "!";
  console.log(message);
  return message;
}
let result = greet("TSL");
console.log(result);
```

---

## Render Functions

TSL supports two special function names for the render loop: `update` and `draw`.

```tsl
function update():
    x = x + 1

function draw():
    clear()
    draw_rect(x, 0, 10, 10)
```

The runtime calls `update()` and `draw()` in a frame loop. The compiler does not treat these functions specially; it generates them as regular JavaScript functions.

---

## Implementation Details

### AST Node

```js
FunctionDeclaration(name, parameters, body, location)
```

- `name` — Identifier
- `parameters` — Array of Identifier nodes
- `body` — Array of statement nodes
- `location` — Source location

### Parser

The parser handles function declarations at the statement level:

```
FUNCTION → IDENTIFIER → LPAREN → paramList → RPAREN → COLON → block
```

Parameters are parsed as a comma-separated list of identifiers inside parentheses.

The body is parsed as a block: `COLON → INDENT → statements → DEDENT`.

### Generator

The generator produces valid JavaScript:

1. Outputs `function <name>(<params>) {`
2. Declares each parameter in the scope stack
3. Generates each statement in the body with increased indentation
4. Closes the scope and outputs `}`

### Scope Stack

The generator maintains a scope stack:

- `pushScope()` — called when entering a function
- `popScope()` — called when exiting a function
- `declareVar()` — marks a variable as declared in the current scope
- `isDeclared()` — checks if a variable exists in the current or any outer scope

Parameters are declared before the body is generated, so they are visible throughout the function body.

---

## Error Handling

### Semantic Errors

| Condition | Error Type |
|-----------|-----------|
| `return` outside a function | Semantic Error |

### Parser Errors

| Condition | Error Type |
|-----------|-----------|
| Missing `:` after function signature | Parser Error |
| Missing `(` after function name | Parser Error |
| Missing `)` in parameter list | Parser Error |
| Non-identifier in parameter position | Parser Error |

---

## Out of Scope for v1.0

The following are **not** supported:

- Default parameter values
- Rest parameters (`...args`)
- Variadic functions
- Closures (beyond lexical scoping)
- Anonymous functions
- Arrow functions
- Higher-order functions as first-class values (functions can be called but not assigned to variables)
- Function overloading
- Recursion (not explicitly prohibited, but not tested)
