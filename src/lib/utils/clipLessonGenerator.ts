// FriendlyTeaching.cl — Algorithmic 7-slide Friendlyflix® CLT deck generator
//
// Generates the surrounding slides for a Friendlyflix® clip lesson without
// touching an LLM. Uses the Free Dictionary API for pronunciations /
// definitions, and simple heuristics for grammar focus + practice items.
//
// Ordering (8 generator slides + 1 teacher-authored insert):
//   1. clip_cover
//   2. clip_vocab_match
//   3. clip_predictions
//   [teacher: clip_dialogue_game]   ← video interaction (splice at index 3)
//   4. clip_comprehension            ← default from generator; teacher can override
//   5. clip_language_focus
//   6. clip_controlled_practice      ← 8 varied items across 6 formats
//   7. clip_production               ← free practice
//   8. friendlyflix_end

import type {
  Slide, LessonLevel, VocabWord, PracticeItem, ClipData, QuizQuestion,
} from '@/types/firebase';

// ─── Stopwords / helpers ────────────────────────────────────────

const STOPWORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'from','is','are','was','were','be','been','being','have','has','had','do',
  'does','did','will','would','could','should','may','might','must','shall',
  'can','need','i','you','he','she','it','we','they','me','him','her','us',
  'them','my','your','his','its','our','their','this','that','these','those',
  'not','no','so','up','out','if','about','all','just','like','when','what',
  'how','who','which','where','as','than','then','now','oh','yeah','hey','na',
  "don't","can't","won't","i'm","i'll","i've","you're","it's","ain't",
  "they're","we're","she's","he's","that's","there's","here's","some","any",
  'here','there','because','while','after','before','over','under','into','onto',
]);

