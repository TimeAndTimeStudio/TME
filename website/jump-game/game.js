setOrientation("landscape");
let player = { x: 100, y: 400, vy: 0 };
let JUMP_FORCE = 300;
let GRAVITY = 800;
let GROUND = 400;
function update(dt) {
  if ((input.keyboard.is_down("space") || touch.tap())) {
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
  let W = canvasSize.width;
  let H = canvasSize.height;
  GROUND = (H - 50);
  rect(0, GROUND, W, 50, "brown");
  rect(player.x, player.y, 50, 50, "blue");
  if (input.keyboard.is_down("f11")) {
    requestFullscreen();
  }
}
fps(60);
setGame({ update: update, draw: draw });
start();
