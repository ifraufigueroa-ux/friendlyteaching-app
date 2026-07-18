// FriendlyTeaching.cl — Planner: Semana (this week's classes, grouped by day)
'use client';
import { useMemo } from 'react';
import { useBookings } from '@/hooks/useBookings';
import ClassRow from './ClassRow';
import type { Booking } from '@/types/firebase';

function mondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

const DAYS = [
  { dow: 1, label: 'Lunes'     },
  { dow: 2, label: 'Martes'    },
  { dow: 3, label: 'Miércoles' },
  { dow: 4, label: 'Jueves'    },
  { dow: 5, label: 'Viernes'   },
  { dow: 6, label: 'Sábado'    },
];

const MONTH_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export default function WeekTab({ teacherId }: { teacherId: string }) {
  const today = useMemo(() => new Date(), []);
  const weekStart = useMemo(() => mondayOf(today), [today]);
  const todayDow = today.getDay();

  const { bookings, loading } = useBookings(teacherId, weekStart);

  const byDay = useMemo(() => {
    const groups: Record<number, Booking[]> = {};
    for (const b of bookings) {
      if (b.status === 'cancelled') continue;
      (groups[b.dayOfWeek] ??= []).push(b);
    }
    for (const k of Object.keys(groups)) {
      groups[Number(k)].sort((a, b) => (a.hour * 60 + (a.minute ?? 0)) - (b.hour * 60 + (b.minute ?? 0)));
    }
    return groups;
  }, [bookings]);

  // Compute the concrete date of each day this week for the little date chips.
  const dateFor = (dow: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + (dow - 1));
    return d;
  };

  const totalWeek = Object.values(byDay).reduce((n, arr) => n + arr.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-10 h-10 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Week hero */}
      <div className="bg-gradient-to-br from-[#5A3D7A] to-[#9B7CB8] rounded-3xl p-5 text-white shadow-lg">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-70 mb-1">Semana del</p>
        <h2 className="font-serif font-bold text-3xl leading-tight">
          {weekStart.getDate()} de {MONTH_ES[weekStart.getMonth()]} — {dateFor(6).getDate()} de {MONTH_ES[dateFor(6).getMonth()]}
        </h2>
        <p className="text-sm opacity-80 mt-1">
          {totalWeek} clase{totalWeek === 1 ? '' : 's'} programada{totalWeek === 1 ? '' : 's'} esta semana.
        </p>
      </div>

      {/* Day-by-day sections */}
      {DAYS.map(({ dow, label }) => {
        const classes = byDay[dow] ?? [];
        const date = dateFor(dow);
        const isToday = dow === todayDow;
        return (
          <div key={dow} className={`bg-white rounded-2xl border ${isToday ? 'border-[#C8A8DC] shadow-md' : 'border-gray-100'} overflow-hidden`}>
            <div className={`px-4 py-2.5 flex items-center justify-between ${isToday ? 'bg-[#F0E5FF]' : 'bg-[#FDFAFF]'}`}>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${isToday ? 'text-[#5A3D7A]' : 'text-gray-700'}`}>
                  {label}
                </span>
                <span className="text-xs text-gray-400">
                  {date.getDate()} {MONTH_ES[date.getMonth()]}
                </span>
                {isToday && (
                  <span className="text-[9px] font-bold uppercase tracking-widest bg-[#5A3D7A] text-white px-2 py-0.5 rounded-full">
                    Hoy
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold text-gray-400">
                {classes.length} clase{classes.length === 1 ? '' : 's'}
              </span>
            </div>
            {classes.length === 0 ? (
              <div className="px-4 py-3 text-[11px] text-gray-300 italic text-center">
                Sin clases
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {classes.map(b => (
                  <ClassRow key={b.id} booking={b} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
