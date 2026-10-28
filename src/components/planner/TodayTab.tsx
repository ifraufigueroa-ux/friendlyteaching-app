// FriendlyTeaching.cl — Planner: Hoy (today's classes)
'use client';
import { useMemo } from 'react';
import { Coffee } from 'lucide-react';
import { useBookings } from '@/hooks/useBookings';
import ClassRow from './ClassRow';
import { dedupeBookingsForWeek } from './bookingUtils';
import type { Booking } from '@/types/firebase';

// Monday of the week containing `date`, matches getMonday() in scheduleStore.
function mondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

const DAY_ES_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_ES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function TodayTab({ teacherId }: { teacherId: string }) {
  const today = useMemo(() => new Date(), []);
  const weekStart = useMemo(() => mondayOf(today), [today]);
  const todayDow = today.getDay(); // 0=Sun, 1=Mon, …, 6=Sat — booking.dayOfWeek matches Mon-Sat (1-6)

  const { bookings, loading } = useBookings(teacherId, weekStart);

  const todaysClasses = useMemo(() => {
    const weekMs = weekStart.getTime();
    return dedupeBookingsForWeek(bookings, weekMs)
      .filter((b: Booking) => b.dayOfWeek === todayDow)
      .sort((a, b) => (a.hour * 60 + (a.minute ?? 0)) - (b.hour * 60 + (b.minute ?? 0)));
  }, [bookings, todayDow, weekStart]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-10 h-10 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Hero header — today's date */}
      <div className="bg-gradient-to-br from-[#5A3D7A] to-[#9B7CB8] rounded-3xl p-5 text-white shadow-lg">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-70 mb-1">Today is</p>
        <h2 className="font-serif font-bold text-3xl leading-tight">
          {DAY_ES_LONG[todayDow]}, {MONTH_ES[today.getMonth()]} {today.getDate()}
        </h2>
        <p className="text-sm opacity-80 mt-1">
          {todaysClasses.length === 0
            ? 'No classes scheduled today.'
            : `${todaysClasses.length} class${todaysClasses.length === 1 ? '' : 'es'} scheduled.`}
        </p>
      </div>

      {/* Class list */}
      {todaysClasses.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-[#E0C8F0] p-10 text-center">
          <Coffee className="w-12 h-12 mx-auto mb-3 text-gray-300" strokeWidth={2} />
          <p className="text-sm font-semibold text-[#5A3D7A]">Day off.</p>
          <p className="text-xs text-gray-400 mt-1">Use the time to prep content in the Kanban.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {todaysClasses.map(b => (
            <ClassRow key={b.id} booking={b} />
          ))}
        </div>
      )}
    </div>
  );
}
