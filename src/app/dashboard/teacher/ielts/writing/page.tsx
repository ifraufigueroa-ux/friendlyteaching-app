// FriendlyTeaching.cl — IELTS Writing Simulator
//
// Phases: landing → running → results
// Two versions: Academic (T1 = chart/graph/table/map) + General Training (T1 = letter).
// Two modes: full mock (T1 + T2, 60 min) or single-task practice (20 or 40 min).
// AI grading via /api/ai-grade-ielts-writing returns 9-band + 4 criteria.
//
// Auto-save: draft answers persist to localStorage under a per-prompt key so
// power outages / accidental refreshes don't lose the essay.

'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import FullscreenButton from '@/components/ui/FullscreenButton';
import { ALL_WRITING_PROMPTS, promptsForVersion } from '@/lib/data/ielts/writing';
import { getMock1WritingTask1, getMock1WritingTask2 } from '@/lib/data/ielts/mock-1';
import type {
  IELTSVersion, WritingPrompt, AcademicTask1Prompt, GTTask1Prompt, Task2Prompt,
  WritingGradeResult, CriterionScore, IELTSBand,
} from '@/types/ielts-writing';

// ─── Helpers ─────────────────────────────────────────────────────────────

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const DRAFT_PREFIX = 'ielts-writing-draft:';

function loadDraft(key: string): string {
  if (typeof window === 'undefined') return '';
  try { return localStorage.getItem(DRAFT_PREFIX + key) ?? ''; }
  catch { return ''; }
}

function saveDraft(key: string, value: string) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(DRAFT_PREFIX + key, value); }
  catch { /* quota full — ignore */ }
}

function clearDraft(key: string) {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(DRAFT_PREFIX + key); }
  catch { /* ignore */ }
}

function bandColor(band: IELTSBand): string {
  if (band >= 8)   return 'text-emerald-600';
  if (band >= 7)   return 'text-[#5A3D7A]';
  if (band >= 6)   return 'text-[#0284C7]';
  if (band >= 5)   return 'text-[#E8B547]';
  return 'text-red-500';
}

function bandBadge(band: IELTSBand): string {
  if (band >= 8)   return 'bg-emerald-50 border-emerald-200 text-emerald-700';
  if (band >= 7)   return 'bg-[#F0E5FF] border-[#C8A8DC] text-[#5A3D7A]';
  if (band >= 6)   return 'bg-sky-50 border-sky-200 text-sky-700';
  if (band >= 5)   return 'bg-amber-50 border-amber-200 text-amber-700';
  return 'bg-red-50 border-red-200 text-red-700';
}

// ─── Sub-components ──────────────────────────────────────────────────────

