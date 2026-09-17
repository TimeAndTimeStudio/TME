'use strict';

const { tokenize } = require('../../src/lexer');
const { createParser, ParserError } = require('../../src/parser');
const { strictEqual: equal, ok, deepEqual } = require('assert');

// === Helper ===
function parse(source) {
  const tokens = tokenize(source, '<test>');
  const parser = createParser(tokens, '<test>');
  return parser.parseExpression();
}

// === Test 1: Number literal ===
{
  const node = parse('42');
  equal(node.type, 'NumberLiteral');
  equal(node.value, 42);
  ok(node.location, 'should have location');
  console.log('PASS: number literal');
}

// === Test 2: Float literal ===
{
  const node = parse('3.14');
  equal(node.type, 'NumberLiteral');
  equal(node.value, 3.14);
  console.log('PASS: float literal');
}

// === Test 3: String literal ===
{
  const node = parse('"hello"');
  equal(node.type, 'StringLiteral');
  equal(node.value, 'hello');
  console.log('PASS: string literal');
}

// === Test 4: Single-quoted string ===
{
  const node = parse("'world'");
  equal(node.type, 'StringLiteral');
  equal(node.value, 'world');
  console.log('PASS: single-quoted string');
}

// === Test 5: Boolean true ===
{
  const node = parse('true');
  equal(node.type, 'BooleanLiteral');
  equal(node.value, true);
  console.log('PASS: boolean true');
}

// === Test 6: Boolean false ===
{
  const node = parse('false');
  equal(node.type, 'BooleanLiteral');
  equal(node.value, false);
  console.log('PASS: boolean false');
}

// === Test 7: Null literal ===
{
  const node = parse('null');
  equal(node.type, 'NullLiteral');
  console.log('PASS: null literal');
}

// === Test 8: Identifier ===
{
  const node = parse('x');
  equal(node.type, 'Identifier');
  equal(node.name, 'x');
  console.log('PASS: identifier');
}

// === Test 9: Identifier with underscore ===
{
  const node = parse('player_x');
  equal(node.type, 'Identifier');
  equal(node.name, 'player_x');
  console.log('PASS: identifier with underscore');
}

// === Test 10: Function call with one argument ===
{
  const node = parse('print(x)');
  equal(node.type, 'CallExpression');
  equal(node.callee.type, 'Identifier');
  equal(node.callee.name, 'print');
  equal(node.arguments.length, 1);
  equal(node.arguments[0].type, 'Identifier');
  equal(node.arguments[0].name, 'x');
  console.log('PASS: function call with one argument');
}

// === Test 11: Function call with multiple arguments ===
{
  const node = parse('add(10, 20)');
  equal(node.type, 'CallExpression');
  equal(node.callee.name, 'add');
  equal(node.arguments.length, 2);
  equal(node.arguments[0].value, 10);
  equal(node.arguments[1].value, 20);
  console.log('PASS: function call with multiple arguments');
}

// === Test 12: Function call with no arguments ===
{
  const node = parse('foo()');
  equal(node.type, 'CallExpression');
  equal(node.callee.name, 'foo');
  equal(node.arguments.length, 0);
  console.log('PASS: function call with no arguments');
}

// === Test 13: Nested function call ===
{
  const node = parse('f(g(h()))');
  equal(node.type, 'CallExpression');
  equal(node.callee.name, 'f');
  equal(node.arguments[0].type, 'CallExpression');
  equal(node.arguments[0].callee.name, 'g');
  equal(node.arguments[0].arguments[0].callee.name, 'h');
  console.log('PASS: nested function call');
}

// === Test 14: Array literal empty ===
{
  const node = parse('[]');
  equal(node.type, 'ArrayExpression');
  equal(node.elements.length, 0);
  console.log('PASS: empty array');
}

// === Test 15: Array literal with elements ===
{
  const node = parse('[10, 20, 30]');
  equal(node.type, 'ArrayExpression');
  equal(node.elements.length, 3);
  equal(node.elements[0].value, 10);
  equal(node.elements[1].value, 20);
  equal(node.elements[2].value, 30);
  console.log('PASS: array with elements');
}

// === Test 16: Array with mixed types ===
{
  const node = parse('[1, "hello", true]');
  equal(node.type, 'ArrayExpression');
  equal(node.elements.length, 3);
  equal(node.elements[0].type, 'NumberLiteral');
  equal(node.elements[1].type, 'StringLiteral');
  equal(node.elements[2].type, 'BooleanLiteral');
  console.log('PASS: array with mixed types');
}

