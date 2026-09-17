'use strict';

const { tokenize } = require('../../src/lexer');
const { createParser } = require('../../src/parser');
const { Program } = require('../../src/ast');
const { createValidator, ValidationError } = require('../../src/validator');
const { strictEqual: equal, ok } = require('assert');

// === Helper ===
function parseAndValidate(source) {
  const tokens = tokenize(source, '<test>');
  const parser = createParser(tokens, '<test>');
  const body = parser.parseStatements();
  const program = Program(body, { line: 1, column: 0, endLine: 1, endColumn: 0 });
  const validator = createValidator(source, '<test>');
  return validator.validate(program);
}

// === Test 1: Valid program with no semantic errors ===
{
  const errors = parseAndValidate('x = 10');
  equal(errors.length, 0);
  console.log('PASS: valid simple assignment');
}

// === Test 2: Return inside function is valid ===
{
  const errors = parseAndValidate('function f():\n    return 1');
  equal(errors.length, 0);
  console.log('PASS: return inside function');
}

// === Test 3: Return outside function is error ===
{
  let threw = false;
  try {
    parseAndValidate('return 10');
  } catch (err) {
    threw = true;
    ok(err instanceof ValidationError, 'Should be ValidationError');
    equal(err.message, 'return outside function');
    equal(err.line, 1);
    equal(err.filename, '<test>');
  }
  ok(threw, 'Should have thrown');
  console.log('PASS: return outside function');
}

// === Test 4: Break inside while loop is valid ===
{
  const errors = parseAndValidate('while x:\n    break');
  equal(errors.length, 0);
  console.log('PASS: break inside while');
}

// === Test 5: Break inside for loop is valid ===
{
  const errors = parseAndValidate('for i in items:\n    break');
  equal(errors.length, 0);
  console.log('PASS: break inside for');
}

// === Test 6: Break outside loop is error ===
{
  let threw = false;
  try {
    parseAndValidate('break');
  } catch (err) {
    threw = true;
    ok(err instanceof ValidationError, 'Should be ValidationError');
    equal(err.message, 'break outside loop');
  }
  ok(threw, 'Should have thrown');
  console.log('PASS: break outside loop');
}

// === Test 7: Continue inside while loop is valid ===
{
  const errors = parseAndValidate('while x:\n    continue');
  equal(errors.length, 0);
  console.log('PASS: continue inside while');
}

// === Test 8: Continue inside for loop is valid ===
{
  const errors = parseAndValidate('for i in items:\n    continue');
  equal(errors.length, 0);
  console.log('PASS: continue inside for');
}

// === Test 9: Continue outside loop is error ===
{
  let threw = false;
  try {
    parseAndValidate('continue');
  } catch (err) {
    threw = true;
    ok(err instanceof ValidationError, 'Should be ValidationError');
    equal(err.message, 'continue outside loop');
  }
  ok(threw, 'Should have thrown');
  console.log('PASS: continue outside loop');
}

// === Test 10: Break inside if inside while is valid ===
{
  const errors = parseAndValidate('while x:\n    if y:\n        break');
  equal(errors.length, 0);
  console.log('PASS: break inside if inside while');
}

// === Test 11: Continue inside if inside for is valid ===
{
  const errors = parseAndValidate('for i in items:\n    if x:\n        continue');
  equal(errors.length, 0);
  console.log('PASS: continue inside if inside for');
}

// === Test 12: Return inside nested function is valid ===
{
  const errors = parseAndValidate('function outer():\n    function inner():\n        return 1');
  equal(errors.length, 0);
  console.log('PASS: return inside nested function');
}

// === Test 13: Return in outer scope when function has return is valid ===
{
  // This should be valid - outer scope is not a function
  // Actually, this should fail because return is outside function
  let threw = false;
  try {
    parseAndValidate('function f():\n    return 1\nreturn 2');
  } catch (err) {
    threw = true;
    ok(err instanceof ValidationError, 'Should be ValidationError');
    equal(err.message, 'return outside function');
  }
  ok(threw, 'Should have thrown');
  console.log('PASS: return after function body');
}

// === Test 14: Break in else branch of if inside loop is valid ===
{
  const errors = parseAndValidate('while x:\n    if y:\n        z = 1\n    else:\n        break');
  equal(errors.length, 0);
  console.log('PASS: break in else inside while');
}

