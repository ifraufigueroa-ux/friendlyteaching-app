// FriendlyTeaching.cl — Corporate Students tab
//
// The admin's per-person view of the whole org. Employees are grouped
// by their OrgGroup (same order as the landing cards — weekday + hour)
// and sorted ascending by CEFR level inside each group. Each row has a
// "Solicitar cambios" menu with three options: cambio de grupo,
// reevaluación, reemplazo.

'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Building2, CalendarClock, Users } from 'lucide-react';
import { useMyOrganization } from '@/hooks/useOrganization';
import { useOrganizationRoster } from '@/hooks/useOrganizationRoster';
import {
  useOrganizationGroups, useGroupBundles, UNGROUPED_ID,
  type GroupBundle,
} from '@/hooks/useOrganizationGroups';
import { LevelPill } from '@/components/corporate/RosterTable';
import { StudentActionsMenu } from '@/components/corporate/StudentActionsMenu';
import { ChangeRequestModal } from '@/components/corporate/ChangeRequestModal';
import type { ChangeRequestType, OrgGroup, RosterEntry } from '@/types/organization';
import type { LessonLevel } from '@/types/firebase';

const DAY_LABELS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// CEFR ascending order — B1+ sits between B1 and B2.
const CEFR_RANK: Record<LessonLevel, number> = {
  A0: 0, A1: 1, A2: 2, B1: 3, 'B1+': 3.5, B2: 4, C1: 5,
};

export default function CorporateStudentsPage() {
  const { org, loading: orgLoading, isCorporateAdmin } = useMyOrganization();
  const { roster, loading: rosterLoading } = useOrganizationRoster(org);
  const { groups, loading: groupsLoading } = useOrganizationGroups(org?.id);
  const bundles = useGroupBundles(groups, roster);

  const [modal, setModal] = useState<{
    type:        ChangeRequestType;
    student:     RosterEntry;
    group:       OrgGroup | null;
  } | null>(null);

  if (orgLoading) return <Shell><Loading /></Shell>;
  if (!isCorporateAdmin || !org) {
    return <Shell><Empty icon="🏢" title="Esta vista es para cuentas corporativas" body="" /></Shell>;
  }

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
          <span className="text-[#5A3D7A] font-semibold">Estudiantes</span>
        </div>

        {/* Hero */}
        <div
          className="relative rounded-[32px] p-8 md:p-10 text-white shadow-xl overflow-hidden"
          style={{ backgroundImage: 'linear-gradient(135deg, #2D1B4E 0%, #5A3D7A 50%, #8A5EB5 100%)' }}
        >
          <div aria-hidden className="absolute inset-0 pointer-events-none opacity-30"
            style={{ backgroundImage: 'radial-gradient(circle at 85% 15%, rgba(245,158,11,0.35) 0%, transparent 55%), radial-gradient(circle at 10% 95%, rgba(255,255,255,0.15) 0%, transparent 55%)' }} />
          <div className="relative space-y-4">
            <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] text-amber-300 bg-white/10 backdrop-blur-sm pl-2 pr-3 py-1.5 rounded-full border border-amber-300/30">
              <span className="w-5 h-5 rounded-full bg-amber-300/20 flex items-center justify-center">
                <Building2 className="w-3 h-3" strokeWidth={2.5} />
              </span>
              {org.name}
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold leading-[1.02] tracking-tight">
              Estudiantes
            </h1>
            <p className="text-sm md:text-base text-white/80 leading-relaxed max-w-2xl">
              Roster completo del programa, agrupado por clase y ordenado
              por nivel. Desde cada fila puedes solicitar un cambio de grupo,
              pedir una reevaluación o reemplazar al estudiante.
            </p>
          </div>
        </div>

        {rosterLoading || groupsLoading ? (
          <Loading />
        ) : roster.length === 0 ? (
          <Empty icon="👥" title="Todavía no hay empleados cargados"
            body="Cuando el equipo de FriendlyTeaching active a los estudiantes aparecerán aquí." />
        ) : (
          <div className="space-y-6">
            {bundles.map(b => (
              <GroupSection
                key={b.group.id}
                bundle={b}
                onPick={(type, student) => setModal({ type, student, group: b.group.id === UNGROUPED_ID ? null : b.group })}
              />
            ))}
          </div>
        )}
      </div>

      {modal && (
        <ChangeRequestModal
          type={modal.type}
          student={modal.student}
          currentGroup={modal.group}
          allGroups={groups}
          orgId={org.id}
          onClose={() => setModal(null)}
        />
      )}
    </Shell>
  );
}

// ── Group section (header + sorted rows) ─────────────────────

