// FriendlyTeaching.cl — IELTS shared types
//
// One source of truth for Listening + (later) Reading + Writing. Structured
// so a Mock is fully self-describing: content, audio metadata, grading rules,
// diagnostic tags. The UI and the scoring lib both read from these shapes.

// ─── Band scores ─────────────────────────────────────────────────────

export type IELTSBandScore =
  | 0 | 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 4.5 | 5 | 5.5
  | 6 | 6.5 | 7 | 7.5 | 8 | 8.5 | 9;

export interface BandBracket {
  minRaw: number;             // inclusive
  maxRaw: number;             // inclusive
  band: IELTSBandScore;
  label: 'Non-user' | 'Extremely limited' | 'Limited' | 'Modest'
       | 'Competent' | 'Good' | 'Very good' | 'Expert';
}

// ─── Listening: question types ──────────────────────────────────────
//
// Discriminated union so the UI can render each type correctly and the
// scoring lib can validate per-type rules (word limits, multi-answer, etc.).

export type ListeningQuestionType =
  | 'multiple-choice'          // single answer, 3-4 options
  | 'multiple-choice-multi'    // pick 2 from 5 (rare but real)
  | 'matching'                 // match items to a list
  | 'plan-map-labelling'       // label positions on a plan/map/diagram
  | 'form-completion'          // fill blank (specific format)
  | 'note-completion'          // fill blank in note-style outline
  | 'table-completion'         // fill blank in a table
  | 'summary-completion'       // fill blank in a paragraph
  | 'sentence-completion'      // fill blank in a standalone sentence
  | 'flow-chart-completion'    // fill blank in a flow chart
  | 'short-answer';            // 1-3 word answer to a question

export type CognitiveLoad =
  | 'literal'       // stated verbatim in audio
  | 'detail'        // needs to catch a specific detail
  | 'inferential'   // has to infer meaning / speaker intent
  | 'gist';         // overall main idea

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

// ── Base fields on every question ──
interface ListeningQuestionBase {
  id: string;                   // e.g. 'l1-s1-q3'
  section: 1 | 2 | 3 | 4;
  type: ListeningQuestionType;
  prompt: string;               // human-readable question or blank context
  audioTimestamp: number;       // seconds into the section audio where answer is spoken
  cognitiveLoad: CognitiveLoad;
  difficulty: QuestionDifficulty;
  teacherNote?: string;         // why this question is tricky, what trap it sets
  distractorRisks?: string[];   // wrong answers students commonly give
}

// ── Fill-in-the-blank family (form/note/table/summary/sentence/flow/short-answer) ──
export interface ListeningFillQuestion extends ListeningQuestionBase {
  type:
    | 'form-completion' | 'note-completion' | 'table-completion'
    | 'summary-completion' | 'sentence-completion' | 'flow-chart-completion'
    | 'short-answer';
  wordLimit: number;            // "NO MORE THAN X WORDS AND/OR A NUMBER"
  allowNumbers: boolean;        // "AND/OR A NUMBER" clause
  accepted: string[];           // all variants marked correct (spelling / synonyms)
  contextBefore?: string;       // text shown before the blank
  contextAfter?: string;        // text shown after the blank
}

// ── Multiple choice (single) ──
export interface ListeningMCQQuestion extends ListeningQuestionBase {
  type: 'multiple-choice';
  options: { id: string; text: string }[];   // usually 3-4 options
  correct: string;                            // option id
}

// ── Multiple choice (pick N) ──
export interface ListeningMCQMultiQuestion extends ListeningQuestionBase {
  type: 'multiple-choice-multi';
  options: { id: string; text: string }[];
  correct: string[];                          // option ids (2 or 3)
  pickCount: 2 | 3;
}

// ── Matching ──
export interface ListeningMatchingQuestion extends ListeningQuestionBase {
  type: 'matching';
  leftItem: string;             // what to match (e.g. person name)
  options: { id: string; text: string }[];   // shared bank across sibling Qs
  correct: string;              // option id
}

// ── Plan / map / diagram labelling ──
export interface ListeningMapQuestion extends ListeningQuestionBase {
  type: 'plan-map-labelling';
  labelSpot: string;            // description of the spot to label (e.g. 'Building B')
  options: { id: string; text: string }[];   // items to place (shared bank across sibling Qs)
  correct: string;              // option id
}

