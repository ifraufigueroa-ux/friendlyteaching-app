// FriendlyTeaching.cl — TOEFL session persistence helpers
//
// Mirrors the ieltsPracticeSessions pattern: one Firestore doc per attempt,
// autosaved on every answer + navigation. The runner rehydrates from the
// liveSnapshot to jump right back where the student left off.
//
// A session may be "in_progress" (still running), "partial" (submitted with
// some sections skipped), or "completed" (all enabled sections done and
// scored).

import {
  collection, doc, getDoc, getDocs, orderBy, query, setDoc, Timestamp, where, limit,
  type QueryDocumentSnapshot, type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type {
  TOEFLSession, TOEFLLiveSnapshot, TOEFLSection,
} from '@/types/toefl';

const COLL = 'toeflSessions';

/** Look up an in-progress session for a given teacher + mock + student name.
 *  Case-sensitive match on the trimmed name — good enough for a "resume"
 *  prompt on the landing screen where the student re-types their name. */
export async function findResumableSession(
  teacherId:   string,
  mockId:      string,
  studentName: string,
): Promise<TOEFLSession | null> {
  if (!teacherId || !mockId || !studentName.trim()) return null;
  const q = query(
    collection(db, COLL),
    where('teacherId',   '==', teacherId),
    where('mockId',      '==', mockId),
    where('studentName', '==', studentName.trim()),
    where('status',      '==', 'in_progress'),
    orderBy('updatedAt', 'desc'),
    limit(1),
  );
  try {
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...(d.data() as Omit<TOEFLSession, 'id'>) };
  } catch (err) {
    // Missing composite index → let the caller fall back to a fresh session.
    console.warn('[toefl-sessions] findResumable lookup failed:', err);
    return null;
  }
}

/** Load a session by id — used when the URL carries ?resumeSessionId=…
 *  (teacher clicked "Continuar" from the dashboard). */
export async function loadSession(id: string): Promise<TOEFLSession | null> {
  const snap = await getDoc(doc(db, COLL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<TOEFLSession, 'id'>) };
}

/** Write the live snapshot for the currently-running section. Called after
 *  every answer and on section transitions. Merges with existing fields. */
export async function saveLiveSnapshot(
  sessionId: string,
  snapshot:  TOEFLLiveSnapshot,
): Promise<void> {
  if (!sessionId) return;
  try {
    await setDoc(
      doc(db, COLL, sessionId),
      {
        liveSnapshot:          snapshot,
        liveSnapshotUpdatedAt: Timestamp.now(),
        updatedAt:             Timestamp.now(),
        [`progress.${snapshot.section}`]: 'in_progress',
      },
      { merge: true },
    );
  } catch (err) {
    console.error('[toefl-sessions] saveLiveSnapshot failed:', err);
  }
}

/** Simple debounce so we don't hammer Firestore on every keystroke in the
 *  Listening notes textarea. Callers should hold onto the returned function. */
export function debouncedSnapshot(
  wait: number,
): (sessionId: string, snapshot: TOEFLLiveSnapshot) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: [string, TOEFLLiveSnapshot] | null = null;
  return (sessionId, snapshot) => {
    lastArgs = [sessionId, snapshot];
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      if (lastArgs) void saveLiveSnapshot(...lastArgs);
    }, wait);
  };
}

/** Wipe the live snapshot when a section finishes — the answers are now in
 *  results.{section} and rehydration would overwrite them with stale data. */
export async function clearLiveSnapshot(sessionId: string): Promise<void> {
  if (!sessionId) return;
  try {
    await setDoc(
      doc(db, COLL, sessionId),
      { liveSnapshot: null, updatedAt: Timestamp.now() },
      { merge: true },
    );
  } catch (err) {
    console.error('[toefl-sessions] clearLiveSnapshot failed:', err);
  }
}

/** List completed / in-progress sessions for a teacher, newest first.
 *  Used by the teacher dashboard sessions table. */
export async function listSessionsForTeacher(
  teacherId: string,
): Promise<TOEFLSession[]> {
  if (!teacherId) return [];
  const q = query(
    collection(db, COLL),
    where('teacherId', '==', teacherId),
    orderBy('createdAt', 'desc'),
  );
  try {
    const snap = await getDocs(q);
    return snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({
      id: d.id, ...(d.data() as Omit<TOEFLSession, 'id'>),
    }));
  } catch (err) {
    console.error('[toefl-sessions] list failed:', err);
    return [];
  }
}

/** Pretty-print a section list for the sessions table ("R L S" / "R+W"). */
export function sectionsSummary(sections: TOEFLSection[] | undefined): string {
  if (!sections || sections.length === 0) return '—';
  const shorts: Record<TOEFLSection, string> = {
    reading: 'R', listening: 'L', speaking: 'S', writing: 'W',
  };
  return sections.map(s => shorts[s]).join(' ');
}
