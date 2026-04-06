// FriendlyTeaching.cl — XP Progress Bar + Level Display
'use client';
import { xpForNextLevel, getLevelTitle } from '@/lib/utils/gamification';

interface Props {
  totalXp: number;
  level: number;
  compact?: boolean;
}

export default function XpBar({ totalXp, level, compact }: Props) {
  const { current, needed, progress } = xpForNextLevel(totalXp);
  const title = getLevelTitle(level);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#C8A8DC] to-[#9B7CB8] flex items-center justify-center text-[10px] font-bold text-white">
          {level}
        </div>
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#C8A8DC] to-[#9B7CB8] rounded-full transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <span className="text-[10px] font-bold text-[#5A3D7A]">{current}/{needed}</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E0D5FF]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C8A8DC] to-[#9B7CB8] flex items-center justify-center text-lg font-bold text-white shadow-md">
            {level}
          </div>
          <div>
            <p className="text-sm font-bold text-[#5A3D7A]">Nivel {level} — {title}</p>
            <p className="text-xs text-gray-500">{totalXp} XP total</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-[#9B7CB8]">{current}/{needed} XP</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#C8A8DC] via-[#9B7CB8] to-[#5A3D7A] rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <p className="text-[10px] text-gray-400 mt-1 text-right">
        {needed - current} XP para nivel {level + 1}
      </p>
    </div>
  );
}
