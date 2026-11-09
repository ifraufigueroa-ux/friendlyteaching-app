// FriendlyTeaching.cl — Corporate Asistencia tab
//
// Three sections, top to bottom:
//   1. Trend — one-liner headline + a 12-week spark line of weekly
//      org-wide attendance %.
//   2. Heatmap — rows are groups, columns are the trailing 12 weeks.
//      Each cell averages member attendance for that group that week.
//   3. Watchlist — members whose last-30d attendance sits under 65%
//      (or who have ≥2 recent absences in a row). Pitch element.

'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Building2, AlertTriangle } from 'lucide-react';
import { useMyOrganization } from '@/hooks/useOrganization';
import { useOrganizationRoster } from '@/hooks/useOrganizationRoster';
import { useOrganizationGroups, UNGROUPED_ID } from '@/hooks/useOrganizationGroups';
import type { OrgGroup, RosterEntry } from '@/types/organization';

const DAY_LABELS = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const WEEKS_SHOWN = 12;
const WATCHLIST_PCT_THRESHOLD = 65;

export default function CorporateAttendancePage() {
  const { org, loading: orgLoading, isCorporateAdmin } = useMyOrganization();
  const { roster, loading: rosterLoading } = useOrganizationRoster(org);
  const { groups, loading: groupsLoading } = useOrganizationGroups(org?.id);

  // Per-group × per-week attendance matrix. Each cell is 'attended' /
  // 'absent' / 'none' aggregated across the group's members: any 'absent'
  // in the group that week downgrades the cell; all 'attended' → green.
  const matrix = useMemo(() => {
    return groups
      .filter(g => g.id !== UNGROUPED_ID)
      .map(g => {
        const members = roster.filter(r => (g.memberUids ?? []).includes(r.uid));
        const weeks = buildGroupWeekly(members);
        return { group: g, weeks };
      });
  }, [groups, roster]);

  const orgWeekly = useMemo(() => buildOrgWeekly(matrix), [matrix]);
  const trend = useMemo(() => buildTrend(orgWeekly), [orgWeekly]);
  const watchlist = useMemo(() => buildWatchlist(roster, groups), [roster, groups]);

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
          <span className="text-[#5A3D7A] font-semibold">Asistencia</span>
        </div>

        {/* Hero + trend headline */}
        <div
          className="relative rounded-[32px] p-8 md:p-10 text-white shadow-xl overflow-hidden"
          style={{ backgroundImage: 'linear-gradient(135deg, #2D1B4E 0%, #5A3D7A 50%, #8A5EB5 100%)' }}
        >
          <div aria-hidden className="absolute inset-0 pointer-events-none opacity-30"
            style={{ backgroundImage: 'radial-gradient(circle at 85% 15%, rgba(245,158,11,0.35) 0%, transparent 55%), radial-gradient(circle at 10% 95%, rgba(255,255,255,0.15) 0%, transparent 55%)' }} />
          <div className="relative grid grid-cols-1 lg:grid-cols-5 gap-8 items-end">
            <div className="lg:col-span-3 space-y-4">
              <div className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] text-amber-300 bg-white/10 backdrop-blur-sm pl-2 pr-3 py-1.5 rounded-full border border-amber-300/30">
                <span className="w-5 h-5 rounded-full bg-amber-300/20 flex items-center justify-center">
                  <Building2 className="w-3 h-3" strokeWidth={2.5} />
                </span>
                {org.name}
              </div>
              <h1 className="font-serif text-4xl md:text-5xl font-bold leading-[1.02] tracking-tight">
                Asistencia
              </h1>
              <p className="text-sm md:text-base text-white/80 leading-relaxed max-w-xl">
                Heatmap de las últimas {WEEKS_SHOWN} semanas por grupo,
                tendencia agregada y lista de alerta con quien se está
                quedando atrás.
              </p>
            </div>
            {/* Trend summary — big percent + sparkline */}
            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-5 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-300/90">
                  Promedio últimas 4 semanas
                </p>
                <p className="font-serif text-5xl md:text-6xl font-bold leading-none tracking-tight tabular-nums">
                  {trend.last4WeeksAvg}%
                </p>
                <Sparkline values={trend.weeklyPcts} />
                <p className="text-[11px] text-white/70">
                  {trend.changeLabel}
                </p>
              </div>
            </div>
          </div>
        </div>

        {rosterLoading || groupsLoading ? (
          <Loading />
        ) : matrix.length === 0 ? (
          <Empty icon="📅" title="Aún no hay grupos configurados" body="Cuando armemos los grupos, verás aquí la asistencia semanal." />
        ) : (
          <>
            {/* Heatmap */}
            <Section eyebrow="Heatmap" title="Asistencia por grupo · semana">
              <Heatmap matrix={matrix} weekLabels={trend.weekLabels} />
              <HeatmapLegend />
            </Section>

            {/* Watchlist */}
            <Section eyebrow="Watchlist" title={`En riesgo (${watchlist.length})`}
              subtitle="Empleados bajo 65% de asistencia los últimos 30 días">
              {watchlist.length === 0 ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-center">
                  <p className="text-emerald-800 font-semibold">
                    🟢 Todos sobre 65% — no hay riesgos activos.
                  </p>
                </div>
              ) : (
                <Watchlist entries={watchlist} />
              )}
            </Section>
          </>
        )}
      </div>
    </Shell>
  );
}

