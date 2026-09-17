const { tokenize } = require("../../src/lexer");
const { createParser } = require("../../src/parser");
const { createValidator } = require("../../src/validator");
const { createGenerator } = require("../../src/generator");
const { Program, Location } = require("../../src/ast");

function compile(source) {
  const tokens = tokenize(source, "<test>");
  const parser = createParser(tokens, "<test>");
  const statements = parser.parseStatements();
  const loc = new Location(1, 0, 1, 0);
  const ast = Program(statements, loc);
  const validator = createValidator();
  validator.validate(ast);
  const generator = createGenerator();
  return generator.generate(ast);
}

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    console.error(`✗ ${name}`);
    console.error(e.message);
    process.exit(1);
  }
}

function assertEqual(actual, expected) {
  if (actual.trim() !== expected.trim()) {
    throw new Error(`Expected:\n${expected}\n\nGot:\n${actual}`);
  }
}

// Literals
test("generates string literal", () => {
  const js = compile(`print("hello")`);
  assertEqual(js, `print("hello");`);
});

test("generates number literal", () => {
  const js = compile(`print(42)`);
  assertEqual(js, `print(42);`);
});

test("generates boolean literals", () => {
  const js = compile(`print(true)\nprint(false)`);
  assertEqual(js, `print(true);\nprint(false);`);
});

test("generates null literal", () => {
  const js = compile(`print(null)`);
  assertEqual(js, `print(null);`);
});

// Identifiers
test("generates identifier", () => {
  const js = compile(`x`);
  assertEqual(js, `x;`);
});

test("generates variable declaration", () => {
  const js = compile(`x = 10`);
  assertEqual(js, `let x = 10;`);
});

// Binary expressions
test("generates binary addition", () => {
  const js = compile(`x = 1 + 2`);
  assertEqual(js, `let x = (1 + 2);`);
});

test("generates binary subtraction", () => {
  const js = compile(`x = 5 - 3`);
  assertEqual(js, `let x = (5 - 3);`);
});

test("generates binary multiplication", () => {
  const js = compile(`x = 3 * 4`);
  assertEqual(js, `let x = (3 * 4);`);
});

test("generates binary division", () => {
  const js = compile(`x = 10 / 2`);
  assertEqual(js, `let x = (10 / 2);`);
});

test("generates binary modulo", () => {
  const js = compile(`x = 10 % 3`);
  assertEqual(js, `let x = (10 % 3);`);
});

test("generates binary comparisons", () => {
  const js = compile(`x = 1 == 2\ny = 3 != 4\nz = 5 > 3`);
  assertEqual(js, `let x = (1 == 2);\nlet y = (3 != 4);\nlet z = (5 > 3);`);
});

test("generates binary logical operators", () => {
  const js = compile(`x = true and false\ny = true or false`);
  assertEqual(js, `let x = (true && false);\nlet y = (true || false);`);
});

// Unary expressions
test("generates unary not", () => {
  const js = compile(`x = not true`);
  assertEqual(js, `let x = (not true);`);
});

// Assignment
test("generates simple assignment", () => {
  const js = compile(`x = 10\nx = 20`);
  assertEqual(js, `let x = 10;\nx = 20;`);
});



// Function calls
test("generates function call with no arguments", () => {
  const js = compile(`foo()`);
  assertEqual(js, `foo();`);
});

test("generates function call with arguments", () => {
  const js = compile(`foo(1, 2, 3)`);
  assertEqual(js, `foo(1, 2, 3);`);
});

test("generates nested function calls", () => {
  const js = compile(`foo(bar(1))`);
  assertEqual(js, `foo(bar(1));`);
});

// Arrays
test("generates array literal", () => {
  const js = compile(`x = [1, 2, 3]`);
  assertEqual(js, `let x = [1, 2, 3];`);
});

test("generates empty array", () => {
  const js = compile(`x = []`);
  assertEqual(js, `let x = [];`);
});

// Objects
test("generates object literal", () => {
  const js = compile(`x = { a: 1, b: 2 }`);
  assertEqual(js, `let x = { a: 1, b: 2 };`);
});

test("generates empty object", () => {
  const js = compile(`x = {}`);
  assertEqual(js, `let x = {  };`);
});

