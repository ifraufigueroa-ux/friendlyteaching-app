// FriendlyTeaching.cl — Friendlyflix® CLT Clip Deck Generator
//
// Generates the 7 surrounding slides that wrap a teacher-authored
// clip_dialogue_game + clip_comprehension pair. The two authored slides
// are NEVER touched here — the editor merges them back at their canonical
// positions (4 and 5) after calling this endpoint.
//
// Two modes:
//   · POST { mode: 'ai' }          → Claude Sonnet, structured prompt below.
//   · POST { mode: 'algorithmic' } → local generator, no external API needed.
//
// Response: { slides: Slide[], source: 'ai' | 'algorithmic' }
//   slides ordered: [cover, predictions, vocab_match,
//                    language_focus, controlled_practice, production, end]
//   The editor slots authored dialogue_game+comprehension between positions
//   2 and 3 of this array (i.e. between vocab_match and language_focus).

import { NextRequest, NextResponse } from 'next/server';
import { generateClipLessonAlgorithmically } from '@/lib/utils/clipLessonGenerator';
import type { Slide, LessonLevel, ClipData } from '@/types/firebase';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? '';
const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6';

export interface ClipLessonRequest {
  title:    string;             // scene title
  source:   string;             // series/movie
  dialogue: string;             // authored dialogue (with {{blank}} markers OK — stripped for AI)
  level:    LessonLevel;
  clipData: ClipData;           // full clip metadata (youtubeUrl, timings, times)
  mode:     'ai' | 'algorithmic';
}