// ── Heatmap ──────────────────────────────────────────────────

function Heatmap({
  matrix, weekLabels,
}: {
  matrix:     { group: OrgGroup; weeks: WeekCell[] }[];
  weekLabels: string[];
}) {
  return (
    <div className="bg-white rounded-3xl border border-[#E8D5F0] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Header row */}
          <div
            className="grid gap-1 px-5 py-3 bg-[#FAF5FF] border-b border-[#E8D5F0] text-[9px] font-black uppercase tracking-widest text-[#9B7CB8]"
            style={{ gridTemplateColumns: `minmax(170px, 1fr) repeat(${WEEKS_SHOWN}, minmax(32px, 1fr))` }}
          >
            <div>Grupo</div>
            {weekLabels.map((w, i) => (
              <div key={i} className="text-center tabular-nums">{w}</div>
            ))}
          </div>

          {/* Rows */}
          <div>
            {matrix.map(({ group, weeks }, i) => (
              <div
                key={group.id}
                className={`grid gap-1 px-5 py-3 items-center ${
                  i === matrix.length - 1 ? '' : 'border-b border-gray-100'
                }`}
                style={{ gridTemplateColumns: `minmax(170px, 1fr) repeat(${WEEKS_SHOWN}, minmax(32px, 1fr))` }}
              >
                <Link
                  href={`/dashboard/corporate/groups/${group.id}`}
                  className="min-w-0 group"
                >
                  <p className="text-sm font-bold text-[#2D1B4E] truncate leading-tight group-hover:text-[#5A3D7A] transition-colors">
                    {group.name}
                  </p>
                  {group.dayOfWeek != null && group.hour != null && (
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {DAY_LABELS[group.dayOfWeek]} · {String(group.hour).padStart(2, '0')}:00
                    </p>
                  )}
                </Link>
                {weeks.map((w, wi) => (
                  <HeatmapCell key={wi} cell={w} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HeatmapCell({ cell }: { cell: WeekCell }) {
  if (cell.state === 'none') {
    return (
      <div
        className="h-8 rounded-md bg-[#F3EDFA] border border-[#EEE4F7]"
        title="Sin clase programada esa semana"
      />
    );
  }
  const pct = Math.round(cell.pct);
  const bg =
    pct >= 90 ? '#10B981'
    : pct >= 75 ? '#86EFAC'
    : pct >= 55 ? '#FCD34D'
    : pct >= 25 ? '#FDA4AF'
                : '#F87171';
  const text = pct >= 75 ? '#064E3B' : pct >= 25 ? '#7C2D12' : '#7F1D1D';
  return (
    <div
      className="h-8 rounded-md flex items-center justify-center text-[11px] font-black tabular-nums"
      style={{ background: bg, color: text }}
      title={`${cell.attendedCount}/${cell.scheduledCount} asistieron`}
    >
      {pct}
    </div>
  );
}

function HeatmapLegend() {
  const stops: { label: string; bg: string }[] = [
    { label: '≥90%', bg: '#10B981' },
    { label: '75–89%', bg: '#86EFAC' },
    { label: '55–74%', bg: '#FCD34D' },
    { label: '25–54%', bg: '#FDA4AF' },
    { label: '<25%', bg: '#F87171' },
    { label: 'sin clase', bg: '#F3EDFA' },
  ];
  return (
    <div className="flex items-center gap-3 flex-wrap mt-3 text-[11px] text-gray-600">
      {stops.map(s => (
        <span key={s.label} className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: s.bg }} />
          {s.label}
        </span>
      ))}
    </div>
  );
}

// ── Watchlist ────────────────────────────────────────────────

function Watchlist({ entries }: { entries: WatchEntry[] }) {
  return (
    <div className="bg-white rounded-3xl border border-rose-200 shadow-sm overflow-hidden">
      <ul>
        {entries.map((e, i) => (
          <li
            key={e.entry.uid}
            className={`px-6 py-4 flex items-center gap-4 hover:bg-rose-50/40 transition-colors ${i === entries.length - 1 ? '' : 'border-b border-gray-100'}`}
          >
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <Link
                href={`/dashboard/corporate/students/${e.entry.uid}`}
                className="text-[15px] font-bold text-[#2D1B4E] truncate leading-tight hover:text-rose-700 transition-colors"
              >
                {e.entry.fullName}
              </Link>
              <p className="text-[12px] text-gray-500 truncate mt-0.5">
                {e.groupName
                  ? `${e.groupName} · ${e.entry.classesLast30Days} ${e.entry.classesLast30Days === 1 ? 'clase' : 'clases'} en 30d`
                  : `${e.entry.classesLast30Days} ${e.entry.classesLast30Days === 1 ? 'clase' : 'clases'} en 30d · sin grupo`}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[13px] font-black text-rose-700 tabular-nums leading-none">
                {e.entry.attendancePct}%
              </p>
              <p className="text-[10px] text-rose-600/80 mt-0.5">asistencia</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Sparkline ────────────────────────────────────────────────

function Sparkline({ values }: { values: number[] }) {
  if (values.length === 0) return <div className="h-8" />;
  const max = Math.max(100, ...values);
  const min = Math.min(0, ...values);
  const w = 180;
  const h = 32;
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const points = values.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / Math.max(1, max - min)) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke="#FCD34D"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Chrome ───────────────────────────────────────────────────

function Section({
  eyebrow, title, subtitle, children,
}: {
  eyebrow:   string;
  title:     string;
  subtitle?: string;
  children:  React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <p className="text-[11px] font-black uppercase tracking-[0.35em] text-[#9B7CB8]">
          {eyebrow}
        </p>
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#2D1B4E] leading-tight">
          {title}
        </h2>
        {subtitle && <p className="text-sm text-[#5A3D7A]/70">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

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
      <p className="text-sm text-[#9B7CB8]">Cargando asistencia…</p>
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

// ── Pure helpers (data shape) ────────────────────────────────

interface WeekCell {
  weekStart:       string;
  state:           'attended' | 'absent' | 'mixed' | 'none';
  attendedCount:   number;
  scheduledCount:  number;
  pct:             number;
}

/** Aggregate a group's member-level weekly history into one cell per week.
 *  'none' when zero scheduled members that week; otherwise pct = attended /
 *  scheduled. */
function buildGroupWeekly(members: RosterEntry[]): WeekCell[] {
  if (members.length === 0) return [];
  const weeks = members[0].weeklyHistory ?? [];
  return weeks.map((_, i) => {
    let scheduled = 0;
    let attended  = 0;
    for (const m of members) {
      const w = m.weeklyHistory?.[i];
      if (!w || w.result === 'none') continue;
      scheduled++;
      if (w.result === 'attended') attended++;
    }
    const pct = scheduled > 0 ? (attended / scheduled) * 100 : 0;
    const state: WeekCell['state'] =
      scheduled === 0 ? 'none'
      : attended === scheduled ? 'attended'
      : attended === 0 ? 'absent'
                        : 'mixed';
    return {
      weekStart:      weeks[i].weekStart,
      state,
      attendedCount:  attended,
      scheduledCount: scheduled,
      pct,
    };
  });
}

/** Org-wide weekly totals rolled up from the per-group matrix. */
function buildOrgWeekly(
  matrix: { group: OrgGroup; weeks: WeekCell[] }[],
): WeekCell[] {
  const weeksCount = matrix[0]?.weeks.length ?? 0;
  const out: WeekCell[] = [];
  for (let i = 0; i < weeksCount; i++) {
    let attended = 0, scheduled = 0;
    for (const row of matrix) {
      const w = row.weeks[i];
      if (!w) continue;
      attended  += w.attendedCount;
      scheduled += w.scheduledCount;
    }
    const pct = scheduled > 0 ? (attended / scheduled) * 100 : 0;
    const state: WeekCell['state'] =
      scheduled === 0 ? 'none'
      : attended === scheduled ? 'attended'
      : attended === 0 ? 'absent'
                        : 'mixed';
    out.push({
      weekStart:      matrix[0].weeks[i]?.weekStart ?? '',
      state,
      attendedCount:  attended,
      scheduledCount: scheduled,
      pct,
    });
  }
  return out;
}

/** Headline metrics for the hero's right-side card. */
function buildTrend(orgWeekly: WeekCell[]): {
  last4WeeksAvg: number;
  weeklyPcts:    number[];
  weekLabels:    string[];
  changeLabel:   string;
} {
  const weeklyPcts = orgWeekly.map(w => (w.scheduledCount > 0 ? w.pct : 0));
  const scheduled = orgWeekly.filter(w => w.scheduledCount > 0);
  const last4 = scheduled.slice(-4);
  const last4Avg = last4.length
    ? Math.round(last4.reduce((s, w) => s + w.pct, 0) / last4.length)
    : 0;

  // prior 4 weeks for delta
  const prior4 = scheduled.slice(-8, -4);
  const prior4Avg = prior4.length
    ? Math.round(prior4.reduce((s, w) => s + w.pct, 0) / prior4.length)
    : null;

  const changeLabel =
    prior4Avg == null
      ? `Promedio móvil · ${scheduled.length} semanas con clase`
      : last4Avg > prior4Avg
        ? `▲ ${last4Avg - prior4Avg} pts vs. 4 semanas previas`
        : last4Avg < prior4Avg
          ? `▼ ${prior4Avg - last4Avg} pts vs. 4 semanas previas`
          : `Sin cambios vs. 4 semanas previas`;

  const weekLabels = orgWeekly.map(w => shortWeekLabel(w.weekStart));

  return { last4WeeksAvg: last4Avg, weeklyPcts, weekLabels, changeLabel };
}

/** Label like "6-oct" for the x-axis of the heatmap. */
function shortWeekLabel(iso: string): string {
  if (!iso) return '';
  const [, m, d] = iso.split('-').map(Number);
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${d}/${months[m - 1]}`;
}

interface WatchEntry {
  entry:     RosterEntry;
  groupName: string | null;
}

function buildWatchlist(roster: RosterEntry[], groups: OrgGroup[]): WatchEntry[] {
  const groupByUid = new Map<string, OrgGroup>();
  for (const g of groups) for (const uid of g.memberUids ?? []) groupByUid.set(uid, g);

  return roster
    .filter(r =>
      r.classesLast30Days > 0 &&
      r.attendancePct < WATCHLIST_PCT_THRESHOLD,
    )
    .sort((a, b) => a.attendancePct - b.attendancePct)
    .map(entry => ({
      entry,
      groupName: groupByUid.get(entry.uid)?.name ?? null,
    }));
}

