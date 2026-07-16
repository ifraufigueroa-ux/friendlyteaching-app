// FriendlyTeaching.cl — Slide 10: Friendlytext® End Screen
'use client';
import type { Slide } from '@/types/firebase';

interface Props { slide: Slide }

export default function FriendlytextEndSlide({ slide }: Props) {
  const txt = slide.textData;

  return (
    <div className="flex flex-col items-center justify-center min-h-[420px] bg-gradient-to-br from-[#1B2C3F] via-[#2C4159] to-[#4B6A85] p-8 rounded-2xl text-white text-center">
      <div className="mb-6">
        <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center text-4xl mx-auto mb-4">📖</div>
      </div>

      <div className="space-y-2 mb-8">
        <p className="text-5xl">🎉</p>
        <h1 className="text-2xl font-extrabold drop-shadow-lg">
          {slide.title ?? '¡Lección completada!'}
        </h1>
        {txt && (
          <>
            <p className="text-white/70 text-base">{txt.title}</p>
            <p className="text-white/50 text-sm">— {txt.source}</p>
          </>
        )}
      </div>

      <div className="mt-auto">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/20">
          <span className="text-2xl">📖</span>
          <div className="text-left">
            <p className="text-xs text-white/50 uppercase tracking-widest">Powered by</p>
            <p className="font-extrabold text-lg text-white tracking-tight">
              Friendlytext<sup className="text-xs">®</sup>
            </p>
          </div>
        </div>
        <p className="text-white/30 text-xs mt-4">FriendlyTeaching.cl</p>
      </div>
    </div>
  );
}
