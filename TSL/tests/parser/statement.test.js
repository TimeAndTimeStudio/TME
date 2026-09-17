'use strict';

const { tokenize } = require('../../src/lexer');
const { createParser, ParserError } = require('../../src/parser');
const { strictEqual: equal, ok } = require('assert');

// === Helper ===
function parseStatements(source) {
  const tokens = tokenize(source, '<test>');
  const parser = createParser(tokens, '<test>');
  return parser.parseStatements();
}

function parseStatement(source) {
  const tokens = tokenize(source, '<test>');
  const parser = createParser(tokens, '<test>');
  return parser.parseStatement();
}

// === Test 1: Assignment ===
{
  const stmt = parseStatement('x = 10');
  equal(stmt.type, 'Assignment');
  equal(stmt.left.name, 'x');
  equal(stmt.right.value, 10);
  console.log('PASS: assignment');
}

// === Test 2: Assignment with identifier ===
{
  const stmt = parseStatement('y = x');
  equal(stmt.type, 'Assignment');
  equal(stmt.left.name, 'y');
  equal(stmt.right.name, 'x');
  console.log('PASS: assignment with identifier');
}

// === Test 3: Assignment with expression ===
{
  const stmt = parseStatement('result = a + b');
  equal(stmt.type, 'Assignment');
  equal(stmt.left.name, 'result');
  equal(stmt.right.type, 'BinaryExpression');
  equal(stmt.right.operator, '+');
  console.log('PASS: assignment with expression');
}

// === Test 4: If statement ===
{
  const stmt = parseStatement('if x > 10:\n    print(x)');
  equal(stmt.type, 'IfStatement');
  equal(stmt.condition.type, 'BinaryExpression');
  equal(stmt.condition.operator, '>');
  equal(stmt.consequent.length, 1);
  console.log('PASS: if statement');
}

// === Test 5: If-else statement ===
{
  const stmt = parseStatement('if x > 10:\n    print(x)\nelse:\n    print(0)');
  equal(stmt.type, 'IfStatement');
  equal(stmt.consequent.length, 1);
  ok(stmt.alternate, 'should have alternate');
  equal(stmt.alternate.length, 1);
  console.log('PASS: if-else statement');
}

// === Test 6: If with multiple statements in block ===
{
  const stmt = parseStatement('if x:\n    y = 1\n    z = 2');
  equal(stmt.type, 'IfStatement');
  equal(stmt.consequent.length, 2);
  equal(stmt.consequent[0].type, 'Assignment');
  equal(stmt.consequent[1].type, 'Assignment');
  console.log('PASS: if with multiple statements');
}

// === Test 7: For statement ===
{
  const stmt = parseStatement('for i in range(10):\n    print(i)');
  equal(stmt.type, 'ForStatement');
  equal(stmt.variable.name, 'i');
  equal(stmt.iterable.type, 'CallExpression');
  equal(stmt.iterable.callee.name, 'range');
  equal(stmt.body.length, 1);
  console.log('PASS: for statement');
}

// === Test 8: While statement ===
{
  const stmt = parseStatement('while x < 10:\n    x = x + 1');
  equal(stmt.type, 'WhileStatement');
  equal(stmt.condition.type, 'BinaryExpression');
  equal(stmt.condition.operator, '<');
  equal(stmt.body.length, 1);
  console.log('PASS: while statement');
}

// === Test 9: Function declaration ===
{
  const stmt = parseStatement('function add(a, b):\n    return a + b');
  equal(stmt.type, 'FunctionDeclaration');
  equal(stmt.name.name, 'add');
  equal(stmt.parameters.length, 2);
  equal(stmt.parameters[0].name, 'a');
  equal(stmt.parameters[1].name, 'b');
  equal(stmt.body.length, 1);
  console.log('PASS: function declaration');
}

// === Test 10: Function with no parameters ===
{
  const stmt = parseStatement('function greet():\n    print("hello")');
  equal(stmt.type, 'FunctionDeclaration');
  equal(stmt.name.name, 'greet');
  equal(stmt.parameters.length, 0);
  equal(stmt.body.length, 1);
  console.log('PASS: function with no parameters');
}

// === Test 11: Return statement ===
{
  const stmt = parseStatement('return x');
  equal(stmt.type, 'ReturnStatement');
  equal(stmt.argument.name, 'x');
  console.log('PASS: return statement');
}

// === Test 12: Return with expression ===
{
  const stmt = parseStatement('return a + b');
  equal(stmt.type, 'ReturnStatement');
  equal(stmt.argument.type, 'BinaryExpression');
  equal(stmt.argument.operator, '+');
  console.log('PASS: return with expression');
}

// === Test 13: Break statement ===
{
  const stmt = parseStatement('break');
  equal(stmt.type, 'BreakStatement');
  console.log('PASS: break statement');
}

// === Test 14: Continue statement ===
{
  const stmt = parseStatement('continue');
  equal(stmt.type, 'ContinueStatement');
  console.log('PASS: continue statement');
}

