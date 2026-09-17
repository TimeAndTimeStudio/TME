# TSL Examples

Examples demonstrating TSL language features.

Each `.tsl` file transpiles to JavaScript when run with the CLI.

---

## Running Examples

```bash
node src/cli.js examples/hello.tsl
node src/cli.js examples/variables.tsl -o variables.js
```

---

## Hello World

**File:** `examples/hello.tsl`

```tsl
# Hello World
print("Hello, World!")
```

Output:

```
Hello, World!
```

---

## Comments

**File:** `examples/hello.tsl`

Comments start with `#` and extend to end of line.

```tsl
# This is a comment
print("Hello") # inline comment
```

---

## Variables

**File:** `examples/variables.tsl`

Variables are declared with assignment. TSL is dynamically typed.

```tsl
name = "TSL"
version = 1
is_ready = true
nothing = null

print(name)
print(version)
print(is_ready)
print(nothing)
```

---

## Variable Reassignment

**File:** `examples/reassignment.tsl`

Variables can be reassigned to new values, including different types.

```tsl
x = 10
print(x)

x = 20
print(x)

x = "changed"
print(x)
```

---

## Literals

### Numbers

```tsl
pi = 3.14
count = 42
```

### Strings

```tsl
greeting = "Hello"
name = 'World'
```

### Booleans

```tsl
a = true
b = false
```

### Null

```tsl
value = null
```

---

## Operators

### Arithmetic

**File:** `examples/math.tsl`

```tsl
a = 10
b = 3

print(a + b)   # 13
print(a - b)   # 7
print(a * b)   # 30
print(a / b)   # 3.333...
print(a % b)   # 1
```

### Comparison

**File:** `examples/comparison.tsl`

```tsl
a = 10
b = 20

print(a == b)   # false
print(a != b)   # true
print(a < b)    # true
print(a > b)    # false
print(a <= b)   # true
print(a >= b)   # false
```

### Logical

**File:** `examples/logical.tsl`

```tsl
a = true
b = false

print(a and b)   # false
print(a or b)    # true
print(not a)     # false
```

### Unary / Negation

**File:** `examples/unary.tsl`

```tsl
x = 5
y = 0 - x
print(y)   # -5

a = true
result = not a
print(result)   # false
```

### Complex Expressions

**File:** `examples/complex_expression.tsl`

Operator precedence: `() > not > * / % > + - > < <= > >= == != > and > or`

```tsl
result = ((10 + 20) * 3) - (5 / 2)
print(result)
```

---

## Control Flow

### If / Else

**File:** `examples/if.tsl`

```tsl
x = 15

if x > 10:
    print("big")
else:
    print("small")
```

### Nested Conditionals

**File:** `examples/nested.tsl`

```tsl
x = 15
y = 20

if x > 10:
    if y > 15:
        print("both big")
    else:
        print("x big, y small")
else:
    print("x small")
```

---

## Loops

### For Loop

**File:** `examples/for.tsl`

```tsl
for i in range(5):
    print(i)
```

### While Loop

**File:** `examples/while.tsl`

```tsl
counter = 3

while counter > 0:
    print(counter)
    counter = counter - 1

print("Go!")
```

### Break and Continue

**File:** `examples/break_continue.tsl`

```tsl
for i in range(10):
    if i == 3:
        continue
    if i == 7:
        break
    print(i)
```

Output: `0, 1, 2, 4, 5, 6`

---

## Functions

### Basic Function

**File:** `examples/functions.tsl`

```tsl
function add(a, b):
    return a + b

result = add(10, 20)
print(result)
```

### Guard Pattern

**File:** `examples/function_guard.tsl`

TSL v1.0 has no default parameters. Use guard conditions.

```tsl
function divide(a, b):
    if b == 0:
        return null
    return a / b

result = divide(10, 2)
print(result)

result = divide(10, 0)
print(result)
```

### Function Chaining

**File:** `examples/function_chaining.tsl`

Functions can call other functions.

```tsl
function square(x):
    return x * x

function cube(x):
    return square(x) * x

result = cube(3)
print(result)
```

### Recursion

**File:** `examples/recursion.tsl`

Functions can call themselves.

```tsl
function factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

result = factorial(5)
print(result)
```

---

## Arrays

**File:** `examples/arrays.tsl`

```tsl
numbers = [1, 2, 3, 4, 5]

first = numbers[0]
print(first)

last = numbers[4]
print(last)
```

---

## Objects

**File:** `examples/objects.tsl`

Objects use `{ key: value }` syntax.

