// FriendlyTeaching.cl — Friendlytext®: Cover
//
// Cinematic full-bleed cover for text-based CLT lessons. Mirrors the
// Friendlyflix ClipCoverSlide silhouette so the three products (music,
// clip, text) read as a family. Palette shifts to slate + amber to
// evoke books / paper / warm reading light rather than Netflix red.
'use client';
import type { Slide } from '@/types/firebase';

interface Props { slide: Slide }

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

const LEVEL_PALETTE: Record<string, { bg: string; ring: string }> = {
  A1:   { bg: '#059669', ring: '#6EE7B7' },
  A2:   { bg: '#10B981', ring: '#86EFAC' },
  B1:   { bg: '#F59E0B', ring: '#FCD34D' },
  'B1+':{ bg: '#EA580C', ring: '#FDBA74' },
  B2:   { bg: '#E50914', ring: '#FCA5A5' },
  C1:   { bg: '#9333EA', ring: '#D8B4FE' },
};
const DEFAULT_LEVEL = { bg: '#7C3AED', ring: '#C4B5FD' };

export default function TextCoverSlide({ slide }: Props) {
  const txt = slide.textData;
  const videoId = txt?.youtubeUrl ? extractVideoId(txt.youtubeUrl) : null;
  const imgSrc = txt?.posterUrl
    ?? (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null);

  const level = (slide.content ?? '').trim();
  const levelStyle = LEVEL_PALETTE[level] ?? DEFAULT_LEVEL;

  const title = txt?.title ?? slide.title ?? 'Text Lesson';
  const source = txt?.source ?? slide.subtitle;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0D1826] text-white">

      {/* ── Full-bleed background: poster or paper texture ─────────── */}
      {imgSrc ? (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${imgSrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'saturate(0.9) contrast(1.05)',
            animation: 'ftcCoverZoom 24s ease-in-out infinite alternate',
          }}
        />
      ) : (
        // No poster: layered radial glows in warm amber + slate so the
        // cover doesn't collapse to a flat rectangle.
        <>
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 30%, #2A3E5A 0%, #0D1826 60%)' }} />
          <div className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(ellipse at 75% 70%, #E8B547 0%, transparent 55%)' }} />
        </>
      )}

      {/* ── Cinematic gradient overlays ───────────────────────────── */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(13,24,38,0.35) 0%, rgba(13,24,38,0.10) 30%, rgba(13,24,38,0.75) 75%, rgba(13,24,38,0.95) 100%)' }}
      />
      <div className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(13,24,38,0.55) 100%)' }}
      />

      {/* ── Top row: brand mark + level pill ──────────────────────── */}
      <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-5 sm:p-7 z-10">
        <div className="flex items-center gap-3 sm:gap-4">
          <div
            className="relative flex-shrink-0 rounded-full overflow-hidden ring-2 ring-white/80 shadow-[0_0_24px_rgba(232,181,71,0.35)] bg-white/10 backdrop-blur-sm"
            style={{
              width: 'clamp(48px, 6vw, 64px)',
              height: 'clamp(48px, 6vw, 64px)',
              animation: 'ftcCoverFade 700ms ease-out both',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-friendlyteaching.jpg" alt="FriendlyTeaching Academy" className="w-full h-full object-cover" draggable={false} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] text-white/70 leading-none">
              FriendlyTeaching
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.25em] bg-[#E8B547] text-[#3A2A0F] px-3 py-1.5 rounded-sm shadow-lg shadow-amber-900/40 w-fit">
              <span className="text-sm leading-none">📖</span>
              FriendlyTales
            </span>
          </div>
        </div>
        {level && (
          <span
            className="inline-flex items-center text-[11px] font-extrabold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full text-white border-2 backdrop-blur-sm shadow-lg"
            style={{ background: `${levelStyle.bg}CC`, borderColor: levelStyle.ring }}
          >
            Level · {level}
          </span>
        )}
      </div>

      {/* ── Centre stage: source · title · subtitle ────────────────── */}
      <div className="relative z-10 h-full flex flex-col items-center justify-end px-6 sm:px-12 pb-16 sm:pb-24 text-center gap-4 max-w-5xl mx-auto">
        {source && (
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.35em] text-[#E8B547]/95"
            style={{ animation: 'ftcCoverFade 900ms ease-out 100ms both' }}
          >
            {source}
          </span>
        )}
        <h1
          className="font-serif text-4xl sm:text-6xl md:text-7xl font-black leading-[0.95] tracking-tight drop-shadow-2xl"
          style={{
            textShadow: '0 4px 24px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.4)',
            animation: 'ftcCoverRise 900ms cubic-bezier(0.22, 1, 0.36, 1) 200ms both',
          }}
        >
          {title}
        </h1>
      </div>

      {/* ── Footer: Read & Learn CTA ─────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center pb-6 sm:pb-8 z-10">
        <span
          className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-white/75 border border-white/20 rounded-full px-4 py-2 backdrop-blur-sm bg-white/5"
          style={{ animation: 'ftcCoverPulse 2.6s ease-in-out infinite' }}
        >
          <span className="w-2 h-2 rounded-full bg-[#E8B547] shadow-[0_0_12px_rgba(232,181,71,0.9)]" />
          Comprehension made easy
        </span>
      </div>

      <style>{`
        @keyframes ftcCoverZoom {
          from { transform: scale(1);    }
          to   { transform: scale(1.06); }
        }
        @keyframes ftcCoverRise {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes ftcCoverFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes ftcCoverPulse {
          0%, 100% { opacity: 0.65; transform: translateY(0);    }
          50%      { opacity: 1;    transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
}
