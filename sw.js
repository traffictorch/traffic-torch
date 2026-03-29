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

  // Bypass Service Worker for ALL Traffic Torch Workers + external services
  if (url.includes('traffictorch.workers.dev') || // catches ALL *.traffictorch.workers.dev
      url.includes('static.cloudflareinsights.com') ||
      url.includes('static.addtoany.com') ||
      url.includes('stripe.network') ||
      url.includes('stripe.com') ||
      url.includes('googletagmanager.com') ||      // ← Added to fix gtag.js error
      url.includes('google-analytics.com') ||      // ← Added
      url.includes('googlesyndication.com')) {     // ← Added
    return; // Let browser handle directly – prevents NetworkError + CORS issues
  }

  // Optional: simple cache-first for static assets only (keeps PWA benefits)
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});