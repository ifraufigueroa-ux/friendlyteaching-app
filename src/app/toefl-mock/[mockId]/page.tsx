// FriendlyTeaching.cl — TOEFL Full Mock runner (public)
//
// URL: /toefl-mock/{mockId}?name=…&email=…&teacherId=…
//
// Flow: landing (name/email) → intro → Reading → Listening → Speaking →
// Writing → grading → results (with PDF button).
//
// Data lives in Firestore `toeflSessions` (public create, teacher-owned).
// Audio for Listening is loaded from `toeflListeningAudios` when bound;
// falls back to a placeholder message otherwise (audio generation is a
// separate one-off script).

'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  collection, doc, setDoc, updateDoc, getDoc, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getMock } from '@/lib/data/toefl/mock-1';
import type {
  TOEFLMock, TOEFLReadingPassage, TOEFLListeningAudio, TOEFLSpeakingPrompt, TOEFLSpeakingSection,
  TOEFLWritingSequence, ReadingAnswer, ListeningAnswer, SpeakingRecording,
  WritingSectionSubmission, SectionScore, TOEFLSection, TOEFLLiveSnapshot,
  TOEFLReadingQuestionType, TOEFLSession,
} from '@/types/toefl';
import {
  readingRawToScaled, listeningRawToScaled, combineOverallBand,
  TOEFL_SECTIONS, TOEFL_SECTION_META,
} from '@/types/toefl';
import {
  findResumableSession, loadSession, saveLiveSnapshot, clearLiveSnapshot,
  debouncedSnapshot,
} from '@/lib/toefl/sessions';
import { useCountdown } from '@/hooks/useCountdown';
import { SpeakingSection } from '@/components/toefl/SpeakingSection';
import { SpeakingBreakdown } from '@/components/toefl/SpeakingBreakdown';
import { WritingSequence } from '@/components/toefl/WritingSequence';
import { WritingBreakdown } from '@/components/toefl/WritingBreakdown';
import { TaskRibbon, BrandCard, SubmitButton, B as SHELL } from '@/components/toefl/MockShell';
import { gradeSpeakingRecordings } from '@/lib/toefl/gradeSpeaking';
import { gradeWritingSection } from '@/lib/toefl/gradeWriting';

// ── Reading question-type friendly labels ─────────────────────────────────
const READING_TYPE_LABEL: Record<TOEFLReadingQuestionType, string> = {
  'factual':                 'Factual information',
  'negative-factual':        'Negative factual',
  'vocabulary':              'Vocabulary in context',
  'inference':               'Inference',
  'rhetorical-purpose':      'Rhetorical purpose',
  'sentence-simplification': 'Sentence simplification',
  'reference':               'Reference',
};

/** Paragraph tag from index — A, B, C, …, Z, then AA, AB, … */
function paraTag(zeroBasedIdx: number): string {
  if (zeroBasedIdx < 26) return String.fromCharCode(65 + zeroBasedIdx);
  const first  = Math.floor(zeroBasedIdx / 26) - 1;
  const second = zeroBasedIdx % 26;
  return String.fromCharCode(65 + first) + String.fromCharCode(65 + second);
}

const B = {
  purple:      '#5A3D7A',
  purpleDark:  '#3D2558',
  purpleMed:   '#9B7CB8',
  purpleLight: '#C8A8DC',
  lavender:    '#F0E5FF',
  lavenderDark:'#E0D5FF',
};

// ── Shell ─────────────────────────────────────────────────────────────────

function PageBg({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen p-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(150deg, #EDE8FF 0%, #E0D5FF 45%, #F0E5FF 100%)' }}>
      <div className="absolute pointer-events-none" style={{
        width: 480, height: 480, borderRadius: '50%',
        background: 'rgba(155,124,184,0.18)', filter: 'blur(60px)',
        top: '-20%', left: '-15%',
      }} />
      <div className="relative z-10 w-full flex justify-center">{children}</div>
    </div>
  );
}

function BrandHeader({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-xl overflow-hidden flex-shrink-0"
        style={{ width: 40, height: 40, outline: '2px solid rgba(255,255,255,0.25)' }}>
        <Image src="/logo-friendlyteaching.jpg" alt="FT" width={40} height={40} className="object-cover w-full h-full" />
      </div>
      <div>
        <p className="text-base font-black text-white leading-tight">FriendlyTeaching</p>
        <p className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{subtitle}</p>
      </div>
    </div>
  );
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function TimerBar({ label, seconds, totalSec, warn = 60 }: { label: string; seconds: number; totalSec: number; warn?: number }) {
  const pct = totalSec > 0 ? ((totalSec - seconds) / totalSec) * 100 : 0;
  const red = seconds < warn;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-2xl">
      <div className="bg-white/95 backdrop-blur-md rounded-full shadow-2xl border border-[#E8D5F0] pl-5 pr-4 py-2.5 flex items-center gap-3">
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] font-black uppercase tracking-[0.25em] leading-none" style={{ color: B.purple }}>{label}</span>
          <span className={`text-sm font-black tabular-nums leading-tight ${red ? 'text-red-500' : ''}`} style={{ color: red ? undefined : B.purple }}>
            {fmtTime(seconds)}
          </span>
        </div>
        <div className="flex-1 h-1.5 bg-[#F0E5FF] rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-[width] ${red ? 'bg-red-500' : ''}`}
            style={{ width: `${pct}%`, background: red ? undefined : 'linear-gradient(90deg, #5A3D7A, #9B7CB8)' }} />
        </div>
      </div>
    </div>
  );
}

// ── MCQ card (Reading + Listening) ────────────────────────────────────────

