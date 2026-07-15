'use client';

import { useEffect, useState } from 'react';

type Variant = 'floating' | 'inline';

interface Props {
  variant?:  Variant;
  className?: string;
  title?:     string;
}

export default function FullscreenButton({
  variant = 'floating',
  className = '',
  title,
}: Props) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [supported,    setSupported]    = useState(true);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    setSupported(!!document.documentElement.requestFullscreen);
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  if (!supported) return null;

  function toggle() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  const label = isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa';

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={toggle}
        title={title ?? label}
        aria-label={label}
        className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-white bg-[#5A3D7A] border-2 border-[#5A3D7A] shadow-sm hover:bg-[#7B5EA7] hover:border-[#7B5EA7] active:scale-95 transition-all ${className}`}
      >
        <Icon expanded={isFullscreen} />
      </button>
    );
  }

  // floating (default)
  return (
    <button
      type="button"
      onClick={toggle}
      title={title ?? label}
      aria-label={label}
      className={`fixed top-3 right-3 z-50 w-11 h-11 rounded-full bg-[#5A3D7A] text-white border-2 border-white shadow-lg hover:bg-[#7B5EA7] hover:scale-105 active:scale-95 transition-all flex items-center justify-center ${className}`}
    >
      <Icon expanded={isFullscreen} />
    </button>
  );
}

function Icon({ expanded }: { expanded: boolean }) {
  if (expanded) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 4v3a2 2 0 0 1-2 2H4" />
        <path d="M15 4v3a2 2 0 0 0 2 2h3" />
        <path d="M9 20v-3a2 2 0 0 0-2-2H4" />
        <path d="M15 20v-3a2 2 0 0 1 2-2h3" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9V6a2 2 0 0 1 2-2h3" />
      <path d="M20 9V6a2 2 0 0 0-2-2h-3" />
      <path d="M4 15v3a2 2 0 0 0 2 2h3" />
      <path d="M20 15v3a2 2 0 0 1-2 2h-3" />
    </svg>
  );
}
