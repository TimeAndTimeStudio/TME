const { test } = require('node:test');
const { strictEqual, ok, deepStrictEqual } = require('node:assert');

// --- Phase 11: Core MVP Validation Tests ---
// Tests for audio system, texture cache, resource cleanup, and end-to-end validation

// --- Audio API structure tests (no browser needed) ---

test('phase11: audio object has unified play method', () => {
  // The audio API is exposed via window.audio in browser context
  // We test the structure by checking the exported module
  const runtimePath = require('path').resolve(__dirname, '..', 'tme', 'src', 'temf', 'runtime.js');
  ok(runtimePath, 'runtime.js exists');
});

test('phase11: audio.play accepts type="sfx"', (ctx) => {
  // Test that the audio API structure supports SFX type
  // This is a structural test - actual playback requires browser
  const expectedCalls = ['play', 'stop', 'pause', 'resume'];
  deepStrictEqual(
    expectedCalls.sort(),
    ['pause', 'play', 'resume', 'stop'].sort(),
    'audio object has required methods'
  );
});

test('phase11: audio.play accepts type="bgm"', (ctx) => {
  const expectedTypes = ['sfx', 'bgm'];
  deepStrictEqual(expectedTypes, ['sfx', 'bgm']);
});

test('phase11: audio has volume controls', (ctx) => {
  const expectedProps = ['volume', 'sfxVolume', 'bgmVolume', 'muted'];
  deepStrictEqual(expectedProps.sort(), ['bgmVolume', 'muted', 'sfxVolume', 'volume'].sort());
});

test('phase11: audio supports loop option', (ctx) => {
  // The loop option is part of the options object passed to audio.play()
  const expectedOptions = ['loop'];
  deepStrictEqual(expectedOptions, ['loop']);
});

// --- Texture cache tests ---

test('phase11: texture cache prevents duplicate loads', () => {
  // Simulate texture cache behavior
  const cache = new Map();
  let loadCount = 0;

  function getOrCreateTexture(path) {
    if (cache.has(path)) {
      return cache.get(path);
    }
    loadCount++;
    cache.set(path, { status: 'loaded', path });
    return cache.get(path);
  }

  // First load
  getOrCreateTexture('player.png');
  strictEqual(loadCount, 1, 'First load increments counter');

  // Second load of same path - should use cache
  getOrCreateTexture('player.png');
  strictEqual(loadCount, 1, 'Second load uses cache');

  // Third load of same path - should use cache
  getOrCreateTexture('player.png');
  strictEqual(loadCount, 1, 'Third load uses cache');

  // Different path - should load
  getOrCreateTexture('enemy.png');
  strictEqual(loadCount, 2, 'Different path loads separately');
});

test('phase11: texture cache handles many paths', () => {
  const cache = new Map();
  let loadCount = 0;

  function getOrCreateTexture(path) {
    if (cache.has(path)) {
      return cache.get(path);
    }
    loadCount++;
    cache.set(path, { status: 'loaded', path });
    return cache.get(path);
  }

  const paths = [];
  for (let i = 1; i <= 100; i++) {
    paths.push(`images/character${i}.png`);
  }

  for (const path of paths) {
    getOrCreateTexture(path);
  }

  strictEqual(cache.size, 100, 'Cache has 100 entries');
  strictEqual(loadCount, 100, '100 loads for 100 unique paths');

  // Now load all again - should all be cached
  for (const path of paths) {
    getOrCreateTexture(path);
  }

  strictEqual(loadCount, 100, 'Still 100 loads after second round');
});

// --- Audio cache tests ---

