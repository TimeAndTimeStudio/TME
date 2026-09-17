'use strict';

const {
  Location,
  Program,
  NumberLiteral,
  StringLiteral,
  BooleanLiteral,
  NullLiteral,
  Identifier,
  ArrayExpression,
  ObjectExpression,
  Property,
  UnaryExpression,
  BinaryExpression,
  CallExpression,
  MemberExpression,
  Assignment,
  IfStatement,
  WhileStatement,
  ForStatement,
  FunctionDeclaration,
  ReturnStatement,
  BreakStatement,
  ContinueStatement,
} = require('../../src/ast');

const { strictEqual: equal, ok, deepEqual } = require('assert');

// === Location ===
{
  const loc = new Location(1, 0, 1, 10);
  equal(loc.line, 1);
  equal(loc.column, 0);
  equal(loc.endLine, 1);
  equal(loc.endColumn, 10);
  console.log('PASS: Location');
}

// === Program ===
{
  const loc = new Location(1, 0, 3, 0);
  const body = [
    NumberLiteral(10, new Location(1, 0, 1, 2)),
    StringLiteral('hello', new Location(2, 0, 2, 7)),
  ];
  const program = Program(body, loc);
  equal(program.type, 'Program');
  equal(program.body.length, 2);
  equal(program.body[0].type, 'NumberLiteral');
  equal(program.body[1].type, 'StringLiteral');
  equal(program.location, loc);
  console.log('PASS: Program');
}

// === NumberLiteral ===
{
  const loc = new Location(1, 0, 1, 2);
  const node = NumberLiteral(42, loc);
  equal(node.type, 'NumberLiteral');
  equal(node.value, 42);
  equal(node.location, loc);
  console.log('PASS: NumberLiteral');
}

// === StringLiteral ===
{
  const loc = new Location(1, 0, 1, 7);
  const node = StringLiteral('hello', loc);
  equal(node.type, 'StringLiteral');
  equal(node.value, 'hello');
  equal(node.location, loc);
  console.log('PASS: StringLiteral');
}

// === BooleanLiteral ===
{
  const loc = new Location(1, 0, 1, 4);
  const trueNode = BooleanLiteral(true, loc);
  equal(trueNode.type, 'BooleanLiteral');
  equal(trueNode.value, true);

  const falseLoc = new Location(1, 5, 1, 9);
  const falseNode = BooleanLiteral(false, falseLoc);
  equal(falseNode.type, 'BooleanLiteral');
  equal(falseNode.value, false);
  console.log('PASS: BooleanLiteral');
}

// === NullLiteral ===
{
  const loc = new Location(1, 0, 1, 4);
  const node = NullLiteral(loc);
  equal(node.type, 'NullLiteral');
  equal(node.location, loc);
  console.log('PASS: NullLiteral');
}

// === Identifier ===
{
  const loc = new Location(1, 0, 1, 5);
  const node = Identifier('player', loc);
  equal(node.type, 'Identifier');
  equal(node.name, 'player');
  equal(node.location, loc);
  console.log('PASS: Identifier');
}

// === ArrayExpression ===
{
  const loc = new Location(1, 0, 1, 15);
  const elements = [
    NumberLiteral(10, new Location(1, 1, 1, 3)),
    NumberLiteral(20, new Location(1, 4, 1, 6)),
    NumberLiteral(30, new Location(1, 7, 1, 9)),
  ];
  const node = ArrayExpression(elements, loc);
  equal(node.type, 'ArrayExpression');
  equal(node.elements.length, 3);
  equal(node.elements[0].value, 10);
  equal(node.elements[1].value, 20);
  equal(node.elements[2].value, 30);
  equal(node.location, loc);
  console.log('PASS: ArrayExpression');
}

// === ObjectExpression ===
{
  const loc = new Location(1, 0, 1, 25);
  const key = Identifier('x', new Location(1, 1, 1, 2));
  const val1 = NumberLiteral(100, new Location(1, 4, 1, 7));
  const key2 = Identifier('y', new Location(1, 9, 1, 10));
  const val2 = NumberLiteral(200, new Location(1, 12, 1, 15));
  const properties = [
    Property(key, val1, new Location(1, 1, 1, 7)),
    Property(key2, val2, new Location(1, 9, 1, 15)),
  ];
  const node = ObjectExpression(properties, loc);
  equal(node.type, 'ObjectExpression');
  equal(node.properties.length, 2);
  equal(node.properties[0].key.name, 'x');
  equal(node.properties[0].value.value, 100);
  equal(node.properties[1].key.name, 'y');
  equal(node.properties[1].value.value, 200);
  console.log('PASS: ObjectExpression');
}

// === Property ===
{
  const loc = new Location(1, 0, 1, 10);
  const key = Identifier('name', loc);
  const value = StringLiteral('test', loc);
  const prop = Property(key, value, loc);
  equal(prop.type, 'Property');
  equal(prop.key.name, 'name');
  equal(prop.value.value, 'test');
  console.log('PASS: Property');
}