function PromptCard({
  prompt, onStart,
}: {
  prompt: WritingPrompt;
  onStart: () => void;
}) {
  const isT1  = prompt.task === 1;
  const label = isT1
    ? (prompt.version === 'academic' ? 'Task 1 · Report' : `Task 1 · Letter (${(prompt as GTTask1Prompt).tone})`)
    : `Task 2 · ${(prompt as Task2Prompt).essayType.replace(/-/g, ' ')}`;

  return (
    <button
      onClick={onStart}
      className="text-left bg-white rounded-2xl border border-[#E8D5F0] hover:border-[#9B7CB8] hover:shadow-md transition-all p-4 group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5A3D7A] bg-[#F0E5FF] border border-[#C8A8DC]/60 px-2 py-1 rounded-full">
          {label}
        </span>
        <span className="text-[10px] text-gray-400 tabular-nums shrink-0">
          {prompt.suggestedMin} min · ≥ {prompt.minWords}w
        </span>
      </div>
      <p className="font-serif text-base font-bold text-[#2D1B4E] group-hover:text-[#5A3D7A] transition-colors">
        {prompt.title}
      </p>
      {prompt.tags && prompt.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {prompt.tags.map(t => (
            <span key={t} className="text-[9px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
              {t}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

function PromptView({ prompt }: { prompt: WritingPrompt }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-[#2D1B4E] leading-relaxed whitespace-pre-line">
        {prompt.prompt}
      </p>

      {prompt.task === 1 && prompt.version === 'general-training' && (
        <div className="bg-[#FDFAFF] border border-[#E8D5F0] rounded-xl p-3 space-y-1.5">
          <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.25em]">
            In your letter:
          </p>
          <ul className="space-y-1">
            {(prompt as GTTask1Prompt).bulletPoints.map((b, i) => (
              <li key={i} className="text-sm text-[#2D1B4E] pl-4 relative">
                <span className="absolute left-0 text-[#9B7CB8]">•</span>
                {b}
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-gray-500 italic pt-1">
            Tone: <span className="font-semibold text-[#5A3D7A]">{(prompt as GTTask1Prompt).tone}</span>
            {' · '}Write at least 150 words.
          </p>
        </div>
      )}

      {prompt.task === 1 && prompt.version === 'academic' && (
        <div
          className="bg-white border border-[#E8D5F0] rounded-xl p-3 overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: (prompt as AcademicTask1Prompt).visual.svg }}
        />
      )}
    </div>
  );
}

function Editor({
  value, onChange, minWords, autoFocus,
}: {
  value: string;
  onChange: (val: string) => void;
  minWords: number;
  autoFocus?: boolean;
}) {
  const words = useMemo(() => countWords(value), [value]);
  const meetsMin = words >= minWords;

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        placeholder="Empieza a escribir tu respuesta aquí…"
        className="w-full min-h-[420px] px-4 py-3 rounded-2xl border border-[#E8D5F0] bg-white text-sm text-[#2D1B4E] leading-relaxed focus:outline-none focus:border-[#9B7CB8] focus:ring-2 focus:ring-[#C8A8DC]/40 font-mono resize-y"
        spellCheck
      />
      <div className="flex items-center justify-between text-xs">
        <span className={`font-mono tabular-nums font-bold ${meetsMin ? 'text-emerald-600' : 'text-amber-600'}`}>
          {words} / {minWords} palabras {meetsMin ? '✓' : ''}
        </span>
        <span className="text-gray-400 italic">Guardado automático</span>
      </div>
    </div>
  );
}

function CriterionCard({ title, score }: { title: string; score: CriterionScore }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8D5F0] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-black text-[#5A3D7A] uppercase tracking-[0.2em]">
          {title}
        </p>
        <span className={`px-3 py-1 rounded-full text-sm font-black font-mono tabular-nums border ${bandBadge(score.band)}`}>
          {score.band.toFixed(1)}
        </span>
      </div>

      {/* Band bar */}
      <div className="h-1.5 bg-[#F0E5FF] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] ${
            score.band >= 8 ? 'bg-emerald-500'
            : score.band >= 7 ? 'bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8]'
            : score.band >= 6 ? 'bg-sky-500'
            : score.band >= 5 ? 'bg-amber-500'
            : 'bg-red-500'
          }`}
          style={{ width: `${(score.band / 9) * 100}%` }}
        />
      </div>

      <p className="text-xs text-gray-700 leading-relaxed">{score.summary}</p>

      {score.strengths.length > 0 && (
        <div>
          <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Fortalezas</p>
          <ul className="space-y-0.5">
            {score.strengths.map((s, i) => (
              <li key={i} className="text-xs text-gray-600 pl-3 relative">
                <span className="absolute left-0 text-emerald-500">✓</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {score.improvements.length > 0 && (
        <div>
          <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">A mejorar</p>
          <ul className="space-y-0.5">
            {score.improvements.map((s, i) => (
              <li key={i} className="text-xs text-gray-600 pl-3 relative">
                <span className="absolute left-0 text-amber-500">→</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ResultView({
  result, prompt, studentAnswer, onBack,
}: {
  result: WritingGradeResult;
  prompt: WritingPrompt;
  studentAnswer: string;
  onBack: () => void;
}) {
  const [showCorrection, setShowCorrection] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const criterion1Label = result.task === 1 ? 'Task Achievement' : 'Task Response';

  const taskLabel = prompt.task === 1
    ? (prompt.version === 'academic' ? 'Task 1 · Report' : `Task 1 · Letter (${(prompt as GTTask1Prompt).tone})`)
    : `Task 2 · ${(prompt as Task2Prompt).essayType.replace(/-/g, ' ')}`;

  async function handleDownloadPdf() {
    setDownloadingPdf(true);
    try {
      const res = await fetch('/api/export-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:          'writing-feedback',
          taskTitle:     prompt.title,
          version:       prompt.version,
          task:          prompt.task,
          taskLabel,
          prompt:        prompt.prompt,
          studentAnswer,
          result,
          completedAt:   new Date().toISOString(),
        }),
      });
      const html = await res.text();
      const blob = new Blob([html], { type: 'text/html' });
      const url  = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } finally {
      setDownloadingPdf(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.35em]">
          {prompt.version === 'academic' ? 'Academic' : 'General Training'} · Task {result.task}
        </p>
        <h2 className="font-serif text-2xl font-bold text-[#2D1B4E]">{prompt.title}</h2>
      </div>

      {/* Overall band — hero */}
      <div className="bg-gradient-to-br from-[#5A3D7A] to-[#9B7CB8] rounded-3xl p-6 text-white text-center shadow-xl shadow-[#5A3D7A]/25">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">
          Overall band
        </p>
        <p className="font-serif text-6xl font-black mt-1 tabular-nums">
          {result.overallBand.toFixed(1)}
        </p>
        <p className="text-xs text-white/70 mt-1">
          {result.wordCount} palabras
        </p>
      </div>

      {/* 4 criteria */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <CriterionCard title={criterion1Label}          score={result.taskAchievement}   />
        <CriterionCard title="Coherence and Cohesion"   score={result.coherenceCohesion} />
        <CriterionCard title="Lexical Resource"         score={result.lexicalResource}   />
        <CriterionCard title="Grammatical Range"        score={result.grammarAccuracy}   />
      </div>

      {/* Key errors */}
      {result.keyErrors.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E8D5F0] p-4 space-y-2">
          <p className="text-[11px] font-black text-[#5A3D7A] uppercase tracking-[0.2em]">
            Errores específicos
          </p>
          <ul className="space-y-1.5">
            {result.keyErrors.map((e, i) => (
              <li key={i} className="text-xs text-gray-700 leading-relaxed pl-4 relative">
                <span className="absolute left-0 text-red-500 font-bold">•</span>
                {e}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Corrected version toggle */}
      <div className="bg-white rounded-2xl border border-[#E8D5F0] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-black text-[#5A3D7A] uppercase tracking-[0.2em]">
            Comparación
          </p>
          <button
            onClick={() => setShowCorrection((s) => !s)}
            className="text-[11px] font-bold text-[#5A3D7A] bg-[#F0E5FF] hover:bg-[#E0C8F0] px-3 py-1 rounded-full transition-colors"
          >
            {showCorrection ? '← Ocultar corrección' : 'Ver corrección banda 8+ →'}
          </button>
        </div>
        <div className={`grid ${showCorrection ? 'md:grid-cols-2' : 'grid-cols-1'} gap-3`}>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tu respuesta</p>
            <div className="bg-[#FDFAFF] border border-gray-100 rounded-xl p-3 text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
              {studentAnswer}
            </div>
          </div>
          {showCorrection && (
            <div className="space-y-1">
              <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Versión banda 8+</p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
                {result.correctedVersion}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <button
          onClick={handleDownloadPdf}
          disabled={downloadingPdf}
          className="px-6 py-2.5 bg-white border-2 border-[#5A3D7A] text-[#5A3D7A] rounded-full text-sm font-bold shadow-md hover:bg-[#F0E5FF] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {downloadingPdf ? '⏳ Generando…' : '⬇ Descargar PDF'}
        </button>
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white rounded-full text-sm font-bold shadow-lg active:scale-95"
        >
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────

type Phase = 'landing' | 'running' | 'grading' | 'results';

interface SingleSession {
  kind:   'single';
  prompt: WritingPrompt;
  answer: string;
  seconds: number;   // remaining time
  totalSec: number;
}

interface MockSession {
  kind:     'mock';
  version:  IELTSVersion;
  task1:    AcademicTask1Prompt | GTTask1Prompt;
  task2:    Task2Prompt;
  answers:  { t1: string; t2: string };
  activeTab: 1 | 2;
  seconds:  number;   // combined countdown, 60 min
  totalSec: number;
}

type Session = SingleSession | MockSession;

export default function IELTSWritingPage() {
  const [phase, setPhase] = useState<Phase>('landing');
  const [version, setVersion] = useState<IELTSVersion>('academic');
  const [session, setSession] = useState<Session | null>(null);

  // For results screen — keep the prompt + student answer that was graded.
  const [gradedPrompt, setGradedPrompt] = useState<WritingPrompt | null>(null);
  const [gradedAnswer, setGradedAnswer] = useState<string>('');
  const [gradeResult, setGradeResult] = useState<WritingGradeResult | null>(null);
  const [gradeError, setGradeError] = useState<string>('');

  // Timer
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    if (!timerRunning || !session) {
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
      return;
    }
    tickRef.current = setInterval(() => {
      setSession((prev) => {
        if (!prev) return prev;
        if (prev.seconds <= 1) {
          queueMicrotask(() => setTimerRunning(false));
          return { ...prev, seconds: 0 };
        }
        return { ...prev, seconds: prev.seconds - 1 };
      });
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [timerRunning, session]);

  // Auto-save every 2 seconds while running
  useEffect(() => {
    if (phase !== 'running' || !session) return;
    const t = setInterval(() => {
      if (session.kind === 'single') {
        saveDraft(session.prompt.id, session.answer);
      } else {
        saveDraft(`mock:${session.task1.id}:t1`, session.answers.t1);
        saveDraft(`mock:${session.task2.id}:t2`, session.answers.t2);
      }
    }, 2000);
    return () => clearInterval(t);
  }, [phase, session]);

  const { task1: t1List, task2: t2List } = useMemo(() => promptsForVersion(version), [version]);

  function startSingle(prompt: WritingPrompt) {
    const draft = loadDraft(prompt.id);
    const totalSec = prompt.suggestedMin * 60;
    setSession({ kind: 'single', prompt, answer: draft, seconds: totalSec, totalSec });
    setPhase('running');
    setTimerRunning(true);
  }

  function startMock() {
    const t1 = t1List[Math.floor(Math.random() * t1List.length)];
    const t2 = t2List[Math.floor(Math.random() * t2List.length)];
    const totalSec = 60 * 60;
    setSession({
      kind:     'mock',
      version,
      task1:    t1,
      task2:    t2,
      answers:  { t1: loadDraft(`mock:${t1.id}:t1`), t2: loadDraft(`mock:${t2.id}:t2`) },
      activeTab: 1,
      seconds:  totalSec,
      totalSec,
    });
    setPhase('running');
    setTimerRunning(true);
  }

  // Mock 1 fijo: T1 GT hotel-complaint + T2 tech-communication. Fuerza el
  // toggle de version a general-training para que la UI coincida con lo
  // que está corriendo.
  function startMock1() {
    const t1 = getMock1WritingTask1();
    const t2 = getMock1WritingTask2();
    const totalSec = 60 * 60;
    setVersion('general-training');
    setSession({
      kind:     'mock',
      version:  'general-training',
      task1:    t1,
      task2:    t2,
      answers:  { t1: loadDraft(`mock:${t1.id}:t1`), t2: loadDraft(`mock:${t2.id}:t2`) },
      activeTab: 1,
      seconds:  totalSec,
      totalSec,
    });
    setPhase('running');
    setTimerRunning(true);
  }

  async function submit() {
    if (!session) return;
    setTimerRunning(false);
    setPhase('grading');
    setGradeError('');

    // For mock: grade whichever task is active. (Grading both = two API calls
    // — keep the surface tight; grading is expensive.)
    let prompt: WritingPrompt;
    let answer: string;
    let extras: { letterTone?: string; essayType?: string } = {};

    if (session.kind === 'single') {
      prompt = session.prompt;
      answer = session.answer;
    } else {
      const task = session.activeTab;
      prompt = task === 1 ? session.task1 : session.task2;
      answer = task === 1 ? session.answers.t1 : session.answers.t2;
    }

    if (prompt.task === 1 && prompt.version === 'general-training') {
      extras.letterTone = (prompt as GTTask1Prompt).tone;
    }
    if (prompt.task === 2) {
      extras.essayType = (prompt as Task2Prompt).essayType;
    }

    try {
      const resp = await fetch('/api/ai-grade-ielts-writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version:       prompt.version,
          task:          prompt.task,
          taskId:        prompt.id,
          prompt:        prompt.prompt,
          studentAnswer: answer,
          wordCount:     countWords(answer),
          minWords:      prompt.minWords,
          ...extras,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error ?? `Grader returned ${resp.status}`);
      }

      const result: WritingGradeResult = await resp.json();
      setGradedPrompt(prompt);
      setGradedAnswer(answer);
      setGradeResult(result);
      // Successful submit → drop the draft.
      if (session.kind === 'single') clearDraft(session.prompt.id);
      else clearDraft(`mock:${prompt.id}:t${prompt.task}`);
      setPhase('results');
    } catch (err) {
      console.error('[ielts-writing] grading error:', err);
      setGradeError(err instanceof Error ? err.message : 'Error inesperado');
      setPhase('running');   // let them try again without losing their essay
      setTimerRunning(true);
    }
  }

  function abort() {
    setTimerRunning(false);
    setSession(null);
    setPhase('landing');
  }

  function resetToLanding() {
    setSession(null);
    setGradedPrompt(null);
    setGradedAnswer('');
    setGradeResult(null);
    setPhase('landing');
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#FFFCF7] text-[#2D1B4E]">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(90,61,122,1) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(90,61,122,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage:        'radial-gradient(circle at 50% 30%, black 40%, transparent 90%)',
          WebkitMaskImage:  'radial-gradient(circle at 50% 30%, black 40%, transparent 90%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(60rem 40rem at 50% -10%, rgba(200,168,220,0.35) 0%, transparent 60%),' +
            'radial-gradient(45rem 30rem at 10% 90%, rgba(232,181,71,0.15) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 p-6">
        <FullscreenButton />
        <TopBar
          title="IELTS Writing Mocks"
          subtitle={`${ALL_WRITING_PROMPTS.length} prompts · Academic + General Training · AI band descriptors`}
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Tools',     href: '/dashboard/teacher/tools' },
            { label: 'IELTS Writing' },
          ]}
        />

        <div className={`max-w-4xl mx-auto mt-8 ${phase === 'running' ? 'pb-28' : ''}`}>

          {/* ─── LANDING ─── */}
          {phase === 'landing' && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#5A3D7A] bg-[#F0E5FF] border border-[#C8A8DC]/60 px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E8B547] animate-pulse" />
                  Writing Simulator
                </span>
                <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#2D1B4E] leading-tight tracking-tight">
                  IELTS<span className="text-[#E8B547]">®</span> Writing Mock
                </h1>
                <p className="text-sm text-[#5A3D7A]/70 max-w-lg mx-auto">
                  Full mock (60 min, T1 + T2) o práctica individual. AI grading según los band descriptors oficiales.
                </p>
              </div>

              {/* Version selector */}
              <div className="bg-white rounded-3xl border border-[#E8D5F0] shadow-md p-5 space-y-3">
                <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.25em]">Versión</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: 'academic',         title: 'Academic',         desc: 'Task 1 = describir chart/graph/map. Task 2 = ensayo.' },
                    { id: 'general-training', title: 'General Training', desc: 'Task 1 = carta (formal/semi/informal). Task 2 = ensayo.' },
                  ] as { id: IELTSVersion; title: string; desc: string }[]).map((v) => {
                    const active = version === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setVersion(v.id)}
                        className={`text-left rounded-2xl p-3 border transition-all ${
                          active
                            ? 'bg-gradient-to-br from-[#5A3D7A] to-[#9B7CB8] border-transparent text-white shadow-md'
                            : 'bg-white border-[#E8D5F0] hover:border-[#C8A8DC] text-[#5A3D7A]'
                        }`}
                      >
                        <p className={`font-serif text-lg font-bold ${active ? 'text-white' : 'text-[#2D1B4E]'}`}>
                          {v.title}
                        </p>
                        <p className={`text-[11px] mt-0.5 ${active ? 'text-white/80' : 'text-gray-500'}`}>
                          {v.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Full mock CTA */}
              <div className="bg-gradient-to-br from-[#5A3D7A] to-[#9B7CB8] rounded-3xl p-5 text-white shadow-xl shadow-[#5A3D7A]/20 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">
                      Full mock — realistic timing
                    </p>
                    <h2 className="font-serif text-2xl font-bold text-white mt-1">
                      Complete Writing (T1 + T2, 60 min)
                    </h2>
                    <p className="text-xs text-white/80 mt-1">
                      Random T1 + random T2 · single 60-min countdown · switch tabs freely
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/20 text-white shrink-0">
                    60 min
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={startMock1}
                    className="flex-1 py-2.5 bg-[#E8B547] text-[#2D1B4E] rounded-full text-sm font-black shadow-lg active:scale-95 hover:bg-[#F0C25A] transition-colors"
                    title="GT: hotel complaint (T1) + tech & communication (T2)"
                  >
                    ⭐ Cargar Mock 1
                  </button>
                  <button
                    onClick={startMock}
                    className="flex-1 py-2.5 bg-white text-[#5A3D7A] rounded-full text-sm font-black shadow-lg active:scale-95 hover:bg-[#F0E5FF] transition-colors"
                  >
                    ▶ Random mock
                  </button>
                </div>
              </div>

              {/* Single-task practice */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[#E8D5F0]" />
                  <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.3em]">
                    Or practise one task
                  </p>
                  <div className="flex-1 h-px bg-[#E8D5F0]" />
                </div>

                <div>
                  <h3 className="text-xs font-black text-[#5A3D7A] uppercase tracking-[0.2em] mb-2">
                    Task 1 — {version === 'academic' ? 'Report' : 'Letter'} (20 min · ≥ 150 words)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {t1List.map((p) => (
                      <PromptCard key={p.id} prompt={p} onStart={() => startSingle(p)} />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black text-[#5A3D7A] uppercase tracking-[0.2em] mb-2">
                    Task 2 — Essay (40 min · ≥ 250 words)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {t2List.map((p) => (
                      <PromptCard key={p.id} prompt={p} onStart={() => startSingle(p)} />
                    ))}
                  </div>
                </div>
              </div>

              {gradeError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
                  Último error de calificación: {gradeError}
                </div>
              )}
            </div>
          )}

          {/* ─── RUNNING ─── */}
          {phase === 'running' && session && (
            <div className="space-y-4">
              {session.kind === 'mock' ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.3em]">
                        Full mock · {session.version === 'academic' ? 'Academic' : 'General Training'}
                      </p>
                      <h2 className="font-serif text-2xl font-bold text-[#2D1B4E]">
                        Task {session.activeTab}: {session.activeTab === 1 ? session.task1.title : session.task2.title}
                      </h2>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setSession(s => s && s.kind === 'mock' ? { ...s, activeTab: 1 } : s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                          session.activeTab === 1
                            ? 'bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white'
                            : 'bg-[#F0E5FF] text-[#5A3D7A] hover:bg-[#E0C8F0]'
                        }`}
                      >
                        Task 1
                      </button>
                      <button
                        onClick={() => setSession(s => s && s.kind === 'mock' ? { ...s, activeTab: 2 } : s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                          session.activeTab === 2
                            ? 'bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white'
                            : 'bg-[#F0E5FF] text-[#5A3D7A] hover:bg-[#E0C8F0]'
                        }`}
                      >
                        Task 2
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-[#F0E5FF]/40 border border-[#C8A8DC]/40 rounded-2xl p-4">
                      <PromptView prompt={session.activeTab === 1 ? session.task1 : session.task2} />
                    </div>
                    <div>
                      <Editor
                        value={session.activeTab === 1 ? session.answers.t1 : session.answers.t2}
                        onChange={(val) =>
                          setSession(s => s && s.kind === 'mock'
                            ? { ...s, answers: { ...s.answers, [s.activeTab === 1 ? 't1' : 't2']: val } }
                            : s
                          )
                        }
                        minWords={session.activeTab === 1 ? session.task1.minWords : session.task2.minWords}
                        autoFocus
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.3em]">
                      Single practice · {session.prompt.version === 'academic' ? 'Academic' : 'General Training'} · Task {session.prompt.task}
                    </p>
                    <h2 className="font-serif text-2xl font-bold text-[#2D1B4E]">{session.prompt.title}</h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-[#F0E5FF]/40 border border-[#C8A8DC]/40 rounded-2xl p-4">
                      <PromptView prompt={session.prompt} />
                    </div>
                    <div>
                      <Editor
                        value={session.answer}
                        onChange={(val) => setSession(s => s && s.kind === 'single' ? { ...s, answer: val } : s)}
                        minWords={session.prompt.minWords}
                        autoFocus
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={submit}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-sm font-bold shadow-lg active:scale-95"
                >
                  ✓ Submit for AI grading
                </button>
                <button
                  onClick={abort}
                  className="px-3 py-2 text-xs font-semibold text-gray-400 hover:text-gray-600"
                >
                  Abort
                </button>
              </div>

              {gradeError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 text-center">
                  {gradeError} — tu texto sigue guardado, podés reintentar.
                </div>
              )}

              {/* Floating timer */}
              <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-2xl">
                <div className="bg-white/95 backdrop-blur-md rounded-full shadow-2xl shadow-[#5A3D7A]/30 border border-[#E8D5F0] pl-5 pr-3 py-2.5 flex items-center gap-3">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] font-black text-[#5A3D7A] uppercase tracking-[0.25em] leading-none">
                      {session.kind === 'mock' ? 'Full mock · 60 min' : `Task ${session.prompt.task}`}
                    </span>
                    <span className={`text-lg font-black font-mono tabular-nums leading-tight ${
                      session.seconds < 300 ? 'text-red-500' : 'text-[#5A3D7A]'
                    }`}>
                      {fmtTime(session.seconds)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 h-1.5 bg-[#F0E5FF] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-[width] ${
                        session.seconds < 300
                          ? 'bg-red-500'
                          : 'bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8]'
                      }`}
                      style={{ width: `${((session.totalSec - session.seconds) / session.totalSec) * 100}%` }}
                    />
                  </div>
                  <button
                    onClick={() => setTimerRunning((r) => !r)}
                    className="shrink-0 px-3 py-1.5 bg-[#F0E5FF] text-[#5A3D7A] rounded-full text-xs font-bold hover:bg-[#E0C8F0]"
                  >
                    {timerRunning ? '❚❚' : '▶'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── GRADING ─── */}
          {phase === 'grading' && (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-[#C8A8DC] border-t-transparent animate-spin" />
              <p className="text-sm font-bold text-[#5A3D7A]">Calificando con los band descriptors oficiales…</p>
              <p className="text-xs text-gray-400">Puede tardar unos 20-40 segundos.</p>
            </div>
          )}

          {/* ─── RESULTS ─── */}
          {phase === 'results' && gradeResult && gradedPrompt && (
            <ResultView
              result={gradeResult}
              prompt={gradedPrompt}
              studentAnswer={gradedAnswer}
              onBack={resetToLanding}
            />
          )}
        </div>
      </div>
    </div>
  );
}
