// FriendlyTeaching.cl — useStudents hook
'use client';
import { useEffect, useState } from 'react';
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, serverTimestamp, runTransaction, Transaction,
  type QuerySnapshot, type DocumentData, type QueryDocumentSnapshot,
  type FirestoreError,
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // teacherId is only non-empty after auth has fully resolved (profile + isLoading
    // are updated atomically by Zustand). Depending on authLoading directly caused the
    // effect to re-run whenever the flag toggled, which cleared the safety timer and
    // reset the Firestore listener — producing an infinite skeleton.
    if (!teacherId) return;

    setLoading(true);
    setError(null);

    // Safety timeout — never show skeleton forever
    const timer = setTimeout(() => {
      setLoading(false);
      setError('Tiempo de espera agotado. Recarga la página.');
    }, 10000);

    // Single query — only needs the automatic single-field index on 'role'.
    // Filter approved/pending client-side to avoid composite index requirements.
    const allStudentsQ = query(
      collection(db, 'users'),
      where('role', '==', 'student'),
    );

    const unsub = onSnapshot(
      allStudentsQ,
      (snap: QuerySnapshot<DocumentData>) => {
        clearTimeout(timer);
        const all = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ uid: d.id, ...d.data() } as FTUser));
        setStudents(all.filter((s: FTUser) => s.status === 'approved' && s.studentData?.approvedByTeacherId === teacherId));
        setPendingStudents(all.filter((s: FTUser) => s.status === 'pending'));
        setLoading(false);
      },
      (err: FirestoreError) => {
        clearTimeout(timer);
        console.error('useStudents error:', err);
        setError(`Error al cargar estudiantes: ${err.code ?? err.message}`);
        setLoading(false);
      },
    );

    return () => { clearTimeout(timer); unsub(); };
  }, [teacherId]);

  return { students, pendingStudents, loading, error };
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
