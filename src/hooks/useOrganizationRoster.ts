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
import type {
  Organization, RosterEntry, OrganizationStats, WeeklyAttendance, OrgGroup,
} from '@/types/organization';

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
  const firstPlacement  = placements[placements.length - 1] ?? null;

  // Last 12 weeks of attendance, keyed by the Monday of each week.
  const weeklyHistory = buildWeeklyHistory(bookings, 12);

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
    firstPlacementLevel: firstPlacement?.level ?? null,
    firstPlacementAt:    tsToDateStr(firstPlacement?.completedAt ?? firstPlacement?.createdAt ?? null),
    weeklyHistory,
  };
}

/** Yields the Monday of a given date (00:00 local). */
function mondayOf(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  const day = out.getDay();                  // 0 = Sun, 1 = Mon…
  const diff = day === 0 ? -6 : 1 - day;
  out.setDate(out.getDate() + diff);
  return out;
}

/** Turns a flat list of bookings into one entry per week for the last N
 *  weeks (oldest → newest). Each week is 'attended', 'absent' or 'none'
 *  depending on whether the student had a booking there and how it was
 *  marked. When multiple bookings fall in the same week the harsher
 *  signal wins ('absent' beats 'attended' so no-shows aren't buried). */
function buildWeeklyHistory(bookings: Booking[], weeks: number): WeeklyAttendance[] {
  const thisMonday = mondayOf(new Date());
  const buckets: WeeklyAttendance[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const d = new Date(thisMonday);
    d.setDate(d.getDate() - w * 7);
    buckets.push({ weekStart: tsToDateStr(Timestamp.fromDate(d)) ?? '', result: 'none' });
  }
  const idxByWeek = new Map(buckets.map((b, i) => [b.weekStart, i]));

  for (const b of bookings) {
    if (!b.weekStart) continue;
    const key = tsToDateStr(b.weekStart) ?? '';
    const i = idxByWeek.get(key);
    if (i === undefined) continue;
    const next: WeeklyAttendance['result'] =
      b.attendance === 'absent' ? 'absent'
      : b.attendance === 'attended' ? 'attended'
      : b.status === 'completed' ? 'attended'
      : b.status === 'cancelled' ? 'absent'
      : buckets[i].result;
    // Absent always wins over attended so no-shows aren't hidden.
    if (buckets[i].result === 'absent') continue;
    if (next === 'absent') buckets[i].result = 'absent';
    else if (buckets[i].result === 'none') buckets[i].result = next;
  }
  return buckets;
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

// ─── Impact (program-level narrative stats) ─────────────────────
//
// The operational numbers (empleados activos, clases 30d) describe
// delivery. These describe OUTCOMES — what Carolina shows upward: who
// moved up a CEFR band, how many hours we delivered, how engaged the
// team stays outside of class, and how broadly the program covers
// the week.

const CEFR_RANK: Record<LessonLevel, number> = {
  A0: 0, A1: 1, A2: 2, B1: 3, 'B1+': 3.5, B2: 4, C1: 5,
};

export interface OrgImpact {
  /** Employees whose currentLevel is higher (CEFR-wise) than their
   *  FIRST recorded placement. The "subió de nivel" count. */
  levelUpCount:          number;
  levelUpNames:          string[];
  /** Person-hours of class delivered in the last 30 days (sum of
   *  attended bookings across the roster — each class ≈ 1h). */
  personHours30d:        number;
  /** Members with an active Daily Practice streak this week. */
  practiceActiveCount:   number;
  practiceActivePct:     number;
  /** How many distinct weekdays the program runs on (1–7). */
  weekdayCoverage:       number;
  groupCount:            number;
}

export function computeOrgImpact(
  roster: RosterEntry[],
  groups: OrgGroup[],
): OrgImpact {
  const rank = (lvl: LessonLevel | null): number =>
    lvl ? (CEFR_RANK[lvl] ?? -1) : -1;

  const levelUpStudents = roster.filter(r => {
    const from = rank(r.firstPlacementLevel);
    const to   = rank(r.currentLevel);
    return from >= 0 && to > from;
  });

  const personHours30d = roster.reduce((s, r) => s + r.classesLast30Days, 0);
  const practiceActiveCount = roster.filter(r => r.practiceStreak > 0).length;
  const practiceActivePct = roster.length > 0
    ? Math.round((practiceActiveCount / roster.length) * 100)
    : 0;
  const weekdayCoverage = new Set(
    groups.map(g => g.dayOfWeek).filter((d): d is number => d != null),
  ).size;

  return {
    levelUpCount:        levelUpStudents.length,
    levelUpNames:        levelUpStudents.map(s => s.fullName),
    personHours30d,
    practiceActiveCount,
    practiceActivePct,
    weekdayCoverage,
    groupCount:          groups.length,
  };
}
