// FriendlyTeaching.cl — ListeningSlide
'use client';
import { useState } from 'react';
import type { Slide } from '@/types/firebase';

interface Props { slide: Slide; }

export default function ListeningSlide({ slide }: Props) {
  const [revealed, setRevealed] = useState(false);
  const lines = slide.dialogLines ?? [];

  return (
    <div className="flex flex-col h-full overflow-auto p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-[#5A3D7A]">{slide.title}</h2>
        {slide.subtitle && <p className="text-gray-500 mt-1">{slide.subtitle}</p>}
      </div>

      {slide.audioUrl && (
        <div className="mb-6 bg-[#B8E8E8]/30 rounded-2xl p-4">
          <p className="text-xs font-bold text-teal-700 mb-2">🎵 Audio</p>
          <audio
            controls
            src={slide.audioUrl}
            className="w-full"
          />
        </div>
      )}

      {slide.content && (
        <div className="mb-4 text-gray-600 leading-relaxed">{slide.content}</div>
      )}

      {lines.length > 0 && (
        <div className="space-y-3">
          {lines.map((line, i) => {
            const isLeft = i % 2 === 0;
            return (
              <div
                key={i}
                className={`flex ${isLeft ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`
                    max-w-[70%] rounded-2xl px-4 py-3 text-sm
                    ${isLeft
                      ? 'bg-[#F0E5FF] text-[#5A3D7A]'
                      : 'bg-[#C8A8DC] text-white'}
                  `}
                >
                  {line.speaker && (
                    <p className="text-[10px] font-bold uppercase opacity-70 mb-1">
                      {line.speaker}
                    </p>
                  )}
                  <p>{line.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {slide.question && (
        <div className="mt-6 bg-[#FFF5C8]/50 border border-[#FFE8A8] rounded-2xl p-4">
          <p className="font-semibold text-gray-800 mb-3">{slide.question}</p>
          <button
            onClick={() => setRevealed(true)}
            className="text-sm font-semibold text-[#9B7CB8] hover:text-[#5A3D7A] transition-colors"
          >
            {revealed ? null : '👁 Revelar respuesta'}
          </button>
          {revealed && slide.correctAnswer && (
            <p className="text-sm text-green-600 font-medium mt-1">✅ {slide.correctAnswer}</p>
          )}
        </div>
      )}
    </div>
  );
}
