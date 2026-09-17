#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { tokenize } = require('./lexer');
const { createParser } = require('./parser');
const { createValidator } = require('./validator');
const { createGenerator } = require('./generator');
const { Program } = require('./ast');

const VERSION = '1.0.0';

function compileSource(source, filename) {
  const tokens = tokenize(source, filename);
  const parser = createParser(tokens, source, filename);
  const body = parser.parseStatements();
  const ast = Program(body, { line: 1, column: 0, endLine: 1, endColumn: 0 });

  const validator = createValidator(source, filename);
  validator.validate(ast);

  const generator = createGenerator(source, filename);
  const jsCode = generator.generate(ast);

  return { ast, jsCode };
}

function runCommand(file) {
  const ext = path.extname(file);
  if (ext !== '.tsl') {
    console.error(`Error: Expected .tsl extension, got "${ext}"`);
    process.exit(1);
  }

  if (!fs.existsSync(file)) {
    console.error(`Error: File not found: ${file}`);
    process.exit(1);
  }

  const source = fs.readFileSync(file, 'utf-8');
  const filename = path.basename(file);

  try {
    const { jsCode } = compileSource(source, filename);

    console.log(`Loaded: ${filename}`);
    console.log('Compilation successful!');
    console.log('');
    console.log('--- Generated JavaScript ---');
    console.log(jsCode);
    console.log('--- End of Generated Code ---');

  } catch (err) {
    if (err && typeof err.toString === 'function') {
      console.error(err.toString());
    } else {
      console.error('Unknown error:', err);
    }
    process.exit(1);
  }
}

function buildCommand(file, outputFile) {
  const ext = path.extname(file);
  if (ext !== '.tsl') {
    console.error(`Error: Expected .tsl extension, got "${ext}"`);
    process.exit(1);
  }

  if (!fs.existsSync(file)) {
    console.error(`Error: File not found: ${file}`);
    process.exit(1);
  }

  const source = fs.readFileSync(file, 'utf-8');
  const filename = path.basename(file);

  try {
    const { jsCode } = compileSource(source, filename);

    if (outputFile) {
      fs.writeFileSync(outputFile, jsCode, 'utf-8');
      console.log(`Built: ${filename} -> ${outputFile}`);
    } else {
      console.log(jsCode);
    }

  } catch (err) {
    if (err && typeof err.toString === 'function') {
      console.error(err.toString());
    } else {
      console.error('Unknown error:', err);
    }
    process.exit(1);
  }
}

function checkCommand(file) {
  const ext = path.extname(file);
  if (ext !== '.tsl') {
    console.error(`Error: Expected .tsl extension, got "${ext}"`);
    process.exit(1);
  }

  if (!fs.existsSync(file)) {
    console.error(`Error: File not found: ${file}`);
    process.exit(1);
  }

  const source = fs.readFileSync(file, 'utf-8');
  const filename = path.basename(file);

  try {
    compileSource(source, filename);
    console.log(`Check passed: ${filename}`);
  } catch (err) {
    if (err && typeof err.toString === 'function') {
      console.error(err.toString());
    } else {
      console.error('Unknown error:', err);
    }
    process.exit(1);
  }
}

function showVersion() {
  console.log(`TSL v${VERSION}`);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: tsl <file.tsl>');
    console.error('       tsl build <file.tsl> [-o <output.js>]');
    console.error('       tsl check <file.tsl>');
    console.error('       tsl --version');
    process.exit(1);
  }

  // --version
  if (args[0] === '--version') {
    showVersion();
    process.exit(0);
  }

  // build command
  if (args[0] === 'build') {
    if (args.length < 2) {
      console.error('Usage: tsl build <file.tsl> [-o <output.js>]');
      process.exit(1);
    }

    const file = args[1];
    let outputFile = null;

    // Parse -o flag
    for (let i = 2; i < args.length; i++) {
      if (args[i] === '-o' && i + 1 < args.length) {
        outputFile = args[i + 1];
        i++;
      }
    }

    buildCommand(file, outputFile);
    return;
  }

  // check command
  if (args[0] === 'check') {
    if (args.length < 2) {
      console.error('Usage: tsl check <file.tsl>');
      process.exit(1);
    }

    checkCommand(args[1]);
    return;
  }

  // Default: run command
  runCommand(args[0]);
}

main();
