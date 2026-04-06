// FriendlyTeaching.cl — useStudents hook
'use client';
import { useEffect, useState } from 'react';
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, serverTimestamp, runTransaction, Transaction,
  type QuerySnapshot, type DocumentData, type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/store/authStore';
import type { FTUser, LessonLevel } from '@/types/firebase';

export function useStudents() {
  const { profile } = useAuthStore();
  const teacherId = profile?.uid ?? '';

  const [students, setStudents] = useState<FTUser[]>([]);
  const [pendingStudents, setPendingStudents] = useState<FTUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) return;

    // Approved students: only those approved by THIS teacher
    const approvedQ = query(
      collection(db, 'users'),
      where('role', '==', 'student'),
      where('studentData.approvedByTeacherId', '==', teacherId),
    );

    // Pending students: not yet assigned to any teacher — show all pending
    // so teachers can claim and approve new registrations
    const pendingQ = query(
      collection(db, 'users'),
      where('role', '==', 'student'),
      where('status', '==', 'pending'),
    );

    let approved: FTUser[] = [];
    let pending: FTUser[] = [];

    const unsubApproved = onSnapshot(
      approvedQ,
      (snap: QuerySnapshot<DocumentData>) => {
        approved = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ uid: d.id, ...d.data() } as FTUser));
        setStudents(approved);
        setLoading(false);
      },
    );

    const unsubPending = onSnapshot(
      pendingQ,
      (snap: QuerySnapshot<DocumentData>) => {
        pending = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ uid: d.id, ...d.data() } as FTUser));
        setPendingStudents(pending);
      },
    );

    return () => {
      unsubApproved();
      unsubPending();
    };
  }, [teacherId]);

  return { students, pendingStudents, loading };
}

/**
 * Atomically approves a student: sets status, assigns teacher, level, and records history.
 * All Firestore writes happen inside a single transaction — if any fail, all are rolled back.
 */
export async function approveStudent(
  uid: string,
  teacherId: string,
  opts?: {
    level?: LessonLevel;
    studentEmail?: string;
    studentName?: string;
    teacherName?: string;
  },
) {
  const level = opts?.level;

  await runTransaction(db, async (tx: Transaction) => {
    const userRef = doc(db, 'users', uid);
    const snap = await tx.get(userRef);
    if (!snap.exists()) throw new Error('Student document not found');

    // 1. Approve + assign teacher + set level (atomic)
    const updates: Record<string, unknown> = {
      status: 'approved',
      'studentData.approvedByTeacherId': teacherId,
      updatedAt: serverTimestamp(),
    };
    if (level) {
      updates['studentData.level'] = level;
    }
    tx.update(userRef, updates);

    // 2. Record level history (inside same transaction)
    if (level) {
      const prevLevel = snap.data()?.studentData?.level ?? null;
      const histRef = doc(collection(db, 'levelHistory'));
      tx.set(histRef, {
        studentId: uid,
        teacherId,
        fromLevel: prevLevel,
        toLevel: level,
        notes: prevLevel ? 'Nivel actualizado al aprobar' : 'Nivel inicial al aprobar',
        changedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
    }
  });

  // Fire-and-forget email notification (non-critical, outside transaction)
  if (opts?.studentEmail) {
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'student_approved',
        to: opts.studentEmail,
        studentName: opts.studentName,
        teacherName: opts.teacherName,
        appUrl: process.env.NEXT_PUBLIC_APP_URL,
      }),
    }).catch(() => {/* ignore */});
  }
}

export async function rejectStudent(uid: string) {
  await updateDoc(doc(db, 'users', uid), {
    status: 'inactive',
    updatedAt: serverTimestamp(),
  });
}
