// FriendlyTeaching.cl — usePracticeAudios
//
// Resolves the hosted audioUrl for every listen-choose exercise in
// a practice unit. The script `scripts/generate-practice-audios.js`
// seeds the collection with one doc per exercise (doc id = exercise
// id), carrying the ElevenLabs-generated MP3 URL served from Firebase
// Storage. The runner reads that mapping and passes the URL into
// each ListenChooseBody; falls back to SpeechSynthesis when a URL
// isn't on file yet.

'use client';
import { useEffect, useState } from 'react';
import {
  collection, query, where, onSnapshot,
  type DocumentData, type QueryDocumentSnapshot, type QuerySnapshot,
  type FirestoreError,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

/** Returns { [exerciseId]: audioUrl } for the given unit. */
export function usePracticeAudios(unitId: string): Record<string, string> {
  const [map, setMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!unitId) return;
    const q = query(
      collection(db, 'practiceAudios'),
      where('unitId', '==', unitId),
    );
    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const next: Record<string, string> = {};
        for (const d of snap.docs as QueryDocumentSnapshot<DocumentData>[]) {
          const data = d.data();
          if (data.audioUrl) next[d.id] = data.audioUrl as string;
        }
        setMap(next);
      },
      (err: FirestoreError) => {
        console.warn('[usePracticeAudios]', err.message);
      },
    );
    return unsub;
  }, [unitId]);

  return map;
}
