// FriendlyTeaching.cl — useOrganizationRoster
//
// Builds the roster + aggregate stats a corporate admin sees. Fetches
// each student's user profile, their last 30d of bookings, Daily Practice
// progress and latest placement test, then composes a single RosterEntry
// per employee + an OrganizationStats summary.
//
// Phase 1 does this with one-shot getDocs rather than live listeners —
// the dashboard refreshes on navigation, which is fine for a monthly
// monitoring tool. We can swap to realtime later.

'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  collection, doc, getDoc, getDocs, query, where,
  Timestamp, type DocumentData, type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { FTUser, Booking, LessonLevel } from '@/types/firebase';
import type { Organization, RosterEntry, OrganizationStats } from '@/types/organization';

interface PracticeDoc {
  currentStreak?:  number;
  totalXp?:        number;
}

interface PlacementSessionDoc {
  level?:         LessonLevel;
  completedAt?:   Timestamp;
  createdAt?:     Timestamp;
}

const DAY_MS = 86400000;

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * DAY_MS);
}

function tsToDateStr(ts: Timestamp | undefined | null): string | null {
  if (!ts) return null;
  const d = ts.toDate();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** Fetches a single student's derived roster entry. Isolated so we can
 *  Promise.all over the roster without one slow query blocking the rest. */
async function buildEntry(uid: string): Promise<RosterEntry | null> {
  const [userSnap, bookingsSnap, practiceSnap, placementSnap] = await Promise.all([
    getDoc(doc(db, 'users', uid)),
    getDocs(query(
      collection(db, 'bookings'),
      where('studentId', '==', uid),
    )),
    getDoc(doc(db, 'practiceProgress', uid)),
    getDocs(query(
      collection(db, 'placementSessions'),
      where('studentId', '==', uid),
    )),
  ]);

  if (!userSnap.exists()) return null;
  const user = { uid: userSnap.id, ...userSnap.data() } as FTUser;

  const cutoff30 = daysAgo(30);
  const bookings: Booking[] = bookingsSnap.docs.map(
    (d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as Booking),
  );

  // Last 30d attendance: anything with weekStart in window.
  const recent = bookings.filter((b: Booking) => !!b.weekStart && b.weekStart.toDate() >= cutoff30);
  const attended = recent.filter((b: Booking) => b.attendance === 'attended').length;
  const absent   = recent.filter((b: Booking) => b.attendance === 'absent').length;
  const attendancePct = (attended + absent) > 0
    ? Math.round((attended / (attended + absent)) * 100)
    : 0;

  // Last confirmed/completed class across the whole history.
  const sorted = [...bookings].sort(
    (a: Booking, b: Booking) => (b.weekStart?.toMillis() ?? 0) - (a.weekStart?.toMillis() ?? 0),
  );
  const lastClass = sorted.find((b: Booking) => b.attendance === 'attended' || b.status === 'completed');

  // Daily Practice.
  const practice = practiceSnap.exists() ? (practiceSnap.data() as PracticeDoc) : null;

  // Latest placement (sort client-side so we don't need a Firestore index).
  const placements: PlacementSessionDoc[] = placementSnap.docs
    .map((d: QueryDocumentSnapshot<DocumentData>) => d.data() as PlacementSessionDoc)
    .filter((p: PlacementSessionDoc) => !!(p.completedAt || p.createdAt))
    .sort((a: PlacementSessionDoc, b: PlacementSessionDoc) => {
      const am = (a.completedAt ?? a.createdAt)?.toMillis() ?? 0;
      const bm = (b.completedAt ?? b.createdAt)?.toMillis() ?? 0;
      return bm - am;
    });
  const latestPlacement = placements[0] ?? null;

  return {
    uid:                 user.uid,
    fullName:            user.fullName,
    email:               user.email,
    profileImage:        user.profileImage,
    currentLevel:        user.studentData?.level ?? latestPlacement?.level ?? null,
    lastClassDate:       lastClass ? tsToDateStr(lastClass.weekStart) : null,
    classesLast30Days:   attended,
    attendancePct,
    practiceStreak:      practice?.currentStreak ?? 0,
    practiceXp:          practice?.totalXp ?? 0,
    latestPlacementLevel: latestPlacement?.level ?? null,
    latestPlacementAt:   tsToDateStr(latestPlacement?.completedAt ?? latestPlacement?.createdAt ?? null),
  };
}

/**
 * Builds the roster + stats for a given organization. Re-runs when the
 * list of studentUids changes (e.g. HR adds/removes employees).
 */
export function useOrganizationRoster(org: Organization | null) {
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Join uids into a stable key so useEffect re-runs on membership changes.
  const uidsKey = useMemo(
    () => (org?.studentUids ?? []).slice().sort().join(','),
    [org?.studentUids],
  );

  useEffect(() => {
    if (!org || org.studentUids.length === 0) {
      setRoster([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all(org.studentUids.map(buildEntry))
      .then(results => {
        if (cancelled) return;
        setRoster(results.filter((r): r is RosterEntry => r !== null));
        setLoading(false);
      })
      .catch(err => {
        if (cancelled) return;
        console.warn('[useOrganizationRoster] build error:', err);
        setLoading(false);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uidsKey]);

  const stats: OrganizationStats = useMemo(() => {
    const cutoff30 = daysAgo(30);
    const monthStart = new Date();
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

    const active = roster.filter(r => r.classesLast30Days > 0).length;
    const classes30 = roster.reduce((sum, r) => sum + r.classesLast30Days, 0);

    const levelDistribution: Record<string, number> = {};
    for (const r of roster) {
      const key = r.currentLevel ?? 'Sin nivel';
      levelDistribution[key] = (levelDistribution[key] ?? 0) + 1;
    }

    // Improved = latest placement level is higher than currentLevel at onboarding.
    // Phase 1 simplification: count students with ≥2 placements where latest > first.
    // We don't fetch all placements here, so skip for now (returns 0).
    const improvedCount = 0;

    return {
      totalStudents:      roster.length,
      activeLast30Days:   active,
      classesLast30Days:  classes30,
      classesThisMonth:   classes30, // simplification — same window
      levelDistribution,
      improvedCount,
    };
    // cutoff30/monthStart are deliberately unused in Phase 1 math but
    // kept here so the TODOs above have a place to grow.
    void cutoff30; void monthStart;
  }, [roster]);

  return { roster, stats, loading };
}
