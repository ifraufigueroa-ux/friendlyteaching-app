// FriendlyTeaching.cl — Corporate Master Account landing
//
// Dashboard a corporate admin lands on. Three sections:
//
//   1. Hero + aggregate stats (students, active, classes, levels)
//   2. Roster table (click a row → drill-down page)
//   3. Program summary (plan, start date, next milestones)
//
// Visual tone matches the student Daily Practice landing — editorial
// Fraunces headings, Inter body, cream background with soft gradients.

'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import {
  Users, Activity, GraduationCap, TrendingUp, ArrowRight,
  Building2, Flame, Calendar,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useMyOrganization } from '@/hooks/useOrganization';
import { useOrganizationRoster } from '@/hooks/useOrganizationRoster';
import type { RosterEntry } from '@/types/organization';
import type { LessonLevel } from '@/types/firebase';

export default function CorporateDashboardPage() {
  const { profile } = useAuthStore();
  const { org, loading: orgLoading, isCorporateAdmin } = useMyOrganization();
  const { roster, stats, loading: rosterLoading } = useOrganizationRoster(org);

  if (orgLoading) {
    return <Shell><Loading /></Shell>;
  }

  if (!isCorporateAdmin) {
    return (
      <Shell>
        <EmptyCard
          title="Esta vista es para cuentas corporativas"
          body="Si vienes a monitorear el progreso de tu equipo, pide a tu representante de FriendlyTeaching que active tu cuenta corporativa."
        />
      </Shell>
    );
  }

  if (!org) {
    return (
      <Shell>
        <EmptyCard
          title="Aún no estás vinculado a una organización"
          body="Contacta a tu representante de FriendlyTeaching para que te asigne a tu empresa. En cuanto quede listo verás aquí a todo tu equipo."
        />
      </Shell>
    );
  }

  return (
    <Shell orgName={org.name}>
      <div className="space-y-8">
        {/* Hero */}
        <div className="relative bg-gradient-to-br from-[#2D1B4E] via-[#5A3D7A] to-[#9B7CB8] rounded-3xl p-8 md:p-10 text-white shadow-xl overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-25"
            style={{
              backgroundImage:
                'radial-gradient(circle at 90% 20%, rgba(245,158,11,0.4) 0%, transparent 50%),' +
                'radial-gradient(circle at 10% 90%, rgba(255,255,255,0.15) 0%, transparent 50%)',
            }}
          />
          <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1 min-w-0 space-y-3">
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-amber-300 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/15">
                <Building2 className="w-3 h-3" strokeWidth={2.5} /> Master Account
              </div>
              <h1 className="font-serif text-4xl md:text-5xl font-bold leading-[1.05] tracking-tight">
                {org.name}
              </h1>
              <p className="text-sm md:text-base text-white/75 max-w-xl">
                Monitoreo del programa de inglés para tu equipo — asistencia, nivel actual, progreso individual y datos agregados en tiempo real.
              </p>
            </div>
            <div className="flex-shrink-0 flex gap-3 flex-wrap">
              <HeroBadge label="Plan" value={planLabel(org.plan)} />
              <HeroBadge
                label="Inicio"
                value={org.startedAt ? org.startedAt.toDate().toLocaleDateString('es-CL', { month: 'short', year: 'numeric' }) : '—'}
              />
              {org.classesPerWeek && (
                <HeroBadge label="Clases/sem" value={`${org.classesPerWeek}×`} />
              )}
            </div>
          </div>
        </div>

        {/* Aggregate stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={<Users className="w-5 h-5" strokeWidth={2.5} />}
            label="Empleados activos"
            value={stats.totalStudents.toString()}
            sub={stats.totalStudents === 1 ? '1 estudiante' : `${stats.totalStudents} estudiantes en total`}
            tone="violet"
          />
          <StatCard
            icon={<Activity className="w-5 h-5" strokeWidth={2.5} />}
            label="Activos (30 días)"
            value={stats.activeLast30Days.toString()}
            sub={pct(stats.activeLast30Days, stats.totalStudents)}
            tone="emerald"
          />
          <StatCard
            icon={<Calendar className="w-5 h-5" strokeWidth={2.5} />}
            label="Clases (30 días)"
            value={stats.classesLast30Days.toString()}
            sub={stats.totalStudents > 0 ? `${(stats.classesLast30Days / stats.totalStudents).toFixed(1)} por estudiante` : '—'}
            tone="amber"
          />
          <StatCard
            icon={<GraduationCap className="w-5 h-5" strokeWidth={2.5} />}
            label="Nivel más común"
            value={topLevel(stats.levelDistribution)}
            sub={levelDistributionLabel(stats.levelDistribution)}
            tone="rose"
          />
        </div>

        {/* Roster */}
        <section className="space-y-4">
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#9B7CB8] mb-1">Roster</p>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#2D1B4E] leading-tight">
                Progreso individual del equipo
              </h2>
            </div>
            <p className="text-xs text-[#5A3D7A]/70">
              Haz click en una fila para ver el detalle del estudiante
            </p>
          </div>

          {rosterLoading ? (
            <div className="bg-white rounded-2xl border border-[#E8D5F0] p-10 text-center">
              <p className="text-sm text-[#9B7CB8]">Cargando roster…</p>
            </div>
          ) : roster.length === 0 ? (
            <EmptyCard
              title="Todavía no hay empleados cargados"
              body="En cuanto el equipo de FriendlyTeaching active a los estudiantes, aparecerán aquí con todo su progreso."
            />
          ) : (
            <RosterTable entries={roster} />
          )}
        </section>

        {/* Footer note */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-dashed border-[#E8D5F0] p-5 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F0E5FF] text-[#5A3D7A] flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#2D1B4E] mb-1">Reportes mensuales</p>
            <p className="text-xs text-[#5A3D7A]/80 leading-relaxed">
              Cada mes generamos un reporte académico por estudiante — y uno agregado para la organización. Los puedes descargar desde cada ficha de empleado, o pedir el consolidado a tu representante.
            </p>
          </div>
        </div>

        {/* Debug: who am I */}
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

function Shell({ children, orgName }: { children: React.ReactNode; orgName?: string }) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#FFFCF7] text-[#2D1B4E]">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(90,61,122,1) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(90,61,122,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(circle at 50% 10%, black 40%, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 10%, black 40%, transparent 90%)',
        }}
      />
      <div className="relative z-10 p-6">
        <TopBar
          title={orgName ? `${orgName} · Master Account` : 'Master Account'}
          subtitle="Monitoreo del programa de inglés para tu equipo"
          breadcrumbs={[
            { label: 'Dashboard',       href: '/dashboard' },
            { label: 'Master Account' },
          ]}
        />
        <div className="max-w-6xl mx-auto mt-8">
          {children}
        </div>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="text-center py-24">
      <div className="w-10 h-10 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-sm text-[#9B7CB8]">Cargando organización…</p>
    </div>
  );
}