// === UnaryExpression ===
{
  const loc = new Location(1, 0, 1, 5);
  const operand = NumberLiteral(10, new Location(1, 1, 1, 3));
  const node = UnaryExpression('not', operand, loc);
  equal(node.type, 'UnaryExpression');
  equal(node.operator, 'not');
  equal(node.argument.type, 'NumberLiteral');
  equal(node.argument.value, 10);
  console.log('PASS: UnaryExpression');
}

// === BinaryExpression ===
{
  const loc = new Location(1, 0, 1, 11);
  const left = NumberLiteral(10, new Location(1, 0, 1, 2));
  const right = NumberLiteral(20, new Location(1, 6, 1, 8));
  const node = BinaryExpression('+', left, right, loc);
  equal(node.type, 'BinaryExpression');
  equal(node.operator, '+');
  equal(node.left.type, 'NumberLiteral');
  equal(node.left.value, 10);
  equal(node.right.type, 'NumberLiteral');
  equal(node.right.value, 20);
  console.log('PASS: BinaryExpression');
}

// === CallExpression ===
{
  const loc = new Location(1, 0, 1, 14);
  const callee = Identifier('print', new Location(1, 0, 1, 5));
  const arg = Identifier('x', new Location(1, 6, 1, 7));
  const node = CallExpression(callee, [arg], loc);
  equal(node.type, 'CallExpression');
  equal(node.callee.name, 'print');
  equal(node.arguments.length, 1);
  equal(node.arguments[0].name, 'x');
  console.log('PASS: CallExpression');
}

// === MemberExpression ===
{
  const loc = new Location(1, 0, 1, 12);
  const object = Identifier('player', new Location(1, 0, 1, 6));
  const property = Identifier('x', new Location(1, 7, 1, 8));
  const node = MemberExpression(object, property, loc);
  equal(node.type, 'MemberExpression');
  equal(node.object.name, 'player');
  equal(node.property.name, 'x');
  console.log('PASS: MemberExpression');
}

// === Assignment ===
{
  const loc = new Location(1, 0, 1, 12);
  const left = Identifier('x', new Location(1, 0, 1, 1));
  const right = NumberLiteral(10, new Location(1, 4, 1, 6));
  const node = Assignment(left, right, loc);
  equal(node.type, 'Assignment');
  equal(node.left.name, 'x');
  equal(node.right.type, 'NumberLiteral');
  equal(node.right.value, 10);
  console.log('PASS: Assignment');
}

// === IfStatement ===
{
  const loc = new Location(1, 0, 3, 0);
  const condition = BinaryExpression('>', Identifier('x', new Location(1, 3, 1, 4)), NumberLiteral(10, new Location(1, 7, 1, 9)), new Location(1, 3, 1, 9));
  const consequent = [CallExpression(Identifier('print', new Location(2, 4, 2, 9)), [Identifier('x', new Location(2, 10, 2, 11))], new Location(2, 4, 2, 11))];
  const alternate = [CallExpression(Identifier('print', new Location(4, 4, 4, 9)), [StringLiteral('else', new Location(4, 10, 4, 16))], new Location(4, 4, 4, 16))];
  const node = IfStatement(condition, consequent, alternate, loc);
  equal(node.type, 'IfStatement');
  equal(node.condition.type, 'BinaryExpression');
  equal(node.consequent.length, 1);
  equal(node.alternate.length, 1);
  console.log('PASS: IfStatement');
}

// === WhileStatement ===
{
  const loc = new Location(1, 0, 3, 0);
  const condition = BinaryExpression('>', Identifier('i', new Location(1, 6, 1, 7)), NumberLiteral(0, new Location(1, 9, 1, 10)), new Location(1, 6, 1, 10));
  const body = [Assignment(Identifier('i', new Location(2, 4, 2, 5)), BinaryExpression('-', Identifier('i', new Location(2, 8, 2, 9)), NumberLiteral(1, new Location(2, 11, 2, 12)), new Location(2, 8, 2, 12)), new Location(2, 4, 2, 12))];
  const node = WhileStatement(condition, body, loc);
  equal(node.type, 'WhileStatement');
  equal(node.condition.type, 'BinaryExpression');
  equal(node.body.length, 1);
  console.log('PASS: WhileStatement');
}

// === ForStatement ===
{
  const loc = new Location(1, 0, 3, 0);
  const variable = Identifier('i', new Location(1, 4, 1, 5));
  const iterable = CallExpression(Identifier('range', new Location(1, 9, 1, 14)), [NumberLiteral(10, new Location(1, 10, 1, 12)),], new Location(1, 9, 1, 14));
  const body = [CallExpression(Identifier('print', new Location(2, 4, 2, 9)), [Identifier('i', new Location(2, 10, 2, 11))], new Location(2, 4, 2, 11))];
  const node = ForStatement(variable, iterable, body, loc);
  equal(node.type, 'ForStatement');
  equal(node.variable.name, 'i');
  equal(node.iterable.type, 'CallExpression');
  equal(node.iterable.callee.name, 'range');
  equal(node.body.length, 1);
  console.log('PASS: ForStatement');
}

