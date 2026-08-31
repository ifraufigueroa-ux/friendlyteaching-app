// FriendlyTeaching.cl — useToeflSpeakingAssignments hook
//
// Teacher-created Speaking-only mocks that a student runs from their
// dashboard. Separate collection from `toeflSessions` (which is for the live
// full-mock link flow) because the data shape and access rules differ:
// students see this in their dashboard, don't get AI feedback, and can only
// take it once.

'use client';
import { useEffect, useState } from 'react';
import {
  collection, doc, query, where, onSnapshot, setDoc, updateDoc, deleteDoc,
  serverTimestamp,
  type QuerySnapshot, type DocumentData, type QueryDocumentSnapshot, type FirestoreError,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { TOEFLSpeakingAssignment, SpeakingRecording } from '@/types/toefl';

// ── Teacher: all assignments they created ─────────────────────

export function useToeflSpeakingAssignments(teacherId: string) {
  const [assignments, setAssignments] = useState<TOEFLSpeakingAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) { setLoading(false); return; }

    const q = query(
      collection(db, 'toeflSpeakingAssignments'),
      where('teacherId', '==', teacherId),
    );

    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const list = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({
          id: d.id, ...d.data(),
        } as TOEFLSpeakingAssignment));
        list.sort((a: TOEFLSpeakingAssignment, b: TOEFLSpeakingAssignment) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const getMs = (x: TOEFLSpeakingAssignment) => { const r = x.createdAt as any; return r?.seconds ? r.seconds * 1000 : 0; };
          return getMs(b) - getMs(a);
        });
        setAssignments(list);
        setLoading(false);
      },
      (err: FirestoreError) => { console.error('useToeflSpeakingAssignments:', err.message); setLoading(false); },
    );
    return () => unsub();
  }, [teacherId]);

  return { assignments, loading };
}

// ── Student: their own assignments (pending + completed) ──────

export function useStudentToeflSpeakingAssignments(studentId: string) {
  const [assignments, setAssignments] = useState<TOEFLSpeakingAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) { setLoading(false); return; }

    const q = query(
      collection(db, 'toeflSpeakingAssignments'),
      where('studentId', '==', studentId),
    );

    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const list = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({
          id: d.id, ...d.data(),
        } as TOEFLSpeakingAssignment));
        list.sort((a: TOEFLSpeakingAssignment, b: TOEFLSpeakingAssignment) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const getMs = (x: TOEFLSpeakingAssignment) => { const r = x.createdAt as any; return r?.seconds ? r.seconds * 1000 : 0; };
          return getMs(b) - getMs(a);
        });
        setAssignments(list);
        setLoading(false);
      },
      (err: FirestoreError) => { console.error('useStudentToeflSpeakingAssignments:', err.message); setLoading(false); },
    );
    return () => unsub();
  }, [studentId]);

  return { assignments, loading };
}

// ── CRUD ──────────────────────────────────────────────────────

export async function createToeflSpeakingAssignment(data: {
  teacherId:     string;
  /** Omit for a public link — anyone with the URL can take it and identifies
   *  themselves with the name prompt at start. */
  studentId?:    string;
  studentName?:  string;
  studentEmail?: string;
  mockId:        string;
}): Promise<string> {
  const ref = doc(collection(db, 'toeflSpeakingAssignments'));
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

/** Public-link flow: student fills in their name (and optional email) at the
 *  start. We write it back so the teacher sees who took the test. */
export async function setGuestIdentity(
  assignmentId: string,
  name:         string,
  email?:       string,
): Promise<void> {
  const updates: Record<string, unknown> = { studentName: name };
  if (email) updates.studentEmail = email;
  await updateDoc(doc(db, 'toeflSpeakingAssignments', assignmentId), updates);
}

/** Called by the student page when they first tap "Empezar" — flips status
 *  to in_progress so the teacher can see they've started. */
export async function markToeflSpeakingAssignmentStarted(assignmentId: string): Promise<void> {
  await updateDoc(doc(db, 'toeflSpeakingAssignments', assignmentId), {
    status:    'in_progress',
    startedAt: serverTimestamp(),
  });
}

/** Called by the student page after uploading all 4 recordings. Student is
 *  done — grading runs next (server-side or teacher-triggered). */
export async function completeToeflSpeakingAssignment(
  assignmentId: string,
  recordings: SpeakingRecording[],
): Promise<void> {
  await updateDoc(doc(db, 'toeflSpeakingAssignments', assignmentId), {
    status:      'completed',
    recordings,
    completedAt: serverTimestamp(),
  });
}

/** Called after the auto-grade pipeline finishes (Whisper + Claude on each
 *  recording). Stores the enriched recordings (with transcript/rubric/
 *  feedback) and the 0-30 overall Speaking score. */
export async function gradeToeflSpeakingAssignment(
  assignmentId: string,
  enrichedRecordings: SpeakingRecording[],
  overallScore: number,
): Promise<void> {
  await updateDoc(doc(db, 'toeflSpeakingAssignments', assignmentId), {
    status:       'graded',
    recordings:   enrichedRecordings,
    overallScore,
    gradedAt:     serverTimestamp(),
    gradingError: null,
  });
}

/** Captures a grading failure so the teacher can retry from their panel. */
export async function recordGradingError(assignmentId: string, error: string): Promise<void> {
  await updateDoc(doc(db, 'toeflSpeakingAssignments', assignmentId), {
    gradingError: error,
  });
}

export async function deleteToeflSpeakingAssignment(assignmentId: string): Promise<void> {
  await deleteDoc(doc(db, 'toeflSpeakingAssignments', assignmentId));
}
