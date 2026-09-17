# Preload

Preload resources (images, BGM, SFX) with status checking system.

## preload(resources)

Load specified resources in advance.

```tsl
# Load a single file
preload("img/bg.png")

# Load multiple files (auto-detect type)
preload([
  "img/bg.png",
  "img/character.png",
  "music/bgm.mp3",
  "sfx/click.wav"
])

# Specify types explicitly
preload({
  images: ["img/bg.png", "img/char.png"],
  bgm: ["music/menu.mp3"],
  sfx: ["sfx/jump.wav"]
})
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `resources` | `string \| string[] \| object` | File path(s) or object with `images`, `bgm`, `sfx` arrays |

## checkpreload()

Check if all resources have finished loading (returns `true` / `false`).

```tsl
preload(["img/bg.png", "music/bgm.mp3"])

while not checkpreload():
  # Show loading screen
  rect(0, 0, 800, 600, "#000000")
  print("Loading...")

print("Loading complete!")
```

## preloadfailed()

Check if any files failed to load (returns `true` if failed, `false` if all succeeded).

```tsl
preload(["img/bg.png", "music/bgm.mp3"])

while not checkpreload():
  rect(0, 0, 800, 600, "#000000")

if preloadfailed():
  print("Some files failed to load!")
  # Retry
  preload(["img/bg.png", "music/bgm.mp3"])
  while not checkpreload():
    rect(0, 0, 800, 600, "#000000")
else:
  print("All files loaded successfully!")
```

## preloadisloaded(path)

Check if a specific file has finished loading (returns `true` / `false`).

```tsl
preload(["img/bg.png", "music/bgm.mp3", "sfx/click.wav"])

while not checkpreload():
  rect(0, 0, 800, 600, "#000000")

if preloadisloaded("img/bg.png"):
  print("Background is ready")
else:
  print("Background not loaded yet")

if preloadisloaded("music/bgm.mp3"):
  audio.play("music/bgm.mp3", "bgm")
else:
  print("BGM not ready yet")
```

## Full Example: Loading Screen

```tsl
function init():
  # Load all resources
  preload([
    "img/bg.png",
    "img/character.png",
    "music/bgm.mp3",
    "sfx/click.wav",
    "sfx/explosion.wav"
  ])

function update(dt):
  # Wait for loading to complete
  if not checkpreload():
    return
  
  # Check if any files failed
  if preloadfailed():
    # Retry loading
    preload([
      "img/bg.png",
      "img/character.png",
      "music/bgm.mp3",
      "sfx/click.wav",
      "sfx/explosion.wav"
    ])
    return
  
  # All loaded successfully
  print("Game Ready!")

function draw():
  if not checkpreload():
    # Show loading screen
    rect(0, 0, 800, 600, "#000000")
    print("Loading...")
    
    # Show progress
    rect(100, 300, 600, 20, "#333333")
    rect(100, 300, 600 * progress, 20, "#FF5733")
  else:
    # Show game
    rect(0, 0, 800, 600, "#87CEEB")
    image("img/character.png", 100, 200)
```
