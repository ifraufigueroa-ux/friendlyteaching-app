// FriendlyTeaching.cl — Student Dashboard (full rebuild with real data)
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useStudentProgress } from '@/hooks/useProgress';
import { useStudentHomework } from '@/hooks/useHomework';
import { useBookings } from '@/hooks/useBookings';
import { usePublishedLessons } from '@/hooks/useLessons';
import { useStudentActiveSessions } from '@/hooks/useLiveSession';
import { useSkillAssessments } from '@/hooks/useSkillAssessments';
import { useLevelHistory } from '@/hooks/useLevelHistory';
import { SkillRadarChart } from '@/components/students/SkillRadarChart';
import { LevelTimeline } from '@/components/students/LevelTimeline';
import { useGamification } from '@/hooks/useGamification';
import { LessonsGridSkeleton, StatCardSkeleton } from '@/components/ui/Skeleton';
import XpBar from '@/components/gamification/XpBar';
import BadgeGrid from '@/components/gamification/BadgeGrid';
import StreakDisplay from '@/components/gamification/StreakDisplay';
import BadgeUnlockToast from '@/components/gamification/BadgeUnlockToast';
import WordOfTheDay from '@/components/gamification/WordOfTheDay';
import type { Booking } from '@/types/firebase';

const DAY_NAMES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

const LEVEL_COLORS: Record<string, string> = {
  A0: 'bg-gray-100 text-gray-600',
  A1: 'bg-blue-100 text-blue-700',
  A2: 'bg-sky-100 text-sky-700',
  B1: 'bg-green-100 text-green-700',
  'B1+': 'bg-emerald-100 text-emerald-700',
  B2: 'bg-amber-100 text-amber-700',
  C1: 'bg-purple-100 text-purple-700',
};

// Ordered list of levels — used for filtering lessons up to the student's level
const LEVELS_ORDER = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];
function levelsUpTo(level: string): string[] {
  const idx = LEVELS_ORDER.indexOf(level);
  return idx === -1 ? LEVELS_ORDER : LEVELS_ORDER.slice(0, idx + 1);
}

