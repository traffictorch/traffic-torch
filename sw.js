// PWA-ready service worker – network-only, no caching
self.addEventListener('install', (event) => {
  // Activate the new SW as soon as it installs
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of all open clients immediately + clean any leftover caches
  event.waitUntil(
    (async () => {
      // Delete every cache this origin ever created (safe because we don't want any)
      const keys = await caches.keys();
      await Promise.all(keys.map(key => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

// Optional: allow the page to force skipWaiting (useful for “Update available” UI)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Bypass Service Worker completely for these (lets browser + Cloudflare handle them)
  if (
    url.includes('traffictorch.workers.dev') ||
    url.includes('static.cloudflareinsights.com') ||
    url.includes('static.addtoany.com') ||
    url.includes('stripe.network') ||
    url.includes('stripe.com') ||
    url.includes('googletagmanager.com') ||
    url.includes('google-analytics.com') ||
    url.includes('googlesyndication.com')
  ) {
    return; // browser handles the request normally
  }

  // Everything else: pure network (no Cache API involvement)
  event.respondWith(fetch(event.request));
});