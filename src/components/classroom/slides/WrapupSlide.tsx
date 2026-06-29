// FriendlyTeaching.cl — Slide 9: Wrap-Up Discussion
'use client';
import { useState } from 'react';
import type { Slide } from '@/types/firebase';

interface Props { slide: Slide; }

export default function WrapupSlide({ slide }: Props) {
  const [reflection, setReflection] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="flex items-start gap-4 bg-gradient-to-br from-[#F0E8FF] to-[#F9F5FF] rounded-2xl p-5">
        <span className="text-4xl">💬</span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9B7CB8] mb-1">Wrap Up</p>
          <h2 className="font-bold text-[#5A3D7A] text-lg">
            {slide.title ?? 'Let&apos;s Wrap Up!'}
          </h2>
        </div>
      </div>

      {slide.prompt && (
        <div className="bg-white border-l-4 border-[#5A3D7A] rounded-r-xl px-4 py-3 shadow-sm">
          <p className="text-sm font-semibold text-gray-800">{slide.prompt}</p>
        </div>
      )}

      {slide.content && (
        <div className="bg-white border border-[#F0E5FF] rounded-2xl p-4">
          <div className="space-y-2">
            {slide.content.split('\n').filter(Boolean).map((line, i) => (
              <p key={i} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-[#C8A8DC] font-bold mt-0.5">→</span>
                <span>{line.replace(/^[•→\-*]\s*/, '')}</span>
              </p>
            ))}
          </div>
        </div>
      )}

      {!submitted ? (
        <div className="space-y-3">
          <label className="text-xs font-semibold text-gray-500 block">
            Share your thoughts:
          </label>
          <textarea
            value={reflection}
            onChange={e => setReflection(e.target.value)}
            rows={4}
            placeholder="Write your reflection here..."
            className="w-full p-3 rounded-xl border border-[#E0D5FF] focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] text-sm resize-none bg-[#FAFAFA]"
          />
          <button
            onClick={() => { if (reflection.trim()) setSubmitted(true); }}
            disabled={!reflection.trim()}
            className="w-full py-2.5 rounded-xl font-semibold text-sm bg-[#5A3D7A] text-white hover:bg-[#4A2D6A] disabled:opacity-40 transition-all"
          >
            Done! 🎵
          </button>
        </div>
      ) : (
        <div className="bg-[#F9F5FF] border border-[#E0D5FF] rounded-xl p-4">
          <p className="text-xs font-bold text-[#5A3D7A] mb-1">Your reflection:</p>
          <p className="text-sm text-gray-700 italic">&quot;{reflection}&quot;</p>
          <p className="text-xs text-[#9B7CB8] mt-3">
            🎵 Great work! Continue to the next slide.
          </p>
        </div>
      )}
    </div>
  );
}
