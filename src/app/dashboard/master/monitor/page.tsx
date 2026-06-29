// FriendlyTeaching.cl — Master monitoring view (read-only teacher view)
'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useBookings } from '@/hooks/useBookings';
import { useScheduleStore } from '@/store/scheduleStore';
import WeekNavigator from '@/components/schedule/WeekNavigator';
import type { Booking } from '@/types/firebase';
import {
  collection, query, where, getDocs,
  type QueryDocumentSnapshot, type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { FTUser } from '@/types/firebase';

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 9); // 9–21

function slotKey(dow: number, hour: number): string {
  return `${dow}-${hour}`;
}

function MonitorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role } = useAuthStore();
  const { currentWeekStart } = useScheduleStore();

  const teacherId = searchParams.get('tid') ?? '';
  const teacherName = decodeURIComponent(searchParams.get('name') ?? 'Profesor');

  const [students, setStudents] = useState<FTUser[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);

  const { bookings, loading: bookingsLoading } = useBookings(teacherId, currentWeekStart);

  useEffect(() => {
    if (role && role !== 'master') {
      router.replace('/dashboard');
      return;
    }
    if (!teacherId) {
      router.replace('/dashboard/master');
      return;
    }
  }, [role, teacherId, router]);

  useEffect(() => {
    if (!teacherId) return;
    setStudentsLoading(true);
    getDocs(query(collection(db, 'users'), where('role', '==', 'student')))
      .then((snap: import('firebase/firestore').QuerySnapshot<DocumentData>) => {
        const all = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ uid: d.id, ...d.data() } as FTUser));
        const approvedForThisTeacher = all.filter((s: FTUser) => {
          const aid = s.studentData?.approvedByTeacherId;
          return s.status === 'approved' && aid === teacherId;
        });
        approvedForThisTeacher.sort((a: FTUser, b: FTUser) => a.fullName.localeCompare(b.fullName));
        setStudents(approvedForThisTeacher);
      })
      .catch((err: unknown) => console.error('monitor students:', err))
      .finally(() => setStudentsLoading(false));
  }, [teacherId]);

  // Build booking map keyed by "dow-hour"
  const bookingMap = useMemo(() => {
    const map: Record<string, Booking> = {};
    const currentWeekMs = (() => {
      const d = new Date(currentWeekStart);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })();

    const best: Record<string, { b: Booking; priority: number; diff: number }> = {};

    bookings.forEach((b) => {
      if (b.status === 'cancelled') return;
      const ws = b.weekStart as unknown as { toDate?: () => Date; seconds?: number };
      const wsMs = ws
        ? typeof ws.toDate === 'function'
          ? ws.toDate().getTime()
          : (ws.seconds ?? 0) * 1000
        : 0;
      const diff = Math.abs(wsMs - currentWeekMs);
      const isCurrent = diff < 1000;
      let priority: number;
      if (isCurrent) priority = 0;
      else if (b.status === 'confirmed') priority = 1;
      else return;

      const key = slotKey(b.dayOfWeek, b.hour);
      const prev = best[key];
      if (!prev || priority < prev.priority || (priority === prev.priority && diff < prev.diff)) {
        best[key] = { b, priority, diff };
      }
    });

    Object.values(best).forEach(({ b }) => {
      map[slotKey(b.dayOfWeek, b.hour)] = b;
    });
    return map;
  }, [bookings, currentWeekStart]);

  const loading = bookingsLoading || studentsLoading;

  return (
    <div className="flex flex-col h-full">
      {/* Monitor banner */}
      <div className="bg-[#5A3D7A] text-white px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-lg">👁️</span>
          <div>
            <p className="text-xs opacity-70 font-medium">Monitoreando</p>
            <p className="font-bold">{teacherName}</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/dashboard/master')}
          className="text-sm font-semibold px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
        >
          ← Volver
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Week navigator */}
          <div className="flex items-center">
            <WeekNavigator />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Schedule grid (simplified read-only) */}
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-50">
                  <p className="font-bold text-gray-700 text-sm">Horario semanal</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-sm">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 w-14">Hora</th>
                        {DAY_NAMES.map((d) => (
                          <th key={d} className="px-2 py-2 text-center text-xs font-bold text-[#5A3D7A]">{d}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {HOURS.map((hour) => (
                        <tr key={hour} className="border-t border-gray-50">
                          <td className="px-3 py-1.5 text-xs text-gray-400 font-medium">{hour}:00</td>
                          {[1, 2, 3, 4, 5, 6].map((dow) => {
                            const booking = bookingMap[slotKey(dow, hour)];
                            return (
                              <td key={dow} className="px-1 py-1">
                                {booking ? (
                                  <div className={`rounded-lg px-2 py-1.5 text-center text-xs font-semibold truncate ${
                                    booking.bookingType === 'interview'
                                      ? 'bg-[#FFB347] text-white'
                                      : booking.status === 'completed'
                                        ? 'bg-gray-100 text-gray-500'
                                        : booking.isRecurring
                                          ? 'bg-[#C8A8DC] text-white'
                                          : 'bg-[#FFB8D9] text-[#5A3D7A]'
                                  }`}>
                                    {booking.studentName.split(' ')[0]}
                                  </div>
                                ) : (
                                  <div className="h-7" />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Students list */}
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                  <p className="font-bold text-gray-700 text-sm">Estudiantes activos ({students.length})</p>
                </div>
                {students.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-8">Sin estudiantes aprobados.</p>
                ) : (
                  <ul className="divide-y divide-gray-50">
                    {students.map((s) => {
                      const level = (s as FTUser & { studentData?: { level?: string } }).studentData?.level;
                      return (
                        <li key={s.uid} className="flex items-center justify-between px-4 py-3">
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{s.fullName}</p>
                            <p className="text-xs text-gray-400">{s.email}</p>
                          </div>
                          {level && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">
                              {level}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Booking stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Clases esta semana', value: Object.values(bookingMap).filter(b => b.bookingType !== 'interview').length },
                  { label: 'Recurrentes', value: Object.values(bookingMap).filter(b => b.isRecurring).length },
                  { label: 'Entrevistas', value: Object.values(bookingMap).filter(b => b.bookingType === 'interview').length },
                  { label: 'Estudiantes', value: students.length },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm text-center">
                    <p className="text-2xl font-extrabold text-gray-800">{value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MonitorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MonitorContent />
    </Suspense>
  );
}