const SYSTEM_PROMPT = `You are an expert English teacher creating Friendlyflix® CLT lessons around a short clip from a series or film. Generate EXACTLY 7 slides in this order, wrapping around a teacher-authored dialogue-fill game and a comprehension quiz that the runtime will slot in between positions 3 and 4. Do NOT emit those two — only the 7 surrounding slides.

SLIDE 1 — type: "clip_cover"
{ type, title: "{SceneTitle}", subtitle: "{Series/Movie}", content: "{LEVEL}", phase: "pre" }
- title is the scene title verbatim.
- subtitle is the series or movie name.
- content is the CEFR level string (A1/A2/B1/…) — used as a small badge in the cover.

SLIDE 2 — type: "clip_predictions"
{ type, title: "Before you watch", phase: "pre",
  prompt: "One hook question that pushes the student to IMAGINE what happens in the scene BEFORE watching. Never yes/no.",
  content: "Exactly 3 bullets separated by \\n• — one from EACH category below, in order:
    1. IMAGINATIVE PREDICTION from title + series — e.g. 'Imagine the moment before this scene starts. Who is in the room and what just happened?'
    2. PRIOR EXPERIENCE — e.g. 'Tell us about a scene from {Series/Movie} (or a similar show) that made you feel tense.'
    3. PERSONAL BRIDGE — e.g. 'Describe a moment in your own life when you had to say something difficult to someone.'"
}
HARD RULES for slide 2:
- Every bullet must OPEN with Imagine / Describe / Tell us / Picture / Why / How / What — never Do you / Is it / Have you.
- Bullets must be answerable in 2+ sentences of English (production-first).
- Weave the scene title and/or series name into at least 2 bullets so it never feels generic.
- Adapt vocabulary to the CEFR level.
- Never reveal what happens in the dialogue — the student has NOT watched yet.

SLIDE 3 — type: "clip_vocab_match"
{ type, title: "Key vocabulary", phase: "pre",
  words: [ { word, translation: "English definition (6-14 words, NOT Spanish)", pronunciation: "/ˈIPA/", example: "the actual line from the dialogue that contains this word" } ]
}
HARD RULES for slide 3:
- Word count by CEFR: A0/A1 → 5, A2 → 6, B1 → 6-7, B1+/B2 → 7-8, C1 → 8.
- Pick GATEKEEPER words — the ones the student will miss the meaning of the scene without. Not the "hardest" words, the load-bearing ones.
- Content words only: nouns, verbs, adjectives, adverbs, common phrasal verbs. Skip pronouns, articles, prepositions.
- Skip words most students already know at the target level (see CEFR ladders you would use for song lessons).
- translation: student-facing English definition, 6-14 words, plain language. Never Spanish. No dictionary jargon.
- pronunciation: IPA phonemic form. If unsure, omit rather than invent.
- example: the ACTUAL line from the DIALOGUE where the word appears, COPIED VERBATIM (no paraphrase). If the word appears in multiple lines, pick the most dramatic one.

SLIDE 4 — type: "clip_language_focus"
{ type, title: "Language focus: {structure name}", phase: "while",
  content: "intro paragraph explaining the structure in 2 short sentences\\n• bullet with mini-rule 1\\n• bullet with mini-rule 2\\n• bullet with mini-rule 3\\noutro one-line takeaway that ties the structure back to the scene",
  words: [ { word: "the target chunk (e.g. 'was going to')", translation: "when to use it — 6-12 words", example: "the actual dialogue line where it appears, verbatim" } ]
}
HARD RULES for slide 4:
- Pick ONE grammar structure or lexical chunk that appears clearly in the dialogue: verb tense (past simple vs past continuous), a modal, a phrasal verb pattern, reported speech, conditionals, chunks like "have to / used to / going to". Do not invent a structure that isn't in the dialogue.
- 3 bullets in the content, each starting with • and covering a distinct mini-rule (form / meaning / use).
- words array has 2-4 examples pulled VERBATIM from the dialogue.
- Adapt the structure difficulty to the CEFR level (A2 → past simple, B1 → present perfect vs past simple, B1+/B2 → conditionals, C1 → subjunctive/inversion).

SLIDE 5 — type: "clip_controlled_practice"
{ type, title: "Controlled practice", subtitle: "{grammar focus name}", phase: "post",
  practiceItems: [
    { type: "unscramble", prompt: "words / separated / by / slashes", answer: "The whole sentence in correct order.", grammarTopic: "{focus}", contextLine: "line from dialogue this drills" },
    { type: "match_halves", prompt: "First half of sentence", answer: "second half", options: ["second half (correct)", "distractor 1", "distractor 2", "distractor 3"], grammarTopic: "{focus}" },
    { type: "verb_form", prompt: "Sentence with (verb) blank.", answer: "correct verb form", options: ["correct form", "distractor 1", "distractor 2", "distractor 3"], grammarTopic: "{focus}" },
    { type: "error_correction", prompt: "Correct the mistake.", wrongText: "Sentence with a wrong tense/agreement/word form.", answer: "The corrected sentence.", grammarTopic: "{focus}" }
  ]
}
HARD RULES for slide 5:
- EXACTLY 4 items — one of each type: unscramble, match_halves, verb_form, error_correction.
- Every item drills the SAME grammar structure as slide 4.
- Item content must be tied to the dialogue's scene / setting when possible — use the same characters, place, action.
- unscramble: split the correct sentence by " / " (space-slash-space). Do NOT change casing or punctuation.
- match_halves: split the sentence at (or near) the halfway word. options MUST contain 4 second-halves — the correct one plus 3 plausible wrong-second-halves from different sentence stems.
- verb_form: options are 4 verb forms (correct + 3 distractors that are plausible wrong tenses/forms of the same verb).
- error_correction: wrongText contains the sentence WITH the error; answer is the corrected version.
- Adapt sentence length to the CEFR level (A2 → 6-8 words, B1 → 8-11 words, B2+ → 10-14 words).

SLIDE 6 — type: "clip_production"
{ type, title: "Over to you", phase: "post",
  prompt: "One hook question that pulls the student BACK to their own life or opinion after watching the scene. Push production.",
  content: "Exactly 3 bullets separated by \\n• — one from EACH category below, in order:
    1. FELT MOMENT in the scene — e.g. 'Describe the exact moment in the scene that made you feel most tense. What was said and how was it said?'
    2. PREDICTION vs. REALITY — e.g. 'Compare your prediction from before you watched with what actually happened. Where were you right? Where did the scene surprise you?'
    3. CARRY-FORWARD — one phrase or line from the dialogue to use in the student's own English — e.g. 'Pick one line from the dialogue you want to remember. Say it out loud and explain when you might use it.'"
}
HARD RULES for slide 6:
- POST-viewing, so the student CAN reference specific lines / characters / moments — use that.
- No yes/no stems. Open triggers only (Describe / Tell / Compare / Pick / Why / How).
- One bullet MUST tie back to the predictions from slide 2.
- One bullet MUST push the student to reuse language from the dialogue in their own speech.
- Adapt vocabulary of the bullets to the CEFR level, weave the scene title into at least one bullet.

SLIDE 7 — type: "friendlyflix_end"
{ type, title: "¡Lección completada!", phase: "post" }

GLOBAL RULES:
- Adapt vocabulary complexity to the CEFR level throughout.
- Every "example" and "contextLine" you cite MUST appear character-for-character in the dialogue you were given. NEVER invent lines.
- Return ONLY valid JSON: { "slides": [...] } — no markdown fences, no explanation.
- Exactly 7 slides, in the order listed above.`;

