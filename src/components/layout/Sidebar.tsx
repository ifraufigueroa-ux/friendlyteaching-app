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

// ── Navigation structure ─────────────────────────────────────────────────────
// Top-level items render without a section header; sections render with a header.
// `accent` is a Tailwind color used for the section's chip + active-item indicator.

type NavItem = { href: string; icon: string; label: string };
type NavSection = { section: string; accent: string; items: NavItem[] };
type NavEntry = NavItem | NavSection;

const TEACHER_NAV: NavEntry[] = [
  { href: '/dashboard/teacher', icon: '🏠', label: 'Panel Principal' },
  {
    section: 'Clases',
    accent: '#8B5CF6',
    items: [
      { href: '/dashboard/teacher/students',   icon: '👥', label: 'Estudiantes' },
      { href: '/dashboard/teacher/history',    icon: '📋', label: 'Historial' },
      { href: '/dashboard/teacher/planner',    icon: '🗂️', label: 'Planner' },
      { href: '/dashboard/teacher/reminders',  icon: '🔔', label: 'Recordatorios' },
    ],
  },
  {
    section: 'Contenido',
    accent: '#3B82F6',
    items: [
      { href: '/dashboard/teacher/lessons',      icon: '📚', label: 'Lecciones' },
      { href: '/dashboard/teacher/bulk-upload',  icon: '📥', label: 'Importar' },
      { href: '/dashboard/teacher/activities',   icon: '🎯', label: 'Actividades' },
      { href: '/dashboard/teacher/placement',    icon: '📐', label: 'Placement Test' },
    ],
  },
  {
    section: 'Seguimiento',
    accent: '#10B981',
    items: [
      { href: '/dashboard/teacher/homework', icon: '📝', label: 'Tareas' },
      { href: '/dashboard/teacher/progress', icon: '📊', label: 'Progreso' },
    ],
  },
  {
    section: 'Crecimiento',
    accent: '#EC4899',
    items: [
      { href: '/dashboard/teacher/leads',   icon: '✨', label: 'Leads' },
      { href: '/dashboard/teacher/billing', icon: '💳', label: 'Facturación' },
    ],
  },
  {
    section: 'Herramientas',
    accent: '#F59E0B',
    items: [
      { href: '/dashboard/teacher/tools', icon: '🧰', label: 'Herramientas' },
    ],
  },
];

const STUDENT_NAV: NavEntry[] = [
  { href: '/dashboard/student',          icon: '📚', label: 'Mis Lecciones' },
  { href: '/dashboard/student/homework', icon: '📝', label: 'Mis Tareas' },
  { href: '/dashboard/student/schedule', icon: '📅', label: 'Horario' },
  { href: '/dashboard/student/book',     icon: '📆', label: 'Solicitar clase' },
  { href: '/dashboard/student/progress', icon: '📊', label: 'Mi Progreso' },
];

