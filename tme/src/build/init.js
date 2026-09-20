#!/usr/bin/env node

/**
 * TME Init Program
 * 
 * Copyright (C) 2026 Time And Time Studio
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 * 
 * Date: 20/09/2026
 */

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
    'game.tsl': `function update(dt):
  pass

function draw():
  pass

fps(60)
setGame({update: update, draw: draw})`,
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

    <script type="module" src="./temf.js"></script>
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
