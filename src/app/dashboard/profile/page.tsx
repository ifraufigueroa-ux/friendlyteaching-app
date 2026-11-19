// FriendlyTeaching.cl — Profile / Settings Page
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import {
  AlertTriangle,
  GraduationCap,
  CalendarDays,
} from 'lucide-react';
import { db, auth } from '@/lib/firebase/config';
import { useAuthStore } from '@/store/authStore';
import { getUserProfile } from '@/lib/firebase/auth';
import { useGamification } from '@/hooks/useGamification';
import { useStudentProgress } from '@/hooks/useProgress';
import { useSkillAssessments } from '@/hooks/useSkillAssessments';
import { useLevelHistory } from '@/hooks/useLevelHistory';
import StudentGamifiedBoard from '@/components/students/StudentGamifiedBoard';
import TopBar from '@/components/layout/TopBar';

type Msg = { text: string; kind: 'ok' | 'err' } | null;

const TEACHER_CODE = process.env.NEXT_PUBLIC_TEACHER_CODE ?? 'FT-PROFESOR-2026';

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

