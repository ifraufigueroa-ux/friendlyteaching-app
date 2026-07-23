// FriendlyTeaching.cl — Algorithmic 10-slide Friendlytext® generator (no AI required)
//
// Mirrors the Friendlyrics (music) algorithmic generator: same slide shape, same
// CEFR-aware helpers, same external services (Free Dictionary + MyMemory). Uses
// the input text as source material instead of lyrics — so "chorus" is replaced
// by "key passage" (the longest / most repeated paragraph) and lyric-only
// idioms are dropped from the grammar detector.

import type {
  Slide, LessonLevel, VocabWord, LyricsBlank, QuizQuestion, PracticeItem, PracticeType,
  ComprehensionMode, TextData,
} from '@/types/firebase';

// ─── Stopwords (aligned with music generator) ─────────────────

const STOPWORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'by','from','is','are','was','were','be','been','being','have','has',
  'had','do','does','did','will','would','could','should','may','might',
  'must','shall','can','need','i','you','he','she','it','we','they',
  'me','him','her','us','them','my','your','his','its','our','their',
  'this','that','these','those','not','no','so','up','out','if','about',
  'all','just','like','when','what','how','who','which','where','as',
  'than','then','now','got','get','go','come','make','know','see','want',
  'say','tell','let','put','take','give','one','two','three','every',
  "don't","can't","won't","i'm","i'll","i've","you're","it's","ain't",
  "they're","we're","she's","he's","that's","there's","here's",
]);

// ─── Utilities ────────────────────────────────────────────────

function cleanWord(w: string): string {
  return w.replace(/[^a-zA-Z]/g, '').toLowerCase();
}

function getContentWords(text: string): string[] {
  return text
    .split(/\s+/)
    .map(cleanWord)
    .filter(w => w.length >= 4 && !STOPWORDS.has(w) && /^[a-z]+$/.test(w));
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Pick the "chorus equivalent" for prose: the paragraph with the most
// content words, so downstream helpers (predictions, translation game)
// have a meaty passage to work with.
function findKeyPassage(text: string): string {
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  if (paragraphs.length <= 1) {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    return lines.slice(0, Math.min(6, lines.length)).join('\n');
  }
  let best = paragraphs[0];
  let bestScore = 0;
  for (const p of paragraphs) {
    const score = getContentWords(p).length;
    if (score > bestScore) { bestScore = score; best = p; }
  }
  return best;
}

// Return the FIRST line that actually contains the word (word-boundary),
// falling back to a dictionary example if we couldn't find it in the text.
function findLineFor(word: string, text: string, fallback?: string): string | undefined {
  const re = new RegExp(`\\b${word}\\b`, 'i');
  const line = text.split(/\n|(?<=[.!?])\s+/).map(l => l.trim()).find(l => l.length > 0 && re.test(l));
  return line ?? fallback;
}

// ─── Free Dictionary API ──────────────────────────────────────

interface DictEntry {
  phonetic?: string;
  meanings: Array<{ definitions: Array<{ definition: string; example?: string }> }>;
}

async function lookupWord(word: string): Promise<{ phonetic?: string; definition: string; example?: string } | null> {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data: DictEntry[] = await res.json();
    const entry = data?.[0];
    if (!entry) return null;
    const def = entry.meanings?.[0]?.definitions?.[0];
    return { phonetic: entry.phonetic, definition: def?.definition ?? '', example: def?.example };
  } catch {
    return null;
  }
}

function cleanDefinition(raw: string): string {
  const stripped = raw.replace(/\([^)]*\)/g, '').replace(/\s{2,}/g, ' ').trim();
  const firstSentence = stripped.split(/(?<=[.!?])\s+/)[0] ?? stripped;
  const capped = firstSentence.length <= 90
    ? firstSentence
    : firstSentence.slice(0, 90).replace(/\s+\S*$/, '') + '…';
  return capped.charAt(0).toUpperCase() + capped.slice(1);
}

// ─── Vocab slide ──────────────────────────────────────────────

const A1_ALREADY_KNOWN = new Set([
  'love','know','want','need','feel','like','see','come','take','make','give',
  'day','time','night','life','home','world','heart','hand','head','eye',
  'boy','girl','friend','mom','dad','name','thing','year','week',
  'good','bad','big','new','old','happy','sad','nice','sure',
]);

const LEVEL_VOCAB_CFG: Record<string, { target: number; minLen: number; skipKnown: boolean }> = {
  'A0':  { target: 6, minLen: 4, skipKnown: true  },
  'A1':  { target: 6, minLen: 4, skipKnown: true  },
  'A2':  { target: 6, minLen: 5, skipKnown: true  },
  'B1':  { target: 7, minLen: 5, skipKnown: false },
  'B1+': { target: 7, minLen: 5, skipKnown: false },
  'B2':  { target: 8, minLen: 6, skipKnown: false },
  'C1':  { target: 8, minLen: 6, skipKnown: false },
};

async function buildVocabSlide(text: string, level: LessonLevel): Promise<Slide> {
  const cfg = LEVEL_VOCAB_CFG[level] ?? { target: 7, minLen: 5, skipKnown: false };
  const keyPassage = findKeyPassage(text).toLowerCase();
  const allWords = getContentWords(text).filter(w => w.length >= cfg.minLen);
  const freq = new Map<string, number>();
  for (const w of allWords) freq.set(w, (freq.get(w) ?? 0) + 1);

  const scored: Array<{ word: string; score: number }> = [];
  for (const [word, count] of freq) {
    if (cfg.skipKnown && A1_ALREADY_KNOWN.has(word)) continue;
    const inPassage = new RegExp(`\\b${word}\\b`, 'i').test(keyPassage) ? 3 : 0;
    scored.push({ word, score: count * 2 + inPassage + Math.min(word.length, 8) / 10 });
  }
  scored.sort((a, b) => b.score - a.score);

  const candidates = scored.slice(0, 30).map(s => s.word);
  const words: VocabWord[] = [];
  for (const word of candidates) {
    if (words.length >= cfg.target) break;
    const data = await lookupWord(word);
    if (!data?.definition) continue;
    words.push({
      word,
      translation: cleanDefinition(data.definition),
      pronunciation: data.phonetic,
      example: findLineFor(word, text, data.example),
    });
  }

  // Safety top-up if the dictionary API stalled.
  if (words.length < Math.max(4, cfg.target - 2)) {
    for (const word of candidates) {
      if (words.length >= cfg.target) break;
      if (words.find(w => w.word === word)) continue;
      words.push({ word, translation: '— look it up! —', example: findLineFor(word, text) });
    }
  }

  return { id: 'vocab-match', type: 'vocab_match', phase: 'pre', title: 'Key Vocabulary', words };
}

// ─── Predictions ──────────────────────────────────────────────

const TEXT_MOOD_HINTS: Array<{ words: string[]; mood: string; sceneHint: string }> = [
  { words: ['love','heart','kiss','forever','marry','wedding'],       mood: 'romantic',    sceneHint: 'two people at a turning point' },
  { words: ['night','dark','moon','stars','dream','sleep','shadow'],   mood: 'nocturnal',   sceneHint: 'a scene that only makes sense at night' },
  { words: ['home','road','miles','away','back','city','town','journey','travel'], mood: 'road / home', sceneHint: 'someone leaving or coming back' },
  { words: ['cry','tears','broken','lost','alone','goodbye','miss','grief'], mood: 'heartbreak',  sceneHint: 'someone remembering what they lost' },
  { words: ['war','battle','fight','soldier','enemy','victory','peace'], mood: 'conflict',   sceneHint: 'a decision made under pressure' },
  { words: ['god','soul','light','pray','holy','faith','spirit'],       mood: 'spiritual',   sceneHint: 'someone talking to something bigger than themselves' },
  { words: ['time','young','old','remember','yesterday','years','memory'], mood: 'nostalgic', sceneHint: 'looking back at a version of yourself' },
  { words: ['science','data','study','research','result','experiment'], mood: 'analytical',  sceneHint: 'someone trying to explain how something works' },
  { words: ['news','report','yesterday','today','minister','government','police'], mood: 'reportage', sceneHint: 'someone recounting what just happened' },
];

interface PredictionsSignals {
  moodLabel: string;
  sceneHint: string;
  asksQuestions: boolean;
  isPersonal: boolean;
}

function detectSignals(title: string, text: string): PredictionsSignals {
  const titleLc = title.toLowerCase();
  let match = TEXT_MOOD_HINTS.find(h => h.words.some(w => titleLc.includes(w)));
  if (!match) {
    const lc = text.toLowerCase();
    match = TEXT_MOOD_HINTS.find(h => h.words.some(w => new RegExp(`\\b${w}\\b`).test(lc)));
  }
  const asksQuestions = (text.match(/\?/g)?.length ?? 0) >= 2;
  const words   = text.toLowerCase().split(/\s+/).filter(Boolean);
  const firstP  = words.filter(w => /^(i|i'm|i've|i'll|my|me|we|we're|us|our)$/.test(w)).length;
  const isPersonal = words.length > 0 && firstP / words.length >= 0.03;

  return {
    moodLabel: match?.mood     ?? 'unspecified',
    sceneHint: match?.sceneHint ?? 'a moment the writer wants us to remember',
    asksQuestions,
    isPersonal,
  };
}

