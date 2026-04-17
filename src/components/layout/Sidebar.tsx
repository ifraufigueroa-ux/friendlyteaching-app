// FriendlyTeaching.cl — Sidebar
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { logOut } from '@/lib/firebase/auth';
import { useStudentHomework, useTeacherHomework } from '@/hooks/useHomework';
import { useStudents } from '@/hooks/useStudents';
import { usePlacementSessions } from '@/hooks/usePlacementSessions';

// ── Notification badge counts ─────────────────────────────────────────────────

// Returns a map of href → badge count for the current user.
// useStudents() reads teacherId from authStore internally — safe to call for both roles
// (it no-ops when teacherId is empty).
function useNavBadges(role: string | null, uid: string): Map<string, number> {
  const studentHw = useStudentHomework(role === 'student' ? uid : '');
  const teacherHw = useTeacherHomework(role === 'teacher' ? uid : '');
  const { pendingStudents } = useStudents();
  const { sessions: placementSessions } = usePlacementSessions(role === 'teacher' ? uid : '');

  // Memoize badge calculation to prevent unnecessary Map recreations
  return useMemo(() => {
    const badges = new Map<string, number>();

    if (role === 'student') {
      const pending = studentHw.homework.filter(h => h.status === 'assigned' || h.status === 'pending').length;
      if (pending > 0) badges.set('/dashboard/student/homework', pending);
    }

    if (role === 'teacher') {
      const toReview = teacherHw.homework.filter(h => h.status === 'submitted').length;
      if (toReview > 0) badges.set('/dashboard/teacher/homework', toReview);
      if (pendingStudents.length > 0) badges.set('/dashboard/teacher/students', pendingStudents.length);
      const unlinkedPlacements = placementSessions.filter(
        (s) => !s.linkedStudentId && s.status !== 'in_progress',
      ).length;
      if (unlinkedPlacements > 0) badges.set('/dashboard/teacher/placement', unlinkedPlacements);
    }

    return badges;
  }, [role, studentHw.homework, teacherHw.homework, pendingStudents, placementSessions]);
}

const TEACHER_NAV = [
  { href: '/dashboard/teacher', icon: '🏠', label: 'Panel Principal' },
  { href: '/dashboard/teacher/students', icon: '👥', label: 'Estudiantes' },
  { href: '/dashboard/teacher/history', icon: '📋', label: 'Historial de clases' },
  { href: '/dashboard/teacher/lessons', icon: '📚', label: 'Lecciones' },
  { href: '/dashboard/teacher/bulk-upload', icon: '📥', label: 'Importar lecciones' },
  { href: '/dashboard/teacher/homework', icon: '📝', label: 'Tareas' },
  { href: '/dashboard/teacher/progress', icon: '📊', label: 'Progreso' },
  { href: '/dashboard/teacher/planner', icon: '🗂️', label: 'Planner' },
  { href: '/dashboard/teacher/reminders', icon: '🔔', label: 'Recordatorios' },
  { href: '/dashboard/teacher/billing', icon: '💳', label: 'Facturación' },
  { href: '/dashboard/teacher/activities', icon: '🎯', label: 'Actividades' },
  { href: '/dashboard/teacher/placement', icon: '📐', label: 'Placement Test' },
];

const STUDENT_NAV = [
  { href: '/dashboard/student', icon: '📚', label: 'Mis Lecciones' },
  { href: '/dashboard/student/homework', icon: '📝', label: 'Mis Tareas' },
  { href: '/dashboard/student/schedule', icon: '📅', label: 'Horario' },
  { href: '/dashboard/student/book', icon: '📆', label: 'Solicitar clase' },
  { href: '/dashboard/student/progress', icon: '📊', label: 'Mi Progreso' },
];

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { profile, role } = useAuthStore();
  const pathname = usePathname();
  const uid = profile?.uid ?? '';

  const navBadges = useNavBadges(role, uid);

  const nav = role === 'teacher' ? TEACHER_NAV : STUDENT_NAV;
  const firstName = profile?.fullName?.split(' ')[0] ?? '';

  async function handleLogout() {
    await logOut();
    window.location.href = '/';
  }

  return (
    <aside className="w-60 flex-shrink-0 glass-strong flex flex-col h-full shadow-glass-md">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-white/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden shadow-purple-sm flex-shrink-0 ring-2 ring-[#C8A8DC]/20">
            <Image
              src="/logo-friendlyteaching.jpg"
              alt="FT Logo"
              width={36}
              height={36}
              className="object-cover w-full h-full"
            />
          </div>
          <div>
            <p className="text-xs font-bold text-[#5A3D7A] leading-tight">FriendlyTeaching</p>
            <p className="text-[10px] text-gray-400">.cl</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-white/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F0E5FF] to-[#E0D5FF] flex items-center justify-center text-sm font-bold text-[#5A3D7A] shadow-purple-sm">
            {firstName[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{firstName}</p>
            <p className="text-[10px] text-[#9B7CB8] font-medium uppercase tracking-wider">
              {role === 'teacher' ? 'Profesor' : 'Estudiante'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(({ href, icon, label }) => {
          const isActive = pathname === href || (href !== '/dashboard/teacher' && href !== '/dashboard/student' && pathname.startsWith(href));
          const badge = navBadges.get(href) ?? 0;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-gradient-to-r from-[#F0E5FF] to-[#E8DAFF] text-[#5A3D7A] font-semibold shadow-purple-sm nav-active'
                  : 'text-gray-600 hover:bg-[#F0E5FF]/40 hover:text-[#5A3D7A] hover:shadow-sm'}
              `}
            >
              <span className="text-base">{icon}</span>
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: profile + logout */}
      <div className="px-3 py-3 border-t border-white/30 space-y-1">
        <Link
          href="/dashboard/profile"
          onClick={onNavigate}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all ${
            pathname === '/dashboard/profile'
              ? 'bg-[#F0E5FF] text-[#5A3D7A] font-semibold'
              : 'text-gray-500 hover:bg-gray-50 hover:text-[#5A3D7A]'
          }`}
        >
          <span className="text-base">⚙️</span>
          Mi Perfil
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all"
        >
          <span className="text-base">🚪</span>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
