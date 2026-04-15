// FriendlyTeaching.cl — Service Worker
// Provides offline caching for the PWA shell + key assets.

const CACHE_NAME = 'ft-cache-v3';
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/logo-friendlyteaching.jpg',
];

// ─── Install: precache shell ─────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ─── Activate: clean old caches ──────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch: network-first for navigations, cache-first for assets ──
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests and Firebase / API calls
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) return;
  if (url.hostname.includes('firestore') || url.hostname.includes('googleapis')) return;

  // Navigation requests: network-first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Static assets: cache-first with network fallback
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/) ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }
});
