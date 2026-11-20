// FriendlyTeaching.cl — Bridge the placement scorer and Daily Practice.
//
// Placement scoring returns a LessonLevel from the full CEFR ladder the
// lesson library uses: A0 | A1 | A2 | B1 | B1+ | B2 | C1. Daily Practice
// tracks its own narrower ladder today: A0 | A1 | A2 | B1 | B2 | B2+.
// This util maps a placed level to the Daily Practice level it should
// land on, and picks the first unit of that level so the student lands
// on a concrete workout instead of a bare "level is X" state.

import type { LessonLevel } from '@/types/firebase';
import type { PracticeLevel } from '@/types/practice';
import { unitsByLevel } from '@/lib/data/practice/general-english';

/** Fold the two ladders:
 *   B1+  → B1  (next Daily Practice level is B2; we keep them a notch below
 *                until the C1 content ships)
 *   C1   → B2+ (the top of what Daily Practice covers today)
 *   everything else maps one-to-one.
 */
export function placementToPracticeLevel(placed: LessonLevel): PracticeLevel {
  switch (placed) {
    case 'A0': return 'A0';
    case 'A1': return 'A1';
    case 'A2': return 'A2';
    case 'B1': return 'B1';
    case 'B1+': return 'B1';
    case 'B2': return 'B2';
    case 'C1': return 'B2+';
  }
}

/** First unit id for the given Daily Practice level, or null when the
 *  level has no units yet (content pass still pending for C1-adjacent). */
export function firstUnitIdForLevel(level: PracticeLevel): string | null {
  const grouped = unitsByLevel();
  const row = grouped[level] ?? [];
  return row[0]?.id ?? null;
}
