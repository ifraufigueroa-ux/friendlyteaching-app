// FriendlyTeaching.cl — Friendlytext®: End screen
//
// Cinematic finale mirroring FriendlyricsEndSlide + the Friendlyflix
// end feel. Floating book / paper glyphs, warm amber accent on deep
// slate, "powered by Friendlytext®" bug.
'use client';
import type { Slide } from '@/types/firebase';

interface Props { slide: Slide }

const FLOATERS = ['📖', '📚', '✒', '📜', '📄', '🕮', '🔖', '📃'];

export default function FriendlytextEndSlide({ slide }: Props) {
  const txt = slide.textData;

  return (
    <div className="relative flex flex-col items-center justify-center h-full min-h-[420px] overflow-hidden bg-gradient-to-br from-[#0D1826] via-[#1B2C3F] to-[#2C4159] p-8 text-white text-center">

      {/* ── Floating glyph background ───────────────────────────── */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        {FLOATERS.map((g, i) => (
          <span
            key={i}
            className="absolute text-2xl md:text-3xl opacity-15 select-none"
            style={{
              left:  `${8 + (i * 11) % 84}%`,
              top:   `${10 + (i * 17) % 78}%`,
              animation: `fteFloat ${6 + (i % 3) * 2}s ease-in-out ${i * 0.4}s infinite`,
            }}
          >
            {g}
          </span>
        ))}
      </div>

      {/* Warm amber glow behind the trophy — echoes the reading light */}
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full pointer-events-none opacity-30"
        style={{ background: 'radial-gradient(circle, #E8B547 0%, transparent 60%)' }}
      />

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-lg">

        {/* Trophy card */}
        <div
          className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-[#E8B547] to-[#C89234] flex items-center justify-center shadow-[0_20px_60px_rgba(232,181,71,0.4)] border-4 border-white/20"
          style={{ animation: 'fteBadgePop 700ms cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
        >
          <span className="text-5xl">📖</span>
          <span
            aria-hidden
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-lg font-bold shadow-lg"
            style={{ animation: 'fteBadgePop 700ms cubic-bezier(0.34, 1.56, 0.64, 1) 400ms both' }}
          >
            ✓
          </span>
        </div>

        <div className="space-y-2" style={{ animation: 'fteRise 700ms ease-out 250ms both' }}>
          <p className="text-4xl md:text-5xl">🎉</p>
          <h1 className="font-serif text-3xl md:text-4xl font-black drop-shadow-lg tracking-tight leading-tight">
            {slide.title ?? '¡Lección completada!'}
          </h1>
          {txt && (
            <div className="pt-2 space-y-1">
              <p className="text-white/85 text-base font-semibold">{txt.title}</p>
              <p className="text-white/55 text-sm italic">— {txt.source}</p>
            </div>
          )}
        </div>

        {/* Powered-by bug */}
        <div
          className="mt-6 inline-flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/20 shadow-lg"
          style={{ animation: 'fteRise 700ms ease-out 500ms both' }}
        >
          <span className="text-2xl">📖</span>
          <div className="text-left">
            <p className="text-[10px] text-white/55 uppercase tracking-[0.25em]">Powered by</p>
            <p className="font-extrabold text-lg text-white tracking-tight">
              FriendlyTales<sup className="text-xs">®</sup>
            </p>
          </div>
        </div>

        <p
          className="text-white/35 text-xs mt-2 tracking-widest uppercase"
          style={{ animation: 'fteRise 700ms ease-out 700ms both' }}
        >
          FriendlyTeaching.cl
        </p>
      </div>

      <style>{`
        @keyframes fteFloat {
          0%, 100% { transform: translateY(0) rotate(-4deg); }
          50%      { transform: translateY(-14px) rotate(4deg); }
        }
        @keyframes fteBadgePop {
          0%   { transform: scale(0.4) rotate(-15deg); opacity: 0; }
          70%  { transform: scale(1.1) rotate(3deg);   opacity: 1; }
          100% { transform: scale(1) rotate(0);        opacity: 1; }
        }
        @keyframes fteRise {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
}
