// FriendlyTeaching.cl — useStudents hook
'use client';
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  collection, query, onSnapshot,
  doc, updateDoc, serverTimestamp, runTransaction, Transaction,
  type QuerySnapshot, type DocumentData, type QueryDocumentSnapshot,
  type FirestoreError,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { FTUser, LessonLevel } from '@/types/firebase';

export function useStudents() {
  const [students, setStudents] = useState<FTUser[]>([]);
  const [pendingStudents, setPendingStudents] = useState<FTUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    // stopFn holds the active cleanup (either the Firestore unsub or the auth unsub)
    let stopFn: (() => void) | null = null;

    function startFirestoreQuery(uid: string) {
      if (!mounted) return;

      setLoading(true);
      setError(null);

      // Safety timeout — if neither callback fires within 12 s, show an error.
      const timer = setTimeout(() => {
        if (!mounted) return;
        setLoading(false);
        setError('No se pudieron cargar los datos. Recarga la página.');
      }, 12_000);

      // Query the entire users collection (no where-clause) and filter
      // client-side. A bare collection query is simpler for Firestore security
      // rules to evaluate — a where('role','==','student') list operation
      // requires Firestore to prove read access for every matching document via
      // the rules' get() call, which can silently stall when the rules engine
      // is under load. Filtering client-side avoids that issue entirely.
      const q = query(collection(db, 'users'));

      const unsub = onSnapshot(
        q,
        (snap: QuerySnapshot<DocumentData>) => {
          if (!mounted) return;
          clearTimeout(timer);
          const all = snap.docs.map(
            (d: QueryDocumentSnapshot<DocumentData>) =>
              ({ uid: d.id, ...d.data() } as FTUser),
          );
          setStudents(
            all.filter(
              (s: FTUser) =>
                s.role === 'student' &&
                s.status === 'approved' &&
                s.studentData?.approvedByTeacherId === uid,
            ),
          );
          setPendingStudents(
            all.filter((s: FTUser) => s.role === 'student' && s.status === 'pending'),
          );
          setLoading(false);
        },
        (err: FirestoreError) => {
          if (!mounted) return;
          clearTimeout(timer);
          console.error('[useStudents]', err.code, err.message);
          setError(`Error al cargar estudiantes: ${err.code}`);
          setLoading(false);
        },
      );

      stopFn = () => {
        clearTimeout(timer);
        unsub();
      };
    }

    const auth = getAuth();

    if (auth.currentUser) {
      // Auth already resolved — start the query immediately.
      startFirestoreQuery(auth.currentUser.uid);
    } else {
      // Auth not ready yet — wait for the first state change, then start.
      const authUnsub = onAuthStateChanged(auth, (user) => {
        authUnsub(); // one-shot: unsubscribe from auth listener right away
        if (!mounted) return;
        if (user) {
          startFirestoreQuery(user.uid);
        } else {
          setLoading(false); // Not logged in — nothing to load
        }
      });
      stopFn = authUnsub;
    }

    return () => {
      mounted = false;
      stopFn?.();
    };
  }, []); // Run once on mount — no dependency on any external state

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
