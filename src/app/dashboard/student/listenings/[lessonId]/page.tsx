// Friendlistenings® — student lesson runner.
//
// One page, N steps + a final recap. All answer state lives in the Runner so
// going Back/Forward preserves what the student typed or picked. Questions
// expose a `kind` discriminator so the dispatcher is a plain switch, not an
// "in q" probe. MCQ and True/False use pick → "Check" (same shape as
// GapFill) — no instant-lock on first click.
//
// Audio resolution: the lesson file ships with an optional static audioUrl,
// but once a teacher presses "Generate audio" on the teacher catalog the
// canonical URL moves to Firestore (`friendlisteningsAudios/{lessonId}`).
// We fetch that on mount so every student hears the same voice.

'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, ArrowLeft, X, BookOpen, PlayCircle,
  RotateCcw, CheckCircle2, Sparkles,
} from 'lucide-react';
import { getFriendlisteningsLesson } from '@/lib/data/friendlistenings';
import { loadFriendlisteningsAudio } from '@/lib/friendlistenings/audioStore';
import FullscreenButton from '@/components/ui/FullscreenButton';
import type {
  FLLesson, FLStep, FLStepLeadIn, FLStepVocab, FLStepPrediction,
  FLStepGist, FLStepDetail, FLStepLanguageAwareness,
  FLStepControlledPractice, FLStepProduction,
  FLMCQ, FLGapFill, FLTrueFalse, FLVocabItem, FLChunk, FLQuestion,
} from '@/types/friendlistenings';

const BRAND = {
  purple:    '#9B72B8',
  purpleDk:  '#4A2060',
  pink:      '#E87BAD',
  pinkLt:    '#FBE7F1',
  yellow:    '#F9F0A8',
  yellowLt:  '#FCF7D8',
  cyan:      '#7ED6E0',
  cyanLt:    '#E6F6F9',
  green:     '#7BC67E',
  greenLt:   '#EAF7EB',
  orange:    '#F4A261',
  purpleLt:  '#E8D8F5',
  offwhite:  '#FFFDF5',
  ink:       '#2E2A33',
  mute:      '#7A7387',
};

const STEP_META: Record<FLStep['kind'], { label: string; color: string; icon: string }> = {
  'lead-in':             { label: 'Lead-in',    color: BRAND.pink,   icon: '💬' },
  'vocab':               { label: 'Vocab',      color: BRAND.yellow, icon: '📚' },
  'prediction':          { label: 'Predict',    color: BRAND.cyan,   icon: '🔮' },
  'gist':                { label: 'Gist',       color: BRAND.green,  icon: '🎧' },
  'detail':              { label: 'Detail',     color: BRAND.orange, icon: '🔍' },
  'language-awareness':  { label: 'Language',   color: BRAND.purple, icon: '✨' },
  'controlled-practice': { label: 'Practice',   color: BRAND.purple, icon: '🧩' },
  'production':          { label: 'Production', color: BRAND.pink,   icon: '🎤' },
};

// ─── State shapes ───────────────────────────────────────────

type QAnswer =
  | { kind: 'mcq';        picked: string | null; locked: boolean }
  | { kind: 'true-false'; picked: 'T' | 'F' | 'NG' | null; locked: boolean }
  | { kind: 'gap-fill';   vals: string[]; locked: boolean };

interface RunnerState {
  answers:    Record<string, QAnswer>;
  openText:   Record<string, string>;
  flipped:    Record<string, boolean>;
  transcript: boolean;
}

const EMPTY_STATE: RunnerState = {
  answers: {}, openText: {}, flipped: {}, transcript: false,
};

