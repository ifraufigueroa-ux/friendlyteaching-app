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
'use client';
import { useEffect, useState, useCallback } from 'react';

export type SlideThemeMode = 'light' | 'dark';

const keyFor = (slideType: string) => `ft-slide-theme:${slideType}`;

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

  // Rehydrate from localStorage after mount so SSR + first paint match.
  useEffect(() => {
    if (!supported) { setMode('light'); return; }
    setMode(readInitial(slideType, 'dark'));
  }, [slideType, supported]);

  const toggle = useCallback(() => {
    if (!supported) return;
    setMode(prev => {
      const next: SlideThemeMode = prev === 'dark' ? 'light' : 'dark';
      try { window.localStorage.setItem(keyFor(slideType), next); } catch { /* ignore */ }
      return next;
    });
  }, [slideType, supported]);

  return { mode, toggle, supported };
}
