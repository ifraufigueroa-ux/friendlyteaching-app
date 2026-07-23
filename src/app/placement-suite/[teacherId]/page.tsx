// FriendlyTeaching.cl — Complete Placement Suite runner (public)
//
// URL:  /placement-suite/{teacherId}?assignmentId=…&name=…&email=…&mode=…
// - If ?assignmentId is present, the components + grammarLength come from
//   the assignment; otherwise the URL falls back to a default Standard run.
// - ?mode=teacher-led shows the answer key alongside each question (share-
//   screen mode). Defaults to student-self.
//
// The runner walks the selected components in fixed order (grammar → vocab
// → reading). Each component result is persisted after completion so a
// power outage mid-suite only loses the *current* component's answers.

'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  collection, doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

import { PLACEMENT_QUESTIONS } from '@/data/placementQuestions';
import { PLACEMENT_VOCABULARY_QUESTIONS } from '@/data/placementVocabulary';
import { PLACEMENT_READING } from '@/data/placementReading';
import {
  computeSectionScores, determineLevel, computeWeakAreas, shouldStopTest,
} from '@/lib/placementScoring';
import { aggregateSuite, deriveSuiteStatus, scoreMCQComponent, scoreReadingComponent } from '@/lib/placementSuite';
import {
  COMPONENT_META, PRESETS, type ComponentId, type ComponentResult, type SuiteMode,
} from '@/types/placement-suite';
import type { PlacementQuestion, PlacementAnswer, LearningProgram, WeakArea } from '@/types/placement';
import type { LessonLevel } from '@/types/firebase';

// ── Shared palette / helpers ───────────────────────────────────────────────

const B = {
  purple:      '#5A3D7A',
  purpleDark:  '#3D2558',
  purpleMed:   '#9B7CB8',
  purpleLight: '#C8A8DC',
  lavender:    '#F0E5FF',
  lavenderDark:'#E0D5FF',
};

const LEVEL_ORDER: LessonLevel[] = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];

const COMPONENT_ORDER: ComponentId[] = ['grammar', 'vocabulary', 'reading', 'listening', 'writing', 'speaking'];

function sortComponents(ids: ComponentId[]): ComponentId[] {
  return [...ids].sort((a, b) => COMPONENT_ORDER.indexOf(a) - COMPONENT_ORDER.indexOf(b));
}

function pickGrammarQuestions(all: PlacementQuestion[], length: 30 | 60 | 100): PlacementQuestion[] {
  if (length === 100) return all;
  const byLevel: Record<string, PlacementQuestion[]> = {};
  for (const q of all) {
    (byLevel[q.level] ??= []).push(q);
  }
  const result: PlacementQuestion[] = [];
  for (const level of LEVEL_ORDER) {
    const pool = byLevel[level] ?? [];
    if (pool.length === 0) continue;
    const target = Math.max(2, Math.round(pool.length * (length / 100)));
    for (let i = 0; i < Math.min(target, pool.length); i++) {
      const idx = Math.floor(i * pool.length / target);
      result.push(pool[idx]);
    }
  }
  return result;
}

// ── Shell components (reused from grammar-only page look and feel) ─────────

function PageBg({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-start justify-center p-4 relative overflow-hidden py-8"
      style={{ background: 'linear-gradient(150deg, #EDE8FF 0%, #E0D5FF 45%, #F0E5FF 100%)' }}
    >
      <div className="absolute pointer-events-none" style={{
        width: 480, height: 480, borderRadius: '50%',
        background: 'rgba(155,124,184,0.18)', filter: 'blur(60px)',
        top: '-20%', left: '-15%',
      }} />
      <div className="relative z-10 w-full flex items-start justify-center">
        {children}
      </div>
    </div>
  );
}

function Header({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-xl overflow-hidden flex-shrink-0"
        style={{ width: 40, height: 40, outline: '2px solid rgba(255,255,255,0.25)' }}>
        <Image src="/logo-friendlyteaching.jpg" alt="FriendlyTeaching" width={40} height={40} className="object-cover w-full h-full" />
      </div>
      <div>
        <p className="text-base font-black text-white leading-tight">FriendlyTeaching</p>
        <p className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{subtitle}</p>
      </div>
    </div>
  );
}

