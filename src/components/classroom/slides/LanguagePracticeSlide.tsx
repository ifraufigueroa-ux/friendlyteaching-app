'use client';
// FriendlyTeaching.cl — LanguagePracticeSlide
// "Controlled Practice" stage. Renders a list of practiceItems[]:
//   - unscramble: words separated by "/" → student builds the full sentence
//   - match_halves: prompt is the first half; options[] are the possible
//     second halves; answer is the correct one
//
// Each item is independent; the student gets immediate per-item feedback.

import { useState } from 'react';
import type { Slide, PracticeItem } from '@/types/firebase';

interface Props { slide: Slide; }

export default function LanguagePracticeSlide({ slide }: Props) {
  const items: PracticeItem[] = slide.practiceItems ?? [];

  return (
    <div className="flex flex-col h-full overflow-auto p-6 sm:p-8">
      <div className="mb-5">
        <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-[#9B7CB8] mb-2">Controlled practice</span>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#5A3D7A] leading-tight">{slide.title ?? 'Practice'}</h2>
        {slide.subtitle && <p className="text-gray-500 mt-1">{slide.subtitle}</p>}
      </div>

      <ol className="space-y-4">
        {items.map((item, i) => (
          <li key={i} className="bg-white border border-[#E8D5F0] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-full bg-[#5A3D7A] text-white font-bold text-xs flex items-center justify-center">{i + 1}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#9B7CB8]">
                {item.type === 'unscramble' ? 'Build the sentence' : 'Match the halves'}
              </span>
            </div>
            {item.type === 'unscramble'
              ? <UnscrambleItem item={item} />
              : <MatchHalvesItem item={item} />
            }
          </li>
        ))}
      </ol>

      {items.length === 0 && (
        <div className="text-center text-gray-400 py-12">
          <p className="text-4xl mb-2">🗂️</p>
          <p className="text-sm">No hay ejercicios todavía.</p>
        </div>
      )}
    </div>
  );
}

// ─── Unscramble ────────────────────────────────────────────────────────

function UnscrambleItem({ item }: { item: PracticeItem }) {
  const [answer, setAnswer]   = useState('');
  const [checked, setChecked] = useState(false);

  // Build a shuffled chip pool from the slash-separated prompt
  const tokens = item.prompt.split('/').map(t => t.trim()).filter(Boolean);
  const shuffledOnce = useShuffled(tokens);

  const normalize = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase().replace(/[.,!?;:]+$/, '');
  const correct = checked && normalize(answer) === normalize(item.answer);

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">Drag the words mentally into order, then type your answer.</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {shuffledOnce.map((tok, i) => (
          <button
            key={i}
            onClick={() => setAnswer(a => (a ? `${a} ${tok}` : tok))}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#F0E5FF] text-[#5A3D7A] hover:bg-[#E8D5F0] border border-[#C8A8DC] transition-colors"
          >
            {tok}
          </button>
        ))}
      </div>

      <textarea
        value={answer}
        onChange={e => { setAnswer(e.target.value); setChecked(false); }}
        rows={2}
        placeholder="Type your sentence here..."
        className="w-full px-3 py-2 rounded-xl border border-[#E8D5F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] resize-none"
      />

      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={() => setChecked(true)}
          disabled={!answer.trim()}
          className="px-4 py-2 rounded-xl bg-[#5A3D7A] text-white text-xs font-bold hover:bg-[#7B5EA7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Check
        </button>
        <button
          onClick={() => { setAnswer(''); setChecked(false); }}
          className="px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 transition-colors"
        >
          Clear
        </button>
      </div>

      {checked && (
        <div className={`mt-3 rounded-xl p-3 border text-sm ${
          correct
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          {correct ? '✓ Correct!' : (
            <>
              <p className="font-bold mb-1">Not quite. The expected answer:</p>
              <p className="italic">{item.answer}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Match halves ──────────────────────────────────────────────────────

function MatchHalvesItem({ item }: { item: PracticeItem }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked]   = useState(false);
  const options = item.options ?? [];

  const isCorrect = checked && selected === item.answer;

  return (
    <div>
      <div className="bg-[#F0E5FF]/40 rounded-xl p-3 mb-3">
        <p className="text-sm text-[#2D1B4E] font-medium leading-snug">
          {item.prompt}<span className="text-[#9B7CB8] font-bold"> …?</span>
        </p>
      </div>

      <p className="text-xs text-gray-500 mb-2">Pick the matching second half:</p>

      <div className="space-y-2">
        {options.map((opt, i) => {
          const isSel = selected === opt;
          let cardClass = 'border-[#E8D5F0] hover:border-[#9B7CB8] bg-white';
          if (checked && opt === item.answer) cardClass = 'border-green-400 bg-green-50';
          else if (checked && isSel && opt !== item.answer) cardClass = 'border-amber-400 bg-amber-50';
          else if (isSel) cardClass = 'border-[#5A3D7A] bg-[#F0E5FF]';

          return (
            <button
              key={i}
              onClick={() => { setSelected(opt); setChecked(false); }}
              disabled={checked && isCorrect}
              className={`w-full text-left text-sm px-3 py-2.5 rounded-xl border-2 transition-all ${cardClass}`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setChecked(true)}
        disabled={!selected}
        className="mt-3 px-4 py-2 rounded-xl bg-[#5A3D7A] text-white text-xs font-bold hover:bg-[#7B5EA7] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Check
      </button>

      {checked && (
        <p className={`mt-2 text-xs font-bold ${isCorrect ? 'text-green-700' : 'text-amber-700'}`}>
          {isCorrect ? '✓ Correct!' : '✗ Try again'}
        </p>
      )}
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────

function useShuffled<T>(items: T[]): T[] {
  // Stable per-mount shuffle: shuffles once when the component first renders
  // (no re-shuffle on every render).
  const [shuffled] = useState(() => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  });
  return shuffled;
}
