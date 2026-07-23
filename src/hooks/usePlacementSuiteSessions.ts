// FriendlyTeaching.cl — Placement Suite sessions hook
// Mirrors usePlacementSessions but reads from `placementSuiteSessions`.
'use client';
import { useEffect, useState } from 'react';
import {
  collection, doc, query, where, onSnapshot, updateDoc,
  type QuerySnapshot, type DocumentData, type QueryDocumentSnapshot, type FirestoreError,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { PlacementSuiteSession } from '@/types/placement-suite';

export function usePlacementSuiteSessions(teacherId: string) {
  const [sessions, setSessions] = useState<PlacementSuiteSession[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!teacherId) { setLoading(false); return; }

    const q = query(
      collection(db, 'placementSuiteSessions'),
      where('teacherId', '==', teacherId),
    );

    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const list = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({
          id: d.id, ...d.data(),
        } as PlacementSuiteSession));
        list.sort((a: PlacementSuiteSession, b: PlacementSuiteSession) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ms = (x: PlacementSuiteSession) => { const r = x.createdAt as any; return r?.seconds ? r.seconds * 1000 : 0; };
          return ms(b) - ms(a);
        });
        setSessions(list);
        setLoading(false);
      },
      (err: FirestoreError) => { console.error('usePlacementSuiteSessions:', err.message); setLoading(false); },
    );
    return () => unsub();
  }, [teacherId]);

  return { sessions, loading };
}

export async function linkSuiteSessionToStudent(sessionId: string, studentId: string) {
  await updateDoc(doc(db, 'placementSuiteSessions', sessionId), {
    linkedStudentId: studentId,
  });
}
