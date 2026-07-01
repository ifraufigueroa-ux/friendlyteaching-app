// FriendlyTeaching.cl — Teacher Dashboard Overview
'use client';
import { useMemo, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useStudents } from '@/hooks/useStudents';
import { useTeacherHomework } from '@/hooks/useHomework';
import { useAllProgress } from '@/hooks/useProgress';
import { useLessons } from '@/hooks/useLessons';
import { useBookings, completeBooking, updateBooking } from '@/hooks/useBookings';
import { useScheduleStore } from '@/store/scheduleStore';
import { useClassHistory, recordClassSession, saveClassNotes } from '@/hooks/useClassHistory';
import { ClassNotesModal } from '@/components/schedule/ClassNotesModal';
import HistoryModal from '@/components/schedule/HistoryModal';
import { auth } from '@/lib/firebase/config';
import TopBar from '@/components/layout/TopBar';
import SchedulingGrid from '@/components/schedule/SchedulingGrid';
import type { Booking } from '@/types/firebase';
import type { Timestamp } from 'firebase/firestore';
import {
  SCHEDULE_STUDENT_COUNT,
  getScheduleForDay,
  type ScheduleEntry,
} from '@/data/teacherSchedule';

function toDate(v: Timestamp | Date | undefined): Date | undefined {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  return v.toDate();
}

const DAY_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const LEVEL_COLORS: Record<string, string> = {
  A0: 'bg-teal-100 text-teal-700', A1: 'bg-green-100 text-green-700',
  A2: 'bg-emerald-100 text-emerald-700', B1: 'bg-yellow-100 text-yellow-700',
  'B1+': 'bg-orange-100 text-orange-700', B2: 'bg-red-100 text-red-700',
  C1: 'bg-purple-100 text-purple-700',
};