function MCQCard({
  prompt, options, selected, onSelect,
}: {
  prompt:  string;
  options: readonly string[];
  selected: number | null;
  onSelect: (idx: number) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[15px] font-semibold leading-snug" style={{ color: B.purpleDark }}>{prompt}</p>
      <div className="space-y-2">
        {options.map((opt, idx) => {
          const on = selected === idx;
          return (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              className={`w-full text-left px-4 py-3 rounded-2xl transition-all flex items-center gap-3 ${
                on ? '' : 'hover:-translate-y-0.5'
              }`}
              style={{
                background: on ? SHELL.lavenderBg : '#FDFAFF',
                border:     on ? `1.5px solid ${SHELL.purpleMed}` : '1px solid #E8D5F0',
                color:      on ? SHELL.purpleDeep : '#374151',
                fontWeight: on ? 600 : 500,
                boxShadow:  on
                  ? `0 8px 20px -10px ${SHELL.purpleMed}80, inset 0 1px 0 rgba(255,255,255,0.7)`
                  : '0 2px 6px -2px rgba(90,61,122,0.08)',
              }}
            >
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                style={{
                  background: on
                    ? `linear-gradient(135deg,${SHELL.purpleDeep},${SHELL.purpleMed})`
                    : '#FFFFFF',
                  color:      on ? '#FFFFFF' : '#9CA3AF',
                  border:     on ? 'none' : '1.5px solid #E5E7EB',
                  boxShadow:  on ? `0 4px 8px -3px ${SHELL.purple}80` : 'none',
                }}
              >
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="flex-1 text-sm">{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Reading section ────────────────────────────────────────────────────────
//
// Real-TOEFL UX: paragraph markers (¶A, ¶B, …) with jump-scroll from the
// question header, question-type friendly labels, back navigation, review
// screen listing all answered/unanswered questions with jump-to buttons.

function ReadingSection({
  passages, onDone, initial, onSnapshot, practiceMode,
}: {
  passages:    TOEFLReadingPassage[];
  onDone:      (answers: ReadingAnswer[], timeLeftSec: number) => void;
  initial?:    { outerIdx: number; innerIdx: number; timeLeftSec?: number; answers?: ReadingAnswer[] };
  onSnapshot?: (snap: Omit<TOEFLLiveSnapshot, 'section'>) => void;
  practiceMode?: boolean;
}) {
  const [pIdx, setPIdx] = useState(initial?.outerIdx ?? 0);
  const [qIdx, setQIdx] = useState(initial?.innerIdx ?? 0);
  const [answers, setAnswers] = useState<Record<string, ReadingAnswer>>(() => {
    const map: Record<string, ReadingAnswer> = {};
    for (const a of initial?.answers ?? []) map[a.questionId] = a;
    return map;
  });
  const [reviewing, setReviewing] = useState(false);
  const passageRef = useRef<HTMLDivElement>(null);

  const totalSec = 35 * 60;
  const initialTimeLeft = initial?.timeLeftSec && initial.timeLeftSec > 0 ? initial.timeLeftSec : totalSec;
  // Practice mode: timer isn't shown and never fires auto-submit. Countdown
  // still ticks locally so the snapshot has *some* timeLeftSec, but the
  // number is never rendered and finish() never runs on expiry.
  const left = useCountdown(initialTimeLeft, !practiceMode, practiceMode ? undefined : () => finish());

  const passage = passages[pIdx];
  const q = passage.questions[qIdx];
  const selected = answers[q.id]?.selected ?? null;

  // Emit snapshot whenever anything meaningful changes.
  useEffect(() => {
    if (!onSnapshot) return;
    onSnapshot({
      outerIdx:       pIdx,
      innerIdx:       qIdx,
      timeLeftSec:    left,
      readingAnswers: Object.values(answers),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pIdx, qIdx, answers]);

  // Scroll to the referenced paragraph when the current question changes.
  useEffect(() => {
    if (!q.refPara || !passageRef.current) return;
    const el = passageRef.current.querySelector(`[data-para-idx="${q.refPara - 1}"]`);
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [q.refPara, pIdx]);

  function record(idx: number) {
    const ans: ReadingAnswer = {
      questionId: q.id,
      passageId:  passage.id,
      selected:   idx as 0 | 1 | 2 | 3,
      correct:    idx === q.correct,
    };
    setAnswers(prev => ({ ...prev, [q.id]: ans }));
  }

  function jumpTo(newPIdx: number, newQIdx: number) {
    setPIdx(newPIdx);
    setQIdx(newQIdx);
    setReviewing(false);
  }

  function nextQuestion() {
    if (qIdx < passage.questions.length - 1) { setQIdx(i => i + 1); return; }
    if (pIdx < passages.length - 1)          { setPIdx(i => i + 1); setQIdx(0); return; }
    setReviewing(true);   // last question → jump to review screen
  }
  function prevQuestion() {
    if (qIdx > 0)                { setQIdx(i => i - 1); return; }
    if (pIdx > 0)                { setPIdx(i => i - 1); setQIdx(passages[pIdx - 1].questions.length - 1); return; }
  }

  function finish() {
    const full: ReadingAnswer[] = passages.flatMap(p =>
      p.questions.map(qu => answers[qu.id] ?? {
        questionId: qu.id, passageId: p.id, selected: null, correct: false,
      }),
    );
    onDone(full, left);
  }

  const totalQ = passages.reduce((acc, p) => acc + p.questions.length, 0);
  const answeredCount = passages.reduce((acc, p) =>
    acc + p.questions.filter(qu => answers[qu.id]?.selected !== undefined).length, 0);

  // ── Review screen ────────────────────────────────────────────────────
  if (reviewing) {
    return (
      <>
        <div className="w-full max-w-3xl space-y-4 pb-24">
          <TaskRibbon
            eyebrow={`TOEFL · Reading · Review`}
            emoji="📖"
            title={`${answeredCount} de ${totalQ} respondidas`}
            subtitle="Toca cualquier número para volver a la pregunta antes de enviar."
            right={<SubmitButton onClick={finish}>✓ Enviar Reading</SubmitButton>}
          />

          <BrandCard>
            {passages.map((p, pi) => (
              <div key={p.id} className="mt-1 mb-4 last:mb-0">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: SHELL.purple }}>
                  Passage {pi + 1} — {p.title}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {p.questions.map((qu, qi) => {
                    const answered = answers[qu.id]?.selected !== undefined && answers[qu.id]?.selected !== null;
                    return (
                      <button
                        key={qu.id}
                        onClick={() => jumpTo(pi, qi)}
                        className={`w-9 h-9 rounded-xl text-xs font-black transition-all hover:-translate-y-0.5 ${
                          answered ? 'text-white' : 'text-gray-400 hover:text-[#5A3D7A]'
                        }`}
                        style={{
                          background: answered
                            ? `linear-gradient(135deg,${SHELL.purpleDeep},${SHELL.purpleMed})`
                            : '#FFFFFF',
                          border:    answered ? 'none' : '1.5px solid #E5E7EB',
                          boxShadow: answered
                            ? `0 4px 10px -4px ${SHELL.purple}80`
                            : '0 1px 3px rgba(0,0,0,0.05)',
                        }}
                        title={`Q${qi + 1} · ${READING_TYPE_LABEL[qu.type]}`}
                      >
                        {qi + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <p className="text-[11px] text-gray-500 italic mt-2">
              💡 Al enviar se calculan tus puntos y no puedes modificar respuestas.
            </p>
          </BrandCard>
        </div>
        {!practiceMode && <TimerBar label="Reading · 35 min" seconds={left} totalSec={totalSec} warn={120} />}
      </>
    );
  }

  // ── Main question view ──────────────────────────────────────────────
  const isLast = qIdx === passage.questions.length - 1 && pIdx === passages.length - 1;
  const isFirst = qIdx === 0 && pIdx === 0;

  return (
    <>
      <div className="w-full max-w-6xl pb-24 space-y-4">
        <TaskRibbon
          eyebrow={`TOEFL · Reading · Passage ${pIdx + 1} of ${passages.length}`}
          emoji="📖"
          title={passage.title}
          subtitle={`${passage.wordCount} palabras · ${passage.questions.length} preguntas`}
          right={
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#FFF', border: '1px solid rgba(255,255,255,0.25)' }}
            >
              Pregunta {qIdx + 1} de {passage.questions.length}
            </span>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Passage with paragraph markers */}
          <div ref={passageRef}>
            <BrandCard scroll>
              <div className="space-y-3 text-sm leading-relaxed text-gray-800">
                {passage.paragraphs.map((p, i) => {
                  const highlighted = q.refPara === i + 1;
                  return (
                    <p
                      key={i}
                      data-para-idx={i}
                      className="flex gap-3 rounded-xl px-2 py-1.5 -mx-2 transition-colors"
                      style={highlighted ? {
                        background: `linear-gradient(135deg, ${SHELL.gold}18, ${SHELL.gold}08)`,
                        borderLeft: `3px solid ${SHELL.gold}`,
                        paddingLeft: '12px',
                      } : undefined}
                    >
                      <span
                        className="shrink-0 font-black text-[11px] tracking-widest tabular-nums select-none"
                        style={{ color: highlighted ? SHELL.goldDeep : SHELL.purpleMed }}
                      >
                        ¶{paraTag(i)}
                      </span>
                      <span className="flex-1">{p}</span>
                    </p>
                  );
                })}
              </div>
            </BrandCard>
          </div>

          {/* Question */}
          <div className="self-start">
            <BrandCard>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: SHELL.purpleMed }}>
                  Pregunta {qIdx + 1} de {passage.questions.length}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
                    style={{ background: SHELL.lavenderBg, color: SHELL.purple, border: `1px solid ${SHELL.purpleMed}33` }}>
                    {READING_TYPE_LABEL[q.type]}
                  </span>
                  {q.refPara && (
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full"
                      style={{ background: `${SHELL.gold}22`, color: SHELL.goldDeep, border: `1px solid ${SHELL.gold}55` }}>
                      → ¶{paraTag(q.refPara - 1)}
                    </span>
                  )}
                </div>
              </div>
              <MCQCard prompt={q.prompt} options={q.options} selected={selected} onSelect={record} />

              {/* Question dots for this passage */}
              <div className="mt-5 flex flex-wrap gap-1.5">
                {passage.questions.map((qu, qi) => {
                  const answered = answers[qu.id]?.selected !== undefined && answers[qu.id]?.selected !== null;
                  const active   = qi === qIdx;
                  return (
                    <button
                      key={qu.id}
                      onClick={() => setQIdx(qi)}
                      className="w-8 h-8 rounded-lg text-[11px] font-black transition-all hover:-translate-y-0.5"
                      style={{
                        background: active
                          ? `linear-gradient(135deg,${SHELL.purpleDeep},${SHELL.purpleMed})`
                          : answered
                            ? SHELL.lavenderBg
                            : '#FFFFFF',
                        color:  active ? '#FFFFFF' : answered ? SHELL.purple : '#9CA3AF',
                        border: active ? 'none' : `1.5px solid ${answered ? SHELL.purpleMed : '#E5E7EB'}`,
                        boxShadow: active ? `0 6px 12px -4px ${SHELL.purple}80` : 'none',
                      }}
                    >
                      {qi + 1}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex justify-between gap-2 flex-wrap">
                <button
                  onClick={prevQuestion}
                  disabled={isFirst}
                  className="px-4 py-2 rounded-2xl text-sm font-semibold border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-gray-50 transition-colors"
                >
                  ← Volver
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReviewing(true)}
                    className="px-4 py-2 rounded-2xl text-sm font-semibold transition-colors"
                    style={{
                      border: `1.5px solid ${SHELL.purpleMed}`,
                      color:  SHELL.purple,
                      background: 'transparent',
                    }}
                  >
                    Ver todas
                  </button>
                  <SubmitButton onClick={nextQuestion} disabled={selected === null}>
                    {isLast ? 'Revisar →' : 'Siguiente →'}
                  </SubmitButton>
                </div>
              </div>
            </BrandCard>
          </div>
        </div>
      </div>
      <TimerBar label="Reading · 35 min" seconds={left} totalSec={totalSec} warn={120} />
    </>
  );
}

// ── Listening section ─────────────────────────────────────────────────────

// Collapsed script viewer — mirrors the transcript panel you'd get in the
// real CBT after you finish listening. Kept collapsed by default so it
// doesn't spoil the listening test if the student opens it too early.
function ScriptViewer({ audio }: { audio: TOEFLListeningAudio }) {
  return (
    <details className="mt-3 rounded-xl border border-[#E8D5F0] bg-white group">
      <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-widest text-[#5A3D7A] px-3 py-2 flex items-center justify-between select-none">
        <span>📄 Ver script</span>
        <span className="text-[10px] font-normal normal-case text-[#5A3D7A]/60 group-open:hidden">
          {audio.script.length} líneas
        </span>
      </summary>
      <div className="border-t border-[#F0E5FF] p-3 max-h-64 overflow-y-auto text-[11px] text-gray-700 space-y-1.5">
        {audio.script.map((line, i) => {
          const speaker = audio.speakers.find(s => s.id === line.speakerId)?.name ?? line.speakerId;
          return (
            <p key={i} className="leading-snug">
              <strong className="text-[#5A3D7A]">{speaker}:</strong> {line.text}
            </p>
          );
        })}
      </div>
    </details>
  );
}

function ListeningSection({
  audios, audioUrls, onDone, onGenerateAudio, initial, onSnapshot, practiceMode,
}: {
  audios:          TOEFLListeningAudio[];
  audioUrls:       Record<string, string>;
  onDone:          (answers: ListeningAnswer[], timeLeftSec: number, notes: Record<string, string>) => void;
  onGenerateAudio: (audioId: string) => Promise<string | null>;
  initial?:        { outerIdx: number; innerIdx: number; audioPhase?: 'play' | 'quiz'; timeLeftSec?: number; answers?: ListeningAnswer[]; notes?: Record<string, string> };
  onSnapshot?:     (snap: Omit<TOEFLLiveSnapshot, 'section'>) => void;
  practiceMode?:   boolean;
}) {
  const [aIdx, setAIdx] = useState(initial?.outerIdx ?? 0);
  const [phase, setPhase] = useState<'play' | 'quiz'>(initial?.audioPhase ?? 'play');
  const [qIdx, setQIdx] = useState(initial?.innerIdx ?? 0);
  const [answers, setAnswers] = useState<Record<string, ListeningAnswer>>(() => {
    const map: Record<string, ListeningAnswer> = {};
    for (const a of initial?.answers ?? []) map[a.questionId] = a;
    return map;
  });
  const [notes, setNotes] = useState<Record<string, string>>(initial?.notes ?? {});
  const [generating, setGenerating] = useState(false);
  const [genError,   setGenError]   = useState('');

  const totalSec = 20 * 60;
  const initialTimeLeft = initial?.timeLeftSec && initial.timeLeftSec > 0 ? initial.timeLeftSec : totalSec;
  // Practice mode: no auto-submit, no visible countdown.
  const left = useCountdown(initialTimeLeft, !practiceMode, practiceMode ? undefined : () => finish());

  const audio = audios[aIdx];
  const q = audio.questions[qIdx];
  const url = audioUrls[audio.id];
  const selected = phase === 'quiz' ? answers[q.id]?.selected ?? null : null;

  useEffect(() => {
    if (!onSnapshot) return;
    onSnapshot({
      outerIdx:         aIdx,
      innerIdx:         qIdx,
      audioPhase:       phase,
      timeLeftSec:      left,
      listeningAnswers: Object.values(answers),
      listeningNotes:   notes,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aIdx, qIdx, phase, answers, notes]);

  function record(idx: number) {
    const ans: ListeningAnswer = {
      questionId: q.id,
      audioId:    audio.id,
      selected:   idx as 0 | 1 | 2 | 3,
      correct:    idx === q.correct,
    };
    setAnswers(prev => ({ ...prev, [q.id]: ans }));
  }

  function setNotesFor(audioId: string, value: string) {
    setNotes(prev => ({ ...prev, [audioId]: value }));
  }

  function nextQuestion() {
    if (qIdx < audio.questions.length - 1) { setQIdx(i => i + 1); return; }
    if (aIdx < audios.length - 1) {
      setAIdx(i => i + 1); setQIdx(0); setPhase('play');
      return;
    }
    finish();
  }

  function finish() {
    const full: ListeningAnswer[] = audios.flatMap(a =>
      a.questions.map(qu => answers[qu.id] ?? {
        questionId: qu.id, audioId: a.id, selected: null, correct: false,
      }),
    );
    onDone(full, left, notes);
  }

  async function requestGeneration() {
    setGenerating(true);
    setGenError('');
    const url = await onGenerateAudio(audio.id);
    setGenerating(false);
    if (!url) setGenError('No se pudo generar el audio. Avisale al profesor.');
  }

  const isLastOfAll = qIdx === audio.questions.length - 1 && aIdx === audios.length - 1;

  return (
    <>
      <div className="w-full max-w-5xl pb-24 space-y-4">
        <TaskRibbon
          eyebrow={`TOEFL · Listening · Audio ${aIdx + 1} of ${audios.length} · ${audio.type === 'lecture' ? 'Lecture' : 'Conversation'}`}
          emoji="🎧"
          title={audio.title}
          subtitle={audio.subject ? `${audio.subject} · ${audio.questions.length} preguntas` : `${audio.questions.length} preguntas`}
          right={
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#FFF', border: '1px solid rgba(255,255,255,0.25)' }}
            >
              {phase === 'play' ? '🔊 Escuchar' : `Pregunta ${qIdx + 1}/${audio.questions.length}`}
            </span>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
          <BrandCard>
            {phase === 'play' && (
              <>
                {url ? (
                  <div
                    className="rounded-2xl p-4 mb-4"
                    style={{
                      background: `linear-gradient(135deg, ${SHELL.lavenderBg}, #E8DBFF)`,
                      border:     `1px solid ${SHELL.purpleMed}33`,
                    }}
                  >
                    <audio src={url} controls className="w-full" preload="auto" />
                    <p className="text-[11px] text-[#5A3D7A]/70 mt-2 text-center italic leading-relaxed">
                      Escucha con atención. Después contestas {audio.questions.length} preguntas —
                      puedes tomar notas en el panel de la derecha.
                    </p>
                  </div>
                ) : (
                  <div
                    className="rounded-2xl p-4 mb-4"
                    style={{
                      background: `linear-gradient(135deg, ${SHELL.gold}18, ${SHELL.gold}08)`,
                      border:     `1px solid ${SHELL.gold}55`,
                    }}
                  >
                    <p className="text-xs font-black uppercase tracking-widest" style={{ color: SHELL.goldDeep }}>
                      ⚠ Audio pendiente
                    </p>
                    <p className="text-[11px] mt-2 leading-relaxed" style={{ color: '#78350F' }}>
                      Tu profesor todavía no subió el audio para este clip. Avísale para que lo suba
                      desde su dashboard (menú TOEFL → panel &ldquo;Audios de Listening&rdquo;) y recarga esta página.
                    </p>
                    <button
                      onClick={requestGeneration}
                      disabled={generating}
                      className="mt-3 w-full py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-60"
                      style={{
                        background: '#FFFFFF',
                        color:      SHELL.goldDeep,
                        border:     `1.5px solid ${SHELL.gold}`,
                      }}
                    >
                      {generating ? '⏳ Intentando generar…' : '🎙 Intentar generación automática'}
                    </button>
                    {genError && <p className="text-[11px] text-red-600 mt-2">{genError}</p>}
                  </div>
                )}

                <ScriptViewer audio={audio} />

                <div className="mt-4 flex justify-end">
                  <SubmitButton onClick={() => setPhase('quiz')} disabled={!url}>
                    Continuar a las preguntas →
                  </SubmitButton>
                </div>
              </>
            )}

            {phase === 'quiz' && (
              <>
                <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: SHELL.purpleMed }}>
                    Pregunta {qIdx + 1} de {audio.questions.length}
                  </span>
                  <button
                    onClick={() => setPhase('play')}
                    className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full transition-colors"
                    style={{
                      color:      SHELL.purple,
                      background: SHELL.lavenderBg,
                      border:     `1px solid ${SHELL.purpleMed}55`,
                    }}
                  >
                    ↩ Volver al audio
                  </button>
                </div>
                <MCQCard prompt={q.prompt} options={q.options} selected={selected} onSelect={record} />

                <div className="mt-4">
                  <ScriptViewer audio={audio} />
                </div>

                {/* Question dots for this audio */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {audio.questions.map((qu, qi) => {
                    const answered = answers[qu.id]?.selected !== undefined && answers[qu.id]?.selected !== null;
                    const active   = qi === qIdx;
                    return (
                      <button
                        key={qu.id}
                        onClick={() => setQIdx(qi)}
                        className="w-8 h-8 rounded-lg text-[11px] font-black transition-all hover:-translate-y-0.5"
                        style={{
                          background: active
                            ? `linear-gradient(135deg,${SHELL.purpleDeep},${SHELL.purpleMed})`
                            : answered
                              ? SHELL.lavenderBg
                              : '#FFFFFF',
                          color:  active ? '#FFFFFF' : answered ? SHELL.purple : '#9CA3AF',
                          border: active ? 'none' : `1.5px solid ${answered ? SHELL.purpleMed : '#E5E7EB'}`,
                          boxShadow: active ? `0 6px 12px -4px ${SHELL.purple}80` : 'none',
                        }}
                      >
                        {qi + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 flex justify-end">
                  <SubmitButton onClick={nextQuestion} disabled={selected === null}>
                    {isLastOfAll ? '✓ Enviar Listening' : 'Siguiente →'}
                  </SubmitButton>
                </div>
              </>
            )}
          </BrandCard>

          {/* Notes sidebar — always visible, per-audio */}
          <div className="self-start">
            <BrandCard>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: SHELL.purpleMed }}>
                  📝 Notas · Audio {aIdx + 1}
                </p>
              </div>
              <textarea
                value={notes[audio.id] ?? ''}
                onChange={e => setNotesFor(audio.id, e.target.value)}
                rows={14}
                placeholder="Palabras clave, nombres, cifras, estructura del audio…"
                className="w-full text-[13px] px-3 py-2 rounded-xl focus:outline-none focus:ring-4 leading-snug resize-y text-gray-700 transition-shadow"
                style={{
                  background:  '#FDFAFF',
                  border:      '1px solid #E8D5F0',
                  fontFamily:  '"Georgia", "Cambria", serif',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = SHELL.purpleMed; e.currentTarget.style.boxShadow = `0 0 0 4px ${SHELL.lavenderBg}`; }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = '#E8D5F0';       e.currentTarget.style.boxShadow = 'none'; }}
              />
              <p className="text-[9px] text-gray-400 mt-1.5 italic">
                Se guardan solas y se mantienen entre audios.
              </p>
            </BrandCard>
          </div>
        </div>
      </div>
      {!practiceMode && <TimerBar label="Listening · 20 min" seconds={left} totalSec={totalSec} warn={60} />}
    </>
  );
}

// ── Results ───────────────────────────────────────────────────────────────

function ResultsScreen({
  studentName, scores, overall, enabledSections, speakingResults, speakingSection, speakingPrompts,
  writingResult, writingPrompt,
}: {
  studentName:     string;
  scores:          Partial<Record<'reading'|'listening'|'speaking'|'writing', SectionScore>>;
  overall:         number;
  enabledSections: TOEFLSection[];
  speakingResults?: SpeakingRecording[];
  speakingSection?: TOEFLSpeakingSection;
  speakingPrompts?: TOEFLSpeakingPrompt[];   // legacy fallback
  writingResult?:   WritingSectionSubmission | null;
  writingPrompt?:   TOEFLWritingSequence;
}) {
  const [downloading, setDownloading] = useState(false);
  const isPartial = enabledSections.length < 4;
  // ETS 2026: every section and the overall use the same 1-6 band scale.
  const maxScore = 6;
  const meta: Record<string, { icon: string; label: string }> = {
    reading:   { icon: '📖', label: 'Reading' },
    listening: { icon: '🎧', label: 'Listening' },
    speaking:  { icon: '🎤', label: 'Speaking' },
    writing:   { icon: '✍️', label: 'Writing' },
  };

  async function downloadPdf() {
    setDownloading(true);
    try {
      const res = await fetch('/api/export-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'toefl',
          studentName,
          scores,
          overall,
          completedAt: new Date().toISOString(),
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
        <div className="px-8 py-8 text-white text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #3D2558 0%, #5A3D7A 55%, #9B7CB8 100%)' }}>
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
          <div className="relative">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-70">
              {isPartial ? `Subtotal (${enabledSections.length}/4)` : 'TOEFL iBT Band'}
            </p>
            <p className="text-7xl font-black mt-1 tabular-nums">
              {overall.toFixed(1)}
            </p>
            <p className="text-sm mt-2 opacity-80">/ {maxScore} · {studentName}</p>
          </div>
        </div>

        <div className="bg-white p-6 space-y-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-3" style={{ color: B.purple }}>
              Puntaje por sección
            </p>
            <div className="grid grid-cols-2 gap-2">
              {enabledSections.map(s => {
                const sc = scores[s];
                return (
                  <div key={s} className="rounded-xl border p-3" style={{ borderColor: B.lavenderDark, background: '#FDFAFF' }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{meta[s].icon}</span>
                        <p className="text-sm font-bold" style={{ color: B.purple }}>{meta[s].label}</p>
                      </div>
                      <span className="text-lg font-black tabular-nums" style={{ color: B.purple }}>
                        {sc?.score != null ? sc.score.toFixed(1) : '—'}
                        <span className="text-[10px] font-bold opacity-60"> / 6</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#F0E5FF] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] rounded-full"
                        style={{ width: `${((sc?.score ?? 0) / 6) * 100}%` }} />
                    </div>
                    {sc?.raw !== undefined && sc.outOf !== undefined && (
                      <p className="text-[10px] text-gray-500 mt-1 tabular-nums">
                        {sc.raw}/{sc.outOf} correctas
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Per-task Speaking breakdown — only shown if we actually ran
              Speaking and have per-task results (transcript + rubric + AI
              feedback or captured error). */}
          {speakingResults && speakingResults.length > 0 && (speakingSection || speakingPrompts) && (
            <SpeakingBreakdown recordings={speakingResults} section={speakingSection} prompts={speakingPrompts} />
          )}

          {/* Writing breakdown — student text + rubric + AI feedback. */}
          {writingResult && (
            <WritingBreakdown submission={writingResult} prompt={writingPrompt} />
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={downloadPdf}
              disabled={downloading}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: B.purple }}
            >
              {downloading ? '⏳ Generando…' : '⬇ Descargar PDF'}
            </button>
          </div>

          <p className="text-center text-[10px] text-gray-500">
            Los detalles completos con feedback de AI están guardados en el dashboard del docente.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

type Phase = 'landing' | 'intro' | 'reading' | 'listening' | 'speaking' | 'writing' | 'grading' | 'results';

export default function TOEFLMockPage() {
  const { mockId } = useParams<{ mockId: string }>();
  const searchParams = useSearchParams();
  const teacherIdParam = searchParams.get('teacherId') ?? '';
  const nameParam = searchParams.get('name') ?? '';
  const emailParam = searchParams.get('email') ?? '';
  const sectionsParam = searchParams.get('sections') ?? '';
  const resumeSessionIdParam = searchParams.get('resumeSessionId') ?? '';
  // Practice mode: no hard timers, no auto-submit, no visible scores at
  // the end for the student. Enable via ?mode=practice.
  const practiceMode = searchParams.get('mode') === 'practice';

  // Selected sections come from ?sections=reading,writing (defaults to all
  // four for backwards-compat when the query param is absent).
  const enabledSections: TOEFLSection[] = useMemo(() => {
    if (!sectionsParam) return [...TOEFL_SECTIONS];
    const set = new Set(sectionsParam.split(',').filter(Boolean) as TOEFLSection[]);
    return TOEFL_SECTIONS.filter(s => set.has(s));
  }, [sectionsParam]);
  const enabledSet = useMemo(() => new Set(enabledSections), [enabledSections]);

  function nextEnabledAfter(current: TOEFLSection): TOEFLSection | null {
    const idx = enabledSections.indexOf(current);
    if (idx < 0 || idx === enabledSections.length - 1) return null;
    return enabledSections[idx + 1];
  }

  const mock: TOEFLMock | undefined = getMock(mockId);

  const [phase, setPhase] = useState<Phase>('landing');
  const [name, setName] = useState(nameParam);
  const [email, setEmail] = useState(emailParam);
  const [teacherId] = useState(teacherIdParam);
  const [formError, setFormError] = useState('');
  const [gradingMsg, setGradingMsg] = useState('Calificando…');
  const [speakingProgress, setSpeakingProgress] = useState<Array<{
    promptId: string;
    status:   'pending' | 'transcribing' | 'grading' | 'done' | 'error' | 'skipped';
    message?: string;
  }>>([]);
  // Full per-task Speaking details (transcript + rubric + feedback + errors)
  // used to render the detailed breakdown on the Results screen.
  const [speakingResults, setSpeakingResults] = useState<SpeakingRecording[]>([]);
  const [writingResult, setWritingResult] = useState<WritingSectionSubmission | null>(null);

  const sessionIdRef = useRef<string>('');
  const [scores, setScores] = useState<Partial<Record<'reading'|'listening'|'speaking'|'writing', SectionScore>>>({});
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [resumeCandidate, setResumeCandidate] = useState<TOEFLSession | null>(null);
  const [hydration, setHydration] = useState<TOEFLLiveSnapshot | null>(null);
  const debouncedSaveRef = useRef<ReturnType<typeof debouncedSnapshot> | null>(null);
  if (!debouncedSaveRef.current) debouncedSaveRef.current = debouncedSnapshot(800);

  // Load audio bindings once we know the teacherId and mock
  useEffect(() => {
    if (!teacherId || !mock) return;
    (async () => {
      const map: Record<string, string> = {};
      for (const a of mock!.listening) {
        try {
          const snap = await getDoc(doc(db, 'toeflListeningAudios', `${teacherId}_${mock!.id}_${a.id}`));
          if (snap.exists()) {
            const url = snap.data().audioUrl as string | undefined;
            if (url) map[a.id] = url;
          }
        } catch { /* ignore */ }
      }
      setAudioUrls(map);
    })();
  }, [teacherId, mock]);

  // If URL carries ?resumeSessionId=… (teacher clicked "Continuar" from the
  // dashboard), load that session doc directly and jump straight into the
  // right section with the saved snapshot.
  useEffect(() => {
    if (!resumeSessionIdParam) return;
    (async () => {
      const sess = await loadSession(resumeSessionIdParam);
      if (!sess || sess.status !== 'in_progress') return;
      sessionIdRef.current = sess.id;
      setName(sess.studentName);
      if (sess.studentEmail) setEmail(sess.studentEmail);
      if (sess.liveSnapshot) {
        setHydration(sess.liveSnapshot);
        setPhase(sess.liveSnapshot.section as Phase);
      } else {
        setPhase('intro');
      }
    })();
  }, [resumeSessionIdParam]);

  // On landing → after name entered → look for an in-progress session with
  // this teacherId + mockId + studentName so we can offer to resume.
  useEffect(() => {
    if (phase !== 'landing') return;
    if (!teacherId || !name.trim()) return;
    if (resumeSessionIdParam) return; // already resuming via explicit id
    const t = setTimeout(async () => {
      const found = await findResumableSession(
        teacherId,
        mock?.id ?? mockId,
        name.trim(),
        practiceMode ? 'practice' : 'exam',
      );
      setResumeCandidate(found);
    }, 500);
    return () => clearTimeout(t);
  }, [phase, teacherId, name, mock, mockId, resumeSessionIdParam]);

  /** Persist the currently-in-flight section's snapshot to Firestore. */
  function persistLiveSnapshot(section: TOEFLSection, snap: Omit<TOEFLLiveSnapshot, 'section'>) {
    if (!sessionIdRef.current) return;
    debouncedSaveRef.current!(sessionIdRef.current, { section, ...snap });
  }

  /** Request on-demand ElevenLabs generation for a listening audio. Returns
   *  the URL on success, or null on error. */
  async function generateAudioOnDemand(audioId: string): Promise<string | null> {
    if (!teacherId || !mock) return null;
    try {
      const res = await fetch('/api/toefl-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId, mockId: mock.id, audioId }),
      });
      const data = await res.json();
      if (!res.ok || !data.audioUrl) {
        console.error('[toefl-mock] generate audio failed:', data);
        return null;
      }
      setAudioUrls(prev => ({ ...prev, [audioId]: data.audioUrl }));
      return data.audioUrl as string;
    } catch (err) {
      console.error('[toefl-mock] generate audio err:', err);
      return null;
    }
  }

  async function ensureSession(): Promise<string> {
    if (sessionIdRef.current) return sessionIdRef.current;
    const ref = doc(collection(db, 'toeflSessions'));
    sessionIdRef.current = ref.id;
    await setDoc(ref, {
      teacherId,
      studentName:  name.trim(),
      studentEmail: email.trim() || null,
      mockId:       mock?.id ?? mockId,
      enabledSections,
      sessionMode:  practiceMode ? 'practice' : 'exam',
      results:      {},
      progress:     Object.fromEntries(enabledSections.map(s => [s, 'pending'])),
      status:       'in_progress',
      startedAt:    Timestamp.now(),
      createdAt:    serverTimestamp(),
    }).catch((err: unknown) => {
      console.error('[toefl-mock] create session:', err);
    });
    return ref.id;
  }

  async function persistSection(section: 'reading'|'listening'|'speaking'|'writing', payload: object) {
    const sid = await ensureSession();
    try {
      await updateDoc(doc(db, 'toeflSessions', sid), {
        [`results.${section}`]: payload,
        [`progress.${section}`]: 'completed',
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('[toefl-mock] persist section:', section, err);
    }
  }

  if (!mock) {
    return <PageBg><div className="text-center py-24 text-white">Mock not found.</div></PageBg>;
  }

  function landingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setFormError('Nombre requerido.'); return; }
    setFormError('');
    setPhase('intro');
  }

  async function advanceFrom(current: TOEFLSection, extraScore?: SectionScore) {
    const next = nextEnabledAfter(current);
    if (next) { setPhase(next as Phase); return; }
    // Last enabled section → finalise session and go to results.
    const combined = { ...scores, ...(extraScore ? { [current]: extraScore } : {}) };
    const bands = Object.values(combined).map(v => v?.score ?? 0).filter(n => n > 0);
    // ETS 2026: overall = average of the enabled section bands, rounded to
    // nearest 0.5 (not the pre-2026 sum-to-120).
    const overall = combineOverallBand(bands);
    try {
      const sid = await ensureSession();
      await updateDoc(doc(db, 'toeflSessions', sid), {
        overallScore: overall,
        status:       'completed',
        completedAt:  serverTimestamp(),
      });
    } catch (err) {
      console.error('[toefl-mock] finalise err:', err);
    }
    setPhase('results');
  }

  async function onReadingDone(answers: ReadingAnswer[]) {
    const correct = answers.filter(a => a.correct).length;
    const score: SectionScore = {
      section: 'reading',
      raw:     correct,
      outOf:   answers.length,
      score:   readingRawToScaled(correct, answers.length),
    };
    setScores(prev => ({ ...prev, reading: score }));
    await persistSection('reading', { answers, score });
    if (sessionIdRef.current) await clearLiveSnapshot(sessionIdRef.current);
    setHydration(null);
    await advanceFrom('reading', score);
  }

  async function onListeningDone(answers: ListeningAnswer[], _timeLeftSec: number, _notes: Record<string, string>) {
    const correct = answers.filter(a => a.correct).length;
    const score: SectionScore = {
      section: 'listening',
      raw:     correct,
      outOf:   answers.length,
      score:   listeningRawToScaled(correct, answers.length),
    };
    setScores(prev => ({ ...prev, listening: score }));
    await persistSection('listening', { answers, score });
    if (sessionIdRef.current) await clearLiveSnapshot(sessionIdRef.current);
    setHydration(null);
    await advanceFrom('listening', score);
  }

  async function onSpeakingDone(recordings: SpeakingRecording[]) {
    setPhase('grading');
    setSpeakingProgress(recordings.map((r) => ({ promptId: r.promptId, status: 'pending' })));
    const { enriched, overallScore } = await gradeSpeakingRecordings(
      recordings,
      mock!.speaking ?? mock!.speakingLegacy ?? [],
      (progress) => setSpeakingProgress(progress),
    );
    const score: SectionScore = { section: 'speaking', score: overallScore };
    setScores(prev => ({ ...prev, speaking: score }));
    setSpeakingResults(enriched);
    await persistSection('speaking', { recordings: enriched, score });
    if (sessionIdRef.current) await clearLiveSnapshot(sessionIdRef.current);
    setHydration(null);
    await advanceFrom('speaking', score);
  }

  async function onWritingDone(submission: WritingSectionSubmission) {
    setPhase('grading');
    setGradingMsg('Calificando Writing…');
    let enriched: WritingSectionSubmission = submission;
    let sectionScore = 0;
    try {
      const result = await gradeWritingSection(submission, mock!.writing);
      enriched = result.enriched;
      sectionScore = result.sectionScore;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[toefl-mock] writing grade err:', msg);
      // Attach the error to the AD sub-submission so the breakdown surfaces it.
      enriched = {
        ...submission,
        discussion: { ...submission.discussion, aiError: msg, aiFeedback: `Error al calificar: ${msg}` },
      };
    }
    const score: SectionScore = { section: 'writing', score: sectionScore };
    setScores(prev => ({ ...prev, writing: score }));
    setWritingResult(enriched);
    await persistSection('writing', { submission: enriched, score });
    if (sessionIdRef.current) await clearLiveSnapshot(sessionIdRef.current);
    setHydration(null);
    await advanceFrom('writing', score);
  }

  const overallLive = Object.values(scores).reduce((s, v) => s + (v?.score ?? 0), 0);

  // ── Render ──
  if (phase === 'landing') {
    return (
      <PageBg>
        <div className="w-full max-w-md rounded-3xl overflow-hidden bg-white" style={{ boxShadow: '0 24px 64px -8px rgba(61,37,88,0.3)' }}>
          <div className="px-8 py-7" style={{ background: 'linear-gradient(135deg, #3D2558, #5A3D7A, #9B7CB8)' }}>
            <BrandHeader subtitle={practiceMode ? 'TOEFL Practice Mode' : 'TOEFL Academic Simulator'} />
            <h1 className="text-2xl font-black text-white leading-tight mt-6 pt-6 border-t border-white/10">
              {mock.title}
            </h1>
            {practiceMode && (
              <span className="inline-flex items-center gap-1.5 mt-2 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-100 bg-emerald-500/30 border border-emerald-300/40 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                Modo práctica · sin timer
              </span>
            )}
          </div>
          <form onSubmit={landingSubmit} className="p-8 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: B.purple }}>Nombre</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Tu nombre completo" autoFocus
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ border: `2px solid ${B.lavenderDark}`, background: '#FDFAFF', color: B.purple }} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: B.purple }}>
                Email <span className="normal-case font-normal" style={{ color: B.purpleMed }}>(opcional)</span>
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ border: `2px solid ${B.lavenderDark}`, background: '#FDFAFF', color: B.purple }} />
            </div>
            {formError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{formError}</p>}

            {resumeCandidate && (
              <div className="rounded-xl border border-[#5A3D7A]/40 bg-[#F0E5FF] p-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#5A3D7A]">
                    📌 {resumeCandidate.sessionMode === 'practice' ? 'Práctica en curso' : 'Test en curso'}
                  </p>
                  {resumeCandidate.sessionMode === 'practice' && (
                    <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Practice
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#5A3D7A]/80 mt-1">
                  Encontramos una sesión sin terminar para <strong>{resumeCandidate.studentName}</strong>. Puedes continuar donde quedaste.
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      sessionIdRef.current = resumeCandidate.id;
                      if (resumeCandidate.studentEmail) setEmail(resumeCandidate.studentEmail);
                      if (resumeCandidate.liveSnapshot) {
                        setHydration(resumeCandidate.liveSnapshot);
                        setPhase(resumeCandidate.liveSnapshot.section as Phase);
                      } else {
                        setPhase('intro');
                      }
                      setResumeCandidate(null);
                    }}
                    className="flex-1 text-[11px] font-bold py-2 rounded-lg text-white transition-opacity hover:opacity-90"
                    style={{ background: B.purple }}
                  >
                    ▶ Continuar
                  </button>
                  <button
                    type="button"
                    onClick={() => setResumeCandidate(null)}
                    className="text-[11px] font-semibold text-[#5A3D7A] px-3 py-2 rounded-lg border border-[#5A3D7A]/40 hover:bg-white"
                  >
                    Empezar nuevo
                  </button>
                </div>
              </div>
            )}

            <button type="submit" className="w-full font-bold py-3.5 rounded-xl text-white text-sm transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #3D2558, #5A3D7A)' }}>
              Continuar →
            </button>
          </form>
        </div>
      </PageBg>
    );
  }

  if (phase === 'intro') {
    const totalMin = enabledSections.reduce((s, sec) => s + TOEFL_SECTION_META[sec].minutes, 0);
    const first = enabledSections[0];
    const isPartial = enabledSections.length < TOEFL_SECTIONS.length;
    return (
      <PageBg>
        <div className="w-full max-w-lg rounded-3xl overflow-hidden bg-white" style={{ boxShadow: '0 24px 64px -8px rgba(61,37,88,0.3)' }}>
          <div className="px-8 py-7" style={{ background: 'linear-gradient(135deg, #3D2558, #5A3D7A, #9B7CB8)' }}>
            <BrandHeader subtitle={practiceMode ? 'TOEFL Practice Mode' : 'TOEFL Academic Simulator'} />
            <p className="text-lg font-serif font-bold text-white mt-4">Hola {name}, ¡vamos!</p>
            {practiceMode && (
              <span className="inline-flex items-center gap-1.5 mt-2 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-100 bg-emerald-500/30 border border-emerald-300/40 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                Modo práctica · sin timer
              </span>
            )}
            {isPartial && (
              <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Práctica parcial: {enabledSections.length} de {TOEFL_SECTIONS.length} secciones{practiceMode ? '' : ` (~${totalMin} min)`}
              </p>
            )}
          </div>
          <div className="p-8 space-y-4">
            {practiceMode && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5 text-[11px] text-emerald-900 leading-relaxed">
                <strong className="font-black uppercase tracking-widest text-[9px] text-emerald-800">Práctica · sin timer</strong>
                <p className="mt-0.5">Puedes salir y volver — el progreso se guarda automáticamente. Los scores no se muestran al final; tu profe los ve.</p>
              </div>
            )}
            <p className="text-sm text-gray-700">
              {isPartial ? 'Vas a hacer estas secciones en orden:' : 'Vas a hacer el mock completo en este orden:'}
            </p>
            <ol className="space-y-2 text-sm text-[#2D1B4E]">
              {enabledSections.map((s, i) => {
                const meta = TOEFL_SECTION_META[s];
                const desc: Record<TOEFLSection, string> = {
                  reading:   '2 pasajes',
                  listening: '1 lecture + 1 conversation',
                  speaking:  '4 tasks grabadas',
                  writing:   '1 Academic Discussion',
                };
                return (
                  <li key={s} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#F0E5FF] flex items-center justify-center text-xs font-bold" style={{ color: B.purple }}>{i + 1}</span>
                    <span>{meta.icon} <strong>{meta.label}</strong> — {desc[s]} · {meta.minutes} min</span>
                  </li>
                );
              })}
            </ol>
            {(enabledSet.has('speaking') || enabledSet.has('writing')) && (
              <p className="text-[11px] text-gray-500 italic">💡 {enabledSet.has('writing') && 'Writing'}{enabledSet.has('writing') && enabledSet.has('speaking') && ' y '}{enabledSet.has('speaking') && 'Speaking'} se califica{(enabledSet.has('writing') && enabledSet.has('speaking')) ? 'n' : ''} con AI (Claude{enabledSet.has('speaking') ? ' + Whisper' : ''}). Puede tardar 1-2 min después de submit.</p>
            )}
            <button onClick={() => first && setPhase(first as Phase)}
              disabled={!first}
              className="w-full font-bold py-3.5 rounded-xl text-white text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #3D2558, #5A3D7A)' }}>
              ▶ Empezar
            </button>
          </div>
        </div>
      </PageBg>
    );
  }

  if (phase === 'reading') {
    void ensureSession();
    const readingHydration = hydration?.section === 'reading' ? {
      outerIdx:    hydration.outerIdx,
      innerIdx:    hydration.innerIdx,
      timeLeftSec: hydration.timeLeftSec,
      answers:     hydration.readingAnswers,
    } : undefined;
    return (
      <PageBg>
        <ReadingSection
          passages={mock!.reading}
          onDone={onReadingDone}
          initial={readingHydration}
          onSnapshot={(snap) => persistLiveSnapshot('reading', snap)}
          practiceMode={practiceMode}
        />
      </PageBg>
    );
  }
  if (phase === 'listening') {
    void ensureSession();
    const listeningHydration = hydration?.section === 'listening' ? {
      outerIdx:    hydration.outerIdx,
      innerIdx:    hydration.innerIdx,
      audioPhase:  hydration.audioPhase,
      timeLeftSec: hydration.timeLeftSec,
      answers:     hydration.listeningAnswers,
      notes:       hydration.listeningNotes,
    } : undefined;
    return (
      <PageBg>
        <ListeningSection
          audios={mock!.listening}
          audioUrls={audioUrls}
          onDone={onListeningDone}
          onGenerateAudio={generateAudioOnDemand}
          initial={listeningHydration}
          onSnapshot={(snap) => persistLiveSnapshot('listening', snap)}
          practiceMode={practiceMode}
        />
      </PageBg>
    );
  }
  if (phase === 'speaking') {
    void ensureSession();
    const speakingHydration = hydration?.section === 'speaking' ? {
      outerIdx:   hydration.outerIdx,
      recordings: hydration.speakingRecordings,
    } : undefined;
    return (
      <PageBg>
        <SpeakingSection
          section={mock!.speaking}
          sectionLegacy={mock!.speakingLegacy}
          teacherId={teacherId}
          sessionId={sessionIdRef.current || 'anon'}
          onDone={onSpeakingDone}
          initial={speakingHydration}
          onSnapshot={(snap) => persistLiveSnapshot('speaking', snap)}
        />
      </PageBg>
    );
  }
  if (phase === 'writing') {
    const writingHydration = hydration?.section === 'writing' ? {
      subtask:              hydration.writingSubtask,
      buildSentenceAnswers: hydration.buildSentenceAnswers,
      emailText:            hydration.emailText,
      writingText:          hydration.writingText,
    } : undefined;
    return (
      <PageBg>
        <WritingSequence
          seq={mock!.writing}
          onDone={onWritingDone}
          initial={writingHydration}
          onSnapshot={(snap) => persistLiveSnapshot('writing', snap)}
          confirmSubmit
          practiceMode={practiceMode}
        />
      </PageBg>
    );
  }

  if (phase === 'grading') {
    return (
      <PageBg>
        <div className="w-full max-w-md space-y-4">
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full border-4 border-[#C8A8DC] border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold" style={{ color: B.purple }}>{gradingMsg}</p>
            <p className="text-xs text-gray-500 mt-1">Puede tardar 1-2 min.</p>
          </div>

          {speakingProgress.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-lg" style={{ boxShadow: '0 8px 32px -8px rgba(90,61,122,0.15)' }}>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-3" style={{ color: B.purpleMed }}>
                🎤 Speaking tasks
              </p>
              <ul className="space-y-1.5">
                {speakingProgress.map((p, i) => {
                  const icon =
                    p.status === 'done'         ? '✓'
                    : p.status === 'error'      ? '✗'
                    : p.status === 'skipped'    ? '↷'
                    : p.status === 'pending'    ? '·'
                    :                             '⏳';
                  const color =
                    p.status === 'done'         ? 'text-emerald-600'
                    : p.status === 'error'      ? 'text-red-600'
                    : p.status === 'skipped'    ? 'text-amber-600'
                    : p.status === 'pending'    ? 'text-gray-300'
                    :                             'text-purple-600';
                  const label =
                    p.status === 'transcribing' ? 'Transcribiendo audio…'
                    : p.status === 'grading'    ? 'Calificando con IA…'
                    : p.status === 'done'       ? (p.message ?? 'Listo')
                    : p.status === 'skipped'    ? 'Saltada'
                    : p.status === 'error'      ? (p.message ?? 'Error')
                    :                             'Esperando';
                  return (
                    <li key={p.promptId} className="flex items-center gap-3 text-xs">
                      <span className={`w-5 text-center font-black ${color}`}>{icon}</span>
                      <span className="text-[#5A3D7A] font-semibold w-16 shrink-0">Task {i + 1}</span>
                      <span className={`flex-1 truncate ${p.status === 'error' ? 'text-red-600' : 'text-gray-500'}`}>{label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </PageBg>
    );
  }

  // Practice mode: the student never sees the score or feedback — only a
  // thank-you card. The teacher sees the full breakdown from the dashboard.
  if (practiceMode) {
    return (
      <PageBg>
        <div className="w-full max-w-md rounded-3xl overflow-hidden bg-white text-center"
          style={{ boxShadow: '0 24px 64px -8px rgba(61,37,88,0.3)' }}>
          <div className="px-8 py-8 text-white"
            style={{ background: 'linear-gradient(135deg, #3D2558, #5A3D7A, #9B7CB8)' }}>
            <BrandHeader subtitle="TOEFL Practice Mode" />
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="text-6xl mb-3">🎉</div>
              <h1 className="text-2xl font-black leading-tight">¡Práctica completada!</h1>
              <p className="text-[12px] mt-2 opacity-80">{name}</p>
            </div>
          </div>
          <div className="p-8 space-y-3 text-left">
            <p className="text-sm text-gray-700 leading-relaxed">
              Tu profesor va a revisar tu práctica y darte feedback en la próxima clase.
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              En modo práctica no se muestran los scores automáticamente — el profesor los ve en su panel.
            </p>
            <p className="text-xs text-[#5A3D7A]/60 italic pt-2">
              Ya puedes cerrar esta ventana.
            </p>
          </div>
        </div>
      </PageBg>
    );
  }

  return (
    <PageBg>
      <ResultsScreen
        studentName={name}
        scores={scores}
        overall={overallLive}
        enabledSections={enabledSections}
        speakingResults={speakingResults}
        speakingSection={mock!.speaking}
        speakingPrompts={mock!.speakingLegacy}
        writingResult={writingResult}
        writingPrompt={mock!.writing}
      />
    </PageBg>
  );
}
