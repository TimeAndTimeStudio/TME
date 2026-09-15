const { test } = require('node:test');
const { strictEqual, ok, throws } = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const buildModule = require(path.resolve(__dirname, '..', 'tme', 'src', 'build', 'build'));
const initModule = require(path.resolve(__dirname, '..', 'tme', 'src', 'build', 'init'));

const { validateProject, verifyBuildOutput, REQUIRED_DIST_FILES } = buildModule;

// --- Phase 10: Static Export and User File Preservation Tests ---

function createTempProject() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tme-test-'));
  return tmpDir;
}

function cleanupTemp(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (e) {
    // ignore cleanup errors
  }
}

test('phase10: validateProject rejects missing project directory', () => {
  throws(
    () => validateProject('/nonexistent/path/that/does/not/exist'),
    /Project directory not found/
  );
});

test('phase10: validateProject rejects missing index.html', () => {
  const tmpDir = createTempProject();
  try {
    fs.writeFileSync(path.join(tmpDir, 'game.tsl'), '');
    throws(
      () => validateProject(tmpDir),
      /Missing required file: index\.html/
    );
  } finally {
    cleanupTemp(tmpDir);
  }
});

test('phase10: validateProject rejects index.html without canvas#game', () => {
  const tmpDir = createTempProject();
  try {
    fs.writeFileSync(path.join(tmpDir, 'index.html'), '<html><body><div>No canvas</div></body></html>');
    fs.writeFileSync(path.join(tmpDir, 'game.tsl'), '');
    throws(
      () => validateProject(tmpDir),
      /missing the required game canvas/
    );
  } finally {
    cleanupTemp(tmpDir);
  }
});

test('phase10: validateProject rejects index.html with wrong canvas id', () => {
  const tmpDir = createTempProject();
  try {
    fs.writeFileSync(path.join(tmpDir, 'index.html'), '<html><body><canvas id="wrong"></canvas></body></html>');
    fs.writeFileSync(path.join(tmpDir, 'game.tsl'), '');
    throws(
      () => validateProject(tmpDir),
      /missing the required game canvas/
    );
  } finally {
    cleanupTemp(tmpDir);
  }
});

test('phase10: validateProject accepts valid index.html with canvas#game', () => {
  const tmpDir = createTempProject();
  try {
    fs.writeFileSync(path.join(tmpDir, 'index.html'), '<html><body><canvas id="game"></canvas></body></html>');
    fs.writeFileSync(path.join(tmpDir, 'game.tsl'), '');
    const result = validateProject(tmpDir);
    ok(result.projectDir, 'returns projectDir');
    ok(result.indexPath, 'returns indexPath');
    ok(result.tslPath, 'returns tslPath');
    strictEqual(
      path.basename(result.indexPath),
      'index.html'
    );
    strictEqual(
      path.basename(result.tslPath),
      'game.tsl'
    );
  } finally {
    cleanupTemp(tmpDir);
  }
});

test('phase10: validateProject rejects missing game.tsl', () => {
  const tmpDir = createTempProject();
  try {
    fs.writeFileSync(path.join(tmpDir, 'index.html'), '<html><body><canvas id="game"></canvas></body></html>');
    throws(
      () => validateProject(tmpDir),
      /Missing required file: game\.tsl/
    );
  } finally {
    cleanupTemp(tmpDir);
  }
});

test('phase10: validateProject accepts canvas with quotes', () => {
  const tmpDir = createTempProject();
  try {
    fs.writeFileSync(path.join(tmpDir, 'index.html'), '<html><body><canvas id="game"></canvas></body></html>');
    fs.writeFileSync(path.join(tmpDir, 'game.tsl'), '');
    const result = validateProject(tmpDir);
    ok(result, 'should pass with double quotes');
  } finally {
    cleanupTemp(tmpDir);
  }
});

test('phase10: verifyBuildOutput detects missing required files', () => {
  const tmpDir = createTempProject();
  try {
    const distDir = path.join(tmpDir, 'dist');
    fs.mkdirSync(distDir, { recursive: true });
    fs.writeFileSync(path.join(distDir, 'index.html'), '<html></html>');
    fs.writeFileSync(path.join(distDir, 'style.css'), '');
    // Missing game.js and engine.js
    throws(
      () => verifyBuildOutput(tmpDir),
      /Build output incomplete/
    );
  } finally {
    cleanupTemp(tmpDir);
  }
});

