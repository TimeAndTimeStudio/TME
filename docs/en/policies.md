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