export default function FriendlisteningsRunner({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = use(params);
  const lesson = getFriendlisteningsLesson(lessonId);

  if (!lesson) {
    return (
      <Shell>
        <div className="max-w-xl mx-auto mt-32 text-center bg-white rounded-3xl p-10 shadow-lg">
          <p className="text-5xl mb-3">🫥</p>
          <h1 className="font-serif text-2xl font-bold text-[#2E2A33] mb-2">Lesson not found</h1>
          <p className="text-sm text-[#7A7387] mb-4">It may have been renamed or unpublished.</p>
          <Link
            href="/dashboard/student/listenings"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#9B72B8] hover:text-[#4A2060]"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2.5} /> Back to Friendlistenings
          </Link>
        </div>
      </Shell>
    );
  }

  return <Runner lesson={lesson} />;
}

// ─── Runner ─────────────────────────────────────────────────

function Runner({ lesson }: { lesson: FLLesson }) {
  const [idx, setIdx] = useState(0);
  const [state, setState] = useState<RunnerState>(EMPTY_STATE);

  // Resolve the audio URL: Firestore wins over the static lesson default.
  const [audioUrl, setAudioUrl] = useState<string | null>(lesson.audio.audioUrl ?? null);
  useEffect(() => {
    let alive = true;
    loadFriendlisteningsAudio(lesson.id).then(url => {
      if (alive && url) setAudioUrl(url);
    });
    return () => { alive = false; };
  }, [lesson.id]);

  const done = idx >= lesson.steps.length;
  const step = done ? null : lesson.steps[idx];
  const meta = step ? STEP_META[step.kind] : null;
  const needsAudio = step?.kind === 'gist' || step?.kind === 'detail';

  const goNext = useCallback(
    () => setIdx(i => Math.min(lesson.steps.length, i + 1)),
    [lesson.steps.length],
  );
  const goPrev = useCallback(
    () => setIdx(i => Math.max(0, i - 1)),
    [],
  );

  // Keyboard nav: ←/→ always navigate; Enter advances. Bail if the user is
  // typing into a textarea/input/contenteditable — otherwise Enter would
  // skip the step while they're still writing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (
        t.tagName === 'TEXTAREA' ||
        t.tagName === 'INPUT' ||
        t.isContentEditable
      );
      if (e.key === 'ArrowRight' && !typing && !done) { e.preventDefault(); goNext(); }
      else if (e.key === 'ArrowLeft' && !typing)      { e.preventDefault(); goPrev(); }
      else if (e.key === 'Enter' && !typing && !done) { e.preventDefault(); goNext(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, done]);

  if (done) {
    return (
      <Shell>
        <CompletionRecap
          lesson={lesson}
          state={state}
          onRestart={() => { setIdx(0); setState(EMPTY_STATE); }}
          onReview={(i) => setIdx(i)}
        />
      </Shell>
    );
  }

  if (!step || !meta) return null;

  return (
    <Shell>
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/dashboard/student/listenings"
            className="w-9 h-9 rounded-full bg-white/80 hover:bg-white text-[#4A2060] flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#9B72B8]">
              {lesson.level} · Friendlistenings
            </p>
            <h1 className="font-serif text-lg md:text-xl font-bold text-[#2E2A33] leading-tight truncate">
              {lesson.title}
            </h1>
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="flex gap-1.5 mb-6"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={lesson.steps.length}
          aria-valuenow={idx + 1}
          aria-label={`Step ${idx + 1} of ${lesson.steps.length}`}
        >
          {lesson.steps.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              className={`flex-1 h-1.5 rounded-full transition-colors cursor-pointer ${
                i < idx ? 'bg-[#9B72B8]'
                : i === idx ? 'bg-[#9B72B8]/60'
                : 'bg-white hover:bg-white/60'
              }`}
              title={`${i + 1}. ${STEP_META[s.kind].label}`}
              aria-label={`Go to step ${i + 1}: ${STEP_META[s.kind].label}`}
            />
          ))}
        </div>

        {/* Step card */}
        <div className="bg-white rounded-3xl shadow-[0_10px_30px_-16px_rgba(74,32,96,0.25)] overflow-hidden">
          {/* Step title bar */}
          <div className="px-6 py-4 border-b border-[#E8D8F5] flex items-center gap-3"
            style={{ background: meta.color + '18' }}
          >
            <div
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-serif text-lg font-black"
              style={{ background: meta.color }}
            >
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: BRAND.purpleDk }}>
                {meta.icon} {meta.label}
              </p>
              <p className="font-serif text-xl md:text-2xl font-bold text-[#2E2A33] leading-tight">
                {step.title}
              </p>
            </div>
          </div>

          {/* Audio (when needed by this step) */}
          {needsAudio && <AudioPlayer audioUrl={audioUrl} />}

          {/* Step body */}
          <div className="p-6 md:p-7">
            <StepBody lesson={lesson} step={step} state={state} setState={setState} />
          </div>
        </div>

        {/* Nav */}
        <div className="flex items-center justify-between mt-5">
          <button
            onClick={goPrev}
            disabled={idx === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold text-[#4A2060] bg-white/80 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2.5} /> Back
          </button>

          <button
            onClick={goNext}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-black uppercase tracking-wider text-white shadow-lg active:scale-95 transition-all"
            style={{ background: idx === lesson.steps.length - 1 ? BRAND.green : BRAND.purple }}
          >
            {idx === lesson.steps.length - 1 ? 'Finish' : 'Next'}
            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        <p className="text-center text-[11px] text-[#7A7387] mt-3 hidden md:block">
          Shortcuts: ← / → to navigate · Enter to advance
        </p>
      </div>
    </Shell>
  );
}

// ─── Step body dispatcher ────────────────────────────────────

