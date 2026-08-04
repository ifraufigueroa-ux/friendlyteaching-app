// FriendlyTeaching.cl — Per-slide theme toggle button (FriendlyTales only)
//
// Small floating pill placed in the top-right corner of any FriendlyTales
// slide that supports the light/dark override. Uses `useSlideThemeMode`
// under the hood so persistence + brand gating live in one place.
'use client';
import { useSlideThemeMode, type SlideThemeMode } from '@/lib/hooks/useSlideThemeMode';

interface Props {
  slideType: string;
  brand?: string;
  onChange?: (mode: SlideThemeMode) => void;
  className?: string;
}

export default function SlideThemeToggle({ slideType, brand, onChange, className }: Props) {
  const { mode, toggle, supported } = useSlideThemeMode(slideType, brand);
  if (!supported) return null;

  const isDark = mode === 'dark';

  return (
    <button
      type="button"
      onClick={() => { toggle(); onChange?.(isDark ? 'light' : 'dark'); }}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo cinematográfico'}
      className={[
        'absolute top-4 right-4 z-30 inline-flex items-center gap-1.5 rounded-full',
        'px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em]',
        'transition-all backdrop-blur',
        isDark
          ? 'bg-[rgba(30,20,50,0.75)] border border-[#F9F0A8]/40 text-[#F9F0A8] hover:bg-[rgba(236,0,140,0.20)] hover:border-[#EC008C]'
          : 'bg-white/85 border border-[#C8A8DC]/50 text-[#5A3D7A] hover:bg-white shadow-sm',
        className ?? '',
      ].join(' ')}
    >
      <span>{isDark ? '🌙' : '☀️'}</span>
      <span>{isDark ? 'Cinematic' : 'Original'}</span>
    </button>
  );
}
