// FriendlyTeaching.cl — TrueFalseSlide
'use client';
import { useState } from 'react';
import type { Slide } from '@/types/firebase';

interface Props {
  slide: Slide;
  onAnswer?: (isCorrect: boolean) => void;
}

export default function TrueFalseSlide({ slide, onAnswer }: Props) {
  const [answer, setAnswer] = useState<boolean | null>(null);
  // Handle both string ('true'/'false') and boolean (true/false) from Firestore
  const isCorrect = (slide.correctAnswer as unknown) === true || slide.correctAnswer === 'true';

  return (
    <div className="flex flex-col h-full overflow-auto p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-[#5A3D7A]">{slide.title}</h2>
      </div>

      {slide.question && (
        <div className="text-xl text-gray-700 font-semibold mb-8 bg-[#F0E5FF]/40 rounded-2xl p-6 text-center">
          {slide.question}
        </div>
      )}

      <div className="flex gap-4 justify-center">
        {[
          { label: '✅ True', value: true },
          { label: '❌ False', value: false },
        ].map(({ label, value }) => {
          let style = 'bg-white border-2 border-gray-200 hover:border-[#C8A8DC] text-gray-700';
          if (answer !== null && answer === value) {
            style = value === isCorrect
              ? 'bg-green-50 border-2 border-green-400 text-green-700'
              : 'bg-red-50 border-2 border-red-400 text-red-700';
          } else if (answer !== null && value === isCorrect) {
            style = 'bg-green-50 border-2 border-green-400 text-green-700';
          }

          return (
            <button
              key={String(value)}
              onClick={() => {
              if (answer !== null) return;
              setAnswer(value);
              onAnswer?.(value === isCorrect);
            }}
              className={`flex-1 max-w-[200px] py-6 rounded-2xl text-xl font-bold transition-all ${style} ${answer === null ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {answer !== null && (
        <div className={`mt-6 text-center py-3 rounded-xl font-bold ${answer === isCorrect ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {answer === isCorrect ? '🎉 ¡Correcto!' : `🔄 La respuesta es "${isCorrect ? 'True' : 'False'}"`}
        </div>
      )}
    </div>
  );
}
