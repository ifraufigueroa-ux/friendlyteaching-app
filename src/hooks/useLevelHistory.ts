// FriendlyTeaching.cl — Level History Hook
import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  FirestoreError,
  QuerySnapshot,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { LevelHistoryEntry, LessonLevel } from '@/types/firebase';

export function useLevelHistory(studentId: string, teacherId: string) {
  const [history, setHistory] = useState<LevelHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId || !teacherId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'levelHistory'),
      where('studentId', '==', studentId),
      where('teacherId', '==', teacherId),
      orderBy('changedAt', 'asc'),
    );

    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        setHistory(
          snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({
            id: d.id,
            ...d.data(),
          } as LevelHistoryEntry)),
        );
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.error('useLevelHistory error:', err.message);
        setLoading(false);
      },
    );

    return unsub;
  }, [studentId, teacherId]);

  async function recordLevelChange(
    fromLevel: LessonLevel | null,
    toLevel: LessonLevel,
    notes?: string,
  ): Promise<void> {
    await addDoc(collection(db, 'levelHistory'), {
      studentId,
      teacherId,
      fromLevel: fromLevel ?? null,
      toLevel,
      notes: notes ?? '',
      changedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
  }

  return { history, loading, recordLevelChange };
}
