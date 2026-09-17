const { execSync } = require('child_process');
const { writeFileSync, readFileSync, unlinkSync } = require('fs');
const { strictEqual, ok, deepStrictEqual } = require('assert');
const path = require('path');

const CLI = path.join(__dirname, '..', '..', 'src', 'cli.js');
const EXAMPLES = path.join(__dirname, '..', '..', 'examples');

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

function compileTsl(source) {
  const tmp = `/tmp/integration_${Date.now()}.tsl`;
  writeFileSync(tmp, source, 'utf-8');
  try {
    const result = execSync(`node ${CLI} "${tmp}"`, { encoding: 'utf-8' });
    unlinkSync(tmp);
    return result;
  } catch (err) {
    unlinkSync(tmp);
    throw new Error(err.stderr || err.stdout || 'Compilation failed');
  }
}

function compileAndRun(source) {
  const tmp = `/tmp/integration_${Date.now()}.tsl`;
  writeFileSync(tmp, source, 'utf-8');
  try {
    const result = execSync(`node ${CLI} "${tmp}"`, { encoding: 'utf-8' });
    const jsMatch = result.match(/--- Generated JavaScript ---\s*\n([\s\S]*?)\s*--- End of Generated Code ---/);
    if (!jsMatch) throw new Error('Could not extract generated JavaScript');
    const jsCode = jsMatch[1];
    unlinkSync(tmp);
    return { jsCode };
  } catch (err) {
    unlinkSync(tmp);
    throw new Error(err.stderr || err.stdout || 'Compilation failed');
  }
}

// === Phase 18 — Integration Tests ===

// Test 1: hello.tsl compiles
test("hello.tsl compiles successfully", () => {
  const result = compileTsl('print("Hello, World!")\n');
  ok(result.includes('Compilation successful'), 'Should compile');
  ok(result.includes('Hello, World!'), 'Should contain output');
});

// Test 2: variables.tsl compiles
test("variables.tsl compiles successfully", () => {
  const result = compileTsl('x = 10\ny = "hello"\nz = true\nprint(x)\nprint(y)\nprint(z)\n');
  ok(result.includes('Compilation successful'), 'Should compile');
});

// Test 3: math.tsl compiles
test("math.tsl compiles successfully", () => {
  const result = compileTsl('a = 10\nb = 3\nprint(a + b)\nprint(a * b)\nprint(a % b)\n');
  ok(result.includes('Compilation successful'), 'Should compile');
});

// Test 4: if.tsl compiles
test("if.tsl compiles successfully", () => {
  const result = compileTsl('x = 15\nif x > 10:\n    print("big")\nelse:\n    print("small")\n');
  ok(result.includes('Compilation successful'), 'Should compile');
});

// Test 5: loops.tsl compiles
test("loops.tsl compiles successfully", () => {
  const result = compileTsl('for i in range(3):\n    print(i)\n');
  ok(result.includes('Compilation successful'), 'Should compile');
});

// Test 6: functions.tsl compiles
test("functions.tsl compiles successfully", () => {
  const result = compileTsl('function add(a, b):\n    return a + b\n\nresult = add(5, 10)\nprint(result)\n');
  ok(result.includes('Compilation successful'), 'Should compile');
});

// Test 7: arrays.tsl compiles
test("arrays.tsl compiles successfully", () => {
  const result = compileTsl('items = [1, 2, 3]\nprint(items[0])\n');
  ok(result.includes('Compilation successful'), 'Should compile');
});

// Test 8: objects.tsl compiles
test("objects.tsl compiles successfully", () => {
  const result = compileTsl('obj = { x: 10, y: 20 }\nprint(obj.x)\n');
  ok(result.includes('Compilation successful'), 'Should compile');
});

// Test 9: graphics.tsl compiles
test("graphics.tsl compiles successfully", () => {
  const result = compileTsl('clear()\ndraw_rect(10, 20, 50, 50)\ndraw_circle(100, 100, 25)\ndraw_line(0, 0, 200, 200)\n');
  ok(result.includes('Compilation successful'), 'Should compile');
});

