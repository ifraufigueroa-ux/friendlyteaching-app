// FriendlyTeaching.cl — Complete Placement Test (suite) types
//
// A "suite session" is a placement test made of one or more components.
// Each component runs its own bank + scorer. The suite aggregates them
// into a per-skill CEFR breakdown + a global overall level (min of skills,
// standard CEFR practice for placement).
//
// The grammar-only path (existing `placementSessions` collection + the
// `/placement/[teacherId]` route) stays untouched. This is a superset.

import { Timestamp } from 'firebase/firestore';
import type { LessonLevel } from './firebase';
import type {
  PlacementAnswer, SectionScore, WeakArea, LearningProgram,
} from './placement';

// ── Components ─────────────────────────────────────────────────────────────

export type ComponentId =
  | 'grammar'
  | 'vocabulary'
  | 'reading'
  | 'listening'   // Phase 2
  | 'writing'     // Phase 3
  | 'speaking';   // Phase 3

export interface ComponentMeta {
  id:          ComponentId;
  label:       string;
  icon:        string;
  description: string;
  estimatedMin: number;       // rough time estimate for a full run
  available:   boolean;       // false = ships in a later phase
  skill:       'grammar' | 'vocabulary' | 'reading' | 'listening' | 'writing' | 'speaking';
}

export const COMPONENT_META: Record<ComponentId, ComponentMeta> = {
  grammar:    { id: 'grammar',    label: 'Grammar',    icon: '📘', description: 'Multiple choice, CEFR A0-C1, auto-stop tras 6 errores seguidos.', estimatedMin: 20, available: true, skill: 'grammar' },
  vocabulary: { id: 'vocabulary', label: 'Vocabulary', icon: '💬', description: 'Sinónimos, colocaciones, phrasal verbs y word formation.',        estimatedMin: 12, available: true, skill: 'vocabulary' },
  reading:    { id: 'reading',    label: 'Reading',    icon: '📖', description: 'Pasajes cortos con comprensión, dificultad progresiva.',           estimatedMin: 20, available: true, skill: 'reading' },
  listening:  { id: 'listening',  label: 'Listening',  icon: '🎧', description: 'Clips A1-C1 con MCQ. Adaptativo por clip, arranca cercano al nivel de Grammar.', estimatedMin: 12, available: true, skill: 'listening' },
  writing:    { id: 'writing',    label: 'Writing',    icon: '✍️', description: 'Un prompt calibrado al nivel de Grammar. AI grader devuelve CEFR.', estimatedMin: 12, available: true, skill: 'writing' },
  speaking:   { id: 'speaking',   label: 'Speaking',   icon: '🎤', description: '3 preguntas guiadas grabadas. Whisper + Claude → CEFR.',            estimatedMin: 6,  available: true, skill: 'speaking' },
};

// ── Budgets (per-component question caps) ──────────────────────────────────
//
// Grammar is adaptive: it walks CEFR tiers and stops when it finds a ceiling.
// The budget is a HARD cap on how many questions grammar can ask before it
// commits to whatever level is highest-passing so far. In practice adaptive
// grammar rarely needs more than 20-25 Q's regardless of budget.
//
// Vocab / Reading are calibrated after grammar to the estimated CEFR ±1 and
// stop when the budget is reached (Reading counts passages, not questions).

export interface Budgets {
  grammar:    number;   // max Q's (cap for adaptive; exact for linear)
  vocabulary: number;   // exact Q count
  reading:    number;   // exact passage count
  listening:  number;   // exact clip count
  writing:    number;   // number of writing prompts (typically 1)
  speaking:   number;   // number of speaking prompts (typically 3)
}

/** Grammar can run in two modes: adaptive (CEFR tier walking with streak
 *  detection, terminates early) or linear (all N questions sequential with
 *  6-consecutive-wrong auto-stop only). Vocab and Reading are always linear. */
export type GrammarMode = 'adaptive' | 'linear';

// ── Presets ────────────────────────────────────────────────────────────────

export interface Preset {
  id:          string;
  label:       string;
  description: string;
  components:  ComponentId[];
  budgets:     Budgets;
  targetMin:   number;   // rough total minutes for this preset
}

