// FriendlyTeaching.cl — IELTS Reading Mock Runner
//
// Phases: setup → running → results
// Split-pane CBT-style UI: passages on the left (scrollable), the active
// section's questions on the right (also scrollable). Timer + per-question
// navigator mimic the real IELTS CBT so students train the UI as well as
// the content.
//
// Modes:
//   · exam     → 60 min hard, no per-Q reveal, no going back after submit
//   · practice → same 60 min but visible, per-Q reveal enabled
//   · review   → post-submit only; shows correct answer + teacher note
//                + answer locator for each question

'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import FullscreenButton from '@/components/ui/FullscreenButton';
import { READING_MOCKS, IELTS_MOCKS } from '@/lib/data/ielts/mocks';
import { gradeReadingAnswers } from '@/lib/ielts/scoreReading';
import type {
  ReadingMock, ReadingSection, ReadingQuestion, ReadingQuestionType,
  ReadingSessionMode, ReadingGradeResult, StudentReadingAnswers,
} from '@/types/ielts-reading';

const MOCKS: ReadingMock[] = READING_MOCKS;

type Phase = 'setup' | 'running' | 'results';

// ─── Helpers ────────────────────────────────────────────────────────

// Acepta tanto el reading-mock id ('reading-gt-mock-2') como el
// aggregator id ('ielts-mock-2'), lo que sea que pasen desde el URL.
function findMock(id: string): ReadingMock | undefined {
  const direct = MOCKS.find((m) => m.id === id);
  if (direct) return direct;
  return IELTS_MOCKS.find(m => m.id === id)?.reading;
}

