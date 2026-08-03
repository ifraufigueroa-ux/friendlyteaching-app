// FriendlyTeaching.cl — Shared transcript-based clip lesson editor
//
// Used by both /dashboard/teacher/friendlyflix (Friendlyflix®) and
// /dashboard/teacher/music (Friendlyrics · Manual con transcript) so the
// two flows share the same YouTube URL + transcript + {{blank}} + timings
// authoring workflow.
//
// In song mode the save handler calls /api/music-lesson to auto-generate
// the surrounding CLT deck (cover, predictions, vocab_match, listening_quiz,
// language_focus, language_practice, translation_game, wrapup, end) and
// swaps in the teacher-authored lyrics_game slide at position 4.
'use client';
import { useEffect, useState } from 'react';
import { createMovieLesson, updateMovieLesson } from '@/hooks/useMovieLessons';
import { createMusicLesson, updateMusicLesson } from '@/hooks/useMusicLessons';
import { parseYouTubeTranscript } from '@/lib/utils/transcriptParser';
import type {
  MovieLesson, MusicLesson, Slide, LessonLevel, ClipData, LyricsBlank,
  QuizQuestion, SongData,
} from '@/types/firebase';

const LEVELS: LessonLevel[] = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];

interface BlankRow { word: string; options: string }
interface QuestionRow { question: string; options: string[]; correctIdx: number }

export type EditorMode = 'movie' | 'song';

interface Copy {
  createTitle:      string;
  editTitle:        string;
  saveCreate:       string;
  saveEdit:         string;
  titleLabel:       string;
  sourceLabel:      string;
  dialogueLabel:    string;
  dialoguePlaceholder: string;
  headerHint:       string;
  errorNoUrl:       string;
  errorNoTitle:     string;
  errorNoSource:    string;
  errorNoDialogue:  string;
  errorNoBlank:     string;
}

const COPY: Record<EditorMode, Copy> = {
  movie: {
    createTitle:  'Crear clip lesson',
    editTitle:    'Editar clip',
    saveCreate:   'Crear clip lesson',
    saveEdit:     'Guardar cambios',
    titleLabel:   'Título escena *',
    sourceLabel:  'Serie / película *',
    dialogueLabel:'Diálogo (una línea por renglón) *',
    dialoguePlaceholder: 'I want you to {{blank}} me everything.\nThere is nothing more I can {{blank}} you.',
    headerHint:   'Pega URL de YouTube + diálogo con {{blank}} donde quieras un hueco.',
    errorNoUrl:      'URL de YouTube inválida',
    errorNoTitle:    'Pon un título para la escena',
    errorNoSource:   'Pon el nombre de la serie/película',
    errorNoDialogue: 'El diálogo está vacío',
    errorNoBlank:    'Agrega al menos un {{blank}} al diálogo',
  },
  song: {
    createTitle:  'Nueva canción con transcript',
    editTitle:    'Editar canción',
    saveCreate:   'Crear Friendlyrics',
    saveEdit:     'Guardar cambios',
    titleLabel:   'Título canción *',
    sourceLabel:  'Artista *',
    dialogueLabel:'Letra (una línea por renglón) *',
    dialoguePlaceholder: 'When I hear that {{blank}}, I remember\nEvery {{blank}} of you and me',
    headerHint:   'Pega URL de YouTube + letra con {{blank}} donde quieras un hueco. Se autogenera el resto del deck CLT.',
    errorNoUrl:      'URL de YouTube inválida',
    errorNoTitle:    'Pon el título de la canción',
    errorNoSource:   'Pon el nombre del artista',
    errorNoDialogue: 'La letra está vacía',
    errorNoBlank:    'Agrega al menos un {{blank}} a la letra',
  },
};

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

// ─── Random blanks picker ─────────────────────────────────────────────
// Preserves punctuation and word boundaries: we tokenise each line into
// [word, gap, word, gap …] segments, choose N word segments at random
// from the "content word" pool (length ≥ 4, not a stopword), replace
// each chosen segment with {{blank}}, and stitch the line back so the
// output text still reads naturally when the teacher previews it.

const STOPWORDS = new Set<string>([
  // English
  'the','and','that','this','with','from','they','have','been','will','were','was','are','not','you','all','can','has','had','been','would','could','should','may','might','must','but','for','out','one','into','your','their','what','when','where','who','why','how','which','than','then','also','some','any','many','much','very','just','only','over','same','such','more','most','other','into','onto','upon','off','down','here','there','about','above','below','under','again','still','ever','never','now','yet','soon','because','while','until','after','before','since','among','though','although','however','therefore','otherwise','even','ourselves','yourself','yourselves','himself','herself','itself','themselves','being','doing','going','coming','saying','getting','making','taking','giving','looking','feeling','thinking','wanting','knowing','seeing',
  // Spanish (in case the transcript is a Spanish translation game)
  'que','con','por','para','del','las','los','una','unas','unos','sus','este','esta','esa','ese','como','pero','sin','sobre','entre','hasta','desde','cuando','donde','porque','aunque','mientras','entonces','tambien','muy','mas','menos','todo','todos','todas','otro','otra','otros','otras','mismo','misma','ellos','ellas','usted','ustedes','nosotros','nosotras','vosotros','vosotras','soy','eres','somos','sois','son','fui','fue','fueron','ser','estar','tener','haber','hacer','decir','poder','ir','ver','dar','saber','querer','poner','venir','llegar','pasar','deber','creer','hablar','llevar','dejar','seguir','encontrar','llamar','pensar','salir','volver','conocer','vivir','sentir','tratar','mirar','contar','empezar','esperar','buscar','existir','entrar','trabajar','escribir','perder','producir','ocurrir','entender','pedir','recibir','recordar','terminar','permitir','aparecer','conseguir','comenzar','servir','sacar','necesitar','mantener','resultar','leer','caer','cambiar','presentar','crear','abrir','considerar','oir','acabar','convertir','ganar','formar','traer','partir','morir','aceptar','realizar','suponer','comprender','lograr','explicar','preguntar','tocar','reconocer','estudiar','alcanzar','nacer','dirigir','correr','utilizar','pagar','ayudar','gustar','jugar','escuchar','cumplir','ofrecer','descubrir','levantar','intentar','usar','decidir','repetir','olvidar','valer','producir','abrir','tomar','venir','estar',
]);

