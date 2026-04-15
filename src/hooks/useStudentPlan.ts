// FriendlyTeaching.cl — Per-student lesson plan hook
'use client';
import { useEffect, useState } from 'react';
import {
  collection, query, where, onSnapshot, setDoc, doc, serverTimestamp,
  type Timestamp, type QuerySnapshot, type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { LessonPlannerStatus } from '@/types/firebase';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface StudentLessonPlan {
  id: string;           // composite: `${teacherId}_${studentId}_${lessonId}`
  teacherId: string;
  studentId: string;
  lessonId: string;
  status: LessonPlannerStatus;
  note: string;
  updatedAt?: Timestamp;
}

// ── Read: real-time plan for one student ───────────────────────────────────────

export function useStudentPlan(teacherId: string, studentId: string) {
  const [plans, setPlans] = useState<StudentLessonPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherId || !studentId) { setLoading(false); return; }

    const q = query(
      collection(db, 'studentLessonPlans'),
      where('teacherId', '==', teacherId),
      where('studentId', '==', studentId),
    );

    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        setPlans(snap.docs.map((d: DocumentData & { id: string; data: () => DocumentData }) => ({ id: d.id, ...d.data() } as StudentLessonPlan)));
        setLoading(false);
      },
      () => setLoading(false),
    );

    return unsub;
  }, [teacherId, studentId]);

  // O(1) lookup map: lessonId → plan
  const planMap = Object.fromEntries(plans.map(p => [p.lessonId, p]));

  return { plans, planMap, loading };
}

// ── Write: upsert lesson status for a student ──────────────────────────────────

export async function setStudentLessonStatus(
  teacherId: string,
  studentId: string,
  lessonId: string,
  status: LessonPlannerStatus,
) {
  const id = `${teacherId}_${studentId}_${lessonId}`;
  await setDoc(
    doc(db, 'studentLessonPlans', id),
    { teacherId, studentId, lessonId, status, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

// ── Write: upsert lesson note for a student ────────────────────────────────────

export async function setStudentLessonNote(
  teacherId: string,
  studentId: string,
  lessonId: string,
  note: string,
) {
  const id = `${teacherId}_${studentId}_${lessonId}`;
  await setDoc(
    doc(db, 'studentLessonPlans', id),
    { teacherId, studentId, lessonId, note, updatedAt: serverTimestamp() },
    { merge: true },
  );
}