function questionOffsetForSection(mock: ReadingMock, sectionIdx: number): number {
  let off = 0;
  for (let i = 0; i < sectionIdx; i++) off += mock.sections[i].questions.length;
  return off;
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function isAnswered(a: string | string[] | undefined): boolean {
  if (a == null) return false;
  if (Array.isArray(a)) return a.length > 0;
  return a.trim().length > 0;
}

const TYPE_LABEL: Record<ReadingQuestionType, string> = {
  'multiple-choice':           'Multiple choice',
  'multiple-choice-multi':     'Multiple choice',
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

function wordLimitLabel(q: ReadingQuestion): string | null {
  if (!('wordLimit' in q)) return null;
  const wl = q.wordLimit;
  const words = wl === 1 ? 'ONE WORD' : wl === 2 ? 'TWO WORDS' : wl === 3 ? 'THREE WORDS' : `${wl} WORDS`;
  const num = q.allowNumbers ? ' AND/OR A NUMBER' : '';
  return `NO MORE THAN ${words}${num}`;
}

function candidateIdFrom(name: string): string {
  const seed = name.trim().toLowerCase();
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return String(h % 100000).padStart(5, '0');
}

// ─── Question renderers ─────────────────────────────────────────────

interface QuestionInputProps {
  q:         ReadingQuestion;
  number:    number;
  answer:    string | string[] | undefined;
  onAnswer:  (val: string | string[]) => void;
  disabled?: boolean;
  reviewMark?: { correct: boolean; accepted: string };
  onFocus?:  () => void;
}

function QuestionShell({
  q, number, children, reviewMark,
}: {
  q:          ReadingQuestion;
  number:     number;
  children:   React.ReactNode;
  reviewMark?: QuestionInputProps['reviewMark'];
}) {
  const border =
    reviewMark == null
      ? 'border-[#E8D5F0]'
      : reviewMark.correct
        ? 'border-emerald-300 bg-emerald-50/40'
        : 'border-red-300 bg-red-50/40';
  return (
    <div id={`q-${q.id}`} className={`rounded-lg border-2 ${border} bg-white p-3 scroll-mt-20`}>
      <div className="flex items-start gap-3">
        <span className={`shrink-0 w-8 h-8 rounded-full font-bold text-sm flex items-center justify-center tabular-nums ${
          reviewMark == null
            ? 'bg-[#F0E5FF] text-[#5A3D7A]'
            : reviewMark.correct
              ? 'bg-emerald-500 text-white'
              : 'bg-red-500 text-white'
        }`}>
          {number}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[#2D1B4E] leading-snug mb-2">{q.prompt}</p>
          {children}
          {reviewMark && !reviewMark.correct && (
            <div className="mt-2 flex items-start gap-2 text-xs">
              <span className="text-emerald-700 font-black uppercase tracking-widest text-[10px] shrink-0 mt-0.5">
                Correct
              </span>
              <span className="text-emerald-800 font-medium">{reviewMark.accepted}</span>
            </div>
          )}
          {reviewMark && q.answerLocator && (
            <p className="mt-1 text-[11px] text-gray-500 italic leading-snug">
              📍 {q.answerLocator}
            </p>
          )}
          {reviewMark && q.teacherNote && (
            <p className="mt-1 text-[11px] text-[#5A3D7A] leading-snug">
              💡 {q.teacherNote}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TFNGInput({ q, answer, onAnswer, disabled }: QuestionInputProps) {
  if (q.type !== 'true-false-not-given' && q.type !== 'yes-no-not-given') return null;
  const opts = q.type === 'true-false-not-given'
    ? [
        { id: 'true', label: 'TRUE' },
        { id: 'false', label: 'FALSE' },
        { id: 'not-given', label: 'NOT GIVEN' },
      ]
    : [
        { id: 'yes', label: 'YES' },
        { id: 'no', label: 'NO' },
        { id: 'not-given', label: 'NOT GIVEN' },
      ];
  const current = typeof answer === 'string' ? answer : '';
  return (
    <div className="flex flex-wrap gap-1.5">
      {opts.map((o) => {
        const active = current === o.id;
        return (
          <button
            key={o.id}
            type="button"
            disabled={disabled}
            onClick={() => onAnswer(o.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-bold tracking-wide border transition-colors ${
              active
                ? 'bg-[#5A3D7A] text-white border-[#5A3D7A]'
                : 'bg-white text-[#5A3D7A] border-[#C8A8DC] hover:bg-[#F0E5FF]'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function MCQInput({ q, answer, onAnswer, disabled }: QuestionInputProps) {
  if (q.type !== 'multiple-choice') return null;
  const current = typeof answer === 'string' ? answer : '';
  return (
    <ul className="space-y-1">
      {q.options.map((o) => {
        const active = current === o.id;
        return (
          <li key={o.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onAnswer(o.id)}
              className={`w-full text-left px-3 py-1.5 rounded-md text-xs border transition-colors flex items-start gap-2 ${
                active
                  ? 'bg-[#F0E5FF] border-[#5A3D7A]'
                  : 'bg-white border-[#E8D5F0] hover:border-[#C8A8DC]'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <span className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                active ? 'border-[#5A3D7A] bg-[#5A3D7A] text-white' : 'border-gray-400 text-gray-500'
              }`}>
                {o.id.toUpperCase()}
              </span>
              <span className="text-[#2D1B4E]">{o.text}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function MCQMultiInput({ q, answer, onAnswer, disabled }: QuestionInputProps) {
  if (q.type !== 'multiple-choice-multi') return null;
  const current: string[] = Array.isArray(answer) ? answer : [];
  const toggle = (id: string) => {
    if (current.includes(id)) onAnswer(current.filter((x) => x !== id));
    else if (current.length < q.pickCount) onAnswer([...current, id]);
  };
  return (
    <>
      <p className="text-[10px] font-bold text-[#5A3D7A] mb-1 uppercase tracking-widest">
        Choose {q.pickCount === 3 ? 'THREE' : 'TWO'}
      </p>
      <ul className="space-y-1">
        {q.options.map((o) => {
          const active = current.includes(o.id);
          return (
            <li key={o.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => toggle(o.id)}
                className={`w-full text-left px-3 py-1.5 rounded-md text-xs border transition-colors flex items-start gap-2 ${
                  active
                    ? 'bg-[#F0E5FF] border-[#5A3D7A]'
                    : 'bg-white border-[#E8D5F0] hover:border-[#C8A8DC]'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <span className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center text-[10px] font-bold ${
                  active ? 'border-[#5A3D7A] bg-[#5A3D7A] text-white' : 'border-gray-400 text-gray-500'
                }`}>
                  {active ? '✓' : o.id.toUpperCase()}
                </span>
                <span className="text-[#2D1B4E]">{o.text}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function MatchingInput({ q, answer, onAnswer, disabled, onFocus }: QuestionInputProps) {
  if (
    q.type !== 'matching-information' && q.type !== 'matching-headings'
    && q.type !== 'matching-features' && q.type !== 'matching-sentence-endings'
  ) return null;
  const current = typeof answer === 'string' ? answer : '';
  return (
    <select
      value={current}
      disabled={disabled}
      onFocus={onFocus}
      onChange={(e) => onAnswer(e.target.value)}
      className={`w-full max-w-md px-2 py-1.5 rounded-md border text-sm bg-white text-[#2D1B4E] transition-colors ${
        current ? 'border-[#5A3D7A]' : 'border-gray-400'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <option value="">— Choose —</option>
      {q.options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.id.toUpperCase()}. {o.text}
        </option>
      ))}
    </select>
  );
}

function FillInput({ q, answer, onAnswer, disabled, onFocus }: QuestionInputProps) {
  if (!('wordLimit' in q)) return null;
  const current = typeof answer === 'string' ? answer : '';
  const hint = wordLimitLabel(q);
  return (
    <div>
      {(q.contextBefore || q.contextAfter) ? (
        <p className="text-sm text-[#2D1B4E] leading-relaxed flex flex-wrap items-baseline gap-1">
          {q.contextBefore && <span>{q.contextBefore}</span>}
          <input
            type="text"
            value={current}
            disabled={disabled}
            onFocus={onFocus}
            onChange={(e) => onAnswer(e.target.value)}
            className={`px-2 py-1 rounded border-2 bg-white text-sm text-[#2D1B4E] focus:outline-none min-w-[120px] max-w-[240px] ${
              current ? 'border-[#5A3D7A]' : 'border-gray-400'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          />
          {q.contextAfter && <span>{q.contextAfter}</span>}
        </p>
      ) : (
        <input
          type="text"
          value={current}
          disabled={disabled}
          onFocus={onFocus}
          onChange={(e) => onAnswer(e.target.value)}
          className={`px-2 py-1 rounded border-2 bg-white text-sm text-[#2D1B4E] focus:outline-none w-full max-w-md ${
            current ? 'border-[#5A3D7A]' : 'border-gray-400'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        />
      )}
      {hint && (
        <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-1 font-bold">
          {hint}
        </p>
      )}
    </div>
  );
}

function QuestionInput(props: QuestionInputProps) {
  const { q, number, reviewMark } = props;
  return (
    <QuestionShell q={q} number={number} reviewMark={reviewMark}>
      <TFNGInput {...props} />
      <MCQInput {...props} />
      <MCQMultiInput {...props} />
      <MatchingInput {...props} />
      <FillInput {...props} />
    </QuestionShell>
  );
}

// ─── Passage & question groups ──────────────────────────────────────

function PassageCard({
  passage, highlightParagraph,
}: {
  passage: ReadingSection['passages'][number];
  highlightParagraph?: string;
}) {
  return (
    <article className="rounded-2xl bg-white border border-[#E8D5F0] p-5">
      <header className="mb-3 pb-3 border-b border-[#F0E5FF]">
        <h3 className="font-serif text-lg font-bold text-[#2D1B4E]">{passage.title}</h3>
        {passage.subtitle && (
          <p className="text-xs text-gray-500 mt-0.5 italic">{passage.subtitle}</p>
        )}
      </header>
      <div className="space-y-3">
        {passage.paragraphs.map((par) => {
          const isHi = highlightParagraph && par.label === highlightParagraph;
          return (
            <div
              key={par.label}
              className={`flex gap-3 -mx-2 px-2 py-1 rounded transition-colors ${
                isHi ? 'bg-yellow-50 ring-1 ring-yellow-200' : ''
              }`}
            >
              <span className="shrink-0 w-6 text-[#5A3D7A] font-bold text-sm">{par.label}</span>
              <p className="text-sm text-[#2D1B4E] leading-relaxed">{par.text}</p>
            </div>
          );
        })}
      </div>
    </article>
  );
}

// Group contiguous same-type questions so we can print "Questions 5-9"
// with a shared instruction, matching the real IELTS layout.
interface QGroup {
  startIndex: number;
  endIndex:   number;
  type:       ReadingQuestionType;
  questions:  ReadingQuestion[];
}
function groupQuestions(qs: ReadingQuestion[]): QGroup[] {
  const groups: QGroup[] = [];
  for (let i = 0; i < qs.length; i++) {
    const q = qs[i];
    const last = groups[groups.length - 1];
    if (last && last.type === q.type) {
      last.endIndex = i;
      last.questions.push(q);
    } else {
      groups.push({ startIndex: i, endIndex: i, type: q.type, questions: [q] });
    }
  }
  return groups;
}

function groupInstructions(g: QGroup): string {
  switch (g.type) {
    case 'multiple-choice':
      return 'Choose the correct answer.';
    case 'multiple-choice-multi': {
      const q = g.questions[0] as ReadingQuestion & { pickCount: 2 | 3 };
      return `Choose ${q.pickCount === 3 ? 'THREE' : 'TWO'} correct answers.`;
    }
    case 'true-false-not-given':
      return 'Do the following statements agree with the information given in the passage? Answer TRUE, FALSE, or NOT GIVEN.';
    case 'yes-no-not-given':
      return 'Do the following statements reflect the writer\'s claims? Answer YES, NO, or NOT GIVEN.';
    case 'matching-information':
      return 'Which paragraph contains the following information?';
    case 'matching-headings':
      return 'Choose the correct heading for each paragraph from the list.';
    case 'matching-features':
      return 'Match each statement with the option it best describes.';
    case 'matching-sentence-endings':
      return 'Complete each sentence with the correct ending from the list.';
    case 'sentence-completion':
    case 'summary-completion':
    case 'note-completion':
    case 'table-completion':
    case 'flow-chart-completion':
    case 'diagram-label':
    case 'short-answer': {
      const q = g.questions[0] as ReadingQuestion & { wordLimit: number; allowNumbers: boolean };
      const wl = q.wordLimit;
      const words = wl === 1 ? 'ONE WORD' : wl === 2 ? 'TWO WORDS' : wl === 3 ? 'THREE WORDS' : `${wl} WORDS`;
      const num = q.allowNumbers ? ' AND/OR A NUMBER' : '';
      const container =
        g.type === 'summary-completion' ? 'summary'
        : g.type === 'note-completion' ? 'notes'
        : g.type === 'table-completion' ? 'table'
        : g.type === 'flow-chart-completion' ? 'flow chart'
        : g.type === 'diagram-label' ? 'diagram'
        : 'sentences';
      if (g.type === 'short-answer') {
        return `Answer the questions. Write NO MORE THAN ${words}${num} for each answer.`;
      }
      return `Complete the ${container}. Write NO MORE THAN ${words}${num} for each answer.`;
    }
  }
}

// ─── CBT header ─────────────────────────────────────────────────────

function CBTHeader({
  studentName, candidateId, timeLeftSec, sectionLabel,
}: {
  studentName:   string;
  candidateId:   string;
  timeLeftSec:   number;
  sectionLabel:  string;
}) {
  const minsLeft = Math.max(0, Math.ceil(timeLeftSec / 60));
  const warn = timeLeftSec <= 5 * 60;
  return (
    <div className="sticky top-0 z-40 bg-white border-b border-[#E8D5F0] shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 ring-1 ring-[#E8D5F0]">
            <Image src="/logo-friendlyteaching.jpg" alt="FriendlyTeaching" width={36} height={36} className="object-cover w-full h-full" />
          </div>
          <span className="hidden sm:inline font-black text-[15px] tracking-tight leading-none whitespace-nowrap" style={{ color: '#5A3D7A' }}>
            FriendlyTeaching
          </span>
          <div className="hidden md:flex flex-col leading-tight border-l border-[#E8D5F0] pl-3">
            <span className="text-[9px] font-black text-[#5A3D7A] uppercase tracking-[0.3em]">IELTS Simulator</span>
            <span className="text-[10px] text-gray-500">Reading Test · {sectionLabel}</span>
          </div>
        </div>
        <div className="flex flex-col items-end min-w-0">
          <span className="text-sm font-bold text-[#2D1B4E] truncate max-w-[260px]">
            {studentName || 'Candidate'} <span className="text-gray-400 font-mono font-medium">- {candidateId}</span>
          </span>
          <div className="flex items-center gap-3 text-[11px]">
            <span className={warn ? 'text-red-500 font-bold' : 'text-gray-600'}>
              ⏱ {fmtTime(timeLeftSec)} · {minsLeft} min left
            </span>
            <FullscreenButton variant="inline" className="!w-7 !h-7 !bg-transparent !border-transparent !text-[#5A3D7A] hover:!bg-[#F0E5FF] hover:!border-[#F0E5FF]" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CBT footer (section + per-question navigator) ──────────────────

function CBTFooter({
  mock, currentSection, activeQIndex, answers, onGoTo, onPrev, onNext, onSubmit,
}: {
  mock:            ReadingMock;
  currentSection:  number;
  activeQIndex:    number;
  answers:         StudentReadingAnswers;
  onGoTo:          (section: number, qIndex: number) => void;
  onPrev:          () => void;
  onNext:          () => void;
  onSubmit:        () => void;
}) {
  const isLastSection = currentSection === mock.sections.length - 1;
  const isFirstQ = currentSection === 0 && activeQIndex === 0;
  return (
    <div className="sticky bottom-0 z-40 bg-[#2D1B4E] text-white border-t border-[#5A3D7A]">
      <div className="max-w-6xl mx-auto px-3 py-2 flex items-center gap-3 overflow-x-auto">
        {mock.sections.map((sec, sIdx) => {
          const offset = questionOffsetForSection(mock, sIdx);
          const isActive = sIdx === currentSection;
          const answered = sec.questions.filter((q) => isAnswered(answers[q.id])).length;
          if (isActive) {
            return (
              <div key={sec.number} className="flex items-center gap-1 shrink-0">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#F0E5FF] mr-1">
                  Section {sec.number}
                </span>
                {sec.questions.map((q, qIdx) => {
                  const gNum = offset + qIdx + 1;
                  const active = qIdx === activeQIndex;
                  const ans = answers[q.id];
                  const done = isAnswered(ans);
                  return (
                    <button
                      key={q.id}
                      onClick={() => onGoTo(sIdx, qIdx)}
                      className={`min-w-[26px] h-6 px-1.5 rounded text-[11px] font-bold tabular-nums transition-colors ${
                        active
                          ? 'bg-white text-[#2D1B4E] shadow-sm'
                          : done
                            ? 'bg-[#9B7CB8] text-white'
                            : 'bg-transparent text-white/80 hover:bg-white/10'
                      }`}
                      aria-current={active ? 'true' : undefined}
                    >
                      {gNum}
                    </button>
                  );
                })}
              </div>
            );
          }
          return (
            <button
              key={sec.number}
              onClick={() => onGoTo(sIdx, 0)}
              className="shrink-0 flex items-center gap-2 px-2.5 py-1 rounded text-[11px] font-bold text-white/80 hover:bg-white/10"
            >
              <span>Section {sec.number}</span>
              <span className="text-white/50 font-mono">{answered} of {sec.questions.length}</span>
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <button
            onClick={onPrev}
            disabled={isFirstQ}
            className={`w-8 h-8 rounded text-lg leading-none flex items-center justify-center transition-colors ${
              isFirstQ ? 'bg-white/5 text-white/25 cursor-not-allowed' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            aria-label="Previous"
          >
            ←
          </button>
          {isLastSection ? (
            <button
              onClick={onSubmit}
              className="h-8 px-4 rounded bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1"
            >
              ✓ Submit
            </button>
          ) : (
            <button
              onClick={onNext}
              className="w-8 h-8 rounded bg-white hover:bg-white/90 text-[#2D1B4E] text-lg leading-none flex items-center justify-center"
              aria-label="Next"
            >
              →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Setup screen ───────────────────────────────────────────────────

function SetupScreen({
  mock, studentName, setStudentName, mode, setMode, onStart, onBack,
}: {
  mock:            ReadingMock;
  studentName:     string;
  setStudentName:  (v: string) => void;
  mode:            ReadingSessionMode;
  setMode:         (m: ReadingSessionMode) => void;
  onStart:         () => void;
  onBack:          () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F5FF] via-[#F3EEFF] to-[#EEF2FF] flex flex-col">
      <div className="max-w-2xl mx-auto w-full px-6 py-10 space-y-6">
        <button onClick={onBack} className="text-xs text-[#5A3D7A] hover:underline">← Volver</button>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#5A3D7A] mb-1">
            {mock.level}
          </p>
          <h1 className="text-2xl font-extrabold text-[#2D1B4E]">{mock.title}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {mock.totalQuestions} preguntas · {mock.totalDurationMin} minutos · {mock.sections.length} secciones
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-[#E8D5F0] p-6 space-y-5">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-[#5A3D7A] mb-1">
              Nombre del estudiante
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Ej. María González"
              className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:border-[#5A3D7A]"
            />
          </div>

          <div>
            <p className="block text-xs font-black uppercase tracking-widest text-[#5A3D7A] mb-2">
              Modo
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {([
                { id: 'exam', label: 'Exam', help: '60 min estricto, sin revelar respuestas hasta el final.' },
                { id: 'practice', label: 'Practice', help: '60 min visible, podés revisar respuestas al terminar.' },
              ] as const).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`text-left rounded-lg border p-3 transition-colors ${
                    mode === m.id
                      ? 'bg-[#F0E5FF] border-[#5A3D7A]'
                      : 'bg-white border-[#E8D5F0] hover:border-[#C8A8DC]'
                  }`}
                >
                  <p className="font-bold text-sm text-[#2D1B4E]">{m.label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{m.help}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onStart}
            disabled={!studentName.trim()}
            className={`w-full py-3 rounded-lg font-bold text-sm transition-colors ${
              studentName.trim()
                ? 'bg-[#5A3D7A] text-white hover:bg-[#4A2D6A]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Empezar mock
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Results screen ─────────────────────────────────────────────────

function bandBadgeClass(band: number): string {
  if (band >= 8) return 'bg-emerald-50 border-emerald-200 text-emerald-700';
  if (band >= 7) return 'bg-[#F0E5FF] border-[#C8A8DC] text-[#5A3D7A]';
  if (band >= 6) return 'bg-sky-50 border-sky-200 text-sky-700';
  if (band >= 5) return 'bg-amber-50 border-amber-200 text-amber-700';
  return 'bg-red-50 border-red-200 text-red-700';
}

function ResultsScreen({
  mock, result, studentName, onReviewAll, onExit,
}: {
  mock:         ReadingMock;
  result:       ReadingGradeResult;
  studentName:  string;
  onReviewAll:  () => void;
  onExit:       () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F5FF] via-[#F3EEFF] to-[#EEF2FF]">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#5A3D7A] mb-1">
            Resultados · {mock.level}
          </p>
          <h1 className="text-2xl font-extrabold text-[#2D1B4E]">{mock.title}</h1>
          <p className="text-sm text-gray-500 mt-1">Candidato: {studentName || 'Sin nombre'}</p>
        </div>

        <div className="rounded-2xl bg-white border border-[#E8D5F0] p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#5A3D7A] mb-1">Band score</p>
            <p className="text-6xl font-extrabold text-[#2D1B4E] tabular-nums">{result.band}</p>
            <p className="text-sm text-gray-500 italic">{result.bandLabel}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-widest text-[#5A3D7A] mb-1">Raw</p>
            <p className="text-4xl font-bold text-[#2D1B4E] tabular-nums">
              {result.rawScore}<span className="text-gray-400">/40</span>
            </p>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${bandBadgeClass(result.band)}`}>
            {result.bandLabel}
          </span>
        </div>

        <section>
          <h2 className="text-sm font-black uppercase tracking-widest text-[#5A3D7A] mb-2">Por sección</h2>
          <div className="grid grid-cols-3 gap-3">
            {result.sectionBreakdown.map((s) => (
              <div key={s.section} className="rounded-xl bg-white border border-[#E8D5F0] p-4 text-center">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Section {s.section}</p>
                <p className="text-2xl font-bold text-[#2D1B4E] tabular-nums">
                  {s.correct}<span className="text-gray-400 text-base">/{s.total}</span>
                </p>
                <p className="text-xs text-gray-500 tabular-nums">{s.pct}%</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-black uppercase tracking-widest text-[#5A3D7A] mb-2">Por tipo de pregunta</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[...result.typeBreakdown].sort((a, b) => a.pct - b.pct).map((t) => (
              <div key={t.type} className="rounded-lg bg-white border border-[#E8D5F0] p-3 flex items-center justify-between">
                <span className="text-xs text-[#2D1B4E] font-medium">{TYPE_LABEL[t.type]}</span>
                <span className="text-xs font-bold tabular-nums text-[#5A3D7A]">
                  {t.correct}/{t.total} · {t.pct}%
                </span>
              </div>
            ))}
          </div>
        </section>

        {result.cognitiveBreakdown.length > 0 && (
          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-[#5A3D7A] mb-2">Por carga cognitiva</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {result.cognitiveBreakdown.map((c) => (
                <div key={c.load} className="rounded-lg bg-white border border-[#E8D5F0] p-3 text-center">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{c.load}</p>
                  <p className="text-lg font-bold text-[#2D1B4E] tabular-nums">{c.pct}%</p>
                  <p className="text-[10px] text-gray-400 tabular-nums">{c.correct}/{c.total}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {result.recommendations.length > 0 && (
          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-[#5A3D7A] mb-2">Recomendaciones</h2>
            <ul className="space-y-2">
              {result.recommendations.map((r, i) => (
                <li key={i} className="rounded-lg bg-[#F0E5FF] border border-[#C8A8DC]/60 p-3 text-sm text-[#2D1B4E]">
                  <span className="text-[10px] uppercase tracking-widest text-[#5A3D7A] font-black mr-2">
                    {r.focus} · {r.targetTag}
                  </span>
                  {r.message}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex gap-2">
          <button
            onClick={onReviewAll}
            className="flex-1 py-3 rounded-lg bg-[#5A3D7A] text-white font-bold text-sm hover:bg-[#4A2D6A] transition-colors"
          >
            Revisar respuesta por respuesta
          </button>
          <button
            onClick={onExit}
            className="flex-1 py-3 rounded-lg bg-white border border-[#C8A8DC] text-[#5A3D7A] font-bold text-sm hover:bg-[#F0E5FF] transition-colors"
          >
            Salir
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main runner ────────────────────────────────────────────────────

export default function ReadingRunnerPage() {
  const params = useParams<{ mockId: string }>();
  const router = useRouter();
  const mockId = String(params?.mockId ?? '');
  const mock = useMemo(() => findMock(mockId), [mockId]);

  const [phase, setPhase] = useState<Phase>('setup');
  const [mode, setMode] = useState<ReadingSessionMode>('practice');
  const [studentName, setStudentName] = useState('');
  const [answers, setAnswers] = useState<StudentReadingAnswers>({});
  const [currentSection, setCurrentSection] = useState(0);
  const [activeQIndex, setActiveQIndex] = useState(0);
  const [timeLeftSec, setTimeLeftSec] = useState(60 * 60);
  const [result, setResult] = useState<ReadingGradeResult | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const submittedRef = useRef(false);

  const section = mock?.sections[currentSection];
  const activeQ = section?.questions[activeQIndex];
  const candidateId = candidateIdFrom(studentName || 'anon');

  // Timer
  useEffect(() => {
    if (phase !== 'running') return;
    const t = setInterval(() => setTimeLeftSec((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const handleSubmit = () => {
    if (!mock || submittedRef.current) return;
    submittedRef.current = true;
    const r = gradeReadingAnswers(answers, mock);
    setResult(r);
    setPhase('results');
  };

  // Auto-submit on timeout
  useEffect(() => {
    if (phase === 'running' && timeLeftSec === 0) handleSubmit();
  }, [timeLeftSec, phase]);

  if (!mock) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9F5FF] via-[#F3EEFF] to-[#EEF2FF]">
        <div className="text-center space-y-4">
          <p className="text-lg text-[#2D1B4E]">No encontré el mock <code className="font-mono">{mockId}</code>.</p>
          <Link href="/dashboard/teacher/ielts/reading" className="text-[#5A3D7A] font-bold underline">
            Volver a la lista de mocks
          </Link>
        </div>
      </div>
    );
  }

  if (phase === 'setup') {
    return (
      <SetupScreen
        mock={mock}
        studentName={studentName}
        setStudentName={setStudentName}
        mode={mode}
        setMode={setMode}
        onStart={() => setPhase('running')}
        onBack={() => router.push('/dashboard/teacher/ielts/reading')}
      />
    );
  }

  if (phase === 'results' && result) {
    if (reviewOpen) {
      return (
        <ReviewScreen
          mock={mock}
          answers={answers}
          result={result}
          onClose={() => setReviewOpen(false)}
        />
      );
    }
    return (
      <ResultsScreen
        mock={mock}
        result={result}
        studentName={studentName}
        onReviewAll={() => setReviewOpen(true)}
        onExit={() => router.push('/dashboard/teacher/ielts/reading')}
      />
    );
  }

  // ── running phase ──
  if (!section || !activeQ) return null;

  const offset = questionOffsetForSection(mock, currentSection);
  const groups = groupQuestions(section.questions);
  const goTo = (sIdx: number, qIdx: number) => {
    setCurrentSection(sIdx);
    setActiveQIndex(qIdx);
    // scroll to question
    setTimeout(() => {
      const q = mock.sections[sIdx].questions[qIdx];
      document.getElementById(`q-${q.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };
  const goPrev = () => {
    if (activeQIndex > 0) return goTo(currentSection, activeQIndex - 1);
    if (currentSection > 0) return goTo(currentSection - 1, mock.sections[currentSection - 1].questions.length - 1);
  };
  const goNext = () => {
    if (activeQIndex < section.questions.length - 1) return goTo(currentSection, activeQIndex + 1);
    if (currentSection < mock.sections.length - 1) return goTo(currentSection + 1, 0);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#F9F5FF] via-[#F3EEFF] to-[#EEF2FF]">
      <CBTHeader
        studentName={studentName}
        candidateId={candidateId}
        timeLeftSec={timeLeftSec}
        sectionLabel={`Section ${section.number}`}
      />

      <div className="flex-1 max-w-6xl mx-auto w-full px-3 md:px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: passages */}
        <div className="space-y-4 md:max-h-[calc(100vh-140px)] md:overflow-y-auto pr-1">
          <div className="rounded-lg bg-[#F0E5FF] border border-[#C8A8DC]/60 px-4 py-3">
            <p className="text-base font-bold text-[#2D1B4E]">Section {section.number}</p>
            <p className="text-sm text-[#5A3D7A]">
              Questions {offset + 1}–{offset + section.questions.length} · ~{section.targetDurationMin} min
            </p>
            <p className="text-xs text-gray-600 mt-1">{section.instructions}</p>
          </div>
          {section.passages.map((p) => (
            <PassageCard key={p.id} passage={p} />
          ))}
        </div>

        {/* Right: questions */}
        <div className="space-y-4 md:max-h-[calc(100vh-140px)] md:overflow-y-auto pl-1">
          {groups.map((g, gi) => {
            const from = offset + g.startIndex + 1;
            const to = offset + g.endIndex + 1;
            return (
              <div key={gi} className="space-y-2">
                <div className="rounded-md bg-white border border-[#E8D5F0] px-3 py-2">
                  <p className="text-sm font-bold text-[#2D1B4E]">
                    Questions {from}{from === to ? '' : `–${to}`}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">{groupInstructions(g)}</p>
                </div>
                {g.questions.map((q, i) => {
                  const localIdx = g.startIndex + i;
                  return (
                    <QuestionInput
                      key={q.id}
                      q={q}
                      number={offset + localIdx + 1}
                      answer={answers[q.id]}
                      onAnswer={(val) => setAnswers((a) => ({ ...a, [q.id]: val }))}
                      onFocus={() => setActiveQIndex(localIdx)}
                    />
                  );
                })}
              </div>
            );
          })}
          <div className="pt-4 flex justify-end">
            <button
              onClick={handleSubmit}
              className="px-5 py-2 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold"
            >
              ✓ Entregar mock
            </button>
          </div>
        </div>
      </div>

      <CBTFooter
        mock={mock}
        currentSection={currentSection}
        activeQIndex={activeQIndex}
        answers={answers}
        onGoTo={goTo}
        onPrev={goPrev}
        onNext={goNext}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

// ─── Review screen (post-submit) ────────────────────────────────────

function ReviewScreen({
  mock, answers, result, onClose,
}: {
  mock:     ReadingMock;
  answers:  StudentReadingAnswers;
  result:   ReadingGradeResult;
  onClose:  () => void;
}) {
  const [sectionIdx, setSectionIdx] = useState(0);
  const section = mock.sections[sectionIdx];
  const offset = questionOffsetForSection(mock, sectionIdx);
  const marksById = useMemo(() => {
    const m = new Map<string, ReadingGradeResult['perQuestion'][number]>();
    for (const p of result.perQuestion) m.set(p.questionId, p);
    return m;
  }, [result]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#F9F5FF] via-[#F3EEFF] to-[#EEF2FF]">
      <div className="sticky top-0 z-40 bg-white border-b border-[#E8D5F0] shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#5A3D7A]">Revisión</p>
            <p className="text-sm font-bold text-[#2D1B4E]">{mock.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-bold px-3 py-1.5 rounded-md bg-[#5A3D7A] text-white hover:bg-[#4A2D6A]"
          >
            ← Volver a resultados
          </button>
        </div>
        <div className="max-w-6xl mx-auto px-4 pb-2 flex gap-2">
          {mock.sections.map((s, i) => {
            const active = i === sectionIdx;
            const brk = result.sectionBreakdown[i];
            return (
              <button
                key={s.number}
                onClick={() => setSectionIdx(i)}
                className={`text-xs font-bold px-3 py-1 rounded-md border transition-colors ${
                  active
                    ? 'bg-[#5A3D7A] text-white border-[#5A3D7A]'
                    : 'bg-white text-[#5A3D7A] border-[#C8A8DC] hover:bg-[#F0E5FF]'
                }`}
              >
                Section {s.number}
                <span className="ml-2 font-mono text-[10px] opacity-70">
                  {brk.correct}/{brk.total}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full px-3 md:px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4 md:max-h-[calc(100vh-160px)] md:overflow-y-auto pr-1">
          {section.passages.map((p) => (
            <PassageCard key={p.id} passage={p} />
          ))}
        </div>
        <div className="space-y-2 md:max-h-[calc(100vh-160px)] md:overflow-y-auto pl-1">
          {section.questions.map((q, i) => {
            const mark = marksById.get(q.id);
            return (
              <QuestionInput
                key={q.id}
                q={q}
                number={offset + i + 1}
                answer={answers[q.id]}
                onAnswer={() => {}}
                disabled
                reviewMark={mark ? { correct: mark.correct, accepted: mark.acceptedAnswer } : undefined}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
