// FriendlyTeaching.cl — useBookings hook (real-time onSnapshot)
'use client';
import { useEffect, useState, useMemo } from 'react';
import {
  collection, query, where, onSnapshot,
  doc, setDoc, updateDoc, deleteDoc,
  serverTimestamp, Timestamp,
  type QuerySnapshot, type DocumentData, type FirestoreError, type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Booking, AttendanceStatus } from '@/types/firebase';

export function useBookings(teacherId: string, weekStart: Date) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('init');
  const [dataVersion, setDataVersion] = useState(0);

  // Stabilize weekStartMs to avoid re-subscribing on every render
  // Use useMemo to ensure the same reference when weekStart hasn't meaningfully changed
  const weekStartMs = useMemo(() => {
    const d = new Date(weekStart);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [weekStart]);

  useEffect(() => {
    if (!teacherId) {
      setDebugInfo('no-uid');
      setLoading(false);
      return;
    }

    setDebugInfo('querying...');
    setLoading(true);

    // Query only this teacher's bookings server-side (much faster, no cross-teacher data leakage).
    const q = query(collection(db, 'bookings'), where('teacherId', '==', teacherId));

    // Compute the target week's Monday midnight (ms) for one-time matching
    const wsMs = weekStartMs;
    const weMs = wsMs + 7 * 24 * 60 * 60 * 1000;

    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const all = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as Booking));

        // Unique teacherIds in collection (for debugging)
        const ids = [...new Set(all.map((b: Booking) => b.teacherId))];

        // Keep recurring always + one-time bookings for the current week only
        const filtered = all.filter((b: Booking) => {
          if (b.status === 'cancelled') return false;
          if (b.isRecurring) return true;
          if (!b.weekStart) return false;
          const bMs = typeof (b.weekStart as unknown as { toDate?: () => Date }).toDate === 'function'
            ? (b.weekStart as unknown as { toDate: () => Date }).toDate().getTime()
            : (b.weekStart as unknown as { seconds: number }).seconds * 1000;
          return bMs >= wsMs && bMs < weMs;
        });

        setDebugInfo(`total:${all.length} shown:${filtered.length} teacherIds:[${ids.join('|')}]`);
        setBookings(filtered);
        setDataVersion((v) => v + 1);
        setLoading(false);
      },
      (err: FirestoreError) => {
        setError(err.message);
        setDebugInfo(`error: ${err.message}`);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [teacherId, weekStartMs]);

  return { bookings, loading, error, debugInfo, dataVersion };
}

// ── CRUD helpers ─────────────────────────────────────────────────

const RECURRING_WEEKS = 52; // create 52 weeks (1 year) of recurring bookings

