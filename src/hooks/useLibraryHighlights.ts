// FriendlyTeaching.cl — useLibraryHighlights
//
// Reading highlights per student, scoped to one book. One doc per
// highlight under `libraryHighlights/{studentId}/items/{autoId}`:
//
//   { bookId, cfiRange, text, color, createdAt }
//
// The reader subscribes while a book is open so highlights made on
// one device appear on another in real time. Deleting is allowed
// (students can clear a highlight they no longer want).

'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, where,
  type FirestoreError, type QueryDocumentSnapshot, type QuerySnapshot, type DocumentData,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface BookHighlight {
  id:        string;
  bookId:    string;
  cfiRange:  string;
  text:      string;
  color:     string;
  createdAt: Timestamp | null;
}

export function useLibraryHighlights(studentId: string | undefined, bookId: string | undefined) {
  const [items, setItems] = useState<BookHighlight[]>([]);

  useEffect(() => {
    if (!studentId || !bookId) { setItems([]); return; }
    const q = query(
      collection(db, 'libraryHighlights', studentId, 'items'),
      where('bookId', '==', bookId),
    );
    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const next: BookHighlight[] = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({
          id: d.id,
          ...(d.data() as Omit<BookHighlight, 'id'>),
        }));
        setItems(next);
      },
      (err: FirestoreError) => {
        console.warn('[useLibraryHighlights]', err.message);
      },
    );
    return unsub;
  }, [studentId, bookId]);

  const add = useCallback(
    async (input: { cfiRange: string; text: string; color?: string }) => {
      if (!studentId || !bookId) return;
      try {
        await addDoc(collection(db, 'libraryHighlights', studentId, 'items'), {
          bookId,
          cfiRange:  input.cfiRange,
          text:      input.text.slice(0, 1000),
          color:     input.color ?? '#FFD95A',
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('[useLibraryHighlights.add] failed:', err);
      }
    },
    [studentId, bookId],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!studentId) return;
      try {
        await deleteDoc(doc(db, 'libraryHighlights', studentId, 'items', id));
      } catch (err) {
        console.warn('[useLibraryHighlights.remove] failed:', err);
      }
    },
    [studentId],
  );

  return { items, add, remove };
}
