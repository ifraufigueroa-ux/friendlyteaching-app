// FriendlyTeaching.cl — FriendlyTales®: Cover (Cinematic Mystery)
//
// Full-bleed dark cinematic cover for text-based CLT lessons. Deep purple
// void + poster art dimmed by an editorial gradient + gold Cinzel title +
// neon magenta level pill. Companion to Friendlyflix ClipCoverSlide.
'use client';
import type { Slide } from '@/types/firebase';

interface Props { slide: Slide }

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

export default function TextCoverSlide({ slide }: Props) {
  const txt = slide.textData;
  const videoId = txt?.youtubeUrl ? extractVideoId(txt.youtubeUrl) : null;
  const imgSrc = txt?.posterUrl
    ?? (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null);

  const level = (slide.content ?? '').trim();

  const title = txt?.title ?? slide.title ?? 'Text Lesson';
  const source = txt?.source ?? slide.subtitle;

  return (
    <div
      className="relative h-full w-full overflow-hidden text-[#F8F5FC]"
      style={{
        background: 'radial-gradient(circle at 50% 20%, #25133A 0%, #0F0A1C 100%)',
        border: '1px solid rgba(236, 0, 140, 0.3)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
      }}
    >
      {/* ── Poster background (if available) ─────────────────────── */}
      {imgSrc && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(15,10,28,0.2) 0%, rgba(15,10,28,0.95) 100%), url(${imgSrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'saturate(1.05) contrast(1.05)',
            animation: 'ftcCoverZoom 24s ease-in-out infinite alternate',
          }}
        />
      )}

      {/* ── Cinematic radial vignette to focus attention ─────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 35%, rgba(15,10,28,0.7) 100%)' }}
      />

      {/* ── Top row: brand mark + level pill ──────────────────────── */}
      <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-5 sm:p-7 z-10">
        <div className="flex items-center gap-3 sm:gap-4">
          <div
            className="relative flex-shrink-0 rounded-full overflow-hidden ring-2 ring-[#F9F0A8]/60 shadow-[0_0_28px_rgba(249,240,168,0.35)] bg-white/10 backdrop-blur-sm"
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
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] text-[#A69BB8] leading-none">
              FriendlyTeaching
            </span>
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.25em] bg-[#F9F0A8] text-[#0F0A1C] px-3 py-1.5 rounded-sm w-fit"
              style={{ boxShadow: '0 0 24px rgba(249,240,168,0.35)' }}
            >
              <span className="text-sm leading-none">📖</span>
              FriendlyTales
            </span>
          </div>
        </div>
        {level && (
          <span
            className="inline-flex items-center text-[11px] font-extrabold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full text-white backdrop-blur-sm"
            style={{
              background: '#EC008C',
              boxShadow: '0 0 20px rgba(236, 0, 140, 0.5)',
            }}
          >
            Level · {level}
          </span>
        )}
      </div>

      {/* ── Centre stage: source · title ──────────────────────────── */}
      <div className="relative z-10 h-full flex flex-col items-center justify-end px-6 sm:px-12 pb-16 sm:pb-24 text-center gap-4 max-w-5xl mx-auto">
        {source && (
          <span
            className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.35em] text-[#F9F0A8]"
            style={{ animation: 'ftcCoverFade 900ms ease-out 100ms both' }}
          >
            {source}
          </span>
        )}
        <h1
          className="text-4xl sm:text-6xl md:text-7xl font-black leading-[0.95] tracking-tight"
          style={{
            fontFamily: 'var(--font-cinzel), Cinzel, Georgia, serif',
            color: '#F9F0A8',
            textShadow: '0 4px 32px rgba(15,10,28,0.85), 0 2px 8px rgba(0,0,0,0.6), 0 0 40px rgba(249,240,168,0.15)',
            animation: 'ftcCoverRise 900ms cubic-bezier(0.22, 1, 0.36, 1) 200ms both',
          }}
        >
          {title}
        </h1>
      </div>

      {/* ── Footer: cinematic CTA ────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center pb-6 sm:pb-8 z-10">
        <span
          className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-[#F8F5FC]/85 border border-[#F9F0A8]/30 rounded-full px-4 py-2 backdrop-blur-sm bg-white/5"
          style={{ animation: 'ftcCoverPulse 2.6s ease-in-out infinite' }}
        >
          <span
            className="w-2 h-2 rounded-full bg-[#EC008C]"
            style={{ boxShadow: '0 0 14px rgba(236, 0, 140, 0.95)' }}
          />
          A story is about to unfold
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
          0%, 100% { opacity: 0.7; transform: translateY(0);    }
          50%      { opacity: 1;   transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
}
