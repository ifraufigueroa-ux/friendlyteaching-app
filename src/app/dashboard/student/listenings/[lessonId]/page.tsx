// Friendlistenings® — student lesson runner.
//
// One page, 8 steps. Dispatches on the step's `kind` to render the matching
// activity. Shared chrome: progress bar + lesson header on top, step body
// in a centered card, "Siguiente" action pinned to the bottom. The audio
// (shared across gist + detail) is rendered as a small persistent player
// when the current step needs it.

'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, X, BookOpen, PlayCircle } from 'lucide-react';
import { getFriendlisteningsLesson } from '@/lib/data/friendlistenings';
import type {
  FLLesson, FLStep, FLStepLeadIn, FLStepVocab, FLStepPrediction,
  FLStepGist, FLStepDetail, FLStepLanguageAwareness,
  FLStepControlledPractice, FLStepProduction,
  FLMCQ, FLGapFill, FLTrueFalse, FLVocabItem, FLChunk,
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
  'lead-in':             { label: 'Lead-in',       color: BRAND.pink,   icon: '💬' },
  'vocab':               { label: 'Vocabulario',   color: BRAND.yellow, icon: '📚' },
  'prediction':          { label: 'Predicción',    color: BRAND.cyan,   icon: '🔮' },
  'gist':                { label: 'Gist',          color: BRAND.green,  icon: '🎧' },
  'detail':              { label: 'Detalle',       color: BRAND.orange, icon: '🔍' },
  'language-awareness':  { label: 'Lenguaje',      color: BRAND.purple, icon: '✨' },
  'controlled-practice': { label: 'Práctica',      color: BRAND.purple, icon: '🧩' },
  'production':          { label: 'Producción',    color: BRAND.pink,   icon: '🎤' },
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
          <h1 className="font-serif text-2xl font-bold text-[#2E2A33] mb-2">Lesson no encontrada</h1>
          <p className="text-sm text-[#7A7387] mb-4">Puede que la hayan renombrado o despublicado.</p>
          <Link
            href="/dashboard/student/listenings"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#9B72B8] hover:text-[#4A2060]"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2.5} /> Volver a Friendlistenings
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
  const step = lesson.steps[idx];
  const meta = STEP_META[step.kind];
  const needsAudio = step.kind === 'gist' || step.kind === 'detail';

  return (
    <Shell>
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/dashboard/student/listenings"
            className="w-9 h-9 rounded-full bg-white/80 hover:bg-white text-[#4A2060] flex items-center justify-center transition-colors"
            aria-label="Salir"
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
        <div className="flex gap-1.5 mb-6">
          {lesson.steps.map((s, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                i < idx ? 'bg-[#9B72B8]'
                : i === idx ? 'bg-[#9B72B8]/60'
                : 'bg-white'
              }`}
              title={`${i + 1}. ${STEP_META[s.kind].label}`}
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
          {needsAudio && <AudioPlayer lesson={lesson} />}

          {/* Step body */}
          <div className="p-6 md:p-7">
            <StepBody lesson={lesson} step={step} />
          </div>
        </div>

        {/* Nav */}
        <div className="flex items-center justify-between mt-5">
          <button
            onClick={() => setIdx(i => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold text-[#4A2060] bg-white/80 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2.5} /> Atrás
          </button>

          {idx < lesson.steps.length - 1 ? (
            <button
              onClick={() => setIdx(i => Math.min(lesson.steps.length - 1, i + 1))}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-black uppercase tracking-wider text-white shadow-lg active:scale-95 transition-all"
              style={{ background: BRAND.purple }}
            >
              Siguiente <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
          ) : (
            <Link
              href="/dashboard/student/listenings"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-black uppercase tracking-wider text-white shadow-lg active:scale-95 transition-all"
              style={{ background: BRAND.green }}
            >
              Terminar <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </Link>
          )}
        </div>
      </div>
    </Shell>
  );
}

// ─── Step body dispatcher ────────────────────────────────────

function StepBody({ lesson, step }: { lesson: FLLesson; step: FLStep }) {
  switch (step.kind) {
    case 'lead-in':             return <LeadInBody step={step} />;
    case 'vocab':               return <VocabBody step={step} />;
    case 'prediction':          return <PredictionBody step={step} />;
    case 'gist':                return <GistBody step={step} />;
    case 'detail':              return <DetailBody step={step} lesson={lesson} />;
    case 'language-awareness':  return <LanguageAwarenessBody step={step} />;
    case 'controlled-practice': return <ControlledPracticeBody step={step} />;
    case 'production':          return <ProductionBody step={step} lesson={lesson} />;
  }
}

// ─── Step bodies ─────────────────────────────────────────────

function LeadInBody({ step }: { step: FLStepLeadIn }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
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
              value={answers[q.id] ?? ''}
              onChange={(e) => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
              rows={3}
              placeholder="Escribí o solo pensá…"
              className="w-full px-3 py-2 border-2 border-[#E8D8F5] rounded-xl text-sm text-[#2E2A33] bg-white focus:outline-none focus:border-[#9B72B8] transition-colors resize-none"
            />
          </div>
        ))}
      </div>
      <Tip>
        No hay respuestas correctas acá — este paso prepara tu cabeza para lo que viene.
      </Tip>
    </div>
  );
}

function VocabBody({ step }: { step: FLStepVocab }) {
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  return (
    <div className="space-y-6">
      <Prose>{step.intro}</Prose>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {step.items.map(item => (
          <VocabCard
            key={item.id}
            item={item}
            flipped={!!flipped[item.id]}
            onFlip={() => setFlipped(f => ({ ...f, [item.id]: !f[item.id] }))}
          />
        ))}
      </div>
      {step.quiz.length > 0 && (
        <div className="pt-4 border-t border-[#E8D8F5] space-y-4">
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#9B72B8]">
            Chequeo rápido
          </p>
          {step.quiz.map((q, i) => (
            <MCQBlock key={q.id} q={q} index={i + 1} />
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
        <span className="text-[10px] text-[#7A7387]">{flipped ? 'ejemplo ↓' : 'traducción ↓'}</span>
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

function PredictionBody({ step }: { step: FLStepPrediction }) {
  return (
    <div className="space-y-5">
      <Prose>{step.intro}</Prose>
      <div className="space-y-4">
        {step.questions.map((q, i) => (
          <MCQBlock key={q.id} q={q} index={i + 1} tone="prediction" />
        ))}
      </div>
      <Tip tone="cyan">
        Las predicciones no se "corrigen" — vamos a volver a ellas después de escuchar.
      </Tip>
    </div>
  );
}

function GistBody({ step }: { step: FLStepGist }) {
  return (
    <div className="space-y-5">
      <Prose>{step.intro}</Prose>
      {step.listenFor && step.listenFor.length > 0 && (
        <div className="rounded-2xl border border-[#EAF7EB] bg-[#EAF7EB]/60 p-4 space-y-1.5">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#4A2060]">
            Escuchá para captar
          </p>
          <ul className="list-disc pl-5 text-sm text-[#2E2A33] space-y-1">
            {step.listenFor.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        </div>
      )}
      <div className="space-y-4">
        {step.questions.map((q, i) =>
          'correct' in q && typeof q.correct === 'string' && q.correct.length === 1 && (q.correct === 'T' || q.correct === 'F' || q.correct === 'NG')
            ? <TrueFalseBlock key={q.id} q={q as FLTrueFalse} index={i + 1} />
            : <MCQBlock key={q.id} q={q as FLMCQ} index={i + 1} />
        )}
      </div>
    </div>
  );
}

function DetailBody({ step, lesson }: { step: FLStepDetail; lesson: FLLesson }) {
  const [showTranscript, setShowTranscript] = useState(false);
  return (
    <div className="space-y-5">
      <Prose>{step.intro}</Prose>

      {step.allowTranscript && (
        <button
          type="button"
          onClick={() => setShowTranscript(s => !s)}
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#9B72B8] hover:text-[#4A2060] transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5" strokeWidth={2.5} />
          {showTranscript ? 'Ocultar transcript' : 'Mostrar transcript'}
        </button>
      )}

      {showTranscript && <Transcript lesson={lesson} />}

      <div className="space-y-4">
        {step.questions.map((q, i) => {
          if ('sentence' in q) return <GapFillBlock key={q.id} q={q as FLGapFill} index={i + 1} />;
          if ('options' in q) return <MCQBlock key={q.id} q={q as FLMCQ} index={i + 1} />;
          return <TrueFalseBlock key={q.id} q={q as FLTrueFalse} index={i + 1} />;
        })}
      </div>
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
        <span className="font-semibold text-[#9B72B8]">💡 Fijate:</span> {chunk.notice}
      </p>
    </div>
  );
}

function ControlledPracticeBody({ step }: { step: FLStepControlledPractice }) {
  return (
    <div className="space-y-5">
      <Prose>{step.intro}</Prose>
      <div className="space-y-4">
        {step.activities.map((a, i) =>
          'sentence' in a
            ? <GapFillBlock key={a.id} q={a as FLGapFill} index={i + 1} />
            : <MCQBlock key={a.id} q={a as FLMCQ} index={i + 1} />
        )}
      </div>
    </div>
  );
}

function ProductionBody({ step, lesson }: { step: FLStepProduction; lesson: FLLesson }) {
  const [text, setText] = useState('');
  const chunks = step.targetChunks
    ?.map(id => lesson.steps.flatMap(s => s.kind === 'language-awareness' ? s.chunks : []).find(c => c.id === id))
    .filter((c): c is NonNullable<typeof c> => !!c);
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-5">
      <Prose>{step.intro}</Prose>

      <div className="rounded-3xl border-2 border-[#E87BAD] bg-[#FBE7F1] p-5">
        <p className="text-[11px] font-black uppercase tracking-widest text-[#7A3B5F] mb-1">
          {step.mode === 'speaking' ? '🎤 Tu tarea' : '✍️ Tu tarea'}
        </p>
        <p className="font-serif text-lg text-[#4A2060] leading-snug">
          {step.prompt}
        </p>
      </div>

      {chunks && chunks.length > 0 && (
        <div className="rounded-2xl border border-[#E8D8F5] bg-[#FFFDF5] p-4">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#9B72B8] mb-2">
            Intentá usar estos chunks
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
            placeholder="Escribí acá…"
            className="w-full px-4 py-3 border-2 border-[#E8D8F5] rounded-2xl text-[15px] text-[#2E2A33] bg-white focus:outline-none focus:border-[#9B72B8] transition-colors resize-none"
          />
          <p className="text-[11px] text-[#7A7387] text-right">
            {wordCount} {step.minWords ? `/ ${step.minWords}` : ''} palabras
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-[#9B72B8] bg-white p-6 text-center space-y-2">
          <p className="text-4xl">🎙️</p>
          <p className="text-sm text-[#4A2060] font-semibold">
            Grabación de audio — próximamente
          </p>
          <p className="text-[12px] text-[#7A7387]">
            Objetivo: {step.minSeconds ?? 60} segundos. Por ahora, grabá con tu grabadora preferida y mandalo a tu profe.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Reusable atoms ──────────────────────────────────────────

function MCQBlock({ q, index, tone }: { q: FLMCQ; index: number; tone?: 'prediction' }) {
  const [picked, setPicked] = useState<string | null>(null);
  const locked = picked !== null;
  const correct = Array.isArray(q.correct) ? q.correct : [q.correct];

  return (
    <div className="rounded-2xl border border-[#E8D8F5] bg-white p-4 space-y-3">
      <p className="font-serif text-[15px] font-semibold text-[#4A2060]">
        {index}. {q.prompt}
      </p>
      <div className="grid gap-2">
        {q.options.map(opt => {
          const isPicked = picked === opt.id;
          const isCorrect = correct.includes(opt.id);
          let cls = 'border-2 border-[#E8D8F5] bg-white hover:border-[#9B72B8] hover:bg-[#E8D8F5]/30';
          if (locked) {
            if (isCorrect) cls = 'border-2 border-[#7BC67E] bg-[#EAF7EB]';
            else if (isPicked) cls = 'border-2 border-[#E87BAD] bg-[#FBE7F1]';
            else cls = 'border-2 border-[#E8D8F5] bg-white opacity-50';
          }
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => !locked && setPicked(opt.id)}
              disabled={locked}
              className={`text-left px-3 py-2.5 rounded-xl text-sm text-[#2E2A33] transition-all ${cls}`}
            >
              <span className="font-black text-[#9B72B8] mr-2">{opt.id.toUpperCase()}.</span>
              {opt.text}
            </button>
          );
        })}
      </div>
      {locked && tone !== 'prediction' && q.explain && (
        <p className="text-[12px] text-[#4A2060] bg-[#E8D8F5]/50 rounded-lg px-3 py-2">
          💡 {q.explain}
        </p>
      )}
    </div>
  );
}

