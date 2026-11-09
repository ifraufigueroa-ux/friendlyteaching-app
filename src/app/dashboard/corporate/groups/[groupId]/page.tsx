// FriendlyTeaching.cl — Corporate group detail
//
// Reached from the group card on /dashboard/corporate. Shows the hero
// (group name + level + slot), aggregate stats scoped to the group,
// then the per-member roster (reuses the shared RosterTable so each
// row still links to the individual student drill).

'use client';
import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { doc, onSnapshot, type DocumentSnapshot } from 'firebase/firestore';
import { ArrowRight, Building2, CalendarClock, Users } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { useMyOrganization } from '@/hooks/useOrganization';
import { useOrganizationRoster } from '@/hooks/useOrganizationRoster';
import { computeGroupStats } from '@/hooks/useOrganizationGroups';
import { RosterTable } from '@/components/corporate/RosterTable';
import type { OrgGroup } from '@/types/organization';

const DAY_LABELS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function CorporateGroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);
  const { org, loading: orgLoading, isCorporateAdmin } = useMyOrganization();
  const { roster, loading: rosterLoading } = useOrganizationRoster(org);

  const [group, setGroup] = useState<OrgGroup | null>(null);
  const [groupLoading, setGroupLoading] = useState(true);

  useEffect(() => {
    if (!org?.id || !groupId) { setGroupLoading(false); return; }
    const ref = doc(db, 'organizations', org.id, 'groups', groupId);
    const unsub = onSnapshot(ref, (snap: DocumentSnapshot) => {
      if (snap.exists()) {
        setGroup({ id: snap.id, ...snap.data() } as OrgGroup);
      } else {
        setGroup(null);
      }
      setGroupLoading(false);
    }, () => setGroupLoading(false));
    return unsub;
  }, [org?.id, groupId]);

  const members = useMemo(() => {
    if (!group) return [];
    const uids = new Set(group.memberUids ?? []);
    return roster.filter(r => uids.has(r.uid));
  }, [group, roster]);

  // Use the same aggregator as the landing's group cards — single source
  // of truth so the group's classes-30d/attendance line up on both views.
  const stats = useMemo(
    () => computeGroupStats(members, group?.dayOfWeek ?? null),
    [members, group?.dayOfWeek],
  );

  if (orgLoading || groupLoading) return <Shell><LoadingCard /></Shell>;

  if (!isCorporateAdmin || !org) {
    return <Shell><EmptyCard icon="🏢" title="Esta vista es para cuentas corporativas" body="" /></Shell>;
  }

  if (!group) {
    return (
      <Shell>
        <EmptyCard
          icon="🔍"
          title="Grupo no encontrado"
          body="Puede que lo hayan renombrado o eliminado. Vuelve al panel principal para ver los grupos activos."
        />
        <div className="text-center mt-6">
          <Link href="/dashboard/corporate" className="inline-flex items-center gap-2 text-sm font-semibold text-[#5A3D7A] hover:text-[#2D1B4E]">
            <ArrowRight className="w-4 h-4 rotate-180" strokeWidth={2.5} /> Volver al panel
          </Link>
        </div>
      </Shell>
    );
  }

  const slot = formatSlot(group.dayOfWeek, group.hour);

  return (
    <Shell>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#9B7CB8] font-medium">
          <Link href="/dashboard" className="hover:text-[#5A3D7A] transition-colors inline-flex items-center gap-1">
            <ArrowRight className="w-4 h-4 rotate-180" strokeWidth={2.5} /> Home
          </Link>
          <span>/</span>
          <Link href="/dashboard/corporate" className="hover:text-[#5A3D7A] transition-colors">
            {org.name}
          </Link>
          <span>/</span>
          <span className="text-[#5A3D7A] font-semibold truncate">{group.name}</span>
        </div>

        {/* Hero */}
        <div
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
                Grupo · {org.name}
              </div>
              <h1 className="font-serif text-5xl md:text-6xl font-bold leading-[1.02] tracking-tight">
                {group.name}
              </h1>
              <div className="flex items-center gap-3 flex-wrap text-white/80">
                {group.level && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/15 text-white text-xs font-black tracking-wider">
                    {group.level}
                  </span>
                )}
                {slot && (
                  <span className="inline-flex items-center gap-1.5 text-sm">
                    <CalendarClock className="w-4 h-4" strokeWidth={2.5} />
                    {slot}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-sm">
                  <Users className="w-4 h-4" strokeWidth={2.5} />
                  {stats.size} {stats.size === 1 ? 'miembro' : 'miembros'}
                </span>
              </div>
              {group.notes && (
                <p className="text-base text-white/80 leading-relaxed max-w-2xl">
                  {group.notes}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Group aggregate stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <GroupHeroStat
            emoji="👥" iconBg="#F0E5FF" label="Miembros"
            value={stats.size.toString()}
            sub={`${stats.activeLast30Days} activos últimos 30 días`}
          />
          <GroupHeroStat
            emoji="📈" iconBg="#DCFCE7" label="Asistencia 30d"
            value={`${stats.attendancePct}%`}
            sub="Promedio del grupo"
            valueColor={stats.attendancePct >= 85 ? '#059669' : stats.attendancePct >= 70 ? '#B45309' : '#B91C1C'}
          />
          <GroupHeroStat
            emoji="📅" iconBg="#FEF3C7" label="Clases 30d"
            value={stats.classesLast30Days.toString()}
            sub="sesiones grupales"
            valueColor="#B45309"
          />
          <GroupHeroStat
            emoji="🔥" iconBg="#FEE2E2" label="Racha activa"
            value={`${stats.practiceActive}/${stats.size}`}
            sub="miembros con Daily Practice"
            valueColor="#B91C1C"
          />
        </div>

        {/* Members */}
        <section className="space-y-5">
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-[0.35em] text-[#9B7CB8]">Miembros</p>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#2D1B4E] leading-[1.05]">
                Detalle por persona
              </h2>
            </div>
            <p className="text-sm text-[#9B7CB8] italic">
              Click en una fila para ver el perfil completo
            </p>
          </div>

          {rosterLoading ? (
            <div className="bg-white rounded-3xl border border-[#E8D5F0] p-10 text-center shadow-sm">
              <p className="text-sm text-[#9B7CB8]">Cargando miembros…</p>
            </div>
          ) : members.length === 0 ? (
            <EmptyCard icon="👥" title="Este grupo todavía no tiene miembros"
              body="Cuando sumes empleados al grupo aparecerán aquí con su progreso." />
          ) : (
            <RosterTable entries={members} />
          )}
        </section>
      </div>
    </Shell>
  );
}

// ── Shell + small bits (mirrored from the landing page) ─────────

function Shell({ children }: { children: React.ReactNode }) {
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
      <p className="text-sm text-[#9B7CB8]">Cargando grupo…</p>
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
      {body && <p className="text-sm md:text-base text-[#5A3D7A]/80 leading-relaxed">{body}</p>}
    </div>
  );
}

function GroupHeroStat({
  emoji, iconBg, label, value, sub, valueColor,
}: {
  emoji: string;
  iconBg: string;
  label: string;
  value: string;
  sub: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-white rounded-3xl border border-[#E8D5F0] shadow-[0_6px_18px_-10px_rgba(90,61,122,0.18)] p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-xl leading-none" style={{ background: iconBg }} aria-hidden>
          {emoji}
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9B7CB8] leading-tight">
          {label}
        </p>
      </div>
      <p className="font-serif text-4xl md:text-5xl font-bold leading-none mb-1.5 tracking-tight" style={{ color: valueColor ?? '#2D1B4E' }}>
        {value}
      </p>
      <p className="text-[11px] text-[#5A3D7A]/70 leading-snug">{sub}</p>
    </div>
  );
}

function formatSlot(dayOfWeek: number | null, hour: number | null): string | null {
  if (dayOfWeek == null || hour == null) return null;
  const day = DAY_LABELS[dayOfWeek] ?? '';
  const hh = String(hour).padStart(2, '0');
  return day ? `${day} ${hh}:00` : `${hh}:00`;
}
