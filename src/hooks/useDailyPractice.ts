// FriendlyTeaching.cl — useDailyPractice
//
// Real-time student practice progress + helpers to record a completed
// session. Writes to `practiceProgress/{studentId}` and appends to
// `practiceSessions/{studentId}/{autoId}`. Streak follows the policy
// shared from @/types/practice (3-day grace, then reset).

'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  doc, onSnapshot, setDoc, serverTimestamp, collection, addDoc,
  Timestamp, type DocumentSnapshot,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import {
  type PracticeProgress, type PracticeLevel, type PracticeSession,
  PRACTICE_XP, nextStreak, todayStr,
} from '@/types/practice';

// Default seed when the student doesn't have a progress doc yet.
function defaultProgress(studentId: string): PracticeProgress {
  return {
    studentId,
    currentLevel:         'A0',
    nextUnitId:           null,
    mastery:              {},
    currentStreak:        0,
    longestStreak:        0,
    lastPracticedAt:      null,
    totalXp:              0,
    startedFromPlacement: null,
  };
}

export function useDailyPractice() {
  const [uid, setUid] = useState<string>(() => auth.currentUser?.uid ?? '');
  const [progress, setProgress] = useState<PracticeProgress | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth-safe uid resolution (same pattern as cowork hooks: don't trust
  // the Zustand store, listen to Firebase directly).
  useEffect(() => onAuthStateChanged(auth, (u) => setUid(u?.uid ?? '')), []);

  useEffect(() => {
    if (!uid) { setLoading(false); setProgress(null); return; }
    const ref = doc(db, 'practiceProgress', uid);
    const unsub = onSnapshot(ref, (snap: DocumentSnapshot) => {
      if (snap.exists()) {
        setProgress(snap.data() as PracticeProgress);
      } else {
        setProgress(null);
      }
      setLoading(false);
    }, (err: Error) => {
      console.warn('[useDailyPractice] listener error:', err.message);
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  /** Create the initial progress doc (called on onboarding choice). */
  const initializeProgress = useCallback(async (opts: {
    startedFromPlacement: boolean;
    currentLevel?:        PracticeLevel;
    nextUnitId?:          string | null;
  }) => {
    if (!uid) return;
    const seed: PracticeProgress = {
      ...defaultProgress(uid),
      startedFromPlacement: opts.startedFromPlacement,
      currentLevel:         opts.currentLevel ?? 'A0',
      nextUnitId:           opts.nextUnitId ?? null,
    };
    await setDoc(doc(db, 'practiceProgress', uid), {
      ...seed,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }, [uid]);

  /** Set the next unit the daily workout picks from. */
  const setNextUnit = useCallback(async (unitId: string | null) => {
    if (!uid) return;
    await setDoc(
      doc(db, 'practiceProgress', uid),
      { nextUnitId: unitId, updatedAt: serverTimestamp() },
      { merge: true },
    );
  }, [uid]);

  /** Called by the lesson runner when a session finishes. */
  const recordSession = useCallback(async (opts: {
    unitId:       string;
    totalCount:   number;
    correctCount: number;
  }) => {
    if (!uid) return;

    const today    = todayStr();
    const prev     = progress ?? defaultProgress(uid);
    const streak   = nextStreak(prev.currentStreak, prev.lastPracticedAt);
    const accuracy = opts.totalCount > 0 ? opts.correctCount / opts.totalCount : 0;
    const xpEarned =
      opts.correctCount * PRACTICE_XP.perCorrect +
      PRACTICE_XP.lessonCompletion +
      (accuracy >= 0.9 ? PRACTICE_XP.perfectBonus : 0);

    // Mastery: +1 crown for 70%+, capped at 5. We leave the "repeat
    // the same unit N times" grinding to a later pass — the first
    // version just rewards attempts over time.
    const newMastery = { ...prev.mastery };
    if (accuracy >= 0.7) {
      newMastery[opts.unitId] = Math.min(5, (newMastery[opts.unitId] ?? 0) + 1);
    }

    const next: PracticeProgress = {
      ...prev,
      currentStreak:   streak.streak,
      longestStreak:   Math.max(prev.longestStreak, streak.streak),
      lastPracticedAt: today,
      totalXp:         prev.totalXp + xpEarned,
      mastery:         newMastery,
    };

    await setDoc(doc(db, 'practiceProgress', uid), {
      ...next,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    const session: Omit<PracticeSession, 'completedAt'> & { completedAt: ReturnType<typeof serverTimestamp> } = {
      studentId:    uid,
      unitId:       opts.unitId,
      date:         today,
      totalCount:   opts.totalCount,
      correctCount: opts.correctCount,
      xpEarned,
      completedAt:  serverTimestamp(),
    };
    await addDoc(
      collection(db, 'practiceSessions', uid, 'items'),
      session,
    );

    return { xpEarned, newStreak: streak.streak, isNewDay: streak.isNewDay };
  }, [uid, progress]);

  return {
    uid,
    progress,
    loading,
    initializeProgress,
    setNextUnit,
    recordSession,
  };
}

// ── Mastery helper for other callers ─────────────────────────

export function masteryBand(crowns: number): {
  label: string; color: string;
} {
  if (crowns >= 5) return { label: 'Mastered', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (crowns >= 3) return { label: 'Confident', color: 'text-blue-700 bg-blue-50 border-blue-200' };
  if (crowns >= 1) return { label: 'In progress', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  return { label: 'Not started', color: 'text-gray-500 bg-gray-50 border-gray-200' };
}

// Timestamp exported for convenience when writing from client code.
export { Timestamp as PracticeTimestamp };