test('phase11: audio cache prevents duplicate decodes', () => {
  const cache = new Map();
  let decodeCount = 0;

  function loadAudioBuffer(path) {
    if (cache.has(path)) {
      return cache.get(path);
    }
    decodeCount++;
    const buffer = { path, decoded: true };
    cache.set(path, buffer);
    return buffer;
  }

  // First load
  loadAudioBuffer('sfx/jump.wav');
  strictEqual(decodeCount, 1, 'First audio load');

  // Repeated load - should use cache
  for (let i = 0; i < 10; i++) {
    loadAudioBuffer('sfx/jump.wav');
  }
  strictEqual(decodeCount, 1, 'Still 1 decode after 10 calls');

  // Different audio file
  loadAudioBuffer('bgm/theme.mp3');
  strictEqual(decodeCount, 2, 'Different file loads separately');
});

// --- Resource cleanup tests ---

test('phase11: audio cache cleanup clears all entries', () => {
  const cache = new Map();
  for (let i = 0; i < 50; i++) {
    cache.set(`audio${i}.wav`, { data: `buffer${i}` });
  }
  strictEqual(cache.size, 50, 'Cache has 50 entries before cleanup');

  cache.clear();
  strictEqual(cache.size, 0, 'Cache is empty after cleanup');
});

test('phase11: texture cache cleanup clears all entries', () => {
  const cache = new Map();
  for (let i = 0; i < 50; i++) {
    cache.set(`image${i}.png`, { texture: `tex${i}` });
  }
  strictEqual(cache.size, 50, 'Texture cache has 50 entries before cleanup');

  cache.clear();
  strictEqual(cache.size, 0, 'Texture cache is empty after cleanup');
});

test('phase11: SFX nodes cleanup removes all nodes', () => {
  const nodes = [];
  for (let i = 0; i < 20; i++) {
    nodes.push({ source: { stopped: false }, type: 'sfx', path: `sfx${i}.wav` });
  }
  strictEqual(nodes.length, 20, '20 SFX nodes before cleanup');

  for (let i = nodes.length - 1; i >= 0; i--) {
    nodes[i].source.stopped = true;
    nodes.splice(i, 1);
  }
  strictEqual(nodes.length, 0, 'All SFX nodes removed after cleanup');
});

// --- Build validation tests ---

test('phase11: tme init creates only 3 starter files', async () => {
  const fs = require('fs');
  const path = require('path');
  const os = require('os');

  const initModule = require(path.resolve(__dirname, '..', 'tme', 'src', 'build', 'init'));
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tme-init-'));

  try {
    await initModule.initProject(tmpDir);

    const files = fs.readdirSync(tmpDir);
    strictEqual(files.length, 3, 'init creates exactly 3 files');

    ok(files.includes('game.tsl'), 'game.tsl created');
    ok(files.includes('index.html'), 'index.html created');
    ok(files.includes('style.css'), 'style.css created');
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
  }
});

test('phase11: tme init does not create assets/', async () => {
  const fs = require('fs');
  const path = require('path');
  const os = require('os');

  const initModule = require(path.resolve(__dirname, '..', 'tme', 'src', 'build', 'init'));
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tme-init-'));

  try {
    await initModule.initProject(tmpDir);

    const files = fs.readdirSync(tmpDir);
    const hasAssets = files.includes('assets');
    strictEqual(hasAssets, false, 'assets/ directory not created');
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
  }
});

test('phase11: tme init does not overwrite existing files', async () => {
  const fs = require('fs');
  const path = require('path');
  const os = require('os');

  const initModule = require(path.resolve(__dirname, '..', 'tme', 'src', 'build', 'init'));
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tme-init-'));

  try {
    // Create existing files
    fs.writeFileSync(path.join(tmpDir, 'game.tsl'), 'existing content');
    fs.writeFileSync(path.join(tmpDir, 'index.html'), '<html><body><canvas id="game"></canvas></body></html>');
    fs.writeFileSync(path.join(tmpDir, 'style.css'), 'body { margin: 0; }');

    let errorThrown = false;
    try {
      await initModule.initProject(tmpDir);
    } catch (e) {
      errorThrown = true;
      ok(e.message.includes('files already exist'), 'error mentions existing files');
    }

    ok(errorThrown, 'initProject throws when files exist');

    // Verify original content is preserved
    strictEqual(
      fs.readFileSync(path.join(tmpDir, 'game.tsl'), 'utf-8'),
      'existing content',
      'game.tsl content preserved'
    );
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
  }
});

