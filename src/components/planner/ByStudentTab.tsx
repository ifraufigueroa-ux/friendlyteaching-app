// FriendlyTeaching.cl — Planner: Por estudiante (classes grouped by student)
'use client';
import { useMemo, useState } from 'react';
import { useBookings } from '@/hooks/useBookings';
import { useStudents } from '@/hooks/useStudents';
import ClassRow from './ClassRow';
import { dedupeBookingsForWeek } from './bookingUtils';
import type { Booking, FTUser } from '@/types/firebase';

function mondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

const LEVEL_COLORS: Record<string, string> = {
  A0: 'bg-gray-100 text-gray-500',   A1: 'bg-blue-100 text-blue-700',
  A2: 'bg-sky-100 text-sky-700',     B1: 'bg-green-100 text-green-700',
  'B1+': 'bg-emerald-100 text-emerald-700', B2: 'bg-amber-100 text-amber-700',
  C1: 'bg-purple-100 text-purple-700',
};

export default function ByStudentTab({ teacherId }: { teacherId: string }) {
  const today = useMemo(() => new Date(), []);
  const weekStart = useMemo(() => mondayOf(today), [today]);
  const { students, loading: studentsLoading } = useStudents();
  const { bookings, loading: bookingsLoading } = useBookings(teacherId, weekStart);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  // Group bookings by studentId (falling back to studentName when studentId
  // is missing on legacy bookings). Dedup first so a recurring class shows
  // up ONCE, not 52 times.
  const bookingsByStudent = useMemo(() => {
    const weekMs = weekStart.getTime();
    const groups: Record<string, Booking[]> = {};
    for (const b of dedupeBookingsForWeek(bookings, weekMs)) {
      const key = b.studentId || `name:${b.studentName}`;
      (groups[key] ??= []).push(b);
    }
    for (const arr of Object.values(groups)) {
      arr.sort((a, b) => (a.dayOfWeek - b.dayOfWeek) || ((a.hour * 60 + (a.minute ?? 0)) - (b.hour * 60 + (b.minute ?? 0))));
    }
    return groups;
  }, [bookings, weekStart]);

  // Build the list of student entries — merge Users collection with any
  // bookings that don't map to a registered student.
  const studentEntries = useMemo(() => {
    const entries: { key: string; student?: FTUser; name: string; level?: string; count: number }[] = [];
    const seen = new Set<string>();

    for (const s of students) {
      const key = s.uid;
      const count = (bookingsByStudent[key] ?? []).length;
      entries.push({ key, student: s, name: s.fullName || s.email || 'Sin nombre', level: s.studentData?.level, count });
      seen.add(key);
    }
    // Legacy bookings with no linked student — surface them so the teacher
    // can still edit topic/material.
    for (const key of Object.keys(bookingsByStudent)) {
      if (seen.has(key)) continue;
      const first = bookingsByStudent[key][0];
      entries.push({ key, name: first?.studentName || 'Sin nombre', count: bookingsByStudent[key].length });
    }

    entries.sort((a, b) => (b.count - a.count) || a.name.localeCompare(b.name));
    return entries;
  }, [students, bookingsByStudent]);

  const selected = selectedUid ? studentEntries.find(e => e.key === selectedUid) : null;
  const selectedBookings = selectedUid ? (bookingsByStudent[selectedUid] ?? []) : [];

  if (studentsLoading || bookingsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-10 h-10 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)] gap-4 items-start">

        {/* Student list */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden md:sticky md:top-4">
          <div className="px-4 py-3 border-b border-gray-100 bg-[#FDFAFF]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A3D7A]">
              Estudiantes
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">{studentEntries.length} en total</p>
          </div>
          <div className="max-h-[70vh] overflow-y-auto divide-y divide-gray-50">
            {studentEntries.map(entry => {
              const isSelected = entry.key === selectedUid;
              return (
                <button
                  key={entry.key}
                  onClick={() => setSelectedUid(isSelected ? null : entry.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    isSelected ? 'bg-[#F0E5FF]' : 'hover:bg-[#FDFAFF]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-[#C8A8DC] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {initials(entry.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${isSelected ? 'text-[#5A3D7A]' : 'text-gray-700'}`}>
                      {entry.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {entry.level && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${LEVEL_COLORS[entry.level] ?? ''}`}>
                          {entry.level}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">
                        {entry.count} clase{entry.count === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right panel — bookings for selected student */}
        <div>
          {!selected ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-[#E0C8F0] p-10 text-center">
              <p className="text-5xl mb-3">👥</p>
              <p className="text-sm font-semibold text-[#5A3D7A]">Elige un estudiante</p>
              <p className="text-xs text-gray-400 mt-1">Verás sus clases agendadas y podrás editar tema + material.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-[#5A3D7A] to-[#9B7CB8] rounded-3xl p-5 text-white shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 backdrop-blur">
                    {initials(selected.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-70">Clases con</p>
                    <h2 className="font-serif font-bold text-2xl truncate">{selected.name}</h2>
                    <p className="text-sm opacity-80">
                      {selectedBookings.length} clase{selectedBookings.length === 1 ? '' : 's'} programada{selectedBookings.length === 1 ? '' : 's'}.
                    </p>
                  </div>
                </div>
              </div>

              {selectedBookings.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-[#E0C8F0] p-8 text-center">
                  <p className="text-3xl mb-2">📭</p>
                  <p className="text-xs text-gray-400">Sin clases agendadas para este estudiante.</p>
                </div>
              ) : (
                selectedBookings.map(b => (
                  <ClassRow key={b.id} booking={b} showDay />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
