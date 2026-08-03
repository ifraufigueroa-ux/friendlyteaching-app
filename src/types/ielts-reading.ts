// FriendlyTeaching.cl — IELTS Reading shared types (General Training MVP)
//
// Parallel to @/types/ielts (Listening). Kept separate on purpose: Reading
// has its own question-type family (TFNG / YNNG / matching-headings /
// matching-features) and its own raw→band conversion table.

import type { IELTSBandScore, BandBracket, CognitiveLoad, QuestionDifficulty } from '@/types/ielts';

export type { IELTSBandScore, BandBracket, CognitiveLoad, QuestionDifficulty };

// ─── Question types ─────────────────────────────────────────────────

export type ReadingQuestionType =
  | 'multiple-choice'           // single answer, 3-4 options
  | 'multiple-choice-multi'     // pick N from a longer list
  | 'true-false-not-given'      // factual claim vs passage
  | 'yes-no-not-given'          // writer's opinion vs passage
  | 'matching-information'      // which paragraph contains X
  | 'matching-headings'         // pick heading for each paragraph
  | 'matching-features'         // match items to a shared feature bank
  | 'matching-sentence-endings' // pair sentence stems with their endings
  | 'sentence-completion'       // fill blank in a standalone sentence
  | 'summary-completion'        // fill blank in a paragraph (optionally with bank)
  | 'note-completion'           // fill blank in note-style outline
  | 'table-completion'          // fill blank in a table
  | 'flow-chart-completion'     // fill blank in a flow chart
  | 'diagram-label'             // label parts on a diagram
  | 'short-answer';             // 1-3 word answer to a question

interface ReadingQuestionBase {
  id: string;                   // 'r1-s1-q3'
  section: 1 | 2 | 3;
  type: ReadingQuestionType;
  prompt: string;
  cognitiveLoad: CognitiveLoad;
  difficulty: QuestionDifficulty;
  // Optional pointer back into the passage — a text snippet the student can
  // scan for. Used in review mode to highlight where the answer lives.
  answerLocator?: string;
  teacherNote?: string;
  distractorRisks?: string[];
}

export interface ReadingFillQuestion extends ReadingQuestionBase {
  type:
    | 'sentence-completion' | 'summary-completion' | 'note-completion'
    | 'table-completion' | 'flow-chart-completion' | 'diagram-label'
    | 'short-answer';
  wordLimit: number;
  allowNumbers: boolean;
  accepted: string[];
  contextBefore?: string;
  contextAfter?: string;
  // Optional: for summary-completion with a word bank, this is the option id.
  fromBankOptionId?: string;
}

export interface ReadingMCQQuestion extends ReadingQuestionBase {
  type: 'multiple-choice';
  options: { id: string; text: string }[];
  correct: string;
}

export interface ReadingMCQMultiQuestion extends ReadingQuestionBase {
  type: 'multiple-choice-multi';
  options: { id: string; text: string }[];
  correct: string[];
  pickCount: 2 | 3;
}

export interface ReadingTFNGQuestion extends ReadingQuestionBase {
  type: 'true-false-not-given' | 'yes-no-not-given';
  correct: 'true' | 'false' | 'not-given' | 'yes' | 'no';
}

export interface ReadingMatchingQuestion extends ReadingQuestionBase {
  // Any of the matching families that resolve to a single option per row.
  type:
    | 'matching-information'
    | 'matching-headings'
    | 'matching-features'
    | 'matching-sentence-endings';
  leftItem: string;             // stem to match ("Paragraph B" / "Feature X" / "Beginning of sentence 4")
  options: { id: string; text: string }[]; // shared bank, defined once per group
  correct: string;              // option id
  // If true, options can be used more than once across sibling questions.
  reusable?: boolean;
}

export type ReadingQuestion =
  | ReadingFillQuestion
  | ReadingMCQQuestion
  | ReadingMCQMultiQuestion
  | ReadingTFNGQuestion
  | ReadingMatchingQuestion;

// ─── Passage & sections ─────────────────────────────────────────────

// Passages are paragraph-tagged so matching-headings and
// matching-information can point at a specific block. Rendered as HTML-safe
// prose; no markdown parsing in the runner.
export interface ReadingParagraph {
  label:  string;                // 'A', 'B', 'C' — student-visible tag
  text:   string;                // one paragraph, plain prose
}

export interface ReadingPassage {
  id:            string;         // 'r1-s1-p1'
  title:         string;
  // Optional subtitle / dek shown below the title.
  subtitle?:     string;
  // For Section 1 (social survival) a section may contain multiple short
  // texts (e.g. a set of adverts). All other sections use a single passage.
  paragraphs:    ReadingParagraph[];
  // Optional source attribution — genuine IELTS lists source at the foot.
  sourceNote?:   string;
}

export interface ReadingSection {
  number: 1 | 2 | 3;
  // GT Reading structure:
  //   Section 1 → social survival (1-2 short texts, notices/adverts)
  //   Section 2 → work-related (training/HR/workplace)
  //   Section 3 → long text of general interest (like Academic Section 1)
  contextType: 'social-survival' | 'workplace' | 'general-interest';
  title: string;
  scenario: string;              // 1-line teacher-facing summary
  instructions: string;          // shown to student above the section
  passages: ReadingPassage[];    // 1 for Sections 2-3, 1-2 for Section 1
  questions: ReadingQuestion[];
  // Suggested time (min) the student should spend — GT test allocates
  // ~20/20/20 across sections.
  targetDurationMin: number;
}

export interface ReadingMock {
  id: string;                    // 'reading-gt-mock-1'
  title: string;                 // 'Mock 1 · General Training Reading'
  level: 'General Training';     // Academic support comes later
  createdAt: string;             // ISO
  targetBandRange: [IELTSBandScore, IELTSBandScore];
  sections: [ReadingSection, ReadingSection, ReadingSection];
  totalQuestions: 40;
  totalDurationMin: 60;
}

// ─── Grading & diagnostics ──────────────────────────────────────────

export type StudentReadingAnswers = Record<string, string | string[]>;

export interface ReadingQuestionMark {
  questionId: string;
  studentAnswer: string | string[] | undefined;
  correct: boolean;
  acceptedAnswer: string;
  reasonWrong?:
    | 'blank' | 'spelling' | 'over-word-limit'
    | 'wrong-option' | 'wrong-tfng' | 'multiple-when-one';
  trapMatched?: string;
}

export interface ReadingSectionBreakdown {
  section: 1 | 2 | 3;
  correct: number;
  total: number;                 // GT is ~14/13/13 depending on mock
  pct: number;
}

export interface ReadingTypeBreakdown {
  type: ReadingQuestionType;
  correct: number;
  total: number;
  pct: number;
}

export interface ReadingCognitiveBreakdown {
  load: CognitiveLoad;
  correct: number;
  total: number;
  pct: number;
}

export interface ReadingRecommendation {
  focus: 'section' | 'type' | 'cognitive';
  targetTag: string;
  message: string;
}

export interface ReadingGradeResult {
  mockId: string;
  submittedAt: string;
  rawScore: number;              // out of 40
  band: IELTSBandScore;
  bandLabel: BandBracket['label'];
  perQuestion: ReadingQuestionMark[];
  sectionBreakdown: ReadingSectionBreakdown[];
  typeBreakdown: ReadingTypeBreakdown[];
  cognitiveBreakdown: ReadingCognitiveBreakdown[];
  recommendations: ReadingRecommendation[];
}

export type ReadingSessionMode = 'exam' | 'practice' | 'review';