export const PRESETS: Preset[] = [
  {
    id: 'quick',
    label: 'Quick check',
    description: '~10-15 min. Grammar corto + vocab compacto + 1 pasaje.',
    components: ['grammar', 'vocabulary', 'reading'],
    budgets: { grammar: 15, vocabulary: 12, reading: 1, listening: 2, writing: 1, speaking: 3 },
    targetMin: 15,
  },
  {
    id: 'standard',
    label: 'Standard',
    description: '~30 min. Grammar + vocab + reading + listening.',
    components: ['grammar', 'vocabulary', 'reading', 'listening'],
    budgets: { grammar: 25, vocabulary: 20, reading: 2, listening: 3, writing: 1, speaking: 3 },
    targetMin: 30,
  },
  {
    id: 'productive',
    label: 'Productive skills',
    description: '~15 min. Solo Writing + Speaking (para completar un placement iniciado).',
    components: ['writing', 'speaking'],
    budgets: { grammar: 25, vocabulary: 20, reading: 2, listening: 3, writing: 1, speaking: 3 },
    targetMin: 15,
  },
  {
    id: 'full',
    label: 'Full CEFR',
    description: '~60 min. Los 6 componentes al detalle.',
    components: ['grammar', 'vocabulary', 'reading', 'listening', 'writing', 'speaking'],
    budgets: { grammar: 40, vocabulary: 30, reading: 3, listening: 4, writing: 1, speaking: 3 },
    targetMin: 60,
  },
];

/** Rough estimate — used by the selector to show total minutes for a custom
 *  configuration. Per-question / per-passage rates come from field-testing. */
export function estimateMinutes(components: ComponentId[], budgets: Budgets): number {
  let total = 0;
  if (components.includes('grammar'))    total += Math.round(budgets.grammar    * 0.5);   // ~30s per Q
  if (components.includes('vocabulary')) total += Math.round(budgets.vocabulary * 0.4);   // ~24s per Q
  if (components.includes('reading'))    total += budgets.reading * 6;                    // ~6 min per passage
  if (components.includes('listening'))  total += budgets.listening * 3;                  // ~3 min per clip (audio + Qs)
  if (components.includes('writing'))    total += budgets.writing * 10;                   // 10 min per prompt
  if (components.includes('speaking'))   total += Math.round(budgets.speaking * 1.5);     // ~1.5 min per prompt (prep + speak)
  return total;
}

// ── Component results ──────────────────────────────────────────────────────

/** Everything a scored component returns. All fields serialisable to Firestore. */
export interface ComponentResult {
  componentId:   ComponentId;
  answers:       PlacementAnswer[];   // reuse PlacementAnswer shape across all MCQ components
  totalAnswered: number;
  totalCorrect:  number;
  sectionScores: SectionScore[];      // per-CEFR-level accuracy
  weakAreas:     WeakArea[];          // topic-tag breakdown
  placedLevel:   LessonLevel;         // level reached in this component alone
  stopped?:      boolean;             // grammar auto-stop
  stoppedAtQ?:   number;
  startedAt:     Timestamp;
  completedAt:   Timestamp;
}

// ── Session ────────────────────────────────────────────────────────────────

export type SuiteMode = 'student-self' | 'teacher-led';
export type SuiteStatus = 'in_progress' | 'completed' | 'partially_completed';

export interface PlacementSuiteSession {
  id:               string;
  teacherId:        string;
  studentName:      string;
  studentEmail?:    string;
  studentPhone?:    string;
  linkedStudentId?: string;
  assignmentId?:    string;
  mode:             SuiteMode;
  components:       ComponentId[];             // what the teacher selected
  budgets:          Budgets;                   // per-component caps
  grammarMode?:     GrammarMode;               // default 'adaptive'
  /** @deprecated retained for old sessions — new sessions use `budgets`. */
  grammarLength?:   30 | 60 | 100;
  results:          Partial<Record<ComponentId, ComponentResult>>;
  progress:         Partial<Record<ComponentId, 'pending' | 'in_progress' | 'completed' | 'skipped'>>;
  perSkillLevel?:   Partial<Record<ComponentId, LessonLevel>>;
  overallLevel?:    LessonLevel;               // min of completed skills
  learningProgram?: LearningProgram;
  status:           SuiteStatus;
  startedAt:        Timestamp;
  completedAt?:     Timestamp;
  createdAt:        Timestamp;
  updatedAt?:       Timestamp;
}

