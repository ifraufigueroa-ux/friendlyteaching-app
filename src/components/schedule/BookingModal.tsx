// FriendlyTeaching.cl — BookingModal
'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useScheduleStore } from '@/store/scheduleStore';
import { createBooking } from '@/hooks/useBookings';
import { useStudents } from '@/hooks/useStudents';
import { useLessons } from '@/hooks/useLessons';
import { auth } from '@/lib/firebase/config';
import type { FTUser, Lesson } from '@/types/firebase';

const DAY_NAMES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7–21
const MINUTES = [0, 15, 30, 45];

interface Props {
  onCreated?: () => void;
}

function pad(n: number) { return String(n).padStart(2, '0'); }

export default function BookingModal({ onCreated }: Props) {
  const { profile } = useAuthStore();
  const { slotAction, closeSlotAction, closeBookingModal, currentWeekStart } = useScheduleStore();
  const { students } = useStudents();
  const { lessons } = useLessons(profile?.uid ?? '', 'teacher');

  const [mode, setMode] = useState<'registered' | 'manual'>('registered');
  const [selectedStudent, setSelectedStudent] = useState<FTUser | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [bookingType, setBookingType] = useState<'class' | 'interview'>('class');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Time picker — pre-filled from the clicked slot, but fully editable
  const [selectedHour, setSelectedHour] = useState<number>(slotAction.hour ?? 10);
  const [selectedMinute, setSelectedMinute] = useState<number>(slotAction.minute ?? 0);

  // Lesson assignment (optional)
  const [showLessonPicker, setShowLessonPicker] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [lessonSearch, setLessonSearch] = useState('');

  if (!slotAction.isOpen || slotAction.day === null || slotAction.hour === null) return null;

  const dayName = DAY_NAMES[slotAction.day];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (slotAction.day === null) return;

    const teacherUid = profile?.uid ?? auth.currentUser?.uid ?? '';
    if (!teacherUid) { setError('No se pudo identificar al profesor. Intenta recargar.'); return; }

    const finalName = mode === 'registered' ? (selectedStudent?.fullName ?? '') : studentName.trim();
    const finalEmail = mode === 'registered' ? (selectedStudent?.email ?? '') : studentEmail.trim();
    const finalStudentId = mode === 'registered' ? (selectedStudent?.uid ?? undefined) : undefined;

    if (!finalName) { setError(mode === 'registered' ? 'Selecciona un estudiante' : 'El nombre es requerido'); return; }

    setLoading(true);
    setError('');

    try {
      await createBooking(teacherUid, {
        studentName: finalName,
        studentEmail: finalEmail,
        studentId: finalStudentId,
        dayOfWeek: slotAction.day,
        hour: selectedHour,
        minute: selectedMinute,
        bookingType,
        weekStart: currentWeekStart,
        isRecurring,
        notes: notes.trim() || undefined,
        lessonId: selectedLessonId || undefined,
      });
      setStudentName('');
      setStudentEmail('');
      setSelectedStudent(null);
      setIsRecurring(false);
      setNotes('');
      setSelectedLessonId('');
      setLessonSearch('');
      setShowLessonPicker(false);
      onCreated?.();
      // Wait for onSnapshot to deliver updated data before closing
      await useScheduleStore.getState().waitForDataRefresh();
      closeBookingModal();
      closeSlotAction();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear booking');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) { closeBookingModal(); closeSlotAction(); } }}
    >
      <div className="glass-strong rounded-2xl shadow-glass-xl w-full max-w-md p-6 animate-[slideInUp_0.2s_ease] max-h-[90vh] overflow-y-auto border border-white/40">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#5A3D7A]">Registrar Clase</h2>
            <p className="text-sm text-gray-400">
              {dayName} — {currentWeekStart.toLocaleDateString('es-CL')}
            </p>
          </div>
          <button
            onClick={closeSlotAction}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── Time picker ── */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1.5">Hora de inicio</p>
            <div className="flex gap-2 items-center">
              {/* Hour scroll */}
              <div className="flex-1">
                <p className="text-[11px] text-gray-400 mb-1 text-center">Hora</p>
                <div className="grid grid-cols-5 gap-1 max-h-28 overflow-y-auto">
                  {HOURS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setSelectedHour(h)}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        selectedHour === h
                          ? 'bg-[#5A3D7A] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-[#F0E5FF]'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {/* Separator */}
              <span className="text-2xl font-bold text-gray-300 mt-4">:</span>

              {/* Minute buttons */}
              <div className="w-24">
                <p className="text-[11px] text-gray-400 mb-1 text-center">Minutos</p>
                <div className="grid grid-cols-2 gap-1">
                  {MINUTES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedMinute(m)}
                      className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                        selectedMinute === m
                          ? 'bg-[#5A3D7A] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-[#F0E5FF]'
                      }`}
                    >
                      {pad(m)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live preview */}
            <div className="mt-2 text-center">
              <span className="inline-block bg-[#F0E5FF] text-[#5A3D7A] font-bold px-4 py-1.5 rounded-xl text-sm">
                {dayName} {selectedHour}:{pad(selectedMinute)}
              </span>
            </div>
          </div>

          {/* ── Booking type ── */}
          <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
            <button
              type="button"
              onClick={() => setBookingType('class')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${bookingType === 'class' ? 'bg-white text-[#5A3D7A] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              📚 Clase
            </button>
            <button
              type="button"
              onClick={() => setBookingType('interview')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${bookingType === 'interview' ? 'bg-[#FFB347] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              🎙 Entrevista
            </button>
          </div>

          {/* ── Student mode toggle ── */}
          <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
            <button
              type="button"
              onClick={() => { setMode('registered'); setSelectedStudent(null); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${mode === 'registered' ? 'bg-white text-[#5A3D7A] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              👥 Estudiante registrado
            </button>
            <button
              type="button"
              onClick={() => { setMode('manual'); setSelectedStudent(null); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${mode === 'manual' ? 'bg-white text-[#5A3D7A] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              ✏️ Nuevo / externo
            </button>
          </div>

          {mode === 'registered' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seleccionar estudiante <span className="text-red-400">*</span>
              </label>
              <div className="space-y-1 max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-2">
                {students.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-3">No hay estudiantes aprobados</p>
                ) : students.map((s: FTUser) => (
                  <button
                    key={s.uid}
                    type="button"
                    onClick={() => setSelectedStudent(s)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedStudent?.uid === s.uid ? 'bg-[#C8A8DC] text-white' : 'hover:bg-gray-50 text-gray-700'}`}
                  >
                    <span className="font-semibold">{s.fullName}</span>
                    {s.studentData?.level && (
                      <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${selectedStudent?.uid === s.uid ? 'bg-white/30 text-white' : 'bg-[#F0E5FF] text-[#5A3D7A]'}`}>
                        {s.studentData.level}
                      </span>
                    )}
                    <span className={`block text-xs ${selectedStudent?.uid === s.uid ? 'text-white/70' : 'text-gray-400'}`}>{s.email}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Ej. María González"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] focus:border-transparent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (opcional)</label>
                <input
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="estudiante@email.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] focus:border-transparent"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nivel, preferencias, etc."
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] focus:border-transparent resize-none"
            />
          </div>

          {/* Optional lesson assignment */}
          <div>
            {!showLessonPicker ? (
              <button
                type="button"
                onClick={() => setShowLessonPicker(true)}
                className="w-full flex items-center justify-between px-3 py-2.5 border border-dashed border-[#C8A8DC] text-[#9B7CB8] rounded-xl text-sm font-medium hover:bg-[#F9F5FF] transition-colors"
              >
                <span>
                  {selectedLessonId
                    ? (() => { const l = lessons.find((x: Lesson) => x.id === selectedLessonId); return `📚 ${l?.code ?? ''} · ${l?.title ?? ''}`; })()
                    : '📚 Asignar lección (opcional)'}
                </span>
                <span className="text-xs opacity-60">{selectedLessonId ? '✏️' : '+'}</span>
              </button>
            ) : (
              <div className="border border-[#C8A8DC] rounded-xl p-3 space-y-2 bg-[#F9F5FF]">
                <p className="text-xs font-semibold text-[#5A3D7A]">Seleccionar lección</p>
                <input
                  type="text"
                  value={lessonSearch}
                  onChange={e => setLessonSearch(e.target.value)}
                  placeholder="Buscar por código o título..."
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
                  autoFocus
                />
                <div className="max-h-36 overflow-y-auto space-y-1">
                  <button
                    type="button"
                    onClick={() => { setSelectedLessonId(''); setShowLessonPicker(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${!selectedLessonId ? 'bg-[#C8A8DC] text-white' : 'hover:bg-gray-100 text-gray-500'}`}
                  >
                    — Sin lección asignada
                  </button>
                  {lessons
                    .filter((l: Lesson) =>
                      !lessonSearch ||
                      l.title.toLowerCase().includes(lessonSearch.toLowerCase()) ||
                      (l.code ?? '').toLowerCase().includes(lessonSearch.toLowerCase())
                    )
                    .map((l: Lesson) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => { setSelectedLessonId(l.id); setShowLessonPicker(false); setLessonSearch(''); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${selectedLessonId === l.id ? 'bg-[#C8A8DC] text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                      >
                        <span className="font-mono font-bold">{l.code}</span>
                        <span className="ml-1">{l.title}</span>
                        {l.level && <span className="ml-1 opacity-60">[{l.level}]</span>}
                      </button>
                    ))}
                </div>
                <button type="button" onClick={() => setShowLessonPicker(false)} className="text-xs text-gray-400 hover:text-gray-600 w-full text-center pt-1">
                  Cerrar
                </button>
              </div>
            )}
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 rounded accent-[#C8A8DC]"
            />
            <span className="text-sm text-gray-700">
              Clase recurrente <span className="text-gray-400">(se repite cada semana)</span>
            </span>
          </label>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={closeSlotAction}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-2.5 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                bookingType === 'interview'
                  ? 'bg-[#FFB347] hover:bg-[#FF9F1C]'
                  : 'bg-[#C8A8DC] hover:bg-[#9B7CB8]'
              }`}
            >
              {loading ? 'Guardando...' : bookingType === 'interview' ? '🎙 Confirmar Entrevista' : '✓ Confirmar Clase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
