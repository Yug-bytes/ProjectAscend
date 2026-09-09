const CACHE_NAME = 'project-ascend-v1';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/rocket.png',
  '/characters/architect_stage_1.png',
  '/characters/architect_stage_2.png',
  '/characters/architect_stage_3.png',
  '/characters/architect_stage_4.png',
  '/characters/catalyst_stage_1.png',
  '/characters/catalyst_stage_2.png',
  '/characters/catalyst_stage_3.png',
  '/characters/catalyst_stage_4.png',
  '/characters/sentinel_stage_1.png',
  '/characters/sentinel_stage_2.png',
  '/characters/sentinel_stage_3.png',
  '/characters/sentinel_stage_4.png',
  '/characters/vanguard_stage_1.png',
  '/characters/vanguard_stage_2.png',
  '/characters/vanguard_stage_3.png',
  '/characters/vanguard_stage_4.png',
  '/characters/scholar_stage_1.png',
  '/characters/scholar_stage_2.png',
  '/characters/scholar_stage_3.png',
  '/characters/scholar_stage_4.png',
  '/characters/pathfinder_stage_1.png',
  '/characters/pathfinder_stage_2.png',
  '/characters/pathfinder_stage_3.png',
  '/characters/pathfinder_stage_4.png',
  '/characters/artisan_stage_1.png',
  '/characters/artisan_stage_2.png',
  '/characters/artisan_stage_3.png',
  '/characters/artisan_stage_4.png',
  '/characters/paragon_stage_1.png',
  '/characters/paragon_stage_2.png',
  '/characters/paragon_stage_3.png',
  '/characters/paragon_stage_4.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pre-caching partial failure', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  // For navigation requests (pages), try network first, then cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request).then((res) => res || caches.match('/')))
    );
    return;
  }

  // For static assets, cache first, then network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse.status === 200 && request.url.startsWith(self.location.origin)) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback
          return null;
        });
    })
  );
});