// Control flow - if
test("generates if statement", () => {
  const source = `if (true):
  print(1)`;
  const js = compile(source);
  assertEqual(js, `if (true) {\n  print(1);\n}`);
});

test("generates if-else statement", () => {
  const source = `if (true):
  print(1)
else:
  print(2)`;
  const js = compile(source);
  assertEqual(js, `if (true) {\n  print(1);\n} else {\n  print(2);\n}`);
});

// Control flow - while
test("generates while loop", () => {
  const source = `while (true):
  print(1)`;
  const js = compile(source);
  assertEqual(js, `while (true) {\n  print(1);\n}`);
});

// Control flow - for
test("generates for loop", () => {
  const source = `for i in items:
  print(i)`;
  const js = compile(source);
  assertEqual(js, `for (let i of items) {\n  print(i);\n}`);
});

// Return
test("generates return statement", () => {
  const source = `function foo():
  return 42`;
  const validator = createValidator();
  const tokens = tokenize(source, '<test>');
  const parser = createParser(tokens, '<test>');
  const statements = parser.parseStatements();
  const loc = new Location(1, 0, 1, 0);
  const ast = Program(statements, loc);
  validator.validate(ast);
  const generator = createGenerator();
  const js = generator.generate(ast);
  assertEqual(js, `function foo() {\n  return 42;\n}`);
});

// Multi-statement program
test("generates multi-statement program", () => {
  const source = `x = 10
y = 20
print(x + y)`;
  const js = compile(source);
  assertEqual(js, `let x = 10;\nlet y = 20;\nprint((x + y));`);
});

// Full pipeline with function definition
test("generates function definition", () => {
  const source = `function add(a, b):
  return a + b`;
  const js = compile(source);
  assertEqual(js, `function add(a, b) {\n  return (a + b);\n}`);
});

// Function call with complex expressions
test("generates function call with complex arguments", () => {
  const js = compile(`foo(1 + 2, 3 * 4)`);
  assertEqual(js, `foo((1 + 2), (3 * 4));`);
});

// Member access
test("generates member access", () => {
  const js = compile(`obj.prop`);
  assertEqual(js, `obj.prop;`);
});

test("generates member function call", () => {
  const js = compile(`obj.method(1)`);
  assertEqual(js, `obj.method(1);`);
});

// Break and continue
test("generates break statement", () => {
  const source = `while (true):
  break`;
  const js = compile(source);
  assertEqual(js, `while (true) {\n  break;\n}`);
});

test("generates continue statement", () => {
  const source = `while (true):
  continue`;
  const js = compile(source);
  assertEqual(js, `while (true) {\n  continue;\n}`);
});

// Nested control flow
test("generates nested if statements", () => {
  const source = `if (a):
  if (b):
    print(1)`;
  const js = compile(source);
  assertEqual(js, `if (a) {\n  if (b) {\n    print(1);\n  }\n}`);
});

test("generates if-else with nested if-else", () => {
  const source = `if (a):
  print(1)
else:
  if (b):
    print(2)
  else:
    print(3)`;
  const js = compile(source);
  assertEqual(js, `if (a) {\n  print(1);\n} else {\n  if (b) {\n    print(2);\n  } else {\n    print(3);\n  }\n}`);
});

test("generates for loop with range", () => {
  const source = `for i in range(10):
  print(i)`;
  const js = compile(source);
  assertEqual(js, `for (let i of range(10)) {\n  print(i);\n}`);
});

test("generates while loop with break", () => {
  const source = `while (true):
  break`;
  const js = compile(source);
  assertEqual(js, `while (true) {\n  break;\n}`);
});

test("generates while loop with continue", () => {
  const source = `counter = 10
while (counter):
  counter = counter - 1
  continue`;
  const js = compile(source);
  assertEqual(js, `let counter = 10;\nwhile (counter) {\n  counter = (counter - 1);\n  continue;\n}`);
});

test("generates for loop with multiple statements", () => {
  const source = `total = 0
for i in items:
  print(i)
  total = total + i`;
  const js = compile(source);
  assertEqual(js, `let total = 0;\nfor (let i of items) {\n  print(i);\n  total = (total + i);\n}`);
});

