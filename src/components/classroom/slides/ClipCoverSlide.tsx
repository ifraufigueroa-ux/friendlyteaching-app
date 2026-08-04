// FriendlyTeaching.cl — Friendlyflix: Cover
//
// Cinematic full-bleed cover replacing the generic CoverSlide for
// clip-based lessons. Uses the same red Netflix-style palette as the
// Comprehension slide so the cover reads as part of the same product,
// not the generic CLT curriculum.
'use client';
import type { Slide } from '@/types/firebase';

interface Props { slide: Slide; source?: string }

const LEVEL_PALETTE: Record<string, { bg: string; ring: string }> = {
  A1:   { bg: '#059669', ring: '#6EE7B7' },
  A2:   { bg: '#10B981', ring: '#86EFAC' },
  B1:   { bg: '#F59E0B', ring: '#FCD34D' },
  'B1+':{ bg: '#EA580C', ring: '#FDBA74' },
  B2:   { bg: '#E50914', ring: '#FCA5A5' },
  C1:   { bg: '#9333EA', ring: '#D8B4FE' },
};
const DEFAULT_LEVEL = { bg: '#7C3AED', ring: '#C4B5FD' };

function youtubeThumbnail(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null;
}

export default function ClipCoverSlide({ slide, source }: Props) {
  const level = (slide.content ?? '').trim();
  const levelStyle = LEVEL_PALETTE[level] ?? DEFAULT_LEVEL;
  const clipSource = source || slide.subtitle?.split('—')[0]?.trim();
  const backgroundImage =
    slide.imageUrl ||
    slide.clipData?.posterUrl ||
    youtubeThumbnail(slide.clipData?.youtubeUrl);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0A0A12] text-white">

      {/* ── Full-bleed thumbnail background ──────────────────────── */}
      {backgroundImage && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'saturate(1.05) contrast(1.05)',
            animation: 'fcCoverZoom 20s ease-in-out infinite alternate',
          }}
        />
      )}

      {/* ── Cinematic gradient overlay ───────────────────────────── */}
      {/* Two layers so the title area is legible without washing out
          the thumbnail: a bottom-heavy darken + a subtle side
          vignette that pulls attention to the centre. */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(10,10,18,0.35) 0%, rgba(10,10,18,0.10) 30%, rgba(10,10,18,0.75) 75%, rgba(10,10,18,0.95) 100%)' }}
      />
      <div className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(10,10,18,0.55) 100%)' }}
      />

      {/* ── Top row: FriendlyTeaching logo + Friendlyflix bug · level pill ── */}
      <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-5 sm:p-7 z-10">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Academy logo — parent brand, always present */}
          <div
            className="relative flex-shrink-0 rounded-full overflow-hidden ring-2 ring-white/80 shadow-[0_0_24px_rgba(255,255,255,0.35)] bg-white/10 backdrop-blur-sm"
            style={{
              width: 'clamp(48px, 6vw, 64px)',
              height: 'clamp(48px, 6vw, 64px)',
              animation: 'fcCoverFade 700ms ease-out both',
            }}
          >
            <img
              src="/logo-friendlyteaching.jpg"
              alt="FriendlyTeaching Academy"
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] text-white/70 leading-none">
              FriendlyTeaching
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.25em] bg-[#E50914] text-white px-3 py-1.5 rounded-sm shadow-lg shadow-red-900/50 w-fit">
              <span className="text-sm leading-none">▶</span>
              Friendlyflix
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

      {/* ── Centre stage: title + subtitle ───────────────────────── */}
      <div className="relative z-10 h-full flex flex-col items-center justify-end px-6 sm:px-12 pb-16 sm:pb-24 text-center gap-4 max-w-5xl mx-auto">
        {clipSource && (
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.35em] text-[#FF6B6B]/90"
            style={{ animation: 'fcCoverFade 900ms ease-out 100ms both' }}
          >
            {clipSource}
          </span>
        )}
        <h1
          className="text-4xl sm:text-6xl md:text-7xl font-black leading-[0.95] tracking-tight drop-shadow-2xl"
          style={{
            textShadow: '0 4px 24px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.4)',
            animation: 'fcCoverRise 900ms cubic-bezier(0.22, 1, 0.36, 1) 200ms both',
          }}
        >
          {slide.title}
        </h1>
        {slide.subtitle && (
          <p
            className="text-base sm:text-lg md:text-xl text-white/85 max-w-2xl leading-relaxed drop-shadow-lg"
            style={{ animation: 'fcCoverRise 900ms cubic-bezier(0.22, 1, 0.36, 1) 350ms both' }}
          >
            {slide.subtitle}
          </p>
        )}
      </div>

      {/* ── Footer: Watch & Learn CTA ────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center pb-6 sm:pb-8 z-10">
        <span
          className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-white/70 border border-white/20 rounded-full px-4 py-2 backdrop-blur-sm bg-white/5"
          style={{ animation: 'fcCoverPulse 2.6s ease-in-out infinite' }}
        >
          <span className="w-2 h-2 rounded-full bg-[#E50914] shadow-[0_0_12px_rgba(229,9,20,0.9)]" />
          Watch & Learn
        </span>
      </div>

      <style>{`
        @keyframes fcCoverZoom {
          from { transform: scale(1);    }
          to   { transform: scale(1.06); }
        }
        @keyframes fcCoverRise {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes fcCoverFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes fcCoverPulse {
          0%, 100% { opacity: 0.65; transform: translateY(0);    }
          50%      { opacity: 1;    transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
}