// === FunctionDeclaration ===
{
  const loc = new Location(1, 0, 3, 0);
  const name = Identifier('add', new Location(1, 9, 1, 12));
  const params = [
    Identifier('a', new Location(1, 13, 1, 14)),
    Identifier('b', new Location(1, 16, 1, 17)),
  ];
  const body = [
    ReturnStatement(
      BinaryExpression('+', Identifier('a', new Location(2, 4, 2, 5)), Identifier('b', new Location(2, 8, 2, 9)), new Location(2, 4, 2, 9)),
      new Location(2, 4, 2, 13)
    ),
  ];
  const node = FunctionDeclaration(name, params, body, loc);
  equal(node.type, 'FunctionDeclaration');
  equal(node.name.name, 'add');
  equal(node.parameters.length, 2);
  equal(node.body.length, 1);
  console.log('PASS: FunctionDeclaration');
}

// === ReturnStatement ===
{
  const loc = new Location(1, 0, 1, 13);
  const node = ReturnStatement(NumberLiteral(42, new Location(1, 7, 1, 9)), loc);
  equal(node.type, 'ReturnStatement');
  equal(node.argument.type, 'NumberLiteral');
  equal(node.argument.value, 42);
  console.log('PASS: ReturnStatement');
}

// === ReturnStatement (no argument) ===
{
  const loc = new Location(1, 0, 1, 6);
  const node = ReturnStatement(null, loc);
  equal(node.type, 'ReturnStatement');
  equal(node.argument, null);
  console.log('PASS: ReturnStatement (no argument)');
}

// === BreakStatement ===
{
  const loc = new Location(2, 4, 2, 9);
  const node = BreakStatement(loc);
  equal(node.type, 'BreakStatement');
  equal(node.location, loc);
  console.log('PASS: BreakStatement');
}

// === ContinueStatement ===
{
  const loc = new Location(2, 4, 2, 12);
  const node = ContinueStatement(loc);
  equal(node.type, 'ContinueStatement');
  equal(node.location, loc);
  console.log('PASS: ContinueStatement');
}

// === All nodes have location ===
{
  const loc = new Location(1, 0, 1, 10);
  const nodes = [
    NumberLiteral(1, loc),
    StringLiteral('a', loc),
    BooleanLiteral(true, loc),
    NullLiteral(loc),
    Identifier('x', loc),
    ArrayExpression([], loc),
    ObjectExpression([], loc),
    Property(Identifier('k', loc), Identifier('v', loc), loc),
    UnaryExpression('not', Identifier('x', loc), loc),
    BinaryExpression('+', Identifier('a', loc), Identifier('b', loc), loc),
    CallExpression(Identifier('f', loc), [], loc),
    MemberExpression(Identifier('o', loc), Identifier('p', loc), loc),
    Assignment(Identifier('x', loc), NumberLiteral(1, loc), loc),
    IfStatement(
      Identifier('c', loc),
      [],
      null,
      loc
    ),
    WhileStatement(Identifier('c', loc), [], loc),
    ForStatement(Identifier('i', loc), Identifier('it', loc), [], loc),
    FunctionDeclaration(Identifier('f', loc), [], [], loc),
    ReturnStatement(null, loc),
    BreakStatement(loc),
    ContinueStatement(loc),
  ];
  for (const node of nodes) {
    ok(node.type, `Node type should exist: ${node.type || '(unknown)'}`);
    ok(node.location, `Node should have location: ${node.type}`);
    ok(node.location.line !== undefined, `Node should have line: ${node.type}`);
    ok(node.location.column !== undefined, `Node should have column: ${node.type}`);
  }
  console.log('PASS: All nodes have location');
}

// === AST structure consistency ===
{
  const program = Program([
    Assignment(Identifier('x', new Location(1, 0, 1, 1)), NumberLiteral(10, new Location(1, 4, 1, 6)), new Location(1, 0, 1, 6)),
    IfStatement(
      BinaryExpression('>', Identifier('x', new Location(3, 3, 3, 4)), NumberLiteral(5, new Location(3, 7, 3, 8)), new Location(3, 3, 3, 8)),
      [CallExpression(Identifier('print', new Location(4, 4, 4, 9)), [StringLiteral('big', new Location(4, 10, 4, 15))], new Location(4, 4, 4, 15))],
      null,
      new Location(3, 0, 5, 0)
    ),
  ], new Location(1, 0, 6, 0));

  equal(program.type, 'Program');
  equal(program.body.length, 2);
  equal(program.body[0].type, 'Assignment');
  equal(program.body[1].type, 'IfStatement');
  console.log('PASS: AST structure consistency');
}

console.log('\nAll AST tests passed');
