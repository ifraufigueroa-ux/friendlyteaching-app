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
import { useStudentPlacementAssignments } from '@/hooks/usePlacementAssignments';
import { LessonsGridSkeleton, StatCardSkeleton } from '@/components/ui/Skeleton';
import XpBar from '@/components/gamification/XpBar';
import BadgeGrid from '@/components/gamification/BadgeGrid';
import StreakDisplay from '@/components/gamification/StreakDisplay';
import BadgeUnlockToast from '@/components/gamification/BadgeUnlockToast';
import WordOfTheDay from '@/components/gamification/WordOfTheDay';
import type { Booking } from '@/types/firebase';
import { useStudentLessonPlans, type LessonPlan } from '@/hooks/useLessonPlans';
import { useStudentClassHistory, type ClassHistoryEntry } from '@/hooks/useClassHistory';

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

// ── Student class counter ─────────────────────────────────────────

function getEntryDate(entry: ClassHistoryEntry): Date {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = entry.date as any;
  return typeof raw?.toDate === 'function' ? raw.toDate() : new Date(raw?.seconds ? raw.seconds * 1000 : 0);
}

interface ClassDotPopupProps {
  entry: ClassHistoryEntry;
  onClose: () => void;
}

function ClassDotPopup({ entry, onClose }: ClassDotPopupProps) {
  const date = getEntryDate(entry);
  const dateStr = date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const topics = entry.notes?.covered?.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-5 w-full max-w-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-[#5A3D7A]">Detalle de clase</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>
        <div className="space-y-2 text-sm">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Fecha</p>
            <p className="text-gray-700 capitalize">{dateStr}</p>
          </div>
          {topics ? (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Temas</p>
              <p className="text-gray-700">{topics}</p>
            </div>
          ) : (
            <p className="text-gray-400 text-xs italic">Sin temas registrados aún.</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface StudentPlanCardProps {
  plan: LessonPlan;
  entries: ClassHistoryEntry[];
}

function StudentPlanCard({ plan, entries }: StudentPlanCardProps) {
  const [popupEntry, setPopupEntry] = useState<ClassHistoryEntry | null>(null);
  const total = plan.totalClasses;
  const done = Math.min(entries.length, total);
  const planName = plan.planName || `Plan de ${plan.totalClasses} clases`;

  return (
    <>
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-[#5A3D7A]">{planName}</p>
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {done}/{total}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {Array.from({ length: total }).map((_, i) => {
            const entry = entries[i];
            const isCompleted = i < done && !!entry;
            return (
              <button
                key={i}
                title={isCompleted ? 'Ver detalle' : undefined}
                disabled={!isCompleted}
                onClick={() => isCompleted && setPopupEntry(entry)}
                className={`w-5 h-5 rounded-full transition-transform ${
                  isCompleted
                    ? 'bg-green-400 cursor-pointer hover:scale-110 active:scale-95'
                    : 'bg-gray-200 cursor-default'
                }`}
              />
            );
          })}
        </div>
        {done > 0 && (
          <p className="text-[10px] text-gray-400">🟢 {done} registrada{done !== 1 ? 's' : ''} · toca un punto para ver el detalle</p>
        )}
      </div>
      {popupEntry && (
        <ClassDotPopup entry={popupEntry} onClose={() => setPopupEntry(null)} />
      )}
    </>
  );
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
  const { assignments: placementAssignments } = useStudentPlacementAssignments(uid);
  const studentName = profile?.fullName ?? '';
  const { plans: myPlans, loading: plansLoading } = useStudentLessonPlans(uid, teacherUid, studentName);
  const { history: myClassHistory, loading: classHistoryLoading } = useStudentClassHistory(uid, teacherUid, studentName);

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
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--gradient-hero)' }}>
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
    <div className="min-h-screen p-4 md:p-6" style={{ background: 'var(--gradient-hero)' }}>

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

      {/* Placement test banners */}
      {placementAssignments.map((assignment) => (
        <Link
          key={assignment.id}
          href={`/placement/${assignment.teacherId}?name=${encodeURIComponent(profile?.fullName ?? '')}&email=${encodeURIComponent(profile?.email ?? '')}&assignmentId=${assignment.id}`}
          className="flex items-center gap-3 mb-4 px-4 py-3.5 rounded-xl text-white shadow-lg hover:opacity-90 transition-opacity group"
          style={{ background: 'linear-gradient(135deg, #5A3D7A, #9B7CB8)' }}
        >
          <span className="text-2xl flex-shrink-0">📋</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">Test de nivel asignado</p>
            <p className="text-xs opacity-75">Tu profesor te ha pedido completar el placement test.</p>
          </div>
          <span className="text-xs font-bold bg-white/20 px-3 py-1.5 rounded-lg group-hover:bg-white/30 transition-colors flex-shrink-0 whitespace-nowrap">
            Comenzar →
          </span>
        </Link>
      ))}

      {/* ── ROW 1: Nivel + Racha | Próxima Lección ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">

        {/* Nivel + Racha card (spans 2/3) */}
        <div className="md:col-span-2 glass-card rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              {studentLevel ? (
                <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${LEVEL_COLORS[studentLevel] ?? 'bg-gray-100 text-gray-600'}`}>
                  {studentLevel}
                </span>
              ) : null}
              <div>
                <p className="text-sm font-bold text-[#5A3D7A]">
                  Hola, {firstName} 👋
                </p>
                <p className="text-xs text-gray-400">Tu portal de aprendizaje</p>
              </div>
            </div>
            {/* Racha inline */}
            {gam && (
              <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-xl flex-shrink-0">
                <span className="text-base">🔥</span>
                <div className="text-right">
                  <p className="text-sm font-bold text-orange-600 leading-none">{gam.currentStreak}</p>
                  <p className="text-[9px] text-orange-400 leading-none mt-0.5">días</p>
                </div>
              </div>
            )}
          </div>
          {/* XP bar */}
          {gam ? (
            <XpBar totalXp={gam.totalXp} level={gam.level} />
          ) : (
            <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          )}
        </div>

        {/* Próxima Lección card (spans 1/3) */}
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between">
          <p className="text-xs font-bold text-[#9B7CB8] uppercase tracking-wider mb-2">Próxima Lección</p>
          {nextBooking ? (
            <>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#5A3D7A]">
                  {DAY_NAMES[nextBooking.dayOfWeek]}
                </p>
                <p className="text-lg font-extrabold text-[#5A3D7A]">
                  {nextBooking.hour}:00 – {nextBooking.hour + 1}:00
                </p>
                {nextBooking.lessonId && (() => {
                  const l = myLessons.find(x => x.id === nextBooking.lessonId);
                  return l ? (
                    <p className="text-xs text-gray-500 mt-1 truncate">📚 {l.code} · {l.title}</p>
                  ) : null;
                })()}
                <p className="text-[10px] text-gray-400 mt-1">
                  {nextBooking.isRecurring ? '🔁 Recurrente' : '📌 Clase única'}
                </p>
              </div>
              {nextBooking.lessonId && (
                <Link
                  href={`/classroom/${nextBooking.lessonId}`}
                  className="mt-3 w-full text-center px-3 py-2 bg-gradient-to-r from-[#5A3D7A] to-[#8B5CF6] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
                >
                  Entrar →
                </Link>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-2">
              <span className="text-2xl mb-1">📅</span>
              <p className="text-xs text-gray-400">Sin clases agendadas</p>
              <Link href="/dashboard/student/schedule" className="mt-2 text-xs font-semibold text-[#9B7CB8] hover:underline">
                Ver horario →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 2: Stats (3 cards) ── */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <Link href="/dashboard/student/progress"
          className="glass-card rounded-2xl p-3 md:p-4 text-center stat-glow hover-lift">
          <p className="text-xl md:text-2xl font-bold text-[#5A3D7A]">{progressLoading ? '…' : completedLessons}</p>
          <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">Lecciones Completadas</p>
        </Link>
        <Link href="/dashboard/student/homework"
          className="glass-card rounded-2xl p-3 md:p-4 text-center stat-glow hover-lift">
          <p className={`text-xl md:text-2xl font-bold ${pendingHomework > 0 ? 'text-amber-500' : 'text-green-500'}`}>{pendingHomework}</p>
          <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">Tareas Pendientes</p>
        </Link>
        <div className="glass-card rounded-2xl p-3 md:p-4 text-center stat-glow hover-lift">
          <p className="text-xl md:text-2xl font-bold text-blue-600">{myLessons.length}</p>
          <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">Lecciones Disponibles</p>
        </div>
      </div>

      {/* ── ROW 3: Palabra del día ── */}
      {uid && (
        <div className="mb-3">
          <WordOfTheDay studentId={uid} recordWordOfDay={recordWordOfDay} />
        </div>
      )}

      {/* ── ROW 4: Mi progreso de inglés ── */}
      {(skillScores || studentLevel) && (
        <div className="glass-card rounded-2xl overflow-hidden mb-3">
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <p className="font-bold text-gray-700 text-sm">📈 Mi progreso de inglés</p>
            <Link href="/dashboard/student/progress" className="text-xs font-semibold text-[#9B7CB8] hover:text-[#5A3D7A] transition-colors">
              Ver detalle →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {studentLevel && (
              <div className="px-4 py-4">
                <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Nivel CEFR</p>
                <LevelTimeline history={levelHistory} currentLevel={studentLevel} />
              </div>
            )}
            {skillScores && (
              <div className="px-4 py-4">
                <p className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Habilidades</p>
                <SkillRadarChart scores={skillScores} compact />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ROW 5: Mis lecciones ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[#5A3D7A] uppercase tracking-wider">📚 Mis lecciones</h2>
          <Link href="/dashboard/student/progress" className="text-xs font-semibold text-[#9B7CB8] hover:text-[#5A3D7A] transition-colors">
            Ver progreso →
          </Link>
        </div>

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
          <div className="flex gap-3 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-48 flex-shrink-0 h-40 bg-white/60 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : myLessons.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center">
            <p className="text-3xl mb-3">📚</p>
            <p className="text-gray-500 text-sm">El profesor aún no ha publicado lecciones.</p>
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="glass-card rounded-2xl p-6 text-center">
            <p className="text-2xl mb-2">🔍</p>
            <p className="text-gray-500 text-sm">No hay lecciones que coincidan.</p>
            <button onClick={() => { setSearch(''); setLevelFilter(''); }}
              className="mt-2 text-xs font-semibold text-[#9B7CB8] underline">
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide -mx-4 md:-mx-6 px-4 md:px-6">
            {filteredLessons.map(lesson => {
              const isCompleted = completedLessonIds.has(lesson.id);
              const isStarted = startedLessonIds.has(lesson.id);
              const levelColor = LEVEL_COLORS[lesson.level] ?? 'bg-gray-100 text-gray-600';
              const totalSlides = lesson.slides?.length ?? 0;
              const pct = isStarted && !isCompleted ? slidePercent(lesson.id, totalSlides) : null;
              return (
                <div key={lesson.id} className="w-48 flex-shrink-0 snap-start card-interactive rounded-2xl overflow-hidden flex flex-col">
                  {/* top colour bar */}
                  {isStarted && !isCompleted && pct !== null ? (
                    <div className="h-1.5 w-full bg-gray-100 relative flex-shrink-0">
                      <div className="h-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  ) : (
                    <div className={`h-1.5 w-full flex-shrink-0 ${isCompleted ? 'bg-green-400' : 'bg-[#C8A8DC]'}`} />
                  )}
                  <div className="p-3 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-gray-400 font-medium">{lesson.code}</p>
                        <p className="text-xs font-bold text-[#5A3D7A] line-clamp-2 mt-0.5 leading-tight">{lesson.title}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${levelColor}`}>{lesson.level}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-2">
                      <span>🎴 {totalSlides}</span>
                      {lesson.duration && <span>⏱️ {lesson.duration}m</span>}
                    </div>
                    {pct !== null && (
                      <p className="text-[10px] text-amber-500 font-semibold mb-2">{pct}% visto</p>
                    )}
                    <div className="mt-auto">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full block text-center mb-2 ${
                        isCompleted ? 'bg-green-100 text-green-700' :
                        isStarted ? 'bg-amber-100 text-amber-700' :
                        'bg-[#F0E5FF] text-[#5A3D7A]'
                      }`}>
                        {isCompleted ? '✅ Completada' : isStarted ? '⏳ En progreso' : '📖 Nueva'}
                      </span>
                      <Link href={`/classroom/${lesson.id}`}
                        className="block w-full text-center px-2 py-1.5 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-[10px] font-bold transition-colors">
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

      {/* Badge unlock toast */}
      <BadgeUnlockToast badgeIds={newBadges} onDismiss={dismissBadges} />
    </div>
  );
}
