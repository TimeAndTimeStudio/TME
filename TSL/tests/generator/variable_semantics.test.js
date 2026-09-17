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

// === Variable Declaration ===

test("declaration uses let", () => {
  const js = compile(`x = 10`);
  assertEqual(js, `let x = 10;`);
});

test("multiple declarations use let", () => {
  const js = compile(`a = 1\nb = 2`);
  assertEqual(js, `let a = 1;\nlet b = 2;`);
});

// === Variable Reassignment ===

test("reassignment does not use let", () => {
  const js = compile(`x = 10\nx = 20`);
  assertEqual(js, `let x = 10;\nx = 20;`);
});

test("reassignment after multiple declarations", () => {
  const js = compile(`x = 1\nx = 2\ny = 3\ny = 4`);
  assertEqual(js, `let x = 1;\nx = 2;\nlet y = 3;\ny = 4;`);
});

// === Function Scope ===

test("function parameters are declared variables", () => {
  const source = `function foo(x):
  x = x + 1
  return x`;
  const js = compile(source);
  assertEqual(js, `function foo(x) {\n  x = (x + 1);\n  return x;\n}`);
});

test("local variables in function use let", () => {
  const source = `function foo():
  y = 10
  return y`;
  const js = compile(source);
  assertEqual(js, `function foo() {\n  let y = 10;\n  return y;\n}`);
});

test("reassignment of parameter in function", () => {
  const source = `function add(a):
  a = a + 1
  return a`;
  const js = compile(source);
  assertEqual(js, `function add(a) {\n  a = (a + 1);\n  return a;\n}`);
});

test("function scope is separate from global scope", () => {
  const source = `x = 1
function foo():
  x = 2
  return x
result = foo()`;
  const js = compile(source);
  assertEqual(js, `let x = 1;\nfunction foo() {\n  x = 2;\n  return x;\n}\nlet result = foo();`);
});

// === Block Scope in If ===

test("if block creates new scope", () => {
  const source = `if (true):
  y = 10
print(y)`;
  const js = compile(source);
  assertEqual(js, `if (true) {\n  let y = 10;\n}\nprint(y);`);
});

test("if-else each has own scope", () => {
  const source = `if (true):
  y = 10
else:
  y = 20`;
  const js = compile(source);
  assertEqual(js, `if (true) {\n  let y = 10;\n} else {\n  let y = 20;\n}`);
});

test("reassign outer variable inside if block", () => {
  const source = `x = 1
if (true):
  x = 2`;
  const js = compile(source);
  assertEqual(js, `let x = 1;\nif (true) {\n  x = 2;\n}`);
});

// === Block Scope in While ===

test("while block creates new scope", () => {
  const source = `while (true):
  y = 10
print(y)`;
  const js = compile(source);
  assertEqual(js, `while (true) {\n  let y = 10;\n}\nprint(y);`);
});

test("reassign outer variable inside while block", () => {
  const source = `counter = 5
while counter > 0:
  counter = counter - 1`;
  const js = compile(source);
  assertEqual(js, `let counter = 5;\nwhile ((counter > 0)) {\n  counter = (counter - 1);\n}`);
});

// === Block Scope in For ===

test("for loop variable is scoped to loop", () => {
  const source = `for i in range(3):
  print(i)
print(i)`;
  const js = compile(source);
  assertEqual(js, `for (let i of range(3)) {\n  print(i);\n}\nprint(i);`);
});

test("for loop body creates new scope", () => {
  const source = `x = 1
for i in range(3):
  x = x + i`;
  const js = compile(source);
  assertEqual(js, `let x = 1;\nfor (let i of range(3)) {\n  x = (x + i);\n}`);
});

// === Nested Scopes ===

test("nested if blocks create separate scopes", () => {
  const source = `if (a):
  if (b):
    z = 1`;
  const js = compile(source);
  assertEqual(js, `if (a) {\n  if (b) {\n    let z = 1;\n  }\n}`);
});

test("nested function creates new scope", () => {
  const source = `function outer():
  x = 1
  function inner():
    x = 2
    return x
  return inner()`;
  const js = compile(source);
  assertEqual(js, `function outer() {\n  let x = 1;\n  function inner() {\n    x = 2;\n    return x;\n  }\n  return inner();\n}`);
});

// === Mixed Scenarios ===

test("function with for loop and variable reassignment", () => {
  const source = `function total(arr):
  sum = 0
  for item in arr:
    sum = sum + item
  return sum`;
  const js = compile(source);
  assertEqual(js, `function total(arr) {\n  let sum = 0;\n  for (let item of arr) {\n    sum = (sum + item);\n  }\n  return sum;\n}`);
});

test("if block with for loop", () => {
  const source = `if (true):
  for i in range(5):
    print(i)`;
  const js = compile(source);
  assertEqual(js, `if (true) {\n  for (let i of range(5)) {\n    print(i);\n  }\n}`);
});

test("global reassignment after function", () => {
  const source = `function foo():
  return 10
x = foo()
x = x + 1`;
  const js = compile(source);
  assertEqual(js, `function foo() {\n  return 10;\n}\nlet x = foo();\nx = (x + 1);`);
});

// === Phase 10 Checkpoint ===

console.log("\nAll Phase 10 variable semantics tests passed!");
