// FriendlyTeaching.cl — useTeacherWordSubmissions
// Feed de respuestas recientes de la palabra del día para el profe.
'use client';
import { useEffect, useState } from 'react';
import {
  collection, query, orderBy, limit, onSnapshot,
  type QuerySnapshot, type DocumentData, type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { WordSubmission } from '@/hooks/useWordOfDay';

// Las submissions no guardan teacherId, así que filtramos client-side por los
// uids de los estudiantes del profe. Rules permiten que un profe lea todas.
// La colección es chica en la práctica; traemos las 100 más recientes y
// filtramos in-memory, después cortamos a `max`.
export function useTeacherWordSubmissions(studentIds: string[], max = 15) {
  const [submissions, setSubmissions] = useState<WordSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Key estable para el dep array (evita re-suscribirse cuando students
  // se re-renderiza con el mismo contenido pero distinta referencia).
  const idsKey = studentIds.slice().sort().join('|');

  useEffect(() => {
    if (studentIds.length === 0) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    const set = new Set(studentIds);
    const q = query(
      collection(db, 'wordOfDaySubmissions'),
      orderBy('createdAt', 'desc'),
      limit(100),
    );

    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const list = snap.docs
          .map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as WordSubmission))
          .filter((s: WordSubmission) => set.has(s.studentId))
          .slice(0, max);
        setSubmissions(list);
        setLoading(false);
      },
      (err: Error) => {
        console.warn('[useTeacherWordSubmissions]', err.message);
        setLoading(false);
      },
    );

    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, max]);

  return { submissions, loading };
}
