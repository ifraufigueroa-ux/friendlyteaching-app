// FriendlyTeaching.cl — Placement suite scoring & aggregation
//
// - `scoreMCQComponent` runs the same section/weak-area scorer as grammar
//   on any bank of PlacementQuestion-shaped items. Vocabulary reuses this
//   directly. Reading uses a small adapter (see scoreReadingComponent).
// - `aggregateSuite` walks the completed components and computes:
//     · per-skill CEFR level
//     · overall placement level = min of skills (standard CEFR practice)
//     · merged weak areas (topic-tagged, ordered worst-first)
//     · 12-week learning program keyed on the overall level

import { Timestamp } from 'firebase/firestore';
import type { LessonLevel } from '@/types/firebase';
import type {
  PlacementAnswer, SectionScore, WeakArea, LearningProgram, PlacementQuestion,
} from '@/types/placement';
import type {
  ComponentId, ComponentResult, PlacementSuiteSession,
  ReadingPassage,
} from '@/types/placement-suite';
import {
  computeSectionScores, determineLevel, computeWeakAreas,
  generateLearningProgram,
} from './placementScoring';

const LEVEL_ORDER: LessonLevel[] = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];

// ── Adaptive Grammar engine ────────────────────────────────────────────────
//
// The runner walks CEFR tiers instead of asking every question linearly.
// - Starts from the bottom (A1) and climbs.
// - Reacts to STREAKS within each tier:
//     · `advanceOn` correct-in-a-row → mark tier passed, move up.
//     · `dropOn` wrong-in-a-row     → mark tier failed, move down.
// - `questionsPerTier` is a hard cap per tier — if we hit it before either
//   streak triggers, we settle on majority (≥ passThreshold = passed).
// - `hardCap` bounds total questions across the whole run.
// - Terminates as soon as a ceiling is found (passed X, failed X+1).

export interface AdaptiveState {
  currentLevel:       LessonLevel;
  tierAsked:          PlacementQuestion[];   // Q's asked at currentLevel
  tierAnswers:        PlacementAnswer[];     // answers at currentLevel
  passedLevels:       Set<LessonLevel>;
  failedLevels:       Set<LessonLevel>;
  askedIds:           Set<number>;
  totalAsked:         number;
  consecCorrectTier:  number;                 // running streak within current tier
  consecWrongTier:    number;
  direction:          'up' | 'down' | 'settle';
  done:               boolean;
  placedLevel:        LessonLevel;
}

export interface AdaptiveConfig {
  hardCap:           number;
  startLevel?:       LessonLevel;   // default 'A1' — climb from the bottom
  questionsPerTier?: number;        // default 5 (safety cap per tier)
  advanceOn?:        number;        // consecutive correct → move up (default 3)
  dropOn?:           number;        // consecutive wrong  → move down (default 3)
  passThreshold?:    number;        // majority pass at questionsPerTier (default 0.6)
  failThreshold?:    number;        // majority fail at questionsPerTier (default 0.4)
}

export function initAdaptiveState(cfg: AdaptiveConfig): AdaptiveState {
  return {
    currentLevel:      cfg.startLevel ?? 'A1',
    tierAsked:         [],
    tierAnswers:       [],
    passedLevels:      new Set(),
    failedLevels:      new Set(),
    askedIds:          new Set(),
    totalAsked:        0,
    consecCorrectTier: 0,
    consecWrongTier:   0,
    direction:         'up',
    done:              false,
    placedLevel:       'A0',
  };
}

/** Pick the next question for the current tier. Random draw from unasked at
 *  currentLevel. Returns null when the pool is exhausted for this level (in
 *  which case the runner should force a tier transition based on partial data). */
export function pickNextAdaptiveQuestion(
  bank: PlacementQuestion[],
  state: AdaptiveState,
): PlacementQuestion | null {
  const pool = bank.filter(q => q.level === state.currentLevel && !state.askedIds.has(q.id));
  if (pool.length === 0) return null;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}

