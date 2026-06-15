// FriendlyTeaching.cl — Friendlyflix Movie Lessons Firestore hook
// Mirror of useMusicLessons against the movieLessons collection.
'use client';
import { useEffect, useState } from 'react';
import {
  collection, query, where, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp,
  type QuerySnapshot, type QueryDocumentSnapshot, type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { MovieLesson, Slide, LessonLevel, ClipData } from '@/types/firebase';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function msTimestamp(e: MovieLesson): number {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = e.createdAt as any;
  if (typeof r?.toDate === 'function') return r.toDate().getTime();
  if (r?.seconds) return r.seconds * 1000;
  return 0;
}

export function useMovieLessons(teacherId: string) {
  const [lessons, setLessons] = useState<MovieLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) { setLoading(false); return; }
    const q = query(collection(db, 'movieLessons'));
    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const sorted = snap.docs
          .map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as MovieLesson))
          .sort((a: MovieLesson, b: MovieLesson) => msTimestamp(b) - msTimestamp(a));
        setLessons(sorted);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [teacherId]);

  return { lessons, loading };
}

export function useStudentMovieLessons(studentId: string) {
  const [lessons, setLessons] = useState<MovieLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) { setLoading(false); return; }
    const q = query(
      collection(db, 'movieLessons'),
      where('publishStatus', '==', 'published'),
      where('assignedTo', 'array-contains', studentId),
    );
    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const sorted = snap.docs
          .map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as MovieLesson))
          .sort((a: MovieLesson, b: MovieLesson) => msTimestamp(b) - msTimestamp(a));
        setLessons(sorted);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [studentId]);

  return { lessons, loading };
}

export async function createMovieLesson(data: {
  teacherId: string;
  clip: ClipData;
  level: LessonLevel;
  slides: Slide[];
}): Promise<string> {
  const clean = JSON.parse(JSON.stringify({
    ...data,
    title: `${data.clip.source} – ${data.clip.title}`,
    publishStatus: 'draft',
    assignedTo: [],
  }));
  const ref = await addDoc(collection(db, 'movieLessons'), {
    ...clean,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateMovieLesson(id: string, patch: Partial<MovieLesson>) {
  const clean = JSON.parse(JSON.stringify(patch));
  await updateDoc(doc(db, 'movieLessons', id), {
    ...clean,
    updatedAt: serverTimestamp(),
  });
}

export async function publishMovieLesson(id: string, published: boolean) {
  await updateDoc(doc(db, 'movieLessons', id), {
    publishStatus: published ? 'published' : 'draft',
    updatedAt: serverTimestamp(),
  });
}

export async function assignMovieLesson(id: string, studentIds: string[]) {
  await updateDoc(doc(db, 'movieLessons', id), {
    assignedTo: studentIds,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMovieLesson(id: string) {
  await deleteDoc(doc(db, 'movieLessons', id));
}