// Match sources that are FriendlyTeaching's own labels — teachers set the
// "source" field to things like "Original", "FriendlyTeaching CL",
// "Friendly Teaching — Original", "CLT script". None of these are real
// external authors/publications, so we mustn't ask students "do you know
// FriendlyTeaching CL?" — that turns the slide into a platform survey.
function isInternalSource(source: string): boolean {
  return /(friendly[\s-]?teaching|friendlytext|friendlytales|friendlyrics|friendlyflix|original|clt|internal|own)/i.test(source);
}

function buildPredictionsSlide(title: string, source: string, text: string, level: LessonLevel, mode: ComprehensionMode): Slide {
  const sig = detectSignals(title, text);
  const cueVerb = mode === 'audio' ? 'listen' : mode === 'text' ? 'read' : 'read / listen';
  const internal = isInternalSource(source);

  const hookByMood: Record<string, string> = {
    romantic:      `Before you ${cueVerb} — who do you think "${title}" is really about?`,
    nocturnal:     `Before you ${cueVerb} — where and when do you imagine "${title}" takes place?`,
    'road / home': `Before you ${cueVerb} — is "${title}" about leaving, or about coming back?`,
    heartbreak:    `Before you ${cueVerb} — what do you think the writer of "${title}" is trying to let go of?`,
    conflict:      `Before you ${cueVerb} — what kind of choice do you think "${title}" is going to describe?`,
    spiritual:     `Before you ${cueVerb} — who or what do you think the writer of "${title}" is really addressing?`,
    nostalgic:     `Before you ${cueVerb} — what memory do you think "${title}" is trying to hold on to?`,
    analytical:    `Before you ${cueVerb} — what claim or discovery do you predict "${title}" will make?`,
    reportage:     `Before you ${cueVerb} — what event do you think "${title}" is going to report?`,
    unspecified:   `Before you ${cueVerb} — what do you predict "${title}" will be about?`,
  };

  const simple = ['A0','A1'].includes(level);

  const bullet1 = simple
    ? `Picture "${title}". Who do you see, and where are they?`
    : `Just from the title "${title}", picture ${sig.sceneHint}. Describe it in your own words — who is there and what has just happened?`;

  // Bullet 2 — prior experience. When source is our own platform we
  // pivot to the reader's own life (never ask them about FriendlyTeaching
  // itself); otherwise we can reference a real external author/outlet.
  const bullet2 = internal
    ? (simple
        ? `Tell us about a time you were in a similar situation to "${title}".`
        : `Tell us about a moment in your own life that a text called "${title}" might describe.`)
    : (simple
        ? `Do you know "${source}"? Tell us one thing you expect from a text with that source.`
        : sig.isPersonal
          ? `"${title}" reads personally. Tell us about a text (a book, article, or story) that felt like it was written for you.`
          : `Tell us about a text by "${source}" — or a similar author/outlet — that stayed with you. What made it stick?`);

  const bullet3 = simple
    ? `Do you know a story or text in Spanish with a similar theme to "${title}"? Tell us about it.`
    : sig.asksQuestions
      ? `"${title}" seems to raise questions. Tell us about a question you have carried around for a while — the kind a text like this could answer.`
      : `Think of a text in Spanish that shares the theme of "${title}" — how would you describe the link to someone who only speaks English?`;

  return {
    id: 'predictions',
    type: 'predictions',
    phase: 'pre',
    title: 'Before You Read...',
    prompt: hookByMood[sig.moodLabel] ?? hookByMood.unspecified,
    content: [bullet1, bullet2, bullet3].map(b => `• ${b}`).join('\n'),
  };
}

// ─── Comprehension slide (the verbatim text) ──────────────────

function buildComprehensionSlide(text: string, mode: ComprehensionMode): Slide {
  const title =
    mode === 'audio' ? 'Listen to the Text'
    : mode === 'text' ? 'Read the Text'
    : 'Read + Listen';
  return {
    id: 'text-comprehension',
    type: 'text_comprehension',
    phase: 'while',
    title,
    content: text,
  };
}

// ─── Comprehension quiz (listening_quiz type, but text-based) ─

function buildComprehensionQuiz(text: string, title: string): Slide {
  const lines = text.split(/\n|(?<=[.!?])\s+/)
    .map(l => l.trim())
    .filter(l => l.length > 20 && l.length < 140);

  function makeQuestion(qText: string, correctLine: string, otherLines: string[]): QuizQuestion {
    const opts = shuffle([correctLine, ...shuffle(otherLines).slice(0, 3)]).map((t, i) => ({
      id: String.fromCharCode(97 + i),
      text: t,
      isCorrect: t === correctLine,
    }));
    return { question: qText, options: opts, correctAnswer: correctLine };
  }

  const anchorAt = (frac: number) =>
    lines[Math.max(0, Math.min(lines.length - 1, Math.floor(lines.length * frac)))] ?? lines[0] ?? '';

  const q1Line = lines[0] ?? `The writer opens "${title}" with a scene`;
  const q2Line = anchorAt(0.20);
  const q3Line = anchorAt(0.40);
  const q4Line = anchorAt(0.60);
  const q5Line = anchorAt(0.80);
  const used = new Set([q1Line, q2Line, q3Line, q4Line, q5Line]);
  const distractors = lines.filter(l => !used.has(l)).slice(0, 15);

  const themeGuess = Array.from(new Set(getContentWords(text))).slice(0, 3).join(', ') || 'everyday life';

  const questions: QuizQuestion[] = [
    makeQuestion(`Which sentence best sets the tone at the start of "${title}"?`, q1Line, distractors.slice(0, 3)),
    makeQuestion(`Which sentence suggests what the narrator is feeling early on?`,   q2Line, distractors.slice(3, 6)),
    makeQuestion(`Which sentence most likely captures the main idea?`,               q3Line, distractors.slice(6, 9)),
    makeQuestion(`Which sentence points to a turning point in the text?`,            q4Line, distractors.slice(9, 12)),
    makeQuestion(`Which sentence best shows how the narrator feels by the end?`,     q5Line, distractors.slice(12, 15)),
    makeQuestion(`Overall, "${title}" is mainly about:`,
      themeGuess,
      ['nature and adventure', 'historical events', 'scientific discoveries'].filter(x => x !== themeGuess),
    ),
  ];

  return {
    id: 'listening-quiz',
    type: 'listening_quiz',
    phase: 'while',
    title: 'Comprehension Check',
    questions,
  };
}

// ─── Grammar detector (compact — same shape as music) ─────────

// Every pattern carries a `category` tag so the practice-item generators
// can pick the right verb-form transform and error-injection rule for the
// grammar structure that Language Focus is actually teaching. Categories
// tagged 'generic' fall back to unscramble / match_halves only.
type GrammarCategory =
  | 'simple_present_base'
  | 'simple_present_3ps'
  | 'present_continuous'
  | 'past_be'
  | 'past_simple_irregular'
  | 'past_continuous'
  | 'modals'
  | 'going_to_future'
  | 'used_to'
  | 'can_could_ability'
  | 'present_perfect'
  | 'present_perfect_cont'
  | 'perfect_tenses'
  | 'conditionals'
  | 'reported_speech'
  | 'phrasal_verbs'
  | 'modals_speculation'
  | 'passive_voice'
  | 'frequency_adverbs'
  | 'comparatives'
  | 'demonstratives'
  | 'there_is_are'
  | 'negative_contractions'
  | 'advanced_collocations'
  | 'cleft_sentences'
  | 'reduced_relatives'
  | 'inversion'
  | 'generic';

interface GrammarPattern {
  topic: string;
  description: string;
  regex: RegExp;
  category: GrammarCategory;
}

