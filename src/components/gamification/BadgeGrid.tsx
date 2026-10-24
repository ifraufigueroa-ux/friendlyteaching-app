// FriendlyTeaching.cl — Badge Grid (earned + locked badges)
'use client';
import type { BadgeId } from '@/types/firebase';
import { BADGE_CATALOG, BADGE_ICONS } from '@/lib/utils/gamification';

interface Props {
  earnedBadges: BadgeId[];
  compact?: boolean;
}

const ALL_BADGES = Object.values(BADGE_CATALOG);

export default function BadgeGrid({ earnedBadges, compact }: Props) {
  const earned = new Set(earnedBadges);

  if (compact) {
    // Show only earned badges in a row
    const earnedList = ALL_BADGES.filter((b) => earned.has(b.id));
    if (earnedList.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1.5">
        {earnedList.map((badge) => {
          const Icon = BADGE_ICONS[badge.id];
          return (
            <span
              key={badge.id}
              title={`${badge.name}: ${badge.description}`}
              className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F0E5FF] text-[#5A3D7A] cursor-default hover:scale-125 transition-transform"
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={2.25} />
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E0D5FF]">
      <h3 className="text-sm font-bold text-[#5A3D7A] mb-3">Insignias</h3>
      <div className="grid grid-cols-4 gap-3">
        {ALL_BADGES.map((badge) => {
          const isEarned = earned.has(badge.id);
          const Icon = BADGE_ICONS[badge.id];
          return (
            <div
              key={badge.id}
              className={`flex flex-col items-center text-center p-2 rounded-xl transition-all ${
                isEarned
                  ? 'bg-[#F0E5FF] hover:bg-[#E0D5FF] cursor-default'
                  : 'bg-gray-50 opacity-40 grayscale'
              }`}
              title={badge.description}
            >
              <span className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${isEarned ? 'bg-[#5A3D7A] text-white' : 'bg-gray-200 text-gray-500'}`}>
                <Icon className="w-4 h-4" strokeWidth={2.25} />
              </span>
              <p className="text-[10px] font-semibold text-gray-700 leading-tight">{badge.name}</p>
              {isEarned && (
                <p className="text-[9px] text-[#9B7CB8] font-bold mt-0.5">+{badge.xpReward} XP</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
