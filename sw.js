/* Math Practice — offline service worker (cache-first) */
var CACHE = 'cole-math-v7';
var ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/config.js',
  './js/profiles.js',
  './js/storage.js',
  './js/sync.js',
  './js/app.js',
  './js/progress.js',
  './js/dashboard.js',
  './js/draw.js',
  './js/game.js',
  './js/questions/index.js',
  './js/questions/set1.js',
  './js/questions/taya.js',
  './js/questions/guest.js',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon.svg'
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
        try {
          var url = new URL(req.url);
          if (url.origin === self.location.origin && res && res.ok) {
            var copy = res.clone();
            caches.open(CACHE).then(function (cache) {
              cache.put(req, copy);
            });
          }
        } catch (e) {}
        return res;
      }).catch(function () {
        if (req.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
