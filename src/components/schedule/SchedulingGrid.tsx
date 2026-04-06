// FriendlyTeaching.cl — SchedulingGrid
'use client';
import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useScheduleStore } from '@/store/scheduleStore';
import { useBookings } from '@/hooks/useBookings';
import { useSchedule } from '@/hooks/useSchedule';
import ScheduleSlot from './ScheduleSlot';
import WeekNavigator from './WeekNavigator';
import type { Booking } from '@/types/firebase';
import { BASE_SCHEDULE } from '@/data/teacherSchedule';
import { auth } from '@/lib/firebase/config';

// Lazy load modals for better initial load performance
const SlotActionModal = React.lazy(() => import('./SlotActionModal'));
const BookingModal = React.lazy(() => import('./BookingModal'));
const AvailabilityModal = React.lazy(() => import('./AvailabilityModal'));

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Base visible hours — can be extended dynamically by :30 slots from bookings
const BASE_HOURS = Array.from({ length: 13 }, (_, i) => i + 9); // 9–21

// Slot key including minute so 9:00 and 9:30 are distinct
function slotKey(dow: number, hour: number, minute: number): string {
  return `${dow}-${hour}-${minute}`;
}

// Reusable null-cast for optional Timestamp fields in synthetic bookings
const NULL_TIMESTAMP = null as unknown as Booking['weekStart'];

// Build a synthetic Booking-like map from the hardcoded schedule
function buildFallbackMap(): Record<string, Booking> {
  const map: Record<string, Booking> = {};
  BASE_SCHEDULE.forEach((s) => {
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

  const { bookings, loading: bookingsLoading, dataVersion: bookingsVersion } = useBookings(teacherUid, currentWeekStart);
  const { scheduleMap, loading: scheduleLoading, dataVersion: scheduleVersion } = useSchedule(teacherUid);
  const bumpDataVersion = useScheduleStore((s) => s.bumpDataVersion);

  // Sync hook data versions → store so modals can wait for onSnapshot updates
  useEffect(() => {
    bumpDataVersion();
  }, [bookingsVersion, scheduleVersion, bumpDataVersion]);

  const loading = bookingsLoading || scheduleLoading;

  // Build lookup: slotKey(dow, hour, minute) -> Booking
  const bookingMap = useMemo(() => {
    const map: Record<string, Booking> =
      !bookingsLoading && bookings.length === 0 && !teacherUid
        ? buildFallbackMap()
        : {};

    if (bookings.length > 0) {
      const currentWeekMs = (() => {
        const d = new Date(currentWeekStart);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })();

      // Track best booking per slot key.
      // Priority: 1) exact match for current week, 2) closest week, 3) any recurring.
      // Within same priority: prefer most recently updated (updatedAt / createdAt).
      const slotBest: Record<string, { booking: Booking; priority: number; diff: number }> = {};

      bookings.forEach((b) => {
        if (b.status === 'cancelled') return;
        const min = b.minute ?? 0;
        const key = slotKey(b.dayOfWeek, b.hour, min);

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
        // Priority: 0 = exact current week match, 1 = other week
        const priority = diff < 1000 ? 0 : 1;

        const prev = slotBest[key];
        if (!prev || priority < prev.priority || (priority === prev.priority && diff < prev.diff)) {
          slotBest[key] = { booking: b, priority, diff };
        }
      });

      Object.values(slotBest).forEach(({ booking }) => {
        const min = booking.minute ?? 0;
        map[slotKey(booking.dayOfWeek, booking.hour, min)] = booking;
      });
    }

    return map;
  }, [bookings, bookingsLoading, currentWeekStart, teacherUid]);

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
        <button
          onClick={() => setShowAvailability(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#5A3D7A] bg-[#F0E5FF] hover:bg-[#E0CCFF] rounded-xl transition-colors flex-shrink-0 ml-2"
        >
          ⚙️ Disponibilidad
        </button>
      </div>
      {showAvailability && (
        <Suspense fallback={null}>
          <AvailabilityModal onClose={() => setShowAvailability(false)} />
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
