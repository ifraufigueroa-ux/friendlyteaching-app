// FriendlyTeaching.cl — IELTS Listening Mock (teacher-facing)
//
// MVP flow: Landing → 4 sections in sequence with audio + questions →
// Submit → diagnostic results. Audio can be pasted as URL or uploaded
// to Firebase Storage (session-scoped for now — persistence comes later).
//
// Modes shipped in this MVP:
//   · exam     → single play, no pause (audio controls hidden), timer visible
//   · practice → controls visible, timer optional, per-question "reveal" enabled
//   · review   → only accessible after submit; walks through with answers shown
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import TopBar from '@/components/layout/TopBar';
import FullscreenButton from '@/components/ui/FullscreenButton';
import { listeningMock1 } from '@/lib/data/ielts/listeningMock1';
import { gradeAnswers } from '@/lib/ielts/scoreListening';
import { loadMockAudioBindings, saveAudioBinding, deleteAudioBinding, type AudioSource } from '@/lib/ielts/audioStore';
import type {
  ListeningMock, ListeningSection, ListeningQuestion, StudentAnswers,
  ListeningSessionMode, GradeResult, TableLayout, FlowChartLayout,
} from '@/types/ielts';

const MOCKS: ListeningMock[] = [listeningMock1];

// ─── Audio player with playback-speed control ───────────────────────
// Wraps a native <audio> and adds a speed pill selector below (0.75x /
// 0.85x / 1x). Hidden in exam mode so real-test conditions are
// preserved. Setting playbackRate in an effect + on loadedmetadata
// covers the case where the audio hasn't decoded when the state changes.

const SPEED_OPTIONS: { label: string; rate: number }[] = [
  { label: '0.75x', rate: 0.75 },
  { label: '0.85x', rate: 0.85 },
  { label: '1x',    rate: 1.0  },
];