export type ListeningQuestion =
  | ListeningFillQuestion
  | ListeningMCQQuestion
  | ListeningMCQMultiQuestion
  | ListeningMatchingQuestion
  | ListeningMapQuestion;

// ─── Listening: sections and mocks ───────────────────────────────────

export interface ListeningSpeaker {
  id: string;                   // 'receptionist', 'tutor', 'student-1', etc.
  displayName: string;          // shown in transcript
  accent: 'UK' | 'US' | 'AU' | 'NZ' | 'IE' | 'ZA';
  gender: 'f' | 'm';
  // Suggested ElevenLabs voice ID + name so the teacher can pick fast
  suggestedVoice: { name: string; note?: string };
}

export interface ListeningScriptLine {
  speakerId: string;            // must match a ListeningSection.speakers[].id
  text: string;
  // Approximate seconds from section start when this line begins — used to
  // auto-align audioTimestamp fields to the actual recording.
  approxStartSec?: number;
}

export interface ListeningSection {
  number: 1 | 2 | 3 | 4;
  contextType: 'social-transactional' | 'social-monologue' | 'academic-discussion' | 'academic-lecture';
  title: string;                // "Enrollment call to a sports club"
  scenario: string;             // 1-line summary for the teacher
  speakers: ListeningSpeaker[];
  script: ListeningScriptLine[];
  // What the student sees before the audio starts — real IELTS shows the
  // instruction + Q numbers so they can preview.
  instructions: string;
  // Where uploaded audio lives (Firebase Storage URL) once the teacher
  // generates + uploads it. Optional so mocks ship with scripts only.
  audioUrl?: string;
  // Expected audio duration in seconds — 5-8 min per section is typical.
  targetDurationSec: number;
  questions: ListeningQuestion[];
}

export interface ListeningMock {
  id: string;                   // 'listening-mock-1'
  title: string;                // 'Mock 1 · General Listening'
  level: 'Academic' | 'General Training';
  createdAt: string;            // ISO date
  targetBandRange: [IELTSBandScore, IELTSBandScore]; // e.g. [6, 7.5] — who benefits
  sections: [ListeningSection, ListeningSection, ListeningSection, ListeningSection];
  totalQuestions: 40;
  totalDurationSec: number;     // sum of section durations + preview time
}

// ─── Grading & diagnostics ──────────────────────────────────────────

export type StudentAnswers = Record<string, string | string[]>;
// key = question id; value = trimmed answer (or array for multi-select)

export interface QuestionMark {
  questionId: string;
  studentAnswer: string | string[] | undefined;
  correct: boolean;
  acceptedAnswer: string;       // canonical form shown in review
  reasonWrong?: 'blank' | 'spelling' | 'over-word-limit' | 'wrong-option' | 'multiple-when-one';
  trapMatched?: string;         // if student's wrong answer matches a known distractorRisk
}

export interface SectionBreakdown {
  section: 1 | 2 | 3 | 4;
  correct: number;              // out of 10
  total: 10;
  pct: number;                  // 0-100
}

export interface TypeBreakdown {
  type: ListeningQuestionType;
  correct: number;
  total: number;
  pct: number;
}

export interface CognitiveBreakdown {
  load: CognitiveLoad;
  correct: number;
  total: number;
  pct: number;
}

export interface Recommendation {
  focus: 'section' | 'type' | 'cognitive';
  targetTag: string;            // e.g. 'section-4' or 'matching' or 'inferential'
  message: string;              // human-facing next step
}

export interface GradeResult {
  mockId: string;
  submittedAt: string;          // ISO
  rawScore: number;             // out of 40
  band: IELTSBandScore;
  bandLabel: BandBracket['label'];
  perQuestion: QuestionMark[];
  sectionBreakdown: SectionBreakdown[];
  typeBreakdown: TypeBreakdown[];
  cognitiveBreakdown: CognitiveBreakdown[];
  recommendations: Recommendation[];
}

// ─── Session modes ──────────────────────────────────────────────────

export type ListeningSessionMode = 'exam' | 'practice' | 'review';
// exam    → single play, no pause, timer strict, answers hidden until submit
// practice → pausable, rewindable, can peek at answer per Q
// review  → post-submit read-only walkthrough with audio segment scrubber
