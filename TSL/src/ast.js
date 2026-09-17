'use strict';

// AST Node base
class ASTNode {
  constructor(type, location) {
    this.type = type;
    this.location = location;
  }
}

// Source location
function Location(line, column, endLine, endColumn) {
  this.line = line;
  this.column = column;
  this.endLine = endLine;
  this.endColumn = endColumn;
}

// Program
function Program(body, location) {
  const node = new ASTNode('Program', location);
  node.body = body;
  return node;
}

// Literals
function NumberLiteral(value, location) {
  const node = new ASTNode('NumberLiteral', location);
  node.value = value;
  return node;
}

function StringLiteral(value, location) {
  const node = new ASTNode('StringLiteral', location);
  node.value = value;
  return node;
}

function BooleanLiteral(value, location) {
  const node = new ASTNode('BooleanLiteral', location);
  node.value = value;
  return node;
}

function NullLiteral(location) {
  const node = new ASTNode('NullLiteral', location);
  return node;
}

// Identifier
function Identifier(name, location) {
  const node = new ASTNode('Identifier', location);
  node.name = name;
  return node;
}

// Expressions
function ArrayExpression(elements, location) {
  const node = new ASTNode('ArrayExpression', location);
  node.elements = elements;
  return node;
}

function ObjectExpression(properties, location) {
  const node = new ASTNode('ObjectExpression', location);
  node.properties = properties;
  return node;
}

function Property(key, value, location) {
  const node = new ASTNode('Property', location);
  node.key = key;
  node.value = value;
  return node;
}

function UnaryExpression(operator, argument, location) {
  const node = new ASTNode('UnaryExpression', location);
  node.operator = operator;
  node.argument = argument;
  return node;
}

function BinaryExpression(operator, left, right, location) {
  const node = new ASTNode('BinaryExpression', location);
  node.operator = operator;
  node.left = left;
  node.right = right;
  return node;
}

function CallExpression(callee, argumentsList, location) {
  const node = new ASTNode('CallExpression', location);
  node.callee = callee;
  node.arguments = argumentsList;
  return node;
}

function MemberExpression(object, property, location) {
  const node = new ASTNode('MemberExpression', location);
  node.object = object;
  node.property = property;
  return node;
}

function ArrayAccess(object, index, location) {
  const node = new ASTNode('ArrayAccess', location);
  node.object = object;
  node.index = index;
  return node;
}

// Statements
function Assignment(left, right, location) {
  const node = new ASTNode('Assignment', location);
  node.left = left;
  node.right = right;
  return node;
}

function IfStatement(condition, consequent, alternate, location) {
  const node = new ASTNode('IfStatement', location);
  node.condition = condition;
  node.consequent = consequent;
  node.alternate = alternate;
  return node;
}

function WhileStatement(condition, body, location) {
  const node = new ASTNode('WhileStatement', location);
  node.condition = condition;
  node.body = body;
  return node;
}

function ForStatement(variable, iterable, body, location) {
  const node = new ASTNode('ForStatement', location);
  node.variable = variable;
  node.iterable = iterable;
  node.body = body;
  return node;
}

function FunctionDeclaration(name, parameters, body, location) {
  const node = new ASTNode('FunctionDeclaration', location);
  node.name = name;
  node.parameters = parameters;
  node.body = body;
  return node;
}

function ReturnStatement(argument, location) {
  const node = new ASTNode('ReturnStatement', location);
  node.argument = argument;
  return node;
}

function BreakStatement(location) {
  const node = new ASTNode('BreakStatement', location);
  return node;
}

function ContinueStatement(location) {
  const node = new ASTNode('ContinueStatement', location);
  return node;
}

module.exports = {
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
  ArrayAccess,
  Assignment,
  IfStatement,
  WhileStatement,
  ForStatement,
  FunctionDeclaration,
  ReturnStatement,
  BreakStatement,
  ContinueStatement,
};