/** Record an answer and decide what happens next. Returns a NEW state.
 *
 *  Transition rules (in order):
 *    1. hardCap reached → done, place at highest passed (or A0).
 *    2. `advanceOn` consecutive-correct at this tier → mark passed, move up.
 *    3. `dropOn` consecutive-wrong at this tier      → mark failed, move down.
 *    4. `questionsPerTier` reached without a streak → decide on majority:
 *         accuracy ≥ passThreshold → passed, up
 *         accuracy ≤ failThreshold → failed, down
 *         otherwise                → count as passed and go up
 *    5. Otherwise → keep asking at currentLevel.
 *
 *  A "ceiling" is found when we've both passed X and failed X+1; at that
 *  point the placement is X (or A0 if we failed A0 outright).
 */
export function recordAdaptiveAnswer(
  state: AdaptiveState,
  question: PlacementQuestion,
  answer: PlacementAnswer,
  cfg: AdaptiveConfig,
): AdaptiveState {
  const perTier    = cfg.questionsPerTier ?? 5;
  const advanceOn  = cfg.advanceOn        ?? 3;
  const dropOn     = cfg.dropOn           ?? 3;
  const passT      = cfg.passThreshold    ?? 0.6;
  const failT      = cfg.failThreshold    ?? 0.4;

  const tierAsked   = [...state.tierAsked, question];
  const tierAnswers = [...state.tierAnswers, answer];
  const askedIds    = new Set(state.askedIds); askedIds.add(question.id);
  const totalAsked  = state.totalAsked + 1;

  const consecCorrect = answer.correct ? state.consecCorrectTier + 1 : 0;
  const consecWrong   = answer.correct ? 0 : state.consecWrongTier + 1;

  // Hard cap → commit to whatever is highest so far.
  if (totalAsked >= cfg.hardCap) {
    const placed = highestPassed(state.passedLevels) ?? state.currentLevel;
    return {
      ...state, tierAsked, tierAnswers, askedIds, totalAsked,
      consecCorrectTier: consecCorrect, consecWrongTier: consecWrong,
      done: true, placedLevel: placed,
    };
  }

  // Helper: transition to nextLevel (or terminate) after passing or failing.
  const passed = new Set(state.passedLevels);
  const failed = new Set(state.failedLevels);
  let nextLevel: LessonLevel = state.currentLevel;
  let direction: 'up' | 'down' | 'settle' = state.direction;
  let done = false;
  let placed: LessonLevel = state.placedLevel;
  let decided = false;

  function transitionPass() {
    decided = true;
    passed.add(state.currentLevel);
    const up = nextLevelUp(state.currentLevel);
    if (up === null) { done = true; placed = 'C1'; }
    else if (failed.has(up)) { done = true; placed = state.currentLevel; }
    else { nextLevel = up; direction = 'up'; }
  }
  function transitionFail() {
    decided = true;
    failed.add(state.currentLevel);
    // If we came UP into a level and crashed here, settle at the highest passed.
    if (state.direction === 'up' && passed.size > 0) {
      done = true; placed = highestPassed(passed) ?? 'A0';
      return;
    }
    const down = nextLevelDown(state.currentLevel);
    if (down === null) { done = true; placed = 'A0'; }
    else if (passed.has(down)) { done = true; placed = down; }
    else { nextLevel = down; direction = 'down'; }
  }

  // 2. Advance streak.
  if (consecCorrect >= advanceOn) {
    transitionPass();
  }
  // 3. Drop streak.
  else if (consecWrong >= dropOn) {
    transitionFail();
  }
  // 4. Dominance shortcut: strong performance early. If we're at ≥3 answers
  //    in this tier and running ≥80% accuracy, we've seen enough — advance
  //    without waiting for a 4-in-a-row streak. Prevents a single fluke
  //    wrong (right, right, right, WRONG, right) from resetting to 0 streak.
  else if (tierAnswers.length >= 3) {
    const correct = tierAnswers.filter(a => a.correct).length;
    if (correct / tierAnswers.length >= 0.8) transitionPass();
  }
  // 5. Reached per-tier cap → decide on majority.
  if (!decided && tierAnswers.length >= perTier) {
    const correct = tierAnswers.filter(a => a.correct).length;
    const pct     = correct / tierAnswers.length;
    if (pct >= passT)       transitionPass();
    else if (pct <= failT)  transitionFail();
    else                    transitionPass();  // marginal → pass and try higher
  }

  // 5. Not decided → keep asking at the same tier.
  if (!decided) {
    return {
      ...state, tierAsked, tierAnswers, askedIds, totalAsked,
      consecCorrectTier: consecCorrect, consecWrongTier: consecWrong,
    };
  }

  return {
    currentLevel:      nextLevel,
    tierAsked:         done ? tierAsked : [],
    tierAnswers:       done ? tierAnswers : [],
    passedLevels:      passed,
    failedLevels:      failed,
    askedIds,
    totalAsked,
    // Reset per-tier streaks on transition.
    consecCorrectTier: done ? consecCorrect : 0,
    consecWrongTier:   done ? consecWrong   : 0,
    direction,
    done,
    placedLevel:       done ? placed : highestPassed(passed) ?? 'A0',
  };
}