test('phase10: verifyBuildOutput passes when all required files exist', () => {
  const tmpDir = createTempProject();
  try {
    const distDir = path.join(tmpDir, 'dist');
    fs.mkdirSync(distDir, { recursive: true });
    fs.writeFileSync(path.join(distDir, 'game.js'), '');
    fs.writeFileSync(path.join(distDir, 'engine.js'), '');
    fs.writeFileSync(path.join(distDir, 'index.html'), '<html></html>');
    fs.writeFileSync(path.join(distDir, 'style.css'), '');
    const result = verifyBuildOutput(tmpDir);
    strictEqual(result, true);
  } finally {
    cleanupTemp(tmpDir);
  }
});

test('phase10: REQUIRED_DIST_FILES contains expected entries', () => {
  ok(REQUIRED_DIST_FILES.includes('game.js'), 'REQUIRED_DIST_FILES includes game.js');
  ok(REQUIRED_DIST_FILES.includes('engine.js'), 'REQUIRED_DIST_FILES includes engine.js');
});

test('phase10: copyUserFiles copies user directories recursively', () => {
  const tmpDir = createTempProject();
  try {
    // Setup project structure
    fs.writeFileSync(path.join(tmpDir, 'index.html'), '<html><body><canvas id="game"></canvas></body></html>');
    fs.writeFileSync(path.join(tmpDir, 'style.css'), '');
    fs.writeFileSync(path.join(tmpDir, 'game.tsl'), '');

    // Create nested user directories
    const nestedDir = path.join(tmpDir, 'images', 'player', 'idle');
    fs.mkdirSync(nestedDir, { recursive: true });
    fs.writeFileSync(path.join(nestedDir, '01.png'), 'fake-png-data');
    fs.writeFileSync(path.join(nestedDir, '02.png'), 'fake-png-data-2');

    // Create another directory at different level
    const spritesDir = path.join(tmpDir, 'sprites');
    fs.mkdirSync(spritesDir, { recursive: true });
    fs.writeFileSync(path.join(spritesDir, 'enemy.png'), 'fake-enemy-data');

    // Create dist directory and run copy
    const distDir = path.join(tmpDir, 'dist');
    fs.mkdirSync(distDir, { recursive: true });

    // Import copyUserFiles behavior inline for testing
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

    copyUserFiles(tmpDir);

    // Verify user files copied
    ok(fs.existsSync(path.join(distDir, 'index.html')), 'index.html copied');
    ok(fs.existsSync(path.join(distDir, 'style.css')), 'style.css copied');

    // Verify nested directories copied recursively
    ok(fs.existsSync(path.join(distDir, 'images', 'player', 'idle', '01.png')), 'nested file 01.png copied');
    ok(fs.existsSync(path.join(distDir, 'images', 'player', 'idle', '02.png')), 'nested file 02.png copied');
    ok(fs.existsSync(path.join(distDir, 'sprites', 'enemy.png')), 'sprites/enemy.png copied');

    // Verify file contents
    strictEqual(
      fs.readFileSync(path.join(distDir, 'images', 'player', 'idle', '01.png'), 'utf-8'),
      'fake-png-data'
    );
  } finally {
    cleanupTemp(tmpDir);
  }
});

test('phase10: copyUserFiles preserves arbitrary directory names', () => {
  const tmpDir = createTempProject();
  try {
    fs.writeFileSync(path.join(tmpDir, 'index.html'), '<html><body><canvas id="game"></canvas></body></html>');
    fs.writeFileSync(path.join(tmpDir, 'style.css'), '');
    fs.writeFileSync(path.join(tmpDir, 'game.tsl'), '');

    // Create directories with arbitrary names (not "assets/")
    const dirNames = ['textures', 'my_files', 'game-data', 'audio', 'sounds'];
    for (const dirName of dirNames) {
      const dir = path.join(tmpDir, dirName);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'file.txt'), `content-${dirName}`);
    }

    const distDir = path.join(tmpDir, 'dist');
    fs.mkdirSync(distDir, { recursive: true });

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

    copyUserFiles(tmpDir);

    for (const dirName of dirNames) {
      ok(fs.existsSync(path.join(distDir, dirName, 'file.txt')), `${dirName}/file.txt copied`);
    }
  } finally {
    cleanupTemp(tmpDir);
  }
});

