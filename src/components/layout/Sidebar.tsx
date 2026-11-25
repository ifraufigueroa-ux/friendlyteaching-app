// FriendlyTeaching.cl — Sidebar
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import {
  Home,
  GraduationCap,
  Users,
  ClipboardList,
  BookOpen,
  Download,
  FolderKanban,
  FileText,
  BarChart3,
  BookMarked,
  Ruler,
  Mail,
  Bell,
  CreditCard,
  UserPlus,
  Wrench,
  LifeBuoy,
  Calendar,
  CalendarPlus,
  Flame,
  Trophy,
  ExternalLink,
  Smartphone,
  Activity,
  type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { logOut } from '@/lib/firebase/auth';
import { useStudentHomework, useTeacherHomework } from '@/hooks/useHomework';
import { useStudents } from '@/hooks/useStudents';
import { usePlacementSessions } from '@/hooks/usePlacementSessions';
import { useCoworkAnnouncements } from '@/hooks/useCoworkAnnouncements';
import { useCoworkChatUnread } from '@/hooks/useCoworkChatUnread';
import { useCoworkChatSound } from '@/hooks/useCoworkChatSound';
import { useNewLeadsCount } from '@/hooks/useNewLeadsCount';
import { useStudentWeeklyIelts } from '@/hooks/useWeeklyIelts';

// ── Types ─────────────────────────────────────────────────────

type NavLink = {
  type: 'link';
  href: string;
  icon: LucideIcon;
  label: string;
  iconBg: string;
  iconColor: string;
  // Path a un PNG de /public/sidebar-icons/. Si está seteado, se
  // renderiza la imagen en lugar del icono lucide. Los iconos PNG
  // son ilustraciones del mascot cat con background de color ya
  // integrado — el iconBg queda de fallback para items sin imagen.
  iconImg?: string;
  // External shortcut (Ellii, Off2Class, Sounter…). When true the
  // render path uses a plain <a target="_blank"> and does not try to
  // compute an active state against the pathname.
  external?: boolean;
};
type NavGroup = { type: 'group'; label: string };
type NavItem = NavLink | NavGroup;

// ── Nav definitions ───────────────────────────────────────────

const TEACHER_NAV: NavItem[] = [
  { type: 'link', href: '/dashboard/teacher',             icon: Home,          label: 'Dashboard',          iconBg: 'bg-violet-100',  iconColor: 'text-violet-600', iconImg: '/sidebar-icons/panel-principal.png' },
  { type: 'group', label: 'Team' },
  { type: 'link', href: '/dashboard/teacher/cowork',      icon: GraduationCap, label: 'Co-Work',            iconBg: 'bg-fuchsia-100', iconColor: 'text-fuchsia-600', iconImg: '/sidebar-icons/co-work.png' },
  { type: 'group', label: 'Management' },
  { type: 'link', href: '/dashboard/teacher/students',    icon: Users,         label: 'Students',           iconBg: 'bg-sky-100',     iconColor: 'text-sky-600',    iconImg: '/sidebar-icons/estudiantes.png' },
  { type: 'link', href: '/dashboard/teacher/history',     icon: ClipboardList, label: 'Class History',      iconBg: 'bg-sky-100',     iconColor: 'text-sky-600',    iconImg: '/sidebar-icons/historial-clases.png' },
  { type: 'group', label: 'Content' },
  { type: 'link', href: '/dashboard/teacher/lessons',     icon: BookOpen,      label: 'Library',            iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', iconImg: '/sidebar-icons/lecciones.png' },
  { type: 'link', href: '/dashboard/teacher/bulk-upload', icon: Download,      label: 'Import Lessons',     iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', iconImg: '/sidebar-icons/importar-lecciones.png' },
  { type: 'link', href: '/dashboard/teacher/planner',     icon: FolderKanban,  label: 'Planner',            iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', iconImg: '/sidebar-icons/planner.png' },
  { type: 'group', label: 'Tracking' },
  { type: 'link', href: '/dashboard/teacher/homework',     icon: FileText,     label: 'Homework',           iconBg: 'bg-amber-100',   iconColor: 'text-amber-600', iconImg: '/sidebar-icons/tareas.png'  },
  { type: 'link', href: '/dashboard/teacher/progress',     icon: BarChart3,    label: 'Progress',           iconBg: 'bg-amber-100',   iconColor: 'text-amber-600', iconImg: '/sidebar-icons/placement-test.png'  },
  { type: 'link', href: '/dashboard/teacher/word-of-day',  icon: BookMarked,   label: 'Word of the Day',    iconBg: 'bg-amber-100',   iconColor: 'text-amber-600', iconImg: '/sidebar-icons/palabra-dia.png'  },
  { type: 'link', href: '/dashboard/teacher/placement',    icon: Ruler,        label: 'Placement Test',     iconBg: 'bg-amber-100',   iconColor: 'text-amber-600', iconImg: '/sidebar-icons/placement-test.png'  },
  { type: 'group', label: 'Administration' },
  { type: 'link', href: '/dashboard/teacher/monitoring',   icon: Activity,     label: 'Monitoring',         iconBg: 'bg-rose-100',    iconColor: 'text-rose-600' },
  { type: 'link', href: '/dashboard/teacher/admin/leads',  icon: Mail,         label: 'Leads',              iconBg: 'bg-rose-100',    iconColor: 'text-rose-600',   iconImg: '/sidebar-icons/leads.png' },
  { type: 'link', href: '/dashboard/teacher/reminders',   icon: Bell,          label: 'Reminders',          iconBg: 'bg-slate-100',   iconColor: 'text-slate-500',  iconImg: '/sidebar-icons/recordatorios.png' },
  { type: 'link', href: '/dashboard/teacher/billing',     icon: CreditCard,    label: 'Billing',            iconBg: 'bg-slate-100',   iconColor: 'text-slate-500',  iconImg: '/sidebar-icons/facturacion.png' },
  { type: 'link', href: '/dashboard/teacher/assign',      icon: UserPlus,      label: 'Assignments',        iconBg: 'bg-slate-100',   iconColor: 'text-slate-500' },
  { type: 'link', href: '/dashboard/teacher/tools',       icon: Wrench,        label: 'Tools',              iconBg: 'bg-slate-100',   iconColor: 'text-slate-500',  iconImg: '/sidebar-icons/herramientas.png' },
  { type: 'link', href: '/dashboard/teacher/toefl/lessons', icon: GraduationCap, label: 'TOEFL Lessons',    iconBg: 'bg-violet-100',  iconColor: 'text-violet-600' },
  { type: 'link', href: '/ielts-lessons/listening-intro.html', icon: GraduationCap, label: 'IELTS Lessons', iconBg: 'bg-rose-100', iconColor: 'text-rose-600', external: true },
  { type: 'group', label: 'Help' },
  { type: 'link', href: '/dashboard/teacher/help',        icon: LifeBuoy,      label: 'Tutorials',          iconBg: 'bg-teal-100',    iconColor: 'text-teal-600',   iconImg: '/sidebar-icons/tutoriales.png' },
];

// Flat corporate nav (no section headers, no 'Master Account' row — the
// page you land on IS the Master Account, so the row was redundant).
// 'Panel Principal' is the primary row for /dashboard/corporate and
// takes the active state on load.
const CORPORATE_NAV: NavItem[] = [
  { type: 'link', href: '/dashboard/corporate',               icon: Home,         label: 'Panel Principal',  iconBg: 'bg-violet-100', iconColor: 'text-violet-600', iconImg: '/sidebar-icons/panel-principal.png' },
  { type: 'link', href: '/dashboard/corporate/students',      icon: Users,        label: 'Estudiantes',      iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', iconImg: '/sidebar-icons/corporate/estudiante.png' },
  { type: 'link', href: '/dashboard/corporate/attendance',    icon: ClipboardList,label: 'Asistencia',       iconBg: 'bg-violet-100', iconColor: 'text-violet-600', iconImg: '/sidebar-icons/corporate/asistencia.png' },
  { type: 'link', href: '/dashboard/corporate#historial',     icon: BarChart3,    label: 'Historial de clases', iconBg: 'bg-sky-100', iconColor: 'text-sky-600', iconImg: '/sidebar-icons/corporate/historial-clases.png' },
  { type: 'link', href: '/dashboard/teacher/help',            icon: LifeBuoy,     label: 'Tutoriales',       iconBg: 'bg-teal-100',   iconColor: 'text-teal-600',   iconImg: '/sidebar-icons/tutoriales.png' },
];

const STUDENT_NAV: NavItem[] = [
  { type: 'link', href: '/dashboard/student',             icon: Home,         label: 'Dashboard',           iconBg: 'bg-violet-100',  iconColor: 'text-violet-600', iconImg: '/sidebar-icons/panel-principal.png' },
  { type: 'group', label: 'Learning' },
  { type: 'link', href: '/dashboard/student/practice',    icon: Flame,        label: 'Daily Practice',      iconBg: 'bg-orange-100',  iconColor: 'text-orange-600' },
  { type: 'link', href: '/dashboard/student/lessons',     icon: BookOpen,     label: 'My Lessons',          iconBg: 'bg-violet-100',  iconColor: 'text-violet-600' },
  { type: 'link', href: '/dashboard/student/library',     icon: BookMarked,   label: 'Library',             iconBg: 'bg-rose-100',    iconColor: 'text-rose-600' },
  { type: 'group', label: 'My Classes' },
  { type: 'link', href: '/dashboard/student/schedule',    icon: Calendar,     label: 'Schedule',            iconBg: 'bg-sky-100',     iconColor: 'text-sky-600'    },
  { type: 'link', href: '/dashboard/student/book',        icon: CalendarPlus, label: 'Request Class',       iconBg: 'bg-sky-100',     iconColor: 'text-sky-600'    },
  { type: 'group', label: 'Tracking' },
  { type: 'link', href: '/dashboard/student/homework',    icon: FileText,     label: 'My Homework',         iconBg: 'bg-amber-100',   iconColor: 'text-amber-600'  },
  { type: 'link', href: '/dashboard/student/progress',    icon: BarChart3,    label: 'My Progress',         iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600'},
];

// Weekly IELTS slots in under Daily Practice in the Learning group,
// but only when the teacher has assigned it. We rebuild the array on
// demand so the condition stays close to the data.
//
// shortcuts: teacher-configured external platform links (Ellii,
// Off2Class, Sounter) that the student opens in a new tab. Appended
// AFTER the Tracking group so the shortcut section sits at the bottom
// of the sidebar, under My Progress.
function studentNavWithWeeklyIelts(
  hasAssignment: boolean,
  shortcuts: NavLink[],
  showInstall: boolean,
): NavItem[] {
  const base: NavItem[] = [];
  for (const item of STUDENT_NAV) {
    base.push(item);
    if (hasAssignment && item.type === 'link' && item.href === '/dashboard/student/practice') {
      base.push({
        type: 'link',
        href: '/dashboard/student/weekly-ielts',
        icon: Trophy,
        label: 'Weekly IELTS',
        iconBg: 'bg-rose-100',
        iconColor: 'text-rose-600',
      });
    }
  }
  if (shortcuts.length > 0) {
    base.push({ type: 'group', label: 'Shortcuts' });
    for (const s of shortcuts) base.push(s);
  }
  // Install-app entry lives only when the app isn't already running as
  // a PWA. Appended at the very bottom so it doesn't crowd the main
  // learning nav but is still a tap away.
  if (showInstall) {
    base.push({ type: 'group', label: 'App' });
    base.push({
      type: 'link',
      href: '/instalar',
      icon: Smartphone,
      label: 'Instalar app',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    });
  }
  return base;
}

// Default landing URLs for each external platform — used when the
// teacher hasn't set a per-student link in studentData.platformLinks.
const SHORTCUT_FALLBACKS = {
  off2class: 'https://app.off2class.com/',
  ellii:     'https://ellii.com',
  sounter:   'https://sounter.com',
} as const;

function buildStudentShortcuts(links?: {
  off2class?: string;
  ellii?: string;
  sounter?: string;
}): NavLink[] {
  const normalise = (raw?: string, fallback?: string): string => {
    const v = (raw ?? '').trim();
    if (!v) return fallback ?? '';
    return /^https?:\/\//i.test(v) ? v : `https://${v}`;
  };
  return [
    {
      type: 'link',
      href: normalise(links?.ellii,     SHORTCUT_FALLBACKS.ellii),
      icon: ExternalLink,
      label: 'Ellii',
      iconBg: 'bg-teal-100',
      iconColor: 'text-teal-600',
      external: true,
    },
    {
      type: 'link',
      href: normalise(links?.off2class, SHORTCUT_FALLBACKS.off2class),
      icon: ExternalLink,
      label: 'Off2Class',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      external: true,
    },
    {
      type: 'link',
      href: normalise(links?.sounter,   SHORTCUT_FALLBACKS.sounter),
      icon: ExternalLink,
      label: 'Sounter',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      external: true,
    },
  ];
}

// ── Badge hook ────────────────────────────────────────────────

function useNavBadges(role: string | null, uid: string): Map<string, number> {
  const studentHw  = useStudentHomework(role === 'student' ? uid : '');
  const teacherHw  = useTeacherHomework(role === 'teacher' ? uid : '');
  const { pendingStudents } = useStudents(role === 'teacher');
  const { sessions: placementSessions } = usePlacementSessions(role === 'teacher' ? uid : '');
  // Avisos + mensajes del COWORK sin leer — sólo mide para profes; los
  // hooks quedan ociosos para estudiantes porque el guard del componente
  // los desmonta al cambiar de rol.
  const { unreadCount: coworkAnnUnread } = useCoworkAnnouncements(role === 'teacher' ? uid : '');
  const coworkChatUnread = useCoworkChatUnread(role === 'teacher' ? uid : '');
  // Chime + title-blink al llegar un mensaje de otra persona. Montado aqui
  // porque el Sidebar vive en todo el shell del dashboard, asi suena el
  // aviso aunque el profe no este en /cowork.
  useCoworkChatSound(role === 'teacher' ? uid : '');
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

  // Fallback: authStore.profile puede quedar null tras montar (bug de
  // hidratación conocido). Suscribimos onAuthStateChanged directo para
  // tener siempre un uid válido — sin él, los hooks de badges (cowork,
  // homework, etc.) se quedan en 0 silenciosamente.
  const [authUid, setAuthUid] = useState<string>(() => auth.currentUser?.uid ?? '');
  useEffect(() => onAuthStateChanged(auth, (u) => setAuthUid(u?.uid ?? '')), []);
  const uid = profile?.uid || authUid;
  const firstName = profile?.fullName?.split(' ')[0] ?? '';
  const lastName  = profile?.fullName?.split(' ').slice(1).join(' ') ?? '';

  const navBadges = useNavBadges(role, uid);

  // Weekly IELTS lives in the student sidebar only while the teacher
  // has an active assignment for them. Hook runs for everyone but
  // bails fast when the uid is not a student.
  const { assignment: weeklyIeltsAssignment } = useStudentWeeklyIelts(role === 'student' ? uid : '');

  // Each student may have per-platform URLs set by their teacher under
  // studentData.platformLinks. Empty / missing links fall back to the
  // vendor's landing page so the shortcut still works.
  const studentShortcuts = useMemo(
    () => role === 'student' ? buildStudentShortcuts(profile?.studentData?.platformLinks) : [],
    [role, profile?.studentData?.platformLinks],
  );

  // Hide the "Instalar app" row once the student is already running
  // the site as a PWA. Chrome/desktop exposes this via matchMedia,
  // iOS via navigator.standalone.
  const [isStandalone, setIsStandalone] = useState(false);
  useEffect(() => {
    const check = () => {
      const standalone =
        window.matchMedia?.('(display-mode: standalone)').matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      setIsStandalone(!!standalone);
    };
    check();
    const mq = window.matchMedia?.('(display-mode: standalone)');
    mq?.addEventListener?.('change', check);
    return () => mq?.removeEventListener?.('change', check);
  }, []);

  const nav =
    role === 'teacher'   ? TEACHER_NAV
  : role === 'corporate' ? CORPORATE_NAV
                         : studentNavWithWeeklyIelts(!!weeklyIeltsAssignment, studentShortcuts, !isStandalone);

  async function handleLogout() {
    await logOut();
    window.location.href = '/';
  }

  return (
    <aside className={`${role === 'corporate' ? 'w-72 bg-[#F6EEFF] border-[#E8D5F0]' : 'w-64 bg-white border-gray-100'} flex-shrink-0 flex flex-col h-full border-r shadow-[2px_0_16px_rgba(90,61,122,0.06)]`}>

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
              : role === 'corporate'
                ? 'bg-[#F59E0B] text-white'
                : 'bg-[#D4EDDA] text-[#2E7D4F]'
            }`}>
              {role === 'teacher' ? 'Teacher' : role === 'corporate' ? 'Corporate' : 'Student'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Navigation ──────────────────────────────────────── */}
      {/* Corporate role gets a chunkier, more illustrated nav to match the
          Carolina/Skechers mockups — bigger mascot tiles, generous spacing,
          softer rounded cards. Teacher/student keep the compact look. */}
      <nav className={`flex-1 px-3 pb-4 overflow-y-auto ${role === 'corporate' ? 'space-y-1.5 pt-2' : 'space-y-0.5'}`}>
        {nav.map((item, i) => {
          if (item.type === 'group') {
            return (
              <p key={`group-${i}`} className="pt-4 pb-1.5 px-3 text-[9px] font-extrabold uppercase tracking-[0.15em] text-[#C8A8DC] select-none">
                {item.label}
              </p>
            );
          }

          const { href, icon: Icon, label, iconBg, iconColor, iconImg, external } = item;
          const isActive = !external && (
            pathname === href || (
              href !== '/dashboard/teacher' && href !== '/dashboard/student' && pathname.startsWith(href)
            )
          );
          const badge = navBadges.get(href) ?? 0;
          const corporate = role === 'corporate';
          // External shortcuts open in a new tab and don't use Next
          // routing; internal links still go through next/link.
          const LinkEl: React.ElementType = external ? 'a' : Link;
          const linkExtraProps = external
            ? { target: '_blank' as const, rel: 'noopener noreferrer' }
            : {};

          return (
            <LinkEl
              key={`${label}-${href}`}
              href={href}
              onClick={onNavigate}
              {...linkExtraProps}
              className={`group relative flex items-center transition-all duration-150 ${
                corporate
                  ? `gap-4 px-3 py-2.5 rounded-2xl text-[15px] font-semibold ${
                      isActive
                        ? 'bg-white text-[#3D1F6B] shadow-[0_6px_18px_-6px_rgba(90,61,122,0.25)] ring-1 ring-[#E8D5F0]'
                        : 'text-[#5A3D7A]/80 hover:bg-white/55 hover:text-[#3D1F6B]'
                    }`
                  : `gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                      isActive
                        ? 'bg-[#F0E5FF] text-[#3D1F6B] font-semibold'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-[#5A3D7A]'
                    }`
              }`}
            >
              {/* Active left accent bar — teacher/student only; the
                  corporate active state is a floating white card instead. */}
              {isActive && !corporate && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-[#5A3D7A]" />
              )}

              {/* Icon container — usa imagen si iconImg está seteado, sino
                  renderiza el icono lucide. Los mascots PNG traen bordes
                  blancos y a veces texto embebido en la ilustración, así
                  que los mostramos ampliados con object-cover + scale
                  dentro de overflow-hidden — eso recorta los bordes y la
                  mayoría del texto queda fuera del viewport del icono. */}
              {iconImg ? (
                <span className={`${corporate ? 'w-14 h-14 rounded-2xl' : 'w-8 h-8 rounded-lg'} overflow-hidden flex-shrink-0 transition-all duration-150 ${
                  isActive
                    ? corporate ? 'shadow-sm' : 'ring-2 ring-[#5A3D7A] scale-105 shadow-sm'
                    : corporate ? 'group-hover:scale-105' : 'group-hover:scale-105 group-hover:ring-1 group-hover:ring-[#C8A8DC]'
                }`}>
                  <Image src={iconImg} alt="" width={corporate ? 56 : 32} height={corporate ? 56 : 32} className="w-full h-full object-cover scale-[1.35]" />
                </span>
              ) : (
                <span className={`${corporate ? 'w-14 h-14 rounded-2xl' : 'w-7 h-7 rounded-lg'} flex items-center justify-center flex-shrink-0 transition-transform duration-150 ${
                  isActive ? 'bg-[#5A3D7A] text-white shadow-sm scale-105' : `${iconBg} ${iconColor} group-hover:scale-105`
                }`}>
                  <Icon className={corporate ? 'w-5 h-5' : 'w-4 h-4'} strokeWidth={2.25} />
                </span>
              )}

              <span className="flex-1 truncate">{label}</span>

              {badge > 0 && (
                <span className="flex-shrink-0 min-w-[20px] h-[20px] px-1.5 bg-red-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center leading-none shadow-[0_2px_6px_rgba(239,68,68,0.45)] ring-2 ring-white animate-pulse">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
              {external && (
                <ExternalLink className="flex-shrink-0 w-3 h-3 text-gray-300 group-hover:text-[#5A3D7A]" strokeWidth={2.5} />
              )}
            </LinkEl>
          );
        })}
      </nav>

      {/* ── Bottom: profile + logout ─────────────────────────── */}
      <div className={`${role === 'corporate' ? 'px-3 py-3 border-t border-[#E8D5F0] space-y-1.5' : 'px-3 py-3 border-t border-gray-100 space-y-0.5'}`}>
        <Link
          href="/dashboard/profile"
          onClick={onNavigate}
          className={`group w-full flex items-center transition-all ${
            role === 'corporate'
              ? `gap-4 px-3 py-2.5 rounded-2xl text-[15px] font-semibold ${
                  pathname === '/dashboard/profile'
                    ? 'bg-white text-[#3D1F6B] shadow-[0_6px_18px_-6px_rgba(90,61,122,0.25)] ring-1 ring-[#E8D5F0]'
                    : 'text-[#5A3D7A]/80 hover:bg-white/55 hover:text-[#3D1F6B]'
                }`
              : `gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                  pathname === '/dashboard/profile'
                    ? 'bg-[#F0E5FF] text-[#3D1F6B] font-semibold'
                    : 'text-gray-400 hover:bg-gray-50 hover:text-[#5A3D7A]'
                }`
          }`}
        >
          <span className={`${role === 'corporate' ? 'w-14 h-14 rounded-2xl' : 'w-8 h-8 rounded-lg'} overflow-hidden flex-shrink-0 transition-all ${
            pathname === '/dashboard/profile'
              ? role === 'corporate' ? 'shadow-sm' : 'ring-2 ring-[#5A3D7A] scale-105 shadow-sm'
              : 'group-hover:scale-105'
          }`}>
            <Image src="/sidebar-icons/mi-perfil.png" alt="" width={role === 'corporate' ? 56 : 32} height={role === 'corporate' ? 56 : 32} className="w-full h-full object-cover" />
          </span>
          {role === 'corporate' ? 'Mi perfil' : 'My Profile'}
        </Link>
        <button
          onClick={handleLogout}
          className={`group w-full flex items-center transition-all ${
            role === 'corporate'
              ? 'gap-3 px-4 py-3 rounded-2xl text-[15px] font-semibold bg-[#F43F5E] text-white shadow-[0_10px_24px_-10px_rgba(244,63,94,0.6)] hover:bg-[#E11D48]'
              : 'gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-50 hover:text-red-500'
          }`}
        >
          <span className={`${role === 'corporate' ? 'w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-lg' : 'w-8 h-8 rounded-lg overflow-hidden group-hover:scale-105 group-hover:ring-1 group-hover:ring-red-300'} flex-shrink-0 transition-all`}>
            {role === 'corporate' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            ) : (
              <Image src="/sidebar-icons/cerrar-sesion.png" alt="" width={32} height={32} className="w-full h-full object-cover" />
            )}
          </span>
          <span className="flex-1 text-left">{role === 'corporate' ? 'Cerrar Sesión' : 'Sign Out'}</span>
          {role === 'corporate' && <span className="text-white/80 text-base leading-none">×</span>}
        </button>
      </div>
    </aside>
  );
}
