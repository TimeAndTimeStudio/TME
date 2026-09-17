'use strict';

const {
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
} = require('./ast');
const { TokenType } = require('./lexer');
const { ParserError, getSourceLine } = require('./errors');

const PRECEDENCE = {
  or: 1,
  and: 2,
  '==': 3,
  '!=': 3,
  '<': 3,
  '<=': 3,
  '>': 3,
  '>=': 3,
  '+': 4,
  '-': 4,
  '*': 5,
  '/': 5,
  '%': 5,
};

function createParser(tokens, source, filename = '<anonymous>') {
  let pos = 0;

  function skipStructural() {
    while (pos < tokens.length) {
      const t = tokens[pos];
      if (t.type === TokenType.NEWLINE) {
        pos++;
      } else {
        break;
      }
    }
  }

  function current() {
    skipStructural();
    if (pos < tokens.length) return tokens[pos];
    return tokens[tokens.length - 1]; // EOF
  }

  function peek() {
    return current();
  }

  function advance(expectedType) {
    const token = current();
    if (expectedType && token.type !== expectedType) {
      const sourceLine = getSourceLine(source, token.line);
      throw new ParserError(
        `Expected ${expectedType} but found ${token.type}`,
        filename,
        token.line,
        token.column,
        sourceLine
      );
    }
    if (token.type !== TokenType.EOF) {
      pos++;
    }
    return token;
  }

  function match(...types) {
    const token = current();
    if (types.includes(token.type)) {
      return advance();
    }
    return null;
  }

  function expect(type) {
    const token = current();
    if (token.type !== type) {
      const sourceLine = getSourceLine(source, token.line);
      throw new ParserError(
        `Expected ${type} but found ${token.type}`,
        filename,
        token.line,
        token.column,
        sourceLine
      );
    }
    pos++;
    return token;
  }

  // === Primary ===
  function parsePrimary() {
    const token = current();

    // Number literal
    if (token.type === TokenType.NUMBER) {
      advance();
      return NumberLiteral(token.value, makeLocation(token));
    }

    // String literal
    if (token.type === TokenType.STRING) {
      advance();
      return StringLiteral(token.value, makeLocation(token));
    }

    // Boolean
    if (token.type === TokenType.TRUE) {
      advance();
      return BooleanLiteral(true, makeLocation(token));
    }
    if (token.type === TokenType.FALSE) {
      advance();
      return BooleanLiteral(false, makeLocation(token));
    }

    // Null
    if (token.type === TokenType.NULL) {
      advance();
      return NullLiteral(makeLocation(token));
    }

    // Identifier (may be followed by call or member access)
    if (token.type === TokenType.IDENTIFIER) {
      return parsePostfix();
    }

    // Grouped expression
    if (token.type === TokenType.LPAREN) {
      advance();
      const expr = parseExpression();
      expect(TokenType.RPAREN);
      return expr;
    }

    // Array literal
    if (token.type === TokenType.LBRACKET) {
      return parseArray();
    }

    // Object literal
    if (token.type === TokenType.LBRACE) {
      return parseObject();
    }

    throw new ParserError(
      `Unexpected token: ${token.type}`,
      filename,
      token.line,
      token.column,
      getSourceLine(source, token.line)
    );
  }

  function parsePostfix() {
    let expr = parsePrimaryBase();

    while (true) {
      const token = current();

      // Member access: .identifier
      if (token.type === TokenType.DOT) {
        advance();
        const propToken = expect(TokenType.IDENTIFIER);
        const prop = Identifier(propToken.value, makeLocation(propToken));
        expr = MemberExpression(expr, prop, makeLocation(token));
        continue;
      }

      // Function call: (...)
      if (token.type === TokenType.LPAREN) {
        advance();
        const args = parseArgumentList();
        expr = CallExpression(expr, args, makeLocation(token));
        continue;
      }

      // Array access: [...]
      if (token.type === TokenType.LBRACKET) {
        advance();
        const index = parseExpression();
        expect(TokenType.RBRACKET);
        expr = ArrayAccess(expr, index, makeLocation(token));
        continue;
      }

      break;
    }

    return expr;
  }

  function parsePrimaryBase() {
    const token = current();

    if (token.type === TokenType.IDENTIFIER) {
      advance();
      return Identifier(token.value, makeLocation(token));
    }

    if (token.type === TokenType.NUMBER) {
      advance();
      return NumberLiteral(token.value, makeLocation(token));
    }

    if (token.type === TokenType.STRING) {
      advance();
      return StringLiteral(token.value, makeLocation(token));
    }

    if (token.type === TokenType.TRUE) {
      advance();
      return BooleanLiteral(true, makeLocation(token));
    }

    if (token.type === TokenType.FALSE) {
      advance();
      return BooleanLiteral(false, makeLocation(token));
    }

    if (token.type === TokenType.NULL) {
      advance();
      return NullLiteral(makeLocation(token));
    }

    if (token.type === TokenType.LBRACKET) {
      return parseArray();
    }

    if (token.type === TokenType.LBRACE) {
      return parseObject();
    }

    if (token.type === TokenType.LPAREN) {
      advance();
      const expr = parseExpression();
      expect(TokenType.RPAREN);
      return expr;
    }

    throw new ParserError(
      `Expected expression but found ${token.type}`,
      filename,
      token.line,
      token.column,
      getSourceLine(source, token.line)
    );
  }

  // === Argument list ===
  function parseArgumentList() {
    const args = [];
    while (!match(TokenType.RPAREN)) {
      if (args.length > 0) {
        expect(TokenType.COMMA);
      }
      args.push(parseExpression());
    }
    return args;
  }

  // === Array literal ===
  function parseArray() {
    const startToken = current();
    advance(); // LBRACKET
    const elements = [];

    while (!match(TokenType.RBRACKET)) {
      if (elements.length > 0) {
        expect(TokenType.COMMA);
      }
      elements.push(parseExpression());
    }

    return ArrayExpression(elements, makeLocation(startToken));
  }

  // === Object literal ===
  function parseObject() {
    const startToken = current();
    advance(); // LBRACE
    const properties = [];

    while (!match(TokenType.RBRACE)) {
      if (properties.length > 0) {
        expect(TokenType.COMMA);
      }
      const keyToken = expect(TokenType.IDENTIFIER);
      const key = Identifier(keyToken.value, makeLocation(keyToken));
      expect(TokenType.COLON);
      const value = parseExpression();
      properties.push(Property(key, value, makeLocation(keyToken)));
    }

    return ObjectExpression(properties, makeLocation(startToken));
  }

  // === Precedence climbing ===
  function parseExpression() {
    return parseBinary(0);
  }

  function getPrecedence(token) {
    if (token.type === TokenType.EOF) return 0;
    if (
      (token.type === TokenType.PLUS ||
        token.type === TokenType.MINUS ||
        token.type === TokenType.STAR ||
        token.type === TokenType.SLASH ||
        token.type === TokenType.PERCENT ||
        token.type === TokenType.EQUAL_EQUAL ||
        token.type === TokenType.NOT_EQUAL ||
        token.type === TokenType.LESS ||
        token.type === TokenType.LESS_EQUAL ||
        token.type === TokenType.GREATER ||
        token.type === TokenType.GREATER_EQUAL)
    ) {
      return PRECEDENCE[token.value] || 0;
    }
    if (token.type === TokenType.AND) return PRECEDENCE.and;
    if (token.type === TokenType.OR) return PRECEDENCE.or;
    return 0;
  }

  function getOperatorName(token) {
    if (token.type === TokenType.AND) return 'and';
    if (token.type === TokenType.OR) return 'or';
    return token.value;
  }

  function parseBinary(minPrecedence) {
    let left = parseUnary();

    while (true) {
      const token = current();
      if (token.type === TokenType.EOF) break;

      const precedence = getPrecedence(token);
      if (precedence === 0 || precedence < minPrecedence) break;

      let operator = getOperatorName(token);
      advance();
      let right = parseUnary();

      while (true) {
        const nextToken = current();
        const nextPrecedence = getPrecedence(nextToken);
        if (nextPrecedence === 0 || nextPrecedence < precedence) break;

        const nextOp = getOperatorName(nextToken);
        advance();

        if (nextPrecedence > precedence) {
          right = BinaryExpression(nextOp, right, parseBinary(nextPrecedence), makeLocation(nextToken));
        } else {
          left = BinaryExpression(operator, left, right, makeLocation(token));
          operator = nextOp;
          right = parseUnary();
        }
      }

      left = BinaryExpression(operator, left, right, makeLocation(token));
    }

    return left;
  }

  // === Unary ===
  function parseUnary() {
    const token = current();

    if (token.type === TokenType.NOT) {
      advance();
      const operand = parseUnary();
      return UnaryExpression('not', operand, makeLocation(token));
    }

    return parsePostfix();
  }

  // === Location ===
  function makeLocation(token) {
    const { Location } = require('./ast');
    return new Location(token.line, token.column, token.line, token.column + (token.value ? String(token.value).length : 0));
  }

  // === Block parsing ===
  function parseBlock() {
    const statements = [];
    const token = current();

    // Expect colon
    if (token.type !== TokenType.COLON) {
      throw new ParserError(
        `Expected ':' at start of block`,
        filename,
        token.line,
        token.column,
        getSourceLine(source, token.line)
      );
    }
    advance();

    // Expect INDENT
    const indentToken = expect(TokenType.INDENT);

    // Parse statements in block
    while (peek().type !== TokenType.DEDENT && peek().type !== TokenType.EOF) {
      statements.push(parseStatement());
    }

    // Expect DEDENT
    expect(TokenType.DEDENT);

    return statements;
  }

  // === Assignment ===
  function parseAssignment() {
    // Parse left-hand side: identifier, member access, or array access
    const nameToken = advance(TokenType.IDENTIFIER);
    let left = Identifier(nameToken.value, makeLocation(nameToken));

    // Handle member access (e.g., player.x = 100)
    while (peek().type === TokenType.DOT) {
      advance(TokenType.DOT);
      const propToken = expect(TokenType.IDENTIFIER);
      left = MemberExpression(left, Identifier(propToken.value, makeLocation(propToken)), makeLocation(propToken));
    }

    // Handle array access (e.g., arr[0] = 10)
    while (peek().type === TokenType.LBRACKET) {
      advance(TokenType.LBRACKET);
      const index = parseExpression();
      expect(TokenType.RBRACKET);
      left = ArrayAccess(left, index, makeLocation(index));
    }

    expect(TokenType.EQUAL);
    const value = parseExpression();
    return Assignment(left, value, makeLocation(nameToken));
  }

  // === If statement ===
  function parseIf() {
    const ifToken = advance(TokenType.IF);
    const condition = parseExpression();
    const consequent = parseBlock();

    let alternate = null;
    // Skip structural tokens to find else
    while (peek().type === TokenType.NEWLINE || peek().type === TokenType.INDENT || peek().type === TokenType.DEDENT) {
      if (peek().type === TokenType.NEWLINE || peek().type === TokenType.INDENT) {
        pos++;
      } else {
        break;
      }
    }

    if (peek().type === TokenType.ELSE) {
      advance(TokenType.ELSE);
      alternate = parseBlock();
    }

    return IfStatement(condition, consequent, alternate, makeLocation(ifToken));
  }

  // === For statement ===
  function parseFor() {
    const forToken = advance(TokenType.FOR);
    const varToken = expect(TokenType.IDENTIFIER);
    expect(TokenType.IN);
    const iterable = parseExpression();
    const body = parseBlock();
    return ForStatement(Identifier(varToken.value, makeLocation(varToken)), iterable, body, makeLocation(forToken));
  }

  // === While statement ===
  function parseWhile() {
    const whileToken = advance(TokenType.WHILE);
    const condition = parseExpression();
    const body = parseBlock();
    return WhileStatement(condition, body, makeLocation(whileToken));
  }

  // === Function declaration ===
  function parseFunction() {
    const funcToken = advance(TokenType.FUNCTION);
    const nameToken = expect(TokenType.IDENTIFIER);
    expect(TokenType.LPAREN);
    const params = parseParameterList();
    const body = parseBlock();
    return FunctionDeclaration(Identifier(nameToken.value, makeLocation(nameToken)), params, body, makeLocation(funcToken));
  }

  function parseParameterList() {
    const params = [];
    while (!match(TokenType.RPAREN)) {
      if (params.length > 0) {
        expect(TokenType.COMMA);
      }
      const paramToken = expect(TokenType.IDENTIFIER);
      params.push(Identifier(paramToken.value, makeLocation(paramToken)));
    }
    return params;
  }

  // === Return statement ===
  function parseReturn() {
    const retToken = advance(TokenType.RETURN);
    let argument = null;

    const next = current();
    if (
      next.type !== TokenType.NEWLINE &&
      next.type !== TokenType.DEDENT &&
      next.type !== TokenType.EOF &&
      next.type !== TokenType.COLON
    ) {
      argument = parseExpression();
    }

    return ReturnStatement(argument, makeLocation(retToken));
  }

  // === Break statement ===
  function parseBreak() {
    advance(TokenType.BREAK);
    return BreakStatement(makeLocation(current()));
  }

  // === Continue statement ===
  function parseContinue() {
    advance(TokenType.CONTINUE);
    return ContinueStatement(makeLocation(current()));
  }

  // === Pass statement ===
  function parsePass() {
    advance(TokenType.PASS);
    return { type: 'Pass', location: makeLocation(current()) };
  }

  // === Top-level: parse statements (for Phase 5) ===
  function parseStatements() {
    const statements = [];
    while (peek().type !== TokenType.EOF) {
      statements.push(parseStatement());
    }
    return statements;
  }

  function parseStatement() {
    const token = current();

    // Keywords that start statements
    if (token.type === TokenType.IF) {
      return parseIf();
    }
    if (token.type === TokenType.FOR) {
      return parseFor();
    }
    if (token.type === TokenType.WHILE) {
      return parseWhile();
    }
    if (token.type === TokenType.FUNCTION) {
      return parseFunction();
    }
    if (token.type === TokenType.RETURN) {
      return parseReturn();
    }
    if (token.type === TokenType.BREAK) {
      return parseBreak();
    }
    if (token.type === TokenType.CONTINUE) {
      return parseContinue();
    }
    if (token.type === TokenType.PASS) {
      return parsePass();
    }

    // Assignment: identifier = expression
    if (token.type === TokenType.IDENTIFIER) {
      // Look ahead: check if next non-structural token is EQUAL
      // Handle member access (e.g., player.x = 100) and array access (e.g., arr[0] = 10)
      let scan = pos + 1;
      while (scan < tokens.length) {
        const st = tokens[scan];
        if (st.type === TokenType.NEWLINE || st.type === TokenType.INDENT || st.type === TokenType.DEDENT) {
          scan++;
          continue;
        }
        if (st.type === TokenType.DOT) {
          scan += 2; // Skip DOT and the following identifier
          continue;
        }
        if (st.type === TokenType.LBRACKET) {
          // Skip everything inside brackets
          let bracketDepth = 1;
          scan++;
          while (scan < tokens.length && bracketDepth > 0) {
            if (tokens[scan].type === TokenType.LBRACKET) bracketDepth++;
            if (tokens[scan].type === TokenType.RBRACKET) bracketDepth--;
            scan++;
          }
          continue;
        }
        break;
      }

      if (scan < tokens.length && tokens[scan].type === TokenType.EQUAL) {
        return parseAssignment();
      }

      // Expression statement (call, identifier reference, etc.)
      return { type: 'ExpressionStatement', expression: parseExpression() };
    }

    // Expression statements
    if (
      token.type === TokenType.NUMBER ||
      token.type === TokenType.STRING ||
      token.type === TokenType.TRUE ||
      token.type === TokenType.FALSE ||
      token.type === TokenType.NULL ||
      token.type === TokenType.LBRACKET ||
      token.type === TokenType.LBRACE ||
      token.type === TokenType.LPAREN
    ) {
      return { type: 'ExpressionStatement', expression: parseExpression() };
    }

    throw new ParserError(
      `Unexpected token: ${token.type}`,
      filename,
      token.line,
      token.column,
      getSourceLine(source, token.line)
    );
  }

  return { parseExpression, parseStatements, parsePrimary, parseUnary, parseStatement, parseBlock };
}

module.exports = {
  ParserError,
  createParser,
};
