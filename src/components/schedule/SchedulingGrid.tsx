// FriendlyTeaching.cl — SchedulingGrid
'use client';
import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useScheduleStore } from '@/store/scheduleStore';
import { useBookings, completeBooking } from '@/hooks/useBookings';
import { useSchedule } from '@/hooks/useSchedule';
import { recordClassSession, saveClassNotes } from '@/hooks/useClassHistory';
import { ClassNotesModal } from './ClassNotesModal';
import ScheduleSlot from './ScheduleSlot';
import WeekNavigator from './WeekNavigator';
import type { Booking } from '@/types/firebase';
import { BASE_SCHEDULE } from '@/data/teacherSchedule';
import { auth } from '@/lib/firebase/config';

// Lazy load modals for better initial load performance
const SlotActionModal = React.lazy(() => import('./SlotActionModal'));
const BookingModal = React.lazy(() => import('./BookingModal'));
const AvailabilityModal = React.lazy(() => import('./AvailabilityModal'));
const NameNormalizerModal = React.lazy(() => import('./NameNormalizerModal'));

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Base visible hours — can be extended dynamically by :30 slots from bookings
const BASE_HOURS = Array.from({ length: 13 }, (_, i) => i + 9); // 9–21

// Slot key including minute so 9:00 and 9:30 are distinct
function slotKey(dow: number, hour: number, minute: number): string {
  return `${dow}-${hour}-${minute}`;
}

// Reusable null-cast for optional Timestamp fields in synthetic bookings
const NULL_TIMESTAMP = null as unknown as Booking['weekStart'];

// Build a synthetic Booking-like map from the hardcoded schedule.
// Only recurring entries are included — non-recurring ones are one-time-only and
// should only appear for the specific week they were booked, not every week.
function buildFallbackMap(): Record<string, Booking> {
  const map: Record<string, Booking> = {};
  BASE_SCHEDULE.filter((s) => s.isRecurring).forEach((s) => {
    map[slotKey(s.dow, s.hour, 0)] = {
      id: `local-${s.dow}-${s.hour}`,
      teacherId: '',
      studentName: s.name,
      dayOfWeek: s.dow,
      hour: s.hour,
      minute: 0,
      weekStart: NULL_TIMESTAMP,
      status: 'confirmed',
      isRecurring: s.isRecurring,
      createdAt: NULL_TIMESTAMP,
    };
  });
  return map;
}

function isCurrentWeek(weekStart: Date): boolean {
  const today = new Date();
  const monday = new Date(today);
  const day = monday.getDay();
  const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toDateString() === weekStart.toDateString();
}

function formatTime(hour: number, minute: number): string {
  return `${hour}:${minute === 0 ? '00' : String(minute).padStart(2, '0')}`;
}