interface Segment { text: string; isWord: boolean }

function tokenise(line: string): Segment[] {
  // Split preserving word / non-word boundaries. Unicode letter class
  // catches accented characters so Spanish tokens survive intact.
  const parts = line.split(/([\p{L}\p{N}']+)/u);
  return parts
    .filter(p => p.length > 0)
    .map(p => ({ text: p, isWord: /^[\p{L}\p{N}'][\p{L}\p{N}']*$/u.test(p) }));
}

function isCandidate(w: string): boolean {
  if (w.length < 4) return false;
  if (STOPWORDS.has(w.toLowerCase())) return false;
  // Skip pure numbers.
  if (/^\d+$/.test(w)) return false;
  return true;
}

// Spread `target` picks across `numLines` and never place blanks on
// adjacent lines. Returns the chosen line indices in reading order.
// When target is larger than what fits with gap ≥ 1, the result is capped.
function pickBlankLines(candidateLines: number[], numLines: number, target: number): number[] {
  if (candidateLines.length === 0 || target <= 0) return [];

  // With gap ≥ 1 between blanked lines, the theoretical max is ceil(N/2).
  const maxWithGap = Math.ceil(numLines / 2);
  const effective  = Math.min(target, maxWithGap, candidateLines.length);

  // Step is the target line spacing (2 = every other line, 3 = every third…).
  const step = Math.max(2, Math.floor(numLines / effective));
  const startOffset = Math.floor(Math.random() * step);

  const candidateSet = new Set(candidateLines);
  const picked = new Set<number>();

  const isFree = (n: number) =>
    n >= 0 && n < numLines &&
    !picked.has(n) && !picked.has(n - 1) && !picked.has(n + 1) &&
    candidateSet.has(n);

  for (let k = 0; k < effective; k++) {
    const ideal = startOffset + k * step;
    let chosen = -1;
    // Search outward from the ideal position until we find a candidate line
    // that respects the gap-1 rule and hasn't been picked yet.
    for (let d = 0; d < numLines && chosen === -1; d++) {
      if (isFree(ideal + d))     chosen = ideal + d;
      else if (d > 0 && isFree(ideal - d)) chosen = ideal - d;
    }
    if (chosen === -1) break;
    picked.add(chosen);
  }

  return [...picked].sort((a, b) => a - b);
}

function pickRandomBlanks(
  text: string, target: number,
): { newText: string; words: string[]; options: string[][]; count: number } {
  const lines = text.split('\n');
  const perLine: Segment[][] = lines.map(l => tokenise(l));

  // Collect candidate words per line.
  const candidatesByLine = new Map<number, { seg: number; word: string }[]>();
  perLine.forEach((segs, i) => {
    const cs: { seg: number; word: string }[] = [];
    segs.forEach((s, j) => {
      if (s.isWord && isCandidate(s.text)) cs.push({ seg: j, word: s.text });
    });
    if (cs.length > 0) candidatesByLine.set(i, cs);
  });

  if (candidatesByLine.size === 0) return { newText: text, words: [], options: [], count: 0 };

  const candidateLines = [...candidatesByLine.keys()].sort((a, b) => a - b);
  const chosenLines = pickBlankLines(candidateLines, lines.length, target);

  // For each chosen line, pick a random candidate word from that line.
  const chosen = chosenLines.map(line => {
    const cs = candidatesByLine.get(line)!;
    const pick = cs[Math.floor(Math.random() * cs.length)];
    return { line, seg: pick.seg, word: pick.word };
  });

  for (const s of chosen) {
    perLine[s.line][s.seg] = { text: '{{blank}}', isWord: false };
  }

  // Build the distractor pool from all candidate words in the script,
  // excluding words already used as correct answers so we don't confuse
  // students by hinting at other blanks' solutions.
  const chosenWordsLower = new Set(chosen.map(c => c.word.toLowerCase()));
  const distractorPool = new Set<string>();
  for (const cs of candidatesByLine.values()) {
    for (const c of cs) {
      if (!chosenWordsLower.has(c.word.toLowerCase())) distractorPool.add(c.word);
    }
  }
  const pool = [...distractorPool];

  const options = chosen.map(c => {
    // Shuffle the pool per blank, take up to 3 distractors, mix with the
    // correct word, shuffle again so the correct isn't in a fixed slot.
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
    return [...shuffled, c.word].sort(() => Math.random() - 0.5);
  });

  const newText = perLine
    .map(segs => segs.map(s => s.text).join(''))
    .join('\n');

  return {
    newText,
    words: chosen.map(s => s.word),
    options,
    count: chosen.length,
  };
}

// ─── Song helpers ──────────────────────────────────────────────────────

// Strip {{blank}} markers so we can send clean lyrics to the AI generator.
function stripBlanks(text: string): string {
  return text.replace(/\{\{blank\}\}/g, '___');
}

// Restore the teacher's blank positions after we know which word goes where.
// The teacher's blanks already have {word, options}, but the raw dialogue
// still needs its {{blank}} markers preserved. This is just an alias for
// clarity when we hand the text to the lyrics_game slide.
function keepBlanks(dialogue: string): string {
  return dialogue;
}

interface AiGeneratedDeck {
  slides: Slide[];
  source?: 'ai' | 'algorithmic';
}

// Generate the 7 surrounding slides for a Friendlyflix® clip lesson. The
// authored dialogue_game + comprehension slides are NEVER sent to the API;
// they get merged back at their canonical positions by the caller.
async function generateFullClipDeck(
  title: string, source: string, dialogueWithBlanks: string, level: LessonLevel,
  clip: ClipData, mode: 'ai' | 'algorithmic',
): Promise<{ slides: Slide[]; error?: string }> {
  try {
    const res = await fetch('/api/clip-lesson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, source,
        dialogue: stripBlanks(dialogueWithBlanks),
        level, clipData: clip, mode,
      }),
    });
    const data = await res.json() as AiGeneratedDeck & { error?: string };
    if (!res.ok) return { slides: [], error: data.error ?? `HTTP ${res.status}` };
    if (!data.slides || data.slides.length === 0) return { slides: [], error: 'Empty deck' };
    return { slides: data.slides };
  } catch (err) {
    return { slides: [], error: err instanceof Error ? err.message : String(err) };
  }
}