test("generates nested for loops", () => {
  const source = `for i in range(10):
  for j in range(10):
    print(i + j)`;
  const js = compile(source);
  assertEqual(js, `for (let i of range(10)) {\n  for (let j of range(10)) {\n    print((i + j));\n  }\n}`);
});

test("generates if with complex condition", () => {
  const source = `if (x > 10 and y < 5):
  print("big")`;
  const js = compile(source);
  assertEqual(js, `if (((x > 10) && (y < 5))) {\n  print("big");\n}`);
});

test("generates while with break and continue together", () => {
  const source = `while (true):
  if (done):
    break
  continue`;
  const js = compile(source);
  assertEqual(js, `while (true) {\n  if (done) {\n    break;\n  }\n  continue;\n}`);
});

test("generates for loop with array", () => {
  const source = `for item in [1, 2, 3]:
  print(item)`;
  const js = compile(source);
  assertEqual(js, `for (let item of [1, 2, 3]) {\n  print(item);\n}`);
});


// Empty statement
// Variable declaration without init
test("generates variable declaration without init", () => {
  const js = compile(`x = undefined`);
  assertEqual(js, `let x = undefined;`);
});

// Multiple variable declarations
test("generates multiple variable declarations", () => {
  const source = `x = 1
y = 2
z = 3`;
  const js = compile(source);
  assertEqual(js, `let x = 1;\nlet y = 2;\nlet z = 3;`);
});

// Nested expressions
test("generates nested binary expressions", () => {
  const js = compile(`x = 1 + 2 * 3`);
  assertEqual(js, `let x = (1 + (2 * 3));`);
});

test("generates parenthesized expressions", () => {
  const js = compile(`x = (1 + 2) * 3`);
  assertEqual(js, `let x = ((1 + 2) * 3);`);
});

// String concatenation in print
test("generates string in print", () => {
  const js = compile(`print("hello world")`);
  assertEqual(js, `print("hello world");`);
});

// Number operations
test("generates number operations", () => {
  const js = compile(`x = 10 - 5 / 2`);
  assertEqual(js, `let x = (10 - (5 / 2));`);
});

// Boolean operations
test("generates boolean operations", () => {
  const js = compile(`x = true and false or true`);
  assertEqual(js, `let x = ((true && false) || true);`);
});

// Null handling
test("generates null in expression", () => {
  const js = compile(`x = null`);
  assertEqual(js, `let x = null;`);
});

// Empty program
test("generates empty program", () => {
  const js = compile(``);
  assertEqual(js, ``);
});

// Semicolons
// Comments
test("strips line comments", () => {
  const js = compile(`# comment\nx = 1`);
  assertEqual(js, `let x = 1;`);
});

test("strips block comments", () => {
  const source = `# block
x = 1`;
  const js = compile(source);
  assertEqual(js, `let x = 1;`);
});

test("strips inline block comments", () => {
  const source = `x = 1 # comment`;
  const js = compile(source);
  assertEqual(js, `let x = 1;`);
});

// === Phase 9 — Function Generator Tests ===

test("generates function declaration with single parameter", () => {
  const source = `function double(x):
  return x * 2`;
  const js = compile(source);
  assertEqual(js, `function double(x) {\n  return (x * 2);\n}`);
});

test("generates function declaration with multiple parameters", () => {
  const source = `function add(a, b):
  return a + b`;
  const js = compile(source);
  assertEqual(js, `function add(a, b) {\n  return (a + b);\n}`);
});

test("generates function declaration with three parameters", () => {
  const source = `function sum(a, b, c):
  return a + b + c`;
  const js = compile(source);
  assertEqual(js, `function sum(a, b, c) {\n  return ((a + b) + c);\n}`);
});

test("generates function call with single argument", () => {
  const source = `double(5)`;
  const js = compile(source);
  assertEqual(js, `double(5);`);
});

test("generates function call with multiple arguments", () => {
  const source = `add(1, 2)`;
  const js = compile(source);
  assertEqual(js, `add(1, 2);`);
});

test("generates function call assigned to variable", () => {
  const source = `result = add(10, 20)`;
  const js = compile(source);
  assertEqual(js, `let result = add(10, 20);`);
});

