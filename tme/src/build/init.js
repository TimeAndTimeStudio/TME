#!/usr/bin/env node

'use strict';

const path = require('path');
const fs = require('fs');

const TSL_PATH = path.join(__dirname, '..', '..', '..', 'TSL', 'package.json');

function checkTSL() {
  const tslDir = path.join(__dirname, '..', '..', '..', 'TSL');
  if (!fs.existsSync(tslDir)) {
    throw new Error('TSL repository is missing. Please clone it: git clone https://github.com/TimeAndTimeStudio/TSL.git TSL');
  }
  if (!fs.existsSync(TSL_PATH)) {
    throw new Error('TSL repository is incomplete. Missing package.json in TSL/');
  }
}

async function initProject(projectDir) {
  projectDir = path.resolve(projectDir);

  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }

  checkTSL();

  const files = {
    'game.tsl': '',
    'index.html': `<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>My Game</title>
    <link rel="stylesheet" href="./style.css">
</head>
<body>
    <canvas id="game"></canvas>

    <script type="module" src="./engine.js"></script>
    <script type="module" src="./game.js"></script>
</body>
</html>
`,
    'style.css': `html, body {
    margin: 0;
    width: 100%;
    height: 100%;
}

body {
    overflow: hidden;
    background: #87CEEB;
}

#game {
    display: block;
    width: 100vw;
    height: 100vh;
}
`
  };

  const conflicts = [];
  for (const filename of Object.keys(files)) {
    const filepath = path.join(projectDir, filename);
    if (fs.existsSync(filepath)) {
      conflicts.push(filename);
    }
  }

  if (conflicts.length > 0) {
    throw new Error(`Cannot initialize: files already exist: ${conflicts.join(', ')}`);
  }

  for (const [filename, content] of Object.entries(files)) {
    const filepath = path.join(projectDir, filename);
    fs.writeFileSync(filepath, content, 'utf-8');
  }

  console.log(`Initialized TME project in: ${projectDir}`);
  console.log('Created: game.tsl, index.html, style.css');
}

module.exports = { initProject };