// === Test 17: Object literal empty ===
{
  const node = parse('{}');
  equal(node.type, 'ObjectExpression');
  equal(node.properties.length, 0);
  console.log('PASS: empty object');
}

// === Test 18: Object literal with properties ===
{
  const node = parse('{x: 10, y: 20}');
  equal(node.type, 'ObjectExpression');
  equal(node.properties.length, 2);
  equal(node.properties[0].key.name, 'x');
  equal(node.properties[0].value.value, 10);
  equal(node.properties[1].key.name, 'y');
  equal(node.properties[1].value.value, 20);
  console.log('PASS: object with properties');
}

// === Test 19: Addition ===
{
  const node = parse('a + b');
  equal(node.type, 'BinaryExpression');
  equal(node.operator, '+');
  equal(node.left.name, 'a');
  equal(node.right.name, 'b');
  console.log('PASS: addition');
}

// === Test 20: Subtraction ===
{
  const node = parse('x - y');
  equal(node.type, 'BinaryExpression');
  equal(node.operator, '-');
  console.log('PASS: subtraction');
}

// === Test 21: Multiplication ===
{
  const node = parse('a * b');
  equal(node.type, 'BinaryExpression');
  equal(node.operator, '*');
  console.log('PASS: multiplication');
}

// === Test 22: Division ===
{
  const node = parse('a / b');
  equal(node.type, 'BinaryExpression');
  equal(node.operator, '/');
  console.log('PASS: division');
}

// === Test 23: Modulo ===
{
  const node = parse('a % b');
  equal(node.type, 'BinaryExpression');
  equal(node.operator, '%');
  console.log('PASS: modulo');
}

// === Test 24: Comparison less than ===
{
  const node = parse('a < b');
  equal(node.type, 'BinaryExpression');
  equal(node.operator, '<');
  console.log('PASS: less than');
}

// === Test 25: Comparison less or equal ===
{
  const node = parse('a <= b');
  equal(node.type, 'BinaryExpression');
  equal(node.operator, '<=');
  console.log('PASS: less or equal');
}

// === Test 26: Comparison greater than ===
{
  const node = parse('a > b');
  equal(node.type, 'BinaryExpression');
  equal(node.operator, '>');
  console.log('PASS: greater than');
}

// === Test 27: Comparison greater or equal ===
{
  const node = parse('a >= b');
  equal(node.type, 'BinaryExpression');
  equal(node.operator, '>=');
  console.log('PASS: greater or equal');
}

// === Test 28: Equality ===
{
  const node = parse('a == b');
  equal(node.type, 'BinaryExpression');
  equal(node.operator, '==');
  console.log('PASS: equality');
}

// === Test 29: Not equal ===
{
  const node = parse('a != b');
  equal(node.type, 'BinaryExpression');
  equal(node.operator, '!=');
  console.log('PASS: not equal');
}

// === Test 30: Unary not ===
{
  const node = parse('not x');
  equal(node.type, 'UnaryExpression');
  equal(node.operator, 'not');
  equal(node.argument.type, 'Identifier');
  equal(node.argument.name, 'x');
  console.log('PASS: unary not');
}

// === Test 31: Double not ===
{
  const node = parse('not not x');
  equal(node.type, 'UnaryExpression');
  equal(node.operator, 'not');
  equal(node.argument.type, 'UnaryExpression');
  equal(node.argument.operator, 'not');
  console.log('PASS: double not');
}

// === Test 32: not applied to identifier (higher precedence than >) ===
{
  const node = parse('not x > 10');
  equal(node.type, 'BinaryExpression');
  equal(node.operator, '>');
  equal(node.left.type, 'UnaryExpression');
  equal(node.left.operator, 'not');
  equal(node.right.value, 10);
  console.log('PASS: not applied to binary');
}

// === Test 33: Grouped expression ===
{
  const node = parse('(10 + 20)');
  equal(node.type, 'BinaryExpression');
  equal(node.operator, '+');
  equal(node.left.value, 10);
  equal(node.right.value, 20);
  console.log('PASS: grouped expression');
}

// === Test 34: Multiplication has higher precedence than addition ===
{
  const node = parse('a + b * c');
  equal(node.type, 'BinaryExpression');
  equal(node.operator, '+');
  equal(node.left.name, 'a');
  equal(node.right.type, 'BinaryExpression');
  equal(node.right.operator, '*');
  equal(node.right.left.name, 'b');
  equal(node.right.right.name, 'c');
  console.log('PASS: multiplication before addition');
}

// === Test 35: not has higher precedence than and ===
{
  const node = parse('not a and b');
  equal(node.type, 'BinaryExpression');
  equal(node.operator, 'and');
  equal(node.left.type, 'UnaryExpression');
  equal(node.left.operator, 'not');
  equal(node.right.name, 'b');
  console.log('PASS: not before and');
}

