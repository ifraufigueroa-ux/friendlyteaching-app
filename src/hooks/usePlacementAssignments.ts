// FriendlyTeaching.cl — usePlacementAssignments hook
'use client';
import { useEffect, useState } from 'react';
import {
  collection, doc, query, where, onSnapshot, setDoc, updateDoc, deleteDoc,
  serverTimestamp, Timestamp,
  type QuerySnapshot, type DocumentData, type QueryDocumentSnapshot, type FirestoreError,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface PlacementAssignment {
  id: string;
  teacherId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: 'pending' | 'completed';
  placementSessionId?: string;      // grammar-only sessions
  placementSuiteSessionId?: string; // suite sessions
  // Suite extras — when these are set the assignment runs the multi-component
  // suite. When absent, the assignment falls back to the classic grammar-only
  // /placement/[teacherId] flow (backward compatible with existing docs).
  components?: string[];
  mode?: 'student-self' | 'teacher-led';
  budgets?: { grammar: number; vocabulary: number; reading: number };
  grammarMode?: 'adaptive' | 'linear';
  /** @deprecated Old assignments still use this; new ones use `budgets`. */
  grammarLength?: 30 | 60 | 100;
  createdAt: Timestamp;
  completedAt?: Timestamp;
}

// ── Teacher: all assignments they created ─────────────────────

export function usePlacementAssignments(teacherId: string) {
  const [assignments, setAssignments] = useState<PlacementAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) { setLoading(false); return; }

    const q = query(
      collection(db, 'placementAssignments'),
      where('teacherId', '==', teacherId),
    );

    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const list = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({
          id: d.id, ...d.data(),
        } as PlacementAssignment));
        list.sort((a: PlacementAssignment, b: PlacementAssignment) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const getMs = (x: PlacementAssignment) => { const r = x.createdAt as any; return r?.seconds ? r.seconds * 1000 : 0; };
          return getMs(b) - getMs(a);
        });
        setAssignments(list);
        setLoading(false);
      },
      (err: FirestoreError) => { console.error('usePlacementAssignments:', err.message); setLoading(false); },
    );
    return () => unsub();
  }, [teacherId]);

  return { assignments, loading };
}

// ── Student: their own pending assignments ────────────────────

export function useStudentPlacementAssignments(studentId: string) {
  const [assignments, setAssignments] = useState<PlacementAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) { setLoading(false); return; }

    const q = query(
      collection(db, 'placementAssignments'),
      where('studentId', '==', studentId),
      where('status', '==', 'pending'),
    );

    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        setAssignments(snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({
          id: d.id, ...d.data(),
        } as PlacementAssignment)));
        setLoading(false);
      },
      (err: FirestoreError) => { console.error('useStudentPlacementAssignments:', err.message); setLoading(false); },
    );
    return () => unsub();
  }, [studentId]);

  return { assignments, loading };
}

// ── CRUD ──────────────────────────────────────────────────────

export async function createPlacementAssignment(data: {
  teacherId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  // Suite fields — all optional. When omitted, this creates a grammar-only
  // assignment (same behaviour as before).
  components?: string[];
  mode?: 'student-self' | 'teacher-led';
  budgets?: { grammar: number; vocabulary: number; reading: number };
  grammarMode?: 'adaptive' | 'linear';
}): Promise<string> {
  const ref = doc(collection(db, 'placementAssignments'));
  await setDoc(ref, {
    teacherId: data.teacherId,
    studentId: data.studentId,
    studentName: data.studentName,
    studentEmail: data.studentEmail,
    status: 'pending',
    ...(data.components ? { components: data.components } : {}),
    ...(data.mode ? { mode: data.mode } : {}),
    ...(data.budgets ? { budgets: data.budgets } : {}),
    ...(data.grammarMode ? { grammarMode: data.grammarMode } : {}),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function completePlacementAssignment(
  assignmentId: string,
  opts?: { placementSessionId?: string; placementSuiteSessionId?: string },
): Promise<void> {
  await updateDoc(doc(db, 'placementAssignments', assignmentId), {
    status: 'completed',
    ...(opts?.placementSessionId       ? { placementSessionId: opts.placementSessionId }             : {}),
    ...(opts?.placementSuiteSessionId  ? { placementSuiteSessionId: opts.placementSuiteSessionId }   : {}),
    completedAt: serverTimestamp(),
  });
}

export async function deletePlacementAssignment(assignmentId: string): Promise<void> {
  await deleteDoc(doc(db, 'placementAssignments', assignmentId));
}
