// FriendlyTeaching.cl — Placement Test Types

import { Timestamp } from 'firebase/firestore';
import type { LessonLevel } from './firebase';

// ── Question bank ──────────────────────────────────────────────

export type GrammarTopic =
  | 'verb_to_be'
  | 'articles'
  | 'pronouns'
  | 'possessives'
  | 'present_simple'
  | 'present_continuous'
  | 'past_simple'
  | 'past_continuous'
  | 'present_perfect'
  | 'present_perfect_continuous'
  | 'past_perfect'
  | 'future_will'
  | 'future_going_to'
  | 'future_continuous'
  | 'modals_basic'
  | 'modals_advanced'
  | 'conditionals_1'
  | 'conditionals_2'
  | 'conditionals_3'
  | 'mixed_conditionals'
  | 'passive_simple'
  | 'passive_complex'
  | 'reported_speech'
  | 'relative_clauses'
  | 'comparatives'
  | 'superlatives'
  | 'questions'
  | 'negatives'
  | 'countable_uncountable'
  | 'determiners'
  | 'prepositions'
  | 'phrasal_verbs'
  | 'gerunds_infinitives'
  | 'wish_if_only'
  | 'inversion'
  | 'cleft_sentences'
  | 'subjunctive'
  | 'ellipsis'
  | 'fronting'
  | 'used_to_would'
  | 'quantifiers';

export interface PlacementQuestion {
  id: number;              // 1-100
  level: LessonLevel;      // which CEFR section it belongs to
  topic: GrammarTopic;     // grammar area
  sentence: string;        // the question sentence (use ___ for gap)
  options: [string, string, string, string]; // exactly 4 options
  correct: 0 | 1 | 2 | 3; // index of correct option
  explanation?: string;    // shown to teacher in results
}

// ── Test session ───────────────────────────────────────────────

export type PlacementStatus = 'in_progress' | 'completed' | 'stopped_by_ceiling';

export interface PlacementAnswer {
  questionId: number;
  level: LessonLevel;
  topic: GrammarTopic;
  selected: 0 | 1 | 2 | 3 | null; // null = skipped
  correct: boolean;
  timeMs?: number; // time taken in milliseconds
}

export interface SectionScore {
  level: LessonLevel;
  total: number;      // questions answered in this section
  correct: number;    // correct answers
  pct: number;        // percentage 0-100
  passed: boolean;    // pct >= 60%
}

export interface WeakArea {
  topic: GrammarTopic;
  total: number;
  correct: number;
  pct: number;
}

export interface PlacementSession {
  id: string;
  teacherId: string;          // which teacher this test belongs to
  studentName: string;
  studentEmail?: string;
  studentPhone?: string;
  status: PlacementStatus;
  answers: PlacementAnswer[];
  totalAnswered: number;
  totalCorrect: number;
  consecutiveErrors: number;  // current streak of wrong answers
  stoppedAtQuestion?: number; // question number that triggered ceiling
  placedLevel?: LessonLevel;  // final result (null until completed)
  sectionScores?: SectionScore[];
  weakAreas?: WeakArea[];
  learningProgram?: LearningProgram;
  linkedStudentId?: string;   // set when teacher links to a pending student
  startedAt: Timestamp;
  completedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// ── Learning program ──────────────────────────────────────────

export interface WeekPlan {
  week: number;          // 1-12
  focus: string;         // main grammar topic label
  topics: GrammarTopic[];
  description: string;   // human-readable explanation
}

export interface LearningProgram {
  placedLevel: LessonLevel;
  weakAreas: WeakArea[];
  weeks: WeekPlan[];
  generatedAt: string;   // ISO date string
}
