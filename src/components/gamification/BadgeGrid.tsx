// FriendlyTeaching.cl — Badge Grid (earned + locked badges)
'use client';
import type { BadgeId } from '@/types/firebase';
import { BADGE_CATALOG } from '@/lib/utils/gamification';

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
        {earnedList.map((badge) => (
          <span
            key={badge.id}
            title={`${badge.name}: ${badge.description}`}
            className="text-lg cursor-default hover:scale-125 transition-transform"
          >
            {badge.icon}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E0D5FF]">
      <h3 className="text-sm font-bold text-[#5A3D7A] mb-3">Insignias</h3>
      <div className="grid grid-cols-4 gap-3">
        {ALL_BADGES.map((badge) => {
          const isEarned = earned.has(badge.id);
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
              <span className="text-2xl mb-1">{badge.icon}</span>
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
