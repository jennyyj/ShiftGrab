const CACHE_NAME = 'shiftgrab-cache-v1';
const urlsToCache = [
  './',
  './login.html',
  './register.html',
  './stylesSG.css',
  './scriptSG.js',
  './shiftgrab.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
