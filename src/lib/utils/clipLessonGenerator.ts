// FriendlyTeaching.cl — Algorithmic 7-slide Friendlyflix® CLT deck generator
//
// Generates the surrounding slides for a Friendlyflix® clip lesson without
// touching an LLM. Uses the Free Dictionary API for pronunciations /
// definitions, and simple heuristics for grammar focus + practice items.
//
// Ordering (7 slides, wrap around teacher-authored dialogue_game + comprehension):
//   1. clip_cover
//   2. clip_predictions
//   3. clip_vocab_match
//   [teacher: clip_dialogue_game]
//   [teacher: clip_comprehension]
//   4. clip_language_focus
//   5. clip_controlled_practice
//   6. clip_production
//   7. friendlyflix_end

import type {
  Slide, LessonLevel, VocabWord, PracticeItem, ClipData,
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

function detectFocus(dialogue: string): GrammarFocus {
  for (const f of FOCI) {
    if (f.test.test(dialogue)) return f.focus;
  }
  return {
    name:  'Past simple',
    short: 'past-simple',
    rules: [
      'Past simple is the default tense for finished actions in the past.',
      'Regular verbs add -ed (walked, wanted); irregular verbs take their own form (went, said, took).',
      'For questions and negatives use DID / DIDN\'T + base verb: "Did she leave?" — not "Did she left?".',
    ],
  };
}

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

function buildPredictions(title: string, source: string, clipData: ClipData): Slide {
  return {
    type: 'clip_predictions',
    title: 'Before you watch',
    phase: 'pre',
    prompt: `Imagine the moment right before this scene from ${source} — what do you think just happened?`,
    content: [
      `• Imagine the room where "${title}" starts. Describe who is there, how they feel, and what just happened before the camera rolls.`,
      `• Tell us about a scene from ${source} (or a show like it) that made you feel tense or surprised. What made it stick?`,
      '• Describe a moment in your own life when you had to say something difficult to someone. What was hard about it?',
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

function buildControlledPractice(dialogue: string, focus: GrammarFocus): Slide {
  const lines = dialogue.split('\n').map(l => l.trim()).filter(Boolean);
  const shortLines = lines.filter(l => {
    const wc = l.split(/\s+/).length;
    return wc >= 5 && wc <= 12;
  });
  const anchors = shortLines.length >= 4 ? shortLines : lines;
  const pool = shuffle(anchors);

  const unscrambleLine = pool[0] ?? 'She said she would call.';
  const matchLine      = pool[1] ?? 'They were watching the game.';
  const verbFormLine   = pool[2] ?? 'He has just left the office.';
  const errorLine      = pool[3] ?? 'I have seen her yesterday.';

  // ── unscramble ─────────────────────────────────────────────────
  const unscrambleWords = unscrambleLine.replace(/[.!?,]$/, '').split(/\s+/);
  const scrambledPrompt = shuffle(unscrambleWords).join(' / ');

  // ── match_halves ───────────────────────────────────────────────
  const matchWords = matchLine.split(/\s+/);
  const half = Math.max(2, Math.floor(matchWords.length / 2));
  const firstHalf  = matchWords.slice(0, half).join(' ');
  const secondHalf = matchWords.slice(half).join(' ');
  const matchDistractors = shuffle(
    pool.filter(l => l !== matchLine)
        .slice(0, 3)
        .map(l => {
          const ws = l.split(/\s+/);
          const h  = Math.max(2, Math.floor(ws.length / 2));
          return ws.slice(h).join(' ');
        }),
  );
  const matchOptions = shuffle([secondHalf, ...matchDistractors]).slice(0, 4);

  // ── verb_form ──────────────────────────────────────────────────
  const verbWords = verbFormLine.split(/\s+/);
  const verbIdx = verbWords.findIndex(w => /(ed|ing|s)$/i.test(w) && w.length > 4);
  const verbWord = (verbIdx >= 0 ? verbWords[verbIdx] : verbWords[Math.floor(verbWords.length / 2)])
    .replace(/[.!?,]$/, '');
  const verbBase = verbWord.replace(/(ed|ing|s)$/i, '');
  const verbOptions = shuffle([
    verbWord,
    verbBase,
    verbBase + 'ed',
    verbBase + 'ing',
  ]).slice(0, 4);
  const verbPrompt = verbFormLine.replace(verbWord, '_____');

  // ── error_correction ───────────────────────────────────────────
  // Break a random regular pattern in the line to give the student something
  // to fix. Very light-touch: swap "was" ↔ "were" if we find one, otherwise
  // strip an -s from a verb, otherwise change a tense particle.
  const wrongText = (() => {
    if (/\bwas\b/.test(errorLine))  return errorLine.replace(/\bwas\b/, 'were');
    if (/\bwere\b/.test(errorLine)) return errorLine.replace(/\bwere\b/, 'was');
    if (/\bhas\b/.test(errorLine))  return errorLine.replace(/\bhas\b/, 'have');
    if (/\bhave\b/.test(errorLine)) return errorLine.replace(/\bhave\b/, 'has');
    // Fallback: drop the final punctuation and add a wrong tense marker.
    return errorLine.replace(/\.$/, '') + ' yesterday.';
  })();

  const items: PracticeItem[] = [
    {
      type: 'unscramble',
      prompt: scrambledPrompt,
      answer: unscrambleLine,
      grammarTopic: focus.name,
      contextLine: unscrambleLine,
    },
    {
      type: 'match_halves',
      prompt: firstHalf,
      answer: secondHalf,
      options: matchOptions,
      grammarTopic: focus.name,
      contextLine: matchLine,
    },
    {
      type: 'verb_form',
      prompt: verbPrompt,
      answer: verbWord,
      options: verbOptions,
      grammarTopic: focus.name,
      contextLine: verbFormLine,
    },
    {
      type: 'error_correction',
      prompt: 'Correct the mistake:',
      wrongText,
      answer: errorLine,
      grammarTopic: focus.name,
      contextLine: errorLine,
    },
  ];

  return {
    type: 'clip_controlled_practice',
    title: 'Controlled practice',
    subtitle: focus.name,
    phase: 'post',
    practiceItems: items,
  };
}

function buildProduction(title: string, clipData: ClipData): Slide {
  return {
    type: 'clip_production',
    title: 'Over to you',
    phase: 'post',
    prompt: `Now that you have watched "${title}", tell us what stayed with you and why.`,
    content: [
      `• Describe the exact moment in "${title}" that hit you hardest — the line, the look, the pause. What was said and how was it said?`,
      '• Compare your prediction from before you watched with what actually happened. Where were you right? Where did the scene take you somewhere else?',
      '• Pick ONE line from the dialogue you want to remember. Say it out loud and explain when you might use it in your own English.',
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
): Promise<Slide[]> {
  const focus = detectFocus(dialogue);

  // Vocab lookup is the only network-bound step — parallelisable with the
  // pure builders below, but they're cheap so we just serialise for clarity.
  const vocab = await buildVocab(dialogue, level);

  return [
    buildCover(title, source, level, clipData),
    buildPredictions(title, source, clipData),
    vocab,
    buildLanguageFocus(dialogue, focus),
    buildControlledPractice(dialogue, focus),
    buildProduction(title, clipData),
    buildEnd(),
  ];
}
