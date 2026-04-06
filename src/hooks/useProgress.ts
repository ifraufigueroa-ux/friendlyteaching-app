// FriendlyTeaching.cl — useProgress hook
import { useEffect, useState } from 'react';
import {
  collection, query, where, onSnapshot, orderBy,
  doc, setDoc, updateDoc, serverTimestamp, getDocs, limit,
  type QuerySnapshot, type DocumentData, type FirestoreError, type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Progress } from '@/types/firebase';

// ── Teacher: progresos de sus estudiantes ────────────────────────────────────

export function useAllProgress(teacherId: string) {
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teacherId) return;
    const q = query(
      collection(db, 'progress'),
      where('teacherId', '==', teacherId),
      orderBy('startedAt', 'desc')
    );
    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        setProgress(snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as Progress)));
        setLoading(false);
      },
      (err: FirestoreError) => { setError(err.message); setLoading(false); }
    );
    return () => unsub();
  }, [teacherId]);

  return { progress, loading, error };
}

// ── Student: su propio progreso ───────────────────────────────────────────────

export function useStudentProgress(studentId: string) {
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    const q = query(
      collection(db, 'progress'),
      where('studentId', '==', studentId),
      orderBy('startedAt', 'desc')
    );
    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        setProgress(snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as Progress)));
        setLoading(false);
      },
      (err: FirestoreError) => { setError(err.message); setLoading(false); }
    );
    return () => unsub();
  }, [studentId]);

  return { progress, loading, error };
}

// ── CRUD helpers ──────────────────────────────────────────────────────────────

export async function startProgress(
  studentId: string,
  lessonId: string,
  teacherId?: string,
  bookingId?: string,
): Promise<string> {
  const ref = doc(collection(db, 'progress'));
  await setDoc(ref, {
    studentId,
    teacherId: teacherId ?? null,
    lessonId,
    bookingId: bookingId ?? null,
    status: 'in_progress',
    startedAt: serverTimestamp(),
    slideProgress: [],
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// Returns existing in_progress record for this student+lesson (or creates one).
// Also returns the slide index to resume from, so the student continues where they left off.
export async function findOrCreateProgress(
  studentId: string,
  lessonId: string,
  teacherId?: string,
  bookingId?: string,
): Promise<{ id: string; resumeSlideIndex: number }> {
  const existing = await getDocs(
    query(
      collection(db, 'progress'),
      where('studentId', '==', studentId),
      where('lessonId', '==', lessonId),
      where('status', '==', 'in_progress'),
      orderBy('startedAt', 'desc'),
      limit(1),
    )
  );
  if (!existing.empty) {
    const data = existing.docs[0].data();
    const sp = (data.slideProgress ?? []) as Array<{ slideIndex: number }>;
    const resumeSlideIndex = sp.length > 0 ? Math.max(...sp.map((s) => s.slideIndex)) : 0;
    return { id: existing.docs[0].id, resumeSlideIndex };
  }
  const id = await startProgress(studentId, lessonId, teacherId, bookingId);
  return { id, resumeSlideIndex: 0 };
}

export async function updateProgress(
  progressId: string,
  patch: Partial<Pick<Progress, 'slideProgress' | 'overallScore' | 'status' | 'completedAt' | 'duration' | 'notes'>>
) {
  await updateDoc(doc(db, 'progress', progressId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function completeProgress(progressId: string, overallScore?: number, duration?: number) {
  await updateDoc(doc(db, 'progress', progressId), {
    status: 'completed',
    completedAt: serverTimestamp(),
    overallScore: overallScore ?? null,
    duration: duration ?? null,
    updatedAt: serverTimestamp(),
  });
}
