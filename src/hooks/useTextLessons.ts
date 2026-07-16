// FriendlyTeaching.cl — Friendlytext CLT Lessons Firestore hook
// Mirror of useMovieLessons against the textLessons collection.
'use client';
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  collection, query, where, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp,
  type QuerySnapshot, type QueryDocumentSnapshot, type DocumentData,
  type FirestoreError,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { TextLesson, Slide, LessonLevel, TextData } from '@/types/firebase';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function msTimestamp(e: TextLesson): number {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = e.createdAt as any;
  if (typeof r?.toDate === 'function') return r.toDate().getTime();
  if (r?.seconds) return r.seconds * 1000;
  return 0;
}

export function useTextLessons(_teacherId?: string) {
  const [lessons, setLessons] = useState<TextLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState(0);
  const [resolvedUid, setResolvedUid] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    let firestoreUnsub: (() => void) | null = null;

    function start(uid: string) {
      if (!mounted) return;
      setResolvedUid(uid);
      setError(null);
      setLoading(true);
      const q = query(collection(db, 'textLessons'));
      firestoreUnsub = onSnapshot(
        q,
        (snap: QuerySnapshot<DocumentData>) => {
          if (!mounted) return;
          const sorted = snap.docs
            .map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as TextLesson))
            .sort((a: TextLesson, b: TextLesson) => msTimestamp(b) - msTimestamp(a));
          setLessons(sorted);
          setLoading(false);
          setSnapshots(n => n + 1);
        },
        (err: FirestoreError) => {
          if (!mounted) return;
          console.error('[useTextLessons] onSnapshot error:', err.code, err.message);
          setError(`${err.code}: ${err.message}`);
          setLoading(false);
        },
      );
    }

    const auth = getAuth();
    if (auth.currentUser) {
      start(auth.currentUser.uid);
    } else {
      const authUnsub = onAuthStateChanged(auth, (user) => {
        if (!mounted) return;
        if (user) {
          authUnsub();
          start(user.uid);
        } else {
          setError('Sin sesión activa');
          setLoading(false);
        }
      });
    }

    return () => {
      mounted = false;
      firestoreUnsub?.();
    };
  }, []);

  return { lessons, loading, error, snapshots, resolvedUid };
}

export function useStudentTextLessons(studentId: string) {
  const [lessons, setLessons] = useState<TextLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) { setLoading(false); return; }
    const q = query(
      collection(db, 'textLessons'),
      where('publishStatus', '==', 'published'),
      where('assignedTo', 'array-contains', studentId),
    );
    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const sorted = snap.docs
          .map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as TextLesson))
          .sort((a: TextLesson, b: TextLesson) => msTimestamp(b) - msTimestamp(a));
        setLessons(sorted);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [studentId]);

  return { lessons, loading };
}

export async function createTextLesson(data: {
  teacherId: string;
  text: TextData;
  level: LessonLevel;
  slides: Slide[];
}): Promise<string> {
  const authUid = getAuth().currentUser?.uid;
  if (!authUid) throw new Error('No estás autenticado. Refresca la página e ingresa de nuevo.');

  const clean = JSON.parse(JSON.stringify({
    ...data,
    teacherId: authUid,
    title: `${data.text.source} – ${data.text.title}`,
    publishStatus: 'draft',
    assignedTo: [],
  }));
  const ref = await addDoc(collection(db, 'textLessons'), {
    ...clean,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateTextLesson(id: string, patch: Partial<TextLesson>) {
  const clean = JSON.parse(JSON.stringify(patch));
  await updateDoc(doc(db, 'textLessons', id), {
    ...clean,
    updatedAt: serverTimestamp(),
  });
}

export async function publishTextLesson(id: string, published: boolean) {
  await updateDoc(doc(db, 'textLessons', id), {
    publishStatus: published ? 'published' : 'draft',
    updatedAt: serverTimestamp(),
  });
}

export async function assignTextLesson(id: string, studentIds: string[]) {
  await updateDoc(doc(db, 'textLessons', id), {
    assignedTo: studentIds,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTextLesson(id: string) {
  await deleteDoc(doc(db, 'textLessons', id));
}
