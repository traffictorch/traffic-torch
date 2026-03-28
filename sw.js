// PWA-ready service worker (no offline caching as per specs)
self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Minimal Service Worker – bypass API calls and external resources to fix CORS/NetworkError
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Bypass Service Worker for:
  // 1. Your API (traffic-torch-api.traffictorch.workers.dev)
  // 2. Cloudflare Insights beacon
  // 3. Stripe (m.stripe.network)
  if (url.includes('traffic-torch-api.traffictorch.workers.dev') ||
      url.includes('static.cloudflareinsights.com') ||
      url.includes('stripe.network') ||
      url.includes('stripe.com')) {
    return; // Let browser handle directly – no interception
  }

  // Optional: simple cache-first for static assets only (keeps PWA benefits)
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});