// === Test 36: and has higher precedence than or ===
{
  const node = parse('a and b or c');
  equal(node.type, 'BinaryExpression');
  equal(node.operator, 'or');
  equal(node.left.type, 'BinaryExpression');
  equal(node.left.operator, 'and');
  equal(node.right.name, 'c');
  console.log('PASS: and before or');
}

// === Test 37: Chained binary expressions ===
{
  const node = parse('a + b + c');
  equal(node.type, 'BinaryExpression');
  equal(node.operator, '+');
  equal(node.left.type, 'BinaryExpression');
  equal(node.left.operator, '+');
  equal(node.left.left.name, 'a');
  equal(node.left.right.name, 'b');
  equal(node.right.name, 'c');
  console.log('PASS: chained addition');
}

// === Test 38: Member access ===
{
  const node = parse('player.x');
  equal(node.type, 'MemberExpression');
  equal(node.object.name, 'player');
  equal(node.property.name, 'x');
  console.log('PASS: member access');
}

// === Test 39: Call after member access ===
{
  const node = parse('player.move(10, 20)');
  equal(node.type, 'CallExpression');
  equal(node.callee.type, 'MemberExpression');
  equal(node.callee.object.name, 'player');
  equal(node.callee.property.name, 'move');
  equal(node.arguments.length, 2);
  console.log('PASS: method call');
}

// === Test 40: Complex expression ===
{
  const node = parse('(10 + 20) * 3');
  equal(node.type, 'BinaryExpression');
  equal(node.operator, '*');
  equal(node.left.type, 'BinaryExpression');
  equal(node.left.operator, '+');
  equal(node.left.left.value, 10);
  equal(node.left.right.value, 20);
  equal(node.right.value, 3);
  console.log('PASS: complex expression with grouping');
}

// === Test 41: Logical or ===
{
  const node = parse('a or b');
  equal(node.type, 'BinaryExpression');
  equal(node.operator, 'or');
  equal(node.left.name, 'a');
  equal(node.right.name, 'b');
  console.log('PASS: logical or');
}

// === Test 42: Complex chained expression ===
{
  const node = parse('a < b and c > d or e == f');
  equal(node.type, 'BinaryExpression');
  equal(node.operator, 'or');
  equal(node.left.type, 'BinaryExpression');
  equal(node.left.operator, 'and');
  equal(node.left.left.type, 'BinaryExpression');
  equal(node.left.left.operator, '<');
  equal(node.left.right.type, 'BinaryExpression');
  equal(node.left.right.operator, '>');
  equal(node.right.type, 'BinaryExpression');
  equal(node.right.operator, '==');
  console.log('PASS: complex chained expression');
}

// === Test 43: Array with nested expression ===
{
  const node = parse('[1 + 2, 3 * 4]');
  equal(node.type, 'ArrayExpression');
  equal(node.elements.length, 2);
  equal(node.elements[0].type, 'BinaryExpression');
  equal(node.elements[1].type, 'BinaryExpression');
  console.log('PASS: array with nested expressions');
}

// === Test 44: Call with array argument ===
{
  const node = parse('print([1, 2, 3])');
  equal(node.type, 'CallExpression');
  equal(node.arguments[0].type, 'ArrayExpression');
  equal(node.arguments[0].elements.length, 3);
  console.log('PASS: call with array argument');
}

// === Test 45: Call with object argument ===
{
  const node = parse('draw({x: 10, y: 20})');
  equal(node.type, 'CallExpression');
  equal(node.arguments[0].type, 'ObjectExpression');
  equal(node.arguments[0].properties.length, 2);
  console.log('PASS: call with object argument');
}

// === Test 46: Object with expression values ===
{
  const node = parse('{x: 1 + 2, y: 3 * 4}');
  equal(node.type, 'ObjectExpression');
  equal(node.properties.length, 2);
  equal(node.properties[0].value.type, 'BinaryExpression');
  equal(node.properties[1].value.type, 'BinaryExpression');
  console.log('PASS: object with expression values');
}

// === Test 47: Nested arrays ===
{
  const node = parse('[[1, 2], [3, 4]]');
  equal(node.type, 'ArrayExpression');
  equal(node.elements.length, 2);
  equal(node.elements[0].type, 'ArrayExpression');
  equal(node.elements[0].elements.length, 2);
  console.log('PASS: nested arrays');
}

// === Test 48: Identifier as function name ===
{
  const node = parse('callback()');
  equal(node.type, 'CallExpression');
  equal(node.callee.name, 'callback');
  console.log('PASS: identifier as function name');
}

