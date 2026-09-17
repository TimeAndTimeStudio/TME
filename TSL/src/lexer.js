'use strict';

const path = require('path');
const { LexerError } = require('./errors');

// Token types
const TokenType = {
  // Literals
  IDENTIFIER: 'IDENTIFIER',
  NUMBER: 'NUMBER',
  STRING: 'STRING',

  // Keywords
  IF: 'IF',
  ELSE: 'ELSE',
  FOR: 'FOR',
  IN: 'IN',
  WHILE: 'WHILE',
  FUNCTION: 'FUNCTION',
  RETURN: 'RETURN',
  BREAK: 'BREAK',
  CONTINUE: 'CONTINUE',
  PASS: 'PASS',
  TRUE: 'TRUE',
  FALSE: 'FALSE',
  NULL: 'NULL',
  AND: 'AND',
  OR: 'OR',
  NOT: 'NOT',

  // Operators
  PLUS: 'PLUS',
  MINUS: 'MINUS',
  STAR: 'STAR',
  SLASH: 'SLASH',
  PERCENT: 'PERCENT',
  EQUAL: 'EQUAL',
  EQUAL_EQUAL: 'EQUAL_EQUAL',
  NOT_EQUAL: 'NOT_EQUAL',
  LESS: 'LESS',
  LESS_EQUAL: 'LESS_EQUAL',
  GREATER: 'GREATER',
  GREATER_EQUAL: 'GREATER_EQUAL',

  // Delimiters
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  LBRACKET: 'LBRACKET',
  RBRACKET: 'RBRACKET',
  LBRACE: 'LBRACE',
  RBRACE: 'RBRACE',
  COMMA: 'COMMA',
  DOT: 'DOT',
  COLON: 'COLON',

  // Structure
  NEWLINE: 'NEWLINE',
  INDENT: 'INDENT',
  DEDENT: 'DEDENT',

  EOF: 'EOF',
};

// Keyword mapping
const KEYWORDS = {
  'if': TokenType.IF,
  'else': TokenType.ELSE,
  'for': TokenType.FOR,
  'in': TokenType.IN,
  'while': TokenType.WHILE,
  'function': TokenType.FUNCTION,
  'return': TokenType.RETURN,
  'break': TokenType.BREAK,
  'continue': TokenType.CONTINUE,
  'pass': TokenType.PASS,
  'true': TokenType.TRUE,
  'false': TokenType.FALSE,
  'null': TokenType.NULL,
  'and': TokenType.AND,
  'or': TokenType.OR,
  'not': TokenType.NOT,
};

class Token {
  constructor(type, value, line, column) {
    this.type = type;
    this.value = value;
    this.line = line;
    this.column = column;
  }

  toString() {
    return `Token(${this.type}, ${JSON.stringify(this.value)}, ${this.line}:${this.column})`;
  }
}

