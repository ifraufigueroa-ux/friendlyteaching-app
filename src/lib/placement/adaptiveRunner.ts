// FriendlyTeaching.cl — Adaptive placement engine for Daily Practice
//
// Classic computerized-adaptive-test (CAT) flavour:
//   · Start at B1 (middle of the ladder).
//   · After each answer, re-estimate the ceiling the student is passing.
//   · Pick the next question from the level ONE step above the current
//     estimate (to keep probing the ceiling) — unless we've seen enough
//     items at that level, in which case we re-probe one step DOWN to
//     double-check the floor.
//   · Order of questions WITHIN a level is pseudo-random with a
//     per-session seed so two retakes never see the same sequence —
//     stops students from memorising a fixed trail.
//   · Stop early when the estimate has been stable for N answers AND
//     we've past the min-question floor. Hard cap at 50.

import {
  PRACTICE_LEVELS, LEVEL_ORDER,
  type PracticeLevel,
} from '@/types/practice';
import {
  DPP_CONFIG,
  type DPPAnswer, type DPPQuestion,
} from '@/types/daily-practice-placement';

// ── Primitives ─────────────────────────────────────────────

const LEVEL_SEQUENCE: PracticeLevel[] =
  [...PRACTICE_LEVELS].sort((a, b) => LEVEL_ORDER[a] - LEVEL_ORDER[b]);

function levelUp(l: PracticeLevel): PracticeLevel {
  const i = LEVEL_SEQUENCE.indexOf(l);
  return LEVEL_SEQUENCE[Math.min(i + 1, LEVEL_SEQUENCE.length - 1)];
}
function levelDown(l: PracticeLevel): PracticeLevel {
  const i = LEVEL_SEQUENCE.indexOf(l);
  return LEVEL_SEQUENCE[Math.max(i - 1, 0)];
}