// === Test 49: Call with comparison ===
{
  const node = parse('check(x > 10)');
  equal(node.type, 'CallExpression');
  equal(node.arguments[0].type, 'BinaryExpression');
  equal(node.arguments[0].operator, '>');
  console.log('PASS: call with comparison argument');
}

// === Test 50: Not with grouping ===
{
  const node = parse('not (a and b)');
  equal(node.type, 'UnaryExpression');
  equal(node.operator, 'not');
  equal(node.argument.type, 'BinaryExpression');
  equal(node.argument.operator, 'and');
  console.log('PASS: not with grouping');
}

// === Test 51: Error on unexpected token ===
{
  try {
    const tokens = tokenize('1 + + 2', '<test>');
    const parser = createParser(tokens, '<test>');
    parser.parseExpression();
    console.log('FAIL: should have thrown ParserError');
  } catch (err) {
    ok(err instanceof ParserError, 'Should be ParserError');
    equal(err.line, 1);
    console.log('PASS: error on unexpected token');
  }
}

// === Test 52: Error on missing closing paren ===
{
  try {
    const tokens = tokenize('f(10', '<test>');
    const parser = createParser(tokens, '<test>');
    parser.parseExpression();
    console.log('FAIL: should have thrown ParserError');
  } catch (err) {
    ok(err instanceof ParserError, 'Should be ParserError');
    console.log('PASS: error on missing closing paren');
  }
}

// === Test 53: Error on missing comma in array ===
{
  try {
    const tokens = tokenize('[10 20]', '<test>');
    const parser = createParser(tokens, '<test>');
    parser.parseExpression();
    console.log('FAIL: should have thrown ParserError');
  } catch (err) {
    ok(err instanceof ParserError, 'Should be ParserError');
    console.log('PASS: error on missing comma');
  }
}

// === Test 54: Multiple operators in sequence ===
{
  const node = parse('a * b + c / d');
  equal(node.type, 'BinaryExpression');
  equal(node.operator, '+');
  equal(node.left.type, 'BinaryExpression');
  equal(node.left.operator, '*');
  equal(node.right.type, 'BinaryExpression');
  equal(node.right.operator, '/');
  console.log('PASS: multiple operators in sequence');
}

// === Test 55: Location tracking ===
{
  const node = parse('42');
  ok(node.location, 'should have location');
  ok(node.location.line !== undefined, 'should have line');
  ok(node.location.column !== undefined, 'should have column');
  console.log('PASS: location tracking');
}

// === Test 56: String with escape in expression ===
{
  const node = parse('"hello\\nworld"');
  equal(node.type, 'StringLiteral');
  equal(node.value, 'hello\nworld');
  console.log('PASS: string with escape in expression');
}

// === Test 57: Call with nested call ===
{
  const node = parse('f(g())');
  equal(node.type, 'CallExpression');
  equal(node.callee.name, 'f');
  equal(node.arguments[0].type, 'CallExpression');
  equal(node.arguments[0].callee.name, 'g');
  console.log('PASS: call with nested call');
}

// === Test 58: Chained member access (should work as member of member) ===
{
  const node = parse('a.b.c');
  equal(node.type, 'MemberExpression');
  equal(node.property.name, 'c');
  equal(node.object.type, 'MemberExpression');
  equal(node.object.property.name, 'b');
  equal(node.object.object.name, 'a');
  console.log('PASS: chained member access');
}

// === Test 59: Expression with all literal types ===
{
  const tokens = tokenize('10 "hello" true false null', '<test>');
  const parser = createParser(tokens, '<test>');
  const num = parser.parseExpression();
  equal(num.type, 'NumberLiteral');
  equal(num.value, 10);

  const str = parser.parseExpression();
  equal(str.type, 'StringLiteral');
  equal(str.value, 'hello');

  const btrue = parser.parseExpression();
  equal(btrue.type, 'BooleanLiteral');
  equal(btrue.value, true);

  const bfalse = parser.parseExpression();
  equal(bfalse.type, 'BooleanLiteral');
  equal(bfalse.value, false);

  const nul = parser.parseExpression();
  equal(nul.type, 'NullLiteral');
  console.log('PASS: all literal types');
}

// === Test 60: Complex nested expression ===
{
  const node = parse('not (a + b * c) > d and e or f');
  equal(node.type, 'BinaryExpression');
  equal(node.operator, 'or');
  equal(node.left.type, 'BinaryExpression');
  equal(node.left.operator, 'and');
  console.log('PASS: complex nested expression');
}

console.log('\nAll parser expression tests passed');
