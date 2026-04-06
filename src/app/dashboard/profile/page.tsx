// FriendlyTeaching.cl — Profile / Settings Page
'use client';
import { useState, useEffect } from 'react';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { db, auth } from '@/lib/firebase/config';
import { useAuthStore } from '@/store/authStore';
import { getUserProfile } from '@/lib/firebase/auth';
import TopBar from '@/components/layout/TopBar';
import type { LessonLevel } from '@/types/firebase';

const TEACHER_CODE = process.env.NEXT_PUBLIC_TEACHER_CODE ?? 'FT-PROFESOR-2026';

const LEVEL_COLORS: Record<string, string> = {
  A0: 'bg-teal-100 text-teal-700', A1: 'bg-green-100 text-green-700',
  A2: 'bg-emerald-100 text-emerald-700', B1: 'bg-yellow-100 text-yellow-700',
  'B1+': 'bg-orange-100 text-orange-700', B2: 'bg-red-100 text-red-700',
  C1: 'bg-purple-100 text-purple-700',
};

const LEVEL_LABELS: Record<LessonLevel, string> = {
  A0: 'A0 — Principiante absoluto',
  A1: 'A1 — Principiante',
  A2: 'A2 — Elemental',
  B1: 'B1 — Intermedio',
  'B1+': 'B1+ — Intermedio alto',
  B2: 'B2 — Intermedio avanzado',
  C1: 'C1 — Avanzado',
};

