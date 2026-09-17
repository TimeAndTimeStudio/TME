#!/usr/bin/env node
/**
 * Phase 20 — Test & Release Candidate
 * Standalone test project to verify TSL compiler works correctly
 * when used from an external project.
 */

const { execSync } = require('child_process');
const { writeFileSync, readFileSync, unlinkSync, mkdirSync, existsSync } = require('fs');
const { strictEqual, ok, deepStrictEqual } = require('assert');
const path = require('path');

const TSL_DIR = path.join(__dirname, '..');
const CLI = path.join(TSL_DIR, 'src', 'cli.js');
const EXAMPLES_DIR = path.join(TSL_DIR, 'examples');
const TESTS_DIR = path.join(TSL_DIR, 'tests');

let passed = 0;
let failed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${e.message}`);
  }
}

function runCommand(cmd) {
  return execSync(cmd, { encoding: 'utf-8', cwd: TSL_DIR }).trim();
}

function compileTsl(source) {
  const tmp = `/tmp/tsl_release_${Date.now()}.tsl`;
  writeFileSync(tmp, source, 'utf-8');
  try {
    const result = execSync(`node "${CLI}" "${tmp}"`, { encoding: 'utf-8', cwd: TSL_DIR });
    unlinkSync(tmp);
    return result;
  } catch (err) {
    unlinkSync(tmp);
    throw new Error(err.stderr || err.stdout || 'Compilation failed');
  }
}

function compileAndRun(source) {
  const tmp = `/tmp/tsl_release_${Date.now()}.tsl`;
  writeFileSync(tmp, source, 'utf-8');
  try {
    const result = execSync(`node "${CLI}" "${tmp}"`, { encoding: 'utf-8', cwd: TSL_DIR });
    const jsMatch = result.match(/--- Generated JavaScript ---\s*\n([\s\S]*?)\s*--- End of Generated Code ---/);
    if (!jsMatch) throw new Error('Could not extract generated JavaScript');
    const jsCode = jsMatch[1];
    unlinkSync(tmp);
    return { jsCode };
  } catch (err) {
    unlinkSync(tmp);
    throw new Error(err.stderr || err.stdout || 'Compilation failed');
  }
}

// ============================================================
// Phase 20 Test Suite
// ============================================================

console.log('\n========================================');
console.log('  TSL Release Candidate Test Suite');
console.log('  Phase 20 — Test & Release Candidate');
console.log('========================================\n');

// --- Clean Install ---
console.log('[1/6] Clean Install');
console.log('----------------------------');
try {
  runCommand('npm install');
  test('npm install succeeds', () => {
    ok(true);
  });
} catch (e) {
  console.error('  ✗ npm install failed');
  failed++;
  total++;
}

// --- Clean Build ---
console.log('\n[2/6] Clean Build');
console.log('----------------------------');
const exampleFiles = ['hello.tsl', 'variables.tsl', 'math.tsl', 'if.tsl', 'for.tsl', 'functions.tsl', 'arrays.tsl', 'objects.tsl', 'while.tsl', 'recursion.tsl'];

for (const example of exampleFiles) {
  test(`${example} builds successfully`, () => {
    const result = compileTsl(readFileSync(path.join(EXAMPLES_DIR, example), 'utf-8'));
    ok(result.includes('Compilation successful'), `${example} should compile`);
  });
}

// --- Lexer Tests ---
console.log('\n[3/6] Lexer Tests');
console.log('----------------------------');
const lexerTestPath = path.join(TESTS_DIR, 'lexer', 'lexer.test.js');
try {
  const result = runCommand(`node "${lexerTestPath}"`);
  const lines = result.split('\n');
  const passLine = lines.find(l => l.includes('All lexer tests passed'));
  if (passLine) {
    test('Lexer tests pass', () => ok(true));
  } else {
    throw new Error('Lexer tests did not pass');
  }
} catch (e) {
  test('Lexer tests pass', () => { throw e; });
}

// --- Parser Tests ---
console.log('\n[4/6] Parser Tests');
console.log('----------------------------');
const parserExprPath = path.join(TESTS_DIR, 'parser', 'expression.test.js');
const parserStmtPath = path.join(TESTS_DIR, 'parser', 'statement.test.js');
for (const testPath of [parserExprPath, parserStmtPath]) {
  try {
    const result = runCommand(`node "${testPath}"`);
    const lines = result.split('\n');
    const passLine = lines.find(l => l.includes('All parser') && l.includes('passed'));
    if (passLine) {
      test(`Parser (${path.basename(path.dirname(testPath))}) tests pass`, () => ok(true));
    } else {
      throw new Error('Parser tests did not pass');
    }
  } catch (e) {
    test(`Parser (${path.basename(path.dirname(testPath))}) tests pass`, () => { throw e; });
  }
}

// --- Validator Tests ---
console.log('\n[5/6] Validator & Generator Tests');
console.log('----------------------------');
const validatorPath = path.join(TESTS_DIR, 'validator', 'validator.test.js');
const generatorPath = path.join(TESTS_DIR, 'generator', 'generator.test.js');
const varSemPath = path.join(TESTS_DIR, 'generator', 'variable_semantics.test.js');
const astPath = path.join(TESTS_DIR, 'ast', 'ast.test.js');

for (const [name, testPath] of [
  ['Validator', validatorPath],
  ['Generator', generatorPath],
  ['Variable Semantics', varSemPath],
  ['AST', astPath]
]) {
  try {
    const result = runCommand(`node "${testPath}"`);
    test(`${name} tests pass`, () => ok(true));
  } catch (e) {
    test(`${name} tests pass`, () => { throw e; });
  }
}

// --- Runtime Tests ---
console.log('\n[6/6] Runtime & Integration Tests');
console.log('----------------------------');
const runtimePath = path.join(TESTS_DIR, 'runtime', 'runtime.test.js');
const integrationPath = path.join(TESTS_DIR, 'integration', 'integration.test.js');
const cliPath = path.join(TESTS_DIR, 'cli', 'cli.test.js');

const runtimeExists = existsSync(runtimePath);
const testPairs = [
  ['Integration', integrationPath],
  ['CLI', cliPath]
];
if (runtimeExists) {
  testPairs.unshift(['Runtime', runtimePath]);
}

for (const [name, testPath] of testPairs) {
  try {
    const result = runCommand(`node "${testPath}"`);
    test(`${name} tests pass`, () => ok(true));
  } catch (e) {
    test(`${name} tests pass`, () => { throw e; });
  }
}

// --- CLI Tests ---
console.log('\n[7/7] CLI Functionality');
console.log('----------------------------');
test('tsl --version works', () => {
  const result = runCommand(`node "${CLI}" --version`);
  ok(result.includes('TSL'), 'Should output TSL version');
});

test('tsl check works', () => {
  const result = runCommand(`node "${CLI}" check "${path.join(EXAMPLES_DIR, 'hello.tsl')}"`);
  ok(result.includes('Check passed'), 'Should pass check');
});

test('tsl build works', () => {
  const result = runCommand(`node "${CLI}" build "${path.join(EXAMPLES_DIR, 'hello.tsl')}"`);
  ok(result.includes('Hello, World'), 'Should generate correct code');
});

test('tsl build with -o flag works', () => {
  const outFile = `/tmp/tsl_release_build_${Date.now()}.js`;
  runCommand(`node "${CLI}" build "${path.join(EXAMPLES_DIR, 'hello.tsl')}" -o "${outFile}"`);
  const built = readFileSync(outFile, 'utf-8');
  ok(built.includes('print'), 'Should write valid JS to output file');
  unlinkSync(outFile);
});

// ============================================================
// Summary
// ============================================================

console.log('\n========================================');
console.log(`  Results: ${passed}/${total} passed, ${failed} failed`);
console.log('========================================\n');

if (failed > 0) {
  console.error(`  ${failed} test(s) failed`);
  process.exit(1);
} else {
  console.log(`  All ${total} tests passed!`);
  console.log('  TSL is ready for release.\n');
  process.exit(0);
}
