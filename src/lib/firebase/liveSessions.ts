// FriendlyTeaching.cl — Live Session Firestore helpers
// Firestore path: liveSessions/{lessonId}  (one session per lesson at a time)
// Subcollection:  liveSessions/{lessonId}/studentCanvases/{studentId}

import {
  doc, setDoc, updateDoc, onSnapshot, collection,
  query, where, serverTimestamp,
  type Unsubscribe, type DocumentSnapshot, type QuerySnapshot, type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { LiveSession } from '@/types/firebase';

// ── Write helpers ──────────────────────────────────────────────

/** Create or replace the live session document for a lesson. */
export async function startLiveSession(params: {
  lessonId: string;
  teacherId: string;
  lessonTitle: string;
  presentationUrl: string;
  studentIds: string[];
}): Promise<void> {
  const { lessonId, teacherId, lessonTitle, presentationUrl, studentIds } = params;
  await setDoc(doc(db, 'liveSessions', lessonId), {
    teacherId,
    lessonId,
    lessonTitle,
    presentationUrl,
    active: true,
    studentAnnotationsEnabled: false,
    assignedStudents: studentIds,
    teacherCanvas: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/** Mark the session as inactive and clear canvas. */
export async function endLiveSession(lessonId: string): Promise<void> {
  await updateDoc(doc(db, 'liveSessions', lessonId), {
    active: false,
    teacherCanvas: '',
    updatedAt: serverTimestamp(),
  });
}

/** Update teacher's annotation canvas (base64 PNG). Called throttled ~500 ms. */
export async function updateTeacherCanvas(
  lessonId: string,
  canvasDataUrl: string,
): Promise<void> {
  await updateDoc(doc(db, 'liveSessions', lessonId), {
    teacherCanvas: canvasDataUrl,
    updatedAt: serverTimestamp(),
  });
}

/** Enable or disable student annotation tools. */
export async function setStudentAnnotationsEnabled(
  lessonId: string,
  enabled: boolean,
): Promise<void> {
  await updateDoc(doc(db, 'liveSessions', lessonId), {
    studentAnnotationsEnabled: enabled,
    updatedAt: serverTimestamp(),
  });
}

/** Student writes their own canvas to the subcollection. */
export async function updateStudentCanvas(
  lessonId: string,
  studentId: string,
  canvasDataUrl: string,
): Promise<void> {
  await setDoc(
    doc(db, 'liveSessions', lessonId, 'studentCanvases', studentId),
    { canvasData: canvasDataUrl, updatedAt: serverTimestamp() },
  );
}

// ── Subscribe helpers ──────────────────────────────────────────

/** Real-time subscription to a single live session (for teacher + student live page). */
export function subscribeToLiveSession(
  lessonId: string,
  onUpdate: (session: LiveSession | null) => void,
): Unsubscribe {
  return onSnapshot(doc(db, 'liveSessions', lessonId), (snap: DocumentSnapshot<DocumentData>) => {
    if (snap.exists()) {
      onUpdate({ id: snap.id, ...snap.data() } as LiveSession);
    } else {
      onUpdate(null);
    }
  });
}

/**
 * Real-time subscription to ALL active live sessions a student is part of.
 * NOTE: requires a Firestore composite index on (assignedStudents array-contains + active ==).
 * Firebase will log the index-creation URL on first query if it doesn't exist yet.
 */
export function subscribeToStudentActiveSessions(
  studentId: string,
  onUpdate: (sessions: LiveSession[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'liveSessions'),
    where('assignedStudents', 'array-contains', studentId),
    where('active', '==', true),
  );
  return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
    onUpdate(snap.docs.map((d: DocumentData & { id: string; data: () => DocumentData }) => ({ id: d.id, ...d.data() } as LiveSession)));
  });
}