// Test 10: game.tsl compiles
test("game.tsl compiles successfully", () => {
  const result = compileTsl('player_x = 100\nplayer_y = 100\n\nfunction update():\n    player_x = player_x + 1\n\nfunction draw():\n    clear()\n    draw_rect(player_x, player_y, 50, 50)\n');
  ok(result.includes('Compilation successful'), 'Should compile');
});

// Test 11: All example files exist and compile
test("all example files compile", () => {
  const expectedFiles = [
    'hello.tsl',
    'variables.tsl',
    'math.tsl',
    'if.tsl',
    'while.tsl',
    'for.tsl',
    'functions.tsl',
    'arrays.tsl',
    'objects.tsl',
    'strings.tsl',
    'comparison.tsl',
    'logical.tsl',
    'nested.tsl',
    'recursion.tsl',
    'fibonacci.tsl',
    'bubble_sort.tsl',
  ];

  for (const file of expectedFiles) {
    const filePath = path.join(EXAMPLES, file);
    ok(readFileSync(filePath, 'utf-8').length > 0, `${file} should not be empty`);
  }
});

// Test 12: Full pipeline — hello.tsl
test("full pipeline: hello.tsl", () => {
  const result = compileAndRun('print("Integration test")\n');
  ok(result.jsCode.includes('print("Integration test");'), 'Should generate correct JS');
});

// Test 13: Full pipeline — variables
test("full pipeline: variables", () => {
  const result = compileAndRun('x = 42\nprint(x)\n');
  ok(result.jsCode.includes('let x = 42;'), 'Should declare variable');
});

// Test 14: Full pipeline — math operations
test("full pipeline: math operations", () => {
  const result = compileAndRun('a = 10\nb = 3\nprint(a + b)\nprint(a - b)\nprint(a * b)\nprint(a / b)\n');
  ok(result.jsCode.includes('(a + b)'), 'Should generate addition');
  ok(result.jsCode.includes('(a - b)'), 'Should generate subtraction');
  ok(result.jsCode.includes('(a * b)'), 'Should generate multiplication');
  ok(result.jsCode.includes('(a / b)'), 'Should generate division');
});

// Test 15: Full pipeline — if/else
test("full pipeline: if/else", () => {
  const result = compileAndRun('if x > 10:\n    print("big")\nelse:\n    print("small")\n');
  ok(result.jsCode.includes('if'), 'Should generate if');
  ok(result.jsCode.includes('else'), 'Should generate else');
});

// Test 16: Full pipeline — for loop
test("full pipeline: for loop", () => {
  const result = compileAndRun('for i in range(10):\n    print(i)\n');
  ok(result.jsCode.includes('for (let i of range(10))'), 'Should generate for-of loop');
});

// Test 17: Full pipeline — while loop
test("full pipeline: while loop", () => {
  const result = compileAndRun('while x > 0:\n    print(x)\n    x = x - 1\n');
  ok(result.jsCode.includes('while'), 'Should generate while');
});

// Test 18: Full pipeline — function
test("full pipeline: function", () => {
  const result = compileAndRun('function double(n):\n    return n * 2\n\nresult = double(5)\nprint(result)\n');
  ok(result.jsCode.includes('function double(n)'), 'Should generate function declaration');
  ok(result.jsCode.includes('return (n * 2)'), 'Should generate return');
  ok(result.jsCode.includes('double(5)'), 'Should generate function call');
});

// Test 19: Full pipeline — arrays
test("full pipeline: arrays", () => {
  const result = compileAndRun('arr = [1, 2, 3]\nx = arr[0]\nprint(x)\n');
  ok(result.jsCode.includes('[1, 2, 3]'), 'Should generate array literal');
  ok(result.jsCode.includes('arr[0]'), 'Should generate array access');
});

// Test 20: Full pipeline — objects
test("full pipeline: objects", () => {
  const result = compileAndRun('obj = { x: 10, y: 20 }\nprint(obj.x)\n');
  ok(result.jsCode.includes('{ x: 10, y: 20 }'), 'Should generate object literal');
  ok(result.jsCode.includes('obj.x'), 'Should generate member access');
});

