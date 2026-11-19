// FriendlyTeaching.cl — Weekly IELTS hooks + mutations
//
// Student-side: useStudentWeeklyIelts(uid) subscribes to the one active
// assignment the student has, if any. The sidebar uses this to decide
// whether to render the Weekly IELTS entry.
//
// Teacher-side helpers: createWeeklyIeltsAssignment, markModuleComplete,
// requestNextMock. Kept thin — the Firestore doc is already small.

'use client';
import { useEffect, useState } from 'react';
import {
  collection, doc, onSnapshot, query, where,
  serverTimestamp, setDoc, updateDoc, Timestamp,
  type QuerySnapshot, type DocumentData, type FirestoreError,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type {
  WeeklyIeltsAssignment, WeeklyIeltsIntensity, WeeklyIeltsModule, WeeklyIeltsPlanShape,
  WeeklyIeltsMockProgress,
} from '@/types/ielts-weekly';
import {
  DEFAULT_MOCK_ROTATION, nextMockIdFromRotation,
} from '@/lib/data/ielts/academicWeeklyMocks';

// ── Student: pick up the active assignment, if any ────────────

export function useStudentWeeklyIelts(studentId: string) {
  const [assignment, setAssignment] = useState<WeeklyIeltsAssignment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) { setLoading(false); setAssignment(null); return; }
    const q = query(
      collection(db, 'weeklyIeltsAssignments'),
      where('studentId', '==', studentId),
      where('status', '==', 'active'),
    );
    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        // At most one active doc. If somehow there are multiple, pick
        // the most recently updated.
        const rows = snap.docs
          .map((d: QueryDocumentSnapshot<DocumentData>) =>
            ({ id: d.id, ...(d.data() as Omit<WeeklyIeltsAssignment, 'id'>) }));
        rows.sort((a, b) => {
          const am = a.updatedAt?.toMillis?.() ?? 0;
          const bm = b.updatedAt?.toMillis?.() ?? 0;
          return bm - am;
        });
        setAssignment(rows[0] ?? null);
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.warn('[useStudentWeeklyIelts]', err.message);
        setAssignment(null);
        setLoading(false);
      },
    );
    return unsub;
  }, [studentId]);

  return { assignment, loading };
}

// ── Teacher: list assignments I've created ────────────────────

export function useTeacherWeeklyIelts(teacherId: string) {
  const [assignments, setAssignments] = useState<WeeklyIeltsAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) { setLoading(false); return; }
    const q = query(
      collection(db, 'weeklyIeltsAssignments'),
      where('teacherId', '==', teacherId),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setAssignments(snap.docs.map((d) =>
          ({ id: d.id, ...(d.data() as Omit<WeeklyIeltsAssignment, 'id'>) })));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [teacherId]);

  return { assignments, loading };
}

// ── Mutations ─────────────────────────────────────────────────

export interface CreateAssignmentInput {
  studentId: string;
  teacherId: string;
  intensity: WeeklyIeltsIntensity;
  planShape: WeeklyIeltsPlanShape;
  mockRotation?: string[];
}

/** Creates (or overwrites) an active assignment for the student. Doc id
 *  is deterministic by studentId so re-assigning replaces cleanly. */
export async function createWeeklyIeltsAssignment(
  input: CreateAssignmentInput,
): Promise<string> {
  const rotation = (input.mockRotation && input.mockRotation.length > 0)
    ? input.mockRotation
    : DEFAULT_MOCK_ROTATION;
  const firstMockId = rotation[0];
  const now = serverTimestamp();
  const payload: Omit<WeeklyIeltsAssignment, 'id'> = {
    studentId:   input.studentId,
    teacherId:   input.teacherId,
    intensity:   input.intensity,
    planShape:   input.planShape,
    mockRotation: rotation,
    currentMockIndex: 0,
    currentMock: {
      mockId:            firstMockId,
      startedAt:         Timestamp.now(),
      modulesCompleted:  {},
    },
    completedMocks: [],
    // serverTimestamp() is narrowed to FieldValue; we cast through
    // unknown because the stored shape IS Timestamp once it lands.
    assignedAt: now as unknown as Timestamp,
    updatedAt: now as unknown as Timestamp,
    status: 'active',
  };
  const ref = doc(db, 'weeklyIeltsAssignments', input.studentId);
  await setDoc(ref, payload, { merge: false });
  return ref.id;
}

/** Student marks a module of the current mock complete. If every module
 *  is now done, move the mock into completedMocks[] history. The next
 *  mock is NOT served automatically — the student has to press
 *  "Request new Mock" so the UX is a deliberate choice. */
export async function markModuleComplete(
  assignmentId: string,
  moduleKey: WeeklyIeltsModule,
): Promise<void> {
  const ref = doc(db, 'weeklyIeltsAssignments', assignmentId);
  // Read-modify-write via a transaction-less approach because Firestore
  // rules can't easily validate a partial map merge; we overwrite the
  // whole currentMock object.
  const { getDoc } = await import('firebase/firestore');
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Assignment not found');
  const data = snap.data() as WeeklyIeltsAssignment;
  const currentMock: WeeklyIeltsMockProgress = {
    ...data.currentMock,
    modulesCompleted: {
      ...data.currentMock.modulesCompleted,
      [moduleKey]: Timestamp.now(),
    },
  };
  await updateDoc(ref, {
    currentMock,
    updatedAt: serverTimestamp(),
  });
}

/** Rotate the current mock. Archives the current mock into
 *  completedMocks[] with a completedAt timestamp, bumps
 *  currentMockIndex, and resets currentMock to the next mock in
 *  rotation. */
export async function requestNextMock(assignmentId: string): Promise<void> {
  const ref = doc(db, 'weeklyIeltsAssignments', assignmentId);
  const { getDoc } = await import('firebase/firestore');
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Assignment not found');
  const data = snap.data() as WeeklyIeltsAssignment;

  const { nextIndex, nextMockId } = nextMockIdFromRotation(
    data.mockRotation, data.currentMockIndex,
  );
  const archived = [
    {
      mockId:      data.currentMock.mockId,
      startedAt:   data.currentMock.startedAt ?? undefined,
      completedAt: Timestamp.now(),
    },
    ...data.completedMocks,
  ];
  const newMock: WeeklyIeltsMockProgress = {
    mockId: nextMockId,
    startedAt: Timestamp.now(),
    modulesCompleted: {},
  };
  await updateDoc(ref, {
    currentMockIndex: nextIndex,
    currentMock:      newMock,
    completedMocks:   archived,
    updatedAt:        serverTimestamp(),
  });
}