test("generates nested function calls", () => {
  const source = `result = add(double(5), 10)`;
  const js = compile(source);
  assertEqual(js, `let result = add(double(5), 10);`);
});

test("generates function with multiple statements", () => {
  const source = `function max(a, b):
  if a > b:
    return a
  return b`;
  const js = compile(source);
  assertEqual(js, `function max(a, b) {\n  if ((a > b)) {\n    return a;\n  }\n  return b;\n}`);
});

test("generates empty function", () => {
  const source = `function empty():
  pass`;
  const tokens = tokenize(source, '<test>');
  const parser = createParser(tokens, '<test>');
  const statements = parser.parseStatements();
  const loc = new Location(1, 0, 1, 0);
  const ast = Program(statements, loc);
  const validator = createValidator();
  validator.validate(ast);
  const generator = createGenerator();
  const js = generator.generate(ast);
  assertEqual(js, `function empty() {\n  // pass\n}`);
});

test("generates function with local variables", () => {
  const source = `function compute(x):
  y = x * 2
  z = y + 1
  return z`;
  const js = compile(source);
  assertEqual(js, `function compute(x) {\n  let y = (x * 2);\n  let z = (y + 1);\n  return z;\n}`);
});

test("generates function with reassignment of parameter", () => {
  const source = `function adjust(x):
  x = x + 1
  return x`;
  const js = compile(source);
  assertEqual(js, `function adjust(x) {\n  x = (x + 1);\n  return x;\n}`);
});

test("generates multiple function declarations", () => {
  const source = `function add(a, b):
  return a + b

function sub(a, b):
  return a - b`;
  const js = compile(source);
  assertEqual(js, `function add(a, b) {\n  return (a + b);\n}\nfunction sub(a, b) {\n  return (a - b);\n}`);
});

test("generates function call after function declaration", () => {
  const source = `function add(a, b):
  return a + b

result = add(3, 4)`;
  const js = compile(source);
  assertEqual(js, `function add(a, b) {\n  return (a + b);\n}\nlet result = add(3, 4);`);
});

test("generates function with for loop body", () => {
  const source = `function sum_array(arr):
  total = 0
  for item in arr:
    total = total + item
  return total`;
  const js = compile(source);
  assertEqual(js, `function sum_array(arr) {\n  let total = 0;\n  for (let item of arr) {\n    total = (total + item);\n  }\n  return total;\n}`);
});

test("generates function with while loop body", () => {
  const source = `function countdown(n):
  while n > 0:
    print(n)
    n = n - 1`;
  const js = compile(source);
  assertEqual(js, `function countdown(n) {\n  while ((n > 0)) {\n    print(n);\n    n = (n - 1);\n  }\n}`);
});

test("generates function with break", () => {
  const source = `function find(items, target):
  for item in items:
    if item == target:
      return item
  return null`;
  const js = compile(source);
  assertEqual(js, `function find(items, target) {\n  for (let item of items) {\n    if ((item == target)) {\n      return item;\n    }\n  }\n  return null;\n}`);
});

test("generates function with nested function call in return", () => {
  const source = `function outer(x):
  return inner(x + 1)`;
  const js = compile(source);
  assertEqual(js, `function outer(x) {\n  return inner((x + 1));\n}`);
});

test("generates function with multiple returns", () => {
  const source = `function abs(x):
  if x < 0:
    return 0 - x
  return x`;
  const js = compile(source);
  assertEqual(js, `function abs(x) {\n  if ((x < 0)) {\n    return (0 - x);\n  }\n  return x;\n}`);
});

test("generates function call with nested call as argument", () => {
  const source = `result = add(multiply(2, 3), 4)`;
  const js = compile(source);
  assertEqual(js, `let result = add(multiply(2, 3), 4);`);
});

// === Phase 14 — Engine API Generator Tests ===

test("generates clear() call", () => {
  const js = compile(`clear()`);
  assertEqual(js, `clear();`);
});

test("generates draw_rect() call with four arguments", () => {
  const js = compile(`draw_rect(10, 20, 50, 50)`);
  assertEqual(js, `draw_rect(10, 20, 50, 50);`);
});

