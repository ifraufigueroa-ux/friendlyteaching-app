// FriendlyTeaching.cl — SlotActionModal
'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useScheduleStore } from '@/store/scheduleStore';
import {
  cancelBooking, completeBooking, updateBooking,
  cancelFutureRecurringBookings, createBooking, deleteBooking,
} from '@/hooks/useBookings';
import { blockSlot, unblockSlot } from '@/hooks/useSchedule';
import { useLessons } from '@/hooks/useLessons';
import { useStudents } from '@/hooks/useStudents';
import { auth } from '@/lib/firebase/config';
import type { Lesson } from '@/types/firebase';

const DAY_NAMES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7–21

type SubPanel = 'none' | 'rename' | 'move' | 'lesson' | 'student' | 'cancel' | 'complete';

export default function SlotActionModal() {
  const { profile } = useAuthStore();
  const { slotAction, closeSlotAction, openBookingModal, currentWeekStart } = useScheduleStore();
  const [loading, setLoading] = useState(false);
  const [subPanel, setSubPanel] = useState<SubPanel>('none');
  // Cache the resolved ID for fallback bookings so we don't create duplicates
  const [resolvedId, setResolvedId] = useState<string | null>(null);

  // Rename
  const [newName, setNewName] = useState('');

  // Move
  const [moveDow, setMoveDow] = useState<number>(1);
  const [moveHour, setMoveHour] = useState<number>(10);
  const [moveMinute, setMoveMinute] = useState<number>(0);

  // Cancel
  const [cancelReason, setCancelReason] = useState('');

  // Assign lesson
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [lessonSearch, setLessonSearch] = useState('');

  // Link student
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Complete
  const [completeAttendance, setCompleteAttendance] = useState<'attended' | 'absent' | 'late' | ''>('');
  const [completeNotes, setCompleteNotes] = useState('');

  const { lessons } = useLessons(profile?.uid ?? '', 'teacher');
  const { students } = useStudents();

  useEffect(() => {
    if (slotAction.isOpen) {
      setSubPanel('none');
      setLoading(false);          // Always reset loading when opening
      setResolvedId(null);        // Reset cached fallback ID
      setCancelReason('');
      setNewName(slotAction.booking?.studentName ?? '');
      setMoveDow(slotAction.day ?? 1);
      setMoveHour(slotAction.hour ?? 10);
      setMoveMinute(slotAction.minute ?? 0);
      setSelectedLessonId(slotAction.booking?.lessonId ?? '');
      setSelectedStudentId(slotAction.booking?.studentId ?? '');
      setLessonSearch('');
      setCompleteAttendance('');
      setCompleteNotes('');
    }
  }, [slotAction.isOpen, slotAction.booking?.lessonId, slotAction.booking?.studentId,
      slotAction.booking?.studentName, slotAction.day, slotAction.hour]);

  if (!slotAction.isOpen || slotAction.day === null || slotAction.hour === null) return null;

  const { day, hour, minute: slotMinute, slotType, booking } = slotAction;
  const minute = slotMinute ?? 0;
  const dayName = DAY_NAMES[day];

  const teacherUid = profile?.uid ?? auth.currentUser?.uid ?? '';
  const isFallbackBooking = booking?.id?.startsWith('local-') ?? false;

  async function resolveId(): Promise<string | null> {
    if (!booking) return null;
    if (!isFallbackBooking) return booking.id;
    if (!teacherUid) return null;
    // Return cached ID if we already resolved this fallback booking
    if (resolvedId) return resolvedId;
    const id = await createBooking(teacherUid, {
      studentName: booking.studentName,
      dayOfWeek: booking.dayOfWeek,
      hour: booking.hour,
      minute: booking.minute ?? 0,
      weekStart: currentWeekStart,     // Use the viewed week, not today's week
      isRecurring: booking.isRecurring,
    });
    setResolvedId(id);
    return id;
  }

  const filteredLessons = lessons.filter((l: Lesson) =>
    lessonSearch === '' ||
    l.title.toLowerCase().includes(lessonSearch.toLowerCase()) ||
    (l.code ?? '').toLowerCase().includes(lessonSearch.toLowerCase())
  );

  const assignedLesson = booking?.lessonId
    ? lessons.find((l: Lesson) => l.id === booking.lessonId)
    : null;
  const linkedStudent = booking?.studentId
    ? students.find((s) => s.uid === booking.studentId)
    : null;

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleBlock() {
    if (!teacherUid) return;
    setLoading(true);
    try { await blockSlot(teacherUid, day, hour); await useScheduleStore.getState().waitForDataRefresh(); closeSlotAction(); }
    finally { setLoading(false); }
  }

  async function handleUnblock() {
    if (!teacherUid) return;
    setLoading(true);
    try { await unblockSlot(teacherUid, day, hour); await useScheduleStore.getState().waitForDataRefresh(); closeSlotAction(); }
    finally { setLoading(false); }
  }

  async function handleRename() {
    const trimmed = newName.trim();
    if (!trimmed || !booking) return;
    setLoading(true);
    try {
      const id = await resolveId();
      if (!id) return;
      await updateBooking(id, { studentName: trimmed });
      await useScheduleStore.getState().waitForDataRefresh();
      closeSlotAction();
    } finally { setLoading(false); }
  }

  async function handleMove() {
    if (!booking || !teacherUid) return;
    setLoading(true);
    try {
      if (booking.isRecurring) {
        // Cancel all future occurrences at old slot, then recreate at new slot
        const fromWeek = booking.weekStart
          ? (typeof (booking.weekStart as { toDate?: () => Date }).toDate === 'function'
              ? (booking.weekStart as { toDate: () => Date }).toDate()
              : new Date((booking.weekStart as { seconds: number }).seconds * 1000))
          : currentWeekStart;
        await cancelFutureRecurringBookings(
          teacherUid, booking.dayOfWeek, booking.hour,
          booking.studentName, fromWeek, 'Clase movida', booking.minute ?? 0
        );
        await createBooking(teacherUid, {
          studentName: booking.studentName,
          studentEmail: booking.studentEmail ?? '',
          studentId: booking.studentId ?? undefined,
          dayOfWeek: moveDow,
          hour: moveHour,
          minute: moveMinute,
          bookingType: booking.bookingType ?? 'class',
          weekStart: fromWeek,
          isRecurring: true,
          notes: booking.notes ?? undefined,
          lessonId: booking.lessonId ?? undefined,
        });
      } else {
        const id = await resolveId();
        if (!id) return;
        await updateBooking(id, { dayOfWeek: moveDow, hour: moveHour, minute: moveMinute });
      }
      await useScheduleStore.getState().waitForDataRefresh(); closeSlotAction();
    } finally { setLoading(false); }
  }

  async function handleCancel(cancelAll = false) {
    if (!booking || !teacherUid) return;
    setLoading(true);
    try {
      if (cancelAll && booking.isRecurring) {
        const weekStart = booking.weekStart
          ? (typeof (booking.weekStart as { toDate?: () => Date }).toDate === 'function'
              ? (booking.weekStart as { toDate: () => Date }).toDate()
              : new Date((booking.weekStart as { seconds: number }).seconds * 1000))
          : currentWeekStart;
        await cancelFutureRecurringBookings(
          teacherUid, booking.dayOfWeek, booking.hour,
          booking.studentName, weekStart, cancelReason || undefined, booking.minute ?? 0
        );
      } else if (!booking.isRecurring && !isFallbackBooking) {
        // Hard-delete non-recurring one-time bookings
        await deleteBooking(booking.id);
      } else {
        const id = await resolveId();
        if (!id) return;
        await cancelBooking(id, cancelReason || undefined);
      }
      await useScheduleStore.getState().waitForDataRefresh(); closeSlotAction();
    } finally {
      setLoading(false);
      setCancelReason('');
    }
  }

  async function handleComplete() {
    if (!booking) return;
    setLoading(true);
    try {
      const id = await resolveId();
      if (!id) return;
      await completeBooking(id, {
        attendance: completeAttendance || undefined,
        sessionNotes: completeNotes.trim() || undefined,
      });
      await useScheduleStore.getState().waitForDataRefresh(); closeSlotAction();
    } finally { setLoading(false); }
  }

  async function handleAssignLesson() {
    if (!booking) return;
    setLoading(true);
    try {
      const id = await resolveId();
      if (!id) return;
      await updateBooking(id, { lessonId: selectedLessonId || null });
      await useScheduleStore.getState().waitForDataRefresh(); closeSlotAction();
    } finally { setLoading(false); }
  }

  async function handleLinkStudent() {
    if (!booking) return;
    setLoading(true);
    try {
      const id = await resolveId();
      if (!id) return;
      await updateBooking(id, { studentId: selectedStudentId || null });
      await useScheduleStore.getState().waitForDataRefresh(); closeSlotAction();
    } finally { setLoading(false); }
  }

  // ── Sub-panels ────────────────────────────────────────────────────────────

  const RenamePanel = (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-600">Nuevo nombre del estudiante:</p>
      <input
        type="text"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleRename()}
        placeholder="Nombre completo"
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
        autoFocus
      />
      <div className="flex gap-2">
        <button onClick={() => setSubPanel('none')} className="flex-1 px-3 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold">Volver</button>
        <button onClick={handleRename} disabled={loading || !newName.trim()} className="flex-1 px-3 py-2.5 bg-[#C8A8DC] text-white rounded-xl text-sm font-semibold disabled:opacity-50">
          {loading ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  );

  const MovePanel = (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-600">Nuevo día:</p>
      <div className="grid grid-cols-6 gap-1">
        {[1, 2, 3, 4, 5, 6].map((d) => (
          <button
            key={d}
            onClick={() => setMoveDow(d)}
            className={`py-1.5 rounded-lg text-xs font-semibold transition-colors ${moveDow === d ? 'bg-[#5A3D7A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-[#F0E5FF]'}`}
          >
            {DAY_NAMES[d].slice(0, 3)}
          </button>
        ))}
      </div>

      <p className="text-xs font-semibold text-gray-600">Nueva hora:</p>
      <div className="flex gap-2 items-start">
        <div className="flex-1 grid grid-cols-5 gap-1 max-h-36 overflow-y-auto">
          {HOURS.map((h) => (
            <button
              key={h}
              onClick={() => setMoveHour(h)}
              className={`py-1.5 rounded-lg text-xs font-semibold transition-colors ${moveHour === h ? 'bg-[#5A3D7A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-[#F0E5FF]'}`}
            >
              {h}
            </button>
          ))}
        </div>
        <div className="w-16 grid grid-cols-2 gap-1">
          {[0, 15, 30, 45].map((m) => (
            <button
              key={m}
              onClick={() => setMoveMinute(m)}
              className={`py-1.5 rounded-lg text-xs font-bold transition-colors ${moveMinute === m ? 'bg-[#5A3D7A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-[#F0E5FF]'}`}
            >
              :{String(m).padStart(2,'0')}
            </button>
          ))}
        </div>
      </div>

      <div className="text-center">
        <span className="inline-block bg-[#F0E5FF] text-[#5A3D7A] font-bold px-3 py-1 rounded-lg text-xs">
          {DAY_NAMES[moveDow]} {moveHour}:{String(moveMinute).padStart(2,'0')}
        </span>
      </div>

      {booking?.isRecurring && (
        <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
          ↻ Clase recurrente — se moverán todas las futuras desde hoy
        </p>
      )}

      <div className="flex gap-2">
        <button onClick={() => setSubPanel('none')} className="flex-1 px-3 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold">Volver</button>
        <button
          onClick={handleMove}
          disabled={loading || (moveDow === day && moveHour === hour && moveMinute === minute)}
          className="flex-1 px-3 py-2.5 bg-[#C8A8DC] text-white rounded-xl text-sm font-semibold disabled:opacity-50"
        >
          {loading ? 'Moviendo…' : '↕ Mover'}
        </button>
      </div>
    </div>
  );

  const LessonPanel = (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-600">Seleccionar lección:</p>
      <input
        type="text"
        value={lessonSearch}
        onChange={(e) => setLessonSearch(e.target.value)}
        placeholder="Buscar por código o título…"
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
        autoFocus
      />
      <div className="max-h-40 overflow-y-auto space-y-1">
        <button
          onClick={() => setSelectedLessonId('')}
          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${selectedLessonId === '' ? 'bg-[#C8A8DC] text-white' : 'hover:bg-gray-100 text-gray-600'}`}
        >
          — Sin lección asignada
        </button>
        {filteredLessons.map((l: Lesson) => (
          <button
            key={l.id}
            onClick={() => setSelectedLessonId(l.id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${selectedLessonId === l.id ? 'bg-[#C8A8DC] text-white' : 'hover:bg-gray-100 text-gray-700'}`}
          >
            <span className="font-mono font-bold">{l.code}</span>
            <span className="ml-1">{l.title}</span>
            {l.level && <span className="ml-1 opacity-60">[{l.level}]</span>}
          </button>
        ))}
        {filteredLessons.length === 0 && <p className="text-center text-xs text-gray-400 py-2">Sin resultados</p>}
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={() => setSubPanel('none')} className="flex-1 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold">Volver</button>
        <button onClick={handleAssignLesson} disabled={loading} className="flex-1 px-3 py-2 bg-[#C8A8DC] text-white rounded-lg text-xs font-semibold disabled:opacity-50">
          {loading ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  );

  const StudentPanel = (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-600">Vincular a estudiante registrado:</p>
      <div className="max-h-40 overflow-y-auto space-y-1">
        <button
          onClick={() => setSelectedStudentId('')}
          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${selectedStudentId === '' ? 'bg-[#C8A8DC] text-white' : 'hover:bg-gray-100 text-gray-600'}`}
        >
          — Sin vincular
        </button>
        {students.map((s) => (
          <button
            key={s.uid}
            onClick={() => setSelectedStudentId(s.uid)}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${selectedStudentId === s.uid ? 'bg-[#C8A8DC] text-white' : 'hover:bg-gray-100 text-gray-700'}`}
          >
            <span className="font-semibold">{s.fullName}</span>
            {s.studentData?.level && <span className="ml-1 opacity-70">[{s.studentData.level}]</span>}
          </button>
        ))}
        {students.length === 0 && <p className="text-center text-xs text-gray-400 py-2">No hay estudiantes aprobados</p>}
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={() => setSubPanel('none')} className="flex-1 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold">Volver</button>
        <button onClick={handleLinkStudent} disabled={loading} className="flex-1 px-3 py-2 bg-[#C8A8DC] text-white rounded-lg text-xs font-semibold disabled:opacity-50">
          {loading ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  );

  const CancelPanel = (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">Motivo (opcional):</p>
      <input
        type="text"
        value={cancelReason}
        onChange={(e) => setCancelReason(e.target.value)}
        placeholder="Ej. Estudiante no asistió"
        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
        autoFocus
      />
      {booking?.isRecurring && (
        <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
          ↻ Clase recurrente — puedes cancelar solo esta o todas las futuras
        </p>
      )}
      <div className="flex gap-2">
        <button onClick={() => setSubPanel('none')} className="flex-1 px-3 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold">Volver</button>
        <button onClick={() => handleCancel(false)} disabled={loading} className="flex-1 px-3 py-2.5 bg-red-400 hover:bg-red-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50">
          {loading ? '…' : booking?.isRecurring ? 'Solo esta' : 'Eliminar'}
        </button>
      </div>
      {booking?.isRecurring && (
        <button onClick={() => handleCancel(true)} disabled={loading} className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50">
          Cancelar todas las futuras ↻
        </button>
      )}
    </div>
  );

  const CompletePanel = (
    <div className="space-y-3">
      <p className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider">Reporte de clase</p>
      <div>
        <p className="text-xs text-gray-500 mb-1.5">Asistencia</p>
        <div className="grid grid-cols-3 gap-1.5">
          {([
            { val: 'attended', label: '✅ Asistió', active: 'bg-green-400 text-white', inactive: 'border border-green-200 text-green-700 hover:bg-green-50' },
            { val: 'late',     label: '⏰ Tarde',   active: 'bg-amber-400 text-white', inactive: 'border border-amber-200 text-amber-700 hover:bg-amber-50' },
            { val: 'absent',   label: '❌ Faltó',   active: 'bg-red-400 text-white',   inactive: 'border border-red-200 text-red-600 hover:bg-red-50' },
          ] as const).map(({ val, label, active, inactive }) => (
            <button
              key={val}
              onClick={() => setCompleteAttendance(completeAttendance === val ? '' : val)}
              className={`py-2 rounded-xl text-xs font-semibold transition-colors ${completeAttendance === val ? active : inactive}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-1.5">Notas de clase (opcional)</p>
        <textarea
          value={completeNotes}
          onChange={(e) => setCompleteNotes(e.target.value)}
          rows={3}
          placeholder="Ej: Trabajamos present perfect. Estudiante mejoró en…"
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs resize-none focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
        />
      </div>
      <div className="flex gap-2">
        <button onClick={() => setSubPanel('none')} className="flex-1 px-3 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold">Volver</button>
        <button onClick={handleComplete} disabled={loading} className="flex-1 px-3 py-2.5 bg-[#A8E6A1] hover:bg-[#8DD67E] text-[#2D6E2A] rounded-xl text-sm font-semibold disabled:opacity-50">
          {loading ? 'Guardando…' : '✓ Confirmar'}
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && closeSlotAction()}
    >
      <div className="glass-strong rounded-2xl shadow-glass-xl w-full max-w-sm p-6 animate-[slideInUp_0.2s_ease] max-h-[90vh] overflow-y-auto relative border border-white/40">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#5A3D7A]">{dayName} {hour}:{String(minute).padStart(2,'0')}</h2>
            <p className="text-sm text-gray-400">Gestionar horario</p>
          </div>
          <button onClick={closeSlotAction} className="text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">×</button>
        </div>

        {/* AVAILABLE */}
        {slotType === 'available' && (
          <div className="space-y-3">
            <button onClick={() => openBookingModal()} className="w-full px-4 py-3 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-semibold transition-colors">
              ✏️ Registrar Estudiante
            </button>
            <button onClick={handleBlock} disabled={loading} className="w-full px-4 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 disabled:opacity-50">
              🚫 Bloquear Horario
            </button>
          </div>
        )}

        {/* BLOCKED */}
        {slotType === 'blocked' && (
          <div className="space-y-3">
            <p className="text-center text-sm text-gray-500">Este horario está bloqueado</p>
            <button onClick={handleUnblock} disabled={loading} className="w-full px-4 py-3 bg-[#A8E6A1] hover:bg-[#8DD67E] text-[#2D6E2A] rounded-xl text-sm font-semibold disabled:opacity-50">
              ✅ Desbloquear Horario
            </button>
            <button onClick={() => openBookingModal()} className="w-full px-4 py-3 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-semibold">
              ✏️ Registrar Estudiante
            </button>
          </div>
        )}

        {/* OCCUPIED */}
        {slotType === 'occupied' && booking && (
          <div className="space-y-3">
            {/* Student info card */}
            <div className="bg-[#F0E5FF] rounded-xl p-3 space-y-1">
              <p className="font-bold text-[#5A3D7A] text-sm">{booking.studentName}</p>
              <p className="text-xs text-[#9B7CB8]">
                {booking.isRecurring ? '↻ Recurrente' : '• Una vez'}
                {booking.notes && <span className="ml-2 text-gray-500">· {booking.notes}</span>}
              </p>
              {linkedStudent && (
                <p className="text-xs text-[#5A3D7A] flex items-center gap-1">
                  🔗 <strong>{linkedStudent.fullName}</strong>
                  {linkedStudent.studentData?.level && (
                    <span className="px-1.5 py-0.5 bg-[#C8A8DC] text-white rounded text-[10px]">{linkedStudent.studentData.level}</span>
                  )}
                </p>
              )}
              {assignedLesson && (
                <p className="text-xs text-[#2D6E2A]">
                  📚 <strong>{assignedLesson.code} · {assignedLesson.title}</strong>
                </p>
              )}
            </div>

            {/* Sub-panels */}
            {subPanel === 'rename'  && RenamePanel}
            {subPanel === 'move'    && MovePanel}
            {subPanel === 'lesson'  && LessonPanel}
            {subPanel === 'student' && StudentPanel}
            {subPanel === 'cancel'  && CancelPanel}
            {subPanel === 'complete' && CompletePanel}

            {/* Main actions grid (shown only when no sub-panel is open) */}
            {subPanel === 'none' && (
              <>
                {/* Completed badge */}
                {booking.status === 'completed' && (
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                    <span className="text-base">✅</span>
                    <div>
                      <p className="text-xs font-bold text-gray-600">Clase registrada</p>
                      {booking.attendance && (
                        <p className="text-[11px] text-gray-400">
                          {booking.attendance === 'attended' ? 'Asistió' : booking.attendance === 'absent' ? 'Faltó' : 'Llegó tarde'}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={async () => {
                        setLoading(true);
                        try {
                          await updateBooking(booking.id, {
                            status: 'confirmed',
                            attendance: null,
                            completedAt: null,
                          });
                          await useScheduleStore.getState().waitForDataRefresh(); closeSlotAction();
                        } finally { setLoading(false); }
                      }}
                      disabled={loading}
                      className="ml-auto text-xs text-[#9B7CB8] hover:text-[#5A3D7A] font-semibold underline disabled:opacity-50"
                    >
                      ↩ Reabrir
                    </button>
                  </div>
                )}

                {/* 2×2 secondary actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setSubPanel('rename')} className="px-3 py-2.5 bg-[#F0E5FF] hover:bg-[#E0CCFF] text-[#5A3D7A] rounded-xl text-xs font-semibold transition-colors">
                    ✏️ Renombrar
                  </button>
                  <button onClick={() => setSubPanel('move')} className="px-3 py-2.5 bg-[#F0E5FF] hover:bg-[#E0CCFF] text-[#5A3D7A] rounded-xl text-xs font-semibold transition-colors">
                    ↕ Mover
                  </button>
                  <button onClick={() => setSubPanel('lesson')} className="px-3 py-2.5 bg-[#F0F9FF] hover:bg-[#DDEEFF] text-[#1A6B9A] rounded-xl text-xs font-semibold transition-colors">
                    📚 {assignedLesson ? 'Cambiar lección' : 'Asignar lección'}
                  </button>
                  <button onClick={() => setSubPanel('student')} className="px-3 py-2.5 bg-[#F0F9FF] hover:bg-[#DDEEFF] text-[#1A6B9A] rounded-xl text-xs font-semibold transition-colors">
                    🔗 {linkedStudent ? 'Cambiar alumno' : 'Vincular alumno'}
                  </button>
                </div>

                {/* Primary action — only show if not already completed */}
                {booking.status !== 'completed' && (
                  <button onClick={() => setSubPanel('complete')} className="w-full px-4 py-3 bg-[#A8E6A1] hover:bg-[#8DD67E] text-[#2D6E2A] rounded-xl text-sm font-semibold transition-colors">
                    ✅ Marcar como Completada
                  </button>
                )}

                {/* Danger action */}
                <button onClick={() => setSubPanel('cancel')} className="w-full px-4 py-3 border border-red-200 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors">
                  {booking.isRecurring ? '✗ Cancelar / Eliminar clases' : '✗ Eliminar clase'}
                </button>
              </>
            )}
          </div>
        )}

        {/* PENDING */}
        {slotType === 'pending' && booking && (
          <div className="space-y-3">
            <div className="text-center py-2 bg-[#FFF5C8] rounded-xl">
              <p className="font-bold text-[#7A5E00]">{booking.studentName}</p>
              <p className="text-xs text-[#9A7800]">Solicitud pendiente</p>
            </div>
            <button
              disabled={loading}
              onClick={async () => {
                const { confirmBooking } = await import('@/hooks/useBookings');
                setLoading(true);
                try {
                  const id = await resolveId();
                  if (id) { await confirmBooking(id); await useScheduleStore.getState().waitForDataRefresh(); closeSlotAction(); }
                } finally { setLoading(false); }
              }}
              className="w-full px-4 py-3 bg-[#A8E6A1] hover:bg-[#8DD67E] text-[#2D6E2A] rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              ✅ Confirmar Clase
            </button>
            <button onClick={() => setSubPanel(subPanel === 'cancel' ? 'none' : 'cancel')} className="w-full px-4 py-3 border border-red-200 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-50">
              ✗ Rechazar
            </button>
            {subPanel === 'cancel' && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Motivo del rechazo (opcional)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                  autoFocus
                />
                <button onClick={() => handleCancel(false)} disabled={loading} className="w-full px-3 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                  {loading ? '…' : 'Confirmar Rechazo'}
                </button>
              </div>
            )}
          </div>
        )}
        {/* ── Loading overlay ── */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-3 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-[#9B7CB8] animate-pulse">Procesando…</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
