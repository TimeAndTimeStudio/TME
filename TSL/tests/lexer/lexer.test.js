'use strict';

const { tokenize, TokenType, LexerError } = require('../../src/lexer');
const { strictEqual: equal, ok, deepEqual } = require('assert');

// Helper to get token types
function tokenTypes(tokens) {
  return tokens.map(t => t.type);
}

// Helper to get token values
function tokenValues(tokens) {
  return tokens.map(t => t.value);
}

// Test 1: Simple literals
{
  const tokens = tokenize('10 "hello" true false null', '<test>');
  equal(tokens[0].type, TokenType.NUMBER);
  equal(tokens[0].value, 10);
  equal(tokens[1].type, TokenType.STRING);
  equal(tokens[1].value, 'hello');
  equal(tokens[2].type, TokenType.TRUE);
  equal(tokens[3].type, TokenType.FALSE);
  equal(tokens[4].type, TokenType.NULL);
  equal(tokens[tokens.length - 1].type, TokenType.EOF);
  console.log('PASS: simple literals');
}

// Test 2: Identifiers
{
  const tokens = tokenize('x player_x _value', '<test>');
  equal(tokens[0].type, TokenType.IDENTIFIER);
  equal(tokens[0].value, 'x');
  equal(tokens[1].type, TokenType.IDENTIFIER);
  equal(tokens[1].value, 'player_x');
  equal(tokens[2].type, TokenType.IDENTIFIER);
  equal(tokens[2].value, '_value');
  console.log('PASS: identifiers');
}

// Test 3: Keywords
{
  const tokens = tokenize('if else for in while function return break continue and or not', '<test>');
  const expected = [
    TokenType.IF, TokenType.ELSE, TokenType.FOR, TokenType.IN, TokenType.WHILE,
    TokenType.FUNCTION, TokenType.RETURN, TokenType.BREAK, TokenType.CONTINUE,
    TokenType.AND, TokenType.OR, TokenType.NOT
  ];
  deepEqual(tokenTypes(tokens.slice(0, 12)), expected);
  console.log('PASS: keywords');
}

// Test 4: Arithmetic operators
{
  const tokens = tokenize('+ - * / %', '<test>');
  deepEqual(tokenTypes(tokens.slice(0, 5)), [
    TokenType.PLUS, TokenType.MINUS, TokenType.STAR, TokenType.SLASH, TokenType.PERCENT
  ]);
  console.log('PASS: arithmetic operators');
}

// Test 5: Comparison operators
{
  const tokens = tokenize('< <= > >= == !=', '<test>');
  deepEqual(tokenTypes(tokens.slice(0, 6)), [
    TokenType.LESS, TokenType.LESS_EQUAL, TokenType.GREATER, TokenType.GREATER_EQUAL,
    TokenType.EQUAL_EQUAL, TokenType.NOT_EQUAL
  ]);
  console.log('PASS: comparison operators');
}

// Test 6: Delimiters
{
  const tokens = tokenize('( ) [ ] { } , . :', '<test>');
  deepEqual(tokenTypes(tokens.slice(0, 9)), [
    TokenType.LPAREN, TokenType.RPAREN, TokenType.LBRACKET, TokenType.RBRACKET,
    TokenType.LBRACE, TokenType.RBRACE, TokenType.COMMA, TokenType.DOT, TokenType.COLON
  ]);
  console.log('PASS: delimiters');
}

// Test 7: Assignment operator
{
  const tokens = tokenize('x = 10', '<test>');
  equal(tokens[0].type, TokenType.IDENTIFIER);
  equal(tokens[1].type, TokenType.EQUAL);
  equal(tokens[2].type, TokenType.NUMBER);
  console.log('PASS: assignment operator');
}

// Test 8: Newlines
{
  const tokens = tokenize('x = 10\ny = 20', '<test>');
  const types = tokenTypes(tokens);
  ok(types.includes(TokenType.NEWLINE), 'Should contain NEWLINE');
  console.log('PASS: newlines');
}

// Test 9: Indentation
{
  const tokens = tokenize('if x:\n    print(x)', '<test>');
  const types = tokenTypes(tokens);
  ok(types.includes(TokenType.COLON), 'Should have COLON');
  ok(types.includes(TokenType.NEWLINE), 'Should have NEWLINE');
  ok(types.includes(TokenType.INDENT), 'Should have INDENT');
  ok(types.includes(TokenType.DEDENT), 'Should have DEDENT');
  console.log('PASS: indentation');
}

// Test 10: Comments
{
  const tokens = tokenize('x = 10 # this is a comment\ny = 20', '<test>');
  const types = tokenTypes(tokens);
  ok(!types.includes('#'), 'Comment should not be a token');
  equal(types.filter(t => t === TokenType.IDENTIFIER).length, 2);
  console.log('PASS: comments');
}

// Test 11: String with escape sequences
{
  const tokens = tokenize('"hello\\nworld"', '<test>');
  equal(tokens[0].type, TokenType.STRING);
  equal(tokens[0].value, 'hello\nworld');
  console.log('PASS: string escape sequences');
}

// Test 12: Float numbers
{
  const tokens = tokenize('3.14 0.5', '<test>');
  equal(tokens[0].type, TokenType.NUMBER);
  equal(tokens[0].value, 3.14);
  equal(tokens[1].type, TokenType.NUMBER);
  equal(tokens[1].value, 0.5);
  console.log('PASS: float numbers');
}

// Test 13: Error on unexpected character
{
  try {
    tokenize('@invalid', '<test>');
    console.log('FAIL: should have thrown LexerError');
  } catch (err) {
    ok(err instanceof LexerError, 'Should be LexerError');
    equal(err.line, 1);
    equal(err.column, 1);
    console.log('PASS: unexpected character error');
  }
}

// Test 14: Line and column tracking
{
  const tokens = tokenize('x\n  y', '<test>');
  equal(tokens[0].line, 1);
  equal(tokens[0].column, 1);
  equal(tokens[2].line, 2);
  console.log('PASS: line and column tracking');
}

// Test 15: Mixed tokens
{
  const source = 'function add(a, b):\n    return a + b';
  const tokens = tokenize(source, '<test>');
  const types = tokenTypes(tokens);
  equal(types[0], TokenType.FUNCTION);
  equal(types[1], TokenType.IDENTIFIER); // add
  equal(types[2], TokenType.LPAREN);
  equal(types[3], TokenType.IDENTIFIER); // a
  equal(types[4], TokenType.COMMA);
  equal(types[5], TokenType.IDENTIFIER); // b
  equal(types[6], TokenType.RPAREN);
  equal(types[7], TokenType.COLON);
  console.log('PASS: mixed tokens');
}

console.log('\nAll lexer tests passed');
