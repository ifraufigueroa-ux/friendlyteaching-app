// FriendlyTeaching.cl — VocabularySlide
'use client';
import { useState } from 'react';
import type { Slide } from '@/types/firebase';

interface Props { slide: Slide; }

export default function VocabularySlide({ slide }: Props) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const words = slide.words ?? [];

  const toggle = (i: number) =>
    setRevealed((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  return (
    <div className="flex flex-col h-full overflow-auto p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-[#5A3D7A]">{slide.title}</h2>
        {slide.subtitle && <p className="text-gray-500 mt-1">{slide.subtitle}</p>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {words.map((word, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`
              rounded-2xl p-4 text-left transition-all shadow-sm border-2 cursor-pointer
              ${revealed.has(i)
                ? 'bg-[#F0E5FF] border-[#C8A8DC]'
                : 'bg-white border-gray-100 hover:border-[#C8A8DC]'}
            `}
          >
            <div className="text-base font-bold text-[#5A3D7A] mb-1">{word.word}</div>
            {revealed.has(i) ? (
              <>
                <div className="text-sm text-gray-600 font-medium">{word.translation}</div>
                {word.pronunciation && (
                  <div className="text-xs text-[#9B7CB8] mt-1">/{word.pronunciation}/</div>
                )}
                {word.example && (
                  <div className="text-xs text-gray-400 mt-2 italic">{word.example}</div>
                )}
              </>
            ) : (
              <div className="text-xs text-gray-400 mt-1">toca para ver</div>
            )}
          </button>
        ))}
      </div>

      {words.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          No hay vocabulario en esta slide.
        </div>
      )}
    </div>
  );
}
