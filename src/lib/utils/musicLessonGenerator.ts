// FriendlyTeaching.cl — Algorithmic 10-slide Friendlyrics® generator (no AI required)
// Uses Free Dictionary API (api.dictionaryapi.dev) for vocab definitions.

import type { Slide, LessonLevel, VocabWord, LyricsBlank, QuizQuestion, PracticeItem } from '@/types/firebase';

// ─── Stopwords ────────────────────────────────────────────────

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
  'oh','yeah','hey','na','la','da','ooh','ah','uh','mm','em',
  "don't","can't","won't","i'm","i'll","i've","you're","it's","ain't",
  "they're","we're","she's","he's","that's","there's","here's",
]);

// ─── Helpers ──────────────────────────────────────────────────

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

function findChorus(lyrics: string): string {
  const paragraphs = lyrics.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  if (paragraphs.length <= 1) {
    const lines = lyrics.split('\n').filter(Boolean);
    return lines.slice(0, Math.min(6, lines.length)).join('\n');
  }
  const counts = new Map<string, number>();
  for (const p of paragraphs) {
    const key = p.toLowerCase().trim();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let best = paragraphs[0];
  let bestCount = 0;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      best = paragraphs.find(p => p.toLowerCase().trim() === key) ?? best;
    }
  }
  return best;
}

function findVerse(lyrics: string, exclude: string): string {
  const paragraphs = lyrics.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  const other = paragraphs.filter(p => p.trim() !== exclude.trim());
  return other[0] ?? paragraphs[0];
}

// ─── Dictionary API ───────────────────────────────────────────

