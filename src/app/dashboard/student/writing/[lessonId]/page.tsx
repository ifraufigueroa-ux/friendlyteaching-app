// FriendlyWriting® — student lesson runner.
//
// One page, 6 steps + a submission flow at the end. Every step is laid out
// as its own visual piece (not a shared template re-skinned) so the lesson
// feels like a magazine spread, not a SaaS form. All student input lives in
// Runner state + localStorage so Back/Forward is safe and Vercel previews
// don't lose a draft on redeploy.
//
// Submission writes one doc to `friendlywritingSubmissions`:
//   { userId, userEmail, lessonId, lessonTitle, lessonLevel, text,
//     wordCount, brainstorm, reflection, submittedAt, reviewed:false }.

'use client';

import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import {
  ArrowRight, ArrowLeft, X, Check, Sparkles, BookOpen,
  PenLine, Target, CheckCircle2, Clock, Lightbulb, Highlighter,
  MessageCircle, ScrollText, Send, RotateCcw,
} from 'lucide-react';
import { getFriendlywritingLesson } from '@/lib/data/friendlywriting';
import type {
  FWLesson, FWStep,
  FWStepOpening, FWStepVocab, FWStepBrainstorm,
  FWStepModel, FWStepPractice, FWStepWrapUp,
  FWVocabItem, FWModelAnnotation,
} from '@/types/friendlywriting';

// ─── Palette & icons ──────────────────────────────────────────

const STEP_META: Record<FWStep['kind'], { label: string; short: string; icon: React.ElementType }> = {
  'opening':    { label: 'Opening',     short: 'Open',     icon: Sparkles      },
  'vocab':      { label: 'Vocab',       short: 'Vocab',    icon: BookOpen      },
  'brainstorm': { label: 'Brainstorm',  short: 'Think',    icon: Lightbulb     },
  'model':      { label: 'Model',       short: 'Model',    icon: ScrollText    },
  'practice':   { label: 'Practice',    short: 'Write',    icon: PenLine       },
  'wrap-up':    { label: 'Wrap-up',     short: 'Close',    icon: CheckCircle2  },
};

const CATEGORY_LABEL: Record<string, string> = {
  opener:    'Opener',
  closer:    'Closer',
  connector: 'Connector',
  content:   'Content',
  register:  'Register',
  request:   'Request',
  structure: 'Structure',
  grammar:   'Grammar',
  vocab:     'Vocabulary',
};

// ─── Word count ───────────────────────────────────────────────

