// FriendlyTeaching.cl — TOEFL Academic Simulator types
//
// Independent-only MVP: full mock without the read+listen+write /
// read+listen+speak integrated tasks. Sections still run in the standard
// TOEFL order: Reading → Listening → Speaking → Writing.
//
// Scoring uses the official 0-30 per-section scale summed to 0-120.

import { Timestamp } from 'firebase/firestore';

// ── Sections ───────────────────────────────────────────────────────────────

export type TOEFLSection = 'reading' | 'listening' | 'speaking' | 'writing';

export const TOEFL_SECTIONS: TOEFLSection[] = ['reading', 'listening', 'speaking', 'writing'];

export const TOEFL_SECTION_META: Record<TOEFLSection, { icon: string; label: string; minutes: number }> = {
  reading:   { icon: '📖', label: 'Reading',   minutes: 35 },
  listening: { icon: '🎧', label: 'Listening', minutes: 20 },
  speaking:  { icon: '🎤', label: 'Speaking',  minutes: 8  },
  writing:   { icon: '✍️', label: 'Writing',   minutes: 15 },
};

// ── Reading ────────────────────────────────────────────────────────────────

export type TOEFLReadingQuestionType =
  | 'factual'
  | 'negative-factual'
  | 'vocabulary'
  | 'inference'
  | 'rhetorical-purpose'
  | 'sentence-simplification'
  | 'reference';

export interface TOEFLReadingQuestion {
  id:       string;
  type:     TOEFLReadingQuestionType;
  prompt:   string;
  options:  [string, string, string, string];
  correct:  0 | 1 | 2 | 3;
  /** Marks the paragraph (1-based) the question refers to — helps the UI
   *  scroll to the right place when the student clicks the question. */
  refPara?: number;
  explanation?: string;
}

export interface TOEFLReadingPassage {
  id:        string;
  title:     string;
  /** Paragraphs as a string array so the UI can index-scroll and highlight. */
  paragraphs: string[];
  wordCount: number;
  questions: TOEFLReadingQuestion[];
}

// ── Listening ──────────────────────────────────────────────────────────────

export type TOEFLListeningAudioType = 'lecture' | 'conversation';

export interface TOEFLListeningSpeaker {
  id:    string;      // 'prof', 'student-a', 'student-b'
  name:  string;      // 'Professor', 'Sarah'
  voice?: string;     // ElevenLabs voice id (populated at generation time)
}

export interface TOEFLListeningScriptLine {
  speakerId: string;
  text:      string;
}

export interface TOEFLListeningQuestion {
  id:       string;
  prompt:   string;
  options:  [string, string, string, string];
  correct:  0 | 1 | 2 | 3;
  explanation?: string;
}

export interface TOEFLListeningAudio {
  id:        string;                       // 'lecture-1', 'conv-1'
  type:      TOEFLListeningAudioType;
  title:     string;
  subject?:  string;                       // 'Astronomy', 'Campus life'
  speakers:  TOEFLListeningSpeaker[];
  script:    TOEFLListeningScriptLine[];
  questions: TOEFLListeningQuestion[];
}

// ── Speaking ───────────────────────────────────────────────────────────────

export interface TOEFLSpeakingPrompt {
  id:        string;
  prompt:    string;
  category:  string;                       // 'personal', 'opinion', 'choice'
  prepSec:   number;                       // typical 15
  speakSec:  number;                       // typical 45
}

// ── Writing ────────────────────────────────────────────────────────────────

/** Academic Discussion prompt (new TOEFL W-T2 format, 2023+). */
export interface TOEFLWritingPrompt {
  id:            string;
  professorPost: string;   // "Your professor is teaching a class on …"
  question:      string;   // "Which side of the debate do you support?"
  studentA:      { name: string; text: string };
  studentB:      { name: string; text: string };
  minWords:      number;   // AD: 100
  timerMin:      number;   // AD: 10
  /** Optional high-score sample answer. Shown to the student after they
   *  submit (in the WritingBreakdown), so they can see what a 5/5 response
   *  looks like next to their own text. `whyItWorks` is the teacher's
   *  short-form annotation of the moves the sample makes. */
  sampleAnswer?: {
    text:        string;
    scoreOn5:    number;     // 5 for a top sample
    whyItWorks?: string[];   // bullet points: what makes it high score
  };
}

/** Build a Sentence — student reorders shuffled word chips to form the
 *  target sentence. Auto-graded via exact string match against `correct`
 *  (and any `altCorrect` alternatives, e.g. contraction variants). */
