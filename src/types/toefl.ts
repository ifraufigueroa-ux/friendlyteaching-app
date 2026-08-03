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
  minWords:      100;
  timerMin:      10;
}

// ── Mock ───────────────────────────────────────────────────────────────────

export interface TOEFLMock {
  id:              string;
  title:           string;
  reading:         TOEFLReadingPassage[];       // 2 passages
  listening:       TOEFLListeningAudio[];       // 1 lecture + 1 conversation
  speaking:        TOEFLSpeakingPrompt[];       // 4 prompts
  writing:         TOEFLWritingPrompt;          // 1 discussion prompt
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
    writing?:   { submission: WritingSubmission;    score: SectionScore };
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

/** Writing: T2 Academic Discussion, 0-5 raw → 0-15 (single-task MVP; the
 *  full mock with T1 would sum 0-10 → 0-30. Here we scale the single score
 *  linearly to 0-30 so overall stays comparable). */
export function writingRawToScaled(raw05: number): number {
  const clamped = Math.max(0, Math.min(5, raw05));
  return Math.round((clamped / 5) * 30);
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
