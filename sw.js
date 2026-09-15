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

  // Only handle GETs; let POST/PUT/etc. go straight to network
  if (req.method !== 'GET') return;

  const url = req.url;
  if (BYPASS.some(h => url.includes(h))) return; // browser handles it

  // Force a real network round-trip, bypass HTTP cache
  const fresh = new Request(req, {
    cache: 'no-store',
    // Keep credentials/headers; do NOT set mode (CORS stays as-is)
  });

  event.respondWith(
    fetch(fresh).catch(() => {
      // Offline: nothing cached, so just surface the error
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    })
  );
});