const GRAMMAR_PATTERNS: Record<string, GrammarPattern[]> = {
  'A0': [
    { topic: 'Simple present', category: 'simple_present_base',
      regex: /\b(I|you|we|they)\s+(like|love|want|need|know|feel|see|go|come|live|say|think)\b/i,
      description: 'The simple present is used for habits, feelings and facts. With I / you / we / they the verb keeps its base form.' },
    { topic: '"There is / there are"', category: 'there_is_are',
      regex: /\b(there'?s|there is|there are)\b/i,
      description: '"There is / there are" tells us that something exists in a place or moment. Writers use it to set a scene.' },
    { topic: 'Demonstratives (this / that / these / those)', category: 'demonstratives',
      regex: /\b(this|that|these|those)\s+\w+/i,
      description: 'Demonstratives point to people or things — near ("this / these") or far ("that / those").' },
  ],
  'A1': [
    { topic: 'Negative contractions', category: 'negative_contractions',
      regex: /\b(don't|doesn't|can't|won't|isn't|aren't|wasn't|weren't|didn't)\b/i,
      description: 'Negative contractions shorten the sentence and sound natural in written English.' },
    { topic: 'Simple present (3rd person)', category: 'simple_present_3ps',
      regex: /\b(he|she|it)\s+\w+s\b/i,
      description: 'With he / she / it in the simple present we add -s (or -es) to the verb.' },
    { topic: 'Adverbs of frequency', category: 'frequency_adverbs',
      regex: /\b(always|never|usually|often|sometimes|rarely|hardly ever)\b/i,
      description: 'Adverbs of frequency sit before the main verb and tell us HOW OFTEN something happens.' },
  ],
  'A2': [
    { topic: 'Present continuous (am/is/are + -ing)', category: 'present_continuous',
      regex: /\b(am|is|are|'m|'re|'s)\s+\w+ing\b/i,
      description: 'The present continuous describes actions happening right now or around now.' },
    { topic: '"Going to" for future plans', category: 'going_to_future',
      regex: /\bgoing to\s+\w+/i,
      description: '"Going to + base verb" expresses plans and intentions.' },
    { topic: 'Past simple of "to be"', category: 'past_be',
      regex: /\b(was|were|wasn't|weren't)\b/i,
      description: '"Was" / "were" are the past forms of "to be". They describe states in the past.' },
    { topic: '"Can / could" for ability', category: 'can_could_ability',
      regex: /\b(can|can't|cannot|could|couldn't)\s+\w+/i,
      description: '"Can / could" + base verb expresses ability or possibility.' },
    { topic: 'Comparative adjectives', category: 'comparatives',
      regex: /\b(\w+er than|more \w+ than|better than|worse than)\b/i,
      description: 'Comparatives put two things side by side.' },
  ],
  'B1': [
    { topic: 'Past simple (irregular verbs)', category: 'past_simple_irregular',
      regex: /\b(went|came|saw|knew|told|gave|took|made|said|got|felt|thought|fell|broke|wrote|left|stood|found|kept|brought|caught|ran|drank|fought|held|spoke|heard|met|sent|read|paid)\b/i,
      description: 'The past simple describes completed actions in the past. Texts are full of irregular verbs.' },
    { topic: 'Modal verbs (can / will / would)', category: 'modals',
      regex: /\b(can|cannot|can't|could|will|won't|would|wouldn't|should|might|may|must)\s+\w+/i,
      description: 'Modals are followed by the base verb. They express ability, future, advice or hypothetical ideas.' },
    { topic: 'Past continuous (was/were + -ing)', category: 'past_continuous',
      regex: /\b(was|were)\s+\w+ing\b/i,
      description: '"Was / were + verb-ing" describes an ongoing action in the past — perfect for storytelling.' },
    { topic: 'Present perfect', category: 'present_perfect',
      regex: /\b(have|has|haven't|hasn't|I've|you've|we've|they've)\s+\w+(en|ed|n|t)\b/i,
      description: '"Have / has + past participle" connects a past action with the present moment.' },
  ],
  'B1+': [
    { topic: 'First & second conditional', category: 'conditionals',
      regex: /\bif\s+\w+(?:\s+\w+){0,5}\s+(would|will|could|won't|wouldn't)\b/i,
      description: 'Conditionals use "if" to express conditions and their results.' },
    { topic: '"Used to" for past habits', category: 'used_to',
      regex: /\bused to\s+\w+/i,
      description: '"Used to + base verb" describes habits or states in the past that are no longer true today.' },
    { topic: 'Present perfect continuous', category: 'present_perfect_cont',
      regex: /\b(have|has|haven't|hasn't|I've|you've|we've|they've)\s+been\s+\w+ing\b/i,
      description: '"Have / has been + verb-ing" describes an action that started in the past and is still going.' },
    { topic: 'Reported speech basics', category: 'reported_speech',
      regex: /\b(said|told|asked)\s+(?:me|you|him|her|us|them)?\s*(?:that\s+)?\w+/i,
      description: '"Said / told / asked" report what someone else said.' },
  ],
  'B2': [
    { topic: 'Phrasal verbs', category: 'phrasal_verbs',
      regex: /\b(give up|hold on|let go|run away|break down|come on|fall apart|get over|move on|carry on|wake up|grow up|stand up|turn around|look up|find out|figure out|take off|throw away|reach out|hold back|push back|tear apart|come back|walk away|step back)\b/i,
      description: 'Phrasal verbs carry meaning that goes beyond the literal words. Central to natural English.' },
    { topic: 'Perfect tenses', category: 'perfect_tenses',
      regex: /\b(have|has|had|haven't|hasn't|hadn't|I've|you've|we've|they've)\s+(been|done|gone|seen|made|got|told|thought|known|kept|left|brought|written|spoken|broken)\b/i,
      description: 'Perfect tenses connect different time frames.' },
    { topic: 'Modals of speculation', category: 'modals_speculation',
      regex: /\b(must|might|may|could)\s+(be|have)\s+\w+/i,
      description: '"Must / might / may / could + be / have + …" are used to speculate about present or past situations.' },
    { topic: 'Passive voice basics', category: 'passive_voice',
      regex: /\b(was|were|is|are|been)\s+\w+(ed|en|n|t)\s+by\b/i,
      description: 'The passive voice shifts focus from doer to receiver.' },
  ],
  'C1': [
    { topic: 'Advanced collocations', category: 'advanced_collocations',
      regex: /\b(deeply (in love|hurt|sorry|troubled|concerned)|widely (known|regarded|reported)|painfully aware|hopelessly lost|utterly (broken|convinced)|firmly (believe|convinced))\b/i,
      description: 'Adverb + adjective / adverb + verb collocations intensify or precise the claim.' },
    { topic: 'Cleft sentences (It was … that …)', category: 'cleft_sentences',
      regex: /\b(it (was|is|wasn't|isn't)|what (I|you|we|they|he|she) (did|need|want|feel))\b.*\bthat\b/i,
      description: 'Cleft sentences split one idea into two clauses to place emphasis on the key element.' },
    { topic: 'Reduced relative clauses', category: 'reduced_relatives',
      regex: /\b\w+ed\s+by\s+\w+|\b\w+ing\s+(?:through|in|on|under|over|behind)\b/i,
      description: 'Reduced relative clauses drop the pronoun and auxiliary, packing whole descriptions into a single phrase.' },
    { topic: 'Inversion', category: 'inversion',
      regex: /\b(Never have I|Little did|Rarely do|Only then|Not until|No sooner)\b/,
      description: 'Inversion (auxiliary before subject) raises emphasis and drama.' },
  ],
};

interface DetectedGrammar {
  topic: string;
  description: string;
  category: GrammarCategory;
  regex: RegExp;
  examples: { highlight: string; line: string }[];
}

function detectMultipleGrammar(text: string, level: LessonLevel, limit = 3): DetectedGrammar[] {
  const lines = text.split(/\n|(?<=[.!?])\s+/).map(l => l.trim()).filter(l => l.length > 6);
  const patterns = GRAMMAR_PATTERNS[level] ?? GRAMMAR_PATTERNS['B1'];
  const results: DetectedGrammar[] = [];

  for (const pat of patterns) {
    const examples: { highlight: string; line: string }[] = [];
    const used = new Set<string>();
    for (const line of lines) {
      const m = line.match(pat.regex);
      if (m && m[0]) {
        const key = line.toLowerCase();
        if (used.has(key)) continue;
        used.add(key);
        examples.push({ highlight: m[0], line });
        if (examples.length >= 4) break;
      }
    }
    if (examples.length >= 2) {
      results.push({
        topic: pat.topic,
        description: pat.description,
        category: pat.category,
        regex: pat.regex,
        examples,
      });
      if (results.length >= limit) break;
    }
  }

  if (results.length === 0) {
    // Nothing matched — fall back gracefully so the slide is never empty.
    const first = patterns[0] ?? {
      topic: 'Key expressions',
      description: 'Notice how everyday words combine into natural patterns in this text.',
      category: 'generic' as const,
      regex: /./,
    };
    results.push({
      topic: first.topic,
      description: first.description,
      category: first.category,
      regex: first.regex,
      examples: lines.slice(0, 3).map(l => ({ highlight: l.split(/\s+/)[0] ?? l, line: l })),
    });
  }
  return results;
}

function buildLanguageFocus(text: string, level: LessonLevel, title: string): Slide {
  const detected = detectMultipleGrammar(text, level, 3);
  const primary  = detected[0];

  const intro   = `In "${title}", the writer leans on ${primary.topic.toLowerCase()} to shape the story.`;
  const bullets = detected.map(d => `• ${d.topic} → ${d.description}`);
  const outro   = detected.length > 1
    ? 'Notice these patterns across the paragraphs.'
    : 'Notice this pattern across the paragraphs.';

  const content = [intro, '', ...bullets, '', outro].join('\n');

  const words: VocabWord[] = detected.flatMap(d =>
    d.examples.slice(0, 2).map(ex => ({
      word: ex.line,
      translation: d.topic,
      example: `Pattern: ${ex.highlight}`,
    })),
  );

  return {
    id: 'lang-focus',
    type: 'language_focus',
    phase: 'while',
    title: `Language Focus: ${primary.topic}`,
    content,
    words,
  };
}

// ─── Language practice (grammar-coupled, CEFR-tiered) ────────
//
// The practice slide now drills the SAME grammar the Language Focus slide
// just taught. `detectPrimaryGrammar` returns the top-scoring pattern with
// enough metadata (category tag + regex + matched lines) for the item
// generators to build tailored exercises:
//
//   • unscramble         — text quote that contains the pattern
//   • match_halves       — split near the middle so the second half holds
//                          the pattern
//   • verb_form          — quote with the target verb blanked, 4 forms
//                          offered as choices
//   • error_correction   — same quote with a systematic error injected
//                          (drop the -s for 3ps, swap was/were, etc.); the
//                          student rewrites it correctly
//   • multiple_selection — 1 correct pattern line + 3 error-injected
//                          variants → "which one is right?"
//   • open_ended         — templated stem the student completes with their
//                          own idea (checked as "done" on non-empty submit)
//
// The 4-item deck is picked from a per-CEFR mix that walks up the
// cognitive-load ladder (recognition → controlled → semi-controlled →
// productive). If a builder can't handle a category it returns null and
// the caller falls back to unscramble on the same line.

const LEVEL_PRACTICE_CFG: Record<string, { minWords: number; maxWords: number }> = {
  'A0':  { minWords: 4, maxWords: 6  },
  'A1':  { minWords: 4, maxWords: 6  },
  'A2':  { minWords: 5, maxWords: 7  },
  'B1':  { minWords: 6, maxWords: 9  },
  'B1+': { minWords: 6, maxWords: 10 },
  'B2':  { minWords: 7, maxWords: 11 },
  'C1':  { minWords: 7, maxWords: 11 },
};

// Per-CEFR activity mix — 4 items each, in order (top → bottom of the
// slide). The ladder climbs from recognition to production; verb_form and
// error_correction start at A2/B1 where students have enough scaffolding
// to attempt controlled production; open_ended only appears from B2 up.
const CEFR_ACTIVITY_MIX: Record<string, PracticeType[]> = {
  'A0':  ['match_halves', 'multiple_selection', 'match_halves', 'unscramble'],
  'A1':  ['match_halves', 'multiple_selection', 'match_halves', 'unscramble'],
  'A2':  ['match_halves', 'unscramble', 'multiple_selection', 'verb_form'],
  'B1':  ['unscramble', 'verb_form', 'error_correction', 'multiple_selection'],
  'B1+': ['unscramble', 'verb_form', 'error_correction', 'multiple_selection'],
  'B2':  ['verb_form', 'error_correction', 'multiple_selection', 'open_ended'],
  'C1':  ['verb_form', 'error_correction', 'multiple_selection', 'open_ended'],
};

function tokenizeLine(line: string): string[] {
  return line.trim().split(/\s+/).filter(Boolean);
}

// Round-robin across paragraphs so items aren't clumped in the first
// paragraph. Deduplicates by case-insensitive text.
function pickDiverseLines(text: string, count: number, minWords: number, maxWords: number): string[] {
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  const perParagraph: string[][] = paragraphs.map(p =>
    p.split(/\n|(?<=[.!?])\s+/)
      .map(l => l.trim())
      .filter(l => {
        if (!l) return false;
        const wc = tokenizeLine(l).length;
        return wc >= minWords && wc <= maxWords;
      }),
  );

  const seen = new Set<string>();
  const picks: string[] = [];
  let cursor = 0;
  for (let round = 0; round < 10 && picks.length < count; round++) {
    let progressed = false;
    for (let i = 0; i < perParagraph.length && picks.length < count; i++) {
      const bucket = perParagraph[(cursor + i) % perParagraph.length];
      const next = bucket.find(l => !seen.has(l.toLowerCase()));
      if (next) {
        seen.add(next.toLowerCase());
        picks.push(next);
        progressed = true;
      }
    }
    if (!progressed) break;
    cursor++;
  }
  return picks;
}

function pickHalfDistractors(pool: string[], correct: string, halfIdx: number, need: number): string[] {
  const targetLen = tokenizeLine(correct).length;
  const options = pool
    .map(l => {
      const toks = tokenizeLine(l);
      if (toks.length <= halfIdx) return null;
      const secondHalf = toks.slice(halfIdx).join(' ');
      return secondHalf.toLowerCase() === correct.toLowerCase() ? null : secondHalf;
    })
    .filter((s): s is string => !!s)
    .filter(s => Math.abs(tokenizeLine(s).length - targetLen) <= 2);
  return shuffle(Array.from(new Set(options))).slice(0, need);
}

// ─── Verb-form helpers ────────────────────────────────────────

// Common irregulars — enough coverage that most past-simple / present-perfect
// drills produce correct forms. Regular verbs fall through to `regularize`.
const IRREGULAR_VERBS: Record<string, { past: string; pp: string; ing: string; s: string }> = {
  be:         { past: 'was',        pp: 'been',       ing: 'being',        s: 'is' },
  begin:      { past: 'began',      pp: 'begun',      ing: 'beginning',    s: 'begins' },
  break:      { past: 'broke',      pp: 'broken',     ing: 'breaking',     s: 'breaks' },
  bring:      { past: 'brought',    pp: 'brought',    ing: 'bringing',     s: 'brings' },
  buy:        { past: 'bought',     pp: 'bought',     ing: 'buying',       s: 'buys' },
  catch:      { past: 'caught',     pp: 'caught',     ing: 'catching',     s: 'catches' },
  choose:     { past: 'chose',      pp: 'chosen',     ing: 'choosing',     s: 'chooses' },
  come:       { past: 'came',       pp: 'come',       ing: 'coming',       s: 'comes' },
  do:         { past: 'did',        pp: 'done',       ing: 'doing',        s: 'does' },
  drink:      { past: 'drank',      pp: 'drunk',      ing: 'drinking',     s: 'drinks' },
  drive:      { past: 'drove',      pp: 'driven',     ing: 'driving',      s: 'drives' },
  eat:        { past: 'ate',        pp: 'eaten',      ing: 'eating',       s: 'eats' },
  fall:       { past: 'fell',       pp: 'fallen',     ing: 'falling',      s: 'falls' },
  feel:       { past: 'felt',       pp: 'felt',       ing: 'feeling',      s: 'feels' },
  fight:      { past: 'fought',     pp: 'fought',     ing: 'fighting',     s: 'fights' },
  find:       { past: 'found',      pp: 'found',      ing: 'finding',      s: 'finds' },
  get:        { past: 'got',        pp: 'gotten',     ing: 'getting',      s: 'gets' },
  give:       { past: 'gave',       pp: 'given',      ing: 'giving',       s: 'gives' },
  go:         { past: 'went',       pp: 'gone',       ing: 'going',        s: 'goes' },
  grow:       { past: 'grew',       pp: 'grown',      ing: 'growing',      s: 'grows' },
  have:       { past: 'had',        pp: 'had',        ing: 'having',       s: 'has' },
  hear:       { past: 'heard',      pp: 'heard',      ing: 'hearing',      s: 'hears' },
  hold:       { past: 'held',       pp: 'held',       ing: 'holding',      s: 'holds' },
  keep:       { past: 'kept',       pp: 'kept',       ing: 'keeping',      s: 'keeps' },
  know:       { past: 'knew',       pp: 'known',      ing: 'knowing',      s: 'knows' },
  leave:      { past: 'left',       pp: 'left',       ing: 'leaving',      s: 'leaves' },
  lose:       { past: 'lost',       pp: 'lost',       ing: 'losing',       s: 'loses' },
  make:       { past: 'made',       pp: 'made',       ing: 'making',       s: 'makes' },
  meet:       { past: 'met',        pp: 'met',        ing: 'meeting',      s: 'meets' },
  pay:        { past: 'paid',       pp: 'paid',       ing: 'paying',       s: 'pays' },
  read:       { past: 'read',       pp: 'read',       ing: 'reading',      s: 'reads' },
  ride:       { past: 'rode',       pp: 'ridden',     ing: 'riding',       s: 'rides' },
  run:        { past: 'ran',        pp: 'run',        ing: 'running',      s: 'runs' },
  say:        { past: 'said',       pp: 'said',       ing: 'saying',       s: 'says' },
  see:        { past: 'saw',        pp: 'seen',       ing: 'seeing',       s: 'sees' },
  sell:       { past: 'sold',       pp: 'sold',       ing: 'selling',      s: 'sells' },
  send:       { past: 'sent',       pp: 'sent',       ing: 'sending',      s: 'sends' },
  sit:        { past: 'sat',        pp: 'sat',        ing: 'sitting',      s: 'sits' },
  speak:      { past: 'spoke',      pp: 'spoken',     ing: 'speaking',     s: 'speaks' },
  stand:      { past: 'stood',      pp: 'stood',      ing: 'standing',     s: 'stands' },
  take:       { past: 'took',       pp: 'taken',      ing: 'taking',       s: 'takes' },
  tell:       { past: 'told',       pp: 'told',       ing: 'telling',      s: 'tells' },
  think:      { past: 'thought',    pp: 'thought',    ing: 'thinking',     s: 'thinks' },
  understand: { past: 'understood', pp: 'understood', ing: 'understanding',s: 'understands' },
  wake:       { past: 'woke',       pp: 'woken',      ing: 'waking',       s: 'wakes' },
  win:        { past: 'won',        pp: 'won',        ing: 'winning',      s: 'wins' },
  write:      { past: 'wrote',      pp: 'written',    ing: 'writing',      s: 'writes' },
  become:     { past: 'became',     pp: 'become',     ing: 'becoming',     s: 'becomes' },
  show:       { past: 'showed',     pp: 'shown',      ing: 'showing',      s: 'shows' },
};

// Naive-but-serviceable regular-verb conjugation. Not perfect (edge cases
// like doubling final consonants after CVC are ignored), but good enough
// for practice options that just need to LOOK like the target form.
function regularize(base: string): { s: string; ing: string; ed: string } {
  const b = base.toLowerCase();
  const s   = /(s|x|z|sh|ch)$/.test(b) ? b + 'es'
            : /[^aeiou]y$/.test(b)     ? b.slice(0, -1) + 'ies'
            :                             b + 's';
  const ing = /e$/.test(b) && !/ee$/.test(b) ? b.slice(0, -1) + 'ing'
            :                                   b + 'ing';
  const ed  = /e$/.test(b)                 ? b + 'd'
            : /[^aeiou]y$/.test(b)         ? b.slice(0, -1) + 'ied'
            :                                 b + 'ed';
  return { s, ing, ed };
}

interface VerbForms { base: string; s: string; past: string; pp: string; ing: string }

function verbForms(base: string): VerbForms {
  const b = base.toLowerCase();
  const irr = IRREGULAR_VERBS[b];
  if (irr) return { base: b, ...irr };
  const r = regularize(b);
  return { base: b, s: r.s, past: r.ed, pp: r.ed, ing: r.ing };
}

// Look up an inflected form in the irregular map by scanning all entries.
// Returns { base } when found so verb-form transforms can rebuild the
// full paradigm from any inflection (past, pp, -ing, -s).
function baseFromInflection(word: string): string | null {
  const w = word.toLowerCase();
  for (const [base, f] of Object.entries(IRREGULAR_VERBS)) {
    if (f.past === w || f.pp === w || f.ing === w || f.s === w || base === w) return base;
  }
  // Regular fallbacks
  if (/ing$/.test(w) && w.length > 5) return /([^aeiou])\1ing$/.test(w) ? w.slice(0, -4) : w.slice(0, -3);
  if (/ied$/.test(w)) return w.slice(0, -3) + 'y';
  if (/ed$/.test(w) && w.length > 4)  return w.slice(0, -2);
  if (/ies$/.test(w)) return w.slice(0, -3) + 'y';
  if (/es$/.test(w) && /(s|x|z|sh|ch)es$/.test(w)) return w.slice(0, -2);
  if (/s$/.test(w) && w.length > 3)   return w.slice(0, -1);
  return null;
}

// Return up to 4 distinct forms drawn from `preferred`; if dedupe leaves
// fewer than 4, pad from `fallback`. Preserves order in `preferred`.
function uniqueForms(preferred: string[], fallback: string[]): string[] {
  const out: string[] = [];
  for (const w of [...preferred, ...fallback]) {
    if (!w) continue;
    if (out.some(o => o.toLowerCase() === w.toLowerCase())) continue;
    out.push(w);
    if (out.length >= 4) break;
  }
  return out;
}

// Per-category verb-form extractor. Given the matched fragment, returns
// the exact substring to blank + the 4 form options (correct included).
// Returns null when the category isn't suited for verb-form drilling.
type VerbFormExtractor = (matchStr: string) => { blank: string; options: string[] } | null;

const VERB_FORM_EXTRACTORS: Partial<Record<GrammarCategory, VerbFormExtractor>> = {
  simple_present_3ps: (m) => {
    const toks = m.split(/\s+/);
    const verb = toks[toks.length - 1];
    if (!verb || !/s$/i.test(verb) || verb.length < 3) return null;
    const base = baseFromInflection(verb) ?? verb.replace(/e?s$/i, '');
    const f = verbForms(base);
    return { blank: verb, options: uniqueForms([f.s, f.base, f.past, f.ing], [f.pp]) };
  },
  present_continuous: (m) => {
    const toks = m.split(/\s+/);
    const verb = toks[toks.length - 1];
    if (!verb || !/ing$/i.test(verb)) return null;
    const base = baseFromInflection(verb) ?? verb.replace(/ing$/i, '');
    const f = verbForms(base);
    return { blank: verb, options: uniqueForms([f.ing, f.base, f.s, f.past], [f.pp]) };
  },
  past_continuous: (m) => {
    const toks = m.split(/\s+/);
    const verb = toks[toks.length - 1];
    if (!verb || !/ing$/i.test(verb)) return null;
    const base = baseFromInflection(verb) ?? verb.replace(/ing$/i, '');
    const f = verbForms(base);
    return { blank: verb, options: uniqueForms([f.ing, f.base, f.past, f.pp], [f.s]) };
  },
  past_be: (m) => {
    const verb = m.trim().toLowerCase();
    const clean = verb.replace(/n't$/, '');
    if (clean !== 'was' && clean !== 'were') return null;
    return { blank: m.trim(), options: ['is', 'are', 'was', 'were'] };
  },
  past_simple_irregular: (m) => {
    const verb = m.trim().toLowerCase();
    const base = baseFromInflection(verb);
    if (!base) return null;
    const f = verbForms(base);
    return { blank: verb, options: uniqueForms([f.past, f.base, f.pp, f.ing], [f.s]) };
  },
  modals: (m) => {
    const toks = m.split(/\s+/);
    if (toks.length < 2) return null;
    const verb = toks[1];
    const base = baseFromInflection(verb) ?? verb.toLowerCase();
    const f = verbForms(base);
    return { blank: verb, options: uniqueForms([f.base, f.s, f.past, f.ing], [f.pp]) };
  },
  can_could_ability: (m) => VERB_FORM_EXTRACTORS.modals!(m),
  going_to_future: (m) => {
    const toks = m.split(/\s+/);
    const idx = toks.findIndex(t => /^to$/i.test(t));
    if (idx < 0 || idx + 1 >= toks.length) return null;
    const verb = toks[idx + 1];
    const base = baseFromInflection(verb) ?? verb.toLowerCase();
    const f = verbForms(base);
    return { blank: verb, options: uniqueForms([f.base, f.s, f.past, f.ing], [f.pp]) };
  },
  used_to: (m) => VERB_FORM_EXTRACTORS.going_to_future!(m),
  present_perfect: (m) => {
    const toks = m.split(/\s+/);
    if (toks.length < 2) return null;
    const verb = toks[toks.length - 1];
    const base = baseFromInflection(verb) ?? verb.replace(/(ed|en|n|t)$/i, '');
    const f = verbForms(base);
    return { blank: verb, options: uniqueForms([f.pp, f.base, f.past, f.ing], [f.s]) };
  },
  perfect_tenses: (m) => VERB_FORM_EXTRACTORS.present_perfect!(m),
  present_perfect_cont: (m) => {
    const toks = m.split(/\s+/);
    const verb = toks[toks.length - 1];
    if (!verb || !/ing$/i.test(verb)) return null;
    const base = baseFromInflection(verb) ?? verb.replace(/ing$/i, '');
    const f = verbForms(base);
    return { blank: verb, options: uniqueForms([f.ing, f.base, f.pp, f.past], [f.s]) };
  },
  simple_present_base: (m) => {
    const toks = m.split(/\s+/);
    if (toks.length < 2) return null;
    const verb = toks[toks.length - 1];
    const base = baseFromInflection(verb) ?? verb.toLowerCase();
    const f = verbForms(base);
    return { blank: verb, options: uniqueForms([f.base, f.s, f.past, f.ing], [f.pp]) };
  },
};

// ─── Error-injection helpers (used by error_correction + MCQ) ─

type ErrorInjector = (line: string) => string | null;

const ERROR_INJECTORS: Partial<Record<GrammarCategory, ErrorInjector>> = {
  simple_present_3ps: (line) => {
    const re = /\b(he|she|it)\s+(\w+?)(e?s)\b/i;
    return re.test(line) ? line.replace(re, '$1 $2') : null;
  },
  simple_present_base: (line) => {
    const re = /\b(I|you|we|they)\s+(\w+)\b/i;
    if (!re.test(line)) return null;
    return line.replace(re, (_m, subj: string, verb: string) => `${subj} ${regularize(verb).s}`);
  },
  present_continuous: (line) => {
    const re = /\b(am|is|are|'m|'re|'s)\s+(\w+?)ing\b/i;
    return re.test(line) ? line.replace(re, '$1 $2') : null;
  },
  past_continuous: (line) => {
    const re = /\b(was|were)\s+(\w+?)ing\b/i;
    return re.test(line) ? line.replace(re, '$1 $2') : null;
  },
  past_be: (line) => {
    if (/\bwas\b/i.test(line)) return line.replace(/\bwas\b/i, 'were');
    if (/\bwere\b/i.test(line)) return line.replace(/\bwere\b/i, 'was');
    return null;
  },
  past_simple_irregular: (line) => {
    for (const [base, f] of Object.entries(IRREGULAR_VERBS)) {
      const re = new RegExp(`\\b${f.past}\\b`, 'i');
      if (re.test(line)) return line.replace(re, regularize(base).ed);
    }
    return null;
  },
  present_perfect: (line) => {
    const re = /\b(have|has|haven't|hasn't|I've|you've|we've|they've)\s+/i;
    return re.test(line) ? line.replace(re, '') : null;
  },
  perfect_tenses: (line) => ERROR_INJECTORS.present_perfect!(line),
  present_perfect_cont: (line) => {
    const re = /\bbeen\s+/i;
    return re.test(line) ? line.replace(re, '') : null;
  },
  modals: (line) => {
    const re = /\b(can|cannot|can't|could|couldn't|will|won't|would|wouldn't|should|shouldn't|might|may|must)\s+(\w+)\b/i;
    if (!re.test(line)) return null;
    return line.replace(re, (_m, modal: string, verb: string) => `${modal} ${regularize(verb).s}`);
  },
  can_could_ability: (line) => ERROR_INJECTORS.modals!(line),
  going_to_future: (line) => {
    const re = /\b(going to)\s+(\w+)\b/i;
    if (!re.test(line)) return null;
    return line.replace(re, (_m, gt: string, verb: string) => `${gt} ${regularize(verb).ing}`);
  },
  used_to: (line) => {
    const re = /\b(used to)\s+(\w+)\b/i;
    if (!re.test(line)) return null;
    return line.replace(re, (_m, ut: string, verb: string) => `${ut} ${regularize(verb).ed}`);
  },
  conditionals: (line) => {
    if (/\bwill\b/i.test(line))  return line.replace(/\bwill\b/i, 'would');
    if (/\bwould\b/i.test(line)) return line.replace(/\bwould\b/i, 'will');
    return null;
  },
  reported_speech: (line) => {
    if (/\bsaid\b/i.test(line))  return line.replace(/\bsaid\b/i, 'say');
    if (/\btold\b/i.test(line))  return line.replace(/\btold\b/i, 'tell');
    if (/\basked\b/i.test(line)) return line.replace(/\basked\b/i, 'ask');
    return null;
  },
  phrasal_verbs: (line) => {
    const wrongParticle: Record<string, string> = {
      up: 'down', down: 'up', on: 'off', off: 'on',
      in: 'out', out: 'in', over: 'under', apart: 'together',
      away: 'toward', back: 'forward', around: 'straight',
    };
    for (const [particle, wrong] of Object.entries(wrongParticle)) {
      const re = new RegExp(`\\b(give|hold|let|run|break|come|fall|get|move|carry|wake|grow|stand|turn|look|find|figure|take|throw|reach|push|tear|walk|step)\\s+${particle}\\b`, 'i');
      if (re.test(line)) return line.replace(re, (_m, verb: string) => `${verb} ${wrong}`);
    }
    return null;
  },
  modals_speculation: (line) => {
    const re = /\b(must|might|may|could)\s+(be|have)\s+/i;
    if (!re.test(line)) return null;
    return line.replace(re, (_m, modal: string) => `${modal} `);
  },
  passive_voice: (line) => {
    const re = /\b(was|were|is|are|been)\s+(\w+?(?:ed|en|n|t))\s+by\b/i;
    if (!re.test(line)) return null;
    return line.replace(re, (_m, _aux: string, verb: string) => `${verb} by`);
  },
  frequency_adverbs: (line) => {
    const m = line.match(/\b(always|never|usually|often|sometimes|rarely)\b/i);
    if (!m) return null;
    const adv = m[0];
    return line.replace(new RegExp(`\\b${adv}\\s+`, 'i'), '') + ' ' + adv;
  },
  comparatives: (line) => {
    if (/\bthan\b/i.test(line)) return line.replace(/\bthan\b/i, 'from');
    return null;
  },
  demonstratives: (line) => {
    const swaps: Record<string, string> = { this: 'these', these: 'this', that: 'those', those: 'that' };
    for (const [k, v] of Object.entries(swaps)) {
      const re = new RegExp(`\\b${k}\\b`, 'i');
      if (re.test(line)) return line.replace(re, v);
    }
    return null;
  },
  negative_contractions: (line) => {
    const swaps: Array<[RegExp, string]> = [
      [/\bdon't\b/i, "doesn't"], [/\bdoesn't\b/i, "don't"],
      [/\bcan't\b/i, "won't"],   [/\bwon't\b/i, "can't"],
      [/\bisn't\b/i, "aren't"],  [/\baren't\b/i, "isn't"],
      [/\bwasn't\b/i, "weren't"],[/\bweren't\b/i, "wasn't"],
      [/\bdidn't\b/i, "don't"],
    ];
    for (const [re, repl] of swaps) {
      if (re.test(line)) return line.replace(re, repl);
    }
    return null;
  },
  advanced_collocations: (line) => {
    const swaps: Record<string, string> = {
      deeply: 'highly', widely: 'deeply', painfully: 'strongly',
      hopelessly: 'gently', utterly: 'kind of', firmly: 'lightly',
    };
    for (const [k, v] of Object.entries(swaps)) {
      const re = new RegExp(`\\b${k}\\b`, 'i');
      if (re.test(line)) return line.replace(re, v);
    }
    return null;
  },
};

// ─── Open-ended stems (templated by grammar category + title) ─

const OPEN_ENDED_STEMS: Partial<Record<GrammarCategory, string>> = {
  simple_present_base:   'In "{title}", the characters always ',
  simple_present_3ps:    'The main character in "{title}" often ',
  present_continuous:    'Right now, in "{title}", the narrator is ',
  past_be:               'When "{title}" begins, everything was ',
  past_simple_irregular: 'The most surprising moment in "{title}" happened when someone ',
  past_continuous:       'While the events of "{title}" were unfolding, the narrator was ',
  modals:                'After reading "{title}", I think the main character should ',
  going_to_future:       'By the end of "{title}", the characters are going to ',
  used_to:               'The characters in "{title}" used to ',
  can_could_ability:     'The main character in "{title}" can ',
  present_perfect:       'By this point in "{title}", the characters have ',
  present_perfect_cont:  'The narrator in "{title}" has been ',
  perfect_tenses:        'Before "{title}" begins, the characters had ',
  conditionals:          'If I were a character in "{title}", I would ',
  reported_speech:       'The narrator of "{title}" says that ',
  phrasal_verbs:         'At the turning point of "{title}", the character had to ',
  modals_speculation:    'Reading "{title}", I think the main character must have ',
  passive_voice:         'In "{title}", one important thing was ',
  frequency_adverbs:     'In "{title}", the character always ',
  comparatives:          'The main character in "{title}" is more ',
  demonstratives:        'The most important thing in "{title}" is this: ',
  there_is_are:          'In "{title}", there is ',
  negative_contractions: 'By the end of "{title}", the character can\'t ',
  advanced_collocations: 'The narrator of "{title}" is deeply ',
  cleft_sentences:       'What matters most in "{title}" is ',
  reduced_relatives:     'The character in "{title}", ',
  inversion:             'Never before had the character in "{title}" ',
  generic:               'Write one sentence about "{title}" using this structure: ',
};

// ─── Primary-grammar helper (consumed by the practice builder) ─

interface PrimaryGrammar {
  topic: string;
  description: string;
  category: GrammarCategory;
  regex: RegExp;
  matchedLines: string[];
}

function detectPrimaryGrammarForPractice(text: string, level: LessonLevel): PrimaryGrammar {
  const detected = detectMultipleGrammar(text, level, 1);
  const primary  = detected[0];
  const matchedLines = primary.examples.map(e => e.line);
  return {
    topic: primary.topic,
    description: primary.description,
    category: primary.category,
    regex: primary.regex,
    matchedLines,
  };
}

// ─── Item builders ────────────────────────────────────────────

function buildUnscrambleItem(line: string, primary: PrimaryGrammar): PracticeItem {
  const toks = tokenizeLine(line);
  return {
    type: 'unscramble',
    prompt: shuffle(toks).join(' / '),
    answer: line,
    grammarTopic: primary.topic,
  };
}

function buildMatchHalvesItem(line: string, primary: PrimaryGrammar, distractorPool: string[]): PracticeItem {
  const toks = tokenizeLine(line);
  const halfIdx    = Math.max(1, Math.floor(toks.length / 2));
  const firstHalf  = toks.slice(0, halfIdx).join(' ');
  const secondHalf = toks.slice(halfIdx).join(' ');
  const distractors = pickHalfDistractors(distractorPool, secondHalf, halfIdx, 3);
  while (distractors.length < 3) {
    distractors.push(['a new day', 'a quiet street', 'the sound of home', 'a page for you'][distractors.length]);
  }
  return {
    type: 'match_halves',
    prompt: firstHalf,
    answer: secondHalf,
    options: shuffle([secondHalf, ...distractors.slice(0, 3)]),
    grammarTopic: primary.topic,
  };
}

function buildVerbFormItem(line: string, primary: PrimaryGrammar): PracticeItem | null {
  const extractor = VERB_FORM_EXTRACTORS[primary.category];
  if (!extractor) return null;
  const match = line.match(primary.regex);
  if (!match?.[0]) return null;
  const extracted = extractor(match[0]);
  if (!extracted || extracted.options.length < 3) return null;
  // Blank the target verb, case-insensitive whole-word replace of the first
  // occurrence inside the matched substring.
  const blanked = line.replace(new RegExp(`\\b${extracted.blank}\\b`, 'i'), '{{blank}}');
  if (blanked === line) return null;
  return {
    type: 'verb_form',
    prompt: blanked,
    answer: extracted.blank,
    options: shuffle(uniqueForms(extracted.options, [])),
    grammarTopic: primary.topic,
    contextLine: line,
  };
}

function buildErrorCorrectionItem(line: string, primary: PrimaryGrammar): PracticeItem | null {
  const injector = ERROR_INJECTORS[primary.category];
  if (!injector) return null;
  const wrong = injector(line);
  if (!wrong || wrong.toLowerCase() === line.toLowerCase()) return null;
  return {
    type: 'error_correction',
    prompt: `This sentence has an error with ${primary.topic.toLowerCase()}. Rewrite it correctly.`,
    answer: line,
    wrongText: wrong,
    grammarTopic: primary.topic,
  };
}

function buildMultipleSelectionItem(
  correctLine: string,
  primary: PrimaryGrammar,
  otherMatched: string[],
): PracticeItem | null {
  const injector = ERROR_INJECTORS[primary.category];
  if (!injector) return null;

  const wrongs: string[] = [];
  const seen = new Set<string>([correctLine.toLowerCase()]);

  // First pass: inject the error into DIFFERENT matched lines so distractors
  // stay varied. Second pass: fall back to variants of the correct line.
  for (const other of otherMatched) {
    if (wrongs.length >= 3) break;
    if (seen.has(other.toLowerCase())) continue;
    const w = injector(other);
    if (w && !seen.has(w.toLowerCase())) {
      wrongs.push(w);
      seen.add(w.toLowerCase());
    }
  }
  if (wrongs.length < 3) {
    const wSelf = injector(correctLine);
    if (wSelf && !seen.has(wSelf.toLowerCase())) {
      wrongs.push(wSelf);
      seen.add(wSelf.toLowerCase());
    }
  }
  if (wrongs.length < 3) return null;

  return {
    type: 'multiple_selection',
    prompt: `Which sentence uses ${primary.topic.toLowerCase()} correctly?`,
    answer: correctLine,
    options: shuffle([correctLine, ...wrongs.slice(0, 3)]),
    grammarTopic: primary.topic,
  };
}

function buildOpenEndedItem(primary: PrimaryGrammar, title: string): PracticeItem {
  const template = OPEN_ENDED_STEMS[primary.category] ?? OPEN_ENDED_STEMS.generic!;
  const stem = template.replace('{title}', title);
  return {
    type: 'open_ended',
    prompt: `Complete the sentence with your own idea, using ${primary.topic.toLowerCase()}.`,
    answer: '', // no auto-check; card marks done on non-empty submit
    stem,
    grammarTopic: primary.topic,
  };
}

// ─── Slide assembler ──────────────────────────────────────────

function buildLanguagePractice(text: string, level: LessonLevel, primary: PrimaryGrammar, title: string): Slide {
  const cfg = LEVEL_PRACTICE_CFG[level] ?? { minWords: 5, maxWords: 9 };
  const mix = CEFR_ACTIVITY_MIX[level] ?? CEFR_ACTIVITY_MIX['B1'];

  // Pool 1: lines from the text that contain the primary grammar pattern,
  // in the level's word-count range. These get first pick for every item.
  const rawLines = text.split(/\n|(?<=[.!?])\s+/).map(l => l.trim()).filter(Boolean);
  const patternLines = rawLines.filter(l => {
    const wc = tokenizeLine(l).length;
    return wc >= cfg.minWords && wc <= cfg.maxWords && primary.regex.test(l);
  });

  // Pool 2: any text line in the length range (fallback when a builder
  // demands a line but the pattern pool has run out).
  const diverseLines = pickDiverseLines(text, 8, cfg.minWords, cfg.maxWords);

  // Pool 3: safety fillers so short texts never render an empty deck.
  const safety = [
    'The story begins today',
    'Every page is a new chance',
    'The world is bright with words',
    'We keep reading until the last line',
  ];

  // Broad pool for match_halves distractors — everything readable in the text.
  const distractorPool = rawLines.filter(l => tokenizeLine(l).length >= 3);

  // Consume pattern lines in order; when exhausted, drift into diverse lines
  // that don't match the pattern but at least come from the text.
  const linesQueue: string[] = [
    ...patternLines,
    ...diverseLines.filter(l => !patternLines.some(p => p.toLowerCase() === l.toLowerCase())),
    ...safety,
  ];
  const usedLines = new Set<string>();
  function nextLine(): string {
    for (const l of linesQueue) {
      if (!usedLines.has(l.toLowerCase())) {
        usedLines.add(l.toLowerCase());
        return l;
      }
    }
    return safety[0];
  }

  const items: PracticeItem[] = [];
  for (const kind of mix) {
    let item: PracticeItem | null = null;

    switch (kind) {
      case 'unscramble':
        item = buildUnscrambleItem(nextLine(), primary);
        break;
      case 'match_halves':
        item = buildMatchHalvesItem(nextLine(), primary, distractorPool);
        break;
      case 'verb_form': {
        // Verb-form needs a pattern-matching line specifically.
        const candidate = patternLines.find(l => !usedLines.has(l.toLowerCase())) ?? nextLine();
        usedLines.add(candidate.toLowerCase());
        item = buildVerbFormItem(candidate, primary)
            ?? buildMatchHalvesItem(candidate, primary, distractorPool);
        break;
      }
      case 'error_correction': {
        const candidate = patternLines.find(l => !usedLines.has(l.toLowerCase())) ?? nextLine();
        usedLines.add(candidate.toLowerCase());
        item = buildErrorCorrectionItem(candidate, primary)
            ?? buildUnscrambleItem(candidate, primary);
        break;
      }
      case 'multiple_selection': {
        const candidate = patternLines.find(l => !usedLines.has(l.toLowerCase())) ?? nextLine();
        usedLines.add(candidate.toLowerCase());
        const others = patternLines.filter(l => l.toLowerCase() !== candidate.toLowerCase());
        item = buildMultipleSelectionItem(candidate, primary, others)
            ?? buildMatchHalvesItem(candidate, primary, distractorPool);
        break;
      }
      case 'open_ended':
        item = buildOpenEndedItem(primary, title);
        break;
    }

    if (item) items.push(item);
  }

  return {
    id: 'lang-practice',
    type: 'language_practice',
    phase: 'while',
    title: "Let's Practice!",
    content: `Drilling ${primary.topic.toLowerCase()} using sentences from the text.`,
    practiceItems: items,
  };
}

// ─── Translation game ─────────────────────────────────────────

async function translateWithMyMemory(text: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|es`;
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = await res.json();
    const translated: string | undefined = data?.responseData?.translatedText;
    if (!translated) return null;
    if (/MYMEMORY WARNING/i.test(translated)) return null;
    return translated.trim();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// MyMemory caps each query around 500 chars for anon usage — a full CLT
// text (paragraphs of prose) blows past that. Translate paragraph-by-paragraph
// and re-join, so the translation covers the whole text without ever hitting
// the per-query limit.
async function translateFullText(text: string): Promise<string | null> {
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  if (paragraphs.length === 0) return null;
  const translated: string[] = [];
  for (const p of paragraphs) {
    // Split further if the paragraph itself is long — MyMemory is happier
    // with chunks under ~450 chars.
    const chunks = p.length > 450 ? p.match(/[^.!?]+[.!?]+|\S+$/g) ?? [p] : [p];
    const merged: string[] = [];
    for (const chunk of chunks) {
      const es = await translateWithMyMemory(chunk.trim());
      if (!es) return null;
      merged.push(es);
    }
    translated.push(merged.join(' '));
  }
  return translated.join('\n\n');
}

// Roughly 2 blanks per 3-4 lines of translated Spanish, floored by CEFR.
// Cap ceiling so absurdly long articles don't explode the slide.
const LEVEL_TRANSLATION_MIN_BLANKS: Record<string, number> = {
  'A0': 4, 'A1': 5, 'A2': 6, 'B1': 6, 'B1+': 7, 'B2': 8, 'C1': 8,
};

const ES_STOP = new Set(['de','la','el','los','las','un','una','y','a','que','en','por','con','no','sí','mi','tu','su','me','te','se','lo','le','del','para','pero','como','más','muy','sin','ni','tan','ya']);

// Pick blank-worthy words distributed across the whole text — 2 blanks per
// every 3-4 lines, spread evenly instead of clustered at the top. Returns
// the words in the order they appear so downstream replaces preserve order.
function chooseBlanksDistributed(
  fullText: string,
  minBlanks: number,
  isSpanish: boolean,
): string[] {
  const stop = isSpanish
    ? ES_STOP
    : STOPWORDS;
  const wordRe = isSpanish ? /[a-záéíóúñü']+/gi : /[a-z']+/gi;

  const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  // Group lines into windows of ~3-4 lines, pick up to 2 blanks per window.
  const WINDOW = 3;
  const perWindow = 2;
  const seen = new Set<string>();
  const picks: string[] = [];

  for (let i = 0; i < lines.length; i += WINDOW) {
    const chunk = lines.slice(i, i + WINDOW).join(' ');
    const cands = (chunk.toLowerCase().match(wordRe) ?? [])
      .filter(w => w.length >= 4 && !stop.has(w) && !seen.has(w));
    // Sample deterministically-ish by spacing: first & middle candidate.
    const sampled: string[] = [];
    if (cands[0]) sampled.push(cands[0]);
    if (cands.length > 3 && cands[Math.floor(cands.length / 2)]) {
      const mid = cands[Math.floor(cands.length / 2)];
      if (mid !== sampled[0]) sampled.push(mid);
    } else if (cands[1] && cands[1] !== sampled[0]) {
      sampled.push(cands[1]);
    }
    for (const w of sampled.slice(0, perWindow)) {
      if (!seen.has(w)) { seen.add(w); picks.push(w); }
    }
  }

  // Level-floor: if the text is short, top up with any additional content
  // words so we hit the CEFR minimum.
  if (picks.length < minBlanks) {
    const allCands = (fullText.toLowerCase().match(wordRe) ?? [])
      .filter(w => w.length >= 4 && !stop.has(w) && !seen.has(w));
    for (const w of allCands) {
      if (picks.length >= minBlanks) break;
      if (!seen.has(w)) { seen.add(w); picks.push(w); }
    }
  }

  return picks;
}

// Case-insensitive whole-word replace of ONE occurrence, preserving the
// rest of the string. Used to swap chosen content words for {{blank}}.
function replaceFirstWord(input: string, word: string): string {
  return input.replace(new RegExp(`\\b${word}\\b`, 'i'), '{{blank}}');
}

async function buildTranslationGame(text: string, level: LessonLevel): Promise<Slide> {
  // The whole text goes into the game now — not just findKeyPassage() —
  // so students see and translate every paragraph they read.
  const englishFull = text.split('\n').map(l => l.trim()).filter(Boolean).join('\n');
  const numLines    = englishFull.split('\n').length;
  const minBlanks   = LEVEL_TRANSLATION_MIN_BLANKS[level] ?? 6;
  // 2 blanks per 3 lines, floored by CEFR minimum, capped to keep the UI sane.
  const targetBlanks = Math.max(minBlanks, Math.min(40, Math.round(numLines * 2 / 3)));

  const spanish = await translateFullText(englishFull);

  // Degraded path: no usable Spanish → honest English cloze so we never
  // mislabel English as Spanish.
  if (!spanish) {
    const wordsToBlank = chooseBlanksDistributed(englishFull, targetBlanks, false);
    let blankedEn = englishFull;
    for (const w of wordsToBlank) blankedEn = replaceFirstWord(blankedEn, w);
    const distractorPoolEn = Array.from(new Set(getContentWords(text)))
      .filter(w => !wordsToBlank.includes(w));
    const blanksData: LyricsBlank[] = wordsToBlank.map(w => {
      const d = shuffle(distractorPoolEn.filter(x => x !== w)).slice(0, 3);
      return { word: w, options: shuffle([w, ...d]) };
    });
    return {
      id: 'translation-game',
      type: 'translation_game',
      phase: 'post',
      title: 'Complete the Text',
      translationText: englishFull,
      content: blankedEn,
      blanksData,
    };
  }

  // Good path: pick Spanish blanks distributed across the translation.
  const blanks = chooseBlanksDistributed(spanish, targetBlanks, true);
  const spanishPool = Array.from(new Set((spanish.toLowerCase().match(/[a-záéíóúñü']+/g) ?? [])
    .filter(w => w.length >= 4 && !ES_STOP.has(w) && !blanks.includes(w))));

  let blankedEs = spanish;
  for (const w of blanks) blankedEs = replaceFirstWord(blankedEs, w);

  const blanksData: LyricsBlank[] = blanks.map(w => {
    // Length-similar distractors from the same passage — real Spanish words the
    // student has just seen in context.
    const targetLen = w.length;
    const tight = shuffle(spanishPool.filter(x => Math.abs(x.length - targetLen) <= 2)).slice(0, 3);
    const distractors = [...tight];
    while (distractors.length < 3) {
      distractors.push(['siempre', 'nunca', 'aquí', 'ahora'][distractors.length] ?? 'aquí');
    }
    return { word: w, options: shuffle([w, ...distractors.slice(0, 3)]) };
  });

  return {
    id: 'translation-game',
    type: 'translation_game',
    phase: 'post',
    title: '¡Traduce el texto!',
    translationText: englishFull,
    content: blankedEs,
    blanksData,
  };
}

// ─── Wrap-up ──────────────────────────────────────────────────

function buildWrapupSlide(title: string, source: string, text: string, level: LessonLevel, mode: ComprehensionMode): Slide {
  const sig = detectSignals(title, text);
  const cueVerb = mode === 'audio' ? 'listened to' : mode === 'text' ? 'read' : 'read and listened to';

  const hookByMood: Record<string, string> = {
    romantic:      `Now that you have ${cueVerb} "${title}" — who were YOU thinking about while it played?`,
    nocturnal:     `Now that you have ${cueVerb} "${title}" — where did the text take you?`,
    'road / home': `Now that you have ${cueVerb} "${title}" — did it feel like leaving, or coming back?`,
    heartbreak:    `Now that you have ${cueVerb} "${title}" — what did the text help you let go of, or hold on to?`,
    conflict:      `Now that you have ${cueVerb} "${title}" — whose side did you find yourself on, and why?`,
    spiritual:     `Now that you have ${cueVerb} "${title}" — what did it seem to be reaching for?`,
    nostalgic:     `Now that you have ${cueVerb} "${title}" — what memory did it bring back?`,
    analytical:    `Now that you have ${cueVerb} "${title}" — which claim convinced you the most, and why?`,
    reportage:     `Now that you have ${cueVerb} "${title}" — what was the ONE detail you can't stop thinking about?`,
    unspecified:   `Now that you have ${cueVerb} "${title}" — what stayed with you?`,
  };
  void source; // preserved for signature but no longer surfaced to the reader

  const simple = ['A0','A1'].includes(level);

  const bulletFelt = simple
    ? `Tell us your favourite line from "${title}" — say it out loud and explain why.`
    : `Describe the moment in "${title}" that stayed with you — the line, the image, the tone — and why.`;

  const bulletPrediction = simple
    ? `Before you read, what did you think "${title}" would be about? Was it that?`
    : `Compare your prediction from the start with what "${title}" actually turned out to be. Where were you right, and where did it take you somewhere else?`;

  const bulletCarry = simple
    ? `Pick one word from "${title}" you want to use this week. Make one sentence with it now.`
    : sig.isPersonal
      ? `Pick one line from "${title}" that could be about you. Say it out loud and explain the connection.`
      : `Pick one line from "${title}" you want to remember this week. Say it out loud and tell us why it earned that spot.`;

  return {
    id: 'wrapup',
    type: 'wrapup',
    phase: 'post',
    title: 'Wrap Up',
    prompt: hookByMood[sig.moodLabel] ?? hookByMood.unspecified,
    content: [bulletFelt, bulletPrediction, bulletCarry].map(b => `→ ${b}`).join('\n'),
  };
}

// ─── Main export ──────────────────────────────────────────────

export async function generateTextLessonAlgorithmically(
  title: string,
  source: string,
  text: string,
  level: LessonLevel,
  comprehensionMode: ComprehensionMode = 'both',
): Promise<Slide[]> {
  // Slide 4 needs textData at render time; the editor already re-enriches
  // every text_* slide with the full TextData object before saving, so we
  // only need to seed a minimal TextData here for previews.
  const previewTextData: TextData = {
    title, source, text, comprehensionMode,
  };

  const coverSlide: Slide = {
    id: 'text-cover',
    type: 'text_cover',
    phase: 'pre',
    title,
    textData: previewTextData,
  };

  const vocabSlide         = await buildVocabSlide(text, level);
  const predictionsSlide   = buildPredictionsSlide(title, source, text, level, comprehensionMode);
  const comprehensionSlide = { ...buildComprehensionSlide(text, comprehensionMode), textData: previewTextData };
  const comprehensionQuiz  = buildComprehensionQuiz(text, title);
  const langFocus          = buildLanguageFocus(text, level, title);
  const primaryGrammar     = detectPrimaryGrammarForPractice(text, level);
  const langPractice       = buildLanguagePractice(text, level, primaryGrammar, title);
  const translationGame    = await buildTranslationGame(text, level);
  const wrapupSlide        = buildWrapupSlide(title, source, text, level, comprehensionMode);

  const endSlide: Slide = {
    id: 'friendlytext-end',
    type: 'friendlytext_end',
    phase: 'post',
    title: '¡Lección completada!',
    textData: previewTextData,
  };

  return [
    coverSlide,          // 1
    vocabSlide,          // 2
    predictionsSlide,    // 3
    comprehensionSlide,  // 4
    comprehensionQuiz,   // 5
    langFocus,           // 6
    langPractice,        // 7
    translationGame,     // 8
    wrapupSlide,         // 9
    endSlide,            // 10
  ];
}
