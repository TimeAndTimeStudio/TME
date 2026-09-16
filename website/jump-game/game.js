let player = { x: 100, y: 400, vy: 0 };
let JUMP_FORCE = 300;
let GRAVITY = 800;
let GROUND = 400;
let W = 1920;
function handleFullscreenExit() {
  print("Exited fullscreen!");
}
setFullscreenCallback(handleFullscreenExit);
function update(dt) {
  if ((key("space") || touch.down(0))) {
    player.vy = (0 - JUMP_FORCE);
  }
  player.vy = (player.vy + (GRAVITY * dt));
  player.y = (player.y + (player.vy * dt));
  if ((player.y > GROUND)) {
    player.y = GROUND;
    player.vy = 0;
  }
}
function draw() {
  let canvasSize = getCanvasSize();
  W = canvasSize.width;
  rect(0, GROUND, W, 50, "#8B4513");
  rect(player.x, player.y, 50, 50, "#0000FF");
}
fps(60);
setGame({ update: update, draw: draw });