function nextLevelUp(level: LessonLevel): LessonLevel | null {
  const idx = LEVEL_ORDER.indexOf(level);
  if (idx < 0 || idx === LEVEL_ORDER.length - 1) return null;
  return LEVEL_ORDER[idx + 1];
}

function nextLevelDown(level: LessonLevel): LessonLevel | null {
  const idx = LEVEL_ORDER.indexOf(level);
  if (idx <= 0) return null;
  return LEVEL_ORDER[idx - 1];
}

function highestPassed(passed: Set<LessonLevel>): LessonLevel | null {
  for (let i = LEVEL_ORDER.length - 1; i >= 0; i--) {
    if (passed.has(LEVEL_ORDER[i])) return LEVEL_ORDER[i];
  }
  return null;
}

// ── Level-window helpers (Vocab + Reading calibration) ────────────────────

/** Levels within ±1 of the anchor, clipped to the CEFR scale. */
export function levelWindow(anchor: LessonLevel, radius = 1): LessonLevel[] {
  const idx = LEVEL_ORDER.indexOf(anchor);
  if (idx < 0) return LEVEL_ORDER;
  const from = Math.max(0, idx - radius);
  const to   = Math.min(LEVEL_ORDER.length - 1, idx + radius);
  return LEVEL_ORDER.slice(from, to + 1);
}

export function pickCalibratedQuestions(
  bank: PlacementQuestion[],
  anchor: LessonLevel,
  budget: number,
): PlacementQuestion[] {
  const window = new Set(levelWindow(anchor));
  const inWindow = bank.filter(q => window.has(q.level));
  // Fallback: if the window has fewer than the budget, top up from adjacent
  // levels so we always ask `budget` questions.
  let pool = inWindow;
  if (pool.length < budget) {
    const rest = bank.filter(q => !window.has(q.level));
    pool = [...pool, ...rest];
  }
  // Shuffle then take `budget`.
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, budget);
}

export function pickCalibratedPassages(
  passages: ReadingPassage[],
  anchor: LessonLevel,
  budget: number,
): ReadingPassage[] {
  const window = new Set(levelWindow(anchor));
  const inWindow = passages.filter(p => window.has(p.level));
  let pool = inWindow.length >= budget ? inWindow : [
    ...inWindow,
    ...passages.filter(p => !window.has(p.level)),
  ];
  // Sort by proximity to anchor so the closest-level passages come first.
  const anchorIdx = LEVEL_ORDER.indexOf(anchor);
  pool = [...pool].sort((a, b) => {
    const da = Math.abs(LEVEL_ORDER.indexOf(a.level) - anchorIdx);
    const db = Math.abs(LEVEL_ORDER.indexOf(b.level) - anchorIdx);
    return da - db;
  });
  return pool.slice(0, budget);
}

function minLevel(levels: LessonLevel[]): LessonLevel {
  if (levels.length === 0) return 'A0';
  let idx = LEVEL_ORDER.length - 1;
  for (const l of levels) {
    const i = LEVEL_ORDER.indexOf(l);
    if (i >= 0 && i < idx) idx = i;
  }
  return LEVEL_ORDER[idx];
}

// ── Component scorers ──────────────────────────────────────────────────────

/** Grammar and Vocabulary both fit the PlacementAnswer shape 1:1. */
export function scoreMCQComponent(
  componentId: ComponentId,
  answers: PlacementAnswer[],
  startedAt: Date,
  completedAt: Date,
  extras?: { stopped?: boolean; stoppedAtQ?: number },
): ComponentResult {
  const sectionScores = computeSectionScores(answers);
  const placedLevel   = determineLevel(sectionScores);
  const weakAreas     = computeWeakAreas(answers);
  const totalCorrect  = answers.filter(a => a.correct).length;

  return {
    componentId,
    answers,
    totalAnswered: answers.length,
    totalCorrect,
    sectionScores,
    weakAreas,
    placedLevel,
    stopped:    extras?.stopped,
    stoppedAtQ: extras?.stoppedAtQ,
    startedAt:  Timestamp.fromDate(startedAt),
    completedAt: Timestamp.fromDate(completedAt),
  };
}

