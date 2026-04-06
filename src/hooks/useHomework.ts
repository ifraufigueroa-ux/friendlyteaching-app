// FriendlyTeaching.cl — useHomework hook
import { useEffect, useState } from 'react';
import {
  collection, query, where, onSnapshot, orderBy,
  doc, setDoc, updateDoc, deleteDoc, serverTimestamp,
  type QuerySnapshot, type DocumentData, type FirestoreError, type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Homework, Slide } from '@/types/firebase';

// ── Teacher: todas las tareas asignadas ───────────────────────────────────────

export function useTeacherHomework(teacherId: string) {
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teacherId) return;
    const q = query(
      collection(db, 'homework'),
      where('assignedByTeacherId', '==', teacherId),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        setHomework(snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as Homework)));
        setLoading(false);
      },
      (err: FirestoreError) => { setError(err.message); setLoading(false); }
    );
    return () => unsub();
  }, [teacherId]);

  return { homework, loading, error };
}

// ── Student: sus tareas (personales + para toda la clase) ─────────────────────
// Two listeners are needed: one for homework assigned specifically to this
// student, and one for class-wide homework (assignedToStudentId === null).
// Firestore does not reliably support `in` queries with null values.

export function useStudentHomework(studentId: string) {
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;

    // Local state accumulated from both listeners
    let personal: Homework[] = [];
    let classWide: Homework[] = [];
    let personalReady = false;
    let classWideReady = false;

    function merge() {
      const seen = new Set<string>();
      const merged: Homework[] = [];
      for (const hw of [...personal, ...classWide]) {
        if (!seen.has(hw.id)) { seen.add(hw.id); merged.push(hw); }
      }
      // Sort by createdAt desc (Timestamp or null last)
      merged.sort((a, b) => {
        const ta = (a.createdAt as { seconds?: number })?.seconds ?? 0;
        const tb = (b.createdAt as { seconds?: number })?.seconds ?? 0;
        return tb - ta;
      });
      if (personalReady && classWideReady) {
        setHomework(merged);
        setLoading(false);
      }
    }

    const qPersonal = query(
      collection(db, 'homework'),
      where('assignedToStudentId', '==', studentId),
      orderBy('createdAt', 'desc')
    );
    const qClassWide = query(
      collection(db, 'homework'),
      where('assignedToStudentId', '==', null),
      orderBy('createdAt', 'desc')
    );

    const unsubPersonal = onSnapshot(
      qPersonal,
      (snap: QuerySnapshot<DocumentData>) => {
        personal = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as Homework));
        personalReady = true;
        merge();
      },
      (err: FirestoreError) => { setError(err.message); setLoading(false); }
    );

    const unsubClassWide = onSnapshot(
      qClassWide,
      (snap: QuerySnapshot<DocumentData>) => {
        classWide = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as Homework));
        classWideReady = true;
        merge();
      },
      (err: FirestoreError) => { setError(err.message); setLoading(false); }
    );

    return () => { unsubPersonal(); unsubClassWide(); };
  }, [studentId]);

  return { homework, loading, error };
}

// ── CRUD helpers ──────────────────────────────────────────────────────────────

export interface CreateHomeworkInput {
  assignedToStudentId?: string;
  lessonId?: string;
  bookingId?: string;
  title: string;
  description?: string;
  dueDate: Date;
  slides?: Slide[];
}

export async function createHomework(teacherId: string, data: CreateHomeworkInput): Promise<string> {
  const { Timestamp } = await import('firebase/firestore');
  const ref = doc(collection(db, 'homework'));
  await setDoc(ref, {
    assignedByTeacherId: teacherId,
    assignedToStudentId: data.assignedToStudentId ?? null,
    lessonId: data.lessonId ?? null,
    bookingId: data.bookingId ?? null,
    title: data.title,
    description: data.description ?? '',
    dueDate: Timestamp.fromDate(data.dueDate),
    slides: data.slides && data.slides.length > 0 ? data.slides : null,
    status: 'assigned',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateHomeworkFeedback(
  hwId: string,
  feedback: string,
  score?: number,
  notify?: {
    studentEmail: string;
    studentName: string;
    teacherName: string;
    homeworkTitle: string;
  },
) {
  await updateDoc(doc(db, 'homework', hwId), {
    feedback,
    score: score ?? null,
    status: 'reviewed',
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Fire-and-forget email to student (non-critical)
  if (notify?.studentEmail) {
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'homework_reviewed',
        to: notify.studentEmail,
        studentName: notify.studentName,
        teacherName: notify.teacherName,
        homeworkTitle: notify.homeworkTitle,
        feedback,
        score,
        appUrl: process.env.NEXT_PUBLIC_APP_URL,
      }),
    }).catch(() => {/* ignore */});
  }
}

/**
 * Submits homework and auto-grades if slides are present.
 * Auto-gradeable types: multiple_choice, true_false, matching, selection, drag_drop.
 * Returns the auto-grade result (or null if no gradeable slides).
 */
export async function submitHomework(
  hwId: string,
  answers: Record<string, unknown>,
  slides?: Slide[],
) {
  const patch: Record<string, unknown> = {
    submittedAnswers: answers,
    submittedAt: serverTimestamp(),
    status: 'submitted',
    updatedAt: serverTimestamp(),
  };

  // Auto-grade if slides are available
  if (slides && slides.length > 0) {
    const { autoGrade } = await import('@/lib/utils/autoGrade');
    const gradeResult = autoGrade(slides, answers);

    if (gradeResult.totalGradeable > 0) {
      patch.autoGradeResult = {
        results: gradeResult.results,
        totalGradeable: gradeResult.totalGradeable,
        totalCorrect: gradeResult.totalCorrect,
        percentage: gradeResult.percentage,
        score7: gradeResult.score7,
      };
      patch.score = gradeResult.score7;
      // Auto-reviewed — no teacher intervention needed for objective questions
      patch.status = 'reviewed';
      patch.feedback = `Corregido automáticamente: ${gradeResult.totalCorrect}/${gradeResult.totalGradeable} correctas (${gradeResult.percentage}%)`;
      patch.reviewedAt = serverTimestamp();
    }
  }

  await updateDoc(doc(db, 'homework', hwId), patch);
}

export async function deleteHomework(hwId: string) {
  await deleteDoc(doc(db, 'homework', hwId));
}
