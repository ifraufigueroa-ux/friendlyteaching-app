// FriendlyTeaching.cl — Streak & Weekly Activity Display
'use client';

interface Props {
  currentStreak: number;
  longestStreak: number;
  weeklyXp?: Record<string, number>;
  compact?: boolean;
}

export default function StreakDisplay({ currentStreak, longestStreak, weeklyXp, compact }: Props) {
  // Generate last 7 weeks for mini chart
  const weeks = getLastNWeeks(7);
  const maxXp = Math.max(...weeks.map((w) => weeklyXp?.[w] ?? 0), 1);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-lg">🔥</span>
        <span className="text-sm font-bold text-[#5A3D7A]">{currentStreak} días</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E0D5FF]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="text-sm font-bold text-[#5A3D7A]">Racha: {currentStreak} días</p>
            <p className="text-xs text-gray-400">Máxima: {longestStreak} días</p>
          </div>
        </div>
        {currentStreak >= 3 && (
          <span className="px-2 py-1 bg-orange-50 text-orange-500 rounded-lg text-xs font-bold">
            {currentStreak >= 30 ? '👑 Imparable' : currentStreak >= 7 ? '🏆 Semana' : '📅 Racha'}
          </span>
        )}
      </div>

      {/* Mini weekly bar chart */}
      <div className="flex items-end gap-1 h-12">
        {weeks.map((week) => {
          const xp = weeklyXp?.[week] ?? 0;
          const height = xp > 0 ? Math.max(8, (xp / maxXp) * 100) : 4;
          const isThisWeek = week === weeks[weeks.length - 1];
          return (
            <div key={week} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className={`w-full rounded-t-sm transition-all ${
                  isThisWeek ? 'bg-[#9B7CB8]' : xp > 0 ? 'bg-[#C8A8DC]' : 'bg-gray-200'
                }`}
                style={{ height: `${height}%` }}
                title={`${week}: ${xp} XP`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-gray-400">7 semanas atrás</span>
        <span className="text-[9px] text-gray-400">Esta semana</span>
      </div>
    </div>
  );
}

function getLastNWeeks(n: number): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const start = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
    result.push(`${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`);
  }
  return result;
}
