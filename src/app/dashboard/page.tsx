'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

/**
 * Role-based redirect:
 * - teacher  → /dashboard/teacher
 * - student  → /dashboard/student
 * - admin    → /admin
 * - unknown  → /auth/login
 */
export default function DashboardPage() {
  const router = useRouter();
  const { role, profile, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) return;

    switch (role) {
      case 'teacher':
        router.replace('/dashboard/teacher');
        break;
      case 'student':
        router.replace('/dashboard/student');
        break;
      case 'admin':
        router.replace('/admin');
        break;
      default:
        router.replace('/auth/login');
    }
  }, [role, isInitialized, router]);

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--gradient-hero)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#9B7CB8] font-semibold">
          {profile ? `Bienvenido, ${profile.fullName.split(' ')[0]} 👋` : 'Redirigiendo...'}
        </p>
      </div>
    </div>
  );
}