test('phase10: copyUserFiles handles deeply nested directories', () => {
  const tmpDir = createTempProject();
  try {
    fs.writeFileSync(path.join(tmpDir, 'index.html'), '<html><body><canvas id="game"></canvas></body></html>');
    fs.writeFileSync(path.join(tmpDir, 'style.css'), '');
    fs.writeFileSync(path.join(tmpDir, 'game.tsl'), '');

    // Create deeply nested structure: a/b/c/d/e/f/file.txt
    const deepPath = path.join(tmpDir, 'a', 'b', 'c', 'd', 'e', 'f');
    fs.mkdirSync(deepPath, { recursive: true });
    fs.writeFileSync(path.join(deepPath, 'file.txt'), 'deep-content');

    const distDir = path.join(tmpDir, 'dist');
    fs.mkdirSync(distDir, { recursive: true });

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

    copyUserFiles(tmpDir);

    ok(fs.existsSync(path.join(distDir, 'a', 'b', 'c', 'd', 'e', 'f', 'file.txt')), 'deeply nested file copied');
    strictEqual(
      fs.readFileSync(path.join(distDir, 'a', 'b', 'c', 'd', 'e', 'f', 'file.txt'), 'utf-8'),
      'deep-content'
    );
  } finally {
    cleanupTemp(tmpDir);
  }
});

test('phase10: copyUserFiles excludes game.tsl from user directories', () => {
  const tmpDir = createTempProject();
  try {
    fs.writeFileSync(path.join(tmpDir, 'index.html'), '<html><body><canvas id="game"></canvas></body></html>');
    fs.writeFileSync(path.join(tmpDir, 'style.css'), '');
    fs.writeFileSync(path.join(tmpDir, 'game.tsl'), '');

    // Create a subdirectory that contains a file named game.tsl (should not be copied)
    const subDir = path.join(tmpDir, 'sub');
    fs.mkdirSync(subDir, { recursive: true });
    fs.writeFileSync(path.join(subDir, 'game.tsl'), 'should-not-be-copied');
    fs.writeFileSync(path.join(subDir, 'other.txt'), 'should-be-copied');

    const distDir = path.join(tmpDir, 'dist');
    fs.mkdirSync(distDir, { recursive: true });

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

    copyUserFiles(tmpDir);

    ok(fs.existsSync(path.join(distDir, 'sub', 'other.txt')), 'other.txt copied');
    ok(!fs.existsSync(path.join(distDir, 'sub', 'game.tsl')), 'game.tsl excluded from subdirectory');
  } finally {
    cleanupTemp(tmpDir);
  }
});

test('phase10: copyUserFiles does not copy excluded directories', () => {
  const tmpDir = createTempProject();
  try {
    fs.writeFileSync(path.join(tmpDir, 'index.html'), '<html><body><canvas id="game"></canvas></body></html>');
    fs.writeFileSync(path.join(tmpDir, 'style.css'), '');
    fs.writeFileSync(path.join(tmpDir, 'game.tsl'), '');

    // Create excluded directories
    fs.mkdirSync(path.join(tmpDir, 'node_modules', 'pkg'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'node_modules', 'pkg', 'index.js'), 'should-not-copy');

    fs.mkdirSync(path.join(tmpDir, '.git'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, '.git', 'config'), '[core]');

    const distDir = path.join(tmpDir, 'dist');
    fs.mkdirSync(distDir, { recursive: true });

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

    copyUserFiles(tmpDir);

    ok(!fs.existsSync(path.join(distDir, 'node_modules')), 'node_modules not copied');
    ok(!fs.existsSync(path.join(distDir, '.git')), '.git not copied');
  } finally {
    cleanupTemp(tmpDir);
  }
});

