// FriendlyTeaching.cl — Students Management Page (rebuilt)
'use client';
import { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useStudents, approveStudent, rejectStudent } from '@/hooks/useStudents';
import { useBookingRequests } from '@/hooks/useBookingRequests';
import { useRecurringBookings, linkBookingsByName, type ScheduleSlot } from '@/hooks/useRecurringBookings';
import { updateDoc, doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { FTUser, LessonLevel } from '@/types/firebase';
import { StudentDetailModal } from '@/components/students/StudentDetailModal';
import { StudentsListSkeleton } from '@/components/ui/Skeleton';
import TopBar from '@/components/layout/TopBar';

// ─── Constants ────────────────────────────────────────────────────────────────

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

const DAY_SHORT = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_FULL  = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function toWhatsAppUrl(phone: string): string {
  // Strip everything except digits and use as-is (wa.me handles country codes)
  return `https://wa.me/${phone.replace(/\D/g, '')}`;
}

function formatSlot(s: ScheduleSlot): string {
  const h = s.hour.toString().padStart(2, '0');
  const m = s.minute === 30 ? '30' : '00';
  return `${DAY_SHORT[s.dayOfWeek]} ${h}:${m}`;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// ─── Approve Modal ────────────────────────────────────────────────────────────

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
  const [level, setLevel]   = useState<LessonLevel>(student.studentData?.level ?? 'A1');
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await approveStudent(student.uid, teacherId, {
        level,
        studentEmail: student.email,
        studentName:  student.fullName,
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
          Asigna el nivel de <strong>{student.fullName}</strong> antes de aprobar.
        </p>
        <div className="space-y-2 mb-5">
          <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-2">
            Nivel de inglés
          </label>
          {LEVELS.map((l) => (
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
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2.5 bg-[#A8E6A1] hover:bg-[#8DD67E] text-[#2D6E2A] rounded-xl text-sm font-bold disabled:opacity-50"
          >
            {loading ? 'Aprobando...' : 'Aprobar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Student Modal ───────────────────────────────────────────────────────

function EditStudentModal({
  student,
  teacherId,
  scheduleSlots,
  unlinkedSlots,
  onClose,
}: {
  student: FTUser;
  teacherId: string;
  scheduleSlots: ScheduleSlot[];
  unlinkedSlots: ScheduleSlot[];
  onClose: () => void;
}) {
  const [fullName, setFullName] = useState(student.fullName);
  const [phone,    setPhone]    = useState(student.phone ?? '');
  const [notes,    setNotes]    = useState(student.studentData?.notes ?? '');
  const [level,    setLevel]    = useState<LessonLevel>(student.studentData?.level ?? 'A1');
  const [tab,      setTab]      = useState<'info' | 'schedule' | 'level'>('info');
  const [saving,   setSaving]   = useState(false);
  const [linking,  setLinking]  = useState(false);
  const [linkedCount, setLinkedCount] = useState(0);

  async function handleSave() {
    setSaving(true);
    try {
      const prevLevel = student.studentData?.level ?? null;

      await updateDoc(doc(db, 'users', student.uid), {
        fullName,
        phone,
        'studentData.notes': notes,
        'studentData.level': level,
        updatedAt: serverTimestamp(),
      });

      if (prevLevel !== level) {
        await addDoc(collection(db, 'levelHistory'), {
          studentId:  student.uid,
          teacherId,
          fromLevel:  prevLevel,
          toLevel:    level,
          notes:      '',
          changedAt:  serverTimestamp(),
          createdAt:  serverTimestamp(),
        });
      }

      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handleLinkBookings() {
    setLinking(true);
    try {
      const count = await linkBookingsByName(teacherId, student.uid, student.fullName);
      setLinkedCount(count);
    } finally {
      setLinking(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F0E5FF] flex items-center justify-center text-[#5A3D7A] font-bold text-sm flex-shrink-0">
            {initials(fullName || student.fullName)}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-800 truncate">{student.fullName}</p>
            <p className="text-xs text-gray-400 truncate">{student.email}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {(['info', 'schedule', 'level'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-bold transition-colors ${
                tab === t
                  ? 'text-[#5A3D7A] border-b-2 border-[#9B7CB8]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t === 'info' ? 'Información' : t === 'schedule' ? 'Horario' : 'Nivel'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5 flex-1">
          {tab === 'info' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Nombre completo
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8]"
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Email
                </label>
                <input
                  value={student.email}
                  readOnly
                  className="w-full px-3 py-2.5 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Teléfono
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8]"
                  placeholder="+56 9 1234 5678"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Notas internas
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8] resize-none"
                  placeholder="Notas sobre el estudiante (solo visibles para ti)"
                />
              </div>
            </div>
          )}

          {tab === 'schedule' && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Clases recurrentes vinculadas
                </p>
                {scheduleSlots.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {scheduleSlots
                      .slice()
                      .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.hour - b.hour)
                      .map((s, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 bg-[#F0E5FF] text-[#5A3D7A] text-xs font-bold rounded-full"
                        >
                          {DAY_FULL[s.dayOfWeek]} {s.hour.toString().padStart(2, '0')}:{s.minute === 30 ? '30' : '00'}
                        </span>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No hay clases vinculadas por ID.</p>
                )}
              </div>

              {unlinkedSlots.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-amber-700 mb-1">
                    Clases por nombre (sin vincular)
                  </p>
                  <p className="text-xs text-amber-600 mb-3">
                    Se encontraron {unlinkedSlots.length} horario{unlinkedSlots.length !== 1 ? 's' : ''} con el nombre &ldquo;{student.fullName}&rdquo; que aún no están vinculados al perfil.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {unlinkedSlots
                      .slice()
                      .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.hour - b.hour)
                      .map((s, i) => (
                        <span key={i} className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                          {DAY_FULL[s.dayOfWeek]} {s.hour.toString().padStart(2, '0')}:{s.minute === 30 ? '30' : '00'}
                        </span>
                      ))}
                  </div>
                  {linkedCount > 0 ? (
                    <p className="text-xs text-green-700 font-semibold">
                      ✓ {linkedCount} reserva{linkedCount !== 1 ? 's' : ''} vinculada{linkedCount !== 1 ? 's' : ''} correctamente.
                    </p>
                  ) : (
                    <button
                      onClick={handleLinkBookings}
                      disabled={linking}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-colors"
                    >
                      {linking ? 'Vinculando...' : 'Vincular clases al perfil'}
                    </button>
                  )}
                </div>
              )}

              {scheduleSlots.length === 0 && unlinkedSlots.length === 0 && (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-400">Este estudiante no tiene clases recurrentes.</p>
                  <p className="text-xs text-gray-300 mt-1">Ve al Planner para asignar horarios.</p>
                </div>
              )}
            </div>
          )}

          {tab === 'level' && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Nivel de inglés</p>
              {LEVELS.map((l) => (
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
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pending student card ─────────────────────────────────────────────────────

function PendingCard({
  student,
  teacherId,
  teacherName,
}: {
  student: FTUser;
  teacherId: string;
  teacherName: string;
}) {
  const [showApprove, setShowApprove] = useState(false);
  const [rejecting,   setRejecting]   = useState(false);

  async function handleReject() {
    if (!confirm(`¿Rechazar a ${student.fullName}?`)) return;
    setRejecting(true);
    try { await rejectStudent(student.uid); }
    finally { setRejecting(false); }
  }

  return (
    <>
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-200">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs flex-shrink-0">
              {initials(student.fullName)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 text-sm truncate">{student.fullName}</p>
              <p className="text-xs text-gray-400 truncate">{student.email}</p>
              {student.phone && <p className="text-xs text-gray-400">📱 {student.phone}</p>}
            </div>
          </div>
          <span className="flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-700">
            Pendiente
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowApprove(true)}
            className="flex-1 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl text-xs font-bold transition-colors"
          >
            Aprobar
          </button>
          <button
            onClick={handleReject}
            disabled={rejecting}
            className="flex-1 py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
          >
            Rechazar
          </button>
        </div>
      </div>
      {showApprove && (
        <ApproveModal
          student={student}
          teacherId={teacherId}
          teacherName={teacherName}
          onClose={() => setShowApprove(false)}
        />
      )}
    </>
  );
}

// ─── Approved student row ─────────────────────────────────────────────────────

function StudentRow({
  student,
  teacherId,
  scheduleSlots,
  unlinkedSlots,
}: {
  student: FTUser;
  teacherId: string;
  scheduleSlots: ScheduleSlot[];
  unlinkedSlots: ScheduleSlot[];
}) {
  const [showEdit,   setShowEdit]   = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const level = student.studentData?.level;

  const sortedSlots = useMemo(
    () => [...scheduleSlots].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.hour - b.hour),
    [scheduleSlots],
  );

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3 hover:shadow-sm transition-shadow">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-[#F0E5FF] flex items-center justify-center text-[#5A3D7A] font-bold text-sm flex-shrink-0">
          {initials(student.fullName)}
        </div>

        {/* Name + email */}
        <div className="min-w-0 w-40 flex-shrink-0">
          <p className="font-semibold text-gray-800 text-sm truncate">{student.fullName}</p>
          <p className="text-xs text-gray-400 truncate">{student.email}</p>
          {student.studentData?.notes && (
            <p className="text-xs text-purple-400 truncate italic">{student.studentData.notes}</p>
          )}
        </div>

        {/* Level */}
        <div className="flex-shrink-0 w-20">
          {level ? (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${LEVEL_COLORS[level]}`}>
              {level}
            </span>
          ) : (
            <span className="text-xs text-gray-300">—</span>
          )}
        </div>

        {/* Schedule chips */}
        <div className="flex-1 flex flex-wrap gap-1.5 min-w-0">
          {sortedSlots.length > 0 ? (
            sortedSlots.map((s, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-[#F0E5FF] text-[#5A3D7A] text-xs font-semibold rounded-full whitespace-nowrap"
              >
                {formatSlot(s)}
              </span>
            ))
          ) : unlinkedSlots.length > 0 ? (
            <>
              {unlinkedSlots
                .slice()
                .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.hour - b.hour)
                .map((s, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-amber-100 text-amber-600 text-xs font-semibold rounded-full whitespace-nowrap"
                  >
                    {formatSlot(s)}
                  </span>
                ))}
              <span className="px-2 py-0.5 bg-amber-50 text-amber-500 text-xs rounded-full border border-amber-200 whitespace-nowrap">
                ⚠ Sin vincular
              </span>
            </>
          ) : (
            <span className="text-xs text-gray-300 italic">Sin horario</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-shrink-0">
          {student.phone && (
            <a
              href={toWhatsAppUrl(student.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-[#E7F8EE] hover:bg-[#C8F0D8] text-[#25D366] rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              title={`WhatsApp: ${student.phone}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          )}
          <button
            onClick={() => setShowEdit(true)}
            className="px-3 py-1.5 bg-[#F0E5FF] hover:bg-[#E0D0F5] text-[#5A3D7A] rounded-xl text-xs font-bold transition-colors"
            title="Editar estudiante"
          >
            Editar
          </button>
          <button
            onClick={() => setShowDetail(true)}
            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold transition-colors"
            title="Ver análisis"
          >
            Análisis
          </button>
        </div>
      </div>

      {showEdit && (
        <EditStudentModal
          student={student}
          teacherId={teacherId}
          scheduleSlots={scheduleSlots}
          unlinkedSlots={unlinkedSlots}
          onClose={() => setShowEdit(false)}
        />
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
  const teacherId   = profile?.uid ?? '';
  const teacherName = profile?.fullName ?? 'Tu profesor';

  const { students, pendingStudents, loading, error } = useStudents();
  const { requests: bookingRequests, approveRequest, rejectRequest } = useBookingRequests();
  const { byStudentId, byStudentName } = useRecurringBookings(teacherId);

  const [search, setSearch] = useState('');

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.phone ?? '').includes(q),
    );
  }, [students, search]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFCF7] p-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 space-y-2">
            <div className="animate-pulse bg-gray-200 rounded-xl h-8 w-48" />
            <div className="animate-pulse bg-gray-200 rounded-xl h-4 w-32" />
          </div>
          <StudentsListSkeleton count={8} />
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-[#FFFCF7] p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center max-w-md">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="text-red-600 font-semibold mb-2">Error al cargar</p>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#C8A8DC] text-white rounded-xl text-sm font-bold"
          >
            Recargar página
          </button>
        </div>
      </div>
    );
  }

  const totalWeeklyHours = Object.values(byStudentId)
    .reduce((sum, slots) => sum + slots.length, 0);

  return (
    <div className="min-h-screen bg-[#FFFCF7] p-6">
      <TopBar
        title="Estudiantes"
        subtitle={`${students.length} aprobado${students.length !== 1 ? 's' : ''} · ${pendingStudents.length} pendiente${pendingStudents.length !== 1 ? 's' : ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Estudiantes' },
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

      {/* Stats bar */}
      <div className="max-w-5xl mx-auto mb-6 grid grid-cols-3 gap-3">
        {[
          { label: 'Aprobados', value: students.length, color: 'text-green-600' },
          { label: 'Pendientes', value: pendingStudents.length, color: 'text-amber-600' },
          { label: 'Clases/semana', value: totalWeeklyHours, color: 'text-[#5A3D7A]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── Booking requests from /book ──────────────────────────── */}
        {bookingRequests.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-[#5A3D7A] uppercase tracking-wider mb-3">
              Solicitudes de reserva online ({bookingRequests.length})
            </h2>
            <div className="space-y-3">
              {bookingRequests.map((req) => (
                <div key={req.id} className="bg-white rounded-2xl border border-blue-100 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 text-sm">{req.studentName}</p>
                      <p className="text-xs text-gray-400">{req.studentEmail}</p>
                      {req.studentPhone && <p className="text-xs text-gray-400">📱 {req.studentPhone}</p>}
                      <p className="text-xs text-blue-600 font-semibold mt-1">
                        {DAY_FULL[req.requestedDow]} · {req.requestedHour}:00
                        {req.isRecurring ? ' · Recurrente' : ''}
                      </p>
                      {req.currentLevel && <p className="text-xs text-gray-400">Nivel: {req.currentLevel}</p>}
                      {req.message && (
                        <p className="text-xs text-gray-500 italic mt-1">&ldquo;{req.message}&rdquo;</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => approveRequest(req.id)}
                        className="py-1.5 px-3 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl text-xs font-bold transition-colors"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => rejectRequest(req.id)}
                        className="py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition-colors"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Pending students ─────────────────────────────────────── */}
        {pendingStudents.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-[#5A3D7A] uppercase tracking-wider mb-3">
              Solicitudes pendientes ({pendingStudents.length})
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pendingStudents.map((s) => (
                <PendingCard
                  key={s.uid}
                  student={s}
                  teacherId={teacherId}
                  teacherName={teacherName}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Approved students list ───────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3 gap-3">
            <h2 className="text-sm font-bold text-[#5A3D7A] uppercase tracking-wider flex-shrink-0">
              Estudiantes aprobados ({filteredStudents.length})
            </h2>
            {students.length > 0 && (
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, email o teléfono…"
                className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#9B7CB8] w-full max-w-xs"
              />
            )}
          </div>

          {students.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
              <p className="text-4xl mb-3">👥</p>
              <p className="text-gray-500 text-sm">No hay estudiantes aprobados aún.</p>
              {pendingStudents.length === 0 && bookingRequests.length === 0 ? (
                <p className="text-xs text-gray-400 mt-2 max-w-xs mx-auto leading-relaxed">
                  Comparte el enlace de <strong>/book</strong> o pide a tus estudiantes que se registren en la app. Aparecerán aquí en cuanto soliciten acceso.
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-1">
                  Aprueba las solicitudes pendientes para que aparezcan aquí.
                </p>
              )}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <p className="text-gray-400 text-sm">No hay coincidencias para &ldquo;{search}&rdquo;</p>
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div className="hidden md:grid grid-cols-[40px_160px_80px_1fr_auto] gap-3 px-4 mb-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <span />
                <span>Estudiante</span>
                <span>Nivel</span>
                <span>Horario recurrente</span>
                <span className="text-right">Acciones</span>
              </div>

              <div className="space-y-2">
                {filteredStudents.map((s) => (
                  <StudentRow
                    key={s.uid}
                    student={s}
                    teacherId={teacherId}
                    scheduleSlots={byStudentId[s.uid] ?? []}
                    unlinkedSlots={byStudentName[s.fullName] ?? []}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