function cleanWord(w: string): string {
  return w.replace(/[^a-zA-Z']/g, '').toLowerCase();
}

function getContentWords(text: string): string[] {
  const clean = text.replace(/\{\{blank\}\}/g, ' ').replace(/____/g, ' ');
  return clean
    .split(/\s+/)
    .map(cleanWord)
    .filter(w => w.length >= 4 && !STOPWORDS.has(w) && /^[a-z]+$/.test(w));
}

function uniquePreserveOrder<T>(arr: T[]): T[] {
  const seen = new Set<T>();
  const out: T[] = [];
  for (const item of arr) {
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function pickVocabTarget(level: LessonLevel): number {
  switch (level) {
    case 'A0': case 'A1': return 5;
    case 'A2':            return 6;
    case 'B1':            return 6;
    case 'B1+':           return 7;
    case 'B2':            return 7;
    case 'C1':            return 8;
    default:              return 6;
  }
}

// ─── Free Dictionary API ────────────────────────────────────────

interface DictEntry {
  phonetic?: string;
  meanings: Array<{
    definitions: Array<{ definition: string; example?: string }>;
  }>;
}

async function lookupWord(word: string): Promise<{ phonetic?: string; definition: string } | null> {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data: DictEntry[] = await res.json();
    const first = data[0];
    if (!first) return null;
    const def = first.meanings[0]?.definitions[0]?.definition ?? '';
    if (!def) return null;
    // Trim to a student-friendly length.
    const trimmed = def.length > 90 ? def.slice(0, 87).trim() + '…' : def;
    return { phonetic: first.phonetic, definition: trimmed };
  } catch {
    return null;
  }
}

// ─── Grammar focus detection ────────────────────────────────────
//
// Very simple heuristic: scan the dialogue for the highest-signal pattern
// and pick that as the focus. Falls back to "past simple" if nothing hits.

interface GrammarFocus {
  name:  string;      // "Past simple", "Modals of possibility", etc.
  short: string;      // "past-simple" — used as grammarTopic
  rules: [string, string, string];  // 3 mini-rules for the language focus bullets
}

const FOCI: Array<{ test: RegExp; focus: GrammarFocus }> = [
  // High-signal B2/C1 patterns are listed first so complex structures win
  // over generic ones when they actually appear in the dialogue. Passive
  // voice is deliberately EXCLUDED from auto-detection — it's everywhere
  // and would drown out more distinctive structures. Set it via focusOverride.
  {
    test: /\bif\b[^.?!]*\bhad\b[^.?!]*\b(would|could|might)\s+have\b/i,
    focus: {
      name:  'Third conditional',
      short: 'third-conditional',
      rules: [
        'IF + past perfect (had + past participle) → WOULD / COULD / MIGHT HAVE + past participle.',
        'Use it for imagined past outcomes that never happened: "If I had known, I would have called".',
        'Never use WOULD in the IF-clause — the IF side stays in past perfect.',
      ],
    },
  },
  {
    test: /\b(never|rarely|seldom|hardly ever|not only|no sooner)\b\s+(had|has|have|did|do|does|were|was|is|are|will)\b/i,
    focus: {
      name:  'Inversion',
      short: 'inversion',
      rules: [
        'When a negative adverbial opens the sentence (never, rarely, seldom, not only…), the auxiliary comes BEFORE the subject.',
        '"Never have I seen such a thing" — not "Never I have seen".',
        'Inversion signals emphasis or formality; use it in writing and rhetorical speech, not casual chat.',
      ],
    },
  },
  {
    test: /\bwish(es|ed)?\b\s+\b(i|you|he|she|it|we|they|[a-z]+)\b\s+\b(had|would|could|were|was)\b/i,
    focus: {
      name:  'Wish / If only',
      short: 'wish-if-only',
      rules: [
        'WISH + past simple regrets a present situation: "I wish I knew" = I don\'t know now.',
        'WISH + past perfect regrets a past action: "I wish I had said something" = I didn\'t say it.',
        'WISH + would criticises or asks for a change in someone else\'s behaviour: "I wish you would listen".',
      ],
    },
  },
  {
    test: /\b(have|has|had|get|got|getting|having)\s+[A-Za-z ]+\s+(done|made|repaired|fixed|cut|cleaned|checked|installed|delivered|painted)\b/i,
    focus: {
      name:  'Causative have / get',
      short: 'causative',
      rules: [
        'HAVE / GET + object + past participle = arrange for someone else to do it. "I had my hair cut" = a barber cut it.',
        'GET is more informal than HAVE; both are grammatical: "I got my car fixed" ≈ "I had my car fixed".',
        'Contrast with the active: "I cut my hair" implies YOU did it yourself — a very different meaning.',
      ],
    },
  },
  {
    test: /\bby the time\b[^.?!]*(will have|have|has)\s+\w+ed\b|\b(will|going to)\s+have\s+\w+(ed|en)\b/i,
    focus: {
      name:  'Future perfect',
      short: 'future-perfect',
      rules: [
        'WILL HAVE + past participle: an action that will be finished before a point in the future.',
        'Common with BY + time marker: "By 2030, we will have replaced most cashiers with self-checkouts".',
        'Don\'t confuse with future continuous (will be + -ing) — future perfect is about completion, not process.',
      ],
    },
  },
  {
    test: /\b(would|could|might|may)\b/i,
    focus: {
      name:  'Modals of possibility',
      short: 'modals',
      rules: [
        'Use MODAL + base verb to talk about what is possible, likely or hypothetical.',
        'Would / could / might soften the claim — they signal an opinion, not a fact.',
        'The base verb after the modal never takes -s or -ed: "she might come", not "she might comes".',
      ],
    },
  },
  {
    test: /\b(have|has)\s+(been|got|had|done|made|seen|gone|come)/i,
    focus: {
      name:  'Present perfect',
      short: 'present-perfect',
      rules: [
        'HAVE / HAS + past participle links a past action to the present moment.',
        'Use it for experiences ("I have seen…") and unfinished time ("this year", "so far").',
        'For a finished moment in the past ("yesterday", "last week"), switch to past simple.',
      ],
    },
  },
  {
    test: /\bgoing to\b/i,
    focus: {
      name:  'Future with "going to"',
      short: 'be-going-to',
      rules: [
        '(BE) + GOING TO + base verb states a plan or a prediction based on evidence.',
        'Choose "going to" over WILL when the decision was made BEFORE the moment of speaking.',
        'In fast speech "going to" often collapses to gonna — recognise it, don\'t write it.',
      ],
    },
  },
  {
    test: /\bif\b.+\b(would|will)\b/i,
    focus: {
      name:  'Conditionals',
      short: 'conditionals',
      rules: [
        'First conditional (if + present → will + base) talks about real future possibilities.',
        'Second conditional (if + past → would + base) talks about hypothetical or unreal situations.',
        'The IF-clause and the result-clause never both take WILL — pick one side for the modal.',
      ],
    },
  },
  {
    test: /\b(was|were)\s+\w+ing\b/i,
    focus: {
      name:  'Past continuous',
      short: 'past-continuous',
      rules: [
        'WAS / WERE + verb-ING describes an action in progress at a past moment.',
        'Combine with past simple for interruptions: "I was reading WHEN she called".',
        'Don\'t use it for permanent states — "I was knowing him" is wrong; use past simple instead.',
      ],
    },
  },
  {
    test: /\b(said|told|asked)\b.+\b(that|to)\b/i,
    focus: {
      name:  'Reported speech',
      short: 'reported-speech',
      rules: [
        'SAID / TOLD / ASKED + THAT shifts direct speech into indirect.',
        'Tenses usually step back one: present → past, past → past perfect, will → would.',
        'Pronouns and time words shift too: "I / now / today" → "he-she / then / that day".',
      ],
    },
  },
];

const DEFAULT_FOCUS: GrammarFocus = {
  name:  'Past simple',
  short: 'past-simple',
  rules: [
    'Past simple is the default tense for finished actions in the past.',
    'Regular verbs add -ed (walked, wanted); irregular verbs take their own form (went, said, took).',
    'For questions and negatives use DID / DIDN\'T + base verb: "Did she leave?" — not "Did she left?".',
  ],
};

// Extra foci that are never auto-detected (either too common in dialogue
// to signal cleanly, or reserved for the manual override). They still
// need to resolve to a real GrammarFocus when the teacher picks them.
const MANUAL_ONLY_FOCI: Record<string, GrammarFocus> = {
  'passive-voice': {
    name:  'Passive voice',
    short: 'passive-voice',
    rules: [
      'BE + past participle shifts the focus from the DOER to the thing DONE: "The report was written by the intern".',
      'Use the passive when the doer is unknown, obvious, or less important than the action.',
      'The tense of BE tells you WHEN: "is written" (present), "was written" (past), "has been written" (perfect), "will be written" (future).',
    ],
  },
  'mixed-conditional': {
    name:  'Mixed conditional',
    short: 'mixed-conditional',
    rules: [
      'IF + past perfect → WOULD + base verb links a past hypothetical to a present result: "If she had taken the job, she would live abroad now".',
      'IF + past simple → WOULD HAVE + past participle links a present unreal state to a past result: "If I were more organised, I would have finished yesterday".',
      'Mixed conditionals are for when the CAUSE and the RESULT are in different times — otherwise use the second or third conditional.',
    ],
  },
  'future-continuous': {
    name:  'Future continuous',
    short: 'future-continuous',
    rules: [
      'WILL BE + verb-ING describes an action in progress at a specific moment in the future: "This time tomorrow I will be flying to Madrid".',
      'Use it for polite predictions about what someone is likely to be doing anyway: "Will you be using the printer later?".',
      'Contrast with future perfect (will HAVE + past participle) — continuous is about the process, perfect is about the completion.',
    ],
  },
};

// A GrammarFocus that ships in the auto-detect FOCI array is also
// available for manual override — we simply look it up by short name.
export function focusFromShort(short: string): GrammarFocus | null {
  if (!short) return null;
  const auto = FOCI.find(f => f.focus.short === short);
  if (auto) return auto.focus;
  if (MANUAL_ONLY_FOCI[short]) return MANUAL_ONLY_FOCI[short];
  if (short === 'past-simple') return DEFAULT_FOCUS;
  return null;
}

// UI-facing list of grammar focus options exposed by the algorithmic
// generator. Order matters: shown top-to-bottom in the editor dropdown,
// so we group by CEFR band for scanability.
export interface FocusOption { short: string; name: string; level: string }
export const FOCUS_OPTIONS: FocusOption[] = [
  // A2 / B1
  { short: 'past-simple',         name: 'Past simple',                    level: 'A2' },
  { short: 'past-continuous',     name: 'Past continuous',                level: 'A2/B1' },
  { short: 'present-perfect',     name: 'Present perfect',                level: 'B1' },
  { short: 'be-going-to',         name: 'Future with "going to"',         level: 'A2/B1' },
  { short: 'future-forms',        name: 'Future forms (will / present continuous)', level: 'B1' },
  { short: 'modals',              name: 'Modals of possibility',          level: 'B1' },
  { short: 'first-conditional',   name: 'First conditional',              level: 'B1' },
  // B2
  { short: 'past-perfect',        name: 'Past perfect',                   level: 'B2' },
  { short: 'passive-voice',       name: 'Passive voice',                  level: 'B2' },
  { short: 'second-conditional',  name: 'Second conditional',             level: 'B2' },
  { short: 'reported-speech',     name: 'Reported speech',                level: 'B2' },
  { short: 'causative',           name: 'Causative have / get',           level: 'B2' },
  { short: 'wish-if-only',        name: 'Wish / If only',                 level: 'B2' },
  { short: 'future-perfect',      name: 'Future perfect',                 level: 'B2' },
  { short: 'future-continuous',   name: 'Future continuous',              level: 'B2' },
  // B2+ / C1
  { short: 'third-conditional',   name: 'Third conditional',              level: 'B2+' },
  { short: 'mixed-conditional',   name: 'Mixed conditional',              level: 'C1' },
  { short: 'inversion',           name: 'Inversion (negative adverbials)',level: 'C1' },
];

function detectFocus(dialogue: string): GrammarFocus {
  for (const f of FOCI) {
    if (f.test.test(dialogue)) return f.focus;
  }
  return DEFAULT_FOCUS;
}

// ─── Theme detection (Predictions + Production labels) ────────────────
//
// Free Production and Predictions bullets carry a short label ("The
// Warning — …", "The Chemistry — …"). Rather than reuse the same three
// labels for every clip, we detect a mood from the title + dialogue +
// source and pick labels handcrafted to fit that flavour. AI2027 becomes
// "The Warning / Your Prediction / Sound Byte"; a Breaking Bad clip
// becomes "The Turn / In Your Life / The Line"; a rom-com becomes
// "The Moment / Your Story / Steal It".

type ClipMood =
  | 'tech-ai'
  | 'news'
  | 'thriller'
  | 'romantic'
  | 'comedy'
  | 'coming-of-age'
  | 'default';

const CLIP_MOOD_HINTS: Array<{ pattern: RegExp; mood: ClipMood }> = [
  { pattern: /\b(ai|artificial\s+intelligence|algorithm|robot|automation|silicon|dataset|neural|gpt|llm|machine\s+learning)\b/i, mood: 'tech-ai' },
  { pattern: /\b(bbc|cnn|reuters|reporter|minister|government|official|police\s+said|breaking\s+news|world\s+service|documentary)\b/i, mood: 'news' },
  { pattern: /\b(kill|dead|threat|secret|missing|betray|enemy|attack|danger|blood|weapon|revenge|prison|escape|hostage|drug|cartel|detective|suspect)\b/i, mood: 'thriller' },
  { pattern: /\b(love|kiss|marry|heart|forever|romance|feelings|date|flirt|adore|wedding)\b/i, mood: 'romantic' },
  { pattern: /\b(laugh|joke|funny|silly|comedy|hilarious|absurd|prank)\b/i, mood: 'comedy' },
  { pattern: /\b(school|college|first\s+time|graduation|prom|dream|future|grow\s+up|coming\s+of\s+age|kid|teen)\b/i, mood: 'coming-of-age' },
];

function detectClipMood(title: string, source: string, dialogue: string): ClipMood {
  // Title + source weigh more than dialogue because a clip's identity
  // sits in its framing, not the noise of a specific scene's dialogue.
  const primary   = `${title} ${source}`;
  const secondary = dialogue.slice(0, 2000);
  const firstPass  = CLIP_MOOD_HINTS.find(h => h.pattern.test(primary));
  if (firstPass) return firstPass.mood;
  const secondPass = CLIP_MOOD_HINTS.find(h => h.pattern.test(secondary));
  return secondPass?.mood ?? 'default';
}

interface PredictionLabels { setup: string; mood: string; personal: string }
interface ProductionLabels { moment: string; personal: string; carry: string }

const PREDICTION_LABELS: Record<ClipMood, PredictionLabels> = {
  'tech-ai':       { setup: 'The Prediction', mood: 'The Angle',      personal: 'Your Take'      },
  'news':          { setup: 'The Story',      mood: 'The Angle',      personal: 'Sound Familiar?' },
  'thriller':      { setup: 'The Setup',      mood: 'The Tension',    personal: 'A Hunch?'       },
  'romantic':      { setup: 'The Setup',      mood: 'The Chemistry',  personal: 'Ever Felt It?'  },
  'comedy':        { setup: 'The Setup',      mood: 'The Vibe',       personal: 'Been There?'    },
  'coming-of-age': { setup: 'The Moment',     mood: 'The Feeling',    personal: 'Remember That?' },
  'default':       { setup: 'The Setup',      mood: 'The Mood',       personal: 'Been There?'    },
};

const PRODUCTION_LABELS: Record<ClipMood, ProductionLabels> = {
  'tech-ai':       { moment: 'The Warning',    personal: 'Your Prediction', carry: 'Sound Byte' },
  'news':          { moment: 'The Headline',   personal: 'Your Take',       carry: 'Sound Byte' },
  'thriller':      { moment: 'The Turn',       personal: 'In Your Life',    carry: 'The Line'   },
  'romantic':      { moment: 'The Moment',     personal: 'Your Story',      carry: 'Steal It'   },
  'comedy':        { moment: 'The Punchline',  personal: 'Your Story',      carry: 'Steal It'   },
  'coming-of-age': { moment: 'The Turn',       personal: 'Your Story',      carry: 'Hold Onto It' },
  'default':       { moment: 'The Line',       personal: 'In Your Life',    carry: 'Steal It'   },
};

const PREDICTION_HERO_QUESTIONS: Record<ClipMood, string> = {
  'tech-ai':       'A scene from {source} — what future is it about to show us?',
  'news':          'A report from {source} — what angle do you think it will take?',
  'thriller':      'A scene from {source} — what do you think is about to go wrong?',
  'romantic':      'A scene from {source} — where do you think this is heading?',
  'comedy':        'A scene from {source} — what is the joke going to be?',
  'coming-of-age': 'A scene from {source} — what moment do you think we are about to see?',
  'default':       'A scene from {source} — what do you think is about to happen?',
};

const PRODUCTION_HERO_QUESTIONS: Record<ClipMood, string> = {
  'tech-ai':       'You have seen the scenario — over to you.',
  'news':          'You have watched the report — over to you.',
  'thriller':      'You have seen how it plays out — over to you.',
  'romantic':      'You have seen how it unfolds — over to you.',
  'comedy':        'You have seen the punchline land — over to you.',
  'coming-of-age': 'You have seen the moment — over to you.',
  'default':       'Now that you have watched — over to you.',
};

// ─── Slide builders ─────────────────────────────────────────────

function buildCover(title: string, source: string, level: LessonLevel, clipData: ClipData): Slide {
  return {
    type: 'clip_cover',
    title,
    subtitle: source,
    content: level,
    phase: 'pre',
    clipData,
  };
}

function buildPredictions(title: string, source: string, dialogue: string, clipData: ClipData): Slide {
  const mood   = detectClipMood(title, source, dialogue);
  const labels = PREDICTION_LABELS[mood];
  const hero   = PREDICTION_HERO_QUESTIONS[mood].replace('{source}', source);

  const setupQ = mood === 'tech-ai'
    ? 'What future do you think this scene shows?'
    : mood === 'news'
      ? 'What story do you think is about to be told?'
      : mood === 'thriller'
        ? 'What is about to go wrong?'
        : mood === 'romantic'
          ? 'Who is about to fall for whom?'
          : mood === 'comedy'
            ? 'What is the setup for the joke?'
            : mood === 'coming-of-age'
              ? 'What moment do you think we are about to see?'
              : 'What just happened right before this scene?';

  const moodQ = mood === 'tech-ai'
    ? 'Utopia, dystopia, or somewhere in between?'
    : mood === 'news'
      ? 'What angle do you expect: hopeful, alarming, neutral?'
      : mood === 'thriller'
        ? 'How tense is this going to get?'
        : mood === 'romantic'
          ? 'Sparks, awkwardness, or heartbreak?'
          : mood === 'comedy'
            ? 'Physical, awkward, or dry humor?'
            : mood === 'coming-of-age'
              ? 'Nostalgic, cringe, or bittersweet?'
              : 'Do you expect tension, humor, or something quieter?';

  const personalQ = mood === 'tech-ai'
    ? 'What is your own gut feeling about AI in 10 years?'
    : mood === 'news'
      ? 'Have you followed a story like this before?'
      : mood === 'thriller'
        ? 'What do you think is really going on here?'
        : mood === 'romantic'
          ? 'Have you ever been in a moment like this?'
          : mood === 'comedy'
            ? 'What kind of humor makes you laugh out loud?'
            : mood === 'coming-of-age'
              ? 'Do you remember your version of this moment?'
              : `Have you lived a moment like the one in "${title}"?`;

  return {
    type: 'clip_predictions',
    title: 'Before you watch',
    phase: 'pre',
    prompt: hero,
    content: [
      `• ${labels.setup} — ${setupQ}`,
      `• ${labels.mood} — ${moodQ}`,
      `• ${labels.personal} — ${personalQ}`,
    ].join('\n'),
    clipData,
  };
}

async function buildVocab(dialogue: string, level: LessonLevel): Promise<Slide> {
  const target = pickVocabTarget(level);
  const lines = dialogue.split('\n').map(l => l.trim()).filter(Boolean);

  // Rank content words by frequency across the dialogue.
  const freq = new Map<string, number>();
  for (const w of getContentWords(dialogue)) {
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  const ranked = [...freq.entries()]
    .sort((a, b) => (b[1] - a[1]) || (b[0].length - a[0].length))
    .map(([w]) => w);

  const candidates = uniquePreserveOrder(ranked).slice(0, target * 2);

  const words: VocabWord[] = [];
  for (const w of candidates) {
    if (words.length >= target) break;
    const meta = await lookupWord(w);
    if (!meta) continue;
    const example =
      lines.find(l => l.toLowerCase().split(/\W+/).includes(w)) ?? lines[0] ?? '';
    words.push({
      word:          w,
      translation:   meta.definition,
      pronunciation: meta.phonetic ?? undefined,
      example,
    });
  }

  // If we couldn't get definitions for enough words, pad with the raw candidates
  // (better a bare word than no vocab slide).
  for (const w of candidates) {
    if (words.length >= target) break;
    if (words.some(v => v.word === w)) continue;
    const example =
      lines.find(l => l.toLowerCase().split(/\W+/).includes(w)) ?? lines[0] ?? '';
    words.push({ word: w, translation: '(definition unavailable)', example });
  }

  return {
    type: 'clip_vocab_match',
    title: 'Key vocabulary',
    phase: 'pre',
    words,
  };
}

function buildLanguageFocus(dialogue: string, focus: GrammarFocus): Slide {
  const lines = dialogue.split('\n').map(l => l.trim()).filter(Boolean);
  // Find up to 3 example lines that actually contain the focus pattern.
  const matcher = FOCI.find(f => f.focus.short === focus.short)?.test;
  const examples: VocabWord[] = [];
  if (matcher) {
    for (const line of lines) {
      if (examples.length >= 3) break;
      if (matcher.test(line)) {
        examples.push({
          word:        focus.name,
          translation: 'Look for the pattern in this line from the scene.',
          example:     line,
        });
      }
    }
  }
  if (examples.length === 0 && lines.length > 0) {
    examples.push({
      word:        focus.name,
      translation: 'Notice how this line uses the target structure.',
      example:     lines[0],
    });
  }

  const [r1, r2, r3] = focus.rules;
  const content = [
    `${focus.name} is a structure that shows up right in the dialogue you just watched. Two things matter: the form, and when you'd actually use it.`,
    `• ${r1}`,
    `• ${r2}`,
    `• ${r3}`,
    `The lines below are your anchor — every time you drill ${focus.name} in the next slide, come back to them.`,
  ].join('\n');

  return {
    type: 'clip_language_focus',
    title: `Language focus: ${focus.name}`,
    phase: 'while',
    content,
    words: examples,
  };
}

// ─── Comprehension (post-viewing quiz) ────────────────────────────────
//
// The teacher can override these questions in the editor. When they
// leave the comprehension form empty we still ship a default deck so
// every clip lesson has a real "what did you catch?" check.

function buildComprehensionSlide(dialogue: string): Slide {
  const rawLines = dialogue
    .split('\n')
    .map(l => l.replace(/\{\{\s*blank\s*\}\}/gi, '').replace(/_{2,}/g, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  // Prefer speakable, sentence-length lines. Skip 1-word interjections,
  // paragraph-long monologues, and lines that leaked bracket markers.
  const lines = rawLines.filter(l => {
    if (/\{\{|\}\}|_{2,}/.test(l)) return false;
    const wc = l.split(/\s+/).length;
    return wc >= 4 && wc <= 22;
  });
  const usable = lines.length >= 4 ? lines : rawLines;
  if (usable.length < 2) {
    // Fallback: cannot build meaningful comprehension without content.
    return {
      type: 'clip_comprehension',
      title: 'Comprehension',
      phase: 'while',
      questions: [],
    };
  }

  function makeQuestion(qText: string, correctLine: string, distractors: string[]): QuizQuestion {
    const opts = shuffle([correctLine, ...distractors.slice(0, 3)]).map((t, i) => ({
      id: `c${i}`,
      text: t,
      isCorrect: t === correctLine,
    }));
    return { question: qText, options: opts, correctAnswer: correctLine };
  }

  const anchorAt = (frac: number) =>
    usable[Math.max(0, Math.min(usable.length - 1, Math.floor(usable.length * frac)))] ?? usable[0];

  // 6 anchor lines spread evenly through the scene so the quiz walks the
  // student across opening → middle → close instead of clustering.
  const positions = [0.10, 0.25, 0.40, 0.55, 0.72, 0.88];
  const anchors: string[] = [];
  for (const p of positions) {
    const line = anchorAt(p);
    if (!anchors.includes(line)) anchors.push(line);
  }
  const used = new Set(anchors);
  const pool = shuffle(usable.filter(l => !used.has(l)));

  const prompts = [
    'Which line opens the scene?',
    'Which line comes just after the opening?',
    'Which line lands mid-scene?',
    'Which line hits the turning point?',
    'Which line comes near the end?',
    'Which line brings the scene to a close?',
  ];
  const questions: QuizQuestion[] = anchors.map((line, i) => {
    const distractors = pool.slice(i * 3, i * 3 + 3);
    return makeQuestion(prompts[i] ?? `Which line appears in the scene?`, line, distractors);
  }).filter(q => q.options.length >= 2);

  return {
    type: 'clip_comprehension',
    title: 'Comprehension',
    phase: 'while',
    questions,
  };
}

// ─── Controlled practice — grammar-first templates ────────────────────
//
// Rewritten August 2026 after the "asquerosisimamente roto" incident.
// Prior versions scraped raw dialogue lines and produced garbage items
// like `{{blank}} was that they would` or a verb_form with "strategist"
// as the base verb. The new approach:
//
//   1. Every practice item comes from a curated grammar template bank
//      — sentences hand-written to demonstrate the target structure
//      cleanly, with pre-picked target verb + base + wrong forms.
//   2. Dialogue is used ONLY to pick a proper-noun name (character or
//      place) to substitute into templates so the exercises feel
//      themed. When we can't detect a good name we ship the templates
//      unchanged.
//   3. Anything with a "{{blank}}" marker is sanitized before use so
//      dialogue_game placeholders never leak into practice.
//   4. Custom grammar labels (Passive Voice for Processes, Standup
//      language patterns, etc.) fall back to a neutral bank of clean
//      sentences — imperfect but presentable. AI mode is the right path
//      for those; algorithmic mode aims for "usable" here.

interface GrammarTemplate {
  sentence: string;          // full model sentence using the target grammar
  targetForm: string;        // exact verb form that fills the blank
  baseVerb: string;          // shown in parentheses of the verb_form blank
  wrongForms: [string, string, string]; // 3 plausible distractors of the SAME verb
  wrongVersion: string;      // error-correction wrongText (same sentence, grammar broken)
  splitAt: number;           // word index for match_halves (0-based, before which word to split)
}

// Sentence-level distractors that DO NOT demonstrate the target grammar.
// Used by multiple_selection: correct = template.sentence, wrong = these.
type SentenceDistractors = readonly [string, string, string];

interface GrammarBank {
  templates: GrammarTemplate[];
  mcDistractors: SentenceDistractors; // 3 sentences that FAIL to use the grammar
  openStem: string;
}

const BANK: Record<string, GrammarBank> = {
  'past-perfect': {
    templates: [
      {
        sentence: 'By the time the meeting ended, everyone had left the office.',
        targetForm: 'had left', baseVerb: 'leave',
        wrongForms: ['left', 'has left', 'was leaving'],
        wrongVersion: 'By the time the meeting ended, everyone left the office.',
        splitAt: 7,
      },
      {
        sentence: 'She realized she had forgotten her keys at home.',
        targetForm: 'had forgotten', baseVerb: 'forget',
        wrongForms: ['forgot', 'has forgotten', 'was forgetting'],
        wrongVersion: 'She realized she forgot her keys at home.',
        splitAt: 3,
      },
      {
        sentence: 'When we arrived, the film had already started.',
        targetForm: 'had already started', baseVerb: 'start',
        wrongForms: ['already started', 'has already started', 'was already starting'],
        wrongVersion: 'When we arrived, the film already started.',
        splitAt: 3,
      },
      {
        sentence: 'By the age of twenty, she had written her first novel.',
        targetForm: 'had written', baseVerb: 'write',
        wrongForms: ['wrote', 'has written', 'was writing'],
        wrongVersion: 'By the age of twenty, she wrote her first novel.',
        splitAt: 6,
      },
      {
        sentence: 'Before the storm hit, the villagers had already left the coast.',
        targetForm: 'had already left', baseVerb: 'leave',
        wrongForms: ['already left', 'has already left', 'were already leaving'],
        wrongVersion: 'Before the storm hit, the villagers already left the coast.',
        splitAt: 4,
      },
      {
        sentence: 'He had never travelled abroad before he turned thirty.',
        targetForm: 'had never travelled', baseVerb: 'travel',
        wrongForms: ['never travelled', 'has never travelled', 'was never travelling'],
        wrongVersion: 'He never travelled abroad before he turned thirty.',
        splitAt: 4,
      },
    ],
    mcDistractors: [
      'She left the office before the meeting ended.',
      'He forgets his keys every morning.',
      'They were writing the report last week.',
    ],
    openStem: 'By the time I got home, I ',
  },
  'past-simple': {
    templates: [
      {
        sentence: 'Yesterday she walked to work in the rain.',
        targetForm: 'walked', baseVerb: 'walk',
        wrongForms: ['walks', 'walking', 'was walking'],
        wrongVersion: 'Yesterday she walks to work in the rain.',
        splitAt: 3,
      },
      {
        sentence: 'They finished the project last Friday afternoon.',
        targetForm: 'finished', baseVerb: 'finish',
        wrongForms: ['finish', 'were finishing', 'have finished'],
        wrongVersion: 'They finish the project last Friday afternoon.',
        splitAt: 2,
      },
      {
        sentence: 'We went to the cinema together on Saturday.',
        targetForm: 'went', baseVerb: 'go',
        wrongForms: ['go', 'going', 'have gone'],
        wrongVersion: 'We go to the cinema together on Saturday.',
        splitAt: 3,
      },
      {
        sentence: 'He wrote the letter before the sun came up.',
        targetForm: 'wrote', baseVerb: 'write',
        wrongForms: ['writes', 'was writing', 'has written'],
        wrongVersion: 'He writes the letter before the sun came up.',
        splitAt: 4,
      },
      {
        sentence: 'The children played in the yard until it got dark.',
        targetForm: 'played', baseVerb: 'play',
        wrongForms: ['play', 'were playing', 'have played'],
        wrongVersion: 'The children play in the yard until it got dark.',
        splitAt: 4,
      },
      {
        sentence: 'She spoke to the manager about the mistake.',
        targetForm: 'spoke', baseVerb: 'speak',
        wrongForms: ['speaks', 'was speaking', 'has spoken'],
        wrongVersion: 'She speaks to the manager about the mistake.',
        splitAt: 3,
      },
    ],
    mcDistractors: [
      'She was walk to work every day.',
      'They has finish the project last week.',
      'We goes to the cinema on Saturday.',
    ],
    openStem: 'Yesterday I ',
  },
  'present-perfect': {
    templates: [
      {
        sentence: 'She has lived in this city for ten years.',
        targetForm: 'has lived', baseVerb: 'live',
        wrongForms: ['lived', 'lives', 'is living'],
        wrongVersion: 'She lived in this city for ten years.',
        splitAt: 3,
      },
      {
        sentence: 'They have already finished the report.',
        targetForm: 'have already finished', baseVerb: 'finish',
        wrongForms: ['already finished', 'were already finishing', 'already finish'],
        wrongVersion: 'They already finished the report.',
        splitAt: 2,
      },
      {
        sentence: 'I have never seen a film that scary before.',
        targetForm: 'have never seen', baseVerb: 'see',
        wrongForms: ['never saw', 'never see', 'was never seeing'],
        wrongVersion: 'I never saw a film that scary before.',
        splitAt: 4,
      },
      {
        sentence: 'We have known each other since we were children.',
        targetForm: 'have known', baseVerb: 'know',
        wrongForms: ['knew', 'know', 'were knowing'],
        wrongVersion: 'We knew each other since we were children.',
        splitAt: 3,
      },
      {
        sentence: 'He has just left the building through the back door.',
        targetForm: 'has just left', baseVerb: 'leave',
        wrongForms: ['just left', 'was just leaving', 'just leaves'],
        wrongVersion: 'He just leaves the building through the back door.',
        splitAt: 4,
      },
      {
        sentence: 'The team has worked on this design for months.',
        targetForm: 'has worked', baseVerb: 'work',
        wrongForms: ['worked', 'was working', 'works'],
        wrongVersion: 'The team worked on this design for months.',
        splitAt: 3,
      },
    ],
    mcDistractors: [
      'She lived in this city ten years ago.',
      'They was finishing the report yesterday.',
      'I saw a film that scary last night.',
    ],
    openStem: 'I have ',
  },
  'past-continuous': {
    templates: [
      {
        sentence: 'I was reading in bed when the phone rang.',
        targetForm: 'was reading', baseVerb: 'read',
        wrongForms: ['read', 'have read', 'reads'],
        wrongVersion: 'I read in bed when the phone rang.',
        splitAt: 4,
      },
      {
        sentence: 'They were watching the game while it rained outside.',
        targetForm: 'were watching', baseVerb: 'watch',
        wrongForms: ['watched', 'have watched', 'were watch'],
        wrongVersion: 'They watched the game while it rained outside.',
        splitAt: 3,
      },
      {
        sentence: 'She was cooking dinner when the guests arrived.',
        targetForm: 'was cooking', baseVerb: 'cook',
        wrongForms: ['cooked', 'has cooked', 'cooks'],
        wrongVersion: 'She cooked dinner when the guests arrived.',
        splitAt: 3,
      },
      {
        sentence: 'We were driving down the coast when we saw the whale.',
        targetForm: 'were driving', baseVerb: 'drive',
        wrongForms: ['drove', 'have driven', 'drives'],
        wrongVersion: 'We drove down the coast when we saw the whale.',
        splitAt: 3,
      },
      {
        sentence: 'The kids were playing outside while I finished the emails.',
        targetForm: 'were playing', baseVerb: 'play',
        wrongForms: ['played', 'have played', 'plays'],
        wrongVersion: 'The kids played outside while I finished the emails.',
        splitAt: 3,
      },
      {
        sentence: 'He was talking on the phone when the door opened.',
        targetForm: 'was talking', baseVerb: 'talk',
        wrongForms: ['talked', 'has talked', 'talks'],
        wrongVersion: 'He talked on the phone when the door opened.',
        splitAt: 3,
      },
    ],
    mcDistractors: [
      'I read in bed when the phone rang.',
      'They watched the game while rain outside.',
      'She cook dinner when the guests arrived.',
    ],
    openStem: 'While I was walking home, ',
  },
  'modals': {
    templates: [
      {
        sentence: 'She might come to the meeting later this afternoon.',
        targetForm: 'might come', baseVerb: 'come',
        wrongForms: ['might comes', 'might came', 'might coming'],
        wrongVersion: 'She might comes to the meeting later this afternoon.',
        splitAt: 3,
      },
      {
        sentence: 'You could try the new restaurant on Main Street.',
        targetForm: 'could try', baseVerb: 'try',
        wrongForms: ['could tries', 'could tried', 'could trying'],
        wrongVersion: 'You could tried the new restaurant on Main Street.',
        splitAt: 3,
      },
      {
        sentence: 'They may need more time to finish the report.',
        targetForm: 'may need', baseVerb: 'need',
        wrongForms: ['may needs', 'may needed', 'may needing'],
        wrongVersion: 'They may needs more time to finish the report.',
        splitAt: 3,
      },
      {
        sentence: 'We should leave now if we want to catch the train.',
        targetForm: 'should leave', baseVerb: 'leave',
        wrongForms: ['should leaves', 'should left', 'should leaving'],
        wrongVersion: 'We should left now if we want to catch the train.',
        splitAt: 3,
      },
      {
        sentence: 'He might not agree with the plan at first.',
        targetForm: 'might not agree', baseVerb: 'agree',
        wrongForms: ['might not agrees', 'might not agreed', 'might not agreeing'],
        wrongVersion: 'He might not agrees with the plan at first.',
        splitAt: 4,
      },
      {
        sentence: 'You should tell her the truth before it is too late.',
        targetForm: 'should tell', baseVerb: 'tell',
        wrongForms: ['should tells', 'should told', 'should telling'],
        wrongVersion: 'You should told her the truth before it is too late.',
        splitAt: 3,
      },
    ],
    mcDistractors: [
      'She might comes to the meeting later.',
      'You could tried the new restaurant.',
      'They may needs more time.',
    ],
    openStem: 'If I had more time, I might ',
  },
  'be-going-to': {
    templates: [
      {
        sentence: 'I am going to call her after the meeting ends.',
        targetForm: 'am going to call', baseVerb: 'call',
        wrongForms: ['going to call', 'am going call', 'am going to calling'],
        wrongVersion: 'I going to call her after the meeting ends.',
        splitAt: 5,
      },
      {
        sentence: 'She is going to travel to Japan next spring.',
        targetForm: 'is going to travel', baseVerb: 'travel',
        wrongForms: ['going to travel', 'is going travel', 'is going to travels'],
        wrongVersion: 'She going to travel to Japan next spring.',
        splitAt: 4,
      },
      {
        sentence: 'They are going to move to a new office next month.',
        targetForm: 'are going to move', baseVerb: 'move',
        wrongForms: ['going to move', 'are going move', 'are going to moves'],
        wrongVersion: 'They going to move to a new office next month.',
        splitAt: 5,
      },
      {
        sentence: 'We are going to watch the sunset from the rooftop.',
        targetForm: 'are going to watch', baseVerb: 'watch',
        wrongForms: ['going to watch', 'are going watch', 'are going to watches'],
        wrongVersion: 'We going to watch the sunset from the rooftop.',
        splitAt: 5,
      },
      {
        sentence: 'He is going to start his own company after graduation.',
        targetForm: 'is going to start', baseVerb: 'start',
        wrongForms: ['going to start', 'is going start', 'is going to starts'],
        wrongVersion: 'He going to start his own company after graduation.',
        splitAt: 4,
      },
      {
        sentence: 'You are going to love the new season of the show.',
        targetForm: 'are going to love', baseVerb: 'love',
        wrongForms: ['going to love', 'are going love', 'are going to loves'],
        wrongVersion: 'You going to love the new season of the show.',
        splitAt: 5,
      },
    ],
    mcDistractors: [
      'I calling her after the meeting.',
      'She travels to Japan next spring.',
      'They move to a new office next month.',
    ],
    openStem: 'Next weekend I am going to ',
  },
  'future-forms': {
    templates: [
      {
        sentence: 'I think it will rain tomorrow afternoon.',
        targetForm: 'will rain', baseVerb: 'rain',
        wrongForms: ['will rains', 'will rained', 'will raining'],
        wrongVersion: 'I think it will rains tomorrow afternoon.',
        splitAt: 3,
      },
      {
        sentence: 'She will finish the report before the weekend.',
        targetForm: 'will finish', baseVerb: 'finish',
        wrongForms: ['will finishes', 'will finished', 'will finishing'],
        wrongVersion: 'She will finishes the report before the weekend.',
        splitAt: 2,
      },
      {
        sentence: 'Next week I am flying to Buenos Aires for a conference.',
        targetForm: 'am flying', baseVerb: 'fly',
        wrongForms: ['fly', 'will fly', 'was flying'],
        wrongVersion: 'Next week I fly to Buenos Aires for a conference.',
        splitAt: 4,
      },
      {
        sentence: 'They will probably arrive around eight tonight.',
        targetForm: 'will probably arrive', baseVerb: 'arrive',
        wrongForms: ['probably arrives', 'will probably arrived', 'probably will arrives'],
        wrongVersion: 'They probably arrive around eight tonight.',
        splitAt: 3,
      },
      {
        sentence: 'She is meeting the client at nine tomorrow.',
        targetForm: 'is meeting', baseVerb: 'meet',
        wrongForms: ['meet', 'will meet', 'was meeting'],
        wrongVersion: 'She meet the client at nine tomorrow.',
        splitAt: 2,
      },
      {
        sentence: 'We will let you know as soon as we decide.',
        targetForm: 'will let', baseVerb: 'let',
        wrongForms: ['will lets', 'will letting', 'will letted'],
        wrongVersion: 'We will letting you know as soon as we decide.',
        splitAt: 2,
      },
    ],
    mcDistractors: [
      'I think it rains tomorrow afternoon.',
      'She finishes the report before the weekend last year.',
      'They probably arrived around eight tomorrow.',
    ],
    openStem: 'Next month I ',
  },
  'first-conditional': {
    templates: [
      {
        sentence: 'If it rains tomorrow, we will stay indoors all day.',
        targetForm: 'will stay', baseVerb: 'stay',
        wrongForms: ['stayed', 'would stay', 'stays'],
        wrongVersion: 'If it rains tomorrow, we would stay indoors all day.',
        splitAt: 4,
      },
      {
        sentence: 'If she calls back, I will let you know right away.',
        targetForm: 'will let', baseVerb: 'let',
        wrongForms: ['would let', 'let', 'lets'],
        wrongVersion: 'If she calls back, I would let you know right away.',
        splitAt: 5,
      },
      {
        sentence: 'If you miss the bus, you will have to walk.',
        targetForm: 'will have', baseVerb: 'have',
        wrongForms: ['would have', 'have', 'has'],
        wrongVersion: 'If you miss the bus, you would have to walk.',
        splitAt: 5,
      },
      {
        sentence: 'If they arrive early, we will start the meeting on time.',
        targetForm: 'will start', baseVerb: 'start',
        wrongForms: ['started', 'would start', 'starts'],
        wrongVersion: 'If they arrive early, we would start the meeting on time.',
        splitAt: 4,
      },
      {
        sentence: 'If I finish the report tonight, I will send it by morning.',
        targetForm: 'will send', baseVerb: 'send',
        wrongForms: ['would send', 'sent', 'sends'],
        wrongVersion: 'If I finish the report tonight, I would send it by morning.',
        splitAt: 6,
      },
      {
        sentence: 'If the traffic is bad, we will take the metro instead.',
        targetForm: 'will take', baseVerb: 'take',
        wrongForms: ['would take', 'took', 'takes'],
        wrongVersion: 'If the traffic is bad, we would take the metro instead.',
        splitAt: 5,
      },
    ],
    mcDistractors: [
      'If it will rain tomorrow, we stay indoors.',
      'If she will call back, I let you know.',
      'If you would miss the bus, you had to walk.',
    ],
    openStem: 'If it rains tomorrow, ',
  },
  'second-conditional': {
    templates: [
      {
        sentence: 'If I were you, I would speak to her directly.',
        targetForm: 'would speak', baseVerb: 'speak',
        wrongForms: ['will speak', 'spoke', 'speaks'],
        wrongVersion: 'If I was you, I will speak to her directly.',
        splitAt: 5,
      },
      {
        sentence: 'If she had more time, she would travel the world.',
        targetForm: 'would travel', baseVerb: 'travel',
        wrongForms: ['will travel', 'travelled', 'travels'],
        wrongVersion: 'If she had more time, she will travel the world.',
        splitAt: 5,
      },
      {
        sentence: 'If we lived closer, we would visit them every weekend.',
        targetForm: 'would visit', baseVerb: 'visit',
        wrongForms: ['will visit', 'visited', 'visits'],
        wrongVersion: 'If we lived closer, we will visit them every weekend.',
        splitAt: 5,
      },
      {
        sentence: 'If they knew the truth, they would react very differently.',
        targetForm: 'would react', baseVerb: 'react',
        wrongForms: ['will react', 'reacted', 'reacts'],
        wrongVersion: 'If they knew the truth, they will react very differently.',
        splitAt: 5,
      },
      {
        sentence: 'If I had a second chance, I would say yes without hesitating.',
        targetForm: 'would say', baseVerb: 'say',
        wrongForms: ['will say', 'said', 'says'],
        wrongVersion: 'If I had a second chance, I will say yes without hesitating.',
        splitAt: 6,
      },
      {
        sentence: 'If he studied more, he would pass the exam easily.',
        targetForm: 'would pass', baseVerb: 'pass',
        wrongForms: ['will pass', 'passed', 'passes'],
        wrongVersion: 'If he studied more, he will pass the exam easily.',
        splitAt: 5,
      },
    ],
    mcDistractors: [
      'If I am you, I will speak to her.',
      'If she has more time, she will travel.',
      'If we live closer, we visit them every weekend.',
    ],
    openStem: 'If I were you, I would ',
  },
  'passive-voice': {
    templates: [
      {
        sentence: 'The report was written by the intern in a single afternoon.',
        targetForm: 'was written', baseVerb: 'write',
        wrongForms: ['wrote', 'is written', 'has written'],
        wrongVersion: 'The report wrote by the intern in a single afternoon.',
        splitAt: 2,
      },
      {
        sentence: 'These devices are manufactured in factories across Southeast Asia.',
        targetForm: 'are manufactured', baseVerb: 'manufacture',
        wrongForms: ['manufacture', 'were manufactured', 'have manufactured'],
        wrongVersion: 'These devices manufactured in factories across Southeast Asia.',
        splitAt: 2,
      },
      {
        sentence: 'The proposal has been reviewed by the entire committee.',
        targetForm: 'has been reviewed', baseVerb: 'review',
        wrongForms: ['reviewed', 'was reviewed', 'have been reviewed'],
        wrongVersion: 'The proposal reviewed by the entire committee.',
        splitAt: 2,
      },
      {
        sentence: 'A new bridge is being built on the outskirts of the city.',
        targetForm: 'is being built', baseVerb: 'build',
        wrongForms: ['is built', 'was being built', 'is building'],
        wrongVersion: 'A new bridge is building on the outskirts of the city.',
        splitAt: 3,
      },
      {
        sentence: 'The paintings had been stolen long before the museum opened.',
        targetForm: 'had been stolen', baseVerb: 'steal',
        wrongForms: ['were stolen', 'have been stolen', 'stole'],
        wrongVersion: 'The paintings stole long before the museum opened.',
        splitAt: 2,
      },
      {
        sentence: 'Every message will be encrypted before it leaves the device.',
        targetForm: 'will be encrypted', baseVerb: 'encrypt',
        wrongForms: ['will encrypt', 'is encrypted', 'was encrypted'],
        wrongVersion: 'Every message will encrypt before it leaves the device.',
        splitAt: 2,
      },
    ],
    mcDistractors: [
      'The intern wrote the report in a single afternoon last week.',
      'They are manufacturing devices in Southeast Asia every year.',
      'The committee reviews the proposal thoroughly every quarter.',
    ],
    openStem: 'In my country, ',
  },
  'third-conditional': {
    templates: [
      {
        sentence: 'If I had known about the delay, I would have called you earlier.',
        targetForm: 'would have called', baseVerb: 'call',
        wrongForms: ['will have called', 'had called', 'would call'],
        wrongVersion: 'If I had known about the delay, I will have called you earlier.',
        splitAt: 7,
      },
      {
        sentence: 'She would have taken the job if they had offered it last year.',
        targetForm: 'would have taken', baseVerb: 'take',
        wrongForms: ['would take', 'had taken', 'will have taken'],
        wrongVersion: 'She would take the job if they had offered it last year.',
        splitAt: 1,
      },
      {
        sentence: 'If we had left ten minutes earlier, we might have caught the train.',
        targetForm: 'might have caught', baseVerb: 'catch',
        wrongForms: ['might catch', 'had caught', 'will have caught'],
        wrongVersion: 'If we had left ten minutes earlier, we might catch the train.',
        splitAt: 7,
      },
      {
        sentence: 'They would not have missed the meeting if you had reminded them.',
        targetForm: 'would not have missed', baseVerb: 'miss',
        wrongForms: ['would not miss', 'had not missed', 'will not have missed'],
        wrongVersion: 'They would not miss the meeting if you had reminded them.',
        splitAt: 1,
      },
      {
        sentence: 'If he had studied harder, he could have passed the exam easily.',
        targetForm: 'could have passed', baseVerb: 'pass',
        wrongForms: ['could pass', 'had passed', 'would passed'],
        wrongVersion: 'If he had studied harder, he could pass the exam easily.',
        splitAt: 6,
      },
      {
        sentence: 'We would have finished on time if the software had not crashed.',
        targetForm: 'would have finished', baseVerb: 'finish',
        wrongForms: ['would finish', 'had finished', 'will finish'],
        wrongVersion: 'We would finish on time if the software had not crashed.',
        splitAt: 1,
      },
    ],
    mcDistractors: [
      'If I would have known about the delay, I would have called you.',
      'She had taken the job if they will offer it last year.',
      'If we left ten minutes earlier, we might catch the train.',
    ],
    openStem: 'If I had known that earlier, ',
  },
  'mixed-conditional': {
    templates: [
      {
        sentence: 'If she had taken that job in Berlin, she would be living abroad now.',
        targetForm: 'would be living', baseVerb: 'live',
        wrongForms: ['would live', 'would have lived', 'will be living'],
        wrongVersion: 'If she had taken that job in Berlin, she will be living abroad now.',
        splitAt: 9,
      },
      {
        sentence: 'If I were more organised, I would have finished the report yesterday.',
        targetForm: 'would have finished', baseVerb: 'finish',
        wrongForms: ['would finish', 'had finished', 'will have finished'],
        wrongVersion: 'If I were more organised, I would finish the report yesterday.',
        splitAt: 6,
      },
      {
        sentence: 'They would not be so tired today if they had slept properly last night.',
        targetForm: 'would not be', baseVerb: 'be',
        wrongForms: ['would not have been', 'had not been', 'will not be'],
        wrongVersion: 'They would not have been so tired today if they had slept properly last night.',
        splitAt: 1,
      },
      {
        sentence: 'If he spoke better English, he would have got that promotion months ago.',
        targetForm: 'would have got', baseVerb: 'get',
        wrongForms: ['would get', 'had got', 'will have got'],
        wrongVersion: 'If he spoke better English, he would get that promotion months ago.',
        splitAt: 6,
      },
      {
        sentence: 'We would still be married if you had listened to me back then.',
        targetForm: 'would still be', baseVerb: 'be',
        wrongForms: ['would have been', 'had still been', 'will still be'],
        wrongVersion: 'We would have still been married if you had listened to me back then.',
        splitAt: 1,
      },
      {
        sentence: 'If I had learned to drive earlier, I would not need lifts from friends now.',
        targetForm: 'would not need', baseVerb: 'need',
        wrongForms: ['would not have needed', 'had not needed', 'will not need'],
        wrongVersion: 'If I had learned to drive earlier, I would not have needed lifts from friends now.',
        splitAt: 8,
      },
    ],
    mcDistractors: [
      'If she took that job in Berlin, she would live abroad now.',
      'If I were more organised, I will finish the report yesterday.',
      'They wouldn\'t have been tired today if they slept properly last night.',
    ],
    openStem: 'If I had made a different decision back then, ',
  },
  'causative': {
    templates: [
      {
        sentence: 'She had her hair cut at the new salon downtown.',
        targetForm: 'had her hair cut', baseVerb: 'cut',
        wrongForms: ['cut her hair', 'has cut her hair', 'was cutting her hair'],
        wrongVersion: 'She has her hair cut at the new salon downtown yesterday.',
        splitAt: 1,
      },
      {
        sentence: 'We are getting the kitchen painted next weekend.',
        targetForm: 'are getting the kitchen painted', baseVerb: 'paint',
        wrongForms: ['paint the kitchen', 'have painted the kitchen', 'were painting the kitchen'],
        wrongVersion: 'We paint the kitchen next weekend by a professional.',
        splitAt: 1,
      },
      {
        sentence: 'He has just had his laptop repaired at the tech store.',
        targetForm: 'has just had his laptop repaired', baseVerb: 'repair',
        wrongForms: ['just repaired his laptop', 'is just repairing his laptop', 'just had repaired his laptop'],
        wrongVersion: 'He has just repaired his laptop at the tech store himself.',
        splitAt: 1,
      },
      {
        sentence: 'They will have the documents translated by Friday afternoon.',
        targetForm: 'will have the documents translated', baseVerb: 'translate',
        wrongForms: ['will translate the documents', 'have translated the documents', 'are translating the documents'],
        wrongVersion: 'They will translate the documents by Friday afternoon by an agency.',
        splitAt: 1,
      },
      {
        sentence: 'I need to get my eyes tested before I renew my license.',
        targetForm: 'get my eyes tested', baseVerb: 'test',
        wrongForms: ['test my eyes', 'have tested my eyes', 'am testing my eyes'],
        wrongVersion: 'I need to test my eyes before I renew my license at the optician.',
        splitAt: 3,
      },
      {
        sentence: 'She had the plumbing fixed before selling the flat.',
        targetForm: 'had the plumbing fixed', baseVerb: 'fix',
        wrongForms: ['fixed the plumbing', 'has fixed the plumbing', 'was fixing the plumbing'],
        wrongVersion: 'She fixed the plumbing before selling the flat by a specialist.',
        splitAt: 1,
      },
    ],
    mcDistractors: [
      'She cut her hair at the new salon downtown last week.',
      'We paint the kitchen ourselves next weekend without help.',
      'He repaired his laptop at the tech store yesterday afternoon.',
    ],
    openStem: 'Last month I had ',
  },
  'wish-if-only': {
    templates: [
      {
        sentence: 'I wish I knew how to fix this without asking for help.',
        targetForm: 'knew', baseVerb: 'know',
        wrongForms: ['know', 'have known', 'am knowing'],
        wrongVersion: 'I wish I know how to fix this without asking for help.',
        splitAt: 3,
      },
      {
        sentence: 'She wishes she had studied medicine instead of law.',
        targetForm: 'had studied', baseVerb: 'study',
        wrongForms: ['studied', 'has studied', 'was studying'],
        wrongVersion: 'She wishes she studied medicine instead of law.',
        splitAt: 3,
      },
      {
        sentence: 'If only they would listen to the customers for once.',
        targetForm: 'would listen', baseVerb: 'listen',
        wrongForms: ['listen', 'listened', 'had listened'],
        wrongVersion: 'If only they listen to the customers for once.',
        splitAt: 3,
      },
      {
        sentence: 'We wish we had booked the tickets before the prices went up.',
        targetForm: 'had booked', baseVerb: 'book',
        wrongForms: ['booked', 'have booked', 'were booking'],
        wrongVersion: 'We wish we booked the tickets before the prices went up.',
        splitAt: 3,
      },
      {
        sentence: 'I wish my neighbours would turn the music down after midnight.',
        targetForm: 'would turn', baseVerb: 'turn',
        wrongForms: ['turn', 'turned', 'had turned'],
        wrongVersion: 'I wish my neighbours turn the music down after midnight.',
        splitAt: 4,
      },
      {
        sentence: 'If only she had said something at the meeting.',
        targetForm: 'had said', baseVerb: 'say',
        wrongForms: ['said', 'says', 'was saying'],
        wrongVersion: 'If only she said something at the meeting.',
        splitAt: 3,
      },
    ],
    mcDistractors: [
      'I wish I will know how to fix this problem.',
      'She wishes she has studied medicine instead of law.',
      'If only they listen to the customers next time.',
    ],
    openStem: 'I wish I ',
  },
  'inversion': {
    templates: [
      {
        sentence: 'Never have I seen a mistake as serious as this one.',
        targetForm: 'have I seen', baseVerb: 'see',
        wrongForms: ['I have seen', 'do I see', 'I saw'],
        wrongVersion: 'Never I have seen a mistake as serious as this one.',
        splitAt: 1,
      },
      {
        sentence: 'Rarely does she raise her voice in public.',
        targetForm: 'does she raise', baseVerb: 'raise',
        wrongForms: ['she does raise', 'she raises', 'is she raising'],
        wrongVersion: 'Rarely she raises her voice in public.',
        splitAt: 1,
      },
      {
        sentence: 'Not only did they win the match, they broke the record.',
        targetForm: 'did they win', baseVerb: 'win',
        wrongForms: ['they did win', 'they won', 'they have won'],
        wrongVersion: 'Not only they won the match, they broke the record.',
        splitAt: 2,
      },
      {
        sentence: 'Seldom had the team faced such a strong opponent before.',
        targetForm: 'had the team faced', baseVerb: 'face',
        wrongForms: ['the team had faced', 'the team faced', 'did the team face'],
        wrongVersion: 'Seldom the team had faced such a strong opponent before.',
        splitAt: 1,
      },
      {
        sentence: 'Hardly had we sat down when the alarm went off.',
        targetForm: 'had we sat', baseVerb: 'sit',
        wrongForms: ['we had sat', 'we sat', 'do we sit'],
        wrongVersion: 'Hardly we had sat down when the alarm went off.',
        splitAt: 1,
      },
      {
        sentence: 'Only after the storm did the pilots start the engines.',
        targetForm: 'did the pilots start', baseVerb: 'start',
        wrongForms: ['the pilots did start', 'the pilots started', 'have the pilots started'],
        wrongVersion: 'Only after the storm the pilots started the engines.',
        splitAt: 3,
      },
    ],
    mcDistractors: [
      'Never I have seen a mistake as serious as this one before.',
      'Rarely she raises her voice in public settings anymore.',
      'Not only they won the match but also broke the record.',
    ],
    openStem: 'Rarely have I ',
  },
  'future-perfect': {
    templates: [
      {
        sentence: 'By the end of the year, we will have moved into the new office.',
        targetForm: 'will have moved', baseVerb: 'move',
        wrongForms: ['will move', 'have moved', 'moved'],
        wrongVersion: 'By the end of the year, we will move into the new office.',
        splitAt: 8,
      },
      {
        sentence: 'She will have finished her degree by next June.',
        targetForm: 'will have finished', baseVerb: 'finish',
        wrongForms: ['will finish', 'has finished', 'finished'],
        wrongVersion: 'She will finish her degree by next June already.',
        splitAt: 2,
      },
      {
        sentence: 'By 2030, most cashiers will have been replaced by self-checkouts.',
        targetForm: 'will have been replaced', baseVerb: 'replace',
        wrongForms: ['will be replaced', 'have been replaced', 'were replaced'],
        wrongVersion: 'By 2030, most cashiers will be replaced by self-checkouts already.',
        splitAt: 4,
      },
      {
        sentence: 'They will have submitted the proposal before the deadline closes.',
        targetForm: 'will have submitted', baseVerb: 'submit',
        wrongForms: ['will submit', 'have submitted', 'submitted'],
        wrongVersion: 'They will submit the proposal before the deadline closes already.',
        splitAt: 2,
      },
      {
        sentence: 'By the time you arrive, I will have prepared everything.',
        targetForm: 'will have prepared', baseVerb: 'prepare',
        wrongForms: ['will prepare', 'have prepared', 'prepared'],
        wrongVersion: 'By the time you arrive, I will prepare everything.',
        splitAt: 6,
      },
      {
        sentence: 'He will have completed the marathon in under four hours.',
        targetForm: 'will have completed', baseVerb: 'complete',
        wrongForms: ['will complete', 'has completed', 'completed'],
        wrongVersion: 'He will complete the marathon in under four hours already.',
        splitAt: 2,
      },
    ],
    mcDistractors: [
      'By the end of the year, we moved into the new office.',
      'She will finish her degree next June by then already.',
      'By 2030, most cashiers will replace by self-checkouts.',
    ],
    openStem: 'By the end of next year, I ',
  },
  'reported-speech': {
    templates: [
      {
        sentence: 'She said that she would call me the next day.',
        targetForm: 'would call', baseVerb: 'call',
        wrongForms: ['will call', 'called', 'calls'],
        wrongVersion: 'She said that she will call me the next day.',
        splitAt: 5,
      },
      {
        sentence: 'He told them he had already spoken to the manager.',
        targetForm: 'had already spoken', baseVerb: 'speak',
        wrongForms: ['already spoke', 'has already spoken', 'was already speaking'],
        wrongVersion: 'He told them he has already spoken to the manager.',
        splitAt: 4,
      },
      {
        sentence: 'They asked if I knew the way to the station.',
        targetForm: 'knew', baseVerb: 'know',
        wrongForms: ['know', 'have known', 'was knowing'],
        wrongVersion: 'They asked if I know the way to the station.',
        splitAt: 4,
      },
      {
        sentence: 'She told me she was leaving the following morning.',
        targetForm: 'was leaving', baseVerb: 'leave',
        wrongForms: ['is leaving', 'left', 'leaves'],
        wrongVersion: 'She told me she is leaving the following morning.',
        splitAt: 4,
      },
      {
        sentence: 'He said he would meet us at the entrance.',
        targetForm: 'would meet', baseVerb: 'meet',
        wrongForms: ['will meet', 'met', 'meets'],
        wrongVersion: 'He said he will meet us at the entrance.',
        splitAt: 3,
      },
      {
        sentence: 'They said they had never been to that country before.',
        targetForm: 'had never been', baseVerb: 'be',
        wrongForms: ['never were', 'have never been', 'were never being'],
        wrongVersion: 'They said they have never been to that country before.',
        splitAt: 4,
      },
    ],
    mcDistractors: [
      'She said that she will call me tomorrow.',
      'He told them he has already spoken to the manager yesterday.',
      'They asked if I know the way to the station.',
    ],
    openStem: 'She said she ',
  },
};

// Fallback bank used when the language focus is a custom label the FOCI
// detector does not know about (e.g. "Passive Voice for Processes",
// "Cause and effect linkers"). The sentences are grammatically clean but
// generic — the AI mode is the right path for custom focus.
const NEUTRAL_BANK: GrammarBank = {
  templates: [
    {
      sentence: 'The team completed the project just before the deadline.',
      targetForm: 'completed', baseVerb: 'complete',
      wrongForms: ['completes', 'was completing', 'has completed'],
      wrongVersion: 'The team completes the project just before the deadline.',
      splitAt: 4,
    },
    {
      sentence: 'She explained the plan clearly to the whole class.',
      targetForm: 'explained', baseVerb: 'explain',
      wrongForms: ['explains', 'was explaining', 'has explained'],
      wrongVersion: 'She explains the plan clearly to the whole class yesterday.',
      splitAt: 3,
    },
    {
      sentence: 'They discussed the results after the meeting ended.',
      targetForm: 'discussed', baseVerb: 'discuss',
      wrongForms: ['discuss', 'was discussing', 'has discussed'],
      wrongVersion: 'They discuss the results after the meeting ended.',
      splitAt: 3,
    },
    {
      sentence: 'The report focused on three main ideas from the study.',
      targetForm: 'focused', baseVerb: 'focus',
      wrongForms: ['focuses', 'was focusing', 'has focused'],
      wrongVersion: 'The report focuses on three main ideas from the study yesterday.',
      splitAt: 4,
    },
    {
      sentence: 'He described the process step by step to the audience.',
      targetForm: 'described', baseVerb: 'describe',
      wrongForms: ['describes', 'was describing', 'has described'],
      wrongVersion: 'He describes the process step by step to the audience yesterday.',
      splitAt: 3,
    },
    {
      sentence: 'The teacher asked the students to compare the two cases.',
      targetForm: 'asked', baseVerb: 'ask',
      wrongForms: ['asks', 'was asking', 'has asked'],
      wrongVersion: 'The teacher asks the students to compare the two cases yesterday.',
      splitAt: 3,
    },
  ],
  mcDistractors: [
    'The team was completing the project just before the deadline.',
    'She explains the plan yesterday to the whole class.',
    'They was discussing the results after the meeting ended.',
  ],
  openStem: 'Reflecting on the scene, I ',
};

function bankForFocus(focus: GrammarFocus): GrammarBank {
  return BANK[focus.short] ?? NEUTRAL_BANK;
}

// Strip anything students should not see: dialogue_game blank markers,
// stray "___" fills, HTML entities, extra whitespace.
function sanitize(text: string): string {
  return text
    .replace(/\{\{\s*blank\s*\}\}/gi, '')
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/_{2,}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Detect a proper-noun character or place name in the dialogue so we can
// swap "he/she" for it in a couple of templates. Very light-touch — we
// only pick names that appear multiple times (avoids false positives on
// sentence-starting words). Returns null if nothing looks like a name.
const COMMON_START_WORDS = new Set([
  'The','A','An','I','You','He','She','It','We','They','My','Your','His','Her',
  'What','Who','Why','How','When','Where','Which',
  'That','This','These','Those',
  'Yes','No','Well','Okay','But','And','Or','So','Now','Then','Yeah',
  'Look','Listen','Watch','Hey',
]);
function extractName(dialogue: string): string | null {
  const counts = new Map<string, number>();
  const rx = /\b([A-Z][a-zA-Z]{2,})\b/g;
  const words = dialogue.match(rx) ?? [];
  for (const w of words) {
    if (COMMON_START_WORDS.has(w)) continue;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 1;
  for (const [w, c] of counts) {
    if (c > bestCount) { best = w; bestCount = c; }
  }
  return bestCount >= 2 ? best : null;
}

// Substitute the character name into a template's sentence and derived
// fields wherever "he/she/He/She" would otherwise appear as the subject.
function personalizeTemplate(t: GrammarTemplate, name: string | null): GrammarTemplate {
  if (!name) return t;
  const swap = (s: string) => s.replace(/^He\b/, name).replace(/^She\b/, name);
  return {
    ...t,
    sentence:     swap(t.sentence),
    wrongVersion: swap(t.wrongVersion),
  };
}

function buildOpenEndedItem(focus: GrammarFocus, stem: string): PracticeItem {
  return {
    type: 'open_ended',
    prompt: `Complete the sentence in your own words using ${focus.name}.`,
    answer: '',
    stem,
    grammarTopic: focus.name,
  };
}

function buildControlledPractice(dialogue: string, focus: GrammarFocus): Slide {
  const clean = sanitize(dialogue);
  const name = extractName(clean);
  const bank = bankForFocus(focus);
  const templates = shuffle(bank.templates.map(t => personalizeTemplate(t, name)));

  const pick = (i: number): GrammarTemplate => templates[i % templates.length];

  function fromTemplate(t: GrammarTemplate): { unscramble: PracticeItem; verb: PracticeItem; matchHalves: PracticeItem; errorCorrection: PracticeItem } {
    const s = t.sentence;
    const words = s.replace(/[.!?,]$/, '').split(/\s+/);
    const scrambled = shuffle(words).join(' / ');
    const first  = words.slice(0, t.splitAt).join(' ');
    const second = words.slice(t.splitAt).join(' ');
    // Match-halves distractors: 3 wrong second-halves harvested from OTHER templates.
    const distractors = shuffle(
      templates.filter(x => x !== t).slice(0, 6).map(x => {
        const xs = x.sentence.replace(/[.!?,]$/, '').split(/\s+/);
        return xs.slice(x.splitAt).join(' ');
      })
    ).slice(0, 3);

    return {
      unscramble: {
        type: 'unscramble',
        prompt: scrambled,
        answer: s.replace(/[.!?,]$/, ''),
        grammarTopic: focus.name,
        contextLine: s,
      },
      verb: {
        type: 'verb_form',
        // Use the {{blank}} marker so LanguagePracticeSlide.VerbFormCard
        // can splice the chosen answer inline where the missing word is,
        // instead of appending it after the sentence. The base verb hint
        // stays right next to the blank.
        prompt: s.replace(t.targetForm, `{{blank}} (${t.baseVerb})`),
        answer: t.targetForm,
        options: shuffle([t.targetForm, ...t.wrongForms]),
        grammarTopic: focus.name,
        contextLine: s,
      },
      matchHalves: {
        type: 'match_halves',
        prompt: first,
        answer: second,
        options: shuffle([second, ...distractors]).slice(0, 4),
        grammarTopic: focus.name,
        contextLine: s,
      },
      errorCorrection: {
        type: 'error_correction',
        prompt: 'Correct the mistake:',
        wrongText: t.wrongVersion,
        answer: s,
        grammarTopic: focus.name,
        contextLine: s,
      },
    };
  }

  const t0 = pick(0), t1 = pick(1), t2 = pick(2), t3 = pick(3), t4 = pick(4), t5 = pick(5);
  const b0 = fromTemplate(t0);
  const b1 = fromTemplate(t1);
  const b2 = fromTemplate(t2);
  const b3 = fromTemplate(t3);
  const b4 = fromTemplate(t4);
  const b5 = fromTemplate(t5);

  // Multiple selection: correct sentence uses the target grammar, three
  // distractors are DIFFERENT sentences that fail to use it.
  const multipleSelection: PracticeItem = {
    type: 'multiple_selection',
    prompt: `Which of these sentences uses ${focus.name} correctly?`,
    answer: t0.sentence,
    options: shuffle([t0.sentence, ...bank.mcDistractors]),
    grammarTopic: focus.name,
    contextLine: t0.sentence,
  };

  // 8 items in CLT ladder order — every item comes from a different
  // template so students see six different model sentences before hitting
  // the open-ended production bridge.
  const items: PracticeItem[] = [
    multipleSelection,
    b1.unscramble,
    b2.verb,
    b3.matchHalves,
    b4.unscramble,
    b5.verb,
    b0.errorCorrection,
    buildOpenEndedItem(focus, bank.openStem),
  ];

  return {
    type: 'clip_controlled_practice',
    title: 'Controlled practice',
    subtitle: focus.name,
    phase: 'post',
    practiceItems: items,
  };
}

function buildProduction(title: string, source: string, dialogue: string, focus: GrammarFocus, clipData: ClipData): Slide {
  // Free production must (a) hook back to the class topic, (b) invite a
  // personal-experience answer, and (c) push the student to actually use
  // the grammar structure taught earlier. Labels adapt to the clip's
  // detected mood so the same lesson never looks like another.
  const mood   = detectClipMood(title, source, dialogue);
  const labels = PRODUCTION_LABELS[mood];
  const hero   = PRODUCTION_HERO_QUESTIONS[mood];

  const momentQ = mood === 'tech-ai'
    ? 'Which moment made you most uneasy? Why?'
    : mood === 'news'
      ? 'Which detail stood out the most? Why?'
      : mood === 'thriller'
        ? 'When did you realise how it was going to end?'
        : mood === 'romantic'
          ? 'Which moment made you feel the most? Why?'
          : mood === 'comedy'
            ? 'Which line landed hardest for you? Why?'
            : mood === 'coming-of-age'
              ? 'Which moment felt closest to you? Why?'
              : 'Which line stayed with you? Why?';

  const personalQ = mood === 'tech-ai'
    ? `Predict a way AI could change your life. Try using ${focus.name}.`
    : mood === 'news'
      ? `React to the story in your own words. Try using ${focus.name}.`
      : mood === 'thriller'
        ? `Tell me about a time you felt trapped or under pressure. Try using ${focus.name}.`
        : mood === 'romantic'
          ? `Tell me about a moment you felt the same. Try using ${focus.name}.`
          : mood === 'comedy'
            ? `Tell me a similar story from your own life. Try using ${focus.name}.`
            : mood === 'coming-of-age'
              ? `Tell me about your version of this moment. Try using ${focus.name}.`
              : `Tell me about a time you felt the same. Try using ${focus.name}.`;

  const carryQ = mood === 'tech-ai' || mood === 'news'
    ? 'Pick one phrase from the clip. When could you use it?'
    : mood === 'comedy'
      ? 'Pick one line worth stealing. When would you drop it?'
      : mood === 'coming-of-age'
        ? 'Pick one line you want to hold on to. Why?'
        : 'Pick one phrase from the clip you want to use this week.';

  return {
    type: 'clip_production',
    title: 'Over to you',
    phase: 'post',
    prompt: hero,
    content: [
      `• ${labels.moment} — ${momentQ}`,
      `• ${labels.personal} — ${personalQ}`,
      `• ${labels.carry} — ${carryQ}`,
    ].join('\n'),
    clipData,
  };
}

function buildEnd(): Slide {
  return {
    type: 'friendlyflix_end',
    title: '¡Lección completada!',
    phase: 'post',
  };
}

// ─── Public entrypoint ──────────────────────────────────────────

export async function generateClipLessonAlgorithmically(
  title:    string,
  source:   string,
  dialogue: string,
  level:    LessonLevel,
  clipData: ClipData,
  focusOverride?: string,
): Promise<Slide[]> {
  const overridden = focusOverride ? focusFromShort(focusOverride) : null;
  const focus = overridden ?? detectFocus(dialogue);

  // Vocab lookup is the only network-bound step — parallelisable with the
  // pure builders below, but they're cheap so we just serialise for clarity.
  const vocab = await buildVocab(dialogue, level);

  return [
    buildCover(title, source, level, clipData),
    vocab,
    buildPredictions(title, source, dialogue, clipData),
    // clip_dialogue_game is teacher-authored; the editor splices it in
    // after predictions. Comprehension gets a default from us here — the
    // editor overrides it if the teacher wrote custom questions.
    buildComprehensionSlide(dialogue),
    buildLanguageFocus(dialogue, focus),
    buildControlledPractice(dialogue, focus),
    buildProduction(title, source, dialogue, focus, clipData),
    buildEnd(),
  ];
}
