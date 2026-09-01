// FriendlyTeaching.cl — TOEFL Academic Simulator dashboard
//
// Landing page for the teacher: choose which sections to include (classes
// are 45-50 min so the full mock rarely fits) and launch the runner in a
// new tab with the selection in the URL.
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import TopBar from '@/components/layout/TopBar';
import FullscreenButton from '@/components/ui/FullscreenButton';
import {
  TOEFL_SECTION_META, TOEFL_SECTIONS,
  type TOEFLSection, type TOEFLSession, type TOEFLListeningAudio,
  type TOEFLSpeakingAssignment, type TOEFLWritingAssignment,
} from '@/types/toefl';
import { listSessionsForTeacher, sectionsSummary } from '@/lib/toefl/sessions';
import { TOEFL_MOCKS, getMock } from '@/lib/data/toefl/mock-1';
import { useStudents } from '@/hooks/useStudents';
import {
  useToeflSpeakingAssignments,
  createToeflSpeakingAssignment,
  deleteToeflSpeakingAssignment,
  gradeToeflSpeakingAssignment,
  recordGradingError,
} from '@/hooks/useToeflSpeakingAssignments';
import {
  useToeflWritingAssignments,
  createToeflWritingAssignment,
  deleteToeflWritingAssignment,
  gradeToeflWritingAssignment,
  recordWritingGradingError,
} from '@/hooks/useToeflWritingAssignments';
import { gradeSpeakingRecordings } from '@/lib/toefl/gradeSpeaking';
import { gradeWritingSubmission } from '@/lib/toefl/gradeWriting';
import { SpeakingBreakdown } from '@/components/toefl/SpeakingBreakdown';
import { WritingBreakdown } from '@/components/toefl/WritingBreakdown';

// Cubre TODOS los mocks registrados — el manager de audio agrupa por mockId
// para que el profe pueda ver/subir MP3s de cualquier mock desde una vista.
const LISTENING_AUDIOS_FOR_UPLOAD: Array<{
  mockId:  string;
  mockTitle: string;
  audio:   TOEFLListeningAudio;
}> = TOEFL_MOCKS.flatMap((mock) =>
  mock.listening.map((audio) => ({
    mockId:    mock.id,
    mockTitle: mock.title,
    audio,
  })),
);

interface Preset {
  id:       string;
  label:    string;
  desc:     string;
  sections: TOEFLSection[];
}

const PRESETS: Preset[] = [
  { id: 'full',    label: 'Full mock',                desc: 'Las 4 secciones (~80 min).',              sections: ['reading', 'listening', 'speaking', 'writing'] },
  { id: 'rw',     label: 'Reading + Writing',        desc: 'Receptivo + productivo (~50 min).',       sections: ['reading', 'writing'] },
  { id: 'ls',     label: 'Listening + Speaking',     desc: 'Oral compacto (~28 min).',                sections: ['listening', 'speaking'] },
  { id: 'lsw',    label: 'Listening + Speaking + W', desc: 'Sin Reading (~43 min).',                  sections: ['listening', 'speaking', 'writing'] },
  { id: 'rls',    label: 'Reading + Listening',      desc: 'Solo comprensión (~55 min).',             sections: ['reading', 'listening'] },
  { id: 'sw',     label: 'Speaking + Writing',       desc: 'Solo productivo (~23 min).',              sections: ['speaking', 'writing'] },
];