function createLexer(source, filename = '<anonymous>') {
  let pos = 0;
  let line = 1;
  let column = 1;
  let indentStack = [0];

  function peek() {
    if (pos >= source.length) return null;
    return source[pos];
  }

  function advance() {
    const ch = source[pos];
    if (ch === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
    pos++;
    return ch;
  }

  function skipWhitespace() {
    while (pos < source.length) {
      const ch = source[pos];
      if (ch === ' ' || ch === '\t') {
        pos++;
        column++;
      } else if (ch === '\n' || ch === '\r') {
        break;
      } else {
        break;
      }
    }
  }

  function readString(quote) {
    const startLine = line;
    const startColumn = column;
    let value = '';
    advance(); // consume opening quote

    while (pos < source.length) {
      const ch = advance();
      if (ch === quote) {
        return new Token(TokenType.STRING, value, startLine, startColumn);
      }
      if (ch === '\\') {
        const escaped = advance();
        switch (escaped) {
          case 'n': value += '\n'; break;
          case 't': value += '\t'; break;
          case '\\': value += '\\'; break;
          case '"': value += '"'; break;
          case "'": value += "'"; break;
          default: value += escaped; break;
        }
      } else {
        value += ch;
      }
    }

    throw new LexerError(`Unterminated string literal`, filename, startLine, startColumn, getSourceLine(source, startLine));
  }

  function readNumber() {
    const startLine = line;
    const startColumn = column;
    let value = '';

    while (pos < source.length && /[\d]/.test(source[pos])) {
      value += advance();
    }

    if (pos < source.length && source[pos] === '.' && pos + 1 < source.length && /\d/.test(source[pos + 1])) {
      value += '.';
      advance();
      while (pos < source.length && /[\d]/.test(source[pos])) {
        value += advance();
      }
    }

    return new Token(TokenType.NUMBER, Number(value), startLine, startColumn);
  }

  function readIdentifierOrKeyword() {
    const startLine = line;
    const startColumn = column;
    let value = '';

    while (pos < source.length && /[a-zA-Z0-9_]/.test(source[pos])) {
      value += advance();
    }

    if (value in KEYWORDS) {
      return new Token(KEYWORDS[value], value, startLine, startColumn);
    }

    return new Token(TokenType.IDENTIFIER, value, startLine, startColumn);
  }

  function getSourceLine(lineNum) {
    const lines = source.split('\n');
    if (lineNum >= 1 && lineNum <= lines.length) {
      return lines[lineNum - 1];
    }
    return '';
  }

  function generateDedents() {
    const dedents = [];
    while (indentStack.length > 1) {
      indentStack.pop();
      dedents.push(new Token(TokenType.DEDENT, '', line, column));
    }
    return dedents;
  }

  function tokenize() {
    const tokens = [];

    let lastNewlinePos = -1;
    let pendingNewline = false;
    let pendingNewlineLine = 1;
    let pendingNewlineColumn = 1;

    while (pos < source.length) {
      const ch = source[pos];

      // Newlines
      if (ch === '\n') {
        // Skip blank lines (but still emit NEWLINE)
        lastNewlinePos = tokens.length;
        pendingNewline = true;
        pendingNewlineLine = line;
        pendingNewlineColumn = column;

        // Skip \r if present
        if (pos + 1 < source.length && source[pos + 1] === '\r') {
          advance();
        }
        advance();
        continue;
      }

      // Comments
      if (ch === '#') {
        while (pos < source.length && source[pos] !== '\n') {
          advance();
        }
        continue;
      }

      // Whitespace (spaces, tabs) — skip, but track for indentation
      if (ch === ' ' || ch === '\t') {
        const spaceStart = pos;
        const spaceStartLine = line;
        const spaceStartColumn = column;

        while (pos < source.length && (source[pos] === ' ' || source[pos] === '\t')) {
          if (source[pos] === '\n') break;
          advance();
        }

        // Only process indentation if we're at a position where indentation matters
        // (after a newline, before a token)
        if (pendingNewline && pos < source.length && source[pos] !== '#') {
          // Emit NEWLINE first
          tokens.push(new Token(TokenType.NEWLINE, '\n', pendingNewlineLine, pendingNewlineColumn));
          pendingNewline = false;

          // Calculate indent level
          let indent = 0;
          for (let i = spaceStart; i < pos; i++) {
            if (source[i] === '\t') {
              indent = 0; // Reset on tab — use first non-space
              break;
            }
            indent++;
          }

          if (indentStack.length > 1) {
            const currentIndent = indentStack[indentStack.length - 1];
            if (indent === currentIndent) {
              // Same level — skip
            } else if (indent > currentIndent) {
              indentStack.push(indent);
              tokens.push(new Token(TokenType.INDENT, '', spaceStartLine, spaceStartColumn));
            } else {
              // DEDENT until we match
              while (indentStack.length > 1 && indentStack[indentStack.length - 1] > indent) {
                indentStack.pop();
                tokens.push(new Token(TokenType.DEDENT, '', line, column));
              }
              if (indentStack[indentStack.length - 1] !== indent) {
                // Mismatched indentation — emit error
                throw new LexerError(
                  `Unexpected indentation (expected ${indentStack[indentStack.length - 1]}, got ${indent})`,
                  filename,
                  spaceStartLine,
                  spaceStartColumn,
                  getSourceLine(source, spaceStartLine)
                );
              }
            }
          } else {
            if (indent > 0) {
              indentStack.push(indent);
              tokens.push(new Token(TokenType.INDENT, '', spaceStartLine, spaceStartColumn));
            }
          }
        }

        continue;
      }

      // If we had a pending newline and now have a token, emit NEWLINE
      if (pendingNewline) {
        tokens.push(new Token(TokenType.NEWLINE, '\n', pendingNewlineLine, pendingNewlineColumn));
        pendingNewline = false;

        // Emit DEDENT tokens for any open indentation levels
        // This handles cases where the next line starts with non-whitespace
        while (indentStack.length > 1) {
          indentStack.pop();
          tokens.push(new Token(TokenType.DEDENT, '', line, column));
        }
      }

      // String literals
      if (ch === '"' || ch === "'") {
        tokens.push(readString(ch));
        continue;
      }

      // Numbers
      if (/\d/.test(ch)) {
        tokens.push(readNumber());
        continue;
      }

      // Identifiers and keywords
      if (/[a-zA-Z_]/.test(ch)) {
        tokens.push(readIdentifierOrKeyword());
        continue;
      }

      // Two-character operators
      if (pos + 1 < source.length) {
        const two = source[pos] + source[pos + 1];
        switch (two) {
          case '==':
            tokens.push(new Token(TokenType.EQUAL_EQUAL, '==', line, column));
            advance(); advance();
            continue;
          case '!=':
            tokens.push(new Token(TokenType.NOT_EQUAL, '!=', line, column));
            advance(); advance();
            continue;
          case '<=':
            tokens.push(new Token(TokenType.LESS_EQUAL, '<=', line, column));
            advance(); advance();
            continue;
          case '>=':
            tokens.push(new Token(TokenType.GREATER_EQUAL, '>=', line, column));
            advance(); advance();
            continue;
        }
      }

      // Single-character operators and delimiters
      switch (ch) {
        case '+':
          tokens.push(new Token(TokenType.PLUS, '+', line, column));
          advance();
          continue;
        case '-':
          tokens.push(new Token(TokenType.MINUS, '-', line, column));
          advance();
          continue;
        case '*':
          tokens.push(new Token(TokenType.STAR, '*', line, column));
          advance();
          continue;
        case '/':
          tokens.push(new Token(TokenType.SLASH, '/', line, column));
          advance();
          continue;
        case '%':
          tokens.push(new Token(TokenType.PERCENT, '%', line, column));
          advance();
          continue;
        case '=':
          tokens.push(new Token(TokenType.EQUAL, '=', line, column));
          advance();
          continue;
        case '<':
          tokens.push(new Token(TokenType.LESS, '<', line, column));
          advance();
          continue;
        case '>':
          tokens.push(new Token(TokenType.GREATER, '>', line, column));
          advance();
          continue;
        case '(':
          tokens.push(new Token(TokenType.LPAREN, '(', line, column));
          advance();
          continue;
        case ')':
          tokens.push(new Token(TokenType.RPAREN, ')', line, column));
          advance();
          continue;
        case '[':
          tokens.push(new Token(TokenType.LBRACKET, '[', line, column));
          advance();
          continue;
        case ']':
          tokens.push(new Token(TokenType.RBRACKET, ']', line, column));
          advance();
          continue;
        case '{':
          tokens.push(new Token(TokenType.LBRACE, '{', line, column));
          advance();
          continue;
        case '}':
          tokens.push(new Token(TokenType.RBRACE, '}', line, column));
          advance();
          continue;
        case ',':
          tokens.push(new Token(TokenType.COMMA, ',', line, column));
          advance();
          continue;
        case '.':
          tokens.push(new Token(TokenType.DOT, '.', line, column));
          advance();
          continue;
        case ':':
          tokens.push(new Token(TokenType.COLON, ':', line, column));
          advance();
          continue;
      }

      throw new LexerError(`Unexpected character '${ch}'`, filename, line, column, getSourceLine(source, line));
    }

    // Emit final NEWLINE if source ends without newline and we had tokens
    if (pendingNewline) {
      tokens.push(new Token(TokenType.NEWLINE, '\n', pendingNewlineLine, pendingNewlineColumn));
    }

    // Close all open blocks
    while (indentStack.length > 1) {
      indentStack.pop();
      tokens.push(new Token(TokenType.DEDENT, '', line, column));
    }

    // EOF
    tokens.push(new Token(TokenType.EOF, null, line, column));

    return tokens;
  }

  return { tokenize };
}

function tokenize(source, filename) {
  const lexer = createLexer(source, filename);
  return lexer.tokenize();
}

module.exports = {
  TokenType,
  Token,
  LexerError,
  createLexer,
  tokenize,
};
