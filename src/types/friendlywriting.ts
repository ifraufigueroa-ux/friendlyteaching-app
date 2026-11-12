// FriendlyTeaching.cl — FriendlyWriting® types
//
// A CLT-scaffolded writing lesson that builds TOWARDS an IELTS writing
// task. Different product from the mock simulator in `ielts-writing.ts`:
// here the goal is pedagogy, not timed assessment. A student walks through
// Opening → Vocab → Brainstorm → Model → Practice → Wrap-up, and submits
// a piece for the teacher to review in the next class.
//
// Each step owns its own interactive shape — the runner dispatches on
// `kind`, same discriminated-union pattern used by [[friendlistenings]].

export type FWLevel = 'A2' | 'B1' | 'B2' | 'C1';

/** The IELTS task this lesson is building scaffolding toward. The register,
 *  grammar focus and brainstorm shape all follow from this. */
export type FWTaskType =
  | 'ielts-gt-t1-letter-informal'    // GT Task 1 informal letter (friend/family)
  | 'ielts-gt-t1-letter-semiformal'  // GT Task 1 semi-formal (manager, landlord, gym)
  | 'ielts-gt-t1-letter-formal'      // GT Task 1 formal (company, authority)
  | 'ielts-ac-t1-report'             // Academic Task 1 (data report)
  | 'ielts-t2-essay';                // Task 2 essay (any version)

// ─── Primitive shapes reused across steps ───────────────────

export interface FWVocabItem {
  id:           string;
  phrase:       string;             // "I'm writing to let you know that…"
  translation:  string;             // short LatAm Spanish gloss
  example:      string;             // natural EN sentence using the chunk
  useCase?:     string;             // "Opening a formal letter"
  category?:    'opener' | 'closer' | 'connector' | 'content' | 'register' | 'request';
}

export interface FWMiniCheck {
  id:       string;
  prompt:   string;
  options:  { id: string; text: string }[];
  correct:  string;
  explain?: string;
}

export interface FWBrainstormPrompt {
  id:       string;
  question: string;
  hint?:    string;
  starter?: string;                 // sentence starter the student can edit
  /** When true, the student's note here is surfaced inside the Practice
   *  step so they can pull their ideas into the draft. */
  carry?:   boolean;
}

export interface FWModelAnnotation {
  id:       string;
  /** Exact substring in modelText to highlight. The runner finds the
   *  first occurrence — keep each anchor unique in the model. */
  anchor:   string;
  label:    string;                 // "Opener" / "Giving a reason"
  tip:      string;                 // 1–2 sentence explanation
  category: 'structure' | 'grammar' | 'vocab' | 'register';
}

export interface FWTip {
  id:    string;
  title: string;
  body:  string;                    // short paragraph
}

export interface FWReflectionPrompt {
  id:      string;
  prompt:  string;
  starter?: string;
}

// ─── Steps (discriminated union) ────────────────────────────

/** Step 1 — Opening. CLT-style class-opening: topic, purpose, expected
 *  learning outcomes, and the grammar structures the lesson will target. */
export interface FWStepOpening {
  kind:              'opening';
  title:             string;                // "Today's class"
  topic:             string;                // "Writing a thank-you note"
  purpose:           string;                // "By the end, you'll…"
  learningOutcomes:  string[];              // CAN-DO descriptors
  grammarFocus:      string[];              // e.g. ["There is / there are", "linkers: and / but / so"]
  heroEmoji?:        string;
  intro:             string;                // one framing paragraph
}

/** Step 2 — Vocab / key phrases. Pre-teach the chunks the student will
 *  need in the writing. Mini-check is optional. */
export interface FWStepVocab {
  kind:        'vocab';
  title:       string;
  intro:       string;
  items:       FWVocabItem[];               // 6–10
  miniCheck?:  FWMiniCheck[];               // 0–3
}

/** Step 3 — Guided brainstorming. Short-answer prompts the student
 *  works through so they arrive at the writing with ideas, not a blank
 *  page. Notes get stored locally and (optionally) surfaced in Practice. */
export interface FWStepBrainstorm {
  kind:              'brainstorm';
  title:             string;                // "Let's gather ideas"
  intro:             string;
  prompts:           FWBrainstormPrompt[];  // 3–5
  /** When true, the Practice step shows the student's brainstorm notes
   *  next to the editor so they can pull ideas into the draft. */
  carryToPractice:   boolean;
}

/** Step 4 — Task modelling. Full model answer + anchored annotations
 *  + separate list of tips & tricks. */
export interface FWStepModel {
  kind:          'model';
  title:         string;                    // "A model answer"
  intro:         string;
  modelLabel:    string;                    // "Example letter" / "Example email"
  modelText:     string;                    // multi-line string with \n paragraphs
  annotations:   FWModelAnnotation[];       // 4–8
  tips:          FWTip[];                   // 2–4
}

/** Step 5 — Task practice. The student actually writes. */
export interface FWStepPractice {
  kind:                 'practice';
  title:                string;             // "Your turn"
  intro:                string;
  taskTitle:            string;             // "Email to your friend about your new flat"
  taskPrompt:           string;             // full prompt as the student will read it
  bulletPoints?:        string[];           // "In your letter: ..." bullets
  minWords:             number;
  suggestedMin:         number;
  /** Target phrases the student should try to include. References
   *  vocab-step item ids so the editor can show a live checklist. */
  targetPhraseIds?:     string[];
  /** Target grammar structures surfaced as a side panel in the editor. */
  targetStructures?:    string[];
}

/** Step 6 — Wrap-up. Teacher-friendly recap, student reflection prompts,
 *  and a line about what happens next class. */
export interface FWStepWrapUp {
  kind:          'wrap-up';
  title:         string;                    // "Wrap-up"
  intro:         string;
  recapPoints:   string[];                  // "Today you…"
  reflection?:   FWReflectionPrompt[];      // 1–3
  nextClass?:    string;                    // "Next class we'll…"
}

export type FWStep =
  | FWStepOpening
  | FWStepVocab
  | FWStepBrainstorm
  | FWStepModel
  | FWStepPractice
  | FWStepWrapUp;

export type FWStepKind = FWStep['kind'];

// ─── Lesson ─────────────────────────────────────────────────

export interface FWLesson {
  id:            string;                    // "a2-email-new-flat"
  title:         string;                    // "An email about your new flat"
  subtitle:      string;                    // "A short informal email"
  level:         FWLevel;
  taskType:      FWTaskType;
  topic:         string;                    // "Describing a place · informal register"
  scenario:      string;                    // 1-line teacher summary
  estimatedMin:  number;                    // class-length budget
  cover: {
    accent:     string;                     // hex for the card accent + step tint
    emoji?:     string;
    /** Two-stop gradient for the catalog card and the opening hero. */
    palette?:   { from: string; to: string };
  };
  steps:         FWStep[];                  // 6 ordered steps
  tags?:         string[];
  createdAt:     string;
}
