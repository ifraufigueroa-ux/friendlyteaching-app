// FriendlyTeaching.cl — Corporate Master Account landing (editorial + mascot)
//
// Visual language: large editorial serif headings, soft violet palette,
// mascot cat PNGs from /public/sidebar-icons/ as the hero visual on each
// stat card. Roster row = avatar circle + name/email + level pill +
// última clase + attendance bar + Daily Practice flame + arrow.

'use client';
import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Flame, Lock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useMyOrganization } from '@/hooks/useOrganization';
import { useOrganizationRoster } from '@/hooks/useOrganizationRoster';
import type { RosterEntry } from '@/types/organization';
import type { LessonLevel } from '@/types/firebase';

export default function CorporateDashboardPage() {
  const { profile } = useAuthStore();
  const { org, loading: orgLoading, isCorporateAdmin } = useMyOrganization();
  const { roster, stats, loading: rosterLoading } = useOrganizationRoster(org);

  if (orgLoading) return <Shell><LoadingCard /></Shell>;

  if (!isCorporateAdmin) {
    return <Shell><EmptyCard icon="🏢" title="Esta vista es para cuentas corporativas"
      body="Si vienes a monitorear el progreso de tu equipo, pide a tu representante de FriendlyTeaching que active tu cuenta corporativa." /></Shell>;
  }

  if (!org) {
    return <Shell><EmptyCard icon="🏢" title="Aún no estás vinculado a una organización"
      body="Contacta a tu representante de FriendlyTeaching para que te asigne a tu empresa. En cuanto quede listo verás aquí a todo tu equipo." /></Shell>;
  }

  return (
    <Shell>
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#9B7CB8] font-medium">
          <Link href="/dashboard" className="hover:text-[#5A3D7A] transition-colors inline-flex items-center gap-1">
            <ArrowRight className="w-4 h-4 rotate-180" strokeWidth={2.5} /> Home
          </Link>
          <span>/</span>
          <span className="text-[#5A3D7A] font-semibold">Roster</span>
        </div>

        {/* Hero */}
        <div className="relative bg-gradient-to-br from-[#2D1B4E] via-[#5A3D7A] to-[#8A5EB5] rounded-[32px] p-10 md:p-12 text-white shadow-2xl overflow-hidden">
          <div aria-hidden className="absolute inset-0 pointer-events-none opacity-30"
            style={{ backgroundImage: 'radial-gradient(circle at 85% 15%, rgba(245,158,11,0.35) 0%, transparent 55%), radial-gradient(circle at 10% 95%, rgba(255,255,255,0.15) 0%, transparent 55%)' }} />
          <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            <div className="flex-1 min-w-0 space-y-5">
              <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] text-amber-300 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-amber-300/30">
                <Lock className="w-3 h-3" strokeWidth={2.5} /> Master Account
              </div>
              <h1 className="font-serif text-5xl md:text-6xl font-bold leading-[1.02] tracking-tight">
                {org.name}
              </h1>
              <p className="text-base md:text-lg text-white/80 leading-relaxed max-w-2xl">
                Monitoreo del programa de inglés tu equipo — asistencia, nivel actual,
                progreso individual y datos agregados en tiempo real.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap flex-shrink-0 lg:pt-4">
              <HeroPill label="Plan" value={planLabel(org.plan)} />
              <HeroPill label="Inicio" value={org.startedAt ? org.startedAt.toDate().toLocaleDateString('es-CL', { month: 'short', year: 'numeric' }).replace('.', '') : '—'} />
              {org.classesPerWeek && <HeroPill label="Clases/sem" value={`${org.classesPerWeek}x`} />}
            </div>
          </div>
        </div>

        {/* Aggregate stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            iconLucide={<UsersIcon />}
            iconBg="#F0E5FF"
            iconColor="#5A3D7A"
            label="Empleados activos"
            value={stats.totalStudents.toString()}
            sub={org.name.toLowerCase().includes('skech') ? 'co-work' : 'estudiantes'}
            mascot="/sidebar-icons/estudiantes.png"
          />
          <StatCard
            iconLucide={<ActivityIcon />}
            iconBg="#DCFCE7"
            iconColor="#059669"
            label="Activos (30 días)"
            value={stats.activeLast30Days.toString()}
            sub={stats.totalStudents > 0 ? `${Math.round((stats.activeLast30Days / stats.totalStudents) * 100)}% del equipo` : 'Sin datos'}
            mascot="/sidebar-icons/actividades.png"
            valueColor="#059669"
          />
          <StatCard
            iconLucide={<CalendarIcon />}
            iconBg="#FEF3C7"
            iconColor="#B45309"
            label="Clases (30 días)"
            value={stats.classesLast30Days.toString()}
            sub={stats.totalStudents > 0 ? `${(stats.classesLast30Days / stats.totalStudents).toFixed(1)} por estudiante` : '—'}
            mascot="/sidebar-icons/historial-clases.png"
            valueColor="#B45309"
          />
          <StatCard
            iconLucide={<CapIcon />}
            iconBg="#FEE2E2"
            iconColor="#B91C1C"
            label="Nivel más común"
            value={topLevel(stats.levelDistribution)}
            sub={levelDistributionLabel(stats.levelDistribution)}
            mascot="/sidebar-icons/placement-test.png"
            valueColor="#B91C1C"
          />
        </div>

        {/* Roster */}
        <section className="space-y-5">
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-[0.35em] text-[#9B7CB8]">Roster</p>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#2D1B4E] leading-[1.05]">
                Progreso individual del equipo
              </h2>
            </div>
            <p className="text-sm text-[#9B7CB8] italic">
              Haz click en una fila para ver el detalle del estudiante
            </p>
          </div>

          {rosterLoading ? (
            <div className="bg-white rounded-3xl border border-[#E8D5F0] p-10 text-center shadow-sm">
              <p className="text-sm text-[#9B7CB8]">Cargando roster…</p>
            </div>
          ) : roster.length === 0 ? (
            <EmptyCard icon="👥" title="Todavía no hay empleados cargados"
              body="En cuanto el equipo de FriendlyTeaching active a los estudiantes, aparecerán aquí con todo su progreso." />
          ) : (
            <RosterTable entries={roster} />
          )}
        </section>

        {profile && (
          <p className="text-[11px] text-center text-[#9B7CB8]/70">
            Sesión activa: {profile.fullName} · {profile.email}
          </p>
        )}
      </div>
    </Shell>
  );
}

