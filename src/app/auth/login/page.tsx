'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signIn, resetPassword, signInWithGoogle, isGoogleOnlyAccount } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? '';
      if (msg.includes('popup-closed-by-user') || msg.includes('cancelled-popup-request')) {
        // User closed popup — no error message needed
      } else {
        setError('No se pudo iniciar sesión con Google. Intenta de nuevo.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      // AuthProvider will update store; redirect based on role
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? '';
      if (msg.includes('account-exists-with-different-credential') || msg.includes('wrong-provider')) {
        setError('Esta cuenta usa Google para iniciar sesión. Usa el botón "Continuar con Google".');
      } else if (msg.includes('invalid-credential') || msg.includes('wrong-password')) {
        // Could be wrong password OR a Google-only account — check which
        const googleOnly = await isGoogleOnlyAccount(email);
        if (googleOnly) {
          setError('Esta cuenta fue creada con Google. Usa el botón "Continuar con Google" o restablece tu contraseña.');
        } else {
          setError('Email o contraseña incorrectos.');
        }
      } else if (msg.includes('too-many-requests')) {
        setError('Demasiados intentos. Espera un momento e intenta de nuevo.');
      } else {
        setError('Error al iniciar sesión. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Ingresa tu email primero.'); return; }
    setLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
      setShowReset(false);
    } catch {
      setError('No se pudo enviar el email. Verifica la dirección.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--gradient-primary)' }}>

      <div className="glass-strong rounded-2xl shadow-glass-xl w-full max-w-md p-8 animate-slide-in border border-white/40">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full overflow-hidden shadow-purple-md mb-3 ring-3 ring-white/30">
            <Image src="/logo-friendlyteaching.jpg" alt="Logo" width={80} height={80}
              className="object-cover w-full h-full"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ft-purple-text)' }}>
            FriendlyTeaching.cl
          </h1>
          <p className="text-gray-400 text-sm mt-1">Bienvenido de nuevo 👋</p>
        </div>

        {resetSent && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-green-700 text-sm text-center">
            ✅ Email de recuperación enviado. Revisa tu bandeja de entrada.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        {!showReset ? (
          <>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required placeholder="tu@email.com"
                className="w-full px-4 py-3 border border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] text-sm bg-white/60 backdrop-blur-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Contraseña</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                required placeholder="••••••••"
                className="w-full px-4 py-3 border border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] text-sm bg-white/60 backdrop-blur-sm"
              />
            </div>
            <Button type="submit" fullWidth loading={loading} size="lg">
              Iniciar Sesión
            </Button>
            <p className="text-center text-sm text-gray-400">
              <button type="button" onClick={() => setShowReset(true)}
                className="text-[#9B7CB8] hover:underline">
                ¿Olvidaste tu contraseña?
              </button>
            </p>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/30" />
            <span className="text-xs text-gray-400 font-medium">o continúa con</span>
            <div className="flex-1 h-px bg-white/30" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/80 hover:bg-white border border-white/60 rounded-xl text-sm font-semibold text-gray-700 shadow-sm transition-all hover-lift disabled:opacity-60"
          >
            {googleLoading ? (
              <span className="w-5 h-5 border-2 border-gray-300 border-t-[#4285F4] rounded-full animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continuar con Google
          </button>
          </>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <p className="text-sm text-gray-500 text-center">
              Ingresa tu email y te enviaremos un link para resetear tu contraseña.
            </p>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required placeholder="tu@email.com"
                className="w-full px-4 py-3 border border-white/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] text-sm bg-white/60 backdrop-blur-sm"
              />
            </div>
            <Button type="submit" fullWidth loading={loading}>Enviar Link</Button>
            <p className="text-center text-sm">
              <button type="button" onClick={() => setShowReset(false)}
                className="text-[#9B7CB8] hover:underline">
                Volver al login
              </button>
            </p>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-white/30 text-center text-sm text-gray-400">
          ¿No tienes cuenta?{' '}
          <Link href="/auth/register" className="text-[#9B7CB8] font-semibold hover:underline">
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  );
}
