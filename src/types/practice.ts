// FriendlyTeaching.cl — Daily Practice types
//
// A standalone autonomous-practice system (think Duolingo for grown-ups
// learning English, A0–B2). Lives alongside the teacher-assigned
// homework + the lesson library — this is specifically for the student
// to practice on their own, every day.
//
// Content model is intentionally light so new units/exercises can be
// shipped as plain data files under src/lib/data/practice/.

import type { Timestamp } from 'firebase/firestore';

// ── CEFR + skills ─────────────────────────────────────────────

/** CEFR levels the Daily Practice ladder covers end-to-end. */
export const PRACTICE_LEVELS = ['A0', 'A1', 'A2', 'B1', 'B2', 'B2+', 'C1'] as const;
export type PracticeLevel = typeof PRACTICE_LEVELS[number];

/** CEFR order used everywhere (sorting units, picking the next one…). */
export const LEVEL_ORDER: Record<PracticeLevel, number> = {
  A0: 0, A1: 1, A2: 2, B1: 3, B2: 4, 'B2+': 5, C1: 6,
};

export const PRACTICE_SKILLS = [
  'grammar', 'vocabulary', 'listening', 'reading',
] as const;
export type PracticeSkill = typeof PRACTICE_SKILLS[number];

// ── Exercise shapes ──────────────────────────────────────────
//
// Each exercise is a tagged union — the runner switches on `type` to
// render the right component and to grade the answer.

interface BaseExercise {
  id:       string;      // stable within a unit, e.g. "u1-ex03"
  prompt:   string;      // the stem shown above the controls
  explain?: string;      // optional one-liner shown after the answer
}

/** Pick one of N options. Also used for grammar quizzes. */
export interface MultipleChoiceExercise extends BaseExercise {
  type:        'multiple-choice';
  options:     string[];
  correctIndex: number;
}

/** Fill one or more blanks in a sentence. Blanks are "___". */
export interface FillBlankExercise extends BaseExercise {
  type:   'fill-blank';
  /** Sentence with "___" markers, e.g. "She ___ a doctor." */
  sentence: string;
  /** One accepted answer per blank, lowercased when graded. */
  answers:  string[];
  /** Alternative accepted spellings per blank. Lowercased when graded. */
  alts?:    string[][];
}

/** Match left-column items to right-column items. */
export interface MatchPairsExercise extends BaseExercise {
  type:  'match-pairs';
  pairs: { left: string; right: string }[];
}

/** Short listening task: the student hears a 1-3 sentence clip and
 *  picks the right answer. The `audioScript` is the text that was
 *  (or will be) rendered to voice; `audioUrl` is the hosted MP3 once
 *  the batch generator has uploaded it. When the URL is missing, the
 *  runner falls back to the browser's SpeechSynthesis so authoring
 *  can proceed before the audio batch is cut. */
export interface ListenChooseExercise extends BaseExercise {
  type:          'listen-choose';
  audioScript:   string;
  audioUrl?:     string;
  /** Preferred ElevenLabs voice id for batch generation (optional). */
  voiceId?:      string;
  options:       string[];
  correctIndex:  number;
}

export type Exercise =
  | MultipleChoiceExercise
  | FillBlankExercise
  | MatchPairsExercise
  | ListenChooseExercise;

export type ExerciseType = Exercise['type'];

// ── Units ─────────────────────────────────────────────────────

export interface PracticeUnit {
  id:          string;
  level:       PracticeLevel;
  skill:       PracticeSkill;
  /** Human-facing title, e.g. "Hello & My Name". */
  title:       string;
  /** One-sentence blurb shown on the unit card. */
  description: string;
  /** Emoji glyph for the card, kept out of i18n. */
  icon:        string;
  exercises:   Exercise[];
  /** Short pre-workout explainer. Shown from the "Quick Lesson" button
   *  on the card; ends with "Go Practice" that routes into the drill.
   *  Optional for backwards compatibility — units without a quickLesson
   *  render a lightweight "coming soon" placeholder. */
  quickLesson?: QuickLesson;
}

// ── Quick Lesson shape ───────────────────────────────────────

export interface QuickLessonSection {
  /** Short heading shown above the body. Optional — use when the lesson
   *  has multiple logical blocks. */
  heading?: string;
  /** Prose explaining the point. Plain text with line breaks; renderer
   *  splits paragraphs on blank lines. Short — 2-5 sentences is typical. */
  body:     string;
  /** Concrete example sentences. Rendered as a bullet list. */
  examples?: string[];
  /** One-line gotcha / mnemonic / tip. Rendered as a callout. */
  tip?:      string;
}

export interface QuickLesson {
  /** One-sentence summary for the card preview + hero of the quick page. */
  summary:  string;
  sections: QuickLessonSection[];
}

// ── Progress docs (Firestore) ─────────────────────────────────
//
// We write a single `practiceProgress/{studentId}` document rather than
// a subcollection per unit — keeps reads cheap and the daily loop fast.
// Granular per-unit history is derived from `practiceSessions` instead.

