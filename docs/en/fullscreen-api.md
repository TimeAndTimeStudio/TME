# Fullscreen API

Fullscreen mode management and exit callback system.

## getCanvasSize()

Get current canvas size (including DPR).

```javascript
function draw():
  size = getCanvasSize()
  W = size.width
  H = size.height
  # Use W, H for positioning
  rect(0, H-50, W, 50, "brown")
```

## requestFullscreen()

Enter fullscreen mode.

```javascript
# Press F11
if input.keyboard.is_down("f11"):
  requestFullscreen()
```

## exitFullscreen()

Exit fullscreen mode.

```javascript
# Press ESC (browser does automatically)
# Or press button on screen
if input.keyboard.is_down("escape"):
  exitFullscreen()
```

## setFullscreenCallback()

Register a function when exiting fullscreen.

```javascript
function onFullscreenExit():
  print("Exited fullscreen!")
  # Do something: pause game, show menu, etc.

setFullscreenCallback(onFullscreenExit)
```

### Example: Show menu when exiting fullscreen

```javascript
fullscreenMenu = { visible: false }

function onExitFullscreen():
  fullscreenMenu.visible = true

setFullscreenCallback(onExitFullscreen)

function draw():
  if fullscreenMenu.visible:
    # Draw menu
    rect(0, 0, 800, 600, "rgba(0,0,0,0.8)")
    text("Press Enter to return to game", 100, 300)
    
    if input.keyboard.is_down("enter"):
      fullscreenMenu.visible = false
      requestFullscreen()
```