// ── Shell ────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#FFFCF7] text-[#2D1B4E]">
      <div aria-hidden className="absolute inset-0 pointer-events-none opacity-[0.045]"
        style={{
          backgroundImage: 'linear-gradient(rgba(90,61,122,1) 1px, transparent 1px), linear-gradient(90deg, rgba(90,61,122,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(circle at 50% 10%, black 60%, transparent 95%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 10%, black 60%, transparent 95%)',
        }} />
      <div className="relative z-10 p-6 md:p-10">
        {children}
      </div>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="max-w-6xl mx-auto py-24 text-center">
      <div className="w-10 h-10 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-sm text-[#9B7CB8]">Cargando organización…</p>
    </div>
  );
}

function EmptyCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-md border border-[#E8D5F0] p-10 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#F0E5FF] text-[#5A3D7A] flex items-center justify-center text-3xl">
        {icon}
      </div>
      <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#2D1B4E] mb-3 leading-tight">{title}</h2>
      <p className="text-sm md:text-base text-[#5A3D7A]/80 leading-relaxed">{body}</p>
    </div>
  );
}

// ── Pieces ────────────────────────────────────────────────────

function HeroPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-5 py-3 min-w-[120px]">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/55 mb-1">{label}</p>
      <p className="font-serif text-xl font-bold text-white leading-none">{value}</p>
    </div>
  );
}