function isSection(entry: NavEntry): entry is NavSection {
  return (entry as NavSection).section !== undefined;
}

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
    <aside className="w-64 flex-shrink-0 glass-strong flex flex-col h-full shadow-glass-md relative overflow-hidden">
      {/* Ambient decorative gradient behind the sidebar */}
      <div className="absolute -top-20 -right-16 w-56 h-56 rounded-full bg-[#C8A8DC]/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -left-16 w-48 h-48 rounded-full bg-[#F0E5FF]/40 blur-3xl pointer-events-none" />

      {/* Brand */}
      <div className="relative px-5 py-5 border-b border-white/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-purple-sm flex-shrink-0 ring-2 ring-white/60">
            <Image
              src="/logo-friendlyteaching.jpg"
              alt="FT Logo"
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          </div>
          <div>
            <p className="text-sm font-extrabold text-[#5A3D7A] leading-tight tracking-tight">FriendlyTeaching</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1 h-1 rounded-full bg-[#C8A8DC]" />
              <p className="text-[9px] text-[#9B7CB8] font-semibold uppercase tracking-widest">Panel del Profesor</p>
            </div>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="relative px-4 py-3 border-b border-white/40">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-gradient-to-r from-white/60 to-white/30 shadow-sm">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C8A8DC] to-[#8B5CF6] flex items-center justify-center text-sm font-bold text-white shadow-purple-sm">
              {firstName[0]?.toUpperCase() ?? '?'}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-800 truncate leading-tight">{firstName}</p>
            <p className="text-[9px] text-[#9B7CB8] font-semibold uppercase tracking-widest">
              {role === 'teacher' ? 'Profesor' : 'Estudiante'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 px-3 py-4 overflow-y-auto">
        {nav.map((entry, idx) => {
          if (isSection(entry)) {
            return (
              <div key={entry.section} className={idx > 0 ? 'mt-4' : ''}>
                <div className="flex items-center gap-2 px-3 mb-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: entry.accent }}
                  />
                  <p
                    className="text-[10px] font-extrabold uppercase tracking-[0.14em]"
                    style={{ color: entry.accent }}
                  >
                    {entry.section}
                  </p>
                  <span
                    className="flex-1 h-px opacity-30"
                    style={{ background: `linear-gradient(90deg, ${entry.accent}, transparent)` }}
                  />
                </div>
                <div className="space-y-0.5">
                  {entry.items.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      accent={entry.accent}
                      pathname={pathname}
                      badge={navBadges.get(item.href) ?? 0}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              </div>
            );
          }
          return (
            <div key={entry.href} className={idx > 0 ? 'mt-1' : 'mb-2'}>
              <NavLink
                item={entry}
                accent="#5A3D7A"
                pathname={pathname}
                badge={navBadges.get(entry.href) ?? 0}
                onNavigate={onNavigate}
                prominent
              />
            </div>
          );
        })}
      </nav>

      {/* Bottom: profile + logout */}
      <div className="relative px-3 py-3 border-t border-white/40 space-y-1">
        <Link
          href="/dashboard/profile"
          onClick={onNavigate}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
            pathname === '/dashboard/profile'
              ? 'bg-[#F0E5FF] text-[#5A3D7A] font-semibold'
              : 'text-gray-500 hover:bg-white/50 hover:text-[#5A3D7A]'
          }`}
        >
          <span className="text-base">⚙️</span>
          Mi Perfil
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all"
        >
          <span className="text-base">🚪</span>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}

// ── Nav link ─────────────────────────────────────────────────────────────────

function NavLink({
  item, accent, pathname, badge, onNavigate, prominent = false,
}: {
  item: NavItem;
  accent: string;
  pathname: string;
  badge: number;
  onNavigate?: () => void;
  prominent?: boolean;
}) {
  const isRoot = item.href === '/dashboard/teacher' || item.href === '/dashboard/student';
  const isActive = pathname === item.href || (!isRoot && pathname.startsWith(item.href));

  // Prominent variant: used for the ungrouped "Panel Principal" — richer chip look.
  if (prominent) {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 overflow-hidden ${
          isActive
            ? 'bg-gradient-to-r from-[#5A3D7A] to-[#8B5CF6] text-white shadow-purple-md'
            : 'bg-white/60 text-[#5A3D7A] hover:bg-white/90 hover:shadow-sm border border-white/60'
        }`}
      >
        <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-base ${
          isActive ? 'bg-white/20' : 'bg-[#F0E5FF]'
        }`}>
          {item.icon}
        </span>
        <span className="flex-1">{item.label}</span>
        {badge > 0 && (
          <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      style={isActive ? {
        background: `linear-gradient(90deg, ${accent}18, ${accent}08 60%, transparent)`,
      } : undefined}
      className={`group relative flex items-center gap-2.5 pl-3 pr-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
        isActive
          ? 'font-semibold shadow-sm'
          : 'text-gray-600 hover:bg-white/50 hover:shadow-sm'
      }`}
    >
      {/* Left accent bar — visible on active or hover */}
      <span
        className={`absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full transition-opacity ${
          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
        }`}
        style={{ background: accent }}
      />
      <span
        className={`text-base transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}
      >
        {item.icon}
      </span>
      <span
        className="flex-1 truncate"
        style={isActive ? { color: accent } : undefined}
      >
        {item.label}
      </span>
      {badge > 0 && (
        <span
          className="flex-shrink-0 min-w-[18px] h-[18px] px-1.5 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none shadow-sm"
          style={{ background: accent }}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );
}
