// FriendlyTeaching.cl — Friendlistenings® types
//
// A listening-driven CLT lesson. We reuse IELTS Listening's audio primitives
// (speakers + timestamped script lines, TTS generation pipeline) but wrap
// them in an 8-step communicative arc: Lead-in → Vocab → Prediction → Gist
// → Detail → Language Awareness → Controlled Practice → Production.
//
// Each step owns its own interactive shape — the runner dispatches on
// `kind` and renders the matching component. That keeps content declarative
// (one lesson = one .ts file) and lets teachers see at a glance what the
// student will do.

import type { ListeningSpeaker, ListeningScriptLine } from './ielts';

export type FLLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// ─── Primitive activity shapes ──────────────────────────────

/** One open-ended discussion prompt — no grading, used in lead-in /
 *  production. */
export interface FLOpenQuestion {
  id:     string;
  prompt: string;
  hint?:  string;
}

/** Multiple-choice question (single-correct by default; set `multi`
 *  for multi-correct). */
export interface FLMCQ {
  kind:     'mcq';
  id:       string;
  prompt:   string;
  options:  { id: string; text: string }[];
  correct:  string | string[];
  multi?:   boolean;
  explain?: string;
}

/** Gap-fill: one sentence with `___` markers, one accepted answer per
 *  blank (plus alternates). */
export interface FLGapFill {
  kind:     'gap-fill';
  id:       string;
  sentence: string;                 // e.g. "She ___ up changing her flight."
  answers:  string[];               // one per blank, case-insensitive
  alts?:    string[][];             // accepted alternatives per blank
  hint?:    string;
}

/** True/False/Not-given for gist checks. */
export interface FLTrueFalse {
  kind:     'true-false';
  id:       string;
  prompt:   string;
  correct:  'T' | 'F' | 'NG';
  explain?: string;
}

/** Union of all gradable question shapes used inside gist / detail /
 *  controlled-practice steps. The `kind` discriminator lets the runner
 *  dispatch without brittle "in q" probes. */
export type FLQuestion = FLMCQ | FLGapFill | FLTrueFalse;

/** Vocab item for the pre-teach panel. */
export interface FLVocabItem {
  id:          string;
  word:        string;                              // "off the beaten path"
  pos?:        'noun' | 'verb' | 'adjective' | 'phrase' | 'idiom' | 'adverb' | 'phrasal-verb';
  translation: string;                              // LatAm Spanish gloss
  example:     string;                              // short EN sentence (ideally from the script)
  soundsLike?: string;                              // "oh-ff-the-BEE-ten path"
  definition?: string;                              // short EN definition
}

/** Language-focus chunk extracted from the script. */
export interface FLChunk {
  id:       string;
  chunk:    string;                                 // "end up —ing"
  category: 'collocation' | 'phrasal-verb' | 'discourse-marker' | 'idiom' | 'register' | 'grammar-pattern';
  gloss:    string;                                 // ES
  example:  string;                                 // from the script
  notice:   string;                                 // teacher's "notice the structure" line
}

// ─── Steps (discriminated union) ────────────────────────────

/** Step 1 — Lead-in. Hook + schema-activation questions. */
export interface FLStepLeadIn {
  kind:          'lead-in';
  title:         string;              // "Antes de empezar"
  intro:         string;              // 1-2 sentences framing the topic in ES
  hookImage?:    string;              // optional /public/... path
  hookEmoji?:    string;
  openQuestions: FLOpenQuestion[];    // 2-3 discussion prompts
}

/** Step 2 — Pre-teach vocabulary + a short check. */
export interface FLStepVocab {
  kind:  'vocab';
  title: string;                      // "Vocabulario clave"
  intro: string;
  items: FLVocabItem[];               // 6-8
  quiz:  FLMCQ[];                     // 2-4 quick checks
}

/** Step 3 — Prediction. Student guesses what they'll hear BEFORE audio. */
export interface FLStepPrediction {
  kind:      'prediction';
  title:     string;                  // "¿Qué vas a escuchar?"
  intro:     string;
  questions: FLMCQ[];                 // 2-3 — explanations shown after gist
}

/** Step 4 — Listen for gist (first pass, big-picture). */
export interface FLStepGist {
  kind:              'gist';
  title:             string;          // "Escucha general"
  intro:             string;
  listenFor:         string[];        // 2-3 ES pointers shown next to the player
  questions:         (FLMCQ | FLTrueFalse)[];
  allowTranscript?:  boolean;         // usually false on gist
}

/** Step 5 — Listen for detail (second pass, specifics). */
export interface FLStepDetail {
  kind:             'detail';
  title:            string;           // "Escucha detallada"
  intro:            string;
  questions:        (FLMCQ | FLGapFill | FLTrueFalse)[];
  allowTranscript?: boolean;          // usually true on detail
}

/** Step 6 — Language awareness. Notice-the-gap on chunks pulled from the
 *  script. No grading — just discovery. */
export interface FLStepLanguageAwareness {
  kind:   'language-awareness';
  title:  string;                     // "Fijate en estas expresiones"
  intro:  string;
  chunks: FLChunk[];                  // 4-6
}

/** Step 7 — Controlled practice. Reuses the chunks + vocab from earlier
 *  steps in short exercises. */
export interface FLStepControlledPractice {
  kind:       'controlled-practice';
  title:      string;                 // "Práctica guiada"
  intro:      string;
  activities: (FLGapFill | FLMCQ)[];  // 4-6
}

/** Step 8 — Production. Free output. */
export interface FLStepProduction {
  kind:          'production';
  title:         string;              // "Ahora vos"
  intro:         string;
  mode:          'speaking' | 'writing';
  prompt:        string;
  targetChunks?: string[];            // chunk ids the student should try to use
  minSeconds?:   number;              // for speaking
  minWords?:     number;              // for writing
}

export type FLStep =
  | FLStepLeadIn
  | FLStepVocab
  | FLStepPrediction
  | FLStepGist
  | FLStepDetail
  | FLStepLanguageAwareness
  | FLStepControlledPractice
  | FLStepProduction;

export type FLStepKind = FLStep['kind'];

// ─── Lesson ─────────────────────────────────────────────────

export interface FLAudio {
  speakers:    ListeningSpeaker[];
  script:      ListeningScriptLine[];
  audioUrl?:   string;                // Firebase Storage URL once generated
  durationSec: number;                // target duration (used during TTS gen)
}

export interface FLLesson {
  id:            string;              // "b2-solo-backpacker"
  title:         string;              // "Off the beaten path"
  subtitle:      string;              // "A travel podcast interview"
  level:         FLLevel;
  topic:         string;              // "Solo travel"
  scenario:      string;              // 1-line teacher summary
  estimatedMin:  number;              // time budget for the whole lesson
  cover: {
    accent:     string;               // hex for the card border/accent
    emoji?:     string;               // 🎒 etc.
    image?:     string;               // optional Firebase Storage
  };
  audio:         FLAudio;
  steps:         FLStep[];            // 8 ordered steps
  tags?:         string[];            // e.g. ['travel', 'past-narratives']
  createdAt:     string;              // ISO
}
