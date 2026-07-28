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
import { PLACEMENT_LISTENING } from '@/data/placementListening';
import { pickWritingPromptForAnchor } from '@/data/placementWriting';
import { pickSpeakingPromptsForAnchor } from '@/data/placementSpeaking';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { shouldStopTest } from '@/lib/placementScoring';
import {
  aggregateSuite, deriveSuiteStatus, scoreMCQComponent, scoreReadingComponent,
  initAdaptiveState, pickNextAdaptiveQuestion, recordAdaptiveAnswer,
  pickCalibratedQuestions, pickCalibratedPassages,
  type AdaptiveState,
} from '@/lib/placementSuite';
import {
  COMPONENT_META, PRESETS, VOCAB_TOPIC_LABELS, READING_TYPE_LABELS,
  type ComponentId, type ComponentResult, type SuiteMode, type Budgets, type GrammarMode,
} from '@/types/placement-suite';
import { TOPIC_LABELS } from '@/data/placementQuestions';
import type { PlacementQuestion, PlacementAnswer, LearningProgram, WeakArea } from '@/types/placement';
import type { ReadingPassage, ListeningClip } from '@/types/placement-suite';
import type { LessonLevel } from '@/types/firebase';

/** Human label for a weak-area topic — spans grammar topics, vocab topics
 *  and reading question types (all stored as opaque strings on the answer). */
function weakLabel(topic: string): string {
  return (TOPIC_LABELS as Record<string, string>)[topic]
      ?? (VOCAB_TOPIC_LABELS as Record<string, string>)[topic]
      ?? (READING_TYPE_LABELS as Record<string, string>)[topic]
      ?? topic;
}

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