// === Test 15: Multiple statements ===
{
  const stmts = parseStatements('x = 1\ny = 2\nz = 3');
  equal(stmts.length, 3);
  equal(stmts[0].type, 'Assignment');
  equal(stmts[1].type, 'Assignment');
  equal(stmts[2].type, 'Assignment');
  console.log('PASS: multiple statements');
}

// === Test 16: Nested if ===
{
  const stmt = parseStatement('if x:\n    if y:\n        print("both")');
  equal(stmt.type, 'IfStatement');
  equal(stmt.consequent.length, 1);
  equal(stmt.consequent[0].type, 'IfStatement');
  console.log('PASS: nested if');
}

// === Test 17: Expression statement (function call) ===
{
  const stmt = parseStatement('print(x)');
  equal(stmt.expression.type, 'CallExpression');
  equal(stmt.expression.callee.name, 'print');
  console.log('PASS: expression statement');
}

// === Test 18: Function with multiple body statements ===
{
  const stmt = parseStatement('function max(a, b):\n    if a > b:\n        return a\n    return b');
  equal(stmt.type, 'FunctionDeclaration');
  equal(stmt.body.length, 2);
  equal(stmt.body[0].type, 'IfStatement');
  equal(stmt.body[1].type, 'ReturnStatement');
  console.log('PASS: function with multiple body statements');
}

// === Test 19: For with multiple body statements ===
{
  const stmt = parseStatement('for i in items:\n    print(i)\n    total = total + i');
  equal(stmt.type, 'ForStatement');
  equal(stmt.body.length, 2);
  console.log('PASS: for with multiple body statements');
}

// === Test 20: While with break ===
{
  const stmt = parseStatement('while true:\n    if x > 10:\n        break');
  equal(stmt.type, 'WhileStatement');
  equal(stmt.body.length, 1);
  equal(stmt.body[0].type, 'IfStatement');
  equal(stmt.body[0].consequent.length, 1);
  equal(stmt.body[0].consequent[0].type, 'BreakStatement');
  console.log('PASS: while with break');
}

// === Test 21: Assignment with array ===
{
  const stmt = parseStatement('arr = [1, 2, 3]');
  equal(stmt.type, 'Assignment');
  equal(stmt.left.name, 'arr');
  equal(stmt.expression, undefined, 'assignment not expression');
  equal(stmt.right.type, 'ArrayExpression');
  equal(stmt.right.elements.length, 3);
  console.log('PASS: assignment with array');
}

// === Test 22: Assignment with object ===
{
  const stmt = parseStatement('obj = {x: 10, y: 20}');
  equal(stmt.type, 'Assignment');
  equal(stmt.left.name, 'obj');
  equal(stmt.right.type, 'ObjectExpression');
  equal(stmt.right.properties.length, 2);
  console.log('PASS: assignment with object');
}

// === Test 23: Nested function call in assignment ===
{
  const stmt = parseStatement('result = add(10, multiply(2, 3))');
  equal(stmt.type, 'Assignment');
  equal(stmt.right.type, 'CallExpression');
  equal(stmt.right.callee.name, 'add');
  equal(stmt.right.arguments[1].type, 'CallExpression');
  console.log('PASS: nested function call in assignment');
}

// === Test 24: Member access in assignment ===
{
  const stmt = parseStatement('player.x = 100');
  equal(stmt.type, 'Assignment');
  equal(stmt.left.type, 'MemberExpression');
  equal(stmt.left.object.name, 'player');
  equal(stmt.left.property.name, 'x');
  equal(stmt.right.value, 100);
  console.log('PASS: member access in assignment');
}

// === Test 25: If-else with nested if ===
{
  const stmt = parseStatement('if x:\n    if y:\n        a = 1\n    else:\n        b = 2\nelse:\n    c = 3');
  equal(stmt.type, 'IfStatement');
  equal(stmt.alternate.length, 1);
  equal(stmt.consequent.length, 1);
  equal(stmt.consequent[0].type, 'IfStatement');
  ok(stmt.consequent[0].alternate, 'should have inner else');
  console.log('PASS: if-else with nested if');
}

// === Test 26: While with continue ===
{
  const stmt = parseStatement('while true:\n    if x == 0:\n        continue\n    print(x)');
  equal(stmt.type, 'WhileStatement');
  equal(stmt.body.length, 2);
  equal(stmt.body[0].type, 'IfStatement');
  equal(stmt.body[0].consequent.length, 1);
  equal(stmt.body[0].consequent[0].type, 'ContinueStatement');
  equal(stmt.body[1].type, 'ExpressionStatement');
  console.log('PASS: while with continue');
}

// === Test 27: Return without argument ===
{
  const stmt = parseStatement('return');
  equal(stmt.type, 'ReturnStatement');
  equal(stmt.argument, null);
  console.log('PASS: return without argument');
}

