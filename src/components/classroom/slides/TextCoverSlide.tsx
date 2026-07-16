// FriendlyTeaching.cl — Slide 1: Text Cover (Friendlytext® CLT)
'use client';
import Image from 'next/image';
import type { Slide } from '@/types/firebase';

interface Props { slide: Slide }

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

export default function TextCoverSlide({ slide }: Props) {
  const txt = slide.textData;
  const videoId = txt?.youtubeUrl ? extractVideoId(txt.youtubeUrl) : null;
  const imgSrc = videoId
    ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    : txt?.posterUrl ?? null;

  return (
    <div className="relative flex flex-col h-full min-h-[480px] overflow-hidden bg-gradient-to-br from-[#1B2C3F] via-[#2C4159] to-[#1A2B3E] text-white">

      {imgSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imgSrc}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover opacity-15 blur-2xl scale-110 pointer-events-none select-none"
        />
      )}

      <div className="relative flex flex-col items-center justify-center flex-1 px-8 py-10 gap-6">
        {imgSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgSrc}
            alt={txt?.title ?? 'cover'}
            className="w-56 h-56 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] border-4 border-white/20 object-cover"
          />
        ) : (
          <div className="w-56 h-56 rounded-3xl bg-white/10 flex items-center justify-center text-7xl shadow-2xl">
            📖
          </div>
        )}

        <div className="flex items-center gap-2">
          <Image
            src="/logo-friendlyteaching.jpg"
            alt="FriendlyTeaching"
            width={28}
            height={28}
            className="rounded-full opacity-80"
          />
          <span className="text-xs font-extrabold uppercase tracking-[0.25em] text-[#7EC8E3]">
            Friendlytext®
          </span>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-extrabold leading-tight drop-shadow-lg mb-2">
            {txt?.title ?? slide.title ?? 'Text Lesson'}
          </h1>
          <p className="text-xl text-white/70 font-medium">
            {txt?.source ? `— ${txt.source}` : slide.subtitle ?? ''}
          </p>
        </div>

        <p className="text-white/40 text-sm italic">
          Let&apos;s learn English through reading!
        </p>
      </div>
    </div>
  );
}
