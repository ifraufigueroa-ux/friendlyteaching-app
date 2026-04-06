// FriendlyTeaching.cl — useGamification hook
// Real-time gamification data + XP award functions.

'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  doc, getDoc, setDoc, updateDoc, onSnapshot, Timestamp, increment,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { StudentGamification, BadgeId } from '@/types/firebase';
import { XP_REWARDS } from '@/types/firebase';
import {
  xpToLevel, calculateStreak, checkNewBadges,
  getTodayStr, getCurrentWeekKey, createDefaultGamification,
  BADGE_CATALOG,
} from '@/lib/utils/gamification';

// ── Hook ──────────────────────────────────────────────────────

export function useGamification(studentId: string | undefined) {
  const [gamification, setGamification] = useState<StudentGamification | null>(null);
  const [loading, setLoading] = useState(true);
  const [newBadges, setNewBadges] = useState<BadgeId[]>([]);

  // Real-time listener
  useEffect(() => {
    if (!studentId) { setLoading(false); return; }

    const ref = doc(db, 'gamification', studentId);
    const unsub = onSnapshot(ref, (snap: DocumentSnapshot) => {
      if (snap.exists()) {
        setGamification({ id: snap.id, ...snap.data() } as StudentGamification);
      } else {
        setGamification(null);
      }
      setLoading(false);
    });

    return unsub;
  }, [studentId]);

  // Initialize gamification profile if it doesn't exist
  const initialize = useCallback(async () => {
    if (!studentId) return;
    const ref = doc(db, 'gamification', studentId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const defaults = createDefaultGamification(studentId);
      await setDoc(ref, { ...defaults, createdAt: Timestamp.now() });
    }
  }, [studentId]);

  // Core: award XP + update streak + check badges
  const awardXp = useCallback(async (
    xpAmount: number,
    updates?: Partial<Pick<StudentGamification, 'lessonsCompleted' | 'homeworksSubmitted' | 'homeworksOnTime' | 'perfectScores'>>,
  ) => {
    if (!studentId) return;
    const ref = doc(db, 'gamification', studentId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      // Auto-initialize
      const defaults = createDefaultGamification(studentId);
      await setDoc(ref, { ...defaults, createdAt: Timestamp.now() });
    }

    const current = (snap.exists() ? snap.data() : createDefaultGamification(studentId)) as StudentGamification;

    // Streak calculation
    const { newStreak, isNewDay } = calculateStreak(current.lastActivityDate, current.currentStreak);

    // Build incremental updates
    const weekKey = getCurrentWeekKey();
    const newTotalXp = (current.totalXp ?? 0) + xpAmount;
    const newLevel = xpToLevel(newTotalXp);
    const oldLevel = current.level ?? 1;

    const updateData: Record<string, unknown> = {
      totalXp: increment(xpAmount),
      level: newLevel,
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, current.longestStreak ?? 0),
      lastActivityDate: getTodayStr(),
      [`weeklyXp.${weekKey}`]: increment(xpAmount),
      updatedAt: Timestamp.now(),
    };

    // Apply stat increments
    if (updates?.lessonsCompleted) updateData.lessonsCompleted = increment(updates.lessonsCompleted);
    if (updates?.homeworksSubmitted) updateData.homeworksSubmitted = increment(updates.homeworksSubmitted);
    if (updates?.homeworksOnTime) updateData.homeworksOnTime = increment(updates.homeworksOnTime);
    if (updates?.perfectScores) updateData.perfectScores = increment(updates.perfectScores);

    await updateDoc(ref, updateData);

    // Check for new badges after update
    const updatedSnap = await getDoc(ref);
    if (updatedSnap.exists()) {
      const updatedStats = updatedSnap.data() as StudentGamification;
      const earned = checkNewBadges(updatedStats);

      // Check level_up badge
      if (newLevel > oldLevel && !(updatedStats.badges ?? []).includes('level_up')) {
        earned.push('level_up');
      }

      if (earned.length > 0) {
        // Award badge XP bonuses
        let badgeXp = 0;
        for (const badgeId of earned) {
          badgeXp += BADGE_CATALOG[badgeId].xpReward;
        }

        await updateDoc(ref, {
          badges: [...(updatedStats.badges ?? []), ...earned],
          totalXp: increment(badgeXp),
          level: xpToLevel((updatedStats.totalXp ?? 0) + badgeXp),
          updatedAt: Timestamp.now(),
        });

        setNewBadges(earned);
        // Auto-clear after 5s
        setTimeout(() => setNewBadges([]), 5000);
      }
    }
  }, [studentId]);

  // Convenience: record lesson completion
  const recordLessonComplete = useCallback(async () => {
    await awardXp(XP_REWARDS.LESSON_COMPLETE, { lessonsCompleted: 1 });
  }, [awardXp]);

  // Convenience: record homework submission
  const recordHomeworkSubmit = useCallback(async (onTime: boolean, isPerfect: boolean) => {
    let xp = XP_REWARDS.HOMEWORK_SUBMIT;
    const updates: Partial<Pick<StudentGamification, 'homeworksSubmitted' | 'homeworksOnTime' | 'perfectScores'>> = {
      homeworksSubmitted: 1,
    };

    if (onTime) {
      xp += XP_REWARDS.HOMEWORK_ON_TIME;
      updates.homeworksOnTime = 1;
    }
    if (isPerfect) {
      xp += XP_REWARDS.PERFECT_SCORE;
      updates.perfectScores = 1;
    }

    await awardXp(xp, updates);
  }, [awardXp]);

  // Convenience: daily login XP
  const recordDailyLogin = useCallback(async () => {
    if (!studentId) return;
    const ref = doc(db, 'gamification', studentId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await initialize();
      return;
    }
    const data = snap.data() as StudentGamification;
    if (data.lastActivityDate === getTodayStr()) return; // Already logged today
    await awardXp(XP_REWARDS.DAILY_LOGIN);
  }, [studentId, awardXp, initialize]);

  // Dismiss new badges notification
  const dismissBadges = useCallback(() => setNewBadges([]), []);

  return {
    gamification,
    loading,
    newBadges,
    initialize,
    awardXp,
    recordLessonComplete,
    recordHomeworkSubmit,
    recordDailyLogin,
    dismissBadges,
  };
}
