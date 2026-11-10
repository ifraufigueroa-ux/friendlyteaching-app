// FriendlyTeaching.cl — Friendlistenings audio persistence
//
// Unlike IELTS listening (where each teacher generates and owns their own
// audio), a Friendlistenings lesson has ONE canonical audio shared by every
// student on the platform. So the binding is a single doc per lesson id, not
// per (teacher, lesson) pair — that keeps students hearing the same voice
// and saves re-paying ElevenLabs across teachers.

'use client';
import {
  doc, setDoc, getDoc, deleteDoc, serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const COLLECTION = 'friendlisteningsAudios';

export type AudioSource = 'generated' | 'uploaded' | 'url';

export interface FLAudioBinding {
  lessonId:   string;
  audioUrl:   string;
  source:     AudioSource;
  createdBy:  string;   // uid of the teacher who first generated/uploaded
  createdAt:  Timestamp | Date;
  updatedBy?: string;
  updatedAt?: Timestamp | Date;
}

export async function saveFriendlisteningsAudio(input: {
  lessonId:  string;
  audioUrl:  string;
  source:    AudioSource;
  teacherId: string;
}): Promise<void> {
  await setDoc(doc(db, COLLECTION, input.lessonId), {
    lessonId:  input.lessonId,
    audioUrl:  input.audioUrl,
    source:    input.source,
    createdBy: input.teacherId,
    createdAt: serverTimestamp(),
    updatedBy: input.teacherId,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function loadFriendlisteningsAudio(lessonId: string): Promise<string | null> {
  try {
    const snap = await getDoc(doc(db, COLLECTION, lessonId));
    if (!snap.exists()) return null;
    const data = snap.data() as FLAudioBinding;
    return data.audioUrl ?? null;
  } catch {
    // Rules may reject during sign-out races — fall back to the static URL.
    return null;
  }
}

export async function deleteFriendlisteningsAudio(lessonId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, lessonId));
}
