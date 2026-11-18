// FriendlyTeaching.cl — Profile / Settings Page
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import {
  AlertTriangle,
  GraduationCap,
  Flame,
  Timer,
  Star,
  TrendingUp,
  CalendarDays,
  Crown,
  Target,
  CheckCircle2,
  PenTool,
  Headphones,
  Play,
  Zap,
} from 'lucide-react';
import { db, auth } from '@/lib/firebase/config';
import { useAuthStore } from '@/store/authStore';
import { getUserProfile } from '@/lib/firebase/auth';
import { useGamification } from '@/hooks/useGamification';
import { useStudentProgress } from '@/hooks/useProgress';
import { useSkillAssessments } from '@/hooks/useSkillAssessments';
import { useLevelHistory } from '@/hooks/useLevelHistory';
import { SkillRadarChart } from '@/components/students/SkillRadarChart';
import { LevelTimeline } from '@/components/students/LevelTimeline';
import BadgeGrid from '@/components/gamification/BadgeGrid';
import TopBar from '@/components/layout/TopBar';
import { xpForNextLevel, getTodayStr } from '@/lib/utils/gamification';
import type { LessonLevel, Progress, SkillScores, LevelHistoryEntry, StudentGamification } from '@/types/firebase';

type Msg = { text: string; kind: 'ok' | 'err' } | null;

const TEACHER_CODE = process.env.NEXT_PUBLIC_TEACHER_CODE ?? 'FT-PROFESOR-2026';

const LEVEL_LABELS: Record<LessonLevel, string> = {
  A0: 'A0 — Absolute beginner',
  A1: 'A1 — Beginner',
  A2: 'A2 — Elementary',
  B1: 'B1 — Intermediate',
  'B1+': 'B1+ — Upper intermediate',
  B2: 'B2 — Advanced intermediate',
  C1: 'C1 — Advanced',
};

