'use strict';

const { ValidationError, getSourceLine } = require('./errors');

function createValidator(source, filename = '<anonymous>') {
  const errors = [];

  function addError(node, message) {
    const loc = node.location || {};
    const sourceLine = getSourceLine(source, loc.line);
    errors.push(new ValidationError(message, filename, loc.line, loc.column, sourceLine));
  }

  function validate(program) {
    errors.length = 0;
    validateStatements(program.body, { inFunction: false, inLoop: false });
    if (errors.length > 0) {
      throw errors[0];
    }
    return errors;
  }

  function validateStatements(stmts, context) {
    for (const stmt of stmts) {
      validateStatement(stmt, context);
    }
  }

  function validateStatement(stmt, context) {
    if (!stmt || !stmt.type) return;

    switch (stmt.type) {
      case 'ReturnStatement':
        if (!context.inFunction) {
          addError(stmt, 'return outside function');
        }
        break;

      case 'BreakStatement':
        if (!context.inLoop) {
          addError(stmt, 'break outside loop');
        }
        break;

      case 'ContinueStatement':
        if (!context.inLoop) {
          addError(stmt, 'continue outside loop');
        }
        break;

      case 'Assignment':
      case 'ExpressionStatement':
        break;

      case 'IfStatement': {
        const newContext = { ...context };
        validateStatements(stmt.consequent, newContext);
        if (stmt.alternate) {
          validateStatements(stmt.alternate, newContext);
        }
        break;
      }

      case 'WhileStatement': {
        const newContext = { ...context, inLoop: true };
        validateStatements(stmt.body, newContext);
        break;
      }

      case 'ForStatement': {
        const newContext = { ...context, inLoop: true };
        validateStatements(stmt.body, newContext);
        break;
      }

      case 'FunctionDeclaration': {
        const newContext = { ...context, inFunction: true };
        validateStatements(stmt.body, newContext);
        break;
      }

      default:
        break;
    }
  }

  return { validate };
}

module.exports = {
  ValidationError,
  createValidator,
};
