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
  Check, X, Sparkles, ArrowRight, RotateCcw, Home, Flame, Volume2, VolumeX, Zap, Clock, Headphones, Star, BookOpen, ChevronDown,
} from 'lucide-react';
import type {
  Exercise, PracticeUnit,
  MultipleChoiceExercise, FillBlankExercise, MatchPairsExercise, ListenChooseExercise,
  PronunciationExercise,
} from '@/types/practice';
import { PRACTICE_XP, starsForAccuracy, STARS_MAX } from '@/types/practice';
import {
  playCorrect, playWrong, playCombo, playComplete,
  isMuted, setMuted,
} from '@/lib/soundEffects';
import ConfettiBurst from './ConfettiBurst';
import FullscreenButton from '@/components/ui/FullscreenButton';
import { usePracticeAudios } from '@/hooks/usePracticeAudios';
import PronunciationBody from './PronunciationBody';

interface Props {
  unit:        PracticeUnit;
  onComplete:  (summary: { correctCount: number; totalCount: number }) => Promise<void> | void;
  /** Student id. Threaded through so PronunciationBody can log attempts
   *  under pronunciationAttempts/{studentId}/items for the teacher view. */
  studentId?:  string | null;
}

type Verdict = 'pending' | 'correct' | 'wrong';

/** One wrong attempt captured for the end-of-lesson review. `pickedLabel`
 *  is the text of what the student chose (or filled in) — null when the
 *  exercise type doesn't produce a single human-readable pick (match
 *  pairs). The review renders correct answer + explain unconditionally,
 *  and the pick when present. */
interface WrongAttempt {
  exercise:    Exercise;
  pickedLabel: string | null;
}

// Varied micro-copy keeps the correct banner from feeling robotic.
const CORRECT_CHEERS = ['Nicely done!', 'Great!', 'You got it!', 'Spot on!', 'Yes!', 'Boom!'];

/** Human-readable correct answer for the banner (null when there's no single
 *  string to show, e.g. match-pairs — the body already shows the result inline). */
function getCorrectAnswer(ex: Exercise): string | null {
  switch (ex.type) {
    case 'multiple-choice': return ex.options[ex.correctIndex] ?? null;
    case 'fill-blank':      return ex.answers.join(' / ');
    case 'match-pairs':     return null;
    case 'listen-choose':   return ex.options[ex.correctIndex] ?? null;
    case 'pronunciation':   return ex.targetPhrase;
  }
}

