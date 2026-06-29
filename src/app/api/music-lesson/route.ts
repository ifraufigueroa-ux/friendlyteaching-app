// FriendlyTeaching.cl — Music Lesson Generator (10-slide Friendlyrics® format)
// Strategy: try Claude AI first → fall back to algorithmic generator if unavailable.
import { NextRequest, NextResponse } from 'next/server';
import { generateMusicLessonAlgorithmically } from '@/lib/utils/musicLessonGenerator';
import type { Slide, LessonLevel } from '@/types/firebase';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? '';
const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6';

export interface MusicLessonRequest {
  title: string;
  artist: string;
  lyrics: string;
  level: LessonLevel;
  songData?: { albumArt: string; previewUrl?: string; youtubeUrl?: string };
}

const SYSTEM_PROMPT = `You are an expert English teacher creating Friendlyrics® music-based lessons. Generate exactly 10 slides in this order:

SLIDE 1 — type: "song_cover"
{ type, title: "{Title} by {Artist}", subtitle: "Let's learn English through music!", phase: "pre" }

SLIDE 2 — type: "vocab_match"
{ type, title: "Key Vocabulary", phase: "pre", words: [ {word, translation: "English definition (NOT Spanish)", pronunciation: "/ˈIPA/", example: "line from song"} ] }
Pick 6-8 meaningful words from the lyrics, adapted to the CEFR level.

SLIDE 3 — type: "predictions"
{ type, title: "Before You Listen...", phase: "pre", prompt: "engaging question about the song theme", content: "3 bullet points (use \\n• ) with guiding questions" }

SLIDE 4 — type: "lyrics_game"
{ type, title: "Fill in the Blanks!", phase: "while",
  content: "Take the FULL lyrics. Replace 7-9 content words with {{blank}} — spread across different lines/verses.",
  blanksData: [ {word: "exact word replaced", options: ["correct_word", "distractor1", "distractor2", "distractor3"]} ]
  Note: blanksData items must match {{blank}} positions in content, in order.
  Options must always contain the correct word mixed with 3 plausible distractors from the song.
}

SLIDE 5 — type: "listening_quiz"
{ type, title: "Comprehension Check", phase: "while",
  questions: [
    { question: "...", options: [{id:"a",text:"...",isCorrect:false},{id:"b",text:"...",isCorrect:true},{id:"c",text:"...",isCorrect:false},{id:"d",text:"...",isCorrect:false}], correctAnswer: "the correct option text" },
    ... 4 questions total ...
  ]
}

SLIDE 6 — type: "language_focus"
{ type, title: "Language Focus: [a specific structure ACTUALLY PRESENT in the lyrics — e.g. 'Past simple', 'Phrasal verbs', 'First conditional', 'Present perfect', 'Idioms']", phase: "while",
  content: "Clear explanation paragraph of that structure for the given CEFR level. 3-5 sentences. Tie the explanation to how the song uses it.",
  words: [ {word: "exact substring from the lyrics that exemplifies the structure (NOT a generic word, NOT a stopword)", translation: "the structure label, same as in the title (e.g. 'Past simple', 'Phrasal verb')", example: "the COMPLETE lyric line VERBATIM from the lyrics provided — do not paraphrase or invent"} ] — 2-4 items
}
HARD RULES for slide 6:
- The chosen topic MUST be observable in the provided lyrics. If you cannot find 2+ real lines that use the structure, pick a different topic that you CAN find.
- Each "example" must be COPIED VERBATIM from the lyrics block above. Never fabricate sentences.
- The grammar depth must match CEFR: A0/A1 → contractions, subject pronouns, simple present; A2 → present continuous, going-to, was/were; B1 → past simple, modals, past continuous; B1+ → conditionals, used to, present perfect; B2 → phrasal verbs, perfect tenses, modals of speculation; C1 → idioms, metaphors, inversion, advanced collocations.

SLIDE 7 — type: "language_practice"
{ type, title: "Let's Practice!", phase: "while",
  content: "short instruction",
  practiceItems: [
    { type: "unscramble", prompt: "word1 / word2 / word3 / word4 / word5", answer: "The correct sentence" },
    { type: "match_halves", prompt: "First half of a lyric line", answer: "Correct second half", options: ["Correct second half", "wrong1", "wrong2", "wrong3"] },
    { type: "unscramble", prompt: "another / scrambled / sentence", answer: "Another correct sentence" },
    { type: "match_halves", prompt: "Another lyric first half", answer: "Correct continuation", options: ["Correct continuation", "wrong1", "wrong2", "wrong3"] }
  ]
}

SLIDE 8 — type: "translation_game"
{ type, title: "Translate It!", phase: "post",
  translationText: "The ENGLISH original text (chorus or hook — 4-8 lines)",
  content: "La TRADUCCIÓN ESPAÑOLA del mismo texto. Replace 5-7 key Spanish words with {{blank}}. The blanks replace common but meaningful words.",
  blanksData: [ {word: "palabra_española_reemplazada", options: ["correcta", "opcion2", "opcion3", "opcion4"]} ]
  Note: all options must be in Spanish. Options include correct + 3 plausible Spanish distractors.
}

SLIDE 9 — type: "wrapup"
{ type, title: "Wrap Up", phase: "post",
  prompt: "Discussion question connecting song to student's real life",
  content: "3-4 reflection points using \\n→ prefix"
}

SLIDE 10 — type: "friendlyrics_end"
{ type, title: "¡Lección completada!", phase: "post" }

RULES:
- Adapt vocabulary complexity, grammar focus, and question difficulty to the CEFR level.
- For lyrics_game and translation_game: blanksData items must appear in the SAME ORDER as {{blank}} markers in content.
- For unscramble: separate words with " / " (space-slash-space).
- Return ONLY valid JSON: { "slides": [...] } — no markdown, no explanation.
- All 10 slides must be present.`;

async function generateWithAI(title: string, artist: string, lyrics: string, level: LessonLevel): Promise<Slide[] | null> {
  if (!ANTHROPIC_API_KEY) return null;

  const userPrompt = `Song: "${title}" by ${artist}\nLevel: ${level}\n\nLyrics:\n${lyrics.slice(0, 3000)}\n\nGenerate the 10-slide Friendlyrics® lesson JSON now.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 6000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const text: string = data?.content?.[0]?.text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed: { slides: Slide[] } = JSON.parse(jsonMatch[0]);
    return parsed.slides.map((s, i) => ({ phase: 'pre' as const, ...s, id: `ai-slide-${i}` }));
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  let body: MusicLessonRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { title, artist, lyrics, level, songData } = body;
  if (!title || !artist || !lyrics) {
    return NextResponse.json({ error: 'title, artist and lyrics required' }, { status: 400 });
  }

  const aiSlides = await generateWithAI(title, artist, lyrics, level);
  if (aiSlides) {
    return NextResponse.json({ slides: aiSlides, source: 'ai' });
  }

  try {
    const slides = await generateMusicLessonAlgorithmically(
      title,
      artist,
      lyrics,
      level,
      songData ?? { albumArt: '' },
    );
    return NextResponse.json({ slides, source: 'algorithmic' });
  } catch (err) {
    console.error('[music-lesson] Algorithmic generation failed:', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
