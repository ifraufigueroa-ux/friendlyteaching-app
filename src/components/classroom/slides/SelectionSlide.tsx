// FriendlyTeaching.cl — SelectionSlide (Choose from options for each prompt)
'use client';
import { useState } from 'react';
import type { Slide } from '@/types/firebase';

interface Props { slide: Slide; }

/**
 * Resolves the correct option index for a given prompt.
 * Supports three schemas:
 *  1. correctAnswer as pipe-separated indices: "2|0|1" → per-prompt correct index
 *  2. correctAnswer as pipe-separated option texts: "blue|red" → matched by text
 *  3. Fallback: first option where isCorrect === true (legacy single-answer)
 */
function getCorrectIndex(
  promptIndex: number,
  options: { id: string; text: string; isCorrect?: boolean }[],
  correctAnswer?: string,
): number {
  if (correctAnswer) {
    const parts = correctAnswer.split('|').map((s) => s.trim());
    const part = parts[promptIndex] ?? parts[0] ?? '';
    // If part is a pure integer, treat it as option index
    if (/^\d+$/.test(part)) {
      const idx = parseInt(part, 10);
      if (idx >= 0 && idx < options.length) return idx;
    }
    // Otherwise match by option text (case-insensitive)
    const match = options.findIndex((o) => o.text.toLowerCase() === part.toLowerCase());
    if (match >= 0) return match;
  }
  // Legacy fallback: first option flagged isCorrect
  return options.findIndex((o) => o.isCorrect);
}

export default function SelectionSlide({ slide }: Props) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const options = slide.options ?? [];

  // content as pipe-separated prompts, options as shared choices
  const prompts = slide.content?.split('|').map((p) => p.trim()).filter(Boolean) ?? [];

  return (
    <div className="flex flex-col h-full overflow-auto p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-[#5A3D7A]">{slide.title}</h2>
      </div>

      {prompts.length > 0 ? (
        <div className="space-y-6">
          {prompts.map((prompt, pi) => {
            const correctIdx = getCorrectIndex(pi, options, slide.correctAnswer);
            return (
              <div key={pi} className="bg-[#F0E5FF]/30 rounded-2xl p-4">
                <p className="font-semibold text-gray-800 mb-3">{prompt}</p>
                <div className="flex flex-wrap gap-2">
                  {options.map((opt, oi) => {
                    const selected = answers[pi] === oi;
                    const revealed = answers[pi] !== undefined;
                    let cls = 'border-gray-200 bg-white hover:border-[#C8A8DC]';
                    if (revealed && oi === correctIdx) cls = 'border-green-400 bg-green-50 text-green-700';
                    else if (selected && oi !== correctIdx) cls = 'border-red-400 bg-red-50 text-red-500';

                    return (
                      <button
                        key={opt.id}
                        onClick={() => !revealed && setAnswers((prev) => ({ ...prev, [pi]: oi }))}
                        className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${cls} ${!revealed ? 'cursor-pointer' : 'cursor-default'}`}
                      >
                        {opt.text}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Fallback: simple options list if no prompts
        <div className="space-y-3">
          {options.map((opt, i) => (
            <button
              key={opt.id}
              onClick={() => !answers[0] && setAnswers({ 0: i })}
              className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-semibold text-left transition-all
                ${answers[0] === i
                  ? opt.isCorrect ? 'border-green-400 bg-green-50 text-green-700' : 'border-red-400 bg-red-50 text-red-500'
                  : answers[0] !== undefined && opt.isCorrect ? 'border-green-400 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-white hover:border-[#C8A8DC]'}
              `}
            >
              {opt.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