export default function ProfilePage() {
  const { profile, role } = useAuthStore();

  // ── Profile form state ─────────────────────────────────
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // ── Teacher code repair state ──────────────────────────
  const [teacherCode, setTeacherCode] = useState('');
  const [repairMsg, setRepairMsg] = useState('');
  const [repairing, setRepairing] = useState(false);

  // ── Password change state ──────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName ?? '');
      setPhone(profile.phone ?? '');
      setBio(profile.teacherData?.bio ?? '');
    }
  }, [profile]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const patch: Record<string, unknown> = {
        fullName: fullName.trim(),
        phone: phone.trim() || null,
        updatedAt: serverTimestamp(),
      };
      if (role === 'teacher') {
        patch['teacherData.bio'] = bio.trim() || null;
      }
      await updateDoc(doc(db, 'users', profile.uid), patch);
      setSaveMsg('✅ Perfil actualizado');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg('❌ Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleRepairRole(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    if (teacherCode !== TEACHER_CODE) {
      setRepairMsg('❌ Código de profesor incorrecto.');
      return;
    }
    setRepairing(true);
    setRepairMsg('');
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        role: 'teacher',
        status: 'active',
        updatedAt: serverTimestamp(),
      });
      const refreshed = await getUserProfile(profile.uid);
      useAuthStore.getState().setProfile(refreshed);
      setRepairMsg('✅ Rol actualizado a Profesor. Recarga la página.');
    } catch {
      setRepairMsg('❌ No se pudo actualizar el rol. Contacta soporte.');
    } finally {
      setRepairing(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');
    setPwMsg('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('Completa todos los campos');
      return;
    }
    if (newPassword.length < 6) {
      setPwError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Las contraseñas nuevas no coinciden');
      return;
    }

    const user = auth.currentUser;
    if (!user?.email) { setPwError('No hay sesión activa'); return; }

    setChangingPw(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setPwMsg('✅ Contraseña actualizada');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwMsg(''), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setPwError('Contraseña actual incorrecta');
      } else {
        setPwError('Error al cambiar la contraseña');
      }
    } finally {
      setChangingPw(false);
    }
  }

  // ── No Firestore profile — show emergency repair UI ──────────────────────
  if (!profile) {
    const firebaseUser = auth.currentUser;
    return (
      <div className="flex flex-col h-full">
        <TopBar
        title="Mi Perfil"
        subtitle="Configuración y datos personales"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Perfil' },
        ]}
      />
        <div className="flex-1 p-6 overflow-auto max-w-2xl mx-auto w-full">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-5">
            <h2 className="font-bold text-red-800 mb-1">⚠️ Perfil no encontrado</h2>
            <p className="text-sm text-red-700 mb-4">
              Tu cuenta de Firebase existe ({firebaseUser?.email}) pero no hay un perfil guardado en la base de datos.
              Ingresa el código de profesor para crear tu perfil automáticamente.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!firebaseUser) return;
                const input = (e.currentTarget.elements.namedItem('code') as HTMLInputElement).value;
                if (input !== TEACHER_CODE) {
                  setRepairMsg('❌ Código incorrecto.');
                  return;
                }
                setRepairing(true);
                setRepairMsg('');
                try {
                  const newProfile = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email ?? '',
                    fullName: firebaseUser.displayName ?? (firebaseUser.email?.split('@')[0] ?? 'Profesor'),
                    phone: '',
                    role: 'teacher' as const,
                    status: 'active' as const,
                    timezone: 'America/Santiago',
                    language: 'es',
                    preferences: { emailNotifications: true },
                    createdAt: serverTimestamp(),
                  };
                  await setDoc(doc(db, 'users', firebaseUser.uid), newProfile, { merge: true });
                  const refreshed = await getUserProfile(firebaseUser.uid);
                  useAuthStore.getState().setProfile(refreshed);
                  setRepairMsg('✅ Perfil creado como Profesor. Recarga la página.');
                } catch (err) {
                  console.error('Profile creation failed:', err);
                  setRepairMsg('❌ Error al crear perfil. Revisa la consola del navegador.');
                } finally {
                  setRepairing(false);
                }
              }}
              className="flex gap-2"
            >
              <input
                name="code"
                type="text"
                placeholder="Código de profesor"
                className="flex-1 px-3 py-2 border border-red-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
              />
              <button
                type="submit"
                disabled={repairing}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {repairing ? '...' : 'Crear perfil'}
              </button>
            </form>
            {repairMsg && (
              <p className={`text-xs mt-2 px-3 py-2 rounded-lg ${repairMsg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {repairMsg}
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

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Mi Perfil"
        subtitle="Configuración y datos personales"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Perfil' },
        ]}
      />
      <div className="flex-1 p-6 overflow-auto max-w-2xl mx-auto w-full">

        {/* Avatar + info summary */}
        <div className="bg-gradient-to-br from-[#5A3D7A] to-[#8B5CF6] rounded-2xl p-6 text-white mb-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-extrabold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xl font-extrabold leading-tight">{profile.fullName}</p>
            <p className="text-sm text-white/70 mt-0.5">{profile.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                {role === 'teacher' ? '👨‍🏫 Profesor' : '🎓 Estudiante'}
              </span>
              {level && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${LEVEL_COLORS[level] ?? 'bg-gray-100 text-gray-600'}`}>
                  {level}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Student level info (read-only) */}
        {role === 'student' && level && (
          <div className="bg-[#F0E5FF] rounded-2xl p-4 mb-6">
            <p className="text-xs font-semibold text-[#5A3D7A] mb-1">Tu nivel CEFR asignado</p>
            <p className="font-bold text-[#5A3D7A]">{LEVEL_LABELS[level]}</p>
            <p className="text-xs text-[#9B7CB8] mt-1">Tu nivel es asignado por tu profesor. Si crees que debe cambiar, contáctale directamente.</p>
          </div>
        )}

        {/* Profile form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
          <h2 className="font-bold text-gray-800 mb-4">Datos personales</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
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
              <p className="text-xs text-gray-400 mt-1">El email no se puede cambiar</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (opcional)</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio / Presentación (opcional)</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Escribe una breve presentación..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] resize-none"
                />
              </div>
            )}

            {saveMsg && (
              <p className={`text-sm px-3 py-2 rounded-lg ${saveMsg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {saveMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>

        {/* Teacher role repair — shown only when role is not teacher */}
        {role !== 'teacher' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-5">
            <h2 className="font-bold text-amber-800 mb-1">¿Eres profesor?</h2>
            <p className="text-xs text-amber-700 mb-4">Si tu cuenta fue creada como estudiante por error, ingresa el código de profesor para cambiar tu rol.</p>
            <form onSubmit={handleRepairRole} className="flex gap-2">
              <input
                type="text"
                value={teacherCode}
                onChange={(e) => setTeacherCode(e.target.value)}
                placeholder="Código de profesor"
                className="flex-1 px-3 py-2 border border-amber-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              />
              <button
                type="submit"
                disabled={repairing}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {repairing ? '...' : 'Activar rol'}
              </button>
            </form>
            {repairMsg && (
              <p className={`text-xs mt-2 px-3 py-2 rounded-lg ${repairMsg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {repairMsg}
              </p>
            )}
          </div>
        )}

        {/* Password change */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-gray-800 mb-4">Cambiar contraseña</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña actual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nueva contraseña</label>
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
              {changingPw ? 'Actualizando...' : 'Cambiar contraseña'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
