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
  WritingSubmission, SectionScore,
} from '@/types/toefl';
import {
  readingRawToScaled, listeningRawToScaled, speakingRawToScaled,
} from '@/types/toefl';

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

function ReadingSection({
  passages, onDone,
}: {
  passages: TOEFLReadingPassage[];
  onDone: (answers: ReadingAnswer[]) => void;
}) {
  const [pIdx, setPIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, ReadingAnswer>>({});
  const startRef = useRef(Date.now());
  const totalSec = 35 * 60;
  const left = useCountdown(totalSec, true, () => finish());

  const passage = passages[pIdx];
  const q = passage.questions[qIdx];
  const selected = answers[q.id]?.selected ?? null;

  function record(idx: number) {
    const ans: ReadingAnswer = {
      questionId: q.id,
      passageId:  passage.id,
      selected:   idx as 0 | 1 | 2 | 3,
      correct:    idx === q.correct,
    };
    setAnswers(prev => ({ ...prev, [q.id]: ans }));
  }

  function nextQuestion() {
    if (qIdx < passage.questions.length - 1) {
      setQIdx(i => i + 1);
      return;
    }
    if (pIdx < passages.length - 1) {
      setPIdx(i => i + 1);
      setQIdx(0);
      return;
    }
    finish();
  }

  function finish() {
    const full: ReadingAnswer[] = passages.flatMap(p =>
      p.questions.map(qu => answers[qu.id] ?? {
        questionId: qu.id,
        passageId:  p.id,
        selected:   null,
        correct:    false,
      }),
    );
    onDone(full);
  }

  return (
    <>
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-4 pb-24">
        {/* Passage */}
        <div className="bg-white rounded-2xl p-6 shadow-lg max-h-[80vh] overflow-y-auto"
          style={{ boxShadow: '0 8px 32px -8px rgba(90,61,122,0.15)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: B.purpleMed }}>
              Passage {pIdx + 1} of {passages.length}
            </span>
            <span className="text-[10px] text-gray-400">{passage.wordCount} words</span>
          </div>
          <h2 className="font-serif text-2xl font-bold mb-4" style={{ color: B.purpleDark }}>{passage.title}</h2>
          <div className="space-y-3 text-sm leading-relaxed text-gray-800">
            {passage.paragraphs.map((p, i) => (
              <p key={i} className={q.refPara === i + 1 ? 'bg-yellow-50 border-l-4 border-yellow-400 pl-3 -ml-3' : ''}>{p}</p>
            ))}
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-2xl p-6 shadow-lg self-start"
          style={{ boxShadow: '0 8px 32px -8px rgba(90,61,122,0.15)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: B.purpleMed }}>
              Question {qIdx + 1} of {passage.questions.length} · {q.type}
            </span>
          </div>
          <MCQCard prompt={q.prompt} options={q.options} selected={selected} onSelect={record} />
          <div className="mt-5 flex justify-end">
            <button
              onClick={nextQuestion}
              disabled={selected === null}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-opacity hover:opacity-90"
              style={{ background: B.purple }}
            >
              {qIdx === passage.questions.length - 1 && pIdx === passages.length - 1
                ? 'Finish Reading →'
                : 'Next →'}
            </button>
          </div>
        </div>
      </div>
      <TimerBar label="Reading · 35 min" seconds={left} totalSec={totalSec} warn={120} />
    </>
  );
}

// ── Listening section ─────────────────────────────────────────────────────

function ListeningSection({
  audios, audioUrls, onDone,
}: {
  audios:    TOEFLListeningAudio[];
  audioUrls: Record<string, string>;
  onDone:    (answers: ListeningAnswer[]) => void;
}) {
  const [aIdx, setAIdx] = useState(0);
  const [phase, setPhase] = useState<'play' | 'quiz'>('play');
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, ListeningAnswer>>({});
  const totalSec = 20 * 60;
  const left = useCountdown(totalSec, true, () => finish());

  const audio = audios[aIdx];
  const q = audio.questions[qIdx];
  const url = audioUrls[audio.id];
  const selected = phase === 'quiz' ? answers[q.id]?.selected ?? null : null;

  function record(idx: number) {
    const ans: ListeningAnswer = {
      questionId: q.id,
      audioId:    audio.id,
      selected:   idx as 0 | 1 | 2 | 3,
      correct:    idx === q.correct,
    };
    setAnswers(prev => ({ ...prev, [q.id]: ans }));
  }

  function nextQuestion() {
    if (qIdx < audio.questions.length - 1) { setQIdx(i => i + 1); return; }
    if (aIdx < audios.length - 1) {
      setAIdx(i => i + 1);
      setQIdx(0);
      setPhase('play');
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
    onDone(full);
  }

  return (
    <>
      <div className="w-full max-w-2xl space-y-4 pb-24">
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
                  <audio src={url} controls className="w-full" />
                  <p className="text-[10px] text-gray-500 mt-2 text-center italic">
                    Escuchá el audio con atención. Después vas a contestar {audio.questions.length} preguntas.
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-3">
                  <p className="text-xs text-amber-800 font-semibold">⚠ Audio no generado todavía</p>
                  <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                    Ejecutá <code className="bg-white/60 px-1 rounded">node scripts/generate-toefl-audios.js</code> para
                    generar el audio con ElevenLabs y bindearlo. Mientras tanto, podés leer el script para simular.
                  </p>
                  <details className="mt-2">
                    <summary className="text-[11px] font-semibold text-amber-800 cursor-pointer">Ver script</summary>
                    <div className="mt-2 max-h-64 overflow-y-auto text-[11px] text-gray-700 space-y-1.5">
                      {audio.script.map((line, i) => {
                        const speaker = audio.speakers.find(s => s.id === line.speakerId)?.name ?? line.speakerId;
                        return (
                          <p key={i}><strong className="text-[#5A3D7A]">{speaker}:</strong> {line.text}</p>
                        );
                      })}
                    </div>
                  </details>
                </div>
              )}
              <button
                onClick={() => setPhase('quiz')}
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
                  Question {qIdx + 1} of {audio.questions.length}
                </span>
              </div>
              <MCQCard prompt={q.prompt} options={q.options} selected={selected} onSelect={record} />
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
      </div>
      <TimerBar label="Listening · 20 min" seconds={left} totalSec={totalSec} warn={60} />
    </>
  );
}

// ── Speaking section ──────────────────────────────────────────────────────

function SpeakingSection({
  prompts, teacherId, sessionId, onDone,
}: {
  prompts:  TOEFLSpeakingPrompt[];
  teacherId: string;
  sessionId: string;
  onDone:   (recordings: SpeakingRecording[]) => void;
}) {
  const [pIdx, setPIdx] = useState(0);
  const [phase, setPhase] = useState<'read' | 'prep' | 'speak' | 'saving'>('read');
  const [recordings, setRecordings] = useState<SpeakingRecording[]>([]);
  const [error, setError] = useState('');
  const chunks = useRef<Blob[]>([]);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const prompt = prompts[pIdx];

  const prepLeft = useCountdown(prompt.prepSec, phase === 'prep', () => startSpeaking());
  const speakLeft = useCountdown(prompt.speakSec, phase === 'speak', () => stopSpeaking());

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
    // Mark as missing; advance
    const next = [...recordings];
    if (pIdx < prompts.length - 1) {
      setPIdx(i => i + 1);
      setPhase('read');
    } else {
      onDone(next);
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="bg-white rounded-2xl p-6 shadow-lg" style={{ boxShadow: '0 8px 32px -8px rgba(90,61,122,0.15)' }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: B.purpleMed }}>
            Speaking · Task {pIdx + 1} of {prompts.length} · {prompt.category}
          </span>
        </div>
        <div className="bg-[#F0E5FF] border border-[#C8A8DC]/60 rounded-xl p-4 mb-4">
          <p className="text-sm text-[#2D1B4E] leading-relaxed">{prompt.prompt}</p>
        </div>

        {phase === 'read' && (
          <div className="text-center space-y-3">
            <p className="text-[11px] text-gray-500">
              Vas a tener <strong>{prompt.prepSec}s de preparación</strong>, y después <strong>{prompt.speakSec}s para grabar</strong> tu respuesta.
            </p>
            <button
              onClick={startPrep}
              className="px-6 py-3 rounded-full text-sm font-bold text-white shadow-lg hover:opacity-90 active:scale-95 transition-all"
              style={{ background: B.purple }}
            >
              ▶ Empezar preparación
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
          </div>
        )}

        {error && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700 flex items-center justify-between gap-2">
            <span>{error}</span>
            <button onClick={skip} className="text-red-600 underline whitespace-nowrap">Skip task →</button>
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
  studentName, scores, overall,
}: {
  studentName: string;
  scores:      Partial<Record<'reading'|'listening'|'speaking'|'writing', SectionScore>>;
  overall:     number;
}) {
  const [downloading, setDownloading] = useState(false);
  const sections: ('reading' | 'listening' | 'speaking' | 'writing')[] = ['reading', 'listening', 'speaking', 'writing'];
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
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-70">Total TOEFL</p>
            <p className="text-7xl font-black mt-1 tabular-nums">{overall}</p>
            <p className="text-sm mt-2 opacity-80">/ 120 · {studentName}</p>
          </div>
        </div>

        <div className="bg-white p-6 space-y-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-3" style={{ color: B.purple }}>
              Puntaje por sección
            </p>
            <div className="grid grid-cols-2 gap-2">
              {sections.map(s => {
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

  const mock: TOEFLMock | undefined = getMock(mockId);

  const [phase, setPhase] = useState<Phase>('landing');
  const [name, setName] = useState(nameParam);
  const [email, setEmail] = useState(emailParam);
  const [teacherId] = useState(teacherIdParam);
  const [formError, setFormError] = useState('');
  const [gradingMsg, setGradingMsg] = useState('Calificando…');

  const sessionIdRef = useRef<string>('');
  const [scores, setScores] = useState<Partial<Record<'reading'|'listening'|'speaking'|'writing', SectionScore>>>({});
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});

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

  async function ensureSession(): Promise<string> {
    if (sessionIdRef.current) return sessionIdRef.current;
    const ref = doc(collection(db, 'toeflSessions'));
    sessionIdRef.current = ref.id;
    await setDoc(ref, {
      teacherId,
      studentName:  name.trim(),
      studentEmail: email.trim() || null,
      mockId:       mock?.id ?? mockId,
      results:      {},
      progress:     { reading: 'pending', listening: 'pending', speaking: 'pending', writing: 'pending' },
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
    setPhase('listening');
  }

  async function onListeningDone(answers: ListeningAnswer[]) {
    const correct = answers.filter(a => a.correct).length;
    const score: SectionScore = {
      section: 'listening',
      raw:     correct,
      outOf:   answers.length,
      score:   listeningRawToScaled(correct, answers.length),
    };
    setScores(prev => ({ ...prev, listening: score }));
    await persistSection('listening', { answers, score });
    setPhase('speaking');
  }

  async function onSpeakingDone(recordings: SpeakingRecording[]) {
    setPhase('grading');
    setGradingMsg('Transcribiendo y calificando Speaking…');
    const enriched: SpeakingRecording[] = [];
    const rawScores: number[] = [];
    for (const rec of recordings) {
      const prompt = mock!.speaking.find(p => p.id === rec.promptId);
      if (!prompt) { enriched.push(rec); continue; }
      try {
        // Fetch the audio blob for Whisper
        const blob = await fetch(rec.audioUrl).then(r => r.blob());
        const form = new FormData();
        form.append('audio', blob, 'audio.webm');
        form.append('language', 'en');
        const tRes = await fetch('/api/transcribe-speech', { method: 'POST', body: form });
        const tJson = await tRes.json();
        const transcript = String(tJson.text ?? '');

        // Score
        const gRes = await fetch('/api/ai-grade-toefl-speaking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: prompt.prompt, transcript, durationSec: rec.durationSec }),
        });
        const gJson = await gRes.json();
        const rawScore = Number(gJson.rawScore04 ?? 0);
        rawScores.push(rawScore);
        enriched.push({ ...rec, transcript, aiScore: rawScore, aiFeedback: gJson.feedback });
      } catch (err) {
        console.error('[toefl-mock] speaking grade err:', err);
        rawScores.push(0);
        enriched.push(rec);
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
    await persistSection('speaking', { recordings: enriched, score });
    setPhase('writing');
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

    // Finalise
    const overall = Object.values({ ...scores, writing: score }).reduce((s, v) => s + (v?.score ?? 0), 0);
    const sid = await ensureSession();
    await updateDoc(doc(db, 'toeflSessions', sid), {
      overallScore: overall,
      status:       'completed',
      completedAt:  serverTimestamp(),
    }).catch(() => {});
    setPhase('results');
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
    return (
      <PageBg>
        <div className="w-full max-w-lg rounded-3xl overflow-hidden bg-white" style={{ boxShadow: '0 24px 64px -8px rgba(61,37,88,0.3)' }}>
          <div className="px-8 py-7" style={{ background: 'linear-gradient(135deg, #3D2558, #5A3D7A, #9B7CB8)' }}>
            <BrandHeader subtitle="TOEFL Academic Simulator" />
            <p className="text-lg font-serif font-bold text-white mt-4">Hola {name}, ¡vamos!</p>
          </div>
          <div className="p-8 space-y-4">
            <p className="text-sm text-gray-700">Vas a hacer el mock completo en este orden:</p>
            <ol className="space-y-2 text-sm text-[#2D1B4E]">
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#F0E5FF] flex items-center justify-center text-xs font-bold" style={{ color: B.purple }}>1</span>
                <span>📖 <strong>Reading</strong> — 2 pasajes · 35 min</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#F0E5FF] flex items-center justify-center text-xs font-bold" style={{ color: B.purple }}>2</span>
                <span>🎧 <strong>Listening</strong> — 1 lecture + 1 conversation · 20 min</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#F0E5FF] flex items-center justify-center text-xs font-bold" style={{ color: B.purple }}>3</span>
                <span>🎤 <strong>Speaking</strong> — 4 tasks grabadas · ~8 min</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#F0E5FF] flex items-center justify-center text-xs font-bold" style={{ color: B.purple }}>4</span>
                <span>✍️ <strong>Writing</strong> — 1 Academic Discussion · 10 min</span>
              </li>
            </ol>
            <p className="text-[11px] text-gray-500 italic">💡 Writing y Speaking se califican con AI (Claude + Whisper). Puede tardar 1-2 min después de submit.</p>
            <button onClick={() => setPhase('reading')}
              className="w-full font-bold py-3.5 rounded-xl text-white text-sm hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #3D2558, #5A3D7A)' }}>
              ▶ Empezar
            </button>
          </div>
        </div>
      </PageBg>
    );
  }

  if (phase === 'reading') return <PageBg><ReadingSection passages={mock!.reading} onDone={onReadingDone} /></PageBg>;
  if (phase === 'listening') return <PageBg><ListeningSection audios={mock!.listening} audioUrls={audioUrls} onDone={onListeningDone} /></PageBg>;
  if (phase === 'speaking') return <PageBg><SpeakingSection prompts={mock!.speaking} teacherId={teacherId} sessionId={sessionIdRef.current || 'anon'} onDone={onSpeakingDone} /></PageBg>;
  if (phase === 'writing') return <PageBg><WritingSection prompt={mock!.writing} onDone={onWritingDone} /></PageBg>;

  if (phase === 'grading') {
    return (
      <PageBg>
        <div className="text-center py-24">
          <div className="w-12 h-12 rounded-full border-4 border-[#C8A8DC] border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold" style={{ color: B.purple }}>{gradingMsg}</p>
          <p className="text-xs text-gray-500 mt-1">Puede tardar 1-2 min.</p>
        </div>
      </PageBg>
    );
  }

  return <PageBg><ResultsScreen studentName={name} scores={scores} overall={overallLive} /></PageBg>;
}
