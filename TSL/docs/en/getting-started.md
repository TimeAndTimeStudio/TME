# Getting Started with TSL

TSL (Tiny Script Language) is a small programming language that transpiles to JavaScript. It uses indentation for blocks, has simple syntax, and runs on any JavaScript runtime.

**Version:** 1.0.0
**File extension:** `.tsl`

---

## Installation

```bash
npm install
```

---

## Quick Start

Create a file `hello.tsl`:

```tsl
# Hello World
print("Hello, World!")
```

Run it:

```bash
node src/cli.js hello.tsl
```

Output:

```
Loaded: hello.tsl
Compilation successful!

--- Generated JavaScript ---
console.log("Hello, World!");
--- End of Generated Code ---
```

---

## Building to JavaScript

To generate a JavaScript file:

```bash
node src/cli.js hello.tsl -o hello.js
```

Or use the build command:

```bash
node src/cli.js build hello.tsl -o hello.js
```

Then run the generated JavaScript with Node.js:

```bash
node hello.js
```

---

## Checking Syntax

To validate a TSL file without generating output:

```bash
node src/cli.js check hello.tsl
```

Output on success:

```
Check passed: hello.tsl
```

---

## Version

```bash
node src/cli.js --version
```

Output:

```
TSL v1.0.0
```

---

## Language Basics

### Variables

Variables are created on first assignment. The first declaration uses `let` in the generated JavaScript.

```tsl
name = "TSL"
version = 1
pi = 3.14
active = true
nothing = null
```

Reassignment does not use `let`:

```tsl
x = 10
x = 20  # reassignment, no let
```

### Data Types

**Numbers** — integers and floats:

```tsl
x = 42
y = 3.14
```

**Strings** — double or single quotes:

```tsl
a = "hello"
b = 'world'
```

**Booleans:**

```tsl
is_ready = true
is_done = false
```

**Null:**

```tsl
value = null
```

### Operators

**Arithmetic:**

```tsl
a = 10 + 5    # addition
b = 10 - 5    # subtraction
c = 10 * 5    # multiplication
d = 10 / 5    # division
e = 10 % 3    # modulo
```

**Comparison:**

```tsl
a == b    # equal
a != b    # not equal
a < b     # less than
a <= b    # less than or equal
a > b     # greater than
a >= b    # greater than or equal
```

**Logical:**

```tsl
result = (a > 10) and (b < 5)
result = (a > 10) or (b < 5)
result = not (a > 10)
```

**Operator Precedence** (high to low):

1. `()`
2. `not`
3. `*`, `/`, `%`
4. `+`, `-`
5. `<`, `<=`, `>`, `>=`
6. `==`, `!=`
7. `and`
8. `or`

### Comments

Use `#` for line comments:

```tsl
# This is a comment
x = 10  # inline comment
```

Comments are ignored by the compiler.

---

### Control Flow

**If / Else:**

```tsl
x = 15

if x > 10:
    print("big")
else:
    print("small")
```

Blocks are defined by indentation (spaces) and a colon `:`.

**While:**

```tsl
counter = 3

while counter > 0:
    print(counter)
    counter = counter - 1

print("Go!")
```

**For (with range):**

```tsl
for i in range(5):
    print(i)
```

**Break / Continue:**

```tsl
for i in range(10):
    if i == 3:
        continue
    if i == 7:
        break
    print(i)
```

`break` and `continue` only work inside loops.

---

### Functions

**Declaration:**

```tsl
function add(a, b):
    return a + b

result = add(10, 20)
print(result)
```

**No return value:**

```tsl
function greet(name):
    print("Hello, " + name)

greet("TSL")
```

---

### Arrays

**Create:**

```tsl
numbers = [1, 2, 3, 4, 5]
```

**Access:**

```tsl
first = numbers[0]
last = numbers[4]
```

---

### Objects

**Create:**

```tsl
player = { x: 100, y: 200, name: "Hero" }
```

**Access properties:**

```tsl
print(player.x)
print(player.y)
print(player.name)
```

**Member access chaining:**

```tsl
matrix = { rows: 3, cols: 4, data: [1, 2, 3] }
print(matrix.data[0])
```

---

## Complete Example

```tsl
# Complete example
max_value = 10
counter = 0

function check_number(n):
    if n > max_value:
        return "too big"
    else:
        return "ok"

for i in range(5):
    result = check_number(i * 3)
    print(i + " -> " + result)
    counter = counter + 1

print("Done: " + counter)
```

---

## CLI Reference

| Command | Description |
|---------|-------------|
| `node src/cli.js <file.tsl>` | Compile and show generated JavaScript |
| `node src/cli.js <file.tsl> -o <output.js>` | Compile and write to file |
| `node src/cli.js build <file.tsl>` | Build and print JavaScript |
| `node src/cli.js build <file.tsl> -o <output.js>` | Build and write to file |
| `node src/cli.js check <file.tsl>` | Validate syntax |
| `node src/cli.js --version` | Show version |

---

## Compiler Pipeline

```
TSL Source
    ↓
Lexer  →  Tokens
    ↓
Parser  →  AST
    ↓
Validator  →  (semantic checks)
    ↓
Generator  →  JavaScript
```

Each stage can produce errors with filename, line, column, and source line information.

---

## Error Types

| Type | Description |
|------|-------------|
| Lexer Error | Invalid characters or unterminated strings |
| Parser Error | Unexpected tokens or missing syntax |
| Semantic Error | `return` outside function, `break`/`continue` outside loop |
| Generator Error | Unknown AST node type |

---

## Out of Scope (v1.0)

The following are **not** part of TSL v1.0:

- Classes, inheritance, interfaces
- Modules, packages
- Static typing
- Garbage collector, VM, bytecode
- JIT compilation, native compilation
- Async, threads, coroutines
- Pattern matching, destructuring

---

## How to Run & Build a TME Project

To run and build a TME game project in your folder:

### 1. Project Structure

```
my-game/
├── game.tsl        # Your game code
├── index.html      # HTML file with canvas#game
├── style.css       # Optional custom styles
├── img/            # Your images
└── dist/           # Output (created by build)
```

### 2. Run in Development

Just open `index.html` in your browser.

### 3. Build for Production

```bash
# From TME root:
node tme/bin/tme build /path/to/your-game

# Or from your game folder:
cd my-game
node ../tme/bin/tme build .
```

This creates `dist/` with all files ready to deploy.

### 4. Deploy

Upload the `dist/` folder to any static host (GitHub Pages, Netlify, Vercel, etc.)

---

## Examples

See the `examples/` directory for more:

```
examples/
    hello.tsl
    functions.tsl
    arrays.tsl
    objects.tsl
    if.tsl
    for.tsl
    while.tsl
    strings.tsl
```