export default function SchedulingGrid() {
  const { profile } = useAuthStore();
  const { currentWeekStart, openSlotAction, openDirectBooking, isBookingModalOpen } = useScheduleStore();
  const [showAvailability, setShowAvailability] = useState(false);

  const teacherUid = profile?.uid ?? auth.currentUser?.uid ?? '';

  const [showNameNormalizer, setShowNameNormalizer] = useState(false);
  const { bookings, allBookings, loading: bookingsLoading, dataVersion: bookingsVersion } = useBookings(teacherUid, currentWeekStart);
  const { scheduleMap, loading: scheduleLoading, dataVersion: scheduleVersion } = useSchedule(teacherUid);
  const bumpDataVersion = useScheduleStore((s) => s.bumpDataVersion);
  const pendingCompleteNotes = useScheduleStore((s) => s.pendingCompleteNotes);

  // Complete-class notes modal state — triggered by SlotActionModal "Marcar como Completada"
  const [completeNotesInfo, setCompleteNotesInfo] = useState<{
    bookingId: string; studentName: string; booking: Booking; teacherUid: string; weekStart: Date;
  } | null>(null);

  // Sync hook data versions → store so modals can wait for onSnapshot updates
  useEffect(() => {
    bumpDataVersion();
  }, [bookingsVersion, scheduleVersion, bumpDataVersion]);

  // Pick up pendingCompleteNotes set by SlotActionModal and open ClassNotesModal here,
  // so the flow works on every page that embeds SchedulingGrid (not just the dashboard).
  useEffect(() => {
    if (pendingCompleteNotes) {
      setCompleteNotesInfo(pendingCompleteNotes);
      useScheduleStore.getState().setPendingCompleteNotes(null);
    }
  }, [pendingCompleteNotes]);

  const loading = bookingsLoading || scheduleLoading;

  // The hardcoded BASE_SCHEDULE belongs to Ignacio's account only.
  // Aranxa and any other teacher have their own Firestore data — the fallback
  // must NOT bleed into their grid.
  const teacherEmail = profile?.email ?? '';
  const isFrau = teacherEmail === 'ifraufigueroa@gmail.com';

  // Build lookup: slotKey(dow, hour, minute) -> Booking
  const bookingMap = useMemo(() => {
    // Viewed week's Monday in ms — needed both for the map seed guard and for
    // the per-booking priority logic below.
    const currentWeekMs = (() => {
      const d = new Date(currentWeekStart);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })();

    // Today's actual week Monday — used to detect past-week navigation.
    const thisWeekMs = (() => {
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })();

    // When the teacher has navigated into a past week, we must NOT show
    // fallback or future-week docs — that's what caused past-week edits to
    // overwrite the current week's booking.
    const isViewingPastWeek = currentWeekMs < thisWeekMs;

    // Seed the map with BASE_SCHEDULE only for Ignacio's account and only
    // when viewing the current or a future week. Past weeks must rely on
    // real Firestore docs so edits always target the correct document.
    const map: Record<string, Booking> = (teacherUid && isFrau && !isViewingPastWeek) ? buildFallbackMap() : {};

    // Track which students were cancelled this week per slot key.
    // We use a Map<key, Set<studentName>> so we only clear a slot when the
    // specific student shown there was cancelled — not when an unrelated student
    // at the same time-slot happens to have a cancellation.
    const cancelledSlotStudents = new Map<string, Set<string>>();

    if (bookings.length > 0) {

      // Track best booking per slot key.
      // Priority: 1) exact match for current week, 2) closest week, 3) any recurring.
      // Within same priority: prefer most recently updated (updatedAt / createdAt).
      const slotBest: Record<string, { booking: Booking; priority: number; diff: number }> = {};

      bookings.forEach((b) => {
        const min = b.minute ?? 0;
        const key = slotKey(b.dayOfWeek, b.hour, min);

        if (b.status === 'cancelled') {
          const set = cancelledSlotStudents.get(key) ?? new Set<string>();
          set.add(b.studentName);
          cancelledSlotStudents.set(key, set);
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ws = b.weekStart as any;
        const wsMs: number = ws
          ? typeof ws.toDate === 'function'
            ? ws.toDate().getTime()
            : ws instanceof Date
              ? ws.getTime()
              : (ws.seconds ?? 0) * 1000
          : 0;

        const diff = Math.abs(wsMs - currentWeekMs);
        // Compare by calendar day (not milliseconds) to survive DST transitions
        // and minor timestamp precision differences between store and Firestore.
        const isCurrentWeekDoc = new Date(wsMs).toDateString() === new Date(currentWeekMs).toDateString();

        // Priority: 0 = exact current week (any status)
        //           1 = confirmed from a FUTURE week (upcoming recurring fallback)
        //           2 = confirmed recurring from a PAST week (last-resort fallback)
        let priority: number;
        if (isCurrentWeekDoc) {
          priority = 0;
        } else if (!isViewingPastWeek && b.status === 'confirmed' && wsMs > currentWeekMs) {
          priority = 1;
        } else if (!isViewingPastWeek && b.status === 'confirmed' && b.isRecurring) {
          priority = 2;
        } else {
          return;
        }

        const prev = slotBest[key];
        if (!prev || priority < prev.priority || (priority === prev.priority && diff < prev.diff)) {
          slotBest[key] = { booking: b, priority, diff };
        }
      });

      // Overwrite fallback entries with real bookings
      Object.values(slotBest).forEach(({ booking }) => {
        const min = booking.minute ?? 0;
        map[slotKey(booking.dayOfWeek, booking.hour, min)] = booking;
      });
    }

    // Remove slot entries only when the displayed student was explicitly cancelled
    // this week. This prevents a cancellation for one student from wiping out a
    // different confirmed student that shares the same time slot.
    // Remove slot entries only when the displayed student was explicitly cancelled
    // this week AND there is no current-week confirmed booking that supersedes it.
    // A current-week confirmed booking means the teacher re-booked after a cancellation
    // — that booking must win and should NOT be cleared by the old cancellation record.
    cancelledSlotStudents.forEach((students, key) => {
      const entry = map[key];
      if (!entry || !students.has(entry.studentName)) return;

      // If the entry is a real Firestore booking (not a local-* fallback), check
      // whether its weekStart matches the current week. If it does, the teacher
      // explicitly re-created this booking after the cancellation — keep it.
      if (!entry.id.startsWith('local-')) {
        const entryWs = entry.weekStart as unknown as { toDate?: () => Date; seconds?: number } | null;
        if (entryWs) {
          const entryWsMs = typeof entryWs.toDate === 'function'
            ? entryWs.toDate().getTime()
            : (entryWs.seconds ?? 0) * 1000;
          if (new Date(entryWsMs).toDateString() === new Date(currentWeekMs).toDateString()) {
            return; // Current-week confirmed booking supersedes the cancellation
          }
        }
      }

      delete map[key];
    });

    return map;
  }, [bookings, bookingsLoading, currentWeekStart, teacherUid, isFrau]);

  // Compute the time slots to display:
  // Start with base :00 hours (9–21), then inject any :30 slots from bookings.
  const timeSlots = useMemo(() => {
    // Base :00 slots
    const slots: { hour: number; minute: number }[] = BASE_HOURS.map((h) => ({ hour: h, minute: 0 }));

    // Find any :30 slots from bookings
    bookings.forEach((b) => {
      const min = b.minute ?? 0;
      if (min !== 0) {
        const exists = slots.some((s) => s.hour === b.hour && s.minute === min);
        if (!exists) slots.push({ hour: b.hour, minute: min });
      }
    });

    // Sort by total minutes from midnight
    return slots.sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
  }, [bookings]);

  const today = new Date();
  const todayDow = today.getDay(); // 0=Sun, 1=Mon...6=Sat
  const inCurrentWeek = isCurrentWeek(currentWeekStart);

  const numRows = timeSlots.length;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <WeekNavigator />
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          <button
            onClick={() => setShowNameNormalizer(true)}
            title="Fusionar nombres duplicados o con tildes diferentes"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#5A3D7A] bg-[#F0E5FF] hover:bg-[#E0CCFF] rounded-full transition-colors"
          >
            🔗 Fusionar nombres
          </button>
          <button
            onClick={() => setShowAvailability(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#5A3D7A] bg-[#F0E5FF] hover:bg-[#E0CCFF] rounded-full transition-colors"
          >
            ⚙️ Disponibilidad
          </button>
        </div>
      </div>
      {showAvailability && (
        <Suspense fallback={null}>
          <AvailabilityModal onClose={() => setShowAvailability(false)} />
        </Suspense>
      )}
      {showNameNormalizer && (
        <Suspense fallback={null}>
          <NameNormalizerModal
            allBookings={allBookings}
            onClose={() => setShowNameNormalizer(false)}
          />
        </Suspense>
      )}

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="w-10 h-10 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-hidden flex-1 min-h-0 flex flex-col">
          <div
            className="grid min-w-[460px] h-full w-full mx-auto"
            style={{
              gridTemplateColumns: '56px repeat(6, 1fr)',
              gridTemplateRows: `auto repeat(${numRows}, 1fr)`,
              gap: '3px',
              paddingBottom: '2px'
            }}
          >
            {/* Header row */}
            <div /> {/* empty corner */}
            {DAY_NAMES.map((day, i) => {
              const dow = i + 1; // 1=Mon … 6=Sat
              const isToday = inCurrentWeek && todayDow === dow;
              return (
                <div
                  key={day}
                  className={`
                    flex items-center justify-center text-lg font-bold rounded-lg py-1
                    ${isToday
                      ? 'bg-[#5A3D7A] text-white'
                      : 'bg-white text-[#5A3D7A]'}
                  `}
                >
                  {day}
                </div>
              );
            })}

            {/* Time rows — one per time slot (including :30 sub-slots) */}
            {timeSlots.map(({ hour, minute }) => (
              <React.Fragment key={`${hour}-${minute}`}>
                {/* Time label */}
                <div
                  className={`flex items-center justify-center font-medium ${
                    minute !== 0
                      ? 'text-sm text-gray-300 italic'   // :30 sub-slot label (smaller/dimmer)
                      : 'text-lg text-gray-400'           // :00 main label
                  }`}
                >
                  {formatTime(hour, minute)}
                </div>

                {/* Day cells */}
                {[1, 2, 3, 4, 5, 6].map((dow) => {
                  const key = slotKey(dow, hour, minute);
                  const booking = bookingMap[key];
                  const scheduleKey = `${dow}-${hour}`;
                  const scheduleEntry = scheduleMap[scheduleKey];
                  const isBlocked = scheduleEntry?.isAvailable === false;
                  const isToday = inCurrentWeek && todayDow === dow;

                  return (
                    <div key={key} className="min-h-0">
                      <ScheduleSlot
                        booking={booking}
                        isBlocked={isBlocked}
                        isToday={isToday && !booking && !isBlocked}
                        onClick={() => {
                          if (booking?.status === 'confirmed' || booking?.status === 'completed') {
                            openSlotAction(dow, hour, minute, 'occupied', booking);
                          } else if (booking?.status === 'pending') {
                            openSlotAction(dow, hour, minute, 'pending', booking);
                          } else {
                            openDirectBooking(dow, hour, minute);
                          }
                        }}
                      />
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2 flex-shrink-0 text-lg text-gray-500">
        {[
          { color: 'bg-[#A8E6A1]',                      label: 'Disponible' },
          { color: 'bg-[#C8A8DC]',                      label: 'Ocupado (recurrente)' },
          { color: 'bg-[#FFB8D9]',                      label: 'Ocupado (única vez)' },
          { color: 'bg-[#FFE8A8]',                      label: 'Pendiente' },
          { color: 'bg-gray-100 border border-gray-200', label: 'Realizada' },
          { color: 'bg-[#D9D9D9]',                      label: 'Bloqueado' },
          { color: 'bg-[#FFB347]',                      label: 'Entrevista' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded ${color}`} />
            {label}
          </div>
        ))}
      </div>

      {/* Complete-class notes modal */}
      {completeNotesInfo && (
        <ClassNotesModal
          studentName={completeNotesInfo.studentName}
          requireAttendance
          onSave={async (notes, attendance) => {
            const { bookingId, booking: b, teacherUid: tUid, weekStart: ws } = completeNotesInfo;
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const rawWs = b.weekStart as any;
              const wsDate: Date = rawWs
                ? typeof rawWs.toDate === 'function' ? rawWs.toDate()
                  : rawWs.seconds ? new Date(rawWs.seconds * 1000) : ws
                : ws;
              // Use noon to avoid DST transitions shifting the date when adding days
              const classDate = new Date(wsDate);
              classDate.setHours(12, 0, 0, 0);
              classDate.setDate(classDate.getDate() + (b.dayOfWeek - 1));
              const attended = attendance !== 'absent';
              await completeBooking(bookingId, { attendance: attendance ?? undefined });
              const entryId = await recordClassSession({
                teacherId: tUid,
                studentId: b.studentId ?? undefined,
                studentName: b.studentName,
                dayOfWeek: b.dayOfWeek,
                hour: b.hour,
                minute: b.minute ?? 0,
                date: classDate,
                attended,
                isRecurring: b.isRecurring,
                bookingId,
              });
              if (Object.keys(notes).length > 0) {
                await saveClassNotes(entryId, notes);
              }
            } catch (err) {
              console.error('[SchedulingGrid] onSave error:', err);
            } finally {
              setCompleteNotesInfo(null);
            }
          }}
          onSkip={async (attendance) => {
            if (!attendance) { setCompleteNotesInfo(null); return; }
            const { bookingId, booking: b, teacherUid: tUid, weekStart: ws } = completeNotesInfo;
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const rawWs = b.weekStart as any;
              const wsDate: Date = rawWs
                ? typeof rawWs.toDate === 'function' ? rawWs.toDate()
                  : rawWs.seconds ? new Date(rawWs.seconds * 1000) : ws
                : ws;
              const classDate = new Date(wsDate);
              classDate.setHours(12, 0, 0, 0);
              classDate.setDate(classDate.getDate() + (b.dayOfWeek - 1));
              const attended = attendance !== 'absent';
              await completeBooking(bookingId, { attendance });
              await recordClassSession({
                teacherId: tUid,
                studentId: b.studentId ?? undefined,
                studentName: b.studentName,
                dayOfWeek: b.dayOfWeek,
                hour: b.hour,
                minute: b.minute ?? 0,
                date: classDate,
                attended,
                isRecurring: b.isRecurring,
                bookingId,
              });
            } catch (err) {
              console.error('[SchedulingGrid] onSkip error:', err);
            } finally {
              setCompleteNotesInfo(null);
            }
          }}
        />
      )}

      {/* Modals */}
      <Suspense fallback={null}>
        <SlotActionModal />
      </Suspense>
      {isBookingModalOpen && (
        <Suspense fallback={null}>
          <BookingModal />
        </Suspense>
      )}
    </div>
  );
}
