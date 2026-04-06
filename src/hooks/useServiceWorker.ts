// FriendlyTeaching.cl — Service Worker Registration Hook
'use client';
import { useEffect } from 'react';

export function useServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    // Register after page load to avoid blocking initial render
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[FT] Service worker registered, scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[FT] Service worker registration failed:', err);
        });
    });
  }, []);
}
