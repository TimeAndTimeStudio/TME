'use strict';

const ErrorType = {
  LEXER: 'Lexer Error',
  PARSER: 'Parser Error',
  SEMANTIC: 'Semantic Error',
  GENERATOR: 'Generator Error',
};

class TSL extends Error {
  constructor(errorType, message, filename, line, column, sourceLine) {
    super(message);
    this.errorType = errorType;
    this.filename = filename;
    this.line = line;
    this.column = column;
    this.sourceLine = sourceLine;
    this.stack = new Error(message).stack;
  }
}

class LexerError extends TSL {
  constructor(message, filename, line, column, sourceLine) {
    super(ErrorType.LEXER, message, filename, line, column, sourceLine);
    this.name = 'LexerError';
  }
}

class ParserError extends TSL {
  constructor(message, filename, line, column, sourceLine) {
    super(ErrorType.PARSER, message, filename, line, column, sourceLine);
    this.name = 'ParserError';
  }
}

class ValidationError extends TSL {
  constructor(message, filename, line, column, sourceLine) {
    super(ErrorType.SEMANTIC, message, filename, line, column, sourceLine);
    this.name = 'ValidationError';
  }
}

class GeneratorError extends TSL {
  constructor(message, filename, line, column, sourceLine) {
    super(ErrorType.GENERATOR, message, filename, line, column, sourceLine);
    this.name = 'GeneratorError';
  }
}

function getSourceLine(source, lineNum) {
  const lines = source.split('\n');
  if (lineNum >= 1 && lineNum <= lines.length) {
    return lines[lineNum - 1];
  }
  return '';
}

module.exports = {
  ErrorType,
  TSL,
  LexerError,
  ParserError,
  ValidationError,
  GeneratorError,
  getSourceLine,
};