export interface TOEFLBuildSentenceItem {
  id:           string;         // 'w1-bas-1'
  prompt:       string;         // Instruction shown above the chips
  chips:        string[];       // Shuffled word/phrase chips
  correct:      string;         // Canonical sentence (space-joined chips)
  altCorrect?:  string[];       // Optional alternative valid orderings
  teacherNote?: string;
}

/** Write an Email — student replies to a short scenario email covering
 *  three key points. AI-graded on a task-response + language rubric. */
export interface TOEFLEmailPrompt {
  id:              string;
  scenario:        string;      // 1-2 sentences framing the student's role
  receivedEmail:   {
    from:    string;            // 'Prof. Martin' / 'Housing Office'
    subject: string;
    body:    string;
  };
  taskInstruction: string;      // "Write a reply that addresses all three points."
  keyPoints:       string[];    // 3 bullets the reply must cover
  minWords:        number;      // typically 90
  timerMin:        number;      // typically 7
  sampleAnswer?: {
    text:        string;
    scoreOn5:    number;
    whyItWorks?: string[];
  };
}

/** Composite writing section — the three sub-tasks run in order (BAS →
 *  Email → AD) with their own timers. Replaces the single-prompt shape
 *  that `TOEFLMock.writing` used to hold. */
export interface TOEFLWritingSequence {
  buildSentence: TOEFLBuildSentenceItem[];   // 4-6 items, ~4 min total
  email:         TOEFLEmailPrompt;           // 1 email, ~7 min
  discussion:    TOEFLWritingPrompt;         // 1 AD prompt, ~10 min
}

// ── Mock ───────────────────────────────────────────────────────────────────

export interface TOEFLMock {
  id:              string;
  title:           string;
  reading:         TOEFLReadingPassage[];       // 2 passages
  listening:       TOEFLListeningAudio[];       // 1 lecture + 1 conversation
  speaking:        TOEFLSpeakingPrompt[];       // 4 prompts
  writing:         TOEFLWritingSequence;        // BAS + Email + AD
}

// ── Results ────────────────────────────────────────────────────────────────

/** Per-section 0-30. Sum = overall 0-120. */
export interface SectionScore {
  section:    TOEFLSection;
  raw?:       number;         // reading/listening: correct count
  outOf?:     number;         // reading/listening: total questions
  score:      number;         // 0-30 (final section score)
}

export interface ReadingAnswer {
  questionId: string;
  passageId:  string;
  selected:   0 | 1 | 2 | 3 | null;
  correct:    boolean;
  timeMs?:    number;
}

export interface ListeningAnswer {
  questionId: string;
  audioId:    string;
  selected:   0 | 1 | 2 | 3 | null;
  correct:    boolean;
  timeMs?:    number;
}

export interface SpeakingRecording {
  promptId:      string;
  storagePath:   string;   // Firebase Storage path (audio/toefl-speaking-…)
  audioUrl:      string;   // download URL with token
  durationSec:   number;
  transcript?:   string;
  aiScore?:      number;   // 0-4 raw, then mapped to 0-30 section-wide
  aiFeedback?:   string;
  aiRubric?: {
    delivery:         number;
    languageUse:      number;
    topicDevelopment: number;
  };
  aiStrengths?:    string[];
  aiImprovements?: string[];
  aiError?:        string;   // captured HTTP/network error message when grading failed
}

export interface WritingSubmission {
  promptId:     string;
  text:         string;
  wordCount:    number;
  aiScore?:     number;   // 0-5 raw, mapped to 0-30
  aiFeedback?:  string;
  aiRubric?:    {
    development:  number;
    organisation: number;
    languageUse:  number;
  };
  aiStrengths?:    string[];
  aiImprovements?: string[];
  aiError?:        string;   // captured HTTP/network error message when grading failed
}

/** Build a Sentence — auto-graded (no AI). One record per BAS item. */
export interface BuildSentenceAnswer {
  itemId:    string;         // matches TOEFLBuildSentenceItem.id
  answer:    string;         // student's constructed sentence
  correct:   boolean;
}

/** Write an Email — same AI-rubric shape as the AD, but scored 0-5 with
 *  its own weight in the writing-section score. */
export interface EmailSubmission {
  promptId:    string;
  text:        string;
  wordCount:   number;
  aiScore?:    number;   // 0-5 raw
  aiFeedback?: string;
  aiRubric?:   {
    taskResponse: number;
    organisation: number;
    languageUse:  number;
  };
  aiStrengths?:    string[];
  aiImprovements?: string[];
  aiError?:        string;
}

