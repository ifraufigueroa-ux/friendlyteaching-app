// FriendlyTeaching.cl — ClozeSlide (fill-in-the-blank with dropdown)
// Content uses {{blank}} markers. Options stored in slide.blanks[].
// correctAnswer stores pipe-separated answers for each blank.
'use client';
import { useState } from 'react';
import type { Slide } from '@/types/firebase';

interface Props { slide: Slide; }

export default function ClozeSlide({ slide }: Props) {
  const content = slide.content ?? '';
  const blanks = slide.blanks ?? [];
  const correctAnswers = (slide.correctAnswer ?? '').split('|').map((s) => s.trim());

  // Split content by {{blank}} markers
  const parts = content.split(/\{\{blank\}\}/gi);
  const blankCount = parts.length - 1;

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);

  function setAnswer(blankIdx: number, value: string) {
    setAnswers((prev) => ({ ...prev, [blankIdx]: value }));
    setChecked(false);
  }

  function checkAnswers() {
    setChecked(true);
  }

  function isCorrect(blankIdx: number): boolean {
    const student = (answers[blankIdx] ?? '').toLowerCase().trim();
    const correct = (correctAnswers[blankIdx] ?? '').toLowerCase().trim();
    return student === correct;
  }

  const allFilled = Object.keys(answers).length === blankCount && Object.values(answers).every(Boolean);
  const totalCorrect = checked ? Array.from({ length: blankCount }, (_, i) => isCorrect(i)).filter(Boolean).length : 0;

  return (
    <div className="flex flex-col h-full overflow-auto p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-[#5A3D7A]">{slide.title}</h2>
        {slide.question && <p className="text-gray-600 mt-2">{slide.question}</p>}
      </div>

      {/* Cloze text with inline dropdowns */}
      <div className="text-lg leading-loose text-gray-700 mb-6">
        {parts.map((part, i) => (
          <span key={i}>
            <span>{part}</span>
            {i < blankCount && (
              <select
                value={answers[i] ?? ''}
                onChange={(e) => setAnswer(i, e.target.value)}
                className={`inline-block mx-1 px-3 py-1 rounded-lg border-2 text-sm font-semibold transition-colors appearance-none cursor-pointer ${
                  checked
                    ? isCorrect(i)
                      ? 'border-green-400 bg-green-50 text-green-700'
                      : 'border-red-400 bg-red-50 text-red-500'
                    : answers[i]
                      ? 'border-[#C8A8DC] bg-[#F0E5FF] text-[#5A3D7A]'
                      : 'border-gray-300 bg-white text-gray-500'
                }`}
              >
                <option value="">___</option>
                {blanks.map((opt, oi) => (
                  <option key={oi} value={opt}>{opt}</option>
                ))}
              </select>
            )}
          </span>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={checkAnswers}
          disabled={!allFilled}
          className="px-5 py-2.5 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
        >
          Verificar
        </button>
        <button
          onClick={() => { setAnswers({}); setChecked(false); }}
          className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
        >
          Resetear
        </button>
      </div>

      {/* Result */}
      {checked && (
        <div className={`text-center py-3 rounded-xl font-bold ${
          totalCorrect === blankCount ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-700'
        }`}>
          {totalCorrect === blankCount
            ? '🎉 ¡Todo correcto!'
            : `${totalCorrect}/${blankCount} correctas. Revisa los campos en rojo.`}
        </div>
      )}
    </div>
  );
}
