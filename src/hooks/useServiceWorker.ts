// FriendlyTeaching.cl — Service Worker Registration Hook
//
// The current /sw.js is a kill-switch: it unregisters itself on activate
// and drops every cache. We still register it once so existing stuck
// clients pick it up and self-destruct. New users who arrive with no SW
// never install one, since the kill-switch unregisters immediately.
'use client';
import { useEffect } from 'react';

export function useServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    // If there's already a controlling SW, register once so any update
    // to /sw.js (the kill-switch) installs and tears things down.
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) {
        // There's already a registration — poke it to update to the
        // kill-switch version if it hasn't yet.
        reg.update().catch(() => { /* non-critical */ });
        return;
      }
      // No registration at all — register once to pick up the kill-switch
      // (it'll immediately unregister itself on activate).
      navigator.serviceWorker.register('/sw.js').catch(() => { /* non-critical */ });
    });
  }, []);
}