function TrueFalseBlock({ q, index }: { q: FLTrueFalse; index: number }) {
  const [picked, setPicked] = useState<string | null>(null);
  const locked = picked !== null;
  const labels: Record<'T' | 'F' | 'NG', string> = { T: 'Verdadero', F: 'Falso', NG: 'No se dice' };

  return (
    <div className="rounded-2xl border border-[#E8D8F5] bg-white p-4 space-y-3">
      <p className="font-serif text-[15px] font-semibold text-[#4A2060]">
        {index}. {q.prompt}
      </p>
      <div className="flex gap-2 flex-wrap">
        {(['T', 'F', 'NG'] as const).map(k => {
          const isPicked = picked === k;
          const isCorrect = k === q.correct;
          let cls = 'border-2 border-[#E8D8F5] bg-white hover:border-[#9B72B8]';
          if (locked) {
            if (isCorrect) cls = 'border-2 border-[#7BC67E] bg-[#EAF7EB]';
            else if (isPicked) cls = 'border-2 border-[#E87BAD] bg-[#FBE7F1]';
            else cls = 'border-2 border-[#E8D8F5] bg-white opacity-50';
          }
          return (
            <button
              key={k}
              type="button"
              onClick={() => !locked && setPicked(k)}
              disabled={locked}
              className={`px-4 py-2 rounded-full text-sm font-bold text-[#4A2060] transition-all ${cls}`}
            >
              {labels[k]}
            </button>
          );
        })}
      </div>
      {locked && q.explain && (
        <p className="text-[12px] text-[#4A2060] bg-[#E8D8F5]/50 rounded-lg px-3 py-2">💡 {q.explain}</p>
      )}
    </div>
  );
}

