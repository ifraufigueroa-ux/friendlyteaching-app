// FriendlyTeaching.cl — Teacher · Palabra del día
// Feed dedicado con las respuestas de los estudiantes al ejercicio diario.
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useStudents } from '@/hooks/useStudents';
import TopBar from '@/components/layout/TopBar';
import TeacherWordOfDayFeed from '@/components/gamification/TeacherWordOfDayFeed';

export default function TeacherWordOfDayPage() {
  const router = useRouter();
  const { firebaseUser, role, isInitialized } = useAuthStore();
  const { students, loading } = useStudents();

  useEffect(() => {
    if (!isInitialized) return;
    if (!firebaseUser) router.replace('/auth/login');
    else if (role === 'student') router.replace('/dashboard/student');
  }, [isInitialized, firebaseUser, role, router]);

  return (
    <div className="min-h-screen p-6">
      <TopBar
        title="📖 Palabra del día"
        subtitle="Respuestas de tus estudiantes al ejercicio diario de vocabulario"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Palabra del día' },
        ]}
      />

      <div className="max-w-3xl mx-auto mt-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <TeacherWordOfDayFeed students={students} max={100} showEmpty />
        )}
      </div>
    </div>
  );
}
