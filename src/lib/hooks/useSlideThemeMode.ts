// FriendlyTeaching.cl — Per-slide theme override for FriendlyTales
//
// Every FriendlyTales slide can be flipped between the new Cinematic
// Mystery ("dark") look and the original Friendlyrics-style ("light")
// look. Preference is remembered per slide TYPE (not per lesson) so a
// teacher who prefers the light Predictions but the dark Cover gets
// exactly that across every FriendlyTales lesson.
//
// Only kicks in when brand === 'FriendlyTales'. For any other brand
// the hook returns 'light' and the toggle is a no-op — Friendlyrics
// and Friendlyflix never see cinematic overrides.
//
// IMPORTANT: several hook instances coexist on the same slide (the
// toggle button + the slide body both consume useSlideThemeMode). A
// module-level pub/sub keeps them in sync so pressing the button
// re-renders the slide without a remount.
'use client';
import { useEffect, useState, useCallback } from 'react';

export type SlideThemeMode = 'light' | 'dark';

const keyFor = (slideType: string) => `ft-slide-theme:${slideType}`;

// ─── Cross-instance sync (module singleton) ──────────────────────────
const listeners = new Map<string, Set<(m: SlideThemeMode) => void>>();

function subscribe(slideType: string, cb: (m: SlideThemeMode) => void) {
  let set = listeners.get(slideType);
  if (!set) { set = new Set(); listeners.set(slideType, set); }
  set.add(cb);
  return () => { set!.delete(cb); };
}

function broadcast(slideType: string, mode: SlideThemeMode) {
  listeners.get(slideType)?.forEach(cb => cb(mode));
}

// ─── Storage helper ──────────────────────────────────────────────────
function readInitial(slideType: string, defaultMode: SlideThemeMode): SlideThemeMode {
  if (typeof window === 'undefined') return defaultMode;
  try {
    const raw = window.localStorage.getItem(keyFor(slideType));
    if (raw === 'light' || raw === 'dark') return raw;
  } catch { /* ignore quota / private-mode */ }
  return defaultMode;
}

export function useSlideThemeMode(
  slideType: string,
  brand?: string,
): { mode: SlideThemeMode; toggle: () => void; supported: boolean } {
  const supported = brand === 'FriendlyTales';
  const defaultMode: SlideThemeMode = supported ? 'dark' : 'light';
  const [mode, setMode] = useState<SlideThemeMode>(defaultMode);

  // Rehydrate from localStorage + listen for cross-instance updates.
  useEffect(() => {
    if (!supported) { setMode('light'); return; }
    setMode(readInitial(slideType, 'dark'));
    const unsub = subscribe(slideType, next => setMode(next));
    return unsub;
  }, [slideType, supported]);

  const toggle = useCallback(() => {
    if (!supported) return;
    // Compute the next value from what's currently in storage so we don't
    // race against a stale closure over `mode`.
    const current = readInitial(slideType, 'dark');
    const next: SlideThemeMode = current === 'dark' ? 'light' : 'dark';
    try { window.localStorage.setItem(keyFor(slideType), next); } catch { /* ignore */ }
    broadcast(slideType, next);
  }, [slideType, supported]);

  return { mode, toggle, supported };
}