/** Full Writing section submission — the three sub-tasks combined.
 *  Persisted on the session; individual pieces still autosaved as they
 *  are produced. */
export interface WritingSectionSubmission {
  buildSentence: BuildSentenceAnswer[];
  email:         EmailSubmission;
  discussion:    WritingSubmission;
}

// ── Session ────────────────────────────────────────────────────────────────

export type TOEFLSessionStatus = 'in_progress' | 'completed' | 'partial';

/** Live progress inside the current section — written on every answer /
 *  navigation event so the runner can rehydrate mid-attempt. */
export interface TOEFLLiveSnapshot {
  section:      TOEFLSection;         // which section is in flight
  /** Reading: passage index. Listening: audio index. Others unused. */
  outerIdx:     number;
  /** Question index within the passage / audio (or task index for speaking). */
  innerIdx:     number;
  /** For listening: which phase inside the current audio ('play' | 'quiz'). */
  audioPhase?:  'play' | 'quiz';
  /** Seconds remaining on the section timer. */
  timeLeftSec:  number;
  /** Partial answers keyed by questionId — merged into results at finalise. */
  readingAnswers?:   ReadingAnswer[];
  listeningAnswers?: ListeningAnswer[];
  /** Listening notes textarea, keyed by audioId. */
  listeningNotes?:   Record<string, string>;
  /** Uploaded speaking recordings so a mid-section refresh keeps them. */
  speakingRecordings?: SpeakingRecording[];
  /** Draft of the Academic Discussion textarea — autosaved every few
   *  keystrokes so a refresh in the middle of the 10-min task doesn't wipe
   *  the response. Kept as the legacy field for backward compatibility
   *  with sessions started before the BAS+Email tasks landed. */
  writingText?: string;
  /** Which sub-task of the composite Writing section is active. */
  writingSubtask?: 'build-sentence' | 'email' | 'discussion';
  /** BAS answers so far, keyed by item id (matches TOEFLBuildSentenceItem.id). */
  buildSentenceAnswers?: Record<string, string>;
  /** Draft of the Email textarea — autosaved. */
  emailText?: string;
}

export interface TOEFLSession {
  id:              string;
  teacherId:       string;
  studentName:     string;
  studentEmail?:   string;
  linkedStudentId?: string;
  mockId:          string;
  /** Sections enabled at start (from ?sections=). Persisted so resume respects it. */
  enabledSections?: TOEFLSection[];
  results: {
    reading?:   { answers: ReadingAnswer[];    score: SectionScore };
    listening?: { answers: ListeningAnswer[];  score: SectionScore };
    speaking?:  { recordings: SpeakingRecording[]; score: SectionScore };
    writing?:   { submission: WritingSectionSubmission; score: SectionScore };
  };
  progress:        Partial<Record<TOEFLSection, 'pending' | 'in_progress' | 'completed' | 'skipped'>>;
  overallScore?:   number;   // 0-120 sum of section scores
  status:          TOEFLSessionStatus;
  /** Latest live snapshot for the in-flight section. Cleared on completion. */
  liveSnapshot?:          TOEFLLiveSnapshot;
  liveSnapshotUpdatedAt?: Timestamp;
  startedAt:       Timestamp;
  completedAt?:    Timestamp;
  createdAt:       Timestamp;
  updatedAt?:      Timestamp;
}

// ── Speaking assignments (teacher → student, async) ────────────────────────
//
// Assigned mocks that a student runs from their dashboard. Unlike the live
// full-mock flow, there's no timer for the whole test and no visible AI
// feedback — the student only sees a welcome, records the 4 prompts, and
// gets a "ask your teacher" thank-you. The teacher sees the full breakdown.

export type TOEFLSpeakingAssignmentStatus = 'assigned' | 'in_progress' | 'completed' | 'graded';
export type TOEFLWritingAssignmentStatus  = TOEFLSpeakingAssignmentStatus;

export interface TOEFLWritingAssignment {
  id:              string;
  teacherId:       string;
  /** Same public/registered semantics as TOEFLSpeakingAssignment. */
  studentId?:      string;
  studentName:     string;
  studentEmail?:   string;
  mockId:          string;
  status:          TOEFLWritingAssignmentStatus;
  submission?:     WritingSectionSubmission;
  overallScore?:   number;
  gradingError?:   string;
  createdAt:       Timestamp;
  startedAt?:      Timestamp;
  completedAt?:    Timestamp;
  gradedAt?:       Timestamp;
}

