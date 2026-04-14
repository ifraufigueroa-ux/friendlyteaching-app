// FriendlyTeaching.cl — usePlacementSessions hook
'use client';
import { useEffect, useState } from 'react';
import {
  collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp,
  type QuerySnapshot, type DocumentData, type QueryDocumentSnapshot, type FirestoreError,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { PlacementSession } from '@/types/placement';

export function usePlacementSessions(teacherId: string) {
  const [sessions, setSessions]   = useState<PlacementSession[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    if (!teacherId) { setLoading(false); return; }

    const q = query(
      collection(db, 'placementSessions'),
      where('teacherId', '==', teacherId),
    );

    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const list = snap.docs
          .map((d: QueryDocumentSnapshot<DocumentData>) => ({
            id: d.id,
            ...d.data(),
          } as PlacementSession))
          .sort((a: PlacementSession, b: PlacementSession) => {
            // newest first — createdAt is a Firestore Timestamp
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getMs = (s: PlacementSession) => {
              const raw = s.createdAt as unknown as { toDate?: () => Date; seconds?: number };
              return typeof raw?.toDate === 'function'
                ? raw.toDate().getTime()
                : (raw?.seconds ?? 0) * 1000;
            };
            return getMs(b) - getMs(a);
          });
        setSessions(list);
        setLoading(false);
      },
      (err: FirestoreError) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [teacherId]);

  return { sessions, loading, error };
}

// ── Write helpers ─────────────────────────────────────────────

/** Link a placement session to an existing student profile. */
export async function linkSessionToStudent(
  sessionId: string,
  studentId: string,
): Promise<void> {
  await updateDoc(doc(db, 'placementSessions', sessionId), {
    linkedStudentId: studentId,
    updatedAt: serverTimestamp(),
  });
}
