// FriendlyTeaching.cl — IELTS practice session persistence
//
// Practice-mode sessions are saved per teacher + mock + student name
// so a teacher can pause a student's attempt and resume it later. The
// runner auto-saves answers, current position, and timer state, then
// hydrates all of them on resume.
//
// Exam-mode attempts are NOT saved — real exams have no "save & resume"
// and mixing them would confuse the diagnostic later.

import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query,
  setDoc, Timestamp, where,
  type QueryDocumentSnapshot, type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { StudentAnswers } from '@/types/ielts';

const COLL = 'ieltsPracticeSessions';

export interface IELTSPracticeSession {
  id?:             string;              // Firestore doc id (set on read)
  teacherId:       string;
  mockId:          string;
  studentName:     string;
  answers:         StudentAnswers;
  currentSection:  0 | 1 | 2 | 3;
  activeQIndex:    number;
  timeLeftSec:     number;
  createdAt:       Timestamp;
  updatedAt:       Timestamp;
}

/** Create a fresh session for a student. Returns the new doc id. */
export async function createPracticeSession(input: {
  teacherId:   string;
  mockId:      string;
  studentName: string;
  timeLeftSec: number;
}): Promise<string> {
  const now = Timestamp.now();
  const ref = await addDoc(collection(db, COLL), {
    teacherId:      input.teacherId,
    mockId:         input.mockId,
    studentName:    input.studentName,
    answers:        {},
    currentSection: 0,
    activeQIndex:   0,
    timeLeftSec:    input.timeLeftSec,
    createdAt:      now,
    updatedAt:      now,
  });
  return ref.id;
}

/** Patch fields on an existing session. `updatedAt` is bumped server-side. */
export async function updatePracticeSession(
  id: string,
  patch: Partial<Pick<IELTSPracticeSession,
    'answers' | 'currentSection' | 'activeQIndex' | 'timeLeftSec' | 'studentName'>>,
): Promise<void> {
  await setDoc(
    doc(db, COLL, id),
    { ...patch, updatedAt: Timestamp.now() },
    { merge: true },
  );
}

/** List saved sessions for a teacher + mock, newest first. */
export async function listPracticeSessions(
  teacherId: string,
  mockId:    string,
): Promise<IELTSPracticeSession[]> {
  const q = query(
    collection(db, COLL),
    where('teacherId', '==', teacherId),
    where('mockId',    '==', mockId),
    orderBy('updatedAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({
    id: d.id,
    ...(d.data() as Omit<IELTSPracticeSession, 'id'>),
  }));
}

/** Load a single session by id, or null if missing. */
export async function loadPracticeSession(id: string): Promise<IELTSPracticeSession | null> {
  const snap = await getDoc(doc(db, COLL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<IELTSPracticeSession, 'id'>) };
}

export async function deletePracticeSession(id: string): Promise<void> {
  await deleteDoc(doc(db, COLL, id));
}
