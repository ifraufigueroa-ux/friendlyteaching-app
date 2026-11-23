// FriendlyTeaching.cl — usePronunciationAttempts + logAttempt
//
// One doc per completed pronunciation exercise is written under
// `pronunciationAttempts/{studentId}/items/{autoId}` when the student
// either hits the pass threshold or gives up via "Move on". The
// teacher-side tab (StudentDetailModal "Práctica") reads it back.
//
// Keep the shape small — the runner writes once per exercise, not per
// retry, so a 50-exercise unit produces at most 50 docs.

'use client';
import { useEffect, useState } from 'react';
import {
  addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp,
  type FirestoreError, type QueryDocumentSnapshot, type QuerySnapshot, type DocumentData,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { PracticeLevel } from '@/types/practice';

export interface PronunciationAttemptDoc {
  id:            string;
  studentId:     string;
  unitId:        string;
  unitLevel:     PracticeLevel | string;
  exerciseId:    string;
  targetPhrase:  string;
  lastTranscript: string;
  bestAccuracy:  number;   // 0-100
  lastAccuracy:  number;   // 0-100
  attempts:      number;
  passed:        boolean;
  /** Words from the target phrase the student never nailed across their
   *  attempts. Short list — useful for the teacher's at-a-glance read. */
  missedWords:   string[];
  at:            Timestamp | null;
}

/** Write a single attempt row. Fire-and-forget — the UI doesn't wait. */
export async function logPronunciationAttempt(input: {
  studentId:    string;
  unitId:       string;
  unitLevel:    PracticeLevel | string;
  exerciseId:   string;
  targetPhrase: string;
  lastTranscript: string;
  bestAccuracy: number;
  lastAccuracy: number;
  attempts:     number;
  passed:       boolean;
  missedWords:  string[];
}): Promise<void> {
  try {
    await addDoc(collection(db, 'pronunciationAttempts', input.studentId, 'items'), {
      ...input,
      at: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[logPronunciationAttempt] failed:', err);
  }
}

/** Live feed of a student's most recent pronunciation attempts. */
export function usePronunciationAttempts(
  studentId: string | null,
  max = 50,
): { items: PronunciationAttemptDoc[]; loading: boolean } {
  const [items, setItems] = useState<PronunciationAttemptDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(!!studentId);

  useEffect(() => {
    if (!studentId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, 'pronunciationAttempts', studentId, 'items'),
      orderBy('at', 'desc'),
      limit(max),
    );
    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const next: PronunciationAttemptDoc[] = snap.docs.map(
          (d: QueryDocumentSnapshot<DocumentData>) => ({
            id: d.id,
            ...(d.data() as Omit<PronunciationAttemptDoc, 'id'>),
          }),
        );
        setItems(next);
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.warn('[usePronunciationAttempts]', err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [studentId, max]);

  return { items, loading };
}