export function ExerciseRunner({ unit, onComplete, studentId }: Props) {
  // Hosted audio URLs for every listen-choose exercise in this unit,
  // seeded by scripts/generate-practice-audios.js. Empty object until
  // the batch runs — ListenChooseBody falls back to SpeechSynthesis.
  const audiosByExerciseId = usePracticeAudios(unit.id);
  const bodyWrapRef = useRef<HTMLDivElement | null>(null);
  const [idx, setIdx] = useState(0);
  const [verdict, setVerdict] = useState<Verdict>('pending');
  const [correctCount, setCorrectCount] = useState(0);
  const [combo, setCombo] = useState(0);        // consecutive correct in this run
  const [bestCombo, setBestCombo] = useState(0);
  const [milestone, setMilestone] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showXp, setShowXp] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState<WrongAttempt[]>([]);
  const [muted, setMutedState] = useState<boolean>(() => (typeof window === 'undefined' ? false : isMuted()));
  const [elapsed, setElapsed] = useState(0);    // seconds since the session started

  // Session timer — ticks every second while the runner is on-screen.
  useEffect(() => {
    if (done) return;
    const started = Date.now();
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [done]);

  // Clear the milestone overlay after ~1.8s (matches the keyframe).
  useEffect(() => {
    if (milestone === null) return;
    const id = window.setTimeout(() => setMilestone(null), 1800);
    return () => window.clearTimeout(id);
  }, [milestone]);

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

  function handleGrade(wasCorrect: boolean, pickedLabel: string | null = null) {
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
      // Milestone celebration every 5 in a row — overlay pops in the
      // middle of the screen with its own keyframe.
      if (nextCombo > 0 && nextCombo % 5 === 0) {
        setMilestone(nextCombo);
      }
      // Trigger the floating +XP chip; it unmounts itself after the
      // keyframe finishes, but we flip state so it can re-trigger on
      // the next correct answer.
      setShowXp(true);
      window.setTimeout(() => setShowXp(false), 1200);
    } else {
      setCombo(0);
      playWrong();
      // Capture the miss for the end-of-lesson review. We stash the
      // whole exercise object (small, already in memory) + what the
      // student picked so the review can render both without having
      // to re-resolve labels from indices later.
      setWrongAttempts(prev => [...prev, { exercise: current, pickedLabel }]);
    }
    setVerdict(wasCorrect ? 'correct' : 'wrong');
  }

  function formatElapsed(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
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

  // Shake wrapper around the body on wrong, bounce on correct. On a
  // fresh pending prompt the body fades in from below. The key swaps
  // per verdict so the animation re-plays each time.
  // Trigger shake/pop imperatively on verdict change WITHOUT remounting
  // the body wrapper (C8 fix). A straight key={verdict} remount reset
  // FillBlank `vals` and MatchPairs `picks` to empty the moment the
  // student pressed Check — they saw coloured but blank inputs. Here we
  // remove the animation class, force a reflow, then re-add it so the
  // CSS keyframes restart while the subtree keeps its state.
  //
  // MUST run before any early return (the `if (done)` below) — otherwise
  // the hook count drops the moment `done` flips to true after the last
  // exercise and React throws "Rendered fewer hooks than during the
  // previous render" instead of showing the SummaryCard. Incident
  // 2026-11-24.
  useEffect(() => {
    const el = bodyWrapRef.current;
    if (!el || verdict === 'pending') return;
    el.classList.remove('animate-ft-shake', 'animate-ft-pop');
    void el.offsetWidth; // force reflow
    el.classList.add(verdict === 'wrong' ? 'animate-ft-shake' : 'animate-ft-pop');
  }, [verdict]);

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
        elapsedSec={elapsed}
        wrongAttempts={wrongAttempts}
      />
    );
  }

  const bannerClasses =
    verdict === 'correct' ? 'bg-emerald-50 border-emerald-400'
    : verdict === 'wrong' ? 'bg-rose-50 border-rose-400'
    : 'bg-white border-transparent';

  return (
    <div className="min-h-dvh flex flex-col bg-grid relative">
      {/* ── Top bar: close · progress · combo · counter · timer · mute · fullscreen ── */}
      <div className="px-4 pt-4 flex items-center gap-2 md:gap-3 flex-shrink-0">
        <Link
          href="/dashboard/student/practice"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[#845ec2]/80 hover:bg-white hover:text-[#4b3869] border border-[#e5d9f2]/60 bg-white/70 transition text-lg font-bold flex-shrink-0"
          aria-label="Leave lesson"
        >
          ×
        </Link>
        <div className="flex-1 h-3 bg-white/80 rounded-full overflow-hidden border border-[#e5d9f2] shadow-inner">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(to right, #845ec2, #9474c4)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)',
            }}
          />
        </div>
        {combo >= 2 && (
          <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full text-[11px] font-black text-amber-700 shadow-sm animate-ft-pop">
            <Flame className="w-3 h-3 text-amber-500" strokeWidth={2.5} /> {combo}×
          </span>
        )}
        <span className="text-[10px] font-black uppercase tracking-widest text-[#6b4c9a] tabular-nums bg-white/80 border border-[#e5d9f2]/60 px-2 py-1 rounded-full">
          {idx + 1} / {total}
        </span>
        <span className="hidden sm:inline-flex items-center gap-1 bg-white/80 border border-[#e5d9f2]/60 px-2 py-1 rounded-full text-[11px] font-bold text-[#6b4c9a] tabular-nums">
          <Clock className="w-3 h-3" strokeWidth={2.5} />
          {formatElapsed(elapsed)}
        </span>
        <button
          onClick={toggleMute}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[#845ec2]/80 bg-white/70 border border-[#e5d9f2]/60 hover:bg-white hover:text-[#4b3869] transition flex-shrink-0"
          aria-label={muted ? 'Unmute sound' : 'Mute sound'}
          title={muted ? 'Unmute sound' : 'Mute sound'}
        >
          {muted ? <VolumeX className="w-4 h-4" strokeWidth={2.25} /> : <Volume2 className="w-4 h-4" strokeWidth={2.25} />}
        </button>
        <FullscreenButton
          variant="inline"
          className="!w-9 !h-9 !rounded-xl !bg-white/70 !text-[#845ec2] !border-[#e5d9f2]/60 hover:!bg-white hover:!text-[#4b3869] active:!scale-100 flex-shrink-0"
        />
      </div>

      {/* ── Milestone overlay — fires every 5 in a row ── */}
      {milestone !== null && (
        <div className="pointer-events-none absolute left-1/2 top-24 z-40 animate-ft-milestone">
          <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-white font-black uppercase tracking-wider text-sm shadow-xl border-2 border-white">
            <Flame className="w-5 h-5" strokeWidth={2.5} />
            {milestone} in a row!
          </div>
        </div>
      )}

      {/* ── Exercise body ──
          C8 fix (audit 2026-11-23): keying this wrapper on verdict too
          remounted the body on Check → FillBlank/MatchPairs state
          vanished. Now keyed on idx only (so switching exercises
          still remounts), and the verdict shake/pop is driven
          imperatively by the useEffect above using bodyWrapRef. */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 relative">
        <div
          key={idx}
          ref={bodyWrapRef}
          className="w-full max-w-xl relative animate-ft-fade-in"
        >
          <div className="text-center mb-6">
            <span className="inline-block bg-[#f3eefc] text-[#845ec2] text-[10px] font-fun font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
              Daily challenge
            </span>
            <p className="font-fun text-2xl md:text-3xl font-bold text-[#4b3869] leading-tight">
              {current.prompt}
            </p>
          </div>
          <ExerciseBody
            exercise={current}
            verdict={verdict}
            onGrade={handleGrade}
            audioUrl={audiosByExerciseId[current.id]}
            studentId={studentId}
            unitId={unit.id}
            unitLevel={unit.level}
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
            <p className="text-center text-xs font-bold text-[#845ec2]/60 uppercase tracking-widest">
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

              {/* Continue — btn-game variant that keys off verdict */}
              <button
                onClick={handleNext}
                disabled={saving}
                autoFocus
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-6 py-3 rounded-2xl text-[13px] font-fun font-bold uppercase tracking-wider btn-game ${
                  verdict === 'correct' ? 'btn-game--emerald' : 'btn-game--rose'
                }`}
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
  exercise, verdict, onGrade, audioUrl,
  studentId, unitId, unitLevel,
}: {
  exercise:  Exercise;
  verdict:   Verdict;
  onGrade:   (correct: boolean, pickedLabel?: string | null) => void;
  audioUrl?: string;
  studentId?: string | null;
  unitId:     string;
  unitLevel:  string;
}) {
  switch (exercise.type) {
    case 'multiple-choice':
      return <MultipleChoiceBody ex={exercise} verdict={verdict} onGrade={onGrade} />;
    case 'fill-blank':
      return <FillBlankBody ex={exercise} verdict={verdict} onGrade={onGrade} />;
    case 'match-pairs':
      return <MatchPairsBody ex={exercise} verdict={verdict} onGrade={onGrade} />;
    case 'listen-choose':
      return <ListenChooseBody ex={exercise} verdict={verdict} onGrade={onGrade} audioUrl={audioUrl} />;
    case 'pronunciation':
      return <PronunciationBody
        ex={exercise}
        verdict={verdict === 'pending' ? null : verdict === 'correct' ? 'correct' : 'incorrect'}
        onGrade={onGrade}
        audioUrl={audioUrl}
        studentId={studentId}
        unitId={unitId}
        unitLevel={unitLevel}
      />;
  }
}

// ── Listen + choose ──────────────────────────────────────────

function ListenChooseBody({
  ex, verdict, onGrade, audioUrl,
}: {
  ex: ListenChooseExercise;
  verdict: Verdict;
  onGrade: (correct: boolean, pickedLabel?: string | null) => void;
  /** Resolved URL from Firestore via usePracticeAudios; wins over
   *  ex.audioUrl because the data file rarely carries it. */
  audioUrl?: string;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const locked = verdict !== 'pending';
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const resolvedUrl = audioUrl || ex.audioUrl;

  function handlePlay() {
    if (resolvedUrl) {
      const el = audioRef.current;
      if (!el) return;
      el.currentTime = 0;
      el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      return;
    }
    // Browser SpeechSynthesis fallback for authoring before the
    // ElevenLabs batch has shipped. Not great, but keeps the UX
    // testable end-to-end.
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(ex.audioScript);
    u.lang = 'en-US';
    u.rate = 0.95;
    u.onend = () => setPlaying(false);
    setPlaying(true);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  function handlePick(i: number) {
    if (locked) return;
    setPicked(i);
    onGrade(i === ex.correctIndex, ex.options[i] ?? null);
  }

  return (
    <div className="space-y-4">
      {/* Play button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handlePlay}
          disabled={locked && !resolvedUrl}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-fun font-bold text-white bg-[#845ec2] shadow-md hover:bg-[#6b4c9a] active:scale-95 transition-all"
        >
          <Headphones className={`w-5 h-5 ${playing ? 'animate-pulse' : ''}`} strokeWidth={2.25} />
          {playing ? 'Reproduciendo…' : 'Escuchar'}
        </button>
      </div>
      {resolvedUrl && (
        <audio
          ref={audioRef}
          src={resolvedUrl}
          preload="auto"
          onEnded={() => setPlaying(false)}
          className="hidden"
        />
      )}
      {!resolvedUrl && (
        <p className="text-center text-[10px] text-slate-400">
          Audio pendiente de generación — usando TTS del navegador como fallback.
        </p>
      )}

      {/* Options */}
      <div className="grid grid-cols-1 gap-3">
        {ex.options.map((opt, i) => {
          const isPicked  = picked === i;
          const isCorrect = i === ex.correctIndex;
          const stateClass =
            !locked
              ? ''
            : isCorrect
              ? 'game-card--correct'
            : isPicked
              ? 'game-card--wrong'
              : 'opacity-50';
          return (
            <button
              key={i}
              onClick={() => handlePick(i)}
              disabled={locked}
              className={`game-card ${stateClass} text-left px-4 py-3.5 rounded-2xl flex items-center justify-between`}
            >
              <span className="inline-flex items-center gap-3 font-fun font-semibold text-[15px] text-[#4b3869]">
                <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-fun font-bold ${
                  !locked        ? 'bg-[#f3eefc] text-[#845ec2]'
                  : isCorrect    ? 'bg-emerald-500 text-white'
                  : isPicked     ? 'bg-rose-500 text-white'
                                  : 'bg-gray-100 text-gray-300'
                }`}>
                  {locked && isCorrect  ? <Check className="w-4 h-4" strokeWidth={3} />
                   : locked && isPicked ? <X className="w-4 h-4" strokeWidth={3} />
                                        : String.fromCharCode(65 + i)}
                </span>
                {opt}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Multiple choice ──────────────────────────────────────────

function MultipleChoiceBody({
  ex, verdict, onGrade,
}: {
  ex: MultipleChoiceExercise;
  verdict: Verdict;
  onGrade: (correct: boolean, pickedLabel?: string | null) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const locked = verdict !== 'pending';

  function handlePick(i: number) {
    if (locked) return;
    setPicked(i);
    onGrade(i === ex.correctIndex, ex.options[i] ?? null);
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {ex.options.map((opt, i) => {
        const isPicked  = picked === i;
        const isCorrect = i === ex.correctIndex;
        const stateClass =
          !locked
            ? ''
          : isCorrect
            ? 'game-card--correct'
          : isPicked
            ? 'game-card--wrong'
            : 'opacity-50';
        return (
          <button
            key={i}
            onClick={() => handlePick(i)}
            disabled={locked}
            className={`game-card ${stateClass} text-left px-4 py-3.5 rounded-2xl flex items-center justify-between`}
          >
            <span className="inline-flex items-center gap-3 font-fun font-semibold text-[15px] text-[#4b3869]">
              <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-fun font-bold ${
                !locked        ? 'bg-[#f3eefc] text-[#845ec2]'
                : isCorrect    ? 'bg-emerald-500 text-white'
                : isPicked     ? 'bg-rose-500 text-white'
                                : 'bg-gray-100 text-gray-300'
              }`}>
                {locked && isCorrect   ? <Check className="w-4 h-4" strokeWidth={3} />
                 : locked && isPicked  ? <X className="w-4 h-4" strokeWidth={3} />
                                        : String.fromCharCode(65 + i)}
              </span>
              {opt}
            </span>
            {locked && isCorrect && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg">
                +{PRACTICE_XP.perCorrect} XP
              </span>
            )}
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
  onGrade: (correct: boolean, pickedLabel?: string | null) => void;
}) {
  const parts = ex.sentence.split('___');
  const blankCount = parts.length - 1;
  const [vals, setVals] = useState<string[]>(() => Array(blankCount).fill(''));
  const locked = verdict !== 'pending';
  // Ref array so we can imperatively focus the first blank on mount
  // (desktop UX: "apretar Enter y encontrar el cuadro activado al
  // comenzar la pregunta nueva"). The component remounts per exercise
  // (key={idx} upstream), so this effect runs on every question.
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => {
    const first = inputRefs.current[0];
    if (first) first.focus();
  }, [ex.id]);

  function normalize(s: string): string {
    return s.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function handleCheck() {
    if (locked) return;
    if (vals.some(v => !v.trim())) return; // all blanks must be filled
    const allCorrect = ex.answers.every((expected, i) => {
      const got = normalize(vals[i] ?? '');
      if (got === normalize(expected)) return true;
      const alts = ex.alts?.[i] ?? [];
      return alts.some(a => normalize(a) === got);
    });
    // Join the student's fills so the review can show what they typed.
    const picked = vals.map(v => v.trim()).join(' / ') || null;
    onGrade(allCorrect, picked);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, i: number) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    // If there's a next empty blank, jump to it; otherwise check.
    const nextEmpty = inputRefs.current.findIndex((el, j) => j > i && el && !vals[j]?.trim());
    if (nextEmpty !== -1) {
      inputRefs.current[nextEmpty]?.focus();
      return;
    }
    handleCheck();
  }

  return (
    <div className="space-y-5">
      <div className="text-center text-xl md:text-2xl text-[#2D1B4E] font-semibold leading-relaxed">
        {parts.map((p, i) => (
          <span key={i}>
            {p}
            {i < blankCount && (
              <input
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                value={vals[i]}
                onChange={e => setVals(v => v.map((x, j) => j === i ? e.target.value : x))}
                onKeyDown={e => handleKeyDown(e, i)}
                disabled={locked}
                autoFocus={i === 0}
                className={`inline-block mx-1 min-w-[120px] px-2 py-0.5 text-center border-b-2 bg-transparent focus:outline-none ${
                  !locked ? 'border-[#9474c4] focus:border-[#845ec2]'
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
            className="btn-game px-8 py-3 rounded-2xl text-sm font-fun font-bold uppercase tracking-wider"
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
  onGrade: (correct: boolean, pickedLabel?: string | null) => void;
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
                  ? 'border-[#845ec2] bg-[#f3eefc] text-[#4b3869]'
                  : assigned
                    ? 'border-[#e5d9f2] bg-white text-[#4b3869]'
                    : 'border-[#e5d9f2] bg-white text-[#2D1B4E] hover:border-[#9474c4]'
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
                  <span className="block text-xs text-[#9474c4] mt-0.5">
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
                    ? 'border-[#9474c4] bg-white text-[#2D1B4E] hover:border-[#845ec2] hover:bg-[#f3eefc]'
                    : 'border-[#e5d9f2] bg-white text-[#2D1B4E] opacity-80'
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
            className="btn-game px-8 py-3 rounded-2xl text-sm font-fun font-bold uppercase tracking-wider"
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
  unit, correctCount, totalCount, xpEarned, bestCombo, elapsedSec, wrongAttempts,
}: {
  unit:          PracticeUnit;
  correctCount:  number;
  totalCount:    number;
  xpEarned:      number;
  bestCombo:     number;
  elapsedSec:    number;
  wrongAttempts: WrongAttempt[];
}) {
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const tone =
    accuracy >= 90 ? { label: 'Great work!',   icon: '🌟', text: 'text-emerald-800' }
  : accuracy >= 70 ? { label: 'Nice job!',     icon: '✨', text: 'text-[#4b3869]'   }
                   : { label: 'Keep at it.',   icon: '🌱', text: 'text-amber-800'   };

  const mins = Math.floor(elapsedSec / 60);
  const secs = elapsedSec % 60;
  const timeLabel = `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="min-h-dvh flex items-center justify-center p-6 relative overflow-hidden bg-grid">
      {/* Confetti burst — auto-unmounts after ~1.6s */}
      <ConfettiBurst active count={48} />

      <div className="w-full max-w-md game-card rounded-3xl p-8 text-center relative z-10 animate-ft-pop">
        <div className="text-5xl mb-3">{tone.icon}</div>
        <h2 className={`font-fun text-3xl font-bold leading-tight mb-1 ${tone.text}`}>
          {tone.label}
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          {unit.title} · {unit.level}
        </p>

        {/* 3-star earning display — same thresholds as starsForAccuracy */}
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {Array.from({ length: STARS_MAX }).map((_, i) => {
            const earned = i < starsForAccuracy(accuracy / 100);
            return (
              <Star
                key={i}
                className={`w-7 h-7 ${earned ? 'text-amber-400 fill-current' : 'text-gray-200 fill-current'}`}
                strokeWidth={0}
              />
            );
          })}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
          <SummaryStat label="Correct"  value={`${correctCount}/${totalCount}`} />
          <SummaryStat label="Accuracy" value={`${accuracy}%`} />
          <SummaryStat label="Time"     value={timeLabel} />
          <SummaryStat
            label="XP"
            value={`+${xpEarned}`}
            accent="text-[#845ec2]"
          />
        </div>

        {bestCombo >= 3 && (
          <p className="mb-3 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
            <Flame className="w-3.5 h-3.5 text-amber-500" strokeWidth={2.5} /> Best combo · {bestCombo}×
          </p>
        )}
        {starsForAccuracy(accuracy / 100) < 2 && (
          <p className="mb-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
            Necesitás al menos 2 estrellas (70%) para desbloquear la siguiente unidad. ¡Reintentá!
          </p>
        )}

        {wrongAttempts.length > 0 && (
          <MistakesReview attempts={wrongAttempts} />
        )}

        <div className="flex flex-col gap-2">
          <Link
            href={`/dashboard/student/practice/lesson/${unit.id}`}
            className="btn-game w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-fun font-bold uppercase tracking-wider"
          >
            <RotateCcw className="w-4 h-4" strokeWidth={2.5} />
            Practice again
          </Link>
          <Link
            href="/dashboard/student/practice"
            className="btn-game btn-game--ghost w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-fun font-bold"
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

/** Student-facing review of every missed question in this lesson.
 *  Collapsed by default so the main summary KPIs breathe; one click
 *  reveals the stack. Each row shows: the prompt, what the student
 *  picked (when we captured it), the correct answer, and the explain
 *  one-liner. The whole thing is build from state already in memory —
 *  no extra fetches, no Firestore writes.
 *
 *  Added 2026-11-25: immediate feedback is already shown mid-lesson,
 *  but students sprint through and don't re-read the banner. Giving
 *  them a single screen at the end with every miss + reason turns
 *  the summary into a study moment rather than just a scoreboard. */
function MistakesReview({ attempts }: { attempts: WrongAttempt[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4 text-left">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl border-2 border-[#e5d9f2] bg-white hover:bg-[#f7efff] transition-colors"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2 text-sm font-fun font-bold text-[#4b3869]">
          <BookOpen className="w-4 h-4 text-[#845ec2]" strokeWidth={2.25} />
          Review your mistakes
          <span className="ml-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-black tabular-nums">
            {attempts.length}
          </span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[#845ec2] transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={2.5}
        />
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {attempts.map((a, i) => (
            <MistakeRow key={`${a.exercise.id}-${i}`} attempt={a} index={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function MistakeRow({ attempt, index }: { attempt: WrongAttempt; index: number }) {
  const { exercise, pickedLabel } = attempt;
  const correctLabel = getCorrectAnswer(exercise);

  return (
    <div className="rounded-2xl border border-[#e5d9f2] bg-white p-4 space-y-2 text-left">
      <div className="flex items-start gap-2">
        <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-[11px] font-black tabular-nums">
          {index}
        </span>
        <p className="text-sm font-semibold text-[#2D1B4E] leading-snug">
          {exercise.prompt}
        </p>
      </div>

      {pickedLabel && (
        <div className="pl-8">
          <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-0.5">
            Your answer
          </p>
          <p className="text-sm text-rose-700 line-through decoration-rose-400/60">
            {pickedLabel}
          </p>
        </div>
      )}

      {correctLabel && (
        <div className="pl-8">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-0.5">
            Correct answer
          </p>
          <p className="text-sm font-semibold text-emerald-800">
            {correctLabel}
          </p>
        </div>
      )}

      {exercise.type === 'match-pairs' && (
        <div className="pl-8">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">
            Correct pairs
          </p>
          <ul className="text-sm text-emerald-800 space-y-0.5">
            {exercise.pairs.map((p, i) => (
              <li key={i} className="leading-snug">
                <span className="font-semibold">{p.left}</span>
                <span className="text-emerald-500 mx-1.5">→</span>
                <span>{p.right}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {exercise.explain && (
        <div className="pl-8 pt-1">
          <p className="text-[12px] leading-snug text-[#5A3D7A] bg-[#f7efff] border border-[#e5d9f2] rounded-xl px-3 py-2">
            <strong className="font-bold">Why:</strong> {exercise.explain}
          </p>
        </div>
      )}
    </div>
  );
}

function SummaryStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-[#f3eefc] rounded-2xl py-3 border border-[#e5d9f2]">
      <p className={`text-xl font-extrabold leading-none ${accent ?? 'text-[#2D1B4E]'}`}>{value}</p>
      <p className="text-[10px] font-black uppercase tracking-widest text-[#9474c4] mt-1">{label}</p>
    </div>
  );
}
