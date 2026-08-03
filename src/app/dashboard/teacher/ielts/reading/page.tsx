// FriendlyTeaching.cl — IELTS Reading Mocks (teacher-facing landing)
//
// MVP: landing that lists available mocks + inline preview. The full
// student-facing runner (timer, per-Q navigation, submit → diagnostic) is
// scoped for the next iteration. For now the teacher can inspect the mock
// content, sanity-check passages/questions, and see the raw→band mapping
// the grader will use.

'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import { readingGtMock1 } from '@/lib/data/ielts/reading/gtMock1';
import type {
  ReadingMock, ReadingSection, ReadingQuestion, ReadingQuestionType,
} from '@/types/ielts-reading';

const MOCKS: ReadingMock[] = [readingGtMock1];

// ─── Formatting helpers ─────────────────────────────────────────────

const TYPE_LABEL: Record<ReadingQuestionType, string> = {
  'multiple-choice':           'Multiple choice',
  'multiple-choice-multi':     'Multiple choice (pick N)',
  'true-false-not-given':      'True / False / Not Given',
  'yes-no-not-given':          'Yes / No / Not Given',
  'matching-information':      'Matching information',
  'matching-headings':         'Matching headings',
  'matching-features':         'Matching features',
  'matching-sentence-endings': 'Matching sentence endings',
  'sentence-completion':       'Sentence completion',
  'summary-completion':        'Summary completion',
  'note-completion':           'Note completion',
  'table-completion':          'Table completion',
  'flow-chart-completion':     'Flow-chart completion',
  'diagram-label':             'Diagram label',
  'short-answer':              'Short answer',
};

function questionRange(section: ReadingSection, mock: ReadingMock): [number, number] {
  let start = 1;
  for (const s of mock.sections) {
    if (s.number === section.number) return [start, start + s.questions.length - 1];
    start += s.questions.length;
  }
  return [start, start];
}

// ─── Answer text for the preview (readable, no logic) ────────────────

function readableAnswer(q: ReadingQuestion): string {
  switch (q.type) {
    case 'multiple-choice': {
      const opt = q.options.find((o) => o.id === q.correct);
      return opt ? `${opt.id.toUpperCase()}. ${opt.text}` : q.correct;
    }
    case 'multiple-choice-multi':
      return q.correct
        .map((id) => {
          const opt = q.options.find((o) => o.id === id);
          return opt ? opt.id.toUpperCase() : id;
        })
        .join(' + ');
    case 'true-false-not-given':
    case 'yes-no-not-given':
      return q.correct.toUpperCase().replace('-', ' ');
    case 'matching-information':
    case 'matching-headings':
    case 'matching-features':
    case 'matching-sentence-endings': {
      const opt = q.options.find((o) => o.id === q.correct);
      return opt ? `${opt.id.toUpperCase()}. ${opt.text}` : q.correct;
    }
    default:
      return q.accepted[0];
  }
}

// ─── Preview components ─────────────────────────────────────────────

