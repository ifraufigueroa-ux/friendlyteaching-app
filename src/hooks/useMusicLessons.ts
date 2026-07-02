// FriendlyTeaching.cl — Music Lessons Firestore hook
'use client';
import { useEffect, useState } from 'react';
import {
  collection, query, where, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp,
  type QuerySnapshot, type QueryDocumentSnapshot, type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { MusicLesson, Slide, LessonLevel, SongData } from '@/types/firebase';

export function useMusicLessons(teacherId: string) {
  const [lessons, setLessons] = useState<MusicLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) { setLoading(false); return; }
    // Shared library: every teacher sees every music lesson. Ownership stays
    // on the doc (teacherId field) and is enforced by Firestore rules — only
    // the creator can edit/delete, but anyone can view and assign.
    const q = query(collection(db, 'musicLessons'));
    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const sorted = snap.docs
          .map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as MusicLesson))
          .sort((a: MusicLesson, b: MusicLesson) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ms = (e: MusicLesson): number => { const r = e.createdAt as any; if (typeof r?.toDate === 'function') return r.toDate().getTime(); if (r?.seconds) return r.seconds * 1000; return 0; };
            return ms(b) - ms(a);
          });
        setLessons(sorted);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [teacherId]);

  return { lessons, loading };
}

export function useStudentMusicLessons(_teacherId: string, studentId: string) {
  const [lessons, setLessons] = useState<MusicLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) { setLoading(false); return; }
    // Shared library: a student sees every published lesson assigned to them,
    // regardless of which teacher created it. The teacherId param is kept for
    // call-site compatibility but no longer filters.
    const q = query(
      collection(db, 'musicLessons'),
      where('publishStatus', '==', 'published'),
      where('assignedTo', 'array-contains', studentId),
    );
    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const sorted = snap.docs
          .map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as MusicLesson))
          .sort((a: MusicLesson, b: MusicLesson) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ms = (e: MusicLesson): number => { const r = e.createdAt as any; if (typeof r?.toDate === 'function') return r.toDate().getTime(); if (r?.seconds) return r.seconds * 1000; return 0; };
            return ms(b) - ms(a);
          });
        setLessons(sorted);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [studentId]);

  return { lessons, loading };
}

export async function createMusicLesson(data: {
  teacherId: string;
  song: SongData;
  level: LessonLevel;
  slides: Slide[];
}): Promise<string> {
  // Firestore rejects undefined values — strip them via JSON round-trip
  const clean = JSON.parse(JSON.stringify({
    ...data,
    title: `${data.song.artist} – ${data.song.title}`,
    publishStatus: 'draft',
    assignedTo: [],
  }));
  const ref = await addDoc(collection(db, 'musicLessons'), {
    ...clean,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateMusicLesson(
  id: string,
  patch: Partial<Pick<MusicLesson, 'song' | 'level' | 'slides' | 'title'>>,
) {
  // Firestore rejects undefined values in updateDoc(). Round-trip strips
  // them so optional editor fields (startTime, endTime, timings,
  // previewUrl…) don't blow up the save.
  const clean = JSON.parse(JSON.stringify(patch));
  await updateDoc(doc(db, 'musicLessons', id), {
    ...clean,
    updatedAt: serverTimestamp(),
  });
}

export async function publishMusicLesson(id: string, published: boolean) {
  await updateDoc(doc(db, 'musicLessons', id), {
    publishStatus: published ? 'published' : 'draft',
    updatedAt: serverTimestamp(),
  });
}

export async function assignMusicLesson(id: string, studentIds: string[]) {
  await updateDoc(doc(db, 'musicLessons', id), {
    assignedTo: studentIds,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMusicLesson(id: string) {
  await deleteDoc(doc(db, 'musicLessons', id));
}