// === Test 15: Multiple errors — first one is thrown ===
{
  let threw = false;
  try {
    parseAndValidate('break\ncontinue\nreturn 1');
  } catch (err) {
    threw = true;
    ok(err instanceof ValidationError, 'Should be ValidationError');
    equal(err.message, 'break outside loop');
  }
  ok(threw, 'Should have thrown');
  console.log('PASS: multiple errors — first one thrown');
}

// === Test 16: Complex valid program ===
{
  const errors = parseAndValidate(`function add(a, b):
    return a + b

for i in range(10):
    if i > 5:
        continue
    if i == 3:
        break
    print(i)

while x > 0:
    x = x - 1`);
  equal(errors.length, 0);
  console.log('PASS: complex valid program');
}

// === Test 17: Break in nested while inside for ===
{
  const errors = parseAndValidate('for i in items:\n    while x:\n        break');
  equal(errors.length, 0);
  console.log('PASS: break in nested while inside for');
}

// === Test 18: Continue in nested for inside while ===
{
  const errors = parseAndValidate('while x:\n    for i in items:\n        continue');
  equal(errors.length, 0);
  console.log('PASS: continue in nested for inside while');
}

// === Test 19: Return in function inside while body ===
{
  // The function body is a new function context
  // The return inside the function is valid
  // But the function definition itself is in a while body (which is fine)
  const errors = parseAndValidate('while x:\n    function f():\n        return 1');
  equal(errors.length, 0);
  console.log('PASS: function with return inside while');
}

// === Test 20: Break in function body (not in loop) is error ===
{
  let threw = false;
  try {
    parseAndValidate('function f():\n    break');
  } catch (err) {
    threw = true;
    ok(err instanceof ValidationError, 'Should be ValidationError');
    equal(err.message, 'break outside loop');
  }
  ok(threw, 'Should have thrown');
  console.log('PASS: break in function body (not in loop)');
}

// === Test 21: Return in function inside function ===
{
  const errors = parseAndValidate('function outer():\n    function inner():\n        return inner()');
  equal(errors.length, 0);
  console.log('PASS: nested function with return');
}

// === Test 22: Multiple statements in function ===
{
  const errors = parseAndValidate(`function calc(x):
    if x > 0:
        return x
    return 0`);
  equal(errors.length, 0);
  console.log('PASS: multiple returns in function');
}

// === Test 23: Error location is correct ===
{
  let threw = false;
  try {
    parseAndValidate(`x = 1
y = 2
break`);
  } catch (err) {
    threw = true;
    equal(err.line, 3);
  }
  ok(threw, 'Should have thrown');
  console.log('PASS: error location is correct');
}

// === Test 24: Valid function with no return ===
{
  const errors = parseAndValidate(`function greet():
    print("hello")`);
  equal(errors.length, 0);
  console.log('PASS: function with no return');
}

// === Test 25: Return without argument inside function ===
{
  const errors = parseAndValidate(`function f():
    return`);
  equal(errors.length, 0);
  console.log('PASS: return without argument inside function');
}

// === Test 26: Return without argument outside function ===
{
  let threw = false;
  try {
    parseAndValidate('return');
  } catch (err) {
    threw = true;
    ok(err instanceof ValidationError, 'Should be ValidationError');
    equal(err.message, 'return outside function');
  }
  ok(threw, 'Should have thrown');
  console.log('PASS: return without argument outside function');
}

// === Test 27: If-else at top level (no loop/function context issues) ===
{
  const errors = parseAndValidate(`if x:
    y = 1
else:
    y = 2`);
  equal(errors.length, 0);
  console.log('PASS: if-else at top level');
}

// === Test 28: Break in if inside for inside while ===
{
  const errors = parseAndValidate(`while a:
    for i in items:
        if i > 10:
            break`);
  equal(errors.length, 0);
  console.log('PASS: break in deeply nested loops');
}

// === Test 29: Continue outside loop but after function ===
{
  let threw = false;
  try {
    parseAndValidate(`function f():
    return 1
continue`);
  } catch (err) {
    threw = true;
    ok(err instanceof ValidationError, 'Should be ValidationError');
    equal(err.message, 'continue outside loop');
  }
  ok(threw, 'Should have thrown');
  console.log('PASS: continue after function');
}

// === Test 30: Empty program is valid ===
{
  const errors = parseAndValidate('');
  equal(errors.length, 0);
  console.log('PASS: empty program');
}

console.log('\nAll validator tests passed');