export interface PracticeProgress {
  studentId:         string;
  /** Where the student is right now — drives the daily workout. */
  currentLevel:      PracticeLevel;
  /** Highest level reached in the in-app placement test. Any unit at
   *  or below this level is unlocked regardless of prerequisites — the
   *  student has already proved they handle the grammar. Null when no
   *  placement has been taken. */
  placedLevel?:      PracticeLevel | null;
  /** Unit the next session will pick exercises from (null if none). */
  nextUnitId:        string | null;
  /** Per-unit mastery, 0-5 crowns. Missing = not started. */
  mastery:           Record<string, number>;
  /** Current unbroken streak (resets if `lastPracticedAt` is >3 days ago). */
  currentStreak:     number;
  /** Longest streak ever reached — for the streak chip subtitle. */
  longestStreak:     number;
  /** YYYY-MM-DD of the last day the student completed any session. */
  lastPracticedAt:   string | null;
  /** Total XP earned specifically from Daily Practice (separate from
   *  gamification.totalXp so the teacher view can split them apart). */
  totalXp:           number;
  /** Did the student opt into placement at onboarding? Null = not asked yet. */
  startedFromPlacement: boolean | null;
  createdAt?:        Timestamp;
  updatedAt?:        Timestamp;
}

export interface PracticeSession {
  studentId:   string;
  unitId:      string;
  /** YYYY-MM-DD so we can group by day without touching Timestamps. */
  date:        string;
  totalCount:  number;
  correctCount: number;
  xpEarned:    number;
  completedAt: Timestamp;
}

// ── Streak rule (shared with the hook) ───────────────────────
//
// User-chosen policy: miss 3 full days in a row → reset. So if the gap
// between today and `lastPracticedAt` is > 3 days, the streak starts
// over at 1.
export const STREAK_GRACE_DAYS = 3;

/** Days since `lastPracticedAt` as a floored int, using local midnight. */
export function daysSince(lastPracticedAt: string | null, today = new Date()): number {
  if (!lastPracticedAt) return Infinity;
  const last = new Date(lastPracticedAt + 'T00:00:00');
  const t0   = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = (t0.getTime() - last.getTime()) / 86400000;
  return Math.max(0, Math.floor(diff));
}

/** Pure function used by the hook when writing a session. */
export function nextStreak(prev: number, lastPracticedAt: string | null): {
  streak: number; isNewDay: boolean;
} {
  const gap = daysSince(lastPracticedAt);
  if (gap === 0) return { streak: prev, isNewDay: false };
  if (gap <= STREAK_GRACE_DAYS) return { streak: prev + 1, isNewDay: true };
  return { streak: 1, isNewDay: true };
}

export function todayStr(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ── XP table ──────────────────────────────────────────────────

export const PRACTICE_XP = {
  /** Per correct answer in a lesson. */
  perCorrect:        10,
  /** Flat bonus on lesson completion, regardless of score. */
  lessonCompletion:  20,
  /** Extra bonus when a lesson is finished with 90%+ accuracy. */
  perfectBonus:      25,
} as const;

// ── Stars + unlock gating ─────────────────────────────────────
//
// We grade each attempt into 0-3 stars by accuracy. The `mastery`
// field on PracticeProgress stores the best stars ever achieved on
// a unit. Reaching ≥ UNLOCK_MIN_STARS on a unit opens the next one
// in CEFR + file order.

export const STARS_MAX = 3;
/** Minimum stars on a unit to unlock the next one. */
export const UNLOCK_MIN_STARS = 2;

/** Map an accuracy ratio (0-1) to 0-3 stars. */
export function starsForAccuracy(accuracy: number): number {
  if (accuracy >= 0.90) return 3;
  if (accuracy >= 0.70) return 2;
  if (accuracy >= 0.50) return 1;
  return 0;
}

/** Clamp any legacy 0-5 crown value into the new 0-3 stars scale. */
export function toStars(masteryValue: number | undefined): number {
  if (!masteryValue || masteryValue <= 0) return 0;
  return Math.min(STARS_MAX, masteryValue);
}

/** A unit is unlocked when any of these is true:
 *   · it is the first unit in the ordered list (always open),
 *   · its predecessor has ≥ UNLOCK_MIN_STARS (normal progression),
 *   · it belongs to a level the student has already placed through
 *     (the in-app placement wrote their best grammar level). */
export function isUnitUnlocked(
  unitId: string,
  orderedUnitIds: string[],
  mastery: Record<string, number>,
  /** Optional lookup of each unit's level. Passed alongside
   *  `placedLevel` so this helper doesn't have to import the units
   *  module (avoids a circular dep). */
  levelOf?: Record<string, PracticeLevel>,
  placedLevel?: PracticeLevel | null,
): boolean {
  if (placedLevel && levelOf) {
    const l = levelOf[unitId];
    if (l && LEVEL_ORDER[l] <= LEVEL_ORDER[placedLevel]) return true;
  }
  const idx = orderedUnitIds.indexOf(unitId);
  if (idx <= 0) return true; // first unit or unknown → open
  const prevId = orderedUnitIds[idx - 1];
  return toStars(mastery[prevId]) >= UNLOCK_MIN_STARS;
}
