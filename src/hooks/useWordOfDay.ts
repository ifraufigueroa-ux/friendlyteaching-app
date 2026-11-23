// FriendlyTeaching.cl — Word of the Day hook
// Tracks student submissions, streaks, and integrates with gamification.
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  collection, query, where, orderBy, limit, onSnapshot, doc, setDoc, updateDoc,
  Timestamp, getDocs, serverTimestamp,
  QuerySnapshot, DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getWordOfTheDay, type WordEntry } from '@/data/wordOfTheDay';
import { useAuthStore } from '@/store/authStore';
import { getTodayStr as getLocalTodayStr, getYesterdayStr as getLocalYesterdayStr } from '@/lib/utils/gamification';

// ── Types ────────────────────────────────────────────────────────

export interface WordSubmission {
  id: string;
  studentId: string;
  date: string;            // 'YYYY-MM-DD'
  word: string;
  example: string;
  createdAt: Timestamp;
  // Teacher feedback, written after the student submits. All three
  // fields land together when the teacher saves; feedbackReadAt is
  // written by the student when they open the submission to clear
  // the unread-badge.
  feedback?:             string;
  feedbackAt?:           Timestamp;
  feedbackByTeacherId?:  string;
  feedbackReadAt?:       Timestamp;
}

// ── Teacher-side mutations ─────────────────────────────────

/** Write (or overwrite) teacher feedback on a submission. */
export async function saveWordSubmissionFeedback(
  submissionId: string,
  feedback: string,
  teacherId: string,
): Promise<void> {
  const trimmed = feedback.trim();
  if (!submissionId || !teacherId || !trimmed) return;
  await updateDoc(doc(db, 'wordOfDaySubmissions', submissionId), {
    feedback:             trimmed,
    feedbackAt:           serverTimestamp(),
    feedbackByTeacherId:  teacherId,
  });
}

/** Student clears the unread-badge by stamping feedbackReadAt. */
export async function markWordFeedbackRead(submissionId: string): Promise<void> {
  if (!submissionId) return;
  await updateDoc(doc(db, 'wordOfDaySubmissions', submissionId), {
    feedbackReadAt: serverTimestamp(),
  });
}

/** How many of the student's recent submissions have feedback that
 *  hasn't been read yet — drives the "(N)" badge on the Word of the
 *  Day card. */
export function countUnreadFeedback(subs: WordSubmission[]): number {
  return subs.filter(s => !!s.feedback && !s.feedbackReadAt).length;
}

// Local-date helpers — the UTC flavour kept students locked in the
// "done for today" state after 9 p.m. Chile time, because UTC rolled
// over to the next day while the student was still inside the same
// calendar day. Shared with gamification so the mission card label
// ("Resets in …") and the WOD listener agree on what "today" means.
const getTodayStr = getLocalTodayStr;
const getYesterdayStr = getLocalYesterdayStr;

// ── Hook ─────────────────────────────────────────────────────────

export function useWordOfDay(studentId: string | undefined) {
  // Pull the student's CEFR level from the auth store so the word is
  // drawn from their ZPD (own level + one notch above). If the store
  // is still hydrating (see [[authstore-hydration-bug]]), level stays
  // undefined and we fall back to the full catalogue — a short-term
  // wrong-level word is better than a crashed card. useMemo re-runs
  // the selection when the level finally loads.
  const level = useAuthStore((s) => s.profile?.studentData?.level);
  const wordOfDay = useMemo<WordEntry>(() => getWordOfTheDay(level), [level]);
  const [todaySubmission, setTodaySubmission] = useState<WordSubmission | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<WordSubmission[]>([]);
  const [wordStreak, setWordStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  // Listen for today's submission
  useEffect(() => {
    if (!studentId) { setLoading(false); return; }

    const today = getTodayStr();
    const q = query(
      collection(db, 'wordOfDaySubmissions'),
      where('studentId', '==', studentId),
      where('date', '==', today),
      limit(1),
    );

    const unsub = onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
      if (!snap.empty) {
        const d = snap.docs[0];
        setTodaySubmission({ id: d.id, ...d.data() } as WordSubmission);
      } else {
        setTodaySubmission(null);
      }
      setLoading(false);
    }, (err: Error) => {
      console.warn('[useWordOfDay] Today listener error:', err.message);
      setLoading(false);
    });

    return unsub;
  }, [studentId]);

  // Load recent submissions (last 30) and calculate streak
  useEffect(() => {
    if (!studentId) return;

    const q = query(
      collection(db, 'wordOfDaySubmissions'),
      where('studentId', '==', studentId),
      orderBy('date', 'desc'),
      limit(35),
    );

    const unsub = onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
      const subs = snap.docs.map((d: DocumentData) => ({ id: d.id, ...d.data() } as WordSubmission));
      setRecentSubmissions(subs);

      // Calculate word streak
      let streak = 0;
      let checkDate = getTodayStr();
      const dateSet = new Set(subs.map((s: WordSubmission) => s.date));

      // If today is submitted, count it
      if (dateSet.has(checkDate)) {
        streak = 1;
        // Check backwards from yesterday
        const d = new Date();
        d.setDate(d.getDate() - 1);
        checkDate = d.toISOString().slice(0, 10);
        while (dateSet.has(checkDate)) {
          streak++;
          d.setDate(d.getDate() - 1);
          checkDate = d.toISOString().slice(0, 10);
        }
      } else {
        // Check if yesterday was submitted (streak not yet broken today)
        const yesterday = getYesterdayStr();
        if (dateSet.has(yesterday)) {
          streak = 1;
          const d = new Date();
          d.setDate(d.getDate() - 2);
          checkDate = d.toISOString().slice(0, 10);
          while (dateSet.has(checkDate)) {
            streak++;
            d.setDate(d.getDate() - 1);
            checkDate = d.toISOString().slice(0, 10);
          }
        }
      }

      setWordStreak(streak);
    }, (err: Error) => {
      console.warn('[useWordOfDay] Streak listener error:', err.message);
    });

    return unsub;
  }, [studentId]);

  // Submit an example
  const submitExample = useCallback(async (example: string): Promise<boolean> => {
    if (!studentId || !example.trim()) return false;
    const today = getTodayStr();

    // Check if already submitted today
    const checkQ = query(
      collection(db, 'wordOfDaySubmissions'),
      where('studentId', '==', studentId),
      where('date', '==', today),
      limit(1),
    );
    const existing = await getDocs(checkQ);
    if (!existing.empty) return false; // Already submitted

    // Create submission
    const ref = doc(collection(db, 'wordOfDaySubmissions'));
    await setDoc(ref, {
      studentId,
      date: today,
      word: wordOfDay.word,
      example: example.trim(),
      createdAt: Timestamp.now(),
    });

    return true;
  }, [studentId, wordOfDay.word]);

  // Total submissions count
  const totalSubmissions = recentSubmissions.length;

  return {
    wordOfDay,
    todaySubmission,
    recentSubmissions,
    wordStreak,
    totalSubmissions,
    loading,
    submitExample,
    hasSubmittedToday: !!todaySubmission,
  };
}
