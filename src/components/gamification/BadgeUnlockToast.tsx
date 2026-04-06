// FriendlyTeaching.cl — Badge Unlock Toast (animated notification)
'use client';
import { useEffect, useState } from 'react';
import type { BadgeId } from '@/types/firebase';
import { BADGE_CATALOG } from '@/lib/utils/gamification';

interface Props {
  badgeIds: BadgeId[];
  onDismiss: () => void;
}

export default function BadgeUnlockToast({ badgeIds, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (badgeIds.length === 0) return;
    // Animate in
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 4500);
    return () => clearTimeout(timer);
  }, [badgeIds, onDismiss]);

  if (badgeIds.length === 0) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-[#C8A8DC] p-4 max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl animate-bounce">🎉</span>
          <p className="text-sm font-bold text-[#5A3D7A]">
            {badgeIds.length === 1 ? '¡Nueva insignia!' : `¡${badgeIds.length} nuevas insignias!`}
          </p>
        </div>
        <div className="space-y-2">
          {badgeIds.map((id) => {
            const badge = BADGE_CATALOG[id];
            return (
              <div key={id} className="flex items-center gap-2 bg-[#F0E5FF] rounded-xl px-3 py-2">
                <span className="text-2xl">{badge.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#5A3D7A]">{badge.name}</p>
                  <p className="text-[10px] text-gray-500 truncate">{badge.description}</p>
                </div>
                <span className="text-[10px] font-bold text-[#9B7CB8] whitespace-nowrap">+{badge.xpReward} XP</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
