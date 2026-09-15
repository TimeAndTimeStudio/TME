# Public API

## `start()`
Initiates the game lifecycle. Before `start()`, no game loop or rendering runs. After `start()`, the engine enters the fixed-timestep update cycle.

**Signature:**
```typescript
start(game: object, fps?: number): void
```

**Parameters:**
- `game` (object): The game object containing `update(dt)` and `draw()` methods.
- `fps` (number, optional): Target frames per second. Default is `60`.

**Example:**
```javascript
start({
  update(dt) {
    // Game logic here
  },
  draw() {
    // Rendering here
  }
}, 60);
```

## `update(dt)`
Called every frame with delta time. Used for game logic, physics, and state updates.

**Signature:**
```typescript
update(dt: number): void
```

**Parameters:**
- `dt` (number): Time elapsed since the last frame in seconds.

## `draw()`
Called after `update()`. Queues render commands for WebGPU execution.

**Signature:**
```typescript
draw(): void
```

## `fps(target)`
Sets the target frame rate for the fixed timestep loop.

**Signature:**
```typescript
fps(target: number): void
```

**Parameters:**
- `target` (number): Target frames per second.
