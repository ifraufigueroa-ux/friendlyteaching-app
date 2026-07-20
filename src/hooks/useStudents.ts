// FriendlyTeaching.cl — useStudents hook
'use client';
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  collection, query, where, getDocs, writeBatch,
  onSnapshot,
  doc, updateDoc, serverTimestamp, runTransaction, Transaction,
  type QuerySnapshot, type DocumentData, type QueryDocumentSnapshot,
  type FirestoreError,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { FTUser, LessonLevel } from '@/types/firebase';

export function useStudents() {
  const [students, setStudents] = useState<FTUser[]>([]);
  const [pendingStudents, setPendingStudents] = useState<FTUser[]>([]);
  const [archivedStudents, setArchivedStudents] = useState<FTUser[]>([]);
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

      // Bare collection query; Firestore rules (allow list) now use
      // isKnownTeacherEmail() which needs no get() call, avoiding the
      // per-document get() stall that plagued the previous allow read rule.
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

          // Approved students: show students assigned to THIS teacher OR students
          // whose approvedByTeacherId is unset/blank (covers the case where the
          // teacher's UID changed between sessions due to auth provider linking).
          // Students explicitly assigned to a DIFFERENT teacher are excluded.
          const approvedRaw = all.filter(
            (s: FTUser) =>
              s.role === 'student' &&
              s.status === 'approved' &&
              (!s.studentData?.approvedByTeacherId ||
                s.studentData.approvedByTeacherId === uid),
          );
          // Deduplicate: when one name is a prefix of another (e.g. "Andrée" vs
          // "Andrée Barraza"), keep only the longer/more-complete record.
          const norm = (n: string) => (n ?? '').toLowerCase().trim();
          const deduped: FTUser[] = [];
          for (const s of approvedRaw.sort((a: FTUser, b: FTUser) =>
            (b.fullName ?? '').length - (a.fullName ?? '').length, // longest first
          )) {
            const sn = norm(s.fullName ?? '');
            const absorbed = deduped.some((existing: FTUser) => {
              const en = norm(existing.fullName ?? '');
              return en.startsWith(sn) || sn.startsWith(en);
            });
            if (!absorbed) deduped.push(s);
          }
          setStudents(deduped.sort((a: FTUser, b: FTUser) =>
            (a.fullName ?? '').localeCompare(b.fullName ?? '', 'es'),
          ));

          // Pending students: any student awaiting approval (no teacher filter —
          // any teacher can approve a pending student).
          setPendingStudents(
            all.filter((s: FTUser) => s.role === 'student' && s.status === 'pending'),
          );

          // Archived students: soft-deleted, scoped to this teacher.
          setArchivedStudents(
            all.filter(
              (s: FTUser) =>
                s.role === 'student' &&
                s.status === 'archived' &&
                (!s.studentData?.approvedByTeacherId ||
                  s.studentData.approvedByTeacherId === uid),
            ),
          );
          setLoading(false);
        },
        (err: FirestoreError) => {
          if (!mounted) return;
          clearTimeout(timer);
          console.error('[useStudents] Firestore error:', err.code, err.message);
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
      // Auth already resolved synchronously — start the query immediately.
      startFirestoreQuery(auth.currentUser.uid);
    } else {
      // Firebase hasn't resolved auth from persistence yet.
      // Keep listening until we get a definitive user (or confirmed null).
      let resolved = false;
      const authUnsub = onAuthStateChanged(auth, (user) => {
        if (!mounted) return;
        // Firebase can emit multiple events; only act on the first non-null user
        // or on a confirmed logged-out state (after the initial resolution delay).
        if (user && !resolved) {
          resolved = true;
          authUnsub();
          startFirestoreQuery(user.uid);
        } else if (!user && !resolved) {
          // Wait briefly in case this is the pre-resolution null event.
          // Firebase resolves from persistence within ~1 s; if still null after
          // 2 s we treat it as genuinely logged out.
          setTimeout(() => {
            if (!mounted || resolved) return;
            resolved = true;
            authUnsub();
            setLoading(false);
          }, 2_000);
        }
      });
      stopFn = authUnsub;
    }

    return () => {
      mounted = false;
      stopFn?.();
    };
  }, []); // Run once on mount — no dependency on any external state

  return { students, pendingStudents, archivedStudents, loading, error };
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

/**
 * Manually create a student account from the teacher dashboard.
 * Goes through /api/students/create which uses the Firebase Admin SDK so
 * the new auth user doesn't sign in over the teacher's current session.
 */
export async function createStudent(input: {
  email: string;
  fullName: string;
  password: string;
  phone?: string;
  level?: LessonLevel;
}): Promise<{ uid: string }> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('Sesión no encontrada — vuelve a iniciar sesión');
  const token = await user.getIdToken();

  const res = await fetch('/api/students/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? 'No se pudo crear el estudiante');
  return { uid: data.uid };
}

export async function rejectStudent(uid: string) {
  await updateDoc(doc(db, 'users', uid), {
    status: 'inactive',
    updatedAt: serverTimestamp(),
  });
}

export async function archiveStudent(uid: string) {
  await updateDoc(doc(db, 'users', uid), {
    status: 'archived',
    updatedAt: serverTimestamp(),
  });
}

export async function restoreStudent(uid: string) {
  await updateDoc(doc(db, 'users', uid), {
    status: 'approved',
    updatedAt: serverTimestamp(),
  });
}

/**
 * Archive a student everywhere in one shot:
 *   1. If uid is given, flip users/{uid}.status → 'archived'.
 *   2. Cancel every non-cancelled booking owned by teacherId where
 *      studentId === uid OR studentName (case-insensitive) === name.
 *      Cancellations use the same status='cancelled' pattern as
 *      cancelBooking so they disappear from the schedule grid and the
 *      planner immediately but the docs stay for audit/history.
 *
 * Returns the number of bookings cancelled so the UI can confirm.
 */
export async function archiveStudentEverywhere(opts: {
  teacherId: string;
  uid?: string;
  name?: string;
}): Promise<{ userArchived: boolean; bookingsCancelled: number }> {
  const { teacherId, uid, name } = opts;
  let userArchived = false;

  if (uid) {
    await updateDoc(doc(db, 'users', uid), {
      status: 'archived',
      updatedAt: serverTimestamp(),
    });
    userArchived = true;
  }

  // Pull every booking for this teacher and filter client-side — the
  // schema doesn't guarantee a compound index on (teacherId,studentId)
  // and we need OR-matching anyway (uid vs. legacy name-only bookings).
  const snap = await getDocs(
    query(collection(db, 'bookings'), where('teacherId', '==', teacherId)),
  );
  const nameLower = (name ?? '').trim().toLowerCase();
  const targets = snap.docs.filter((d: QueryDocumentSnapshot<DocumentData>) => {
    const b = d.data();
    if (b.status === 'cancelled') return false;
    if (uid && b.studentId === uid) return true;
    if (nameLower && typeof b.studentName === 'string'
        && b.studentName.trim().toLowerCase() === nameLower) return true;
    return false;
  });

  // Firestore batch limit is 500 writes — chunk to stay safe on students
  // with many recurring instances (52 weekly docs × N slots).
  const CHUNK = 400;
  for (let i = 0; i < targets.length; i += CHUNK) {
    const batch = writeBatch(db);
    for (const d of targets.slice(i, i + CHUNK)) {
      batch.update(d.ref, {
        status: 'cancelled',
        cancellationReason: 'student archived',
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }

  return { userArchived, bookingsCancelled: targets.length };
}
