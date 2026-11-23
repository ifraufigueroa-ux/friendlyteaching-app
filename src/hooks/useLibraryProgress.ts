// FriendlyTeaching.cl — useLibraryProgress
//
// Per-student reading progress for the novels library. One doc per
// book under `libraryProgress/{studentId}/items/{bookId}`:
//
//   { cfi, percent, lastReadAt, minutesRead?, finishedAt? }
//
// cfi is epub.js's canonical location (Canonical Fragment Identifier) —
// it lets us put the reader exactly where the student left off, even
// across different devices. percent is a 0-1 ratio of the book read.

'use client';
import { useCallback, useEffect, useState } from 'react';
import {
  collection, doc, onSnapshot, setDoc, serverTimestamp,
  type FirestoreError, type QueryDocumentSnapshot, type QuerySnapshot,
  type DocumentData, type Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface BookProgress {
  bookId:     string;
  cfi:        string;
  percent:    number;      // 0-1
  lastReadAt: Timestamp | null;
  minutesRead?: number;
  finishedAt?: Timestamp | null;
}

/** Live-reads every book's progress for one student. */
export function useLibraryProgress(studentId: string | undefined) {
  const [byBook, setByBook] = useState<Record<string, BookProgress>>({});
  const [loading, setLoading] = useState<boolean>(!!studentId);

  useEffect(() => {
    if (!studentId) { setByBook({}); setLoading(false); return; }
    setLoading(true);
    const unsub = onSnapshot(
      collection(db, 'libraryProgress', studentId, 'items'),
      (snap: QuerySnapshot<DocumentData>) => {
        const next: Record<string, BookProgress> = {};
        for (const d of snap.docs as QueryDocumentSnapshot<DocumentData>[]) {
          next[d.id] = { bookId: d.id, ...(d.data() as Omit<BookProgress, 'bookId'>) };
        }
        setByBook(next);
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.warn('[useLibraryProgress]', err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [studentId]);

  const saveProgress = useCallback(
    (bookId: string, data: { cfi: string; percent: number; finished?: boolean }) => {
      if (!studentId) return Promise.resolve();
      return saveLibraryProgress(studentId, bookId, data);
    },
    [studentId],
  );

  return { byBook, loading, saveProgress };
}

/** Fire-and-forget single-book progress writer. Useful when the caller
 *  doesn't need to subscribe to the full map. */
export async function saveLibraryProgress(
  studentId: string,
  bookId: string,
  data: { cfi: string; percent: number; finished?: boolean },
): Promise<void> {
  if (!studentId || !bookId) return;
  try {
    const ref = doc(db, 'libraryProgress', studentId, 'items', bookId);
    const payload: Record<string, unknown> = {
      cfi:        data.cfi,
      percent:    data.percent,
      lastReadAt: serverTimestamp(),
    };
    if (data.finished) payload.finishedAt = serverTimestamp();
    await setDoc(ref, payload, { merge: true });
  } catch (err) {
    console.warn('[saveLibraryProgress] failed:', err);
  }
}
