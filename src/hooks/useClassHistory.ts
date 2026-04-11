// FriendlyTeaching.cl — Class History hook
'use client';
import { useEffect, useState } from 'react';
import {
  collection, query, where, onSnapshot, doc, setDoc, updateDoc,
  serverTimestamp, Timestamp,
  type QuerySnapshot, type DocumentData, type QueryDocumentSnapshot, type FirestoreError,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// ── Types ─────────────────────────────────────────────────────────

export type ClassMood = 'great' | 'good' | 'regular';

export interface ClassNotes {
  covered?: string;         // what topics were covered
  performance?: string;     // student performance observation
  nextClass?: string;       // focus for next class
  homework?: string;        // homework assigned (empty = none)
  mood?: ClassMood;         // class energy / mood
}

export interface ClassHistoryEntry {
  id: string;
  teacherId: string;
  studentName: string;
  dayOfWeek: number;   // 1=Lun … 6=Sáb
  hour: number;        // 10-21
  date: Timestamp;     // actual calendar date of the class
  attended: boolean;   // true = ✅ se tomó, false = ❌ no se tomó
  isRecurring: boolean;
  bookingId?: string;
  notes?: ClassNotes;  // optional post-class notes (added via template)
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// ── Write: record a class session ─────────────────────────────────

export async function recordClassSession(data: {
  teacherId: string;
  studentName: string;
  dayOfWeek: number;
  hour: number;
  minute?: number;
  date: Date;
  attended: boolean;
  isRecurring: boolean;
  bookingId?: string;
}): Promise<string> {
  const ref = doc(collection(db, 'classHistory'));
  await setDoc(ref, {
    teacherId: data.teacherId,
    studentName: data.studentName,
    dayOfWeek: data.dayOfWeek,
    hour: data.hour,
    minute: data.minute ?? 0,
    date: Timestamp.fromDate(data.date),
    attended: data.attended,
    isRecurring: data.isRecurring,
    bookingId: data.bookingId ?? null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ── Write: save notes to an existing classHistory entry ───────────

export async function saveClassNotes(entryId: string, notes: ClassNotes): Promise<void> {
  await updateDoc(doc(db, 'classHistory', entryId), {
    notes,
    updatedAt: serverTimestamp(),
  });
}

// ── Read: real-time history for a teacher ─────────────────────────

export function useClassHistory(teacherId: string, limitDays = 90) {
  const [history, setHistory] = useState<ClassHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teacherId) { setLoading(false); return; }

    // Simple single-field query (no composite index required).
    // Date filtering and sorting are done client-side to avoid
    // Firestore composite index errors that silently return [].
    const q = query(
      collection(db, 'classHistory'),
      where('teacherId', '==', teacherId),
    );

    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const since = new Date();
        since.setDate(since.getDate() - limitDays);
        const sinceMs = since.getTime();

        const entries = snap.docs
          .map((d: QueryDocumentSnapshot<DocumentData>) => ({
            id: d.id,
            ...d.data(),
          } as ClassHistoryEntry))
          .filter((e) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const raw = e.date as any;
            const ms: number = typeof raw?.toDate === 'function'
              ? raw.toDate().getTime()
              : raw?.seconds
                ? raw.seconds * 1000
                : new Date(raw).getTime();
            return ms >= sinceMs;
          })
          .sort((a, b) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getMs = (e: ClassHistoryEntry) => {
              const raw = e.date as any;
              return typeof raw?.toDate === 'function' ? raw.toDate().getTime()
                : raw?.seconds ? raw.seconds * 1000 : new Date(raw).getTime();
            };
            return getMs(b) - getMs(a); // newest first
          });

        setHistory(entries);
        setLoading(false);
      },
      (err: FirestoreError) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [teacherId, limitDays]);

  return { history, loading, error };
}
