// FriendlyTeaching.cl — Adaptive placement engine for Daily Practice
//
// Classic computerized-adaptive-test (CAT) flavour:
//   · Start at B1 (middle of the ladder).
//   · After each answer, re-estimate the ceiling the student is passing.
//   · Pick the next question from the level ONE step above the current
//     estimate (to keep probing the ceiling) — unless we've seen enough
//     items at that level, in which case we re-probe one step DOWN to
//     double-check the floor.
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

// ── Current level estimate ─────────────────────────────────
//
// The estimate is the HIGHEST level at which the student has met the
// pass threshold with a meaningful number of answers. If they haven't
// met the threshold anywhere yet, fall back to A0. Returning levels
// honour the PracticeLevels enum.

export function estimateLevel(answers: DPPAnswer[]): PracticeLevel {
  if (answers.length === 0) return 'A0';
  const stats = accuracyByLevel(answers);
  let placed: PracticeLevel = 'A0';
  for (const lvl of LEVEL_SEQUENCE) {
    const r = stats[lvl];
    if (r.answered >= DPP_CONFIG.MIN_QUESTIONS_PER_LEVEL && r.pct >= DPP_CONFIG.PASS_THRESHOLD) {
      placed = lvl;
    }
  }
  return placed;
}

/** Did the estimate PROVE the level, or is it the A0 fallback because
 *  nothing crossed the threshold?
 *
 *  Two guards (both must pass for an early stop):
 *   1. The placed level has ≥ MIN_QUESTIONS_PER_LEVEL answers and
 *      met the pass threshold.
 *   2. The level ABOVE the placed level has been probed at least
 *      MIN_QUESTIONS_PER_LEVEL times too — so we can only "confirm"
 *      a ceiling after honestly trying to break it.
 *      (Francisco incident 2026-11-23: 3 wrong at B2+ out of 3 was
 *      too little signal to declare B2 the ceiling; the engine then
 *      spent the remaining budget re-probing B2 and closed at 25
 *      without ever retrying B2+.)
 *
 *  If the placed level is at the top of the ladder there is no "up"
 *  to probe, so guard 2 is skipped.
 */
export function isPlacementConfirmed(answers: DPPAnswer[]): boolean {
  if (answers.length === 0) return false;
  const stats = accuracyByLevel(answers);
  const placed = estimateLevel(answers);
  const r = stats[placed];
  if (r.answered < DPP_CONFIG.MIN_QUESTIONS_PER_LEVEL) return false;
  if (r.pct < DPP_CONFIG.PASS_THRESHOLD) return false;
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

export function pickNextQuestion(
  answers: DPPAnswer[],
  pool: DPPQuestion[],
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
  // (Francisco incident 2026-11-23). After MIN we switch to the
  // older rule: only keep probing up if the student is actually
  // passing there.
  if (stats[up].answered < DPP_CONFIG.MIN_QUESTIONS_PER_LEVEL ||
      stats[up].pct >= DPP_CONFIG.PASS_THRESHOLD) {
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

  for (const lvl of tryOrder) {
    const fresh = pool.filter((q) => q.level === lvl && !seen.has(q.id));
    if (fresh.length > 0) {
      // Pseudo-random pick, but stable for a given seen-set so the same
      // student sees the same adaptive path if they restart.
      const idx = (answers.length * 1_000_003 + fresh.length) % fresh.length;
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
): boolean {
  if (answers.length >= DPP_CONFIG.MAX_QUESTIONS) return true;
  if (pickNextQuestion(answers, pool) === null) return true;
  return false;
}

/** Final level decision at the end of the session. Same as the running
 *  estimate — the whole adaptive loop converges here. */
export function determineFinalLevel(answers: DPPAnswer[]): PracticeLevel {
  return estimateLevel(answers);
}