// ── Reading passage bank ───────────────────────────────────────────────────

export type VocabularyTopic =
  | 'synonyms'
  | 'antonyms'
  | 'collocations'
  | 'phrasal_verbs'
  | 'word_formation'
  | 'gap_fill_context'
  | 'idioms'
  | 'connectors';

export interface VocabularyQuestion {
  id:       number;
  level:    LessonLevel;
  topic:    VocabularyTopic;
  sentence: string;                             // "___" for the gap
  options:  [string, string, string, string];
  correct:  0 | 1 | 2 | 3;
  explanation?: string;
}

export type ReadingQuestionType =
  | 'main-idea'
  | 'detail'
  | 'inference'
  | 'vocabulary-in-context'
  | 'reference'
  | 'purpose';

export interface ReadingQuestion {
  id:      number;                              // unique across the whole bank
  level:   LessonLevel;                         // level tag of the question itself
  type:    ReadingQuestionType;
  prompt:  string;
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  explanation?: string;
}

export interface ReadingPassage {
  id:            string;                        // slug — 'ac-a1-park', 'ac-b2-remote'
  level:         LessonLevel;                   // suggested level of the passage
  title:         string;
  text:          string;                        // full text, markdown-lite (paragraph breaks with \n\n)
  wordCount:     number;
  questions:     ReadingQuestion[];
}

export const VOCAB_TOPIC_LABELS: Record<VocabularyTopic, string> = {
  synonyms:         'Synonyms',
  antonyms:         'Antonyms',
  collocations:     'Collocations',
  phrasal_verbs:    'Phrasal Verbs',
  word_formation:   'Word Formation',
  gap_fill_context: 'Contextual Gap-Fill',
  idioms:           'Idioms',
  connectors:       'Discourse Connectors',
};

export const READING_TYPE_LABELS: Record<ReadingQuestionType, string> = {
  'main-idea':              'Main Idea',
  'detail':                 'Detail',
  'inference':              'Inference',
  'vocabulary-in-context':  'Vocabulary in Context',
  'reference':              'Reference',
  'purpose':                'Purpose',
};

// ── Listening bank ─────────────────────────────────────────────────────────

export interface ListeningClipQuestion {
  id:      string;
  level:   LessonLevel;
  prompt:  string;
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  explanation?: string;
}

export interface ListeningClipSpeaker {
  id:    string;
  name:  string;
}

export interface ListeningClipLine {
  speakerId: string;
  text:      string;
}

export interface ListeningClip {
  id:         string;
  level:      LessonLevel;
  title:      string;
  scenario:   string;
  speakers:   ListeningClipSpeaker[];
  script:     ListeningClipLine[];
  wordCount:  number;
  questions:  ListeningClipQuestion[];
}

// ── Writing prompts ────────────────────────────────────────────────────────

export interface WritingPromptPlacement {
  id:          string;
  level:       LessonLevel;
  title:       string;
  prompt:      string;
  minWords:    number;
  timerMin:    number;
}

// ── Speaking prompts ───────────────────────────────────────────────────────

export interface SpeakingPromptPlacement {
  id:        string;
  level:     LessonLevel;
  prompt:    string;
  prepSec:   number;
  speakSec:  number;
}

// ── Public assignment (extended) ───────────────────────────────────────────

// The existing PlacementAssignment stays as-is; suite assignments add these
// optional fields. When `components` is undefined the runner falls back to
// the classic grammar-only path.
export interface PlacementSuiteAssignmentExtras {
  components?:    ComponentId[];
  mode?:          SuiteMode;
  budgets?:       Budgets;
  grammarMode?:   GrammarMode;
  /** @deprecated retained so old assignments continue to run. */
  grammarLength?: 30 | 60 | 100;
}