function StatCard({
  iconLucide, iconBg, iconColor, label, value, sub, mascot, valueColor,
}: {
  iconLucide: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  sub: string;
  mascot: string;
  valueColor?: string;
}) {
  return (
    <div className="relative bg-white rounded-3xl border border-[#E8D5F0] shadow-sm overflow-hidden">
      <div className="p-5 pr-20 relative">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg, color: iconColor }}>
            {iconLucide}
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#9B7CB8] leading-tight pt-1.5">
            {label}
          </p>
        </div>
        <p className="font-serif text-5xl md:text-6xl font-bold leading-none mb-2 tracking-tight" style={{ color: valueColor ?? '#2D1B4E' }}>
          {value}
        </p>
        <p className="text-xs text-[#5A3D7A]/70 leading-snug">{sub}</p>
      </div>
      <div className="absolute right-1 bottom-1 w-20 h-20 opacity-95 pointer-events-none select-none">
        <Image src={mascot} alt="" width={80} height={80} className="object-contain" />
      </div>
    </div>
  );
}

function RosterTable({ entries }: { entries: RosterEntry[] }) {
  const sorted = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (!a.lastClassDate && !b.lastClassDate) return a.fullName.localeCompare(b.fullName);
      if (!a.lastClassDate) return 1;
      if (!b.lastClassDate) return -1;
      return b.lastClassDate.localeCompare(a.lastClassDate);
    });
  }, [entries]);

  return (
    <div className="bg-white rounded-3xl border border-[#E8D5F0] shadow-sm overflow-hidden">
      <div className="hidden md:grid grid-cols-[2.4fr_0.8fr_0.9fr_1.4fr_1.3fr_60px] gap-5 px-7 py-4 bg-[#F6EBFF] border-b border-[#E8D5F0]">
        <HeaderCell>Empleado</HeaderCell>
        <HeaderCell>Nivel</HeaderCell>
        <HeaderCell>Última clase</HeaderCell>
        <HeaderCell>Asistencia 30d</HeaderCell>
        <HeaderCell>Daily Practice</HeaderCell>
        <span />
      </div>
      <div>
        {sorted.map((entry, i) => (
          <RosterRow key={entry.uid} entry={entry} isLast={i === sorted.length - 1} />
        ))}
      </div>
    </div>
  );
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9B7CB8]">
      {children}
    </p>
  );
}

function RosterRow({ entry, isLast }: { entry: RosterEntry; isLast: boolean }) {
  const initials = entry.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase() ?? '')
    .join('');
  const avatarBg = avatarGradient(entry.uid);

  return (
    <Link
      href={`/dashboard/corporate/students/${entry.uid}`}
      className={`group grid grid-cols-[1fr_40px] md:grid-cols-[2.4fr_0.8fr_0.9fr_1.4fr_1.3fr_60px] gap-5 px-7 py-5 hover:bg-[#FAF5FF] transition-colors ${isLast ? '' : 'border-b border-gray-100'}`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-12 h-12 rounded-full text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow" style={{ background: avatarBg }}>
          {initials || '·'}
        </div>
        <div className="min-w-0">
          <p className="text-base font-bold text-[#2D1B4E] truncate leading-tight">{entry.fullName}</p>
          <p className="text-xs text-gray-500 truncate mt-0.5">{entry.email}</p>
        </div>
      </div>

      <div className="md:hidden flex items-center justify-end">
        <ArrowRight className="w-4 h-4 text-[#9B7CB8] group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
      </div>

      <div className="hidden md:flex items-center">
        <LevelPill level={entry.currentLevel} />
      </div>
      <div className="hidden md:flex items-center">
        <p className="text-sm text-[#2D1B4E] font-medium">
          {entry.lastClassDate ? formatDate(entry.lastClassDate) : <span className="text-gray-400">Sin clases</span>}
        </p>
      </div>
      <div className="hidden md:flex items-center">
        <AttendanceBar pct={entry.attendancePct} classes={entry.classesLast30Days} />
      </div>
      <div className="hidden md:flex items-center gap-2">
        {entry.practiceStreak > 0 ? (
          <>
            <Flame className="w-5 h-5 text-orange-500" strokeWidth={2.5} fill="#FB923C" />
            <span className="text-base font-bold text-[#2D1B4E] tabular-nums">{entry.practiceStreak}</span>
            <span className="text-sm text-gray-400">·</span>
            <span className="text-sm text-gray-600 tabular-nums">{entry.practiceXp} XP</span>
          </>
        ) : (
          <span className="text-xs text-gray-400">Sin práctica</span>
        )}
      </div>
      <div className="hidden md:flex items-center justify-end">
        <div className="w-10 h-10 rounded-full bg-[#F0E5FF] text-[#5A3D7A] flex items-center justify-center group-hover:bg-[#5A3D7A] group-hover:text-white transition-colors">
          <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
        </div>
      </div>
    </Link>
  );
}

