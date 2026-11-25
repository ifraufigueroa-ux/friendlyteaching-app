// FriendlyTeaching.cl — useStudentMonitoring
//
// Teacher-side aggregation of one student's Daily Practice activity.
// Collects three live sources into one object the monitoring page can
// render without issuing further queries:
//
//   · practiceProgress/{uid}             — currentLevel, placedLevel,
//                                          streak, XP, mastery map.
//   · dailyPracticePlacement/{uid}       — status, placedLevel, 50-answer
//                                          breakdown, perLevelAccuracy.
//   · practiceSessions/{uid}/items/*     — per-session history: unitId,
//                                          accuracy, xpEarned, date.
//
// All three are already readable by teachers under the current Firestore
// rules (see audit 2026-11-23 C-tier commits). No schema changes needed
// to start monitoring — this hook just joins what the student already
// writes as they practice.

'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection, doc, onSnapshot, query, orderBy, limit,
  type DocumentData, type FirestoreError, type QuerySnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { PracticeProgress, PracticeSession, PracticeLevel } from '@/types/practice';
import type { DPPSession, DPPAnswer } from '@/types/daily-practice-placement';

export interface MonitoringSession extends PracticeSession {
  id:       string;
  accuracy: number;        // 0..1 — correctCount / totalCount
}

export interface StudentMonitoringData {
  studentId:        string;
  progress:         PracticeProgress | null;
  placement:        DPPSession | null;
  sessions:         MonitoringSession[];   // newest first
  loading:          boolean;
  error:            string | null;
}

const SESSION_HISTORY_LIMIT = 50;

export function useStudentMonitoring(studentId: string): StudentMonitoringData {
  const [progress,  setProgress]  = useState<PracticeProgress | null>(null);
  const [placement, setPlacement] = useState<DPPSession | null>(null);
  const [sessions,  setSessions]  = useState<MonitoringSession[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) {
      setProgress(null); setPlacement(null); setSessions([]);
      setLoading(false); setError(null);
      return;
    }
    setLoading(true);
    let settled = 0;
    const needed = 3;
    function markSettled() {
      settled += 1;
      if (settled >= needed) setLoading(false);
    }

    const unsubProgress = onSnapshot(
      doc(db, 'practiceProgress', studentId),
      (snap) => {
        setProgress(snap.exists() ? (snap.data() as PracticeProgress) : null);
        markSettled();
      },
      (err: FirestoreError) => { setError(err.message); markSettled(); },
    );

    const unsubPlacement = onSnapshot(
      doc(db, 'dailyPracticePlacement', studentId),
      (snap) => {
        setPlacement(snap.exists() ? (snap.data() as DPPSession) : null);
        markSettled();
      },
      (err: FirestoreError) => { setError(err.message); markSettled(); },
    );

    const unsubSessions = onSnapshot(
      query(
        collection(db, 'practiceSessions', studentId, 'items'),
        orderBy('completedAt', 'desc'),
        limit(SESSION_HISTORY_LIMIT),
      ),
      (snap: QuerySnapshot<DocumentData>) => {
        const rows: MonitoringSession[] = snap.docs.map((d) => {
          const raw = d.data() as PracticeSession;
          const total = raw.totalCount || 0;
          const correct = raw.correctCount || 0;
          return {
            ...raw,
            id: d.id,
            accuracy: total > 0 ? correct / total : 0,
          };
        });
        setSessions(rows);
        markSettled();
      },
      (err: FirestoreError) => { setError(err.message); markSettled(); },
    );

    return () => { unsubProgress(); unsubPlacement(); unsubSessions(); };
  }, [studentId]);

  return { studentId, progress, placement, sessions, loading, error };
}

// ── Derivations teachers want to see ─────────────────────────────

/** Average accuracy across the last N sessions (0..1). */
export function recentAccuracy(sessions: MonitoringSession[], n = 10): number {
  const slice = sessions.slice(0, n);
  if (slice.length === 0) return 0;
  return slice.reduce((acc, s) => acc + s.accuracy, 0) / slice.length;
}

