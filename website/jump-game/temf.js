'use strict';

// TEMF Runtime Loader - Auto-detect WebGPU support

(function() {
  if (typeof window === 'undefined') return;

  if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
    try {
      const adapter = navigator.gpu.requestAdapter();
      if (adapter) {
        adapter.then((a) => {
          if (a) {
            import('./temf-webgpu.js');
            return;
          }
          import('./temf-webgl.js');
        }).catch(() => {
          import('./temf-webgl.js');
        });
        return;
      }
    } catch (e) {}
  }

  import('./temf-webgl.js');
})();
