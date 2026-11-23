// FriendlyTeaching.cl — useLibraryEpubs
//
// Live map of { [bookId]: hostedEpubUrl } sourced from the Firestore
// `libraryEpubs` collection — populated by
// scripts/upload-library-epubs.js. The library page uses this to
// override the catalogue's Standard Ebooks fallback URL with the
// Firebase Storage mirror whenever a book has been pre-downloaded.

'use client';
import { useEffect, useState } from 'react';
import {
  collection, onSnapshot,
  type FirestoreError, type QueryDocumentSnapshot, type QuerySnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

/** Returns { [bookId]: epubUrl } for every pre-uploaded novel. */
export function useLibraryEpubs(): Record<string, string> {
  const [map, setMap] = useState<Record<string, string>>({});
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'libraryEpubs'),
      (snap: QuerySnapshot<DocumentData>) => {
        const next: Record<string, string> = {};
        for (const d of snap.docs as QueryDocumentSnapshot<DocumentData>[]) {
          const url = (d.data() as { epubUrl?: string }).epubUrl;
          if (url) next[d.id] = url;
        }
        setMap(next);
      },
      (err: FirestoreError) => {
        console.warn('[useLibraryEpubs]', err.message);
      },
    );
    return unsub;
  }, []);
  return map;
}
