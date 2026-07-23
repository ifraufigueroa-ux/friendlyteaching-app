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
  PlacementAnswer, SectionScore, WeakArea, LearningProgram,
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
