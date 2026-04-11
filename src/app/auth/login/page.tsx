'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signIn, resetPassword } from '@/lib/firebase/auth';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const { role } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);
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
      if (msg.includes('invalid-credential') || msg.includes('wrong-password')) {
        setError('Email o contraseña incorrectos.');
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
