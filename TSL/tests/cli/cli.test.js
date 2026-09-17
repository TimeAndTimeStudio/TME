'use strict';

const { execSync } = require('child_process');
const { writeFileSync, unlinkSync, readFileSync } = require('fs');
const { strictEqual, ok } = require('assert');

function run(args) {
  try {
    const result = execSync(`node ${__dirname}/../../src/cli.js ${args}`, {
      encoding: 'utf-8',
      cwd: __dirname + '/..',
    });
    return { exitCode: 0, stdout: result, stderr: '' };
  } catch (err) {
    return { exitCode: err.status || 1, stdout: err.stdout || '', stderr: err.stderr || '' };
  }
}

function writeTempTsl(content) {
  const tmp = `/tmp/test_${Date.now()}.tsl`;
  writeFileSync(tmp, content, 'utf-8');
  return tmp;
}

function cleanup(path) {
  try { unlinkSync(path); } catch {}
}

// Test 1: no args
{
  const r = run('');
  strictEqual(r.exitCode, 1);
  ok(r.stderr.includes('Usage'), 'Should show usage');
  console.log('PASS: no args');
}

// Test 2: wrong extension
{
  const tmp = `/tmp/test_wrong_${Date.now()}.txt`;
  writeFileSync(tmp, 'hello', 'utf-8');
  const r = run(tmp);
  cleanup(tmp);
  strictEqual(r.exitCode, 1);
  ok(r.stderr.includes('.tsl'), 'Should require .tsl extension');
  console.log('PASS: wrong extension');
}

// Test 3: file not found
{
  const r = run('/tmp/nonexistent_file.tsl');
  strictEqual(r.exitCode, 1);
  ok(r.stderr.includes('not found'), 'Should report file not found');
  console.log('PASS: file not found');
}

// Test 4: valid .tsl file
{
  const tmp = writeTempTsl('# test\nprint("hello")\n');
  const r = run(tmp);
  cleanup(tmp);
  strictEqual(r.exitCode, 0);
  ok(r.stdout.includes('Loaded'), 'Should report loaded');
  console.log('PASS: valid .tsl file');
}

// Test 5: --version
{
  const r = run('--version');
  strictEqual(r.exitCode, 0);
  ok(r.stdout.includes('TSL v'), 'Should show version');
  console.log('PASS: --version');
}

// Test 6: build command (stdout)
{
  const tmp = writeTempTsl('x = 10\nprint(x)\n');
  const r = run(`build ${tmp}`);
  cleanup(tmp);
  strictEqual(r.exitCode, 0);
  ok(r.stdout.includes('let x = 10'), 'Should generate JavaScript');
  console.log('PASS: build to stdout');
}

// Test 7: build command with -o flag
{
  const tmp = writeTempTsl('x = 20\nprint(x)\n');
  const out = `/tmp/test_output_${Date.now()}.js`;
  const r = run(`build ${tmp} -o ${out}`);
  strictEqual(r.exitCode, 0);
  ok(r.stdout.includes('Built:'), 'Should report built');
  ok(readFileSync(out, 'utf-8').includes('let x = 20'), 'Output file should contain JS');
  cleanup(tmp);
  cleanup(out);
  console.log('PASS: build with -o flag');
}

// Test 8: check command (valid file)
{
  const tmp = writeTempTsl('x = 30\nprint(x)\n');
  const r = run(`check ${tmp}`);
  cleanup(tmp);
  strictEqual(r.exitCode, 0);
  ok(r.stdout.includes('Check passed'), 'Should pass check');
  console.log('PASS: check valid file');
}

// Test 9: check command (invalid file)
{
  const tmp = writeTempTsl('return 10\n');
  const r = run(`check ${tmp}`);
  cleanup(tmp);
  strictEqual(r.exitCode, 1);
  ok(r.stderr.includes('return'), 'Should report error');
  console.log('PASS: check invalid file');
}

// Test 10: build without file
{
  const r = run('build');
  strictEqual(r.exitCode, 1);
  ok(r.stderr.includes('Usage'), 'Should show usage');
  console.log('PASS: build without file');
}

// Test 11: check without file
{
  const r = run('check');
  strictEqual(r.exitCode, 1);
  ok(r.stderr.includes('Usage'), 'Should show usage');
  console.log('PASS: check without file');
}

console.log('\nAll CLI tests passed');
