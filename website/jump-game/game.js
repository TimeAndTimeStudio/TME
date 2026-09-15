let player = { x: 100, y: 400, vy: 0 };
let JUMP_FORCE = 300;
let GRAVITY = 800;
let GROUND = 400;
function update(dt) {
  if (input.keyboard.is_down("space")) {
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
  rect(0, GROUND, 800, 50, "brown");
  rect(player.x, player.y, 50, 50, "blue");
}
start("startBtn");
