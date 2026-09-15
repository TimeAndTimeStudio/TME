# Policies & Limitations

## Resource Policies

### Image Loading
- On-demand only. No preloading or caching of unused images.
- Images load asynchronously when first referenced.
- Textures cached using LRU strategy (max 64 textures).
- Old textures destroyed automatically when cache full.

### Memory Management
- Textures destroyed when evicted from cache.
- Audio buffers released when no longer referenced.
- SFX nodes cleaned up after playback ends.
- Call `TEMF.cleanupTextures()` to manually release all textures.
- Call `TEMF.cleanupAudio()` to manually release all audio resources.

### Static Export
- No npm dependencies at runtime.
- Self-contained `dist/` package.
- Loads local JavaScript modules directly in browser.

## MVP Limitations

### Not Implemented
- No ECS, entity/component systems
- No scene or camera management
- No physics or collision detection
- No animation framework
- No tilemap support
- No text/font rendering
- No UI framework
- No shader graphs or material systems
- No plugin architecture
- No dependency injection
- No global event bus

### Input Limitations
- Single touch support only
- No gamepad support
- No advanced gesture handling
- Mouse button parameter accepts number only (0, 1, 2)

### Rendering Limitations
- WebGPU only (no Canvas2D or WebGL fallback)
- Draw order determines depth (no z-buffer)
- Max 1024 rectangles per frame
- Max 1024 images per frame


