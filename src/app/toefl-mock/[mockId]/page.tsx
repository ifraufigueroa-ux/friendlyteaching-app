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
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import { getMock } from '@/lib/data/toefl/mock-1';
import type {
  TOEFLMock, TOEFLReadingPassage, TOEFLListeningAudio, TOEFLSpeakingPrompt,
  TOEFLWritingPrompt, ReadingAnswer, ListeningAnswer, SpeakingRecording,
  WritingSubmission, SectionScore, TOEFLSection, TOEFLLiveSnapshot,
  TOEFLReadingQuestionType, TOEFLSession,
} from '@/types/toefl';
import {
  readingRawToScaled, listeningRawToScaled, speakingRawToScaled,
  TOEFL_SECTIONS, TOEFL_SECTION_META,
} from '@/types/toefl';
import {
  findResumableSession, loadSession, saveLiveSnapshot, clearLiveSnapshot,
  debouncedSnapshot,
} from '@/lib/toefl/sessions';

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

function useCountdown(initialSec: number, running: boolean, onExpire?: () => void) {
  const [left, setLeft] = useState(initialSec);
  useEffect(() => { setLeft(initialSec); }, [initialSec]);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setLeft(t => {
        if (t <= 1) {
          queueMicrotask(() => onExpire?.());
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);
  return left;
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
      <p className="text-base font-semibold leading-snug" style={{ color: B.purpleDark }}>{prompt}</p>
      <div className="space-y-2">
        {options.map((opt, idx) => {
          const on = selected === idx;
          return (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                on ? 'border-[#5A3D7A] bg-[#F0E5FF] text-[#5A3D7A] font-semibold'
                   : 'border-gray-200 bg-white text-gray-700 hover:border-[#C8A8DC]'
              }`}
            >
              <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${
                on ? 'border-[#5A3D7A] bg-[#5A3D7A] text-white' : 'border-gray-300 text-gray-400'
              }`}>{String.fromCharCode(65 + idx)}</span>
              <span className="flex-1">{opt}</span>
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
  passages, onDone, initial, onSnapshot,
}: {
  passages:    TOEFLReadingPassage[];
  onDone:      (answers: ReadingAnswer[], timeLeftSec: number) => void;
  initial?:    { outerIdx: number; innerIdx: number; timeLeftSec?: number; answers?: ReadingAnswer[] };
  onSnapshot?: (snap: Omit<TOEFLLiveSnapshot, 'section'>) => void;
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
  const left = useCountdown(initialTimeLeft, true, () => finish());

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
          <div className="bg-white rounded-2xl p-6 shadow-lg"
            style={{ boxShadow: '0 8px 32px -8px rgba(90,61,122,0.15)' }}>
            <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: B.purpleMed }}>Review</span>
                <h2 className="font-serif text-2xl font-bold mt-1" style={{ color: B.purpleDark }}>
                  Reading · {answeredCount}/{totalQ} answered
                </h2>
              </div>
              <button
                onClick={finish}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: '#059669' }}
              >
                ✓ Submit Reading
              </button>
            </div>

            {passages.map((p, pi) => (
              <div key={p.id} className="mt-4">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: B.purple }}>
                  Passage {pi + 1} — {p.title}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {p.questions.map((qu, qi) => {
                    const answered = answers[qu.id]?.selected !== undefined && answers[qu.id]?.selected !== null;
                    return (
                      <button
                        key={qu.id}
                        onClick={() => jumpTo(pi, qi)}
                        className={`w-9 h-9 rounded-lg text-xs font-bold border-2 transition-colors ${
                          answered
                            ? 'border-[#5A3D7A] bg-[#F0E5FF] text-[#5A3D7A]'
                            : 'border-gray-200 bg-white text-gray-400 hover:border-[#C8A8DC]'
                        }`}
                        title={`Q${qi + 1} · ${READING_TYPE_LABEL[qu.type]}`}
                      >
                        {qi + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <p className="text-[11px] text-gray-500 italic mt-4">
              💡 Podés hacer click en cualquier número para volver a esa pregunta. Al Submit se calculan tus puntos y no podés modificar respuestas.
            </p>
          </div>
        </div>
        <TimerBar label="Reading · 35 min" seconds={left} totalSec={totalSec} warn={120} />
      </>
    );
  }

  // ── Main question view ──────────────────────────────────────────────
  const isLast = qIdx === passage.questions.length - 1 && pIdx === passages.length - 1;
  const isFirst = qIdx === 0 && pIdx === 0;

  return (
    <>
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-4 pb-24">
        {/* Passage with paragraph markers */}
        <div ref={passageRef} className="bg-white rounded-2xl p-6 shadow-lg max-h-[80vh] overflow-y-auto"
          style={{ boxShadow: '0 8px 32px -8px rgba(90,61,122,0.15)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: B.purpleMed }}>
              Passage {pIdx + 1} of {passages.length}
            </span>
            <span className="text-[10px] text-gray-400 tabular-nums">{passage.wordCount} words</span>
          </div>
          <h2 className="font-serif text-2xl font-bold mb-4" style={{ color: B.purpleDark }}>{passage.title}</h2>
          <div className="space-y-3 text-sm leading-relaxed text-gray-800">
            {passage.paragraphs.map((p, i) => {
              const highlighted = q.refPara === i + 1;
              return (
                <p
                  key={i}
                  data-para-idx={i}
                  className={`flex gap-3 rounded-lg px-2 py-1 -mx-2 transition-colors ${
                    highlighted ? 'bg-yellow-50 border-l-4 border-yellow-400 pl-3' : ''
                  }`}
                >
                  <span
                    className="shrink-0 font-black text-[11px] tracking-widest tabular-nums select-none"
                    style={{ color: highlighted ? '#B45309' : B.purpleMed }}
                  >
                    ¶{paraTag(i)}
                  </span>
                  <span className="flex-1">{p}</span>
                </p>
              );
            })}
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-2xl p-6 shadow-lg self-start"
          style={{ boxShadow: '0 8px 32px -8px rgba(90,61,122,0.15)' }}>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: B.purpleMed }}>
              Question {qIdx + 1} of {passage.questions.length}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: B.lavender, color: B.purple }}>
                {READING_TYPE_LABEL[q.type]}
              </span>
              {q.refPara && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
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
                  className={`w-7 h-7 rounded text-[10px] font-bold border-2 transition-colors ${
                    active    ? 'border-[#5A3D7A] bg-[#5A3D7A] text-white'
                    : answered ? 'border-[#5A3D7A] bg-[#F0E5FF] text-[#5A3D7A]'
                    :            'border-gray-200 bg-white text-gray-400 hover:border-[#C8A8DC]'
                  }`}
                >
                  {qi + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex justify-between gap-2">
            <button
              onClick={prevQuestion}
              disabled={isFirst}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500 disabled:opacity-30 hover:bg-gray-50 transition-colors"
            >
              ← Back
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setReviewing(true)}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-[#C8A8DC] text-[#5A3D7A] hover:bg-[#F0E5FF] transition-colors"
              >
                Review all
              </button>
              <button
                onClick={nextQuestion}
                disabled={selected === null}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-opacity hover:opacity-90"
                style={{ background: B.purple }}
              >
                {isLast ? 'Review →' : 'Next →'}
              </button>
            </div>
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
  audios, audioUrls, onDone, onGenerateAudio, initial, onSnapshot,
}: {
  audios:          TOEFLListeningAudio[];
  audioUrls:       Record<string, string>;
  onDone:          (answers: ListeningAnswer[], timeLeftSec: number, notes: Record<string, string>) => void;
  onGenerateAudio: (audioId: string) => Promise<string | null>;
  initial?:        { outerIdx: number; innerIdx: number; audioPhase?: 'play' | 'quiz'; timeLeftSec?: number; answers?: ListeningAnswer[]; notes?: Record<string, string> };
  onSnapshot?:     (snap: Omit<TOEFLLiveSnapshot, 'section'>) => void;
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
  const left = useCountdown(initialTimeLeft, true, () => finish());

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

  return (
    <>
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 pb-24">
        <div className="bg-white rounded-2xl p-6 shadow-lg" style={{ boxShadow: '0 8px 32px -8px rgba(90,61,122,0.15)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: B.purpleMed }}>
              Audio {aIdx + 1} of {audios.length} · {audio.type === 'lecture' ? 'Lecture' : 'Conversation'}
            </span>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest">{audio.subject}</span>
          </div>
          <h2 className="font-serif text-2xl font-bold mb-3" style={{ color: B.purpleDark }}>{audio.title}</h2>

          {phase === 'play' && (
            <>
              {url ? (
                <div className="bg-[#F0E5FF] rounded-xl p-3 mb-3">
                  <audio src={url} controls className="w-full" preload="auto" />
                  <p className="text-[10px] text-gray-500 mt-2 text-center italic">
                    Escuchá el audio con atención. Después vas a contestar {audio.questions.length} preguntas.
                    Podés tomar notas en el panel de la derecha.
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-3">
                  <p className="text-xs text-amber-800 font-semibold">⚠ Audio pendiente</p>
                  <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                    Tu profesor todavía no subió el audio para este clip. Avisale para que lo suba
                    desde su dashboard (menú TOEFL → panel &ldquo;Audios de Listening&rdquo;) y recargá esta página.
                  </p>
                  <button
                    onClick={requestGeneration}
                    disabled={generating}
                    className="mt-3 w-full py-2.5 rounded-xl text-xs font-bold text-amber-800 border border-amber-300 bg-white/70 hover:bg-white disabled:opacity-60 transition-colors"
                    title="Intenta generar el audio con TTS (requiere API key configurada en el servidor)"
                  >
                    {generating ? '⏳ Intentando generar…' : '🎙 Intentar generación automática'}
                  </button>
                  {genError && <p className="text-[11px] text-red-600 mt-2">{genError}</p>}
                </div>
              )}

              <ScriptViewer audio={audio} />

              <button
                onClick={() => setPhase('quiz')}
                disabled={!url}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed mt-3"
                style={{ background: B.purple }}
              >
                Continuar a las preguntas →
              </button>
            </>
          )}

          {phase === 'quiz' && (
            <>
              <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: B.purpleMed }}>
                  Question {qIdx + 1} of {audio.questions.length}
                </span>
                <button
                  onClick={() => setPhase('play')}
                  className="text-[10px] font-semibold text-[#5A3D7A] hover:underline"
                >
                  ↩ volver al audio
                </button>
              </div>
              <MCQCard prompt={q.prompt} options={q.options} selected={selected} onSelect={record} />

              <ScriptViewer audio={audio} />

              {/* Question dots for this audio */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {audio.questions.map((qu, qi) => {
                  const answered = answers[qu.id]?.selected !== undefined && answers[qu.id]?.selected !== null;
                  const active   = qi === qIdx;
                  return (
                    <button
                      key={qu.id}
                      onClick={() => setQIdx(qi)}
                      className={`w-7 h-7 rounded text-[10px] font-bold border-2 transition-colors ${
                        active    ? 'border-[#5A3D7A] bg-[#5A3D7A] text-white'
                        : answered ? 'border-[#5A3D7A] bg-[#F0E5FF] text-[#5A3D7A]'
                        :            'border-gray-200 bg-white text-gray-400 hover:border-[#C8A8DC]'
                      }`}
                    >
                      {qi + 1}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={nextQuestion}
                  disabled={selected === null}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-opacity hover:opacity-90"
                  style={{ background: B.purple }}
                >
                  {qIdx === audio.questions.length - 1 && aIdx === audios.length - 1
                    ? 'Finish Listening →'
                    : 'Next →'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Notes sidebar — always visible, per-audio */}
        <div className="bg-white rounded-2xl p-4 shadow-lg self-start"
          style={{ boxShadow: '0 8px 32px -8px rgba(90,61,122,0.15)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: B.purpleMed }}>
              📝 Notas — audio {aIdx + 1}
            </p>
          </div>
          <textarea
            value={notes[audio.id] ?? ''}
            onChange={e => setNotesFor(audio.id, e.target.value)}
            rows={14}
            placeholder="Escribí las palabras clave que escuchás. En el TOEFL real podés tomar notas mientras suena el audio."
            className="w-full text-xs px-3 py-2 rounded-lg border border-[#E8D5F0] focus:outline-none focus:border-[#9B7CB8] focus:ring-1 focus:ring-[#C8A8DC] leading-snug resize-y font-mono text-gray-700"
          />
          <p className="text-[9px] text-gray-400 mt-1.5 italic">
            Tus notas se guardan solas y se mantienen entre audios.
          </p>
        </div>
      </div>
      <TimerBar label="Listening · 20 min" seconds={left} totalSec={totalSec} warn={60} />
    </>
  );
}

// ── Speaking section ──────────────────────────────────────────────────────
//
// Flow per task: read → prep (15s) → speak (45s, MediaRecorder) → saving
// (blob upload to Storage + URL binding). Between tasks we emit a snapshot
// so a refresh keeps all previously-uploaded recordings. Mid-recording is
// intentionally NOT saved — the browser can't resume a MediaRecorder chunk
// stream across a page reload.

type MicStatus = 'unknown' | 'checking' | 'ok' | 'denied' | 'unsupported';

function SpeakingSection({
  prompts, teacherId, sessionId, onDone, initial, onSnapshot,
}: {
  prompts:    TOEFLSpeakingPrompt[];
  teacherId:  string;
  sessionId:  string;
  onDone:     (recordings: SpeakingRecording[]) => void;
  initial?:   { outerIdx: number; recordings?: SpeakingRecording[] };
  onSnapshot?: (snap: Omit<TOEFLLiveSnapshot, 'section'>) => void;
}) {
  const [pIdx, setPIdx] = useState(initial?.outerIdx ?? 0);
  const [phase, setPhase] = useState<'read' | 'prep' | 'speak' | 'saving'>('read');
  const [recordings, setRecordings] = useState<SpeakingRecording[]>(initial?.recordings ?? []);
  const [error, setError] = useState('');
  const [micStatus, setMicStatus] = useState<MicStatus>('unknown');
  const chunks = useRef<Blob[]>([]);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const prompt = prompts[pIdx];

  const prepLeft = useCountdown(prompt.prepSec, phase === 'prep', () => startSpeaking());
  const speakLeft = useCountdown(prompt.speakSec, phase === 'speak', () => stopSpeaking());

  // Emit snapshot on every task advance (not mid-recording).
  useEffect(() => {
    if (!onSnapshot) return;
    onSnapshot({
      outerIdx:           pIdx,
      innerIdx:           0,
      timeLeftSec:        0,
      speakingRecordings: recordings,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pIdx, recordings]);

  // Pre-flight mic check on mount — surface permission problems BEFORE the
  // student burns a task on a denied prompt.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setMicStatus('unsupported'); return;
    }
    setMicStatus('checking');
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((s) => {
        // Release the check stream immediately; we'll re-request on record.
        s.getTracks().forEach(t => t.stop());
        setMicStatus('ok');
      })
      .catch((err) => {
        console.warn('[speaking] mic preflight denied:', err);
        setMicStatus('denied');
      });
  }, []);

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
      console.error('[speaking] mic error:', err);
      setError('No se pudo acceder al micrófono. Revisá permisos del navegador.');
      setPhase('read');
      setMicStatus('denied');
    }
  }

  function startPrep() {
    setError('');
    setPhase('prep');
  }
  function startSpeaking() {
    setPhase('speak');
    startRecording();
  }

  async function stopSpeaking() {
    if (!recorder.current) { setPhase('saving'); return; }
    setPhase('saving');
    await new Promise<void>((resolve) => {
      const rec = recorder.current!;
      rec.onstop = () => resolve();
      rec.stop();
    });
    stream.current?.getTracks().forEach(t => t.stop());
    const blob = new Blob(chunks.current, { type: recorder.current!.mimeType });
    const path = `audio/toefl-speaking-${teacherId}-${sessionId}-${prompt.id}-${Date.now()}.webm`;
    try {
      const sref = storageRef(storage, path);
      await uploadBytes(sref, blob, { contentType: blob.type });
      const url = await getDownloadURL(sref);
      const rec: SpeakingRecording = {
        promptId:    prompt.id,
        storagePath: path,
        audioUrl:    url,
        durationSec: prompt.speakSec - speakLeft,
      };
      const next = [...recordings, rec];
      setRecordings(next);
      // Advance
      if (pIdx < prompts.length - 1) {
        setPIdx(i => i + 1);
        setPhase('read');
      } else {
        onDone(next);
      }
    } catch (err) {
      console.error('[speaking] upload error:', err);
      setError('Error subiendo el audio. Intentá de nuevo o pasá al siguiente.');
      setPhase('speak');
    }
  }

  function skip() {
    // Persist a placeholder so the grading pipeline knows the task was
    // consciously skipped (score 0), and so save/resume doesn't jump the
    // student back onto a task they already gave up on.
    const placeholder: SpeakingRecording = {
      promptId:    prompt.id,
      storagePath: '',
      audioUrl:    '',
      durationSec: 0,
    };
    const next = [...recordings, placeholder];
    setRecordings(next);
    setError('');
    if (pIdx < prompts.length - 1) {
      setPIdx(i => i + 1);
      setPhase('read');
    } else {
      onDone(next);
    }
  }

  const doneIds = new Set(recordings.map(r => r.promptId));

  return (
    <div className="w-full max-w-2xl">
      <div className="bg-white rounded-2xl p-6 shadow-lg" style={{ boxShadow: '0 8px 32px -8px rgba(90,61,122,0.15)' }}>
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: B.purpleMed }}>
            Speaking · Task {pIdx + 1} of {prompts.length} · {prompt.category}
          </span>
          {/* Task navigator dots (read-only — you can't jump back in Speaking) */}
          <div className="flex gap-1.5">
            {prompts.map((p, i) => {
              const done = doneIds.has(p.id);
              const active = i === pIdx;
              return (
                <span
                  key={p.id}
                  title={`Task ${i + 1}${done ? ' · grabada' : active ? ' · actual' : ' · pendiente'}`}
                  className={`w-6 h-6 rounded text-[10px] font-bold border-2 flex items-center justify-center ${
                    active ? 'border-[#5A3D7A] bg-[#5A3D7A] text-white'
                    : done  ? 'border-[#5A3D7A] bg-[#F0E5FF] text-[#5A3D7A]'
                    :         'border-gray-200 bg-white text-gray-400'
                  }`}
                >
                  {i + 1}
                </span>
              );
            })}
          </div>
        </div>
        <div className="bg-[#F0E5FF] border border-[#C8A8DC]/60 rounded-xl p-4 mb-4">
          <p className="text-sm text-[#2D1B4E] leading-relaxed">{prompt.prompt}</p>
        </div>

        {/* Mic status banner — visible whenever we're not actively recording */}
        {phase !== 'speak' && phase !== 'saving' && micStatus !== 'ok' && (
          <div className={`mb-3 rounded-xl px-3 py-2 text-xs flex items-center justify-between gap-2 border ${
            micStatus === 'checking'    ? 'bg-blue-50 border-blue-200 text-blue-800'
            : micStatus === 'denied'    ? 'bg-red-50 border-red-200 text-red-700'
            : micStatus === 'unsupported' ? 'bg-red-50 border-red-200 text-red-700'
            :                              'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <span>
              {micStatus === 'checking'    && '🎙 Verificando micrófono…'}
              {micStatus === 'denied'      && '⚠ Micrófono bloqueado. Habilitá permisos en el candado de la barra de direcciones y recargá.'}
              {micStatus === 'unsupported' && '⚠ Tu navegador no soporta grabación. Usá Chrome/Edge/Firefox actualizado.'}
              {micStatus === 'unknown'     && '⚠ Estado del micrófono desconocido.'}
            </span>
            {micStatus === 'denied' && (
              <button
                onClick={() => {
                  setMicStatus('checking');
                  navigator.mediaDevices.getUserMedia({ audio: true })
                    .then((s) => { s.getTracks().forEach(t => t.stop()); setMicStatus('ok'); })
                    .catch(() => setMicStatus('denied'));
                }}
                className="text-red-700 underline whitespace-nowrap"
              >
                Reintentar
              </button>
            )}
          </div>
        )}

        {phase === 'read' && (
          <div className="text-center space-y-3">
            <p className="text-[11px] text-gray-500">
              Vas a tener <strong>{prompt.prepSec}s de preparación</strong>, y después <strong>{prompt.speakSec}s para grabar</strong> tu respuesta.
            </p>
            <button
              onClick={startPrep}
              disabled={micStatus !== 'ok'}
              className="px-6 py-3 rounded-full text-sm font-bold text-white shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: B.purple }}
            >
              ▶ Empezar preparación
            </button>
            {recordings.length > 0 && (
              <p className="text-[10px] text-gray-400">
                {recordings.length} de {prompts.length} tasks completadas — al final el AI las califica todas juntas.
              </p>
            )}
            <button
              onClick={skip}
              className="text-[10px] text-gray-400 hover:text-red-500 underline block mx-auto mt-2"
            >
              Saltar esta task
            </button>
          </div>
        )}

        {phase === 'prep' && (
          <div className="text-center py-6 space-y-3">
            <div className="text-6xl font-black tabular-nums" style={{ color: B.purple }}>{prepLeft}</div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: B.purpleMed }}>Preparación</p>
            <p className="text-[11px] text-gray-500">Pensá tu respuesta. La grabación arranca sola.</p>
            <button onClick={startSpeaking} className="text-xs text-gray-400 hover:text-gray-600 mt-2">Empezar a grabar ahora →</button>
          </div>
        )}

        {phase === 'speak' && (
          <div className="text-center py-6 space-y-3">
            <div className="text-6xl font-black tabular-nums text-red-500 animate-pulse">{speakLeft}</div>
            <p className="text-xs font-bold uppercase tracking-widest text-red-600">🔴 Grabando</p>
            <p className="text-[11px] text-gray-500">Hablá con claridad. La grabación se corta sola al llegar a 0.</p>
            <button
              onClick={stopSpeaking}
              className="px-5 py-2 rounded-full text-xs font-bold border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Terminar ahora
            </button>
          </div>
        )}

        {phase === 'saving' && (
          <div className="text-center py-8">
            <div className="w-10 h-10 rounded-full border-4 border-[#C8A8DC] border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold" style={{ color: B.purple }}>Guardando audio…</p>
            <p className="text-[11px] text-gray-500 mt-1">
              {pIdx < prompts.length - 1
                ? 'Cuando termine, pasamos a la próxima task.'
                : 'Última task. Al terminar arranca la calificación con AI (~1-2 min).'}
            </p>
          </div>
        )}

        {error && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700 flex items-center justify-between gap-2">
            <span>{error}</span>
            <button onClick={skip} className="text-red-600 underline whitespace-nowrap">Saltar task →</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Writing section ───────────────────────────────────────────────────────

function WritingSection({
  prompt, onDone,
}: {
  prompt: TOEFLWritingPrompt;
  onDone: (submission: WritingSubmission) => void;
}) {
  const [text, setText] = useState('');
  const totalSec = prompt.timerMin * 60;
  const left = useCountdown(totalSec, true, () => submit());
  const wordCount = useMemo(() => text.trim().split(/\s+/).filter(Boolean).length, [text]);
  const meets = wordCount >= prompt.minWords;

  function submit() {
    onDone({ promptId: prompt.id, text, wordCount });
  }

  return (
    <>
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-4 pb-24">
        {/* Prompt */}
        <div className="bg-white rounded-2xl p-5 shadow-lg max-h-[80vh] overflow-y-auto"
          style={{ boxShadow: '0 8px 32px -8px rgba(90,61,122,0.15)' }}>
          <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: B.purpleMed }}>
            Writing Task 2 · Academic Discussion
          </span>
          <p className="text-xs text-gray-600 mt-2 whitespace-pre-line leading-relaxed">{prompt.professorPost}</p>

          <div className="mt-4 space-y-3">
            <div className="rounded-lg bg-[#F0E5FF] p-3">
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: B.purple }}>Prof.</p>
              <p className="text-xs text-[#2D1B4E] mt-1 leading-relaxed">{prompt.question}</p>
            </div>
            <div className="rounded-lg bg-white border border-gray-200 p-3">
              <p className="text-[10px] font-bold" style={{ color: B.purpleMed }}>{prompt.studentA.name}</p>
              <p className="text-xs text-gray-700 mt-1 leading-relaxed">{prompt.studentA.text}</p>
            </div>
            <div className="rounded-lg bg-white border border-gray-200 p-3">
              <p className="text-[10px] font-bold" style={{ color: B.purpleMed }}>{prompt.studentB.name}</p>
              <p className="text-xs text-gray-700 mt-1 leading-relaxed">{prompt.studentB.text}</p>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="bg-white rounded-2xl p-5 shadow-lg self-start"
          style={{ boxShadow: '0 8px 32px -8px rgba(90,61,122,0.15)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: B.purpleMed }}>Tu respuesta</span>
            <span className={`text-xs font-mono tabular-nums font-bold ${meets ? 'text-emerald-600' : 'text-amber-600'}`}>
              {wordCount} / {prompt.minWords} palabras {meets && '✓'}
            </span>
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            autoFocus
            placeholder="Escribí tu contribución al debate…"
            spellCheck
            className="w-full min-h-[420px] px-4 py-3 rounded-xl border border-[#E8D5F0] text-sm text-[#2D1B4E] leading-relaxed focus:outline-none focus:border-[#9B7CB8] focus:ring-2 focus:ring-[#C8A8DC]/40 font-mono resize-y"
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={submit}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all"
            >
              ✓ Submit Writing
            </button>
          </div>
        </div>
      </div>
      <TimerBar label={`Writing · ${prompt.timerMin} min`} seconds={left} totalSec={totalSec} warn={60} />
    </>
  );
}

// ── Results ───────────────────────────────────────────────────────────────

function ResultsScreen({
  studentName, scores, overall, enabledSections, speakingResults, speakingPrompts,
}: {
  studentName:     string;
  scores:          Partial<Record<'reading'|'listening'|'speaking'|'writing', SectionScore>>;
  overall:         number;
  enabledSections: TOEFLSection[];
  speakingResults?: SpeakingRecording[];
  speakingPrompts?: TOEFLSpeakingPrompt[];
}) {
  const [downloading, setDownloading] = useState(false);
  const isPartial = enabledSections.length < 4;
  const maxScore = enabledSections.length * 30;
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
              {isPartial ? `Subtotal (${enabledSections.length}/4)` : 'Total TOEFL'}
            </p>
            <p className="text-7xl font-black mt-1 tabular-nums">{overall}</p>
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
                      <span className="text-lg font-black tabular-nums" style={{ color: B.purple }}>{sc?.score ?? 0}</span>
                    </div>
                    <div className="h-1.5 bg-[#F0E5FF] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] rounded-full"
                        style={{ width: `${((sc?.score ?? 0) / 30) * 100}%` }} />
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
          {speakingResults && speakingResults.length > 0 && speakingPrompts && (
            <SpeakingBreakdown recordings={speakingResults} prompts={speakingPrompts} />
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

function SpeakingBreakdown({
  recordings, prompts,
}: {
  recordings: SpeakingRecording[];
  prompts:    TOEFLSpeakingPrompt[];
}) {
  const anyError = recordings.some(r => r.aiError);
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-3" style={{ color: B.purple }}>
        🎤 Detalle por task
      </p>
      {anyError && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
          Al menos una task falló al calificarse. Se ven los detalles debajo. Contactá a tu profesor si esto se repite.
        </div>
      )}
      <div className="space-y-3">
        {recordings.map((r, i) => {
          const prompt = prompts.find(p => p.id === r.promptId);
          const errored = !!r.aiError;
          return (
            <details
              key={r.promptId}
              className="rounded-xl border overflow-hidden bg-white"
              style={{ borderColor: errored ? '#FCA5A5' : B.lavenderDark }}
              open={errored}
            >
              <summary className="cursor-pointer px-3 py-2 flex items-center justify-between gap-2 select-none"
                style={{ background: errored ? '#FEF2F2' : '#FDFAFF' }}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#5A3D7A] shrink-0">
                    Task {i + 1}
                  </span>
                  <span className="text-[10px] text-gray-500 truncate">
                    {prompt?.category ?? ''} · {r.durationSec.toFixed(0)}s
                  </span>
                </div>
                <span className={`text-sm font-black tabular-nums shrink-0 ${errored ? 'text-red-600' : 'text-[#5A3D7A]'}`}>
                  {errored ? '⚠' : `${r.aiScore ?? 0}/4`}
                </span>
              </summary>
              <div className="p-3 space-y-2 border-t" style={{ borderColor: errored ? '#FECACA' : B.lavenderDark }}>
                {prompt && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#5A3D7A]/60 mb-0.5">Prompt</p>
                    <p className="text-[11px] text-gray-600 leading-snug">{prompt.prompt}</p>
                  </div>
                )}
                {r.aiRubric && (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {(['delivery', 'languageUse', 'topicDevelopment'] as const).map((k) => (
                      <div key={k} className="rounded-lg border p-2 text-center" style={{ borderColor: B.lavenderDark }}>
                        <p className="text-[8px] font-black uppercase tracking-widest text-[#5A3D7A]/60">
                          {k === 'delivery' ? 'Delivery' : k === 'languageUse' ? 'Language' : 'Topic dev'}
                        </p>
                        <p className="text-lg font-black tabular-nums" style={{ color: B.purple }}>{r.aiRubric![k]}/4</p>
                      </div>
                    ))}
                  </div>
                )}
                {r.transcript && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#5A3D7A]/60 mb-0.5">Transcripción</p>
                    <p className="text-[11px] text-gray-700 italic leading-snug">&ldquo;{r.transcript}&rdquo;</p>
                  </div>
                )}
                {r.aiFeedback && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#5A3D7A]/60 mb-0.5">Feedback</p>
                    <p className={`text-[11px] leading-snug ${errored ? 'text-red-700' : 'text-gray-700'}`}>{r.aiFeedback}</p>
                  </div>
                )}
                {r.aiStrengths && r.aiStrengths.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700 mb-0.5">✓ Fortalezas</p>
                    <ul className="text-[11px] text-emerald-800 list-disc pl-4 space-y-0.5">
                      {r.aiStrengths.map((s, si) => <li key={si}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {r.aiImprovements && r.aiImprovements.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-700 mb-0.5">↗ Para mejorar</p>
                    <ul className="text-[11px] text-amber-800 list-disc pl-4 space-y-0.5">
                      {r.aiImprovements.map((s, si) => <li key={si}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {r.audioUrl && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#5A3D7A]/60 mb-1">Tu audio</p>
                    <audio src={r.audioUrl} controls className="w-full h-8" />
                  </div>
                )}
              </div>
            </details>
          );
        })}
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
      const found = await findResumableSession(teacherId, mock?.id ?? mockId, name.trim());
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
    const overall = Object.values(combined).reduce((s, v) => s + (v?.score ?? 0), 0);
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
    const enriched: SpeakingRecording[] = [];
    const rawScores: number[] = [];
    for (let i = 0; i < recordings.length; i++) {
      const rec = recordings[i];
      const prompt = mock!.speaking.find(p => p.id === rec.promptId);
      if (!prompt) { enriched.push(rec); continue; }

      // Explicit skips (from the "Saltar task" button) carry an empty audioUrl.
      // Score them 0 without hitting Whisper/Claude.
      if (!rec.audioUrl) {
        rawScores.push(0);
        enriched.push({ ...rec, aiScore: 0, aiFeedback: 'Task saltada por el estudiante.' });
        setSpeakingProgress((prev) => prev.map((p, idx) => idx === i ? { ...p, status: 'skipped' } : p));
        continue;
      }

      try {
        // ── Transcribe ────────────────────────────────────────────────
        // Send the audioUrl to the server and let it download from Firebase
        // Storage (no browser CORS on server-to-server fetches).
        setSpeakingProgress((prev) => prev.map((p, idx) => idx === i ? { ...p, status: 'transcribing' } : p));
        const tRes = await fetch('/api/transcribe-speech', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ audioUrl: rec.audioUrl, language: 'en' }),
        });
        const tJson = await tRes.json().catch(() => ({}));
        if (!tRes.ok) {
          throw new Error(`Transcribe ${tRes.status}: ${tJson?.error ?? 'sin respuesta'}`);
        }
        const transcript = String(tJson.text ?? '').trim();
        if (!transcript) {
          // Whisper returned empty — likely silent recording or unsupported format.
          rawScores.push(0);
          enriched.push({
            ...rec, transcript: '', aiScore: 0,
            aiFeedback: 'No se detectó voz en el audio grabado. Revisá el micrófono.',
            aiError: 'Empty transcript',
          });
          setSpeakingProgress((prev) => prev.map((p, idx) => idx === i ? { ...p, status: 'error', message: 'Sin voz detectada' } : p));
          continue;
        }

        // ── Grade ─────────────────────────────────────────────────────
        setSpeakingProgress((prev) => prev.map((p, idx) => idx === i ? { ...p, status: 'grading' } : p));
        const gRes = await fetch('/api/ai-grade-toefl-speaking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: prompt.prompt, transcript, durationSec: rec.durationSec }),
        });
        const gJson = await gRes.json().catch(() => ({}));
        if (!gRes.ok) {
          throw new Error(`Grade ${gRes.status}: ${gJson?.error ?? 'sin respuesta'}`);
        }
        const rawScore = Number(gJson.rawScore04 ?? 0);
        rawScores.push(rawScore);
        enriched.push({
          ...rec, transcript,
          aiScore:        rawScore,
          aiFeedback:     String(gJson.feedback ?? ''),
          aiRubric:       gJson.rubric,
          aiStrengths:    Array.isArray(gJson.strengths)    ? gJson.strengths    : undefined,
          aiImprovements: Array.isArray(gJson.improvements) ? gJson.improvements : undefined,
        });
        setSpeakingProgress((prev) => prev.map((p, idx) => idx === i ? { ...p, status: 'done', message: `Score ${rawScore}/4` } : p));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[toefl-mock] speaking grade err:', msg);
        rawScores.push(0);
        enriched.push({
          ...rec,
          aiScore:    0,
          aiFeedback: `Error al calificar: ${msg}`,
          aiError:    msg,
        });
        setSpeakingProgress((prev) => prev.map((p, idx) => idx === i ? { ...p, status: 'error', message: msg } : p));
      }
    }
    // If some tasks were skipped (fewer than 4), pad with 0 so the sum still
    // divides by 4 in speakingRawToScaled.
    while (rawScores.length < mock!.speaking.length) rawScores.push(0);
    const score: SectionScore = {
      section: 'speaking',
      score:   speakingRawToScaled(rawScores),
    };
    setScores(prev => ({ ...prev, speaking: score }));
    setSpeakingResults(enriched);
    await persistSection('speaking', { recordings: enriched, score });
    if (sessionIdRef.current) await clearLiveSnapshot(sessionIdRef.current);
    setHydration(null);
    await advanceFrom('speaking', score);
  }

  async function onWritingDone(submission: WritingSubmission) {
    setPhase('grading');
    setGradingMsg('Calificando Writing…');
    let enriched = submission;
    let sectionScore = 0;
    try {
      const promptText = [
        mock!.writing.professorPost,
        `\n\nProfesor: ${mock!.writing.question}`,
        `\n\n${mock!.writing.studentA.name}: ${mock!.writing.studentA.text}`,
        `\n\n${mock!.writing.studentB.name}: ${mock!.writing.studentB.text}`,
      ].join('');
      const gRes = await fetch('/api/ai-grade-toefl-writing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt:        promptText,
          studentAnswer: submission.text,
          wordCount:     submission.wordCount,
          minWords:      mock!.writing.minWords,
        }),
      });
      const gJson = await gRes.json();
      enriched = {
        ...submission,
        aiScore:    Number(gJson.rawScore05 ?? 0),
        aiFeedback: gJson.feedback,
        aiRubric:   gJson.rubric,
      };
      sectionScore = Number(gJson.sectionScore030 ?? 0);
    } catch (err) {
      console.error('[toefl-mock] writing grade err:', err);
    }
    const score: SectionScore = { section: 'writing', score: sectionScore };
    setScores(prev => ({ ...prev, writing: score }));
    await persistSection('writing', { submission: enriched, score });
    await advanceFrom('writing', score);
  }

  const overallLive = Object.values(scores).reduce((s, v) => s + (v?.score ?? 0), 0);

  // ── Render ──
  if (phase === 'landing') {
    return (
      <PageBg>
        <div className="w-full max-w-md rounded-3xl overflow-hidden bg-white" style={{ boxShadow: '0 24px 64px -8px rgba(61,37,88,0.3)' }}>
          <div className="px-8 py-7" style={{ background: 'linear-gradient(135deg, #3D2558, #5A3D7A, #9B7CB8)' }}>
            <BrandHeader subtitle="TOEFL Academic Simulator" />
            <h1 className="text-2xl font-black text-white leading-tight mt-6 pt-6 border-t border-white/10">
              {mock.title}
            </h1>
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
                <p className="text-[11px] font-black uppercase tracking-widest text-[#5A3D7A]">
                  📌 Test en curso
                </p>
                <p className="text-[11px] text-[#5A3D7A]/80 mt-1">
                  Encontramos una sesión sin terminar para <strong>{resumeCandidate.studentName}</strong>. Podés continuar donde quedaste.
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
            <BrandHeader subtitle="TOEFL Academic Simulator" />
            <p className="text-lg font-serif font-bold text-white mt-4">Hola {name}, ¡vamos!</p>
            {isPartial && (
              <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Práctica parcial: {enabledSections.length} de {TOEFL_SECTIONS.length} secciones (~{totalMin} min)
              </p>
            )}
          </div>
          <div className="p-8 space-y-4">
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
          prompts={mock!.speaking}
          teacherId={teacherId}
          sessionId={sessionIdRef.current || 'anon'}
          onDone={onSpeakingDone}
          initial={speakingHydration}
          onSnapshot={(snap) => persistLiveSnapshot('speaking', snap)}
        />
      </PageBg>
    );
  }
  if (phase === 'writing') return <PageBg><WritingSection prompt={mock!.writing} onDone={onWritingDone} /></PageBg>;

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

  return (
    <PageBg>
      <ResultsScreen
        studentName={name}
        scores={scores}
        overall={overallLive}
        enabledSections={enabledSections}
        speakingResults={speakingResults}
        speakingPrompts={mock!.speaking}
      />
    </PageBg>
  );
}
