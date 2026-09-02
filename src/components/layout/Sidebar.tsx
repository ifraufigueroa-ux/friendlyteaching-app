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
import { useCoworkAnnouncements } from '@/hooks/useCoworkAnnouncements';
import { useCoworkChatUnread } from '@/hooks/useCoworkChatUnread';
import { useNewLeadsCount } from '@/hooks/useNewLeadsCount';

// ── Types ─────────────────────────────────────────────────────

type NavLink = {
  type: 'link';
  href: string;
  icon: string;
  label: string;
  iconBg: string;
  iconColor: string;
  // Path a un PNG de /public/sidebar-icons/. Si está seteado, se
  // renderiza la imagen en lugar del emoji. Los iconos son ilustraciones
  // del mascot cat con background de color ya integrado — el iconBg del
  // container queda de fallback para items sin imagen.
  iconImg?: string;
};
type NavGroup = { type: 'group'; label: string };
type NavItem = NavLink | NavGroup;

// ── Nav definitions ───────────────────────────────────────────

const TEACHER_NAV: NavItem[] = [
  { type: 'link', href: '/dashboard/teacher',             icon: '🏠', label: 'Panel Principal',   iconBg: 'bg-violet-100',  iconColor: 'text-violet-600' },
  { type: 'group', label: 'Equipo' },
  { type: 'link', href: '/dashboard/teacher/cowork',      icon: '🧑‍🏫', label: 'Co-Work',           iconBg: 'bg-fuchsia-100', iconColor: 'text-fuchsia-600', iconImg: '/sidebar-icons/co-work.png' },
  { type: 'group', label: 'Gestión' },
  { type: 'link', href: '/dashboard/teacher/students',    icon: '👥', label: 'Estudiantes',        iconBg: 'bg-sky-100',     iconColor: 'text-sky-600'    },
  { type: 'link', href: '/dashboard/teacher/history',     icon: '📋', label: 'Historial de clases',iconBg: 'bg-sky-100',     iconColor: 'text-sky-600'    },
  { type: 'group', label: 'Contenido' },
  { type: 'link', href: '/dashboard/teacher/lessons',     icon: '📚', label: 'Librería',           iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', iconImg: '/sidebar-icons/lecciones.png' },
  { type: 'link', href: '/dashboard/teacher/bulk-upload', icon: '📥', label: 'Importar lecciones', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', iconImg: '/sidebar-icons/importar-lecciones.png' },
  { type: 'link', href: '/dashboard/teacher/planner',     icon: '🗂️', label: 'Planner',            iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', iconImg: '/sidebar-icons/planner.png' },
  { type: 'group', label: 'Seguimiento' },
  { type: 'link', href: '/dashboard/teacher/homework',     icon: '📝', label: 'Tareas',             iconBg: 'bg-amber-100',   iconColor: 'text-amber-600', iconImg: '/sidebar-icons/tareas.png'  },
  { type: 'link', href: '/dashboard/teacher/progress',     icon: '📊', label: 'Progreso',           iconBg: 'bg-amber-100',   iconColor: 'text-amber-600', iconImg: '/sidebar-icons/placement-test.png'  },
  { type: 'link', href: '/dashboard/teacher/word-of-day',  icon: '📖', label: 'Palabra del día',    iconBg: 'bg-amber-100',   iconColor: 'text-amber-600', iconImg: '/sidebar-icons/palabra-dia.png'  },
  { type: 'link', href: '/dashboard/teacher/placement',    icon: '📐', label: 'Placement Test',     iconBg: 'bg-amber-100',   iconColor: 'text-amber-600', iconImg: '/sidebar-icons/placement-test.png'  },
  { type: 'group', label: 'Administración' },
  { type: 'link', href: '/dashboard/teacher/admin/leads',  icon: '📨', label: 'Leads',              iconBg: 'bg-rose-100',    iconColor: 'text-rose-600',   iconImg: '/sidebar-icons/leads.png' },
  { type: 'link', href: '/dashboard/teacher/reminders',   icon: '🔔', label: 'Recordatorios',      iconBg: 'bg-slate-100',   iconColor: 'text-slate-500',  iconImg: '/sidebar-icons/recordatorios.png' },
  { type: 'link', href: '/dashboard/teacher/billing',     icon: '💳', label: 'Facturación',        iconBg: 'bg-slate-100',   iconColor: 'text-slate-500',  iconImg: '/sidebar-icons/facturacion.png' },
  { type: 'link', href: '/dashboard/teacher/activities',  icon: '🎯', label: 'Actividades',        iconBg: 'bg-slate-100',   iconColor: 'text-slate-500',  iconImg: '/sidebar-icons/actividades.png' },
  { type: 'link', href: '/dashboard/teacher/tools',       icon: '🛠️', label: 'Herramientas',       iconBg: 'bg-slate-100',   iconColor: 'text-slate-500'  },
  { type: 'group', label: 'Ayuda' },
  { type: 'link', href: '/dashboard/teacher/help',        icon: '📖', label: 'Tutoriales',          iconBg: 'bg-teal-100',    iconColor: 'text-teal-600'   },
];

const STUDENT_NAV: NavItem[] = [
  { type: 'link', href: '/dashboard/student',             icon: '🏠', label: 'Panel Principal',    iconBg: 'bg-violet-100',  iconColor: 'text-violet-600' },
  { type: 'group', label: 'Aprendizaje' },
  { type: 'link', href: '/dashboard/student/lessons',     icon: '📚', label: 'Mis Lecciones',      iconBg: 'bg-violet-100',  iconColor: 'text-violet-600' },
  { type: 'link', href: '/dashboard/student/music',       icon: '🎵', label: 'Friendlyrics®',      iconBg: 'bg-pink-100',    iconColor: 'text-pink-600'   },
  { type: 'link', href: '/dashboard/student/texts',       icon: '📖', label: 'FriendlyTales®',     iconBg: 'bg-slate-100',   iconColor: 'text-slate-700'  },
  { type: 'group', label: 'Mis Clases' },
  { type: 'link', href: '/dashboard/student/schedule',    icon: '📅', label: 'Horario',            iconBg: 'bg-sky-100',     iconColor: 'text-sky-600'    },
  { type: 'link', href: '/dashboard/student/book',        icon: '📆', label: 'Solicitar clase',    iconBg: 'bg-sky-100',     iconColor: 'text-sky-600'    },
  { type: 'group', label: 'Seguimiento' },
  { type: 'link', href: '/dashboard/student/homework',    icon: '📝', label: 'Mis Tareas',         iconBg: 'bg-amber-100',   iconColor: 'text-amber-600'  },
  { type: 'link', href: '/dashboard/student/progress',    icon: '📊', label: 'Mi Progreso',        iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600'},
  { type: 'group', label: 'Ayuda' },
  { type: 'link', href: '/dashboard/teacher/help',        icon: '📖', label: 'Tutoriales',          iconBg: 'bg-teal-100',    iconColor: 'text-teal-600'   },
];

// ── Badge hook ────────────────────────────────────────────────

function useNavBadges(role: string | null, uid: string): Map<string, number> {
  const studentHw  = useStudentHomework(role === 'student' ? uid : '');
  const teacherHw  = useTeacherHomework(role === 'teacher' ? uid : '');
  const { pendingStudents } = useStudents();
  const { sessions: placementSessions } = usePlacementSessions(role === 'teacher' ? uid : '');
  // Avisos + mensajes del COWORK sin leer — sólo mide para profes; los
  // hooks quedan ociosos para estudiantes porque el guard del componente
  // los desmonta al cambiar de rol.
  const { unreadCount: coworkAnnUnread } = useCoworkAnnouncements(role === 'teacher' ? uid : '');
  const coworkChatUnread = useCoworkChatUnread(role === 'teacher' ? uid : '');
  const newLeads = useNewLeadsCount(role === 'teacher');

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
      const unlinked = placementSessions.filter(s => !s.linkedStudentId && s.status !== 'in_progress').length;
      if (unlinked > 0) badges.set('/dashboard/teacher/placement', unlinked);
      const coworkTotal = coworkAnnUnread + coworkChatUnread;
      if (coworkTotal > 0) badges.set('/dashboard/teacher/cowork', coworkTotal);
      if (newLeads > 0) badges.set('/dashboard/teacher/admin/leads', newLeads);
    }
    return badges;
  }, [role, studentHw.homework, teacherHw.homework, pendingStudents, placementSessions, coworkAnnUnread, coworkChatUnread, newLeads]);
}

// ── Component ─────────────────────────────────────────────────

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { profile, role } = useAuthStore();
  const pathname = usePathname();
  const uid       = profile?.uid ?? '';
  const firstName = profile?.fullName?.split(' ')[0] ?? '';
  const lastName  = profile?.fullName?.split(' ').slice(1).join(' ') ?? '';

  const navBadges = useNavBadges(role, uid);
  const nav = role === 'teacher' ? TEACHER_NAV : STUDENT_NAV;

  async function handleLogout() {
    await logOut();
    window.location.href = '/';
  }

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col h-full bg-white border-r border-gray-100 shadow-[2px_0_16px_rgba(90,61,122,0.06)]">

      {/* ── Brand ───────────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-md flex-shrink-0 ring-2 ring-[#C8A8DC]/30">
            <Image src="/logo-friendlyteaching.jpg" alt="FT" width={40} height={40} className="object-cover w-full h-full" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-[#3D1F6B] leading-tight tracking-tight">FriendlyTeaching</p>
            <p className="text-[10px] font-medium text-[#C8A8DC] tracking-widest">.cl</p>
          </div>
        </div>
      </div>

      {/* ── User card ───────────────────────────────────────── */}
      <div className="mx-3 mb-4 rounded-2xl bg-gradient-to-br from-[#F5EEFF] via-[#EDE5FF] to-[#E6DAFF] px-4 py-3 border border-[#DDD0F5]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B5EA7] to-[#5A3D7A] flex items-center justify-center text-base font-bold text-white shadow-md flex-shrink-0 select-none">
            {firstName[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#3D1F6B] leading-tight truncate">{firstName} {lastName}</p>
            <span className={`inline-block mt-0.5 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
              role === 'teacher'
                ? 'bg-[#5A3D7A] text-white'
                : 'bg-[#D4EDDA] text-[#2E7D4F]'
            }`}>
              {role === 'teacher' ? 'Profesor' : 'Estudiante'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Navigation ──────────────────────────────────────── */}
      <nav className="flex-1 px-3 pb-4 overflow-y-auto space-y-0.5">
        {nav.map((item, i) => {
          if (item.type === 'group') {
            return (
              <p key={`group-${i}`} className="pt-4 pb-1.5 px-3 text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#C8A8DC] select-none">
                {item.label}
              </p>
            );
          }

          const { href, icon, label, iconBg, iconColor, iconImg } = item;
          const isActive = pathname === href || (
            href !== '/dashboard/teacher' && href !== '/dashboard/student' && pathname.startsWith(href)
          );
          const badge = navBadges.get(href) ?? 0;

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#F0E5FF] text-[#3D1F6B] font-semibold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-[#5A3D7A]'
              }`}
            >
              {/* Active left accent bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-[#5A3D7A]" />
              )}

              {/* Icon container — usa imagen si iconImg está seteado, sino
                  emoji. Las ilustraciones del cat mascot traen su propio
                  background de color, así que salteamos iconBg cuando hay
                  imagen. Active state: ring alrededor + scale para no
                  pintar sobre la ilustración. */}
              {iconImg ? (
                <span className={`w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 transition-all duration-150 ${
                  isActive ? 'ring-2 ring-[#5A3D7A] scale-105 shadow-sm' : 'group-hover:scale-105 group-hover:ring-1 group-hover:ring-[#C8A8DC]'
                }`}>
                  <Image src={iconImg} alt="" width={32} height={32} className="w-full h-full object-cover" />
                </span>
              ) : (
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 transition-transform duration-150 ${
                  isActive ? 'bg-[#5A3D7A] text-white shadow-sm scale-105' : `${iconBg} ${iconColor} group-hover:scale-105`
                }`}>
                  {icon}
                </span>
              )}

              <span className="flex-1 truncate">{label}</span>

              {badge > 0 && (
                <span className="flex-shrink-0 min-w-[20px] h-[20px] px-1.5 bg-red-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center leading-none shadow-[0_2px_6px_rgba(239,68,68,0.45)] ring-2 ring-white animate-pulse">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom: profile + logout ─────────────────────────── */}
      <div className="px-3 py-3 border-t border-gray-100 space-y-0.5">
        <Link
          href="/dashboard/profile"
          onClick={onNavigate}
          className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            pathname === '/dashboard/profile'
              ? 'bg-[#F0E5FF] text-[#3D1F6B] font-semibold'
              : 'text-gray-400 hover:bg-gray-50 hover:text-[#5A3D7A]'
          }`}
        >
          <span className={`w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
            pathname === '/dashboard/profile' ? 'ring-2 ring-[#5A3D7A] scale-105 shadow-sm' : 'group-hover:scale-105 group-hover:ring-1 group-hover:ring-[#C8A8DC]'
          }`}>
            <Image src="/sidebar-icons/mi-perfil.png" alt="" width={32} height={32} className="w-full h-full object-cover" />
          </span>
          Mi Perfil
        </Link>
        <button
          onClick={handleLogout}
          className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
        >
          <span className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 transition-all group-hover:scale-105 group-hover:ring-1 group-hover:ring-red-300">
            <Image src="/sidebar-icons/cerrar-sesion.png" alt="" width={32} height={32} className="w-full h-full object-cover" />
          </span>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