// Adaptive grammar uses initAdaptiveState / recordAdaptiveAnswer from
// placementSuite.ts. Linear grammar uses this proportional sampler so the
// question count stays balanced across CEFR levels regardless of budget.
function pickLinearGrammar(all: PlacementQuestion[], length: number): PlacementQuestion[] {
  if (length >= all.length) return all;
  const byLevel: Record<string, PlacementQuestion[]> = {};
  for (const q of all) (byLevel[q.level] ??= []).push(q);
  const result: PlacementQuestion[] = [];
  for (const level of LEVEL_ORDER) {
    const pool = byLevel[level] ?? [];
    if (pool.length === 0) continue;
    const target = Math.max(2, Math.round(pool.length * (length / all.length)));
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
  prompt, options, selected, onSelect, confirmed, correctIdx,
}: {
  prompt:     string;
  options:    readonly string[];
  selected:   number | null;
  onSelect:   (idx: number) => void;
  confirmed:  boolean;
  correctIdx: number;
}) {
  // The correct answer is NEVER revealed before the student confirms — this
  // holds in both student-self and teacher-led modes. Teacher-led only
  // changes what the teacher sees AFTER confirmation (explanation panel).
  return (
    <div className="space-y-3">
      <p className="text-lg font-semibold leading-snug" style={{ color: B.purpleDark }}>
        {prompt}
      </p>
      <div className="space-y-2">
        {options.map((opt, idx) => {
          const isSelected = selected === idx;
          const isCorrect  = idx === correctIdx;

          let cls = 'w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-3 ';
          if (confirmed) {
            if (isSelected && isCorrect)       cls += 'bg-emerald-50 border-emerald-500 text-emerald-800';
            else if (isSelected && !isCorrect) cls += 'bg-red-50 border-red-500 text-red-800';
            else if (isCorrect)                cls += 'bg-emerald-50 border-emerald-300 text-emerald-700';
            else                               cls += 'bg-white border-gray-200 text-gray-500';
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
              {confirmed && isCorrect && (
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
        />

        {teacherLed && confirmed && q.explanation && (
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

// ── Adaptive MCQ runner (Grammar + Vocabulary) ─────────────────────────────
//
// Walks CEFR tiers based on streaks. Runs the full hardCap regardless — the
// tier only reflects where the next question comes from. Placement = highest
// tier ever passed when the budget is exhausted.
//
// Anchor: where the first question is asked from. Grammar starts at A1 to
// climb from the bottom; Vocabulary starts at Grammar's estimate (if run)
// so we don't waste 6 questions warming up.

function AdaptiveMCQRunner({
  componentId, bank, hardCap, anchorLevel, teacherLed, label, onComplete,
}: {
  componentId: 'grammar' | 'vocabulary';
  bank:        PlacementQuestion[];
  hardCap:     number;
  anchorLevel: LessonLevel;
  teacherLed:  boolean;
  label:       string;
  onComplete:  (result: ComponentResult) => void;
}) {
  const cfg = useMemo(() => ({
    hardCap,
    startLevel:       anchorLevel,
    questionsPerTier: 6,   // safety cap; majority (≥60%) decides if no streak forms
    advanceOn:        4,   // 4 correctas seguidas → sube (P azar ≈18% en tu nivel real)
    dropOn:           3,   // 3 erradas seguidas → baja (P azar <5% en tu nivel real)
    passThreshold:    0.6,
    failThreshold:    0.4,
  }), [hardCap, anchorLevel]);

  const [state, setState] = useState<AdaptiveState>(() => initAdaptiveState(cfg));
  const [currentQ, setCurrentQ] = useState<PlacementQuestion | null>(() => pickNextAdaptiveQuestion(bank, initAdaptiveState(cfg)));
  const [answers, setAnswers] = useState<PlacementAnswer[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const startRef = useRef<Date>(new Date());
  const questionStart = useRef<number>(Date.now());
  const pending = useRef<PlacementAnswer | null>(null);

  const completedRef = useRef(false);

  function confirm() {
    if (selected === null || confirmed || !currentQ) return;
    setConfirmed(true);
    pending.current = {
      questionId: currentQ.id,
      level:      currentQ.level,
      topic:      currentQ.topic,
      selected:   selected as 0 | 1 | 2 | 3,
      correct:    selected === currentQ.correct,
      timeMs:     Date.now() - questionStart.current,
    };
  }

  function next() {
    if (!confirmed || !pending.current || !currentQ) return;
    const ans = pending.current;
    pending.current = null;

    const newAnswers = [...answers, ans];
    setAnswers(newAnswers);

    const newState = recordAdaptiveAnswer(state, currentQ, ans, cfg);
    setState(newState);

    if (newState.done) {
      if (completedRef.current) return;
      completedRef.current = true;
      const result = scoreMCQComponent(componentId, newAnswers, startRef.current, new Date());
      // The adaptive placement is more informative than the flat "highest
      // section passed" the section scorer produces — override with it.
      result.placedLevel = newState.placedLevel;
      onComplete(result);
      return;
    }

    const nextQ = pickNextAdaptiveQuestion(bank, newState);
    if (!nextQ) {
      // Pool exhausted across all levels — terminate with current data.
      if (completedRef.current) return;
      completedRef.current = true;
      const result = scoreMCQComponent(componentId, newAnswers, startRef.current, new Date());
      result.placedLevel = newState.placedLevel;
      onComplete(result);
      return;
    }
    setCurrentQ(nextQ);
    setSelected(null);
    setConfirmed(false);
    questionStart.current = Date.now();
  }

  if (!currentQ) return null;

  return (
    <div className="w-full max-w-2xl space-y-4">
      <div className="bg-white rounded-2xl p-6 shadow-lg" style={{ boxShadow: '0 8px 32px -8px rgba(90,61,122,0.2)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: B.purpleMed }}>
              {label} · Level {currentQ.level}
            </span>
            <span className="text-[9px] font-bold text-[#5A3D7A] bg-[#F0E5FF] border border-[#C8A8DC]/60 px-1.5 py-0.5 rounded-full uppercase tracking-widest">
              Adaptive
            </span>
          </div>
          {teacherLed && (
            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full uppercase tracking-widest">
              Teacher view
            </span>
          )}
        </div>

        <MCQCard
          prompt={currentQ.sentence}
          options={currentQ.options}
          selected={selected}
          onSelect={setSelected}
          confirmed={confirmed}
          correctIdx={currentQ.correct}
        />

        {teacherLed && confirmed && currentQ.explanation && (
          <p className="mt-3 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <strong>Explanation:</strong> {currentQ.explanation}
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
              Next →
            </button>
          )}
        </div>
      </div>

      <ProgressBar
        current={answers.length + (confirmed ? 1 : 0)}
        total={hardCap}
        label={`${label} · ${answers.length + 1}/${hardCap} · @ ${state.currentLevel}`}
      />
    </div>
  );
}

// ── Reading runner ─────────────────────────────────────────────────────────

function ReadingRunner({
  passages, teacherLed, onComplete,
}: {
  passages:   ReadingPassage[];
  teacherLed: boolean;
  onComplete: (result: ComponentResult) => void;
}) {
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
      // scoreReadingComponent picks the level from the answers, not the
      // passages themselves. Override with the top-most level answered
      // correctly so the calibrated overall stays accurate.
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
          />

          {teacherLed && confirmed && q.explanation && (
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

// ── Adaptive Reading runner ────────────────────────────────────────────────
//
// Passage-level adaptation. Starts at the anchor level (closest available
// passage), asks every question in that passage, then picks the next passage:
//   ≥ 70% at last passage → level up (harder)
//   ≤ 40% at last passage → level down (easier)
//   otherwise             → try one level up if unused, else adjacent
// Runs until `budget` passages are shown or the bank is drained.

function AdaptiveReadingRunner({
  budget, anchorLevel, teacherLed, onComplete,
}: {
  budget:      number;   // number of passages to show
  anchorLevel: LessonLevel;
  teacherLed:  boolean;
  onComplete:  (result: ComponentResult) => void;
}) {
  const LEVELS: LessonLevel[] = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];

  const pickPassageAt = (level: LessonLevel, used: Set<string>): ReadingPassage | null => {
    return PLACEMENT_READING.find(p => p.level === level && !used.has(p.id)) ?? null;
  };
  const pickInitial = (anchor: LessonLevel): ReadingPassage => {
    const used = new Set<string>();
    const at = pickPassageAt(anchor, used);
    if (at) return at;
    // Fall back to closest available level.
    const anchorIdx = LEVELS.indexOf(anchor);
    for (let radius = 1; radius < LEVELS.length; radius++) {
      for (const dir of [1, -1] as const) {
        const idx = anchorIdx + dir * radius;
        if (idx < 0 || idx >= LEVELS.length) continue;
        const p = pickPassageAt(LEVELS[idx], used);
        if (p) return p;
      }
    }
    return PLACEMENT_READING[0];   // last-resort — should never happen
  };

  const [currentPassage, setCurrentPassage] = useState<ReadingPassage>(() => pickInitial(anchorLevel));
  const [usedIds, setUsedIds] = useState<Set<string>>(() => new Set([pickInitial(anchorLevel).id]));
  const [passagesDone, setPassagesDone] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<PlacementAnswer[]>([]);
  const [currentPassageAnswers, setCurrentPassageAnswers] = useState<PlacementAnswer[]>([]);
  const [passedLevels, setPassedLevels] = useState<Set<LessonLevel>>(() => new Set());
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const startRef = useRef<Date>(new Date());
  const questionStart = useRef<number>(Date.now());
  const pending = useRef<PlacementAnswer | null>(null);
  const completedRef = useRef(false);

  const q = currentPassage.questions[qIdx];

  function confirm() {
    if (selected === null || confirmed) return;
    setConfirmed(true);
    pending.current = {
      questionId: q.id,
      level:      q.level,
      topic:      q.type as unknown as PlacementAnswer['topic'],
      selected:   selected as 0 | 1 | 2 | 3,
      correct:    selected === q.correct,
      timeMs:     Date.now() - questionStart.current,
    };
  }

  function pickNextPassage(lastLevel: LessonLevel, pct: number, alreadyUsed: Set<string>): ReadingPassage | null {
    const lastIdx = LEVELS.indexOf(lastLevel);
    // Target index based on performance.
    let targetIdx = lastIdx;
    if (pct >= 0.7)      targetIdx = Math.min(LEVELS.length - 1, lastIdx + 1);
    else if (pct <= 0.4) targetIdx = Math.max(0, lastIdx - 1);
    else                 targetIdx = Math.min(LEVELS.length - 1, lastIdx + 1);  // marginal → try up

    // Search outward from target for an unused passage.
    for (let radius = 0; radius < LEVELS.length; radius++) {
      for (const dir of radius === 0 ? [0] as const : [1, -1] as const) {
        const idx = targetIdx + dir * radius;
        if (idx < 0 || idx >= LEVELS.length) continue;
        const p = pickPassageAt(LEVELS[idx], alreadyUsed);
        if (p) return p;
      }
    }
    return null;
  }

  function next() {
    if (!confirmed || !pending.current) return;
    const ans = pending.current;
    pending.current = null;

    const newAnswers = [...answers, ans];
    const newPassageAnswers = [...currentPassageAnswers, ans];
    setAnswers(newAnswers);
    setCurrentPassageAnswers(newPassageAnswers);

    const isLastQ = qIdx === currentPassage.questions.length - 1;
    if (!isLastQ) {
      setQIdx(i => i + 1);
      setSelected(null);
      setConfirmed(false);
      questionStart.current = Date.now();
      return;
    }

    // Passage complete — score it and decide next.
    const correctInPassage = newPassageAnswers.filter(a => a.correct).length;
    const pct = newPassageAnswers.length > 0 ? correctInPassage / newPassageAnswers.length : 0;
    const newPassed = new Set(passedLevels);
    if (pct >= 0.6) newPassed.add(currentPassage.level);
    setPassedLevels(newPassed);

    const donePassages = passagesDone + 1;
    setPassagesDone(donePassages);

    const budgetReached = donePassages >= budget;
    if (budgetReached) {
      if (completedRef.current) return;
      completedRef.current = true;
      const result = scoreReadingComponent(PLACEMENT_READING, newAnswers, startRef.current, new Date());
      // Placement = highest passed passage level.
      const placed = highestPassedLevel(newPassed) ?? currentPassage.level;
      result.placedLevel = placed;
      onComplete(result);
      return;
    }

    const nextPassage = pickNextPassage(currentPassage.level, pct, usedIds);
    if (!nextPassage) {
      // Bank drained.
      if (completedRef.current) return;
      completedRef.current = true;
      const result = scoreReadingComponent(PLACEMENT_READING, newAnswers, startRef.current, new Date());
      const placed = highestPassedLevel(newPassed) ?? currentPassage.level;
      result.placedLevel = placed;
      onComplete(result);
      return;
    }
    setUsedIds(prev => new Set([...prev, nextPassage.id]));
    setCurrentPassage(nextPassage);
    setCurrentPassageAnswers([]);
    setQIdx(0);
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
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: B.purpleMed }}>
                Passage {passagesDone + 1} of {budget} · {currentPassage.level}
              </span>
              <span className="text-[9px] font-bold text-[#5A3D7A] bg-[#F0E5FF] border border-[#C8A8DC]/60 px-1.5 py-0.5 rounded-full uppercase tracking-widest">
                Adaptive
              </span>
            </div>
            <span className="text-[10px] text-gray-400">{currentPassage.wordCount} words</span>
          </div>
          <h3 className="font-serif text-xl font-bold mb-3" style={{ color: B.purpleDark }}>{currentPassage.title}</h3>
          <div className="prose prose-sm max-w-none text-sm leading-relaxed text-gray-800 whitespace-pre-line max-h-[60vh] overflow-y-auto pr-2">
            {currentPassage.text}
          </div>
        </div>

        {/* Question */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 shadow-lg" style={{ boxShadow: '0 8px 32px -8px rgba(90,61,122,0.15)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: B.purpleMed }}>
              Question {qIdx + 1} of {currentPassage.questions.length}
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
          />

          {teacherLed && confirmed && q.explanation && (
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
                Next →
              </button>
            )}
          </div>
        </div>
      </div>

      <ProgressBar current={answers.length + (confirmed ? 1 : 0)} total={budget * 5} label={`Reading · pasaje ${passagesDone + 1}/${budget} @ ${currentPassage.level}`} />
    </div>
  );
}

function highestPassedLevel(passed: Set<LessonLevel>): LessonLevel | null {
  const order: LessonLevel[] = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];
  for (let i = order.length - 1; i >= 0; i--) {
    if (passed.has(order[i])) return order[i];
  }
  return null;
}

// ── Results screen ─────────────────────────────────────────────────────────

function ResultsScreen({
  studentName, studentEmail, studentPhone, mode, components, results, saveError,
}: {
  studentName:   string;
  studentEmail:  string;
  studentPhone:  string;
  mode:          SuiteMode;
  components:    ComponentId[];
  results:       Partial<Record<ComponentId, ComponentResult>>;
  saveError:     boolean;
}) {
  const agg = useMemo(() => aggregateSuite(results), [results]);
  const [downloading, setDownloading] = useState(false);
  const [showProgram, setShowProgram] = useState(false);

  async function handleDownloadPdf() {
    setDownloading(true);
    try {
      const res = await fetch('/api/export-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:            'placement-suite',
          studentName,
          studentEmail:    studentEmail || undefined,
          studentPhone:    studentPhone || undefined,
          components,
          results,
          perSkillLevel:   agg.perSkillLevel,
          overallLevel:    agg.overallLevel,
          weakAreas:       agg.mergedWeakAreas,
          learningProgram: agg.learningProgram,
          completedAt:     new Date().toISOString(),
          mode,
        }),
      });
      const html = await res.text();
      const blob = new Blob([html], { type: 'text/html' });
      const url  = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl space-y-4">
      <div className="rounded-3xl overflow-hidden" style={{ boxShadow: '0 24px 64px -8px rgba(61,37,88,0.3)' }}>
        {/* Hero */}
        <div className="px-8 py-8 text-white text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #3D2558 0%, #5A3D7A 55%, #9B7CB8 100%)' }}>
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />
          <div className="relative">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-70">Overall CEFR</p>
            <p className="text-6xl font-black mt-1 tabular-nums">{agg.overallLevel}</p>
            <p className="text-sm mt-2 opacity-80">{studentName}</p>
          </div>
        </div>

        <div className="bg-white p-6 space-y-5">
          {/* Per-skill breakdown */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-3" style={{ color: B.purple }}>
              Nivel por habilidad
            </p>
            <div className="space-y-2">
              {components.map((cid) => {
                const lvl = agg.perSkillLevel[cid];
                const meta = COMPONENT_META[cid];
                const res = results[cid];
                const answered = res?.totalAnswered ?? 0;
                const correct = res?.totalCorrect ?? 0;
                const pct = answered > 0 ? Math.round((correct / answered) * 100) : 0;
                return (
                  <div key={cid} className="flex items-center gap-3 p-2.5 rounded-xl border"
                    style={{ borderColor: B.lavenderDark, background: '#FDFAFF' }}>
                    <span className="text-xl">{meta.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold" style={{ color: B.purple }}>{meta.label}</p>
                      <p className="text-[10px]" style={{ color: B.purpleMed }}>
                        {correct}/{answered} correct · {pct}%
                      </p>
                    </div>
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
                    {weakLabel(w.topic)} · {w.pct}%
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Learning program preview */}
          {agg.learningProgram && (
            <div className="rounded-2xl border" style={{ borderColor: B.lavenderDark, background: '#FDFAFF' }}>
              <button
                onClick={() => setShowProgram(s => !s)}
                className="w-full flex items-center justify-between p-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🗓️</span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest" style={{ color: B.purple }}>
                      Plan de 12 semanas
                    </p>
                    <p className="text-[10px]" style={{ color: B.purpleMed }}>
                      Personalizado para nivel {agg.overallLevel}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold" style={{ color: B.purple }}>
                  {showProgram ? '▲ Ocultar' : '▼ Ver plan'}
                </span>
              </button>
              {showProgram && (
                <div className="border-t p-3 space-y-1.5 max-h-96 overflow-y-auto" style={{ borderColor: B.lavenderDark }}>
                  {agg.learningProgram.weeks.map((week) => (
                    <div key={week.week} className="flex gap-2 p-2 rounded-lg bg-white border" style={{ borderColor: B.lavender }}>
                      <div className="w-8 h-8 rounded-lg text-white font-black text-[10px] flex items-center justify-center shrink-0"
                        style={{ background: B.purple }}>W{week.week}</div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold" style={{ color: B.purple }}>{week.focus}</p>
                        <p className="text-[10px]" style={{ color: B.purpleMed }}>{week.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {saveError && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              ⚠️ Hubo un error guardando los resultados. Los resultados que ves acá son válidos, pero puede que no queden persistidos.
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: B.purple }}
            >
              {downloading ? '⏳ Generando…' : '⬇ Descargar PDF completo'}
            </button>
          </div>

          <div className="text-center text-xs text-gray-500 pt-1">
            El PDF incluye el detalle por componente, áreas para reforzar y el plan de 12 semanas.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Placement Listening runner (adaptive at clip level) ───────────────────

function PlacementListeningRunner({
  budget, anchorLevel, teacherId, teacherLed, onComplete,
}: {
  budget:      number;
  anchorLevel: LessonLevel;
  teacherId:   string;
  teacherLed:  boolean;
  onComplete:  (result: ComponentResult) => void;
}) {
  const LEVELS: LessonLevel[] = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];

  const pickClipAt = (level: LessonLevel, used: Set<string>): ListeningClip | null =>
    PLACEMENT_LISTENING.find(c => c.level === level && !used.has(c.id)) ?? null;
  const pickInitial = (anchor: LessonLevel): ListeningClip => {
    const used = new Set<string>();
    const at = pickClipAt(anchor, used);
    if (at) return at;
    const idx = LEVELS.indexOf(anchor);
    for (let r = 1; r < LEVELS.length; r++) {
      for (const dir of [1, -1] as const) {
        const i = idx + dir * r;
        if (i < 0 || i >= LEVELS.length) continue;
        const c = pickClipAt(LEVELS[i], used);
        if (c) return c;
      }
    }
    return PLACEMENT_LISTENING[0];
  };

  const [currentClip, setCurrentClip] = useState<ListeningClip>(() => pickInitial(anchorLevel));
  const [usedIds, setUsedIds] = useState<Set<string>>(() => new Set([pickInitial(anchorLevel).id]));
  const [phase, setPhase] = useState<'play' | 'quiz'>('play');
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<PlacementAnswer[]>([]);
  const [clipAnswers, setClipAnswers] = useState<PlacementAnswer[]>([]);
  const [clipsDone, setClipsDone] = useState(0);
  const [passedLevels, setPassedLevels] = useState<Set<LessonLevel>>(() => new Set());
  const [selected, setSelected] = useState<number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [audioLoading, setAudioLoading] = useState(true);
  const startRef = useRef<Date>(new Date());
  const questionStart = useRef<number>(Date.now());
  const completedRef = useRef(false);

  // Fetch audio binding for the current clip
  useEffect(() => {
    if (!teacherId) { setAudioLoading(false); return; }
    setAudioLoading(true);
    (async () => {
      try {
        const key = `${teacherId}_${currentClip.id}`;
        const snap = await getDoc(doc(db, 'placementListeningAudios', key));
        if (snap.exists()) {
          const url = snap.data().audioUrl as string | undefined;
          setAudioUrl(url ?? '');
        } else {
          setAudioUrl('');
        }
      } catch (err) {
        console.error('[placement-listening] load audio:', err);
        setAudioUrl('');
      } finally {
        setAudioLoading(false);
      }
    })();
  }, [teacherId, currentClip]);

  const q = currentClip.questions[qIdx];

  function record(idx: number) { setSelected(idx); }

  function pickNextClip(lastLevel: LessonLevel, pct: number, used: Set<string>): ListeningClip | null {
    const lastIdx = LEVELS.indexOf(lastLevel);
    let target = lastIdx;
    if (pct >= 0.7)      target = Math.min(LEVELS.length - 1, lastIdx + 1);
    else if (pct <= 0.4) target = Math.max(0, lastIdx - 1);
    else                 target = Math.min(LEVELS.length - 1, lastIdx + 1);
    for (let r = 0; r < LEVELS.length; r++) {
      for (const dir of r === 0 ? [0] as const : [1, -1] as const) {
        const i = target + dir * r;
        if (i < 0 || i >= LEVELS.length) continue;
        const c = pickClipAt(LEVELS[i], used);
        if (c) return c;
      }
    }
    return null;
  }

  function next() {
    if (selected === null) return;
    const ans: PlacementAnswer = {
      questionId: parseInt(q.id.replace(/\D/g, ''), 10) || (Date.now() % 1e9),
      level:      q.level,
      topic:      'listening' as unknown as PlacementAnswer['topic'],
      selected:   selected as 0 | 1 | 2 | 3,
      correct:    selected === q.correct,
      timeMs:     Date.now() - questionStart.current,
    };
    const newAnswers = [...answers, ans];
    const newClipAnswers = [...clipAnswers, ans];
    setAnswers(newAnswers);
    setClipAnswers(newClipAnswers);
    setSelected(null);

    const isLastQ = qIdx === currentClip.questions.length - 1;
    if (!isLastQ) {
      setQIdx(i => i + 1);
      questionStart.current = Date.now();
      return;
    }

    // Clip done — evaluate + decide next
    const correct = newClipAnswers.filter(a => a.correct).length;
    const pct = newClipAnswers.length > 0 ? correct / newClipAnswers.length : 0;
    const newPassed = new Set(passedLevels);
    if (pct >= 0.6) newPassed.add(currentClip.level);
    setPassedLevels(newPassed);
    const doneClips = clipsDone + 1;
    setClipsDone(doneClips);

    const budgetReached = doneClips >= budget;
    if (budgetReached) {
      if (completedRef.current) return;
      completedRef.current = true;
      finalize(newAnswers, newPassed);
      return;
    }
    const nextClip = pickNextClip(currentClip.level, pct, usedIds);
    if (!nextClip) {
      if (completedRef.current) return;
      completedRef.current = true;
      finalize(newAnswers, newPassed);
      return;
    }
    setUsedIds(prev => new Set([...prev, nextClip.id]));
    setCurrentClip(nextClip);
    setClipAnswers([]);
    setQIdx(0);
    setPhase('play');
    questionStart.current = Date.now();
  }

  function finalize(finalAnswers: PlacementAnswer[], passed: Set<LessonLevel>) {
    const placed = (['C1','B2','B1+','B1','A2','A1','A0'] as LessonLevel[])
      .find(l => passed.has(l)) ?? currentClip.level;
    const result = scoreMCQComponent('listening', finalAnswers, startRef.current, new Date());
    result.placedLevel = placed;
    onComplete(result);
  }

  return (
    <div className="w-full max-w-2xl space-y-4">
      <div className="bg-white rounded-2xl p-6 shadow-lg" style={{ boxShadow: '0 8px 32px -8px rgba(90,61,122,0.15)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: B.purpleMed }}>
              Listening · Clip {clipsDone + 1}/{budget} · {currentClip.level}
            </span>
            <span className="text-[9px] font-bold text-[#5A3D7A] bg-[#F0E5FF] border border-[#C8A8DC]/60 px-1.5 py-0.5 rounded-full uppercase tracking-widest">
              Adaptive
            </span>
          </div>
          <span className="text-[10px] text-gray-400">{currentClip.wordCount} words</span>
        </div>
        <h3 className="font-serif text-xl font-bold mb-2" style={{ color: B.purpleDark }}>{currentClip.title}</h3>
        <p className="text-xs text-gray-500 italic mb-3">{currentClip.scenario}</p>

        {phase === 'play' && (
          <>
            {audioLoading ? (
              <div className="bg-[#FDFAFF] rounded-xl p-4 text-center text-xs text-gray-500">Cargando audio…</div>
            ) : audioUrl ? (
              <div className="bg-[#F0E5FF] rounded-xl p-3 mb-3">
                <audio src={audioUrl} controls className="w-full" />
                <p className="text-[10px] text-gray-500 mt-2 text-center italic">
                  Escuchá el audio con atención. Después vas a contestar {currentClip.questions.length} preguntas.
                </p>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-3">
                <p className="text-xs text-amber-800 font-semibold">⚠ Audio no generado todavía</p>
                <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                  Ejecutá <code className="bg-white/60 px-1 rounded">node scripts/generate-placement-listening-audios.js</code> para
                  generar los 6 clips con ElevenLabs (una sola vez). Mientras tanto, podés leer el script.
                </p>
                <details className="mt-2">
                  <summary className="text-[11px] font-semibold text-amber-800 cursor-pointer">Ver script</summary>
                  <div className="mt-2 max-h-48 overflow-y-auto text-[11px] text-gray-700 space-y-1.5">
                    {currentClip.script.map((line, i) => {
                      const spk = currentClip.speakers.find(s => s.id === line.speakerId)?.name ?? line.speakerId;
                      return <p key={i}><strong className="text-[#5A3D7A]">{spk}:</strong> {line.text}</p>;
                    })}
                  </div>
                </details>
              </div>
            )}
            <button
              onClick={() => { setPhase('quiz'); questionStart.current = Date.now(); }}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: B.purple }}
            >
              Continuar a las preguntas →
            </button>
          </>
        )}

        {phase === 'quiz' && (
          <>
            <div className="mb-3">
              <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: B.purpleMed }}>
                Question {qIdx + 1} of {currentClip.questions.length}
              </span>
            </div>
            <MCQCard
              prompt={q.prompt}
              options={q.options}
              selected={selected}
              onSelect={record}
              confirmed={false}
              correctIdx={q.correct}
            />
            {teacherLed && q.explanation && (
              <p className="mt-3 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <strong>Explanation:</strong> {q.explanation}
              </p>
            )}
            <div className="mt-5 flex justify-end">
              <button
                onClick={next}
                disabled={selected === null}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-opacity hover:opacity-90"
                style={{ background: B.purple }}
              >
                {qIdx === currentClip.questions.length - 1 ? (clipsDone + 1 >= budget ? 'Finish component →' : 'Next clip →') : 'Next →'}
              </button>
            </div>
          </>
        )}
      </div>
      <ProgressBar current={answers.length + 1} total={budget * 3} label={`Listening @ ${currentClip.level}`} />
    </div>
  );
}

// ── Placement Writing runner ──────────────────────────────────────────────

function PlacementWritingRunner({
  anchorLevel, onComplete,
}: {
  anchorLevel: LessonLevel;
  onComplete:  (result: ComponentResult) => void;
}) {
  const prompt = useMemo(() => pickWritingPromptForAnchor(anchorLevel), [anchorLevel]);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const startRef = useRef<Date>(new Date());
  const totalSec = prompt.timerMin * 60;
  const [timeLeft, setTimeLeft] = useState(totalSec);
  const wordCount = useMemo(() => text.trim().split(/\s+/).filter(Boolean).length, [text]);

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(t => (t <= 1 ? 0 : t - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/ai-grade-placement-writing', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          promptLevel:   prompt.level,
          promptText:    prompt.prompt,
          studentAnswer: text,
          wordCount,
          minWords:      prompt.minWords,
        }),
      });
      if (!res.ok) throw new Error(`grader ${res.status}`);
      const g = await res.json();
      const result: ComponentResult = {
        componentId:   'writing',
        answers:       [],
        totalAnswered: 1,
        totalCorrect:  0,
        sectionScores: [],
        weakAreas:     [],
        placedLevel:   g.placedLevel as LessonLevel,
        startedAt:     Timestamp.fromDate(startRef.current),
        completedAt:   Timestamp.now(),
      };
      onComplete(result);
    } catch (err) {
      console.error('[placement-writing] error:', err);
      setError('Error al calificar. Reintentá o pedile al docente que revise.');
      setSubmitting(false);
    }
  }

  const meets = wordCount >= prompt.minWords;
  const timeStr = `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}`;

  return (
    <div className="w-full max-w-3xl space-y-4">
      <div className="bg-white rounded-2xl p-6 shadow-lg" style={{ boxShadow: '0 8px 32px -8px rgba(90,61,122,0.15)' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: B.purpleMed }}>
            Writing · calibrated to {prompt.level}
          </span>
          <span className="text-xs font-mono tabular-nums" style={{ color: timeLeft < 60 ? '#DC2626' : B.purple }}>
            ⏱ {timeStr}
          </span>
        </div>
        <h3 className="font-serif text-xl font-bold mb-2" style={{ color: B.purpleDark }}>{prompt.title}</h3>
        <div className="bg-[#F0E5FF] border border-[#C8A8DC]/60 rounded-xl p-3 mb-3">
          <p className="text-sm text-[#2D1B4E] leading-relaxed">{prompt.prompt}</p>
        </div>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          autoFocus
          placeholder="Empezá a escribir…"
          spellCheck
          className="w-full min-h-[280px] px-4 py-3 rounded-xl border border-[#E8D5F0] text-sm text-[#2D1B4E] leading-relaxed focus:outline-none focus:border-[#9B7CB8] focus:ring-2 focus:ring-[#C8A8DC]/40 font-mono resize-y"
        />

        <div className="flex items-center justify-between mt-3 text-xs">
          <span className={`font-mono tabular-nums font-bold ${meets ? 'text-emerald-600' : 'text-amber-600'}`}>
            {wordCount} / {prompt.minWords} palabras {meets && '✓'}
          </span>
          <button
            onClick={submit}
            disabled={submitting || wordCount === 0}
            className="px-6 py-2 rounded-full text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 active:scale-95 transition-all"
          >
            {submitting ? 'Calificando…' : '✓ Submit'}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      </div>
    </div>
  );
}

// ── Placement Speaking runner ─────────────────────────────────────────────

function PlacementSpeakingRunner({
  anchorLevel, count, teacherId, onComplete,
}: {
  anchorLevel: LessonLevel;
  count:       number;
  teacherId:   string;
  onComplete:  (result: ComponentResult) => void;
}) {
  const prompts = useMemo(() => pickSpeakingPromptsForAnchor(anchorLevel, count), [anchorLevel, count]);

  const [pIdx, setPIdx] = useState(0);
  const [phase, setPhase] = useState<'read' | 'prep' | 'speak' | 'grading'>('read');
  const [prepLeft, setPrepLeft] = useState(0);
  const [speakLeft, setSpeakLeft] = useState(0);
  const [levels, setLevels] = useState<LessonLevel[]>([]);
  const [error, setError] = useState('');
  const chunks = useRef<Blob[]>([]);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const startRef = useRef<Date>(new Date());
  const prompt = prompts[pIdx];

  // Prep countdown
  useEffect(() => {
    if (phase !== 'prep') return;
    setPrepLeft(prompt.prepSec);
    const id = setInterval(() => {
      setPrepLeft(t => {
        if (t <= 1) { queueMicrotask(() => startSpeaking()); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, pIdx]);

  // Speak countdown
  useEffect(() => {
    if (phase !== 'speak') return;
    setSpeakLeft(prompt.speakSec);
    const id = setInterval(() => {
      setSpeakLeft(t => {
        if (t <= 1) { queueMicrotask(() => stopSpeaking()); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, pIdx]);

  async function startRecording() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = s;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      const rec = new MediaRecorder(s, { mimeType });
      chunks.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data); };
      rec.start();
      recorder.current = rec;
    } catch (err) {
      console.error('[placement-speaking] mic:', err);
      setError('No se pudo acceder al micrófono. Revisá permisos.');
    }
  }
  function startPrep() { setError(''); setPhase('prep'); }
  function startSpeaking() { setPhase('speak'); startRecording(); }

  async function stopSpeaking() {
    if (!recorder.current) { setPhase('grading'); return; }
    setPhase('grading');
    await new Promise<void>((resolve) => {
      const rec = recorder.current!;
      rec.onstop = () => resolve();
      rec.stop();
    });
    stream.current?.getTracks().forEach(t => t.stop());
    const blob = new Blob(chunks.current, { type: recorder.current!.mimeType });
    const path = `audio/placement-speaking-${teacherId}-${Date.now()}-${prompt.id}.webm`;
    try {
      const sref = storageRef(storage, path);
      await uploadBytes(sref, blob, { contentType: blob.type });
      const url = await getDownloadURL(sref);

      // Whisper
      const audioBlob = await fetch(url).then(r => r.blob());
      const form = new FormData();
      form.append('audio', audioBlob, 'audio.webm');
      form.append('language', 'en');
      const tRes = await fetch('/api/transcribe-speech', { method: 'POST', body: form });
      const tJson = await tRes.json();
      const transcript = String(tJson.text ?? '');

      // Grade
      const gRes = await fetch('/api/ai-grade-placement-speaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptLevel: prompt.level,
          promptText:  prompt.prompt,
          transcript,
          durationSec: prompt.speakSec - speakLeft,
        }),
      });
      const gJson = await gRes.json();
      const placed = (gJson.placedLevel as LessonLevel) ?? 'A1';
      const newLevels = [...levels, placed];
      setLevels(newLevels);

      if (pIdx < prompts.length - 1) {
        setPIdx(i => i + 1);
        setPhase('read');
      } else {
        finalize(newLevels);
      }
    } catch (err) {
      console.error('[placement-speaking] error:', err);
      setError('Error al procesar la grabación. Reintentá o salteá.');
      setPhase('speak');
    }
  }

  function skip() {
    if (pIdx < prompts.length - 1) { setPIdx(i => i + 1); setPhase('read'); }
    else finalize(levels);
  }

  function finalize(finalLevels: LessonLevel[]) {
    // Placement = the highest level seen among the graded prompts.
    const order: LessonLevel[] = ['A0','A1','A2','B1','B1+','B2','C1'];
    let bestIdx = 0;
    for (const l of finalLevels) {
      const i = order.indexOf(l);
      if (i > bestIdx) bestIdx = i;
    }
    const placed = order[bestIdx] ?? 'A1';
    const result: ComponentResult = {
      componentId:   'speaking',
      answers:       [],
      totalAnswered: finalLevels.length,
      totalCorrect:  0,
      sectionScores: [],
      weakAreas:     [],
      placedLevel:   placed,
      startedAt:     Timestamp.fromDate(startRef.current),
      completedAt:   Timestamp.now(),
    };
    onComplete(result);
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="bg-white rounded-2xl p-6 shadow-lg" style={{ boxShadow: '0 8px 32px -8px rgba(90,61,122,0.15)' }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: B.purpleMed }}>
            Speaking · Task {pIdx + 1}/{prompts.length} · {prompt.level}
          </span>
        </div>
        <div className="bg-[#F0E5FF] border border-[#C8A8DC]/60 rounded-xl p-4 mb-4">
          <p className="text-sm text-[#2D1B4E] leading-relaxed">{prompt.prompt}</p>
        </div>

        {phase === 'read' && (
          <div className="text-center space-y-3">
            <p className="text-[11px] text-gray-500">
              {prompt.prepSec}s de preparación, luego {prompt.speakSec}s para grabar.
            </p>
            <button onClick={startPrep} className="px-6 py-3 rounded-full text-sm font-bold text-white shadow-lg hover:opacity-90 active:scale-95 transition-all" style={{ background: B.purple }}>
              ▶ Empezar preparación
            </button>
          </div>
        )}

        {phase === 'prep' && (
          <div className="text-center py-6 space-y-3">
            <div className="text-6xl font-black tabular-nums" style={{ color: B.purple }}>{prepLeft}</div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: B.purpleMed }}>Preparación</p>
            <button onClick={startSpeaking} className="text-xs text-gray-400 hover:text-gray-600 mt-2">Empezar a grabar ahora →</button>
          </div>
        )}

        {phase === 'speak' && (
          <div className="text-center py-6 space-y-3">
            <div className="text-6xl font-black tabular-nums text-red-500 animate-pulse">{speakLeft}</div>
            <p className="text-xs font-bold uppercase tracking-widest text-red-600">🔴 Grabando</p>
            <button onClick={stopSpeaking} className="px-5 py-2 rounded-full text-xs font-bold border border-gray-300 hover:bg-gray-50 transition-colors">Terminar ahora</button>
          </div>
        )}

        {phase === 'grading' && (
          <div className="text-center py-8">
            <div className="w-10 h-10 rounded-full border-4 border-[#C8A8DC] border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold" style={{ color: B.purple }}>Transcribiendo y calificando…</p>
          </div>
        )}

        {error && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700 flex items-center justify-between gap-2">
            <span>{error}</span>
            <button onClick={skip} className="text-red-600 underline whitespace-nowrap">Skip →</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

type Phase = 'landing' | 'roadmap' | 'running' | 'transition' | 'results' | 'loading';

interface SuiteConfig {
  components:  ComponentId[];
  budgets:     Budgets;
  mode:        SuiteMode;
  grammarMode: GrammarMode;
}

export default function PlacementSuitePage() {
  const { teacherId } = useParams<{ teacherId: string }>();
  const searchParams  = useSearchParams();

  const assignmentIdParam = searchParams.get('assignmentId') ?? '';
  const nameParam         = searchParams.get('name') ?? '';
  const emailParam        = searchParams.get('email') ?? '';
  const modeParam         = (searchParams.get('mode') as SuiteMode | null) ?? null;

  // URL-driven config (for teacher-led launches without an assignment doc).
  const componentsParam = searchParams.get('components') ?? '';
  const gParam = Number(searchParams.get('g') ?? '');
  const vParam = Number(searchParams.get('v') ?? '');
  const rParam = Number(searchParams.get('r') ?? '');
  const grammarModeParam = (searchParams.get('grammarMode') as GrammarMode | null) ?? null;

  const [phase, setPhase] = useState<Phase>(assignmentIdParam ? 'loading' : 'landing');
  const [name, setName]   = useState(nameParam);
  const [email, setEmail] = useState(emailParam);
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState('');

  const [config, setConfig] = useState<SuiteConfig>(() => {
    const standard = PRESETS.find(p => p.id === 'standard')!;
    // URL params override the standard preset when present (used by the
    // "Iniciar test en vivo" flow, which passes config via query string).
    const urlComponents = componentsParam
      ? componentsParam.split(',').filter(Boolean) as ComponentId[]
      : null;
    const urlBudgets: Budgets = {
      grammar:    isFinite(gParam) && gParam > 0 ? gParam : standard.budgets.grammar,
      vocabulary: isFinite(vParam) && vParam > 0 ? vParam : standard.budgets.vocabulary,
      reading:    isFinite(rParam) && rParam > 0 ? rParam : standard.budgets.reading,
      listening:  standard.budgets.listening,
      writing:    standard.budgets.writing,
      speaking:   standard.budgets.speaking,
    };
    return {
      components:  urlComponents && urlComponents.length > 0 ? urlComponents : standard.components,
      budgets:     urlBudgets,
      mode:        modeParam ?? 'student-self',
      grammarMode: grammarModeParam ?? 'adaptive',
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
          const standard = PRESETS.find(p => p.id === 'standard')!;
          const comps: ComponentId[] = Array.isArray(data.components) && data.components.length > 0
            ? data.components as ComponentId[]
            : standard.components;
          // Prefer new-style `budgets`; fall back to legacy `grammarLength`.
          // Ensure the 3 productive-skill budgets have defaults for old docs.
          const rawBudgets = (data.budgets as Partial<Budgets> | undefined) ?? {};
          const budgetsFromDoc: Budgets = {
            grammar:    rawBudgets.grammar    ?? (data.grammarLength as number) ?? standard.budgets.grammar,
            vocabulary: rawBudgets.vocabulary ?? standard.budgets.vocabulary,
            reading:    rawBudgets.reading    ?? standard.budgets.reading,
            listening:  rawBudgets.listening  ?? standard.budgets.listening,
            writing:    rawBudgets.writing    ?? standard.budgets.writing,
            speaking:   rawBudgets.speaking   ?? standard.budgets.speaking,
          };
          setConfig({
            components:  sortComponents(comps),
            budgets:     budgetsFromDoc,
            mode:        (data.mode as SuiteMode) ?? modeParam ?? 'student-self',
            grammarMode: (data.grammarMode as GrammarMode) ?? grammarModeParam ?? 'adaptive',
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
      budgets:      config.budgets,
      grammarMode:  config.grammarMode,
      results:      {},
      progress:     initialProgress,
      status:       'in_progress',
      startedAt:    Timestamp.fromDate(startTimeRef.current),
      createdAt:    serverTimestamp(),
      ...(assignmentRef ? { assignmentId: assignmentRef } : {}),
    }).then(() => ref.id).catch((err: unknown) => {
      console.error('[placement-suite] failed to create session:', err);
      setSaveError(true);
      return ref.id;
    });
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
      if (c === 'grammar')    return sum + Math.round(config.budgets.grammar    * 0.5);
      if (c === 'vocabulary') return sum + Math.round(config.budgets.vocabulary * 0.4);
      if (c === 'reading')    return sum + config.budgets.reading * 6;
      return sum + (COMPONENT_META[c]?.estimatedMin ?? 0);
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
                const min = cid === 'grammar'    ? Math.round(config.budgets.grammar    * 0.5)
                          : cid === 'vocabulary' ? Math.round(config.budgets.vocabulary * 0.4)
                          : cid === 'reading'    ? config.budgets.reading * 6
                          : meta.estimatedMin;
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

    // Anchor for calibration: prefer the grammar-derived level; fall back to
    // the mid-scale B1 when grammar didn't run.
    const anchor: LessonLevel = results.grammar?.placedLevel ?? 'B1';

    if (cid === 'grammar') {
      if (config.grammarMode === 'linear') {
        // Linear mode: take the first N questions from the level-balanced
        // bank (proportional slice) and run sequentially with the standard
        // 6-consecutive-wrong auto-stop.
        const bank = pickLinearGrammar(PLACEMENT_QUESTIONS, config.budgets.grammar);
        return (
          <PageBg>
            <MCQRunner
              componentId="grammar"
              bank={bank}
              teacherLed={teacherLed}
              allowAutoStop
              label={`Grammar · lineal (${bank.length} Q)`}
              onComplete={handleComponentComplete}
            />
          </PageBg>
        );
      }
      return (
        <PageBg>
          <AdaptiveMCQRunner
            componentId="grammar"
            bank={PLACEMENT_QUESTIONS}
            hardCap={config.budgets.grammar}
            anchorLevel="A1"
            teacherLed={teacherLed}
            label="Grammar"
            onComplete={handleComponentComplete}
          />
        </PageBg>
      );
    }

    if (cid === 'vocabulary') {
      if (config.grammarMode === 'linear') {
        // Linear = calibrated slice + sequential run (previous behaviour).
        const bank = pickCalibratedQuestions(PLACEMENT_VOCABULARY_QUESTIONS, anchor, config.budgets.vocabulary);
        return (
          <PageBg>
            <MCQRunner
              componentId="vocabulary"
              bank={bank}
              teacherLed={teacherLed}
              allowAutoStop={false}
              label={`Vocabulary · calibrated to ${anchor}`}
              onComplete={handleComponentComplete}
            />
          </PageBg>
        );
      }
      return (
        <PageBg>
          <AdaptiveMCQRunner
            componentId="vocabulary"
            bank={PLACEMENT_VOCABULARY_QUESTIONS}
            hardCap={config.budgets.vocabulary}
            anchorLevel={anchor}
            teacherLed={teacherLed}
            label="Vocabulary"
            onComplete={handleComponentComplete}
          />
        </PageBg>
      );
    }

    if (cid === 'reading') {
      if (config.grammarMode === 'linear') {
        const passages = pickCalibratedPassages(PLACEMENT_READING, anchor, config.budgets.reading);
        return (
          <PageBg>
            <ReadingRunner
              passages={passages}
              teacherLed={teacherLed}
              onComplete={handleComponentComplete}
            />
          </PageBg>
        );
      }
      return (
        <PageBg>
          <AdaptiveReadingRunner
            budget={config.budgets.reading}
            anchorLevel={anchor}
            teacherLed={teacherLed}
            onComplete={handleComponentComplete}
          />
        </PageBg>
      );
    }

    if (cid === 'listening') {
      return (
        <PageBg>
          <PlacementListeningRunner
            budget={config.budgets.listening ?? 3}
            anchorLevel={anchor}
            teacherId={teacherId}
            teacherLed={teacherLed}
            onComplete={handleComponentComplete}
          />
        </PageBg>
      );
    }

    if (cid === 'writing') {
      return (
        <PageBg>
          <PlacementWritingRunner
            anchorLevel={anchor}
            onComplete={handleComponentComplete}
          />
        </PageBg>
      );
    }

    if (cid === 'speaking') {
      return (
        <PageBg>
          <PlacementSpeakingRunner
            anchorLevel={anchor}
            count={config.budgets.speaking ?? 3}
            teacherId={teacherId}
            onComplete={handleComponentComplete}
          />
        </PageBg>
      );
    }

    // Fallback (should not hit now)
    return (
      <PageBg>
        <div className="text-center py-24">
          <p className="text-sm text-[#5A3D7A]">Componente próximamente disponible.</p>
        </div>
      </PageBg>
    );
  }

  if (phase === 'results') {
    return (
      <PageBg>
        <ResultsScreen
          studentName={name}
          studentEmail={email}
          studentPhone={phone}
          mode={config.mode}
          components={ordered}
          results={results}
          saveError={saveError}
        />
      </PageBg>
    );
  }

  return null;
}