interface StepProps {
  lesson:   FLLesson;
  state:    RunnerState;
  setState: React.Dispatch<React.SetStateAction<RunnerState>>;
}

function StepBody({ step, ...p }: StepProps & { step: FLStep }) {
  switch (step.kind) {
    case 'lead-in':             return <LeadInBody step={step} {...p} />;
    case 'vocab':               return <VocabBody step={step} {...p} />;
    case 'prediction':          return <PredictionBody step={step} {...p} />;
    case 'gist':                return <GistBody step={step} {...p} />;
    case 'detail':              return <DetailBody step={step} {...p} />;
    case 'language-awareness':  return <LanguageAwarenessBody step={step} />;
    case 'controlled-practice': return <ControlledPracticeBody step={step} {...p} />;
    case 'production':          return <ProductionBody step={step} {...p} />;
  }
}

// ─── Step bodies ─────────────────────────────────────────────

function LeadInBody({ step, state, setState }: StepProps & { step: FLStepLeadIn }) {
  const setText = (id: string, text: string) =>
    setState(s => ({ ...s, openText: { ...s.openText, [id]: text } }));
  return (
    <div className="space-y-5">
      <Prose>{step.intro}</Prose>
      <div className="grid grid-cols-1 gap-3">
        {step.openQuestions.map((q, i) => (
          <div key={q.id} className="rounded-2xl border border-[#E8D8F5] bg-[#FFFDF5] p-4">
            <p className="font-serif text-base font-semibold text-[#4A2060] mb-2">
              {i + 1}. {q.prompt}
            </p>
            {q.hint && <p className="text-[12px] text-[#7A7387] italic mb-2">{q.hint}</p>}
            <textarea
              value={state.openText[q.id] ?? ''}
              onChange={(e) => setText(q.id, e.target.value)}
              rows={3}
              placeholder="Write it, or just think it…"
              className="w-full px-3 py-2 border-2 border-[#E8D8F5] rounded-xl text-sm text-[#2E2A33] bg-white focus:outline-none focus:border-[#9B72B8] transition-colors resize-none"
            />
          </div>
        ))}
      </div>
      <Tip>
        No right answers here — this step just warms your brain up for what's coming.
      </Tip>
    </div>
  );
}

function VocabBody({ step, state, setState }: StepProps & { step: FLStepVocab }) {
  const toggleFlip = (id: string) =>
    setState(s => ({ ...s, flipped: { ...s.flipped, [id]: !s.flipped[id] } }));
  return (
    <div className="space-y-6">
      <Prose>{step.intro}</Prose>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {step.items.map(item => (
          <VocabCard
            key={item.id}
            item={item}
            flipped={!!state.flipped[item.id]}
            onFlip={() => toggleFlip(item.id)}
          />
        ))}
      </div>
      {step.quiz.length > 0 && (
        <div className="pt-4 border-t border-[#E8D8F5] space-y-4">
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#9B72B8]">
            Quick check
          </p>
          {step.quiz.map((q, i) => (
            <MCQBlock key={q.id} q={q} index={i + 1} state={state} setState={setState} />
          ))}
        </div>
      )}
    </div>
  );
}

function VocabCard({ item, flipped, onFlip }: { item: FLVocabItem; flipped: boolean; onFlip: () => void }) {
  return (
    <button
      type="button"
      onClick={onFlip}
      className="text-left rounded-2xl border border-[#E8D8F5] bg-gradient-to-br from-[#FCF7D8] to-white p-4 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-serif text-lg font-black text-[#4A2060] leading-tight">
            {item.word}
          </p>
          {item.pos && <p className="text-[10px] font-black uppercase tracking-widest text-[#9B72B8]">{item.pos}</p>}
        </div>
        <span className="text-[10px] text-[#7A7387]">{flipped ? 'example ↓' : 'meaning ↓'}</span>
      </div>
      {!flipped ? (
        <p className="text-sm text-[#2E2A33] mt-2 leading-snug">
          {item.translation}
        </p>
      ) : (
        <div className="mt-2 space-y-1">
          <p className="text-sm text-[#2E2A33] italic leading-snug">&ldquo;{item.example}&rdquo;</p>
          {item.definition && <p className="text-[12px] text-[#7A7387] leading-snug">{item.definition}</p>}
          {item.soundsLike && <p className="text-[11px] text-[#9B72B8] font-semibold">🔊 {item.soundsLike}</p>}
        </div>
      )}
    </button>
  );
}

