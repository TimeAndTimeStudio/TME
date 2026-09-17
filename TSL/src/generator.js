'use strict';

const { GeneratorError, getSourceLine } = require('./errors');

function createGenerator(source, filename = '<anonymous>') {
  let indentLevel = 0;
  let scopeStack = [];
  let inFunction = false;

  function reset() {
    indentLevel = 0;
    scopeStack = [new Set()];
    inFunction = false;
  }

  function pushScope() {
    scopeStack.push(new Set());
    indentLevel++;
  }

  function popScope() {
    scopeStack.pop();
    indentLevel--;
  }

  function declareVar(name) {
    scopeStack[scopeStack.length - 1].add(name);
  }

  function isDeclared(name) {
    for (let i = scopeStack.length - 1; i >= 0; i--) {
      if (scopeStack[i].has(name)) {
        return true;
      }
    }
    return false;
  }

  function indent() {
    return '  '.repeat(indentLevel);
  }

  function generateNode(node) {
    if (!node || !node.type) {
      return '';
    }

    const generator = {
      Program: generateProgram,
      NumberLiteral: generateNumberLiteral,
      StringLiteral: generateStringLiteral,
      BooleanLiteral: generateBooleanLiteral,
      NullLiteral: generateNullLiteral,
      Identifier: generateIdentifier,
      BinaryExpression: generateBinaryExpression,
      UnaryExpression: generateUnaryExpression,
      CallExpression: generateCallExpression,
      ArrayExpression: generateArrayExpression,
      ObjectExpression: generateObjectExpression,
      Property: generateProperty,
      MemberExpression: generateMemberExpression,
      ArrayAccess: generateArrayAccess,
      Assignment: generateAssignment,
      IfStatement: generateIfStatement,
      WhileStatement: generateWhileStatement,
      ForStatement: generateForStatement,
      FunctionDeclaration: generateFunctionDeclaration,
      ReturnStatement: generateReturnStatement,
      BreakStatement: generateBreakStatement,
      ContinueStatement: generateContinueStatement,
      Pass: generatePass,
      ExpressionStatement: generateExpressionStatement,
    };

    const gen = generator[node.type];
    if (!gen) {
      const loc = node.location || {};
      const sourceLine = getSourceLine(source, loc.line);
      throw new GeneratorError(
        `Unknown node type: ${node.type}`,
        filename,
        loc.line,
        loc.column,
        sourceLine
      );
    }

    return gen(node);
  }

  function generateProgram(node) {
    reset();
    const lines = [];
    for (const stmt of node.body) {
      const code = generateStatement(stmt);
      if (code) lines.push(code);
    }
    return lines.join('\n') + '\n';
  }

  function generateStatement(stmt) {
    if (!stmt || !stmt.type) return '';
    if (stmt.type === 'ExpressionStatement') {
      return generateExpressionStatement(stmt);
    }
    const code = generateNode(stmt);
    return code;
  }

  // === Literals ===

  function generateNumberLiteral(node) {
    return String(node.value);
  }

  function generateStringLiteral(node) {
    return JSON.stringify(node.value);
  }

  function generateBooleanLiteral(node) {
    return node.value ? 'true' : 'false';
  }

  function generateNullLiteral() {
    return 'null';
  }

  // === Identifier ===

  function generateIdentifier(node) {
    return node.name;
  }

  // === Member Expression ===

  function generateMemberExpression(node) {
    const obj = generateNode(node.object);
    const prop = generateNode(node.property);
    return `${obj}.${prop}`;
  }

  // === Array Access ===

  function generateArrayAccess(node) {
    const obj = generateNode(node.object);
    const idx = generateNode(node.index);
    return `${obj}[${idx}]`;
  }

  // === Binary Expression ===

  function generateBinaryExpression(node) {
    const left = generateNode(node.left);
    const right = generateNode(node.right);
    let op = node.operator;
    if (op === 'and') op = '&&';
    if (op === 'or') op = '||';
    return `(${left} ${op} ${right})`;
  }

  // === Unary Expression ===

  function generateUnaryExpression(node) {
    const arg = generateNode(node.argument);
    return `(${node.operator} ${arg})`;
  }

  // === Call Expression ===

  function generateCallExpression(node) {
    const callee = generateNode(node.callee);
    const args = node.arguments.map(arg => generateNode(arg)).join(', ');
    return `${callee}(${args})`;
  }

  // === Array Expression ===

  function generateArrayExpression(node) {
    const elements = node.elements.map(el => generateNode(el));
    return `[${elements.join(', ')}]`;
  }

  // === Object Expression ===

  function generateObjectExpression(node) {
    const props = node.properties.map(prop => generateNode(prop));
    return `{ ${props.join(', ')} }`;
  }

  function generateProperty(node) {
    const key = generateNode(node.key);
    const value = generateNode(node.value);
    return `${key}: ${value}`;
  }

  // === Assignment ===

  function generateAssignment(node) {
    const left = generateNode(node.left);
    const right = generateNode(node.right);

    // Determine if this is a member access assignment (e.g., player.x = 100)
    if (node.left.type === 'MemberExpression') {
      return `${indent()}${left} = ${right};`;
    }

    // Determine if this is an array access assignment (e.g., arr[0] = 10)
    if (node.left.type === 'ArrayAccess') {
      return `${indent()}${left} = ${right};`;
    }

    // Check if variable was already declared in any scope
    const varName = node.left.name;
    const isDeclaration = !isDeclared(varName);

    if (isDeclaration) {
      declareVar(varName);
      return `${indent()}let ${left} = ${right};`;
    }

    return `${indent()}${left} = ${right};`;
  }

  // === If Statement ===

  function generateIfStatement(node) {
    const condition = generateNode(node.condition);
    const lines = [];

    lines.push(`${indent()}if (${condition}) {`);
    pushScope();
    for (const stmt of node.consequent) {
      lines.push(generateStatement(stmt));
    }
    popScope();

    if (node.alternate) {
      lines.push(`${indent()}} else {`);
      pushScope();
      for (const stmt of node.alternate) {
        lines.push(generateStatement(stmt));
      }
      popScope();
      lines.push(`${indent()}}`);
    } else {
      lines.push(`${indent()}}`);
    }

    return lines.join('\n');
  }

  // === While Statement ===

  function generateWhileStatement(node) {
    const condition = generateNode(node.condition);
    const lines = [];

    lines.push(`${indent()}while (${condition}) {`);
    pushScope();
    for (const stmt of node.body) {
      lines.push(generateStatement(stmt));
    }
    popScope();

    lines.push(`${indent()}}`);

    return lines.join('\n');
  }

  // === For Statement ===

  function generateForStatement(node) {
    const variable = generateNode(node.variable);
    const iterable = generateNode(node.iterable);
    const lines = [];

    lines.push(`${indent()}for (let ${variable} of ${iterable}) {`);
    pushScope();
    for (const stmt of node.body) {
      lines.push(generateStatement(stmt));
    }
    popScope();

    lines.push(`${indent()}}`);

    return lines.join('\n');
  }

  // === Function Declaration ===

  function generateFunctionDeclaration(node) {
    const params = node.parameters.map(p => p.name).join(', ');
    const lines = [];

    lines.push(`${indent()}function ${node.name.name}(${params}) {`);
    pushScope();

    for (const param of node.parameters) {
      declareVar(param.name);
    }

    for (const stmt of node.body) {
      lines.push(generateStatement(stmt));
    }

    popScope();

    lines.push(`${indent()}}`);

    return lines.join('\n');
  }

  // === Return Statement ===

  function generateReturnStatement(node) {
    const arg = node.argument ? generateNode(node.argument) : '';
    return `${indent()}return ${arg};`;
  }

  // === Break Statement ===

  function generateBreakStatement() {
    return `${indent()}break;`;
  }

  // === Continue Statement ===

  function generateContinueStatement() {
    return `${indent()}continue;`;
  }

  // === Pass Statement ===

  function generatePass() {
    return `${indent()}// pass`;
  }

  // === Expression Statement ===

  function generateExpressionStatement(node) {
    const expr = generateNode(node.expression);
    return `${indent()}${expr};`;
  }

  function generate(source) {
    reset();
    return generateProgram(source);
  }

  return { generate };
}

module.exports = {
  GeneratorError,
  createGenerator,
};
