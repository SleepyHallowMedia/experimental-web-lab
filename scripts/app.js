import { features } from './feature-detect.js';
import { initRouter } from './router.js';
import { $ } from './utils.js';

import '../elements/x-lab-nav.js';
import '../elements/x-demo-card.js';
import '../elements/x-popover-tip.js';
import '../elements/x-command-palette.js';
import '../elements/x-fractal-canvas.js';
import '../elements/x-synth-pad.js';
import '../elements/x-signal-graph.js';
import '../elements/x-storage-explorer.js';
import '../elements/x-clipboard-lab.js';

// Router
initRouter();

// Service Worker (PWA)
if (features.sw()){
  // Use base-aware URL so it works on GitHub Pages project subpaths
  const swUrl = new URL('../sw.js', import.meta.url);
  navigator.serviceWorker.register(swUrl).catch(()=>{});
}

// Theme persistence
const savedTheme = localStorage.getItem('theme');
if (savedTheme) document.documentElement.dataset.theme = savedTheme;

// Command palette open button
$('#openPalette')?.addEventListener('click', () => {
  document.querySelector('x-command-palette')?.open();
});

// Popover API fallback: if not supported, convert [popover] blocks to <dialog>
if (!features.popover()){
  for (const pop of document.querySelectorAll('[popover]')){
    // Replace popover element with dialog for basic fallback
    const dlg = document.createElement('dialog');
    dlg.className = pop.className;
    dlg.innerHTML = pop.innerHTML + `<form method="dialog"><button class="btn">Close</button></form>`;
    dlg.dataset.fallbackPopover = pop.id || '';
    pop.replaceWith(dlg);

    // Find matching popovertarget buttons and wire them
    const id = dlg.dataset.fallbackPopover;
    if (!id) continue;
    document.querySelectorAll(`[popovertarget="${id}"]`).forEach(btn => {
      btn.removeAttribute('popovertarget');
      btn.addEventListener('click', () => dlg.open ? dlg.close() : dlg.showModal());
    });
  }
}

// Log feature table in console (fun + helpful)
console.groupCollapsed('Web Lab Feature Detection');
for (const [k, fn] of Object.entries(features)){
  try { console.log(k, fn()); } catch { console.log(k, 'unknown'); }
}
console.groupEnd();