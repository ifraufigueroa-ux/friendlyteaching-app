// FriendlyTeaching.cl — useSchedule hook (weekly template)
'use client';
import { useEffect, useState } from 'react';
import {
  collection, query, where, onSnapshot,
  doc, setDoc, deleteDoc, serverTimestamp,
  type QuerySnapshot, type DocumentData, type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { WeeklySchedule } from '@/types/firebase';

export function useSchedule(teacherId: string) {
  const [schedule, setSchedule] = useState<WeeklySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    if (!teacherId) { setLoading(false); return; }

    const q = query(
      collection(db, 'weeklySchedule'),
      where('teacherId', '==', teacherId)
    );

    const unsub = onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
      const data = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as WeeklySchedule));
      setSchedule(data);
      setDataVersion((v) => v + 1);
      setLoading(false);
    });

    return () => unsub();
  }, [teacherId]);

  // Returns a map: "day-hour" -> WeeklySchedule
  const scheduleMap: Record<string, WeeklySchedule> = {};
  schedule.forEach((s) => {
    scheduleMap[`${s.dayOfWeek}-${s.hour}`] = s;
  });

  return { schedule, scheduleMap, loading, dataVersion };
}

// Block a slot (set isAvailable=false in weeklySchedule)
export async function blockSlot(teacherId: string, dayOfWeek: number, hour: number) {
  const id = `${teacherId}_${dayOfWeek}_${hour}`;
  await setDoc(doc(db, 'weeklySchedule', id), {
    teacherId,
    dayOfWeek,
    hour,
    isAvailable: false,
    createdAt: serverTimestamp(),
  });
}

// Unblock a slot
export async function unblockSlot(teacherId: string, dayOfWeek: number, hour: number) {
  const id = `${teacherId}_${dayOfWeek}_${hour}`;
  await deleteDoc(doc(db, 'weeklySchedule', id));
}

/**
 * Bulk-set availability: replaces all blocked slots for this teacher.
 * blockedSlots: array of "day-hour" strings that should be BLOCKED.
 * Any existing blocks not in the new list are removed.
 */
export async function setBulkAvailability(
  teacherId: string,
  blockedSlots: string[] // ["1-10", "1-11", "2-14", ...]
) {
  const { writeBatch, getDocs } = await import('firebase/firestore');
  const { query: q2, where: w2, collection: col2 } = await import('firebase/firestore');

  // Fetch existing blocked slots
  const snap = await getDocs(q2(col2(db, 'weeklySchedule'), w2('teacherId', '==', teacherId)));
  const existing = new Set<string>(snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => {
    const data = d.data() as WeeklySchedule;
    return `${data.dayOfWeek}-${data.hour}`;
  }));

  const newSet = new Set(blockedSlots);
  const toAdd = blockedSlots.filter((k) => !existing.has(k));
  const toRemove = [...existing].filter((k) => !newSet.has(k));

  const batch = writeBatch(db);

  toAdd.forEach((key) => {
    const [day, hour] = key.split('-').map(Number);
    const id = `${teacherId}_${day}_${hour}`;
    batch.set(doc(db, 'weeklySchedule', id), {
      teacherId, dayOfWeek: day, hour, isAvailable: false,
      createdAt: serverTimestamp(),
    });
  });

  toRemove.forEach((key) => {
    const [day, hour] = key.split('-').map(Number);
    const id = `${teacherId}_${day}_${hour}`;
    batch.delete(doc(db, 'weeklySchedule', id));
  });

  await batch.commit();
}
