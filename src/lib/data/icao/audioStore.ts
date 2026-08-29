// FriendlyTeaching.cl — OACI class-audio persistence
//
// Cada clase OACI puede tener 1 audio de radio-exchange generado por
// ElevenLabs (mono o multi-voice). Guardamos (teacherId, classId) →
// audioUrl en Firestore así el teacher no vuelve a pagar tokens de
// EL cada vez que entra a la clase.
//
// Un doc por binding en `icaoClassAudios`, keyed como
//   ${teacherId}_${classId}
// Mismo patrón que ieltsListeningAudios.

'use client';
import {
  doc, setDoc, getDoc, deleteDoc, serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const COLLECTION = 'icaoClassAudios';

export interface OACIClassAudioBinding {
  teacherId: string;
  classId:   string;
  audioUrl:  string;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

function docKey(teacherId: string, classId: string): string {
  return `${teacherId}_${classId}`;
}

export async function saveIcaoClassAudio(input: {
  teacherId: string;
  classId:   string;
  audioUrl:  string;
}): Promise<void> {
  await setDoc(doc(db, COLLECTION, docKey(input.teacherId, input.classId)), {
    teacherId: input.teacherId,
    classId:   input.classId,
    audioUrl:  input.audioUrl,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function getIcaoClassAudio(teacherId: string, classId: string): Promise<string | null> {
  if (!teacherId) return null;
  const snap = await getDoc(doc(db, COLLECTION, docKey(teacherId, classId)));
  if (!snap.exists()) return null;
  const url = snap.get('audioUrl') as string | undefined;
  return url ?? null;
}

export async function deleteIcaoClassAudio(teacherId: string, classId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, docKey(teacherId, classId)));
}