function wordsOf(txt: string): number {
  const t = txt.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

// ─── Page ─────────────────────────────────────────────────────

export default function FriendlywritingRunner(
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = use(params);
  const router = useRouter();
  const lesson = getFriendlywritingLesson(lessonId);

  // ── Hooks declared unconditionally (no early return above) ──
  const [stepIdx, setStepIdx] = useState(0);
  const [brainstorm, setBrainstorm] = useState<Record<string, string>>({});
  const [reflection, setReflection] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState('');
  const [miniChoice, setMiniChoice] = useState<Record<string, string>>({});
  const [miniLocked, setMiniLocked] = useState<Record<string, boolean>>({});
  const [activeAnn, setActiveAnn] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null);

  useEffect(() => onAuthStateChanged(auth, u => {
    if (u) setUser({ uid: u.uid, email: u.email });
    else setUser(null);
  }), []);

  // ── Local draft persistence ──
  const storageKey = lesson ? `fw-draft:${lesson.id}` : null;
  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw) as {
          brainstorm?: Record<string, string>;
          reflection?: Record<string, string>;
          draft?: string;
          stepIdx?: number;
        };
        if (saved.brainstorm)  setBrainstorm(saved.brainstorm);
        if (saved.reflection)  setReflection(saved.reflection);
        if (typeof saved.draft === 'string') setDraft(saved.draft);
        if (typeof saved.stepIdx === 'number') setStepIdx(saved.stepIdx);
      }
    } catch { /* ignore */ }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ brainstorm, reflection, draft, stepIdx }));
    } catch { /* ignore */ }
  }, [storageKey, brainstorm, reflection, draft, stepIdx]);

  const step = lesson?.steps[stepIdx];
  const total = lesson?.steps.length ?? 0;
  const practiceStep = useMemo(
    () => lesson?.steps.find(s => s.kind === 'practice') as FWStepPractice | undefined,
    [lesson],
  );
  const wordCount = wordsOf(draft);

  const goPrev = useCallback(() => setStepIdx(i => Math.max(0, i - 1)), []);
  const goNext = useCallback(() => setStepIdx(i => Math.min(total - 1, i + 1)), [total]);

  const handleSubmit = useCallback(async () => {
    if (!lesson || !user) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const docRef = await addDoc(collection(db, 'friendlywritingSubmissions'), {
        userId:        user.uid,
        userEmail:     user.email,
        lessonId:      lesson.id,
        lessonTitle:   lesson.title,
        lessonLevel:   lesson.level,
        lessonTaskType: lesson.taskType,
        text:          draft,
        wordCount:     wordsOf(draft),
        minWords:      practiceStep?.minWords ?? 0,
        brainstorm,
        reflection,
        submittedAt:   serverTimestamp(),
        reviewed:      false,
      });
      setSubmittedId(docRef.id);
      try { if (storageKey) localStorage.removeItem(storageKey); } catch { /* ignore */ }
    } catch (err) {
      console.error('[friendlywriting] submit failed', err);
      setSubmitError(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  }, [lesson, user, draft, brainstorm, reflection, practiceStep, storageKey]);

  // ── Guards ──
  if (!lesson) {
    return (
      <div className="min-h-screen bg-[#FFFDF5] text-[#2E2A33] flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <p className="font-serif text-2xl mb-2">Lesson not found</p>
          <p className="text-sm text-[#7A7387] mb-6">We couldn't find a FriendlyWriting lesson with that id.</p>
          <Link href="/dashboard/student/writing" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2E2A33] text-white text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to catalog
          </Link>
        </div>
      </div>
    );
  }
  if (!step) return null;

  const accent = lesson.cover.accent;
  const paletteFrom = lesson.cover.palette?.from ?? accent;
  const paletteTo   = lesson.cover.palette?.to   ?? accent;

  // ── Submitted — full-screen success ──
  if (submittedId) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: `linear-gradient(135deg, ${paletteFrom} 0%, ${paletteTo} 100%)` }}
      >
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl p-10 text-center">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${paletteFrom} 0%, ${paletteTo} 100%)` }}
          >
            <Check className="w-10 h-10 text-white" strokeWidth={3} />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#7A7387] mb-2">Submitted</p>
          <h2 className="font-serif text-3xl text-[#2E2A33] mb-3 leading-tight">Nicely done.</h2>
          <p className="text-[#7A7387] text-sm leading-relaxed mb-8">
            Your piece is on its way to your teacher. You'll review it together next class — bring your questions.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/dashboard/student/writing"
              className="px-5 py-2.5 rounded-xl bg-[#2E2A33] text-white text-sm font-semibold hover:opacity-90 transition"
            >
              Back to catalog
            </Link>
            <Link
              href="/dashboard/student"
              className="px-5 py-2.5 rounded-xl bg-white border border-[#E8E4EC] text-[#2E2A33] text-sm font-semibold hover:bg-[#F7F4FA] transition"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#2E2A33]" style={{ background: '#FFFDF5' }}>
      {/* Thin progress bar at the very top */}
      <div className="fixed top-0 inset-x-0 h-1 bg-black/5 z-50">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${((stepIdx + 1) / total) * 100}%`,
            background: `linear-gradient(90deg, ${paletteFrom}, ${paletteTo})`,
          }}
        />
      </div>

      {/* Fixed header bar */}
      <header className="sticky top-1 z-40 backdrop-blur bg-white/80 border-b border-black/5">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard/student/writing"
              className="w-9 h-9 rounded-full bg-[#2E2A33] text-white flex items-center justify-center hover:scale-105 transition flex-shrink-0"
              aria-label="Exit lesson"
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
            </Link>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#7A7387]">
                FriendlyWriting® · {lesson.level}
              </p>
              <p className="font-serif text-lg leading-tight text-[#2E2A33] truncate">
                {lesson.title}
              </p>
            </div>
          </div>
          <StepPills steps={lesson.steps} current={stepIdx} onJump={setStepIdx} accent={accent} />
        </div>
      </header>

      {/* Step content */}
      <main className="max-w-6xl mx-auto px-5 py-8 pb-28">
        {step.kind === 'opening'    && <OpeningStep step={step} lesson={lesson} />}
        {step.kind === 'vocab'      && (
          <VocabStep
            step={step}
            accent={accent}
            miniChoice={miniChoice}
            setMiniChoice={setMiniChoice}
            miniLocked={miniLocked}
            setMiniLocked={setMiniLocked}
          />
        )}
        {step.kind === 'brainstorm' && (
          <BrainstormStep
            step={step}
            accent={accent}
            notes={brainstorm}
            onChange={(id, v) => setBrainstorm(prev => ({ ...prev, [id]: v }))}
          />
        )}
        {step.kind === 'model'      && (
          <ModelStep
            step={step}
            accent={accent}
            activeAnn={activeAnn}
            setActiveAnn={setActiveAnn}
          />
        )}
        {step.kind === 'practice'   && (
          <PracticeStep
            step={step}
            lesson={lesson}
            accent={accent}
            draft={draft}
            setDraft={setDraft}
            wordCount={wordCount}
            brainstorm={brainstorm}
          />
        )}
        {step.kind === 'wrap-up'    && (
          <WrapUpStep
            step={step}
            accent={accent}
            paletteFrom={paletteFrom}
            paletteTo={paletteTo}
            reflection={reflection}
            setReflection={setReflection}
            draft={draft}
            wordCount={wordCount}
            practiceStep={practiceStep}
            user={user}
            submitting={submitting}
            submitError={submitError}
            onSubmit={handleSubmit}
          />
        )}
      </main>

      {/* Footer nav */}
      <footer className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-black/5 z-40">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between gap-3">
          <button
            onClick={goPrev}
            disabled={stepIdx === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E8E4EC] text-sm font-semibold text-[#2E2A33] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F7F4FA] transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <p className="text-xs text-[#7A7387] hidden sm:block">
            Step <span className="font-bold text-[#2E2A33]">{stepIdx + 1}</span> of {total} · {STEP_META[step.kind].label}
          </p>
          {stepIdx < total - 1 ? (
            <button
              onClick={goNext}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white hover:opacity-90 transition"
              style={{ background: `linear-gradient(135deg, ${paletteFrom}, ${paletteTo})` }}
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-xs text-[#7A7387] font-semibold">Final step</span>
          )}
        </div>
      </footer>
    </div>
  );
}

// ─── Step pills (top-right nav) ───────────────────────────────

function StepPills(
  { steps, current, onJump, accent }:
  { steps: FWStep[]; current: number; onJump: (i: number) => void; accent: string }
) {
  return (
    <div className="hidden md:flex items-center gap-1">
      {steps.map((s, i) => {
        const Icon = STEP_META[s.kind].icon;
        const isActive = i === current;
        const isDone   = i < current;
        return (
          <button
            key={i}
            onClick={() => onJump(i)}
            className="group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition"
            style={{
              background: isActive ? accent : isDone ? `${accent}22` : 'transparent',
              color: isActive ? 'white' : isDone ? accent : '#7A7387',
            }}
            aria-label={`Step ${i + 1}: ${STEP_META[s.kind].label}`}
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span className="hidden lg:inline">{STEP_META[s.kind].short}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Step 1 — Opening ────────────────────────────────────────

function OpeningStep({ step, lesson }: { step: FWStepOpening; lesson: FWLesson }) {
  const paletteFrom = lesson.cover.palette?.from ?? lesson.cover.accent;
  const paletteTo   = lesson.cover.palette?.to   ?? lesson.cover.accent;
  return (
    <section>
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-3xl text-white px-8 md:px-14 py-14 md:py-20"
        style={{ background: `linear-gradient(135deg, ${paletteFrom} 0%, ${paletteTo} 100%)` }}
      >
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/70 mb-4">
            {step.title} · {lesson.level}
          </p>
          <div className="flex items-start gap-5 mb-6">
            {step.heroEmoji && <span className="text-6xl md:text-7xl leading-none">{step.heroEmoji}</span>}
            <div>
              <h1 className="font-serif text-4xl md:text-6xl leading-[1.05] mb-3">{step.topic}</h1>
              <p className="text-white/80 text-base md:text-lg leading-relaxed max-w-xl">{step.intro}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Three info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <InfoCard icon={Target} label="Purpose" accent={paletteFrom}>
          <p className="text-sm text-[#2E2A33] leading-relaxed">{step.purpose}</p>
        </InfoCard>
        <InfoCard icon={CheckCircle2} label="You will be able to" accent={paletteFrom}>
          <ul className="space-y-2">
            {step.learningOutcomes.map((o, i) => (
              <li key={i} className="flex gap-2 text-sm text-[#2E2A33] leading-relaxed">
                <span className="flex-shrink-0 w-4 h-4 rounded-full mt-0.5 flex items-center justify-center text-[10px] font-bold text-white" style={{ background: paletteTo }}>
                  {i + 1}
                </span>
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </InfoCard>
        <InfoCard icon={ScrollText} label="Grammar focus" accent={paletteFrom}>
          <ul className="space-y-1.5">
            {step.grammarFocus.map((g, i) => (
              <li key={i} className="text-sm text-[#2E2A33] leading-relaxed">
                <span className="inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle" style={{ background: paletteFrom }} />
                {g}
              </li>
            ))}
          </ul>
        </InfoCard>
      </div>
    </section>
  );
}

function InfoCard(
  { icon: Icon, label, accent, children }:
  { icon: React.ElementType; label: string; accent: string; children: React.ReactNode }
) {
  return (
    <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-[0_6px_20px_-12px_rgba(0,0,0,0.15)]">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${accent}18`, color: accent }}>
          <Icon className="w-4 h-4" strokeWidth={2.5} />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#7A7387]">{label}</p>
      </div>
      {children}
    </div>
  );
}