export default function StudentDashboardPage() {
  const { profile, firebaseUser } = useAuthStore();
  const uid = firebaseUser?.uid ?? '';
  const teacherUid = profile?.studentData?.approvedByTeacherId ?? '';
  const studentLevel = profile?.studentData?.level;

  const { progress, loading: progressLoading } = useStudentProgress(uid);
  const { homework } = useStudentHomework(uid);
  const { bookings } = useBookings(teacherUid, getWeekStart());
  const { activeSessions } = useStudentActiveSessions();
  // Fetch ALL published lessons — filter to student's level range client-side
  // (server-side level== filter would miss lower-level lessons a B1 student should see)
  const { lessons, loading: lessonsLoading } = usePublishedLessons();
  // Skill gap analysis + level history — uses teacher UID as second param
  const { averageScores: skillScores } = useSkillAssessments(uid, teacherUid);
  const { history: levelHistory } = useLevelHistory(uid, teacherUid);
  const { gamification: gam, newBadges, dismissBadges, recordDailyLogin, recordWordOfDay } = useGamification(uid);

  // Record daily login XP (once)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (uid) recordDailyLogin(); }, [uid]);

  const isPending = profile?.status === 'pending';
  const firstName = profile?.fullName?.split(' ')[0] ?? 'Estudiante';

  const completedLessons = new Set(progress.filter(p => p.status === 'completed').map(p => p.lessonId)).size;
  const pendingHomework = homework.filter(h => h.status === 'assigned' || h.status === 'pending').length;

  const myBookings = bookings.filter(b => b.studentId === uid || b.studentEmail === profile?.email);
  const nextBooking = myBookings
    .filter(b => b.status === 'confirmed' || b.status === 'pending')
    .sort((a: Booking, b: Booking) => a.dayOfWeek - b.dayOfWeek || a.hour - b.hour)[0] as Booking | undefined;

  // Show all published lessons up to (and including) the student's level.
  // e.g. a B1 student sees A0, A1, A2, and B1 lessons.
  const allowedLevels = studentLevel ? new Set(levelsUpTo(studentLevel)) : null;
  const myLessons = lessons.filter(l =>
    l.isPublished && (!allowedLevels || !l.level || allowedLevels.has(l.level))
  );

  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('');

  const startedLessonIds = new Set(progress.map(p => p.lessonId));
  const completedLessonIds = new Set(progress.filter(p => p.status === 'completed').map(p => p.lessonId));

  // Compute slide completion % for in-progress lessons
  function slidePercent(lessonId: string, totalSlides: number): number | null {
    if (totalSlides === 0) return null;
    const lp = progress.filter(p => p.lessonId === lessonId && p.status === 'in_progress');
    if (lp.length === 0) return null;
    const best = lp.reduce((a, b) => ((a.slideProgress?.length ?? 0) > (b.slideProgress?.length ?? 0) ? a : b));
    const done = best.slideProgress?.length ?? 0;
    return Math.round((done / totalSlides) * 100);
  }

  // Available levels from student's lesson set (for filter chips)
  const availableLevels = [...new Set(myLessons.map(l => l.level).filter(Boolean))].sort(
    (a, b) => LEVELS_ORDER.indexOf(a ?? '') - LEVELS_ORDER.indexOf(b ?? '')
  );

  // Apply search + level filter
  const filteredLessons = myLessons.filter(l => {
    const matchSearch = !search ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase());
    const matchLevel = !levelFilter || l.level === levelFilter;
    return matchSearch && matchLevel;
  });

  if (isPending) {
    return (
      <div className="min-h-screen bg-[#FFFCF7] flex items-center justify-center p-6">
        <div className="glass-card rounded-2xl p-8 text-center max-w-md w-full shadow-glass-lg">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-xl font-bold text-[#5A3D7A] mb-2">Cuenta pendiente de aprobación</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Tu cuenta está siendo revisada por el profesor. Una vez aprobada, tendrás acceso
            a todas las lecciones, horarios y materiales.
          </p>
          <div className="mt-6 bg-[#F0E5FF] rounded-xl p-4">
            <p className="text-xs text-[#5A3D7A] font-medium">
              📧 Recibirás un correo cuando tu cuenta sea aprobada.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh p-6">

      {/* ── Live session banner ── */}
      {activeSessions.map((session) => (
        <Link
          key={session.id}
          href={`/dashboard/student/live/${session.lessonId}`}
          className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl bg-red-600 text-white shadow-lg hover:bg-red-700 transition-colors group"
        >
          <span className="w-3 h-3 rounded-full bg-white animate-pulse flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">📺 Clase en vivo activa</p>
            <p className="text-xs text-red-200 truncate">{session.lessonTitle}</p>
          </div>
          <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-lg group-hover:bg-white/30 transition-colors flex-shrink-0">
            Unirse →
          </span>
        </Link>
      ))}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gradient-purple">Hola, {firstName} 👋</h1>
          <p className="text-gray-500 text-sm mt-0.5">Tu portal de aprendizaje de inglés</p>
        </div>
        {studentLevel && (
          <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${LEVEL_COLORS[studentLevel] ?? 'bg-gray-100 text-gray-600'}`}>
            Nivel {studentLevel}
          </span>
        )}
      </div>

      {/* Gamification: XP bar + streak */}
      {gam && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <XpBar totalXp={gam.totalXp} level={gam.level} />
          <StreakDisplay
            currentStreak={gam.currentStreak}
            longestStreak={gam.longestStreak}
            weeklyXp={gam.weeklyXp}
          />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="glass-card rounded-2xl p-4 text-center stat-glow hover-lift">
          <p className="text-2xl font-bold text-[#5A3D7A]">{progressLoading ? '…' : completedLessons}</p>
          <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">Lecciones completadas</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center stat-glow hover-lift">
          <p className={`text-2xl font-bold ${pendingHomework > 0 ? 'text-amber-500' : 'text-green-500'}`}>{pendingHomework}</p>
          <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">Tareas pendientes</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center stat-glow hover-lift">
          <p className="text-2xl font-bold text-blue-600">{myLessons.length}</p>
          <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">Lecciones disponibles</p>
        </div>
      </div>

      {/* Next class banner */}
      {nextBooking && (
        <div className="bg-gradient-to-r from-[#5A3D7A] to-[#8B5CF6] rounded-2xl p-4 mb-6 shadow-glass-lg">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-white/80 font-medium uppercase tracking-wider mb-1">Próxima clase</p>
              <p className="text-white font-bold text-lg">
                {DAY_NAMES[nextBooking.dayOfWeek]} · {nextBooking.hour}:00 – {nextBooking.hour + 1}:00
              </p>
              {nextBooking.lessonId && (() => {
                const l = myLessons.find(x => x.id === nextBooking.lessonId);
                return l ? (
                  <p className="text-white font-semibold text-sm mt-0.5 truncate">📚 {l.code} · {l.title}</p>
                ) : null;
              })()}
              <p className="text-white/70 text-xs mt-0.5">
                {nextBooking.isRecurring ? '🔁 Recurrente' : '📌 Clase única'}
                {nextBooking.notes ? ` · ${nextBooking.notes}` : ''}
              </p>
            </div>
            {nextBooking.lessonId && (
              <Link
                href={`/classroom/${nextBooking.lessonId}`}
                className="flex-shrink-0 px-5 py-2.5 bg-white text-[#5A3D7A] rounded-xl text-sm font-bold hover:bg-white/90 transition-colors shadow-sm"
              >
                Entrar →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Pending homework alert — with urgency */}
      {pendingHomework > 0 && (() => {
        const pendingHw = homework.filter(h => h.status === 'assigned' || h.status === 'pending');
        const now = new Date();
        // Find nearest deadline
        const nearest = pendingHw.reduce((best, h) => {
          const due = h.dueDate && typeof (h.dueDate as unknown as { toDate?: () => Date }).toDate === 'function'
            ? (h.dueDate as unknown as { toDate: () => Date }).toDate()
            : h.dueDate ? new Date((h.dueDate as unknown as { seconds: number }).seconds * 1000) : null;
          if (!due) return best;
          if (!best.date || due < best.date) return { date: due, title: h.title };
          return best;
        }, { date: null as Date | null, title: '' });
        const hoursLeft = nearest.date ? Math.max(0, Math.floor((nearest.date.getTime() - now.getTime()) / (1000 * 60 * 60))) : null;
        const isUrgent = hoursLeft !== null && hoursLeft < 24;
        const isOverdue = hoursLeft !== null && hoursLeft === 0 && nearest.date && nearest.date < now;

        return (
          <div className={`rounded-2xl p-4 mb-6 shadow-glass border backdrop-blur-sm ${
            isOverdue
              ? 'bg-red-50/80 border-red-300/60'
              : isUrgent
                ? 'bg-orange-50/80 border-orange-300/60 animate-pulse'
                : 'bg-amber-50/80 border-amber-200/60'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={`text-sm font-bold ${isOverdue ? 'text-red-700' : isUrgent ? 'text-orange-700' : 'text-amber-700'}`}>
                  {isOverdue ? '🚨' : isUrgent ? '⏰' : '📝'} {pendingHomework} tarea{pendingHomework > 1 ? 's' : ''} pendiente{pendingHomework > 1 ? 's' : ''}
                </p>
                {nearest.date && (
                  <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-600 font-bold' : isUrgent ? 'text-orange-600' : 'text-amber-600'}`}>
                    {isOverdue
                      ? `¡"${nearest.title}" está vencida!`
                      : isUrgent
                        ? `"${nearest.title}" vence en ${hoursLeft}h`
                        : `Próxima entrega: ${nearest.date.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}`
                    }
                  </p>
                )}
              </div>
              <Link href="/dashboard/student/homework"
                className={`flex-shrink-0 px-4 py-2 text-white rounded-xl text-xs font-bold transition-colors ${
                  isOverdue ? 'bg-red-500 hover:bg-red-600' : isUrgent ? 'bg-orange-500 hover:bg-orange-600' : 'bg-amber-500 hover:bg-amber-600'
                }`}>
                {isOverdue ? '¡Entregar!' : 'Ver tareas'}
              </Link>
            </div>
          </div>
        );
      })()}

      {/* ── Word of the Day ── */}
      {uid && (
        <div className="mb-6">
          <WordOfTheDay
            studentId={uid}
            recordWordOfDay={recordWordOfDay}
          />
        </div>
      )}

      {/* ── My Progress ── */}
      {(skillScores || studentLevel) && (
        <div className="glass-card rounded-2xl overflow-hidden mb-6">
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <p className="font-bold text-gray-700 text-sm">📈 Mi progreso de inglés</p>
            <Link href="/dashboard/student/progress" className="text-xs font-semibold text-[#9B7CB8] hover:text-[#5A3D7A] transition-colors">
              Ver detalle →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {/* Level timeline (compact) */}
            {studentLevel && (
              <div className="px-4 py-4">
                <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Nivel CEFR</p>
                <LevelTimeline
                  history={levelHistory}
                  currentLevel={studentLevel}
                />
              </div>
            )}
            {/* Skill radar (compact) */}
            {skillScores && (
              <div className="px-4 py-4">
                <p className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Habilidades</p>
                <SkillRadarChart scores={skillScores} compact />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lessons grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[#5A3D7A] uppercase tracking-wider">Mis lecciones</h2>
          <Link href="/dashboard/student/progress" className="text-xs font-semibold text-[#9B7CB8] hover:text-[#5A3D7A] transition-colors">
            Ver progreso →
          </Link>
        </div>

        {/* Search + level filter */}
        {!lessonsLoading && myLessons.length > 0 && (
          <div className="space-y-2 mb-4">
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar lección..."
              className="w-full px-4 py-2 border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] bg-white/70 backdrop-blur-sm shadow-glass"
            />
            {availableLevels.length > 1 && (
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => setLevelFilter('')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    !levelFilter ? 'bg-[#C8A8DC] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-[#C8A8DC]'
                  }`}
                >
                  Todos
                </button>
                {availableLevels.map(l => (
                  <button
                    key={l}
                    onClick={() => setLevelFilter(levelFilter === l ? '' : (l ?? ''))}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      levelFilter === l
                        ? 'bg-[#C8A8DC] text-white'
                        : `${LEVEL_COLORS[l ?? ''] ?? 'bg-gray-100 text-gray-500'} opacity-80 hover:opacity-100`
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {lessonsLoading ? (
          <LessonsGridSkeleton count={4} />
        ) : myLessons.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center">
            <p className="text-3xl mb-3">📚</p>
            <p className="text-gray-500 text-sm">El profesor aún no ha publicado lecciones.</p>
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <p className="text-2xl mb-2">🔍</p>
            <p className="text-gray-500 text-sm">No hay lecciones que coincidan con tu búsqueda.</p>
            <button onClick={() => { setSearch(''); setLevelFilter(''); }}
              className="mt-3 text-xs font-semibold text-[#9B7CB8] underline">
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLessons.map(lesson => {
              const isCompleted = completedLessonIds.has(lesson.id);
              const isStarted = startedLessonIds.has(lesson.id);
              const levelColor = LEVEL_COLORS[lesson.level] ?? 'bg-gray-100 text-gray-600';
              const totalSlides = lesson.slides?.length ?? 0;
              const pct = isStarted && !isCompleted ? slidePercent(lesson.id, totalSlides) : null;
              return (
                <div key={lesson.id} className="card-interactive rounded-2xl overflow-hidden">
                  {/* Top progress bar */}
                  {isStarted && !isCompleted && pct !== null ? (
                    <div className="h-1.5 w-full bg-gray-100 relative">
                      <div className="h-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  ) : (
                    <div className={`h-1.5 w-full ${isCompleted ? 'bg-green-400' : 'bg-[#C8A8DC]'}`} />
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-400 font-medium">{lesson.code}</p>
                        <p className="text-sm font-bold text-[#5A3D7A] truncate mt-0.5">{lesson.title}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${levelColor}`}>{lesson.level}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                      <span>🎴 {totalSlides} slides</span>
                      {lesson.duration && <span>⏱️ {lesson.duration} min</span>}
                      {pct !== null && <span className="text-amber-500 font-semibold">{pct}% visto</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCompleted ? 'bg-green-100 text-green-700' :
                        isStarted ? 'bg-amber-100 text-amber-700' :
                        'bg-[#F0E5FF] text-[#5A3D7A]'
                      }`}>
                        {isCompleted ? '✅ Completada' : isStarted ? '⏳ En progreso' : '📖 Nueva'}
                      </span>
                      <Link href={`/classroom/${lesson.id}`}
                        className="px-3 py-1.5 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-xs font-bold transition-colors">
                        {isCompleted ? 'Repasar' : isStarted ? 'Continuar' : 'Abrir'}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Gamification: Badges */}
      {gam && gam.badges.length > 0 && (
        <div className="mb-6">
          <BadgeGrid earnedBadges={gam.badges} />
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
        <Link href="/dashboard/student/homework" className="glass-card rounded-2xl p-4 flex items-center gap-3 hover-lift">
          <span className="text-2xl">📝</span>
          <div>
            <p className="text-sm font-bold text-[#5A3D7A]">Mis Tareas</p>
            <p className="text-xs text-gray-400">{pendingHomework} pendiente{pendingHomework !== 1 ? 's' : ''}</p>
          </div>
        </Link>
        <Link href="/dashboard/student/schedule" className="glass-card rounded-2xl p-4 flex items-center gap-3 hover-lift">
          <span className="text-2xl">📅</span>
          <div>
            <p className="text-sm font-bold text-[#5A3D7A]">Mi Horario</p>
            <p className="text-xs text-gray-400">{myBookings.length} clase{myBookings.length !== 1 ? 's' : ''} esta semana</p>
          </div>
        </Link>
      </div>

      {/* Badge unlock toast */}
      <BadgeUnlockToast badgeIds={newBadges} onDismiss={dismissBadges} />
    </div>
  );
}
