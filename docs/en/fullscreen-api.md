# Fullscreen API

## `requestFullscreen()`

Enter fullscreen mode.

```javascript
# Press F11
if key("f11"):
  requestFullscreen()
```

## `exitFullscreen()`

Exit fullscreen mode.

```javascript
# Press ESC (browser does automatically)
# Or press button on screen
if key("escape"):
  exitFullscreen()
```

## `setFullscreenCallback(callback)`

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

    if key("enter"):
      fullscreenMenu.visible = false
      requestFullscreen()
```