/** Reading = one or more passages; each question's level tag drives the
 *  section score just like grammar/vocab. Topic is set to the question type
 *  so weak-area reporting groups by "detail", "inference", etc. */
export function scoreReadingComponent(
  passages: ReadingPassage[],
  answers: PlacementAnswer[],
  startedAt: Date,
  completedAt: Date,
): ComponentResult {
  return scoreMCQComponent('reading', answers, startedAt, completedAt);
}

// ── Aggregation ────────────────────────────────────────────────────────────

/** Weight per component when computing the overall level. Grammar is the
 *  primary anchor (calibrates the other components), so it counts double.
 *  Skills that ship in later phases carry weight 1 as well. */
const OVERALL_WEIGHT: Record<ComponentId, number> = {
  grammar:    2,
  vocabulary: 1,
  reading:    1,
  listening:  1,
  writing:    1,
  speaking:   1,
};

/** Given a partially-populated results record, compute the derived fields
 *  the results view and the PDF export need. Safe to call at any point in
 *  the run (returns partial results if only some components are complete).
 *
 *  Overall level is a WEIGHTED VOTE across component placements — not the
 *  min-of-skills. In practice this matters when a shaky Grammar tier drags
 *  down strong Vocab/Reading (or vice versa): weighted average survives one
 *  outlier per component without either promoting a genuinely-weak student
 *  or burying a strong one. */
export function aggregateSuite(
  results: Partial<Record<ComponentId, ComponentResult>>,
): {
  perSkillLevel: Partial<Record<ComponentId, LessonLevel>>;
  overallLevel:  LessonLevel;
  mergedWeakAreas: WeakArea[];
  learningProgram: LearningProgram;
} {
  const perSkillLevel: Partial<Record<ComponentId, LessonLevel>> = {};
  let weightSum = 0;
  let scoreSum  = 0;

  for (const [cid, res] of Object.entries(results)) {
    if (!res) continue;
    const id = cid as ComponentId;
    perSkillLevel[id] = res.placedLevel;
    const w = OVERALL_WEIGHT[id] ?? 1;
    const idx = LEVEL_ORDER.indexOf(res.placedLevel);
    if (idx < 0) continue;
    weightSum += w;
    scoreSum  += idx * w;
  }

  const avgIdx = weightSum > 0 ? scoreSum / weightSum : 0;
  const overallLevel: LessonLevel = LEVEL_ORDER[Math.round(avgIdx)] ?? 'A0';

  // Merge weak areas across components. Same topic in multiple components
  // gets its counts summed so the percentage reflects total exposure.
  const byTopic: Record<string, { total: number; correct: number }> = {};
  for (const res of Object.values(results)) {
    if (!res) continue;
    for (const w of res.weakAreas) {
      if (!byTopic[w.topic]) byTopic[w.topic] = { total: 0, correct: 0 };
      byTopic[w.topic].total   += w.total;
      byTopic[w.topic].correct += w.correct;
    }
  }
  const mergedWeakAreas: WeakArea[] = Object.entries(byTopic)
    .map(([topic, b]) => ({
      topic: topic as WeakArea['topic'],
      total: b.total,
      correct: b.correct,
      pct: b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0,
    }))
    .sort((a, b) => a.pct - b.pct);

  const learningProgram = generateLearningProgram(overallLevel, mergedWeakAreas);

  return { perSkillLevel, overallLevel, mergedWeakAreas, learningProgram };
}

// ── Session status derivation ──────────────────────────────────────────────

export function deriveSuiteStatus(
  requested: ComponentId[],
  progress: PlacementSuiteSession['progress'],
): PlacementSuiteSession['status'] {
  const done = requested.filter(c => progress[c] === 'completed').length;
  if (done === 0) return 'in_progress';
  if (done === requested.length) return 'completed';
  return 'partially_completed';
}
