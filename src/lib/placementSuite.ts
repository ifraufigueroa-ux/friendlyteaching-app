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
// Config:
//   - startLevel:       where the first tier begins (default 'A2')
//   - questionsPerTier: how many Q's to sample at each tier before deciding
//   - passThreshold:    fraction correct to move up (default 0.6)
//   - failThreshold:    fraction correct below which we drop (default 0.4)
//   - hardCap:          absolute max Q's asked across all tiers (from budget)
//
// Termination:
//   - Passed level X but failed level X+1 → placed at X (ceiling found).
//   - Failed A0 → placed at A0.
//   - hardCap reached → placed at the highest passed level so far (or A0).

export interface AdaptiveState {
  currentLevel: LessonLevel;
  tierAsked:    PlacementQuestion[];   // Q's asked at currentLevel
  tierAnswers:  PlacementAnswer[];     // answers at currentLevel
  passedLevels: Set<LessonLevel>;
  failedLevels: Set<LessonLevel>;
  askedIds:     Set<number>;
  totalAsked:   number;
  direction:    'up' | 'down' | 'settle';
  done:         boolean;
  placedLevel:  LessonLevel;
}

export interface AdaptiveConfig {
  hardCap:          number;
  startLevel?:      LessonLevel;
  questionsPerTier?: number;
  passThreshold?:   number;
  failThreshold?:   number;
}

export function initAdaptiveState(cfg: AdaptiveConfig): AdaptiveState {
  return {
    currentLevel: cfg.startLevel ?? 'A2',
    tierAsked:    [],
    tierAnswers:  [],
    passedLevels: new Set(),
    failedLevels: new Set(),
    askedIds:     new Set(),
    totalAsked:   0,
    direction:    'up',
    done:         false,
    placedLevel:  'A0',
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
 *  If the tier is complete, mutates transitions:
 *    - accuracy ≥ passThreshold → mark passed, move up
 *    - accuracy ≤ failThreshold → mark failed, move down (or terminate)
 *    - between → mark this tier as passed (marginal) and move up
 *  Termination happens when we've both passed X and failed X+1, or hit hardCap.
 */
export function recordAdaptiveAnswer(
  state: AdaptiveState,
  question: PlacementQuestion,
  answer: PlacementAnswer,
  cfg: AdaptiveConfig,
): AdaptiveState {
  const perTier   = cfg.questionsPerTier ?? 5;
  const passT     = cfg.passThreshold    ?? 0.6;
  const failT     = cfg.failThreshold    ?? 0.4;

  const tierAsked   = [...state.tierAsked, question];
  const tierAnswers = [...state.tierAnswers, answer];
  const askedIds    = new Set(state.askedIds); askedIds.add(question.id);
  const totalAsked  = state.totalAsked + 1;

  // Hard cap → commit to whatever is highest so far.
  if (totalAsked >= cfg.hardCap) {
    const placed = highestPassed(state.passedLevels) ?? 'A0';
    return { ...state, tierAsked, tierAnswers, askedIds, totalAsked, done: true, placedLevel: placed };
  }

  // Not enough answers in this tier yet — keep asking at currentLevel.
  if (tierAnswers.length < perTier) {
    return { ...state, tierAsked, tierAnswers, askedIds, totalAsked };
  }

  // Tier complete — compute accuracy and decide direction.
  const correct = tierAnswers.filter(a => a.correct).length;
  const pct     = correct / tierAnswers.length;
  const passed  = new Set(state.passedLevels);
  const failed  = new Set(state.failedLevels);

  let nextLevel: LessonLevel = state.currentLevel;
  let direction: 'up' | 'down' | 'settle' = state.direction;
  let done = false;
  let placed: LessonLevel = state.placedLevel;

  if (pct >= passT) {
    passed.add(state.currentLevel);
    // Passed → try one level up if we're not at the top.
    const up = nextLevelUp(state.currentLevel);
    if (up === null) {
      // Already at C1 and passed — placed at C1, done.
      done = true; placed = 'C1';
    } else if (failed.has(up)) {
      // We already failed this level going down before — ceiling found.
      done = true; placed = state.currentLevel;
    } else {
      nextLevel = up; direction = 'up';
    }
  } else if (pct <= failT) {
    failed.add(state.currentLevel);
    // Failed → drop one level unless we already passed something lower.
    if (state.direction === 'up' && passed.size > 0) {
      // We came from below and just crashed. Placed at the highest passed.
      done = true; placed = highestPassed(passed) ?? 'A0';
    } else {
      const down = nextLevelDown(state.currentLevel);
      if (down === null) {
        // Failed A0 — placed at A0.
        done = true; placed = 'A0';
      } else if (passed.has(down)) {
        done = true; placed = down;
      } else {
        nextLevel = down; direction = 'down';
      }
    }
  } else {
    // Marginal (between failT and passT). Count as passed and try up.
    passed.add(state.currentLevel);
    const up = nextLevelUp(state.currentLevel);
    if (up === null) { done = true; placed = 'C1'; }
    else if (failed.has(up)) { done = true; placed = state.currentLevel; }
    else { nextLevel = up; direction = 'up'; }
  }

  return {
    currentLevel: nextLevel,
    tierAsked:    done ? tierAsked : [],
    tierAnswers:  done ? tierAnswers : [],
    passedLevels: passed,
    failedLevels: failed,
    askedIds,
    totalAsked,
    direction,
    done,
    placedLevel:  done ? placed : highestPassed(passed) ?? 'A0',
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

/** Given a partially-populated results record, compute the derived fields
 *  the results view and the PDF export need. Safe to call at any point in
 *  the run (returns partial results if only some components are complete). */
export function aggregateSuite(
  results: Partial<Record<ComponentId, ComponentResult>>,
): {
  perSkillLevel: Partial<Record<ComponentId, LessonLevel>>;
  overallLevel:  LessonLevel;
  mergedWeakAreas: WeakArea[];
  learningProgram: LearningProgram;
} {
  const perSkillLevel: Partial<Record<ComponentId, LessonLevel>> = {};
  const skillLevels: LessonLevel[] = [];

  for (const [cid, res] of Object.entries(results)) {
    if (!res) continue;
    perSkillLevel[cid as ComponentId] = res.placedLevel;
    skillLevels.push(res.placedLevel);
  }

  const overallLevel = minLevel(skillLevels);

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