function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-md border border-[#E8D5F0] p-8 md:p-10 text-center">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#F0E5FF] text-[#5A3D7A] flex items-center justify-center">
        <Building2 className="w-7 h-7" strokeWidth={2} />
      </div>
      <h2 className="font-serif text-2xl font-bold text-[#2D1B4E] mb-2 leading-tight">{title}</h2>
      <p className="text-sm text-[#5A3D7A]/80 leading-relaxed">{body}</p>
    </div>
  );
}

// ── Cards + table ────────────────────────────────────────────

function HeroBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-4 py-2.5 min-w-[110px]">
      <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/60 mb-0.5">{label}</p>
      <p className="font-serif text-lg font-bold text-white leading-none">{value}</p>
    </div>
  );
}

function StatCard({
  icon, label, value, sub, tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: 'violet' | 'emerald' | 'amber' | 'rose';
}) {
  const palette = {
    violet:  { bg: 'bg-gradient-to-br from-[#5A3D7A] to-[#9B7CB8]', text: 'text-[#5A3D7A]'   },
    emerald: { bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600', text: 'text-emerald-700' },
    amber:   { bg: 'bg-gradient-to-br from-amber-400 to-amber-600',    text: 'text-amber-700'   },
    rose:    { bg: 'bg-gradient-to-br from-rose-400 to-rose-600',      text: 'text-rose-700'    },
  }[tone];
  return (
    <div className="bg-white rounded-2xl border border-[#E8D5F0] p-4 flex items-start gap-3 shadow-sm">
      <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${palette.bg} text-white flex items-center justify-center shadow`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">
          {label}
        </p>
        <p className={`font-serif text-2xl font-bold leading-tight ${palette.text}`}>
          {value}
        </p>
        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-2">
          {sub}
        </p>
      </div>
    </div>
  );
}

function RosterTable({ entries }: { entries: RosterEntry[] }) {
  // Sort by last-active desc (most recent first), null dates to the bottom.
  const sorted = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (!a.lastClassDate && !b.lastClassDate) return a.fullName.localeCompare(b.fullName);
      if (!a.lastClassDate) return 1;
      if (!b.lastClassDate) return -1;
      return b.lastClassDate.localeCompare(a.lastClassDate);
    });
  }, [entries]);

  return (
    <div className="bg-white rounded-2xl border border-[#E8D5F0] shadow-sm overflow-hidden">
      <div className="hidden md:grid grid-cols-[2.2fr_0.7fr_1fr_1fr_1fr_60px] gap-4 px-5 py-3 bg-[#FAF5FF] border-b border-[#E8D5F0]">
        <HeaderCell>Empleado</HeaderCell>
        <HeaderCell>Nivel</HeaderCell>
        <HeaderCell>Última clase</HeaderCell>
        <HeaderCell>Asistencia 30d</HeaderCell>
        <HeaderCell>Daily Practice</HeaderCell>
        <HeaderCell>&nbsp;</HeaderCell>
      </div>
      <div>
        {sorted.map(entry => (
          <RosterRow key={entry.uid} entry={entry} />
        ))}
      </div>
    </div>
  );
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9B7CB8]">
      {children}
    </p>
  );
}

function RosterRow({ entry }: { entry: RosterEntry }) {
  const initials = entry.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <Link
      href={`/dashboard/corporate/students/${entry.uid}`}
      className="group grid grid-cols-[1fr_60px] md:grid-cols-[2.2fr_0.7fr_1fr_1fr_1fr_60px] gap-4 px-5 py-4 border-b border-gray-100 last:border-b-0 hover:bg-[#FAF5FF] transition-colors"
    >
      {/* Name + email */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5A3D7A] to-[#9B7CB8] text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
          {initials || '·'}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#2D1B4E] truncate">{entry.fullName}</p>
          <p className="text-xs text-gray-500 truncate">{entry.email}</p>
        </div>
      </div>

      {/* Mobile: compact meta row */}
      <div className="md:hidden flex items-center justify-end">
        <ArrowRight className="w-4 h-4 text-[#9B7CB8] group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
      </div>

      {/* Desktop columns */}
      <div className="hidden md:flex items-center">
        <LevelPill level={entry.currentLevel} />
      </div>
      <div className="hidden md:flex items-center">
        <p className="text-sm text-[#2D1B4E] font-medium">
          {entry.lastClassDate ? formatDate(entry.lastClassDate) : <span className="text-gray-400">Sin clases aún</span>}
        </p>
      </div>
      <div className="hidden md:flex items-center">
        <AttendanceBar pct={entry.attendancePct} classes={entry.classesLast30Days} />
      </div>
      <div className="hidden md:flex items-center gap-1.5">
        {entry.practiceStreak > 0 ? (
          <>
            <Flame className="w-4 h-4 text-orange-500" strokeWidth={2.5} />
            <span className="text-sm font-bold text-orange-700">{entry.practiceStreak}</span>
            <span className="text-xs text-gray-500">· {entry.practiceXp} XP</span>
          </>
        ) : (
          <span className="text-xs text-gray-400">Sin práctica</span>
        )}
      </div>
      <div className="hidden md:flex items-center justify-end">
        <ArrowRight className="w-4 h-4 text-[#9B7CB8] group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
      </div>
    </Link>
  );
}

function LevelPill({ level }: { level: LessonLevel | null }) {
  if (!level) return <span className="text-xs text-gray-400">Sin nivel</span>;
  const tone =
    level === 'A0' ? 'bg-slate-100 text-slate-700 border-slate-200'
  : level === 'A1' ? 'bg-sky-50 text-sky-700 border-sky-200'
  : level === 'A2' ? 'bg-teal-50 text-teal-700 border-teal-200'
  : level === 'B1' || level === 'B1+' ? 'bg-violet-50 text-violet-700 border-violet-200'
  : level === 'B2' ? 'bg-rose-50 text-rose-700 border-rose-200'
                   : 'bg-emerald-50 text-emerald-700 border-emerald-200';
  return (
    <span className={`inline-flex items-center text-[11px] font-black px-2.5 py-1 rounded-full border ${tone}`}>
      {level}
    </span>
  );
}

function AttendanceBar({ pct, classes }: { pct: number; classes: number }) {
  if (classes === 0) {
    return <span className="text-xs text-gray-400">—</span>;
  }
  const tone = pct >= 90 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="w-full min-w-[80px]">
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs font-bold text-[#2D1B4E]">{pct}%</span>
        <span className="text-[10px] text-gray-500">{classes} clase{classes === 1 ? '' : 's'}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

// ── helpers ───────────────────────────────────────────────────

function planLabel(plan: string): string {
  return { basic: 'Básico', standard: 'Standard', premium: 'Premium' }[plan] ?? plan;
}

function pct(part: number, whole: number): string {
  if (whole === 0) return '—';
  return `${Math.round((part / whole) * 100)}% del equipo`;
}

function topLevel(dist: Record<string, number>): string {
  const entries = Object.entries(dist);
  if (entries.length === 0) return '—';
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

function levelDistributionLabel(dist: Record<string, number>): string {
  const entries = Object.entries(dist).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return 'Sin datos aún';
  return entries.slice(0, 3).map(([l, n]) => `${n} en ${l}`).join(' · ');
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
}
