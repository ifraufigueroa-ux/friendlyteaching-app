// FriendlyTeaching.cl — Student Schedule Page
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useScheduleStore } from '@/store/scheduleStore';
import { useBookings } from '@/hooks/useBookings';
import { usePublishedLessons } from '@/hooks/useLessons';
import TopBar from '@/components/layout/TopBar';
import type { Booking } from '@/types/firebase';

const DAY_NAMES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  confirmed:  { label: 'Confirmada', color: 'bg-[#F0E5FF] text-[#5A3D7A] border-[#C8A8DC]', icon: '✅' },
  pending:    { label: 'Pendiente',  color: 'bg-amber-50 text-amber-700 border-amber-200', icon: '⏳' },
  completed:  { label: 'Completada', color: 'bg-green-50 text-green-700 border-green-200', icon: '🎓' },
  cancelled:  { label: 'Cancelada',  color: 'bg-red-50 text-red-400 border-red-100', icon: '✗' },
};

function formatWeekRange(date: Date) {
  const end = new Date(date);
  end.setDate(end.getDate() + 5);
  return `${date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })} – ${end.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}`;
}

function formatTime(hour: number) {
  return `${hour}:00 – ${hour + 1}:00`;
}

function getWeekStart(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function StudentSchedulePage() {
  const router = useRouter();
  const { firebaseUser, role, isInitialized, profile } = useAuthStore();
  const { currentWeekStart, nextWeek, previousWeek } = useScheduleStore();

  // Get teacher UID from student profile (set at approval time)
  const teacherUid = profile?.studentData?.approvedByTeacherId ?? '';

  const { bookings, loading } = useBookings(teacherUid, currentWeekStart);
  const { lessons } = usePublishedLessons();

  useEffect(() => {
    if (isInitialized && !firebaseUser) router.replace('/auth/login');
    if (isInitialized && role === 'teacher') router.replace('/dashboard/teacher');
  }, [isInitialized, firebaseUser, role, router]);

  // Filter bookings for this student
  const myBookings = bookings.filter(b =>
    b.studentId === firebaseUser?.uid ||
    b.studentEmail === profile?.email
  );

  const upcomingBookings = myBookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
  const completedBookings = myBookings.filter(b => b.status === 'completed');

  return (
    <div className="min-h-screen bg-[#FFFCF7]">
      <TopBar
        title="Mi Horario"
        subtitle="Tus clases agendadas con tu profesor"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Mi Horario' }
        ]}
        actions={teacherUid && (
          <Link
            href="/dashboard/student/book"
            className="flex-shrink-0 px-4 py-2.5 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            + Solicitar clase
          </Link>
        )}
      />
      <div className="p-6">

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Próximas', value: upcomingBookings.length, icon: '📅', color: 'text-[#5A3D7A]' },
          { label: 'Completadas', value: completedBookings.length, icon: '🎓', color: 'text-green-600' },
          { label: 'Total clases', value: myBookings.length, icon: '📚', color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <p className="text-xl mb-0.5">{s.icon}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Week navigator */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
        <div className="flex items-center justify-between">
          <button onClick={previousWeek} className="w-8 h-8 rounded-full hover:bg-[#F0E5FF] flex items-center justify-center text-[#9B7CB8] font-bold transition-colors">‹</button>
          <div className="text-center">
            <p className="text-sm font-bold text-[#5A3D7A]">{formatWeekRange(currentWeekStart)}</p>
            <p className="text-xs text-gray-400">Semana actual</p>
          </div>
          <button onClick={nextWeek} className="w-8 h-8 rounded-full hover:bg-[#F0E5FF] flex items-center justify-center text-[#9B7CB8] font-bold transition-colors">›</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : myBookings.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-500 text-sm">No tienes clases agendadas esta semana.</p>
          <p className="text-xs text-gray-400 mt-1">Tu profesor agendará tus clases desde el panel de horario.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-[#5A3D7A] uppercase tracking-wider">Esta semana</h2>
          {myBookings
            .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.hour - b.hour)
            .map(b => {
              const cfg = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.confirmed;
              return (
                <div key={b.id} className={`bg-white rounded-2xl p-4 shadow-sm border ${cfg.color.split(' ').find(c => c.startsWith('border-')) ?? 'border-gray-100'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F0E5FF] flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-[#5A3D7A] leading-none">{DAY_NAMES[b.dayOfWeek]?.slice(0, 3)}</span>
                        <span className="text-[10px] text-[#9B7CB8]">{b.hour}:00</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#5A3D7A]">{DAY_NAMES[b.dayOfWeek]} · {formatTime(b.hour)}</p>
                        <p className="text-xs text-gray-400">
                          {b.isRecurring ? '🔁 Clase recurrente' : '📌 Clase única'}
                          {b.notes ? ` · ${b.notes}` : ''}
                        </p>
                        {b.lessonId && (() => {
                          const lesson = lessons.find(l => l.id === b.lessonId);
                          return lesson ? (
                            <p className="text-xs text-[#9B7CB8] font-medium mt-0.5">
                              📚 {lesson.code} · {lesson.title}
                            </p>
                          ) : null;
                        })()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                      {b.lessonId && b.status === 'confirmed' && (
                        <Link
                          href={`/classroom/${b.lessonId}`}
                          className="px-3 py-1.5 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-xs font-bold transition-colors"
                        >
                          Entrar →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
      </div>
    </div>
  );
}
