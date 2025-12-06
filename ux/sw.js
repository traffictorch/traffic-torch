// PWA SW – Cache /ux/ Files (Local Paths)
const CACHE_NAME = 'quit-risk-ux-v2';
const urlsToCache = [
  '/ux/main.js',
  '/ux/styles.css',
  '/ux/manifest.json',
  '/style.css' // Global site styles
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});