export default function TOEFLDashboardPage() {
  const [teacherId, setTeacherId] = useState('');
  useEffect(() => {
    const auth = getAuth();
    if (auth.currentUser) { setTeacherId(auth.currentUser.uid); return; }
    const unsub = onAuthStateChanged(auth, (u) => setTeacherId(u?.uid ?? ''));
    return () => unsub();
  }, []);

  const [selectedMockId, setSelectedMockId] = useState<string>(TOEFL_MOCKS[0]?.id ?? 'mock-1');
  const [selectedPreset, setSelectedPreset] = useState<string>('rw');
  const [sections, setSections] = useState<Set<TOEFLSection>>(new Set(['reading', 'writing']));
  const [sessions, setSessions] = useState<TOEFLSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!teacherId) return;
    setLoadingSessions(true);
    listSessionsForTeacher(teacherId)
      .then(setSessions)
      .finally(() => setLoadingSessions(false));
  }, [teacherId]);

  function applyPreset(preset: Preset) {
    setSelectedPreset(preset.id);
    setSections(new Set(preset.sections));
  }
  function toggleSection(s: TOEFLSection) {
    setSelectedPreset('custom');
    setSections(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  }

  const orderedSelected = useMemo(
    () => TOEFL_SECTIONS.filter(s => sections.has(s)),
    [sections],
  );
  const estimatedMin = useMemo(
    () => orderedSelected.reduce((sum, s) => sum + TOEFL_SECTION_META[s].minutes, 0),
    [orderedSelected],
  );

  const launchHref = useMemo(() => {
    const params = new URLSearchParams();
    if (teacherId) params.set('teacherId', teacherId);
    if (orderedSelected.length > 0 && orderedSelected.length < TOEFL_SECTIONS.length) {
      params.set('sections', orderedSelected.join(','));
    }
    const qs = params.toString();
    return `/toefl-mock/${selectedMockId}${qs ? '?' + qs : ''}`;
  }, [teacherId, orderedSelected, selectedMockId]);

  // Absolute URL for the share flow — always explicit about the sections so
  // the recipient can't accidentally get a different mock config than the one
  // the teacher selected.
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined' || !teacherId || orderedSelected.length === 0) return '';
    const params = new URLSearchParams({
      teacherId,
      sections: orderedSelected.join(','),
    });
    return `${window.location.origin}/toefl-mock/${selectedMockId}?${params.toString()}`;
  }, [teacherId, orderedSelected, selectedMockId]);

  async function handleCopyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#FFFCF7] text-[#2D1B4E]">
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
          title="TOEFL Academic Simulator"
          subtitle="Elegí qué secciones evaluar según el tiempo de clase"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Tools',     href: '/dashboard/teacher/tools' },
            { label: 'TOEFL' },
          ]}
        />

        <div className="max-w-4xl mx-auto mt-8 space-y-6">
          {/* Hero */}
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#5A3D7A] bg-[#F0E5FF] border border-[#C8A8DC]/60 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8B547] animate-pulse" />
              TOEFL Simulator
            </span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#2D1B4E] leading-tight tracking-tight">
              TOEFL iBT<span className="text-[#E8B547]">®</span> Mock
            </h1>
            <p className="text-sm text-[#5A3D7A]/70 max-w-lg mx-auto">
              Scoring 0-120 estilo ETS. AI grading para Writing y Speaking. Cortá el mock a lo que entre en tu clase.
            </p>
          </div>

          {/* Speaking Simulator entry point — practice mode, no mock config */}
          <a
            href="/dashboard/teacher/toefl/speaking-simulator"
            className="block bg-gradient-to-r from-[#5A3D7A] to-[#3D2558] rounded-2xl p-4 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center text-xl shrink-0">🎤</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">Practice mode</p>
                <p className="text-sm font-bold text-white">Speaking Simulator</p>
                <p className="text-[11px] text-white/70">Task-a-task con feedback AI inmediato. Ideal para practicar prep + speak controlado.</p>
              </div>
              <span className="text-white/70 group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
          </a>

          {/* Mock picker */}
          <div className="bg-white rounded-3xl border border-[#E8D5F0] shadow-md p-5">
            <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.25em] mb-3">
              Elegí el mock
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TOEFL_MOCKS.map((m) => {
                const active = selectedMockId === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMockId(m.id)}
                    className={`text-left rounded-xl p-3 border-2 transition-all ${
                      active ? 'border-[#5A3D7A] bg-[#F0E5FF]' : 'border-gray-200 bg-white hover:border-[#C8A8DC]'
                    }`}
                  >
                    <p className="text-sm font-bold text-[#5A3D7A]">{m.title}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                      {m.reading.map(r => r.title).join(' · ')}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Presets */}
          <div className="bg-white rounded-3xl border border-[#E8D5F0] shadow-md p-5 space-y-4">
            <div>
              <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.25em] mb-3">
                Presets rápidos
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESETS.map((p) => {
                  const active = selectedPreset === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => applyPreset(p)}
                      className={`text-left rounded-xl p-3 border-2 transition-all ${
                        active ? 'border-[#5A3D7A] bg-[#F0E5FF]' : 'border-gray-200 bg-white hover:border-[#C8A8DC]'
                      }`}
                    >
                      <p className="text-sm font-bold text-[#5A3D7A]">{p.label}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{p.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom section toggles */}
            <div>
              <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.25em] mb-2">
                O personalizá
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TOEFL_SECTIONS.map((s) => {
                  const meta = TOEFL_SECTION_META[s];
                  const active = sections.has(s);
                  return (
                    <button
                      key={s}
                      onClick={() => toggleSection(s)}
                      className={`text-left rounded-xl p-3 border-2 transition-all ${
                        active ? 'border-[#5A3D7A] bg-[#F0E5FF]' : 'border-gray-200 bg-white hover:border-[#C8A8DC] opacity-70'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-5 h-5 rounded border-2 flex items-center justify-center text-[11px] font-bold ${
                          active ? 'border-[#5A3D7A] bg-[#5A3D7A] text-white' : 'border-gray-300 text-gray-400'
                        }`}>{active ? '✓' : ''}</span>
                        <span className="text-lg">{meta.icon}</span>
                      </div>
                      <p className="text-sm font-bold text-[#2D1B4E]">{meta.label}</p>
                      <p className="text-[10px] text-gray-500 tabular-nums">~{meta.minutes} min</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-[#F0E5FF] border border-[#C8A8DC]/60 rounded-xl px-3 py-2 flex items-center justify-between">
              <p className="text-xs text-[#5A3D7A]">
                <strong>{orderedSelected.length}</strong> sección{orderedSelected.length !== 1 ? 'es' : ''} — {orderedSelected.map(s => TOEFL_SECTION_META[s].label).join(' → ') || 'ninguna'}
              </p>
              <p className="text-xs font-bold text-[#5A3D7A] tabular-nums">≈ {estimatedMin} min</p>
            </div>
          </div>

          {/* CTAs — dos flujos: en vivo (docente + alumno en la misma pantalla)
              o compartir un link para que el alumno lo haga solo. */}
          <div className="space-y-3">
            <div className="flex justify-center gap-3 flex-wrap">
              {orderedSelected.length > 0 && teacherId ? (
                <>
                  <a
                    href={launchHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 rounded-full text-sm font-bold text-white shadow-lg shadow-[#5A3D7A]/25 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all"
                    style={{ background: 'linear-gradient(135deg, #3D2558, #5A3D7A)' }}
                  >
                    ▶ Iniciar Mock en Vivo
                  </a>
                  <button
                    onClick={handleCopyLink}
                    className="px-6 py-3 rounded-full text-sm font-bold border-2 transition-all hover:-translate-y-0.5 active:scale-95"
                    style={{ borderColor: '#5A3D7A', color: '#5A3D7A', background: copied ? '#DCFCE7' : 'white' }}
                  >
                    {copied ? '✓ Link copiado' : '🔗 Compartir link'}
                  </button>
                </>
              ) : (
                <button disabled className="px-6 py-3 rounded-full text-sm font-bold text-white opacity-40 cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #3D2558, #5A3D7A)' }}>
                  {!teacherId ? 'Iniciá sesión primero' : 'Elegí al menos una sección'}
                </button>
              )}
            </div>

            {/* Live URL preview — visible so the teacher can confirm exactly
                which sections + mock go in the link before copying. */}
            {shareUrl && (
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-2 bg-white border border-[#E8D5F0] rounded-xl px-3 py-2 shadow-sm">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#5A3D7A]/60 shrink-0">Link</span>
                  <input
                    readOnly
                    value={shareUrl}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 min-w-0 text-[11px] font-mono text-[#5A3D7A]/70 bg-transparent focus:outline-none truncate"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg hover:opacity-80 transition-opacity shrink-0"
                    style={{ background: copied ? '#DCFCE7' : '#F0E5FF', color: copied ? '#15803D' : '#5A3D7A' }}
                  >
                    {copied ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="text-center text-[10px] text-gray-400 max-w-md mx-auto">
            💡 Los audios de Listening se generan on-demand cuando el estudiante los pide, y quedan cacheados en el bucket.
            Writing y Speaking se califican con Claude + Whisper (~$0.06 por session completa).
          </p>

          {/* Speaking Assignments panel — async teacher→student flow */}
          <SpeakingAssignmentsPanel teacherId={teacherId} />

          {/* Writing Assignments panel — same pattern for Writing Task 2 */}
          <WritingAssignmentsPanel teacherId={teacherId} />

          {/* Sessions table */}
          <SessionsTable sessions={sessions} loading={loadingSessions} teacherId={teacherId} />

          {/* Manual audio upload panel */}
          <ListeningAudioManager teacherId={teacherId} />
        </div>
      </div>
    </div>
  );
}

// ─── Sessions table (completed + in-progress) ─────────────────────────────

function fmtDate(ts: unknown): string {
  if (!ts) return '—';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = ts as any;
  const d = typeof raw?.toDate === 'function' ? raw.toDate() : new Date((raw?.seconds ?? 0) * 1000);
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

function SessionsTable({
  sessions, loading, teacherId,
}: {
  sessions:  TOEFLSession[];
  loading:   boolean;
  teacherId: string;
}) {
  const [speakingView, setSpeakingView] = useState<TOEFLSession | null>(null);
  const [writingView, setWritingView]   = useState<TOEFLSession | null>(null);
  if (loading) {
    return (
      <div className="mt-10 space-y-2">
        {[1, 2, 3].map(i => <div key={i} className="h-14 bg-[#F0E5FF] rounded-xl animate-pulse" />)}
      </div>
    );
  }
  if (sessions.length === 0) {
    return (
      <div className="mt-10 text-center py-12 rounded-2xl border border-dashed border-[#C8A8DC]/60 bg-white/40">
        <p className="text-3xl mb-2">📄</p>
        <p className="text-sm font-bold text-[#5A3D7A]">Aún no hay sesiones</p>
        <p className="text-xs text-[#5A3D7A]/60 mt-1">Cuando un estudiante termine (o pause) el mock, va a aparecer acá.</p>
      </div>
    );
  }
  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-3">
        <p className="text-xs font-bold uppercase tracking-widest text-[#5A3D7A]">
          Sesiones TOEFL
        </p>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F0E5FF] text-[#5A3D7A]">
          {sessions.length}
        </span>
      </div>
      <div className="rounded-2xl overflow-hidden border border-[#E8D5F0] bg-white shadow-md">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F0E5FF]">
              {['Student', 'Date', 'Sections', 'Reading', 'Listening', 'Total', 'Status'].map(h => (
                <th key={h} className="text-left text-[10px] font-bold uppercase tracking-wider px-3 py-2 text-[#5A3D7A]/70">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions.map((s, idx) => {
              const enabled = s.enabledSections ?? [];
              const reading   = s.results?.reading?.score.score;
              const listening = s.results?.listening?.score.score;
              const isInProgress = s.status === 'in_progress';
              const hasSpeaking  = (s.results?.speaking?.recordings?.length ?? 0) > 0;
              const hasWriting   = !!s.results?.writing?.submission?.text;
              return (
                <tr
                  key={s.id}
                  className="border-t border-[#F0E5FF] hover:bg-[#FDFAFF] transition-colors"
                  style={{ background: idx % 2 === 0 ? 'white' : '#FDFAFF' }}
                >
                  <td className="px-3 py-2.5">
                    <p className="font-semibold text-[#5A3D7A]">{s.studentName}</p>
                    {s.studentEmail && <p className="text-xs text-[#5A3D7A]/60">{s.studentEmail}</p>}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-[#5A3D7A]/70 tabular-nums">
                    {fmtDate(s.createdAt)}
                  </td>
                  <td className="px-3 py-2.5 text-[11px] font-mono font-bold text-[#5A3D7A]">
                    {sectionsSummary(enabled)}
                  </td>
                  <td className="px-3 py-2.5 text-sm font-black tabular-nums text-[#5A3D7A]">
                    {reading != null ? `${reading}` : <span className="text-gray-300 font-normal">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-sm font-black tabular-nums text-[#5A3D7A]">
                    {listening != null ? `${listening}` : <span className="text-gray-300 font-normal">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-sm font-black tabular-nums text-[#5A3D7A]">
                    {s.overallScore != null ? s.overallScore : <span className="text-gray-300 font-normal">—</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: s.status === 'completed' ? '#DCFCE7' : s.status === 'partial' ? '#FEF3C7' : '#F0E5FF',
                          color:      s.status === 'completed' ? '#15803D' : s.status === 'partial' ? '#92400E' : '#5A3D7A',
                        }}
                      >
                        {s.status === 'completed' ? 'Completed' : s.status === 'partial' ? 'Partial' : 'In progress'}
                      </span>
                      {isInProgress && (
                        <a
                          href={`/toefl-mock/${s.mockId}?teacherId=${teacherId}&resumeSessionId=${s.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white hover:opacity-90"
                          style={{ background: '#5A3D7A' }}
                        >
                          ▶ Continuar
                        </a>
                      )}
                      {hasSpeaking && (
                        <button
                          onClick={() => setSpeakingView(s)}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#5A3D7A]/40 text-[#5A3D7A] hover:bg-[#F0E5FF]"
                        >
                          🎤 Ver
                        </button>
                      )}
                      {hasWriting && (
                        <button
                          onClick={() => setWritingView(s)}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#5A3D7A]/40 text-[#5A3D7A] hover:bg-[#F0E5FF]"
                        >
                          ✍️ Ver
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {speakingView && (
        <SessionSpeakingModal
          session={speakingView}
          onClose={() => setSpeakingView(null)}
        />
      )}
      {writingView && (
        <SessionWritingModal
          session={writingView}
          onClose={() => setWritingView(null)}
        />
      )}
    </div>
  );
}

// ─── Speaking review modal for live-mock sessions ─────────────────────────

function SessionSpeakingModal({
  session, onClose,
}: {
  session: TOEFLSession;
  onClose: () => void;
}) {
  const mock = getMock(session.mockId);
  const recordings = session.results?.speaking?.recordings ?? [];
  const speakingScore = session.results?.speaking?.score.score;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-3xl my-8 shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#E8D5F0] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#5A3D7A]/60">Speaking · {mock?.title ?? session.mockId}</p>
            <p className="text-base font-bold text-[#5A3D7A] truncate">{session.studentName}</p>
            {session.studentEmail && <p className="text-xs text-[#5A3D7A]/60 truncate">{session.studentEmail}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {speakingScore != null && (
              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#5A3D7A]/60">Speaking</p>
                <p className="text-2xl font-black tabular-nums text-[#5A3D7A]">{speakingScore}<span className="text-sm text-[#5A3D7A]/60">/30</span></p>
              </div>
            )}
            <button onClick={onClose} className="text-xl text-gray-400 hover:text-gray-600 px-2">✕</button>
          </div>
        </div>
        <div className="overflow-y-auto p-6">
          {mock && recordings.length > 0 ? (
            <SpeakingBreakdown recordings={recordings} prompts={mock.speaking} />
          ) : (
            <p className="text-sm text-[#5A3D7A]/60 text-center py-8">Sin grabaciones disponibles.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Writing review modal for live-mock sessions ──────────────────────────

function SessionWritingModal({
  session, onClose,
}: {
  session: TOEFLSession;
  onClose: () => void;
}) {
  const mock = getMock(session.mockId);
  const submission = session.results?.writing?.submission;
  const writingScore = session.results?.writing?.score.score;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-3xl my-8 shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#E8D5F0] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#5A3D7A]/60">Writing · {mock?.title ?? session.mockId}</p>
            <p className="text-base font-bold text-[#5A3D7A] truncate">{session.studentName}</p>
            {session.studentEmail && <p className="text-xs text-[#5A3D7A]/60 truncate">{session.studentEmail}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {writingScore != null && (
              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#5A3D7A]/60">Writing</p>
                <p className="text-2xl font-black tabular-nums text-[#5A3D7A]">{writingScore}<span className="text-sm text-[#5A3D7A]/60">/30</span></p>
              </div>
            )}
            <button onClick={onClose} className="text-xl text-gray-400 hover:text-gray-600 px-2">✕</button>
          </div>
        </div>
        <div className="overflow-y-auto p-6">
          {mock && submission ? (
            <WritingBreakdown submission={submission} prompt={mock.writing} />
          ) : (
            <p className="text-sm text-[#5A3D7A]/60 text-center py-8">Sin submission disponible.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Writing Assignments panel (async teacher→student) ───────────────────

function WritingAssignmentsPanel({ teacherId }: { teacherId: string }) {
  const { assignments, loading } = useToeflWritingAssignments(teacherId);
  const { students } = useStudents();
  const [mode, setMode] = useState<'closed' | 'student' | 'public'>('closed');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedMockId, setSelectedMockId] = useState<string>(TOEFL_MOCKS[0]?.id ?? 'mock-1');
  const [creating, setCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState('');
  const [reviewOpenId, setReviewOpenId] = useState<string | null>(null);
  const reviewOpen = reviewOpenId ? assignments.find(a => a.id === reviewOpenId) ?? null : null;
  const [copiedId, setCopiedId] = useState('');

  async function handleCreate() {
    if (!teacherId) return;
    setCreating(true);
    try {
      let id: string;
      if (mode === 'student') {
        const student = students.find(s => s.uid === selectedStudentId);
        if (!student) { setCreating(false); return; }
        id = await createToeflWritingAssignment({
          teacherId,
          studentId:    student.uid,
          studentName:  student.fullName ?? 'Estudiante',
          studentEmail: student.email,
          mockId:       selectedMockId,
        });
      } else {
        id = await createToeflWritingAssignment({ teacherId, mockId: selectedMockId });
      }
      const url = `${window.location.origin}/toefl-writing/${id}`;
      setCreatedLink(url);
      try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
    } catch (err) {
      console.error('[writing-assignments] create err:', err);
    } finally {
      setCreating(false);
    }
  }

  function reset() {
    setMode('closed');
    setSelectedStudentId('');
    setCreatedLink('');
  }

  async function copyLink(assignmentId: string) {
    const url = `${window.location.origin}/toefl-writing/${assignmentId}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(assignmentId);
    setTimeout(() => setCopiedId(''), 1800);
  }

  async function handleDelete(a: TOEFLWritingAssignment) {
    if (!confirm(`¿Eliminar la asignación de ${a.studentName}? No se puede deshacer.`)) return;
    try { await deleteToeflWritingAssignment(a.id); }
    catch (err) { console.error('[writing-assignments] delete err:', err); }
  }

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <p className="text-xs font-bold uppercase tracking-widest text-[#5A3D7A]">
          ✍️ Writing Assignments
        </p>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F0E5FF] text-[#5A3D7A]">
          {assignments.length}
        </span>
        <div className="ml-auto flex gap-2">
          <button onClick={() => { setMode('student'); setCreatedLink(''); }}
            className="text-[11px] font-bold px-3 py-1.5 rounded-full text-white shadow-sm"
            style={{ background: 'linear-gradient(135deg, #5A3D7A, #9B7CB8)' }}
          >
            + Asignar a estudiante
          </button>
          <button onClick={() => { setMode('public'); setCreatedLink(''); }}
            className="text-[11px] font-bold px-3 py-1.5 rounded-full border-2"
            style={{ borderColor: '#5A3D7A', color: '#5A3D7A' }}
          >
            🔗 Crear link público
          </button>
        </div>
      </div>
      <p className="text-[11px] text-[#5A3D7A]/70 mb-3">
        Task 2 (Academic Discussion): el estudiante escribe desde su link, autoguardado incluido. El grading corre en background.
      </p>

      {mode !== 'closed' && (
        <div className="mb-4 bg-white rounded-2xl border border-[#E8D5F0] shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#5A3D7A]">
              {mode === 'student' ? 'Asignar Writing a un estudiante' : 'Crear link público (sin login)'}
            </p>
            <button onClick={reset} className="text-[11px] text-gray-500 hover:text-gray-700">✕ Cerrar</button>
          </div>

          {createdLink ? (
            <div className="space-y-2">
              <div className="rounded-xl bg-green-50 border border-green-200 px-3 py-2 text-[11px] text-green-800">
                ✓ Asignación creada. Link copiado al portapapeles.
              </div>
              <div className="flex items-center gap-2 bg-[#FDFAFF] border border-[#E8D5F0] rounded-xl px-3 py-2">
                <input readOnly value={createdLink}
                  onFocus={(e) => e.currentTarget.select()}
                  className="flex-1 min-w-0 text-[11px] font-mono text-[#5A3D7A]/70 bg-transparent focus:outline-none truncate"
                />
                <button onClick={() => navigator.clipboard.writeText(createdLink)}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-[#F0E5FF] text-[#5A3D7A]"
                >Copy</button>
              </div>
              <button onClick={reset} className="text-[11px] font-bold text-[#5A3D7A] underline">
                Crear otra
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {mode === 'student' && (
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#5A3D7A]/70">Estudiante</span>
                  <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-[#E0D5FF] bg-white text-sm focus:outline-none focus:border-[#5A3D7A]"
                  >
                    <option value="">— Elegir —</option>
                    {students.map(s => (
                      <option key={s.uid} value={s.uid}>{s.fullName ?? s.email ?? s.uid}</option>
                    ))}
                  </select>
                </label>
              )}
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#5A3D7A]/70">Mock</span>
                <select value={selectedMockId} onChange={(e) => setSelectedMockId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-[#E0D5FF] bg-white text-sm focus:outline-none focus:border-[#5A3D7A]"
                >
                  {TOEFL_MOCKS.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
              </label>
              <div className="sm:col-span-2">
                <button onClick={handleCreate}
                  disabled={creating || (mode === 'student' && !selectedStudentId)}
                  className="w-full font-bold py-2.5 rounded-xl text-white text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #3D2558, #5A3D7A)' }}
                >
                  {creating ? '⏳ Creando…' : mode === 'student' ? 'Crear y copiar link' : 'Generar link público'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="h-14 bg-[#F0E5FF] rounded-xl animate-pulse" />)}
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-8 rounded-2xl border border-dashed border-[#C8A8DC]/60 bg-white/40">
          <p className="text-2xl mb-1">✍️</p>
          <p className="text-sm font-bold text-[#5A3D7A]">Aún no hay asignaciones de Writing</p>
          <p className="text-xs text-[#5A3D7A]/60 mt-1">Creá una arriba para mandarle un mock a tu estudiante.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden border border-[#E8D5F0] bg-white shadow-md">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F0E5FF]">
                {['Estudiante', 'Mock', 'Fecha', 'Score', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold uppercase tracking-wider px-3 py-2 text-[#5A3D7A]/70">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assignments.map((a, idx) => {
                const isPublic = !a.studentId;
                const mock = getMock(a.mockId);
                const canReview = a.status === 'completed' || a.status === 'graded';
                const hasError = !!a.gradingError;
                return (
                  <tr key={a.id}
                    className="border-t border-[#F0E5FF] hover:bg-[#FDFAFF] transition-colors"
                    style={{ background: idx % 2 === 0 ? 'white' : '#FDFAFF' }}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[#5A3D7A]">{a.studentName}</p>
                        {isPublic && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">LINK</span>
                        )}
                      </div>
                      {a.studentEmail && <p className="text-xs text-[#5A3D7A]/60">{a.studentEmail}</p>}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-[#5A3D7A]/70">{mock?.title ?? a.mockId}</td>
                    <td className="px-3 py-2.5 text-xs text-[#5A3D7A]/70 tabular-nums">{fmtDate(a.createdAt)}</td>
                    <td className="px-3 py-2.5 text-sm font-black tabular-nums text-[#5A3D7A]">
                      {a.overallScore != null ? `${a.overallScore}/30` : <span className="text-gray-300 font-normal">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: a.status === 'graded' ? '#DCFCE7'
                            : a.status === 'completed' ? '#FEF3C7'
                            : a.status === 'in_progress' ? '#DBEAFE'
                            : '#F0E5FF',
                          color: a.status === 'graded' ? '#15803D'
                            : a.status === 'completed' ? '#92400E'
                            : a.status === 'in_progress' ? '#1E40AF'
                            : '#5A3D7A',
                        }}
                      >
                        {a.status === 'graded' ? 'Graded'
                          : a.status === 'completed' ? 'Grading…'
                          : a.status === 'in_progress' ? 'En curso'
                          : 'Asignado'}
                      </span>
                      {hasError && <span className="ml-1 text-[10px] font-bold text-red-600" title={a.gradingError}>⚠</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {canReview && (
                          <button onClick={() => setReviewOpenId(a.id)}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white hover:opacity-90"
                            style={{ background: '#5A3D7A' }}
                          >
                            Ver
                          </button>
                        )}
                        <button onClick={() => copyLink(a.id)}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#5A3D7A]/40 text-[#5A3D7A] hover:bg-[#F0E5FF]"
                        >
                          {copiedId === a.id ? '✓' : '🔗'}
                        </button>
                        <button onClick={() => handleDelete(a)}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50"
                          title="Eliminar"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {reviewOpen && (
        <WritingReviewModal assignment={reviewOpen} onClose={() => setReviewOpenId(null)} />
      )}
    </div>
  );
}

function WritingReviewModal({
  assignment, onClose,
}: {
  assignment: TOEFLWritingAssignment;
  onClose:    () => void;
}) {
  const mock = getMock(assignment.mockId);
  const [retrying, setRetrying] = useState(false);
  const [retryMsg, setRetryMsg] = useState('');

  async function handleRetry() {
    if (!mock || !assignment.submission) return;
    setRetrying(true);
    setRetryMsg('Recalificando…');
    try {
      const { enriched, sectionScore } = await gradeWritingSubmission(assignment.submission, mock.writing);
      await gradeToeflWritingAssignment(assignment.id, enriched, sectionScore);
      setRetryMsg(`✓ ${sectionScore}/30`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      try { await recordWritingGradingError(assignment.id, msg); } catch { /* ignore */ }
      setRetryMsg(`Error: ${msg}`);
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-3xl my-8 shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#E8D5F0] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#5A3D7A]/60">Review Writing · {mock?.title ?? assignment.mockId}</p>
            <p className="text-base font-bold text-[#5A3D7A] truncate">{assignment.studentName}</p>
            {assignment.studentEmail && <p className="text-xs text-[#5A3D7A]/60 truncate">{assignment.studentEmail}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {assignment.overallScore != null && (
              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#5A3D7A]/60">Writing</p>
                <p className="text-2xl font-black tabular-nums text-[#5A3D7A]">{assignment.overallScore}<span className="text-sm text-[#5A3D7A]/60">/30</span></p>
              </div>
            )}
            <button onClick={onClose} className="text-xl text-gray-400 hover:text-gray-600 px-2">✕</button>
          </div>
        </div>
        <div className="overflow-y-auto p-6 space-y-4">
          {assignment.gradingError && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-[11px] text-red-800">
              <p className="font-bold mb-0.5">Grading falló</p>
              <p>{assignment.gradingError}</p>
            </div>
          )}
          {assignment.status === 'completed' && !assignment.submission?.aiScore && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-800">
              El estudiante ya envió el Writing. Grading corriendo en background — refresca en un minuto.
            </div>
          )}
          {mock && assignment.submission ? (
            <WritingBreakdown submission={assignment.submission} prompt={mock.writing} />
          ) : (
            <p className="text-sm text-[#5A3D7A]/60 text-center py-8">Sin submission aún.</p>
          )}
          {(assignment.status === 'graded' || assignment.gradingError) && mock && assignment.submission && (
            <div className="pt-3 border-t border-[#E8D5F0] flex items-center gap-3">
              <button onClick={handleRetry} disabled={retrying}
                className="text-[11px] font-bold px-3 py-1.5 rounded-full border-2 border-[#5A3D7A] text-[#5A3D7A] hover:bg-[#F0E5FF] disabled:opacity-40"
              >
                {retrying ? '⏳ Recalificando…' : '↻ Reintentar grading'}
              </button>
              {retryMsg && <span className="text-[11px] text-[#5A3D7A]/70">{retryMsg}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Manual audio upload panel ────────────────────────────────────────────
//
// Lists every listening audio across all mocks and lets the teacher upload
// an MP3 file for each. Writes the toeflListeningAudios/{teacherId}_{mockId}_
// {audioId} binding so the runner picks it up on next load. Replaces / deletes
// clean up both Storage and Firestore.

interface AudioBinding {
  audioUrl:    string;
  storagePath: string;
  updatedAt?:  Timestamp;
}

function ListeningAudioManager({ teacherId }: { teacherId: string }) {
  const [bindings, setBindings] = useState<Record<string, AudioBinding | null>>({});
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function refresh() {
    if (!teacherId) return;
    setLoading(true);
    const next: Record<string, AudioBinding | null> = {};
    for (const item of LISTENING_AUDIOS_FOR_UPLOAD) {
      const key = `${teacherId}_${item.mockId}_${item.audio.id}`;
      try {
        const snap = await getDoc(doc(db, 'toeflListeningAudios', key));
        next[key] = snap.exists() ? (snap.data() as AudioBinding) : null;
      } catch {
        next[key] = null;
      }
    }
    setBindings(next);
    setLoading(false);
  }

  useEffect(() => { void refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [teacherId]);

  async function uploadFor(item: (typeof LISTENING_AUDIOS_FOR_UPLOAD)[number], file: File) {
    if (!teacherId) return;
    const key = `${teacherId}_${item.mockId}_${item.audio.id}`;
    setBusyKey(key);
    setErrors(prev => ({ ...prev, [key]: '' }));
    try {
      // If a binding exists, delete the old Storage object first so we don't
      // orphan files in the bucket.
      const prev = bindings[key];
      if (prev?.storagePath) {
        try { await deleteObject(storageRef(storage, prev.storagePath)); }
        catch (err) { console.warn('[toefl-upload] old file delete failed:', err); }
      }

      const ext = file.name.split('.').pop() || 'mp3';
      const path = `audio/toefl-${item.mockId}-${item.audio.id}-${teacherId}-${Date.now()}.${ext}`;
      const ref = storageRef(storage, path);
      await uploadBytes(ref, file, { contentType: file.type || 'audio/mpeg' });
      const url = await getDownloadURL(ref);

      await setDoc(doc(db, 'toeflListeningAudios', key), {
        teacherId,
        mockId:      item.mockId,
        audioId:     item.audio.id,
        audioUrl:    url,
        storagePath: path,
        source:      'manual-upload',
        createdAt:   Timestamp.now(),
        updatedAt:   Timestamp.now(),
      }, { merge: true });

      setBindings(prev => ({
        ...prev,
        [key]: { audioUrl: url, storagePath: path, updatedAt: Timestamp.now() },
      }));
    } catch (err) {
      console.error('[toefl-upload] failed:', err);
      setErrors(prev => ({ ...prev, [key]: err instanceof Error ? err.message : 'Error subiendo el audio' }));
    } finally {
      setBusyKey(null);
    }
  }

  async function removeFor(item: (typeof LISTENING_AUDIOS_FOR_UPLOAD)[number]) {
    if (!teacherId) return;
    const key = `${teacherId}_${item.mockId}_${item.audio.id}`;
    const binding = bindings[key];
    if (!binding) return;
    if (!confirm(`¿Eliminar el audio de "${item.audio.title}"? Los estudiantes verán "audio pendiente" hasta que subas otro.`)) return;
    setBusyKey(key);
    setErrors(prev => ({ ...prev, [key]: '' }));
    try {
      if (binding.storagePath) {
        try { await deleteObject(storageRef(storage, binding.storagePath)); }
        catch (err) { console.warn('[toefl-upload] storage delete failed:', err); }
      }
      await deleteDoc(doc(db, 'toeflListeningAudios', key));
      setBindings(prev => ({ ...prev, [key]: null }));
    } catch (err) {
      console.error('[toefl-upload] delete failed:', err);
      setErrors(prev => ({ ...prev, [key]: err instanceof Error ? err.message : 'Error eliminando el audio' }));
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-3">
        <p className="text-xs font-bold uppercase tracking-widest text-[#5A3D7A]">
          🎧 Audios de Listening
        </p>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F0E5FF] text-[#5A3D7A]">
          {LISTENING_AUDIOS_FOR_UPLOAD.length}
        </span>
      </div>
      <p className="text-[11px] text-[#5A3D7A]/70 mb-3">
        Subí un MP3 por cada clip (idealmente 3-6 min). Se guarda en el bucket bajo tu cuenta y los estudiantes lo escuchan directo — no hace falta ninguna API key externa. Máximo 20 MB por archivo.
      </p>

      <div className="space-y-2">
        {LISTENING_AUDIOS_FOR_UPLOAD.map((item) => {
          const key = `${teacherId}_${item.mockId}_${item.audio.id}`;
          const binding = bindings[key] ?? null;
          const busy = busyKey === key;
          const err  = errors[key];
          return (
            <div key={key} className="bg-white rounded-2xl border border-[#E8D5F0] shadow-sm p-4">
              <div className="flex items-start gap-3 flex-wrap">
                <div className="text-2xl">{item.audio.type === 'lecture' ? '🎓' : '💬'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-[#5A3D7A]">{item.audio.title}</p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F0E5FF] text-[#5A3D7A] uppercase tracking-wider">
                      {item.audio.type}
                    </span>
                    {item.audio.subject && (
                      <span className="text-[10px] text-[#5A3D7A]/60">{item.audio.subject}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#5A3D7A]/60 mt-0.5">
                    {item.mockTitle} · {item.audio.script.length} líneas · {item.audio.questions.length} preguntas
                  </p>
                  {loading ? (
                    <div className="mt-2 h-1.5 bg-[#F0E5FF] rounded-full animate-pulse w-32" />
                  ) : binding ? (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        ✓ Uploaded
                      </span>
                      <a
                        href={binding.audioUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-mono text-[#5A3D7A]/60 hover:underline truncate max-w-xs"
                        title={binding.audioUrl}
                      >
                        Escuchar ↗
                      </a>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        ⚠ Pendiente
                      </span>
                    </div>
                  )}
                  {err && <p className="mt-2 text-[11px] text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">{err}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <UploadButton
                    label={binding ? 'Reemplazar' : 'Subir MP3'}
                    disabled={busy || !teacherId}
                    busy={busy}
                    onFile={(file) => uploadFor(item, file)}
                  />
                  {binding && (
                    <button
                      onClick={() => removeFor(item)}
                      disabled={busy}
                      className="text-[11px] font-semibold text-red-600 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-full disabled:opacity-40"
                      title="Eliminar audio"
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>

              {/* Script viewer — collapsed by default. Lets the teacher read
                  what needs to be recorded / narrated before uploading. */}
              <details className="mt-3 rounded-xl border border-[#E8D5F0] bg-[#FDFAFF] group">
                <summary className="cursor-pointer text-[11px] font-bold uppercase tracking-widest text-[#5A3D7A] px-3 py-2 flex items-center justify-between select-none">
                  <span>📄 Ver script</span>
                  <span className="text-[10px] font-normal normal-case text-[#5A3D7A]/60 group-open:hidden">
                    {item.audio.script.length} líneas
                  </span>
                </summary>
                <div className="border-t border-[#F0E5FF] p-3 max-h-72 overflow-y-auto text-[12px] text-gray-700 space-y-1.5 bg-white rounded-b-xl">
                  {item.audio.script.map((line, i) => {
                    const speaker = item.audio.speakers.find(s => s.id === line.speakerId)?.name ?? line.speakerId;
                    return (
                      <p key={i} className="leading-snug">
                        <strong className="text-[#5A3D7A]">{speaker}:</strong> {line.text}
                      </p>
                    );
                  })}
                </div>
              </details>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UploadButton({
  label, busy, disabled, onFile,
}: {
  label: string;
  busy?: boolean;
  disabled?: boolean;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*,.mp3,.m4a,.wav,.ogg"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';   // reset so re-selecting the same file still fires onChange
        }}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="text-[11px] font-bold px-3 py-1.5 rounded-full text-white shadow-sm disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #5A3D7A, #9B7CB8)' }}
      >
        {busy ? '⏳ Subiendo…' : `⬆ ${label}`}
      </button>
    </>
  );
}

// ─── Speaking Assignments panel ─────────────────────────────────────────────
//
// Async flow: teacher creates an assignment (either linked to a specific
// student's uid or as a public link), sends the URL, student takes the mock,
// grading runs in background. Teacher reviews the transcript + rubric here
// and can retry grading when it errored.

function SpeakingAssignmentsPanel({ teacherId }: { teacherId: string }) {
  const { assignments, loading } = useToeflSpeakingAssignments(teacherId);
  const { students } = useStudents();
  const [mode, setMode] = useState<'closed' | 'student' | 'public'>('closed');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedMockId, setSelectedMockId] = useState<string>(TOEFL_MOCKS[0]?.id ?? 'mock-1');
  const [creating, setCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState('');
  const [reviewOpenId, setReviewOpenId] = useState<string | null>(null);
  const reviewOpen = reviewOpenId ? assignments.find(a => a.id === reviewOpenId) ?? null : null;
  const [copiedId, setCopiedId] = useState('');

  async function handleCreate() {
    if (!teacherId) return;
    setCreating(true);
    try {
      let id: string;
      if (mode === 'student') {
        const student = students.find(s => s.uid === selectedStudentId);
        if (!student) { setCreating(false); return; }
        id = await createToeflSpeakingAssignment({
          teacherId,
          studentId:    student.uid,
          studentName:  student.fullName ?? 'Estudiante',
          studentEmail: student.email,
          mockId:       selectedMockId,
        });
      } else {
        id = await createToeflSpeakingAssignment({ teacherId, mockId: selectedMockId });
      }
      const url = `${window.location.origin}/toefl-speaking/${id}`;
      setCreatedLink(url);
      try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
    } catch (err) {
      console.error('[assignments] create err:', err);
    } finally {
      setCreating(false);
    }
  }

  function reset() {
    setMode('closed');
    setSelectedStudentId('');
    setCreatedLink('');
  }

  async function copyLink(assignmentId: string) {
    const url = `${window.location.origin}/toefl-speaking/${assignmentId}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(assignmentId);
    setTimeout(() => setCopiedId(''), 1800);
  }

  async function handleDelete(a: TOEFLSpeakingAssignment) {
    if (!confirm(`¿Eliminar la asignación de ${a.studentName}? No se puede deshacer.`)) return;
    try { await deleteToeflSpeakingAssignment(a.id); }
    catch (err) { console.error('[assignments] delete err:', err); }
  }

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <p className="text-xs font-bold uppercase tracking-widest text-[#5A3D7A]">
          🎤 Speaking Assignments
        </p>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F0E5FF] text-[#5A3D7A]">
          {assignments.length}
        </span>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => { setMode('student'); setCreatedLink(''); }}
            className="text-[11px] font-bold px-3 py-1.5 rounded-full text-white shadow-sm"
            style={{ background: 'linear-gradient(135deg, #5A3D7A, #9B7CB8)' }}
          >
            + Asignar a estudiante
          </button>
          <button
            onClick={() => { setMode('public'); setCreatedLink(''); }}
            className="text-[11px] font-bold px-3 py-1.5 rounded-full border-2"
            style={{ borderColor: '#5A3D7A', color: '#5A3D7A' }}
          >
            🔗 Crear link público
          </button>
        </div>
      </div>
      <p className="text-[11px] text-[#5A3D7A]/70 mb-3">
        Asignaciones asíncronas: el estudiante graba las 4 tasks desde su link. El grading corre en background y aparece acá cuando termina.
      </p>

      {/* Create panel (student or public) */}
      {mode !== 'closed' && (
        <div className="mb-4 bg-white rounded-2xl border border-[#E8D5F0] shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#5A3D7A]">
              {mode === 'student' ? 'Asignar a un estudiante' : 'Crear link público (sin login)'}
            </p>
            <button onClick={reset} className="text-[11px] text-gray-500 hover:text-gray-700">✕ Cerrar</button>
          </div>

          {createdLink ? (
            <div className="space-y-2">
              <div className="rounded-xl bg-green-50 border border-green-200 px-3 py-2 text-[11px] text-green-800">
                ✓ Asignación creada. Link copiado al portapapeles.
              </div>
              <div className="flex items-center gap-2 bg-[#FDFAFF] border border-[#E8D5F0] rounded-xl px-3 py-2">
                <input readOnly value={createdLink}
                  onFocus={(e) => e.currentTarget.select()}
                  className="flex-1 min-w-0 text-[11px] font-mono text-[#5A3D7A]/70 bg-transparent focus:outline-none truncate"
                />
                <button onClick={() => navigator.clipboard.writeText(createdLink)}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-[#F0E5FF] text-[#5A3D7A]"
                >Copy</button>
              </div>
              <button onClick={reset} className="text-[11px] font-bold text-[#5A3D7A] underline">
                Crear otra
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {mode === 'student' && (
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#5A3D7A]/70">Estudiante</span>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-[#E0D5FF] bg-white text-sm focus:outline-none focus:border-[#5A3D7A]"
                  >
                    <option value="">— Elegir —</option>
                    {students.map(s => (
                      <option key={s.uid} value={s.uid}>{s.fullName ?? s.email ?? s.uid}</option>
                    ))}
                  </select>
                </label>
              )}
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#5A3D7A]/70">Mock</span>
                <select
                  value={selectedMockId}
                  onChange={(e) => setSelectedMockId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-[#E0D5FF] bg-white text-sm focus:outline-none focus:border-[#5A3D7A]"
                >
                  {TOEFL_MOCKS.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
              </label>
              <div className="sm:col-span-2">
                <button
                  onClick={handleCreate}
                  disabled={creating || (mode === 'student' && !selectedStudentId)}
                  className="w-full font-bold py-2.5 rounded-xl text-white text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #3D2558, #5A3D7A)' }}
                >
                  {creating ? '⏳ Creando…' : mode === 'student' ? 'Crear y copiar link' : 'Generar link público'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assignments list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="h-14 bg-[#F0E5FF] rounded-xl animate-pulse" />)}
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-8 rounded-2xl border border-dashed border-[#C8A8DC]/60 bg-white/40">
          <p className="text-2xl mb-1">🎙</p>
          <p className="text-sm font-bold text-[#5A3D7A]">Aún no hay asignaciones</p>
          <p className="text-xs text-[#5A3D7A]/60 mt-1">Creá una arriba para mandarle un mock a tu estudiante.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden border border-[#E8D5F0] bg-white shadow-md">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F0E5FF]">
                {['Estudiante', 'Mock', 'Fecha', 'Score', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold uppercase tracking-wider px-3 py-2 text-[#5A3D7A]/70">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assignments.map((a, idx) => {
                const isPublic = !a.studentId;
                const mock = getMock(a.mockId);
                const canReview = a.status === 'completed' || a.status === 'graded';
                const hasError = !!a.gradingError;
                return (
                  <tr
                    key={a.id}
                    className="border-t border-[#F0E5FF] hover:bg-[#FDFAFF] transition-colors"
                    style={{ background: idx % 2 === 0 ? 'white' : '#FDFAFF' }}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[#5A3D7A]">{a.studentName}</p>
                        {isPublic && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">LINK</span>
                        )}
                      </div>
                      {a.studentEmail && <p className="text-xs text-[#5A3D7A]/60">{a.studentEmail}</p>}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-[#5A3D7A]/70">
                      {mock?.title ?? a.mockId}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-[#5A3D7A]/70 tabular-nums">
                      {fmtDate(a.createdAt)}
                    </td>
                    <td className="px-3 py-2.5 text-sm font-black tabular-nums text-[#5A3D7A]">
                      {a.overallScore != null ? `${a.overallScore}/30` : <span className="text-gray-300 font-normal">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: a.status === 'graded' ? '#DCFCE7'
                            : a.status === 'completed' ? '#FEF3C7'
                            : a.status === 'in_progress' ? '#DBEAFE'
                            : '#F0E5FF',
                          color: a.status === 'graded' ? '#15803D'
                            : a.status === 'completed' ? '#92400E'
                            : a.status === 'in_progress' ? '#1E40AF'
                            : '#5A3D7A',
                        }}
                      >
                        {a.status === 'graded' ? 'Graded'
                          : a.status === 'completed' ? 'Grading…'
                          : a.status === 'in_progress' ? 'En curso'
                          : 'Asignado'}
                      </span>
                      {hasError && (
                        <span className="ml-1 text-[10px] font-bold text-red-600" title={a.gradingError}>⚠</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {canReview && (
                          <button
                            onClick={() => setReviewOpenId(a.id)}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white hover:opacity-90"
                            style={{ background: '#5A3D7A' }}
                          >
                            Ver
                          </button>
                        )}
                        <button
                          onClick={() => copyLink(a.id)}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#5A3D7A]/40 text-[#5A3D7A] hover:bg-[#F0E5FF]"
                        >
                          {copiedId === a.id ? '✓' : '🔗'}
                        </button>
                        <button
                          onClick={() => handleDelete(a)}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50"
                          title="Eliminar"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {reviewOpen && (
        <ReviewModal
          assignment={reviewOpen}
          onClose={() => setReviewOpenId(null)}
        />
      )}
    </div>
  );
}

function ReviewModal({
  assignment, onClose,
}: {
  assignment: TOEFLSpeakingAssignment;
  onClose:    () => void;
}) {
  const mock = getMock(assignment.mockId);
  const [retrying, setRetrying] = useState(false);
  const [retryProgress, setRetryProgress] = useState<string>('');

  async function handleRetry() {
    if (!mock || !assignment.recordings) return;
    setRetrying(true);
    setRetryProgress('Iniciando…');
    try {
      const { enriched, overallScore } = await gradeSpeakingRecordings(
        assignment.recordings,
        mock.speaking,
        (progress) => {
          const done = progress.filter(p => p.status === 'done' || p.status === 'skipped').length;
          const err  = progress.filter(p => p.status === 'error').length;
          setRetryProgress(`${done}/${progress.length} · ${err ? `${err} err` : 'sin errores'}`);
        },
      );
      await gradeToeflSpeakingAssignment(assignment.id, enriched, overallScore);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      try { await recordGradingError(assignment.id, msg); } catch { /* ignore */ }
      setRetryProgress(`Error: ${msg}`);
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-3xl my-8 shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#E8D5F0] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#5A3D7A]/60">Review · {mock?.title ?? assignment.mockId}</p>
            <p className="text-base font-bold text-[#5A3D7A] truncate">{assignment.studentName}</p>
            {assignment.studentEmail && <p className="text-xs text-[#5A3D7A]/60 truncate">{assignment.studentEmail}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {assignment.overallScore != null && (
              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-widest text-[#5A3D7A]/60">Overall</p>
                <p className="text-2xl font-black tabular-nums text-[#5A3D7A]">{assignment.overallScore}<span className="text-sm text-[#5A3D7A]/60">/30</span></p>
              </div>
            )}
            <button onClick={onClose} className="text-xl text-gray-400 hover:text-gray-600 px-2">✕</button>
          </div>
        </div>

        <div className="overflow-y-auto p-6 space-y-4">
          {assignment.gradingError && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-[11px] text-red-800">
              <p className="font-bold mb-0.5">Grading falló</p>
              <p>{assignment.gradingError}</p>
            </div>
          )}

          {assignment.status === 'completed' && !assignment.recordings?.some(r => r.aiScore != null) && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-800">
              El estudiante ya subió las grabaciones. Grading corriendo en background — refrescá en un minuto.
            </div>
          )}

          {mock && assignment.recordings && assignment.recordings.length > 0 ? (
            <SpeakingBreakdown recordings={assignment.recordings} prompts={mock.speaking} />
          ) : (
            <p className="text-sm text-[#5A3D7A]/60 text-center py-8">Sin grabaciones aún.</p>
          )}

          {(assignment.status === 'graded' || assignment.gradingError) && mock && assignment.recordings && assignment.recordings.length > 0 && (
            <div className="pt-3 border-t border-[#E8D5F0] flex items-center gap-3">
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="text-[11px] font-bold px-3 py-1.5 rounded-full border-2 border-[#5A3D7A] text-[#5A3D7A] hover:bg-[#F0E5FF] disabled:opacity-40"
              >
                {retrying ? '⏳ Recalificando…' : '↻ Reintentar grading'}
              </button>
              {retryProgress && <span className="text-[11px] text-[#5A3D7A]/70">{retryProgress}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