function QuestionPreview({
  q, number, showAnswers,
}: {
  q: ReadingQuestion;
  number: number;
  showAnswers: boolean;
}) {
  const isFill = 'wordLimit' in q;
  return (
    <div className="rounded-lg border border-[#E8D5F0] bg-white p-3">
      <div className="flex items-start gap-3">
        <span className="shrink-0 w-8 h-8 rounded-full bg-[#F0E5FF] text-[#5A3D7A] font-bold text-sm flex items-center justify-center tabular-nums">
          {number}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#5A3D7A] bg-[#F0E5FF]/80 px-2 py-0.5 rounded-full">
              {TYPE_LABEL[q.type]}
            </span>
            {isFill && (
              <span className="text-[10px] text-gray-500 tabular-nums">
                ≤ {(q as ReadingQuestion & { wordLimit: number }).wordLimit} word
                {(q as ReadingQuestion & { wordLimit: number }).wordLimit === 1 ? '' : 's'}
                {(q as ReadingQuestion & { allowNumbers: boolean }).allowNumbers ? ' / number' : ''}
              </span>
            )}
            <span className="text-[10px] text-gray-400">
              {q.difficulty} · {q.cognitiveLoad}
            </span>
          </div>
          <p className="text-sm text-[#2D1B4E] leading-snug">{q.prompt}</p>

          {'options' in q && q.options && (
            <ul className="mt-2 space-y-1">
              {q.options.map((o) => (
                <li key={o.id} className="text-xs text-gray-600">
                  <span className="font-bold text-[#5A3D7A]">{o.id.toUpperCase()}.</span>{' '}
                  {o.text}
                </li>
              ))}
            </ul>
          )}

          {showAnswers && (
            <div className="mt-2 flex items-start gap-2 text-xs">
              <span className="text-emerald-600 font-black uppercase tracking-widest text-[10px] shrink-0 mt-0.5">
                Answer
              </span>
              <span className="text-emerald-800 font-medium">{readableAnswer(q)}</span>
            </div>
          )}
          {showAnswers && q.answerLocator && (
            <p className="mt-1 text-[11px] text-gray-500 italic leading-snug">
              📍 {q.answerLocator}
            </p>
          )}
          {showAnswers && q.teacherNote && (
            <p className="mt-1 text-[11px] text-[#5A3D7A] leading-snug">
              💡 {q.teacherNote}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionPreview({
  section, mock, showAnswers,
}: {
  section: ReadingSection;
  mock: ReadingMock;
  showAnswers: boolean;
}) {
  const [from, to] = questionRange(section, mock);
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white px-4 py-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/70">
          Section {section.number} · {section.contextType.replace(/-/g, ' ')}
        </p>
        <p className="text-lg font-bold">{section.title}</p>
        <p className="text-xs text-white/80 mt-0.5">{section.scenario}</p>
        <p className="text-[11px] text-white/60 mt-2">
          Questions {from}–{to} · ~{section.targetDurationMin} min
        </p>
      </div>

      {section.passages.map((p) => (
        <article key={p.id} className="rounded-2xl bg-white border border-[#E8D5F0] p-5">
          <header className="mb-3 pb-3 border-b border-[#F0E5FF]">
            <h3 className="font-serif text-lg font-bold text-[#2D1B4E]">{p.title}</h3>
            {p.subtitle && (
              <p className="text-xs text-gray-500 mt-0.5 italic">{p.subtitle}</p>
            )}
          </header>
          <div className="space-y-3">
            {p.paragraphs.map((par) => (
              <div key={par.label} className="flex gap-3">
                <span className="shrink-0 w-6 text-[#5A3D7A] font-bold text-sm">{par.label}</span>
                <p className="text-sm text-[#2D1B4E] leading-relaxed">{par.text}</p>
              </div>
            ))}
          </div>
        </article>
      ))}

      <div className="space-y-2">
        <p className="text-xs font-black uppercase tracking-widest text-[#5A3D7A]">
          Questions {from}–{to}
        </p>
        {section.questions.map((q, i) => (
          <QuestionPreview key={q.id} q={q} number={from + i} showAnswers={showAnswers} />
        ))}
      </div>
    </div>
  );
}

function MockCard({ mock }: { mock: ReadingMock }) {
  const [expanded, setExpanded] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

  const stats = useMemo(() => {
    const perType = new Map<ReadingQuestionType, number>();
    for (const s of mock.sections) {
      for (const q of s.questions) {
        perType.set(q.type, (perType.get(q.type) ?? 0) + 1);
      }
    }
    return [...perType.entries()].sort((a, b) => b[1] - a[1]);
  }, [mock]);

  return (
    <div className="rounded-2xl bg-white border border-[#E8D5F0] overflow-hidden shadow-sm">
      <div className="p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#5A3D7A] mb-1">
              {mock.level} · Band {mock.targetBandRange[0]}–{mock.targetBandRange[1]}
            </p>
            <h2 className="text-xl font-bold text-[#2D1B4E]">{mock.title}</h2>
            <p className="text-xs text-gray-500 mt-1">
              {mock.totalQuestions} questions · {mock.totalDurationMin} min · {mock.sections.length} sections
            </p>
          </div>
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
            Beta
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-4">
          {stats.map(([t, n]) => (
            <span
              key={t}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F0E5FF] border border-[#C8A8DC]/60 text-[#5A3D7A]"
            >
              {TYPE_LABEL[t]} · {n}
            </span>
          ))}
        </div>

        <div className="flex gap-2 mt-5 flex-wrap">
          <Link
            href={`/dashboard/teacher/ielts/reading/${mock.id}`}
            className="text-sm font-bold px-4 py-2 rounded-lg bg-[#5A3D7A] text-white hover:bg-[#4A2D6A] transition-colors"
          >
            Empezar mock →
          </Link>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-sm font-bold px-4 py-2 rounded-lg bg-white text-[#5A3D7A] border border-[#C8A8DC] hover:bg-[#F0E5FF] transition-colors"
          >
            {expanded ? 'Ocultar preview' : 'Preview (para preparar clase)'}
          </button>
          {expanded && (
            <button
              onClick={() => setShowAnswers((v) => !v)}
              className={`text-sm font-bold px-4 py-2 rounded-lg border transition-colors ${
                showAnswers
                  ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600'
                  : 'bg-white text-[#5A3D7A] border-[#C8A8DC] hover:bg-[#F0E5FF]'
              }`}
            >
              {showAnswers ? 'Ocultar respuestas' : 'Mostrar respuestas'}
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[#F0E5FF] bg-[#FBF7FF] p-6 space-y-8">
          {mock.sections.map((s) => (
            <SectionPreview key={s.number} section={s} mock={mock} showAnswers={showAnswers} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────

export default function IELTSReadingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F5FF] via-[#F3EEFF] to-[#EEF2FF]">
      <TopBar
        title="IELTS Reading Mocks"
        subtitle="General Training · 3 secciones × 40 preguntas"
        breadcrumbs={[
          { label: 'Herramientas', href: '/dashboard/teacher/tools' },
          { label: 'IELTS Reading' },
        ]}
      />

      <div className="relative overflow-hidden bg-gradient-to-r from-[#5A3D7A] via-[#7B5EA7] to-[#9B7CB8] px-8 py-10">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-white/5 blur-xl" />
        <div className="relative max-w-4xl mx-auto">
          <p className="text-[#C8A8DC] text-xs font-bold uppercase tracking-widest mb-1">
            FriendlyTeaching.cl · IELTS
          </p>
          <h1 className="text-3xl font-extrabold text-white mb-1">Reading Mocks</h1>
          <p className="text-white/70 text-sm max-w-2xl">
            Mocks completos de General Training con 3 secciones × 40 preguntas.
            Diagnóstico por band, tipo de pregunta y carga cognitiva.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="rounded-xl bg-[#F0E5FF] border border-[#C8A8DC]/60 px-4 py-3 text-sm text-[#2D1B4E]">
          <strong className="font-bold text-[#5A3D7A]">Beta:</strong>{' '}
          runner CBT completo con timer y diagnóstico. Save/resume y más mocks
          vienen pronto — por ahora podés hacer &quot;Preview&quot; para revisar
          respuestas antes de clase.
        </div>

        {MOCKS.map((m) => (
          <MockCard key={m.id} mock={m} />
        ))}

        <div className="text-center text-xs text-gray-400 pt-6">
          <Link href="/dashboard/teacher/tools" className="hover:text-[#5A3D7A] transition-colors">
            ← Volver a herramientas
          </Link>
        </div>
      </div>
    </div>
  );
}
