// FriendlyTeaching.cl — Students Management Page
'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useStudents, approveStudent, rejectStudent } from '@/hooks/useStudents';
import { updateDoc, doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { FTUser, LessonLevel } from '@/types/firebase';
import { StudentDetailModal } from '@/components/students/StudentDetailModal';
import { useBookingRequests } from '@/hooks/useBookingRequests';
import { StudentsListSkeleton } from '@/components/ui/Skeleton';
import TopBar from '@/components/layout/TopBar';

const LEVELS: LessonLevel[] = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];

const LEVEL_DESC: Record<string, string> = {
  A0: 'Principiante absoluto',
  A1: 'Principiante',
  A2: 'Básico',
  B1: 'Intermedio',
  'B1+': 'Intermedio alto',
  B2: 'Intermedio avanzado',
  C1: 'Avanzado',
};

const LEVEL_COLORS: Record<string, string> = {
  A0: 'bg-gray-100 text-gray-600',
  A1: 'bg-blue-100 text-blue-700',
  A2: 'bg-sky-100 text-sky-700',
  B1: 'bg-green-100 text-green-700',
  'B1+': 'bg-emerald-100 text-emerald-700',
  B2: 'bg-amber-100 text-amber-700',
  C1: 'bg-purple-100 text-purple-700',
};

// ─── Approve modal ────────────────────────────────────────────────────────────

