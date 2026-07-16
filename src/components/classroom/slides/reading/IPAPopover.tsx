// Small floating bubble that shows the IPA transcription for the last-
// clicked word. Deliberately minimal — the student wants pronunciation, not
// a full dictionary card.
'use client';
import { useEffect, useRef } from 'react';
import type { WordLookupResult } from './WordLookup';

interface Props {
  word: string | null;
  result: WordLookupResult | null;
  loading: boolean;
  error: string | null;
  anchor: { x: number; y: number } | null;
  onClose: () => void;
}

export default function IPAPopover({ word, result, loading, error, anchor, onClose }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!(e.target instanceof Node)) return;
      if (!rootRef.current.contains(e.target)) onClose();
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  if (!word || !anchor) return null;

  // Clamp X so the bubble doesn't fall off the right edge (rough: 240 wide).
  const maxX = typeof window !== 'undefined' ? window.innerWidth - 260 : anchor.x;
  const x = Math.min(anchor.x, maxX);
  const y = Math.max(12, anchor.y - 12);

  return (
    <div
      ref={rootRef}
      className="fixed z-50 rounded-2xl bg-gradient-to-br from-[#5A3D7A] to-[#7B5EA7] text-white shadow-2xl px-4 py-3 min-w-[220px] max-w-[260px]"
      style={{ left: x, top: y, transform: 'translateY(-100%)' }}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/70 mb-0.5">IPA</p>
      <p className="font-serif text-base font-bold leading-tight truncate mb-1">{word}</p>

      {loading && <div className="h-6 w-24 bg-white/20 rounded animate-pulse" />}

      {error && <p className="text-[11px] text-red-200">{error}</p>}

      {!loading && !error && result && (
        result.phonetic ? (
          <p className="font-mono text-xl leading-tight text-[#FFE6A6]">{result.phonetic}</p>
        ) : (
          <p className="text-[11px] italic text-white/70">Sin transcripción disponible.</p>
        )
      )}

      <div
        aria-hidden
        className="absolute left-4 -bottom-1.5 w-3 h-3 bg-[#7B5EA7] rotate-45"
      />
    </div>
  );
}
