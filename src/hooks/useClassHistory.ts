// FriendlyTeaching.cl — Class History hook
'use client';
import { useEffect, useState } from 'react';
import {
  collection, query, where, onSnapshot, doc, setDoc, updateDoc, getDocs, writeBatch,
  serverTimestamp, Timestamp,
  type QuerySnapshot, type DocumentData, type QueryDocumentSnapshot, type FirestoreError,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { normalizeName } from '@/lib/utils/nameUtils';

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
  studentId?: string;
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

// ── Read: real-time history for a student (by studentId) ──────────

export function useStudentClassHistory(studentId: string, teacherId: string, studentName: string) {
  const [history, setHistory] = useState<ClassHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId || !teacherId) { setLoading(false); return; }

    const normName = normalizeName(studentName);

    // Query all history entries for the teacher; match by studentId OR by normalized name.
    // This covers classes recorded before the booking was linked to a student account.
    const q = query(
      collection(db, 'classHistory'),
      where('teacherId', '==', teacherId),
    );

    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const getMs = (e: ClassHistoryEntry) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const raw = e.date as any;
          return typeof raw?.toDate === 'function' ? raw.toDate().getTime() : raw?.seconds ? raw.seconds * 1000 : 0;
        };

        const entries = snap.docs
          .map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as ClassHistoryEntry))
          .filter((e: ClassHistoryEntry) => {
            if (!e.attended) return false;
            if (e.studentId && e.studentId === studentId) return true;
            if (!normName) return false; // no name to match — skip name fallback
            const entryNorm = normalizeName(e.studentName);
            return entryNorm === normName || normName.startsWith(entryNorm) || entryNorm.startsWith(normName);
          })
          .sort((a: ClassHistoryEntry, b: ClassHistoryEntry) => getMs(a) - getMs(b)); // oldest first

        setHistory(entries);
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.error('useStudentClassHistory:', err.message);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [studentId, teacherId, studentName]);

  return { history, loading };
}

// ── Write: record a class session ─────────────────────────────────
//
// Uses a DETERMINISTIC document id keyed by (teacher, booking, local date,
// slot) so re-marking the same class the same day overwrites the existing
// entry instead of creating a duplicate. This closed the bug where
// classes were counted 2x-3x in billing because the teacher had to remark
// them after they reappeared in the carousel.
//
// The date part uses the teacher's LOCAL calendar day (en-CA "YYYY-MM-DD")
// because that is what the carousel filter compares against; using UTC
// here would drift after 21:00 in Chile.

function localDateStr(d: Date): string {
  return d.toLocaleDateString('en-CA'); // YYYY-MM-DD in local tz
}

function classHistoryDocId(data: {
  teacherId: string;
  bookingId?: string;
  date: Date;
  hour: number;
  minute?: number;
}): string {
  const parts = [
    data.teacherId,
    data.bookingId || 'nobk',
    localDateStr(data.date),
    `${data.hour}-${data.minute ?? 0}`,
  ];
  // Firestore doc ids cannot contain `/` and must be under 1500 bytes; our
  // parts are short + slash-free so a raw join is enough.
  return parts.join('_');
}

export async function recordClassSession(data: {
  teacherId: string;
  studentId?: string;
  studentName: string;
  dayOfWeek: number;
  hour: number;
  minute?: number;
  date: Date;
  attended: boolean;
  isRecurring: boolean;
  bookingId?: string;
}): Promise<string> {
  const id = classHistoryDocId(data);
  const ref = doc(db, 'classHistory', id);
  await setDoc(ref, {
    teacherId: data.teacherId,
    ...(data.studentId ? { studentId: data.studentId } : {}),
    studentName: data.studentName,
    dayOfWeek: data.dayOfWeek,
    hour: data.hour,
    minute: data.minute ?? 0,
    date: Timestamp.fromDate(data.date),
    attended: data.attended,
    isRecurring: data.isRecurring,
    bookingId: data.bookingId ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
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
          .filter((e: ClassHistoryEntry) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const raw = e.date as any;
            const ms: number = typeof raw?.toDate === 'function'
              ? raw.toDate().getTime()
              : raw?.seconds
                ? raw.seconds * 1000
                : new Date(raw).getTime();
            return ms >= sinceMs;
          })
          .sort((a: ClassHistoryEntry, b: ClassHistoryEntry) => {
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

/**
 * Renames all classHistory entries for a teacher whose studentName is in
 * `fromNames` to `toName`. Runs as batched writes (max 500 per batch).
 * Returns the number of documents updated.
 */
export async function bulkRenameClassHistory(
  teacherId: string,
  fromNames: string[],
  toName: string,
): Promise<number> {
  if (fromNames.length === 0) return 0;

  // Firestore `in` supports up to 30 values; chunk if needed
  const CHUNK = 30;
  let total = 0;

  for (let i = 0; i < fromNames.length; i += CHUNK) {
    const chunk = fromNames.slice(i, i + CHUNK);
    const q = query(
      collection(db, 'classHistory'),
      where('teacherId', '==', teacherId),
      where('studentName', 'in', chunk),
    );
    const snap = await getDocs(q);
    if (snap.empty) continue;

    // Batch in groups of 500 (Firestore limit)
    const docs = snap.docs;
    for (let j = 0; j < docs.length; j += 500) {
      const batch = writeBatch(db);
      docs.slice(j, j + 500).forEach((d: QueryDocumentSnapshot<DocumentData>) => {
        batch.update(d.ref, { studentName: toName, updatedAt: serverTimestamp() });
      });
      await batch.commit();
      total += Math.min(500, docs.length - j);
    }
  }

  return total;
}