function ApproveModal({
  student,
  teacherId,
  teacherName,
  onClose,
}: {
  student: FTUser;
  teacherId: string;
  teacherName: string;
  onClose: () => void;
}) {
  const [level, setLevel] = useState<LessonLevel>(student.studentData?.level ?? 'A1');
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      // All writes (approve + level + history) happen in a single Firestore transaction
      await approveStudent(student.uid, teacherId, {
        level,
        studentEmail: student.email,
        studentName: student.fullName,
        teacherName,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-lg font-bold text-[#5A3D7A] mb-1">Aprobar estudiante</h2>
        <p className="text-sm text-gray-500 mb-5">
          Asigna el nivel de <strong>{student.fullName}</strong> antes de aprobar su cuenta.
        </p>

        <div className="space-y-2 mb-5">
          <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-2">
            Nivel de inglés
          </label>
          {LEVELS.map(l => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                level === l
                  ? 'border-[#C8A8DC] bg-[#F0E5FF] text-[#5A3D7A]'
                  : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-[#C8A8DC]'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${LEVEL_COLORS[l]}`}>{l}</span>
                {LEVEL_DESC[l]}
              </span>
              {level === l && <span className="text-[#9B7CB8]">✓</span>}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2.5 bg-[#A8E6A1] hover:bg-[#8DD67E] text-[#2D6E2A] rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
          >
            {loading ? 'Aprobando...' : '✅ Aprobar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Level edit modal ─────────────────────────────────────────────────────────

function LevelModal({ student, teacherId, onClose }: { student: FTUser; teacherId: string; onClose: () => void }) {
  const [level, setLevel] = useState<LessonLevel>(student.studentData?.level ?? 'A1');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      const prevLevel = student.studentData?.level ?? null;
      await updateDoc(doc(db, 'users', student.uid), {
        'studentData.level': level,
        updatedAt: serverTimestamp(),
      });
      // Record the level change in levelHistory
      if (prevLevel !== level) {
        await addDoc(collection(db, 'levelHistory'), {
          studentId: student.uid,
          teacherId,
          fromLevel: prevLevel,
          toLevel: level,
          notes: '',
          changedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
      }
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-lg font-bold text-[#5A3D7A] mb-1">Cambiar nivel</h2>
        <p className="text-sm text-gray-500 mb-4">{student.fullName}</p>
        <div className="space-y-2 mb-5">
          {LEVELS.map(l => (
            <button key={l} onClick={() => setLevel(l)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                level === l ? 'border-[#C8A8DC] bg-[#F0E5FF] text-[#5A3D7A]' : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-[#C8A8DC]'
              }`}>
              <span className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${LEVEL_COLORS[l]}`}>{l}</span>
                {LEVEL_DESC[l]}
              </span>
              {level === l && <span className="text-[#9B7CB8]">✓</span>}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 py-2.5 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors">
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Student Card ─────────────────────────────────────────────────────────────

function StudentCard({
  student,
  isPending,
  teacherId,
  teacherName,
}: {
  student: FTUser;
  isPending: boolean;
  teacherId: string;
  teacherName: string;
}) {
  const [showApprove, setShowApprove] = useState(false);
  const [showLevel, setShowLevel] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  async function handleReject() {
    if (!confirm(`¿Rechazar a ${student.fullName}?`)) return;
    setRejecting(true);
    try { await rejectStudent(student.uid); }
    finally { setRejecting(false); }
  }

  const level = student.studentData?.level;

  return (
    <>
      <div className={`bg-white rounded-2xl p-4 shadow-sm border transition-shadow hover:shadow-md ${isPending ? 'border-amber-200' : 'border-gray-100'}`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#F0E5FF] flex items-center justify-center text-[#5A3D7A] font-bold text-sm flex-shrink-0">
              {student.fullName[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 truncate">{student.fullName}</p>
              <p className="text-xs text-gray-400 truncate">{student.email}</p>
              {student.phone && <p className="text-xs text-gray-400">📱 {student.phone}</p>}
            </div>
          </div>
          <span className={`flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${
            isPending ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
          }`}>
            {isPending ? '⏳ Pendiente' : '✅ Aprobado'}
          </span>
        </div>

        {/* Level badge */}
        {level && !isPending && (
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${LEVEL_COLORS[level]}`}>
              Nivel {level}
            </span>
            <span className="text-xs text-gray-400">{LEVEL_DESC[level]}</span>
          </div>
        )}

        {/* Actions */}
        {isPending ? (
          <div className="flex gap-2">
            <button onClick={() => setShowApprove(true)}
              className="flex-1 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl text-xs font-bold transition-colors">
              ✅ Aprobar
            </button>
            <button onClick={handleReject} disabled={rejecting}
              className="flex-1 py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50">
              ✗ Rechazar
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setShowLevel(true)}
              className="flex-1 py-2 bg-[#F0E5FF] hover:bg-[#E0D0F5] text-[#5A3D7A] rounded-xl text-xs font-bold transition-colors">
              ✏️ Nivel
            </button>
            <button onClick={() => setShowDetail(true)}
              className="flex-1 py-2 bg-[#EDE0F6] hover:bg-[#DDD0EE] text-[#5A3D7A] rounded-xl text-xs font-bold transition-colors">
              📊 Análisis
            </button>
          </div>
        )}
      </div>

      {showApprove && (
        <ApproveModal
          student={student}
          teacherId={teacherId}
          teacherName={teacherName}
          onClose={() => setShowApprove(false)}
        />
      )}
      {showLevel && (
        <LevelModal student={student} teacherId={teacherId} onClose={() => setShowLevel(false)} />
      )}
      {showDetail && (
        <StudentDetailModal
          student={student}
          teacherId={teacherId}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const { profile } = useAuthStore();
  const { students, pendingStudents, loading } = useStudents();
  const { requests: bookingRequests, approveRequest, rejectRequest } = useBookingRequests();
  const teacherId = profile?.uid ?? '';
  const teacherName = profile?.fullName ?? 'Tu profesor';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFCF7] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 space-y-2">
            <div className="animate-pulse bg-gray-200 rounded-xl h-8 w-48" />
            <div className="animate-pulse bg-gray-200 rounded-xl h-4 w-32" />
          </div>
          <StudentsListSkeleton count={8} />
        </div>
      </div>
    );
  }

  const DAY_ES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  return (
    <div className="min-h-screen bg-[#FFFCF7] p-6">
      <TopBar
        title="👥 Estudiantes"
        subtitle={`${students.length} aprobado${students.length !== 1 ? 's' : ''} · ${pendingStudents.length} pendiente${pendingStudents.length !== 1 ? 's' : ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Estudiantes' }
        ]}
        actions={
          <a
            href="/book"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-[#F0E5FF] hover:bg-[#E0D0F5] text-[#5A3D7A] rounded-xl text-xs font-bold transition-colors flex-shrink-0"
          >
            🔗 Página de reserva
          </a>
        }
      />

      {/* Booking requests from /book page */}
      {bookingRequests.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold text-[#5A3D7A] uppercase tracking-wider mb-3">
            🌐 Solicitudes de reserva online ({bookingRequests.length})
          </h2>
          <div className="space-y-3">
            {bookingRequests.map(req => (
              <div key={req.id} className="bg-white rounded-2xl border border-blue-100 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{req.studentName}</p>
                    <p className="text-xs text-gray-400">{req.studentEmail}</p>
                    {req.studentPhone && <p className="text-xs text-gray-400">📱 {req.studentPhone}</p>}
                    <p className="text-xs text-blue-600 font-semibold mt-1">
                      📅 {DAY_ES[req.requestedDow]} · {req.requestedHour}:00{req.isRecurring ? ' · ↻ Recurrente' : ''}
                    </p>
                    {req.currentLevel && <p className="text-xs text-gray-400">Nivel: {req.currentLevel}</p>}
                    {req.message && <p className="text-xs text-gray-500 italic mt-1">&ldquo;{req.message}&rdquo;</p>}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => approveRequest(req.id)}
                      className="py-1.5 px-3 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl text-xs font-bold transition-colors"
                    >
                      ✅ Aprobar
                    </button>
                    <button
                      onClick={() => rejectRequest(req.id)}
                      className="py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition-colors"
                    >
                      ✗ Rechazar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pending requests */}
      {pendingStudents.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold text-[#5A3D7A] uppercase tracking-wider mb-3">
            📋 Solicitudes pendientes ({pendingStudents.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pendingStudents.map(s => (
              <StudentCard key={s.uid} student={s} isPending={true} teacherId={teacherId} teacherName={teacherName} />
            ))}
          </div>
        </section>
      )}

      {/* Approved students */}
      <section>
        <h2 className="text-sm font-bold text-[#5A3D7A] uppercase tracking-wider mb-3">
          ✅ Estudiantes aprobados ({students.length})
        </h2>
        {students.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-gray-500 text-sm">No hay estudiantes aprobados aún.</p>
            <p className="text-xs text-gray-400 mt-1">Aprueba las solicitudes pendientes para que aparezcan aquí.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {students.map(s => (
              <StudentCard key={s.uid} student={s} isPending={false} teacherId={teacherId} teacherName={teacherName} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