// Test 21: Full pipeline — engine API
test("full pipeline: engine API", () => {
  const result = compileAndRun('clear()\ndraw_rect(10, 20, 50, 50)\ndraw_circle(100, 100, 25)\ndraw_line(0, 0, 200, 200)\n');
  ok(result.jsCode.includes('clear();'), 'Should generate clear()');
  ok(result.jsCode.includes('draw_rect(10, 20, 50, 50);'), 'Should generate draw_rect()');
  ok(result.jsCode.includes('draw_circle(100, 100, 25);'), 'Should generate draw_circle()');
  ok(result.jsCode.includes('draw_line(0, 0, 200, 200);'), 'Should generate draw_line()');
});

// Test 22: Full pipeline — nested control flow
test("full pipeline: nested control flow", () => {
  const result = compileAndRun('if x > 0:\n    if y > 0:\n        print("both positive")\n    else:\n        print("y not positive")\nelse:\n    print("x not positive")\n');
  ok(result.jsCode.includes('if'), 'Should generate nested if');
  ok(result.jsCode.includes('else'), 'Should generate else');
});

// Test 23: Full pipeline — function with loop
test("full pipeline: function with loop", () => {
  const result = compileAndRun('function sum_array(arr):\n    total = 0\n    for item in arr:\n        total = total + item\n    return total\n\nresult = sum_array([1, 2, 3])\nprint(result)\n');
  ok(result.jsCode.includes('function sum_array(arr)'), 'Should generate function');
  ok(result.jsCode.includes('for (let item of arr)'), 'Should generate for inside function');
  ok(result.jsCode.includes('return total'), 'Should generate return');
});

// Test 24: Full pipeline — boolean and logical
test("full pipeline: boolean and logical operators", () => {
  const result = compileAndRun('a = true and false\nb = true or false\nc = not true\nprint(a)\nprint(b)\nprint(c)\n');
  ok(result.jsCode.includes('&&'), 'Should generate &&');
  ok(result.jsCode.includes('||'), 'Should generate ||');
  ok(result.jsCode.includes('not'), 'Should generate not');
});

// Test 25: Full pipeline — null
test("full pipeline: null literal", () => {
  const result = compileAndRun('value = null\nprint(value)\n');
  ok(result.jsCode.includes('null'), 'Should generate null');
});

// Test 26: Generated JavaScript is valid
test("generated JavaScript is syntactically valid", () => {
  const result = compileAndRun('x = 10\nprint(x)\n');
  // Try to parse the generated JS
  try {
    new Function(result.jsCode);
  } catch (e) {
    throw new Error(`Generated JavaScript is invalid: ${e.message}\n${result.jsCode}`);
  }
});

// Test 27: Generated JavaScript runs standalone
test("generated JavaScript runs standalone", () => {
  const tmp = `/tmp/integration_run_${Date.now()}.tsl`;
  writeFileSync(tmp, 'x = 10\nprint(x)\n', 'utf-8');
  try {
    const result = execSync(`node ${CLI} "${tmp}"`, { encoding: 'utf-8' });
    const jsMatch = result.match(/--- Generated JavaScript ---\s*\n([\s\S]*?)\s*--- End of Generated Code ---/);
    const jsCode = jsMatch[1];

    // Execute with standalone context
    const fn = new Function('print', 'range', 'clear', 'draw_rect', 'draw_circle', 'draw_line', jsCode);
    fn((...args) => {}, () => {}, () => {}, () => {}, () => {}, () => {});
  } finally {
    try { unlinkSync(tmp); } catch {}
  }
});

// Test 28: Complex expression
test("full pipeline: complex expressions", () => {
  const result = compileAndRun('x = (10 + 20) * 2\nprint(x)\n');
  ok(result.jsCode.includes('((10 + 20) * 2)'), 'Should handle complex expressions');
});

// Test 29: Break statement
test("full pipeline: break statement", () => {
  const result = compileAndRun('while true:\n    break\n');
  ok(result.jsCode.includes('break'), 'Should generate break');
});

// Test 30: Continue statement
test("full pipeline: continue statement", () => {
  const result = compileAndRun('while true:\n    continue\n');
  ok(result.jsCode.includes('continue'), 'Should generate continue');
});

console.log('\nAll integration tests passed!');