/** Accuracy trend in percentage points: avg of the newer half minus the
 *  older half across the most recent 2*n sessions. Positive = improving. */
export function accuracyTrend(sessions: MonitoringSession[], windowEach = 5): number | null {
  const slice = sessions.slice(0, windowEach * 2);
  if (slice.length < windowEach * 2) return null;
  const newer = slice.slice(0, windowEach);
  const older = slice.slice(windowEach, windowEach * 2);
  const avg = (arr: MonitoringSession[]) =>
    arr.reduce((acc, s) => acc + s.accuracy, 0) / arr.length;
  return Math.round((avg(newer) - avg(older)) * 100);
}

/** Days since the last session. Infinity when the student has never
 *  practiced; 0 for a session today. */
export function daysSinceLastPractice(sessions: MonitoringSession[]): number {
  if (sessions.length === 0) return Infinity;
  const first = sessions[0];
  const ts = (first.completedAt as unknown as { toDate?: () => Date })?.toDate?.();
  if (!ts) return Infinity;
  const ms = Date.now() - ts.getTime();
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}

/** Session count in the last N days. */
export function sessionsInWindow(sessions: MonitoringSession[], days: number): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return sessions.filter((s) => {
    const ts = (s.completedAt as unknown as { toDate?: () => Date })?.toDate?.();
    return ts && ts.getTime() >= cutoff;
  }).length;
}

/** Per-level accuracy across the full session history, grouped via the
 *  unit's level inferred from unitId prefix (a0-, a1-, …). Falls back
 *  to 'A0' for malformed ids. */
export function accuracyByPracticeLevel(
  sessions: MonitoringSession[],
): Record<PracticeLevel, { answered: number; correct: number; pct: number }> {
  const buckets: Record<string, { answered: number; correct: number; pct: number }> = {};
  for (const s of sessions) {
    const lvl = inferLevel(s.unitId);
    const b = buckets[lvl] ??= { answered: 0, correct: 0, pct: 0 };
    b.answered += s.totalCount || 0;
    b.correct  += s.correctCount || 0;
  }
  for (const k of Object.keys(buckets)) {
    const b = buckets[k];
    b.pct = b.answered > 0 ? b.correct / b.answered : 0;
  }
  return buckets as Record<PracticeLevel, { answered: number; correct: number; pct: number }>;
}

function inferLevel(unitId: string): PracticeLevel {
  const m = unitId.match(/^(a0|a1|a2|b1plus|b1|b2plus|b2|c1)-/i);
  if (!m) return 'A0';
  const prefix = m[1].toLowerCase();
  switch (prefix) {
    case 'a0':      return 'A0';
    case 'a1':      return 'A1';
    case 'a2':      return 'A2';
    case 'b1':      return 'B1';
    case 'b1plus':  return 'B1' as PracticeLevel; // PracticeLevel has no B1+
    case 'b2':      return 'B2';
    case 'b2plus':  return 'B2+';
    case 'c1':      return 'C1';
    default:        return 'A0';
  }
}

/** Placement per-level breakdown pulled straight off the stored doc.
 *  Returns an empty object when no placement exists yet. */
export function placementBreakdown(placement: DPPSession | null) {
  if (!placement || !placement.perLevelAccuracy) return {};
  return placement.perLevelAccuracy;
}

/** Totals the per-topic accuracy from the last run so teachers can see
 *  which grammar topics the student is weakest in. */
export function placementTopicSkills(placement: DPPSession | null) {
  const answers = (placement?.answers ?? []) as DPPAnswer[];
  const by: Record<string, { answered: number; correct: number; pct: number; level: string }> = {};
  for (const a of answers) {
    const key = a.topic || '—';
    const row = by[key] ??= { answered: 0, correct: 0, pct: 0, level: a.level };
    row.answered += 1;
    if (a.correct) row.correct += 1;
  }
  for (const k of Object.keys(by)) {
    const r = by[k];
    r.pct = r.answered > 0 ? r.correct / r.answered : 0;
  }
  return by;
}
