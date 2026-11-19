// FriendlyTeaching.cl — Service Worker Registration Hook
//
// Registers the shell service worker and — crucially — auto-reloads the
// page when a newer service worker takes over. Without this, users who
// had the old v7 SW installed keep receiving its cached HTML navigations
// after a deploy, so UI fixes look "not deployed" to them even though the
// server is serving the new build.
'use client';
import { useEffect } from 'react';

export function useServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    // If a new SW took control after page load, reload once so the user
    // picks up the fresh HTML immediately. Guard so we only reload once
    // per page life.
    let reloadedOnce = false;
    const onControllerChange = () => {
      if (reloadedOnce) return;
      reloadedOnce = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    // Register after page load to avoid blocking initial render
    const onLoad = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[FT] Service worker registered, scope:', reg.scope);
          // Poll for updates so a long-open tab eventually picks up a
          // new deploy without the user having to close it.
          reg.update().catch(() => { /* non-critical */ });
          setInterval(() => { reg.update().catch(() => {}); }, 60_000);

          // If a waiting worker is already installed, ask it to activate
          // immediately — controllerchange above will then trigger reload.
          if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });

          reg.addEventListener('updatefound', () => {
            const nw = reg.installing;
            if (!nw) return;
            nw.addEventListener('statechange', () => {
              if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                // There's an active controller, so this is an update (not
                // first install). Nudge the new SW to skip waiting.
                nw.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          });
        })
        .catch((err) => {
          console.warn('[FT] Service worker registration failed:', err);
        });
    };
    window.addEventListener('load', onLoad);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      window.removeEventListener('load', onLoad);
    };
  }, []);
}