// ─── Step 2 — Vocab ──────────────────────────────────────────

function VocabStep(
  { step, accent, miniChoice, setMiniChoice, miniLocked, setMiniLocked }:
  {
    step: FWStepVocab; accent: string;
    miniChoice: Record<string, string>;
    setMiniChoice: (x: Record<string, string> | ((p: Record<string, string>) => Record<string, string>)) => void;
    miniLocked: Record<string, boolean>;
    setMiniLocked: (x: Record<string, boolean> | ((p: Record<string, boolean>) => Record<string, boolean>)) => void;
  }
) {
  return (
    <section>
      <StepHeader accent={accent} label="Vocab" title={step.title} intro={step.intro} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        {step.items.map((item, i) => (
          <VocabCard key={item.id} item={item} index={i} accent={accent} />
        ))}
      </div>

      {step.miniCheck && step.miniCheck.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${accent}18`, color: accent }}>
              <Check className="w-4 h-4" strokeWidth={2.5} />
            </span>
            <h3 className="font-serif text-xl text-[#2E2A33]">Quick check</h3>
          </div>
          <div className="space-y-3">
            {step.miniCheck.map(q => {
              const picked = miniChoice[q.id];
              const locked = miniLocked[q.id];
              return (
                <div key={q.id} className="bg-white rounded-2xl border border-black/5 p-5 shadow-sm">
                  <p className="font-semibold text-[#2E2A33] mb-3">{q.prompt}</p>
                  <div className="space-y-2">
                    {q.options.map(o => {
                      const isPicked  = picked === o.id;
                      const isCorrect = locked && o.id === q.correct;
                      const isWrong   = locked && isPicked && o.id !== q.correct;
                      return (
                        <button
                          key={o.id}
                          onClick={() => !locked && setMiniChoice(prev => ({ ...prev, [q.id]: o.id }))}
                          disabled={locked}
                          className="w-full text-left px-4 py-2.5 rounded-xl border-2 transition text-sm"
                          style={{
                            borderColor: isCorrect ? '#7BC67E' : isWrong ? '#E87BAD' : isPicked ? accent : '#E8E4EC',
                            background:  isCorrect ? '#EAF7EB' : isWrong ? '#FBE7F1' : isPicked ? `${accent}10` : 'white',
                          }}
                        >
                          <span className="font-bold mr-2 text-[#7A7387]">{o.id.toUpperCase()}.</span>
                          {o.text}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <button
                      onClick={() => {
                        if (!picked) return;
                        setMiniLocked(prev => ({ ...prev, [q.id]: true }));
                      }}
                      disabled={!picked || locked}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg text-white disabled:opacity-30"
                      style={{ background: accent }}
                    >
                      {locked ? 'Checked' : 'Check'}
                    </button>
                    {locked && q.explain && (
                      <p className="text-xs text-[#7A7387] italic max-w-md text-right">{q.explain}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function VocabCard({ item, index, accent }: { item: FWVocabItem; index: number; accent: string }) {
  const catLabel = item.category ? CATEGORY_LABEL[item.category] ?? item.category : null;
  return (
    <div className="group bg-white rounded-2xl border border-black/5 p-5 shadow-[0_6px_20px_-12px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_30px_-14px_rgba(0,0,0,0.2)] transition">
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-[11px] font-black tracking-widest text-[#7A7387]">
          #{String(index + 1).padStart(2, '0')}
        </span>
        {catLabel && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: `${accent}18`, color: accent }}>
            {catLabel}
          </span>
        )}
      </div>
      <p className="font-serif text-xl text-[#2E2A33] leading-tight mb-2">{item.phrase}</p>
      <p className="text-sm text-[#7A7387] mb-3 leading-relaxed">{item.translation}</p>
      <div className="border-l-2 pl-3 py-1 mb-3" style={{ borderColor: accent }}>
        <p className="text-sm text-[#2E2A33] italic">{item.example}</p>
      </div>
      {item.useCase && (
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#7A7387]">
          Use when: <span className="font-semibold text-[#2E2A33] normal-case tracking-normal">{item.useCase}</span>
        </p>
      )}
    </div>
  );
}

// ─── Step 3 — Brainstorm ─────────────────────────────────────

function BrainstormStep(
  { step, accent, notes, onChange }:
  { step: FWStepBrainstorm; accent: string; notes: Record<string, string>; onChange: (id: string, v: string) => void }
) {
  const filled = step.prompts.filter(p => (notes[p.id] ?? '').trim().length > 0).length;
  return (
    <section>
      <StepHeader accent={accent} label="Brainstorm" title={step.title} intro={step.intro} />

      <div className="mt-6 flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-black/5 overflow-hidden">
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${(filled / step.prompts.length) * 100}%`, background: accent }}
          />
        </div>
        <p className="text-xs font-semibold text-[#7A7387]">
          {filled}<span className="text-[#C3BDCA]">/{step.prompts.length}</span> ideas
        </p>
      </div>

      <div className="mt-8 space-y-4">
        {step.prompts.map((p, i) => {
          const val = notes[p.id] ?? '';
          const has = val.trim().length > 0;
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-black/5 p-5 md:p-6 shadow-[0_6px_20px_-12px_rgba(0,0,0,0.12)]">
              <div className="flex items-start gap-4">
                <div
                  className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black"
                  style={{ background: has ? accent : '#C3BDCA' }}
                >
                  {has ? <Check className="w-4 h-4" strokeWidth={3} /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-lg text-[#2E2A33] leading-snug mb-1">{p.question}</p>
                  {p.hint && (
                    <p className="text-xs text-[#7A7387] italic mb-3">💡 {p.hint}</p>
                  )}
                  <textarea
                    value={val}
                    onChange={e => onChange(p.id, e.target.value)}
                    placeholder={p.starter ?? 'Write a short note…'}
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-xl border-2 focus:outline-none transition text-sm resize-none"
                    style={{ borderColor: has ? accent : '#E8E4EC', background: has ? `${accent}08` : 'white' }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {step.carryToPractice && (
        <p className="text-center text-xs text-[#7A7387] mt-8 italic">
          Your notes will travel with you to the Practice step — you won't rewrite them.
        </p>
      )}
    </section>
  );
}

// ─── Step 4 — Model ──────────────────────────────────────────

function ModelStep(
  { step, accent, activeAnn, setActiveAnn }:
  { step: FWStepModel; accent: string; activeAnn: string | null; setActiveAnn: (id: string | null) => void }
) {
  // Build a tokenized version of the model text where each annotated anchor
  // becomes a <mark> with a per-annotation color. Non-anchor runs stay as
  // plain text. We walk the text ONCE, scanning for the earliest-starting
  // anchor at each cursor position so overlapping anchors can't double-wrap.
  const parts = useMemo(() => {
    const anns = [...step.annotations].sort((a, b) => a.anchor.length - b.anchor.length);
    const fullText = step.modelText;
    type Piece = { kind: 'text' | 'mark'; text: string; ann?: FWModelAnnotation };
    const out: Piece[] = [];
    let cursor = 0;
    while (cursor < fullText.length) {
      // Find the earliest match from `cursor` for any annotation
      let bestIdx = -1;
      let bestAnn: FWModelAnnotation | null = null;
      for (const a of anns) {
        const found = fullText.indexOf(a.anchor, cursor);
        if (found === -1) continue;
        if (bestIdx === -1 || found < bestIdx) {
          bestIdx = found;
          bestAnn = a;
        }
      }
      if (bestAnn === null || bestIdx === -1) {
        out.push({ kind: 'text', text: fullText.slice(cursor) });
        break;
      }
      if (bestIdx > cursor) {
        out.push({ kind: 'text', text: fullText.slice(cursor, bestIdx) });
      }
      out.push({ kind: 'mark', text: bestAnn.anchor, ann: bestAnn });
      cursor = bestIdx + bestAnn.anchor.length;
    }
    return out;
  }, [step.annotations, step.modelText]);

  return (
    <section>
      <StepHeader accent={accent} label="Model" title={step.title} intro={step.intro} />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
        {/* Model text */}
        <article className="bg-white rounded-2xl border border-black/5 shadow-[0_8px_30px_-16px_rgba(0,0,0,0.2)] overflow-hidden">
          <div className="px-6 py-3 border-b border-black/5 flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-[#7A7387]" strokeWidth={2.5} />
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#7A7387]">{step.modelLabel}</p>
          </div>
          <div className="p-6 md:p-8 font-serif text-[17px] leading-[1.8] text-[#2E2A33] whitespace-pre-wrap">
            {parts.map((p, i) => {
              if (p.kind === 'text') return <span key={i}>{p.text}</span>;
              const a = p.ann!;
              const on = activeAnn === a.id;
              return (
                <mark
                  key={i}
                  onMouseEnter={() => setActiveAnn(a.id)}
                  onClick={() => setActiveAnn(on ? null : a.id)}
                  className="rounded px-0.5 transition cursor-pointer"
                  style={{
                    background: on ? accent : `${accent}22`,
                    color: on ? 'white' : undefined,
                    boxShadow: on ? `0 0 0 2px ${accent}` : undefined,
                  }}
                >
                  {p.text}
                </mark>
              );
            })}
          </div>
        </article>

        {/* Annotations rail */}
        <aside className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#7A7387] mb-2 flex items-center gap-2">
            <Highlighter className="w-3.5 h-3.5" strokeWidth={2.5} /> Annotations
          </p>
          {step.annotations.map((a, i) => {
            const on = activeAnn === a.id;
            return (
              <button
                key={a.id}
                onMouseEnter={() => setActiveAnn(a.id)}
                onClick={() => setActiveAnn(on ? null : a.id)}
                className="w-full text-left bg-white rounded-xl border p-3 transition"
                style={{
                  borderColor: on ? accent : '#E8E4EC',
                  background: on ? `${accent}10` : 'white',
                  boxShadow: on ? `0 4px 14px -4px ${accent}66` : undefined,
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-bold text-[#2E2A33]">{a.label}</p>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: `${accent}18`, color: accent }}>
                    {CATEGORY_LABEL[a.category] ?? a.category}
                  </span>
                </div>
                <p className="text-[11px] text-[#7A7387] leading-relaxed">{a.tip}</p>
              </button>
            );
          })}
        </aside>
      </div>

      {/* Tips & tricks */}
      {step.tips.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${accent}18`, color: accent }}>
              <Lightbulb className="w-4 h-4" strokeWidth={2.5} />
            </span>
            <h3 className="font-serif text-xl text-[#2E2A33]">Tips & tricks</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {step.tips.map((t, i) => (
              <div key={t.id} className="bg-white rounded-2xl border border-black/5 p-4 shadow-sm">
                <p className="text-[10px] font-black tracking-widest" style={{ color: accent }}>TIP {String(i + 1).padStart(2, '0')}</p>
                <p className="font-serif text-base text-[#2E2A33] mt-1 mb-2 leading-tight">{t.title}</p>
                <p className="text-xs text-[#7A7387] leading-relaxed">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Step 5 — Practice ───────────────────────────────────────

function PracticeStep(
  { step, lesson, accent, draft, setDraft, wordCount, brainstorm }:
  {
    step: FWStepPractice; lesson: FWLesson; accent: string;
    draft: string; setDraft: (v: string) => void; wordCount: number;
    brainstorm: Record<string, string>;
  }
) {
  const brainstormStep = useMemo(
    () => lesson.steps.find(s => s.kind === 'brainstorm') as FWStepBrainstorm | undefined,
    [lesson],
  );
  const vocabStep = useMemo(
    () => lesson.steps.find(s => s.kind === 'vocab') as FWStepVocab | undefined,
    [lesson],
  );

  // Target-phrase progress — simple "contains" against the student's draft
  const draftLower = draft.toLowerCase();
  const targets = (step.targetPhraseIds ?? [])
    .map(id => vocabStep?.items.find(v => v.id === id))
    .filter((v): v is FWVocabItem => !!v);
  const hit = (v: FWVocabItem) => {
    const core = v.phrase.split('/')[0].trim().toLowerCase().replace(/[,.]$/, '');
    if (!core) return false;
    // Allow partial variants for chunks with slot (e.g. "Hi + name,")
    const stem = core.split(' + ')[0].replace(/[()…]/g, '').trim();
    return stem.length > 0 && draftLower.includes(stem);
  };

  const pct   = step.minWords > 0 ? Math.min(100, (wordCount / step.minWords) * 100) : 0;
  const under = wordCount < step.minWords;

  return (
    <section>
      <StepHeader accent={accent} label="Practice" title={step.title} intro={step.intro} />

      {/* Task card */}
      <div
        className="mt-8 rounded-2xl text-white px-6 md:px-8 py-6 md:py-7 shadow-[0_12px_30px_-14px_rgba(0,0,0,0.3)] overflow-hidden relative"
        style={{ background: `linear-gradient(135deg, ${lesson.cover.palette?.from ?? accent}, ${lesson.cover.palette?.to ?? accent})` }}
      >
        <div className="absolute -top-14 -right-14 w-44 h-44 rounded-full bg-white/10 blur-2xl" />
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70 mb-2">The task</p>
        <h3 className="font-serif text-2xl md:text-3xl leading-tight mb-3">{step.taskTitle}</h3>
        <p className="text-white/90 text-sm md:text-base leading-relaxed mb-4">{step.taskPrompt}</p>
        {step.bulletPoints && step.bulletPoints.length > 0 && (
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/80 mb-2">In your piece:</p>
            <ul className="space-y-1.5">
              {step.bulletPoints.map((b, i) => (
                <li key={i} className="text-sm text-white/95 flex gap-2">
                  <span className="text-white/60">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Writing + side rails */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Editor */}
        <div className="bg-white rounded-2xl border border-black/5 shadow-[0_8px_30px_-16px_rgba(0,0,0,0.15)] overflow-hidden">
          <div className="px-5 py-3 border-b border-black/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PenLine className="w-4 h-4 text-[#7A7387]" strokeWidth={2.5} />
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#7A7387]">Your draft</p>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-3.5 h-3.5 text-[#7A7387]" strokeWidth={2.5} />
              <span className="text-xs text-[#7A7387]">~{step.suggestedMin} min</span>
            </div>
          </div>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Start writing here. Your draft auto-saves on this device."
            className="w-full px-6 py-6 min-h-[380px] text-[15px] leading-[1.75] text-[#2E2A33] font-serif focus:outline-none resize-y bg-white"
            spellCheck
          />
          <div className="px-5 py-3 border-t border-black/5 flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-1 h-1.5 rounded-full bg-black/5 overflow-hidden max-w-xs">
                <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, background: accent }} />
              </div>
              <p className="text-xs">
                <span className="font-bold text-[#2E2A33]">{wordCount}</span>
                <span className="text-[#7A7387]"> / {step.minWords} words</span>
              </p>
            </div>
            {under ? (
              <span className="text-[11px] text-[#7A7387] italic hidden sm:inline">Keep going…</span>
            ) : (
              <span className="text-[11px] font-bold flex items-center gap-1" style={{ color: accent }}>
                <Check className="w-3.5 h-3.5" strokeWidth={3} /> Minimum reached
              </span>
            )}
          </div>
        </div>

        {/* Side rail */}
        <aside className="space-y-4">
          {/* Target phrases checklist */}
          {targets.length > 0 && (
            <div className="bg-white rounded-2xl border border-black/5 p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#7A7387] mb-3 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" strokeWidth={2.5} /> Target phrases
              </p>
              <ul className="space-y-1.5">
                {targets.map(v => {
                  const ok = hit(v);
                  return (
                    <li key={v.id} className="flex items-start gap-2 text-xs">
                      <span
                        className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black mt-0.5"
                        style={{ background: ok ? accent : '#E8E4EC', color: ok ? 'white' : '#7A7387' }}
                      >
                        {ok ? '✓' : ''}
                      </span>
                      <span className={ok ? 'text-[#2E2A33] font-semibold' : 'text-[#7A7387]'}>{v.phrase}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Grammar structures to try */}
          {step.targetStructures && step.targetStructures.length > 0 && (
            <div className="bg-white rounded-2xl border border-black/5 p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#7A7387] mb-2 flex items-center gap-1.5">
                <ScrollText className="w-3.5 h-3.5" strokeWidth={2.5} /> Try to use
              </p>
              <ul className="space-y-1 text-xs text-[#2E2A33]">
                {step.targetStructures.map((s, i) => (
                  <li key={i}>
                    <span className="inline-block w-1 h-1 rounded-full align-middle mr-1.5" style={{ background: accent }} />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Brainstorm carry */}
          {brainstormStep && Object.keys(brainstorm).length > 0 && (
            <div className="bg-white rounded-2xl border border-black/5 p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#7A7387] mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" strokeWidth={2.5} /> Your ideas
              </p>
              <ul className="space-y-2">
                {brainstormStep.prompts.map(p => {
                  const note = brainstorm[p.id];
                  if (!note?.trim()) return null;
                  return (
                    <li key={p.id} className="text-xs">
                      <p className="text-[#7A7387] mb-0.5">{p.question}</p>
                      <p className="text-[#2E2A33] italic">"{note}"</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

// ─── Step 6 — Wrap-up ────────────────────────────────────────

function WrapUpStep(
  {
    step, accent, paletteFrom, paletteTo, reflection, setReflection,
    draft, wordCount, practiceStep, user, submitting, submitError, onSubmit,
  }: {
    step: FWStepWrapUp; accent: string; paletteFrom: string; paletteTo: string;
    reflection: Record<string, string>;
    setReflection: (x: Record<string, string> | ((p: Record<string, string>) => Record<string, string>)) => void;
    draft: string; wordCount: number;
    practiceStep: FWStepPractice | undefined;
    user: { uid: string; email: string | null } | null;
    submitting: boolean; submitError: string | null;
    onSubmit: () => void;
  }
) {
  const canSubmit = !!user && !submitting && draft.trim().length > 0;
  const under = practiceStep ? wordCount < practiceStep.minWords : false;

  return (
    <section>
      <StepHeader accent={accent} label="Wrap-up" title={step.title} intro={step.intro} />

      {/* Recap */}
      <div className="mt-8 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${paletteFrom}, ${paletteTo})` }}>
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-3xl" />
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70 mb-3">Today you…</p>
        <ul className="space-y-2.5">
          {step.recapPoints.map((r, i) => (
            <li key={i} className="flex items-start gap-3 text-sm md:text-base text-white/95 leading-relaxed">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-[11px] font-bold mt-0.5">
                {i + 1}
              </span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Reflection */}
      {step.reflection && step.reflection.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${accent}18`, color: accent }}>
              <MessageCircle className="w-4 h-4" strokeWidth={2.5} />
            </span>
            <h3 className="font-serif text-xl text-[#2E2A33]">Reflection</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {step.reflection.map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-black/5 p-4 shadow-sm">
                <p className="text-sm text-[#2E2A33] font-semibold leading-snug mb-2">{r.prompt}</p>
                <textarea
                  value={reflection[r.id] ?? ''}
                  onChange={e => setReflection(prev => ({ ...prev, [r.id]: e.target.value }))}
                  placeholder={r.starter ?? 'Write a short note…'}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border-2 border-[#E8E4EC] focus:outline-none focus:border-current text-sm resize-none"
                  style={{ color: '#2E2A33' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next class */}
      {step.nextClass && (
        <div className="mt-8 flex items-start gap-3 bg-white rounded-2xl border border-black/5 p-5 shadow-sm">
          <span className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-xl" style={{ background: `${accent}18` }}>🗓️</span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#7A7387] mb-1">Next class</p>
            <p className="text-sm text-[#2E2A33] leading-relaxed">{step.nextClass}</p>
          </div>
        </div>
      )}

      {/* Submit box */}
      <div className="mt-10 bg-white rounded-2xl border-2 p-6 shadow-lg" style={{ borderColor: `${accent}40` }}>
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#7A7387] mb-1">Ready?</p>
            <p className="font-serif text-xl text-[#2E2A33] leading-snug">Submit your piece to your teacher.</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#7A7387]">
              <span><span className="font-bold text-[#2E2A33]">{wordCount}</span> words written</span>
              {under && practiceStep && (
                <span className="text-amber-700">⚠ You're below the {practiceStep.minWords}-word minimum.</span>
              )}
              {!user && (
                <span className="text-rose-600">You need to be signed in to submit.</span>
              )}
            </div>
          </div>
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: `linear-gradient(135deg, ${paletteFrom}, ${paletteTo})` }}
          >
            {submitting ? (<><RotateCcw className="w-4 h-4 animate-spin" /> Submitting…</>) : (<><Send className="w-4 h-4" /> Submit to teacher</>)}
          </button>
        </div>
        {submitError && (
          <p className="text-xs text-rose-600 mt-3">{submitError}</p>
        )}
      </div>
    </section>
  );
}

// ─── Shared step header ──────────────────────────────────────

function StepHeader(
  { accent, label, title, intro }:
  { accent: string; label: string; title: string; intro: string }
) {
  return (
    <header>
      <p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: accent }}>
        {label}
      </p>
      <h2 className="font-serif text-3xl md:text-4xl text-[#2E2A33] leading-tight mt-1 mb-3">{title}</h2>
      <p className="text-[#7A7387] text-base md:text-lg leading-relaxed max-w-2xl">{intro}</p>
    </header>
  );
}
