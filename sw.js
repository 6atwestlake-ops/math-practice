/* Cole Math Practice — offline service worker (cache-first) */
var CACHE = 'cole-math-v3';
var ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/config.js',
  './js/app.js',
  './js/storage.js',
  './js/sync.js',
  './js/progress.js',
  './js/game.js',
  './js/questions/index.js',
  './js/questions/set1.js',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        // Opportunistically cache same-origin GETs
        try {
          var url = new URL(req.url);
          if (url.origin === self.location.origin && res && res.ok) {
            var copy = res.clone();
            caches.open(CACHE).then(function (cache) {
              cache.put(req, copy);
            });
          }
        } catch (e) { /* ignore */ }
        return res;
      }).catch(function () {
        // Offline fallback to index for navigations
        if (req.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
