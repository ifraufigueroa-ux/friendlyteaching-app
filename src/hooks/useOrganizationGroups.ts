// FriendlyTeaching.cl — useOrganizationGroups
//
// Live list of `organizations/{orgId}/groups`. Returns the groups plus
// a helper that bundles each one with the RosterEntry objects of its
// members (so the dashboard can show per-group aggregates without a
// second fetch). Unassigned members land in the synthetic "__ungrouped"
// bucket so the UI can still surface them under a "Sin grupo" section.

'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  collection, onSnapshot, type QuerySnapshot, type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { OrgGroup, GroupStats, RosterEntry } from '@/types/organization';
import type { LessonLevel } from '@/types/firebase';

/** Synthetic group id for members who don't belong to any real group. */
export const UNGROUPED_ID = '__ungrouped';

export function useOrganizationGroups(orgId: string | null | undefined) {
  const [groups, setGroups] = useState<OrgGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) {
      setGroups([]);
      setLoading(false);
      return;
    }
    const ref = collection(db, 'organizations', orgId, 'groups');
    const unsub = onSnapshot(ref,
      (snap: QuerySnapshot<DocumentData>) => {
        const list = snap.docs.map(
          (d: QueryDocumentSnapshot<DocumentData>) =>
            ({ id: d.id, ...d.data() } as OrgGroup),
        );
        // Deterministic order: by day-of-week then hour, then name.
        list.sort((a, b) => {
          const da = a.dayOfWeek ?? 99;
          const dbb = b.dayOfWeek ?? 99;
          if (da !== dbb) return da - dbb;
          const ha = a.hour ?? 99;
          const hb = b.hour ?? 99;
          if (ha !== hb) return ha - hb;
          return (a.name ?? '').localeCompare(b.name ?? '', 'es');
        });
        setGroups(list);
        setLoading(false);
      },
      (err: Error) => {
        console.warn('[useOrganizationGroups] listener error:', err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [orgId]);

  return { groups, loading };
}

// ─── Stats + bundles ─────────────────────────────────────────────

/** A group with its members' RosterEntry pre-attached and stats computed. */
export interface GroupBundle {
  group:   OrgGroup;
  members: RosterEntry[];
  stats:   GroupStats;
}

/** Builds the per-group bundles from a flat roster. Unassigned members
 *  land in a synthetic "__ungrouped" bundle so the UI can show them
 *  below the real groups. The synthetic bundle is only returned when it
 *  actually has members. */
export function useGroupBundles(
  groups: OrgGroup[],
  roster: RosterEntry[],
): GroupBundle[] {
  return useMemo(() => {
    const byUid = new Map(roster.map(r => [r.uid, r]));
    const assigned = new Set<string>();

    const bundles: GroupBundle[] = groups.map(g => {
      const members = (g.memberUids ?? [])
        .map(uid => { assigned.add(uid); return byUid.get(uid); })
        .filter((r): r is RosterEntry => !!r);
      return { group: g, members, stats: aggregate(members) };
    });

    const ungrouped = roster.filter(r => !assigned.has(r.uid));
    if (ungrouped.length) {
      bundles.push({
        group: synthUngrouped(),
        members: ungrouped,
        stats: aggregate(ungrouped),
      });
    }
    return bundles;
  }, [groups, roster]);
}

function aggregate(members: RosterEntry[]): GroupStats {
  const size = members.length;
  const activeLast30Days = members.filter(m => m.classesLast30Days > 0).length;
  const classesLast30Days = members.reduce((s, m) => s + m.classesLast30Days, 0);
  const practiceActive = members.filter(m => m.practiceStreak > 0).length;

  // Weighted mean attendance — members with no recent classes contribute
  // 0% weight so an inactive member doesn't drag the number down.
  const withClasses = members.filter(m => m.classesLast30Days > 0);
  const attendancePct = withClasses.length
    ? Math.round(
        withClasses.reduce((s, m) => s + m.attendancePct, 0) / withClasses.length,
      )
    : 0;

  const levelDistribution: Record<string, number> = {};
  for (const m of members) {
    const key: LessonLevel | 'unknown' = m.currentLevel ?? 'unknown';
    levelDistribution[key] = (levelDistribution[key] ?? 0) + 1;
  }

  return {
    size, activeLast30Days, classesLast30Days,
    attendancePct, practiceActive, levelDistribution,
  };
}

function synthUngrouped(): OrgGroup {
  return {
    id:         UNGROUPED_ID,
    orgId:      '',
    name:       'Sin grupo',
    level:      null,
    dayOfWeek:  null,
    hour:       null,
    memberUids: [],
    // Firestore types expect a Timestamp here; we don't render it for
    // the synthetic bundle so it's safe to cheat and assert.
    createdAt:  undefined as unknown as OrgGroup['createdAt'],
  };
}
