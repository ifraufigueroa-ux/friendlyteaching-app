// FriendlyTeaching.cl — Exercise runner (Daily Practice)
//
// Renders a single unit's exercises one at a time, grades locally,
// and surfaces the summary at the end. The parent page is responsible
// for calling recordSession() on completion.
//
// This version leans into the "arcade" feel: short synthesised SFX
// (correct / wrong / combo / complete), a shake on wrong, a bounce on
// correct, a floating "+10 XP" chip, a combo badge for consecutive
// right answers, and a confetti burst on the summary screen. All
// motion lives in globals.css keyframes; sound comes from the Web
// Audio tone generator in lib/soundEffects.ts (no asset files).

'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Check, X, Sparkles, ArrowRight, RotateCcw, Home, Flame, Volume2, VolumeX, Zap,
} from 'lucide-react';
import type {
  Exercise, PracticeUnit,
  MultipleChoiceExercise, FillBlankExercise, MatchPairsExercise,
} from '@/types/practice';
import { PRACTICE_XP } from '@/types/practice';
import {
  playCorrect, playWrong, playCombo, playComplete,
  isMuted, setMuted,
} from '@/lib/soundEffects';
import ConfettiBurst from './ConfettiBurst';

interface Props {
  unit:        PracticeUnit;
  onComplete:  (summary: { correctCount: number; totalCount: number }) => Promise<void> | void;
}

type Verdict = 'pending' | 'correct' | 'wrong';

// Varied micro-copy keeps the correct banner from feeling robotic.
const CORRECT_CHEERS = ['Nicely done!', 'Great!', 'You got it!', 'Spot on!', 'Yes!', 'Boom!'];

/** Human-readable correct answer for the banner (null when there's no single
 *  string to show, e.g. match-pairs — the body already shows the result inline). */
function getCorrectAnswer(ex: Exercise): string | null {
  switch (ex.type) {
    case 'multiple-choice': return ex.options[ex.correctIndex] ?? null;
    case 'fill-blank':      return ex.answers.join(' / ');
    case 'match-pairs':     return null;
  }
}

