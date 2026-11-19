// FriendlyTeaching.cl — Service Worker
//
// KILL SWITCH. The v7/v8 service worker was caching HTML navigations and
// /_next/ chunks aggressively, trapping users like Carla on stale builds
// even after hard refreshes. Rather than keep patching a cache we don't
// really need, this worker's only job is to delete every cache and
// unregister itself. Browsers always re-check /sw.js on each navigation,
// so the next time a stuck client hits the site this runs once, nukes
// their state, reloads, and from then on the site is served without any
// service worker at all.

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      } catch { /* best effort */ }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      } catch { /* best effort */ }
      // Unregister self. New navigations stop being controlled by this
      // worker — they go straight to the network.
      try { await self.registration.unregister(); } catch { /* best effort */ }
      // Take over any clients still bound to the old worker and reload
      // them so they rehydrate against the new, un-SW'd origin.
      const clientsList = await self.clients.matchAll({ type: 'window' });
      for (const client of clientsList) {
        try { client.navigate(client.url); } catch { /* ignore */ }
      }
    })()
  );
});

// Pass-through fetch so nothing is served from cache while this worker
// is still briefly in control between install and unregister.
self.addEventListener('fetch', () => { /* noop — defer to network */ });
