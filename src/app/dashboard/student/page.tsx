// FriendlyTeaching.cl — Student Dashboard
//
// The dashboard mirrors the My Profile gamified board end-to-end
// (header pills → welcome hero → daily missions → stats strip → CEFR +
// Skills) so the student sees one consistent surface regardless of
// which route they land on. Dashboard-specific blocks (Next Lesson,
// Word of the Day) are injected into the board through its slot props
// instead of reimplementing the layout.
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Clock, Mail, Tv, ClipboardList, BookOpen, Calendar, Video, Play, Lock, ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useStudentProgress } from '@/hooks/useProgress';
import { useStudentBookings } from '@/hooks/useStudentBookings';
import { usePublishedLessons } from '@/hooks/useLessons';
import { useStudentActiveSessions } from '@/hooks/useLiveSession';
import { useSkillAssessments } from '@/hooks/useSkillAssessments';
import { useLevelHistory } from '@/hooks/useLevelHistory';
import { useGamification } from '@/hooks/useGamification';
import { useStudentPlacementAssignments } from '@/hooks/usePlacementAssignments';
import StudentGamifiedBoard from '@/components/students/StudentGamifiedBoard';
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

function formatMemberSince(ts: { toDate?: () => Date } | undefined): string | null {
  if (!ts?.toDate) return null;
  return ts.toDate().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// Compute the absolute Date for a booking by anchoring its weekStart
// (Monday 00:00) and offsetting by dayOfWeek/hour/minute. Shared by the
// next-booking selector and the Next Lesson card so both agree on which
// slot is "coming up" — especially important when a student has both a
// recurring weekly class AND an exceptional one-off class in the same
// week on a different day.
function computeClassStart(booking: Booking): Date | null {
  const ws = booking.weekStart?.toDate?.();
  if (!ws) return null;
  const d = new Date(ws);
  d.setDate(d.getDate() + (booking.dayOfWeek - 1));
  d.setHours(booking.hour ?? 0, booking.minute ?? 0, 0, 0);
  return d;
}

export default function StudentDashboardPage() {
  const { profile, firebaseUser } = useAuthStore();
  const uid = firebaseUser?.uid ?? '';
  const teacherUid = profile?.studentData?.approvedByTeacherId ?? '';
  const studentLevel = profile?.studentData?.level;

  const { progress } = useStudentProgress(uid);
  // Scoped to the student's own bookings — honours the tightened
  // bookings read rule (audit 2026-11-23, C3). Teachers still use the
  // wider useBookings(teacherId, …) on their own pages.
  const { bookings } = useStudentBookings(uid, getWeekStart());
  const { activeSessions } = useStudentActiveSessions();
  const { lessons } = usePublishedLessons();
  const { averageScores: skillScores } = useSkillAssessments(uid, teacherUid);
  const { history: levelHistory } = useLevelHistory(uid, teacherUid);
  const { gamification: gam, newBadges, dismissBadges, recordDailyLogin, recordWordOfDay } = useGamification(uid);
  const { assignments: placementAssignments } = useStudentPlacementAssignments(uid);

  // Record daily login XP (once)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (uid) recordDailyLogin(); }, [uid]);

  const isPending = profile?.status === 'pending';
  const firstName = profile?.fullName?.split(' ')[0] ?? 'Student';
  const memberSince = formatMemberSince(profile?.studentData?.joinedAt ?? profile?.createdAt);

  const myBookings = bookings.filter(b => b.studentId === uid || b.studentEmail === profile?.email);
  // Pick the next-upcoming booking by ABSOLUTE date, not by (dayOfWeek, hour).
  // A recurring weekly slot spans 52 docs — one per week — and a one-off
  // "exceptional" class can land on any day. Sorting by weekday-of-the-week
  // would always surface the lowest dayOfWeek even when today's exceptional
  // class is sooner, which is why Fernando saw "next Monday" while he had
  // a class today.
  const nowMs = Date.now();
  // Keep the class visible until it actually ends — one class length plus
  // a small buffer so the card doesn't vanish on the hour boundary while
  // the student is still in the lesson. Juan incident 2026-11-24: 18:00
  // class card disappeared at 19:00 exactly even though he was still in
  // the meeting.
  const CLASS_DURATION_MS = 60 * 60_000;
  const POST_CLASS_BUFFER_MS = 30 * 60_000;
  const GRACE_MS = CLASS_DURATION_MS + POST_CLASS_BUFFER_MS;
  const nextBooking = myBookings
    .filter(b => b.status === 'confirmed' || b.status === 'pending')
    .map((b) => ({ b, startMs: computeClassStart(b)?.getTime() ?? null }))
    .filter((x): x is { b: Booking; startMs: number } => x.startMs !== null && x.startMs >= nowMs - GRACE_MS)
    .sort((a, b) => a.startMs - b.startMs)[0]?.b;
  const nextBookingLessonTitle = nextBooking?.lessonId
    ? (() => {
        const l = lessons.find(x => x.id === nextBooking.lessonId);
        return l ? `${l.code} · ${l.title}` : null;
      })()
    : null;

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-grid">
        <div className="game-card rounded-3xl p-8 text-center max-w-md w-full">
          <div className="mb-4 flex justify-center text-[#845ec2]"><Clock className="w-12 h-12" strokeWidth={2} /></div>
          <h2 className="font-fun text-xl font-bold text-[#4b3869] mb-2">Account awaiting approval</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Your account is being reviewed by your teacher. Once it's approved, you'll have access to all your lessons, schedule, and materials.
          </p>
          <div className="mt-6 bg-[#f3eefc] rounded-2xl p-4 border border-[#e5d9f2]">
            <p className="text-xs text-[#4b3869] font-medium inline-flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" strokeWidth={2.25} /> You'll get an email once your account is approved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-7xl mx-auto p-3 sm:p-5 md:p-8">

        {/* ── Live session banner ── */}
        {activeSessions.map((session) => (
          <Link
            key={session.id}
            href={`/dashboard/student/live/${session.lessonId}`}
            className="flex items-center gap-3 mb-4 px-4 py-3 rounded-2xl bg-red-600 text-white shadow-lg hover:bg-red-700 transition-colors group"
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

        {/* ── Placement test banners ── */}
        {placementAssignments.map((assignment) => {
          const isSuite = Array.isArray(assignment.components) && assignment.components.length > 0;
          const base = isSuite ? '/placement-suite' : '/placement';
          return (
            <Link
              key={assignment.id}
              href={`${base}/${assignment.teacherId}?name=${encodeURIComponent(profile?.fullName ?? '')}&email=${encodeURIComponent(profile?.email ?? '')}&assignmentId=${assignment.id}`}
              className="flex items-center gap-3 mb-4 px-4 py-3.5 rounded-2xl text-white shadow-lg hover:opacity-90 transition-opacity group"
              style={{ background: 'linear-gradient(135deg, #5A3D7A, #845ec2)' }}
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

        <StudentGamifiedBoard
          firstName={firstName}
          email={profile?.email ?? ''}
          level={studentLevel}
          memberSince={memberSince}
          gamification={gam}
          progress={progress}
          skillScores={skillScores}
          levelHistory={levelHistory}
          afterHeroSlot={<NextLessonCard booking={nextBooking} lessonTitle={nextBookingLessonTitle} />}
          beforeSkillsSlot={uid ? <WordOfTheDay studentId={uid} recordWordOfDay={recordWordOfDay} /> : null}
        />

        {/* Badge unlock toast */}
        <BadgeUnlockToast badgeIds={newBadges} onDismiss={dismissBadges} />
      </div>
    </div>
  );
}

// ─── Next Lesson card ─────────────────────────────────────────────
//
// Gamified variant of the previous glass-card "Next class" tile.
// Google Meet opens 1 min before class start and stays active for the
// hour of class; the Join Lesson button is enabled only when the
// teacher has pinned a lesson to the booking.

const MEET_URL = 'https://meet.google.com/rhq-agda-ajs';
const MEET_EARLY_MS = 60_000;
// Match the dashboard's GRACE_MS so the Meet link / "Meeting is live" badge
// stays active for the full class plus a short buffer (90 min from start),
// not just the first hour.
const MEET_LATE_MS  = 90 * 60_000;

function NextLessonCard({
  booking, lessonTitle,
}: {
  booking: Booking | undefined;
  lessonTitle: string | null;
}) {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  if (!booking) {
    return (
      <div className="game-card rounded-2xl p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-[#f3eefc] text-[#845ec2] flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5" strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <p className="font-fun font-bold text-[#4b3869] text-sm">No scheduled classes</p>
            <p className="text-xs text-slate-500">Your weekly slot will appear here once a booking is set.</p>
          </div>
        </div>
        <Link
          href="/dashboard/student/schedule"
          className="text-xs font-bold text-[#845ec2] hover:underline inline-flex items-center gap-1 flex-shrink-0"
        >
          View schedule <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
        </Link>
      </div>
    );
  }

  const start = computeClassStart(booking);
  const msUntilStart = start ? start.getTime() - now : Infinity;
  const meetingActive = msUntilStart <= MEET_EARLY_MS && msUntilStart >= -MEET_LATE_MS;

  const countdown = (() => {
    if (!start)                        return null;
    if (msUntilStart < -MEET_LATE_MS)  return 'Class finished';
    if (meetingActive)                 return 'Meeting is live';
    if (msUntilStart < 60 * 60_000) {
      const mins = Math.max(0, Math.round(msUntilStart / 60_000));
      return `Available in ${mins} min`;
    }
    const hrs = Math.floor(msUntilStart / 3_600_000);
    if (hrs < 24) return `Available in ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `Available in ${days}d`;
  })();

  return (
    <div className="game-card rounded-2xl p-5">
      <div className="flex items-center justify-between gap-5 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-[#f3eefc] text-[#845ec2] flex items-center justify-center flex-shrink-0">
            <Calendar className="w-6 h-6" strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Next lesson</p>
            <p className="font-fun font-bold text-[#4b3869] text-lg leading-tight">
              {DAY_NAMES[booking.dayOfWeek]} · {booking.hour}:00 – {booking.hour + 1}:00
            </p>
            {lessonTitle && (
              <p className="text-xs text-slate-500 mt-0.5 truncate inline-flex items-center gap-1 max-w-sm">
                <BookOpen className="w-3 h-3" strokeWidth={2.25} /> {lessonTitle}
              </p>
            )}
            {countdown && (
              <p className="text-[10px] text-[#9474c4] font-semibold mt-0.5 inline-flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" strokeWidth={2.25} /> {countdown}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <a
            href={meetingActive ? MEET_URL : undefined}
            target={meetingActive ? '_blank' : undefined}
            rel="noopener noreferrer"
            aria-disabled={!meetingActive}
            onClick={(e) => { if (!meetingActive) e.preventDefault(); }}
            title={meetingActive ? 'Open Google Meet' : 'Enables 1 minute before class'}
            className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-fun font-bold uppercase tracking-wider transition-all ${
              meetingActive
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            {meetingActive
              ? <><Video className="w-3.5 h-3.5" strokeWidth={2.25} /> Join Meeting</>
              : <><Lock className="w-3 h-3" strokeWidth={2.25} /> Join Meeting</>}
          </a>

          {booking.lessonId ? (
            <Link
              href={`/classroom/${booking.lessonId}`}
              className="btn-game inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-fun font-bold uppercase tracking-wider"
            >
              <Play className="w-3 h-3 fill-current" strokeWidth={2.25} /> Join Lesson
            </Link>
          ) : (
            <span
              title="The teacher hasn't pinned a lesson to this class yet"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 text-slate-400 rounded-2xl text-xs font-fun font-bold uppercase tracking-wider cursor-not-allowed border border-slate-200"
            >
              <Play className="w-3 h-3 fill-current" strokeWidth={2.25} /> Join Lesson
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
