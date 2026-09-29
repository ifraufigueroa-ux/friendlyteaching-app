'use client';
// FriendlyTeaching.cl — Q&A Simulator runner
// Gamified forum-style question practice: timer, score, streak, category filters,
// and 3 answer modes (verbal+self-eval, audio recording, written).
//
// This page is parameterized by simulation id. The library of simulations lives
// in src/data/qa-simulations/ — drop a JSON + 1 line in index.ts to add one.

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  getSimulation,
  getCategoryMeta,
  getCefrMeta,
  categoriesInSimulation,
  cefrLevelsInSimulation,
  QA_CEFR_ORDER,
  type QASimulation,
  type QAQuestion,
  type QACefrLevel,
} from '@/data/qa-simulations';
import FullscreenButton from '@/components/ui/FullscreenButton';

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'setup' | 'playing' | 'finished';
type AnswerMode = 'verbal' | 'recording' | 'written';
type Verdict = 'great' | 'good' | 'needs-work' | 'skip';
type TimerOption = 0 | 30 | 60 | 90 | 120;

const VERDICT_META: Record<Verdict, { label: string; pts: number; emoji: string; color: string; bg: string; border: string }> = {
  'great':      { label: 'Excelente', pts: 3, emoji: '🎯', color: '#047857', bg: '#D1FAE5', border: '#6EE7B7' },
  'good':       { label: 'Bien',      pts: 2, emoji: '👍', color: '#1E40AF', bg: '#DBEAFE', border: '#93C5FD' },
  'needs-work': { label: 'A mejorar', pts: 1, emoji: '🔁', color: '#B45309', bg: '#FEF3C7', border: '#FCD34D' },
  'skip':       { label: 'Saltada',   pts: 0, emoji: '⏭️', color: '#6B7280', bg: '#F3F4F6', border: '#D1D5DB' },
};

