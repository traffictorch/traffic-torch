// PWA-ready service worker (no offline caching as per specs)
self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // No caching; just pass through for PWA readiness
    event.respondWith(fetch(event.request));
});