// FriendlyTeaching.cl — Student Live Class View
// Student joins the teacher's live session and sees the presentation
// with the teacher's annotations overlaid in real time.
'use client';
import { use } from 'react';
import Link from 'next/link';
import PresentationProjector from '@/components/classroom/PresentationProjector';
import { useStudentLiveSession } from '@/hooks/useLiveSession';

interface Params { lessonId: string }

export default function StudentLivePage({ params }: { params: Promise<Params> }) {
  const { lessonId } = use(params);
  const { session, loading, isAssigned, syncCanvas } = useStudentLiveSession(lessonId);

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#C8547A] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Conectando a la clase…</p>
        </div>
      </div>
    );
  }

  // ── Session not found or not active ─────────────────────────
  if (!session || !session.active) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm px-6">
          <div className="text-5xl mb-4">📺</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {session ? 'La clase ha terminado' : 'Clase no disponible'}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {session
              ? 'Tu profesor ha finalizado la sesión en vivo.'
              : 'No hay ninguna clase en vivo activa para esta lección.'}
          </p>
          <Link
            href="/dashboard/student"
            className="inline-block px-5 py-2.5 bg-[#C8547A] text-white rounded-xl text-sm font-bold hover:bg-[#A8365A] transition-colors"
          >
            ← Volver al panel
          </Link>
        </div>
      </div>
    );
  }

  // ── Student not invited ──────────────────────────────────────
  if (!isAssigned) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm px-6">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Acceso restringido</h2>
          <p className="text-gray-500 text-sm mb-6">
            No estás invitado a esta clase en vivo. Contacta a tu profesor.
          </p>
          <Link
            href="/dashboard/student"
            className="inline-block px-5 py-2.5 bg-[#C8547A] text-white rounded-xl text-sm font-bold hover:bg-[#A8365A] transition-colors"
          >
            ← Volver al panel
          </Link>
        </div>
      </div>
    );
  }

  // ── Active session view ──────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-gray-950 overflow-hidden">

      {/* Live indicator bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-red-900/80 text-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          <span className="text-xs font-bold tracking-wide uppercase">Clase en vivo</span>
          <span className="text-red-300 text-xs">·</span>
          <span className="text-xs text-red-200 truncate max-w-xs">{session.lessonTitle}</span>
        </div>
        <Link
          href="/dashboard/student"
          className="text-[10px] text-red-300 hover:text-white font-semibold transition-colors"
        >
          Salir
        </Link>
      </div>

      {/* Projector — student view */}
      <div className="flex-1 overflow-hidden">
        <PresentationProjector
          src={session.presentationUrl}
          title={session.lessonTitle}
          isTeacher={false}
          /* Live: overlay teacher's canvas */
          teacherCanvasOverlay={session.teacherCanvas || undefined}
          /* Live: show student tools only when teacher allows */
          studentAnnotationsEnabled={session.studentAnnotationsEnabled}
          /* Live: sync student canvas when annotations enabled */
          onCanvasChange={session.studentAnnotationsEnabled ? syncCanvas : undefined}
          /* No finish button in live view */
          onFinish={undefined}
        />
      </div>

      {/* Status footer */}
      <div className="flex items-center justify-center gap-3 px-4 py-2 bg-gray-900 border-t border-gray-800 flex-shrink-0">
        {session.studentAnnotationsEnabled ? (
          <span className="text-xs text-green-400 font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Puedes hacer anotaciones
          </span>
        ) : (
          <span className="text-xs text-gray-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
            Solo lectura · espera a que el profesor habilite tus herramientas
          </span>
        )}
      </div>
    </div>
  );
}
