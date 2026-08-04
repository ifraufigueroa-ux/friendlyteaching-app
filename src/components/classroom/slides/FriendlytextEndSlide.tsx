// FriendlyTeaching.cl — FriendlyTales®: End screen (Cinematic Mystery)
//
// Deep purple void + gold medallion + neon magenta pulse. Mirrors the
// Cover slide's editorial palette so opening and closing frames of the
// story feel like part of the same cinematic universe.
'use client';
import type { Slide } from '@/types/firebase';

interface Props { slide: Slide }

const FLOATERS = ['✦', '✧', '✵', '📖', '📜', '🔖', '★', '❋'];

export default function FriendlytextEndSlide({ slide }: Props) {
  const txt = slide.textData;

  return (
    <div
      className="relative flex flex-col items-center justify-center h-full min-h-[420px] overflow-hidden p-8 text-center"
      style={{
        background: 'radial-gradient(circle at 50% 20%, #25133A 0%, #0F0A1C 100%)',
        color: '#F8F5FC',
      }}
    >

      {/* ── Floating glyph background ───────────────────────────── */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        {FLOATERS.map((g, i) => (
          <span
            key={i}
            className="absolute text-2xl md:text-3xl opacity-25 select-none text-[#F9F0A8]"
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

      {/* Neon magenta glow behind the medallion — cinematic finale */}
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full pointer-events-none opacity-40"
        style={{ background: 'radial-gradient(circle, #EC008C 0%, transparent 60%)' }}
      />
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full pointer-events-none opacity-30"
        style={{ background: 'radial-gradient(circle, #F9F0A8 0%, transparent 55%)' }}
      />

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center gap-6 max-w-lg">

        {/* Medallion — gold face, magenta ring, cyan check */}
        <div
          className="relative w-24 h-24 rounded-3xl flex items-center justify-center border-4"
          style={{
            background: 'linear-gradient(135deg, #F9F0A8, #E8B547)',
            borderColor: 'rgba(236, 0, 140, 0.65)',
            boxShadow: '0 20px 60px rgba(236, 0, 140, 0.5), 0 0 40px rgba(249,240,168,0.4)',
            animation: 'fteBadgePop 700ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
          }}
        >
          <span className="text-5xl">📖</span>
          <span
            aria-hidden
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full text-[#0F0A1C] flex items-center justify-center text-lg font-bold"
            style={{
              background: '#7ED6E0',
              boxShadow: '0 0 18px rgba(126,214,224,0.8)',
              animation: 'fteBadgePop 700ms cubic-bezier(0.34, 1.56, 0.64, 1) 400ms both',
            }}
          >
            ✓
          </span>
        </div>

        <div className="space-y-2" style={{ animation: 'fteRise 700ms ease-out 250ms both' }}>
          <p className="text-4xl md:text-5xl">🎉</p>
          <h1
            className="text-3xl md:text-4xl font-black tracking-tight leading-tight"
            style={{
              fontFamily: 'var(--font-cinzel), Cinzel, Georgia, serif',
              color: '#F9F0A8',
              textShadow: '0 2px 24px rgba(15,10,28,0.85), 0 0 32px rgba(249,240,168,0.25)',
            }}
          >
            {slide.title ?? '¡Lección completada!'}
          </h1>
          {txt && (
            <div className="pt-2 space-y-1">
              <p className="text-[#F8F5FC] text-base font-semibold">{txt.title}</p>
              <p className="text-[#A69BB8] text-sm italic">— {txt.source}</p>
            </div>
          )}
        </div>

        {/* Powered-by bug */}
        <div
          className="mt-6 inline-flex items-center gap-3 rounded-2xl px-5 py-3 border"
          style={{
            background: 'rgba(30, 20, 50, 0.75)',
            borderColor: 'rgba(236, 0, 140, 0.4)',
            backdropFilter: 'blur(12px)',
            animation: 'fteRise 700ms ease-out 500ms both',
          }}
        >
          <span className="text-2xl">📖</span>
          <div className="text-left">
            <p className="text-[10px] text-[#A69BB8] uppercase tracking-[0.25em]">Powered by</p>
            <p
              className="font-extrabold text-lg tracking-tight"
              style={{ color: '#F9F0A8', fontFamily: 'var(--font-cinzel), Cinzel, Georgia, serif' }}
            >
              FriendlyTales<sup className="text-xs">®</sup>
            </p>
          </div>
        </div>

        <p
          className="text-[#A69BB8]/60 text-xs mt-2 tracking-widest uppercase"
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
