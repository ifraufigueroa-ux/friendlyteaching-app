// FriendlyTeaching.cl — useRecurringBookings hook
// Returns each student's unique recurring schedule slots, grouped by studentId.
// A second map (byStudentName) covers bookings that have a name but no UID yet.
'use client';
import { useEffect, useState } from 'react';
import {
  collection, query, where, onSnapshot, writeBatch, getDocs,
  doc, serverTimestamp,
  type QuerySnapshot, type DocumentData, type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Booking } from '@/types/firebase';

export interface ScheduleSlot {
  dayOfWeek: number; // 1=Mon … 6=Sat
  hour: number;      // 0-23
  minute: number;    // 0 or 30
}

export function useRecurringBookings(teacherId: string) {
  const [byStudentId, setByStudentId]     = useState<Record<string, ScheduleSlot[]>>({});
  const [byStudentName, setByStudentName] = useState<Record<string, ScheduleSlot[]>>({});
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    if (!teacherId) { setLoading(false); return; }

    const q = query(collection(db, 'bookings'), where('teacherId', '==', teacherId));

    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const all = snap.docs.map(
          (d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as Booking),
        );
        const recurring = all.filter(
          (b: Booking) => b.isRecurring && b.status !== 'cancelled',
        );

        const idMap:   Record<string, ScheduleSlot[]> = {};
        const nameMap: Record<string, ScheduleSlot[]> = {};
        const seenId   = new Set<string>();
        const seenName = new Set<string>();

        for (const b of recurring) {
          const slot: ScheduleSlot = {
            dayOfWeek: b.dayOfWeek,
            hour:      b.hour,
            minute:    b.minute ?? 0,
          };

          if (b.studentId) {
            const key = `${b.studentId}:${b.dayOfWeek}-${b.hour}-${b.minute ?? 0}`;
            if (!seenId.has(key)) {
              seenId.add(key);
              (idMap[b.studentId] ??= []).push(slot);
            }
          } else {
            const key = `${b.studentName}:${b.dayOfWeek}-${b.hour}-${b.minute ?? 0}`;
            if (!seenName.has(key)) {
              seenName.add(key);
              (nameMap[b.studentName] ??= []).push(slot);
            }
          }
        }

        setByStudentId(idMap);
        setByStudentName(nameMap);
        setLoading(false);
      },
      () => setLoading(false),
    );

    return unsub;
  }, [teacherId]);

  return { byStudentId, byStudentName, loading };
}

/**
 * Link all unlinked recurring bookings whose studentName matches the given name
 * to the given studentId. Returns the number of booking documents updated.
 */
export async function linkBookingsByName(
  teacherId: string,
  studentId: string,
  studentName: string,
): Promise<number> {
  const snap = await getDocs(
    query(collection(db, 'bookings'), where('teacherId', '==', teacherId)),
  );

  const toLink = snap.docs.filter((d: QueryDocumentSnapshot<DocumentData>) => {
    const data = d.data();
    return (
      data.isRecurring === true &&
      data.status !== 'cancelled' &&
      !data.studentId &&
      data.studentName === studentName
    );
  });

  if (toLink.length === 0) return 0;

  const batch = writeBatch(db);
  toLink.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
    batch.update(d.ref, { studentId, updatedAt: serverTimestamp() });
  });
  await batch.commit();
  return toLink.length;
}
