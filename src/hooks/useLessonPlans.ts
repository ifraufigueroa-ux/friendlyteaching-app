// FriendlyTeaching.cl — useLessonPlans hook
'use client';
import { useEffect, useState } from 'react';
import {
  collection, doc, query, where, onSnapshot, setDoc, updateDoc, deleteDoc,
  serverTimestamp, Timestamp,
  type QuerySnapshot, type DocumentData, type QueryDocumentSnapshot, type FirestoreError,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface LessonPlan {
  id: string;
  teacherId: string;
  studentName: string;
  studentId?: string;
  planName?: string;
  totalClasses: number;
  manualCompletedCount?: number;
  startDate: Timestamp;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export function useLessonPlans(teacherId: string) {
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teacherId) { setLoading(false); return; }

    const q = query(
      collection(db, 'lessonPlans'),
      where('teacherId', '==', teacherId),
    );

    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const list = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({
          id: d.id,
          ...d.data(),
        } as LessonPlan));
        list.sort((a: LessonPlan, b: LessonPlan) => a.studentName.localeCompare(b.studentName));
        setPlans(list);
        setLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        console.error('useLessonPlans error:', err.message, '| teacherId:', teacherId);
        setError(err.message);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [teacherId]);

  return { plans, loading, error };
}

export function useStudentLessonPlans(studentId: string, teacherId: string, studentName: string) {
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId || !teacherId) { setLoading(false); return; }

    const normName = studentName.trim().toLowerCase();

    // Query all plans for the teacher; match by studentId OR by normalized name.
    // This covers bookings that were created by name only (studentId not set).
    const q = query(
      collection(db, 'lessonPlans'),
      where('teacherId', '==', teacherId),
    );

    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const all = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({
          id: d.id,
          ...d.data(),
        } as LessonPlan));

        const matched = all.filter((p: LessonPlan) => {
          if (p.studentId && p.studentId === studentId) return true;
          if (!normName) return false; // no name to match — skip name fallback
          const planNorm = p.studentName.trim().toLowerCase();
          return planNorm === normName || normName.startsWith(planNorm) || planNorm.startsWith(normName);
        });

        matched.sort((a: LessonPlan, b: LessonPlan) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const aMs = (a.startDate as any)?.seconds ?? 0;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const bMs = (b.startDate as any)?.seconds ?? 0;
          return aMs - bMs;
        });
        setPlans(matched);
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.error('useStudentLessonPlans:', err.message);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [studentId, teacherId, studentName]);

  return { plans, loading };
}

export async function createLessonPlan(data: {
  teacherId: string;
  studentName: string;
  studentId?: string;
  planName?: string;
  totalClasses: number;
  startDate: Date;
}): Promise<string> {
  const ref = doc(collection(db, 'lessonPlans'));
  await setDoc(ref, {
    teacherId: data.teacherId,
    studentName: data.studentName,
    studentId: data.studentId ?? null,
    planName: data.planName ?? '',
    totalClasses: data.totalClasses,
    startDate: Timestamp.fromDate(data.startDate),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateLessonPlan(planId: string, patch: {
  planName?: string;
  totalClasses?: number;
  startDate?: Date;
  manualCompletedCount?: number;
}): Promise<void> {
  const data: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (patch.planName !== undefined) data.planName = patch.planName;
  if (patch.totalClasses !== undefined) data.totalClasses = patch.totalClasses;
  if (patch.startDate !== undefined) data.startDate = Timestamp.fromDate(patch.startDate);
  if (patch.manualCompletedCount !== undefined) data.manualCompletedCount = patch.manualCompletedCount;
  await updateDoc(doc(db, 'lessonPlans', planId), data);
}

export async function deleteLessonPlan(planId: string): Promise<void> {
  await deleteDoc(doc(db, 'lessonPlans', planId));
}
