// PWA-ready service worker – network-only, no caching
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Nuke any cache this origin ever created
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));

    // Take control immediately
    await self.clients.claim();

    // Best-effort: tell browser not to reuse the SW script from disk
    // (only effective on supporting browsers, harmless elsewhere)
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

const BYPASS = [
  'traffictorch.workers.dev',
  'static.cloudflareinsights.com',
  'static.addtoany.com',
  'stripe.network',
  'stripe.com',
  'googletagmanager.com',
  'google-analytics.com',
  'googlesyndication.com',
];

self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.method !== 'GET') return;

  const url = req.url;
  if (BYPASS.some(h => url.includes(h))) return;

  // Navigation requests must NOT be cloned with custom cache options
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() =>
        new Response('Offline', { status: 503, statusText: 'Offline' })
      )
    );
    return;
  }

  // Non-navigation GETs: force a fresh network fetch
  event.respondWith(
    fetch(req, { cache: 'no-store' }).catch(() =>
      new Response('Offline', { status: 503, statusText: 'Offline' })
    )
  );
});