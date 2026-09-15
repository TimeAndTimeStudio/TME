# Policies & Limitations

## Resource Policies
- **Image Loading**: On-demand only. No preloading.
- **Memory Management**: Automatic cleanup of textures, buffers, and audio when unreferenced.
- **Static Export**: No npm dependencies at runtime. Self-contained `dist/` package.

## MVP Limitations
- No ECS, scenes, cameras, physics, or animation systems.
- No text rendering, UI frameworks, or shader graphs.
- Single touch support for touch input.
- No gamepad or advanced gesture handling.

## GitHub & Deployment
- Push only to: `https://github.com/TimeAndTimeStudio/TME`
- Never push to `game` repository.
- Exclude local docs: `AGENTS.md`, `SPEC.md`, `project.md`, `phase.md`.
- Use official `LICENSE` from repository.