async function generateWithAI(
  title: string,
  source: string,
  dialogue: string,
  level: LessonLevel,
): Promise<Slide[] | null> {
  if (!ANTHROPIC_API_KEY) return null;

  const userPrompt = `Scene: "${title}" from ${source}\nLevel: ${level}\n\nDialogue (verbatim, one line per row — {{blank}} markers stripped for you):\n${dialogue.slice(0, 3000)}\n\nGenerate the 7-slide CLT deck JSON now (cover, predictions, vocab_match, language_focus, controlled_practice, production, end). Do NOT emit the dialogue_game or comprehension slides — those come from the teacher.`;

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
        max_tokens: 5000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      console.error('[clip-lesson] AI response not ok:', response.status);
      return null;
    }

    const data = await response.json();
    const text: string = data?.content?.[0]?.text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed: { slides: Slide[] } = JSON.parse(jsonMatch[0]);
    return parsed.slides.map((s, i) => ({ phase: 'pre' as const, ...s, id: `clip-ai-${i}` }));
  } catch (err) {
    console.error('[clip-lesson] AI generation failed:', err);
    return null;
  }
}

function stripBlanks(text: string): string {
  // Replace the authoring markers with a neutral placeholder so the AI still
  // sees complete-looking sentence structure without treating {{blank}} as a
  // grammar hint.
  return text.replace(/\{\{blank\}\}/g, '____');
}

export async function POST(req: NextRequest) {
  let body: ClipLessonRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { title, source, dialogue, level, clipData, mode } = body;
  if (!title || !source || !dialogue || !level || !clipData) {
    return NextResponse.json({ error: 'title, source, dialogue, level, clipData required' }, { status: 400 });
  }
  if (mode !== 'ai' && mode !== 'algorithmic') {
    return NextResponse.json({ error: 'mode must be "ai" or "algorithmic"' }, { status: 400 });
  }

  const cleanDialogue = stripBlanks(dialogue);

  if (mode === 'ai') {
    const aiSlides = await generateWithAI(title, source, cleanDialogue, level);
    if (!aiSlides) {
      return NextResponse.json(
        { error: 'AI generation unavailable — check ANTHROPIC_API_KEY or try algorithmic mode.' },
        { status: 502 },
      );
    }
    // Bolt the clipData onto every slide that renders the video/context.
    const withClip = aiSlides.map((s) =>
      s.type === 'clip_cover' || s.type === 'clip_predictions' || s.type === 'clip_production'
        ? { ...s, clipData }
        : s,
    );
    return NextResponse.json({ slides: withClip, source: 'ai' });
  }

  try {
    const slides = await generateClipLessonAlgorithmically(
      title, source, cleanDialogue, level, clipData,
    );
    return NextResponse.json({ slides, source: 'algorithmic' });
  } catch (err) {
    console.error('[clip-lesson] Algorithmic generation failed:', err);
    return NextResponse.json({ error: 'Algorithmic generation failed' }, { status: 500 });
  }
}
