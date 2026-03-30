const CACHE = 'web-lab-v1';
const ASSETS = [
  './',
  './index.html',
  './404.html',
  './styles/base.css',
  './styles/themes.css',
  './styles/components.css',
  './scripts/app.js',
  './scripts/router.js',
  './scripts/utils.js',
  './scripts/feature-detect.js',
  './elements/x-lab-nav.js',
  './elements/x-demo-card.js',
  './elements/x-popover-tip.js',
  './elements/x-command-palette.js',
  './elements/x-fractal-canvas.js',
  './elements/x-synth-pad.js',
  './elements/x-signal-graph.js',
  './elements/x-storage-explorer.js',
  './elements/x-clipboard-lab.js',
  './pages/elements.html',
  './pages/apis.html',
  './pages/about.html',
  './manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k === CACHE ? null : caches.delete(k))));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  event.respondWith((async () => {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;

    try {
      const fresh = await fetch(request);
      const cache = await caches.open(CACHE);
      cache.put(request, fresh.clone());
      return fresh;
    } catch {
      // Offline fallback for navigations
      if (request.mode === 'navigate') return caches.match('./404.html');
      return cached;
    }
  })());
});