export function ExerciseRunner({ unit, onComplete }: Props) {
  const [idx, setIdx] = useState(0);
  const [verdict, setVerdict] = useState<Verdict>('pending');
  const [correctCount, setCorrectCount] = useState(0);
  const [combo, setCombo] = useState(0);        // consecutive correct in this run
  const [bestCombo, setBestCombo] = useState(0);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showXp, setShowXp] = useState(false);
  const [muted, setMutedState] = useState<boolean>(() => (typeof window === 'undefined' ? false : isMuted()));

  const total   = unit.exercises.length;
  const current = unit.exercises[idx];
  const progress = ((idx + (verdict !== 'pending' ? 1 : 0)) / total) * 100;

  // Freeze a cheer per exercise so it doesn't flicker on re-render.
  const cheer = useMemo(
    () => CORRECT_CHEERS[Math.floor(Math.random() * CORRECT_CHEERS.length)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [idx],
  );
  const correctAnswer = useMemo(() => getCorrectAnswer(current), [current]);

  function toggleMute() {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
  }

  function handleGrade(wasCorrect: boolean) {
    if (verdict !== 'pending') return;
    if (wasCorrect) {
      setCorrectCount(c => c + 1);
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setBestCombo(b => Math.max(b, nextCombo));
      // Combo blip from 3-in-a-row upward — keeps the first correct
      // answer clean and lets the reward escalate.
      if (nextCombo >= 3) {
        playCombo();
      } else {
        playCorrect();
      }
      // Trigger the floating +XP chip; it unmounts itself after the
      // keyframe finishes, but we flip state so it can re-trigger on
      // the next correct answer.
      setShowXp(true);
      window.setTimeout(() => setShowXp(false), 1200);
    } else {
      setCombo(0);
      playWrong();
    }
    setVerdict(wasCorrect ? 'correct' : 'wrong');
  }

  async function handleNext() {
    if (idx + 1 < total) {
      setIdx(i => i + 1);
      setVerdict('pending');
    } else {
      playComplete();
      setSaving(true);
      try {
        await onComplete({ correctCount, totalCount: total });
      } finally {
        setSaving(false);
        setDone(true);
      }
    }
  }

  // Enter advances once the exercise has been graded. Ref keeps the listener
  // stable while still calling the latest handleNext.
  const nextRef = useRef(handleNext);
  nextRef.current = handleNext;
  useEffect(() => {
    if (verdict === 'pending') return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (!saving) nextRef.current();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [verdict, saving]);

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
        bestCombo={bestCombo}
      />
    );
  }

  const bannerClasses =
    verdict === 'correct' ? 'bg-emerald-50 border-emerald-400'
    : verdict === 'wrong' ? 'bg-rose-50 border-rose-400'
    : 'bg-white border-transparent';

  // Shake wrapper around the body on wrong, bounce on correct. The
  // key swaps per verdict so the animation re-plays each time.
  const bodyAnim =
    verdict === 'wrong'   ? 'animate-ft-shake'
    : verdict === 'correct' ? 'animate-ft-pop'
    : '';

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#ede2fc' }}>
      {/* ── Top bar: close · progress · hearts(combo) · mute ── */}
      <div className="px-4 pt-4 flex items-center gap-3 flex-shrink-0">
        <Link
          href="/dashboard/student/practice"
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#6e3fb0]/70 hover:bg-white/60 hover:text-[#462573] transition text-lg font-bold"
          aria-label="Leave lesson"
        >
          ×
        </Link>
        <div className="flex-1 h-3 bg-white/80 rounded-full overflow-hidden border border-[#d9c9f0] shadow-inner">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(to right, #6e3fb0, #8352c7)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)',
            }}
          />
        </div>
        {combo >= 2 && (
          <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full text-[11px] font-black text-amber-700 shadow-sm">
            <Flame className="w-3 h-3 text-amber-500" strokeWidth={2.5} /> {combo}×
          </span>
        )}
        <span className="text-[10px] font-black uppercase tracking-widest text-[#583091] tabular-nums bg-white/70 px-2 py-1 rounded-full">
          {idx + 1} / {total}
        </span>
        <button
          onClick={toggleMute}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#6e3fb0]/70 hover:bg-white/60 hover:text-[#462573] transition"
          aria-label={muted ? 'Unmute sound' : 'Mute sound'}
          title={muted ? 'Unmute sound' : 'Mute sound'}
        >
          {muted ? <VolumeX className="w-4 h-4" strokeWidth={2.25} /> : <Volume2 className="w-4 h-4" strokeWidth={2.25} />}
        </button>
      </div>

      {/* ── Exercise body (shake / pop wrapper) ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 relative">
        <div key={`${idx}-${verdict}`} className={`w-full max-w-xl relative ${bodyAnim}`}>
          <p className="text-2xl md:text-3xl font-extrabold text-[#2D1B4E] leading-tight mb-6 text-center">
            {current.prompt}
          </p>
          <ExerciseBody
            exercise={current}
            verdict={verdict}
            onGrade={handleGrade}
          />

          {/* Floating +XP chip — centered horizontally above the body */}
          {showXp && (
            <span
              className="absolute left-1/2 -top-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-sm font-black shadow-lg animate-ft-float-up pointer-events-none"
              style={{ boxShadow: '0 6px 18px -4px rgba(16,185,129,0.5)' }}
            >
              <Zap className="w-3.5 h-3.5 fill-current" strokeWidth={2.5} /> +{PRACTICE_XP.perCorrect} XP
            </span>
          )}
        </div>
      </div>

      {/* ── Footer feedback banner (Duolingo-style) ── */}
      <div className={`flex-shrink-0 border-t-2 transition-colors duration-200 ${bannerClasses}`}>
        <div className="max-w-xl mx-auto px-4 py-5">
          {verdict === 'pending' ? (
            <p className="text-center text-xs font-bold text-[#6e3fb0]/60 uppercase tracking-widest">
              Pick an answer to continue
            </p>
          ) : (
            <div className="flex items-center gap-4">
              {/* Big round icon */}
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-md ring-4 ${
                verdict === 'correct'
                  ? 'bg-emerald-500 ring-emerald-500/20'
                  : 'bg-rose-500 ring-rose-500/20'
              }`}>
                {verdict === 'correct'
                  ? <Check className="w-7 h-7 text-white" strokeWidth={3} />
                  : <X className="w-7 h-7 text-white" strokeWidth={3} />}
              </div>

              {/* Headline + correct answer + explanation */}
              <div className="flex-1 min-w-0">
                <p className={`text-xl font-extrabold leading-tight ${
                  verdict === 'correct' ? 'text-emerald-800' : 'text-rose-800'
                }`}>
                  {verdict === 'correct'
                    ? (combo >= 3 ? `${cheer} · ${combo}× combo!` : cheer)
                    : 'Correct answer:'}
                </p>
                {verdict === 'wrong' && correctAnswer && (
                  <p className="font-semibold text-base text-rose-900 leading-tight mt-0.5 truncate">
                    {correctAnswer}
                  </p>
                )}
                {current.explain && (
                  <p className={`text-[13px] leading-snug mt-1 ${
                    verdict === 'correct' ? 'text-emerald-700/90' : 'text-rose-700/90'
                  }`}>
                    {current.explain}
                  </p>
                )}
              </div>

              {/* Continue — duo-btn variant that keys off verdict */}
              <button
                onClick={handleNext}
                disabled={saving}
                autoFocus
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-6 py-3 rounded-2xl text-[13px] font-black uppercase tracking-wider text-white active:scale-[0.98] transition-all ${
                  verdict === 'correct'
                    ? 'bg-emerald-500 hover:bg-emerald-600 duo-btn duo-btn--emerald'
                    : 'bg-rose-500 hover:bg-rose-600 duo-btn duo-btn--rose'
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
            ? 'border-2 border-[#d9c9f0] bg-white hover:border-[#8352c7] hover:bg-[#fcfbfe] hover:-translate-y-0.5'
          : isCorrect
            ? 'border-2 border-emerald-500 bg-emerald-50 ring-4 ring-emerald-500/20'
          : isPicked
            ? 'border-2 border-rose-500 bg-rose-50 ring-4 ring-rose-500/20'
            : 'border-2 border-[#ece3f7] bg-white opacity-50';
        return (
          <button
            key={i}
            onClick={() => handlePick(i)}
            disabled={locked}
            className={`text-left px-4 py-3 rounded-2xl text-[15px] font-semibold text-[#2D1B4E] transition-all shadow-sm ${tone}`}
          >
            <span className="inline-flex items-center gap-3">
              <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[11px] font-black ${
                !locked        ? 'border-[#d9c9f0] text-[#8352c7] bg-[#f5f0fb]'
                : isCorrect    ? 'border-emerald-500 bg-emerald-500 text-white'
                : isPicked     ? 'border-rose-500 bg-rose-500 text-white'
                                : 'border-gray-200 text-gray-300'
              }`}>
                {locked && isCorrect   ? <Check className="w-4 h-4" strokeWidth={3} />
                 : locked && isPicked  ? <X className="w-4 h-4" strokeWidth={3} />
                                        : String.fromCharCode(65 + i)}
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
      <div className="text-center text-xl md:text-2xl text-[#2D1B4E] font-semibold leading-relaxed">
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
                  !locked ? 'border-[#8352c7] focus:border-[#6e3fb0]'
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
            className="px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-wider text-white bg-[#6e3fb0] hover:bg-[#583091] duo-btn disabled:opacity-40"
          >
            Check
          </button>
        </div>
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
  const shuffledRights = useMemo(() => {
    const arr = ex.pairs.map((p, i) => ({ right: p.right, originalIndex: i }));
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex.id]);

  const [picks, setPicks] = useState<(number | null)[]>(() => Array(ex.pairs.length).fill(null));
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
      for (let k = 0; k < next.length; k++) if (next[k] === ri) next[k] = null;
      next[activeLeft] = ri;
      return next;
    });
    setActiveLeft(null);
  }

  function handleCheck() {
    if (locked) return;
    if (picks.some(p => p === null)) return;
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
                  ? 'border-[#6e3fb0] bg-[#f5f0fb] text-[#462573]'
                  : assigned
                    ? 'border-[#d9c9f0] bg-white text-[#462573]'
                    : 'border-[#ece3f7] bg-white text-[#2D1B4E] hover:border-[#8352c7]'
              : isCorrect ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : isWrong ? 'border-rose-300 bg-rose-50 text-rose-800'
                                    : 'border-gray-100 bg-white text-gray-400';
            return (
              <button
                key={i}
                onClick={() => pickLeft(i)}
                disabled={locked}
                className={`w-full text-left px-3 py-2.5 border-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${tone}`}
              >
                {p.left}
                {picks[i] !== null && (
                  <span className="block text-xs text-[#8352c7] mt-0.5">
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
                    ? 'border-[#8352c7] bg-white text-[#2D1B4E] hover:border-[#6e3fb0] hover:bg-[#f5f0fb]'
                    : 'border-[#ece3f7] bg-white text-[#2D1B4E] opacity-80'
              : 'border-gray-100 bg-gray-50 text-gray-500';
            return (
              <button
                key={ri}
                onClick={() => pickRight(ri)}
                disabled={locked || assigned || activeLeft === null}
                className={`w-full text-left px-3 py-2.5 border-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${tone}`}
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
            className="px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-wider text-white bg-[#6e3fb0] hover:bg-[#583091] duo-btn disabled:opacity-40"
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
  unit, correctCount, totalCount, xpEarned, bestCombo,
}: {
  unit:         PracticeUnit;
  correctCount: number;
  totalCount:   number;
  xpEarned:     number;
  bestCombo:    number;
}) {
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const tone =
    accuracy >= 90 ? { label: 'Great work!',   icon: '🌟', text: 'text-emerald-800' }
  : accuracy >= 70 ? { label: 'Nice job!',     icon: '✨', text: 'text-[#462573]'   }
                   : { label: 'Keep at it.',   icon: '🌱', text: 'text-amber-800'   };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ backgroundColor: '#ede2fc' }}>
      {/* Confetti burst — auto-unmounts after ~1.6s */}
      <ConfettiBurst active count={48} />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border-2 border-[#d9c9f0] p-8 text-center relative z-10 animate-ft-pop">
        <div className="text-5xl mb-3">{tone.icon}</div>
        <h2 className={`text-3xl font-extrabold leading-tight mb-1 ${tone.text}`}>
          {tone.label}
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          {unit.title} · {unit.level}
        </p>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <SummaryStat label="Correct"  value={`${correctCount}/${totalCount}`} />
          <SummaryStat label="Accuracy" value={`${accuracy}%`} />
          <SummaryStat
            label="XP"
            value={`+${xpEarned}`}
            accent="text-[#6e3fb0]"
          />
        </div>

        {bestCombo >= 3 && (
          <p className="mb-5 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
            <Flame className="w-3.5 h-3.5 text-amber-500" strokeWidth={2.5} /> Best combo · {bestCombo}×
          </p>
        )}

        <div className="flex flex-col gap-2">
          <Link
            href={`/dashboard/student/practice/lesson/${unit.id}`}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-black uppercase tracking-wider text-white bg-[#6e3fb0] hover:bg-[#583091] duo-btn transition-all"
          >
            <RotateCcw className="w-4 h-4" strokeWidth={2.5} />
            Practice again
          </Link>
          <Link
            href="/dashboard/student/practice"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-[#462573] bg-[#f5f0fb] hover:bg-[#ece3f7] transition-colors"
          >
            <Home className="w-4 h-4" strokeWidth={2.5} />
            Back to Practice
          </Link>
        </div>

        {accuracy >= 90 && (
          <p className="mt-4 text-xs text-emerald-700 inline-flex items-center gap-1 justify-center font-semibold">
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
    <div className="bg-[#f5f0fb] rounded-2xl py-3 border border-[#ece3f7]">
      <p className={`text-xl font-extrabold leading-none ${accent ?? 'text-[#2D1B4E]'}`}>{value}</p>
      <p className="text-[10px] font-black uppercase tracking-widest text-[#8352c7] mt-1">{label}</p>
    </div>
  );
}
