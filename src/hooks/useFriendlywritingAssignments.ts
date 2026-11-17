// FriendlyTeaching.cl — FriendlyWriting Assignments Firestore hooks.
//
// Mirror of useFriendlisteningAssignments but for the FriendlyWriting
// catalog (src/lib/data/friendlywriting). Each assignment is one doc in
// `friendlywritingAssignments`.

'use client';
import { useEffect, useState } from 'react';
import {
  collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp,
  type QuerySnapshot, type QueryDocumentSnapshot, type DocumentData,
  type FirestoreError,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { FriendlywritingAssignment, FriendlyAssignmentStatus } from '@/types/firebase';

function sortByAssignedDesc(
  rows: FriendlywritingAssignment[],
): FriendlywritingAssignment[] {
  return rows.slice().sort((a, b) => {
    const am = a.assignedAt?.toDate?.().getTime() ?? 0;
    const bm = b.assignedAt?.toDate?.().getTime() ?? 0;
    return bm - am;
  });
}

export function useStudentWritingAssignments(studentId: string) {
  const [assignments, setAssignments] = useState<FriendlywritingAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) { setLoading(false); return; }
    const q = query(
      collection(db, 'friendlywritingAssignments'),
      where('studentId', '==', studentId),
    );
    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const rows = snap.docs.map(
          (d: QueryDocumentSnapshot<DocumentData>) =>
            ({ id: d.id, ...d.data() } as FriendlywritingAssignment),
        );
        setAssignments(sortByAssignedDesc(rows));
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.warn('[useStudentWritingAssignments]', err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [studentId]);

  return { assignments, loading };
}

export function useTeacherWritingAssignments(teacherId: string) {
  const [assignments, setAssignments] = useState<FriendlywritingAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) { setLoading(false); return; }
    const q = query(
      collection(db, 'friendlywritingAssignments'),
      where('teacherId', '==', teacherId),
    );
    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const rows = snap.docs.map(
          (d: QueryDocumentSnapshot<DocumentData>) =>
            ({ id: d.id, ...d.data() } as FriendlywritingAssignment),
        );
        setAssignments(sortByAssignedDesc(rows));
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.warn('[useTeacherWritingAssignments]', err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [teacherId]);

  return { assignments, loading };
}

export async function assignWriting(opts: {
  teacherId: string;
  studentId: string;
  lessonId: string;
  lessonTitle: string;
  lessonLevel?: string;
  bookingId?: string;
}): Promise<string> {
  const payload: Record<string, unknown> = {
    teacherId: opts.teacherId,
    studentId: opts.studentId,
    lessonId: opts.lessonId,
    lessonTitle: opts.lessonTitle,
    status: 'assigned' as FriendlyAssignmentStatus,
    assignedAt: serverTimestamp(),
  };
  if (opts.lessonLevel) payload.lessonLevel = opts.lessonLevel;
  if (opts.bookingId) payload.bookingId = opts.bookingId;
  const ref = await addDoc(collection(db, 'friendlywritingAssignments'), payload);
  return ref.id;
}

export async function unassignWriting(assignmentId: string): Promise<void> {
  await deleteDoc(doc(db, 'friendlywritingAssignments', assignmentId));
}

export async function setWritingAssignmentStatus(
  assignmentId: string,
  status: FriendlyAssignmentStatus,
): Promise<void> {
  const patch: Record<string, unknown> = { status };
  if (status === 'completed') patch.completedAt = serverTimestamp();
  await updateDoc(doc(db, 'friendlywritingAssignments', assignmentId), patch);
}
