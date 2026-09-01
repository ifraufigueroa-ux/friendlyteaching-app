// FriendlyTeaching.cl — useNewLeadsCount
// Cuenta los leads con status="new" en `evaluationRequests`. Se usa en
// el sidebar para el badge de notificación de leads sin contactar.

'use client';
import { useEffect, useState } from 'react';
import {
  collection, query, where, onSnapshot,
  type QuerySnapshot, type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export function useNewLeadsCount(enabled: boolean): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) { setCount(0); return; }
    const q = query(
      collection(db, 'evaluationRequests'),
      where('status', '==', 'new'),
    );
    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => setCount(snap.size),
      () => setCount(0),
    );
    return unsub;
  }, [enabled]);

  return count;
}
