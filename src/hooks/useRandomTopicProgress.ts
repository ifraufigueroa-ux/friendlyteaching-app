// FriendlyTeaching.cl — useRandomTopicProgress hook
// Tracks which Random Topic Simulator cue cards each student has
// already practiced so the teacher can resume where they left off and
// avoid repeating prompts across sessions.
'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  doc, onSnapshot, setDoc, updateDoc, serverTimestamp,
  arrayUnion, type FieldValue, type DocumentSnapshot, type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface RandomTopicProgress {
  practicedIds: string[];
  updatedAt?: unknown;        // Timestamp | FieldValue — not read on client
  sessionStartedAt?: unknown; // Timestamp | FieldValue — not read on client
}

const COLLECTION = 'randomTopicProgress';

export function useRandomTopicProgress(studentId: string | null) {
  const [practicedIds, setPracticedIds] = useState<Set<string>>(new Set());
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      setPracticedIds(new Set());
      setExists(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const ref = doc(db, COLLECTION, studentId);
    const unsub = onSnapshot(
      ref,
      (snap: DocumentSnapshot<DocumentData>) => {
        if (snap.exists()) {
          const data = snap.data() as RandomTopicProgress;
          setPracticedIds(new Set(data.practicedIds ?? []));
          setExists(true);
        } else {
          setPracticedIds(new Set());
          setExists(false);
        }
        setLoading(false);
      },
      (err: Error) => {
        console.warn('[useRandomTopicProgress] listener error:', err.message);
        setLoading(false);
      },
    );

    return unsub;
  }, [studentId]);

  const markPracticed = useCallback(
    async (topicId: string) => {
      if (!studentId) return;
      const ref = doc(db, COLLECTION, studentId);
      try {
        if (exists) {
          await updateDoc(ref, {
            practicedIds: arrayUnion(topicId),
            updatedAt: serverTimestamp() as FieldValue,
          });
        } else {
          await setDoc(ref, {
            practicedIds: [topicId],
            sessionStartedAt: serverTimestamp() as FieldValue,
            updatedAt: serverTimestamp() as FieldValue,
          });
        }
      } catch (err) {
        console.warn('[useRandomTopicProgress] markPracticed failed:', err);
      }
    },
    [studentId, exists],
  );

  const resetProgress = useCallback(async () => {
    if (!studentId) return;
    const ref = doc(db, COLLECTION, studentId);
    try {
      await setDoc(ref, {
        practicedIds: [],
        sessionStartedAt: serverTimestamp() as FieldValue,
        updatedAt: serverTimestamp() as FieldValue,
      });
    } catch (err) {
      console.warn('[useRandomTopicProgress] resetProgress failed:', err);
    }
  }, [studentId]);

  return { practicedIds, exists, loading, markPracticed, resetProgress };
}