export interface TOEFLSpeakingAssignment {
  id:              string;
  teacherId:       string;
  /** When present, only that student (matched by uid) can open the assignment.
   *  When absent, the assignment is a public link — anyone with the URL can
   *  open it and identifies themselves via a name prompt on load. */
  studentId?:      string;
  studentName:     string;
  studentEmail?:   string;
  mockId:          string;   // 'mock-1' | 'mock-2' | 'mock-3' | 'mock-4'
  status:          TOEFLSpeakingAssignmentStatus;
  /** Recordings uploaded by the student. One per prompt. */
  recordings?:     SpeakingRecording[];
  /** Overall Speaking score 0-30 (only present when graded). */
  overallScore?:   number;
  /** Latest error from the auto-grading pipeline, if it failed. Teacher can retry. */
  gradingError?:   string;
  createdAt:       Timestamp;
  startedAt?:      Timestamp;
  completedAt?:    Timestamp;
  gradedAt?:       Timestamp;
}

// ── Scoring conversions ────────────────────────────────────────────────────

/** ETS-style raw → scaled score for Reading and Listening.
 *  Approximate table matching official published conversions (10 questions
 *  per passage, 2 passages = 20 for Reading; ~10-12 questions for Listening). */
export function readingRawToScaled(correct: number, totalQuestions: number): number {
  if (totalQuestions === 0) return 0;
  const pct = correct / totalQuestions;
  // Curve-ish mapping — favours the mid range (14-23) which is where most
  // real test-takers land. Extremes are rare.
  if (pct >= 0.95) return 30;
  if (pct >= 0.90) return 28;
  if (pct >= 0.85) return 26;
  if (pct >= 0.80) return 24;
  if (pct >= 0.75) return 22;
  if (pct >= 0.70) return 20;
  if (pct >= 0.65) return 18;
  if (pct >= 0.55) return 16;
  if (pct >= 0.45) return 13;
  if (pct >= 0.35) return 10;
  if (pct >= 0.25) return 7;
  return Math.round(pct * 12);
}

export function listeningRawToScaled(correct: number, totalQuestions: number): number {
  return readingRawToScaled(correct, totalQuestions);   // similar curve
}

/** Speaking: 4 tasks, each 0-4 raw. Sum (0-16) → 0-30 scaled per ETS table. */
export function speakingRawToScaled(taskScores: number[]): number {
  if (taskScores.length === 0) return 0;
  const sum = taskScores.reduce((a, b) => a + b, 0);
  const max = taskScores.length * 4;
  const pct = sum / max;
  if (pct >= 1)    return 30;
  if (pct >= 0.9)  return 28;
  if (pct >= 0.8)  return 26;
  if (pct >= 0.7)  return 23;
  if (pct >= 0.6)  return 20;
  if (pct >= 0.5)  return 17;
  if (pct >= 0.4)  return 14;
  if (pct >= 0.3)  return 10;
  if (pct >= 0.2)  return 7;
  return Math.round(pct * 12);
}

/** Writing: T2 Academic Discussion, 0-5 raw → 0-30 linear. Kept for
 *  backward compatibility and for standalone AD grading. */
export function writingRawToScaled(raw05: number): number {
  const clamped = Math.max(0, Math.min(5, raw05));
  return Math.round((clamped / 5) * 30);
}

/** Full Writing section score (0-30) from the three sub-task raw scores.
 *  Weights: BAS 20% (0-6), Email 30% (0-9), AD 50% (0-15). BAS raw is the
 *  fraction of items answered correctly (0-1). Email + AD raws are 0-5. */
export function writingSectionRawToScaled(parts: {
  basCorrectPct: number;    // 0..1, share of BAS items answered correctly
  emailRaw05:    number;    // 0..5 AI rubric
  adRaw05:       number;    // 0..5 AI rubric
}): number {
  const bas   = Math.max(0, Math.min(1, parts.basCorrectPct));
  const email = Math.max(0, Math.min(5, parts.emailRaw05)) / 5;
  const ad    = Math.max(0, Math.min(5, parts.adRaw05)) / 5;
  const weighted = bas * 6 + email * 9 + ad * 15;   // out of 30
  return Math.round(weighted);
}

/** CEFR-ish label for a total 0-120 score (rough guide for teachers). */
export function totalToCefrHint(total: number): string {
  if (total >= 110) return 'C2 mastery';
  if (total >= 95)  return 'C1 advanced';
  if (total >= 80)  return 'B2 upper-intermediate';
  if (total >= 60)  return 'B1+ intermediate';
  if (total >= 45)  return 'B1 lower-intermediate';
  if (total >= 30)  return 'A2 elementary';
  return 'A1 or below';
}