function formatDuration(mins?: number) {
  if (!mins) return '—';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatMemberSince(ts: { toDate?: () => Date } | undefined) {
  if (!ts?.toDate) return null;
  return ts.toDate().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export default function ProfilePage() {
  const { profile, firebaseUser, role } = useAuthStore();
  const uid = firebaseUser?.uid ?? profile?.uid ?? '';
  const teacherUid = profile?.studentData?.approvedByTeacherId ?? '';

  // ── Profile form state ─────────────────────────────────
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<Msg>(null);

  // ── Teacher code repair state ──────────────────────────
  const [teacherCode, setTeacherCode] = useState('');
  const [repairMsg, setRepairMsg] = useState<Msg>(null);
  const [repairing, setRepairing] = useState(false);

  // ── Password change state ──────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');

  // ── Student-only data (safe to call with empty uid) ────
  const isStudent = role === 'student';
  const { gamification } = useGamification(isStudent ? uid : undefined);
  const { progress } = useStudentProgress(isStudent ? uid : '');
  const { averageScores: skillScores } = useSkillAssessments(
    isStudent ? uid : '',
    isStudent ? teacherUid : '',
  );
  const { history: levelHistory } = useLevelHistory(
    isStudent ? uid : '',
    isStudent ? teacherUid : '',
  );

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName ?? '');
      setPhone(profile.phone ?? '');
      setBio(profile.teacherData?.bio ?? '');
    }
  }, [profile]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    // Prefer the auth user's uid in case the store is out of sync
    // (see [[authstore-hydration-bug]]). Bail if neither is set.
    const puid = auth.currentUser?.uid ?? profile?.uid;
    if (!puid) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const patch: Record<string, unknown> = {
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        updatedAt: serverTimestamp(),
      };
      if (role === 'teacher') {
        patch['teacherData.bio'] = bio.trim() || null;
      }
      await updateDoc(doc(db, 'users', puid), patch);
      setSaveMsg({ text: 'Profile updated', kind: 'ok' });
      setTimeout(() => setSaveMsg(null), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[profile] save failed:', err);
      setSaveMsg({ text: `Save failed: ${msg}`, kind: 'err' });
    } finally {
      setSaving(false);
    }
  }

  async function handleRepairRole(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    if (teacherCode !== TEACHER_CODE) {
      setRepairMsg({ text: 'Invalid teacher code.', kind: 'err' });
      return;
    }
    setRepairing(true);
    setRepairMsg(null);
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        role: 'teacher',
        status: 'active',
        updatedAt: serverTimestamp(),
      });
      const refreshed = await getUserProfile(profile.uid);
      useAuthStore.getState().setProfile(refreshed);
      setRepairMsg({ text: 'Role updated to Teacher. Please reload the page.', kind: 'ok' });
    } catch {
      setRepairMsg({ text: 'Could not update role. Contact support.', kind: 'err' });
    } finally {
      setRepairing(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');
    setPwMsg('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('Please fill in every field');
      return;
    }
    if (newPassword.length < 6) {
      setPwError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }

    const user = auth.currentUser;
    if (!user?.email) { setPwError('No active session'); return; }

    setChangingPw(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setPwMsg('Password updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwMsg(''), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setPwError('Current password is incorrect');
      } else {
        setPwError('Could not change password');
      }
    } finally {
      setChangingPw(false);
    }
  }

  // ── No Firestore profile — show emergency repair UI ──────────────────────
  if (!profile) {
    const fbUser = auth.currentUser;
    return (
      <div className="flex flex-col h-full">
        <TopBar
          title="My Profile"
          subtitle="Account and personal data"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Profile' },
          ]}
        />
        <div className="flex-1 p-6 overflow-auto max-w-2xl mx-auto w-full">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-5">
            <h2 className="font-bold text-red-800 mb-1 inline-flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" strokeWidth={2.5} /> Profile not found</h2>
            <p className="text-sm text-red-700 mb-4">
              Your Firebase account exists ({fbUser?.email}) but there is no profile saved in the database.
              Enter the teacher code to create your profile automatically.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!fbUser) return;
                const input = (e.currentTarget.elements.namedItem('code') as HTMLInputElement).value;
                if (input !== TEACHER_CODE) {
                  setRepairMsg({ text: 'Invalid code.', kind: 'err' });
                  return;
                }
                setRepairing(true);
                setRepairMsg(null);
                try {
                  const newProfile = {
                    uid: fbUser.uid,
                    email: fbUser.email ?? '',
                    fullName: fbUser.displayName ?? (fbUser.email?.split('@')[0] ?? 'Teacher'),
                    phone: '',
                    role: 'teacher' as const,
                    status: 'active' as const,
                    timezone: 'America/Santiago',
                    language: 'en',
                    preferences: { emailNotifications: true },
                    createdAt: serverTimestamp(),
                  };
                  await setDoc(doc(db, 'users', fbUser.uid), newProfile, { merge: true });
                  const refreshed = await getUserProfile(fbUser.uid);
                  useAuthStore.getState().setProfile(refreshed);
                  setRepairMsg({ text: 'Profile created as Teacher. Please reload.', kind: 'ok' });
                } catch (err) {
                  console.error('Profile creation failed:', err);
                  setRepairMsg({ text: 'Could not create profile. Check the browser console.', kind: 'err' });
                } finally {
                  setRepairing(false);
                }
              }}
              className="flex gap-2"
            >
              <input
                name="code"
                type="text"
                placeholder="Teacher code"
                className="flex-1 px-3 py-2 border border-red-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
              />
              <button
                type="submit"
                disabled={repairing}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {repairing ? '...' : 'Create profile'}
              </button>
            </form>
            {repairMsg && (
              <p className={`text-xs mt-2 px-3 py-2 rounded-lg ${repairMsg.kind === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {repairMsg.text}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const level = profile.studentData?.level;
  const initials = profile.fullName
    ? profile.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';
  const firstName = profile.fullName?.split(' ')[0] ?? 'there';
  const memberSince = formatMemberSince(profile.studentData?.joinedAt ?? profile.createdAt);

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="My Profile"
        subtitle="Account and personal data"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Profile' },
        ]}
      />
      <div
        className={`flex-1 overflow-auto${isStudent ? ' bg-grid' : ''}`}
      >
      <div className={`${isStudent ? 'max-w-7xl p-4 md:p-8' : 'max-w-4xl p-6'} mx-auto w-full`}>

        {/* ─── Teacher / non-student hero: classic avatar card ─── */}
        {!isStudent && (
          <div className="bg-gradient-to-br from-[#5A3D7A] to-[#8B5CF6] rounded-2xl p-6 text-white mb-5 flex items-center gap-5 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-extrabold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xl font-extrabold leading-tight">{profile.fullName}</p>
              <p className="text-sm text-white/70 mt-0.5 truncate">{profile.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" strokeWidth={2.25} /> {role === 'teacher' ? 'Teacher' : 'Student'}
                </span>
                {memberSince && (
                  <span className="text-[11px] text-white/70 inline-flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" strokeWidth={2.25} /> Member since {memberSince}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ──────────── STUDENT-ONLY GAMIFIED PROFILE ──────────── */}
        {isStudent && (
          <StudentGamifiedBoard
            firstName={firstName}
            email={profile.email}
            level={level}
            memberSince={memberSince}
            gamification={gamification}
            progress={progress}
            skillScores={skillScores}
            levelHistory={levelHistory}
          />
        )}
        {/* ──────────── /STUDENT-ONLY ──────────── */}

        {/* Profile form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
          <h2 className="font-bold text-gray-800 mb-4">Personal data</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-3 py-2 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+56 9 XXXX XXXX"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
              />
            </div>

            {role === 'teacher' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio (optional)</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write a short intro..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] resize-none"
                />
              </div>
            )}

            {saveMsg && (
              <p className={`text-sm px-3 py-2 rounded-lg ${saveMsg.kind === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {saveMsg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </div>

        {/* Teacher role repair — shown only when role is not teacher */}
        {role !== 'teacher' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-5">
            <h2 className="font-bold text-amber-800 mb-1">Are you a teacher?</h2>
            <p className="text-xs text-amber-700 mb-4">If your account was created as a student by mistake, enter the teacher code to switch your role.</p>
            <form onSubmit={handleRepairRole} className="flex gap-2">
              <input
                type="text"
                value={teacherCode}
                onChange={(e) => setTeacherCode(e.target.value)}
                placeholder="Teacher code"
                className="flex-1 px-3 py-2 border border-amber-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              />
              <button
                type="submit"
                disabled={repairing}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {repairing ? '...' : 'Activate role'}
              </button>
            </form>
            {repairMsg && (
              <p className={`text-xs mt-2 px-3 py-2 rounded-lg ${repairMsg.kind === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {repairMsg.text}
              </p>
            )}
          </div>
        )}

        {/* Password change */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-gray-800 mb-4">Change password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
                autoComplete="new-password"
              />
            </div>

            {pwError && <p className="text-sm px-3 py-2 rounded-lg bg-red-50 text-red-600">{pwError}</p>}
            {pwMsg && <p className="text-sm px-3 py-2 rounded-lg bg-green-50 text-green-700">{pwMsg}</p>}

            <button
              type="submit"
              disabled={changingPw}
              className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
            >
              {changingPw ? 'Updating...' : 'Change password'}
            </button>
          </form>
        </div>

      </div>
      </div>
    </div>
  );
}

// ─── Student gamified board (Duolingo Arcade vibe) ─────────────
//
// Replaces the plain avatar hero + stats strip for students. Palette is
// the FT purple family (#845ec2 primary) with amber accents for the
// streak. Icons come from lucide to stay consistent with the rest of
// the app — no font-awesome dependency.

interface StudentGamifiedBoardProps {
  firstName: string;
  email: string;
  level: LessonLevel | undefined;
  memberSince: string | null;
  gamification: StudentGamification | null;
  progress: Progress[];
  skillScores: SkillScores | null;
  levelHistory: LevelHistoryEntry[];
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']; // Mon–Sun

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function todayCompletedLessons(progress: Progress[]): number {
  const today = startOfDay(new Date()).getTime();
  const tomorrow = today + 86400000;
  return progress.filter((p) => {
    if (p.status !== 'completed') return false;
    const t = p.startedAt?.toDate?.().getTime() ?? 0;
    return t >= today && t < tomorrow;
  }).length;
}

function weekdayGrid(gamification: StudentGamification | null): boolean[] {
  // Marks the last 7 days (Mon–Sun of current week) as active based on
  // currentStreak + lastActivityDate. We only know the student was
  // active today; everything else is inferred from the streak length.
  const now = new Date();
  const dayIdx = (now.getDay() + 6) % 7; // 0 = Mon … 6 = Sun
  const active: boolean[] = Array(7).fill(false);
  if (!gamification) return active;
  const todayStr = getTodayStr();
  const wasToday = gamification.lastActivityDate === todayStr;
  const streak = gamification.currentStreak ?? 0;
  if (!wasToday && streak === 0) return active;
  // Walk back from today (or yesterday if not active today) and mark
  // as many days as the streak covers — capped at days visible this
  // week (Mon..today).
  let cursor = wasToday ? dayIdx : dayIdx - 1;
  let left = streak + (wasToday ? 0 : 0); // streak already reflects today when wasToday
  while (cursor >= 0 && left > 0) {
    active[cursor] = true;
    cursor -= 1;
    left -= 1;
  }
  return active;
}

function timeUntilMidnightLabel(): string {
  const now = new Date();
  const mid = new Date(now);
  mid.setHours(24, 0, 0, 0);
  const diff = Math.max(0, mid.getTime() - now.getTime());
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

function StudentGamifiedBoard({
  firstName, email, level, memberSince, gamification,
  progress, skillScores, levelHistory,
}: StudentGamifiedBoardProps) {
  // Reset countdown — ticks every minute so "Resets in 4h 12m" stays honest.
  const [resetLabel, setResetLabel] = useState(timeUntilMidnightLabel);
  useEffect(() => {
    const id = window.setInterval(() => setResetLabel(timeUntilMidnightLabel()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  // ── Derived data ──
  const totalXp = gamification?.totalXp ?? 0;
  const playerLevel = gamification?.level ?? 1;
  const { current: levelXp, needed: levelNeeded, progress: levelProgress } = xpForNextLevel(totalXp);
  const xpToNext = Math.max(0, levelNeeded - levelXp);

  const currentStreak = gamification?.currentStreak ?? 0;
  const longestStreak = gamification?.longestStreak ?? 0;
  const todayStr = getTodayStr();
  const wasActiveToday = gamification?.lastActivityDate === todayStr;

  const completed = progress.filter((p) => p.status === 'completed');
  const uniqueLessons = new Set(completed.map((p) => p.lessonId)).size;
  const totalMinutes = completed.reduce((acc, p) => acc + (p.duration ?? 0), 0);
  const scores = completed.map((p) => p.overallScore).filter((s): s is number => typeof s === 'number');
  const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;

  // Daily mission state — derived from gamification + today's progress.
  const todayLessons = todayCompletedLessons(progress);
  const loggedInToday = wasActiveToday;
  const wordDoneToday = wasActiveToday && (gamification?.wordStreak ?? 0) > 0;
  const lessonDoneToday = todayLessons > 0;

  const missions: {
    key: string; title: string; icon: React.ReactNode; xp: number;
    done: boolean; pct: number; tone: string;
  }[] = [
    {
      key: 'login',
      title: 'Open FriendlyTeaching today',
      icon: <CheckCircle2 className="w-5 h-5" strokeWidth={2.25} />,
      xp: 5,
      done: loggedInToday,
      pct: loggedInToday ? 100 : 0,
      tone: 'emerald',
    },
    {
      key: 'word',
      title: 'Submit today\'s Word of the Day',
      icon: <PenTool className="w-5 h-5" strokeWidth={2.25} />,
      xp: 15,
      done: wordDoneToday,
      pct: wordDoneToday ? 100 : 0,
      tone: 'ft',
    },
    {
      key: 'lesson',
      title: 'Complete 1 lesson today',
      icon: <Headphones className="w-5 h-5" strokeWidth={2.25} />,
      xp: 25,
      done: lessonDoneToday,
      pct: lessonDoneToday ? 100 : 0,
      tone: 'amber',
    },
  ];

  const weekGrid = weekdayGrid(gamification);
  const levelLabel = level ? `${level} · ${LEVEL_LABELS[level].split('—')[1]?.trim() ?? ''}` : 'Level pending';

  return (
    <>
      {/* ── Header stat badges (streak + XP total) ──────────── */}
      <div className="flex items-center justify-end gap-3 mb-4">
        <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-2xl border border-amber-200 shadow-sm">
          <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center">
            <Flame className="w-3.5 h-3.5" strokeWidth={2.5} />
          </div>
          <span className="text-xs font-bold text-amber-700">
            {currentStreak} day{currentStreak === 1 ? '' : 's'} streak
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-[#f3eefc] px-3 py-1.5 rounded-2xl border border-[#e5d9f2] shadow-sm">
          <div className="w-6 h-6 rounded-lg bg-[#845ec2] text-white flex items-center justify-center">
            <Zap className="w-3.5 h-3.5" strokeWidth={2.5} />
          </div>
          <span className="text-xs font-bold text-[#6b4c9a]">{totalXp.toLocaleString()} XP total</span>
        </div>
      </div>

      {/* ── Welcome hero ─────────────────────────────────────── */}
      <div
        className="game-card rounded-3xl p-6 md:p-8 relative overflow-hidden mb-6"
        style={{ background: 'linear-gradient(to right, #ffffff, #fcfbfe, #f3eefc)' }}
      >
        <div
          className="absolute -right-6 -bottom-6 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: 'rgba(236, 227, 247, 0.5)', filter: 'blur(32px)' }}
        />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-[#e5d9f2]/80 px-3 py-1 rounded-full text-[#4b3869] text-xs font-extrabold">
              <Crown className="w-3.5 h-3.5 text-amber-500" strokeWidth={2.25} />
              <span>Level {playerLevel}{level ? ` — ${levelLabel.split(' · ').slice(1).join(' · ') || level}` : ''}</span>
            </div>
            <h1 className="font-fun text-2xl md:text-4xl font-bold text-[#4b3869] tracking-tight">
              Hi, {firstName}! <span>🚀</span>
            </h1>
            <p className="text-sm text-slate-600 max-w-lg">
              {currentStreak > 0
                ? `Finish your daily missions to keep the streak alive and climb this week's league.`
                : `Finish your daily missions to start your streak and climb this week's league.`}
            </p>
            <div className="flex items-center justify-center md:justify-start gap-3 text-[11px] text-slate-400 pt-1">
              <span className="truncate">{email}</span>
              {memberSince && (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" strokeWidth={2.25} /> Since {memberSince}
                </span>
              )}
            </div>
          </div>

          {/* XP Progress card */}
          <div className="bg-white p-5 rounded-3xl border-2 border-[#e5d9f2] shadow-md flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-16 h-16 flex items-center justify-center bg-[#f3eefc] rounded-2xl text-[#845ec2] font-extrabold text-xl border-2 border-[#e5d9f2]">
              {Math.round(levelProgress * 100)}%
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Level progress</span>
              <span className="text-sm font-extrabold text-[#4b3869]">{levelXp} / {levelNeeded} XP</span>
              <span className="text-xs font-semibold text-[#9474c4] block mt-0.5">
                {xpToNext > 0 ? `Only ${xpToNext} XP to Level ${playerLevel + 1}!` : 'Level up pending next activity'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Daily missions + streak ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-fun font-bold text-[#4b3869] text-lg inline-flex items-center gap-2">
              <Target className="w-4 h-4 text-[#845ec2]" strokeWidth={2.25} />
              Daily missions
            </h3>
            <span className="text-xs font-bold text-slate-400">Resets in {resetLabel}</span>
          </div>

          {missions.map((m) => {
            const toneMap: Record<string, { leftBar: string; iconBg: string; iconFg: string; chipBg: string; chipFg: string; bar: string }> = {
              emerald: { leftBar: 'border-l-emerald-500', iconBg: 'bg-emerald-100', iconFg: 'text-emerald-600', chipBg: 'bg-emerald-50 border-emerald-200', chipFg: 'text-emerald-700', bar: 'bg-emerald-500' },
              ft:      { leftBar: 'border-l-[#845ec2]',  iconBg: 'bg-[#f3eefc]',  iconFg: 'text-[#845ec2]',  chipBg: 'bg-[#f3eefc] border-[#e5d9f2]', chipFg: 'text-[#845ec2]', bar: 'bg-[#845ec2]' },
              amber:   { leftBar: 'border-l-amber-500',  iconBg: 'bg-amber-100',  iconFg: 'text-amber-600',   chipBg: 'bg-amber-50 border-amber-200', chipFg: 'text-amber-700', bar: 'bg-amber-500' },
            };
            const t = toneMap[m.tone];
            return (
              <div key={m.key} className={`game-card rounded-2xl p-4 flex items-center justify-between border-l-4 ${t.leftBar}`}>
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl ${t.iconBg} ${t.iconFg} flex items-center justify-center flex-shrink-0`}>
                    {m.icon}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-fun font-bold text-[#4b3869] text-sm truncate">{m.title}</h4>
                    <div className="w-40 sm:w-56 bg-[#f3eefc] h-2 rounded-full mt-1.5 overflow-hidden border border-[#e5d9f2]">
                      <div className={`${t.bar} h-full rounded-full transition-all`} style={{ width: `${m.pct}%` }} />
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <span className={`text-[11px] font-fun font-bold px-2.5 py-1 rounded-xl border ${t.chipBg} ${t.chipFg}`}>
                    {m.done ? 'Done!' : `+${m.xp} XP`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Streak + CTA column */}
        <div className="space-y-4">
          <div className="game-card rounded-3xl p-6 text-center border-amber-300 shadow-md"
               style={{ background: 'linear-gradient(to bottom, rgba(254, 243, 199, 0.5), #ffffff)', boxShadow: '0 4px 0 0 #fcd34d' }}>
            <div className={`w-16 h-16 rounded-3xl bg-amber-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/30 ${currentStreak > 0 ? 'animate-bounce' : ''}`}>
              <Flame className="w-8 h-8" strokeWidth={2.25} />
            </div>
            <h3 className="font-fun text-2xl font-bold text-amber-800 leading-tight">
              {currentStreak} day{currentStreak === 1 ? '' : 's'} streak
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-snug">
              {wasActiveToday
                ? 'Today is already counted. See you tomorrow!'
                : currentStreak > 0
                  ? 'Study today so you don\'t lose the flame.'
                  : 'Finish one mission today to light the flame.'}
            </p>
            <div className="mt-5 pt-4 border-t border-amber-200 grid grid-cols-7 gap-1 text-[10px] font-bold">
              {DAY_LABELS.map((d, i) => (
                <div
                  key={i}
                  className={`p-1 rounded-lg ${weekGrid[i] ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'}`}
                >
                  {d}
                </div>
              ))}
            </div>
            {longestStreak > 0 && (
              <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-amber-600/80">
                Best · {longestStreak} days
              </p>
            )}
          </div>

          <Link
            href="/dashboard/student/practice"
            className="btn-game w-full py-4 font-fun font-bold rounded-2xl text-sm flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            <Play className="w-3.5 h-3.5 fill-current" strokeWidth={2.25} />
            Continue practice
          </Link>
        </div>
      </div>

      {/* ── Learning stats strip ─────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total XP', value: totalXp.toLocaleString(), Icon: Zap, color: 'text-[#845ec2]' },
          { label: 'Completed lessons', value: uniqueLessons, Icon: GraduationCap, color: 'text-emerald-600' },
          { label: 'Total time', value: formatDuration(totalMinutes), Icon: Timer, color: 'text-blue-600' },
          { label: 'Avg. grade', value: avgScore ?? '—', Icon: Star, color: 'text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="game-card rounded-2xl p-4 text-center">
            <div className={`mb-0.5 flex justify-center ${s.color}`}><s.Icon className="w-5 h-5" strokeWidth={2.25} /></div>
            <p className={`font-fun text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Skills radar + level timeline ────────────────────── */}
      {(skillScores || level) && (
        <div className="game-card rounded-2xl overflow-hidden mb-5">
          <div className="px-4 pt-4 pb-2">
            <p className="font-fun font-bold text-[#4b3869] text-sm inline-flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#845ec2]" strokeWidth={2.25} /> My English progress
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-[#e5d9f2]">
            {level && (
              <div className="px-4 py-4">
                <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">CEFR level</p>
                <LevelTimeline history={levelHistory} currentLevel={level} />
              </div>
            )}
            {skillScores && (
              <div className="px-4 py-4">
                <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Skills</p>
                <SkillRadarChart scores={skillScores} compact />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Badges ───────────────────────────────────────────── */}
      {gamification && gamification.badges.length > 0 && (
        <div className="mb-5">
          <BadgeGrid earnedBadges={gamification.badges} />
        </div>
      )}
    </>
  );
}
