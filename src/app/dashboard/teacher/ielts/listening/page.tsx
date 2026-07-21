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
import type {
  ListeningMock, ListeningSection, ListeningQuestion, StudentAnswers,
  ListeningSessionMode, GradeResult,
} from '@/types/ielts';

const MOCKS: ListeningMock[] = [listeningMock1];

// ─── Question card ──────────────────────────────────────────────────

function QuestionCard({
  q,
  index,
  answer,
  onAnswer,
  showAnswer,
  correctInline,
}: {
  q: ListeningQuestion;
  index: number;
  answer: string | string[] | undefined;
  onAnswer: (val: string | string[]) => void;
  showAnswer?: boolean;    // review/practice mode reveal
  correctInline?: boolean; // grade badge after submit
}) {
  const number = index + 1;

  // Small helper — canonical accepted answer string for the reveal.
  const canonical =
    q.type === 'multiple-choice' || q.type === 'matching' || q.type === 'plan-map-labelling'
      ? (q.options.find((o) => o.id === q.correct)?.text ?? q.correct)
      : q.type === 'multiple-choice-multi'
        ? q.correct.map((id) => q.options.find((o) => o.id === id)?.text ?? id).join(' + ')
        : q.accepted[0];

  return (
    <div className="bg-white rounded-2xl border border-[#E8D5F0] shadow-sm hover:shadow-md transition-shadow p-4">
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#5A3D7A] to-[#9B7CB8] text-white text-xs font-bold flex items-center justify-center">
          {number}
        </span>
        <div className="flex-1 min-w-0 space-y-2">
          {/* Prompt */}
          <p className="text-sm text-[#2D1B4E] leading-snug">
            {q.prompt}
          </p>

          {/* Input by type */}
          {(q.type === 'multiple-choice' || q.type === 'matching' || q.type === 'plan-map-labelling') && (
            <div className="space-y-1.5">
              {q.options.map((opt) => {
                const selected = answer === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => onAnswer(opt.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl border text-sm transition-colors flex items-center gap-2 ${
                      selected
                        ? 'bg-[#F0E5FF] border-[#9B7CB8] text-[#2D1B4E] font-semibold'
                        : 'bg-[#FDFAFF] border-gray-100 text-gray-700 hover:border-[#C8A8DC]'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                      selected ? 'border-[#5A3D7A] bg-[#5A3D7A] text-white' : 'border-gray-300 text-gray-400'
                    }`}>
                      {opt.id.toUpperCase()}
                    </span>
                    <span>{opt.text}</span>
                  </button>
                );
              })}
            </div>
          )}

          {q.type === 'multiple-choice-multi' && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-[#5A3D7A] uppercase tracking-widest">
                Pick {q.pickCount}
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
                    className={`w-full text-left px-3 py-2 rounded-xl border text-sm transition-colors flex items-center gap-2 ${
                      chosen ? 'bg-[#F0E5FF] border-[#9B7CB8] text-[#2D1B4E] font-semibold' : 'bg-[#FDFAFF] border-gray-100 text-gray-700 hover:border-[#C8A8DC]'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded border-2 flex items-center justify-center text-[10px] font-bold ${
                      chosen ? 'border-[#5A3D7A] bg-[#5A3D7A] text-white' : 'border-gray-300 text-gray-400'
                    }`}>
                      {chosen ? '✓' : opt.id.toUpperCase()}
                    </span>
                    <span>{opt.text}</span>
                  </button>
                );
              })}
            </div>
          )}

          {(q.type === 'form-completion' || q.type === 'note-completion'
            || q.type === 'table-completion' || q.type === 'summary-completion'
            || q.type === 'sentence-completion' || q.type === 'flow-chart-completion'
            || q.type === 'short-answer') && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {q.contextBefore && (
                  <span className="text-sm text-gray-600 whitespace-nowrap">{q.contextBefore}</span>
                )}
                <input
                  type="text"
                  value={typeof answer === 'string' ? answer : ''}
                  onChange={(e) => onAnswer(e.target.value)}
                  placeholder={`no more than ${q.wordLimit} word${q.wordLimit === 1 ? '' : 's'}${q.allowNumbers ? ' / number' : ''}`}
                  className="flex-1 min-w-0 px-3 py-1.5 rounded-lg border-2 border-dashed border-[#C8A8DC] bg-[#FDFAFF] text-sm focus:outline-none focus:border-[#5A3D7A] focus:bg-white transition-colors"
                />
                {q.contextAfter && (
                  <span className="text-sm text-gray-600 whitespace-nowrap">{q.contextAfter}</span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 pl-1">
                Max {q.wordLimit} word{q.wordLimit === 1 ? '' : 's'}{q.allowNumbers && ' and/or a number'}
              </p>
            </div>
          )}

          {/* Answer reveal (practice / review) */}
          {showAnswer && (
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
  onAudioReady: (url: string) => void;
  teacherId: string;
}) {
  const [manualUrl, setManualUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
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
      onAudioReady(url);
    } catch (err) {
      setUploadError('Firebase Storage: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  if (section.audioUrl) {
    return (
      <div className="bg-gradient-to-br from-[#5A3D7A] to-[#9B7CB8] rounded-2xl p-4 text-white shadow-md">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/70 mb-2">
          Section {section.number} audio
        </p>
        <audio
          src={section.audioUrl}
          controls={mode !== 'exam'}
          controlsList={mode === 'exam' ? 'nodownload noplaybackrate' : undefined}
          className="w-full accent-white"
          autoPlay={mode === 'exam'}
        />
        {mode === 'exam' && (
          <p className="text-[10px] text-white/60 mt-2 italic">Exam mode: audio plays once, no pause.</p>
        )}
      </div>
    );
  }

  // No audio yet — teacher can paste URL or upload
  return (
    <div className="bg-white rounded-2xl border-2 border-dashed border-[#C8A8DC] p-4 space-y-3">
      <p className="text-[11px] font-bold text-[#5A3D7A] uppercase tracking-widest">
        Audio Section {section.number} — sin cargar
      </p>
      <p className="text-xs text-gray-500 leading-relaxed">
        Genera el audio en ElevenLabs con el script de abajo y luego pégalo o súbelo aquí para que tus estudiantes puedan escucharlo.
      </p>
      <div className="flex gap-2">
        <input
          value={manualUrl}
          onChange={(e) => setManualUrl(e.target.value)}
          placeholder="https:// (URL del MP3)"
          className="flex-1 min-w-0 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-mono focus:outline-none focus:border-[#9B7CB8]"
        />
        <button
          onClick={() => manualUrl.trim() && onAudioReady(manualUrl.trim())}
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
      {uploadError && <p className="text-[10px] text-red-500">{uploadError}</p>}
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
  useEffect(() => {
    const auth = getAuth();
    if (auth.currentUser) { setTeacherId(auth.currentUser.uid); return; }
    const unsub = onAuthStateChanged(auth, (u) => setTeacherId(u?.uid ?? ''));
    return () => unsub();
  }, []);

  // Only one mock ships in this MVP; when Mock 2 lands we'll add a picker
  // and swap this constant for state.
  const mock = MOCKS[0];

  const [phase, setPhase] = useState<'landing' | 'running' | 'results'>('landing');
  const [mode, setMode] = useState<ListeningSessionMode>('exam');
  const [currentSection, setCurrentSection] = useState<0 | 1 | 2 | 3>(0);
  const [answers, setAnswers] = useState<StudentAnswers>({});
  const [result, setResult] = useState<GradeResult | null>(null);

  // Session-scoped audio URLs per section (overrides the mock's audioUrl if
  // the teacher uploaded one live).
  const [sessionAudioUrls, setSessionAudioUrls] = useState<Record<number, string>>({});

  // Timer per section — 6 min default, floating bar during running.
  const SECTION_SEC = 360;
  const [timeLeft, setTimeLeft] = useState(SECTION_SEC);
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
    setAnswers({});
    setTimeLeft(SECTION_SEC);
    setTimerRunning(true);
  }

  function goToNextSection() {
    if (currentSection >= 3) return;
    setCurrentSection((s) => (s + 1) as 0 | 1 | 2 | 3);
    setTimeLeft(SECTION_SEC);
    setTimerRunning(true);
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
  const audioUrl = sessionAudioUrls[activeSection.number] ?? activeSection.audioUrl;

  function fmt(s: number): string {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
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

        <div className={`max-w-4xl mx-auto mt-8 ${phase === 'running' ? 'pb-28' : ''}`}>

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

          {/* ─── RUNNING ─── */}
          {phase === 'running' && (
            <div className="space-y-5">
              {/* Section header */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.3em]">
                    Section {activeSection.number} of 4
                  </p>
                  <h2 className="font-serif text-2xl font-bold text-[#2D1B4E]">{activeSection.title}</h2>
                  <p className="text-xs text-gray-500 italic mt-0.5">{activeSection.scenario}</p>
                </div>
                <div className="flex gap-1">
                  {mock.sections.map((s) => (
                    <span
                      key={s.number}
                      className={`h-2 rounded-full transition-all ${
                        s.number - 1 < currentSection ? 'w-6 bg-[#5A3D7A]'
                        : s.number - 1 === currentSection ? 'w-10 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8]'
                        : 'w-6 bg-[#E8D5F0]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-[#F0E5FF] border border-[#C8A8DC]/40 rounded-2xl p-3">
                <p className="text-xs text-[#5A3D7A] leading-relaxed">{activeSection.instructions}</p>
              </div>

              {/* Audio */}
              <AudioPanel
                section={activeSection}
                mode={mode}
                onAudioReady={(url) => setSessionAudioUrls((prev) => ({ ...prev, [activeSection.number]: url }))}
                teacherId={teacherId}
              />
              {/* Update inline for the panel to reflect uploaded URL */}
              {sessionAudioUrls[activeSection.number] && !activeSection.audioUrl && (
                <div className="bg-gradient-to-br from-[#5A3D7A] to-[#9B7CB8] rounded-2xl p-4 text-white shadow-md">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/70 mb-2">
                    Section {activeSection.number} audio (sesión)
                  </p>
                  <audio
                    src={sessionAudioUrls[activeSection.number]}
                    controls={mode !== 'exam'}
                    controlsList={mode === 'exam' ? 'nodownload noplaybackrate' : undefined}
                    className="w-full"
                    autoPlay={mode === 'exam'}
                  />
                  {mode === 'exam' && (
                    <p className="text-[10px] text-white/60 mt-2 italic">Exam mode: audio plays once, no pause.</p>
                  )}
                </div>
              )}

              {/* Script preview (helpful when teacher hasn't generated audio yet) */}
              <ScriptPreview section={activeSection} />

              {/* Questions */}
              <div className="space-y-3">
                {activeSection.questions.map((q, i) => (
                  <QuestionCard
                    key={q.id}
                    q={q}
                    index={i + (currentSection * 10)}
                    answer={answers[q.id]}
                    onAnswer={(val) => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
                    showAnswer={mode === 'practice'}
                  />
                ))}
              </div>

              {/* Section nav */}
              <div className="flex justify-center gap-3 pt-2">
                {currentSection < 3 ? (
                  <button
                    onClick={goToNextSection}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white rounded-full text-sm font-bold shadow-lg active:scale-95"
                  >
                    Continue to Section {currentSection + 2} →
                  </button>
                ) : (
                  <button
                    onClick={submitMock}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-sm font-bold shadow-lg active:scale-95"
                  >
                    ✓ Submit mock
                  </button>
                )}
                <button
                  onClick={() => { setPhase('landing'); setTimerRunning(false); }}
                  className="px-3 py-2 text-xs font-semibold text-gray-400 hover:text-gray-600"
                >
                  Abort
                </button>
              </div>

              {/* Floating timer */}
              <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-2xl">
                <div className="bg-white/95 backdrop-blur-md rounded-full shadow-2xl shadow-[#5A3D7A]/30 border border-[#E8D5F0] pl-5 pr-3 py-2.5 flex items-center gap-3">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] font-black text-[#5A3D7A] uppercase tracking-[0.25em] leading-none">
                      Section 0{activeSection.number} · Listening
                    </span>
                    <span className="text-lg font-black font-mono tabular-nums leading-tight text-[#5A3D7A]">
                      {fmt(timeLeft)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 h-1.5 bg-[#F0E5FF] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-[width] bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8]"
                      style={{ width: `${((SECTION_SEC - timeLeft) / SECTION_SEC) * 100}%` }}
                    />
                  </div>
                  <button
                    onClick={() => setTimerRunning((r) => !r)}
                    className="shrink-0 px-3 py-1.5 bg-[#F0E5FF] text-[#5A3D7A] rounded-full text-xs font-bold hover:bg-[#E0C8F0]"
                  >
                    {timerRunning ? '❚❚ Pause' : '▶ Resume'}
                  </button>
                </div>
              </div>
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

