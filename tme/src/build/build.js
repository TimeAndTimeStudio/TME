#!/usr/bin/env node

'use strict';

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const TME_ROOT = path.resolve(__dirname, '..', '..', '..');
const TSL_DIR = path.join(TME_ROOT, 'TSL');
const TSL_CLI = path.join(TSL_DIR, 'src', 'cli.js');

const REQUIRED_DIST_FILES = ['temf.js', 'index.html', 'style.css', 'temf-webgl.js', 'temf-webgpu.js'];

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
    throw new Error(
      `index.html is missing the required game canvas: <canvas id="game"></canvas>`
    );
  }

  return { projectDir, indexPath };
}

function validateTSL() {
  if (!fs.existsSync(TSL_DIR)) {
    throw new Error(
      'TSL repository is missing. Please clone it: git clone https://github.com/TimeAndTimeStudio/TSL.git TSL'
    );
  }

  if (!fs.existsSync(TSL_CLI)) {
    throw new Error('TSL CLI not found at TSL/src/cli.js');
  }
}

function findTSLFiles(projectDir) {
  const tslFiles = [];

  function scan(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (['node_modules', '.git', 'dist'].includes(entry.name)) {
          continue;
        }

        scan(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.tsl')) {
        tslFiles.push(fullPath);
      }
    }
  }

  scan(projectDir);

  return tslFiles;
}

function invokeTSL(projectDir) {
  const distDir = path.join(projectDir, 'dist');

  fs.mkdirSync(distDir, { recursive: true });

  const tslFiles = findTSLFiles(projectDir);

  if (tslFiles.length === 0) {
    throw new Error('No .tsl files found in project.');
  }

  const outputFiles = [];

  for (const tslPath of tslFiles) {
    const relativePath = path.relative(projectDir, tslPath);

    const relativeDir = path.dirname(relativePath);

    const baseName = path.basename(tslPath, '.tsl');

    const outputDir =
      relativeDir === '.'
        ? distDir
        : path.join(distDir, relativeDir);

    const outputPath = path.join(outputDir, `${baseName}.js`);

    fs.mkdirSync(outputDir, { recursive: true });

    console.log(`Building ${relativePath} -> ${path.relative(projectDir, outputPath)}`);

    try {
      execSync(
        `node "${TSL_CLI}" build "${tslPath}" -o "${outputPath}"`,
        {
          stdio: 'inherit',
          cwd: TME_ROOT
        }
      );
    } catch (err) {
      throw new Error(
        `TSL compilation failed for ${relativePath}: ${err.message}`
      );
    }

    if (!fs.existsSync(outputPath)) {
      throw new Error(
        `TSL build succeeded but output file not found: ${outputPath}`
      );
    }

    outputFiles.push(outputPath);
  }

  return outputFiles;
}

function updateGameImports(projectDir, tslFiles) {
  const distDir = path.join(projectDir, 'dist');
  const gameJsPath = path.join(distDir, 'game.js');

  if (!fs.existsSync(gameJsPath)) return;

  const otherTslFiles = tslFiles.filter(f => {
    const basename = path.basename(f, '.tsl');
    return basename !== 'game';
  });

  if (otherTslFiles.length === 0) return;

  const gameJs = fs.readFileSync(gameJsPath, 'utf-8');

  let existingImports = new Set();
  const importRegex = /import\s+['"](.+?)['"]/g;
  let match;
  while ((match = importRegex.exec(gameJs)) !== null) {
    existingImports.add(match[1]);
  }

  let newImports = '';
  for (const tslFile of otherTslFiles) {
    const relativePath = path.relative(projectDir, tslFile);
    const relativeDir = path.dirname(relativePath);
    const baseName = path.basename(tslFile, '.tsl');
    const jsPath = relativeDir === '.' ? `${baseName}.js` : `${relativeDir}/${baseName}.js`;

    if (!existingImports.has(`./${jsPath}`)) {
      newImports += `import('./${jsPath}');\n`;
    }
  }

  if (newImports) {
    const updatedJs = gameJs + `\n${newImports}`;
    fs.writeFileSync(gameJsPath, updatedJs, 'utf-8');
    console.log(`Added ${newImports.split('\n').filter(l => l).length} import(s) to game.js`);
  }
}

function copyUserFiles(projectDir, tslFiles) {
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

  // Copy docs.html from website folder to dist
  const docsSrc = path.join(__dirname, '..', '..', '..', '..', 'website', 'docs.html');
  const docsDest = path.join(distDir, 'docs.html');
  if (fs.existsSync(docsSrc)) {
    fs.copyFileSync(docsSrc, docsDest);
  }

  updateGameImports(projectDir, tslFiles);

  function copyRecursive(src, dest) {
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        copyRecursive(srcPath, destPath);
      } else if (
        !['index.html', 'style.css'].includes(entry.name) &&
        !entry.name.endsWith('.tsl')
      ) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  const excludedDirs = ['node_modules', '.git', 'dist', 'TME'];

  const entries = fs.readdirSync(projectDir, { withFileTypes: true });

  for (const entry of entries) {
    if (
      entry.isDirectory() &&
      !excludedDirs.includes(entry.name)
    ) {
      const srcPath = path.join(projectDir, entry.name);
      const destPath = path.join(distDir, entry.name);

      fs.mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, destPath);
    }
  }
}

function packageRuntime(projectDir) {
  const distDir = path.join(projectDir, 'dist');

  fs.mkdirSync(distDir, { recursive: true });

  const tmeSrcDir = path.join(TME_ROOT, 'tme', 'src');

  const runtimeFiles = [
    {
      src: path.join(tmeSrcDir, 'temf', 'runtime.js'),
      dest: 'temf.js'
    },
    {
      src: path.join(tmeSrcDir, 'temf', 'runtime-webgpu.js'),
      dest: 'temf-webgpu.js'
    },
    {
      src: path.join(tmeSrcDir, 'temf', 'runtime-webgl.js'),
      dest: 'temf-webgl.js'
    }
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
  const missing = [];

  for (const filename of REQUIRED_DIST_FILES) {
    const filePath = path.join(distDir, filename);

    if (!fs.existsSync(filePath)) {
      missing.push(filename);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Build output incomplete. Missing required files: ${missing.join(', ')}`
    );
  }

  return true;
}

async function buildProject(projectDir) {
  console.log('TME Build Program starting...');

  validateTSL();
  console.log('TSL repository validated.');

  validateProject(projectDir);
  console.log('Project validated.');

  console.log('Searching for .tsl files...');

  const tslFiles = findTSLFiles(path.resolve(projectDir));

  console.log(`Found ${tslFiles.length} .tsl file(s).`);

  console.log('Invoking TSL...');
  invokeTSL(projectDir);
  console.log('TSL compilation successful.');

  console.log('Packaging runtime...');
  packageRuntime(projectDir);

  console.log('Copying user files...');
  copyUserFiles(projectDir, tslFiles);

  console.log('Verifying build output...');
  verifyBuildOutput(projectDir);
  console.log('Build output verified.');

  console.log('Build complete. Output: dist/');
}

module.exports = {
  buildProject,
  validateProject,
  validateTSL,
  findTSLFiles,
  invokeTSL,
  copyUserFiles,
  packageRuntime,
  verifyBuildOutput,
  REQUIRED_DIST_FILES
};