async function generateFullSongDeck(
  title: string, artist: string, lyricsWithBlanks: string, level: LessonLevel,
  song: SongData,
): Promise<Slide[] | null> {
  try {
    const res = await fetch('/api/music-lesson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, artist,
        // AI gets clean lyrics without our authoring markers — it may
        // re-insert its own blanks in slide 4, which we overwrite below.
        lyrics: stripBlanks(lyricsWithBlanks),
        level,
        songData: { albumArt: song.albumArt ?? '', youtubeUrl: song.youtubeUrl },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json() as AiGeneratedDeck & { error?: string };
    if (!data.slides || data.slides.length === 0) return null;
    return data.slides;
  } catch {
    return null;
  }
}

// ─── Component ────────────────────────────────────────────────────────

interface Props {
  mode: EditorMode;
  teacherId: string;
  initial?: MovieLesson | MusicLesson;
  onClose: () => void;
}

export default function TranscriptClipEditor({ mode, teacherId, initial, onClose }: Props) {
  const copy = COPY[mode];
  const editing = !!initial;

  // Pull the game slide from the existing lesson if editing. The game slide
  // carries dialogue + blanks + clipData (movies) or lyrics + blanks (songs).
  const initialGameSlide =
    initial?.slides?.find(
      s => s.type === 'clip_dialogue_game' || s.type === 'lyrics_game',
    ) ?? initial?.slides?.[0];
  const initialComprehensionSlide = initial?.slides?.find(s => s.type === 'clip_comprehension');
  const initialBlanks    = initialGameSlide?.blanksData ?? [];
  const initialQuestions = initialComprehensionSlide?.questions ?? [];

  // Movie-mode metadata comes from lesson.clip; song-mode comes from lesson.song.
  const initialClip =
    mode === 'movie'
      ? (initial as MovieLesson | undefined)?.clip
      : undefined;
  const initialSong =
    mode === 'song'
      ? (initial as MusicLesson | undefined)?.song
      : undefined;

  const initialUrl =
    initialClip?.youtubeUrl
    ?? initialSong?.youtubeUrl
    ?? initialGameSlide?.songData?.youtubeUrl
    ?? initialGameSlide?.clipData?.youtubeUrl
    ?? '';
  const initialTitle  = initialClip?.title  ?? initialSong?.title  ?? '';
  const initialSource = initialClip?.source ?? initialSong?.artist ?? '';
  const initialDialogue =
    initialClip?.dialogue
    ?? (initialGameSlide?.type === 'lyrics_game' ? initialGameSlide?.content : undefined)
    ?? initialGameSlide?.content
    ?? '';
  const initialTimings = initialClip?.timings
    ?? initialGameSlide?.clipData?.timings
    ?? [];

  const [level, setLevel]       = useState<LessonLevel>(initial?.level ?? (mode === 'song' ? 'B1' : 'A2'));
  const [url, setUrl]           = useState(initialUrl);
  const [title, setTitle]       = useState(initialTitle);
  const [source, setSource]     = useState(initialSource);
  const [dialogue, setDialogue] = useState(initialDialogue);
  const [timingsRaw, setTimingsRaw] = useState(initialTimings.join(', '));
  const [blanks, setBlanks]     = useState<BlankRow[]>(
    initialBlanks.map(b => ({ word: b.word, options: b.options.join(', ') })),
  );
  const [questions, setQuestions] = useState<QuestionRow[]>(
    initialQuestions.length > 0
      ? initialQuestions.map(q => ({
          question: q.question,
          options: q.options.map(o => o.text),
          correctIdx: q.options.findIndex(o => o.text.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()),
        }))
      : [],
  );
  const [startTime, setStartTime] = useState(initialClip?.startTime?.toString() ?? '');
  const [endTime, setEndTime]     = useState(initialClip?.endTime?.toString() ?? '');
  const [saving, setSaving]       = useState(false);
  const [savingMsg, setSavingMsg] = useState('');
  const [error, setError]         = useState<string | null>(null);
  const [showTranscriptPaste, setShowTranscriptPaste] = useState(false);
  const [randomizeCount, setRandomizeCount] = useState<number>(mode === 'song' ? 8 : 12);

  // Movie-only: full CLT deck generated around the authored dialogue_game +
  // comprehension. Empty until the teacher clicks "Generar con IA" or
  // "Generar por algoritmo". Preserved authored slides slot in at merge time.
  const [generatedDeck, setGeneratedDeck] = useState<Slide[]>(() => {
    if (mode !== 'movie' || !initial?.slides) return [];
    // If editing an existing lesson that already has a full deck, keep the
    // surrounding slides so the teacher can re-save without losing them.
    return initial.slides.filter(
      s => s.type !== 'clip_dialogue_game' && s.type !== 'clip_comprehension',
    );
  });
  const [generating, setGenerating] = useState<null | 'ai' | 'algorithmic'>(null);
  const [generatorInfo, setGeneratorInfo] = useState<string>('');

  const detectedBlanks = (dialogue.match(/\{\{blank\}\}/g) ?? []).length;
  useEffect(() => {
    if (detectedBlanks === blanks.length) return;
    setBlanks(prev => {
      const next: BlankRow[] = [];
      for (let i = 0; i < detectedBlanks; i++) next.push(prev[i] ?? { word: '', options: '' });
      return next;
    });
  }, [detectedBlanks, blanks.length]);

  const numLines = dialogue.split('\n').filter(Boolean).length;
  const timings = timingsRaw.split(',').map(s => parseFloat(s.trim())).filter(n => Number.isFinite(n));
  const timingsValid = timings.length === numLines;

  function applyTranscript(raw: string) {
    const parsed = parseYouTubeTranscript(raw);
    if (parsed.length === 0) {
      setError('No pude leer el transcript. Verifica el formato (MM:SS texto, una línea por entrada).');
      return false;
    }
    setDialogue(parsed.map(l => l.text).join('\n'));
    setTimingsRaw(parsed.map(l => l.time.toFixed(1)).join(', '));
    setBlanks([]);
    setError(null);
    return true;
  }

  function randomizeBlanks(target: number) {
    if (!dialogue.trim()) {
      setError('Primero pega el diálogo o letra.');
      return;
    }
    // If the teacher has non-empty blank words filled in, ask before wiping.
    const hasWork = blanks.some(b => b.word.trim() || b.options.trim());
    if (hasWork && !confirm(
      `Vas a reemplazar los ${blanks.length} blank${blanks.length !== 1 ? 's' : ''} actuales por ${target} nuevos randomizados. ¿Continuar?`,
    )) return;

    // Strip existing {{blank}} markers so the pick is idempotent across
    // clicks. keeps punctuation and whitespace intact.
    const clean = dialogue.replace(/\{\{blank\}\}/g, '___STRIPPED___');
    const picked = pickRandomBlanks(clean, target);
    if (picked.count === 0) {
      setError('No encontré palabras candidatas (>3 letras, no stopwords) para blanquear. Prueba con menos blanks o revisa el texto.');
      return;
    }
    // Restore the stripped markers so any manually authored ones survive the
    // no-candidates case above; here they are just replaced with new picks.
    setDialogue(picked.newText.replace(/___STRIPPED___/g, ''));
    setBlanks(picked.words.map((w, i) => ({
      word: w,
      options: (picked.options[i] ?? [w]).join(', '),
    })));
    if (picked.count < target) {
      setError(`Solo pude colocar ${picked.count} blank${picked.count !== 1 ? 's' : ''} respetando el gap mínimo de 1 línea. Agrega más líneas o baja el target.`);
    } else {
      setError(null);
    }
  }

  // ── Full-deck generation (movie mode only) ───────────────────────────
  async function handleGenerateDeck(genMode: 'ai' | 'algorithmic') {
    setError(null);
    if (mode !== 'movie') return;
    if (!url.trim() || !extractVideoId(url)) { setError(copy.errorNoUrl); return; }
    if (!title.trim())                       { setError(copy.errorNoTitle); return; }
    if (!source.trim())                      { setError(copy.errorNoSource); return; }
    if (!dialogue.trim())                    { setError(copy.errorNoDialogue); return; }

    const clip: ClipData = {
      title: title.trim(),
      source: source.trim(),
      youtubeUrl: url.trim(),
      dialogue: dialogue.trim(),
      timings: timingsValid ? timings : undefined,
      startTime: startTime ? parseFloat(startTime) : undefined,
      endTime:   endTime   ? parseFloat(endTime)   : undefined,
      captionsSource: 'manual',
    };

    setGenerating(genMode);
    setGeneratorInfo('');
    const { slides, error: genErr } = await generateFullClipDeck(
      title.trim(), source.trim(), dialogue.trim(), level, clip, genMode,
    );
    setGenerating(null);

    if (genErr || slides.length === 0) {
      setError(`No se pudo generar el deck (${genMode}): ${genErr ?? 'sin slides'}. ${genMode === 'ai' ? 'Probá con Algoritmo.' : ''}`);
      return;
    }
    setGeneratedDeck(slides);
    setGeneratorInfo(`${genMode === 'ai' ? '✨ IA' : '⚙️ Algoritmo'}: ${slides.length} slides generadas alrededor de tu Dialogue Game + Comprehension.`);
  }

  async function handleSave() {
    setError(null);
    if (!url.trim() || !extractVideoId(url)) { setError(copy.errorNoUrl); return; }
    if (!title.trim())                       { setError(copy.errorNoTitle); return; }
    if (!source.trim())                      { setError(copy.errorNoSource); return; }
    if (!dialogue.trim())                    { setError(copy.errorNoDialogue); return; }
    if (detectedBlanks === 0)                { setError(copy.errorNoBlank); return; }
    for (let i = 0; i < blanks.length; i++) {
      if (!blanks[i].word.trim()) { setError(`Blank #${i+1}: falta la palabra correcta`); return; }
      const opts = blanks[i].options.split(',').map(s => s.trim()).filter(Boolean);
      if (opts.length < 2) { setError(`Blank #${i+1}: necesita al menos 2 opciones`); return; }
    }

    const blanksData: LyricsBlank[] = blanks.map(b => ({
      word: b.word.trim(),
      options: b.options.split(',').map(s => s.trim()).filter(Boolean).slice(0, 4),
    }));

    // ── Movie mode ────────────────────────────────────────────────────
    if (mode === 'movie') {
      const clip: ClipData = {
        title: title.trim(),
        source: source.trim(),
        youtubeUrl: url.trim(),
        dialogue: dialogue.trim(),
        timings: timingsValid ? timings : undefined,
        startTime: startTime ? parseFloat(startTime) : undefined,
        endTime:   endTime   ? parseFloat(endTime)   : undefined,
        captionsSource: 'manual',
      };

      const validQuestions: QuestionRow[] = [];
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.question.trim()) continue;
        const opts = q.options.map(o => o.trim()).filter(Boolean);
        if (opts.length < 2) { setError(`Question #${i+1}: need at least 2 options`); return; }
        if (q.correctIdx < 0 || q.correctIdx >= opts.length) { setError(`Question #${i+1}: pick the correct option`); return; }
        validQuestions.push({ question: q.question.trim(), options: opts, correctIdx: q.correctIdx });
      }

      const gameSlide: Slide = {
        type: 'clip_dialogue_game',
        content: dialogue.trim(),
        blanksData,
        clipData: clip,
      };

      const comprehensionSlide: Slide | null = validQuestions.length > 0
        ? {
            type: 'clip_comprehension',
            title: 'Comprehension',
            questions: validQuestions.map((q, qi) => ({
              question: q.question,
              options: q.options.map((text, oi) => ({ id: `q${qi}o${oi}`, text, isCorrect: oi === q.correctIdx })),
              correctAnswer: q.options[q.correctIdx],
            })),
          }
        : null;

      let slides: Slide[];
      if (generatedDeck.length > 0) {
        // Fresh deck from the AI/algorithmic generator — slot the authored
        // dialogue_game + comprehension between vocab_match and language_focus.
        // The generator emits: [cover, predictions, vocab_match, language_focus,
        // controlled_practice, production, end] — dialogue_game/comprehension
        // never come from the generator, so simply splice at the vocab_match
        // boundary.
        const vocabIdx = generatedDeck.findIndex(s => s.type === 'clip_vocab_match');
        const insertAt = vocabIdx >= 0 ? vocabIdx + 1 : Math.min(3, generatedDeck.length);
        slides = [
          ...generatedDeck.slice(0, insertAt),
          gameSlide,
          ...(comprehensionSlide ? [comprehensionSlide] : []),
          ...generatedDeck.slice(insertAt),
        ];
        // Ensure clipData is on every slide that needs it (in case the AI or
        // algorithm skipped some — the cover/predictions/production want it).
        slides = slides.map(s =>
          s.type === 'clip_cover' || s.type === 'clip_predictions' || s.type === 'clip_production'
            ? { ...s, clipData: clip }
            : s,
        );
      } else if (editing && initial?.slides && initial.slides.length > 0) {
        slides = initial.slides.map(s => {
          if (s.type === 'clip_dialogue_game' || s.type === 'lyrics_game') return gameSlide;
          if (s.type === 'clip_comprehension') return comprehensionSlide ?? s;
          return s;
        });
        if (!initial.slides.some(s => s.type === 'clip_dialogue_game' || s.type === 'lyrics_game')) {
          slides = [gameSlide, ...slides];
        }
        if (comprehensionSlide && !initial.slides.some(s => s.type === 'clip_comprehension')) {
          const gameIdx = slides.findIndex(s => s.type === 'clip_dialogue_game' || s.type === 'lyrics_game');
          slides.splice(gameIdx + 1, 0, comprehensionSlide);
        }
      } else {
        slides = [gameSlide];
        if (comprehensionSlide) slides.push(comprehensionSlide);
      }

      setSaving(true);
      try {
        if (editing && initial?.id) {
          await updateMovieLesson(initial.id, {
            clip,
            level,
            slides,
            title: `${clip.source} – ${clip.title}`,
          });
        } else {
          await createMovieLesson({ teacherId, clip, level, slides });
        }
        onClose();
      } catch (e) {
        setError('Error al guardar: ' + (e instanceof Error ? e.message : String(e)));
      } finally {
        setSaving(false);
      }
      return;
    }

    // ── Song mode ─────────────────────────────────────────────────────
    // Build the SongData + teacher-authored lyrics_game slide, then ask
    // the AI generator to produce the surrounding CLT deck and slot our
    // authored slide in at position 4.
    const song: SongData = {
      title:      title.trim(),
      artist:     source.trim(),
      albumArt:   initialSong?.albumArt ?? '',
      previewUrl: initialSong?.previewUrl,
      youtubeUrl: url.trim(),
      lyrics:     dialogue.trim(),
    };

    // Clip metadata (with timings + start/end) is stored on clipData so the
    // classroom's video sync picks up the exact per-line seconds the teacher
    // pasted from the transcript.
    const lyricsClip: ClipData = {
      title: title.trim(),
      source: source.trim(),
      youtubeUrl: url.trim(),
      dialogue: keepBlanks(dialogue.trim()),
      timings: timingsValid ? timings : undefined,
      startTime: startTime ? parseFloat(startTime) : undefined,
      endTime:   endTime   ? parseFloat(endTime)   : undefined,
      captionsSource: 'manual',
    };

    const lyricsGameSlide: Slide = {
      type: 'lyrics_game',
      title: 'Fill in the Blanks!',
      phase: 'while',
      content: dialogue.trim(),
      blanksData,
      songData: song,
      clipData: lyricsClip,
    };

    setSaving(true);
    setSavingMsg('Generando deck CLT con IA…');
    try {
      const aiSlides = await generateFullSongDeck(title.trim(), source.trim(), dialogue, level, song);

      let slides: Slide[];
      if (editing && initial?.slides && initial.slides.length > 0) {
        // Editing existing music lesson: keep the teacher's deck order and
        // just replace the lyrics_game slot with the new content.
        slides = initial.slides.map(s =>
          s.type === 'lyrics_game' ? lyricsGameSlide : s,
        );
        // If the existing deck didn't have a lyrics_game (edge case), insert it.
        if (!initial.slides.some(s => s.type === 'lyrics_game')) {
          slides.push(lyricsGameSlide);
        }
      } else if (aiSlides) {
        // Creating: use the AI deck and swap in our authored lyrics_game.
        // AI puts lyrics_game at position 4 (index 3) per the prompt.
        const gameIdx = aiSlides.findIndex(s => s.type === 'lyrics_game');
        if (gameIdx >= 0) {
          slides = aiSlides.map((s, i) => (i === gameIdx ? lyricsGameSlide : s));
        } else {
          // AI didn't emit a lyrics_game — append ours between vocab and quiz.
          slides = [...aiSlides, lyricsGameSlide];
        }
      } else {
        // AI unavailable: fall back to a minimal 2-slide deck.
        slides = [
          {
            type: 'song_cover',
            title: `${title.trim()} – ${source.trim()}`,
            subtitle: "Let's learn English through music!",
            phase: 'pre',
            songData: song,
          },
          lyricsGameSlide,
        ];
      }

      // Ensure every song-data-carrying slide has the enriched song object.
      const SONG_DATA_TYPES = new Set(['lyrics', 'song_cover', 'lyrics_game', 'translation_game', 'friendlyrics_end']);
      slides = slides.map(s =>
        SONG_DATA_TYPES.has(s.type) ? { ...s, songData: song } : s,
      );

      setSavingMsg('Guardando lección…');
      if (editing && initial?.id) {
        await updateMusicLesson(initial.id, {
          song,
          level,
          slides,
          title: `${song.artist} – ${song.title}`,
        });
      } else {
        await createMusicLesson({ teacherId, song, level, slides });
      }
      onClose();
    } catch (e) {
      setError('Error al guardar: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSaving(false);
      setSavingMsg('');
    }
  }

  const accentGradient = mode === 'song'
    ? 'from-[#EC4899] to-[#F472B6]'
    : 'from-[#E50914] to-[#FF6B6B]';
  const accentText = mode === 'song' ? '#EC4899' : '#E50914';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh]">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#5A3D7A]">{editing ? copy.editTitle : copy.createTitle}</h2>
            <p className="text-xs text-gray-400">{copy.headerHint}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <div className="overflow-y-auto p-5 flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left col: metadata + dialogue/lyrics */}
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">URL de YouTube *</label>
              <input
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8] font-mono"
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <button
                  onClick={() => setShowTranscriptPaste(true)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full bg-opacity-10 border`}
                  style={{ color: accentText, background: `${accentText}15`, borderColor: `${accentText}55` }}
                >
                  📋 Pegar transcript de YouTube
                </button>
                {url && extractVideoId(url) && (
                  <a
                    href={`https://www.youtube.com/watch?v=${extractVideoId(url)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-gray-500 hover:underline"
                  >
                    Abrir en YouTube ↗
                  </a>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">{copy.titleLabel}</label>
                <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8]" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">{copy.sourceLabel}</label>
                <input value={source} onChange={e => setSource(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8]" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Nivel</label>
                <select value={level} onChange={e => setLevel(e.target.value as LessonLevel)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8]">
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Start (s)</label>
                <input value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8] font-mono" placeholder="opcional" />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">End (s)</label>
                <input value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8] font-mono" placeholder="opcional" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">{copy.dialogueLabel}</label>
              <textarea
                value={dialogue}
                onChange={e => setDialogue(e.target.value)}
                rows={7}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8] font-mono"
                placeholder={copy.dialoguePlaceholder}
              />
              <p className="text-[10px] text-gray-400 mt-1">{numLines} línea{numLines !== 1 && 's'} · {detectedBlanks} blank{detectedBlanks !== 1 && 's'} detectado{detectedBlanks !== 1 && 's'}</p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Timings por línea (segundos, separados por coma) {timingsValid ? <span className="text-green-600">✓</span> : timings.length > 0 && <span className="text-amber-500">(no calzan — se interpolarán)</span>}
              </label>
              <input
                value={timingsRaw}
                onChange={e => setTimingsRaw(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8] font-mono"
                placeholder="2.0, 6.5, 11.2, 15.0"
              />
              <p className="text-[10px] text-gray-400 mt-1">Tip: pega el transcript de YouTube para llenar timings exactos automáticamente.</p>
            </div>
          </div>

          {/* Right col: blanks editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Blanks ({detectedBlanks})
              </label>
              <div
                className="flex items-center gap-1.5 bg-gradient-to-r from-white to-[#F0E5FF]/40 border border-[#E0D5FF] rounded-full pl-2 pr-1 py-0.5 shadow-sm"
                title="Elige N palabras al azar del diálogo y márcalas como blanks. Se saltan stopwords y palabras cortas."
              >
                <span className="text-[10px] font-bold text-[#5A3D7A]/70 whitespace-nowrap">🎲 Auto</span>
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={randomizeCount}
                  onChange={e => setRandomizeCount(Math.max(1, Math.min(40, parseInt(e.target.value, 10) || 1)))}
                  className="w-10 px-1 py-0.5 text-xs font-bold text-center bg-transparent focus:outline-none text-[#5A3D7A]"
                />
                <button
                  type="button"
                  onClick={() => randomizeBlanks(randomizeCount)}
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-[#5A3D7A] to-[#7B5EA7] text-white hover:opacity-90 active:scale-95"
                >
                  Randomizar
                </button>
              </div>
            </div>
            {blanks.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Agrega <code className="bg-gray-100 px-1 rounded">{`{{blank}}`}</code> {mode === 'song' ? 'a la letra' : 'al diálogo'} para que aparezcan aquí — o usa <span className="font-semibold text-[#5A3D7A]">🎲 Auto</span> para autogenerar.</p>
            ) : blanks.map((b, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-2 bg-gray-50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-gray-400">#{i + 1}</span>
                  <input
                    value={b.word}
                    onChange={e => setBlanks(prev => prev.map((p, idx) => idx === i ? { ...p, word: e.target.value } : p))}
                    placeholder="Palabra correcta"
                    className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#9B7CB8] font-semibold bg-white"
                  />
                </div>
                <input
                  value={b.options}
                  onChange={e => setBlanks(prev => prev.map((p, idx) => idx === i ? { ...p, options: e.target.value } : p))}
                  placeholder="opción1, opción2, opción3, opción4 (la correcta debe estar incluida)"
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#9B7CB8] bg-white"
                />
              </div>
            ))}
          </div>

          {/* Comprehension questions — movie mode only */}
          {mode === 'movie' && (
            <div className="md:col-span-2 border-t border-gray-100 pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Comprehension questions ({questions.length}) · opcional
                  </label>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Aparecerán como una slide aparte después del juego. Recomendado: 3-6 preguntas (sin límite máximo).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setQuestions(prev => [...prev, { question: '', options: ['', '', '', ''], correctIdx: 0 }])}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#E50914]/10 text-[#E50914] hover:bg-[#E50914]/20 border border-[#E50914]/30"
                >
                  + Add question
                </button>
              </div>

              {questions.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Deja vacío para que la lección termine en el juego de blanks.</p>
              ) : questions.map((q, qi) => (
                <div key={qi} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-[10px] font-bold text-gray-400 mt-2">#{qi + 1}</span>
                    <textarea
                      value={q.question}
                      onChange={e => setQuestions(prev => prev.map((p, idx) => idx === qi ? { ...p, question: e.target.value } : p))}
                      placeholder="Question text — e.g. What was Pain's main motivation?"
                      rows={2}
                      className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#E50914] bg-white resize-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQuestions(prev => prev.filter((_, idx) => idx !== qi))}
                      className="text-[11px] text-gray-400 hover:text-red-500 mt-1"
                      title="Eliminar pregunta"
                    >
                      🗑
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pl-5">
                    {q.options.map((opt, oi) => (
                      <label key={oi} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border cursor-pointer transition-colors ${
                        q.correctIdx === oi ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name={`q${qi}-correct`}
                          checked={q.correctIdx === oi}
                          onChange={() => setQuestions(prev => prev.map((p, idx) => idx === qi ? { ...p, correctIdx: oi } : p))}
                          className="accent-green-600 w-3 h-3"
                        />
                        <input
                          value={opt}
                          onChange={e => setQuestions(prev => prev.map((p, idx) => idx === qi ? { ...p, options: p.options.map((o, oj) => oj === oi ? e.target.value : o) } : p))}
                          placeholder={`Option ${oi + 1}`}
                          className="flex-1 px-1 py-0.5 text-xs bg-transparent focus:outline-none"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Movie mode: full CLT deck generation controls */}
          {mode === 'movie' && (
            <div className="md:col-span-2 border-t border-gray-100 pt-4">
              <div className="rounded-xl p-3 border border-red-100 bg-gradient-to-r from-red-50 to-white">
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-xs text-[#E50914] font-semibold mb-0.5">🎬 Generar Full Deck CLT</p>
                    <p className="text-[11px] text-red-600/70 leading-relaxed">
                      Crea las 7 slides alrededor (cover, predictions, vocab, language focus,
                      controlled practice, production, end). Tu <code className="bg-red-100 px-1 rounded">dialogue_game</code> y <code className="bg-red-100 px-1 rounded">comprehension</code> quedan intactas.
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleGenerateDeck('ai')}
                      disabled={generating !== null || saving}
                      className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-gradient-to-r from-[#E50914] to-[#FF6B6B] text-white disabled:opacity-50 shadow-sm"
                    >
                      {generating === 'ai' ? '⏳ Generando…' : '✨ Con IA'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateDeck('algorithmic')}
                      disabled={generating !== null || saving}
                      className="text-[11px] font-bold px-3 py-1.5 rounded-full border border-[#E50914] text-[#E50914] hover:bg-red-50 disabled:opacity-50"
                    >
                      {generating === 'algorithmic' ? '⏳ Generando…' : '⚙️ Por algoritmo'}
                    </button>
                  </div>
                </div>
                {generatorInfo && (
                  <p className="text-[11px] text-green-700 bg-green-50 border border-green-100 rounded px-2 py-1">
                    {generatorInfo}
                  </p>
                )}
                {generatedDeck.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {generatedDeck.map((s, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-red-100 text-red-700"
                        title={s.title ?? s.type}
                      >
                        {s.type.replace('clip_', '').replace('friendlyflix_', '')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Song mode: info banner about auto-generated deck */}
          {mode === 'song' && (
            <div className="md:col-span-2 border-t border-gray-100 pt-4">
              <div className="rounded-xl p-3 border border-pink-100 bg-gradient-to-r from-pink-50 to-white">
                <p className="text-xs text-pink-700 font-semibold mb-0.5">✨ Auto-generación del deck CLT</p>
                <p className="text-[11px] text-pink-600/80 leading-relaxed">
                  Al guardar se genera automáticamente: song cover, vocab match, predictions,
                  listening quiz, language focus &amp; practice, translation game, wrap-up y end.
                  Tu <code className="bg-pink-100 px-1 rounded">lyrics_game</code> con blanks y timings
                  reemplaza el generado por la IA.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="md:col-span-2 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} disabled={saving} className="flex-1 py-2.5 border border-gray-200 rounded-full text-sm font-semibold text-gray-500 hover:bg-gray-50 disabled:opacity-50">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex-1 py-2.5 bg-gradient-to-r ${accentGradient} text-white rounded-full text-sm font-bold disabled:opacity-50 shadow-lg`}
          >
            {saving ? (savingMsg || 'Guardando…') : editing ? copy.saveEdit : copy.saveCreate}
          </button>
        </div>
      </div>

      {showTranscriptPaste && (
        <TranscriptPasteModal
          accentGradient={accentGradient}
          onApply={(raw) => {
            if (applyTranscript(raw)) setShowTranscriptPaste(false);
          }}
          onClose={() => setShowTranscriptPaste(false)}
        />
      )}
    </div>
  );
}

// ─── Transcript paste sub-modal ────────────────────────────────────────

function TranscriptPasteModal({
  accentGradient, onApply, onClose,
}: {
  accentGradient: string;
  onApply: (raw: string) => void;
  onClose: () => void;
}) {
  const [raw, setRaw] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[88vh]">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-bold text-[#5A3D7A] text-base mb-1">Pegar transcript de YouTube</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            En YouTube: <strong>… (3 puntos del video) → &ldquo;Mostrar transcripción&rdquo;</strong> → selecciona todo el panel y copia. Pega aquí abajo.
          </p>
        </div>
        <div className="p-5 flex-1 overflow-y-auto">
          <textarea
            value={raw}
            onChange={e => setRaw(e.target.value)}
            rows={12}
            placeholder={'0:00\nHello and welcome to this video\n0:05\nLet me show you something amazing\n0:11\nIt is called...'}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-[#9B7CB8]"
          />
          <p className="text-[11px] text-gray-400 mt-2">
            Acepta formatos: <code className="bg-gray-100 px-1 rounded">MM:SS</code> seguido del texto (mismo o siguiente renglón), <code className="bg-gray-100 px-1 rounded">H:MM:SS</code> también funciona, y <code className="bg-gray-100 px-1 rounded">[MM:SS]</code> con corchetes.
          </p>
        </div>
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-full text-sm font-semibold text-gray-500 hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={() => onApply(raw)}
            disabled={!raw.trim()}
            className={`flex-1 py-2.5 bg-gradient-to-r ${accentGradient} text-white rounded-full text-sm font-bold shadow disabled:opacity-50`}
          >
            Aplicar transcript
          </button>
        </div>
      </div>
    </div>
  );
}
