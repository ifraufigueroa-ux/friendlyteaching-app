// FriendlyTeaching.cl — Class History Page
'use client';
import { useMemo, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useClassHistory } from '@/hooks/useClassHistory';
import { auth } from '@/lib/firebase/config';
import TopBar from '@/components/layout/TopBar';
import type { ClassHistoryEntry } from '@/hooks/useClassHistory';

const DAY_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MOOD_ICON: Record<string, string> = { great: '🌟', good: '😊', regular: '😕' };
const MOOD_LABEL: Record<string, string> = { great: 'Excelente', good: 'Buena', regular: 'Regular' };

type Range = '7' | '30' | '90' | 'all';
type AttendFilter = 'all' | 'attended' | 'absent';

function entryDate(entry: ClassHistoryEntry): Date {
  const d = entry.date as unknown as { toDate?: () => Date; seconds?: number };
  if (typeof d.toDate === 'function') return d.toDate();
  if (d.seconds) return new Date(d.seconds * 1000);
  return new Date(entry.date as unknown as string);
}

export default function ClassHistoryPage() {
  const { profile } = useAuthStore();
  const uid = profile?.uid ?? auth.currentUser?.uid ?? '';

  const { history, loading } = useClassHistory(uid, 365);

  const [range, setRange]               = useState<Range>('30');
  const [attendFilter, setAttendFilter] = useState<AttendFilter>('all');
  const [studentFilter, setStudentFilter] = useState('');
  const [expandedId, setExpandedId]     = useState<string | null>(null);

  // Unique student names for the filter dropdown
  const studentNames = useMemo(() => {
    const names = new Set(history.map((e) => e.studentName));
    return [...names].sort();
  }, [history]);

  // Apply filters
  const filtered = useMemo(() => {
    const cutoff = new Date();
    if (range !== 'all') cutoff.setDate(cutoff.getDate() - parseInt(range));

    return history.filter((e) => {
      const d = entryDate(e);
      if (range !== 'all' && d < cutoff) return false;
      if (attendFilter === 'attended' && !e.attended) return false;
      if (attendFilter === 'absent' && e.attended) return false;
      if (studentFilter && e.studentName !== studentFilter) return false;
      return true;
    });
  }, [history, range, attendFilter, studentFilter]);

  // Stats over filtered set
  const stats = useMemo(() => {
    const total = filtered.length;
    const attended = filtered.filter((e) => e.attended).length;
    const absent = total - attended;
    const withNotes = filtered.filter((e) => e.notes && (e.notes.covered || e.notes.performance)).length;
    return { total, attended, absent, withNotes };
  }, [filtered]);

  // Group by week for display
  const grouped = useMemo(() => {
    const groups = new Map<string, ClassHistoryEntry[]>();
    for (const e of filtered) {
      const d = entryDate(e);
      // Monday of that week
      const mon = new Date(d);
      const dow = mon.getDay();
      mon.setDate(mon.getDate() - (dow === 0 ? 6 : dow - 1));
      mon.setHours(0, 0, 0, 0);
      const key = mon.toISOString().slice(0, 10);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(e);
    }
    // Sort groups newest first
    return [...groups.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([weekKey, entries]) => ({
        weekKey,
        weekLabel: weekLabel(weekKey),
        entries: entries.sort((a, b) => entryDate(b).getTime() - entryDate(a).getTime()),
      }));
  }, [filtered]);

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Historial de Clases"
        subtitle="Registro de todas las sesiones impartidas"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/teacher' },
          { label: 'Historial' },
        ]}
      />

      <div className="flex-1 p-6 overflow-auto space-y-5">

        {/* ── Stats row ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatChip icon="📋" label="Total clases" value={stats.total} color="#C8A8DC" />
          <StatChip icon="✅" label="Realizadas" value={stats.attended} color="#A8E6A1" />
          <StatChip icon="❌" label="Ausencias" value={stats.absent} color="#FFAAAA" />
          <StatChip
            icon="📝"
            label="Con notas"
            value={stats.withNotes}
            sub={stats.total > 0 ? `${Math.round((stats.withNotes / stats.total) * 100)}%` : '—'}
            color="#FFE8A8"
          />
        </div>

        {/* ── Filters ────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center">
          {/* Date range */}
          <div className="flex gap-1">
            {(['7', '30', '90', 'all'] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  range === r
                    ? 'bg-[#5A3D7A] text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {r === 'all' ? 'Todo' : `${r}d`}
              </button>
            ))}
          </div>

          {/* Attendance filter */}
          <div className="flex gap-1">
            {(['all', 'attended', 'absent'] as AttendFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setAttendFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  attendFilter === f
                    ? 'bg-[#5A3D7A] text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'Todas' : f === 'attended' ? '✅ Realizadas' : '❌ Ausencias'}
              </button>
            ))}
          </div>

          {/* Student filter */}
          <select
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 border-none outline-none hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <option value="">Todos los estudiantes</option>
            {studentNames.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>

          <span className="ml-auto text-xs text-gray-400 font-medium">
            {stats.total} resultado{stats.total !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── History list ───────────────────────────────────────── */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Cargando historial…</div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-gray-500 text-sm">No hay clases registradas para este filtro.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map(({ weekKey, weekLabel: wLabel, entries }) => (
              <div key={weekKey}>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                  {wLabel}
                </p>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
                  {entries.map((entry) => {
                    const d = entryDate(entry);
                    const isExpanded = expandedId === entry.id;
                    const hasNotes = entry.notes && (
                      entry.notes.covered || entry.notes.performance ||
                      entry.notes.nextClass || entry.notes.homework || entry.notes.mood
                    );

                    return (
                      <div key={entry.id}>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                        >
                          {/* Attendance dot */}
                          <span className="text-xl flex-shrink-0">
                            {entry.attended ? '✅' : '❌'}
                          </span>

                          {/* Date & time */}
                          <div className="w-24 flex-shrink-0">
                            <p className="text-xs font-bold text-gray-700">
                              {DAY_ES[d.getDay()]} {d.getDate()}/{d.getMonth() + 1}
                            </p>
                            <p className="text-[11px] text-gray-400">{entry.hour}:00 – {entry.hour + 1}:00</p>
                          </div>

                          {/* Student */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{entry.studentName}</p>
                            <p className="text-[11px] text-gray-400">
                              {entry.isRecurring ? '↻ Recurrente' : '• Una vez'}
                              {entry.notes?.mood ? ` · ${MOOD_ICON[entry.notes.mood]} ${MOOD_LABEL[entry.notes.mood]}` : ''}
                            </p>
                          </div>

                          {/* Status badge */}
                          <span className={`flex-shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                            entry.attended
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {entry.attended ? 'Asistió' : 'Ausente'}
                          </span>

                          {/* Notes indicator + expand chevron */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {hasNotes && (
                              <span className="text-[10px] text-[#9B7CB8] font-semibold bg-[#F0E5FF] px-2 py-0.5 rounded-full">
                                Notas
                              </span>
                            )}
                            <span className={`text-gray-400 text-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                              ▾
                            </span>
                          </div>
                        </button>

                        {/* Expanded notes */}
                        {isExpanded && hasNotes && (
                          <div className="px-14 pb-4 pt-1 bg-[#FAFAFA] border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {entry.notes?.covered && (
                              <NoteField icon="📚" label="Temas cubiertos" value={entry.notes.covered} />
                            )}
                            {entry.notes?.performance && (
                              <NoteField icon="💬" label="Desempeño" value={entry.notes.performance} />
                            )}
                            {entry.notes?.nextClass && (
                              <NoteField icon="🎯" label="Próxima clase" value={entry.notes.nextClass} />
                            )}
                            {entry.notes?.homework && (
                              <NoteField icon="📋" label="Tarea asignada" value={entry.notes.homework} />
                            )}
                            {entry.notes?.mood && (
                              <NoteField
                                icon={MOOD_ICON[entry.notes.mood]}
                                label="Estado de la clase"
                                value={MOOD_LABEL[entry.notes.mood]}
                              />
                            )}
                          </div>
                        )}
                        {isExpanded && !hasNotes && (
                          <div className="px-14 pb-3 pt-1 bg-[#FAFAFA] border-t border-gray-100">
                            <p className="text-xs text-gray-400 italic">Sin notas registradas para esta clase.</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatChip({ icon, label, value, sub, color }: {
  icon: string; label: string; value: number; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: `${color}33` }}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-extrabold text-gray-800 leading-none">{value}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

function NoteField({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
        {icon} {label}
      </p>
      <p className="text-xs text-gray-700 leading-relaxed">{value}</p>
    </div>
  );
}

function weekLabel(isoMonday: string): string {
  const d = new Date(isoMonday + 'T12:00:00');
  const now = new Date();
  const thisMonday = new Date(now);
  const dow = now.getDay();
  thisMonday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  thisMonday.setHours(0, 0, 0, 0);
  const diffMs = thisMonday.getTime() - d.getTime();
  const diffWeeks = Math.round(diffMs / (7 * 24 * 3600 * 1000));
  if (diffWeeks === 0) return 'Esta semana';
  if (diffWeeks === 1) return 'Semana pasada';
  return `Semana del ${d.getDate()} de ${d.toLocaleDateString('es-CL', { month: 'long' })}`;
}