function LevelPill({ level }: { level: LessonLevel | null }) {
  if (!level) return <span className="text-xs text-gray-400">Sin nivel</span>;
  const tone =
    level === 'A0' ? 'bg-slate-50 text-slate-700 border-slate-200'
  : level === 'A1' ? 'bg-sky-50 text-sky-700 border-sky-200'
  : level === 'A2' ? 'bg-teal-50 text-teal-700 border-teal-200'
  : level === 'B1' || level === 'B1+' ? 'bg-violet-50 text-violet-700 border-violet-200'
  : level === 'B2' ? 'bg-rose-50 text-rose-700 border-rose-200'
                   : 'bg-emerald-50 text-emerald-700 border-emerald-200';
  return (
    <span className={`inline-flex items-center text-[13px] font-black px-3.5 py-1.5 rounded-full border ${tone}`}>
      {level}
    </span>
  );
}

function AttendanceBar({ pct, classes }: { pct: number; classes: number }) {
  if (classes === 0 && pct === 0) return <span className="text-xs text-gray-400">—</span>;
  const tone = pct >= 90 ? '#10B981' : pct >= 70 ? '#F59E0B' : '#F43F5E';
  return (
    <div className="w-full min-w-[140px]">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-sm font-bold text-[#2D1B4E] tabular-nums">{pct}%</span>
        <span className="text-xs text-gray-500">{classes} {classes === 1 ? 'clase' : 'clases'}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: tone }} />
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────

function planLabel(plan: string): string {
  return { basic: 'Básico', standard: 'Standard', premium: 'Premium' }[plan] ?? plan;
}

function topLevel(dist: Record<string, number>): string {
  const entries = Object.entries(dist);
  if (entries.length === 0) return '—';
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

function levelDistributionLabel(dist: Record<string, number>): string {
  const entries = Object.entries(dist).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return 'Sin datos';
  return 'lecciones';
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
}

/** Deterministic violet-palette avatar gradient per uid. */
function avatarGradient(uid: string): string {
  const palettes = [
    'linear-gradient(135deg, #5A3D7A 0%, #9B7CB8 100%)',
    'linear-gradient(135deg, #4C1D95 0%, #7E22CE 100%)',
    'linear-gradient(135deg, #1E293B 0%, #475569 100%)',
    'linear-gradient(135deg, #7B2CBF 0%, #C77DFF 100%)',
    'linear-gradient(135deg, #312E81 0%, #6366F1 100%)',
  ];
  let h = 0;
  for (let i = 0; i < uid.length; i++) h = ((h << 5) - h + uid.charCodeAt(i)) | 0;
  return palettes[Math.abs(h) % palettes.length];
}

// ── Tiny inline icons (no extra deps) ────────────────────────

function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function ActivityIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function CapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}