function PredictionBody({ step, state, setState }: StepProps & { step: FLStepPrediction }) {
  return (
    <div className="space-y-5">
      <Prose>{step.intro}</Prose>
      <div className="space-y-4">
        {step.questions.map((q, i) => (
          <MCQBlock key={q.id} q={q} index={i + 1} state={state} setState={setState} tone="prediction" />
        ))}
      </div>
      <Tip tone="cyan">
        Predictions aren&apos;t graded — we&apos;ll come back to them after you listen.
      </Tip>
    </div>
  );
}

function GistBody({ step, state, setState }: StepProps & { step: FLStepGist }) {
  return (
    <div className="space-y-5">
      <Prose>{step.intro}</Prose>
      {step.listenFor && step.listenFor.length > 0 && (
        <div className="rounded-2xl border border-[#EAF7EB] bg-[#EAF7EB]/60 p-4 space-y-1.5">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#4A2060]">
            Listen for
          </p>
          <ul className="list-disc pl-5 text-sm text-[#2E2A33] space-y-1">
            {step.listenFor.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </div>
      )}
      <QuestionList questions={step.questions} state={state} setState={setState} />
    </div>
  );
}

function DetailBody({ step, state, setState, lesson }: StepProps & { step: FLStepDetail }) {
  const showTranscript = state.transcript;
  return (
    <div className="space-y-5">
      <Prose>{step.intro}</Prose>

      {step.allowTranscript && (
        <button
          type="button"
          onClick={() => setState(s => ({ ...s, transcript: !s.transcript }))}
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#9B72B8] hover:text-[#4A2060] transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" strokeWidth={2.5} />
          {showTranscript ? 'Hide transcript' : 'Show transcript'}
        </button>
      )}

      {showTranscript && <Transcript lesson={lesson} />}

      <QuestionList questions={step.questions} state={state} setState={setState} />
    </div>
  );
}

function LanguageAwarenessBody({ step }: { step: FLStepLanguageAwareness }) {
  return (
    <div className="space-y-5">
      <Prose>{step.intro}</Prose>
      <div className="grid grid-cols-1 gap-3">
        {step.chunks.map(c => <ChunkCard key={c.id} chunk={c} />)}
      </div>
    </div>
  );
}

function ChunkCard({ chunk }: { chunk: FLChunk }) {
  return (
    <div className="rounded-2xl border border-[#E8D8F5] bg-gradient-to-br from-[#FBE7F1] to-white p-4 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-serif text-lg font-black text-[#4A2060]">{chunk.chunk}</span>
        <span className="text-[9px] font-black uppercase tracking-widest text-[#9B72B8] bg-white px-2 py-0.5 rounded-full border border-[#E8D8F5]">
          {chunk.category.replace('-', ' ')}
        </span>
      </div>
      <p className="text-sm text-[#2E2A33]">{chunk.gloss}</p>
      <p className="text-sm text-[#2E2A33] italic bg-white/80 rounded-lg px-3 py-2 border border-[#E8D8F5]">
        &ldquo;{chunk.example}&rdquo;
      </p>
      <p className="text-[12px] text-[#7A7387] leading-snug">
        <span className="font-semibold text-[#9B72B8]">💡 Notice:</span> {chunk.notice}
      </p>
    </div>
  );
}

function ControlledPracticeBody({ step, state, setState }: StepProps & { step: FLStepControlledPractice }) {
  return (
    <div className="space-y-5">
      <Prose>{step.intro}</Prose>
      <QuestionList questions={step.activities} state={state} setState={setState} />
    </div>
  );
}

function ProductionBody({ step, state, setState, lesson }: StepProps & { step: FLStepProduction }) {
  const key = `prod-${lesson.id}`;
  const text = state.openText[key] ?? '';
  const setText = (t: string) =>
    setState(s => ({ ...s, openText: { ...s.openText, [key]: t } }));

  const chunks = useMemo(() => {
    if (!step.targetChunks) return [];
    const awareness = lesson.steps.find(s => s.kind === 'language-awareness') as FLStepLanguageAwareness | undefined;
    if (!awareness) return [];
    const byId = new Map(awareness.chunks.map(c => [c.id, c]));
    return step.targetChunks.map(id => byId.get(id)).filter((c): c is FLChunk => !!c);
  }, [step.targetChunks, lesson.steps]);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-5">
      <Prose>{step.intro}</Prose>

      <div className="rounded-3xl border-2 border-[#E87BAD] bg-[#FBE7F1] p-5">
        <p className="text-[11px] font-black uppercase tracking-widest text-[#7A3B5F] mb-1">
          {step.mode === 'speaking' ? '🎤 Your task' : '✍️ Your task'}
        </p>
        <p className="font-serif text-lg text-[#4A2060] leading-snug">
          {step.prompt}
        </p>
      </div>

      {chunks.length > 0 && (
        <div className="rounded-2xl border border-[#E8D8F5] bg-[#FFFDF5] p-4">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#9B72B8] mb-2">
            Try to use these chunks
          </p>
          <div className="flex flex-wrap gap-2">
            {chunks.map(c => (
              <span key={c.id} className="inline-flex items-center px-3 py-1.5 rounded-full bg-white border-2 border-[#E8D8F5] text-sm font-semibold text-[#4A2060]">
                {c.chunk}
              </span>
            ))}
          </div>
        </div>
      )}

      {step.mode === 'writing' ? (
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="Write here…"
            className="w-full px-4 py-3 border-2 border-[#E8D8F5] rounded-2xl text-[15px] text-[#2E2A33] bg-white focus:outline-none focus:border-[#9B72B8] transition-colors resize-none"
          />
          <p className="text-[11px] text-[#7A7387] text-right">
            {wordCount} {step.minWords ? `/ ${step.minWords}` : ''} words
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-[#9B72B8] bg-white p-6 text-center space-y-2">
          <p className="text-4xl">🎙️</p>
          <p className="text-sm text-[#4A2060] font-semibold">
            Audio recording — coming soon
          </p>
          <p className="text-[12px] text-[#7A7387]">
            Target: {step.minSeconds ?? 60} seconds. For now, record on your favourite app and share it with your teacher.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Question list / dispatchers ─────────────────────────────

function QuestionList({ questions, state, setState }: { questions: FLQuestion[]; state: RunnerState; setState: StepProps['setState'] }) {
  return (
    <div className="space-y-4">
      {questions.map((q, i) => {
        switch (q.kind) {
          case 'mcq':        return <MCQBlock       key={q.id} q={q} index={i + 1} state={state} setState={setState} />;
          case 'gap-fill':   return <GapFillBlock   key={q.id} q={q} index={i + 1} state={state} setState={setState} />;
          case 'true-false': return <TrueFalseBlock key={q.id} q={q} index={i + 1} state={state} setState={setState} />;
        }
      })}
    </div>
  );
}

// ─── Reusable atoms ──────────────────────────────────────────

function MCQBlock({ q, index, state, setState, tone }: {
  q: FLMCQ; index: number; state: RunnerState; setState: StepProps['setState']; tone?: 'prediction';
}) {
  const current = state.answers[q.id];
  const a = current?.kind === 'mcq' ? current : null;
  const picked = a?.picked ?? null;
  const locked = a?.locked ?? false;
  const prediction = tone === 'prediction';
  const correct = Array.isArray(q.correct) ? q.correct : [q.correct];

  const setAnswer = (upd: { picked?: string | null; locked?: boolean }) =>
    setState(s => ({
      ...s,
      answers: {
        ...s.answers,
        [q.id]: {
          kind: 'mcq',
          picked: upd.picked ?? a?.picked ?? null,
          locked: upd.locked ?? a?.locked ?? false,
        },
      },
    }));

  return (
    <div className="rounded-2xl border border-[#E8D8F5] bg-white p-4 space-y-3">
      <p className="font-serif text-[15px] font-semibold text-[#4A2060]">
        {index}. {q.prompt}
      </p>
      <div className="grid gap-2">
        {q.options.map(opt => {
          const isPicked = picked === opt.id;
          const isCorrect = correct.includes(opt.id);
          let cls = isPicked
            ? 'border-2 border-[#9B72B8] bg-[#E8D8F5]/40'
            : 'border-2 border-[#E8D8F5] bg-white hover:border-[#9B72B8] hover:bg-[#E8D8F5]/30';
          if (locked) {
            if (prediction) {
              cls = isPicked
                ? 'border-2 border-[#9B72B8] bg-[#E8D8F5]/40'
                : 'border-2 border-[#E8D8F5] bg-white opacity-70';
            } else if (isCorrect) {
              cls = 'border-2 border-[#7BC67E] bg-[#EAF7EB]';
            } else if (isPicked) {
              cls = 'border-2 border-[#E87BAD] bg-[#FBE7F1]';
            } else {
              cls = 'border-2 border-[#E8D8F5] bg-white opacity-50';
            }
          }
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => !locked && setAnswer({ picked: opt.id })}
              disabled={locked}
              className={`text-left px-3 py-2.5 rounded-xl text-sm text-[#2E2A33] transition-all ${cls}`}
            >
              <span className="font-black text-[#9B72B8] mr-2">{opt.id.toUpperCase()}.</span>
              {opt.text}
            </button>
          );
        })}
      </div>

      {!locked ? (
        <button
          type="button"
          onClick={() => setAnswer({ locked: true })}
          disabled={picked === null}
          className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-white bg-[#9B72B8] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {prediction ? 'Confirm' : 'Check'}
        </button>
      ) : (
        <div className="flex items-center gap-3 flex-wrap">
          {!prediction && q.explain && (
            <p className="flex-1 min-w-[200px] text-[12px] text-[#4A2060] bg-[#E8D8F5]/50 rounded-lg px-3 py-2">
              💡 {q.explain}
            </p>
          )}
          <button
            type="button"
            onClick={() => setAnswer({ picked: null, locked: false })}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7A7387] hover:text-[#4A2060]"
          >
            <RotateCcw className="w-3 h-3" strokeWidth={2.5} /> Redo
          </button>
        </div>
      )}
    </div>
  );
}

function TrueFalseBlock({ q, index, state, setState }: {
  q: FLTrueFalse; index: number; state: RunnerState; setState: StepProps['setState'];
}) {
  const current = state.answers[q.id];
  const a = current?.kind === 'true-false' ? current : null;
  const picked = a?.picked ?? null;
  const locked = a?.locked ?? false;
  const labels: Record<'T' | 'F' | 'NG', string> = { T: 'True', F: 'False', NG: 'Not given' };

  const setAnswer = (upd: { picked?: 'T' | 'F' | 'NG' | null; locked?: boolean }) =>
    setState(s => ({
      ...s,
      answers: {
        ...s.answers,
        [q.id]: {
          kind: 'true-false',
          picked: upd.picked ?? a?.picked ?? null,
          locked: upd.locked ?? a?.locked ?? false,
        },
      },
    }));

  return (
    <div className="rounded-2xl border border-[#E8D8F5] bg-white p-4 space-y-3">
      <p className="font-serif text-[15px] font-semibold text-[#4A2060]">
        {index}. {q.prompt}
      </p>
      <div className="flex gap-2 flex-wrap">
        {(['T', 'F', 'NG'] as const).map(k => {
          const isPicked = picked === k;
          const isCorrect = k === q.correct;
          let cls = isPicked
            ? 'border-2 border-[#9B72B8] bg-[#E8D8F5]/40'
            : 'border-2 border-[#E8D8F5] bg-white hover:border-[#9B72B8]';
          if (locked) {
            if (isCorrect)      cls = 'border-2 border-[#7BC67E] bg-[#EAF7EB]';
            else if (isPicked)  cls = 'border-2 border-[#E87BAD] bg-[#FBE7F1]';
            else                cls = 'border-2 border-[#E8D8F5] bg-white opacity-50';
          }
          return (
            <button
              key={k}
              type="button"
              onClick={() => !locked && setAnswer({ picked: k })}
              disabled={locked}
              className={`px-4 py-2 rounded-full text-sm font-bold text-[#4A2060] transition-all ${cls}`}
            >
              {labels[k]}
            </button>
          );
        })}
      </div>
      {!locked ? (
        <button
          type="button"
          onClick={() => setAnswer({ locked: true })}
          disabled={picked === null}
          className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-white bg-[#9B72B8] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Check
        </button>
      ) : (
        <div className="flex items-center gap-3 flex-wrap">
          {q.explain && (
            <p className="flex-1 min-w-[200px] text-[12px] text-[#4A2060] bg-[#E8D8F5]/50 rounded-lg px-3 py-2">💡 {q.explain}</p>
          )}
          <button
            type="button"
            onClick={() => setAnswer({ picked: null, locked: false })}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7A7387] hover:text-[#4A2060]"
          >
            <RotateCcw className="w-3 h-3" strokeWidth={2.5} /> Redo
          </button>
        </div>
      )}
    </div>
  );
}

function GapFillBlock({ q, index, state, setState }: {
  q: FLGapFill; index: number; state: RunnerState; setState: StepProps['setState'];
}) {
  const parts = q.sentence.split('___');
  const blankCount = Math.max(0, parts.length - 1);
  const current = state.answers[q.id];
  const a = current?.kind === 'gap-fill' ? current : null;
  const vals = a?.vals ?? Array(blankCount).fill('');
  const locked = a?.locked ?? false;

  const setAnswer = (upd: { vals?: string[]; locked?: boolean }) =>
    setState(s => ({
      ...s,
      answers: {
        ...s.answers,
        [q.id]: {
          kind: 'gap-fill',
          vals: upd.vals ?? a?.vals ?? Array(blankCount).fill(''),
          locked: upd.locked ?? a?.locked ?? false,
        },
      },
    }));

  const correctness: boolean[] = vals.map((v, i) => {
    const expected = (q.answers[i] ?? '').trim().toLowerCase();
    const got = v.trim().toLowerCase();
    if (!expected) return false;
    if (got === expected) return true;
    return (q.alts?.[i] ?? []).some(x => x.trim().toLowerCase() === got);
  });

  return (
    <div className="rounded-2xl border border-[#E8D8F5] bg-white p-4 space-y-3">
      {q.hint && <p className="text-[11px] text-[#7A7387] italic">{q.hint}</p>}
      <p className="font-serif text-[15px] text-[#4A2060] leading-relaxed">
        <span className="font-black mr-1">{index}.</span>
        {parts.map((p, i) => (
          <span key={i}>
            {p}
            {i < blankCount && (
              <input
                type="text"
                value={vals[i] ?? ''}
                onChange={(e) => setAnswer({ vals: vals.map((x, j) => j === i ? e.target.value : x) })}
                disabled={locked}
                className={`inline-block mx-1 min-w-[90px] px-2 py-0.5 text-center border-b-2 bg-transparent text-[#2E2A33] focus:outline-none ${
                  !locked
                    ? 'border-[#9B72B8]'
                    : correctness[i] ? 'border-[#7BC67E] text-[#2F6B33]' : 'border-[#E87BAD] text-[#7A3B5F]'
                }`}
              />
            )}
          </span>
        ))}
      </p>
      {!locked ? (
        <button
          type="button"
          onClick={() => setAnswer({ locked: true })}
          disabled={vals.some(v => !v.trim())}
          className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-white bg-[#9B72B8] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Check
        </button>
      ) : (
        <div className="flex items-center gap-3 flex-wrap">
          <p className={`flex-1 min-w-[200px] text-[12px] ${correctness.every(Boolean) ? 'text-[#2F6B33]' : 'text-[#7A3B5F]'} bg-[#EAF7EB]/50 rounded-lg px-3 py-2`}>
            {correctness.every(Boolean)
              ? '✓ Perfect.'
              : `Expected: ${q.answers.join(' · ')}`}
          </p>
          <button
            type="button"
            onClick={() => setAnswer({ vals: Array(blankCount).fill(''), locked: false })}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7A7387] hover:text-[#4A2060]"
          >
            <RotateCcw className="w-3 h-3" strokeWidth={2.5} /> Redo
          </button>
        </div>
      )}
    </div>
  );
}

function AudioPlayer({ audioUrl }: { audioUrl: string | null }) {
  if (audioUrl) {
    return (
      <div className="px-6 py-4 bg-gradient-to-r from-[#E8D8F5] to-[#FBE7F1] border-b border-[#E8D8F5]">
        <audio controls className="w-full" src={audioUrl} preload="metadata" />
      </div>
    );
  }
  return (
    <div className="px-6 py-4 bg-[#FCF7D8] border-b border-[#E8D8F5] flex items-center gap-3">
      <PlayCircle className="w-6 h-6 text-[#9B72B8] flex-shrink-0" strokeWidth={2} />
      <div>
        <p className="text-[12px] font-bold text-[#4A2060]">Audio not available yet</p>
        <p className="text-[11px] text-[#7A7387]">Your teacher hasn&apos;t generated it yet — use the transcript below in the meantime.</p>
      </div>
    </div>
  );
}

function Transcript({ lesson }: { lesson: FLLesson }) {
  const byId = new Map(lesson.audio.speakers.map(s => [s.id, s]));
  return (
    <div className="rounded-2xl border border-[#E8D8F5] bg-[#FFFDF5] p-4 space-y-2 max-h-80 overflow-y-auto">
      {lesson.audio.script.map((line, i) => (
        <div key={i} className="flex gap-3">
          <span className="flex-shrink-0 text-[10px] font-black uppercase tracking-widest text-[#9B72B8] w-16">
            {byId.get(line.speakerId)?.displayName ?? line.speakerId}
          </span>
          <p className="text-[13px] text-[#2E2A33] leading-relaxed">{line.text}</p>
        </div>
      ))}
    </div>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] text-[#2E2A33] leading-relaxed">{children}</p>;
}

function Tip({ children, tone }: { children: React.ReactNode; tone?: 'cyan' }) {
  const bg = tone === 'cyan' ? BRAND.cyanLt : BRAND.yellowLt;
  const ink = tone === 'cyan' ? '#1D5B67' : '#6B5B00';
  return (
    <p className="text-[12px] rounded-xl px-3 py-2 leading-snug" style={{ background: bg, color: ink }}>
      💡 {children}
    </p>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#E8D8F5] to-[#FFFDF5] text-[#2E2A33]">
      <FullscreenButton />
      {children}
    </div>
  );
}

// ─── Completion recap ───────────────────────────────────────

function CompletionRecap({
  lesson, state, onRestart, onReview,
}: {
  lesson:    FLLesson;
  state:     RunnerState;
  onRestart: () => void;
  onReview:  (stepIdx: number) => void;
}) {
  const scores = useMemo(() => scoreLesson(lesson, state), [lesson, state]);
  const awareness = lesson.steps.find(s => s.kind === 'language-awareness') as FLStepLanguageAwareness | undefined;
  const chunks = awareness?.chunks ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-20">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/student/listenings"
          className="w-9 h-9 rounded-full bg-white/80 hover:bg-white text-[#4A2060] flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" strokeWidth={2.5} />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#9B72B8]">
            {lesson.level} · Lesson complete
          </p>
          <h1 className="font-serif text-lg md:text-xl font-bold text-[#2E2A33] leading-tight truncate">
            {lesson.title}
          </h1>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_10px_30px_-16px_rgba(74,32,96,0.25)] overflow-hidden">
        <div className="px-6 py-5 bg-gradient-to-r from-[#E8D8F5] to-[#FBE7F1] flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-3xl">
            🎉
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-[#4A2060]">
              You made it!
            </p>
            <p className="font-serif text-2xl font-bold text-[#2E2A33] leading-tight">
              Nice work on those chunks
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <StatTile label="Correct"  value={`${scores.correct}/${scores.total}`} color={BRAND.green} />
            <StatTile label="Accuracy" value={scores.total === 0 ? '—' : `${Math.round((scores.correct / scores.total) * 100)}%`} color={BRAND.purple} />
            <StatTile label="Chunks"   value={`${chunks.length}`} color={BRAND.pink} />
          </div>

          {chunks.length > 0 && (
            <div className="pt-4 border-t border-[#E8D8F5] space-y-2">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#9B72B8] inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" strokeWidth={2.5} /> Today&apos;s chunks
              </p>
              <div className="flex flex-wrap gap-2">
                {chunks.map(c => (
                  <span key={c.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FBE7F1] border-2 border-[#E8D8F5] text-sm font-semibold text-[#4A2060]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#9B72B8]" strokeWidth={2.5} />
                    {c.chunk}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-[#E8D8F5]">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#9B72B8] mb-2">
              Jump back to any step
            </p>
            <div className="flex flex-wrap gap-2">
              {lesson.steps.map((s, i) => {
                const m = STEP_META[s.kind];
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onReview(i)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold text-[#4A2060] bg-white border-2 border-[#E8D8F5] hover:border-[#9B72B8] transition-colors"
                  >
                    <span>{m.icon}</span>{i + 1}. {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mt-5 flex-wrap">
        <button
          onClick={onRestart}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold text-[#4A2060] bg-white/80 hover:bg-white transition-colors"
        >
          <RotateCcw className="w-4 h-4" strokeWidth={2.5} /> Do it again
        </button>
        <Link
          href="/dashboard/student/listenings"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-black uppercase tracking-wider text-white shadow-lg active:scale-95 transition-all bg-[#9B72B8]"
        >
          More lessons <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
}

function StatTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="rounded-2xl border p-3 text-center bg-white"
      style={{ borderColor: color + '55' }}
    >
      <p className="font-serif text-2xl font-black" style={{ color }}>{value}</p>
      <p className="text-[10px] font-black uppercase tracking-widest text-[#7A7387] mt-1">{label}</p>
    </div>
  );
}

// ─── Scoring helpers ────────────────────────────────────────

function scoreLesson(lesson: FLLesson, state: RunnerState) {
  let correct = 0;
  let total = 0;

  const scoreQ = (q: FLQuestion) => {
    const a = state.answers[q.id];
    if (!a || !a.locked) return;
    total++;
    switch (q.kind) {
      case 'mcq': {
        if (a.kind !== 'mcq' || a.picked === null) return;
        const corr = Array.isArray(q.correct) ? q.correct : [q.correct];
        if (corr.includes(a.picked)) correct++;
        return;
      }
      case 'true-false': {
        if (a.kind !== 'true-false') return;
        if (a.picked === q.correct) correct++;
        return;
      }
      case 'gap-fill': {
        if (a.kind !== 'gap-fill') return;
        const allOk = q.answers.every((exp, i) => {
          const got = (a.vals[i] ?? '').trim().toLowerCase();
          const want = exp.trim().toLowerCase();
          if (got === want) return true;
          return (q.alts?.[i] ?? []).some(x => x.trim().toLowerCase() === got);
        });
        if (allOk) correct++;
        return;
      }
    }
  };

  for (const step of lesson.steps) {
    switch (step.kind) {
      case 'vocab':               step.quiz.forEach(scoreQ); break;
      case 'gist':                step.questions.forEach(scoreQ); break;
      case 'detail':              step.questions.forEach(scoreQ); break;
      case 'controlled-practice': step.activities.forEach(scoreQ); break;
      default: break;
    }
  }

  return { correct, total };
}
