'use client';
// FriendlyTeaching.cl — Firebase Auth Action Handler
// Handles: resetPassword, verifyEmail
// URL: /__/auth/action?mode=...&oobCode=...

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  confirmPasswordReset,
  applyActionCode,
  verifyPasswordResetCode,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

type PageState =
  | 'loading'
  | 'reset_form'
  | 'reset_success'
  | 'verify_success'
  | 'error';

export default function AuthActionPage() {
  const params   = useSearchParams();
  const router   = useRouter();
  const mode     = params.get('mode') ?? '';
  const oobCode  = params.get('oobCode') ?? '';

  const [pageState, setPageState]   = useState<PageState>('loading');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [saving, setSaving]         = useState(false);
  const [errorMsg, setErrorMsg]     = useState('');

  // On mount: validate the oobCode and determine what to render
  useEffect(() => {
    if (!oobCode) { setPageState('error'); setErrorMsg('Enlace inválido o expirado.'); return; }

    if (mode === 'resetPassword') {
      verifyPasswordResetCode(auth, oobCode)
        .then((emailAddr) => { setEmail(emailAddr); setPageState('reset_form'); })
        .catch(() => { setPageState('error'); setErrorMsg('El enlace expiró o ya fue usado. Solicita uno nuevo.'); });

    } else if (mode === 'verifyEmail') {
      applyActionCode(auth, oobCode)
        .then(() => setPageState('verify_success'))
        .catch(() => { setPageState('error'); setErrorMsg('No se pudo verificar el correo. El enlace puede haber expirado.'); });

    } else {
      setPageState('error');
      setErrorMsg('Acción no reconocida.');
    }
  }, [mode, oobCode]);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    if (password.length < 6) { setErrorMsg('La contraseña debe tener al menos 6 caracteres.'); return; }
    if (password !== confirm) { setErrorMsg('Las contraseñas no coinciden.'); return; }
    setSaving(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setPageState('reset_success');
    } catch {
      setErrorMsg('No se pudo cambiar la contraseña. El enlace puede haber expirado.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #F0E5FF 0%, #E8D5F5 50%, #D8C5F0 100%)' }}>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl w-full max-w-md p-8 border border-white/60">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full overflow-hidden shadow-md mb-3">
            <Image src="/logo-friendlyteaching.jpg" alt="FriendlyTeaching" width={64} height={64}
              className="object-cover w-full h-full"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <p className="text-lg font-bold text-[#5A3D7A]">FriendlyTeaching.cl</p>
        </div>

        {/* ── Loading ── */}
        {pageState === 'loading' && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-[#C8A8DC] border-t-[#5A3D7A] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Verificando enlace…</p>
          </div>
        )}

        {/* ── Reset password form ── */}
        {pageState === 'reset_form' && (
          <>
            <h1 className="text-xl font-bold text-[#5A3D7A] mb-1 text-center">Nueva contraseña</h1>
            <p className="text-sm text-gray-500 text-center mb-6">Para la cuenta <strong>{email}</strong></p>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-red-600 text-sm text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Confirmar contraseña
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder="Repite la contraseña"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8]"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #5A3D7A, #9B7CB8)' }}
              >
                {saving ? 'Guardando…' : 'Cambiar contraseña'}
              </button>
            </form>
          </>
        )}

        {/* ── Reset success ── */}
        {pageState === 'reset_success' && (
          <div className="text-center py-4">
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-xl font-bold text-[#5A3D7A] mb-2">¡Contraseña actualizada!</h1>
            <p className="text-sm text-gray-500 mb-6">Ya puedes iniciar sesión con tu nueva contraseña.</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="w-full py-3 rounded-xl font-bold text-white text-sm"
              style={{ background: 'linear-gradient(135deg, #5A3D7A, #9B7CB8)' }}
            >
              Ir al login
            </button>
          </div>
        )}

        {/* ── Email verified success ── */}
        {pageState === 'verify_success' && (
          <div className="text-center py-4">
            <div className="text-5xl mb-4">📧</div>
            <h1 className="text-xl font-bold text-[#5A3D7A] mb-2">¡Correo verificado!</h1>
            <p className="text-sm text-gray-500 mb-6">Tu dirección de email ha sido confirmada correctamente.</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="w-full py-3 rounded-xl font-bold text-white text-sm"
              style={{ background: 'linear-gradient(135deg, #5A3D7A, #9B7CB8)' }}
            >
              Ir al login
            </button>
          </div>
        )}

        {/* ── Error ── */}
        {pageState === 'error' && (
          <div className="text-center py-4">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-[#5A3D7A] mb-2">Enlace inválido</h1>
            <p className="text-sm text-gray-500 mb-6">{errorMsg}</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="w-full py-3 rounded-xl font-bold text-white text-sm"
              style={{ background: 'linear-gradient(135deg, #5A3D7A, #9B7CB8)' }}
            >
              Volver al login
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
