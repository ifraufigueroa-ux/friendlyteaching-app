// FriendlyTeaching.cl — IELTS Writing types
//
// One prompt = one Task 1 or Task 2 exercise. The bank lives in
// src/lib/data/ielts/writing/. The simulator can either play a single prompt
// or bundle a Task 1 + Task 2 into a 60-min "full mock".

export type IELTSVersion = 'academic' | 'general-training';

/** Visual asset shown alongside Academic Task 1. Inline SVG so we don't
 *  depend on /public assets shipping alongside deploys. */
export interface WritingVisual {
  kind: 'bar' | 'line' | 'pie' | 'table' | 'map' | 'process';
  title: string;
  svg: string;   // raw <svg>…</svg> markup
}

export type IELTSLetterTone = 'formal' | 'semi-formal' | 'informal';

export interface AcademicTask1Prompt {
  id:            string;
  version:       'academic';
  task:          1;
  title:         string;
  prompt:        string;         // full "You should write at least 150 words…" text
  visual:        WritingVisual;
  minWords:      150;
  suggestedMin:  20;             // suggested time in minutes
  tags?:         string[];
}

export interface GTTask1Prompt {
  id:            string;
  version:       'general-training';
  task:          1;
  title:         string;
  prompt:        string;         // situation description
  bulletPoints:  string[];       // "In your letter: - explain… - describe… - suggest…"
  tone:          IELTSLetterTone;
  minWords:      150;
  suggestedMin:  20;
  tags?:         string[];
}

export interface Task2Prompt {
  id:            string;
  version:       IELTSVersion;    // T2 is nearly identical across versions
  task:          2;
  title:         string;
  prompt:        string;
  essayType:     'opinion' | 'discussion' | 'problem-solution' | 'advantage-disadvantage' | 'two-part';
  minWords:      250;
  suggestedMin:  40;
  tags?:         string[];
}

export type WritingPrompt = AcademicTask1Prompt | GTTask1Prompt | Task2Prompt;

// ─── Grading response ───────────────────────────────────────────────────────

export type IELTSBand =
  | 0 | 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 4.5
  | 5 | 5.5 | 6 | 6.5 | 7 | 7.5 | 8 | 8.5 | 9;

export interface CriterionScore {
  band:         IELTSBand;
  summary:      string;
  strengths:    string[];
  improvements: string[];
}

export interface WritingGradeResult {
  taskId:            string;
  version:           IELTSVersion;
  task:              1 | 2;
  wordCount:         number;
  overallBand:       IELTSBand;
  taskAchievement:   CriterionScore;   // Task Achievement (T1) or Task Response (T2)
  coherenceCohesion: CriterionScore;
  lexicalResource:   CriterionScore;
  grammarAccuracy:   CriterionScore;
  correctedVersion:  string;           // student's text rewritten to band 8+
  keyErrors:         string[];         // "…preposition: 'depend of' → 'depend on'"
}

// ─── Session ───────────────────────────────────────────────────────────────

export type WritingSessionMode = 'mock' | 'single';

export interface MockSessionState {
  mode:       'mock';
  version:    IELTSVersion;
  task1:      AcademicTask1Prompt | GTTask1Prompt;
  task2:      Task2Prompt;
  answers:    { t1: string; t2: string };
  activeTab:  1 | 2;
}

export interface SingleSessionState {
  mode:      'single';
  prompt:    WritingPrompt;
  answer:    string;
}

export type SessionState = MockSessionState | SingleSessionState;