interface PlayLog {
  question:       QAQuestion;
  verdict:        Verdict;
  timeMs:         number;
  audioUrl?:      string;
  writtenAnswer?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Take N questions from a CEFR-tagged pool, distributed proportionally across
 *  the levels present so the session actually spans A1 → B2 instead of stopping
 *  at "the first N A1 questions". Result stays in CEFR order (A1 → C1),
 *  and inside each level keeps declaration order — matching the sim's
 *  preserveOrder contract. */
function stratifiedByCefr(pool: QAQuestion[], n: number): QAQuestion[] {
  if (n >= pool.length) return [...pool];

  const byLevel = new Map<QACefrLevel, QAQuestion[]>();
  for (const q of pool) {
    const level = q.cefr ?? 'A1';
    const bucket = byLevel.get(level) ?? [];
    bucket.push(q);
    byLevel.set(level, bucket);
  }
  const levels = QA_CEFR_ORDER.filter(l => byLevel.has(l));

  // Proportional quotas with at least 1 per present level, then adjust to N.
  const quotas = new Map<QACefrLevel, number>();
  const remainders = new Map<QACefrLevel, number>();
  let assigned = 0;
  for (const l of levels) {
    const size = byLevel.get(l)!.length;
    const raw = (size / pool.length) * n;
    const floor = Math.max(1, Math.floor(raw));
    quotas.set(l, Math.min(floor, size));
    remainders.set(l, raw - Math.floor(raw));
    assigned += quotas.get(l)!;
  }
  // Grow: bump levels with largest fractional remainder first, respecting
  // per-level capacity.
  while (assigned < n) {
    const candidate = levels
      .filter(l => quotas.get(l)! < byLevel.get(l)!.length)
      .sort((a, b) => (remainders.get(b) ?? 0) - (remainders.get(a) ?? 0))[0];
    if (!candidate) break;
    quotas.set(candidate, quotas.get(candidate)! + 1);
    remainders.set(candidate, (remainders.get(candidate) ?? 0) - 1); // fairness
    assigned++;
  }
  // Trim: pull from the level with the largest quota (>1) first.
  while (assigned > n) {
    const victim = levels
      .filter(l => quotas.get(l)! > 1)
      .sort((a, b) => quotas.get(b)! - quotas.get(a)!)[0];
    if (!victim) break;
    quotas.set(victim, quotas.get(victim)! - 1);
    assigned--;
  }

  return levels.flatMap(l => byLevel.get(l)!.slice(0, quotas.get(l)!));
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const sec = ms / 1000;
  if (sec < 60) return `${sec.toFixed(1)}s`;
  const min = Math.floor(sec / 60);
  const rem = Math.round(sec - min * 60);
  return `${min}m ${rem}s`;
}

// ── Page wrapper: resolve simulation by id ───────────────────────────────────

export default function QASimulatorRunnerPage() {
  const params = useParams<{ id: string }>();
  const simulation = params?.id ? getSimulation(params.id) : undefined;

  if (!simulation) return <NotFoundScreen />;
  return <QASimulator simulation={simulation} />;
}

function NotFoundScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F5FF] via-[#F3EEFF] to-[#EEF2FF] flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-lg p-8 text-center max-w-sm">
        <div className="text-5xl mb-3">🔎</div>
        <h1 className="text-lg font-bold text-[#5A3D7A] mb-1">Simulación no encontrada</h1>
        <p className="text-sm text-gray-500 mb-5">No existe una simulación con ese identificador.</p>
        <Link href="/dashboard/teacher/tools/qa-simulator"
          className="inline-block px-6 py-3 rounded-xl bg-[#5A3D7A] text-white text-sm font-bold hover:bg-[#7B5EA7] transition-colors">
          Ver simulaciones
        </Link>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

function QASimulator({ simulation }: { simulation: QASimulation }) {
  const allCategories = useMemo(() => categoriesInSimulation(simulation), [simulation]);
  const availableLevels = useMemo(() => cefrLevelsInSimulation(simulation), [simulation]);
  const hasCefr = availableLevels.length > 0;

  // Phase state
  const [phase, setPhase] = useState<Phase>('setup');

  // ─── Setup state ────────────────────────────────────────────────
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(allCategories));
  const [selectedLevels, setSelectedLevels] = useState<Set<QACefrLevel>>(new Set(availableLevels));
  const [timerSec, setTimerSec] = useState<TimerOption>(60);
  const [answerMode, setAnswerMode] = useState<AnswerMode>('verbal');
  const [requestedQuestions, setRequestedQuestions] = useState<number>(10);

  // Filtered + size. Intersection of category and (when tagged) CEFR level.
  // Untagged questions pass the level filter unconditionally so mixed banks
  // work — but for a sim like Weekly Warm-Up all questions have cefr.
  const filteredPool = useMemo(
    () => simulation.questions.filter(q => {
      if (!selectedCategories.has(q.category)) return false;
      if (hasCefr && q.cefr && !selectedLevels.has(q.cefr)) return false;
      return true;
    }),
    [selectedCategories, selectedLevels, simulation, hasCefr],
  );
  const poolCount = filteredPool.length;
  const effectiveCount = Math.min(requestedQuestions, poolCount);

  // ─── Playing state ──────────────────────────────────────────────
  const [questions, setQuestions] = useState<QAQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timerSec || 0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const [log, setLog] = useState<PlayLog[]>([]);
  const [streakBurst, setStreakBurst] = useState(0); // animation key

  // Answer mode state
  const [writtenAnswer, setWrittenAnswer] = useState('');
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'recorded'>('idle');
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [recordError, setRecordError] = useState<string | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef   = useRef<Blob[]>([]);
  const mediaStreamRef   = useRef<MediaStream | null>(null);
  const questionStartRef = useRef<number>(0);

  // ─── Derived ────────────────────────────────────────────────────
  const currentQuestion: QAQuestion | undefined = questions[currentIdx];

  // ─── Timer effect ───────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing' || timerSec === 0 || reviewing) return;
    if (timeLeft <= 0) {
      // Auto-trigger review
      setReviewing(true);
      return;
    }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, timerSec, reviewing, timeLeft]);

  // ─── Cleanup media on unmount ───────────────────────────────────
  useEffect(() => {
    return () => {
      mediaStreamRef.current?.getTracks().forEach(t => t.stop());
      if (currentAudioUrl) URL.revokeObjectURL(currentAudioUrl);
      // Don't revoke log audio URLs here — finished screen may still display them
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Setup handlers ─────────────────────────────────────────────
  function toggleCategory(cat: string) {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  }

  function selectAllCategories() {
    setSelectedCategories(new Set(allCategories));
  }

  function toggleLevel(level: QACefrLevel) {
    setSelectedLevels(prev => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level); else next.add(level);
      return next;
    });
  }

  function selectAllLevels() {
    setSelectedLevels(new Set(availableLevels));
  }

  function startGame() {
    if (poolCount === 0) return;
    // Beginner sims (A1/A2) opt into preserveOrder so questions play in the
    // authored flow (personal info → family → hobbies → …). Everyone else
    // shuffles for spaced-recall variety.
    //
    // When the sim is preserveOrder AND CEFR-tagged, sample proportionally
    // across levels so a shorter session still spans A1 → B2 — otherwise a
    // 10-question run of a 45-question diagnostic returns only A1 items.
    const pool = simulation?.preserveOrder
      ? (hasCefr
          ? stratifiedByCefr(filteredPool, effectiveCount)
          : filteredPool.slice(0, effectiveCount))
      : shuffle(filteredPool).slice(0, effectiveCount);
    setQuestions(pool);
    setCurrentIdx(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setLog([]);
    setReviewing(false);
    setWrittenAnswer('');
    setRecordingState('idle');
    setCurrentAudioUrl(null);
    setRecordError(null);
    setTimeLeft(timerSec || 0);
    questionStartRef.current = Date.now();
    setPhase('playing');
  }

  // ─── Recording handlers ─────────────────────────────────────────
  async function startRecording() {
    setRecordError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (ev: BlobEvent) => {
        if (ev.data.size > 0) audioChunksRef.current.push(ev.data);
      };
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setCurrentAudioUrl(url);
        setRecordingState('recorded');
        stream.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecordingState('recording');
    } catch (err) {
      setRecordError(err instanceof Error ? err.message : 'No se pudo acceder al micrófono.');
      setRecordingState('idle');
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  function discardRecording() {
    if (currentAudioUrl) URL.revokeObjectURL(currentAudioUrl);
    setCurrentAudioUrl(null);
    setRecordingState('idle');
    audioChunksRef.current = [];
  }

  // ─── Answer submission ──────────────────────────────────────────
  function readyToEvaluate() {
    setReviewing(true);
  }

  function pickVerdict(verdict: Verdict) {
    if (!currentQuestion) return;

    const pts = VERDICT_META[verdict].pts;
    const elapsed = Date.now() - questionStartRef.current;
    const isPositive = verdict === 'great' || verdict === 'good';

    // Update score / streak
    setScore(s => s + pts);
    if (isPositive) {
      setStreak(prev => {
        const next = prev + 1;
        setMaxStreak(m => Math.max(m, next));
        if (next >= 3) setStreakBurst(b => b + 1);
        return next;
      });
    } else {
      setStreak(0);
    }

    // Append to log
    const entry: PlayLog = {
      question:      currentQuestion,
      verdict,
      timeMs:        elapsed,
      audioUrl:      currentAudioUrl ?? undefined,
      writtenAnswer: writtenAnswer.trim() ? writtenAnswer.trim() : undefined,
    };
    setLog(prev => [...prev, entry]);

    // Advance or finish
    const nextIdx = currentIdx + 1;
    if (nextIdx >= questions.length) {
      setPhase('finished');
    } else {
      setCurrentIdx(nextIdx);
      setReviewing(false);
      setWrittenAnswer('');
      setRecordingState('idle');
      setCurrentAudioUrl(null);
      setTimeLeft(timerSec || 0);
      questionStartRef.current = Date.now();
    }
  }

  function backToSetup() {
    // Stop any active recording
    if (recordingState === 'recording') mediaRecorderRef.current?.stop();
    mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    setPhase('setup');
  }

  function playAgain() {
    startGame();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────────────

  if (phase === 'setup') {
    return (
      <SetupScreen
        simulation={simulation}
        allCategories={allCategories}
        selectedCategories={selectedCategories}
        toggleCategory={toggleCategory}
        selectAllCategories={selectAllCategories}
        availableLevels={availableLevels}
        selectedLevels={selectedLevels}
        toggleLevel={toggleLevel}
        selectAllLevels={selectAllLevels}
        hasCefr={hasCefr}
        timerSec={timerSec}
        setTimerSec={setTimerSec}
        answerMode={answerMode}
        setAnswerMode={setAnswerMode}
        requestedQuestions={requestedQuestions}
        setRequestedQuestions={setRequestedQuestions}
        poolCount={poolCount}
        effectiveCount={effectiveCount}
        onStart={startGame}
      />
    );
  }

  if (phase === 'finished') {
    return (
      <FinishedScreen
        log={log}
        score={score}
        maxStreak={maxStreak}
        totalQuestions={questions.length}
        onPlayAgain={playAgain}
        onBackToSetup={backToSetup}
      />
    );
  }

  // playing
  return (
    <PlayingScreen
      question={currentQuestion!}
      questions={questions}
      currentIdx={currentIdx}
      total={questions.length}
      score={score}
      streak={streak}
      streakBurst={streakBurst}
      timerSec={timerSec}
      timeLeft={timeLeft}
      answerMode={answerMode}
      reviewing={reviewing}
      writtenAnswer={writtenAnswer}
      setWrittenAnswer={setWrittenAnswer}
      recordingState={recordingState}
      currentAudioUrl={currentAudioUrl}
      recordError={recordError}
      onStartRecording={startRecording}
      onStopRecording={stopRecording}
      onDiscardRecording={discardRecording}
      onReadyToEvaluate={readyToEvaluate}
      onPickVerdict={pickVerdict}
      onBackToSetup={backToSetup}
    />
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Setup screen
// ══════════════════════════════════════════════════════════════════════════════

function SetupScreen({
  simulation, allCategories,
  selectedCategories, toggleCategory, selectAllCategories,
  availableLevels, selectedLevels, toggleLevel, selectAllLevels, hasCefr,
  timerSec, setTimerSec,
  answerMode, setAnswerMode,
  requestedQuestions, setRequestedQuestions,
  poolCount, effectiveCount,
  onStart,
}: {
  simulation:            QASimulation;
  allCategories:         string[];
  selectedCategories:    Set<string>;
  toggleCategory:        (cat: string) => void;
  selectAllCategories:   () => void;
  availableLevels:       QACefrLevel[];
  selectedLevels:        Set<QACefrLevel>;
  toggleLevel:           (l: QACefrLevel) => void;
  selectAllLevels:       () => void;
  hasCefr:               boolean;
  timerSec:              TimerOption;
  setTimerSec:           (t: TimerOption) => void;
  answerMode:            AnswerMode;
  setAnswerMode:         (m: AnswerMode) => void;
  requestedQuestions:    number;
  setRequestedQuestions: (n: number) => void;
  poolCount:             number;
  effectiveCount:        number;
  onStart:               () => void;
}) {
  const allSelected = allCategories.every(c => selectedCategories.has(c));
  const totalQuestionsInSim = simulation.questions.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F5FF] via-[#F3EEFF] to-[#EEF2FF]">
      <FullscreenButton />
      {/* ── Hero header ──────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#5A3D7A] via-[#7B5EA7] to-[#9B7CB8] px-8 py-10">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5 blur-xl" />

        <div className="relative max-w-3xl mx-auto">
          <Link href="/dashboard/teacher/tools/qa-simulator"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/10 mb-3">
            ← Simulaciones
          </Link>
          <p className="text-[#C8A8DC] text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
            <span>{simulation.icon}</span>
            <span>Q&A Simulator</span>
          </p>
          <h1 className="text-3xl font-extrabold text-white mb-1">{simulation.title}</h1>
          <p className="text-white/60 text-sm mb-4">{simulation.description}</p>

          {hasCefr && (
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/15">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60 mr-1">Progresión</span>
              {availableLevels.map((level, i) => (
                <span key={level} className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 rounded-full text-[11px] font-extrabold tabular-nums"
                    style={{ background: getCefrMeta(level).bg, color: getCefrMeta(level).color }}
                  >
                    {level}
                  </span>
                  {i < availableLevels.length - 1 && (
                    <span className="text-white/40 text-xs">→</span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* ── Nivel CEFR (solo si el sim tiene questions tageadas) ─── */}
        {hasCefr && (
          <section className="bg-white rounded-2xl border border-[#E8D5F0] p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4 gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#5A3D7A] uppercase tracking-widest">Progresión CEFR</h2>
                <p className="text-xs text-gray-500 mt-1">De estructuras simples (A1) a razonamiento avanzado (B2+).</p>
              </div>
              <button
                onClick={selectAllLevels}
                disabled={availableLevels.every(l => selectedLevels.has(l))}
                className="text-xs font-semibold text-[#9B7CB8] hover:text-[#5A3D7A] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Todos
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {availableLevels.map(level => {
                const active = selectedLevels.has(level);
                const count = simulation.questions.filter(q => q.cefr === level).length;
                const cm = getCefrMeta(level);
                return (
                  <button
                    key={level}
                    onClick={() => toggleLevel(level)}
                    className={`relative flex flex-col items-center gap-0.5 px-2 py-3 rounded-xl border-2 transition-all tabular-nums ${
                      active ? 'shadow-sm scale-100' : 'opacity-45 grayscale hover:opacity-70'
                    }`}
                    style={
                      active
                        ? { background: cm.bg, borderColor: cm.color, color: cm.color }
                        : { background: '#FFFFFF', borderColor: '#E5E7EB', color: '#6B7280' }
                    }
                  >
                    <span className="text-base font-extrabold leading-none">{level}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80 leading-tight">{cm.label}</span>
                    <span className="text-[10px] opacity-70 leading-none mt-0.5">{count} preg.</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Categorías ───────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-[#E8D5F0] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#5A3D7A] uppercase tracking-widest">Categorías</h2>
            <button
              onClick={selectAllCategories}
              disabled={allSelected}
              className="text-xs font-semibold text-[#9B7CB8] hover:text-[#5A3D7A] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Seleccionar todas
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {allCategories.map(cat => {
              const active = selectedCategories.has(cat);
              const meta = getCategoryMeta(cat);
              const count = simulation.questions.filter(q => q.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                    active
                      ? 'shadow-sm scale-100'
                      : 'opacity-50 grayscale border-gray-200 bg-white text-gray-500 hover:opacity-75'
                  }`}
                  style={active ? { borderColor: meta.color, background: meta.bg, color: meta.color } : undefined}
                >
                  <span>{meta.icon}</span>
                  <span>{cat}</span>
                  <span className="text-[10px] opacity-60">({count})</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-3">{poolCount} preguntas en el pool</p>
        </section>

        {/* ── Número de preguntas ──────────────────────────── */}
        <section className="bg-white rounded-2xl border border-[#E8D5F0] p-6 shadow-sm">
          <h2 className="text-sm font-bold text-[#5A3D7A] uppercase tracking-widest mb-4">Cantidad de preguntas</h2>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set([5, 10, 20, 30, 40, totalQuestionsInSim])).sort((a, b) => a - b).map(n => {
              const isAll = n === totalQuestionsInSim;
              const active = isAll ? requestedQuestions >= poolCount : requestedQuestions === n;
              const disabled = n > poolCount && !isAll;
              return (
                <button
                  key={n}
                  onClick={() => setRequestedQuestions(isAll ? poolCount : n)}
                  disabled={disabled}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    active
                      ? 'bg-[#5A3D7A] text-white border-[#5A3D7A] shadow-sm'
                      : disabled
                      ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                      : 'bg-white text-[#5A3D7A] border-[#E8D5F0] hover:border-[#9B7CB8]'
                  }`}
                >
                  {isAll ? `Todas (${poolCount})` : n}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-3">Esta sesión: <strong className="text-[#5A3D7A]">{effectiveCount}</strong> preguntas</p>
        </section>

        {/* ── Timer ──────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-[#E8D5F0] p-6 shadow-sm">
          <h2 className="text-sm font-bold text-[#5A3D7A] uppercase tracking-widest mb-4">Tiempo por pregunta</h2>
          <div className="flex flex-wrap gap-2">
            {([0, 30, 60, 90, 120] as TimerOption[]).map(t => {
              const active = t === timerSec;
              return (
                <button
                  key={t}
                  onClick={() => setTimerSec(t)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    active
                      ? 'bg-[#5A3D7A] text-white border-[#5A3D7A] shadow-sm'
                      : 'bg-white text-[#5A3D7A] border-[#E8D5F0] hover:border-[#9B7CB8]'
                  }`}
                >
                  {t === 0 ? 'Sin tiempo' : `${t}s`}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Modo de respuesta ──────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-[#E8D5F0] p-6 shadow-sm">
          <h2 className="text-sm font-bold text-[#5A3D7A] uppercase tracking-widest mb-4">Modo de respuesta</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ModeCard
              active={answerMode === 'verbal'}
              onClick={() => setAnswerMode('verbal')}
              icon="🗣️"
              title="Verbal + auto-eval"
              description="Responde en voz alta; al terminar el profesor evalúa."
            />
            <ModeCard
              active={answerMode === 'recording'}
              onClick={() => setAnswerMode('recording')}
              icon="🎙️"
              title="Grabación"
              description="Graba tu respuesta y escúchala antes de evaluar."
            />
            <ModeCard
              active={answerMode === 'written'}
              onClick={() => setAnswerMode('written')}
              icon="✍️"
              title="Escrito"
              description="Escribe la respuesta y luego evalúala."
            />
          </div>
        </section>

        {/* ── Start ──────────────────────────────────────────── */}
        <button
          onClick={onStart}
          disabled={poolCount === 0}
          className="w-full py-4 rounded-2xl text-white text-base font-bold shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-[1.01] active:scale-[0.99]"
          style={{ background: 'linear-gradient(135deg, #5A3D7A, #9B7CB8)' }}
        >
          Empezar simulación →
        </button>
      </div>
    </div>
  );
}

function ModeCard({
  active, onClick, icon, title, description,
}: {
  active:      boolean;
  onClick:     () => void;
  icon:        string;
  title:       string;
  description: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-2xl border-2 transition-all ${
        active
          ? 'border-[#5A3D7A] bg-[#F0E5FF] shadow-sm scale-100'
          : 'border-[#E8D5F0] bg-white hover:border-[#9B7CB8]'
      }`}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <p className={`text-sm font-bold mb-0.5 ${active ? 'text-[#5A3D7A]' : 'text-gray-700'}`}>{title}</p>
      <p className="text-xs text-gray-500 leading-snug">{description}</p>
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Playing screen
// ══════════════════════════════════════════════════════════════════════════════

function PlayingScreen({
  question, questions, currentIdx, total,
  score, streak, streakBurst,
  timerSec, timeLeft,
  answerMode, reviewing,
  writtenAnswer, setWrittenAnswer,
  recordingState, currentAudioUrl, recordError,
  onStartRecording, onStopRecording, onDiscardRecording,
  onReadyToEvaluate, onPickVerdict, onBackToSetup,
}: {
  question:           QAQuestion;
  questions:          QAQuestion[];
  currentIdx:         number;
  total:              number;
  score:              number;
  streak:             number;
  streakBurst:        number;
  timerSec:           TimerOption;
  timeLeft:           number;
  answerMode:         AnswerMode;
  reviewing:          boolean;
  writtenAnswer:      string;
  setWrittenAnswer:   (s: string) => void;
  recordingState:     'idle' | 'recording' | 'recorded';
  currentAudioUrl:    string | null;
  recordError:        string | null;
  onStartRecording:   () => void;
  onStopRecording:    () => void;
  onDiscardRecording: () => void;
  onReadyToEvaluate:  () => void;
  onPickVerdict:      (v: Verdict) => void;
  onBackToSetup:      () => void;
}) {
  const meta = getCategoryMeta(question.category);
  const cefr = question.cefr;
  const cefrMeta = cefr ? getCefrMeta(cefr) : null;
  const timerActive = timerSec > 0;
  const timerWarn = timerActive && timeLeft <= 10 && !reviewing;
  const timerPct = timerActive ? Math.max(0, (timeLeft / timerSec) * 100) : 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F5FF] via-[#F3EEFF] to-[#EEF2FF] flex flex-col">

      {/* ── Top bar ───────────────────────────────────────── */}
      <div className="bg-white/80 backdrop-blur border-b border-[#E8D5F0] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-4">
          <button
            onClick={onBackToSetup}
            className="text-xs font-semibold text-gray-500 hover:text-[#5A3D7A] px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            ← Salir
          </button>
          <div className="flex-1 flex items-center gap-3">
            <ProgressDots current={currentIdx} total={total} questions={questions} />
          </div>
          <div className="flex items-center gap-3">
            <StatBadge label="Score" value={score} color="#5A3D7A" />
            <StatBadge label="Racha" value={streak} color={streak >= 3 ? '#B91C1C' : '#6B7280'} icon={streak >= 3 ? '🔥' : undefined} pulse={streakBurst > 0} />
            <FullscreenButton variant="inline" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 w-full">
        <div className="w-full max-w-3xl space-y-6">

          {/* ── Category + level + timer ───────────────────────── */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {cefrMeta && (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border-2 tabular-nums shadow-sm"
                  style={{ background: cefrMeta.bg, color: cefrMeta.color, borderColor: cefrMeta.color }}
                  title={cefrMeta.label}
                >
                  <span className="text-sm">{cefr}</span>
                  <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wide opacity-80">
                    {cefrMeta.label}
                  </span>
                </span>
              )}
              <span
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border-2"
                style={{ background: meta.bg, color: meta.color, borderColor: meta.color }}
              >
                <span>{meta.icon}</span>
                {question.category}
              </span>
            </div>

            {timerActive && (
              <div className={`flex items-center gap-2 ${timerWarn ? 'animate-pulse' : ''}`}>
                <TimerRing pct={timerPct} warn={timerWarn} />
                <span className={`text-2xl font-extrabold tabular-nums ${timerWarn ? 'text-red-600' : 'text-[#5A3D7A]'}`}>
                  {timeLeft}s
                </span>
              </div>
            )}
          </div>

          {/* ── Question card ─────────────────────────────────── */}
          <div
            className="relative bg-white rounded-3xl border border-[#E8D5F0] shadow-lg p-8 sm:p-10 overflow-hidden"
          >
            {cefrMeta && (
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ background: `linear-gradient(90deg, ${cefrMeta.color}, ${cefrMeta.border})` }}
              />
            )}
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs uppercase tracking-widest font-bold text-gray-400">
                Pregunta {currentIdx + 1} de {total}
              </p>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#2D1B4E] leading-snug">{question.question}</h2>
          </div>

          {/* ── Answer area ───────────────────────────────────── */}
          {!reviewing && (
            <AnswerArea
              mode={answerMode}
              writtenAnswer={writtenAnswer}
              setWrittenAnswer={setWrittenAnswer}
              recordingState={recordingState}
              currentAudioUrl={currentAudioUrl}
              recordError={recordError}
              onStartRecording={onStartRecording}
              onStopRecording={onStopRecording}
              onDiscardRecording={onDiscardRecording}
              onReadyToEvaluate={onReadyToEvaluate}
            />
          )}

          {/* ── Verdict buttons ───────────────────────────────── */}
          {reviewing && (
            <div className="bg-white rounded-3xl border border-[#E8D5F0] shadow-lg p-6 sm:p-8 space-y-4">
              <p className="text-sm font-bold text-[#5A3D7A] uppercase tracking-widest text-center">¿Cómo estuvo la respuesta?</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['great', 'good', 'needs-work', 'skip'] as Verdict[]).map(v => {
                  const m = VERDICT_META[v];
                  return (
                    <button
                      key={v}
                      onClick={() => onPickVerdict(v)}
                      className="flex flex-col items-center gap-1 px-3 py-4 rounded-2xl border-2 font-bold transition-all hover:scale-105 active:scale-95"
                      style={{ background: m.bg, color: m.color, borderColor: m.border }}
                    >
                      <span className="text-3xl">{m.emoji}</span>
                      <span className="text-sm">{m.label}</span>
                      <span className="text-xs font-semibold opacity-60">+{m.pts}pts</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Streak burst ───────────────────────────────────── */}
          {streak >= 3 && !reviewing && (
            <div key={streakBurst} className="text-center animate-bounce">
              <span className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-extrabold text-sm shadow-lg">
                🔥 Racha de {streak}! Sigue así
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProgressDots({ current, total, questions }: { current: number; total: number; questions?: QAQuestion[] }) {
  const max = Math.min(total, 20); // cap dots to keep bar tidy
  const compact = total > 20;
  return (
    <div className="flex items-center gap-1.5 flex-1">
      {Array.from({ length: max }).map((_, i) => {
        // when compact, scale i to the full total
        const idx = compact ? Math.round((i / (max - 1)) * (total - 1)) : i;
        const filled = idx < current;
        const active = idx === current;
        const level = questions?.[idx]?.cefr;
        const cm = level ? getCefrMeta(level) : null;
        // With CEFR: filled dots take the level's color, active is a lighter
        // shade of the same, upcoming keeps a neutral gray. Without CEFR:
        // fall back to the original purple palette.
        const style = cm
          ? filled
            ? { background: cm.color }
            : active
            ? { background: cm.color, opacity: 0.55 }
            : { background: '#E5E7EB' }
          : undefined;
        const fallbackClass = cm
          ? ''
          : filled ? 'bg-[#5A3D7A]' : active ? 'bg-[#C8A8DC]' : 'bg-gray-200';
        return (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${fallbackClass}`}
            style={style}
            title={level ? `${level}` : undefined}
          />
        );
      })}
    </div>
  );
}

function StatBadge({ label, value, color, icon, pulse }: { label: string; value: number; color: string; icon?: string; pulse?: boolean }) {
  return (
    <div className={`flex flex-col items-end leading-tight ${pulse ? 'animate-pulse' : ''}`}>
      <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">{label}</span>
      <span className="text-base font-extrabold tabular-nums flex items-center gap-1" style={{ color }}>
        {icon && <span>{icon}</span>}{value}
      </span>
    </div>
  );
}

function TimerRing({ pct, warn }: { pct: number; warn: boolean }) {
  const r = 14;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  return (
    <svg width="34" height="34" viewBox="0 0 34 34">
      <circle cx="17" cy="17" r={r} fill="none" stroke="#E8D5F0" strokeWidth="3" />
      <circle
        cx="17" cy="17" r={r}
        fill="none"
        stroke={warn ? '#DC2626' : '#5A3D7A'}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 17 17)"
        style={{ transition: 'stroke-dashoffset 1s linear' }}
      />
    </svg>
  );
}

// ── Answer area ───────────────────────────────────────────────────────────────

function AnswerArea({
  mode, writtenAnswer, setWrittenAnswer,
  recordingState, currentAudioUrl, recordError,
  onStartRecording, onStopRecording, onDiscardRecording,
  onReadyToEvaluate,
}: {
  mode:               AnswerMode;
  writtenAnswer:      string;
  setWrittenAnswer:   (s: string) => void;
  recordingState:     'idle' | 'recording' | 'recorded';
  currentAudioUrl:    string | null;
  recordError:        string | null;
  onStartRecording:   () => void;
  onStopRecording:    () => void;
  onDiscardRecording: () => void;
  onReadyToEvaluate:  () => void;
}) {
  if (mode === 'verbal') {
    return (
      <div className="bg-white rounded-3xl border border-[#E8D5F0] shadow-lg p-6 sm:p-8 text-center space-y-4">
        <div className="text-5xl">🗣️</div>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Responde en voz alta. Cuando termines (o cuando se acabe el tiempo) pasamos a la evaluación.
        </p>
        <button
          onClick={onReadyToEvaluate}
          className="px-6 py-3 rounded-xl bg-[#5A3D7A] text-white text-sm font-bold hover:bg-[#7B5EA7] transition-colors"
        >
          Listo, evaluar →
        </button>
      </div>
    );
  }

  if (mode === 'recording') {
    return (
      <div className="bg-white rounded-3xl border border-[#E8D5F0] shadow-lg p-6 sm:p-8 text-center space-y-4">
        {recordingState === 'idle' && (
          <>
            <div className="text-5xl">🎙️</div>
            <p className="text-sm text-gray-500">Pulsa para empezar a grabar tu respuesta.</p>
            <button
              onClick={onStartRecording}
              className="px-6 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors inline-flex items-center gap-2"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white" />
              Grabar
            </button>
          </>
        )}
        {recordingState === 'recording' && (
          <>
            <div className="text-5xl animate-pulse">🔴</div>
            <p className="text-sm text-red-600 font-bold">Grabando…</p>
            <button
              onClick={onStopRecording}
              className="px-6 py-3 rounded-xl bg-[#5A3D7A] text-white text-sm font-bold hover:bg-[#7B5EA7] transition-colors"
            >
              Detener
            </button>
          </>
        )}
        {recordingState === 'recorded' && currentAudioUrl && (
          <>
            <div className="text-5xl">✅</div>
            <p className="text-sm text-gray-500">Escucha tu respuesta antes de evaluar.</p>
            <audio controls src={currentAudioUrl} className="w-full max-w-md mx-auto" />
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={onDiscardRecording}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200"
              >
                Regrabar
              </button>
              <button
                onClick={onReadyToEvaluate}
                className="px-6 py-3 rounded-xl bg-[#5A3D7A] text-white text-sm font-bold hover:bg-[#7B5EA7] transition-colors"
              >
                Listo, evaluar →
              </button>
            </div>
          </>
        )}
        {recordError && (
          <p className="text-xs text-red-600">{recordError}</p>
        )}
      </div>
    );
  }

  // written
  return (
    <div className="bg-white rounded-3xl border border-[#E8D5F0] shadow-lg p-6 sm:p-8 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl">✍️</span>
        <p className="text-sm font-bold text-[#5A3D7A]">Tu respuesta</p>
      </div>
      <textarea
        value={writtenAnswer}
        onChange={e => setWrittenAnswer(e.target.value)}
        placeholder="Escribe tu respuesta aquí..."
        rows={6}
        className="w-full px-4 py-3 rounded-xl border border-[#E8D5F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] resize-none"
      />
      <button
        onClick={onReadyToEvaluate}
        className="w-full px-6 py-3 rounded-xl bg-[#5A3D7A] text-white text-sm font-bold hover:bg-[#7B5EA7] transition-colors"
      >
        Listo, evaluar →
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Finished screen
// ══════════════════════════════════════════════════════════════════════════════

function FinishedScreen({
  log, score, maxStreak, totalQuestions,
  onPlayAgain, onBackToSetup,
}: {
  log:            PlayLog[];
  score:          number;
  maxStreak:      number;
  totalQuestions: number;
  onPlayAgain:    () => void;
  onBackToSetup:  () => void;
}) {
  const maxPossible = totalQuestions * 3;
  const pct = maxPossible > 0 ? Math.round((score / maxPossible) * 100) : 0;
  const avgTimeMs = log.length > 0 ? log.reduce((s, e) => s + e.timeMs, 0) / log.length : 0;

  // Per-category breakdown
  const byCategory = useMemo(() => {
    const map = new Map<string, { total: number; score: number }>();
    log.forEach(entry => {
      const cat = entry.question.category;
      const existing = map.get(cat) ?? { total: 0, score: 0 };
      existing.total += 1;
      existing.score += VERDICT_META[entry.verdict].pts;
      map.set(cat, existing);
    });
    return Array.from(map.entries());
  }, [log]);

  // Per-CEFR breakdown (only shown when the session had level tags)
  const byCefr = useMemo(() => {
    const map = new Map<QACefrLevel, { total: number; score: number }>();
    log.forEach(entry => {
      const level = entry.question.cefr;
      if (!level) return;
      const existing = map.get(level) ?? { total: 0, score: 0 };
      existing.total += 1;
      existing.score += VERDICT_META[entry.verdict].pts;
      map.set(level, existing);
    });
    return QA_CEFR_ORDER
      .filter(l => map.has(l))
      .map(l => [l, map.get(l)!] as const);
  }, [log]);

  // Per-verdict count
  const verdictCounts = useMemo(() => {
    const counts: Record<Verdict, number> = { great: 0, good: 0, 'needs-work': 0, skip: 0 };
    log.forEach(e => { counts[e.verdict] += 1; });
    return counts;
  }, [log]);

  let medal = '🎓';
  let medalLabel = 'Bien hecho';
  if (pct >= 90) { medal = '🏆'; medalLabel = 'Maestría'; }
  else if (pct >= 75) { medal = '🥇'; medalLabel = 'Excelente'; }
  else if (pct >= 60) { medal = '🥈'; medalLabel = 'Sólido'; }
  else if (pct >= 40) { medal = '🥉'; medalLabel = 'En camino'; }
  else { medal = '📚'; medalLabel = 'Sigamos practicando'; }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F5FF] via-[#F3EEFF] to-[#EEF2FF]">
      <FullscreenButton />
      {/* ── Hero ───────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#5A3D7A] via-[#7B5EA7] to-[#9B7CB8] px-8 py-12">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5 blur-xl" />

        <div className="relative max-w-3xl mx-auto text-center">
          <div className="text-7xl mb-3">{medal}</div>
          <p className="text-[#C8A8DC] text-xs font-bold uppercase tracking-widest mb-1">{medalLabel}</p>
          <h1 className="text-4xl font-extrabold text-white mb-2">{score} <span className="text-white/50 text-2xl">/ {maxPossible}</span></h1>
          <p className="text-white/70 text-sm">{pct}% del máximo · {totalQuestions} preguntas</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* ── Quick stats ──────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <BigStat label="Score" value={score.toString()} />
          <BigStat label="Mejor racha" value={`🔥 ${maxStreak}`} />
          <BigStat label="T° promedio" value={formatMs(avgTimeMs)} />
          <BigStat label="Tasa de éxito" value={`${pct}%`} />
        </div>

        {/* ── Verdict counts ───────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-[#E8D5F0] p-5 shadow-sm">
          <h2 className="text-sm font-bold text-[#5A3D7A] uppercase tracking-widest mb-4">Auto-evaluación</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['great', 'good', 'needs-work', 'skip'] as Verdict[]).map(v => {
              const m = VERDICT_META[v];
              return (
                <div
                  key={v}
                  className="flex flex-col items-center px-3 py-3 rounded-xl border"
                  style={{ background: m.bg, borderColor: m.border, color: m.color }}
                >
                  <span className="text-2xl mb-0.5">{m.emoji}</span>
                  <span className="text-xs font-semibold opacity-80">{m.label}</span>
                  <span className="text-xl font-extrabold">{verdictCounts[v]}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Per-CEFR breakdown ───────────────────────────── */}
        {byCefr.length > 0 && (
          <section className="bg-white rounded-2xl border border-[#E8D5F0] p-5 shadow-sm">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-sm font-bold text-[#5A3D7A] uppercase tracking-widest">Progresión por nivel</h2>
              <span className="text-[10px] text-gray-400">A1 → B2+</span>
            </div>
            <div className="space-y-3">
              {byCefr.map(([level, stats]) => {
                const cm = getCefrMeta(level);
                const max = stats.total * 3;
                const lvlPct = max > 0 ? (stats.score / max) * 100 : 0;
                return (
                  <div key={level}>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="font-extrabold flex items-center gap-2" style={{ color: cm.color }}>
                        <span
                          className="px-2 py-0.5 rounded-full text-[11px] tabular-nums"
                          style={{ background: cm.bg, border: `1px solid ${cm.border}` }}
                        >
                          {level}
                        </span>
                        <span className="uppercase tracking-wide text-[10px] opacity-80">{cm.label}</span>
                      </span>
                      <span className="text-gray-500 tabular-nums">{stats.score} / {max} pts · {stats.total} preg.</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${lvlPct}%`, background: cm.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Per-category breakdown ───────────────────────── */}
        {byCategory.length > 0 && (
          <section className="bg-white rounded-2xl border border-[#E8D5F0] p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#5A3D7A] uppercase tracking-widest mb-4">Por categoría</h2>
            <div className="space-y-3">
              {byCategory.map(([cat, stats]) => {
                const meta = getCategoryMeta(cat);
                const max = stats.total * 3;
                const catPct = max > 0 ? (stats.score / max) * 100 : 0;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="font-bold flex items-center gap-1.5" style={{ color: meta.color }}>
                        <span>{meta.icon}</span>{cat}
                      </span>
                      <span className="text-gray-500 tabular-nums">{stats.score} / {max} pts</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${catPct}%`, background: meta.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Question log ─────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-[#E8D5F0] p-5 shadow-sm">
          <h2 className="text-sm font-bold text-[#5A3D7A] uppercase tracking-widest mb-4">Revisión de preguntas</h2>
          <ol className="space-y-3">
            {log.map((entry, i) => {
              const meta = getCategoryMeta(entry.question.category);
              const vm = VERDICT_META[entry.verdict];
              const level = entry.question.cefr;
              const cm = level ? getCefrMeta(level) : null;
              return (
                <li key={`${entry.question.id}-${i}`} className="p-3 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">{vm.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {cm && (
                          <span
                            className="text-[10px] font-extrabold px-2 py-0.5 rounded-full tabular-nums"
                            style={{ background: cm.bg, color: cm.color, border: `1px solid ${cm.border}` }}
                          >
                            {level}
                          </span>
                        )}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: meta.bg, color: meta.color }}>
                          {meta.icon} {entry.question.category}
                        </span>
                        <span className="text-[10px] text-gray-500">{formatMs(entry.timeMs)}</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-snug mb-1.5">{entry.question.question}</p>
                      {entry.writtenAnswer && (
                        <p className="text-xs text-gray-600 italic border-l-2 border-[#C8A8DC] pl-2 mt-1.5">{entry.writtenAnswer}</p>
                      )}
                      {entry.audioUrl && (
                        <audio controls src={entry.audioUrl} className="w-full max-w-xs mt-2" />
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* ── Actions ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={onPlayAgain}
            className="w-full py-3.5 rounded-2xl text-white text-sm font-bold shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: 'linear-gradient(135deg, #5A3D7A, #9B7CB8)' }}
          >
            Jugar otra ronda →
          </button>
          <button
            onClick={onBackToSetup}
            className="w-full py-3.5 rounded-2xl bg-white border-2 border-[#E8D5F0] text-[#5A3D7A] text-sm font-bold hover:border-[#9B7CB8] transition-colors"
          >
            Volver al setup
          </button>
        </div>
      </div>
    </div>
  );
}

function BigStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8D5F0] p-4 shadow-sm text-center">
      <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-extrabold text-[#5A3D7A] tabular-nums">{value}</p>
    </div>
  );
}