function GroupSection({
  bundle,
  onPick,
}: {
  bundle:  GroupBundle;
  onPick:  (type: ChangeRequestType, student: RosterEntry) => void;
}) {
  const sorted = useMemo(() => {
    return [...bundle.members].sort((a, b) => {
      const ra = a.currentLevel ? CEFR_RANK[a.currentLevel] ?? 99 : 99;
      const rb = b.currentLevel ? CEFR_RANK[b.currentLevel] ?? 99 : 99;
      if (ra !== rb) return ra - rb;
      return a.fullName.localeCompare(b.fullName, 'es');
    });
  }, [bundle.members]);

  const isUngrouped = bundle.group.id === UNGROUPED_ID;
  const slot = formatSlot(bundle.group.dayOfWeek, bundle.group.hour);

  return (
    <section className="bg-white rounded-3xl border border-[#E8D5F0] shadow-[0_6px_18px_-10px_rgba(90,61,122,0.18)] overflow-hidden">
      {/* Group header */}
      <div className="px-6 md:px-8 py-5 border-b border-[#F0E5FF] bg-[#FAF5FF] flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            {bundle.group.level && !isUngrouped && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white text-[#5A3D7A] text-[11px] font-black tracking-wider border border-[#E8D5F0]">
                {bundle.group.level}
              </span>
            )}
            {slot && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200">
                <CalendarClock className="w-3 h-3" strokeWidth={2.5} />
                {slot}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#9B7CB8]">
              <Users className="w-3 h-3" strokeWidth={2.5} />
              {bundle.members.length} {bundle.members.length === 1 ? 'persona' : 'personas'}
            </span>
          </div>
          <h2 className="font-serif text-xl md:text-2xl font-bold text-[#2D1B4E] leading-tight">
            {bundle.group.name}
          </h2>
        </div>
        {!isUngrouped && (
          <Link
            href={`/dashboard/corporate/groups/${bundle.group.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5A3D7A] hover:text-[#2D1B4E] transition-colors"
          >
            Ver detalle del grupo <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
          </Link>
        )}
      </div>

      {/* Rows */}
      <ul>
        {sorted.map((entry, i) => (
          <StudentRow
            key={entry.uid}
            entry={entry}
            isLast={i === sorted.length - 1}
            onPick={(type) => onPick(type, entry)}
          />
        ))}
      </ul>
    </section>
  );
}

// ── Row ──────────────────────────────────────────────────────

function StudentRow({
  entry, isLast, onPick,
}: {
  entry: RosterEntry;
  isLast: boolean;
  onPick: (type: ChangeRequestType) => void;
}) {
  const initials = entry.fullName
    .split(' ').filter(Boolean).slice(0, 2)
    .map(s => s[0]?.toUpperCase() ?? '').join('') || '·';
  const avatarBg = avatarGradient(entry.uid);

  return (
    <li className={`px-6 md:px-8 py-4 flex items-center gap-4 hover:bg-[#FAFAFF] transition-colors ${isLast ? '' : 'border-b border-gray-100'}`}>
      <Link
        href={`/dashboard/corporate/students/${entry.uid}`}
        className="flex items-center gap-4 min-w-0 flex-1 group"
      >
        <div
          className="w-11 h-11 rounded-full text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow"
          style={{ background: avatarBg }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-[#2D1B4E] truncate leading-tight group-hover:text-[#5A3D7A] transition-colors">
            {entry.fullName}
          </p>
          <p className="text-[12px] text-gray-500 truncate mt-0.5">{entry.email}</p>
        </div>
      </Link>

      <div className="hidden md:flex items-center gap-4 flex-shrink-0">
        <LevelPill level={entry.currentLevel} />
        <div className="w-[120px] text-right">
          <p className="text-[13px] font-bold text-[#2D1B4E] tabular-nums leading-none">
            {entry.classesLast30Days > 0 ? `${entry.attendancePct}%` : <span className="text-gray-400">—</span>}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {entry.classesLast30Days} {entry.classesLast30Days === 1 ? 'clase' : 'clases'} 30d
          </p>
        </div>
      </div>

      <StudentActionsMenu onPick={onPick} />
    </li>
  );
}

// ── Chrome ───────────────────────────────────────────────────

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

function Loading() {
  return (
    <div className="max-w-6xl mx-auto py-24 text-center">
      <div className="w-10 h-10 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-sm text-[#9B7CB8]">Cargando…</p>
    </div>
  );
}

function Empty({ icon, title, body }: { icon: string; title: string; body: string }) {
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

// ── Helpers ──────────────────────────────────────────────────

function formatSlot(dayOfWeek: number | null, hour: number | null): string | null {
  if (dayOfWeek == null || hour == null) return null;
  const day = DAY_LABELS[dayOfWeek] ?? '';
  const hh = String(hour).padStart(2, '0');
  return day ? `${day} ${hh}:00` : `${hh}:00`;
}

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
