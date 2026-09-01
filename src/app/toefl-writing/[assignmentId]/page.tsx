// FriendlyTeaching.cl — TOEFL Writing assignment runner (public + student)
//
// Same dual-mode as /toefl-speaking/[assignmentId]:
//  • Registered student: assignment.studentId matches uid (requires login).
//  • Public link: no studentId — anyone with URL can take it after typing
//    their name.
//
// After the student submits, the doc flips to `completed` and the AI
// grading pipeline runs fire-and-forget. Student never sees the rubric,
// score or feedback — only a thank-you screen.

'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getMock } from '@/lib/data/toefl/mock-1';
import type { TOEFLWritingAssignment, WritingSubmission } from '@/types/toefl';
import { WritingSection } from '@/components/toefl/WritingSection';
import {
  markToeflWritingAssignmentStarted,
  completeToeflWritingAssignment,
  gradeToeflWritingAssignment,
  recordWritingGradingError,
  setWritingGuestIdentity,
} from '@/hooks/useToeflWritingAssignments';
import { gradeWritingSubmission } from '@/lib/toefl/gradeWriting';

const B = {
  purple:      '#5A3D7A',
  purpleDark:  '#3D2558',
};

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

function BrandHeader() {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-xl overflow-hidden flex-shrink-0"
        style={{ width: 40, height: 40, outline: '2px solid rgba(255,255,255,0.25)' }}>
        <Image src="/logo-friendlyteaching.jpg" alt="FT" width={40} height={40} className="object-cover w-full h-full" />
      </div>
      <div>
        <p className="text-base font-black text-white leading-tight">FriendlyTeaching</p>
        <p className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>TOEFL iBT Writing Mocks</p>
      </div>
    </div>
  );
}

type UiPhase =
  | 'loading'
  | 'auth-required'
  | 'wrong-user'
  | 'not-found'
  | 'guest-identity'
  | 'welcome'
  | 'writing'
  | 'completed';

export default function ToeflWritingAssignmentPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const [uid, setUid] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [assignment, setAssignment] = useState<TOEFLWritingAssignment | null>(null);
  const [uiPhase, setUiPhase] = useState<UiPhase>('loading');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid ?? null);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!assignmentId) { setUiPhase('not-found'); return; }

    (async () => {
      try {
        const snap = await getDoc(doc(db, 'toeflWritingAssignments', assignmentId));
        if (!snap.exists()) { setUiPhase('not-found'); return; }
        const data = { id: snap.id, ...snap.data() } as TOEFLWritingAssignment;
        setAssignment(data);

        if (data.status === 'completed' || data.status === 'graded') {
          setUiPhase('completed');
          return;
        }

        if (!data.studentId) {
          setUiPhase('guest-identity');
          return;
        }

        if (!uid) { setUiPhase('auth-required'); return; }
        if (data.studentId !== uid) { setUiPhase('wrong-user'); return; }
        setUiPhase('welcome');
      } catch (err) {
        console.error('[toefl-writing-assignment] load err:', err);
        setUiPhase('not-found');
      }
    })();
  }, [authReady, uid, assignmentId]);

  const mock = assignment ? getMock(assignment.mockId) : undefined;

  async function submitGuestIdentity() {
    if (!assignment) return;
    const name = guestName.trim();
    if (!name) return;
    try {
      await setWritingGuestIdentity(assignment.id, name, guestEmail.trim() || undefined);
      setAssignment({
        ...assignment,
        studentName:  name,
        studentEmail: guestEmail.trim() || assignment.studentEmail,
      });
      setUiPhase('welcome');
    } catch (err) {
      console.error('[toefl-writing-assignment] guest identity err:', err);
    }
  }

  async function startWriting() {
    if (!assignment) return;
    setUiPhase('writing');
    try { await markToeflWritingAssignmentStarted(assignment.id); } catch { /* non-fatal */ }
  }

  async function handleWritingDone(submission: WritingSubmission) {
    if (!assignment || !mock) return;
    setUiPhase('completed');
    try {
      await completeToeflWritingAssignment(assignment.id, submission);
    } catch (err) {
      console.error('[toefl-writing-assignment] save submission err:', err);
      return;
    }
    try {
      const { enriched, sectionScore } = await gradeWritingSubmission(submission, mock.writing);
      await gradeToeflWritingAssignment(assignment.id, enriched, sectionScore);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[toefl-writing-assignment] grading err:', msg);
      try { await recordWritingGradingError(assignment.id, msg); } catch { /* ignore */ }
    }
  }

  if (uiPhase === 'loading') {
    return (
      <PageBg>
        <div className="text-center py-24 text-[#5A3D7A]/70">
          <div className="w-10 h-10 rounded-full border-4 border-[#C8A8DC] border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-sm">Cargando…</p>
        </div>
      </PageBg>
    );
  }

  if (uiPhase === 'auth-required') {
    return (
      <PageBg>
        <MessageCard title="Inicia sesión" body="Necesitas loguearte con tu cuenta de estudiante para acceder a este mock." />
      </PageBg>
    );
  }

  if (uiPhase === 'not-found') {
    return (
      <PageBg>
        <MessageCard title="Mock no encontrado" body="El link no es válido o el mock fue eliminado. Consulta con tu profesor." />
      </PageBg>
    );
  }

  if (uiPhase === 'wrong-user') {
    return (
      <PageBg>
        <MessageCard title="Este mock no es tuyo" body="El mock está asignado a otro estudiante. Inicia sesión con la cuenta correcta." />
      </PageBg>
    );
  }

  if (!assignment || !mock) {
    return (
      <PageBg>
        <MessageCard title="Mock no disponible" body="No pudimos cargar el prompt del mock. Consulta con tu profesor." />
      </PageBg>
    );
  }

  if (uiPhase === 'guest-identity') {
    return (
      <PageBg>
        <div className="w-full max-w-md rounded-3xl overflow-hidden bg-white" style={{ boxShadow: '0 24px 64px -8px rgba(61,37,88,0.3)' }}>
          <div className="px-8 py-7" style={{ background: 'linear-gradient(135deg, #3D2558, #5A3D7A, #9B7CB8)' }}>
            <BrandHeader />
            <h1 className="text-xl font-black text-white leading-tight mt-6 pt-6 border-t border-white/10">
              ¿Cómo te llamas?
            </h1>
            <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Antes de empezar tu profe necesita saber quién hizo el mock.
            </p>
          </div>
          <div className="p-8 space-y-3">
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#5A3D7A]/70">Nombre y apellido</span>
              <input type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)}
                placeholder="Ej. María Pérez"
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#E0D5FF] bg-white text-sm focus:outline-none focus:border-[#5A3D7A]"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#5A3D7A]/70">Email (opcional)</span>
              <input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="maria@ejemplo.com"
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#E0D5FF] bg-white text-sm focus:outline-none focus:border-[#5A3D7A]"
              />
            </label>
            <button onClick={submitGuestIdentity} disabled={!guestName.trim()}
              className="w-full font-bold py-3 rounded-xl text-white text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #3D2558, #5A3D7A)' }}
            >
              Continuar →
            </button>
          </div>
        </div>
      </PageBg>
    );
  }

  if (uiPhase === 'welcome') {
    return (
      <PageBg>
        <div className="w-full max-w-lg rounded-3xl overflow-hidden bg-white" style={{ boxShadow: '0 24px 64px -8px rgba(61,37,88,0.3)' }}>
          <div className="px-8 py-7" style={{ background: 'linear-gradient(135deg, #3D2558, #5A3D7A, #9B7CB8)' }}>
            <BrandHeader />
            <h1 className="text-2xl font-black text-white leading-tight mt-6 pt-6 border-t border-white/10">
              Welcome to TOEFL iBT Writing Mocks
            </h1>
            <p className="text-[11px] mt-2" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {mock.title} · 1 task · {mock.writing.timerMin} min
            </p>
          </div>
          <div className="p-8 space-y-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              Hola <strong>{assignment.studentName}</strong>, tu profesor te asignó un mock del <strong>TOEFL Writing</strong> (Academic Discussion).
            </p>
            <ul className="text-xs text-[#2D1B4E] space-y-2">
              <li className="flex gap-2"><span>✍️</span><span>Vas a contribuir al debate del profesor y sus dos alumnos.</span></li>
              <li className="flex gap-2"><span>⏱</span><span>Tenés <strong>{mock.writing.timerMin} minutos</strong> — el timer no se puede pausar.</span></li>
              <li className="flex gap-2"><span>💾</span><span>El texto se autoguarda mientras escribís, así no perdés nada si se corta la conexión.</span></li>
              <li className="flex gap-2"><span>📏</span><span>Mínimo <strong>{mock.writing.minWords} palabras</strong>.</span></li>
              <li className="flex gap-2"><span>👩‍🏫</span><span>Tu profesor va a revisar tu respuesta y darte feedback en tu próxima clase.</span></li>
            </ul>
            <button onClick={startWriting}
              className="w-full font-bold py-3.5 rounded-xl text-white text-sm transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #3D2558, #5A3D7A)' }}
            >
              ▶ Empezar
            </button>
          </div>
        </div>
      </PageBg>
    );
  }

  if (uiPhase === 'writing') {
    return (
      <PageBg>
        <WritingSection
          prompt={mock.writing}
          onDone={handleWritingDone}
          confirmSubmit
        />
      </PageBg>
    );
  }

  // completed
  return (
    <PageBg>
      <div className="w-full max-w-md rounded-3xl overflow-hidden bg-white text-center"
        style={{ boxShadow: '0 24px 64px -8px rgba(61,37,88,0.3)' }}>
        <div className="px-8 py-8 text-white"
          style={{ background: 'linear-gradient(135deg, #3D2558, #5A3D7A, #9B7CB8)' }}>
          <div className="text-5xl mb-2">✓</div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-70">Completed</p>
          <p className="text-lg font-black mt-1">Writing enviado</p>
        </div>
        <div className="p-8 space-y-3">
          <p className="text-base font-semibold" style={{ color: B.purpleDark }}>
            Ask your teacher for feedback and results.
          </p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Ya subimos tu respuesta. Tu profesor la va a revisar y te va a compartir el resultado.
          </p>
        </div>
      </div>
    </PageBg>
  );
}

function MessageCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="w-full max-w-md rounded-3xl overflow-hidden bg-white text-center"
      style={{ boxShadow: '0 24px 64px -8px rgba(61,37,88,0.3)' }}>
      <div className="px-8 py-6" style={{ background: 'linear-gradient(135deg, #3D2558, #5A3D7A)' }}>
        <BrandHeader />
      </div>
      <div className="p-8 space-y-2">
        <p className="text-base font-bold" style={{ color: B.purpleDark }}>{title}</p>
        <p className="text-xs text-gray-500">{body}</p>
      </div>
    </div>
  );
}
