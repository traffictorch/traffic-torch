// PWA-ready service worker – network-only, no caching
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    await self.clients.claim();
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

  // Only handle GETs; let POST/PUT/etc. pass through
  if (req.method !== 'GET') return;

  const url = req.url;
  if (BYPASS.some(h => url.includes(h))) return;

  // Navigation: never clone with custom options – just fetch normally
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() =>
        new Response('Offline', { status: 503, statusText: 'Offline' })
      )
    );
    return;
  }

  // Other GETs: force fresh network, bypass HTTP cache
  event.respondWith(
    fetch(req, { cache: 'no-store' }).catch(() =>
      new Response('Offline', { status: 503, statusText: 'Offline' })
    )
  );
});