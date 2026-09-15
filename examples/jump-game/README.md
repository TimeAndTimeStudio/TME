# Jump Game — TME Example

Simple jumping game built with TME (Time Mini Engine).

## Play

Open `index.html` in a WebGPU-enabled browser.

## Controls

- **Space** — Jump

## Source

```tsl
# game.tsl
function update(dt):
  if input.keyboard.is_down("space"):
    player.vy = -300

  player.vy += 800 * dt
  player.y += player.vy * dt

  if player.y > 400:
    player.y = 400
    player.vy = 0

function draw():
  rect(0, 400, 800, 50, "brown")
  image("player.png", player.x, player.y, 50, 50)

start()
```

## Build

```bash
npx tme build
```

## License

GPL-3.0
