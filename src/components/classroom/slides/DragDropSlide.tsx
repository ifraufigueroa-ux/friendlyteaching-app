// FriendlyTeaching.cl — DragDropSlide (word ordering)
'use client';
import { useState } from 'react';
import type { Slide } from '@/types/firebase';

interface Props { slide: Slide; }

export default function DragDropSlide({ slide }: Props) {
  const blanks = slide.blanks ?? [];
  const correct = slide.correctAnswer ?? '';

  // Shuffle the blanks as "available" words
  const [available, setAvailable] = useState(() => [...blanks].sort(() => Math.random() - 0.5));
  const [placed, setPlaced] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);

  function addWord(word: string) {
    setPlaced((prev) => [...prev, word]);
    setAvailable((prev) => prev.filter((w) => w !== word));
    setChecked(false);
  }

  function removeWord(word: string) {
    setAvailable((prev) => [...prev, word]);
    setPlaced((prev) => prev.filter((w) => w !== word));
    setChecked(false);
  }

  function reset() {
    setAvailable([...blanks].sort(() => Math.random() - 0.5));
    setPlaced([]);
    setChecked(false);
  }

  const isCorrect = checked && [...placed].map(w => w.toLowerCase()).sort().join(' ') === correct.toLowerCase().split(' ').sort().join(' ');

  return (
    <div className="flex flex-col h-full overflow-auto p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-[#5A3D7A]">{slide.title}</h2>
        {slide.question && (
          <p className="text-gray-600 mt-2 text-base">{slide.question}</p>
        )}
      </div>

      {slide.content && (
        <p className="text-gray-500 text-sm mb-4">{slide.content}</p>
      )}

      {/* Drop zone */}
      <div
        className={`
          min-h-[72px] border-2 rounded-2xl p-3 flex flex-wrap gap-2 mb-4 transition-colors
          ${checked
            ? isCorrect ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'
            : 'border-dashed border-[#C8A8DC] bg-[#F0E5FF]/20'}
        `}
      >
        {placed.map((word, i) => (
          <button
            key={i}
            onClick={() => removeWord(word)}
            className="px-3 py-1.5 bg-[#C8A8DC] text-white rounded-xl text-sm font-semibold hover:bg-[#9B7CB8] transition-colors"
          >
            {word} ×
          </button>
        ))}
        {placed.length === 0 && (
          <span className="text-gray-400 text-sm self-center">Haz click en las palabras para ordenarlas aquí</span>
        )}
      </div>

      {/* Available words */}
      <div className="flex flex-wrap gap-2 mb-4">
        {available.map((word, i) => (
          <button
            key={i}
            onClick={() => addWord(word)}
            className="px-3 py-1.5 bg-white border-2 border-gray-200 hover:border-[#C8A8DC] rounded-xl text-sm font-semibold text-gray-700 transition-colors"
          >
            {word}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={() => setChecked(true)}
          disabled={placed.length === 0}
          className="px-5 py-2.5 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
        >
          Verificar ✓
        </button>
        <button
          onClick={reset}
          className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
        >
          Resetear
        </button>
      </div>

      {checked && (
        <div className={`mt-3 text-center py-3 rounded-xl font-bold ${isCorrect ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {isCorrect ? '🎉 ¡Correcto!' : `🔄 Intenta de nuevo. Respuesta: "${correct}"`}
        </div>
      )}
    </div>
  );
}
