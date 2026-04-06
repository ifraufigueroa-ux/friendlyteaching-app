// FriendlyTeaching.cl — /book route
// Redirects authenticated students to the protected booking page.
// Shows a "login required" screen for visitors without an account.
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

export default function BookRedirectPage() {
  const { firebaseUser, role, isInitialized } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;
    if (firebaseUser && role === 'student') {
      // Authenticated student → send to the real booking page inside the dashboard
      router.replace('/dashboard/student/book');
    } else if (firebaseUser && role === 'teacher') {
      router.replace('/dashboard/teacher');
    }
  }, [isInitialized, firebaseUser, role, router]);

  // Loading state
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F0E5FF 0%, #FFFCF7 100%)' }}>
        <div className="w-10 h-10 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in → show info + login CTA
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #F0E5FF 0%, #FFFCF7 100%)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#C8A8DC] flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg">
            🎓
          </div>
          <h1 className="text-2xl font-extrabold text-[#5A3D7A]">FriendlyTeaching</h1>
          <p className="text-gray-500 text-sm mt-1">Clases de inglés personalizadas</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F0E5FF] flex items-center justify-center text-3xl mx-auto mb-4">
            🔒
          </div>
          <h2 className="text-lg font-extrabold text-[#5A3D7A] mb-2">
            Inicia sesión para reservar
          </h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Para solicitar una clase necesitas una cuenta de estudiante con profesor asignado.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/auth/login"
              className="w-full py-3 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-2xl font-bold text-sm transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/auth/register"
              className="w-full py-3 bg-[#F0E5FF] hover:bg-[#E0D5FF] text-[#5A3D7A] rounded-2xl font-bold text-sm transition-colors"
            >
              Crear cuenta
            </Link>
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-400 mt-4">
          FriendlyTeaching.cl · Clases de inglés personalizadas
        </p>
      </div>
    </div>
  );
}
