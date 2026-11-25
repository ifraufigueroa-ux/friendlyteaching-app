// FriendlyTeaching.cl — Daily Practice: adaptive placement types
//
// A grammar-only adaptive test that lives INSIDE Daily Practice (no
// teacher required). Up to 50 questions, one at a time, with the next
// question chosen based on how the student has answered so far. The
// doc at dailyPracticePlacement/{uid} is written on every answer so
// the student can close the tab and pick up exactly where they left
// off — the resume flow is a first-class state.

import type { Timestamp, FieldValue } from 'firebase/firestore';
import type { PracticeLevel } from './practice';

// ── Question pool ────────────────────────────────────────────

/** One grammar question. Multiple-choice with exactly one correct
 *  option. The pool is picked over at runtime so each question also
 *  carries the CEFR level it tests and the micro-topic — the latter
 *  lets the result screen (eventually) show per-topic strengths. */
export interface DPPQuestion {
  id:       string;          // stable, e.g. 'dpp-b1-reported-01'
  level:    PracticeLevel;   // 'A0' … 'C1'
  topic:    string;          // 'reported speech', 'phrasal verbs' …
  prompt:   string;          // the stem
  options:  string[];        // 4 options; exactly one is right
  correct:  number;          // 0-based index into options[]
  explain?: string;          // one-liner shown in the result review
}

// ── Session ──────────────────────────────────────────────────

/** One answered question in the running session. */
export interface DPPAnswer {
  questionId:   string;
  level:        PracticeLevel;   // denormalised for cheap scoring
  topic:        string;          // denormalised for the per-topic view
  pickedIndex:  number;
  correct:      boolean;
  /** ms spent on the question (first show → submit). Captured for the
   *  future diagnostic view; the engine does not use it today. */
  elapsedMs?:   number;
}

export type DPPStatus = 'in_progress' | 'paused' | 'completed' | 'abandoned';

/** The Firestore document at dailyPracticePlacement/{uid}. Rewritten on
 *  every answer so a crash never loses more than the latest question. */
export interface DPPSession {
  uid:          string;
  status:       DPPStatus;
  startedAt:    Timestamp | FieldValue | null;
  updatedAt:    Timestamp | FieldValue | null;
  pausedAt?:    Timestamp | FieldValue | null;
  completedAt?: Timestamp | FieldValue | null;
  answers:      DPPAnswer[];
  /** The engine's current best guess of the student's CEFR level. Updates
   *  after every answer. */
  currentLevelEstimate: PracticeLevel;
  /** When the test is finished, this is the final placement decision. */
  placedLevel?: PracticeLevel;
  /** Accuracy per level after the final question, for the result screen
   *  and any downstream diagnostic. Written at completion time. */
  perLevelAccuracy?: Partial<Record<PracticeLevel, {
    answered: number;
    correct:  number;
    pct:      number;
  }>>;
}

// ── Engine config ────────────────────────────────────────────

export const DPP_CONFIG = {
  /** Hard cap. Student can always stop sooner once the engine locks. */
  MAX_QUESTIONS: 50,
  /** Earliest we'll even consider ending the session. Keeps the floor
   *  of signal high enough to trust the result. */
  MIN_QUESTIONS_BEFORE_EARLY_STOP: 25,
  /** The engine starts at this level — somewhere in the middle of the
   *  ladder so climbers and descenders both have room. */
  STARTING_LEVEL: 'B1' as PracticeLevel,
  /** Legacy single-threshold "passed" bar — retained for any callers
   *  reading it. The engine now uses the two-threshold model below
   *  (MASTERED + PARTIAL) for both in-session probing and final
   *  placement. */
  PASS_THRESHOLD: 0.6,
  /** Two-threshold placement model (introduced 2026-11-25).
   *  - MASTERED: student clearly commands this level. The placed level
   *    floor is the highest level with pct ≥ MASTERED.
   *  - PARTIAL: student shows meaningful knowledge above random chance
   *    (25% on 4-option MCQ). Used to "bridge up" — if the level above
   *    the highest mastered level is at PARTIAL, we place the student
   *    there rather than at the safe floor.
   *
   *  Rationale (audit 2026-11-25): placing a student at A2 when they
   *  scored 80% in A1/A2 AND 50% in B1/B2 felt punitive because 50%
   *  on 4-choice MCQ is 2× random chance — real partial command of
   *  the structures, not noise. Bridge-up matches teacher intuition
   *  and the CEFR "emerging at" rubric. */
  MASTERED_THRESHOLD: 0.7,
  PARTIAL_THRESHOLD:  0.5,
  /** Questions per level considered meaningful when measuring pass. */
  // Raised from 3 to 5 (audit incident 2026-11-23 · Francisco).
  // Three attempts at a level was too tight — a student who failed 2
  // of 3 at the ceiling level was declared "not there" before we had
  // real signal. Five gives the engine a fair sample before it
  // commits, and is paired with isPlacementConfirmed() requiring
  // ≥ MIN at the level ABOVE the placed level (see adaptiveRunner.ts)
  // so the test won't short-close until it has actually probed the
  // ceiling.
  MIN_QUESTIONS_PER_LEVEL: 5,
  /** Early-stop trigger: the estimate has been stable for this many
   *  answers in a row AND we're past the minimum. */
  STABLE_ANSWERS_FOR_EARLY_STOP: 6,
} as const;
