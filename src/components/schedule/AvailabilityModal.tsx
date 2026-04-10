// FriendlyTeaching.cl — AvailabilityModal
// Lets the teacher quickly set which hours are blocked across all days
'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useScheduleStore } from '@/store/scheduleStore';
import { useSchedule, setBulkAvailability } from '@/hooks/useSchedule';

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAYS = [1, 2, 3, 4, 5, 6];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 10); // 10–21

interface Props {
  onClose: () => void;
}

export default function AvailabilityModal({ onClose }: Props) {
  const { profile } = useAuthStore();
  const { scheduleMap, loading } = useSchedule(profile?.uid ?? '');
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync initial state from Firestore
  useEffect(() => {
    if (!loading) {
      setBlocked(new Set(Object.keys(scheduleMap)));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  function toggle(day: number, hour: number) {
    const key = `${day}-${hour}`;
    setBlocked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function blockColumn(day: number) {
    setBlocked((prev) => {
      const next = new Set(prev);
      const allBlocked = HOURS.every((h) => next.has(`${day}-${h}`));
      HOURS.forEach((h) => {
        if (allBlocked) next.delete(`${day}-${h}`);
        else next.add(`${day}-${h}`);
      });
      return next;
    });
  }

  function blockRow(hour: number) {
    setBlocked((prev) => {
      const next = new Set(prev);
      const allBlocked = DAYS.every((d) => next.has(`${d}-${hour}`));
      DAYS.forEach((d) => {
        if (allBlocked) next.delete(`${d}-${hour}`);
        else next.add(`${d}-${hour}`);
      });
      return next;
    });
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    try {
      await setBulkAvailability(profile.uid, [...blocked]);
      setSaved(true);
      await useScheduleStore.getState().waitForDataRefresh();
      setSaved(false);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const blockedCount = blocked.size;
  const availableCount = DAYS.length * HOURS.length - blockedCount;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-strong rounded-2xl shadow-glass-xl w-full max-w-2xl p-5 animate-[slideInUp_0.2s_ease] max-h-[90vh] overflow-y-auto border border-white/40">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#5A3D7A]">Configurar Disponibilidad Semanal</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Haz clic en las celdas para bloquear/desbloquear · {availableCount} horas disponibles · {blockedCount} bloqueadas
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">×</button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-[#A8E6A1]" />
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-[#D9D9D9]" />
            <span>Bloqueado (no disponible)</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-separate border-spacing-1">
              <thead>
                <tr>
                  <th className="w-12 text-gray-400 font-normal text-left pb-1">Hora</th>
                  {DAY_NAMES.map((name, i) => (
                    <th key={name} className="text-center pb-1">
                      <button
                        onClick={() => blockColumn(DAYS[i])}
                        className="px-2 py-1 rounded-lg font-bold text-[#5A3D7A] hover:bg-[#F0E5FF] transition-colors w-full"
                        title="Clic para alternar toda la columna"
                      >
                        {name}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.map((hour) => (
                  <tr key={hour}>
                    <td className="text-gray-400 font-mono text-right pr-2">
                      <button
                        onClick={() => blockRow(hour)}
                        className="hover:text-[#5A3D7A] hover:font-bold transition-colors"
                        title="Clic para alternar toda la fila"
                      >
                        {hour}:00
                      </button>
                    </td>
                    {DAYS.map((day) => {
                      const key = `${day}-${hour}`;
                      const isBlocked = blocked.has(key);
                      return (
                        <td key={day} className="text-center">
                          <button
                            onClick={() => toggle(day, hour)}
                            className={`w-full h-8 rounded-lg transition-all hover:opacity-80 active:scale-95 ${
                              isBlocked
                                ? 'bg-[#D9D9D9] text-gray-500'
                                : 'bg-[#A8E6A1] text-[#2D6E2A]'
                            }`}
                            title={isBlocked ? 'Bloqueado — clic para disponibilizar' : 'Disponible — clic para bloquear'}
                          >
                            {isBlocked ? '🚫' : ''}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Quick presets */}
        <div className="mt-4 flex flex-wrap gap-2">
          <p className="text-xs text-gray-400 w-full">Presets rápidos:</p>
          <button
            onClick={() => setBlocked(new Set())}
            className="px-3 py-1.5 bg-[#A8E6A1] text-[#2D6E2A] rounded-xl text-xs font-semibold hover:bg-[#8DD67E]"
          >
            ✅ Todo disponible
          </button>
          <button
            onClick={() => {
              const all = new Set<string>();
              DAYS.forEach((d) => HOURS.forEach((h) => all.add(`${d}-${h}`)));
              setBlocked(all);
            }}
            className="px-3 py-1.5 bg-[#D9D9D9] text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-300"
          >
            🚫 Todo bloqueado
          </button>
          <button
            onClick={() => {
              // Block mornings (10-12) and late evenings (20-21)
              const s = new Set<string>();
              DAYS.forEach((d) => {
                [10, 11, 20, 21].forEach((h) => s.add(`${d}-${h}`));
              });
              setBlocked(s);
            }}
            className="px-3 py-1.5 bg-[#F0E5FF] text-[#5A3D7A] rounded-xl text-xs font-semibold hover:bg-[#E0CCFF]"
          >
            ⏰ Bloquear mañanas y noches
          </button>
          <button
            onClick={() => {
              // Block weekends (but we only have Mon-Sat, so block Sat=6)
              const s = new Set(blocked);
              HOURS.forEach((h) => s.add(`6-${h}`));
              setBlocked(s);
            }}
            className="px-3 py-1.5 bg-[#FFF5C8] text-[#7A5E00] rounded-xl text-xs font-semibold hover:bg-[#FFE8A8]"
          >
            📅 Bloquear sábado
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-70 ${
              saved ? 'bg-[#A8E6A1] text-[#2D6E2A]' : 'bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white'
            }`}
          >
            {saved ? '✅ Guardado' : saving ? 'Guardando...' : 'Guardar disponibilidad'}
          </button>
        </div>
      </div>
    </div>
  );
}
