# Public API

## `start()`
Initiates the game lifecycle. Before `start()`, no game loop or rendering runs. After `start()`, the engine enters the fixed-timestep update cycle.

## `update(dt)`
Called every frame with delta time. Used for game logic, physics, and state updates.

## `draw()`
Called after `update()`. Queues render commands for WebGPU execution.

## `fps(target)`
Sets the target frame rate for the fixed timestep loop.
