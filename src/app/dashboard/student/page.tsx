// FriendlyTeaching.cl — Student Dashboard (full rebuild with real data)
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, Mail, Tv, ClipboardList, Flame, BookOpen, Calendar, TrendingUp, Video, Play, Lock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useStudentProgress } from '@/hooks/useProgress';
import { useStudentHomework } from '@/hooks/useHomework';
import { useBookings } from '@/hooks/useBookings';
import { usePublishedLessons } from '@/hooks/useLessons';
import { useStudentAssignments } from '@/hooks/useStudentAssignments';
import { useStudentMovieLessons } from '@/hooks/useMovieLessons';
import { useStudentMusicLessons } from '@/hooks/useMusicLessons';
import { useStudentTextLessons } from '@/hooks/useTextLessons';
import { useStudentListeningAssignments } from '@/hooks/useFriendlisteningAssignments';
import { useStudentWritingAssignments } from '@/hooks/useFriendlywritingAssignments';
import { useStudentActiveSessions } from '@/hooks/useLiveSession';
import { useSkillAssessments } from '@/hooks/useSkillAssessments';
import { useLevelHistory } from '@/hooks/useLevelHistory';
import { SkillRadarChart } from '@/components/students/SkillRadarChart';
import { LevelTimeline } from '@/components/students/LevelTimeline';
import { useGamification } from '@/hooks/useGamification';
import { useStudentPlacementAssignments } from '@/hooks/usePlacementAssignments';
import XpBar from '@/components/gamification/XpBar';
import BadgeUnlockToast from '@/components/gamification/BadgeUnlockToast';
import WordOfTheDay from '@/components/gamification/WordOfTheDay';
import type { Booking } from '@/types/firebase';

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

