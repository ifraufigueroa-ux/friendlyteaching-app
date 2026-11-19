// FriendlyTeaching.cl — Service Worker
// Minimal shell cache. We DO NOT cache Next.js chunks nor HTML navigations:
// each deploy changes chunk hashes, and stale HTML pointing at missing
// chunks was causing ChunkLoadError across the app. Next already fingerprints
// its static assets, so the browser cache handles /_next/* correctly on its
// own — the SW only precaches a few icon/manifest files.

const CACHE_NAME = 'ft-cache-v9';

// Allow the page to force this worker to activate immediately. Paired
// with the controllerchange auto-reload in useServiceWorker so users
// stuck on an older SW get bumped to the current build on next poll.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
const PRECACHE_URLS = [
  '/manifest.json',
  '/logo-friendlyteaching.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Purge every previous cache version on activate. Also take over any
// clients still controlled by the old SW so the next fetch goes through
// the new rules immediately.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never intercept Next.js build output, HTML navigations, APIs, or Firebase.
  // Letting the browser go to the network means a new deploy is picked up on
  // the next navigation without stale chunk references.
  if (request.mode === 'navigate') return;
  if (url.pathname.startsWith('/_next/')) return;
  if (url.pathname.startsWith('/api/')) return;
  if (url.hostname.includes('firestore') || url.hostname.includes('googleapis')) return;

  // Only cache a tiny set of static shell assets (icons, manifest, logos).
  if (PRECACHE_URLS.includes(url.pathname) ||
      url.pathname.match(/\.(png|jpe?g|svg|ico|webmanifest)$/)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
  }
});