function StatCard({ icon, label, value, sub, color = '#C8A8DC', href }: {
  icon: string; label: string; value: number | string; sub?: string;
  color?: string; href?: string;
}) {
  const inner = (
    <div className="glass-card rounded-2xl p-4 stat-glow hover-lift flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-purple-sm" style={{ background: `${color}22` }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold text-gray-800 leading-none">{value}</p>
        <p className="text-xs font-semibold text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
  if (href) return <Link href={href} className="block">{inner}</Link>;
  return inner;
}

export default function TeacherDashboardPage() {
  const { profile } = useAuthStore();
  const { currentWeekStart } = useScheduleStore();
  const pendingClassNotes = useScheduleStore((s) => s.pendingClassNotes);
  const uid = profile?.uid ?? auth.currentUser?.uid ?? '';

  const [recordingKey, setRecordingKey]   = useState<string | null>(null);
  const [historyOpen, setHistoryOpen]     = useState(false);
  const [studentsOpen, setStudentsOpen]   = useState(false);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  // Carousel state for "Clases de hoy" card
  // dismissedSlots uses "dow-hour" keys so the same slot never reappears
  // even if Firestore returns a different booking document for the same slot.
  const [carouselIdx, setCarouselIdx]         = useState(0);
  const [carouselExiting, setCarouselExiting] = useState(false);

  // dismissedSlots persisted to sessionStorage keyed by today's date so a
  // page refresh within the same day doesn't reset the carousel.
  const todayKey = `dismissedSlots-${new Date().toLocaleDateString('en-CA')}`;
  const [dismissedSlots, setDismissedSlots] = useState<Set<string>>(() => {
    try {
      const raw = sessionStorage.getItem(todayKey);
      return raw ? new Set<string>(JSON.parse(raw) as string[]) : new Set<string>();
    } catch { return new Set<string>(); }
  });
  // Post-class notes modal state
  const [pendingNotesEntryId, setPendingNotesEntryId] = useState<string | null>(null);
  const [pendingNotesStudentName, setPendingNotesStudentName] = useState<string>('');

  // ── Hooks (must be declared before useEffects that reference them) ──────────
  const effectiveUid = uid || auth.currentUser?.uid || '';
  const { students } = useStudents();
  const { homework } = useTeacherHomework(uid);
  const { progress } = useAllProgress(uid);
  const { lessons } = useLessons(uid, 'teacher');
  const { bookings } = useBookings(uid, currentWeekStart);
  const { history: classHistory, loading: historyLoading } = useClassHistory(effectiveUid);

  // Sync dismissedSlots → sessionStorage (persist across refreshes, reset next day)
  useEffect(() => {
    try {
      sessionStorage.setItem(todayKey, JSON.stringify([...dismissedSlots]));
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const k = sessionStorage.key(i);
        if (k?.startsWith('dismissedSlots-') && k !== todayKey) sessionStorage.removeItem(k);
      }
    } catch { /* ignore */ }
  }, [dismissedSlots, todayKey]);

  // After classHistory loads: drop any sessionStorage-dismissed slot that Firestore
  // doesn't confirm as recorded today. This fixes the "Al día" false positive when
  // a previous session dismissed classes but Firestore writes failed (permissions).
  useEffect(() => {
    if (historyLoading) return;
    const todayStr = new Date().toLocaleDateString('en-CA');
    const confirmed = new Set<string>();
    for (const entry of classHistory) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = entry.date as any;
      const d: Date = typeof raw?.toDate === 'function' ? raw.toDate()
        : raw?.seconds ? new Date(raw.seconds * 1000) : new Date(raw);
      if (d.toLocaleDateString('en-CA') === todayStr) {
        const entryMin = (entry as { minute?: number }).minute ?? 0;
        confirmed.add(`${entry.dayOfWeek}-${entry.hour}-${entryMin}`);
      }
    }
    setDismissedSlots((prev) => {
      const next = new Set([...prev].filter((s) => confirmed.has(s)));
      return next.size !== prev.size ? next : prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyLoading]);

  // When SlotActionModal completes a class, it signals via pendingClassNotes in the store.
  // Pick it up here and open ClassNotesModal with the same format used for same-day classes.
  useEffect(() => {
    if (pendingClassNotes) {
      setPendingNotesEntryId(pendingClassNotes.entryId);
      setPendingNotesStudentName(pendingClassNotes.studentName);
      useScheduleStore.getState().setPendingClassNotes(null);
    }
  }, [pendingClassNotes]);

  // Helper: get calendar date for a given dow in the current week
  const getClassDate = useCallback((dow: number): Date => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + (dow - 1)); // weekStart is Monday (dow=1)
    return d;
  }, [currentWeekStart]);

  // Mark a class as attended or absent, dismiss from carousel, optionally open notes
  const handleRecord = useCallback(async (booking: Booking, attended: boolean) => {
    const tid = effectiveUid || auth.currentUser?.uid || '';
    if (!tid || recordingKey) return;

    const min = booking.minute ?? 0;
    const key = `${booking.dayOfWeek}-${booking.hour}-${min}`;
    setRecordingKey(key);
    setCarouselExiting(true);

    const slotKey = `${booking.dayOfWeek}-${booking.hour}-${min}`;
    try {
      // completeBooking updates the booking doc — may fail if Firestore rules
      // aren't deployed yet. Wrap independently so history always gets recorded.
      if (!booking.id.startsWith('local-')) {
        try {
          await completeBooking(booking.id, { attendance: attended ? 'attended' : 'absent' });
        } catch (e) {
          console.warn('[handleRecord] completeBooking failed (deploy rules?):', e);
        }
      }

      // recordClassSession writes to classHistory — this is the source of truth
      // for the carousel filter and the history drawer.
      const entryId = await recordClassSession({
        teacherId: tid,
        studentName: booking.studentName,
        dayOfWeek: booking.dayOfWeek,
        hour: booking.hour,
        minute: booking.minute ?? 0,
        date: getClassDate(booking.dayOfWeek),
        attended,
        isRecurring: booking.isRecurring,
        bookingId: booking.id,
      });
      if (attended) {
        setPendingNotesEntryId(entryId);
        setPendingNotesStudentName(booking.studentName);
      }
    } catch (err) {
      console.error('[handleRecord] error:', err);
    } finally {
      setRecordingKey(null);
      // Dismiss the slot (not just the booking ID) so Firestore re-renders
      // of the same slot don't make the same class reappear in the carousel.
      setTimeout(() => {
        setDismissedSlots((prev) => { const n = new Set(prev); n.add(slotKey); return n; });
        setCarouselIdx((prev) => Math.max(0, prev));
        setCarouselExiting(false);
      }, 280);
    }
  }, [effectiveUid, getClassDate, recordingKey]);

  // Reopen a completed booking so it reappears in the carousel for re-marking
  const [reopeningKey, setReopeningKey] = useState<string | null>(null);
  const handleReopen = useCallback(async (booking: Booking) => {
    if (booking.id.startsWith('local-') || reopeningKey) return;
    const key = `${booking.dayOfWeek}-${booking.hour}-${booking.minute ?? 0}`;
    setReopeningKey(key);
    try {
      await updateBooking(booking.id, {
        status: 'confirmed',
        attendance: null,
        completedAt: null,
      });
      // Remove from dismissedSlots so it shows in carousel immediately
      setDismissedSlots((prev) => {
        const n = new Set(prev);
        n.delete(key);
        return n;
      });
    } catch (e) {
      console.error('[handleReopen]', e);
    } finally {
      setReopeningKey(null);
    }
  }, [reopeningKey]);

  // ── Stats ───────────────────────────────────────────────
  const approvedStudents = students.filter((s) => s.status === 'approved').length;
  const pendingStudents = students.filter((s) => s.status === 'pending').length;
  const pendingHomework = homework.filter((h) => h.status === 'submitted').length;
  const publishedLessons = lessons.filter((l) => l.isPublished).length;

  // Whether Firestore has loaded real booking data
  const hasFirestoreBookings = bookings.length > 0;

  const today = new Date();
  const todayDow = today.getDay() === 0 ? 7 : today.getDay(); // 1=Mon…6=Sat

  // Shared dedup helper: picks one booking per hour slot for today,
  // choosing the doc whose weekStart is closest to the current calendar week.
  // statusFilter controls which statuses are included.
  const dedupeToday = useCallback((statusFilter: string[]): Booking[] => {
    const d = new Date();
    const dow = d.getDay();
    d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
    d.setHours(0, 0, 0, 0);
    const thisWeekMs = d.getTime();

    // Key by hour AND minute so 10:00 and 10:30 are distinct slots
    const slotMap = new Map<string, { booking: Booking; diff: number }>();
    for (const b of bookings) {
      if (b.dayOfWeek !== todayDow || !statusFilter.includes(b.status)) continue;
      const min = b.minute ?? 0;
      const slotId = `${b.hour}-${min}`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ws = b.weekStart as any;
      const wsMs: number = ws
        ? typeof ws.toDate === 'function'
          ? ws.toDate().getTime()
          : ws instanceof Date
            ? ws.getTime()
            : (ws.seconds ?? 0) * 1000
        : 0;
      const diff = Math.abs(wsMs - thisWeekMs);
      const prev = slotMap.get(slotId);
      if (!prev || diff < prev.diff) slotMap.set(slotId, { booking: b, diff });
    }
    return [...slotMap.values()]
      .map((e) => e.booking)
      .sort((a, b) => (a.hour * 60 + (a.minute ?? 0)) - (b.hour * 60 + (b.minute ?? 0)));
  }, [bookings, todayDow]);

  // Single canonical pass: pick ONE booking per slot (closest to current week),
  // considering ALL non-cancelled statuses. Both panels derive from this same set
  // so they always reference the same Firestore document per slot.
  const todayCanonicalBookings: Booking[] = useMemo(
    () => dedupeToday(['confirmed', 'completed', 'pending']),
    [dedupeToday],
  );

  // Carousel source — only confirmed slots from the canonical set
  const todayBookings: Booking[] = useMemo(
    () => todayCanonicalBookings.filter((b) => b.status === 'confirmed'),
    [todayCanonicalBookings],
  );

  // Right-panel source — full canonical set (shows all classes, marked or not)
  const todayAllBookings = todayCanonicalBookings;
  const todayScheduleFallback: ScheduleEntry[] = useMemo(
    () => hasFirestoreBookings ? [] : getScheduleForDay(todayDow),
    [hasFirestoreBookings, todayDow]
  );

  // Build the set of "dow-hour-minute" slots already recorded TODAY in classHistory.
  // This is the permanent filter: even after a page refresh, recorded classes
  // won't reappear in the carousel.
  const todayRecordedSlots = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-CA'); // "YYYY-MM-DD"
    const slots = new Set<string>();
    for (const entry of classHistory) {
      // Resolve Firestore Timestamp → Date
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = entry.date as any;
      const d: Date = typeof raw?.toDate === 'function'
        ? raw.toDate()
        : raw?.seconds
          ? new Date(raw.seconds * 1000)
          : new Date(raw);
      if (d.toLocaleDateString('en-CA') === todayStr) {
        // Include minute=0 fallback for history entries that don't store minute
        const entryMin = (entry as { minute?: number }).minute ?? 0;
        slots.add(`${entry.dayOfWeek}-${entry.hour}-${entryMin}`);
      }
    }
    return slots;
  }, [classHistory]);

  // Today's confirmed classes for the carousel.
  // A slot is hidden when:
  //   1. It's in dismissedSlots (transient — keeps UI snappy mid-session), OR
  //   2. It's in todayRecordedSlots (persistent — survives page refresh).
  const carouselClasses: Booking[] = useMemo(() =>
    todayBookings.filter((b) => {
      if (b.id.startsWith('local-')) return false;
      const key = `${b.dayOfWeek}-${b.hour}-${b.minute ?? 0}`;
      return !dismissedSlots.has(key) && !todayRecordedSlots.has(key);
    }),
    [todayBookings, dismissedSlots, todayRecordedSlots]
  );
  const carouselSafeIdx = Math.min(carouselIdx, Math.max(0, carouselClasses.length - 1));
  const carouselCurrent = carouselClasses[carouselSafeIdx];

  // Today-only stats: driven by the canonical booking set so all three panels
  // (carousel counter, right panel, grid) always reflect the same state.
  const todayCompletedCount = useMemo(
    () => todayCanonicalBookings.filter((b) => b.status === 'completed').length,
    [todayCanonicalBookings],
  );

  // Total = all canonical slots for today
  const todayTotalClasses = todayCanonicalBookings.length;

  // Active students — from Firestore or fallback count
  const studentsThisWeek = hasFirestoreBookings
    ? new Set(bookings.filter((b) => b.studentId).map((b) => b.studentId)).size
    : SCHEDULE_STUDENT_COUNT;

  // Active students stat card: prefer Firestore student count, fallback to schedule count
  const activeStudentCount = approvedStudents > 0 ? approvedStudents : SCHEDULE_STUDENT_COUNT;

  // Average score from progress
  const avgScore = useMemo(() => {
    const scored = progress.filter((p) => p.overallScore != null);
    if (!scored.length) return null;
    return (scored.reduce((s, p) => s + (p.overallScore ?? 0), 0) / scored.length).toFixed(1);
  }, [progress]);

  // Recent homework to review (submitted, not yet reviewed)
  const toReview = homework.filter((h) => h.status === 'submitted').slice(0, 3);

  const firstName = profile?.fullName?.split(' ')[0] ?? 'Profesor';

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Panel Principal"
        subtitle={`Hola, ${firstName} 👋 — ${today.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}`}
      />
      <div className="flex-1 p-6 overflow-auto space-y-6 bg-mesh">

        {/* ── Alert: pending students ─────────────────────────── */}
        {pendingStudents > 0 && (
          <Link href="/dashboard/teacher/students" className="block">
            <div className="bg-amber-50/80 backdrop-blur-sm border border-amber-200/60 rounded-2xl px-4 py-3 flex items-center gap-3 hover:bg-amber-100/80 transition-all shadow-glass hover-lift">
              <span className="text-2xl">⏳</span>
              <div>
                <p className="font-bold text-amber-800 text-sm">
                  {pendingStudents} estudiante{pendingStudents > 1 ? 's' : ''} esperando aprobación
                </p>
                <p className="text-xs text-amber-600">Haz clic para revisar y aprobar</p>
              </div>
              <span className="ml-auto text-amber-500 font-bold">→</span>
            </div>
          </Link>
        )}

        {/* ── Stats grid ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon="👥" label="Estudiantes activos" value={activeStudentCount} sub={pendingStudents > 0 ? `+${pendingStudents} pendiente${pendingStudents > 1 ? 's' : ''}` : 'Al día'} color="#C8A8DC" href="/dashboard/teacher/students" />
          <StatCard icon="📚" label="Lecciones publicadas" value={publishedLessons} sub={`de ${lessons.length} total`} color="#A8E6A1" href="/dashboard/teacher/lessons" />
          <StatCard icon="📝" label="Tareas por revisar" value={pendingHomework} sub={pendingHomework > 0 ? 'Requieren atención' : 'Todo al día'} color="#FFE8A8" href="/dashboard/teacher/homework" />
          <StatCard icon="⭐" label="Puntuación promedio" value={avgScore ?? '—'} sub={avgScore ? 'escala 1–7' : 'Sin datos aún'} color="#FFC0CB" href="/dashboard/teacher/progress" />
        </div>

        {/* ── Next class + Today's schedule ───────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ── Clases de hoy — carousel ─────────────────────── */}
          <div className="bg-gradient-to-br from-[#5A3D7A] to-[#8B5CF6] rounded-2xl p-5 text-white flex flex-col shadow-glass-lg">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">📅 Clases de hoy</p>
              {carouselClasses.length > 0 && (
                <span className="text-xs text-white/50 font-medium">{carouselSafeIdx + 1} / {carouselClasses.length}</span>
              )}
            </div>

            {/* Card body */}
            <div className="flex-1">
              {carouselClasses.length === 0 ? (
                /* All done or no classes */
                <div className="flex flex-col items-center justify-center py-4 gap-1">
                  {todayRecordedSlots.size > 0 || dismissedSlots.size > 0
                    ? <><p className="text-2xl">🎉</p><p className="text-sm font-semibold text-white/80">¡Al día con las clases de hoy!</p></>
                    : <p className="text-sm text-white/60">Sin clases confirmadas para hoy</p>
                  }
                </div>
              ) : (
                <>
                  {/* Animated class card */}
                  <div
                    style={{
                      transition: 'opacity 0.27s ease, transform 0.27s ease',
                      opacity:   carouselExiting ? 0 : 1,
                      transform: carouselExiting ? 'translateX(20px) scale(0.97)' : 'translateX(0) scale(1)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xl font-extrabold leading-tight truncate">{carouselCurrent.studentName}</p>
                        <p className="text-sm text-white/80 mt-0.5">
                          {DAY_ES[carouselCurrent.dayOfWeek] ?? ''} · {carouselCurrent.hour}:{String(carouselCurrent.minute ?? 0).padStart(2, '0')} – {carouselCurrent.minute ? carouselCurrent.hour + 1 : carouselCurrent.hour + 1}:{String(carouselCurrent.minute ?? 0).padStart(2, '0')}
                        </p>
                        <p className="text-white/50 text-xs mt-0.5">
                          {carouselCurrent.isRecurring ? '↻ Recurrente' : '• Una vez'}
                        </p>
                        {carouselCurrent.lessonId && (() => {
                          const l = lessons.find(x => x.id === carouselCurrent.lessonId);
                          return l ? <p className="text-white/60 text-xs mt-1 truncate">📚 {l.code} · {l.title}</p> : null;
                        })()}
                      </div>
                      {/* Prev / Next arrows */}
                      <div className="flex gap-1 shrink-0 mt-1">
                        <button
                          onClick={() => setCarouselIdx(p => Math.max(0, p - 1))}
                          disabled={carouselSafeIdx === 0}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-base disabled:opacity-25 transition-colors"
                        >‹</button>
                        <button
                          onClick={() => setCarouselIdx(p => Math.min(carouselClasses.length - 1, p + 1))}
                          disabled={carouselSafeIdx === carouselClasses.length - 1}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-base disabled:opacity-25 transition-colors"
                        >›</button>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-3">
                    <button
                      disabled={!!recordingKey || carouselExiting}
                      onClick={() => handleRecord(carouselCurrent, true)}
                      className="flex-1 py-2 bg-green-400/25 hover:bg-green-400/40 text-white rounded-full text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {recordingKey ? '…' : '✅'} Se tomó
                    </button>
                    <button
                      disabled={!!recordingKey || carouselExiting}
                      onClick={() => handleRecord(carouselCurrent, false)}
                      className="flex-1 py-2 bg-red-400/25 hover:bg-red-400/40 text-white rounded-full text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {recordingKey ? '…' : '❌'} No se tomó
                    </button>
                    {carouselCurrent.lessonId && (
                      <Link
                        href={`/classroom/${carouselCurrent.lessonId}`}
                        className="px-3 py-2 bg-white/15 hover:bg-white/25 text-white rounded-full text-xs font-bold transition-colors shrink-0"
                      >
                        Abrir →
                      </Link>
                    )}
                  </div>

                  {/* Dot indicators */}
                  {carouselClasses.length > 1 && (
                    <div className="flex justify-center gap-1 mt-2">
                      {carouselClasses.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCarouselIdx(i)}
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${i === carouselSafeIdx ? 'bg-white' : 'bg-white/30'}`}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Stats footer — today only */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-4 text-xs text-white/50">
              <span>✅ {todayCompletedCount} completadas</span>
              <span>📅 {todayBookings.length} pendientes</span>
              <span>🎯 {todayTotalClasses} hoy</span>
            </div>
          </div>

          {/* Today's classes */}
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-gray-700 text-sm">Clases de hoy</p>
              <span className="text-xs text-gray-400">{DAY_ES[today.getDay()]} {today.getDate()}</span>
            </div>
            {todayAllBookings.length > 0 ? (
              <div className="space-y-2">
                {todayAllBookings.map((b) => {
                  const isCompleted = b.status === 'completed';
                  const bMin = b.minute ?? 0;
                  const bookingTotalMin = b.hour * 60 + bMin;
                  const nowTotalMin = today.getHours() * 60 + today.getMinutes();
                  const isPast = !isCompleted && bookingTotalMin < nowTotalMin;
                  const attended = b.attendance === 'attended';
                  return (
                    <div key={b.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${
                      isCompleted
                        ? 'bg-gray-50 border border-gray-100'
                        : isPast
                          ? 'opacity-50'
                          : 'bg-[#F0E5FF]'
                    }`}>
                      <span className="text-xs font-mono font-bold text-[#5A3D7A] w-12 flex-shrink-0">{b.hour}:{String(bMin).padStart(2, '0')}</span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold truncate ${isCompleted ? 'text-gray-500' : 'text-gray-800'}`}>
                          {b.studentName}
                        </p>
                        {b.lessonId && (() => {
                          const l = lessons.find(x => x.id === b.lessonId);
                          return <p className="text-[10px] text-gray-500 truncate">📚 {l ? `${l.code} · ${l.title}` : 'Lección asignada'}</p>;
                        })()}
                      </div>
                      {isCompleted ? (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            attended
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {attended ? '✓ Asistió' : '✗ No asistió'}
                          </span>
                          <button
                            onClick={() => handleReopen(b)}
                            disabled={reopeningKey === `${b.dayOfWeek}-${b.hour}-${b.minute ?? 0}`}
                            title="Reabrir para re-marcar"
                            className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 hover:bg-[#C8A8DC] hover:text-white text-gray-400 text-[10px] transition-colors disabled:opacity-40"
                          >
                            ↩
                          </button>
                        </div>
                      ) : (
                        b.lessonId && !isPast && (
                          <Link href={`/classroom/${b.lessonId}`} className="px-2 py-1 bg-[#C8A8DC] text-white rounded-full text-[10px] font-bold flex-shrink-0">
                            Abrir
                          </Link>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            ) : todayScheduleFallback.length > 0 ? (
              <div className="space-y-2">
                {todayScheduleFallback.map((s) => {
                  const sFallbackMin = (s as { minute?: number }).minute ?? 0;
                  const sTotalMin = s.hour * 60 + sFallbackMin;
                  const isPast = sTotalMin < today.getHours() * 60 + today.getMinutes();
                  return (
                    <div key={`${s.dow}-${s.hour}-${sFallbackMin}`} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${isPast ? 'opacity-40' : 'bg-[#F0E5FF]'}`}>
                      <span className="text-xs font-mono font-bold text-[#5A3D7A] w-12 flex-shrink-0">{s.hour}:{String(sFallbackMin).padStart(2, '0')}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-800 truncate">{s.name}</p>
                        <p className="text-[10px] text-gray-400">{s.isRecurring ? '↻ Recurrente' : '• Una vez'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-3xl mb-1">🎉</p>
                <p className="text-sm text-gray-500">Sin clases hoy</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Homework to review ──────────────────────────────── */}
        {toReview.length > 0 && (
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-gray-700 text-sm">📝 Tareas entregadas — pendientes de revisión</p>
              <Link href="/dashboard/teacher/homework" className="text-xs text-[#9B7CB8] font-semibold hover:underline">Ver todas →</Link>
            </div>
            <div className="space-y-2">
              {toReview.map((hw) => {
                const student = students.find((s) => s.uid === hw.assignedToStudentId);
                const submittedDate = toDate(hw.submittedAt);
                return (
                  <div key={hw.id} className="flex items-center gap-3 px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-xl">
                    <span className="text-xl">📋</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-800 truncate">{hw.title}</p>
                      <p className="text-[11px] text-gray-500">{student?.fullName ?? hw.assignedToStudentId}</p>
                    </div>
                    {submittedDate && (
                      <span className="text-[10px] text-gray-400 flex-shrink-0">
                        {submittedDate.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                    <Link href="/dashboard/teacher/homework" className="px-2 py-1 bg-amber-500 text-white rounded-full text-[10px] font-bold flex-shrink-0">
                      Revisar
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Students overview (merged with contact) ─────────── */}
        {approvedStudents > 0 && (
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => { setStudentsOpen(o => !o); if (studentsOpen) setExpandedStudent(null); }}
                className="flex items-center gap-2 font-bold text-gray-700 text-sm hover:text-[#5A3D7A] transition-colors"
              >
                👥 Mis estudiantes
                <span className={`text-xs text-[#9B7CB8] transition-transform duration-200 ${studentsOpen ? 'rotate-180' : ''}`}>▾</span>
              </button>
              <Link href="/dashboard/teacher/students" className="text-xs text-[#9B7CB8] font-semibold hover:underline">Gestionar →</Link>
            </div>
            {studentsOpen && <div className="flex flex-wrap gap-2 mt-3">
              {students.filter((s) => s.status === 'approved').map((s) => {
                const isOpen = expandedStudent === s.uid;
                const firstName = s.fullName.split(' ')[0];
                return (
                  <button
                    key={s.uid}
                    onClick={() => setExpandedStudent(isOpen ? null : s.uid)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 ${
                      isOpen
                        ? 'bg-[#5A3D7A] text-white shadow-md'
                        : 'bg-[#F0E5FF] text-[#5A3D7A] hover:bg-[#E8D5FF]'
                    }`}
                  >
                    <span className="text-xs font-semibold">{firstName}</span>
                    {s.studentData?.level && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isOpen ? 'bg-white/20 text-white' : (LEVEL_COLORS[s.studentData.level] ?? 'bg-gray-100 text-gray-500')
                      }`}>
                        {s.studentData.level}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>}

            {/* Expanded contact — renders inline below the pill row */}
            {studentsOpen && expandedStudent && (() => {
              const s = students.find((st) => st.uid === expandedStudent && st.status === 'approved');
              if (!s) return null;
              const firstName = s.fullName.split(' ')[0];
              const rawPhone = s.phone ?? '';
              const digits = rawPhone.replace(/\D/g, '');
              const waPhone = digits.startsWith('56') ? digits : digits.startsWith('9') && digits.length === 9 ? `56${digits}` : digits;
              return (
                <div className="mt-3 pt-3 border-t border-[#E8D5FF] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#F0E5FF] flex items-center justify-center text-sm font-bold text-[#5A3D7A] flex-shrink-0">
                    {firstName[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-800">{s.fullName}</p>
                    {s.studentData?.level && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${LEVEL_COLORS[s.studentData.level] ?? 'bg-gray-100 text-gray-500'}`}>
                        {s.studentData.level}
                      </span>
                    )}
                    {rawPhone && <p className="text-[10px] text-gray-400 mt-0.5">{rawPhone}</p>}
                  </div>
                  {rawPhone ? (
                    <div className="flex gap-1.5 flex-shrink-0">
                      <a
                        href={`https://wa.me/${waPhone}?text=Hola%20${encodeURIComponent(firstName)}%2C%20soy%20tu%20profesora%20de%20FriendlyTeaching%20%F0%9F%91%8B`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-[#25D366] hover:bg-[#1ebe5c] text-white rounded-full text-[10px] font-bold transition-colors"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Mensaje
                      </a>
                      <a
                        href={`https://wa.me/${waPhone}?text=Recordatorio%3A%20tienes%20clase%20hoy%20con%20FriendlyTeaching%20%F0%9F%93%9A`}
                        target="_blank" rel="noopener noreferrer"
                        className="px-2.5 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-full text-[10px] font-bold transition-colors"
                      >
                        Recordatorio
                      </a>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-300 italic flex-shrink-0">Sin teléfono registrado</p>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ── History button ──────────────────────────────────── */}
        <button
          onClick={() => setHistoryOpen(true)}
          className="w-full flex items-center justify-between glass-card rounded-2xl px-5 py-4 hover:border-[#C8A8DC]/40 hover-lift group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F0E5FF] flex items-center justify-center text-xl flex-shrink-0">
              📋
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-800">Historial de clases</p>
              <p className="text-xs text-gray-400">Ver clases registradas</p>
            </div>
          </div>
          <span className="text-[#9B7CB8] font-bold text-sm group-hover:translate-x-1 transition-transform">→</span>
        </button>

        {/* ── Weekly schedule ── */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <p className="font-bold text-gray-700 text-sm">📅 Horario Semanal</p>
          </div>
          <div className="px-20 sm:px-24 pb-4">
            <SchedulingGrid />
          </div>
        </div>

      </div>

      {/* ── History drawer ── */}
      {historyOpen && (
        <HistoryModal teacherId={effectiveUid} onClose={() => setHistoryOpen(false)} />
      )}

      {/* ── Post-class notes modal ── */}
      {pendingNotesEntryId && (
        <ClassNotesModal
          studentName={pendingNotesStudentName}
          onSave={async (notes) => {
            await saveClassNotes(pendingNotesEntryId, notes);
            setPendingNotesEntryId(null);
          }}
          onSkip={() => {
            setPendingNotesEntryId(null);
          }}
        />
      )}
    </div>
  );
}
