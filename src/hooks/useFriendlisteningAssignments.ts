// FriendlyTeaching.cl — Friendlistenings Assignments Firestore hooks.
//
// Friendlistenings lessons are static files (src/lib/data/friendlistenings),
// so each assignment lives in its own `friendlisteningAssignments` doc
// keyed by {studentId, lessonId, teacherId}. The student side reads by
// studentId; the teacher side reads by teacherId.

'use client';
import { useEffect, useState } from 'react';
import {
  collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp,
  type QuerySnapshot, type QueryDocumentSnapshot, type DocumentData,
  type FirestoreError,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { FriendlisteningAssignment, FriendlyAssignmentStatus } from '@/types/firebase';

function sortByAssignedDesc(
  rows: FriendlisteningAssignment[],
): FriendlisteningAssignment[] {
  return rows.slice().sort((a, b) => {
    const am = a.assignedAt?.toDate?.().getTime() ?? 0;
    const bm = b.assignedAt?.toDate?.().getTime() ?? 0;
    return bm - am;
  });
}

export function useStudentListeningAssignments(studentId: string) {
  const [assignments, setAssignments] = useState<FriendlisteningAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) { setLoading(false); return; }
    const q = query(
      collection(db, 'friendlisteningAssignments'),
      where('studentId', '==', studentId),
    );
    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const rows = snap.docs.map(
          (d: QueryDocumentSnapshot<DocumentData>) =>
            ({ id: d.id, ...d.data() } as FriendlisteningAssignment),
        );
        setAssignments(sortByAssignedDesc(rows));
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.warn('[useStudentListeningAssignments]', err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [studentId]);

  return { assignments, loading };
}

export function useTeacherListeningAssignments(teacherId: string) {
  const [assignments, setAssignments] = useState<FriendlisteningAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) { setLoading(false); return; }
    const q = query(
      collection(db, 'friendlisteningAssignments'),
      where('teacherId', '==', teacherId),
    );
    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const rows = snap.docs.map(
          (d: QueryDocumentSnapshot<DocumentData>) =>
            ({ id: d.id, ...d.data() } as FriendlisteningAssignment),
        );
        setAssignments(sortByAssignedDesc(rows));
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.warn('[useTeacherListeningAssignments]', err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [teacherId]);

  return { assignments, loading };
}

export async function assignListening(opts: {
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
  const ref = await addDoc(collection(db, 'friendlisteningAssignments'), payload);
  return ref.id;
}

export async function unassignListening(assignmentId: string): Promise<void> {
  await deleteDoc(doc(db, 'friendlisteningAssignments', assignmentId));
}

export async function setListeningAssignmentStatus(
  assignmentId: string,
  status: FriendlyAssignmentStatus,
): Promise<void> {
  const patch: Record<string, unknown> = { status };
  if (status === 'completed') patch.completedAt = serverTimestamp();
  await updateDoc(doc(db, 'friendlisteningAssignments', assignmentId), patch);
}
