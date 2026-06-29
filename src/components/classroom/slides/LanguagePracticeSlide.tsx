// FriendlyTeaching.cl — Slide 7: Language Practice (unscramble / match halves)
'use client';
import { useState, useMemo } from 'react';
import type { Slide, PracticeItem } from '@/types/firebase';

interface Props { slide: Slide; }

function UnscrambleItem({ item, index }: { item: PracticeItem; index: number }) {
  const shuffled = useMemo(() =>
    item.prompt.split('/').map(w => w.trim()).sort(() => Math.random() - 0.5),
  [item.prompt]);
  const [order, setOrder] = useState<string[]>([]);
  const [remaining, setRemaining] = useState<string[]>(shuffled);
  const [checked, setChecked] = useState(false);

  function addWord(word: string, idx: number) {
    setOrder(o => [...o, word]);
    setRemaining(r => r.filter((_, i) => i !== idx));
  }

  function removeWord(idx: number) {
    if (checked) return;
    const word = order[idx];
    setRemaining(r => [...r, word]);
    setOrder(o => o.filter((_, i) => i !== idx));
  }

  const answer = order.join(' ');
  const isCorrect = checked && answer.toLowerCase() === item.answer.toLowerCase();

  return (
    <div className="bg-white border border-[#F0E5FF] rounded-xl p-4 space-y-3">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Unscramble {index + 1}</p>

      {/* Answer area */}
      <div className="min-h-10 bg-[#F9F5FF] rounded-lg p-2 flex flex-wrap gap-1.5 items-center">
        {order.length === 0
          ? <span className="text-xs text-gray-300">Tap words below to build the sentence</span>
          : order.map((w, i) => (
            <button
              key={i}
              onClick={() => removeWord(i)}
              className={`px-2.5 py-1 rounded-lg text-sm font-medium transition-all border
                ${checked
                  ? isCorrect ? 'bg-green-100 border-green-300 text-green-700' : 'bg-red-100 border-red-300 text-red-700'
                  : 'bg-[#5A3D7A] border-[#5A3D7A] text-white hover:bg-[#4A2D6A]'
                }`}
            >
              {w}
            </button>
          ))
        }
      </div>

      {/* Word bank */}
      <div className="flex flex-wrap gap-1.5">
        {remaining.map((w, i) => (
          <button
            key={i}
            onClick={() => addWord(w, i)}
            className="px-2.5 py-1 rounded-lg text-sm font-medium bg-gray-100 hover:bg-[#F0E5FF] border border-gray-200 hover:border-[#C8A8DC] text-gray-700 transition-all"
          >
            {w}
          </button>
        ))}
      </div>

      {checked && (
        <p className={`text-xs font-semibold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
          {isCorrect ? '✓ Correct!' : `✗ Answer: ${item.answer}`}
        </p>
      )}

      {!checked && (
        <button
          onClick={() => setChecked(true)}
          disabled={order.length === 0}
          className="text-xs font-semibold text-[#5A3D7A] hover:underline disabled:opacity-40"
        >
          Check ✓
        </button>
      )}
    </div>
  );
}

function MatchHalvesItem({ item, index }: { item: PracticeItem; index: number }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const options = item.options ?? [item.answer];

  const isCorrect = checked && selected === item.answer;

  return (
    <div className="bg-white border border-[#F0E5FF] rounded-xl p-4 space-y-3">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Match {index + 1}</p>
      <div className="bg-[#F9F5FF] rounded-lg px-4 py-2.5 text-sm font-semibold text-[#5A3D7A]">
        {item.prompt} ___
      </div>
      <div className="space-y-1.5">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => { if (!checked) setSelected(opt); }}
            className={`w-full py-2 px-3 rounded-lg text-sm text-left transition-all border
              ${checked
                ? opt === item.answer
                  ? 'bg-green-100 border-green-300 text-green-700 font-medium'
                  : selected === opt && !isCorrect
                    ? 'bg-red-100 border-red-300 text-red-700'
                    : 'border-gray-200 text-gray-400'
                : selected === opt
                  ? 'bg-[#5A3D7A] border-[#5A3D7A] text-white font-medium'
                  : 'border-[#E0D5FF] text-gray-700 hover:border-[#C8A8DC] hover:bg-[#F9F5FF]'
              }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {!checked && (
        <button
          onClick={() => setChecked(true)}
          disabled={!selected}
          className="text-xs font-semibold text-[#5A3D7A] hover:underline disabled:opacity-40"
        >
          Check ✓
        </button>
      )}
    </div>
  );
}

export default function LanguagePracticeSlide({ slide }: Props) {
  const items: PracticeItem[] = slide.practiceItems ?? [];

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-5">
        <h2 className="font-bold text-[#5A3D7A] text-base">{slide.title ?? 'Language Practice'}</h2>
        <div className="text-center py-8 text-gray-400">
          <p className="text-3xl mb-2">✏️</p>
          <p className="text-sm">No practice items yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex items-start gap-3">
        <span className="text-3xl">✏️</span>
        <div>
          <h2 className="font-bold text-[#5A3D7A] text-base">{slide.title ?? "Let's Practice!"}</h2>
          {slide.content && <p className="text-sm text-gray-500 mt-0.5">{slide.content}</p>}
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, i) =>
          item.type === 'unscramble'
            ? <UnscrambleItem key={i} item={item} index={i} />
            : <MatchHalvesItem key={i} item={item} index={i} />
        )}
      </div>
    </div>
  );
}
