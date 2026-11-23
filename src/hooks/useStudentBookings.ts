// FriendlyTeaching.cl — useStudentBookings
//
// Scoped bookings subscription for the STUDENT dashboard.
// Queries `bookings` filtered by studentId so the result honours the
// tightened Firestore rule (bookings read now requires per-doc
// ownership for non-teacher callers — see firestore.rules C3 fix).
//
// Teacher-side callers still use useBookings(teacherId, weekStart) which
// pulls the wider set.

'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  collection, onSnapshot, query, where,
  type DocumentData, type FirestoreError, type QueryDocumentSnapshot, type QuerySnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Booking } from '@/types/firebase';

const DEMO_BOOKING_PREFIX = 'demo-skechers-';
const isDemoBooking = (id: string) => id.startsWith(DEMO_BOOKING_PREFIX);

export function useStudentBookings(studentId: string | undefined, weekStart: Date) {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(!!studentId);
  const [error, setError] = useState<string | null>(null);

  const weekStartMs = useMemo(() => {
    const d = new Date(weekStart);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [weekStart]);

  useEffect(() => {
    if (!studentId) { setLoading(false); setAllBookings([]); return; }
    setLoading(true);
    const q = query(collection(db, 'bookings'), where('studentId', '==', studentId));
    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const all = snap.docs
          .filter((d: QueryDocumentSnapshot<DocumentData>) => !isDemoBooking(d.id))
          .map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as Booking));
        setAllBookings(all);
        setLoading(false);
      },
      (err: FirestoreError) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [studentId]);

  // Same week-filter rule as useBookings: recurring docs always included
  // (the engine still intersects by week at the consumer level), one-off
  // and cancelled docs restricted to the current week.
  const bookings = useMemo(() => {
    const weMs = weekStartMs + 7 * 24 * 60 * 60 * 1000;
    return allBookings.filter((b: Booking) => {
      const ws = b.weekStart as unknown as { toDate?: () => Date; seconds?: number } | null;
      const bMs: number | null = ws
        ? typeof ws.toDate === 'function'
          ? ws.toDate!().getTime()
          : typeof ws.seconds === 'number'
            ? ws.seconds * 1000
            : null
        : null;
      if (b.status === 'cancelled') {
        return bMs !== null && bMs >= weekStartMs && bMs < weMs;
      }
      if (b.isRecurring) return true;
      return bMs !== null && bMs >= weekStartMs && bMs < weMs;
    });
  }, [allBookings, weekStartMs]);

  return { bookings, allBookings, loading, error };
}
