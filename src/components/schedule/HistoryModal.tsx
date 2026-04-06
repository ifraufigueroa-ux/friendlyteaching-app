// FriendlyTeaching.cl — History Modal (slide-over drawer)
'use client';
import { useMemo, useState, useEffect } from 'react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useClassHistory } from '@/hooks/useClassHistory';
import type { ClassHistoryEntry } from '@/hooks/useClassHistory';

const DAY_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MOOD_ICON: Record<string, string> = { great: '🌟', good: '😊', regular: '😕' };
const MOOD_LABEL: Record<string, string> = { great: 'Excelente', good: 'Buena', regular: 'Regular' };

type Range = '7' | '30' | '90' | 'all';
type AttendFilter = 'all' | 'attended' | 'absent';

function resolveDate(entry: ClassHistoryEntry): Date {
  const d = entry.date as unknown as { toDate?: () => Date; seconds?: number };
  if (typeof d.toDate === 'function') return d.toDate();
  if (d.seconds) return new Date(d.seconds * 1000);
  return new Date(entry.date as unknown as string);
}

interface Props {
  teacherId: string;
  onClose: () => void;
}

export default function HistoryModal({ teacherId, onClose }: Props) {
  const { history, loading } = useClassHistory(teacherId, 365);

  const [range, setRange]               = useState<Range>('30');
  const [attendFilter, setAttendFilter] = useState<AttendFilter>('all');
  const [studentFilter, setStudentFilter] = useState('');
  const [expandedId, setExpandedId]     = useState<string | null>(null);
  const [deletingId, setDeletingId]     = useState<string | null>(null);
  const [visible, setVisible]           = useState(false);

  async function handleDelete(entryId: string) {
    setDeletingId(entryId);
    try {
      await deleteDoc(doc(db, 'classHistory', entryId));
    } catch (e) {
      console.error('[HistoryModal] delete failed:', e);
    } finally {
      setDeletingId(null);
    }
  }

  // Animate in on mount
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 300);
  }

  const studentNames = useMemo(() => {
    const names = new Set(history.map((e) => e.studentName));
    return [...names].sort();
  }, [history]);

  const filtered = useMemo(() => {
    const cutoff = new Date();
    if (range !== 'all') cutoff.setDate(cutoff.getDate() - parseInt(range));
    return history.filter((e) => {
      const d = resolveDate(e);
      if (range !== 'all' && d < cutoff) return false;
      if (attendFilter === 'attended' && !e.attended) return false;
      if (attendFilter === 'absent' && e.attended) return false;
      if (studentFilter && e.studentName !== studentFilter) return false;
      return true;
    });
  }, [history, range, attendFilter, studentFilter]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const attended = filtered.filter((e) => e.attended).length;
    return { total, attended, absent: total - attended };
  }, [filtered]);

  const grouped = useMemo(() => {
    const groups = new Map<string, ClassHistoryEntry[]>();
    for (const e of filtered) {
      const d = resolveDate(e);
      const mon = new Date(d);
      const dow = mon.getDay();
      mon.setDate(mon.getDate() - (dow === 0 ? 6 : dow - 1));
      mon.setHours(0, 0, 0, 0);
      const key = mon.toISOString().slice(0, 10);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(e);
    }
    return [...groups.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([weekKey, entries]) => ({
        weekKey,
        weekLabel: formatWeekLabel(weekKey),
        entries: entries.sort((a, b) => resolveDate(b).getTime() - resolveDate(a).getTime()),
      }));
  }, [filtered]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300"
        style={{ transform: visible ? 'translateX(0)' : 'translateX(100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800">📋 Historial de clases</h2>
            <p className="text-xs text-gray-400 mt-0.5">{history.length} registros en total</p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Stats strip */}
        <div className="flex gap-4 px-6 py-3 bg-[#F8F4FF] border-b border-[#E8D5FF] flex-shrink-0">
          <div className="text-center">
            <p className="text-xl font-extrabold text-[#5A3D7A]">{stats.total}</p>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Total</p>
          </div>
          <div className="w-px bg-[#E8D5FF]" />
          <div className="text-center">
            <p className="text-xl font-extrabold text-green-600">{stats.attended}</p>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Realizadas</p>
          </div>
          <div className="w-px bg-[#E8D5FF]" />
          <div className="text-center">
            <p className="text-xl font-extrabold text-red-500">{stats.absent}</p>
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Ausencias</p>
          </div>
          {stats.total > 0 && (
            <>
              <div className="w-px bg-[#E8D5FF]" />
              <div className="text-center">
                <p className="text-xl font-extrabold text-[#5A3D7A]">
                  {Math.round((stats.attended / stats.total) * 100)}%
                </p>
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Asistencia</p>
              </div>
            </>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 px-6 py-3 border-b border-gray-100 flex-shrink-0">
          {/* Date range */}
          <div className="flex gap-1">
            {(['7', '30', '90', 'all'] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  range === r ? 'bg-[#5A3D7A] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {r === 'all' ? 'Todo' : `${r}d`}
              </button>
            ))}
          </div>

          {/* Attendance */}
          <div className="flex gap-1">
            {(['all', 'attended', 'absent'] as AttendFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setAttendFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  attendFilter === f ? 'bg-[#5A3D7A] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'Todas' : f === 'attended' ? '✅ Realizadas' : '❌ Ausencias'}
              </button>
            ))}
          </div>

          {/* Student */}
          <select
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-gray-100 text-gray-600 outline-none hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <option value="">Todos los estudiantes</option>
            {studentNames.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm">Cargando historial…</div>
          ) : grouped.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-gray-500 text-sm">Sin registros para este filtro.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {grouped.map(({ weekKey, weekLabel, entries }) => (
                <div key={weekKey}>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    {weekLabel}
                  </p>
                  <div className="bg-gray-50 rounded-2xl divide-y divide-gray-100 border border-gray-100">
                    {entries.map((entry) => {
                      const d = resolveDate(entry);
                      const isExpanded = expandedId === entry.id;
                      const hasNotes = entry.notes && (
                        entry.notes.covered || entry.notes.performance ||
                        entry.notes.nextClass || entry.notes.homework || entry.notes.mood
                      );

                      return (
                        <div key={entry.id} className="relative group">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white rounded-2xl transition-colors text-left pr-10"
                          >
                            <span className="text-lg flex-shrink-0">{entry.attended ? '✅' : '❌'}</span>

                            <div className="w-20 flex-shrink-0">
                              <p className="text-xs font-bold text-gray-700">
                                {DAY_ES[d.getDay()]} {d.getDate()}/{d.getMonth() + 1}
                              </p>
                              <p className="text-[10px] text-gray-400">{entry.hour}:00</p>
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{entry.studentName}</p>
                              <p className="text-[10px] text-gray-400">
                                {entry.isRecurring ? '↻ Recurrente' : '• Una vez'}
                                {entry.notes?.mood ? ` · ${MOOD_ICON[entry.notes.mood]}` : ''}
                              </p>
                            </div>

                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                              entry.attended ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                            }`}>
                              {entry.attended ? 'Asistió' : 'Ausente'}
                            </span>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              {hasNotes && (
                                <span className="text-[10px] text-[#9B7CB8] font-semibold bg-[#F0E5FF] px-1.5 py-0.5 rounded-full">
                                  📝
                                </span>
                              )}
                              <span className={`text-gray-400 text-sm transition-transform inline-block ${isExpanded ? 'rotate-180' : ''}`}>
                                ▾
                              </span>
                            </div>
                          </button>

                          {/* Delete button — outside the expand button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                            disabled={deletingId === entry.id}
                            title="Eliminar este registro"
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors disabled:opacity-40 opacity-0 group-hover:opacity-100"
                          >
                            {deletingId === entry.id ? '…' : '🗑'}
                          </button>

                          {isExpanded && (
                            <div className="px-12 pb-3 pt-1">
                              {hasNotes ? (
                                <div className="grid grid-cols-1 gap-2">
                                  {entry.notes?.covered && (
                                    <p className="text-xs text-gray-600"><span className="font-semibold text-gray-700">📚 Temas:</span> {entry.notes.covered}</p>
                                  )}
                                  {entry.notes?.performance && (
                                    <p className="text-xs text-gray-600"><span className="font-semibold text-gray-700">💬 Desempeño:</span> {entry.notes.performance}</p>
                                  )}
                                  {entry.notes?.nextClass && (
                                    <p className="text-xs text-gray-600"><span className="font-semibold text-gray-700">🎯 Próxima clase:</span> {entry.notes.nextClass}</p>
                                  )}
                                  {entry.notes?.homework && (
                                    <p className="text-xs text-gray-600"><span className="font-semibold text-gray-700">📋 Tarea:</span> {entry.notes.homework}</p>
                                  )}
                                  {entry.notes?.mood && (
                                    <p className="text-xs text-gray-600">
                                      <span className="font-semibold text-gray-700">{MOOD_ICON[entry.notes.mood]} Estado:</span> {MOOD_LABEL[entry.notes.mood]}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-400 italic">Sin notas para esta clase.</p>
                              )}
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
    </>
  );
}

function formatWeekLabel(isoMonday: string): string {
  const d = new Date(isoMonday + 'T12:00:00');
  const now = new Date();
  const mon = new Date(now);
  const dow = now.getDay();
  mon.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  mon.setHours(0, 0, 0, 0);
  const diffWeeks = Math.round((mon.getTime() - d.getTime()) / (7 * 24 * 3600 * 1000));
  if (diffWeeks === 0) return 'Esta semana';
  if (diffWeeks === 1) return 'Semana pasada';
  return `Semana del ${d.getDate()} de ${d.toLocaleDateString('es-CL', { month: 'long' })}`;
}
