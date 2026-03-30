export const features = {
  popover: () => typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype,
  anchorPositioning: () => CSS && (CSS.supports?.('anchor-name: --a') || CSS.supports?.('position-anchor: --a')),
  viewTransitions: () => typeof document !== 'undefined' && 'startViewTransition' in document,
  clipboardRead: () => !!(navigator.clipboard && navigator.clipboard.readText),
  clipboardWrite: () => !!(navigator.clipboard && navigator.clipboard.writeText),
  storage: () => {
    try { localStorage.setItem('__t','1'); localStorage.removeItem('__t'); return true; } catch { return false; }
  },
  audio: () => typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined',
  sw: () => 'serviceWorker' in navigator
};