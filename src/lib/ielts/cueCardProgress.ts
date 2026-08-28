// FriendlyTeaching.cl — IELTS Speaking Part 2 cue-card progress per student.
//
// The Part 2 deck tracks which cue cards a student has already worked on so
// they don't reappear in the next session. State is scoped per
// (teacherId, studentName): one Firestore doc per pair, keyed
// deterministically so hydration is a single getDoc.

'use client';
import {
  collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, setDoc,
  serverTimestamp, where,
  type QueryDocumentSnapshot, type DocumentData, type Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// Different decks (IELTS Speaking cue cards vs A1-A2 Speaking cue cards)
// share the same shape but live in separate Firestore collections so
// there's zero risk of a card-id collision or cross-product leakage.
export type CueCardDeck = 'ielts' | 'a2';
const COLLECTION_BY_DECK: Record<CueCardDeck, string> = {
  ielts: 'ieltsCueCardProgress',
  a2:    'a2CueCardProgress',
};

export interface CueCardProgress {
  teacherId:        string;
  studentName:      string;
  studentNameKey:   string;      // normalized — used for doc key & lookups
  practicedCardIds: string[];
  createdAt?:       Timestamp;
  updatedAt?:       Timestamp;
}

/** Normalize the student name for doc-key & queries so "Ana", "  ana " and
 *  "ANA" all resolve to the same record. Preserves the display name in a
 *  separate field so the teacher still sees whatever they typed. */
function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

function docKey(teacherId: string, studentNameKey: string): string {
  // Firestore doc ids can't contain "/", but slugified names + uid are safe.
  const slug = studentNameKey.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
  return `${teacherId}__${slug || 'unnamed'}`;
}

/** Read a student's progress. Returns null if nothing has been saved yet. */
export async function loadCueCardProgress(
  teacherId: string,
  studentName: string,
  deck: CueCardDeck = 'ielts',
): Promise<CueCardProgress | null> {
  if (!teacherId || !studentName.trim()) return null;
  const key = docKey(teacherId, normalizeName(studentName));
  const snap = await getDoc(doc(db, COLLECTION_BY_DECK[deck], key));
  if (!snap.exists()) return null;
  return snap.data() as CueCardProgress;
}

/** Overwrite the practiced-cards set for a student. Idempotent — safe to
 *  call after every card completion. */
export async function saveCueCardProgress(input: {
  teacherId:        string;
  studentName:      string;
  practicedCardIds: string[];
  deck?:            CueCardDeck;
}): Promise<void> {
  const displayName    = input.studentName.trim();
  const studentNameKey = normalizeName(displayName);
  if (!input.teacherId || !studentNameKey) return;
  const key = docKey(input.teacherId, studentNameKey);
  await setDoc(
    doc(db, COLLECTION_BY_DECK[input.deck ?? 'ielts'], key),
    {
      teacherId:        input.teacherId,
      studentName:      displayName,
      studentNameKey,
      practicedCardIds: input.practicedCardIds,
      createdAt:        serverTimestamp(),
      updatedAt:        serverTimestamp(),
    },
    { merge: true },
  );
}

/** Wipe a student's progress (used by "Reset deck"). */
export async function deleteCueCardProgress(
  teacherId: string,
  studentName: string,
  deck: CueCardDeck = 'ielts',
): Promise<void> {
  if (!teacherId || !studentName.trim()) return;
  const key = docKey(teacherId, normalizeName(studentName));
  await deleteDoc(doc(db, COLLECTION_BY_DECK[deck], key));
}

/** All students this teacher has saved progress for, newest touched first. */
export async function listCueCardStudents(
  teacherId: string,
  deck: CueCardDeck = 'ielts',
): Promise<CueCardProgress[]> {
  if (!teacherId) return [];
  const q = query(
    collection(db, COLLECTION_BY_DECK[deck]),
    where('teacherId', '==', teacherId),
    orderBy('updatedAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => d.data() as CueCardProgress);
}