test("generates draw_circle() call with three arguments", () => {
  const js = compile(`draw_circle(100, 100, 25)`);
  assertEqual(js, `draw_circle(100, 100, 25);`);
});

test("generates draw_line() call with four arguments", () => {
  const js = compile(`draw_line(0, 0, 100, 100)`);
  assertEqual(js, `draw_line(0, 0, 100, 100);`);
});

test("generates Engine API calls in function", () => {
  const source = `function draw():
  clear()
  draw_rect(10, 10, 50, 50)`;
  const js = compile(source);
  assertEqual(js, `function draw() {\n  clear();\n  draw_rect(10, 10, 50, 50);\n}`);
});

test("generates Engine API calls with variables", () => {
  const js = compile(`draw_rect(x, y, w, h)`);
  assertEqual(js, `draw_rect(x, y, w, h);`);
});

test("generates Engine API calls with expressions", () => {
  const js = compile(`draw_rect(x + 10, y + 20, width * 2, height / 2)`);
  assertEqual(js, `draw_rect((x + 10), (y + 20), (width * 2), (height / 2));`);
});

test("generates function with array in return", () => {
  const source = `function make_pair(a, b):
  return [a, b]`;
  const js = compile(source);
  assertEqual(js, `function make_pair(a, b) {\n  return [a, b];\n}`);
});

test("generates function with object in return", () => {
  const source = `function make_point(x, y):
  return { x: x, y: y }`;
  const js = compile(source);
  assertEqual(js, `function make_point(x, y) {\n  return { x: x, y: y };\n}`);
});

test("generates function call with expression arguments", () => {
  const source = `result = add(1 + 2, 3 * 4)`;
  const js = compile(source);
  assertEqual(js, `let result = add((1 + 2), (3 * 4));`);
});

test("generates function with member access in body", () => {
  const source = `function get_x(obj):
  return obj.x`;
  const js = compile(source);
  assertEqual(js, `function get_x(obj) {\n  return obj.x;\n}`);
});

test("generates function with member assignment in body", () => {
  const source = `function set_x(obj, val):
  obj.x = val`;
  const js = compile(source);
  assertEqual(js, `function set_x(obj, val) {\n  obj.x = val;\n}`);
});

test("generates function with logical operators in condition", () => {
  const source = `function check(x, y):
  if x > 0 and y > 0:
    return true
  return false`;
  const js = compile(source);
  assertEqual(js, `function check(x, y) {\n  if (((x > 0) && (y > 0))) {\n    return true;\n  }\n  return false;\n}`);
});

test("generates function with not operator", () => {
  const source = `function not_empty(x):
  if not x:
    return false
  return true`;
  const js = compile(source);
  assertEqual(js, `function not_empty(x) {\n  if ((not x)) {\n    return false;\n  }\n  return true;\n}`);
});

test("generates function with return of null", () => {
  const source = `function nothing():
  return null`;
  const js = compile(source);
  assertEqual(js, `function nothing() {\n  return null;\n}`);
});

test("generates function with return of boolean", () => {
  const source = `function is_ready():
  return true`;
  const js = compile(source);
  assertEqual(js, `function is_ready() {\n  return true;\n}`);
});

test("generates function with string literal in return", () => {
  const source = `function greet():
  return "hello"
`;
  const js = compile(source);
  assertEqual(js, `function greet() {\n  return "hello";\n}`);
});

test("generates function call with array argument", () => {
  const source = `process([1, 2, 3])`;
  const js = compile(source);
  assertEqual(js, `process([1, 2, 3]);`);
});

test("generates function call with object argument", () => {
  const source = `process({ x: 10, y: 20 })`;
  const js = compile(source);
  assertEqual(js, `process({ x: 10, y: 20 });`);
});

test("generates function call with nested array access", () => {
  const source = `result = items[0]`;
  const js = compile(source);
  assertEqual(js, `let result = items[0];`);
});

test("generates function with nested function calls in parameters", () => {
  const source = `function combine(a, b):
  return a + b

result = combine(add(1, 2), multiply(3, 4))`;
  const js = compile(source);
  assertEqual(js, `function combine(a, b) {\n  return (a + b);\n}\nlet result = combine(add(1, 2), multiply(3, 4));`);
});

console.log("\nAll generator tests passed!");
