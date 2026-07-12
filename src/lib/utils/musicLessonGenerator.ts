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

// Words most students already know at A1 — skip when picking vocab for
// beginner lessons so the slide targets the next tier of comprehension.
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

// Trim a raw dictionary definition down to a student-friendly one-liner
// without cutting words in half. Prefers first sentence, then word-boundary
// cap around 90 chars, and strips parenthetical dictionary tags.
function cleanDefinition(raw: string): string {
  const stripped = raw
    .replace(/\([^)]*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const firstSentence = stripped.split(/(?<=[.!?])\s+/)[0] ?? stripped;
  const capped = firstSentence.length <= 90
    ? firstSentence
    : firstSentence.slice(0, 90).replace(/\s+\S*$/, '') + '…';
  return capped.charAt(0).toUpperCase() + capped.slice(1);
}

// Return the FIRST lyric line that actually contains the word (word-boundary).
// Falls back to any dictionary example the API gave us, then to null.
function findLyricLineFor(word: string, lyrics: string, fallback?: string): string | undefined {
  const re = new RegExp(`\\b${word}\\b`, 'i');
  const line = lyrics.split('\n').map(l => l.trim()).find(l => l.length > 0 && re.test(l));
  return line ?? fallback;
}

async function buildVocabSlide(lyrics: string, level: LessonLevel): Promise<Slide> {
  const cfg = LEVEL_VOCAB_CFG[level] ?? { target: 7, minLen: 5, skipKnown: false };

  // Score every content word by frequency, with a strong bonus for words
  // that appear in the chorus — those repeat and pay pedagogical dividends.
  const chorus   = findChorus(lyrics).toLowerCase();
  const allWords = getContentWords(lyrics).filter(w => w.length >= cfg.minLen);
  const freq     = new Map<string, number>();
  for (const w of allWords) freq.set(w, (freq.get(w) ?? 0) + 1);

  const skipKnown = cfg.skipKnown;
  const scored: Array<{ word: string; score: number }> = [];
  for (const [word, count] of freq) {
    if (skipKnown && A1_ALREADY_KNOWN.has(word)) continue;
    const inChorus = new RegExp(`\\b${word}\\b`, 'i').test(chorus) ? 4 : 0;
    scored.push({ word, score: count * 2 + inChorus + Math.min(word.length, 8) / 10 });
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
      example: findLyricLineFor(word, lyrics, data.example),
    });
  }

  // Safety net — if the dictionary API was rate-limited or the song is very
  // sparse, top up from the ranked candidates so the slide is never empty.
  if (words.length < Math.max(4, cfg.target - 2)) {
    for (const word of candidates) {
      if (words.length >= cfg.target) break;
      if (words.find(w => w.word === word)) continue;
      words.push({
        word,
        translation: '— look it up! —',
        example: findLyricLineFor(word, lyrics),
      });
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

// Rank a line's candidate content words by pedagogical value:
//   - chorus presence (repetition = higher weight)
//   - overall frequency in the song
//   - modest length bonus so we don't bias to 4-letter fillers
// Returns candidates sorted best-first for that line.
function rankLineCandidates(
  lineText: string,
  chorusLower: string,
  freq: Map<string, number>,
): string[] {
  const candidates = Array.from(new Set(getContentWords(lineText)));
  return candidates
    .map(w => {
      const inChorus = new RegExp(`\\b${w}\\b`, 'i').test(chorusLower) ? 3 : 0;
      const f        = freq.get(w) ?? 1;
      return { w, score: f * 2 + inChorus + Math.min(w.length, 8) / 10 };
    })
    .sort((a, b) => b.score - a.score)
    .map(x => x.w);
}

// Build 3 distractors for a blank: same-song content words within ±2
// chars of the correct word, excluding the correct word itself and any
// distractor already used for this blank. Relaxes the length filter if
// the song's vocabulary is too small.
function pickLyricsDistractors(word: string, pool: string[], count: number): string[] {
  const targetLen = word.length;
  const tight = pool.filter(w => w !== word && Math.abs(w.length - targetLen) <= 2);
  const chosen: string[] = [];
  for (const w of shuffle(tight)) {
    if (chosen.length >= count) break;
    if (!chosen.includes(w)) chosen.push(w);
  }
  if (chosen.length < count) {
    const relaxed = pool.filter(w => w !== word && !chosen.includes(w));
    for (const w of shuffle(relaxed)) {
      if (chosen.length >= count) break;
      chosen.push(w);
    }
  }
  return chosen;
}

function buildLyricsGame(lyrics: string, level: LessonLevel): Slide {
  const allLines = lyrics.split('\n');

  // Frequency + chorus context — the pedagogical weight signals.
  const chorusLower = findChorus(lyrics).toLowerCase();
  const freq        = new Map<string, number>();
  for (const w of getContentWords(lyrics)) freq.set(w, (freq.get(w) ?? 0) + 1);

  // Keep original line indices so blanks land in the exact line.
  const linesMeta = allLines
    .map((text, origIdx) => ({ text, origIdx }))
    .filter(l => l.text.trim().length > 10 && !INTERJECTION_RE.test(l.text));

  const cfg = LEVEL_BLANK_CFG[level] ?? { min: 12, max: 16, step: 3 };
  const targetBlanks = Math.min(Math.max(cfg.min, Math.ceil(linesMeta.length / cfg.step)), cfg.max);
  const step = Math.max(1, Math.floor(linesMeta.length / targetBlanks));

  const wordsToBlank: string[] = [];
  const lineIndices: number[]  = []; // original line index for each blank
  const seenLines = new Set<number>();
  // We allow the same WORD to be blanked in multiple lines when it
  // repeats — that's spelling + recall practice. But we don't blank two
  // different words in the same line unless the line is very long.
  for (let i = 0; i < linesMeta.length && wordsToBlank.length < targetBlanks; i += step) {
    const { text, origIdx } = linesMeta[i];
    if (seenLines.has(origIdx)) continue;
    const ranked = rankLineCandidates(text, chorusLower, freq);
    for (const w of ranked) {
      if (new RegExp(`\\b${w}\\b`, 'i').test(text)) {
        wordsToBlank.push(w);
        lineIndices.push(origIdx);
        seenLines.add(origIdx);
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

  // Distractor pool: every content word in the song (dedup), so the
  // distractors stay rooted in vocabulary the student is meeting.
  const distractorPool = Array.from(new Set(getContentWords(lyrics)));

  // Each blank independently samples 3 length-matched distractors from
  // the full pool so later blanks aren't starved.
  const blanksData: LyricsBlank[] = wordsToBlank.map((word) => {
    const d = pickLyricsDistractors(word, distractorPool, 3);
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

// ─── Predictions signal detection ─────────────────────────────
// Read cheap signals from the title and lyrics to shape 3 CLT-style
// bullets that feel specific to the song instead of generic. We never
// spoil the lyrics — the student answers before pressing play.
const TITLE_MOOD_HINTS: Array<{ words: string[]; mood: string; sceneHint: string }> = [
  { words: ['love','heart','kiss','forever','baby','mine','yours'], mood: 'romantic',    sceneHint: 'two people at a turning point' },
  { words: ['night','dark','moon','stars','dream','sleep'],          mood: 'nocturnal',   sceneHint: 'a scene that only makes sense at night' },
  { words: ['home','road','miles','away','back','city','town'],      mood: 'road / home', sceneHint: 'someone leaving or coming back' },
  { words: ['cry','tears','broken','lost','alone','goodbye','miss'], mood: 'heartbreak',  sceneHint: 'someone remembering what they lost' },
  { words: ['dance','party','fire','run','wild','free','tonight'],   mood: 'high-energy', sceneHint: 'a night no one wants to end' },
  { words: ['god','soul','light','pray','holy','faith','spirit'],    mood: 'spiritual',   sceneHint: 'someone talking to something bigger than themselves' },
  { words: ['time','young','old','remember','yesterday','years'],    mood: 'nostalgic',   sceneHint: 'looking back at a version of yourself' },
];

interface PredictionsSignals {
  moodLabel: string;   // human-readable ("romantic", "heartbreak", "unspecified")
  sceneHint: string;   // used to seed bullet 1
  asksQuestions: boolean;
  isPersonal: boolean; // first-person ratio is high
  isEnergetic: boolean;
}

function detectPredictionsSignals(title: string, lyrics: string): PredictionsSignals {
  const titleLc = title.toLowerCase();
  let match = TITLE_MOOD_HINTS.find(h => h.words.some(w => titleLc.includes(w)));

  // Fallback: peek at lyrics — one keyword hit is enough to seed a scene.
  if (!match) {
    const lyricsLc = lyrics.toLowerCase();
    match = TITLE_MOOD_HINTS.find(h => h.words.some(w => new RegExp(`\\b${w}\\b`).test(lyricsLc)));
  }

  const asksQuestions = (lyrics.match(/\?/g)?.length ?? 0) >= 2;
  const isEnergetic   = (lyrics.match(/!/g)?.length ?? 0) >= 2;

  const words   = lyrics.toLowerCase().split(/\s+/).filter(Boolean);
  const firstP  = words.filter(w => /^(i|i'm|i've|i'll|my|me|we|we're|us|our)$/.test(w)).length;
  const isPersonal = words.length > 0 && firstP / words.length >= 0.05;

  return {
    moodLabel: match?.mood     ?? 'unspecified',
    sceneHint: match?.sceneHint ?? 'a moment the singer wants us to remember',
    asksQuestions,
    isPersonal,
    isEnergetic,
  };
}

// Bullet 1 (imaginative prediction from title/artist)
function bulletFromTitle(title: string, artist: string, sig: PredictionsSignals, level: LessonLevel): string {
  const simple = ['A0','A1'].includes(level);
  if (simple) {
    return `Picture "${title}" by ${artist}. Who do you see, and where are they?`;
  }
  if (sig.moodLabel === 'unspecified') {
    return `If "${title}" by ${artist} were a short film, describe the opening 10 seconds — sound, place, faces.`;
  }
  return `Just from the title "${title}", picture ${sig.sceneHint}. Describe it in your own words — who is there and what has just happened?`;
}

// Bullet 2 (prior experience with song/artist, turned into narrative)
function bulletFromArtist(artist: string, sig: PredictionsSignals, level: LessonLevel): string {
  const simple = ['A0','A1'].includes(level);
  if (simple) {
    return `Do you know ${artist}? Tell us one song of theirs and how it makes you feel.`;
  }
  if (sig.isEnergetic) {
    return `Tell us about the last high-energy song that made you move — was it by ${artist}, or someone with a similar vibe?`;
  }
  if (sig.isPersonal) {
    return `${artist}'s songs tend to feel personal. Tell us about a song (theirs or someone else's) that felt like it was written for you.`;
  }
  return `Tell us about a song by ${artist} — or a similar artist — that stayed in your head. What made it stick?`;
}

// Bullet 3 (personal / cultural bridge)
function bulletFromBridge(title: string, sig: PredictionsSignals, level: LessonLevel): string {
  const simple = ['A0','A1'].includes(level);
  if (simple) {
    return `Do you know a song in Spanish with a similar name to "${title}"? Tell us about it.`;
  }
  if (sig.asksQuestions) {
    return `"${title}" sounds like it might ask a question. Tell us about a question you have carried around for a while — the kind a song could answer.`;
  }
  if (sig.moodLabel === 'nostalgic') {
    return `Tell us about a moment from your past that a song called "${title}" might bring back.`;
  }
  if (sig.moodLabel === 'heartbreak') {
    return `Think of a song in Spanish that captures a similar feeling — explain the connection to a friend who only speaks English.`;
  }
  return `Think of a song in Spanish that seems to share the mood of "${title}" — how would you describe the link to someone who only speaks English?`;
}

// ─── Wrap Up bullet builders (post-listening) ─────────────────
// Same signal detection as Predictions, but the student has now heard
// the song — bullets can reference the chorus, a felt moment, and push
// the student to REUSE language from the song in their own speech.

// Bullet 1 — felt moment (references the chorus / bridge / a repeated line)
function wrapBulletFelt(title: string, sig: PredictionsSignals, level: LessonLevel): string {
  const simple = ['A0','A1'].includes(level);
  if (simple) {
    return `Tell us your favourite line from "${title}" — say it out loud and explain why.`;
  }
  if (sig.moodLabel === 'heartbreak' || sig.moodLabel === 'nostalgic') {
    return `Describe the exact moment in "${title}" that hit you hardest — the line, the sound, the image.`;
  }
  if (sig.moodLabel === 'high-energy') {
    return `Describe the moment "${title}" made you want to move. What line lit that up?`;
  }
  if (sig.moodLabel === 'spiritual') {
    return `Tell us the line from "${title}" that felt bigger than the rest — and what it seemed to be reaching for.`;
  }
  return `Describe the moment in "${title}" that stayed with you — the line, the sound, the image — and why.`;
}

// Bullet 2 — prediction vs. reality (always reflects back to slide 3)
function wrapBulletPrediction(title: string, level: LessonLevel): string {
  const simple = ['A0','A1'].includes(level);
  if (simple) {
    return `Before you listened, what did you think "${title}" would be about? Was it that?`;
  }
  return `Compare your prediction from the start with what "${title}" actually turned out to be. Where were you right, and where did it take you somewhere else?`;
}

// Bullet 3 — carry-forward: reuse language from the song
function wrapBulletCarry(title: string, artist: string, sig: PredictionsSignals, level: LessonLevel): string {
  const simple = ['A0','A1'].includes(level);
  if (simple) {
    return `Pick one word from "${title}" you want to use this week. Make one sentence with it now.`;
  }
  if (sig.moodLabel === 'road / home') {
    return `Describe a journey of your own — real or imagined — that "${title}" by ${artist} would fit as the soundtrack for.`;
  }
  if (sig.isPersonal) {
    return `Pick one line from "${title}" that could be about you. Say it out loud and explain the connection.`;
  }
  return `Pick one line from "${title}" you want to remember this week. Say it out loud and tell us why it earned that spot.`;
}

function buildWrapupSlide(title: string, artist: string, lyrics: string, level: LessonLevel): Slide {
  const sig = detectPredictionsSignals(title, lyrics);

  const hookByMood: Record<string, string> = {
    romantic:      `Now that "${title}" has finished — who were YOU thinking about while it played?`,
    nocturnal:     `Now that "${title}" has finished — where did the song take you tonight?`,
    'road / home': `Now that "${title}" has finished — did it feel like leaving, or coming back?`,
    heartbreak:    `Now that "${title}" has finished — what did the song help you let go of, or hold on to?`,
    'high-energy': `Now that "${title}" has finished — what does your body still remember from it?`,
    spiritual:     `Now that "${title}" has finished — what did it seem to be reaching for?`,
    nostalgic:     `Now that "${title}" has finished — what memory did it bring back?`,
    unspecified:   `Now that "${title}" by ${artist} has finished — what stayed with you?`,
  };

  const prompt = hookByMood[sig.moodLabel] ?? hookByMood.unspecified;

  const bullets = [
    wrapBulletFelt(title, sig, level),
    wrapBulletPrediction(title, level),
    wrapBulletCarry(title, artist, sig, level),
  ];

  return {
    id: 'wrapup',
    type: 'wrapup',
    phase: 'post',
    title: 'Wrap Up',
    prompt,
    content: bullets.map(b => `→ ${b}`).join('\n'),
  };
}

function buildPredictionsSlide(title: string, artist: string, lyrics: string, level: LessonLevel): Slide {
  const sig = detectPredictionsSignals(title, lyrics);

  const hookByMood: Record<string, string> = {
    romantic:      `Before you press play — who do you think "${title}" is really written for?`,
    nocturnal:     `Before you press play — where and when do you imagine "${title}" was written?`,
    'road / home': `Before you press play — is "${title}" a song about leaving, or about coming back?`,
    heartbreak:    `Before you press play — what do you think the singer of "${title}" is trying to let go of?`,
    'high-energy': `Before you press play — what kind of night do you think "${title}" belongs to?`,
    spiritual:     `Before you press play — who or what do you think the singer of "${title}" is speaking to?`,
    nostalgic:     `Before you press play — what memory do you think "${title}" is trying to hold on to?`,
    unspecified:   `Before you press play — what do you predict "${title}" by ${artist} will be about?`,
  };

  const prompt = hookByMood[sig.moodLabel] ?? hookByMood.unspecified;

  const bullets = [
    bulletFromTitle(title, artist, sig, level),
    bulletFromArtist(artist, sig, level),
    bulletFromBridge(title, sig, level),
  ];

  return {
    id: 'predictions',
    type: 'predictions',
    phase: 'pre',
    title: 'Before You Listen...',
    prompt,
    content: bullets.map(b => `• ${b}`).join('\n'),
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

  // Pick 6 anchor lines spread across the song so questions cover intro,
  // verse, chorus and outro rather than clustering at the top.
  const anchorAt = (frac: number) => lines[Math.max(0, Math.min(lines.length - 1, Math.floor(lines.length * frac)))] ?? lines[0] ?? '';
  const q1Line = lines[0] ?? `"${artist}" sings about love`;
  const q2Line = anchorAt(0.20);
  const q3Line = anchorAt(0.40);
  const q4Line = anchorAt(0.60);
  const q5Line = anchorAt(0.80);
  const usedLines = new Set([q1Line, q2Line, q3Line, q4Line, q5Line]);
  const fakeLines = lines.filter(l => !usedLines.has(l)).slice(0, 15);

  // Algorithmic quiz can't truly "interpret" without an LLM, so we pick
  // stems that lean interpretive (mood, message, what a line "suggests")
  // and let the AI path deliver deeper reads when available.
  const themeGuess = allWords.slice(0, 3).join(', ') || 'love and everyday life';
  const questions: QuizQuestion[] = [
    makeQuestion(`Which line best sets the mood at the beginning of "${title}"?`, q1Line.trim(), fakeLines.slice(0, 3).map(l => l.trim())),
    makeQuestion(`Which lyric suggests what the narrator is feeling early on?`, q2Line.trim(), fakeLines.slice(3, 6).map(l => l.trim())),
    makeQuestion(`Which line most likely captures the main idea of the song?`, q3Line.trim(), fakeLines.slice(6, 9).map(l => l.trim())),
    makeQuestion(`Which lyric points to a turning point in the story?`, q4Line.trim(), fakeLines.slice(9, 12).map(l => l.trim())),
    makeQuestion(`Which line best shows how the narrator feels by the end?`, q5Line.trim(), fakeLines.slice(12, 15).map(l => l.trim())),
    makeQuestion(`Overall, "${title}" by ${artist} is mainly about:`,
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
    { topic: '"There is / there are"', regex: /\b(there'?s|there is|there are)\b/i,
      description: '"There is / there are" tells us that something exists in a place or moment. Songs use it to set a scene at the very start of a story.' },
    { topic: 'Demonstratives (this / that / these / those)', regex: /\b(this|that|these|those)\s+\w+/i,
      description: 'Demonstratives point to people or things — near ("this / these") or far ("that / those"). They give a song a sense of place.' },
  ],
  'A1': [
    { topic: 'Negative contractions', regex: /\b(don't|doesn't|can't|won't|isn't|aren't|wasn't|weren't|didn't)\b/i,
      description: 'Negative contractions appear constantly in songs. They sound natural and shorten the sentence — pay attention to where the apostrophe lands.' },
    { topic: 'Simple present (3rd person)', regex: /\b(he|she|it)\s+\w+s\b/i,
      description: 'With he / she / it in the simple present we add -s (or -es) to the verb. Listen for that final "s" in the song.' },
    { topic: 'Simple present', regex: /\b(I|you|we|they)\s+(am|are|have|like|love|want|need|know|feel|see|hear|go|come|live|stay|sing|say|tell|think)\b/i,
      description: 'The simple present describes facts, habits and feelings. With I / you / we / they the verb keeps its base form.' },
    { topic: 'Adverbs of frequency', regex: /\b(always|never|usually|often|sometimes|rarely|hardly ever)\b/i,
      description: 'Adverbs of frequency (always, never, usually…) sit before the main verb and tell us HOW OFTEN something happens. Songs use them to promise or confess.' },
    { topic: 'Imperatives (give commands)', regex: /^(Come|Go|Stay|Look|Listen|Take|Give|Tell|Hold|Let|Run|Wait|Stop|Kiss|Dance|Sing|Say|Show)\b/,
      description: 'The imperative uses the base verb at the start of a sentence to ask, invite or command. It gives songs their direct, personal feel.' },
  ],
  'A2': [
    { topic: 'Present continuous (am/is/are + -ing)', regex: /\b(am|is|are|'m|'re|'s)\s+\w+ing\b/i,
      description: 'The present continuous is formed with "to be" + verb-ing. It describes actions happening right now or around now, which is why songs love it.' },
    { topic: '"Going to" for future plans', regex: /\bgoing to\s+\w+/i,
      description: '"Going to + base verb" expresses plans and intentions — something you have already decided to do.' },
    { topic: 'Past simple of "to be"', regex: /\b(was|were|wasn't|weren't)\b/i,
      description: '"Was" / "were" are the past forms of "to be". They describe states, feelings and identity in the past.' },
    { topic: '"Can / could" for ability', regex: /\b(can|can't|cannot|could|couldn't)\s+\w+/i,
      description: '"Can / could" + base verb expresses ability or possibility — what someone is (or was) able to do. Songs use it to promise, dare or regret.' },
    { topic: 'Comparative adjectives', regex: /\b(\w+er than|more \w+ than|better than|worse than|farther than|further than)\b/i,
      description: 'Comparatives (adjective + -er or "more" + adjective) put two things side by side. Songs use them to measure feelings against each other.' },
  ],
  'B1': [
    { topic: 'Past simple (irregular verbs)', regex: /\b(went|came|saw|knew|told|gave|took|made|said|got|felt|thought|fell|broke|wrote|left|stood|found|kept|brought|caught|sang|ran|drank|fought|held|spoke|heard|met|sent|read|paid)\b/i,
      description: 'The past simple describes completed actions in the past. Song lyrics are full of irregular verbs — memorise the ones you spot here.' },
    { topic: 'Modal verbs (can / will / would)', regex: /\b(can|cannot|can't|could|will|won't|would|wouldn't|should|might|may|must)\s+\w+/i,
      description: 'Modals (can, could, will, would, should…) are followed by the base verb. They express ability, future, advice or hypothetical ideas.' },
    { topic: 'Past continuous (was/were + -ing)', regex: /\b(was|were)\s+\w+ing\b/i,
      description: '"Was / were + verb-ing" describes an ongoing action in the past — perfect for storytelling and emotional songs.' },
    { topic: 'Present perfect', regex: /\b(have|has|haven't|hasn't|I've|you've|we've|they've)\s+\w+(en|ed|n|t)\b/i,
      description: '"Have / has + past participle" connects a past action with the present moment. Songs use it to say "the story is still with me".' },
    { topic: 'Superlatives (the -est / the most)', regex: /\bthe\s+(\w+est|most\s+\w+|best|worst|greatest|hardest|deepest|sweetest|closest|farthest|furthest)\b/i,
      description: 'Superlatives (the -est / the most) place one thing above every other. Songs use them to make declarations that feel absolute.' },
  ],
  'B1+': [
    { topic: 'First & second conditional', regex: /\bif\s+\w+(?:\s+\w+){0,5}\s+(would|will|could|won't|wouldn't)\b/i,
      description: 'Conditionals use "if" to express conditions and their results. First conditional ("if + present, will + base") talks about real possibilities; second conditional ("if + past, would + base") talks about imagined ones.' },
    { topic: '"Used to" for past habits', regex: /\bused to\s+\w+/i,
      description: '"Used to + base verb" describes habits or states in the past that are no longer true today. It signals nostalgia — listen for it.' },
    { topic: 'Present perfect', regex: /\b(have|has|haven't|hasn't|I've|you've|we've|they've)\s+\w+(en|ed|n|t)\b/i,
      description: '"Have / has + past participle" connects a past action with the present moment. It says the experience still matters now.' },
    { topic: 'Present perfect continuous', regex: /\b(have|has|haven't|hasn't|I've|you've|we've|they've)\s+been\s+\w+ing\b/i,
      description: '"Have / has been + verb-ing" describes an action that started in the past and is still going. Songs use it to stretch a feeling across time.' },
    { topic: 'Reported speech basics', regex: /\b(said|told|asked)\s+(?:me|you|him|her|us|them)?\s*(?:that\s+)?\w+/i,
      description: '"Said / told / asked" report what someone else said. In songs, they carry old promises, warnings or confessions into the present.' },
  ],
  'B2': [
    { topic: 'Phrasal verbs', regex: /\b(give up|hold on|let go|let it go|run away|break down|come on|fall down|fall apart|get over|move on|hang on|carry on|wake up|grow up|stand up|sit down|turn around|look up|find out|figure out|put down|take off|throw away|burn out|reach out|hold back|push back|tear apart|come back|go on|get down|come down|come up|go down|pass by|walk away|step back|back down|hold up|build up|break up|set free|wash away|burn down)\b/i,
      description: 'Phrasal verbs (verb + particle) carry meaning that goes beyond the literal words. They are central to natural English and to emotional songwriting.' },
    { topic: 'Perfect tenses', regex: /\b(have|has|had|haven't|hasn't|hadn't|I've|you've|we've|they've)\s+(been|done|gone|seen|made|got|told|thought|known|kept|left|brought|written|spoken|broken|fallen|risen|stood|sung|heard|loved)\b/i,
      description: 'Perfect tenses (present perfect, past perfect) connect different time frames. They emphasise the consequences of an action rather than its moment.' },
    { topic: 'Modals of speculation', regex: /\b(must|might|may|could)\s+(be|have)\s+\w+/i,
      description: '"Must / might / may / could + be / have + …" are used to speculate about present or past situations — a frequent device in lyrics that wonder about someone’s feelings.' },
    { topic: 'Third conditional', regex: /\bif\s+\w+(?:\s+\w+){0,5}\s+had\s+\w+.*would have\s+\w+/i,
      description: 'Third conditional ("if + past perfect, would have + past participle") imagines a different past. Songs use it to sing regrets and alternate lives.' },
    { topic: 'Passive voice basics', regex: /\b(was|were|is|are|been)\s+\w+(ed|en|n|t)\s+by\b/i,
      description: 'The passive voice ("be + past participle" + optional "by …") shifts focus from doer to receiver. Songs use it to describe things done TO the singer.' },
  ],
  'C1': [
    { topic: 'Idioms and metaphors', regex: /\b(burning bridges?|on the edge|under (my|your|his|her) skin|heart of stone|cold shoulder|broken heart|heart on (my|your|his|her) sleeve|in the dark|fading away|lost in|drowning in|walking on|head over heels|tear (me|you|us|them) apart|out of reach|silver lining|in the wind|fire in (my|your|his|her) veins|chasing dreams|lost cause|on fire|set in stone|cross the line|paint the town|break the chains)\b/i,
      description: 'C1 lyrics rely heavily on figurative language. Idioms and metaphors compress emotion into a single image — try to picture each one literally first, then interpret it.' },
    { topic: 'Inversion and rhetorical questions', regex: /^(Why|How|Where|When)\s+\w+|\b(Never have I|Little did|Rarely do|Only then)\b/,
      description: 'Inversion (auxiliary before subject) and rhetorical questions raise emphasis and drama. They are common in choruses and bridges.' },
    { topic: 'Advanced collocations', regex: /\b(deeply (in love|hurt|sorry)|madly in love|wildly free|painfully aware|hopelessly lost|utterly broken|completely (mine|yours|lost|gone))\b/i,
      description: 'Adverb + adjective collocations intensify emotion. Note how each adverb fits only with certain adjectives — that’s collocation in action.' },
    { topic: 'Cleft sentences (It was … that …)', regex: /\b(it (was|is|wasn't|isn't)|what (I|you|we|they|he|she) (did|need|want|feel))\b.*\bthat\b/i,
      description: 'Cleft sentences ("It was X that Y", "What I want is Y") split one idea into two clauses to place emphasis on X. Songs use them to underline the ONE thing that matters.' },
    { topic: 'Reduced relative clauses', regex: /\b\w+ed\s+by\s+\w+|\b\w+ing\s+(?:through|in|on|under|over|behind)\b/i,
      description: 'Reduced relative clauses drop the pronoun and auxiliary ("the girl [who was] standing there"). They pack whole descriptions into a single line.' },
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

// Detect up to N patterns (not just the first) so the bullets section
// can show more than one pattern for the same lesson when the lyrics
// support it. Falls back to the single detected result if only one hits.
function detectMultipleGrammar(lyrics: string, level: LessonLevel, limit = 3): DetectedGrammar[] {
  const lines = lyrics.split('\n').map(l => l.trim()).filter(l => l.length > 6);
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
      results.push({ topic: pat.topic, description: pat.description, examples });
      if (results.length >= limit) break;
    }
  }

  if (results.length === 0) {
    // Nothing detected — fall back to the single-pattern helper so the
    // slide never renders empty.
    results.push(detectGrammarForLevel(lyrics, level));
  }
  return results;
}

function buildLanguageFocus(lyrics: string, level: LessonLevel, title: string): Slide {
  const detected     = detectMultipleGrammar(lyrics, level, 3);
  const primary      = detected[0];

  const intro  = `In "${title}", the singer leans on ${primary.topic.toLowerCase()} to shape the story.`;
  const bullets = detected.map(d => `• ${d.topic} → ${d.description}`);
  const outro   = detected.length > 1
    ? 'Listen for these patterns across the verses and the chorus.'
    : 'Listen for this pattern across the verses and the chorus.';

  const content = [intro, '', ...bullets, '', outro].join('\n');

  // Flatten every detected example into a UI-shaped word:
  //   word        → the full lyric line (becomes the visible quote)
  //   example     → "Pattern: <fragment>" (the fragment gets highlighted)
  //   translation → the topic label (shown as an eyebrow on the card)
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

// Interjection lines don't teach anything — skip them so unscramble
// doesn't hand the student "Oh oh oh / la / na / oh".
const INTERJECTION_RE = /^\s*(oh+|ah+|uh+|na+|la+|hey+|whoa+|yeah+|ooh+|mm+)([\s,.!]|$)/i;

const LEVEL_PRACTICE_CFG: Record<string, { minWords: number; maxWords: number }> = {
  'A0':  { minWords: 4, maxWords: 6  },
  'A1':  { minWords: 4, maxWords: 6  },
  'A2':  { minWords: 5, maxWords: 7  },
  'B1':  { minWords: 6, maxWords: 9  },
  'B1+': { minWords: 6, maxWords: 10 },
  'B2':  { minWords: 7, maxWords: 11 },
  'C1':  { minWords: 7, maxWords: 11 },
};

// Word-tokenise a lyric line, preserving punctuation on the word chunks
// so the answer we display matches the visible lyric character-for-char.
function tokenizeLine(line: string): string[] {
  return line.trim().split(/\s+/).filter(Boolean);
}

// Pick lyric lines spread across sections (paragraphs) so the 4 items
// don't all come from the same repeated chorus. Deduplicates by case-
// insensitive text.
function pickDiverseLines(lyrics: string, count: number, minWords: number, maxWords: number): string[] {
  const paragraphs = lyrics.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  const perParagraph: string[][] = paragraphs.map(p =>
    p.split('\n')
      .map(l => l.trim())
      .filter(l => {
        if (!l || INTERJECTION_RE.test(l)) return false;
        const wc = tokenizeLine(l).length;
        return wc >= minWords && wc <= maxWords;
      }),
  );

  const seen = new Set<string>();
  const picks: string[] = [];
  // Round-robin across paragraphs: take one line from each, then loop.
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

// Build a plausible distractor for a match_halves item: a second-half
// from a DIFFERENT lyric line whose word count is within ±2 of the target.
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

function buildLanguagePractice(lyrics: string, level: LessonLevel): Slide {
  const cfg   = LEVEL_PRACTICE_CFG[level] ?? { minWords: 5, maxWords: 9 };
  const picks = pickDiverseLines(lyrics, 4, cfg.minWords, cfg.maxWords);

  // Fallback: if the song is too short/uniform to yield 4 lines at the
  // level's target length, relax the constraints one step at a time.
  const filled: string[] = [...picks];
  if (filled.length < 4) {
    const relaxed = pickDiverseLines(lyrics, 4, Math.max(3, cfg.minWords - 2), cfg.maxWords + 3);
    for (const l of relaxed) {
      if (filled.length >= 4) break;
      if (!filled.some(f => f.toLowerCase() === l.toLowerCase())) filled.push(l);
    }
  }

  // Absolute last-resort safety fillers so we never render an empty deck.
  const safety = ['I feel alive tonight', 'Every day is a new song', 'The world is bright with sound', 'We sing until the sky turns blue'];
  while (filled.length < 4) filled.push(safety[filled.length] ?? safety[0]);

  // Larger pool for building distractors — everything in the song that
  // isn't garbage, not just the picked 4.
  const distractorPool = lyrics.split('\n')
    .map(l => l.trim())
    .filter(l => l && !INTERJECTION_RE.test(l) && tokenizeLine(l).length >= 3);

  const items: PracticeItem[] = [];
  filled.slice(0, 4).forEach((line, i) => {
    const toks = tokenizeLine(line);
    if (i % 2 === 0) {
      // Unscramble
      items.push({
        type: 'unscramble',
        prompt: shuffle(toks).join(' / '),
        answer: line,
      });
    } else {
      // Match halves — split near the middle
      const halfIdx    = Math.max(1, Math.floor(toks.length / 2));
      const firstHalf  = toks.slice(0, halfIdx).join(' ');
      const secondHalf = toks.slice(halfIdx).join(' ');
      const distractors = pickHalfDistractors(distractorPool, secondHalf, halfIdx, 3);
      // Top up if the song is short and we didn't find 3 distinct distractors.
      while (distractors.length < 3) {
        distractors.push(['a new day', 'a broken sky', 'the sound of home', 'a song for you'][distractors.length]);
      }
      items.push({
        type: 'match_halves',
        prompt: firstHalf,
        answer: secondHalf,
        options: shuffle([secondHalf, ...distractors.slice(0, 3)]),
      });
    }
  });

  return {
    id: 'lang-practice',
    type: 'language_practice',
    phase: 'while',
    title: "Let's Practice!",
    content: 'Complete the activities below using lines from the song.',
    practiceItems: items,
  };
}

// ─── Translation Game — English → Spanish ────────────────────

type POS = 'noun' | 'verb' | 'adj';

// Curated song-lyric mini-dictionary. Not exhaustive — designed to
// cover the ~200 words that show up over and over in pop/rock lyrics,
// so word-by-word translation gets ≥60% coverage on a typical chorus.
const EN_ES: Record<string, { es: string; pos: POS }> = {
  // Feelings / abstract nouns
  love: { es: 'amor', pos: 'noun' }, heart: { es: 'corazón', pos: 'noun' },
  soul: { es: 'alma', pos: 'noun' }, mind: { es: 'mente', pos: 'noun' },
  dream: { es: 'sueño', pos: 'noun' }, dreams: { es: 'sueños', pos: 'noun' },
  hope: { es: 'esperanza', pos: 'noun' }, fear: { es: 'miedo', pos: 'noun' },
  joy: { es: 'alegría', pos: 'noun' }, pain: { es: 'dolor', pos: 'noun' },
  tear: { es: 'lágrima', pos: 'noun' }, tears: { es: 'lágrimas', pos: 'noun' },
  smile: { es: 'sonrisa', pos: 'noun' }, laugh: { es: 'risa', pos: 'noun' },
  hug: { es: 'abrazo', pos: 'noun' },
  truth: { es: 'verdad', pos: 'noun' }, lie: { es: 'mentira', pos: 'noun' },
  secret: { es: 'secreto', pos: 'noun' }, promise: { es: 'promesa', pos: 'noun' },
  memory: { es: 'recuerdo', pos: 'noun' }, story: { es: 'historia', pos: 'noun' },
  song: { es: 'canción', pos: 'noun' }, music: { es: 'música', pos: 'noun' },
  voice: { es: 'voz', pos: 'noun' }, name: { es: 'nombre', pos: 'noun' },
  choice: { es: 'elección', pos: 'noun' }, mistake: { es: 'error', pos: 'noun' },
  chance: { es: 'oportunidad', pos: 'noun' }, gift: { es: 'regalo', pos: 'noun' },
  prayer: { es: 'oración', pos: 'noun' }, faith: { es: 'fe', pos: 'noun' },
  soulmate: { es: 'alma gemela', pos: 'noun' },

  // Time
  day: { es: 'día', pos: 'noun' }, days: { es: 'días', pos: 'noun' },
  night: { es: 'noche', pos: 'noun' }, nights: { es: 'noches', pos: 'noun' },
  morning: { es: 'mañana', pos: 'noun' }, evening: { es: 'tarde', pos: 'noun' },
  tomorrow: { es: 'mañana', pos: 'noun' }, yesterday: { es: 'ayer', pos: 'noun' },
  moment: { es: 'momento', pos: 'noun' }, minute: { es: 'minuto', pos: 'noun' },
  hour: { es: 'hora', pos: 'noun' }, year: { es: 'año', pos: 'noun' },
  years: { es: 'años', pos: 'noun' }, forever: { es: 'siempre', pos: 'adj' },
  today: { es: 'hoy', pos: 'noun' },

  // Places / nature
  home: { es: 'casa', pos: 'noun' }, house: { es: 'casa', pos: 'noun' },
  city: { es: 'ciudad', pos: 'noun' }, town: { es: 'pueblo', pos: 'noun' },
  street: { es: 'calle', pos: 'noun' }, road: { es: 'camino', pos: 'noun' },
  way: { es: 'camino', pos: 'noun' }, world: { es: 'mundo', pos: 'noun' },
  land: { es: 'tierra', pos: 'noun' }, sky: { es: 'cielo', pos: 'noun' },
  sea: { es: 'mar', pos: 'noun' }, ocean: { es: 'océano', pos: 'noun' },
  river: { es: 'río', pos: 'noun' }, mountain: { es: 'montaña', pos: 'noun' },
  star: { es: 'estrella', pos: 'noun' }, stars: { es: 'estrellas', pos: 'noun' },
  moon: { es: 'luna', pos: 'noun' }, sun: { es: 'sol', pos: 'noun' },
  light: { es: 'luz', pos: 'noun' }, darkness: { es: 'oscuridad', pos: 'noun' },
  fire: { es: 'fuego', pos: 'noun' }, water: { es: 'agua', pos: 'noun' },
  wind: { es: 'viento', pos: 'noun' }, rain: { es: 'lluvia', pos: 'noun' },
  storm: { es: 'tormenta', pos: 'noun' }, snow: { es: 'nieve', pos: 'noun' },
  ice: { es: 'hielo', pos: 'noun' }, air: { es: 'aire', pos: 'noun' },
  earth: { es: 'tierra', pos: 'noun' },

  // People
  friend: { es: 'amigo', pos: 'noun' }, girl: { es: 'chica', pos: 'noun' },
  boy: { es: 'chico', pos: 'noun' }, woman: { es: 'mujer', pos: 'noun' },
  man: { es: 'hombre', pos: 'noun' }, mother: { es: 'madre', pos: 'noun' },
  father: { es: 'padre', pos: 'noun' }, brother: { es: 'hermano', pos: 'noun' },
  sister: { es: 'hermana', pos: 'noun' }, child: { es: 'niño', pos: 'noun' },
  baby: { es: 'bebé', pos: 'noun' }, family: { es: 'familia', pos: 'noun' },
  angel: { es: 'ángel', pos: 'noun' }, stranger: { es: 'extraño', pos: 'noun' },
  king: { es: 'rey', pos: 'noun' }, queen: { es: 'reina', pos: 'noun' },
  people: { es: 'gente', pos: 'noun' },

  // Body
  face: { es: 'cara', pos: 'noun' }, eyes: { es: 'ojos', pos: 'noun' },
  eye: { es: 'ojo', pos: 'noun' }, hands: { es: 'manos', pos: 'noun' },
  hand: { es: 'mano', pos: 'noun' }, arms: { es: 'brazos', pos: 'noun' },
  arm: { es: 'brazo', pos: 'noun' }, feet: { es: 'pies', pos: 'noun' },
  head: { es: 'cabeza', pos: 'noun' }, mouth: { es: 'boca', pos: 'noun' },
  lips: { es: 'labios', pos: 'noun' }, skin: { es: 'piel', pos: 'noun' },
  blood: { es: 'sangre', pos: 'noun' }, breath: { es: 'aliento', pos: 'noun' },

  // Common verbs (base form — song lyrics tend to use present)
  run: { es: 'correr', pos: 'verb' }, walk: { es: 'caminar', pos: 'verb' },
  fly: { es: 'volar', pos: 'verb' }, dance: { es: 'bailar', pos: 'verb' },
  sing: { es: 'cantar', pos: 'verb' }, cry: { es: 'llorar', pos: 'verb' },
  kiss: { es: 'besar', pos: 'verb' }, hold: { es: 'sostener', pos: 'verb' },
  feel: { es: 'sentir', pos: 'verb' },
  know: { es: 'saber', pos: 'verb' }, believe: { es: 'creer', pos: 'verb' },
  remember: { es: 'recordar', pos: 'verb' }, forget: { es: 'olvidar', pos: 'verb' },
  need: { es: 'necesitar', pos: 'verb' }, want: { es: 'querer', pos: 'verb' },
  wait: { es: 'esperar', pos: 'verb' }, wish: { es: 'desear', pos: 'verb' },
  break: { es: 'romper', pos: 'verb' }, fall: { es: 'caer', pos: 'verb' },
  rise: { es: 'levantarse', pos: 'verb' }, live: { es: 'vivir', pos: 'verb' },
  die: { es: 'morir', pos: 'verb' }, breathe: { es: 'respirar', pos: 'verb' },
  listen: { es: 'escuchar', pos: 'verb' }, hear: { es: 'oír', pos: 'verb' },
  see: { es: 'ver', pos: 'verb' }, look: { es: 'mirar', pos: 'verb' },
  find: { es: 'encontrar', pos: 'verb' }, lose: { es: 'perder', pos: 'verb' },
  leave: { es: 'irse', pos: 'verb' }, stay: { es: 'quedarse', pos: 'verb' },
  come: { es: 'venir', pos: 'verb' }, go: { es: 'ir', pos: 'verb' },
  take: { es: 'tomar', pos: 'verb' }, give: { es: 'dar', pos: 'verb' },
  show: { es: 'mostrar', pos: 'verb' }, tell: { es: 'decir', pos: 'verb' },
  say: { es: 'decir', pos: 'verb' }, ask: { es: 'preguntar', pos: 'verb' },
  forgive: { es: 'perdonar', pos: 'verb' }, hurt: { es: 'herir', pos: 'verb' },
  save: { es: 'salvar', pos: 'verb' }, keep: { es: 'guardar', pos: 'verb' },
  touch: { es: 'tocar', pos: 'verb' }, meet: { es: 'conocer', pos: 'verb' },
  sleep: { es: 'dormir', pos: 'verb' }, wake: { es: 'despertar', pos: 'verb' },
  shine: { es: 'brillar', pos: 'verb' }, burn: { es: 'arder', pos: 'verb' },
  make: { es: 'hacer', pos: 'verb' }, do: { es: 'hacer', pos: 'verb' },
  play: { es: 'jugar', pos: 'verb' },

  // Adjectives
  alone: { es: 'solo', pos: 'adj' }, together: { es: 'juntos', pos: 'adj' },
  free: { es: 'libre', pos: 'adj' }, lost: { es: 'perdido', pos: 'adj' },
  broken: { es: 'roto', pos: 'adj' }, happy: { es: 'feliz', pos: 'adj' },
  sad: { es: 'triste', pos: 'adj' }, cold: { es: 'frío', pos: 'adj' },
  warm: { es: 'cálido', pos: 'adj' }, hot: { es: 'caliente', pos: 'adj' },
  beautiful: { es: 'hermoso', pos: 'adj' }, young: { es: 'joven', pos: 'adj' },
  old: { es: 'viejo', pos: 'adj' }, new: { es: 'nuevo', pos: 'adj' },
  real: { es: 'real', pos: 'adj' }, true: { es: 'verdadero', pos: 'adj' },
  wild: { es: 'salvaje', pos: 'adj' }, deep: { es: 'profundo', pos: 'adj' },
  strong: { es: 'fuerte', pos: 'adj' }, weak: { es: 'débil', pos: 'adj' },
  dark: { es: 'oscuro', pos: 'adj' }, bright: { es: 'brillante', pos: 'adj' },
  quiet: { es: 'silencioso', pos: 'adj' }, loud: { es: 'ruidoso', pos: 'adj' },
  easy: { es: 'fácil', pos: 'adj' }, hard: { es: 'difícil', pos: 'adj' },
  crazy: { es: 'loco', pos: 'adj' }, tired: { es: 'cansado', pos: 'adj' },
};

// Try MyMemory (free, no key, ~5000 chars/day/IP) for a real Spanish
// translation of the chorus. Returns null on any failure so the caller
// can degrade gracefully to the dictionary path.
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
    // MyMemory returns an ALL-CAPS "MYMEMORY WARNING" string when it can't
    // translate — treat that as a soft failure.
    if (/MYMEMORY WARNING/i.test(translated)) return null;
    return translated.trim();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Word-by-word dictionary translation. Preserves line breaks and any
// tokens we couldn't translate. Returns coverage so the caller can
// decide whether the output is usable Spanish or kitchen mess.
function translateWithDictionary(text: string): { translated: string; coverage: number } {
  const lines = text.split('\n');
  let contentWords = 0;
  let hits = 0;

  const outLines = lines.map(line => {
    const parts = line.split(/(\s+)/); // keep whitespace tokens
    const outParts = parts.map(part => {
      if (/^\s+$/.test(part) || !part) return part;
      // Extract the leading/trailing punctuation so we can reattach it.
      const m = part.match(/^([^A-Za-z']*)([A-Za-z']+)([^A-Za-z']*)$/);
      if (!m) return part;
      const [, lead, word, trail] = m;
      contentWords++;
      const key = word.toLowerCase();
      const entry = EN_ES[key];
      if (entry) {
        hits++;
        return lead + entry.es + trail;
      }
      return part;
    });
    return outParts.join('');
  });

  return {
    translated: outLines.join('\n'),
    coverage: contentWords === 0 ? 0 : hits / contentWords,
  };
}

// Score how "Spanish-looking" a translated text is — used to detect
// residual English tokens after word-by-word translation.
function spanishCoverage(text: string): number {
  const words = text.toLowerCase().match(/[a-záéíóúñü']+/g) ?? [];
  if (words.length === 0) return 0;
  const spanishHits = words.filter(w =>
    Object.values(EN_ES).some(v => v.es.toLowerCase() === w) ||
    /[áéíóúñü]/.test(w) ||
    ['de','la','el','y','a','los','las','un','una','que','en','por','con','no','sí','mi','tu','su','me','te','se','lo','le'].includes(w),
  ).length;
  return spanishHits / words.length;
}

// Pick blanks from the Spanish content words we know we translated
// from the dictionary — those we can build good POS-matched distractors
// for. Falls back to any long enough word when the dictionary hit was
// via MyMemory only.
function chooseSpanishBlanks(
  spanish: string,
  englishSource: string,
  target: number,
): Array<{ word: string; pos: POS | null }> {
  const spanishSet = new Set<string>();
  const results: Array<{ word: string; pos: POS | null }> = [];

  // Path A — words present in EN_ES whose ES value appears in the text.
  const englishWords = englishSource.toLowerCase().match(/[a-z']+/g) ?? [];
  for (const en of englishWords) {
    if (results.length >= target) break;
    const entry = EN_ES[en];
    if (!entry) continue;
    const es = entry.es;
    if (spanishSet.has(es)) continue;
    if (!new RegExp(`\\b${es}\\b`, 'i').test(spanish)) continue;
    spanishSet.add(es);
    results.push({ word: es, pos: entry.pos });
  }

  // Path B — top up with any Spanish content word from the translation
  // (≥4 letters, not a stopword) when Path A didn't fill the quota.
  const esStop = new Set(['de','la','el','los','las','un','una','y','a','que','en','por','con','no','sí','mi','tu','su','me','te','se','lo','le','del','para','pero','como','más','muy','sin','ni','tan','ya','ser','ser','soy','eres','es','somos','son']);
  const candidates = (spanish.toLowerCase().match(/[a-záéíóúñü']+/g) ?? [])
    .filter(w => w.length >= 4 && !esStop.has(w));
  for (const w of candidates) {
    if (results.length >= target) break;
    if (spanishSet.has(w)) continue;
    spanishSet.add(w);
    results.push({ word: w, pos: null });
  }

  return results;
}

// Build POS-matched distractors for a Spanish blank. Draws from the
// dictionary's Spanish values so distractors are always real Spanish
// words. Filters by same POS when known, and by ±2 letters of length.
function buildSpanishDistractors(blank: { word: string; pos: POS | null }, count: number, exclude: Set<string>): string[] {
  const targetLen = blank.word.length;
  const pool = Object.values(EN_ES)
    .filter(v => (blank.pos ? v.pos === blank.pos : true))
    .map(v => v.es)
    .filter(es => es.toLowerCase() !== blank.word.toLowerCase() && !exclude.has(es.toLowerCase()))
    .filter(es => Math.abs(es.length - targetLen) <= 2);

  const picked = shuffle(Array.from(new Set(pool))).slice(0, count);
  // Fallback pool: relax length constraint if we didn't find enough.
  if (picked.length < count) {
    const relaxed = Object.values(EN_ES)
      .filter(v => (blank.pos ? v.pos === blank.pos : true))
      .map(v => v.es)
      .filter(es => es.toLowerCase() !== blank.word.toLowerCase() && !picked.includes(es) && !exclude.has(es.toLowerCase()));
    for (const es of shuffle(relaxed)) {
      if (picked.length >= count) break;
      picked.push(es);
    }
  }
  return picked;
}

const LEVEL_TRANSLATION_BLANKS: Record<string, number> = {
  'A0':  5, 'A1':  5, 'A2':  6, 'B1':  6, 'B1+': 6, 'B2': 7, 'C1': 7,
};

async function buildTranslationGame(chorus: string, lyrics: string, level: LessonLevel): Promise<Slide> {
  const englishChorus = chorus.split('\n').filter(l => l.trim()).join('\n');
  const targetBlanks  = LEVEL_TRANSLATION_BLANKS[level] ?? 6;

  // Try real translation first, then dictionary, then measure coverage.
  let spanish: string | null = await translateWithMyMemory(englishChorus);
  let sourceCoverage = spanish ? spanishCoverage(spanish) : 0;

  if (!spanish || sourceCoverage < 0.6) {
    const dict = translateWithDictionary(englishChorus);
    if (dict.coverage >= 0.6 || !spanish) {
      spanish = dict.translated;
      sourceCoverage = spanishCoverage(spanish);
    }
  }

  // ─── Degraded path: no usable Spanish → honest English cloze ────
  // Rather than mislabel English as Spanish, we build a chorus-completion
  // exercise where content and options stay in English but the title makes
  // it clear this is a chorus recognition task, not a translation one.
  if (!spanish || sourceCoverage < 0.5) {
    const allWords = Array.from(new Set(getContentWords(lyrics)));
    const chorusLines = englishChorus.split('\n');
    const wordsToBlank: string[] = [];
    const seenEn = new Set<string>();
    for (const line of chorusLines) {
      if (wordsToBlank.length >= targetBlanks) break;
      for (const w of shuffle(getContentWords(line))) {
        if (!seenEn.has(w) && wordsToBlank.length < targetBlanks) {
          wordsToBlank.push(w);
          seenEn.add(w);
          break;
        }
      }
    }
    let blankedEn = englishChorus;
    for (const w of wordsToBlank) {
      blankedEn = blankedEn.replace(new RegExp(`\\b${w}\\b`, 'i'), '{{blank}}');
    }
    const distractorPoolEn = allWords.filter(w => !seenEn.has(w));
    const blanksData: LyricsBlank[] = wordsToBlank.map(w => {
      const d = shuffle(distractorPoolEn.filter(x => x !== w)).slice(0, 3);
      return { word: w, options: shuffle([w, ...d]) };
    });
    return {
      id: 'translation-game',
      type: 'translation_game',
      phase: 'post',
      title: 'Complete the Chorus',
      translationText: englishChorus,
      content: blankedEn,
      blanksData,
    };
  }

  // ─── Good path: fill Spanish blanks with POS-matched distractors ─
  const blanks = chooseSpanishBlanks(spanish, englishChorus, targetBlanks);
  const usedSpanish = new Set(blanks.map(b => b.word.toLowerCase()));

  let blankedEs = spanish;
  for (const b of blanks) {
    blankedEs = blankedEs.replace(new RegExp(`\\b${b.word}\\b`, 'i'), '{{blank}}');
  }

  const blanksData: LyricsBlank[] = blanks.map(b => {
    const distractors = buildSpanishDistractors(b, 3, usedSpanish);
    while (distractors.length < 3) distractors.push(['siempre', 'nunca', 'aquí'][distractors.length] ?? 'aquí');
    return { word: b.word, options: shuffle([b.word, ...distractors.slice(0, 3)]) };
  });

  return {
    id: 'translation-game',
    type: 'translation_game',
    phase: 'post',
    title: '¡Traduce el coro!',
    translationText: englishChorus,
    content: blankedEs,
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

  const predictionsSlide = buildPredictionsSlide(title, artist, lyrics, level);

  const lyricsGame = buildLyricsGame(lyrics, level);
  lyricsGame.songData = { title, artist, albumArt: songData.albumArt, previewUrl: songData.previewUrl, youtubeUrl: songData.youtubeUrl, lyrics };

  const listeningQuiz = buildListeningQuiz(lyrics, title, artist);
  const langFocus = buildLanguageFocus(lyrics, level, title);
  const langPractice = buildLanguagePractice(lyrics, level);
  const translationGame = await buildTranslationGame(chorus, lyrics, level);
  translationGame.songData = { title, artist, albumArt: songData.albumArt, previewUrl: songData.previewUrl, youtubeUrl: songData.youtubeUrl, lyrics };

  const wrapupSlide = buildWrapupSlide(title, artist, lyrics, level);

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