function AudioWithSpeed({
  src, mode, autoPlay, tone = 'dark', onPlayingChange,
}: {
  src:              string;
  mode:             ListeningSessionMode;
  autoPlay?:        boolean;
  tone?:            'dark' | 'light';
  onPlayingChange?: (playing: boolean) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [rate, setRate] = useState(1);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate, src]);

  const showSpeed = mode !== 'exam';
  const pillActive = tone === 'dark'
    ? 'bg-white text-[#5A3D7A]'
    : 'bg-[#5A3D7A] text-white';
  const pillIdle = tone === 'dark'
    ? 'bg-white/15 text-white/80 hover:bg-white/25'
    : 'bg-[#F0E5FF] text-[#5A3D7A] hover:bg-[#E0C8F0]';
  const labelColor = tone === 'dark' ? 'text-white/70' : 'text-[#5A3D7A]/70';

  return (
    <>
      <audio
        ref={audioRef}
        src={src}
        controls={mode !== 'exam'}
        controlsList={mode === 'exam' ? 'nodownload noplaybackrate' : undefined}
        className={tone === 'dark' ? 'w-full accent-white' : 'w-full'}
        autoPlay={autoPlay}
        onLoadedMetadata={(e) => { (e.currentTarget as HTMLAudioElement).playbackRate = rate; }}
        onPlay={() => onPlayingChange?.(true)}
        onPause={() => onPlayingChange?.(false)}
        onEnded={() => onPlayingChange?.(false)}
      />
      {showSpeed && (
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-[10px] font-bold uppercase tracking-widest ${labelColor}`}>
            Velocidad
          </span>
          <div className="flex gap-1">
            {SPEED_OPTIONS.map((opt) => (
              <button
                key={opt.rate}
                onClick={() => setRate(opt.rate)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums transition-colors ${
                  rate === opt.rate ? pillActive : pillIdle
                }`}
                aria-pressed={rate === opt.rate}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─── CBT shell (mimics IELTS Computer-Based UI) ─────────────────────
//
// FriendlyTeaching-branded rebuild of the real CBT layout. Everything
// below drives the "running" phase — landing/results stay on our
// regular styling.

/** Compute a stable 5-char candidate ID from the teacher's uid, so it
 *  looks like the real IELTS "12345" but stays deterministic. */
function candidateIdFrom(uid: string): string {
  if (!uid) return '00000';
  const tail = uid.replace(/[^a-zA-Z0-9]/g, '').slice(-5).toUpperCase();
  return tail.padStart(5, '0');
}

/** Group contiguous same-format questions in a section so we can
 *  render "Questions 1-6" then "Questions 7-10" like the real CBT. */
interface QGroup {
  startIndex: number;   // 0-based within the section (for numbering: startIndex+1..endIndex+1)
  endIndex:   number;
  type:       ListeningQuestion['type'];
  wordLimit?: number;
  allowNumbers?: boolean;
  pickCount?: 2 | 3;
  questions:  ListeningQuestion[];
}
function groupQuestions(qs: ListeningQuestion[]): QGroup[] {
  // Group by type (and pickCount for multi-select, since "Choose TWO" vs
  // "Choose THREE" is a different instruction). Fill questions are NOT
  // keyed on wordLimit / allowNumbers — a shared table or flow-chart
  // can legitimately span questions with mildly different word rules
  // (e.g. one accepts a number, the next only a word). Widen those
  // fields to max / OR across the group so the derived instruction is
  // permissive enough for every blank in it.
  const groups: QGroup[] = [];
  for (let i = 0; i < qs.length; i++) {
    const q = qs[i];
    const key = (q.type as string) + ('pickCount' in q ? `|p${q.pickCount}` : '');
    const last = groups[groups.length - 1];
    const lastKey = last && ((last.type as string) + (last.pickCount != null ? `|p${last.pickCount}` : ''));
    if (last && lastKey === key) {
      last.endIndex = i;
      last.questions.push(q);
      if ('wordLimit' in q) {
        last.wordLimit = Math.max(last.wordLimit ?? 0, q.wordLimit);
      }
      if ('allowNumbers' in q) {
        last.allowNumbers = (last.allowNumbers ?? false) || q.allowNumbers;
      }
    } else {
      groups.push({
        startIndex:   i,
        endIndex:     i,
        type:         q.type,
        wordLimit:    'wordLimit' in q ? q.wordLimit : undefined,
        allowNumbers: 'allowNumbers' in q ? q.allowNumbers : undefined,
        pickCount:    'pickCount' in q ? q.pickCount : undefined,
        questions:    [q],
      });
    }
  }
  return groups;
}

/** Instruction text derived from group format (matches real IELTS wording). */
function groupInstructions(g: QGroup): string {
  const isFill = (
    g.type === 'form-completion'
    || g.type === 'note-completion'
    || g.type === 'table-completion'
    || g.type === 'summary-completion'
    || g.type === 'sentence-completion'
    || g.type === 'flow-chart-completion'
    || g.type === 'short-answer'
  );
  if (isFill) {
    const wl = g.wordLimit ?? 2;
    const words = wl === 1 ? 'ONE WORD' : wl === 2 ? 'TWO WORDS' : wl === 3 ? 'THREE WORDS' : `${wl} WORDS`;
    const num = g.allowNumbers ? ' AND/OR A NUMBER' : '';
    const containerLabel =
      g.type === 'form-completion'     ? 'form'
      : g.type === 'note-completion'   ? 'notes'
      : g.type === 'table-completion'  ? 'table'
      : g.type === 'summary-completion' ? 'summary'
      : g.type === 'sentence-completion' ? 'sentences'
      : g.type === 'flow-chart-completion' ? 'flow chart'
      : /* short-answer */ 'answers';
    if (g.type === 'short-answer') {
      return `Answer the questions. Write NO MORE THAN ${words}${num} for each answer.`;
    }
    return `Complete the ${containerLabel}. Write NO MORE THAN ${words}${num} for each answer.`;
  }
  if (g.type === 'multiple-choice')       return 'Choose the correct answer.';
  if (g.type === 'multiple-choice-multi') return `Choose ${g.pickCount === 3 ? 'THREE' : 'TWO'} correct answers.`;
  if (g.type === 'matching')              return 'Choose the correct answer from the list below.';
  if (g.type === 'plan-map-labelling')    return 'Label the plan/map with the options below.';
  return '';
}

/** Header — top bar mimicking IELTS CBT. Sticky at the top. */
function CBTHeader({
  studentName, candidateId, timeMinutesLeft, audioPlaying, onMenu,
}: {
  studentName:      string;
  candidateId:      string;
  timeMinutesLeft:  number;
  audioPlaying:     boolean;
  onMenu?:          () => void;
}) {
  return (
    <div className="sticky top-0 z-40 bg-white border-b border-[#E8D5F0] shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-baseline gap-1">
            <span className="font-black text-2xl tracking-tight leading-none" style={{ color: '#5A3D7A' }}>FT</span>
            <span className="text-[9px] font-bold text-[#5A3D7A]/70 tracking-widest">™</span>
          </div>
          <div className="hidden sm:flex flex-col leading-tight border-l border-[#E8D5F0] pl-3">
            <span className="text-[9px] font-black text-[#5A3D7A] uppercase tracking-[0.3em]">IELTS Simulator</span>
            <span className="text-[10px] text-gray-500">Listening Test</span>
          </div>
        </div>

        <div className="flex flex-col items-end min-w-0">
          <span className="text-sm font-bold text-[#2D1B4E] truncate max-w-[220px]">
            {studentName || 'Candidate'} <span className="text-gray-400 font-mono font-medium">- {candidateId}</span>
          </span>
          <div className="flex items-center gap-3 text-[11px] text-gray-600">
            <span>{timeMinutesLeft} minutes remaining</span>
            <span className="inline-flex items-center gap-1">
              <span aria-hidden>{audioPlaying ? '🔊' : '🔈'}</span>
              <span>{audioPlaying ? 'Audio is playing' : 'Audio paused'}</span>
            </span>
            <FullscreenButton variant="inline" className="!w-7 !h-7 !bg-transparent !border-transparent !text-[#5A3D7A] hover:!bg-[#F0E5FF] hover:!border-[#F0E5FF]" />
            <button
              onClick={onMenu}
              aria-label="Menu"
              className="text-gray-500 hover:text-[#5A3D7A] text-lg leading-none"
            >
              ☰
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Part banner — "Part X — Listen and answer questions Y–Z". */
function CBTPartBanner({ part, from, to }: { part: 1 | 2 | 3 | 4; from: number; to: number }) {
  return (
    <div className="rounded-lg bg-[#F0E5FF] border border-[#C8A8DC]/60 px-4 py-3 mb-4">
      <p className="text-base font-bold text-[#2D1B4E]">Part {part}</p>
      <p className="text-sm text-[#5A3D7A]">
        Listen and answer questions {from}–{to}.
      </p>
    </div>
  );
}

/** Questions heading — "Questions X-Y" + instructions. Emphasises
 *  NO MORE THAN X WORDS the way real IELTS does. */
function CBTQuestionsHeading({ from, to, instructions }: { from: number; to: number; instructions: string }) {
  // Bold the "NO MORE THAN … WORDS AND/OR A NUMBER" phrase like the real UI.
  const m = instructions.match(/^(.*?)(NO MORE THAN [A-Z]+(?: AND\/OR A NUMBER)?)(.*)$/);
  return (
    <div className="mb-3">
      <p className="text-base font-bold text-[#2D1B4E]">Questions {from}–{to}</p>
      <p className="text-sm text-[#2D1B4E] leading-relaxed mt-1">
        {m
          ? (<>{m[1]}<strong className="font-bold">{m[2]}</strong>{m[3]}</>)
          : instructions}
      </p>
    </div>
  );
}

/** Footer paginator: per-question buttons for the active part,
 *  header buttons for the other parts, plus prev/next and submit. */
function CBTFooter({
  mock, currentSection, activeQIndex, answers, onGoTo, onPrev, onNext, onSubmit,
}: {
  mock:           ListeningMock;
  currentSection: 0 | 1 | 2 | 3;
  activeQIndex:   number;                                  // 0-based within section
  answers:        StudentAnswers;
  onGoTo:         (section: 0 | 1 | 2 | 3, qIndex: number) => void;
  onPrev:         () => void;
  onNext:         () => void;
  onSubmit:       () => void;
}) {
  const isLastSection = currentSection === 3;

  return (
    <div className="sticky bottom-0 z-40 bg-[#2D1B4E] text-white border-t border-[#5A3D7A]">
      <div className="max-w-5xl mx-auto px-3 py-2 flex items-center gap-3 overflow-x-auto">
        {mock.sections.map((sec, sIdx) => {
          const isActivePart = sIdx === currentSection;
          const answeredCount = sec.questions.filter(q => {
            const a = answers[q.id];
            return Array.isArray(a) ? a.length > 0 : (typeof a === 'string' && a.trim().length > 0);
          }).length;
          if (isActivePart) {
            return (
              <div key={sec.number} className="flex items-center gap-1 shrink-0">
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#F0E5FF] mr-1">
                  Part {sec.number}
                </span>
                {sec.questions.map((q, qIdx) => {
                  const isActive = qIdx === activeQIndex;
                  const ans = answers[q.id];
                  const isAnswered = Array.isArray(ans) ? ans.length > 0 : (typeof ans === 'string' && ans.trim().length > 0);
                  const qNumber = sIdx * 10 + qIdx + 1;
                  return (
                    <button
                      key={q.id}
                      onClick={() => onGoTo(sIdx as 0 | 1 | 2 | 3, qIdx)}
                      className={`min-w-[26px] h-6 px-1.5 rounded text-[11px] font-bold tabular-nums transition-colors ${
                        isActive
                          ? 'bg-white text-[#2D1B4E] shadow-sm'
                          : isAnswered
                            ? 'bg-[#9B7CB8] text-white'
                            : 'bg-transparent text-white/80 hover:bg-white/10'
                      }`}
                      aria-current={isActive ? 'true' : undefined}
                      aria-label={`Go to question ${qNumber}`}
                    >
                      {qNumber}
                    </button>
                  );
                })}
              </div>
            );
          }
          return (
            <button
              key={sec.number}
              onClick={() => onGoTo(sIdx as 0 | 1 | 2 | 3, 0)}
              className="shrink-0 flex items-center gap-2 px-2.5 py-1 rounded text-[11px] font-bold text-white/80 hover:bg-white/10 transition-colors"
            >
              <span>Part {sec.number}</span>
              <span className="text-white/50 font-mono">{answeredCount} of {sec.questions.length}</span>
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <button
            onClick={onPrev}
            className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 text-white text-lg leading-none flex items-center justify-center"
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

// ─── Layout renderers (Table / Flow-chart) ──────────────────────────
//
// When a section defines tableLayouts or flowChartLayouts, the runner
// renders the full container in place of individual QuestionCards for
// the referenced questions. Cells/steps that reference a question id
// resolve to a `CBTLayoutBlank` — a compact numbered input that stays
// wired to the same answers/activeQIndex state as the rest of the mock.

/** Compact inline input used inside table cells and flow-chart steps. */
function CBTLayoutBlank({
  q, sectionIndex, qIndexInSection, answer, onAnswer, onFocus, isActive, allowReveal,
}: {
  q:                ListeningQuestion & { accepted: string[]; wordLimit: number };
  sectionIndex:     number;
  qIndexInSection:  number;
  answer:           string | string[] | undefined;
  onAnswer:         (val: string) => void;
  onFocus?:         () => void;
  isActive?:        boolean;
  allowReveal?:     boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const number = sectionIndex * 10 + qIndexInSection + 1;
  const numBox = isActive
    ? 'border-[#5A3D7A] bg-[#5A3D7A] text-white'
    : 'border-[#2D1B4E]/60 text-[#2D1B4E] bg-white';
  return (
    <span className="inline-flex items-center gap-1.5 align-baseline">
      <span className={`min-w-[26px] h-6 px-1 rounded-md border-2 text-[11px] font-bold inline-flex items-center justify-center tabular-nums ${numBox}`}>
        {number}
      </span>
      <input
        type="text"
        value={typeof answer === 'string' ? answer : ''}
        onChange={(e) => onAnswer(e.target.value)}
        onFocus={onFocus}
        className={`px-2 py-1 rounded border-2 bg-white text-sm text-[#2D1B4E] focus:outline-none min-w-[100px] max-w-[200px] transition-colors ${
          isActive ? 'border-[#5A3D7A]' : 'border-gray-400'
        }`}
      />
      {allowReveal && (
        <button
          onClick={() => setRevealed((v) => !v)}
          title={revealed ? 'Hide' : 'Check answer'}
          className="text-[10px] font-semibold text-[#5A3D7A]/70 hover:text-[#5A3D7A]"
        >
          {revealed ? '⤴' : '👁'}
        </button>
      )}
      {revealed && (
        <span className="text-[11px] text-emerald-700 font-mono bg-emerald-50 border border-emerald-200 rounded px-1.5">
          {q.accepted[0]}
        </span>
      )}
    </span>
  );
}

/** Table container — title header + rows of "label | value" where value
 *  can be a pre-filled string or a blank pointing at a fill question. */
function CBTTableLayoutRenderer({
  layout, section, sectionIndex, answers, setAnswer, activeQIndex, setActiveQIndex, allowReveal,
}: {
  layout:          TableLayout;
  section:         ListeningSection;
  sectionIndex:    number;
  answers:         StudentAnswers;
  setAnswer:       (qId: string, val: string) => void;
  activeQIndex:    number;
  setActiveQIndex: (i: number) => void;
  allowReveal?:    boolean;
}) {
  return (
    <div className="rounded-lg border-2 border-[#C8A8DC] overflow-hidden bg-white">
      <div className="bg-[#F0E5FF] px-4 py-2 text-center">
        <p className="text-sm font-bold text-[#2D1B4E]">{layout.title}</p>
      </div>
      <div className="divide-y divide-[#E8D5F0]">
        {layout.rows.map((row, i) => {
          const isBlank = typeof row.value !== 'string';
          const blankVal = isBlank ? row.value as Exclude<typeof row.value, string> : null;
          const q = blankVal ? section.questions.find((qq) => qq.id === blankVal.questionId) : null;
          const qIdx = q ? section.questions.indexOf(q) : -1;
          const isFillQ = !!q && 'accepted' in q && 'wordLimit' in q;
          return (
            <div key={i} className="grid grid-cols-[minmax(140px,1fr)_2fr] gap-3 px-4 py-2.5 items-center">
              <span className="text-sm text-[#2D1B4E]/80">{row.label}</span>
              <span className="text-sm text-[#2D1B4E] flex flex-wrap items-baseline gap-1.5">
                {isBlank && isFillQ ? (
                  <>
                    <CBTLayoutBlank
                      q={q as ListeningQuestion & { accepted: string[]; wordLimit: number }}
                      sectionIndex={sectionIndex}
                      qIndexInSection={qIdx}
                      answer={answers[q.id]}
                      onAnswer={(v) => { setAnswer(q.id, v); setActiveQIndex(qIdx); }}
                      onFocus={() => setActiveQIndex(qIdx)}
                      isActive={activeQIndex === qIdx}
                      allowReveal={allowReveal}
                    />
                    {blankVal?.suffix && <span className="text-[#2D1B4E]">{blankVal.suffix}</span>}
                  </>
                ) : (
                  <span>{row.value as string}</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Flow-chart container — titled sequence of boxed steps with ↓ arrows. */
function CBTFlowChartLayoutRenderer({
  layout, section, sectionIndex, answers, setAnswer, activeQIndex, setActiveQIndex, allowReveal,
}: {
  layout:          FlowChartLayout;
  section:         ListeningSection;
  sectionIndex:    number;
  answers:         StudentAnswers;
  setAnswer:       (qId: string, val: string) => void;
  activeQIndex:    number;
  setActiveQIndex: (i: number) => void;
  allowReveal?:    boolean;
}) {
  return (
    <div>
      <p className="text-sm font-bold text-[#2D1B4E] text-center mb-2">{layout.title}</p>
      <div className="space-y-0">
        {layout.steps.map((step, i) => (
          <div key={i}>
            {i > 0 && (
              <div className="text-center text-[#5A3D7A]/60 text-xl leading-none py-1" aria-hidden>↓</div>
            )}
            <div className="rounded-lg border-2 border-[#C8A8DC] bg-white px-4 py-3">
              {step.kind === 'text' ? (
                <p className="text-sm text-[#2D1B4E]">{step.text}</p>
              ) : (() => {
                const q = section.questions.find((qq) => qq.id === step.questionId);
                if (!q || !('accepted' in q) || !('wordLimit' in q)) {
                  return <p className="text-xs text-red-600">Missing question: {step.questionId}</p>;
                }
                const qIdx = section.questions.indexOf(q);
                return (
                  <p className="text-sm text-[#2D1B4E] flex flex-wrap items-baseline gap-1.5">
                    {step.contextBefore && <span>{step.contextBefore}</span>}
                    <CBTLayoutBlank
                      q={q as ListeningQuestion & { accepted: string[]; wordLimit: number }}
                      sectionIndex={sectionIndex}
                      qIndexInSection={qIdx}
                      answer={answers[q.id]}
                      onAnswer={(v) => { setAnswer(q.id, v); setActiveQIndex(qIdx); }}
                      onFocus={() => setActiveQIndex(qIdx)}
                      isActive={activeQIndex === qIdx}
                      allowReveal={allowReveal}
                    />
                    {step.contextAfter && <span>{step.contextAfter}</span>}
                  </p>
                );
              })()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Question card ──────────────────────────────────────────────────

function QuestionCard({
  q,
  index,
  answer,
  onAnswer,
  onFocus,
  isActive,
  showAnswer,
  allowReveal,
  correctInline,
}: {
  q: ListeningQuestion;
  index: number;                         // 0-based absolute question index (across all 40)
  answer: string | string[] | undefined;
  onAnswer: (val: string | string[]) => void;
  onFocus?: () => void;                  // fired when user interacts — parent sets active question
  isActive?: boolean;                    // highlights the number box like the real CBT
  showAnswer?: boolean;                  // review mode: force reveal
  allowReveal?: boolean;                 // practice mode: opt-in reveal via a button
  correctInline?: boolean;               // grade badge after submit
}) {
  const number = index + 1;
  const [revealed, setRevealed] = useState(false);
  const displayAnswer = showAnswer || revealed;

  // Small helper — canonical accepted answer string for the reveal.
  const canonical =
    q.type === 'multiple-choice' || q.type === 'matching' || q.type === 'plan-map-labelling'
      ? (q.options.find((o) => o.id === q.correct)?.text ?? q.correct)
      : q.type === 'multiple-choice-multi'
        ? q.correct.map((id) => q.options.find((o) => o.id === id)?.text ?? id).join(' + ')
        : q.accepted[0];

  const numBox = isActive
    ? 'border-[#5A3D7A] bg-[#5A3D7A] text-white'
    : 'border-[#2D1B4E]/60 text-[#2D1B4E] bg-white';

  return (
    <div className="py-3" onMouseDown={onFocus} onFocus={onFocus}>
      <div className="flex items-start gap-3">
        <span className={`flex-shrink-0 min-w-[28px] h-7 px-1.5 rounded-md border-2 text-xs font-bold flex items-center justify-center tabular-nums ${numBox}`}>
          {number}
        </span>
        <div className="flex-1 min-w-0 space-y-2">
          {/* Prompt */}
          <p className="text-sm text-[#2D1B4E] leading-snug">
            {q.prompt}
          </p>

          {/* Single-answer MCQ — radios. */}
          {q.type === 'multiple-choice' && (
            <div className="space-y-1 pl-1">
              {q.options.map((opt) => {
                const selected = answer === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => onAnswer(opt.id)}
                    className="w-full text-left px-1 py-1 flex items-center gap-2.5 text-sm rounded hover:bg-[#F0E5FF]/40 transition-colors"
                  >
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selected ? 'border-[#5A3D7A]' : 'border-gray-400'
                    }`}>
                      {selected && <span className="w-2 h-2 rounded-full bg-[#5A3D7A]" />}
                    </span>
                    <span className={selected ? 'text-[#2D1B4E] font-semibold' : 'text-[#2D1B4E]'}>{opt.text}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Multi-select MCQ — checkboxes with "Choose N" hint. */}
          {q.type === 'multiple-choice-multi' && (
            <div className="space-y-1 pl-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A3D7A]/70 mb-1">
                Choose {q.pickCount === 3 ? 'THREE' : 'TWO'}
                {Array.isArray(answer) && answer.length > 0 && (
                  <span className="ml-2 text-[#5A3D7A] font-mono">({answer.length}/{q.pickCount})</span>
                )}
              </p>
              {q.options.map((opt) => {
                const chosen = Array.isArray(answer) ? answer.includes(opt.id) : false;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      const current = Array.isArray(answer) ? [...answer] : [];
                      if (chosen) onAnswer(current.filter((x) => x !== opt.id));
                      else if (current.length < q.pickCount) onAnswer([...current, opt.id]);
                    }}
                    className="w-full text-left px-1 py-1 flex items-center gap-2.5 text-sm rounded hover:bg-[#F0E5FF]/40 transition-colors"
                  >
                    <span className={`w-4 h-4 border-2 flex items-center justify-center flex-shrink-0 ${
                      chosen ? 'border-[#5A3D7A] bg-[#5A3D7A] text-white' : 'border-gray-400'
                    }`}>
                      {chosen && <span className="text-[10px] leading-none">✓</span>}
                    </span>
                    <span className={chosen ? 'text-[#2D1B4E] font-semibold' : 'text-[#2D1B4E]'}>{opt.text}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Matching / plan-map-labelling — dropdown, since sibling Qs share
              the same option bank (shown once above the group in the runner). */}
          {(q.type === 'matching' || q.type === 'plan-map-labelling') && (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-[#2D1B4E] flex-1 min-w-[140px]">
                {q.type === 'matching' ? q.leftItem : q.labelSpot}
              </span>
              <select
                value={typeof answer === 'string' ? answer : ''}
                onChange={(e) => onAnswer(e.target.value)}
                onFocus={onFocus}
                className={`px-3 py-1.5 rounded border-2 bg-white text-sm text-[#2D1B4E] focus:outline-none min-w-[80px] transition-colors ${
                  isActive ? 'border-[#5A3D7A]' : 'border-gray-400'
                }`}
              >
                <option value="">— select —</option>
                {q.options.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.id.toUpperCase()}. {opt.text}</option>
                ))}
              </select>
            </div>
          )}

          {(q.type === 'form-completion' || q.type === 'note-completion'
            || q.type === 'table-completion' || q.type === 'summary-completion'
            || q.type === 'sentence-completion' || q.type === 'flow-chart-completion'
            || q.type === 'short-answer') && (
            <div className="flex items-center gap-2 flex-wrap">
              {q.contextBefore && (
                <span className="text-sm text-[#2D1B4E] whitespace-nowrap">{q.contextBefore}</span>
              )}
              <input
                type="text"
                value={typeof answer === 'string' ? answer : ''}
                onChange={(e) => onAnswer(e.target.value)}
                onFocus={onFocus}
                className={`px-2 py-1 rounded border-2 bg-white text-sm text-[#2D1B4E] focus:outline-none min-w-[160px] max-w-[280px] transition-colors ${
                  isActive ? 'border-[#5A3D7A]' : 'border-gray-400'
                }`}
              />
              {q.contextAfter && (
                <span className="text-sm text-[#2D1B4E] whitespace-nowrap">{q.contextAfter}</span>
              )}
            </div>
          )}

          {/* Practice: opt-in reveal via a small button (hidden until clicked). */}
          {allowReveal && !showAnswer && (
            <button
              onClick={() => setRevealed((v) => !v)}
              className="mt-1 text-[11px] font-semibold text-[#5A3D7A]/80 hover:text-[#5A3D7A] underline decoration-dotted underline-offset-2"
            >
              {revealed ? '⤴ Hide answer' : '👁 Check answer'}
            </button>
          )}

          {/* Answer reveal (practice-revealed or review). */}
          {displayAnswer && (
            <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
              <span className="text-emerald-600 text-sm">✓</span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-emerald-800">Answer: {canonical}</p>
                {q.teacherNote && (
                  <p className="text-[11px] text-emerald-700/80 italic mt-0.5">{q.teacherNote}</p>
                )}
              </div>
            </div>
          )}

          {/* Grade badge (review after submit) */}
          {correctInline !== undefined && (
            <div className={`mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              correctInline ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
            }`}>
              {correctInline ? '✓ Correct' : `✗ Correct answer: ${canonical}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Audio panel ────────────────────────────────────────────────────

function AudioPanel({
  section,
  mode,
  onAudioReady,
  teacherId,
}: {
  section: ListeningSection;
  mode: ListeningSessionMode;
  // Signature widened so the panel reports back HOW the audio was produced
  // — the page uses that tag when persisting the binding to Firestore so we
  // can later distinguish "regenerated" from "manually uploaded" audios.
  onAudioReady: (url: string, source: AudioSource) => void;
  teacherId: string;
}) {
  const [manualUrl, setManualUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateProgress, setGenerateProgress] = useState<string>('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function handleFile(file: File) {
    setUploadError(null);
    if (!file.type.startsWith('audio/')) {
      setUploadError('Debe ser un archivo de audio.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setUploadError(`Muy grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Máximo 25 MB.`);
      return;
    }
    setUploading(true);
    try {
      const ext = (file.name.match(/\.[a-zA-Z0-9]+$/)?.[0] || '.mp3').toLowerCase();
      const path = `audio/ielts-${section.number}-${teacherId}-${Date.now()}${ext}`;
      const ref = storageRef(storage, path);
      await uploadBytes(ref, file, { contentType: file.type });
      const url = await getDownloadURL(ref);
      onAudioReady(url, 'uploaded');
    } catch (err) {
      setUploadError('Firebase Storage: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  // Generate the full section audio in one shot: builds the segments array
  // from the script + speaker voice IDs, hits our proxy endpoint (which
  // generates each line and stitches them), then uploads the resulting
  // MP3 to Firebase Storage so it's stable across reloads.
  async function handleGenerateDialogue() {
    setGenerateError(null);
    setGenerateProgress('Preparing segments…');

    const speakerMap = new Map(section.speakers.map((s) => [s.id, s]));
    const segments = section.script.map((line) => {
      const spk = speakerMap.get(line.speakerId);
      return { voiceId: spk?.suggestedVoice.voiceId ?? '', text: line.text };
    });
    const missing = segments.find((s) => !s.voiceId);
    if (missing) {
      setGenerateError('Algún speaker no tiene voiceId configurado en el mock.');
      return;
    }

    setGenerating(true);
    try {
      setGenerateProgress(`Generando con ElevenLabs (${segments.length} líneas · puede tomar 30-60s)…`);
      const res = await fetch('/api/tts/elevenlabs-dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segments }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setGenerateError('ElevenLabs: ' + (data.error ?? `HTTP ${res.status}`));
        return;
      }
      const blob = await res.blob();

      setGenerateProgress('Subiendo a Firebase Storage…');
      const path = `audio/ielts-${section.number}-dialogue-${teacherId}-${Date.now()}.mp3`;
      const ref = storageRef(storage, path);
      await uploadBytes(ref, blob, { contentType: 'audio/mpeg' });
      const url = await getDownloadURL(ref);
      onAudioReady(url, 'generated');
      setGenerateProgress('');
    } catch (err) {
      setGenerateError((err instanceof Error ? err.message : String(err)));
    } finally {
      setGenerating(false);
    }
  }

  if (section.audioUrl) {
    return (
      <div className="bg-gradient-to-br from-[#5A3D7A] to-[#9B7CB8] rounded-2xl p-4 text-white shadow-md">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/70 mb-2">
          Section {section.number} audio
        </p>
        <AudioWithSpeed
          src={section.audioUrl}
          mode={mode}
          autoPlay={mode === 'exam'}
          tone="dark"
        />
        {mode === 'exam' && (
          <p className="text-[10px] text-white/60 mt-2 italic">Exam mode: audio plays once, no pause.</p>
        )}
      </div>
    );
  }

  // No audio yet — teacher can generate via ElevenLabs (primary), paste
  // an existing URL, or upload an MP3 they made elsewhere.
  const isDialogue = section.speakers.length > 1;
  return (
    <div className="bg-white rounded-2xl border-2 border-dashed border-[#C8A8DC] p-4 space-y-3">
      <p className="text-[11px] font-bold text-[#5A3D7A] uppercase tracking-widest">
        Audio Section {section.number} — sin cargar
      </p>

      {/* Primary CTA: one-click generation via ElevenLabs using the pre-mapped voice IDs. */}
      <div className="bg-gradient-to-br from-[#F9F5FF] to-[#F0E5FF] border border-[#C8A8DC] rounded-xl p-3 space-y-2">
        <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.25em]">
          🎙 Vía ElevenLabs (recomendado)
        </p>
        <p className="text-[11px] text-[#5A3D7A]/80 leading-snug">
          {isDialogue
            ? `Genera el diálogo completo (${section.script.length} líneas · ${section.speakers.length} voces) en un solo click. Cada línea sale con la voz del speaker correspondiente y se stitchean server-side.`
            : `Genera el audio del monólogo (${section.script.length} líneas · voz ${section.speakers[0]?.suggestedVoice.name}).`}
        </p>
        <button
          onClick={handleGenerateDialogue}
          disabled={generating}
          className="w-full py-2 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white rounded-full text-xs font-bold shadow hover:shadow-lg disabled:opacity-50 transition-all"
        >
          {generating
            ? (generateProgress || 'Generando…')
            : `🎙 Generar ${isDialogue ? 'diálogo' : 'audio'} con ElevenLabs`}
        </button>
        {generateError && <p className="text-[10px] text-red-500">{generateError}</p>}
      </div>

      {/* Fallback: paste URL or upload from disk. */}
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">O alternativamente:</p>
        <div className="flex gap-2">
          <input
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="https:// (URL del MP3)"
            className="flex-1 min-w-0 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-mono focus:outline-none focus:border-[#9B7CB8]"
          />
          <button
            onClick={() => manualUrl.trim() && onAudioReady(manualUrl.trim(), 'url')}
            disabled={!manualUrl.trim()}
            className="px-3 py-1.5 bg-[#F0E5FF] hover:bg-[#E0C8F0] text-[#5A3D7A] rounded-lg text-xs font-bold disabled:opacity-50"
          >
            Usar URL
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="px-3 py-1.5 border border-[#C8A8DC] text-[#5A3D7A] rounded-lg text-xs font-bold hover:bg-[#F0E5FF] disabled:opacity-50"
          >
            {uploading ? '…' : '📤 Subir'}
          </button>
        </div>
        {uploadError && <p className="text-[10px] text-red-500 mt-1">{uploadError}</p>}
      </div>
    </div>
  );
}

// ─── Script preview (collapsible) ───────────────────────────────────

function ScriptPreview({ section }: { section: ListeningSection }) {
  const [open, setOpen] = useState(false);

  const speakerMap = useMemo(
    () => Object.fromEntries(section.speakers.map((s) => [s.id, s])),
    [section.speakers],
  );

  return (
    <div className="bg-[#FDFAFF] rounded-2xl border border-[#E8D5F0] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-left"
      >
        <span className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.25em]">
          📄 Script + Voice hints (ElevenLabs)
        </span>
        <span className="text-xs text-[#5A3D7A]">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          <div className="text-[11px] text-gray-600 space-y-1">
            {section.speakers.map((s) => (
              <div key={s.id} className="flex items-start gap-2">
                <span className="font-bold text-[#5A3D7A]">{s.displayName}</span>
                <span className="text-gray-500">
                  · {s.accent} {s.gender === 'f' ? '♀' : '♂'} · <span className="italic">use voice: {s.suggestedVoice.name}</span>
                  {s.suggestedVoice.note && <span className="text-gray-400"> — {s.suggestedVoice.note}</span>}
                </span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3 max-h-64 overflow-y-auto space-y-1.5 text-xs font-mono leading-relaxed">
            {section.script.map((line, i) => {
              const spk = speakerMap[line.speakerId];
              return (
                <div key={i}>
                  <span className="text-[#9B7CB8] font-bold">{spk?.displayName ?? line.speakerId}:</span>{' '}
                  <span className="text-gray-700">{line.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Results view ───────────────────────────────────────────────────

function ResultsView({ mock, result, onReset }: { mock: ListeningMock; result: GradeResult; onReset: () => void }) {
  return (
    <div className="space-y-6">
      {/* Hero band score */}
      <div className="bg-gradient-to-br from-[#5A3D7A] to-[#9B7CB8] rounded-3xl p-6 text-white shadow-xl text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70 mb-1">Your band</p>
        <p className="font-serif text-6xl font-bold leading-none">{result.band.toFixed(1)}</p>
        <p className="text-sm text-white/80 mt-1">{result.bandLabel}</p>
        <p className="text-xs text-white/60 mt-3">{result.rawScore} of 40 correct</p>
      </div>

      {/* Section breakdown */}
      <div className="bg-white rounded-2xl border border-[#E8D5F0] shadow-sm p-4">
        <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.25em] mb-3">By section</p>
        <div className="space-y-2">
          {result.sectionBreakdown.map((s) => (
            <div key={s.section} className="flex items-center gap-3">
              <span className="w-24 text-xs font-semibold text-gray-600">Section {s.section}</span>
              <div className="flex-1 h-2 bg-[#F0E5FF] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] rounded-full transition-[width]"
                  style={{ width: `${s.pct}%` }}
                />
              </div>
              <span className="w-16 text-right text-xs font-mono tabular-nums text-[#5A3D7A]">{s.correct}/{s.total}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Type breakdown */}
      <div className="bg-white rounded-2xl border border-[#E8D5F0] shadow-sm p-4">
        <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.25em] mb-3">By question type</p>
        <div className="space-y-2">
          {result.typeBreakdown.map((t) => (
            <div key={t.type} className="flex items-center gap-3">
              <span className="w-40 text-xs font-semibold text-gray-600 capitalize">{t.type.replace(/-/g, ' ')}</span>
              <div className="flex-1 h-2 bg-[#F0E5FF] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] rounded-full" style={{ width: `${t.pct}%` }} />
              </div>
              <span className="w-16 text-right text-xs font-mono tabular-nums text-[#5A3D7A]">{t.correct}/{t.total}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cognitive breakdown */}
      <div className="bg-white rounded-2xl border border-[#E8D5F0] shadow-sm p-4">
        <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.25em] mb-3">By cognitive load</p>
        <div className="space-y-2">
          {result.cognitiveBreakdown.map((c) => (
            <div key={c.load} className="flex items-center gap-3">
              <span className="w-24 text-xs font-semibold text-gray-600 capitalize">{c.load}</span>
              <div className="flex-1 h-2 bg-[#F0E5FF] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] rounded-full" style={{ width: `${c.pct}%` }} />
              </div>
              <span className="w-16 text-right text-xs font-mono tabular-nums text-[#5A3D7A]">{c.correct}/{c.total}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
          <p className="text-[10px] font-black text-amber-800 uppercase tracking-[0.25em]">💡 Next steps</p>
          <ul className="space-y-2">
            {result.recommendations.map((r, i) => (
              <li key={i} className="text-xs text-amber-900 leading-relaxed flex items-start gap-2">
                <span className="text-amber-500">→</span>
                <span>{r.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Question-by-question review with trap analysis */}
      <div className="bg-white rounded-2xl border border-[#E8D5F0] shadow-sm p-4 space-y-3">
        <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.25em]">Question-by-question review</p>
        <div className="space-y-1">
          {result.perQuestion.map((m, i) => (
            <div key={m.questionId} className="flex items-center gap-3 text-xs py-1">
              <span className={`w-6 text-center font-mono ${m.correct ? 'text-emerald-600' : 'text-red-500'}`}>
                {i + 1}
              </span>
              <span className={m.correct ? 'text-emerald-600' : 'text-red-500'}>
                {m.correct ? '✓' : '✗'}
              </span>
              <span className="flex-1 min-w-0 text-gray-700 truncate">
                {m.correct
                  ? <span className="italic text-gray-400">Correct</span>
                  : <>Your answer: <span className="font-mono">{Array.isArray(m.studentAnswer) ? m.studentAnswer.join(', ') : m.studentAnswer ?? '(blank)'}</span> · Expected: <span className="font-mono text-[#5A3D7A]">{m.acceptedAnswer}</span></>
                }
              </span>
              {m.trapMatched && (
                <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                  ⚠ trap: {m.trapMatched.split('(')[0].trim()}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-3">
        <button
          onClick={onReset}
          className="px-6 py-2.5 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white rounded-full text-sm font-bold shadow hover:shadow-lg active:scale-95"
        >
          ↻ Reintentar en Practice Mode
        </button>
      </div>

      <div className="text-center text-[10px] text-gray-400">
        Mock {mock.id} · Enviado {new Date(result.submittedAt).toLocaleString('es-CL')}
      </div>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────

export default function IELTSListeningPage() {
  // Auth (bypass useAuthStore hydration bug — same pattern used elsewhere).
  const [teacherId, setTeacherId] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  useEffect(() => {
    const auth = getAuth();
    if (auth.currentUser) {
      setTeacherId(auth.currentUser.uid);
      setStudentName(auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Candidate');
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setTeacherId(u?.uid ?? '');
      setStudentName(u?.displayName || u?.email?.split('@')[0] || 'Candidate');
    });
    return () => unsub();
  }, []);

  // Only one mock ships in this MVP; when Mock 2 lands we'll add a picker
  // and swap this constant for state.
  const mock = MOCKS[0];

  const [phase, setPhase] = useState<'landing' | 'running' | 'results'>('landing');
  const [mode, setMode] = useState<ListeningSessionMode>('exam');
  const [currentSection, setCurrentSection] = useState<0 | 1 | 2 | 3>(0);
  const [activeQIndex, setActiveQIndex] = useState<number>(0);   // 0-based within the section
  const [answers, setAnswers] = useState<StudentAnswers>({});
  const [result, setResult] = useState<GradeResult | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);

  // Persisted audio URLs per section (hydrated from Firestore on mount, saved
  // on every generate/upload/url-set). Once written, the same URL survives
  // reloads and future sessions — no more paying ElevenLabs twice for the
  // same audio.
  const [sessionAudioUrls, setSessionAudioUrls] = useState<Record<number, string>>({});
  const [audiosLoading, setAudiosLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) return;
    let alive = true;
    (async () => {
      try {
        const bindings = await loadMockAudioBindings(teacherId, mock.id);
        if (!alive) return;
        setSessionAudioUrls(bindings as Record<number, string>);
      } catch (err) {
        console.error('[ielts-listening] failed to hydrate audio bindings:', err);
      } finally {
        if (alive) setAudiosLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [teacherId, mock.id]);

  async function persistAudioBinding(sectionNumber: 1 | 2 | 3 | 4, url: string, source: AudioSource) {
    setSessionAudioUrls((prev) => ({ ...prev, [sectionNumber]: url }));
    if (!teacherId) return;
    try {
      await saveAudioBinding({ teacherId, mockId: mock.id, sectionNumber, audioUrl: url, source });
    } catch (err) {
      console.error('[ielts-listening] failed to save audio binding:', err);
      // Non-blocking — the audio still works this session; next session it
      // just won't hydrate. Better than failing the whole flow.
    }
  }

  async function clearAudioBinding(sectionNumber: 1 | 2 | 3 | 4) {
    setSessionAudioUrls((prev) => {
      const next = { ...prev };
      delete next[sectionNumber];
      return next;
    });
    if (!teacherId) return;
    try {
      await deleteAudioBinding(teacherId, mock.id, sectionNumber);
    } catch (err) {
      console.error('[ielts-listening] failed to clear audio binding:', err);
    }
  }

  // Whole-mock timer — 30 min like the real IELTS Listening CBT.
  const TOTAL_SEC = 30 * 60;
  const [timeLeft, setTimeLeft] = useState(TOTAL_SEC);
  const [timerRunning, setTimerRunning] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!timerRunning) {
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
      return;
    }
    tickRef.current = setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? (queueMicrotask(() => setTimerRunning(false)), 0) : t - 1));
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [timerRunning]);

  function startMock() {
    setPhase('running');
    setCurrentSection(0);
    setActiveQIndex(0);
    setAnswers({});
    setTimeLeft(TOTAL_SEC);
    setTimerRunning(true);
  }

  function goToNextSection() {
    if (currentSection >= 3) return;
    setCurrentSection((s) => (s + 1) as 0 | 1 | 2 | 3);
    setActiveQIndex(0);
  }

  function goToSection(section: 0 | 1 | 2 | 3, qIndex: number) {
    setCurrentSection(section);
    setActiveQIndex(Math.max(0, Math.min(mock.sections[section].questions.length - 1, qIndex)));
  }

  function goPrev() {
    if (activeQIndex > 0) { setActiveQIndex(activeQIndex - 1); return; }
    if (currentSection > 0) {
      const prevSec = (currentSection - 1) as 0 | 1 | 2 | 3;
      setCurrentSection(prevSec);
      setActiveQIndex(mock.sections[prevSec].questions.length - 1);
    }
  }

  function goNext() {
    const secQs = mock.sections[currentSection].questions.length;
    if (activeQIndex < secQs - 1) { setActiveQIndex(activeQIndex + 1); return; }
    if (currentSection < 3) goToNextSection();
  }

  function submitMock() {
    setTimerRunning(false);
    const graded = gradeAnswers(answers, mock);
    setResult(graded);
    setPhase('results');
  }

  function resetToPractice() {
    setPhase('landing');
    setResult(null);
    setAnswers({});
    setMode('practice');
    setCurrentSection(0);
  }

  const activeSection = mock.sections[currentSection];

  function fmt(s: number): string {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  // ─── CBT running phase (early return) ─────────────────────────────
  if (phase === 'running') {
    const audioUrl = sessionAudioUrls[activeSection.number];
    const groups = groupQuestions(activeSection.questions);
    const partFromQ = currentSection * 10 + 1;
    const partToQ   = currentSection * 10 + activeSection.questions.length;
    const minutesLeft = Math.max(0, Math.ceil(timeLeft / 60));
    const cid = candidateIdFrom(teacherId);

    return (
      <div className="min-h-screen bg-white text-[#2D1B4E] flex flex-col">
        <CBTHeader
          studentName={studentName}
          candidateId={cid}
          timeMinutesLeft={minutesLeft}
          audioPlaying={audioPlaying}
          onMenu={() => {
            if (confirm('¿Salir del test? Se pierde el progreso actual.')) {
              setPhase('landing');
              setTimerRunning(false);
            }
          }}
        />

        <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-4">
          {/* Compact audio block — lavender, sits under the header */}
          {audiosLoading ? (
            <div className="mb-4 rounded-lg border border-[#E8D5F0] bg-[#FDFAFF] p-3 flex items-center gap-2 text-xs text-gray-500">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-[#C8A8DC] border-t-transparent animate-spin" />
              Cargando audio…
            </div>
          ) : audioUrl ? (
            <div className="mb-4 rounded-lg bg-[#F0E5FF] border border-[#C8A8DC]/60 px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.25em]">
                  Part {activeSection.number} · {activeSection.title}
                </span>
                {mode !== 'exam' && (
                  <button
                    onClick={() => {
                      if (confirm('¿Borrar este audio y generar uno nuevo? Consume tokens de ElevenLabs otra vez.')) {
                        clearAudioBinding(activeSection.number);
                      }
                    }}
                    className="text-[10px] font-semibold text-[#5A3D7A]/70 hover:text-[#5A3D7A] underline"
                  >
                    🔄 Regenerar
                  </button>
                )}
              </div>
              <AudioWithSpeed
                src={audioUrl}
                mode={mode}
                autoPlay={mode === 'exam'}
                tone="light"
                onPlayingChange={setAudioPlaying}
              />
              {mode === 'exam' && (
                <p className="text-[10px] text-[#5A3D7A]/70 italic mt-1">Exam mode: audio plays once, no pause.</p>
              )}
            </div>
          ) : (
            <div className="mb-4">
              <AudioPanel
                section={activeSection}
                mode={mode}
                onAudioReady={(url, source) => persistAudioBinding(activeSection.number, url, source)}
                teacherId={teacherId}
              />
            </div>
          )}

          {/* Script preview only in practice/review */}
          {mode !== 'exam' && (
            <div className="mb-4">
              <ScriptPreview section={activeSection} />
            </div>
          )}

          <CBTPartBanner part={activeSection.number} from={partFromQ} to={partToQ} />

          {groups.map((g) => {
            const groupFrom = currentSection * 10 + g.startIndex + 1;
            const groupTo   = currentSection * 10 + g.endIndex + 1;
            const isMatchGroup = g.type === 'matching' || g.type === 'plan-map-labelling';
            const bank = isMatchGroup
              ? ((g.questions[0] as { options?: { id: string; text: string }[] }).options ?? [])
              : [];

            // Find a matching structural layout for this group. Layouts win
            // over the default group renderer for their referenced questions.
            const matchedTable: TableLayout | undefined =
              g.type === 'table-completion' && activeSection.tableLayouts
                ? activeSection.tableLayouts.find((t) =>
                    t.rows.some((r) => {
                      const v = r.value;
                      if (typeof v === 'string') return false;
                      return g.questions.some((q) => q.id === v.questionId);
                    }))
                : undefined;

            const matchedFlow: FlowChartLayout | undefined =
              g.type === 'flow-chart-completion' && activeSection.flowChartLayouts
                ? activeSection.flowChartLayouts.find((f) =>
                    f.steps.some((s) =>
                      s.kind === 'blank' && g.questions.some((q) => q.id === s.questionId)))
                : undefined;

            const setAnswer = (qId: string, val: string) =>
              setAnswers((prev) => ({ ...prev, [qId]: val }));

            const renderCard = (q: ListeningQuestion, i: number) => {
              const qIdxInSec = g.startIndex + i;
              return (
                <QuestionCard
                  key={q.id}
                  q={q}
                  index={currentSection * 10 + qIdxInSec}
                  answer={answers[q.id]}
                  onAnswer={(val) => {
                    setAnswers((prev) => ({ ...prev, [q.id]: val }));
                    setActiveQIndex(qIdxInSec);
                  }}
                  onFocus={() => setActiveQIndex(qIdxInSec)}
                  isActive={activeQIndex === qIdxInSec}
                  allowReveal={mode === 'practice'}
                />
              );
            };

            return (
              <div key={`g-${g.startIndex}`} className="mb-6">
                <CBTQuestionsHeading from={groupFrom} to={groupTo} instructions={groupInstructions(g)} />

                {/* Shared option bank for matching / plan-map-labelling. */}
                {isMatchGroup && bank.length > 0 && (
                  <div className="mb-3 rounded-lg bg-[#FDFAFF] border border-[#E8D5F0] px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#5A3D7A]/70 mb-1.5">Options</p>
                    <div className="grid gap-1 text-sm text-[#2D1B4E]">
                      {bank.map((opt) => (
                        <div key={opt.id} className="flex items-baseline gap-2">
                          <span className="font-bold text-[#5A3D7A] w-5 shrink-0">{opt.id.toUpperCase()}</span>
                          <span>{opt.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {matchedTable ? (
                  <CBTTableLayoutRenderer
                    layout={matchedTable}
                    section={activeSection}
                    sectionIndex={currentSection}
                    answers={answers}
                    setAnswer={setAnswer}
                    activeQIndex={activeQIndex}
                    setActiveQIndex={setActiveQIndex}
                    allowReveal={mode === 'practice'}
                  />
                ) : matchedFlow ? (
                  <CBTFlowChartLayoutRenderer
                    layout={matchedFlow}
                    section={activeSection}
                    sectionIndex={currentSection}
                    answers={answers}
                    setAnswer={setAnswer}
                    activeQIndex={activeQIndex}
                    setActiveQIndex={setActiveQIndex}
                    allowReveal={mode === 'practice'}
                  />
                ) : (
                  <div className="border-t border-[#E8D5F0] divide-y divide-[#E8D5F0]">
                    {g.questions.map((q, i) => renderCard(q, i))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Timer pause (only in practice — exam should not pause). */}
          {mode !== 'exam' && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setTimerRunning((r) => !r)}
                className="text-[11px] font-semibold text-[#5A3D7A] hover:text-[#2D1B4E] underline"
              >
                {timerRunning ? `❚❚ Pausar timer (${fmt(timeLeft)})` : `▶ Reanudar (${fmt(timeLeft)})`}
              </button>
            </div>
          )}
        </div>

        <CBTFooter
          mock={mock}
          currentSection={currentSection}
          activeQIndex={activeQIndex}
          answers={answers}
          onGoTo={goToSection}
          onPrev={goPrev}
          onNext={goNext}
          onSubmit={submitMock}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#FFFCF7] text-[#2D1B4E]">
      {/* Ambient background (same treatment as Speaking Mocks) */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(90,61,122,1) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(90,61,122,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(circle at 50% 30%, black 40%, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 30%, black 40%, transparent 90%)',
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
          title="IELTS Listening Mocks"
          subtitle={`${mock.sections.length} secciones · 40 preguntas · ~30 min de audio`}
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Tools', href: '/dashboard/teacher/tools' },
            { label: 'IELTS Listening' },
          ]}
        />

        <div className="max-w-4xl mx-auto mt-8">

          {/* ─── LANDING ─── */}
          {phase === 'landing' && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#5A3D7A] bg-[#F0E5FF] border border-[#C8A8DC]/60 px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E8B547] animate-pulse" />
                  Listening Simulator
                </span>
                <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#2D1B4E] leading-tight tracking-tight">
                  IELTS<span className="text-[#E8B547]">®</span> Listening Mock
                </h1>
                <p className="text-sm text-[#5A3D7A]/70 max-w-lg mx-auto">
                  Four sections, 40 questions, one continuous audio play. Same format as the real exam.
                </p>
              </div>

              {/* Mock selector */}
              <div className="bg-white rounded-3xl border border-[#E8D5F0] shadow-md p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.25em]">
                      Available mock
                    </p>
                    <h2 className="font-serif text-2xl font-bold text-[#2D1B4E] mt-1">{mock.title}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {mock.level} · Target band {mock.targetBandRange[0]}-{mock.targetBandRange[1]}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#F0E5FF] text-[#5A3D7A]">
                    {mock.sections.length} × sections
                  </span>
                </div>

                {/* Section previews */}
                <div className="grid grid-cols-2 gap-2">
                  {mock.sections.map((sec) => (
                    <div key={sec.number} className="bg-[#FDFAFF] border border-[#E8D5F0] rounded-xl p-3">
                      <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.25em]">
                        Section {sec.number}
                      </p>
                      <p className="text-sm font-semibold text-[#2D1B4E] mt-0.5 truncate">{sec.title}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {sec.contextType.replace(/-/g, ' ')} · {sec.speakers.length} speaker{sec.speakers.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mode selector */}
              <div className="bg-white rounded-3xl border border-[#E8D5F0] shadow-md p-5 space-y-3">
                <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.25em]">Mode</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: 'exam', title: 'Exam', desc: 'Single play, no pause. Realistic timing. Answers hidden until submit.' },
                    { id: 'practice', title: 'Practice', desc: 'Pausable audio, per-question answer reveal, no strict timer.' },
                  ] as { id: ListeningSessionMode; title: string; desc: string }[]).map((m) => {
                    const active = mode === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        className={`text-left rounded-2xl p-3 border transition-all ${
                          active
                            ? 'bg-gradient-to-br from-[#5A3D7A] to-[#9B7CB8] border-transparent text-white shadow-md'
                            : 'bg-white border-[#E8D5F0] hover:border-[#C8A8DC] text-[#5A3D7A]'
                        }`}
                      >
                        <p className={`font-serif text-lg font-bold ${active ? 'text-white' : 'text-[#2D1B4E]'}`}>
                          {m.title}
                        </p>
                        <p className={`text-[11px] mt-0.5 ${active ? 'text-white/80' : 'text-gray-500'}`}>
                          {m.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Start CTA */}
              <div className="flex justify-center">
                <button
                  onClick={startMock}
                  className="px-8 py-3 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white rounded-full text-base font-bold shadow-lg shadow-[#5A3D7A]/25 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all"
                >
                  ▶ Start Listening Mock
                </button>
              </div>

              <p className="text-center text-[10px] text-gray-400">
                💡 Tip: Genera los audios en ElevenLabs con los scripts que se despliegan en cada sección. Súbelos aquí para reutilizarlos.
              </p>
            </div>
          )}

          {/* ─── RESULTS ─── */}
          {phase === 'results' && result && (
            <ResultsView mock={mock} result={result} onReset={resetToPractice} />
          )}
        </div>
      </div>
    </div>
  );
}