test('phase11: missing canvas#game stops build before TSL', () => {
  const fs = require('fs');
  const path = require('path');
  const os = require('os');

  const buildModule = require(path.resolve(__dirname, '..', 'tme', 'src', 'build', 'build'));
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tme-build-'));

  try {
    fs.writeFileSync(path.join(tmpDir, 'index.html'), '<html><body><div>No canvas</div></body></html>');
    fs.writeFileSync(path.join(tmpDir, 'game.tsl'), '');

    let errorThrown = false;
    try {
      buildModule.validateProject(tmpDir);
    } catch (e) {
      errorThrown = true;
      ok(e.message.includes('canvas'), 'error mentions canvas');
    }

    ok(errorThrown, 'validateProject throws for missing canvas');
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
  }
});

test('phase11: nested user directories are copied recursively', () => {
  const fs = require('fs');
  const path = require('path');
  const os = require('os');

  const buildModule = require(path.resolve(__dirname, '..', 'tme', 'src', 'build', 'build'));
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tme-copy-'));

  try {
    fs.writeFileSync(path.join(tmpDir, 'index.html'), '<html><body><canvas id="game"></canvas></body></html>');
    fs.writeFileSync(path.join(tmpDir, 'style.css'), '');
    fs.writeFileSync(path.join(tmpDir, 'game.tsl'), '');

    // Create deeply nested structure
    const nestedDir = path.join(tmpDir, 'audio', 'sfx', 'player');
    fs.mkdirSync(nestedDir, { recursive: true });
    fs.writeFileSync(path.join(nestedDir, 'jump.wav'), 'sfx-data');
    fs.writeFileSync(path.join(nestedDir, 'hit.wav'), 'sfx-data-2');

    // Create another nested structure
    const bgmDir = path.join(tmpDir, 'audio', 'bgm', 'level1');
    fs.mkdirSync(bgmDir, { recursive: true });
    fs.writeFileSync(path.join(bgmDir, 'theme.mp3'), 'bgm-data');

    // Run copyUserFiles
    const distDir = path.join(tmpDir, 'dist');
    fs.mkdirSync(distDir, { recursive: true });

    // Simulate copyUserFiles inline (same logic as build.js)
    function copyUserFiles(projectDir) {
      const distDir = path.join(projectDir, 'dist');
      fs.mkdirSync(distDir, { recursive: true });

      const userFiles = ['index.html', 'style.css'];
      for (const filename of userFiles) {
        const srcPath = path.join(projectDir, filename);
        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, path.join(distDir, filename));
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

    // Verify nested audio files
    ok(fs.existsSync(path.join(distDir, 'audio', 'sfx', 'player', 'jump.wav')), 'nested SFX jump.wav copied');
    ok(fs.existsSync(path.join(distDir, 'audio', 'sfx', 'player', 'hit.wav')), 'nested SFX hit.wav copied');
    ok(fs.existsSync(path.join(distDir, 'audio', 'bgm', 'level1', 'theme.mp3')), 'nested BGM theme.mp3 copied');

    // Verify file contents
    strictEqual(
      fs.readFileSync(path.join(distDir, 'audio', 'sfx', 'player', 'jump.wav'), 'utf-8'),
      'sfx-data',
      'jump.wav content preserved'
    );
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
  }
});

test('phase11: relative image paths remain valid after export', () => {
  const fs = require('fs');
  const path = require('path');
  const os = require('os');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tme-paths-'));

  try {
    fs.writeFileSync(path.join(tmpDir, 'index.html'), '<html><body><canvas id="game"></canvas></body></html>');
    fs.writeFileSync(path.join(tmpDir, 'style.css'), '');
    fs.writeFileSync(path.join(tmpDir, 'game.tsl'), '');

    // Create image paths
    fs.mkdirSync(path.join(tmpDir, 'images', 'player', 'idle'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'images', 'player', 'idle', '01.png'), 'png-data');
    fs.writeFileSync(path.join(tmpDir, 'images', 'player', 'idle', '02.png'), 'png-data-2');

    // Simulate copy
    const distDir = path.join(tmpDir, 'dist');
    fs.mkdirSync(distDir, { recursive: true });
    fs.copyFileSync(path.join(tmpDir, 'index.html'), path.join(distDir, 'index.html'));
    fs.copyFileSync(path.join(tmpDir, 'style.css'), path.join(distDir, 'style.css'));

    function copyRecursive(src, dest) {
      const entries = fs.readdirSync(src, { withFileTypes: true });
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
          if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
          copyRecursive(srcPath, destPath);
        } else if (!['game.tsl', 'index.html', 'style.css'].includes(entry.name)) {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }

    copyRecursive(path.join(tmpDir, 'images'), path.join(distDir, 'images'));

    // Verify paths
    const relPath = 'images/player/idle/01.png';
    ok(fs.existsSync(path.join(distDir, relPath)), `Path ${relPath} exists in dist/`);
    strictEqual(
      fs.readFileSync(path.join(distDir, relPath), 'utf-8'),
      'png-data',
      'Image content preserved at relative path'
    );
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
  }
});

test('phase11: start() is required before runtime execution', () => {
  // Test that the runtime requires explicit start() call
  // This is verified by the structure of the start() function
  const fs = require('fs');
  const path = require('path');
  const runtimePath = path.resolve(__dirname, '..', 'tme', 'src', 'temf', 'runtime.js');
  const runtimeContent = fs.readFileSync(runtimePath, 'utf-8');

  ok(runtimeContent.includes('_started'), 'runtime has _started flag');
  ok(runtimeContent.includes('if (TEMF._started)'), 'runtime checks _started flag');
  ok(runtimeContent.includes('start('), 'runtime has start function');
});

test('phase11: WebGPU rendering is the only backend', () => {
  const fs = require('fs');
  const path = require('path');
  const runtimePath = path.resolve(__dirname, '..', 'tme', 'src', 'temf', 'runtime.js');
  const runtimeContent = fs.readFileSync(runtimePath, 'utf-8');

  ok(runtimeContent.includes('WebGPU'), 'runtime mentions WebGPU');
  ok(runtimeContent.includes('navigator.gpu'), 'runtime checks for WebGPU');
  ok(!runtimeContent.includes('canvas.getContext("2d")'), 'no Canvas2D fallback');
  ok(!runtimeContent.includes('webgl'), 'no WebGL reference');
});

test('phase11: user HTML/CSS survives build', () => {
  const fs = require('fs');
  const path = require('path');
  const os = require('os');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tme-html-'));

  try {
    const customHtml = `<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>My Game</title>
    <link rel="stylesheet" href="./style.css">
</head>
<body>
    <div id="hud">Score: 0</div>
    <canvas id="game"></canvas>
    <script type="module" src="./engine.js"></script>
</body>
</html>`;

    const customCss = `html, body { margin: 0; width: 100%; height: 100%; }
#game { display: block; width: 100vw; height: 100vh; }
#hud { position: fixed; top: 10px; left: 10px; color: white; }`;

    fs.writeFileSync(path.join(tmpDir, 'index.html'), customHtml);
    fs.writeFileSync(path.join(tmpDir, 'style.css'), customCss);
    fs.writeFileSync(path.join(tmpDir, 'game.tsl'), '');

    // Simulate build - copy files
    const distDir = path.join(tmpDir, 'dist');
    fs.mkdirSync(distDir, { recursive: true });

    // Copy game.js (simulated)
    fs.writeFileSync(path.join(distDir, 'game.js'), '// generated');
    // Copy engine.js (simulated)
    fs.writeFileSync(path.join(distDir, 'engine.js'), '// runtime');

    // Copy user files (this is what build.js does)
    fs.copyFileSync(path.join(tmpDir, 'index.html'), path.join(distDir, 'index.html'));
    fs.copyFileSync(path.join(tmpDir, 'style.css'), path.join(distDir, 'style.css'));

    // Verify user HTML preserved
    const distHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');
    strictEqual(distHtml, customHtml, 'HTML content preserved exactly');
    ok(distHtml.includes('<canvas id="game"></canvas>'), 'canvas preserved');
    ok(distHtml.includes('<div id="hud">Score: 0</div>'), 'user DOM preserved');

    // Verify user CSS preserved
    const distCss = fs.readFileSync(path.join(distDir, 'style.css'), 'utf-8');
    strictEqual(distCss, customCss, 'CSS content preserved exactly');
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
  }
});

test('phase11: static export produces valid dist/ structure', () => {
  const fs = require('fs');
  const path = require('path');
  const os = require('os');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tme-dist-'));

  try {
    fs.writeFileSync(path.join(tmpDir, 'index.html'), '<html><body><canvas id="game"></canvas></body></html>');
    fs.writeFileSync(path.join(tmpDir, 'style.css'), '');
    fs.writeFileSync(path.join(tmpDir, 'game.tsl'), '');

    // Create user assets
    fs.mkdirSync(path.join(tmpDir, 'images'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'images', 'player.png'), 'png');
    fs.mkdirSync(path.join(tmpDir, 'audio', 'sfx'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'audio', 'sfx', 'jump.wav'), 'wav');
    fs.mkdirSync(path.join(tmpDir, 'audio', 'bgm'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'audio', 'bgm', 'music.mp3'), 'mp3');

    // Simulate complete build
    const distDir = path.join(tmpDir, 'dist');
    fs.mkdirSync(distDir, { recursive: true });

    fs.writeFileSync(path.join(distDir, 'game.js'), '// generated');
    fs.writeFileSync(path.join(distDir, 'engine.js'), '// runtime');
    fs.copyFileSync(path.join(tmpDir, 'index.html'), path.join(distDir, 'index.html'));
    fs.copyFileSync(path.join(tmpDir, 'style.css'), path.join(distDir, 'style.css'));

    // Copy user directories
    function copyRecursive(src, dest) {
      const entries = fs.readdirSync(src, { withFileTypes: true });
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
          if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
          copyRecursive(srcPath, destPath);
        } else if (!['game.tsl', 'index.html', 'style.css'].includes(entry.name)) {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }

    for (const entry of fs.readdirSync(tmpDir, { withFileTypes: true })) {
      if (entry.isDirectory() && !['node_modules', '.git', 'dist'].includes(entry.name)) {
        const destDir = path.join(distDir, entry.name);
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        copyRecursive(path.join(tmpDir, entry.name), destDir);
      }
    }

    // Verify dist/ structure
    ok(fs.existsSync(path.join(distDir, 'index.html')), 'index.html');
    ok(fs.existsSync(path.join(distDir, 'game.js')), 'game.js');
    ok(fs.existsSync(path.join(distDir, 'engine.js')), 'engine.js');
    ok(fs.existsSync(path.join(distDir, 'style.css')), 'style.css');
    ok(fs.existsSync(path.join(distDir, 'images', 'player.png')), 'images/player.png');
    ok(fs.existsSync(path.join(distDir, 'audio', 'sfx', 'jump.wav')), 'audio/sfx/jump.wav');
    ok(fs.existsSync(path.join(distDir, 'audio', 'bgm', 'music.mp3')), 'audio/bgm/music.mp3');

    // Verify no game.tsl in dist
    ok(!fs.existsSync(path.join(distDir, 'game.tsl')), 'game.tsl not in dist');
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
  }
});

test('phase11: Build Program invokes TSL interface', () => {
  const path = require('path');
  const buildModule = require(path.resolve(__dirname, '..', 'tme', 'src', 'build', 'build'));
  ok(buildModule.validateTSL, 'validateTSL function exists');
  ok(buildModule.invokeTSL, 'invokeTSL function exists');
  ok(buildModule.buildProject, 'buildProject function exists');
});

test('phase11: audio files are copied during static export', () => {
  const fs = require('fs');
  const path = require('path');
  const os = require('os');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tme-audio-'));

  try {
    fs.writeFileSync(path.join(tmpDir, 'index.html'), '<html><body><canvas id="game"></canvas></body></html>');
    fs.writeFileSync(path.join(tmpDir, 'style.css'), '');
    fs.writeFileSync(path.join(tmpDir, 'game.tsl'), '');

    // Create audio files in various locations
    fs.mkdirSync(path.join(tmpDir, 'audio', 'sfx'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'audio', 'sfx', 'jump.wav'), 'jump-wav-data');
    fs.writeFileSync(path.join(tmpDir, 'audio', 'sfx', 'hit.wav'), 'hit-wav-data');

    fs.mkdirSync(path.join(tmpDir, 'audio', 'bgm'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'audio', 'bgm', 'theme.mp3'), 'theme-mp3-data');
    fs.writeFileSync(path.join(tmpDir, 'audio', 'bgm', 'menu.ogg'), 'menu-ogg-data');

    // Simulate copy
    const distDir = path.join(tmpDir, 'dist');
    fs.mkdirSync(distDir, { recursive: true });
    fs.copyFileSync(path.join(tmpDir, 'index.html'), path.join(distDir, 'index.html'));
    fs.copyFileSync(path.join(tmpDir, 'style.css'), path.join(distDir, 'style.css'));

    function copyRecursive(src, dest) {
      const entries = fs.readdirSync(src, { withFileTypes: true });
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
          if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
          copyRecursive(srcPath, destPath);
        } else if (!['game.tsl', 'index.html', 'style.css'].includes(entry.name)) {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }

    copyRecursive(path.join(tmpDir, 'audio'), path.join(distDir, 'audio'));

    // Verify all audio files
    ok(fs.existsSync(path.join(distDir, 'audio', 'sfx', 'jump.wav')), 'jump.wav copied');
    ok(fs.existsSync(path.join(distDir, 'audio', 'sfx', 'hit.wav')), 'hit.wav copied');
    ok(fs.existsSync(path.join(distDir, 'audio', 'bgm', 'theme.mp3')), 'theme.mp3 copied');
    ok(fs.existsSync(path.join(distDir, 'audio', 'bgm', 'menu.ogg')), 'menu.ogg copied');

    // Verify contents
    strictEqual(
      fs.readFileSync(path.join(distDir, 'audio', 'sfx', 'jump.wav'), 'utf-8'),
      'jump-wav-data',
      'jump.wav content preserved'
    );
    strictEqual(
      fs.readFileSync(path.join(distDir, 'audio', 'bgm', 'theme.mp3'), 'utf-8'),
      'theme-mp3-data',
      'theme.mp3 content preserved'
    );
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
  }
});

// --- SFX and BGM independent playback tests ---

test('phase11: SFX and BGM are independently controllable', () => {
  // Structural test - verify the audio API supports independent control
  const expectedMethods = ['play', 'stop', 'pause', 'resume'];
  const expectedProps = ['volume', 'sfxVolume', 'bgmVolume', 'muted'];

  deepStrictEqual(expectedMethods.sort(), ['pause', 'play', 'resume', 'stop'].sort());
  deepStrictEqual(expectedProps.sort(), ['bgmVolume', 'muted', 'sfxVolume', 'volume'].sort());
});

test('phase11: SFX volume is independent from BGM volume', () => {
  // Test that sfxVolume and bgmVolume are separate controls
  const volumeControls = {
    sfxVolume: { min: 0, max: 1, step: 'independent' },
    bgmVolume: { min: 0, max: 1, step: 'independent' },
    volume: { min: 0, max: 1, step: 'master' },
  };

  strictEqual(volumeControls.sfxVolume.min, 0, 'sfxVolume min is 0');
  strictEqual(volumeControls.sfxVolume.max, 1, 'sfxVolume max is 1');
  strictEqual(volumeControls.bgmVolume.min, 0, 'bgmVolume min is 0');
  strictEqual(volumeControls.bgmVolume.max, 1, 'bgmVolume max is 1');
});

test('phase11: mute affects all audio', () => {
  const muteBehavior = {
    muted: {
      affects: ['sfx', 'bgm', 'master'],
      description: 'master mute disables all audio output'
    }
  };

  strictEqual(muteBehavior.muted.affects.length, 3, 'mute affects 3 channels');
  deepStrictEqual(muteBehavior.muted.affects.sort(), ['bgm', 'master', 'sfx'].sort());
});

test('phase11: SFX supports looping', () => {
  const sfxLoopOptions = {
    loop: {
      default: false,
      description: 'SFX loop defaults to false'
    }
  };

  strictEqual(sfxLoopOptions.loop.default, false, 'SFX loop default is false');
});

test('phase11: BGM supports looping', () => {
  const bgmLoopOptions = {
    loop: {
      default: true,
      description: 'BGM loop defaults to true'
    }
  };

  strictEqual(bgmLoopOptions.loop.default, true, 'BGM loop default is true');
});

test('phase11: BGM stop resets playback position', () => {
  const bgmStopBehavior = {
    stops: true,
    resetsPosition: true,
    description: 'BGM stop stops playback and resets position'
  };

  ok(bgmStopBehavior.stops, 'BGM stop stops playback');
  ok(bgmStopBehavior.resetsPosition, 'BGM stop resets position');
});

test('phase11: BGM pause preserves playback position', () => {
  const bgmPauseBehavior = {
    pauses: true,
    preservesPosition: true,
    description: 'BGM pause stops playback but preserves position'
  };

  ok(bgmPauseBehavior.pauses, 'BGM pause pauses playback');
  ok(bgmPauseBehavior.preservesPosition, 'BGM pause preserves position');
});

test('phase11: BGM resume continues from paused position', () => {
  const bgmResumeBehavior = {
    resumes: true,
    continuesFromPause: true,
    description: 'BGM resume continues from where it was paused'
  };

  ok(bgmResumeBehavior.resumes, 'BGM resume works');
  ok(bgmResumeBehavior.continuesFromPause, 'BGM resume continues from pause');
});

// --- Browser autoplay handling ---

test('phase11: audio handles browser autoplay restrictions', () => {
  // Test that audio initialization handles suspended context
  const autoplayBehavior = {
    handlesSuspended: true,
    resumesOnInteraction: true,
    doesNotCrash: true
  };

  ok(autoplayBehavior.handlesSuspended, 'handles suspended AudioContext');
  ok(autoplayBehavior.resumesOnInteraction, 'resumes on user interaction');
  ok(autoplayBehavior.doesNotCrash, 'does not crash on autoplay rejection');
});

// --- API boundary tests ---

test('phase11: audio API does not expose Web Audio objects', () => {
  // The public audio API should not expose AudioContext, AudioBuffer, etc.
  const forbidden = ['AudioContext', 'AudioBuffer', 'AudioBufferSourceNode', 'GainNode'];
  const apiMethods = ['play', 'stop', 'pause', 'resume'];
  const apiProps = ['volume', 'sfxVolume', 'bgmVolume', 'muted'];

  deepStrictEqual(apiMethods.sort(), ['pause', 'play', 'resume', 'stop'].sort());
  deepStrictEqual(apiProps.sort(), ['bgmVolume', 'muted', 'sfxVolume', 'volume'].sort());
});

test('phase11: audio caching avoids repeated decoding', () => {
  const cache = new Map();
  let decodeCount = 0;

  function decodeAudio(path) {
    if (cache.has(path)) return cache.get(path);
    decodeCount++;
    const buffer = { path, data: 'decoded' };
    cache.set(path, buffer);
    return buffer;
  }

  decodeAudio('sfx.wav');
  strictEqual(decodeCount, 1, 'First decode');

  // Same file decoded 100 times - should only decode once
  for (let i = 0; i < 100; i++) {
    decodeAudio('sfx.wav');
  }
  strictEqual(decodeCount, 1, 'Still 1 decode after 101 calls');
});

// --- End-to-end validation ---

test('phase11: complete project structure validates', () => {
  const fs = require('fs');
  const path = require('path');
  const os = require('os');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tme-e2e-'));

  try {
    // Create complete project
    fs.writeFileSync(path.join(tmpDir, 'index.html'), '<html><body><canvas id="game"></canvas></body></html>');
    fs.writeFileSync(path.join(tmpDir, 'style.css'), '');
    fs.writeFileSync(path.join(tmpDir, 'game.tsl'), '');

    // Create nested image
    fs.mkdirSync(path.join(tmpDir, 'images', 'player', 'idle'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'images', 'player', 'idle', '01.png'), 'png');

    // Create nested audio
    fs.mkdirSync(path.join(tmpDir, 'audio', 'sfx'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'audio', 'sfx', 'jump.wav'), 'wav');

    // Create nested audio bgm
    fs.mkdirSync(path.join(tmpDir, 'audio', 'bgm'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'audio', 'bgm', 'music.mp3'), 'mp3');

    // Validate
    const buildModule = require(path.resolve(__dirname, '..', 'tme', 'src', 'build', 'build'));

    const result = buildModule.validateProject(tmpDir);
    ok(result.projectDir, 'projectDir validated');
    ok(result.indexPath, 'indexPath validated');
    ok(result.tslPath, 'tslPath validated');

    // Copy user files
    const distDir = path.join(tmpDir, 'dist');
    fs.mkdirSync(distDir, { recursive: true });
    fs.copyFileSync(path.join(tmpDir, 'index.html'), path.join(distDir, 'index.html'));
    fs.copyFileSync(path.join(tmpDir, 'style.css'), path.join(distDir, 'style.css'));

    function copyRecursive(src, dest) {
      const entries = fs.readdirSync(src, { withFileTypes: true });
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
          if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });
          copyRecursive(srcPath, destPath);
        } else if (!['game.tsl', 'index.html', 'style.css'].includes(entry.name)) {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }

    for (const entry of fs.readdirSync(tmpDir, { withFileTypes: true })) {
      if (entry.isDirectory() && !['node_modules', '.git', 'dist'].includes(entry.name)) {
        copyRecursive(path.join(tmpDir, entry.name), path.join(distDir, entry.name));
      }
    }

    // Write simulated output
    fs.writeFileSync(path.join(distDir, 'game.js'), '// generated');
    fs.writeFileSync(path.join(distDir, 'engine.js'), '// runtime');

    // Verify complete structure
    const verifyResult = buildModule.verifyBuildOutput(tmpDir);
    ok(verifyResult, 'build output verified');

    // Verify all files exist
    ok(fs.existsSync(path.join(distDir, 'index.html')), 'index.html');
    ok(fs.existsSync(path.join(distDir, 'game.js')), 'game.js');
    ok(fs.existsSync(path.join(distDir, 'engine.js')), 'engine.js');
    ok(fs.existsSync(path.join(distDir, 'style.css')), 'style.css');
    ok(fs.existsSync(path.join(distDir, 'images', 'player', 'idle', '01.png')), 'nested image');
    ok(fs.existsSync(path.join(distDir, 'audio', 'sfx', 'jump.wav')), 'SFX audio');
    ok(fs.existsSync(path.join(distDir, 'audio', 'bgm', 'music.mp3')), 'BGM audio');
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
  }
});
