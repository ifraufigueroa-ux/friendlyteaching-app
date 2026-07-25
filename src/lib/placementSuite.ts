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
 *  currentLevel. When the tier's pool is exhausted (revisits during a long
 *  budget can drain small levels like B1+/A0), fall back to the closest
 *  unasked level so we keep serving fresh questions until the whole bank
 *  is drained. Returns null only when every question has been asked. */
export function pickNextAdaptiveQuestion(
  bank: PlacementQuestion[],
  state: AdaptiveState,
): PlacementQuestion | null {
  const draw = (level: LessonLevel): PlacementQuestion | null => {
    const pool = bank.filter(q => q.level === level && !state.askedIds.has(q.id));
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const first = draw(state.currentLevel);
  if (first) return first;

  // Pool exhausted at currentLevel — try adjacent levels, closest first.
  const anchorIdx = LEVEL_ORDER.indexOf(state.currentLevel);
  for (let radius = 1; radius < LEVEL_ORDER.length; radius++) {
    for (const dir of [1, -1] as const) {
      const idx = anchorIdx + dir * radius;
      if (idx < 0 || idx >= LEVEL_ORDER.length) continue;
      const q = draw(LEVEL_ORDER[idx]);
      if (q) return q;
    }
  }
  return null;
}

/** Record an answer and decide what happens next. Returns a NEW state.
 *
 *  The test runs to the full hardCap — we never stop early even when a
 *  "ceiling" is found. The goal is to collect maximum evidence about the
 *  student's level, adjusting the tier as we go.
 *
 *  Transition rules (in order, per question):
 *    1. hardCap reached → done. Placement = highest passed tier (or A0).
 *    2. `advanceOn` consecutive-correct  → move up one tier.
 *    3. `dropOn` consecutive-wrong       → move down one tier.
 *    4. Dominance shortcut: ≥3 in tier + ≥80% pct → move up.
 *    5. `questionsPerTier` reached with no streak → majority decision:
 *         ≥ passThreshold → move up
 *         ≤ failThreshold → move down
 *         otherwise       → move up (marginal)
 *    6. Otherwise → stay at currentLevel.
 *
 *  If we're already at C1 and would "move up" → stay at C1 (collect more
 *  evidence). Same at A0 for "move down". Revisits of tiers we've been to
 *  before are fine — questions aren't repeated because `askedIds` filters
 *  the pool.
 */
export function recordAdaptiveAnswer(
  state: AdaptiveState,
  question: PlacementQuestion,
  answer: PlacementAnswer,
  cfg: AdaptiveConfig,
): AdaptiveState {
  const perTier    = cfg.questionsPerTier ?? 6;
  const advanceOn  = cfg.advanceOn        ?? 4;
  const dropOn     = cfg.dropOn           ?? 3;
  const passT      = cfg.passThreshold    ?? 0.6;
  const failT      = cfg.failThreshold    ?? 0.4;

  const tierAsked   = [...state.tierAsked, question];
  const tierAnswers = [...state.tierAnswers, answer];
  const askedIds    = new Set(state.askedIds); askedIds.add(question.id);
  const totalAsked  = state.totalAsked + 1;

  const consecCorrect = answer.correct ? state.consecCorrectTier + 1 : 0;
  const consecWrong   = answer.correct ? 0 : state.consecWrongTier + 1;

  // Hard cap → we're done. Final placement = highest passed tier.
  if (totalAsked >= cfg.hardCap) {
    const passedNow = new Set(state.passedLevels);
    // Consider the current tier if this final batch already looks passing.
    const finalPct = tierAnswers.filter(a => a.correct).length / tierAnswers.length;
    if (finalPct >= passT) passedNow.add(state.currentLevel);
    return {
      ...state, tierAsked, tierAnswers, askedIds, totalAsked,
      consecCorrectTier: consecCorrect, consecWrongTier: consecWrong,
      passedLevels: passedNow,
      done: true,
      placedLevel: highestPassed(passedNow) ?? state.currentLevel,
    };
  }

  const passed = new Set(state.passedLevels);
  const failed = new Set(state.failedLevels);
  let nextLevel: LessonLevel = state.currentLevel;
  let direction: 'up' | 'down' | 'settle' = state.direction;
  let transitioned = false;

  function moveUp() {
    passed.add(state.currentLevel);
    const up = nextLevelUp(state.currentLevel);
    if (up !== null) { nextLevel = up; direction = 'up'; transitioned = true; }
    // Already at C1 → stay, keep gathering evidence at ceiling.
  }
  function moveDown() {
    failed.add(state.currentLevel);
    const down = nextLevelDown(state.currentLevel);
    if (down !== null) { nextLevel = down; direction = 'down'; transitioned = true; }
    // Already at A0 → stay.
  }

  // 2. Advance streak.
  if (consecCorrect >= advanceOn) {
    moveUp();
  }
  // 3. Drop streak.
  else if (consecWrong >= dropOn) {
    moveDown();
  }
  // 4. Dominance shortcut.
  else if (tierAnswers.length >= 3) {
    const correct = tierAnswers.filter(a => a.correct).length;
    if (correct / tierAnswers.length >= 0.8) moveUp();
  }
  // 5. Reached per-tier cap without a streak → majority decision.
  if (!transitioned && tierAnswers.length >= perTier) {
    const correct = tierAnswers.filter(a => a.correct).length;
    const pct     = correct / tierAnswers.length;
    if (pct >= passT)       moveUp();
    else if (pct <= failT)  moveDown();
    else                    moveUp();  // marginal → pass and try higher
  }

  const placedNow: LessonLevel = highestPassed(passed) ?? state.currentLevel;

  return {
    currentLevel: nextLevel,
    // Reset per-tier state on transition; keep accumulating otherwise.
    tierAsked:    transitioned ? [] : tierAsked,
    tierAnswers:  transitioned ? [] : tierAnswers,
    passedLevels: passed,
    failedLevels: failed,
    askedIds,
    totalAsked,
    consecCorrectTier: transitioned ? 0 : consecCorrect,
    consecWrongTier:   transitioned ? 0 : consecWrong,
    direction,
    done: false,
    placedLevel: placedNow,
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