```tsl
player = { x: 100, y: 200, name: "Hero" }

print(player.x)
print(player.y)
print(player.name)
```

### Nested Objects

**File:** `examples/nested_objects.tsl`

```tsl
person = {
    name: "Alice",
    address: {
        city: "Bangkok",
        zip: "10100"
    }
}

print(person.address.city)
```

### Arrays of Objects

**File:** `examples/array_of_objects.tsl`

```tsl
items = [
    { name: "apple", price: 10 },
    { name: "banana", price: 5 }
]

print(items[0].name)
```

### Complex Objects

**File:** `examples/complex_object.tsl`

```tsl
config = {
    title: "My Game",
    width: 800,
    height: 600,
    debug: true
}
```

---

## Member Access

**File:** `examples/member_access.tsl`

Access object properties with dot notation. Combine with array indexing.

```tsl
matrix = { rows: 3, cols: 4, data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] }

print(matrix.rows)
print(matrix.cols)
print(matrix.data[0])
```

---

## Strings

### String Concatenation

**File:** `examples/strings.tsl`

Strings can be concatenated with `+`.

```tsl
first = "Hello"
last = "World"
message = first + " " + last
print(message)
```

### String Literals

**File:** `examples/string_literals.tsl`

Both double quotes and single quotes are supported.

```tsl
a = "double quoted"
b = 'single quoted'
```

---

## Type System

### Type Checking

**File:** `examples/type_checking.tsl`

TSL is dynamically typed. Use `typeof` to check types at runtime.

```tsl
x = 42
y = "hello"

print(typeof x)   # number
print(typeof y)   # string
```

### Type Coercion

**File:** `examples/type_coercion.tsl`

TSL performs automatic type coercion in expressions.

```tsl
a = 10
b = "5"
result = a + b
print(result)   # "105"
```

---

## Scope

**File:** `examples/scope.tsl`

TSL uses lexical scoping. Functions create local scopes.

```tsl
x = 10

function foo():
    x = 20
    print(x)

foo()
print(x)
```

---

## Closure

**File:** `examples/closure.tsl`

Functions can capture variables from their enclosing scope.

```tsl
function create_counter():
    count = 0

    return { value: count }

function counter_increment(counter):
    counter.value = counter.value + 1

counter = create_counter()
counter_increment(counter)
counter_increment(counter)
print(counter.value)
```

---

## Object as Function Parameter

**File:** `examples/object_method.tsl`

Objects can be passed to functions.

```tsl
function create_point(x, y):
    return { x: x, y: y }

function point_distance(p1, p2):
    dx = p2.x - p1.x
    dy = p2.y - p1.y
    return dx * dx + dy * dy

p1 = create_point(0, 0)
p2 = create_point(3, 4)
print(point_distance(p1, p2))
```

---

## Function Returning Array

**File:** `examples/function_return_array.tsl`

Functions can return arrays.

```tsl
function make_range(start, end):
    result = []
    i = start
    while i < end:
        result[i - start] = i
        i = i + 1
    return result

numbers = make_range(1, 5)
print(numbers)
```

---

## Function with Array Parameter

**File:** `examples/function_array.tsl`

Functions can accept arrays as parameters.

```tsl
function sum(arr):
    total = 0
    for item in arr:
        total = total + item
    return total

numbers = [1, 2, 3, 4, 5]
print(sum(numbers))
```

---

## Algorithm Examples

### Fibonacci

**File:** `examples/fibonacci.tsl`

```tsl
function fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print(fibonacci(10))
```

### Binary Search

**File:** `examples/binary_search.tsl`

```tsl
function binary_search(arr, target):
    left = 0
    right = length(arr) - 1

    while left <= right:
        mid = (left + right) / 2
        if arr[mid] == target:
            return mid
        if arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return -1
```

### Bubble Sort

**File:** `examples/bubble_sort.tsl`

```tsl
function bubble_sort(arr):
    n = length(arr)
    i = 0
    while i < n:
        j = 0
        while j < n - i - 1:
            if arr[j] > arr[j + 1]:
                temp = arr[j]
                arr[j] = arr[j + 1]
                arr[j + 1] = temp
            j = j + 1
        i = i + 1
    return arr
```

---

## CLI Usage

### Run directly (prints generated JS to stdout)

```bash
node src/cli.js examples/hello.tsl
```

### Generate output file

```bash
node src/cli.js examples/hello.tsl -o hello.js
```

### Transpile and run

```bash
node src/cli.js examples/hello.tsl | node
```
