// FriendlyTeaching.cl — LiveSessionPanel
// Slide-out side panel for teacher to manage a live session:
//   • No active session → student selector + "Iniciar" button
//   • Active session    → status, student list, annotation toggle, "Terminar" button
'use client';
import { useState, useEffect } from 'react';
import { useStudents }           from '@/hooks/useStudents';
import { useTeacherLiveSession } from '@/hooks/useLiveSession';
import type { FTUser } from '@/types/firebase';

interface Props {
  lessonId: string;
  lessonTitle: string;
  presentationUrl: string;
  onClose: () => void;
}

export default function LiveSessionPanel({
  lessonId,
  lessonTitle,
  presentationUrl,
  onClose,
}: Props) {
  const { students, loading: studentsLoading } = useStudents();
  const { session, isLive, start, end, toggleStudentAnnotations } =
    useTeacherLiveSession(lessonId);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [starting, setStarting]       = useState(false);
  const [ending,   setEnding]         = useState(false);

  // Pre-select all students when panel opens (common case: 1 student)
  useEffect(() => {
    if (students.length > 0 && selectedIds.length === 0) {
      setSelectedIds(students.map((s) => s.uid));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students]);

  const toggleStudent = (uid: string) => {
    setSelectedIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid],
    );
  };

  const handleStart = async () => {
    if (selectedIds.length === 0) return;
    setStarting(true);
    try {
      await start(selectedIds, lessonTitle, presentationUrl);
    } finally {
      setStarting(false);
    }
  };

  const handleEnd = async () => {
    setEnding(true);
    try {
      await end();
    } finally {
      setEnding(false);
    }
  };

  return (
    /* Full-height slide-in panel on the right side of the projector */
    <div className="absolute inset-y-0 right-0 w-72 z-30 flex flex-col bg-white border-l border-gray-200 shadow-2xl animate-in slide-in-from-right duration-200">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#FFF0F5] border-b border-[#FFB3CC]">
        <div className="flex items-center gap-2">
          {isLive
            ? <span className="flex items-center gap-1.5 text-sm font-bold text-red-600">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Clase en vivo
              </span>
            : <span className="text-sm font-bold text-[#9B3060]">Iniciar clase en vivo</span>
          }
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">

        {/* ── ACTIVE SESSION ── */}
        {isLive && session && (
          <>
            {/* Session info */}
            <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2">
              <p className="text-xs font-semibold text-red-700 mb-1">Sesión activa</p>
              <p className="text-xs text-gray-500 leading-snug truncate">{session.lessonTitle}</p>
            </div>

            {/* Student annotations toggle */}
            <div className="rounded-xl border border-gray-200 px-3 py-3">
              <p className="text-xs font-bold text-gray-700 mb-2">Anotaciones del estudiante</p>
              <button
                onClick={toggleStudentAnnotations}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  session.studentAnnotationsEnabled
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                }`}
              >
                <span>
                  {session.studentAnnotationsEnabled ? '✏️ Anotaciones habilitadas' : '🔒 Anotaciones bloqueadas'}
                </span>
                <span className={`w-8 h-4 rounded-full transition-colors relative ${
                  session.studentAnnotationsEnabled ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${
                    session.studentAnnotationsEnabled ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </span>
              </button>
              <p className="text-[10px] text-gray-400 mt-1.5 leading-snug">
                {session.studentAnnotationsEnabled
                  ? 'Los estudiantes pueden dibujar y escribir sobre la presentación.'
                  : 'Solo tú puedes hacer anotaciones en este momento.'}
              </p>
            </div>

            {/* Invited students */}
            <div>
              <p className="text-xs font-bold text-gray-600 mb-2">Estudiantes invitados</p>
              <div className="space-y-1.5">
                {session.assignedStudents.map((uid) => {
                  const student = students.find((s) => s.uid === uid);
                  return (
                    <div key={uid} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
                      <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                      <span className="text-xs text-gray-700 truncate">
                        {student?.fullName ?? uid}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Share link hint */}
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-3 py-2">
              <p className="text-[10px] font-semibold text-blue-700 mb-1">📱 Para el estudiante</p>
              <p className="text-[10px] text-blue-600 leading-snug">
                El estudiante verá un banner en su panel principal para unirse a la clase.
              </p>
            </div>
          </>
        )}

        {/* ── NO ACTIVE SESSION ── */}
        {!isLive && (
          <>
            {studentsLoading ? (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-[#C8547A] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500">No tienes estudiantes aprobados aún.</p>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-xs font-bold text-gray-600 mb-2">Invitar estudiantes</p>
                  <div className="space-y-1.5">
                    {students.map((student: FTUser) => {
                      const checked = selectedIds.includes(student.uid);
                      return (
                        <button
                          key={student.uid}
                          onClick={() => toggleStudent(student.uid)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                            checked
                              ? 'bg-[#FFF0F5] border-[#FFB3CC] text-[#9B3060]'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-[#FFB3CC]'
                          }`}
                        >
                          {/* Checkbox */}
                          <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                            checked ? 'bg-[#C8547A] border-[#C8547A]' : 'border-gray-300'
                          }`}>
                            {checked && <span className="text-white text-[10px] leading-none">✓</span>}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{student.fullName}</p>
                            <p className="text-[10px] text-gray-400 truncate">{student.email}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2">
                  <p className="text-[10px] text-amber-700 leading-snug">
                    💡 El estudiante verá tus anotaciones en tiempo real y podrá unirse desde su panel.
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-4 py-3 border-t border-gray-100 space-y-2">
        {isLive ? (
          <button
            onClick={handleEnd}
            disabled={ending}
            className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
          >
            {ending
              ? <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              : '⏹'}
            Terminar clase
          </button>
        ) : (
          <button
            onClick={handleStart}
            disabled={starting || selectedIds.length === 0}
            className="w-full py-2.5 rounded-xl bg-[#C8547A] hover:bg-[#A8365A] disabled:opacity-60 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
          >
            {starting
              ? <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              : '🔴'}
            Iniciar clase en vivo
          </button>
        )}
        <button
          onClick={onClose}
          className="w-full py-2 rounded-xl border border-gray-200 text-gray-500 text-xs font-semibold hover:bg-gray-50 transition-colors"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
