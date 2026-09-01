// FriendlyTeaching.cl — useToeflWritingAssignments hook
//
// Mirror of useToeflSpeakingAssignments for the async Writing flow. Same
// public/registered semantics: teacher creates an assignment (linked to a
// specific student's uid OR as a public link with no studentId), student
// completes it from their link, grading runs fire-and-forget, teacher
// reviews the text + AI feedback in a panel.

'use client';
import { useEffect, useState } from 'react';
import {
  collection, doc, query, where, onSnapshot, setDoc, updateDoc, deleteDoc,
  serverTimestamp,
  type QuerySnapshot, type DocumentData, type QueryDocumentSnapshot, type FirestoreError,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { TOEFLWritingAssignment, WritingSubmission } from '@/types/toefl';

// ── Teacher: all writing assignments they created ─────────────

export function useToeflWritingAssignments(teacherId: string) {
  const [assignments, setAssignments] = useState<TOEFLWritingAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) { setLoading(false); return; }

    const q = query(
      collection(db, 'toeflWritingAssignments'),
      where('teacherId', '==', teacherId),
    );

    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const list = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({
          id: d.id, ...d.data(),
        } as TOEFLWritingAssignment));
        list.sort((a: TOEFLWritingAssignment, b: TOEFLWritingAssignment) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const getMs = (x: TOEFLWritingAssignment) => { const r = x.createdAt as any; return r?.seconds ? r.seconds * 1000 : 0; };
          return getMs(b) - getMs(a);
        });
        setAssignments(list);
        setLoading(false);
      },
      (err: FirestoreError) => { console.error('useToeflWritingAssignments:', err.message); setLoading(false); },
    );
    return () => unsub();
  }, [teacherId]);

  return { assignments, loading };
}

// ── Student: their own writing assignments ────────────────────

export function useStudentToeflWritingAssignments(studentId: string) {
  const [assignments, setAssignments] = useState<TOEFLWritingAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) { setLoading(false); return; }

    const q = query(
      collection(db, 'toeflWritingAssignments'),
      where('studentId', '==', studentId),
    );

    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const list = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({
          id: d.id, ...d.data(),
        } as TOEFLWritingAssignment));
        list.sort((a: TOEFLWritingAssignment, b: TOEFLWritingAssignment) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const getMs = (x: TOEFLWritingAssignment) => { const r = x.createdAt as any; return r?.seconds ? r.seconds * 1000 : 0; };
          return getMs(b) - getMs(a);
        });
        setAssignments(list);
        setLoading(false);
      },
      (err: FirestoreError) => { console.error('useStudentToeflWritingAssignments:', err.message); setLoading(false); },
    );
    return () => unsub();
  }, [studentId]);

  return { assignments, loading };
}

// ── CRUD ──────────────────────────────────────────────────────

export async function createToeflWritingAssignment(data: {
  teacherId:     string;
  /** Omit for a public link — anyone with the URL can take it. */
  studentId?:    string;
  studentName?:  string;
  studentEmail?: string;
  mockId:        string;
}): Promise<string> {
  const ref = doc(collection(db, 'toeflWritingAssignments'));
  const payload: Record<string, unknown> = {
    teacherId:   data.teacherId,
    studentName: data.studentName ?? (data.studentId ? '' : 'Estudiante'),
    mockId:      data.mockId,
    status:      'assigned',
    createdAt:   serverTimestamp(),
  };
  if (data.studentId)    payload.studentId    = data.studentId;
  if (data.studentEmail) payload.studentEmail = data.studentEmail;
  await setDoc(ref, payload);
  return ref.id;
}

export async function setWritingGuestIdentity(
  assignmentId: string,
  name:         string,
  email?:       string,
): Promise<void> {
  const updates: Record<string, unknown> = { studentName: name };
  if (email) updates.studentEmail = email;
  await updateDoc(doc(db, 'toeflWritingAssignments', assignmentId), updates);
}

export async function markToeflWritingAssignmentStarted(assignmentId: string): Promise<void> {
  await updateDoc(doc(db, 'toeflWritingAssignments', assignmentId), {
    status:    'in_progress',
    startedAt: serverTimestamp(),
  });
}

export async function completeToeflWritingAssignment(
  assignmentId: string,
  submission:   WritingSubmission,
): Promise<void> {
  await updateDoc(doc(db, 'toeflWritingAssignments', assignmentId), {
    status:      'completed',
    submission,
    completedAt: serverTimestamp(),
  });
}

export async function gradeToeflWritingAssignment(
  assignmentId:      string,
  enrichedSubmission: WritingSubmission,
  overallScore:      number,
): Promise<void> {
  await updateDoc(doc(db, 'toeflWritingAssignments', assignmentId), {
    status:       'graded',
    submission:   enrichedSubmission,
    overallScore,
    gradedAt:     serverTimestamp(),
    gradingError: null,
  });
}

export async function recordWritingGradingError(
  assignmentId: string,
  error:        string,
): Promise<void> {
  await updateDoc(doc(db, 'toeflWritingAssignments', assignmentId), {
    gradingError: error,
  });
}

export async function deleteToeflWritingAssignment(assignmentId: string): Promise<void> {
  await deleteDoc(doc(db, 'toeflWritingAssignments', assignmentId));
}
