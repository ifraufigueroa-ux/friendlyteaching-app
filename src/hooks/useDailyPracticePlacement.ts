// FriendlyTeaching.cl — Daily Practice placement hook
//
// Reads + mutates dailyPracticePlacement/{uid}. The doc is small so we
// rewrite the whole thing after every answer — no lost work if the
// student closes the tab mid-session. Also handles start / resume /
// pause / complete transitions, and seeds practiceProgress at the
// placed level when the session finishes.

'use client';
import { useCallback, useEffect, useState } from 'react';
import {
  doc, getDoc, onSnapshot, serverTimestamp, setDoc,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { DPPAnswer, DPPSession, DPPStatus } from '@/types/daily-practice-placement';
import type { PracticeLevel } from '@/types/practice';
import {
  accuracyByLevel, determineFinalLevel, estimateLevel,
} from '@/lib/placement/adaptiveRunner';
import { DPP_QUESTIONS } from '@/lib/data/practice/placement-questions';
import { firstUnitIdForLevel } from '@/lib/placementToPractice';

function emptySession(uid: string): DPPSession {
  return {
    uid,
    status:                'in_progress',
    startedAt:             null,
    updatedAt:             null,
    answers:               [],
    currentLevelEstimate:  'A0',
  };
}

// ── Hook ─────────────────────────────────────────────────────

export function useDailyPracticePlacement(uid: string) {
  const [session, setSession] = useState<DPPSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setSession(null); setLoading(false); return; }
    const ref = doc(db, 'dailyPracticePlacement', uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setSession(snap.data() as DPPSession);
        } else {
          setSession(null);
        }
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [uid]);

  /** Create a fresh session (overwrites any previous completed / paused
   *  doc). Server-timestamped so the resume sort and the result timeline
   *  can trust it. */
  const startNew = useCallback(async () => {
    if (!uid) return;
    const fresh: DocumentData = {
      ...emptySession(uid),
      startedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'dailyPracticePlacement', uid), fresh);
  }, [uid]);

  /** Append one answer and persist. Recomputes the current level
   *  estimate on the fly so the UI (and any other watcher) can see it
   *  move in real time. */
  const submitAnswer = useCallback(async (answer: DPPAnswer) => {
    if (!uid || !session) return;
    const nextAnswers = [...session.answers, answer];
    const nextEstimate = estimateLevel(nextAnswers);
    await setDoc(doc(db, 'dailyPracticePlacement', uid), {
      ...session,
      answers:              nextAnswers,
      currentLevelEstimate: nextEstimate,
      updatedAt:            serverTimestamp(),
      status:               'in_progress',
    });
  }, [uid, session]);

  /** Pause: the student closes the session explicitly. Resuming later
   *  re-opens it as 'in_progress'. */
  const pause = useCallback(async () => {
    if (!uid || !session || session.status === 'completed') return;
    await setDoc(doc(db, 'dailyPracticePlacement', uid), {
      ...session,
      status:    'paused',
      pausedAt:  serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }, [uid, session]);

  const resume = useCallback(async () => {
    if (!uid || !session || session.status !== 'paused') return;
    await setDoc(doc(db, 'dailyPracticePlacement', uid), {
      ...session,
      status:    'in_progress',
      updatedAt: serverTimestamp(),
    });
  }, [uid, session]);

  /** Complete the session and seed practiceProgress at the placed
   *  level. The practice progress write is additive — if the student
   *  already had a doc (e.g. from an older placement) we merge in the
   *  new currentLevel + nextUnitId. */
  const complete = useCallback(async () => {
    if (!uid || !session) return;
    const placed = determineFinalLevel(session.answers);
    const nextUnitId = firstUnitIdForLevel(placed);
    const acc = accuracyByLevel(session.answers);
    await setDoc(doc(db, 'dailyPracticePlacement', uid), {
      ...session,
      status:            'completed',
      placedLevel:       placed,
      perLevelAccuracy:  acc,
      completedAt:       serverTimestamp(),
      updatedAt:         serverTimestamp(),
    });
    // Seed / update practiceProgress so the main Daily Practice view
    // drops the student right at the placed level. If the doc didn't
    // exist, we MUST include every field the landing reads — otherwise
    // the merge leaves numeric fields (totalXp, currentStreak,
    // longestStreak) as undefined and the landing crashes on
    // `totalXp.toLocaleString()`. Incident 2026-11-24: Matías and
    // Daniela Correa completed placement and the landing would not
    // mount.
    const ppRef = doc(db, 'practiceProgress', uid);
    const existing = await getDoc(ppRef);
    const placementFields: DocumentData = {
      studentId:            uid,
      startedFromPlacement: true,
      currentLevel:         placed,
      placedLevel:          placed,       // unlocks every unit up to this level
      nextUnitId,
      updatedAt:            serverTimestamp(),
    };
    const payload: DocumentData = existing.exists()
      ? placementFields
      : {
          ...placementFields,
          mastery:         {},
          currentStreak:   0,
          longestStreak:   0,
          lastPracticedAt: null,
          totalXp:         0,
          createdAt:       serverTimestamp(),
        };
    await setDoc(ppRef, payload, { merge: true });
    return { placed, nextUnitId };
  }, [uid, session]);

  return {
    session,
    loading,
    isInProgress: session?.status === 'in_progress',
    isPaused:     session?.status === 'paused',
    isCompleted:  session?.status === 'completed',
    startNew,
    submitAnswer,
    pause,
    resume,
    complete,
    pool:         DPP_QUESTIONS,
  };
}

// Convenience helper for the status chip on the landing.
export function formatStatus(s?: DPPSession | null, estimate?: PracticeLevel): string {
  if (!s) return 'Not started';
  if (s.status === 'completed') return `Placed · ${s.placedLevel ?? estimate ?? '—'}`;
  if (s.status === 'paused')    return `Paused · ${s.answers.length} answered`;
  return `In progress · ${s.answers.length} answered`;
}

export type DPPFinalStatus = DPPStatus;
