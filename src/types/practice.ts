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

/** Levels we commit to supporting on day one. C1/C2 come later. */
export const PRACTICE_LEVELS = ['A0', 'A1', 'A2', 'B1', 'B2'] as const;
export type PracticeLevel = typeof PRACTICE_LEVELS[number];

/** CEFR order used everywhere (sorting units, picking the next one…). */
export const LEVEL_ORDER: Record<PracticeLevel, number> = {
  A0: 0, A1: 1, A2: 2, B1: 3, B2: 4,
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

export type Exercise =
  | MultipleChoiceExercise
  | FillBlankExercise
  | MatchPairsExercise;

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