interface DictEntry {
  phonetic?: string;
  meanings: Array<{
    definitions: Array<{ definition: string; example?: string }>;
  }>;
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

// ─── Slide builders ───────────────────────────────────────────

async function buildVocabSlide(lyrics: string, level: LessonLevel): Promise<Slide> {
  const minLen = ['A0', 'A1'].includes(level) ? 4 : ['A2', 'B1'].includes(level) ? 5 : 6;
  const candidates = Array.from(new Set(getContentWords(lyrics)))
    .filter(w => w.length >= minLen)
    .sort((a, b) => b.length - a.length)
    .slice(0, 24);

  const words: VocabWord[] = [];
  for (const word of candidates) {
    if (words.length >= 7) break;
    const data = await lookupWord(word);
    if (data?.definition) {
      const def = data.definition.charAt(0).toUpperCase() + data.definition.slice(1);
      words.push({
        word,
        translation: def.length > 80 ? def.slice(0, 77) + '…' : def,
        pronunciation: data.phonetic,
        example: data.example,
      });
    }
  }
  if (words.length < 4) {
    for (const word of candidates) {
      if (words.length >= 6) break;
      if (!words.find(w => w.word === word)) {
        words.push({ word, translation: '— look it up! —' });
      }
    }
  }
  return { id: 'vocab-match', type: 'vocab_match', phase: 'pre', title: 'Key Vocabulary', words };
}

// Blank count range per CEFR level: more advanced = more targets, denser distribution
const LEVEL_BLANK_CFG: Record<string, { min: number; max: number; step: number }> = {
  'A0':  { min: 5,  max: 8,  step: 5 },
  'A1':  { min: 7,  max: 10, step: 4 },
  'A2':  { min: 9,  max: 13, step: 4 },
  'B1':  { min: 12, max: 16, step: 3 },
  'B1+': { min: 14, max: 19, step: 3 },
  'B2':  { min: 17, max: 23, step: 2 },
  'C1':  { min: 20, max: 28, step: 2 },
};

function buildLyricsGame(lyrics: string, level: LessonLevel): Slide {
  const allWords  = Array.from(new Set(getContentWords(lyrics)));
  const allLines  = lyrics.split('\n');
  // Keep original line indices so we can replace in the exact line
  const linesMeta = allLines
    .map((text, origIdx) => ({ text, origIdx }))
    .filter(l => l.text.trim().length > 10);

  const cfg = LEVEL_BLANK_CFG[level] ?? { min: 12, max: 16, step: 3 };
  const targetBlanks = Math.min(Math.max(cfg.min, Math.ceil(linesMeta.length / cfg.step)), cfg.max);
  const step = Math.max(1, Math.floor(linesMeta.length / targetBlanks));

  const wordsToBlank: string[] = [];
  const lineIndices: number[]  = []; // original line index for each blank
  const seen = new Set<string>();

  for (let i = 0; i < linesMeta.length && wordsToBlank.length < targetBlanks; i += step) {
    const { text, origIdx } = linesMeta[i];
    for (const w of shuffle(getContentWords(text))) {
      if (!seen.has(w) && new RegExp(`\\b${w}\\b`, 'i').test(text)) {
        wordsToBlank.push(w);
        lineIndices.push(origIdx);
        seen.add(w);
        break;
      }
    }
  }

  // Replace each word in its exact original line (not just first occurrence in text)
  const linesArr = [...allLines];
  for (let k = 0; k < wordsToBlank.length; k++) {
    const li = lineIndices[k];
    linesArr[li] = linesArr[li].replace(new RegExp(`\\b${wordsToBlank[k]}\\b`, 'i'), '{{blank}}');
  }
  const blankedText = linesArr.join('\n');

  const distractorPool = allWords.filter(w => !seen.has(w));
  // Each blank independently samples 3 distractors so later blanks don't run
  // out when the pool is smaller than 3 × numBlanks.
  const blanksData: LyricsBlank[] = wordsToBlank.map((word) => {
    const d = shuffle(distractorPool.filter(w => w !== word)).slice(0, 3);
    return { word, options: shuffle([word, ...d]) };
  });

  return {
    id: 'lyrics-game',
    type: 'lyrics_game',
    phase: 'while',
    title: 'Fill in the Blanks!',
    content: blankedText,
    blanksData,
  };
}

function buildListeningQuiz(lyrics: string, title: string, artist: string): Slide {
  const lines = lyrics.split('\n').filter(l => l.trim().length > 20 && l.trim().length < 100);
  const allWords = Array.from(new Set(getContentWords(lyrics)));

  function makeQuestion(qText: string, correctLine: string, otherLines: string[]): QuizQuestion {
    const opts = shuffle([correctLine, ...shuffle(otherLines).slice(0, 3)]).map((t, i) => ({
      id: String.fromCharCode(97 + i),
      text: t,
      isCorrect: t === correctLine,
    }));
    return { question: qText, options: opts, correctAnswer: correctLine };
  }

  const q1Line = lines[0] ?? `"${artist}" sings about love`;
  const q2Line = lines[Math.floor(lines.length * 0.25)] ?? lines[0] ?? '';
  const q3Line = lines[Math.floor(lines.length * 0.5)] ?? lines[0] ?? '';
  const restLines = lines.filter(l => ![q1Line, q2Line, q3Line].includes(l));
  const fakeLines = restLines.slice(0, 9);

  const questions: QuizQuestion[] = [
    makeQuestion(`Which line appears early in "${title}"?`, q1Line.trim(), fakeLines.slice(0, 3).map(l => l.trim())),
    makeQuestion(`Complete this lyric: "${q2Line.trim().split(' ').slice(0, 4).join(' ')}..."`, q2Line.trim(), fakeLines.slice(3, 6).map(l => l.trim())),
    makeQuestion(`Which of these is a lyric from "${title}"?`, q3Line.trim(), fakeLines.slice(6, 9).map(l => l.trim())),
    makeQuestion(`The song "${title}" by ${artist} is mainly about:`,
      allWords.slice(0, 3).join(', ') || 'everyday life',
      ['nature and adventure', 'historical events', 'scientific discoveries'].filter(x => x !== allWords.slice(0, 3).join(', ')),
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

// ─── Grammar detector ─────────────────────────────────────────
// For each CEFR level we keep an ordered list of patterns. We scan the actual
// lyric lines and pick the FIRST pattern that produces enough real-line hits.
// This guarantees the Language Focus slide is always tied to what is sung.
interface GrammarPattern {
  topic: string;
  description: string;
  regex: RegExp;
}

const GRAMMAR_PATTERNS: Record<string, GrammarPattern[]> = {
  'A0': [
    { topic: 'Contractions with "to be"', regex: /\b(I'm|you're|we're|they're|he's|she's|it's|that's)\b/i,
      description: 'These contractions join a pronoun and the verb "to be". They are extremely common in spoken English and song lyrics — practise reading them out loud.' },
    { topic: 'Subject pronouns + "to be"', regex: /\b(I am|you are|he is|she is|it is|we are|they are)\b/i,
      description: 'Subject pronouns (I, you, he, she, it, we, they) combined with the verb "to be" (am, is, are). This is the most basic English sentence structure.' },
    { topic: 'Simple present', regex: /\b(I|you|we|they)\s+(like|love|want|need|know|feel|see|go|come|sing|live|hear|say|tell|think|stay)\b/i,
      description: 'The simple present is used for habits, feelings and facts. With I / you / we / they we use the base form of the verb.' },
  ],
  'A1': [
    { topic: 'Negative contractions', regex: /\b(don't|doesn't|can't|won't|isn't|aren't|wasn't|weren't|didn't)\b/i,
      description: 'Negative contractions appear constantly in songs. They sound natural and shorten the sentence — pay attention to where the apostrophe lands.' },
    { topic: 'Simple present (3rd person)', regex: /\b(he|she|it)\s+\w+s\b/i,
      description: 'With he / she / it in the simple present we add -s (or -es) to the verb. Listen for that final "s" in the song.' },
    { topic: 'Simple present', regex: /\b(I|you|we|they)\s+(am|are|have|like|love|want|need|know|feel|see|hear|go|come|live|stay|sing|say|tell|think)\b/i,
      description: 'The simple present describes facts, habits and feelings. With I / you / we / they the verb keeps its base form.' },
  ],
  'A2': [
    { topic: 'Present continuous (am/is/are + -ing)', regex: /\b(am|is|are|'m|'re|'s)\s+\w+ing\b/i,
      description: 'The present continuous is formed with "to be" + verb-ing. It describes actions happening right now or around now, which is why songs love it.' },
    { topic: '"Going to" for future plans', regex: /\bgoing to\s+\w+/i,
      description: '"Going to + base verb" expresses plans and intentions — something you have already decided to do.' },
    { topic: 'Past simple of "to be"', regex: /\b(was|were|wasn't|weren't)\b/i,
      description: '"Was" / "were" are the past forms of "to be". They describe states, feelings and identity in the past.' },
  ],
  'B1': [
    { topic: 'Past simple (irregular verbs)', regex: /\b(went|came|saw|knew|told|gave|took|made|said|got|felt|thought|fell|broke|wrote|left|stood|found|kept|brought|caught|sang|ran|drank|fought|held|spoke|heard|met|sent|read|paid)\b/i,
      description: 'The past simple describes completed actions in the past. Song lyrics are full of irregular verbs — memorise the ones you spot here.' },
    { topic: 'Modal verbs (can / will / would)', regex: /\b(can|cannot|can't|could|will|won't|would|wouldn't|should|might|may|must)\s+\w+/i,
      description: 'Modals (can, could, will, would, should…) are followed by the base verb. They express ability, future, advice or hypothetical ideas.' },
    { topic: 'Past continuous (was/were + -ing)', regex: /\b(was|were)\s+\w+ing\b/i,
      description: '"Was / were + verb-ing" describes an ongoing action in the past — perfect for storytelling and emotional songs.' },
  ],
  'B1+': [
    { topic: 'First & second conditional', regex: /\bif\s+\w+(?:\s+\w+){0,5}\s+(would|will|could|won't|wouldn't)\b/i,
      description: 'Conditionals use "if" to express conditions and their results. First conditional ("if + present, will + base") talks about real possibilities; second conditional ("if + past, would + base") talks about imagined ones.' },
    { topic: '"Used to" for past habits', regex: /\bused to\s+\w+/i,
      description: '"Used to + base verb" describes habits or states in the past that are no longer true today. It signals nostalgia — listen for it.' },
    { topic: 'Present perfect', regex: /\b(have|has|haven't|hasn't|I've|you've|we've|they've)\s+\w+(en|ed|n|t)\b/i,
      description: '"Have / has + past participle" connects a past action with the present moment. It says the experience still matters now.' },
  ],
  'B2': [
    { topic: 'Phrasal verbs', regex: /\b(give up|hold on|let go|let it go|run away|break down|come on|fall down|fall apart|get over|move on|hang on|carry on|wake up|grow up|stand up|sit down|turn around|look up|find out|figure out|put down|take off|throw away|burn out|reach out|hold back|push back|tear apart|come back|go on|get down|come down|come up|go down|pass by|walk away|step back|back down|hold up|build up|break up|set free|wash away|burn down)\b/i,
      description: 'Phrasal verbs (verb + particle) carry meaning that goes beyond the literal words. They are central to natural English and to emotional songwriting.' },
    { topic: 'Perfect tenses', regex: /\b(have|has|had|haven't|hasn't|hadn't|I've|you've|we've|they've)\s+(been|done|gone|seen|made|got|told|thought|known|kept|left|brought|written|spoken|broken|fallen|risen|stood|sung|heard|loved)\b/i,
      description: 'Perfect tenses (present perfect, past perfect) connect different time frames. They emphasise the consequences of an action rather than its moment.' },
    { topic: 'Modals of speculation', regex: /\b(must|might|may|could)\s+(be|have)\s+\w+/i,
      description: '"Must / might / may / could + be / have + …" are used to speculate about present or past situations — a frequent device in lyrics that wonder about someone’s feelings.' },
  ],
  'C1': [
    { topic: 'Idioms and metaphors', regex: /\b(burning bridges?|on the edge|under (my|your|his|her) skin|heart of stone|cold shoulder|broken heart|heart on (my|your|his|her) sleeve|in the dark|fading away|lost in|drowning in|walking on|head over heels|tear (me|you|us|them) apart|out of reach|silver lining|in the wind|fire in (my|your|his|her) veins|chasing dreams|lost cause|on fire|set in stone|cross the line|paint the town|break the chains)\b/i,
      description: 'C1 lyrics rely heavily on figurative language. Idioms and metaphors compress emotion into a single image — try to picture each one literally first, then interpret it.' },
    { topic: 'Inversion and rhetorical questions', regex: /^(Why|How|Where|When)\s+\w+|\b(Never have I|Little did|Rarely do|Only then)\b/,
      description: 'Inversion (auxiliary before subject) and rhetorical questions raise emphasis and drama. They are common in choruses and bridges.' },
    { topic: 'Advanced collocations', regex: /\b(deeply (in love|hurt|sorry)|madly in love|wildly free|painfully aware|hopelessly lost|utterly broken|completely (mine|yours|lost|gone))\b/i,
      description: 'Adverb + adjective collocations intensify emotion. Note how each adverb fits only with certain adjectives — that’s collocation in action.' },
  ],
};

interface DetectedGrammar {
  topic: string;
  description: string;
  examples: { highlight: string; line: string }[];
}

function detectGrammarForLevel(lyrics: string, level: LessonLevel): DetectedGrammar {
  const lines = lyrics.split('\n').map(l => l.trim()).filter(l => l.length > 6);
  const patterns = GRAMMAR_PATTERNS[level] ?? GRAMMAR_PATTERNS['B1'];

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
      return { topic: pat.topic, description: pat.description, examples };
    }
  }

  // Nothing detected — give back a graceful default using the first real lines.
  const fallback = patterns[0] ?? { topic: 'Key expressions', description: 'Notice how everyday words combine into natural patterns in this song.' };
  return {
    topic: fallback.topic,
    description: fallback.description,
    examples: lines.slice(0, 3).map(l => ({ highlight: l.split(/\s+/)[0] ?? l, line: l })),
  };
}

function buildLanguageFocus(lyrics: string, level: LessonLevel): Slide {
  const detected = detectGrammarForLevel(lyrics, level);
  return {
    id: 'lang-focus',
    type: 'language_focus',
    phase: 'while',
    title: `Language Focus: ${detected.topic}`,
    content: detected.description,
    words: detected.examples.map(ex => ({
      word: ex.highlight,
      translation: detected.topic,
      example: ex.line,
    })),
  };
}

function buildLanguagePractice(lyrics: string): Slide {
  const lines = lyrics.split('\n').filter(l => l.trim().length > 15 && l.trim().length < 80);
  const line1 = lines[0] ?? 'I feel alive';
  const line2 = lines[1] ?? 'The world is bright';
  const words1 = line1.trim().split(' ').filter(Boolean);
  const words2 = line2.trim().split(' ').filter(Boolean);

  const unscramble1: PracticeItem = {
    type: 'unscramble',
    prompt: shuffle(words1).join(' / '),
    answer: line1.trim(),
  };

  const halfIdx = Math.floor(words2.length / 2);
  const firstHalf = words2.slice(0, halfIdx).join(' ');
  const secondHalf = words2.slice(halfIdx).join(' ');
  const allLines = lines.filter(l => l.trim() !== line2.trim());
  const wrongHalves = allLines.slice(0, 3).map(l => l.trim().split(' ').slice(halfIdx).join(' ')).filter(Boolean);

  const matchHalves: PracticeItem = {
    type: 'match_halves',
    prompt: firstHalf,
    answer: secondHalf,
    options: shuffle([secondHalf, ...wrongHalves.slice(0, 3)]),
  };

  const line3 = lines[2] ?? 'Every day is new';
  const words3 = line3.trim().split(' ').filter(Boolean);

  const unscramble2: PracticeItem = {
    type: 'unscramble',
    prompt: shuffle(words3).join(' / '),
    answer: line3.trim(),
  };

  return {
    id: 'lang-practice',
    type: 'language_practice',
    phase: 'while',
    title: "Let's Practice!",
    content: 'Complete the activities below using lines from the song.',
    practiceItems: [unscramble1, matchHalves, unscramble2],
  };
}

function buildTranslationGame(chorus: string, lyrics: string): Slide {
  const allWords = Array.from(new Set(getContentWords(lyrics)));
  const lines = chorus.split('\n').filter(l => l.trim());
  const chorusText = lines.join('\n');

  // Build a simplified Spanish placeholder (algorithmic — no translation API)
  // We'll create a cloze from the same English text but label it as practice
  const wordsToBlank: string[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    if (wordsToBlank.length >= 6) break;
    const w = getContentWords(line);
    for (const word of shuffle(w)) {
      if (!seen.has(word) && wordsToBlank.length < 6) {
        wordsToBlank.push(word);
        seen.add(word);
        break;
      }
    }
  }

  let blankedText = chorusText;
  for (const word of wordsToBlank) {
    blankedText = blankedText.replace(new RegExp(`\\b${word}\\b`, 'i'), '{{blank}}');
  }

  const distractorPool2 = allWords.filter(w => !seen.has(w));
  const blanksData: LyricsBlank[] = wordsToBlank.map((word) => {
    const d = shuffle(distractorPool2.filter(w => w !== word)).slice(0, 3);
    return { word, options: shuffle([word, ...d]) };
  });

  return {
    id: 'translation-game',
    type: 'translation_game',
    phase: 'post',
    title: 'Complete the Chorus',
    translationText: chorusText,
    content: blankedText,
    blanksData,
  };
}

// ─── Main export ──────────────────────────────────────────────

export async function generateMusicLessonAlgorithmically(
  title: string,
  artist: string,
  lyrics: string,
  level: LessonLevel,
  songData: { albumArt: string; previewUrl?: string; youtubeUrl?: string },
): Promise<Slide[]> {
  const chorus = findChorus(lyrics);
  const verse = findVerse(lyrics, chorus);
  void verse; // used implicitly via lyrics

  const vocabSlide = await buildVocabSlide(lyrics, level);

  const coverSlide: Slide = {
    id: 'song-cover',
    type: 'song_cover',
    phase: 'pre',
    title: `${title} by ${artist}`,
    subtitle: "Let's learn English through music!",
    songData: { title, artist, albumArt: songData.albumArt, previewUrl: songData.previewUrl, youtubeUrl: songData.youtubeUrl, lyrics },
  };

  const predictionsSlide: Slide = {
    id: 'predictions',
    type: 'predictions',
    phase: 'pre',
    title: 'Before You Listen...',
    prompt: `What do you think "${title}" by ${artist} is about?`,
    content: `• What emotions do you think the song expresses?\n• Look at the title — what story might it tell?\n• Have you heard this song before? What do you remember?`,
  };

  const lyricsGame = buildLyricsGame(lyrics, level);
  lyricsGame.songData = { title, artist, albumArt: songData.albumArt, previewUrl: songData.previewUrl, youtubeUrl: songData.youtubeUrl, lyrics };

  const listeningQuiz = buildListeningQuiz(lyrics, title, artist);
  const langFocus = buildLanguageFocus(lyrics, level);
  const langPractice = buildLanguagePractice(lyrics);
  const translationGame = buildTranslationGame(chorus, lyrics);
  translationGame.songData = { title, artist, albumArt: songData.albumArt, previewUrl: songData.previewUrl, youtubeUrl: songData.youtubeUrl, lyrics };

  const wrapupSlide: Slide = {
    id: 'wrapup',
    type: 'wrapup',
    phase: 'post',
    title: 'Wrap Up',
    prompt: `How did the song "${title}" make you feel? Did it match your predictions?`,
    content: `→ What was the most interesting expression you learned?\n→ Would you recommend this song to a friend? Why?\n→ How does the song connect to your own life?`,
  };

  const endSlide: Slide = {
    id: 'friendlyrics-end',
    type: 'friendlyrics_end',
    phase: 'post',
    title: '¡Lección completada!',
    songData: { title, artist, albumArt: songData.albumArt, previewUrl: songData.previewUrl, youtubeUrl: songData.youtubeUrl, lyrics },
  };

  return [
    coverSlide,        // 1
    vocabSlide,        // 2
    predictionsSlide,  // 3
    lyricsGame,        // 4
    listeningQuiz,     // 5
    langFocus,         // 6
    langPractice,      // 7
    translationGame,   // 8
    wrapupSlide,       // 9
    endSlide,          // 10
  ];
}