export default function StudentDashboardPage() {
  const { profile, firebaseUser } = useAuthStore();
  const uid = firebaseUser?.uid ?? '';
  const teacherUid = profile?.studentData?.approvedByTeacherId ?? '';
  const studentLevel = profile?.studentData?.level;

  const { progress, loading: progressLoading } = useStudentProgress(uid);
  const { homework } = useStudentHomework(uid);
  const { bookings } = useBookings(teacherUid, getWeekStart());
  const { activeSessions } = useStudentActiveSessions();
  // Full librería only needed to resolve nextBooking.lessonId → title/code.
  const { lessons } = usePublishedLessons();
  // Assigned material feeds — same fuentes que /dashboard/student/lessons.
  // Sirven para el contador "Lecciones Disponibles" del stat card.
  const { assignments: myAssignments } = useStudentAssignments(uid);
  const { lessons: myMovieLessons }    = useStudentMovieLessons(uid);
  const { lessons: myMusicLessons }    = useStudentMusicLessons(teacherUid, uid);
  const { lessons: myTextLessons }     = useStudentTextLessons(uid);
  const { assignments: myListeningAssignments } = useStudentListeningAssignments(uid);
  const { assignments: myWritingAssignments }   = useStudentWritingAssignments(uid);
  // Skill gap analysis + level history — uses teacher UID as second param
  const { averageScores: skillScores } = useSkillAssessments(uid, teacherUid);
  const { history: levelHistory } = useLevelHistory(uid, teacherUid);
  const { gamification: gam, newBadges, dismissBadges, recordDailyLogin, recordWordOfDay } = useGamification(uid);
  const { assignments: placementAssignments } = useStudentPlacementAssignments(uid);

  // Record daily login XP (once)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (uid) recordDailyLogin(); }, [uid]);

  const isPending = profile?.status === 'pending';
  const firstName = profile?.fullName?.split(' ')[0] ?? 'Student';

  // Completed lessons — union across every surface that can mark
  // a lesson done, deduplicated per FT lesson id so an assignment and
  // a progress record pointing at the same lesson don't double-count.
  // Previous build only read `progress`, so lessons marked completed
  // via the assignment status (common for listenings/writings and for
  // FT-library assignments without classroom progress) read as zero.
  const completedFTLessonIds = new Set<string>();
  for (const p of progress) if (p.status === 'completed') completedFTLessonIds.add(p.lessonId);
  for (const a of myAssignments) {
    if (a.source === 'lesson' && a.status === 'completed' && a.refId) completedFTLessonIds.add(a.refId);
  }
  const completedExternal   = myAssignments.filter(a => a.source !== 'lesson' && a.status === 'completed').length;
  const completedListenings = myListeningAssignments.filter(a => a.status === 'completed').length;
  const completedWritings   = myWritingAssignments.filter(a => a.status === 'completed').length;
  const completedLessons = completedFTLessonIds.size + completedExternal + completedListenings + completedWritings;

  const pendingHomework = homework.filter(h => h.status === 'assigned' || h.status === 'pending').length;

  const myBookings = bookings.filter(b => b.studentId === uid || b.studentEmail === profile?.email);
  const nextBooking = myBookings
    .filter(b => b.status === 'confirmed' || b.status === 'pending')
    .sort((a: Booking, b: Booking) => a.dayOfWeek - b.dayOfWeek || a.hour - b.hour)[0] as Booking | undefined;

  // Total de material efectivamente asignado — mismo conjunto de fuentes
  // que /dashboard/student/lessons, para que ambos contadores coincidan.
  const totalAssignedLessons =
    myAssignments.length
    + myMovieLessons.length
    + myMusicLessons.length
    + myTextLessons.length
    + myListeningAssignments.length
    + myWritingAssignments.length;

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--gradient-hero)' }}>
        <div className="glass-card rounded-2xl p-8 text-center max-w-md w-full shadow-glass-lg">
          <div className="mb-4 flex justify-center text-[#5A3D7A]"><Clock className="w-12 h-12" strokeWidth={2} /></div>
          <h2 className="text-xl font-bold text-[#5A3D7A] mb-2">Account awaiting approval</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Your account is being reviewed by your teacher. Once it's approved,
            you'll have access to all your lessons, schedule, and materials.
          </p>
          <div className="mt-6 bg-[#F0E5FF] rounded-xl p-4">
            <p className="text-xs text-[#5A3D7A] font-medium inline-flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" strokeWidth={2.25} /> You'll get an email once your account is approved.
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
            <p className="text-sm font-bold inline-flex items-center gap-1.5"><Tv className="w-4 h-4" strokeWidth={2.25} /> Live class in session</p>
            <p className="text-xs text-red-200 truncate">{session.lessonTitle}</p>
          </div>
          <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-lg group-hover:bg-white/30 transition-colors flex-shrink-0">
            Join →
          </span>
        </Link>
      ))}

      {/* Placement test banners */}
      {placementAssignments.map((assignment) => {
        const isSuite = Array.isArray(assignment.components) && assignment.components.length > 0;
        const base = isSuite ? '/placement-suite' : '/placement';
        return (
          <Link
            key={assignment.id}
            href={`${base}/${assignment.teacherId}?name=${encodeURIComponent(profile?.fullName ?? '')}&email=${encodeURIComponent(profile?.email ?? '')}&assignmentId=${assignment.id}`}
            className="flex items-center gap-3 mb-4 px-4 py-3.5 rounded-xl text-white shadow-lg hover:opacity-90 transition-opacity group"
            style={{ background: 'linear-gradient(135deg, #5A3D7A, #9B7CB8)' }}
          >
            <span className="flex-shrink-0"><ClipboardList className="w-6 h-6" strokeWidth={2.25} /></span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">
                {isSuite ? 'Full placement test assigned' : 'Level test assigned'}
              </p>
              <p className="text-xs opacity-75">
                {isSuite
                  ? `Your teacher asked you to complete ${assignment.components!.length} component${assignment.components!.length !== 1 ? 's' : ''}.`
                  : 'Your teacher asked you to complete the placement test.'}
              </p>
            </div>
            <span className="text-xs font-bold bg-white/20 px-3 py-1.5 rounded-lg group-hover:bg-white/30 transition-colors flex-shrink-0 whitespace-nowrap">
              Start →
            </span>
          </Link>
        );
      })}

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
                  Hi, {firstName}
                </p>
                <p className="text-xs text-gray-400">Your learning portal</p>
              </div>
            </div>
            {/* Racha inline */}
            {gam && (
              <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-xl flex-shrink-0">
                <Flame className="w-4 h-4 text-orange-500" strokeWidth={2.25} />
                <div className="text-right">
                  <p className="text-sm font-bold text-orange-600 leading-none">{gam.currentStreak}</p>
                  <p className="text-[9px] text-orange-400 leading-none mt-0.5">days</p>
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
          <p className="text-xs font-bold text-[#9B7CB8] uppercase tracking-wider mb-2">Next class</p>
          {nextBooking ? (
            <NextClassCardBody
              booking={nextBooking}
              lessonTitle={nextBooking.lessonId ? (() => {
                const l = lessons.find(x => x.id === nextBooking.lessonId);
                return l ? `${l.code} · ${l.title}` : null;
              })() : null}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-2">
              <Calendar className="w-6 h-6 mb-1 text-[#9B7CB8]" strokeWidth={2.25} />
              <p className="text-xs text-gray-400">No scheduled classes</p>
              <Link href="/dashboard/student/schedule" className="mt-2 text-xs font-semibold text-[#9B7CB8] hover:underline">
                View schedule →
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
          <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">Completed lessons</p>
        </Link>
        <Link href="/dashboard/student/homework"
          className="glass-card rounded-2xl p-3 md:p-4 text-center stat-glow hover-lift">
          <p className={`text-xl md:text-2xl font-bold ${pendingHomework > 0 ? 'text-amber-500' : 'text-green-500'}`}>{pendingHomework}</p>
          <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">Pending homework</p>
        </Link>
        <Link href="/dashboard/student/lessons"
          className="glass-card rounded-2xl p-3 md:p-4 text-center stat-glow hover-lift">
          <p className="text-xl md:text-2xl font-bold text-blue-600">{totalAssignedLessons}</p>
          <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">Assigned lessons</p>
        </Link>
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
            <p className="font-bold text-gray-700 text-sm inline-flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-[#5A3D7A]" strokeWidth={2.25} /> My English progress</p>
            <Link href="/dashboard/student/progress" className="text-xs font-semibold text-[#9B7CB8] hover:text-[#5A3D7A] transition-colors">
              See details →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {studentLevel && (
              <div className="px-4 py-4">
                <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">CEFR level</p>
                <LevelTimeline history={levelHistory} currentLevel={studentLevel} />
              </div>
            )}
            {skillScores && (
              <div className="px-4 py-4">
                <p className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">Skills</p>
                <SkillRadarChart scores={skillScores} compact />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Badge unlock toast */}
      <BadgeUnlockToast badgeIds={newBadges} onDismiss={dismissBadges} />
    </div>
  );
}

// ─── Next Class card body ────────────────────────────────────
//
// Two actions: Join Meeting (Google Meet link, activates exactly 1
// minute before class start, stays active for the hour of class) and
// Join Lesson (open the classroom lesson). Replaces the old
// Recurring / One-off label row.

const MEET_URL = 'https://meet.google.com/rhq-agda-ajs';
const MEET_EARLY_MS = 60_000;       // can join 1 min before start
const MEET_LATE_MS  = 60 * 60_000;  // keep active for 1h after start

function computeClassStart(booking: Booking): Date | null {
  const ws = booking.weekStart?.toDate?.();
  if (!ws) return null;
  const d = new Date(ws);
  // weekStart is Monday 00:00; dayOfWeek is 1 (Mon) .. 6 (Sat).
  d.setDate(d.getDate() + (booking.dayOfWeek - 1));
  d.setHours(booking.hour ?? 0, booking.minute ?? 0, 0, 0);
  return d;
}

function NextClassCardBody({ booking, lessonTitle }: { booking: Booking; lessonTitle: string | null }) {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    // Tick every 15s so the 1-minute gate flips to active without the
    // student needing to refresh.
    const id = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  const start = computeClassStart(booking);
  const msUntilStart = start ? start.getTime() - now : Infinity;
  const meetingActive = msUntilStart <= MEET_EARLY_MS && msUntilStart >= -MEET_LATE_MS;

  // Friendly countdown for the hint row
  const countdown = (() => {
    if (!start)                   return null;
    if (msUntilStart < -MEET_LATE_MS) return 'Clase finalizada';
    if (meetingActive)            return 'Reunión disponible';
    if (msUntilStart < 60 * 60_000) {
      const mins = Math.max(0, Math.round(msUntilStart / 60_000));
      return `Disponible en ${mins} min`;
    }
    const hrs = Math.floor(msUntilStart / 3_600_000);
    if (hrs < 24) return `Disponible en ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `Disponible en ${days}d`;
  })();

  return (
    <>
      <div className="flex-1">
        <p className="text-sm font-bold text-[#5A3D7A]">
          {DAY_NAMES[booking.dayOfWeek]}
        </p>
        <p className="text-lg font-extrabold text-[#5A3D7A]">
          {booking.hour}:00 – {booking.hour + 1}:00
        </p>
        {lessonTitle && (
          <p className="text-xs text-gray-500 mt-1 truncate inline-flex items-center gap-1">
            <BookOpen className="w-3 h-3" strokeWidth={2.25} /> {lessonTitle}
          </p>
        )}
        {countdown && (
          <p className="text-[10px] text-gray-400 mt-1 inline-flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" strokeWidth={2.25} /> {countdown}
          </p>
        )}
      </div>

      <div className="mt-3 space-y-1.5">
        <a
          href={meetingActive ? MEET_URL : undefined}
          target={meetingActive ? '_blank' : undefined}
          rel="noopener noreferrer"
          aria-disabled={!meetingActive}
          onClick={(e) => { if (!meetingActive) e.preventDefault(); }}
          title={meetingActive ? 'Abrir Google Meet' : 'Se activa 1 minuto antes de la clase'}
          className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            meetingActive
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {meetingActive ? (
            <><Video className="w-3.5 h-3.5" strokeWidth={2.25} /> Join Meeting</>
          ) : (
            <><Lock className="w-3 h-3" strokeWidth={2.25} /> Join Meeting</>
          )}
        </a>

        {booking.lessonId ? (
          <Link
            href={`/classroom/${booking.lessonId}`}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-[#5A3D7A] to-[#8B5CF6] text-white rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
          >
            <Play className="w-3 h-3 fill-current" strokeWidth={2.25} /> Join Lesson
          </Link>
        ) : (
          <span
            title="El profe aún no asignó una lección para esta clase"
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-400 rounded-xl text-xs font-bold cursor-not-allowed"
          >
            <Play className="w-3 h-3 fill-current" strokeWidth={2.25} /> Join Lesson
          </span>
        )}
      </div>
    </>
  );
}
