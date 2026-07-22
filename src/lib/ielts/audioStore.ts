// FriendlyTeaching.cl — IELTS audio persistence
//
// Firebase Storage keeps the MP3 forever, but the (teacher, mock, section) →
// URL mapping needs its own home so a page reload doesn't force the teacher
// to regenerate (and pay for) the same audio.
//
// One doc per binding under `ieltsListeningAudios`, keyed as
//   ${teacherId}_${mockId}_${sectionNumber}
// so lookups on session start are O(1) — no query, just N direct getDoc calls
// (N = number of sections = 4, fine).

'use client';
import {
  doc, setDoc, getDoc, deleteDoc, collection, query, where, getDocs,
  serverTimestamp,
  type Timestamp, type QueryDocumentSnapshot, type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const COLLECTION = 'ieltsListeningAudios';

export type AudioSource = 'generated' | 'uploaded' | 'url';

export interface AudioBinding {
  teacherId: string;
  mockId: string;
  sectionNumber: 1 | 2 | 3 | 4;
  audioUrl: string;
  source: AudioSource;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

function docKey(teacherId: string, mockId: string, sectionNumber: number): string {
  // Simple composite — keeps lookups direct and reads reads across teachers
  // safe by construction (rules will still enforce teacherId ownership).
  return `${teacherId}_${mockId}_${sectionNumber}`;
}

export async function saveAudioBinding(input: {
  teacherId: string;
  mockId: string;
  sectionNumber: 1 | 2 | 3 | 4;
  audioUrl: string;
  source: AudioSource;
}): Promise<void> {
  const key = docKey(input.teacherId, input.mockId, input.sectionNumber);
  await setDoc(doc(db, COLLECTION, key), {
    teacherId: input.teacherId,
    mockId: input.mockId,
    sectionNumber: input.sectionNumber,
    audioUrl: input.audioUrl,
    source: input.source,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function deleteAudioBinding(
  teacherId: string,
  mockId: string,
  sectionNumber: 1 | 2 | 3 | 4,
): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, docKey(teacherId, mockId, sectionNumber)));
}

/**
 * Fetches all four section bindings for a mock in parallel. Returns a
 * partial map — sections without a saved audio are simply absent.
 */
export async function loadMockAudioBindings(
  teacherId: string,
  mockId: string,
): Promise<Partial<Record<1 | 2 | 3 | 4, string>>> {
  if (!teacherId) return {};
  const q = query(
    collection(db, COLLECTION),
    where('teacherId', '==', teacherId),
    where('mockId', '==', mockId),
  );
  const snap = await getDocs(q);
  const out: Partial<Record<1 | 2 | 3 | 4, string>> = {};
  snap.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
    const data = d.data() as AudioBinding;
    if (data.sectionNumber >= 1 && data.sectionNumber <= 4 && data.audioUrl) {
      out[data.sectionNumber] = data.audioUrl;
    }
  });
  return out;
}

/**
 * Single-section read used when we only care about one binding.
 */
export async function getAudioBinding(
  teacherId: string,
  mockId: string,
  sectionNumber: 1 | 2 | 3 | 4,
): Promise<AudioBinding | null> {
  const snap = await getDoc(doc(db, COLLECTION, docKey(teacherId, mockId, sectionNumber)));
  return snap.exists() ? (snap.data() as AudioBinding) : null;
}
