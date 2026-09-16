#!/usr/bin/env node

'use strict';

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const TME_ROOT = path.resolve(__dirname, '..', '..', '..');
const TSL_DIR = path.join(TME_ROOT, 'TSL');
const TSL_CLI = path.join(TSL_DIR, 'src', 'cli.js');

const REQUIRED_DIST_FILES = ['game.js', 'engine.js'];

function validateProject(projectDir) {
  projectDir = path.resolve(projectDir);

  if (!fs.existsSync(projectDir)) {
    throw new Error(`Project directory not found: ${projectDir}`);
  }

  const indexPath = path.join(projectDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error(`Missing required file: index.html`);
  }

  const html = fs.readFileSync(indexPath, 'utf-8');
  if (!/<canvas\s+id=["']game["']\s*>/.test(html)) {
    throw new Error(`index.html is missing the required game canvas: <canvas id="game"></canvas>`);
  }

  const tslPath = path.join(projectDir, 'game.tsl');
  if (!fs.existsSync(tslPath)) {
    throw new Error(`Missing required file: game.tsl`);
  }

  return { projectDir, indexPath, tslPath };
}

function validateTSL() {
  if (!fs.existsSync(TSL_DIR)) {
    throw new Error('TSL repository is missing. Please clone it: git clone https://github.com/TimeAndTimeStudio/TSL.git TSL');
  }
  if (!fs.existsSync(TSL_CLI)) {
    throw new Error('TSL CLI not found at TSL/src/cli.js');
  }
}

function invokeTSL(projectDir, tslPath) {
  const distDir = path.join(projectDir, 'dist');
  const outputPath = path.resolve(path.join(distDir, 'game.js'));

  fs.mkdirSync(distDir, { recursive: true });

  try {
    execSync(`node "${TSL_CLI}" build "${tslPath}" -o "${outputPath}"`, {
      stdio: 'inherit',
      cwd: TME_ROOT
    });
  } catch (err) {
    throw new Error(`TSL compilation failed: ${err.message}`);
  }

  if (!fs.existsSync(outputPath)) {
    throw new Error(`TSL build succeeded but output file not found: ${outputPath}`);
  }

  return outputPath;
}

function copyUserFiles(projectDir) {
  const distDir = path.join(projectDir, 'dist');
  fs.mkdirSync(distDir, { recursive: true });

  const userFiles = ['index.html', 'style.css'];

  for (const filename of userFiles) {
    const srcPath = path.join(projectDir, filename);
    if (fs.existsSync(srcPath)) {
      const destPath = path.join(distDir, filename);
      fs.copyFileSync(srcPath, destPath);
    }
  }

  function copyRecursive(src, dest) {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        copyRecursive(srcPath, destPath);
      } else if (!['game.tsl', 'index.html', 'style.css'].includes(entry.name)) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  const excludedDirs = ['node_modules', '.git', 'dist'];

  const entries = fs.readdirSync(projectDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && !excludedDirs.includes(entry.name)) {
      const srcPath = path.join(projectDir, entry.name);
      const destPath = path.join(distDir, entry.name);
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyRecursive(srcPath, destPath);
    }
  }
}

function packageRuntime(projectDir) {
  const distDir = path.join(projectDir, 'dist');
  fs.mkdirSync(distDir, { recursive: true });

  const tmeSrcDir = path.join(TME_ROOT, 'tme', 'src');

  const runtimeFiles = [
    { src: path.join(tmeSrcDir, 'temf', 'runtime.js'), dest: 'temf.js' },
    { src: path.join(tmeSrcDir, 'temf', 'runtime-webgpu.js'), dest: 'temf-webgpu.js' },
    { src: path.join(tmeSrcDir, 'temf', 'runtime-webgl.js'), dest: 'temf-webgl.js' }
  ];

  for (const { src, dest } of runtimeFiles) {
    if (fs.existsSync(src)) {
      const destPath = path.join(distDir, dest);
      fs.copyFileSync(src, destPath);
    }
  }
}

function verifyBuildOutput(projectDir) {
  const distDir = path.join(projectDir, 'dist');

  const required = ['game.js', 'temf.js', 'index.html', 'style.css'];
  const missing = [];

  for (const filename of required) {
    const filePath = path.join(distDir, filename);
    if (!fs.existsSync(filePath)) {
      missing.push(filename);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Build output incomplete. Missing required files: ${missing.join(', ')}`);
  }

  return true;
}

async function buildProject(projectDir) {
  console.log('TME Build Program starting...');

  validateTSL();
  console.log('TSL repository validated.');

  const { indexPath, tslPath } = validateProject(projectDir);
  console.log('Project validated.');

  console.log('Invoking TSL...');
  invokeTSL(projectDir, tslPath);
  console.log('TSL compilation successful.');

  console.log('Packaging runtime...');
  packageRuntime(projectDir);

  console.log('Copying user files...');
  copyUserFiles(projectDir);

  console.log('Verifying build output...');
  verifyBuildOutput(projectDir);
  console.log('Build output verified.');

  console.log('Build complete. Output: dist/');
}

module.exports = { buildProject, validateProject, validateTSL, invokeTSL, copyUserFiles, packageRuntime, verifyBuildOutput, REQUIRED_DIST_FILES };
