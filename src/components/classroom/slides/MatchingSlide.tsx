// FriendlyTeaching.cl — MatchingSlide
'use client';
import { useState } from 'react';
import type { Slide } from '@/types/firebase';

interface Props { slide: Slide; }

export default function MatchingSlide({ slide }: Props) {
  const pairs = slide.pairs ?? [];
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<Record<number, number>>({}); // leftIdx -> rightIdx
  const [wrongPair, setWrongPair] = useState<[number, number] | null>(null);

  // Shuffle right items once
  const [shuffledRight] = useState(() => {
    const arr = pairs.map((_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });

  function selectLeft(i: number) {
    if (matched[i] !== undefined) return; // already matched
    setSelectedLeft(i === selectedLeft ? null : i);
  }

  function selectRight(rightIdx: number) {
    // rightIdx in shuffledRight position
    const originalRight = shuffledRight[rightIdx];
    if (Object.values(matched).includes(originalRight)) return; // already matched
    if (selectedLeft === null) return;

    if (originalRight === selectedLeft) {
      // Correct!
      setMatched((prev) => ({ ...prev, [selectedLeft]: originalRight }));
      setSelectedLeft(null);
    } else {
      setWrongPair([selectedLeft, rightIdx]);
      setTimeout(() => {
        setWrongPair(null);
        setSelectedLeft(null);
      }, 800);
    }
  }

  const allMatched = Object.keys(matched).length === pairs.length;

  return (
    <div className="flex flex-col h-full overflow-auto p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-[#5A3D7A]">{slide.title}</h2>
        {slide.subtitle && <p className="text-gray-500 mt-1">{slide.subtitle}</p>}
      </div>

      <div className="flex gap-4 justify-center">
        {/* Left column */}
        <div className="flex-1 space-y-2">
          {pairs.map((pair, i) => (
            <button
              key={i}
              onClick={() => selectLeft(i)}
              className={`w-full py-3 px-4 rounded-xl text-sm font-semibold border-2 transition-all text-left
                ${matched[i] !== undefined
                  ? 'bg-green-50 border-green-400 text-green-700 cursor-default'
                  : selectedLeft === i
                    ? 'bg-[#C8A8DC] border-[#C8A8DC] text-white cursor-pointer'
                    : 'bg-white border-gray-200 hover:border-[#C8A8DC] cursor-pointer'}
              `}
            >
              {pair.left}
            </button>
          ))}
        </div>

        {/* Right column (shuffled) */}
        <div className="flex-1 space-y-2">
          {shuffledRight.map((originalRight, rightIdx) => {
            const isMatchedRight = Object.values(matched).includes(originalRight);
            const isWrong = wrongPair?.[1] === rightIdx;

            return (
              <button
                key={rightIdx}
                onClick={() => selectRight(rightIdx)}
                className={`w-full py-3 px-4 rounded-xl text-sm font-semibold border-2 transition-all text-left
                  ${isMatchedRight
                    ? 'bg-green-50 border-green-400 text-green-700 cursor-default'
                    : isWrong
                      ? 'bg-red-50 border-red-400 text-red-700 cursor-pointer'
                      : 'bg-white border-gray-200 hover:border-[#C8A8DC] cursor-pointer'}
                `}
              >
                {pairs[originalRight].right}
              </button>
            );
          })}
        </div>
      </div>

      {allMatched && (
        <div className="mt-4 text-center bg-green-50 rounded-xl py-3 font-bold text-green-600">
          🎉 ¡Perfecto! Todos los pares encontrados.
        </div>
      )}
    </div>
  );
}