export async function createBooking(
  teacherId: string,
  data: {
    studentName: string;
    studentEmail?: string;
    studentId?: string;
    dayOfWeek: number;
    hour: number;
    minute?: number;
    bookingType?: import('@/types/firebase').BookingType;
    weekStart: Date;
    isRecurring: boolean;
    recurringName?: string;
    notes?: string;
    lessonId?: string;
    timezone?: string;
  }
): Promise<string> {
  const baseData = {
    teacherId,
    studentName: data.studentName,
    studentEmail: data.studentEmail ?? '',
    studentId: data.studentId ?? null,
    dayOfWeek: data.dayOfWeek,
    hour: data.hour,
    minute: data.minute ?? 0,
    bookingType: data.bookingType ?? 'class',
    status: 'confirmed',
    isRecurring: data.isRecurring,
    recurringName: data.recurringName ?? null,
    notes: data.notes ?? null,
    lessonId: data.lessonId ?? null,
    timezone: data.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'America/Santiago',
    createdAt: serverTimestamp(),
  };

  // Create the first booking (current week)
  const ref = doc(collection(db, 'bookings'));
  await setDoc(ref, {
    ...baseData,
    weekStart: Timestamp.fromDate(data.weekStart),
  });

  // If recurring, also create bookings for the next N weeks
  if (data.isRecurring) {
    const batch = await import('firebase/firestore').then((m) => m.writeBatch(db));
    for (let w = 1; w < RECURRING_WEEKS; w++) {
      const futureWeek = new Date(data.weekStart);
      futureWeek.setDate(futureWeek.getDate() + w * 7);
      const futureRef = doc(collection(db, 'bookings'));
      batch.set(futureRef, {
        ...baseData,
        weekStart: Timestamp.fromDate(futureWeek),
        createdAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }

  return ref.id;
}

export async function confirmBooking(bookingId: string) {
  await updateDoc(doc(db, 'bookings', bookingId), {
    status: 'confirmed',
    confirmedAt: serverTimestamp(),
  });
}

export async function cancelBooking(bookingId: string, reason?: string) {
  await updateDoc(doc(db, 'bookings', bookingId), {
    status: 'cancelled',
    cancellationReason: reason ?? null,
    cancelledAt: serverTimestamp(),
  });
}

export async function completeBooking(
  bookingId: string,
  opts?: { attendance?: AttendanceStatus; sessionNotes?: string }
) {
  await updateDoc(doc(db, 'bookings', bookingId), {
    status: 'completed',
    completedAt: serverTimestamp(),
    ...(opts?.attendance ? { attendance: opts.attendance } : {}),
    ...(opts?.sessionNotes ? { sessionNotes: opts.sessionNotes } : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteBooking(bookingId: string) {
  await deleteDoc(doc(db, 'bookings', bookingId));
}

/**
 * Cancel all future recurring bookings for a student+teacher+day+hour combo
 * (from a given weekStart onwards, inclusive).
 */
export async function cancelFutureRecurringBookings(
  teacherId: string,
  dayOfWeek: number,
  hour: number,
  studentName: string,
  fromWeekStart: Date,
  reason?: string,
  minute?: number
) {
  const { getDocs, writeBatch } = await import('firebase/firestore');
  // Use only a single where clause to avoid composite index requirements.
  // Filter the rest client-side.
  const q = query(
    collection(db, 'bookings'),
    where('teacherId', '==', teacherId),
  );
  const snap = await getDocs(q);
  if (snap.empty) return 0;

  const fromMs = fromWeekStart.getTime();

  const toCancel = snap.docs.filter((d: QueryDocumentSnapshot<DocumentData>) => {
    const data = d.data();
    if (data.dayOfWeek !== dayOfWeek) return false;
    if (data.hour !== hour) return false;
    if ((data.minute ?? 0) !== (minute ?? 0)) return false;
    if (data.studentName !== studentName) return false;
    if (data.isRecurring !== true) return false;
    if (data.status !== 'confirmed') return false;
    // weekStart >= fromWeekStart
    const ws = data.weekStart;
    const wsMs = ws
      ? typeof ws.toDate === 'function'
        ? ws.toDate().getTime()
        : (ws.seconds ?? 0) * 1000
      : 0;
    return wsMs >= fromMs;
  });

  if (toCancel.length === 0) return 0;

  const batch = writeBatch(db);
  toCancel.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
    batch.update(d.ref, {
      status: 'cancelled',
      cancellationReason: reason ?? 'Recurrencia cancelada',
      cancelledAt: serverTimestamp(),
    });
  });
  await batch.commit();
  return toCancel.length;
}

/**
 * One-time schedule seed:
 * 1. Hard-deletes ALL existing bookings for a teacher.
 * 2. Creates every slot in `slots` as a fresh booking (recurring creates 52 weeks).
 * Returns counts for UI feedback.
 */
export async function seedTeacherSchedule(
  teacherId: string,
  slots: { dow: number; hour: number; minute?: number; name: string; isRecurring: boolean; bookingType?: import('@/types/firebase').BookingType }[],
  weekStart: Date,
  onProgress?: (msg: string) => void,
): Promise<{ deleted: number; created: number }> {
  const { getDocs, writeBatch: wb } = await import('firebase/firestore');

  onProgress?.('Buscando clases existentes…');
  const snap = await getDocs(query(collection(db, 'bookings'), where('teacherId', '==', teacherId)));

  onProgress?.(`Eliminando ${snap.size} bookings existentes…`);
  // Firestore batches are capped at 500 writes
  const BATCH_CAP = 450;
  let batch = wb(db);
  let ops = 0;
  for (const d of snap.docs) {
    batch.delete(d.ref);
    ops++;
    if (ops % BATCH_CAP === 0) { await batch.commit(); batch = wb(db); }
  }
  if (ops % BATCH_CAP !== 0 || ops === 0) await batch.commit();

  onProgress?.(`Creando ${slots.length} clases nuevas…`);
  let created = 0;
  for (const slot of slots) {
    await createBooking(teacherId, {
      studentName: slot.name,
      dayOfWeek:   slot.dow,
      hour:        slot.hour,
      minute:      slot.minute ?? 0,
      bookingType: slot.bookingType ?? 'class',
      weekStart,
      isRecurring: slot.isRecurring,
    });
    created++;
    onProgress?.(`Creando clases… (${created}/${slots.length})`);
  }

  return { deleted: snap.size, created };
}

export async function updateBooking(
  bookingId: string,
  patch: {
    lessonId?:    string | null;
    studentId?:   string | null;
    notes?:       string;
    studentName?: string;
    dayOfWeek?:   number;
    hour?:        number;
    minute?:      number;
    status?:      import('@/types/firebase').BookingStatus;
    attendance?:  import('@/types/firebase').AttendanceStatus | null;
    completedAt?: null;
  }
) {
  await updateDoc(doc(db, 'bookings', bookingId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}
