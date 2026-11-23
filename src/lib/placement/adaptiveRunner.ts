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
 *  nothing crossed the threshold? The runner uses this to decide
 *  whether an early-stop is justified — a student who's been failing
 *  everywhere has an A0 "placement" by default, but we still want to
 *  keep collecting data so the teacher sees the whole shape of what
 *  the student does / doesn't know. */
export function isPlacementConfirmed(answers: DPPAnswer[]): boolean {
  if (answers.length === 0) return false;
  const stats = accuracyByLevel(answers);
  const placed = estimateLevel(answers);
  const r = stats[placed];
  return r.answered >= DPP_CONFIG.MIN_QUESTIONS_PER_LEVEL
      && r.pct >= DPP_CONFIG.PASS_THRESHOLD;
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

  // Primary probe — one level up, unless we've already asked a lot there
  // and the pass rate is clearly below threshold (already failing it).
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

/** Should we end the session? Three ways out:
 *   · pool exhausted (no more fresh questions anywhere)
 *   · hit the hard cap
 *   · estimate stable for N, past the min floor, AND the placement
 *     is actually CONFIRMED (not the A0 fallback).
 *
 *  The confirmed-placement guard is what keeps a struggling student
 *  on the test: a student failing everywhere has estimate=A0 by
 *  fallback, which looks "stable" but tells us nothing about the floor.
 *  In that case we keep going until the hard cap so the teacher sees
 *  the full distribution of what the student knows.
 */
export function shouldStop(
  answers: DPPAnswer[],
  pool: DPPQuestion[],
): boolean {
  if (answers.length >= DPP_CONFIG.MAX_QUESTIONS) return true;
  if (pickNextQuestion(answers, pool) === null) return true;
  if (answers.length < DPP_CONFIG.MIN_QUESTIONS_BEFORE_EARLY_STOP) return false;
  if (!isPlacementConfirmed(answers)) return false;

  // Stable estimate check — re-estimate at each of the last N answers;
  // if every re-estimate agrees, we're confident.
  const n = DPP_CONFIG.STABLE_ANSWERS_FOR_EARLY_STOP;
  if (answers.length < n) return false;
  const latest = estimateLevel(answers);
  for (let cut = 1; cut < n; cut++) {
    const prefix = answers.slice(0, answers.length - cut);
    if (estimateLevel(prefix) !== latest) return false;
  }
  return true;
}

/** Final level decision at the end of the session. Same as the running
 *  estimate — the whole adaptive loop converges here. */
export function determineFinalLevel(answers: DPPAnswer[]): PracticeLevel {
  return estimateLevel(answers);
}
