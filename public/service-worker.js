const CACHE_NAME = 'shiftgrab-cache-v1';
const urlsToCache = [
  '/',
  'public/login.html',
  'public/register.html',
  'public/stylesSG.css',
  'public/scriptSG.js',
  'public/claimShift.html'
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
