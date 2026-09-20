/**
 * TEMF Runtime Loader - Auto-detect WebGPU support
 * 
 * Copyright (C) 2026 Time And Time Studio
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 * 
 * Date: 20/09/2026
 */

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
