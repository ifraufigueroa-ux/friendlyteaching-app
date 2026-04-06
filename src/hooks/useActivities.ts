// FriendlyTeaching.cl — Reusable Activity Bank Hook
import { useEffect, useState } from 'react';
import {
  collection, query, where, orderBy, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp,
  FirestoreError, QuerySnapshot, DocumentData, QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { LessonLevel } from '@/types/firebase';

export type ActivitySkill = 'vocabulary' | 'grammar' | 'reading' | 'listening' | 'speaking' | 'writing' | 'general';

export interface Activity {
  id: string;
  teacherId: string;
  title: string;
  skill: ActivitySkill;
  level?: LessonLevel;
  description: string;   // instructions / how to run the activity
  content?: string;      // actual exercise content (text, questions, etc.)
  duration?: number;     // minutes
  tags?: string[];
  timesUsed?: number;
  createdAt: import('firebase/firestore').Timestamp;
  updatedAt?: import('firebase/firestore').Timestamp;
}

export type ActivityInput = Omit<Activity, 'id' | 'createdAt' | 'updatedAt' | 'timesUsed'>;

export function useActivities(teacherId: string) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) { setLoading(false); return; }

    const q = query(
      collection(db, 'activities'),
      where('teacherId', '==', teacherId),
      orderBy('skill'),
      orderBy('createdAt', 'desc'),
    );

    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        setActivities(
          snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({
            id: d.id,
            ...d.data(),
          } as Activity)),
        );
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.error('useActivities error:', err.message);
        setLoading(false);
      },
    );

    return unsub;
  }, [teacherId]);

  async function createActivity(input: Omit<ActivityInput, 'teacherId'>): Promise<string> {
    const ref = await addDoc(collection(db, 'activities'), {
      ...input,
      teacherId,
      timesUsed: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  }

  async function updateActivity(id: string, updates: Partial<ActivityInput>): Promise<void> {
    await updateDoc(doc(db, 'activities', id), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }

  async function deleteActivity(id: string): Promise<void> {
    await deleteDoc(doc(db, 'activities', id));
  }

  async function incrementUsed(id: string, current: number): Promise<void> {
    await updateDoc(doc(db, 'activities', id), {
      timesUsed: (current || 0) + 1,
      updatedAt: serverTimestamp(),
    });
  }

  return { activities, loading, createActivity, updateActivity, deleteActivity, incrementUsed };
}