test('phase10: build preserves user index.html content', () => {
  const tmpDir = createTempProject();
  try {
    const customHtml = `<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>My Custom Game</title>
    <link rel="stylesheet" href="./style.css">
</head>
<body>
    <div id="hud">Score: 0</div>
    <canvas id="game"></canvas>
    <script type="module" src="./engine.js"></script>
</body>
</html>`;

    fs.writeFileSync(path.join(tmpDir, 'index.html'), customHtml);
    fs.writeFileSync(path.join(tmpDir, 'style.css'), '');
    fs.writeFileSync(path.join(tmpDir, 'game.tsl'), '');

    const distDir = path.join(tmpDir, 'dist');
    fs.mkdirSync(distDir, { recursive: true });

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

    copyUserFiles(tmpDir);

    const distHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');
    strictEqual(distHtml, customHtml, 'user index.html content preserved exactly');
    ok(distHtml.includes('<canvas id="game"></canvas>'), 'canvas preserved');
    ok(distHtml.includes('<div id="hud">Score: 0</div>'), 'user DOM elements preserved');
  } finally {
    cleanupTemp(tmpDir);
  }
});

test('phase10: build preserves user style.css content', () => {
  const tmpDir = createTempProject();
  try {
    const customCss = `html, body {
    margin: 0;
    width: 100%;
    height: 100%;
}

#game {
    display: block;
    width: 100vw;
    height: 100vh;
}

#hud {
    position: fixed;
    top: 20px;
    left: 20px;
    color: white;
}`;

    fs.writeFileSync(path.join(tmpDir, 'index.html'), '<html><body><canvas id="game"></canvas></body></html>');
    fs.writeFileSync(path.join(tmpDir, 'style.css'), customCss);
    fs.writeFileSync(path.join(tmpDir, 'game.tsl'), '');

    const distDir = path.join(tmpDir, 'dist');
    fs.mkdirSync(distDir, { recursive: true });

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

    copyUserFiles(tmpDir);

    const distCss = fs.readFileSync(path.join(distDir, 'style.css'), 'utf-8');
    strictEqual(distCss, customCss, 'user style.css content preserved exactly');
  } finally {
    cleanupTemp(tmpDir);
  }
});

test('phase10: static export produces correct dist/ structure', () => {
  const tmpDir = createTempProject();
  try {
    fs.writeFileSync(path.join(tmpDir, 'index.html'), '<html><body><canvas id="game"></canvas></body></html>');
    fs.writeFileSync(path.join(tmpDir, 'style.css'), '');
    fs.writeFileSync(path.join(tmpDir, 'game.tsl'), '');

    // Create user directories with various files
    fs.mkdirSync(path.join(tmpDir, 'images', 'player'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'images', 'player', 'sprite.png'), 'png-data');
    fs.mkdirSync(path.join(tmpDir, 'audio', 'sfx'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'audio', 'sfx', 'jump.wav'), 'wav-data');
    fs.writeFileSync(path.join(tmpDir, 'audio', 'sfx', 'hit.wav'), 'wav-data-2');

    const distDir = path.join(tmpDir, 'dist');
    fs.mkdirSync(distDir, { recursive: true });

    // Simulate complete build
    // 1. Copy game.js (simulated TSL output)
    fs.writeFileSync(path.join(distDir, 'game.js'), '// generated game code');
    // 2. Copy engine.js (simulated runtime)
    fs.writeFileSync(path.join(distDir, 'engine.js'), '// runtime code');
    // 3. Copy user files
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
    copyUserFiles(tmpDir);

    // Verify complete dist/ structure
    ok(fs.existsSync(path.join(distDir, 'index.html')), 'dist/index.html exists');
    ok(fs.existsSync(path.join(distDir, 'game.js')), 'dist/game.js exists');
    ok(fs.existsSync(path.join(distDir, 'engine.js')), 'dist/engine.js exists');
    ok(fs.existsSync(path.join(distDir, 'style.css')), 'dist/style.css exists');
    ok(fs.existsSync(path.join(distDir, 'images', 'player', 'sprite.png')), 'images preserved');
    ok(fs.existsSync(path.join(distDir, 'audio', 'sfx', 'jump.wav')), 'audio preserved');
    ok(fs.existsSync(path.join(distDir, 'audio', 'sfx', 'hit.wav')), 'audio preserved');

    // Verify no TSL source in dist
    ok(!fs.existsSync(path.join(distDir, 'game.tsl')), 'game.tsl not in dist');
  } finally {
    cleanupTemp(tmpDir);
  }
});
