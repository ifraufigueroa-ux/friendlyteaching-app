// FriendlyTeaching.cl — Exercise runner (Daily Practice)
//
// Renders a single unit's exercises one at a time, grades locally,
// and surfaces the summary at the end. The parent page is responsible
// for calling recordSession() on completion.

'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, X, Sparkles, ArrowRight, RotateCcw, Home } from 'lucide-react';
import type {
  Exercise, PracticeUnit,
  MultipleChoiceExercise, FillBlankExercise, MatchPairsExercise,
} from '@/types/practice';
import { PRACTICE_XP } from '@/types/practice';

interface Props {
  unit:        PracticeUnit;
  onComplete:  (summary: { correctCount: number; totalCount: number }) => Promise<void> | void;
}

type Verdict = 'pending' | 'correct' | 'wrong';

export function ExerciseRunner({ unit, onComplete }: Props) {
  const [idx, setIdx] = useState(0);
  const [verdict, setVerdict] = useState<Verdict>('pending');
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const total   = unit.exercises.length;
  const current = unit.exercises[idx];
  const progress = ((idx + (verdict !== 'pending' ? 1 : 0)) / total) * 100;

  function handleGrade(wasCorrect: boolean) {
    if (verdict !== 'pending') return;
    if (wasCorrect) setCorrectCount(c => c + 1);
    setVerdict(wasCorrect ? 'correct' : 'wrong');
  }

  async function handleNext() {
    if (idx + 1 < total) {
      setIdx(i => i + 1);
      setVerdict('pending');
    } else {
      setSaving(true);
      try {
        await onComplete({ correctCount, totalCount: total });
      } finally {
        setSaving(false);
        setDone(true);
      }
    }
  }

  if (done) {
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const xpEarned =
      correctCount * PRACTICE_XP.perCorrect +
      PRACTICE_XP.lessonCompletion +
      (accuracy >= 90 ? PRACTICE_XP.perfectBonus : 0);
    return (
      <SummaryCard
        unit={unit}
        correctCount={correctCount}
        totalCount={total}
        xpEarned={xpEarned}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFCF7]">
      {/* Progress bar */}
      <div className="px-4 pt-4 flex items-center gap-3 flex-shrink-0">
        <Link
          href="/dashboard/student/practice"
          className="text-xs font-semibold text-[#9B7CB8] hover:text-[#5A3D7A]"
          aria-label="Leave lesson"
        >
          ×
        </Link>
        <div className="flex-1 h-2 bg-[#F0E5FF] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-[#5A3D7A]/60 tabular-nums">
          {idx + 1} / {total}
        </span>
      </div>

      {/* Exercise body */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl">
          <p className="font-serif text-2xl md:text-3xl font-bold text-[#2D1B4E] leading-tight mb-6 text-center">
            {current.prompt}
          </p>
          <ExerciseBody
            exercise={current}
            verdict={verdict}
            onGrade={handleGrade}
          />
        </div>
      </div>

      {/* Footer feedback + CTA */}
      <div
        className={`flex-shrink-0 border-t transition-colors ${
          verdict === 'correct' ? 'bg-emerald-50 border-emerald-200'
          : verdict === 'wrong' ? 'bg-rose-50 border-rose-200'
          : 'bg-white border-gray-100'
        }`}
      >
        <div className="max-w-xl mx-auto px-4 py-4">
          {verdict === 'pending' ? (
            <p className="text-center text-xs text-gray-400">
              Pick an answer to continue.
            </p>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm inline-flex items-center gap-1.5 ${
                  verdict === 'correct' ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  {verdict === 'correct'
                    ? <><Check className="w-4 h-4" strokeWidth={2.5} /> Correct</>
                    : <><X className="w-4 h-4" strokeWidth={2.5} /> Not quite</>}
                </p>
                {current.explain && (
                  <p className="text-xs text-gray-600 mt-0.5 leading-snug">{current.explain}</p>
                )}
              </div>
              <button
                onClick={handleNext}
                disabled={saving}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold text-white shadow-md hover:shadow-lg active:scale-95 transition-all ${
                  verdict === 'correct'
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                    : 'bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8]'
                } disabled:opacity-50`}
              >
                {saving ? 'Saving…' : idx + 1 < total ? 'Continue' : 'Finish'}
                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Exercise body dispatcher ─────────────────────────────────

function ExerciseBody({
  exercise, verdict, onGrade,
}: {
  exercise: Exercise;
  verdict:  Verdict;
  onGrade:  (correct: boolean) => void;
}) {
  switch (exercise.type) {
    case 'multiple-choice':
      return <MultipleChoiceBody ex={exercise} verdict={verdict} onGrade={onGrade} />;
    case 'fill-blank':
      return <FillBlankBody ex={exercise} verdict={verdict} onGrade={onGrade} />;
    case 'match-pairs':
      return <MatchPairsBody ex={exercise} verdict={verdict} onGrade={onGrade} />;
  }
}

// ── Multiple choice ──────────────────────────────────────────

function MultipleChoiceBody({
  ex, verdict, onGrade,
}: {
  ex: MultipleChoiceExercise;
  verdict: Verdict;
  onGrade: (correct: boolean) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const locked = verdict !== 'pending';

  function handlePick(i: number) {
    if (locked) return;
    setPicked(i);
    onGrade(i === ex.correctIndex);
  }

  return (
    <div className="grid grid-cols-1 gap-2.5">
      {ex.options.map((opt, i) => {
        const isPicked  = picked === i;
        const isCorrect = i === ex.correctIndex;
        const tone =
          !locked
            ? 'border-gray-200 bg-white hover:border-[#C8A8DC] hover:bg-[#FAF5FF]'
          : isCorrect
            ? 'border-emerald-300 bg-emerald-50'
          : isPicked
            ? 'border-rose-300 bg-rose-50'
            : 'border-gray-100 bg-white opacity-60';
        return (
          <button
            key={i}
            onClick={() => handlePick(i)}
            disabled={locked}
            className={`text-left px-4 py-3 border-2 rounded-xl text-[15px] font-medium text-[#2D1B4E] transition-all ${tone}`}
          >
            <span className="inline-flex items-center gap-3">
              <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[11px] font-bold ${
                !locked        ? 'border-gray-300 text-gray-400'
                : isCorrect    ? 'border-emerald-500 bg-emerald-500 text-white'
                : isPicked     ? 'border-rose-500 bg-rose-500 text-white'
                                : 'border-gray-200 text-gray-300'
              }`}>
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Fill blank ───────────────────────────────────────────────

function FillBlankBody({
  ex, verdict, onGrade,
}: {
  ex: FillBlankExercise;
  verdict: Verdict;
  onGrade: (correct: boolean) => void;
}) {
  // Count blanks in the sentence (every "___" is one input).
  const parts = ex.sentence.split('___');
  const blankCount = parts.length - 1;
  const [vals, setVals] = useState<string[]>(() => Array(blankCount).fill(''));
  const locked = verdict !== 'pending';

  function normalize(s: string): string {
    return s.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function handleCheck() {
    if (locked) return;
    const allCorrect = ex.answers.every((expected, i) => {
      const got = normalize(vals[i] ?? '');
      if (got === normalize(expected)) return true;
      const alts = ex.alts?.[i] ?? [];
      return alts.some(a => normalize(a) === got);
    });
    onGrade(allCorrect);
  }

  return (
    <div className="space-y-5">
      <div className="text-center text-xl md:text-2xl text-[#2D1B4E] font-serif leading-relaxed">
        {parts.map((p, i) => (
          <span key={i}>
            {p}
            {i < blankCount && (
              <input
                type="text"
                value={vals[i]}
                onChange={e => setVals(v => v.map((x, j) => j === i ? e.target.value : x))}
                disabled={locked}
                autoFocus={i === 0}
                className={`inline-block mx-1 min-w-[120px] px-2 py-0.5 text-center border-b-2 bg-transparent focus:outline-none ${
                  !locked ? 'border-[#C8A8DC] focus:border-[#5A3D7A]'
                  : verdict === 'correct' ? 'border-emerald-500 text-emerald-700'
                  : 'border-rose-500 text-rose-700'
                }`}
              />
            )}
          </span>
        ))}
      </div>
      {!locked && (
        <div className="flex justify-center">
          <button
            onClick={handleCheck}
            disabled={vals.some(v => !v.trim())}
            className="px-6 py-2.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-40"
          >
            Check
          </button>
        </div>
      )}
      {locked && verdict === 'wrong' && (
        <p className="text-center text-sm text-rose-700">
          Correct answer: <strong>{ex.answers.join(' / ')}</strong>
        </p>
      )}
    </div>
  );
}

// ── Match pairs ──────────────────────────────────────────────

function MatchPairsBody({
  ex, verdict, onGrade,
}: {
  ex: MatchPairsExercise;
  verdict: Verdict;
  onGrade: (correct: boolean) => void;
}) {
  // Shuffle rights only once per mount (so the picker is non-trivial).
  const shuffledRights = useMemo(() => {
    const arr = ex.pairs.map((p, i) => ({ right: p.right, originalIndex: i }));
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex.id]);

  // State: for each left item, which rightIndex (in shuffledRights) is paired.
  const [picks, setPicks] = useState<(number | null)[]>(() => Array(ex.pairs.length).fill(null));
  // Currently-selected left item (null = none selected, waiting for user).
  const [activeLeft, setActiveLeft] = useState<number | null>(null);
  const locked = verdict !== 'pending';

  function pickLeft(i: number) {
    if (locked) return;
    setActiveLeft(i);
  }

  function pickRight(ri: number) {
    if (locked || activeLeft === null) return;
    setPicks(prev => {
      const next = [...prev];
      // Clear any left that previously had this right.
      for (let k = 0; k < next.length; k++) if (next[k] === ri) next[k] = null;
      next[activeLeft] = ri;
      return next;
    });
    setActiveLeft(null);
  }

  function handleCheck() {
    if (locked) return;
    if (picks.some(p => p === null)) return;
    // A pair is correct when the picked right's originalIndex matches the left's index.
    const allCorrect = picks.every((ri, li) =>
      ri !== null && shuffledRights[ri].originalIndex === li,
    );
    onGrade(allCorrect);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {ex.pairs.map((p, i) => {
            const isActive  = activeLeft === i;
            const assigned  = picks[i] !== null;
            const isCorrect = locked && picks[i] !== null && shuffledRights[picks[i]!].originalIndex === i;
            const isWrong   = locked && picks[i] !== null && shuffledRights[picks[i]!].originalIndex !== i;
            const tone =
              !locked
                ? isActive
                  ? 'border-[#5A3D7A] bg-[#F0E5FF] text-[#5A3D7A]'
                  : assigned
                    ? 'border-[#C8A8DC] bg-white text-[#5A3D7A]'
                    : 'border-gray-200 bg-white text-[#2D1B4E] hover:border-[#C8A8DC]'
              : isCorrect ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : isWrong ? 'border-rose-300 bg-rose-50 text-rose-800'
                                    : 'border-gray-100 bg-white text-gray-400';
            return (
              <button
                key={i}
                onClick={() => pickLeft(i)}
                disabled={locked}
                className={`w-full text-left px-3 py-2.5 border-2 rounded-xl text-sm font-medium transition-all ${tone}`}
              >
                {p.left}
                {picks[i] !== null && (
                  <span className="block text-xs text-[#9B7CB8] mt-0.5">
                    → {shuffledRights[picks[i]!].right}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          {shuffledRights.map((r, ri) => {
            const assigned = picks.includes(ri);
            const canPick  = !locked && activeLeft !== null && !assigned;
            const tone =
              !locked
                ? assigned
                  ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                  : canPick
                    ? 'border-[#C8A8DC] bg-white text-[#2D1B4E] hover:border-[#5A3D7A] hover:bg-[#F0E5FF]'
                    : 'border-gray-200 bg-white text-[#2D1B4E] opacity-80'
              : 'border-gray-100 bg-gray-50 text-gray-500';
            return (
              <button
                key={ri}
                onClick={() => pickRight(ri)}
                disabled={locked || assigned || activeLeft === null}
                className={`w-full text-left px-3 py-2.5 border-2 rounded-xl text-sm font-medium transition-all ${tone}`}
              >
                {r.right}
              </button>
            );
          })}
        </div>
      </div>

      {!locked && (
        <div className="flex justify-center">
          <button
            onClick={handleCheck}
            disabled={picks.some(p => p === null)}
            className="px-6 py-2.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] shadow-md hover:shadow-lg active:scale-95 transition-all disabled:opacity-40"
          >
            Check
          </button>
        </div>
      )}
    </div>
  );
}

// ── End-of-lesson summary ────────────────────────────────────

function SummaryCard({
  unit, correctCount, totalCount, xpEarned,
}: {
  unit:         PracticeUnit;
  correctCount: number;
  totalCount:   number;
  xpEarned:     number;
}) {
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const tone =
    accuracy >= 90 ? { label: 'Great work!',   icon: '🌟', bg: 'from-emerald-50 to-white',  text: 'text-emerald-800' }
  : accuracy >= 70 ? { label: 'Nice job!',     icon: '✨', bg: 'from-[#F0E5FF] to-white',   text: 'text-[#5A3D7A]'   }
                   : { label: 'Keep at it.',   icon: '🌱', bg: 'from-amber-50 to-white',    text: 'text-amber-800'   };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 bg-gradient-to-br ${tone.bg}`}>
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#E8D5F0] p-8 text-center">
        <div className="text-5xl mb-3">{tone.icon}</div>
        <h2 className={`font-serif text-3xl font-bold leading-tight mb-1 ${tone.text}`}>
          {tone.label}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {unit.title} · {unit.level}
        </p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <SummaryStat label="Correct"  value={`${correctCount}/${totalCount}`} />
          <SummaryStat label="Accuracy" value={`${accuracy}%`} />
          <SummaryStat
            label="XP"
            value={`+${xpEarned}`}
            accent="text-[#5A3D7A]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Link
            href={`/dashboard/student/practice/lesson/${unit.id}`}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] shadow-md hover:shadow-lg active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" strokeWidth={2.5} />
            Practice again
          </Link>
          <Link
            href="/dashboard/student/practice"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-[#5A3D7A] bg-[#F0E5FF] hover:bg-[#E8D5FF] transition-colors"
          >
            <Home className="w-4 h-4" strokeWidth={2.5} />
            Back to Practice
          </Link>
        </div>

        {accuracy >= 90 && (
          <p className="mt-4 text-xs text-emerald-700 inline-flex items-center gap-1 justify-center">
            <Sparkles className="w-3 h-3" strokeWidth={2.5} />
            Perfect-run bonus included
          </p>
        )}
      </div>
    </div>
  );
}

function SummaryStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-[#FAFAFF] rounded-xl py-3 border border-[#F0E5FF]">
      <p className={`font-serif text-xl font-bold leading-none ${accent ?? 'text-[#2D1B4E]'}`}>{value}</p>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{label}</p>
    </div>
  );
}