// Small, stable string hash so the seeded picker is reproducible across
// re-renders (React re-computes useMemo deps, Firestore re-emits the
// session doc after every write). Same seed + same `answers.length` →
// same question, so the student never sees the question swap mid-view.
function hashSeed(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ── Per-level accuracy summary ─────────────────────────────

export function accuracyByLevel(answers: DPPAnswer[]) {
  const by: Record<string, { answered: number; correct: number; pct: number }> = {};
  for (const lvl of LEVEL_SEQUENCE) by[lvl] = { answered: 0, correct: 0, pct: 0 };
  for (const a of answers) {
    const row = by[a.level];
    if (!row) continue;
    row.answered++;
    if (a.correct) row.correct++;
  }
  for (const lvl of LEVEL_SEQUENCE) {
    const r = by[lvl];
    r.pct = r.answered > 0 ? r.correct / r.answered : 0;
  }
  return by as Record<PracticeLevel, { answered: number; correct: number; pct: number }>;
}

// ── Mastery helpers (two-threshold model) ──────────────────

/** Highest level where pct ≥ MASTERED_THRESHOLD with enough answers.
 *  This is the floor of the placement — the ceiling the student has
 *  clearly earned. A0 is the fallback when nothing has been mastered. */
export function highestMasteredLevel(answers: DPPAnswer[]): PracticeLevel {
  if (answers.length === 0) return 'A0';
  const stats = accuracyByLevel(answers);
  let placed: PracticeLevel = 'A0';
  for (const lvl of LEVEL_SEQUENCE) {
    const r = stats[lvl];
    if (r.answered >= DPP_CONFIG.MIN_QUESTIONS_PER_LEVEL && r.pct >= DPP_CONFIG.MASTERED_THRESHOLD) {
      placed = lvl;
    }
  }
  return placed;
}

/** Highest level where pct ≥ PARTIAL_THRESHOLD with enough answers.
 *  Used to decide whether to bridge the student UP one notch from the
 *  mastered floor, and to keep probing above the mastered ceiling
 *  during the test. */
export function highestPartialLevel(answers: DPPAnswer[]): PracticeLevel {
  if (answers.length === 0) return 'A0';
  const stats = accuracyByLevel(answers);
  let placed: PracticeLevel = 'A0';
  for (const lvl of LEVEL_SEQUENCE) {
    const r = stats[lvl];
    if (r.answered >= DPP_CONFIG.MIN_QUESTIONS_PER_LEVEL && r.pct >= DPP_CONFIG.PARTIAL_THRESHOLD) {
      placed = lvl;
    }
  }
  return placed;
}

// ── Current level estimate ─────────────────────────────────
//
// The "estimate" shown to the student mid-test is the highest level
// they are currently showing meaningful command of (partial or above).
// Using the PARTIAL threshold here (rather than MASTERED) keeps the
// engine probing the next level UP once the student is scoring well
// above chance — so a student at 55% B1 gets more B2 exposure instead
// of being dragged back down to A2.

export function estimateLevel(answers: DPPAnswer[]): PracticeLevel {
  if (answers.length === 0) return 'A0';
  // When we have signal, use the partial-command estimate so probing
  // continues upward through the "emerging" band. Falls back to the
  // mastered floor if partial hasn't been reached anywhere.
  const partial = highestPartialLevel(answers);
  if (partial !== 'A0') return partial;
  return highestMasteredLevel(answers);
}

/** Did the estimate PROVE the level, or is it the A0 fallback because
 *  nothing crossed the threshold?
 *
 *  Two guards (both must pass for an early stop):
 *   1. The placed level has ≥ MIN_QUESTIONS_PER_LEVEL answers and
 *      met the mastered threshold.
 *   2. The level ABOVE the placed level has been probed at least
 *      MIN_QUESTIONS_PER_LEVEL times too — so we can only "confirm"
 *      a ceiling after honestly trying to break it.
 *
 *  If the placed level is at the top of the ladder there is no "up"
 *  to probe, so guard 2 is skipped.
 */
export function isPlacementConfirmed(answers: DPPAnswer[]): boolean {
  if (answers.length === 0) return false;
  const stats = accuracyByLevel(answers);
  const placed = highestMasteredLevel(answers);
  const r = stats[placed];
  if (r.answered < DPP_CONFIG.MIN_QUESTIONS_PER_LEVEL) return false;
  if (r.pct < DPP_CONFIG.MASTERED_THRESHOLD) return false;
  const up = levelUp(placed);
  if (up !== placed) {
    const upStats = stats[up];
    if (upStats.answered < DPP_CONFIG.MIN_QUESTIONS_PER_LEVEL) return false;
  }
  return true;
}

// ── Next question selector ─────────────────────────────────
//
// Returns the next question to show, or null when the pool for every
// relevant level is exhausted. The caller is responsible for honouring
// shouldStop() first — the selector itself will happily keep handing
// out questions until the pool runs dry.
//
// The optional `seed` parameter (uid + startedAt, in practice) breaks
// the determinism that made every retake show the same questions in
// the same order. Same seed is stable within a session (so re-renders
// and resumes don't swap the current question out from under the
// student) but different students, and the same student on a retake
// with a fresh startedAt, see a different trail.

export function pickNextQuestion(
  answers: DPPAnswer[],
  pool: DPPQuestion[],
  seed?: string,
): DPPQuestion | null {
  const seen = new Set(answers.map((a) => a.questionId));
  const stats = accuracyByLevel(answers);
  const current = answers.length === 0
    ? DPP_CONFIG.STARTING_LEVEL
    : estimateLevel(answers);

  // Priority order of levels to probe. If the student is doing well,
  // we probe up to find the ceiling. If they haven't established a
  // floor yet, probe down.
  const tryOrder: PracticeLevel[] = [];
  const up = levelUp(current);
  const down = levelDown(current);

  // Primary probe — one level up. Keep probing UP unconditionally
  // until we've seen MIN_QUESTIONS_PER_LEVEL answers there, so a
  // small streak of bad topic luck can't close the ceiling too early
  // (Francisco incident 2026-11-23). After MIN we switch to: keep
  // probing up if the student is at least at the PARTIAL threshold
  // there — anything above random chance earns another look at the
  // next band up.
  if (stats[up].answered < DPP_CONFIG.MIN_QUESTIONS_PER_LEVEL ||
      stats[up].pct >= DPP_CONFIG.PARTIAL_THRESHOLD) {
    tryOrder.push(up);
  }
  // Re-probe the current level to tighten the signal.
  tryOrder.push(current);
  // Fallback: confirm the level below (catches brittle "passes").
  tryOrder.push(down);
  // Fallback over all remaining levels, closest to current first.
  for (const lvl of LEVEL_SEQUENCE) {
    if (!tryOrder.includes(lvl)) tryOrder.push(lvl);
  }

  const seedN = seed ? hashSeed(seed) : 0;

  for (const lvl of tryOrder) {
    const fresh = pool.filter((q) => q.level === lvl && !seen.has(q.id));
    if (fresh.length > 0) {
      // Seeded pseudo-random pick. Stable within a session (so
      // re-renders mid-question don't swap the question), but a
      // different seed per session (different uid + startedAt) means
      // retakes see a different order — the memorisation loophole is
      // closed. We also xor in a per-level offset so two levels drawn
      // on the same answers.length index don't collide to the same
      // pool slot.
      const levelOffset = hashSeed(lvl);
      const idx = ((seedN ^ levelOffset) + answers.length * 1_000_003) % fresh.length;
      return fresh[idx];
    }
  }
  return null;
}

// ── Stop decisions ─────────────────────────────────────────

/** Should we end the session? Only two ways out now:
 *   · pool exhausted (no more fresh questions anywhere)
 *   · hit the hard cap (MAX_QUESTIONS)
 *
 *  Design decision (2026-11-23): the placement test always runs to
 *  the hard cap so the teacher gets maximum diagnostic signal on
 *  every student — not just a placed level, but the whole shape of
 *  their grammar strengths and gaps per CEFR band. The pool was
 *  expanded to 30/level precisely so even students oscillating
 *  between two neighbouring levels never exhaust it before 50.
 *
 *  The older "stable estimate + isPlacementConfirmed" early-stop is
 *  retained in the module (isPlacementConfirmed still exports) so
 *  other parts of the app can read whether the placement is settled,
 *  but it no longer gates termination.
 */
export function shouldStop(
  answers: DPPAnswer[],
  pool: DPPQuestion[],
  seed?: string,
): boolean {
  if (answers.length >= DPP_CONFIG.MAX_QUESTIONS) return true;
  if (pickNextQuestion(answers, pool, seed) === null) return true;
  return false;
}

/** Final level decision at the end of the session.
 *
 *  Two-threshold "bridge-up" rule (introduced 2026-11-25):
 *   1. Floor = highest level with pct ≥ MASTERED_THRESHOLD and
 *      ≥ MIN_QUESTIONS_PER_LEVEL answers.
 *   2. If the level ABOVE the floor shows pct ≥ PARTIAL_THRESHOLD
 *      with ≥ MIN_QUESTIONS_PER_LEVEL answers → place at that higher
 *      level. The student is "emerging" there and will learn more
 *      starting from the harder band than from re-drilling the floor.
 *   3. Otherwise → place at the floor.
 *
 *  Example that motivated this change: student scores 80% at A1/A2
 *  and 50% at B1/B2. Old rule (single 0.6 threshold) placed them at
 *  A2. New rule places them at B1: mastered floor A2, partial B1 →
 *  bridge up by one. B2 is also partial but it's two notches above
 *  the mastered floor, which is too aggressive from a 50% signal. */
export function determineFinalLevel(answers: DPPAnswer[]): PracticeLevel {
  if (answers.length === 0) return 'A0';
  const floor = highestMasteredLevel(answers);
  const up = levelUp(floor);
  if (up === floor) return floor; // already at top
  const stats = accuracyByLevel(answers);
  const upStats = stats[up];
  if (upStats.answered >= DPP_CONFIG.MIN_QUESTIONS_PER_LEVEL &&
      upStats.pct      >= DPP_CONFIG.PARTIAL_THRESHOLD) {
    return up;
  }
  return floor;
}