function GapFillBlock({ q, index }: { q: FLGapFill; index: number }) {
  const parts = q.sentence.split('___');
  const blankCount = Math.max(0, parts.length - 1);
  const [vals, setVals] = useState<string[]>(() => Array(blankCount).fill(''));
  const [locked, setLocked] = useState(false);

  const correctness: boolean[] = vals.map((v, i) => {
    const expected = (q.answers[i] ?? '').trim().toLowerCase();
    const got = v.trim().toLowerCase();
    if (!expected) return false;
    if (got === expected) return true;
    return (q.alts?.[i] ?? []).some(a => a.trim().toLowerCase() === got);
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
                value={vals[i]}
                onChange={(e) => setVals(v => v.map((x, j) => j === i ? e.target.value : x))}
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
          onClick={() => setLocked(true)}
          disabled={vals.some(v => !v.trim())}
          className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider text-white bg-[#9B72B8] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Revisar
        </button>
      ) : (
        <p className={`text-[12px] ${correctness.every(Boolean) ? 'text-[#2F6B33]' : 'text-[#7A3B5F]'} bg-[#EAF7EB]/50 rounded-lg px-3 py-2`}>
          {correctness.every(Boolean)
            ? '✓ Perfecto.'
            : `Respuesta esperada: ${q.answers.join(' · ')}`}
        </p>
      )}
    </div>
  );
}

function AudioPlayer({ lesson }: { lesson: FLLesson }) {
  if (lesson.audio.audioUrl) {
    return (
      <div className="px-6 py-4 bg-gradient-to-r from-[#E8D8F5] to-[#FBE7F1] border-b border-[#E8D8F5]">
        <audio controls className="w-full" src={lesson.audio.audioUrl} />
      </div>
    );
  }
  return (
    <div className="px-6 py-4 bg-[#FCF7D8] border-b border-[#E8D8F5] flex items-center gap-3">
      <PlayCircle className="w-6 h-6 text-[#9B72B8] flex-shrink-0" strokeWidth={2} />
      <div>
        <p className="text-[12px] font-bold text-[#4A2060]">Audio pendiente de generación</p>
        <p className="text-[11px] text-[#7A7387]">Mientras tanto, usá el transcript que aparece más abajo.</p>
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
      {children}
    </div>
  );
}