// ── MCQ card (shared by Grammar / Vocabulary / Reading) ────────────────────

function MCQCard({
  prompt, options, selected, onSelect, confirmed, correctIdx, teacherLed,
}: {
  prompt:     string;
  options:    readonly string[];
  selected:   number | null;
  onSelect:   (idx: number) => void;
  confirmed:  boolean;
  correctIdx: number;
  teacherLed: boolean;
}) {
  return (
    <div className="space-y-3">
      <p className="text-lg font-semibold leading-snug" style={{ color: B.purpleDark }}>
        {prompt}
      </p>
      <div className="space-y-2">
        {options.map((opt, idx) => {
          const isSelected = selected === idx;
          const isCorrect  = idx === correctIdx;
          const revealCorrect = confirmed || teacherLed;

          let cls = 'w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-3 ';
          if (confirmed) {
            if (isSelected && isCorrect)       cls += 'bg-emerald-50 border-emerald-500 text-emerald-800';
            else if (isSelected && !isCorrect) cls += 'bg-red-50 border-red-500 text-red-800';
            else if (isCorrect)                cls += 'bg-emerald-50 border-emerald-300 text-emerald-700';
            else                               cls += 'bg-white border-gray-200 text-gray-500';
          } else if (teacherLed && isCorrect) {
            cls += isSelected
              ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-200'
              : 'bg-emerald-50/60 border-emerald-300 text-emerald-800 ring-1 ring-emerald-200';
          } else if (isSelected) {
            cls += 'border-[#5A3D7A] bg-[#F0E5FF] text-[#5A3D7A] font-semibold';
          } else {
            cls += 'border-gray-200 bg-white text-gray-700 hover:border-[#C8A8DC]';
          }

          return (
            <button
              key={idx}
              onClick={() => !confirmed && onSelect(idx)}
              disabled={confirmed}
              className={cls}
            >
              <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${
                isSelected ? 'border-[#5A3D7A] bg-[#5A3D7A] text-white' : 'border-gray-300 text-gray-400'
              }`}>
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="flex-1">{opt}</span>
              {revealCorrect && isCorrect && (
                <span className="text-emerald-600 text-lg">✓</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Floating progress bar (bottom) ─────────────────────────────────────────

function ProgressBar({ current, total, label }: { current: number; total: number; label: string }) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl">
      <div className="bg-white/95 backdrop-blur-md rounded-full shadow-2xl border border-[#E8D5F0] pl-5 pr-4 py-2.5 flex items-center gap-3">
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#5A3D7A] leading-none">
            {label}
          </span>
          <span className="text-sm font-black tabular-nums text-[#5A3D7A]">
            {current} / {total}
          </span>
        </div>
        <div className="flex-1 h-2 bg-[#F0E5FF] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] rounded-full transition-[width]" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

// ── Grammar runner (reused for Vocabulary too) ─────────────────────────────

function MCQRunner({
  componentId, bank, teacherLed, allowAutoStop, onComplete, label,
}: {
  componentId: ComponentId;
  bank: PlacementQuestion[];
  teacherLed: boolean;
  allowAutoStop: boolean;    // grammar = true, vocab = false
  onComplete: (result: ComponentResult) => void;
  label: string;
}) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<PlacementAnswer[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const startRef = useRef<Date>(new Date());
  const questionStart = useRef<number>(Date.now());

  const total = bank.length;
  const q = bank[idx];

  function confirm() {
    if (selected === null || confirmed) return;
    setConfirmed(true);
    const answer: PlacementAnswer = {
      questionId: q.id,
      level:      q.level,
      topic:      q.topic,
      selected:   selected as 0 | 1 | 2 | 3,
      correct:    selected === q.correct,
      timeMs:     Date.now() - questionStart.current,
    };
    // Stash the pending answer so `next` can commit it.
    pending.current = answer;
  }

  const pending = useRef<PlacementAnswer | null>(null);

  function next() {
    if (!confirmed || !pending.current) return;
    const newAnswers = [...answers, pending.current];
    pending.current = null;

    const stopEarly = allowAutoStop && shouldStopTest(newAnswers);
    const isLast    = idx === total - 1;

    if (stopEarly || isLast) {
      setAnswers(newAnswers);
      const result = scoreMCQComponent(
        componentId,
        newAnswers,
        startRef.current,
        new Date(),
        stopEarly ? { stopped: true, stoppedAtQ: q.id } : undefined,
      );
      onComplete(result);
      return;
    }

    setAnswers(newAnswers);
    setIdx(i => i + 1);
    setSelected(null);
    setConfirmed(false);
    questionStart.current = Date.now();
  }

  return (
    <div className="w-full max-w-2xl space-y-4">
      <div className="bg-white rounded-2xl p-6 shadow-lg" style={{ boxShadow: '0 8px 32px -8px rgba(90,61,122,0.2)' }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: B.purpleMed }}>
            Question {idx + 1} · {q.level}
          </span>
          {teacherLed && (
            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full uppercase tracking-widest">
              Teacher view
            </span>
          )}
        </div>

        <MCQCard
          prompt={q.sentence}
          options={q.options}
          selected={selected}
          onSelect={setSelected}
          confirmed={confirmed}
          correctIdx={q.correct}
          teacherLed={teacherLed}
        />

        {teacherLed && q.explanation && (
          <p className="mt-3 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <strong>Explanation:</strong> {q.explanation}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          {!confirmed ? (
            <button
              onClick={confirm}
              disabled={selected === null}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-opacity hover:opacity-90"
              style={{ background: B.purple }}
            >
              Confirm
            </button>
          ) : (
            <button
              onClick={next}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: B.purple }}
            >
              {idx === total - 1 ? 'Finish component →' : 'Next →'}
            </button>
          )}
        </div>
      </div>

      <ProgressBar current={idx + (confirmed ? 1 : 0)} total={total} label={label} />
    </div>
  );
}

// ── Reading runner ─────────────────────────────────────────────────────────

function ReadingRunner({
  teacherLed, onComplete,
}: {
  teacherLed: boolean;
  onComplete: (result: ComponentResult) => void;
}) {
  const passages = PLACEMENT_READING;
  const [pIdx, setPIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<PlacementAnswer[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const startRef = useRef<Date>(new Date());
  const questionStart = useRef<number>(Date.now());

  const passage = passages[pIdx];
  const q = passage.questions[qIdx];

  const totalQuestions = passages.reduce((s, p) => s + p.questions.length, 0);
  const answeredCount  = answers.length;

  const pending = useRef<PlacementAnswer | null>(null);

  function confirm() {
    if (selected === null || confirmed) return;
    setConfirmed(true);
    pending.current = {
      questionId: q.id,
      level:      q.level,
      // Reuse the topic slot for the reading question type. Scorer treats
      // topic as an opaque string, so this is safe at runtime; cast for TS.
      topic:      q.type as unknown as PlacementAnswer['topic'],
      selected:   selected as 0 | 1 | 2 | 3,
      correct:    selected === q.correct,
      timeMs:     Date.now() - questionStart.current,
    };
  }

  function next() {
    if (!confirmed || !pending.current) return;
    const newAnswers = [...answers, pending.current];
    pending.current = null;

    const isLastQInPassage = qIdx === passage.questions.length - 1;
    const isLastPassage    = pIdx === passages.length - 1;

    if (isLastQInPassage && isLastPassage) {
      setAnswers(newAnswers);
      const result = scoreReadingComponent(passages, newAnswers, startRef.current, new Date());
      onComplete(result);
      return;
    }

    setAnswers(newAnswers);
    if (isLastQInPassage) {
      setPIdx(p => p + 1);
      setQIdx(0);
    } else {
      setQIdx(qidx => qidx + 1);
    }
    setSelected(null);
    setConfirmed(false);
    questionStart.current = Date.now();
  }

  return (
    <div className="w-full max-w-4xl space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Passage */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-lg" style={{ boxShadow: '0 8px 32px -8px rgba(90,61,122,0.15)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: B.purpleMed }}>
              Passage {pIdx + 1} of {passages.length} · {passage.level}
            </span>
            <span className="text-[10px] text-gray-400">{passage.wordCount} words</span>
          </div>
          <h3 className="font-serif text-xl font-bold mb-3" style={{ color: B.purpleDark }}>{passage.title}</h3>
          <div className="prose prose-sm max-w-none text-sm leading-relaxed text-gray-800 whitespace-pre-line max-h-[60vh] overflow-y-auto pr-2">
            {passage.text}
          </div>
        </div>

        {/* Question */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 shadow-lg" style={{ boxShadow: '0 8px 32px -8px rgba(90,61,122,0.15)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: B.purpleMed }}>
              Question {qIdx + 1} of {passage.questions.length}
            </span>
            {teacherLed && (
              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full uppercase tracking-widest">
                Teacher view
              </span>
            )}
          </div>

          <MCQCard
            prompt={q.prompt}
            options={q.options}
            selected={selected}
            onSelect={setSelected}
            confirmed={confirmed}
            correctIdx={q.correct}
            teacherLed={teacherLed}
          />

          {teacherLed && q.explanation && (
            <p className="mt-3 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <strong>Explanation:</strong> {q.explanation}
            </p>
          )}

          <div className="mt-5 flex justify-end gap-2">
            {!confirmed ? (
              <button
                onClick={confirm}
                disabled={selected === null}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-opacity hover:opacity-90"
                style={{ background: B.purple }}
              >
                Confirm
              </button>
            ) : (
              <button
                onClick={next}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: B.purple }}
              >
                {pIdx === passages.length - 1 && qIdx === passage.questions.length - 1
                  ? 'Finish component →'
                  : 'Next →'}
              </button>
            )}
          </div>
        </div>
      </div>

      <ProgressBar current={answeredCount + (confirmed ? 1 : 0)} total={totalQuestions} label="Reading" />
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

type Phase = 'landing' | 'roadmap' | 'running' | 'transition' | 'results' | 'loading';

interface SuiteConfig {
  components:    ComponentId[];
  grammarLength: 30 | 60 | 100;
  mode:          SuiteMode;
}

export default function PlacementSuitePage() {
  const { teacherId } = useParams<{ teacherId: string }>();
  const searchParams  = useSearchParams();

  const assignmentIdParam = searchParams.get('assignmentId') ?? '';
  const nameParam         = searchParams.get('name') ?? '';
  const emailParam        = searchParams.get('email') ?? '';
  const modeParam         = (searchParams.get('mode') as SuiteMode | null) ?? null;

  const [phase, setPhase] = useState<Phase>(assignmentIdParam ? 'loading' : 'landing');
  const [name, setName]   = useState(nameParam);
  const [email, setEmail] = useState(emailParam);
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState('');

  const [config, setConfig] = useState<SuiteConfig>(() => {
    const standard = PRESETS.find(p => p.id === 'standard')!;
    return {
      components:    standard.components,
      grammarLength: standard.grammarLength,
      mode:          modeParam ?? 'student-self',
    };
  });

  const [componentIdx, setComponentIdx] = useState(0);
  const [results, setResults] = useState<Partial<Record<ComponentId, ComponentResult>>>({});
  const [transitionMsg, setTransitionMsg] = useState('');
  const [saveError, setSaveError] = useState(false);

  const sessionIdRef = useRef<string | null>(null);
  const sessionPending = useRef<Promise<string> | null>(null);
  const startTimeRef = useRef<Date>(new Date());
  const [assignmentRef, setAssignmentRef] = useState<string>(assignmentIdParam);

  const ordered = useMemo(() => sortComponents(config.components), [config.components]);

  // If we have an assignmentId, hydrate config from Firestore before showing anything.
  useEffect(() => {
    if (!assignmentIdParam) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'placementAssignments', assignmentIdParam));
        if (snap.exists()) {
          const data = snap.data();
          const comps: ComponentId[] = Array.isArray(data.components) && data.components.length > 0
            ? data.components as ComponentId[]
            : PRESETS.find(p => p.id === 'standard')!.components;
          setConfig({
            components:    sortComponents(comps),
            grammarLength: (data.grammarLength as 30 | 60 | 100) ?? 60,
            mode:          (data.mode as SuiteMode) ?? modeParam ?? 'student-self',
          });
          if (!name && data.studentName)  setName(String(data.studentName));
          if (!email && data.studentEmail) setEmail(String(data.studentEmail));
        }
      } catch (err) {
        console.error('[placement-suite] failed to load assignment:', err);
      } finally {
        setPhase(nameParam ? 'roadmap' : 'landing');
      }
    })();
  }, [assignmentIdParam, modeParam, name, email, nameParam]);

  // ── Session helpers ──────────────────────────────────────────────────────

  function ensureSession(): Promise<string> {
    if (sessionIdRef.current) return Promise.resolve(sessionIdRef.current);
    if (sessionPending.current) return sessionPending.current;
    const ref = doc(collection(db, 'placementSuiteSessions'));
    sessionIdRef.current = ref.id;
    const initialProgress: Partial<Record<ComponentId, 'pending' | 'in_progress' | 'completed' | 'skipped'>> = {};
    for (const c of ordered) initialProgress[c] = 'pending';
    const p = setDoc(ref, {
      teacherId,
      studentName:  name.trim(),
      studentEmail: email.trim() || null,
      studentPhone: phone.trim() || null,
      mode:         config.mode,
      components:   ordered,
      grammarLength: config.grammarLength,
      results:      {},
      progress:     initialProgress,
      status:       'in_progress',
      startedAt:    Timestamp.fromDate(startTimeRef.current),
      createdAt:    serverTimestamp(),
      ...(assignmentRef ? { assignmentId: assignmentRef } : {}),
    }).then(() => ref.id).catch(() => ref.id);
    sessionPending.current = p;
    return p;
  }

  async function persistComponentResult(cid: ComponentId, res: ComponentResult) {
    const sid = await ensureSession();
    const newProgress = { ...(await getCurrentProgress(sid)), [cid]: 'completed' as const };
    for (const c of ordered) if (!newProgress[c]) newProgress[c] = 'pending';
    try {
      await updateDoc(doc(db, 'placementSuiteSessions', sid), {
        [`results.${cid}`]: res,
        [`progress.${cid}`]: 'completed',
        status: deriveSuiteStatus(ordered, newProgress),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('[placement-suite] failed to persist component:', err);
      setSaveError(true);
    }
  }

  async function getCurrentProgress(sid: string): Promise<Record<string, 'pending' | 'in_progress' | 'completed' | 'skipped'>> {
    try {
      const snap = await getDoc(doc(db, 'placementSuiteSessions', sid));
      if (snap.exists()) return (snap.data().progress ?? {}) as Record<string, 'pending' | 'in_progress' | 'completed' | 'skipped'>;
    } catch { /* ignore */ }
    return {};
  }

  async function persistFinal(final: {
    overallLevel: LessonLevel;
    perSkillLevel: Partial<Record<ComponentId, LessonLevel>>;
    mergedWeakAreas: WeakArea[];
    learningProgram: LearningProgram;
  }) {
    const sid = await ensureSession();
    try {
      await updateDoc(doc(db, 'placementSuiteSessions', sid), {
        overallLevel:    final.overallLevel,
        perSkillLevel:   final.perSkillLevel,
        learningProgram: final.learningProgram,
        status:          'completed',
        completedAt:     serverTimestamp(),
        updatedAt:       serverTimestamp(),
      });
      if (assignmentRef) {
        const { completePlacementAssignment } = await import('@/hooks/usePlacementAssignments');
        await completePlacementAssignment(assignmentRef, { placementSuiteSessionId: sid }).catch(() => {});
      }
    } catch (err) {
      console.error('[placement-suite] failed to finalise:', err);
      setSaveError(true);
    }
  }

  // ── Component completion handler ────────────────────────────────────────

  async function handleComponentComplete(result: ComponentResult) {
    const cid = ordered[componentIdx];
    const newResults = { ...results, [cid]: result };
    setResults(newResults);
    await persistComponentResult(cid, result);

    const isLast = componentIdx === ordered.length - 1;
    if (isLast) {
      const agg = aggregateSuite(newResults);
      await persistFinal({
        overallLevel:   agg.overallLevel,
        perSkillLevel:  agg.perSkillLevel,
        mergedWeakAreas: agg.mergedWeakAreas,
        learningProgram: agg.learningProgram,
      });
      setPhase('results');
    } else {
      setTransitionMsg(`Componente completado: ${COMPONENT_META[cid].label}`);
      setPhase('transition');
    }
  }

  function goToNextComponent() {
    setComponentIdx(i => i + 1);
    setPhase('running');
  }

  // ── Landing form submit ──────────────────────────────────────────────────

  function handleLandingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setFormError('Please enter your full name.'); return; }
    if (config.mode !== 'teacher-led' && (!email.trim() || !email.includes('@'))) {
      setFormError('Please enter a valid email address.'); return;
    }
    setFormError('');
    startTimeRef.current = new Date();
    setPhase('roadmap');
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (phase === 'loading') {
    return (
      <PageBg>
        <div className="text-center py-24">
          <div className="w-10 h-10 rounded-full border-4 border-[#C8A8DC] border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-[#5A3D7A]">Cargando…</p>
        </div>
      </PageBg>
    );
  }

  if (phase === 'landing') {
    return (
      <PageBg>
        <div className="w-full max-w-md rounded-3xl overflow-hidden" style={{ boxShadow: '0 24px 64px -8px rgba(61,37,88,0.3)' }}>
          <div className="px-8 py-7" style={{ background: 'linear-gradient(135deg, #3D2558 0%, #5A3D7A 55%, #9B7CB8 100%)' }}>
            <Header subtitle="Complete Placement" />
            <h1 className="text-2xl font-black text-white leading-tight mt-6 pt-6 border-t border-white/10">
              {config.mode === 'teacher-led' ? 'Live placement session' : 'English placement'}
            </h1>
            <p className="text-sm mt-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {ordered.map(c => COMPONENT_META[c].label).join(' · ')}
            </p>
          </div>

          <div className="bg-white px-8 py-7">
            <form onSubmit={handleLandingSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: B.purple }}>Full name</label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your full name" autoFocus
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ border: `2px solid ${B.lavenderDark}`, background: '#FDFAFF', color: B.purple }}
                />
              </div>

              {config.mode !== 'teacher-led' && (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: B.purple }}>Email</label>
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                      style={{ border: `2px solid ${B.lavenderDark}`, background: '#FDFAFF', color: B.purple }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: B.purple }}>
                      Phone <span className="normal-case font-normal" style={{ color: B.purpleMed }}>(optional)</span>
                    </label>
                    <input
                      type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="+56 9 …"
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                      style={{ border: `2px solid ${B.lavenderDark}`, background: '#FDFAFF', color: B.purple }}
                    />
                  </div>
                </>
              )}

              {formError && (
                <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: '#FFF0F0', color: '#C62828', border: '1px solid #FECACA' }}>
                  {formError}
                </div>
              )}

              <button type="submit" className="w-full font-bold py-3.5 rounded-xl text-white text-sm mt-1 transition-all hover:opacity-90 active:scale-[.98]"
                style={{ background: 'linear-gradient(135deg, #3D2558, #5A3D7A)' }}>
                Continue →
              </button>
            </form>
          </div>
        </div>
      </PageBg>
    );
  }

  if (phase === 'roadmap') {
    const totalMin = ordered.reduce((sum, c) => {
      const meta = COMPONENT_META[c];
      if (c === 'grammar') return sum + Math.round(meta.estimatedMin * (config.grammarLength / 100));
      return sum + meta.estimatedMin;
    }, 0);

    return (
      <PageBg>
        <div className="w-full max-w-2xl rounded-3xl overflow-hidden" style={{ boxShadow: '0 24px 64px -8px rgba(61,37,88,0.3)' }}>
          <div className="px-8 py-7" style={{ background: 'linear-gradient(135deg, #3D2558 0%, #5A3D7A 55%, #9B7CB8 100%)' }}>
            <Header subtitle="Complete Placement" />
            <h1 className="text-2xl font-black text-white leading-tight mt-6 pt-6 border-t border-white/10">
              Hola {name}
            </h1>
            <p className="text-sm mt-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Hoy vas a hacer {ordered.length} componente{ordered.length !== 1 ? 's' : ''}. Duración estimada: ~{totalMin} min.
            </p>
          </div>

          <div className="bg-white px-8 py-7">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-3" style={{ color: B.purple }}>
              Roadmap
            </p>
            <div className="space-y-2 mb-6">
              {ordered.map((cid, i) => {
                const meta = COMPONENT_META[cid];
                const min = cid === 'grammar' ? Math.round(meta.estimatedMin * (config.grammarLength / 100)) : meta.estimatedMin;
                return (
                  <div key={cid} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: B.lavenderDark, background: '#FDFAFF' }}>
                    <div className="w-8 h-8 rounded-full text-white font-black text-sm flex items-center justify-center" style={{ background: B.purple }}>{i + 1}</div>
                    <span className="text-xl">{meta.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold" style={{ color: B.purple }}>{meta.label}</p>
                      <p className="text-[11px] text-gray-500 leading-tight">{meta.description}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 tabular-nums shrink-0">~{min} min</span>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl px-3 py-2 mb-4" style={{ background: B.lavender }}>
              <p className="text-[11px]" style={{ color: B.purple }}>
                💡 Tomate el tiempo que necesites en cada pregunta. No hay retrocesos: una vez confirmás, avanzás.
              </p>
            </div>

            <button
              onClick={() => setPhase('running')}
              className="w-full font-bold py-3.5 rounded-xl text-white text-sm transition-all hover:opacity-90 active:scale-[.98]"
              style={{ background: 'linear-gradient(135deg, #3D2558, #5A3D7A)' }}
            >
              ▶ Empezar
            </button>
          </div>
        </div>
      </PageBg>
    );
  }

  if (phase === 'transition') {
    const nextCid = ordered[componentIdx + 1];
    const nextMeta = COMPONENT_META[nextCid];
    return (
      <PageBg>
        <div className="w-full max-w-md rounded-3xl overflow-hidden bg-white text-center py-10 px-8" style={{ boxShadow: '0 24px 64px -8px rgba(61,37,88,0.3)' }}>
          <div className="text-5xl mb-3">✅</div>
          <p className="text-lg font-bold" style={{ color: B.purple }}>{transitionMsg}</p>
          <p className="text-xs text-gray-500 mt-1">Tus respuestas están guardadas.</p>

          <div className="mt-6 rounded-2xl p-4 border" style={{ borderColor: B.lavenderDark, background: '#FDFAFF' }}>
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: B.purple }}>Sigue</p>
            <div className="mt-2 flex items-center justify-center gap-3">
              <span className="text-2xl">{nextMeta.icon}</span>
              <div className="text-left">
                <p className="text-sm font-bold" style={{ color: B.purple }}>{nextMeta.label}</p>
                <p className="text-[11px] text-gray-500">{nextMeta.description}</p>
              </div>
            </div>
          </div>

          <button
            onClick={goToNextComponent}
            className="w-full mt-5 font-bold py-3 rounded-xl text-white text-sm transition-all hover:opacity-90 active:scale-[.98]"
            style={{ background: B.purple }}
          >
            Continuar →
          </button>
        </div>
      </PageBg>
    );
  }

  if (phase === 'running') {
    const cid = ordered[componentIdx];
    const teacherLed = config.mode === 'teacher-led';

    if (cid === 'grammar') {
      const bank = pickGrammarQuestions(PLACEMENT_QUESTIONS, config.grammarLength);
      return (
        <PageBg>
          <MCQRunner
            componentId="grammar"
            bank={bank}
            teacherLed={teacherLed}
            allowAutoStop
            label={`Grammar ${config.grammarLength}Q`}
            onComplete={handleComponentComplete}
          />
        </PageBg>
      );
    }

    if (cid === 'vocabulary') {
      return (
        <PageBg>
          <MCQRunner
            componentId="vocabulary"
            bank={PLACEMENT_VOCABULARY_QUESTIONS}
            teacherLed={teacherLed}
            allowAutoStop={false}
            label="Vocabulary"
            onComplete={handleComponentComplete}
          />
        </PageBg>
      );
    }

    if (cid === 'reading') {
      return (
        <PageBg>
          <ReadingRunner teacherLed={teacherLed} onComplete={handleComponentComplete} />
        </PageBg>
      );
    }

    // Fallback for components not yet implemented (listening/writing/speaking)
    return (
      <PageBg>
        <div className="text-center py-24">
          <p className="text-sm text-[#5A3D7A]">Componente próximamente disponible.</p>
        </div>
      </PageBg>
    );
  }

  if (phase === 'results') {
    const agg = aggregateSuite(results);
    return (
      <PageBg>
        <div className="w-full max-w-2xl space-y-4">
          <div className="rounded-3xl overflow-hidden" style={{ boxShadow: '0 24px 64px -8px rgba(61,37,88,0.3)' }}>
            <div className="px-8 py-8 text-white text-center" style={{ background: 'linear-gradient(135deg, #3D2558 0%, #5A3D7A 55%, #9B7CB8 100%)' }}>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-70">Overall level</p>
              <p className="text-6xl font-black mt-1">{agg.overallLevel}</p>
              <p className="text-sm mt-2 opacity-80">Nivel global (mínimo entre habilidades)</p>
            </div>

            <div className="bg-white p-6 space-y-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-3" style={{ color: B.purple }}>
                  Nivel por habilidad
                </p>
                <div className="space-y-2">
                  {ordered.map((cid) => {
                    const lvl = agg.perSkillLevel[cid];
                    const meta = COMPONENT_META[cid];
                    return (
                      <div key={cid} className="flex items-center gap-3 p-2.5 rounded-xl border" style={{ borderColor: B.lavenderDark, background: '#FDFAFF' }}>
                        <span className="text-xl">{meta.icon}</span>
                        <p className="text-sm font-bold flex-1" style={{ color: B.purple }}>{meta.label}</p>
                        <span className="px-3 py-1 rounded-full text-xs font-black" style={{ background: B.lavender, color: B.purple }}>
                          {lvl ?? '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {agg.mergedWeakAreas.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-3" style={{ color: B.purple }}>
                    Áreas para reforzar
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {agg.mergedWeakAreas.slice(0, 10).map((w) => (
                      <span key={w.topic} className="text-[10px] font-semibold px-2 py-1 rounded-full"
                        style={{ background: w.pct === 0 ? '#FEE2E2' : '#FEF3C7', color: w.pct === 0 ? '#991B1B' : '#92400E' }}>
                        {w.topic} · {w.pct}%
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {saveError && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  ⚠️ Hubo un error guardando los resultados. Los resultados que ves acá son válidos, pero puede que no queden persistidos.
                </p>
              )}

              <div className="text-center text-xs text-gray-500 pt-2">
                El docente va a recibir el detalle completo con el programa de estudio sugerido.
              </div>
            </div>
          </div>
        </div>
      </PageBg>
    );
  }

  return null;
}
