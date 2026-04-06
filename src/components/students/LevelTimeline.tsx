'use client';
// FriendlyTeaching.cl — Level Progress Timeline
// Shows A0→C1 CEFR scale with a student's current level and change history.

import type { LevelHistoryEntry, LessonLevel } from '@/types/firebase';

const LEVELS: LessonLevel[] = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];

const LEVEL_META: Record<LessonLevel, { label: string; color: string; bg: string; ring: string }> = {
  A0:  { label: 'Principiante absoluto', color: 'text-gray-600',   bg: 'bg-gray-100',    ring: 'ring-gray-300' },
  A1:  { label: 'Principiante',          color: 'text-blue-700',   bg: 'bg-blue-100',    ring: 'ring-blue-300' },
  A2:  { label: 'Básico',               color: 'text-sky-700',    bg: 'bg-sky-100',     ring: 'ring-sky-300' },
  B1:  { label: 'Intermedio',            color: 'text-green-700',  bg: 'bg-green-100',   ring: 'ring-green-300' },
  'B1+': { label: 'Intermedio alto',    color: 'text-emerald-700',bg: 'bg-emerald-100', ring: 'ring-emerald-300' },
  B2:  { label: 'Avanzado',             color: 'text-amber-700',  bg: 'bg-amber-100',   ring: 'ring-amber-300' },
  C1:  { label: 'Experto',              color: 'text-purple-700', bg: 'bg-purple-100',  ring: 'ring-purple-300' },
};

function durationLabel(fromDate: Date, toDate: Date): string {
  const days = Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 14) return `${days}d`;
  if (days < 60) return `${Math.round(days / 7)}sem`;
  return `${Math.round(days / 30)}m`;
}

interface Props {
  history: LevelHistoryEntry[];
  currentLevel: LessonLevel | null;
  loading?: boolean;
}

export function LevelTimeline({ history, currentLevel, loading }: Props) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-7 h-7 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // CEFR scale bar — show all levels, highlight reached ones
  const reachedLevels = new Set<LessonLevel>(history.map(h => h.toLevel));
  if (currentLevel) reachedLevels.add(currentLevel);

  const currentIdx = currentLevel ? LEVELS.indexOf(currentLevel) : -1;
  const progressPct = currentIdx >= 0 ? ((currentIdx) / (LEVELS.length - 1)) * 100 : 0;

  return (
    <div className="space-y-5">
      {/* CEFR progress bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider">Escala CEFR</p>
          {currentLevel && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${LEVEL_META[currentLevel].bg} ${LEVEL_META[currentLevel].color}`}>
              Nivel actual: {currentLevel}
            </span>
          )}
        </div>
        {/* Track */}
        <div className="relative">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-300 via-green-400 to-purple-500 rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {/* Level dots */}
          <div className="absolute top-0 left-0 right-0 flex justify-between -mt-1.5">
            {LEVELS.map((lvl, i) => {
              const pct = (i / (LEVELS.length - 1)) * 100;
              const isReached = reachedLevels.has(lvl);
              const isCurrent = currentLevel === lvl;
              return (
                <div
                  key={lvl}
                  className="flex flex-col items-center"
                  style={{ position: 'absolute', left: `${pct}%`, transform: 'translateX(-50%)' }}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-extrabold transition-all ${
                      isCurrent
                        ? `${LEVEL_META[lvl].bg} border-current ${LEVEL_META[lvl].color} ring-2 ${LEVEL_META[lvl].ring} scale-110`
                        : isReached
                        ? `${LEVEL_META[lvl].bg} ${LEVEL_META[lvl].color} border-transparent`
                        : 'bg-white border-gray-200 text-gray-300'
                    }`}
                  >
                    {lvl.replace('+', '')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Level labels below */}
        <div className="flex justify-between mt-6">
          {LEVELS.map(lvl => (
            <span
              key={lvl}
              className={`text-[9px] font-bold ${
                currentLevel === lvl
                  ? LEVEL_META[lvl].color
                  : reachedLevels.has(lvl)
                  ? 'text-gray-400'
                  : 'text-gray-200'
              }`}
            >
              {lvl}
            </span>
          ))}
        </div>
      </div>

      {/* Timeline of changes */}
      {history.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-2xl mb-2">📈</p>
          <p className="text-sm text-gray-500">Sin cambios de nivel registrados.</p>
          <p className="text-xs text-gray-400 mt-1">
            El historial aparece aquí cuando cambies el nivel del estudiante.
          </p>
        </div>
      ) : (
        <div>
          <p className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider mb-3">
            Historial de progresión
          </p>
          <div className="relative">
            {/* vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100" />
            <div className="space-y-3">
              {history.map((entry, i) => {
                const date = entry.changedAt?.toDate?.()
                  ? entry.changedAt.toDate()
                  : new Date((entry.changedAt as unknown as { seconds: number }).seconds * 1000);
                const nextDate = i < history.length - 1
                  ? (history[i + 1].changedAt?.toDate?.()
                    ? history[i + 1].changedAt.toDate()
                    : new Date((history[i + 1].changedAt as unknown as { seconds: number }).seconds * 1000))
                  : null;
                const isPromotion = entry.fromLevel === null ||
                  LEVELS.indexOf(entry.toLevel) > LEVELS.indexOf(entry.fromLevel ?? 'A0');
                return (
                  <div key={entry.id} className="flex gap-4 pl-2">
                    {/* dot */}
                    <div className={`w-4 h-4 rounded-full flex-shrink-0 mt-1 z-10 ${LEVEL_META[entry.toLevel].bg}`} />
                    <div className="flex-1 pb-1">
                      <div className="flex items-center gap-2">
                        {entry.fromLevel && (
                          <>
                            <span className={`text-xs font-bold ${LEVEL_META[entry.fromLevel].color}`}>
                              {entry.fromLevel}
                            </span>
                            <span className="text-gray-300 text-xs">
                              {isPromotion ? '→' : '↘'}
                            </span>
                          </>
                        )}
                        <span className={`text-xs font-bold ${LEVEL_META[entry.toLevel].color}`}>
                          {entry.toLevel}
                        </span>
                        {entry.fromLevel === null && (
                          <span className="text-[10px] text-gray-400 italic">inicial</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {nextDate && (
                          <span className="ml-1 text-gray-300">
                            · {durationLabel(date, nextDate)} en este nivel
                          </span>
                        )}
                      </p>
                      {entry.notes && (
                        <p className="text-[10px] text-gray-400 italic mt-0.5">&ldquo;{entry.notes}&rdquo;</p>
                      )}
                    </div>
                  </div>
                );
              })}
              {/* Current level indicator */}
              {currentLevel && history.length > 0 && (
                <div className="flex gap-4 pl-2">
                  <div className={`w-4 h-4 rounded-full flex-shrink-0 mt-1 z-10 ring-2 ${LEVEL_META[currentLevel].ring} ${LEVEL_META[currentLevel].bg}`} />
                  <div className="flex-1">
                    <span className={`text-xs font-bold ${LEVEL_META[currentLevel].color}`}>
                      {currentLevel} — actual
                    </span>
                    {history[history.length - 1]?.changedAt?.toDate?.() && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        desde {history[history.length - 1].changedAt.toDate().toLocaleDateString('es-CL', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                        {' '}· {durationLabel(history[history.length - 1].changedAt.toDate(), new Date())} en este nivel
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
