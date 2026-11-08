// FriendlyTeaching.cl — Corporate Master Account landing (editorial + mascot)
//
// Visual language: large editorial serif headings, soft violet palette,
// mascot cat PNGs from /public/sidebar-icons/ as the hero visual on each
// stat card. Roster row = avatar circle + name/email + level pill +
// última clase + attendance bar + Daily Practice flame + arrow.

'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Building2, CalendarClock, Flame } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useMyOrganization } from '@/hooks/useOrganization';
import { useOrganizationRoster } from '@/hooks/useOrganizationRoster';
import {
  useOrganizationGroups, useGroupBundles, UNGROUPED_ID,
  type GroupBundle,
} from '@/hooks/useOrganizationGroups';
import { RosterTable } from '@/components/corporate/RosterTable';

const DAY_LABELS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function CorporateDashboardPage() {
  const { profile } = useAuthStore();
  const { org, loading: orgLoading, isCorporateAdmin } = useMyOrganization();
  const { roster, stats, loading: rosterLoading } = useOrganizationRoster(org);
  const { groups, loading: groupsLoading } = useOrganizationGroups(org?.id);
  const bundles = useGroupBundles(groups, roster);

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
      <div className="space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#9B7CB8] font-medium">
          <Link href="/dashboard" className="hover:text-[#5A3D7A] transition-colors inline-flex items-center gap-1">
            <ArrowRight className="w-4 h-4 rotate-180" strokeWidth={2.5} /> Home
          </Link>
          <span>/</span>
          <span className="text-[#5A3D7A] font-semibold">Roster</span>
        </div>

        {/* Hero — gradient written inline because Tailwind v4 was dropping
            the final to-[#…] stop and fading the right edge to transparent. */}
        <div
          id="panel"
          className="relative rounded-[32px] p-10 md:p-12 text-white shadow-xl overflow-hidden"
          style={{ backgroundImage: 'linear-gradient(135deg, #2D1B4E 0%, #5A3D7A 50%, #8A5EB5 100%)' }}
        >
          <div aria-hidden className="absolute inset-0 pointer-events-none opacity-30"
            style={{ backgroundImage: 'radial-gradient(circle at 85% 15%, rgba(245,158,11,0.35) 0%, transparent 55%), radial-gradient(circle at 10% 95%, rgba(255,255,255,0.15) 0%, transparent 55%)' }} />
          <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            <div className="flex-1 min-w-0 space-y-5">
              <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] text-amber-300 bg-white/10 backdrop-blur-sm pl-2 pr-3 py-1.5 rounded-full border border-amber-300/30">
                <span className="w-5 h-5 rounded-full bg-amber-300/20 flex items-center justify-center">
                  <Building2 className="w-3 h-3" strokeWidth={2.5} />
                </span>
                Master Account
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
        <div id="asistencia" className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            emoji="👥"
            iconBg="#F0E5FF"
            label="Empleados activos"
            value={stats.totalStudents.toString()}
            sub={org.name.toLowerCase().includes('skech') ? 'co-work' : 'estudiantes'}
            mascot="/sidebar-icons/estudiantes.png"
          />
          <StatCard
            emoji="📈"
            iconBg="#DCFCE7"
            label="Activos (30 días)"
            value={stats.activeLast30Days.toString()}
            sub={stats.totalStudents > 0 ? `${Math.round((stats.activeLast30Days / stats.totalStudents) * 100)}% del equipo` : 'Sin datos'}
            mascot="/sidebar-icons/actividades.png"
            valueColor="#059669"
          />
          <StatCard
            emoji="📅"
            iconBg="#FEF3C7"
            label="Clases (30 días)"
            value={stats.classesLast30Days.toString()}
            sub={stats.totalStudents > 0 ? `${(stats.classesLast30Days / stats.totalStudents).toFixed(1)} por estudiante` : '—'}
            mascot="/sidebar-icons/historial-clases.png"
            valueColor="#B45309"
          />
          <StatCard
            emoji="🎓"
            iconBg="#FEE2E2"
            label="Nivel más común"
            value={topLevel(stats.levelDistribution)}
            sub={levelDistributionLabel(stats.levelDistribution)}
            mascot="/sidebar-icons/placement-test.png"
            valueColor="#B91C1C"
          />
        </div>

        {/* Groups + roster */}
        <section id="roster" className="space-y-5">
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-[0.35em] text-[#9B7CB8]">
                {groups.length > 0 ? 'Grupos' : 'Roster'}
              </p>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#2D1B4E] leading-[1.05]">
                {groups.length > 0
                  ? 'Progreso por grupo'
                  : 'Progreso individual del equipo'}
              </h2>
            </div>
            <p className="text-sm text-[#9B7CB8] italic">
              {groups.length > 0
                ? 'Haz click en un grupo para ver el detalle de sus miembros'
                : 'Haz click en una fila para ver el detalle del estudiante'}
            </p>
          </div>

          {rosterLoading || groupsLoading ? (
            <div className="bg-white rounded-3xl border border-[#E8D5F0] p-10 text-center shadow-sm">
              <p className="text-sm text-[#9B7CB8]">Cargando roster…</p>
            </div>
          ) : roster.length === 0 ? (
            <EmptyCard icon="👥" title="Todavía no hay empleados cargados"
              body="En cuanto el equipo de FriendlyTeaching active a los estudiantes, aparecerán aquí con todo su progreso." />
          ) : groups.length === 0 ? (
            <RosterTable entries={roster} />
          ) : (
            <GroupsOverview bundles={bundles} orgId={org!.id} />
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
  // Cream base with a subtle lavender graph-paper grid — part of the
  // intentional editorial look from Carolina's mockups. Isolated stacking
  // context so no ancestor gradient bleeds through.
  return (
    <div
      className="relative min-h-full isolate text-[#2D1B4E]"
      style={{
        backgroundColor: '#FFFCF7',
        backgroundImage:
          'linear-gradient(to right, rgba(90,61,122,0.12) 1px, transparent 1px),' +
          'linear-gradient(to bottom, rgba(90,61,122,0.12) 1px, transparent 1px)',
        backgroundSize: '42px 42px',
      }}
    >
      <div className="p-6 md:p-8">{children}</div>
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
  // Solid white card — not the glassy translucent chip we had before.
  // Carolina's mockup uses opaque white tiles so the data reads cleanly
  // against the purple hero even at a glance.
  return (
    <div className="bg-white rounded-2xl px-5 py-3 min-w-[112px] shadow-[0_6px_18px_-10px_rgba(0,0,0,0.35)]">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#9B7CB8] mb-1">{label}</p>
      <p className="font-serif text-xl font-bold text-[#2D1B4E] leading-none">{value}</p>
    </div>
  );
}

function StatCard({
  emoji, iconBg, label, value, sub, mascot, valueColor,
}: {
  emoji: string;
  iconBg: string;
  label: string;
  value: string;
  sub: string;
  mascot: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-white rounded-3xl border border-[#E8D5F0] shadow-[0_6px_18px_-10px_rgba(90,61,122,0.18)] p-5 flex items-center gap-3 hover:shadow-[0_10px_24px_-12px_rgba(90,61,122,0.28)] transition-shadow">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xl leading-none" style={{ background: iconBg }} aria-hidden>
            {emoji}
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9B7CB8] leading-tight">
            {label}
          </p>
        </div>
        <p className="font-serif text-5xl font-bold leading-none mb-1.5 tracking-tight" style={{ color: valueColor ?? '#2D1B4E' }}>
          {value}
        </p>
        <p className="text-[11px] text-[#5A3D7A]/70 leading-snug">{sub}</p>
      </div>
      <div className="flex-shrink-0 w-20 h-20 select-none pointer-events-none">
        <Image src={mascot} alt="" width={80} height={80} className="w-full h-full object-contain drop-shadow-[0_4px_8px_rgba(90,61,122,0.18)]" />
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

// ── Groups overview ──────────────────────────────────────────

function GroupsOverview({ bundles, orgId }: { bundles: GroupBundle[]; orgId: string }) {
  const real = bundles.filter(b => b.group.id !== UNGROUPED_ID);
  const ungrouped = bundles.find(b => b.group.id === UNGROUPED_ID);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {real.map(b => (
          <GroupCard key={b.group.id} bundle={b} orgId={orgId} />
        ))}
      </div>

      {ungrouped && ungrouped.members.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-end justify-between flex-wrap gap-2">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#9B7CB8]">Sin grupo</p>
              <h3 className="font-serif text-2xl md:text-3xl font-bold text-[#2D1B4E] leading-tight">
                Clases individuales
              </h3>
            </div>
            <p className="text-xs text-[#9B7CB8] italic">
              {ungrouped.members.length} {ungrouped.members.length === 1 ? 'persona' : 'personas'} sin asignar a un grupo
            </p>
          </div>
          <RosterTable entries={ungrouped.members} />
        </div>
      )}
    </div>
  );
}

function GroupCard({ bundle, orgId }: { bundle: GroupBundle; orgId: string }) {
  const { group, members, stats } = bundle;
  const slot = formatSlot(group.dayOfWeek, group.hour);
  const avatars = members.slice(0, 5);
  const extras = Math.max(0, members.length - avatars.length);
  const attendanceColor =
    stats.attendancePct >= 85 ? '#059669'
    : stats.attendancePct >= 70 ? '#B45309'
    : '#B91C1C';

  return (
    <Link
      href={`/dashboard/corporate/groups/${group.id}`}
      className="group block bg-white rounded-3xl border border-[#E8D5F0] shadow-[0_6px_18px_-10px_rgba(90,61,122,0.18)] hover:shadow-[0_14px_32px_-14px_rgba(90,61,122,0.35)] hover:border-[#C8A8DC] transition-all p-6 space-y-5"
    >
      {/* Header: level + slot */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {group.level && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#F0E5FF] text-[#5A3D7A] text-[11px] font-black tracking-wider">
              {group.level}
            </span>
          )}
          {slot && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-semibold">
              <CalendarClock className="w-3 h-3" strokeWidth={2.5} />
              {slot}
            </span>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-[#9B7CB8] group-hover:text-[#5A3D7A] group-hover:translate-x-0.5 transition-all" strokeWidth={2.5} />
      </div>

      {/* Name */}
      <h3 className="font-serif text-2xl md:text-[1.6rem] font-bold text-[#2D1B4E] leading-tight">
        {group.name}
      </h3>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <GroupStat label="Miembros" value={stats.size.toString()} />
        <GroupStat label="Asist. 30d" value={`${stats.attendancePct}%`} valueColor={attendanceColor} />
        <GroupStat label="Clases 30d" value={stats.classesLast30Days.toString()} />
      </div>

      {/* Member avatars + Daily Practice flame */}
      <div className="flex items-center justify-between pt-1 border-t border-[#F0E5FF]">
        <div className="flex -space-x-2">
          {avatars.map(m => (
            <div
              key={m.uid}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C8A8DC] to-[#9B7CB8] text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-white"
              title={m.fullName}
            >
              {initials(m.fullName)}
            </div>
          ))}
          {extras > 0 && (
            <div className="w-9 h-9 rounded-full bg-white text-[#5A3D7A] text-[11px] font-bold flex items-center justify-center ring-2 ring-white border border-[#E8D5F0]">
              +{extras}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#9B7CB8]">
          <Flame className="w-3.5 h-3.5 text-amber-500" strokeWidth={2.5} />
          <span className="font-semibold">{stats.practiceActive}</span>
          <span>con racha activa</span>
        </div>
      </div>
    </Link>
  );
}

function GroupStat({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="bg-[#FAF5FF] rounded-xl px-2 py-2.5 text-center">
      <p className="font-serif text-xl font-bold leading-none" style={{ color: valueColor ?? '#2D1B4E' }}>
        {value}
      </p>
      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-[#9B7CB8] mt-1">
        {label}
      </p>
    </div>
  );
}

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase() ?? '').join('') || '·';
}

function formatSlot(dayOfWeek: number | null, hour: number | null): string | null {
  if (dayOfWeek == null || hour == null) return null;
  const day = DAY_LABELS[dayOfWeek] ?? '';
  const hh = String(hour).padStart(2, '0');
  return day ? `${day} ${hh}:00` : `${hh}:00`;
}
