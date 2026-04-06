// FriendlyTeaching.cl — MultipleChoiceSlide
'use client';
import { useState } from 'react';
import type { Slide } from '@/types/firebase';

const LETTERS = ['A', 'B', 'C', 'D'];

interface Props {
  slide: Slide;
  onAnswer?: (isCorrect: boolean) => void;
}

export default function MultipleChoiceSlide({ slide, onAnswer }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const options = slide.options ?? [];

  // Find correct option: by isCorrect flag, or fallback to correctAnswer text match
  let correctIndex = options.findIndex((o) => o.isCorrect);
  if (correctIndex < 0 && slide.correctAnswer) {
    correctIndex = options.findIndex(
      (o) => o.text.toLowerCase() === slide.correctAnswer!.toLowerCase()
    );
  }
  const hasCorrect = correctIndex >= 0;

  return (
    <div className="flex flex-col h-full overflow-auto p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-[#5A3D7A]">{slide.title}</h2>
      </div>

      {slide.question && (
        <p className="text-xl text-gray-700 font-semibold mb-6 bg-[#F0E5FF]/40 rounded-xl p-4">
          {slide.question}
        </p>
      )}

      <div className="space-y-3">
        {options.map((opt, i) => {
          let bgClass = 'bg-white border-gray-200 hover:border-[#C8A8DC]';
          let letterBg = 'bg-gray-100 text-gray-500';

          if (selected !== null && i === selected) {
            if (hasCorrect && i === correctIndex) {
              bgClass = 'bg-green-50 border-green-400';
              letterBg = 'bg-green-400 text-white';
            } else if (hasCorrect) {
              bgClass = 'bg-red-50 border-red-400';
              letterBg = 'bg-red-400 text-white';
            } else {
              // No correct answer defined — neutral highlight
              bgClass = 'bg-[#F0E5FF] border-[#C8A8DC]';
              letterBg = 'bg-[#C8A8DC] text-white';
            }
          } else if (selected !== null && hasCorrect && i === correctIndex) {
            bgClass = 'bg-green-50 border-green-400';
            letterBg = 'bg-green-400 text-white';
          }

          return (
            <button
              key={opt.id}
              onClick={() => {
              if (selected !== null) return;
              setSelected(i);
              if (hasCorrect) onAnswer?.(i === correctIndex);
            }}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${bgClass} ${selected === null ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <span className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${letterBg}`}>
                {LETTERS[i] ?? String(i + 1)}
              </span>
              <span className="text-gray-800 font-medium">{opt.text}</span>
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className={`mt-4 rounded-xl p-4 text-center font-bold ${
          !hasCorrect ? 'bg-[#F0E5FF] text-[#5A3D7A]'
          : selected === correctIndex ? 'bg-green-50 text-green-600'
          : 'bg-red-50 text-red-600'
        }`}>
          {!hasCorrect
            ? `Seleccionaste: ${LETTERS[selected] ?? String(selected + 1)}`
            : selected === correctIndex
              ? '✅ ¡Correcto!'
              : `❌ La respuesta correcta es ${LETTERS[correctIndex]}`}
        </div>
      )}
    </div>
  );
}