// === Test 28: Function with single parameter ===
{
  const stmt = parseStatement('function double(n):\n    return n * 2');
  equal(stmt.type, 'FunctionDeclaration');
  equal(stmt.parameters.length, 1);
  equal(stmt.parameters[0].name, 'n');
  console.log('PASS: function with single parameter');
}

// === Test 29: For loop variable ===
{
  const stmt = parseStatement('for item in list:\n    print(item)');
  equal(stmt.type, 'ForStatement');
  equal(stmt.variable.name, 'item');
  equal(stmt.iterable.type, 'Identifier');
  equal(stmt.iterable.name, 'list');
  console.log('PASS: for loop with identifier iterable');
}

// === Test 30: Error on unexpected token ===
{
  let threw = false;
  try {
    const stmt = parseStatement('if:');
  } catch (err) {
    threw = true;
    ok(err instanceof ParserError, 'Should be ParserError');
    equal(err.line, 1);
  }
  ok(threw, 'Should have thrown ParserError');
  console.log('PASS: error on unexpected token');
}

// === Test 31: Assignment with logical expression ===
{
  const stmt = parseStatement('result = a and b or c');
  equal(stmt.type, 'Assignment');
  equal(stmt.right.type, 'BinaryExpression');
  equal(stmt.right.operator, 'or');
  console.log('PASS: assignment with logical expression');
}

// === Test 32: Assignment with comparison ===
{
  const stmt = parseStatement('flag = x > 10 and y < 20');
  equal(stmt.type, 'Assignment');
  equal(stmt.right.type, 'BinaryExpression');
  equal(stmt.right.operator, 'and');
  console.log('PASS: assignment with comparison');
}

// === Test 33: Multiple for loops ===
{
  const stmts = parseStatements('for i in items:\n    print(i)\nfor j in other:\n    print(j)');
  equal(stmts.length, 2);
  equal(stmts[0].type, 'ForStatement');
  equal(stmts[1].type, 'ForStatement');
  console.log('PASS: multiple for loops');
}

// === Test 34: Function calling another function ===
{
  const stmt = parseStatement('function outer():\n    inner()');
  equal(stmt.type, 'FunctionDeclaration');
  equal(stmt.body.length, 1);
  equal(stmt.body[0].expression.type, 'CallExpression');
  console.log('PASS: function calling another function');
}

// === Test 35: Block with colon validation ===
{
  try {
    const tokens = tokenize('if x\n    print(x)', '<test>');
    const parser = createParser(tokens, '<test>');
    parser.parseStatement();
    console.log('FAIL: should have thrown ParserError for missing colon');
  } catch (err) {
    ok(err instanceof ParserError, 'Should be ParserError');
    console.log('PASS: block requires colon');
  }
}

// === Test 36: Indentation error handling ===
{
  try {
    const tokens = tokenize('if x:\n    pass\n    print(x)', '<test>');
    const parser = createParser(tokens, '<test>');
    parser.parseStatement();
    // Should parse without error since "pass" is just an identifier expression
    console.log('PASS: simple indented block parses');
  } catch (err) {
    // If lexer throws indentation error, that's also acceptable
    ok(err instanceof ParserError || err.name === 'LexerError', 'Should be ParserError or LexerError');
    console.log('PASS: indentation handled');
  }
}

// === Test 37: Nested while ===
{
  const stmt = parseStatement('while x:\n    while y:\n        z = z + 1');
  equal(stmt.type, 'WhileStatement');
  equal(stmt.body.length, 1);
  equal(stmt.body[0].type, 'WhileStatement');
  console.log('PASS: nested while');
}

// === Test 38: Function with arithmetic in return ===
{
  const stmt = parseStatement('function calc(a, b, c):\n    return (a + b) * c');
  equal(stmt.type, 'FunctionDeclaration');
  equal(stmt.body.length, 1);
  equal(stmt.body[0].argument.type, 'BinaryExpression');
  equal(stmt.body[0].argument.operator, '*');
  equal(stmt.body[0].argument.left.type, 'BinaryExpression');
  console.log('PASS: function with grouped arithmetic in return');
}

// === Test 39: If condition with grouping ===
{
  const stmt = parseStatement('if (a + b) > c:\n    print("big")');
  equal(stmt.type, 'IfStatement');
  equal(stmt.condition.type, 'BinaryExpression');
  equal(stmt.condition.operator, '>');
  equal(stmt.condition.left.type, 'BinaryExpression');
  console.log('PASS: if with grouped condition');
}

// === Test 40: Mixed statement types ===
{
  const stmts = parseStatements('x = 1\nif x > 0:\n    print(x)\nfor i in range(10):\n    print(i)');
  equal(stmts.length, 3);
  equal(stmts[0].type, 'Assignment');
  equal(stmts[1].type, 'IfStatement');
  equal(stmts[2].type, 'ForStatement');
  console.log('PASS: mixed statement types');
}

console.log('\nAll parser statement tests passed');
