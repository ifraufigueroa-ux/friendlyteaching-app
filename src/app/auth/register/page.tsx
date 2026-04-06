'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signUp } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/Button';

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [teacherCode, setTeacherCode] = useState('');
  const [isTeacher, setIsTeacher] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const result = await signUp({
        email,
        password,
        fullName,
        phone,
        teacherCode: isTeacher ? teacherCode : undefined,
      });

      if (result.role === 'student') {
        // Notify teacher (fire-and-forget)
        const teacherEmail = process.env.NEXT_PUBLIC_TEACHER_EMAIL;
        if (teacherEmail) {
          fetch("/api/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "student_registered", to: teacherEmail, studentName: fullName, appUrl: process.env.NEXT_PUBLIC_APP_URL }),
          }).catch(() => {});
        }
        setSuccess(true);
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? '';
      if (msg.includes('email-already-in-use')) {
        setError('Este email ya está registrado. Intenta iniciar sesión.');
      } else {
        setError('Error al crear la cuenta. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'var(--gradient-primary)' }}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center animate-slide-in">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--ft-purple-text)' }}>
            ¡Cuenta creada!
          </h2>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">
            Tu cuenta está pendiente de aprobación. Tu profesor recibirá una notificación
            y activará tu acceso pronto.
          </p>
          <Link href="/auth/login">
            <Button fullWidth>Ir al Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--gradient-primary)' }}>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-slide-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full overflow-hidden shadow-md mb-3">
            <Image src="/logo-friendlyteaching.jpg" alt="Logo" width={64} height={64}
              className="object-cover w-full h-full"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--ft-purple-text)' }}>
            Crear Cuenta
          </h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        {/* Toggle Student/Teacher */}
        <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-5">
          {[
            { label: '👩‍🎓 Estudiante', value: false },
            { label: '👩‍🏫 Profesor', value: true },
          ].map(({ label, value }) => (
            <button key={label} type="button" onClick={() => setIsTeacher(value)}
              className={[
                'flex-1 py-2.5 text-sm font-semibold transition-colors',
                isTeacher === value
                  ? 'bg-[#C8A8DC] text-white'
                  : 'bg-white text-gray-400 hover:bg-gray-50',
              ].join(' ')}>
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleRegister} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre completo</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} required
              placeholder="Ana García"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="tu@email.com"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Teléfono (opcional)</label>
            <input value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+56 9 1234 5678"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="Mínimo 6 caracteres"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Confirmar contraseña</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
              placeholder="Repite tu contraseña"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] text-sm" />
          </div>
          {isTeacher && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Código de Profesor</label>
              <input value={teacherCode} onChange={e => setTeacherCode(e.target.value)} required
                placeholder="Código proporcionado por FriendlyTeaching"
                className="w-full px-3 py-2.5 border border-[#C8A8DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] text-sm bg-[#F0E5FF]" />
            </div>
          )}
          <Button type="submit" fullWidth loading={loading} size="lg" className="mt-2">
            Crear Cuenta
          </Button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-5">
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/login" className="text-[#9B7CB8] font-semibold hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
