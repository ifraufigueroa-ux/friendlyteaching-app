// FriendlyTeaching.cl — Friendlyflix® CLT Clip Deck Generator
//
// Generates the 8 surrounding slides that wrap a teacher-authored
// clip_dialogue_game. The dialogue_game is teacher-authored and never
// touched here — the editor splices it in right after predictions.
// The comprehension slide is now generated too (default questions from
// the dialogue); the editor overrides it with the teacher's own if the
// teacher wrote custom questions.
//
// Two modes:
//   · POST { mode: 'ai' }          → Claude Sonnet, structured prompt below.
//   · POST { mode: 'algorithmic' } → local generator, no external API needed.
//
// Response: { slides: Slide[], source: 'ai' | 'algorithmic' }
//   slides ordered: [cover, vocab_match, predictions, comprehension,
//                    language_focus, controlled_practice, production, end]
//   The editor slots the authored dialogue_game between predictions and
//   comprehension.

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

const SYSTEM_PROMPT = `You are an expert English teacher creating Friendlyflix® CLT lessons around a short clip from a series or film. Generate EXACTLY 8 slides in this order, wrapping around a teacher-authored dialogue-fill game that the runtime will slot in right after Predictions. Do NOT emit that dialogue_game — only the 8 slides listed here.

SLIDE 1 — type: "clip_cover"
{ type, title: "{SceneTitle}", subtitle: "{Series/Movie}", content: "{LEVEL}", phase: "pre" }
- title is the scene title verbatim.
- subtitle is the series or movie name.
- content is the CEFR level string (A1/A2/B1/…) — used as a small badge in the cover.

SLIDE 2 — type: "clip_vocab_match"
{ type, title: "Key vocabulary", phase: "pre",
  words: [ { word, translation: "English definition (6-14 words, NOT Spanish)", pronunciation: "/ˈIPA/", example: "the actual line from the dialogue that contains this word" } ]
}
HARD RULES for slide 2:
- Word count by CEFR: A0/A1 → 5, A2 → 6, B1 → 6-7, B1+/B2 → 7-8, C1 → 8.
- Pick GATEKEEPER words — the ones the student will miss the meaning of the scene without. Not the "hardest" words, the load-bearing ones.
- Content words only: nouns, verbs, adjectives, adverbs, common phrasal verbs. Skip pronouns, articles, prepositions.
- Skip words most students already know at the target level.
- translation: student-facing English definition, 6-14 words, plain language. Never Spanish. No dictionary jargon.
- pronunciation: IPA phonemic form. If unsure, omit rather than invent.
- example: the ACTUAL line from the DIALOGUE where the word appears, COPIED VERBATIM (no paraphrase).

SLIDE 3 — type: "clip_predictions"
{ type, title: "Before you watch", phase: "pre",
  prompt: "A short hook (≤ 14 words) inviting the student to imagine the scene before watching. Open with a verb, never yes/no.",
  content: "Exactly 3 bullets separated by \\n• — each in the format \"Label — Question\". The label is 2-4 words in Title Case; the question is ≤ 12 words:
    1. THE SETUP — imagine what happens right before the scene starts.
    2. THE MOOD / A KEY DETAIL — tension? humor? one visual element?
    3. A PERSONAL BRIDGE — connect the scene's situation to the student's own life.
  Example bullet lines:
    • The Setup — What just happened before this scene?
    • The Mood — Tense, funny, or something quieter?
    • Been There? — Have you lived a moment like this?"
}
HARD RULES for slide 3:
- Each bullet uses the "Label — Question" format with an em dash. Question ≤ 12 words after the em dash.
- The label is a punchy 2-4 word tag (Title Case), NOT the question itself.
- LABELS MUST BE BESPOKE to this specific scene. Do NOT ship the generic
  triple "The Setup / The Mood / Been There?" — pick tags that reflect
  the scene's flavour. Examples:
    · AI / tech piece      → The Prediction / The Angle / Your Take
    · News / documentary   → The Story / The Angle / Sound Familiar?
    · Thriller / crime     → The Setup / The Tension / A Hunch?
    · Romantic scene       → The Setup / The Chemistry / Ever Felt It?
    · Comedy / sitcom      → The Setup / The Vibe / Been There?
    · Coming-of-age drama  → The Moment / The Feeling / Remember That?
- Weave the scene title or series name into at most ONE bullet — brevity wins, not thickness.
- Adapt vocabulary to the CEFR level.
- Never reveal what happens in the dialogue — the student has NOT watched yet.
- Bullets open with a verb (Imagine / Describe / Tell / Pick / What / How / Which). The third label may be a short question like "Been There?".

SLIDE 4 — type: "clip_comprehension"
{ type, title: "Comprehension", phase: "while",
  questions: [
    { question: "Text of the question — asks WHAT was said, WHY someone said it, or WHAT it meant.",
      options: [ { id: "c0", text: "line or short paraphrase from the dialogue (or a plausible distractor)", isCorrect: false }, ... 4 total ... ],
      correctAnswer: "the text field of the correct option, copied verbatim"
    }
  ]
}
HARD RULES for slide 4:
- EXACTLY 6 questions, in the chronological order they map to the dialogue (opening → early → mid → turn → late → close).
- Cover DIFFERENT layers across the 6 questions:
    · 2× literal detail    ("What did X say?", "Where does the scene take place?")
    · 1× vocabulary-in-context (test one of the vocab_match words in the scene)
    · 1× inference / motive ("Why did X say Y?", "How does X feel here?")
    · 1× gist / main idea   ("What is this scene mainly about?")
    · 1× tone / register    ("What is the mood of the closing beat?")
- Each question has 4 options and exactly one correct answer.
- Correct answers must be lines (or short paraphrases) that the student could actually confirm by re-watching the scene. Distractors must be plausible but clearly wrong on rewatch.
- No trick questions. No "all of the above". No yes/no.
- Adapt vocabulary and inference difficulty to the CEFR level (A2 → 4 literal + 1 vocab + 1 gist, B1 → drop 1 literal for 1 inference, B2 → keep the full spread, C1 → replace 1 literal with an extra tone/register).

SLIDE 5 — type: "clip_language_focus"
{ type, title: "Language focus: {structure name}", phase: "while",
  content: "intro paragraph explaining the structure in 2 short sentences\\n• bullet with mini-rule 1\\n• bullet with mini-rule 2\\n• bullet with mini-rule 3\\noutro one-line takeaway that ties the structure back to the scene",
  words: [ { word: "the target chunk (e.g. 'was going to')", translation: "when to use it — 6-12 words", example: "the actual dialogue line where it appears, verbatim" } ]
}
HARD RULES for slide 5:
- Pick ONE grammar structure or lexical chunk that appears clearly in the dialogue: verb tense (past simple vs past continuous), a modal, a phrasal verb pattern, reported speech, conditionals, chunks like "have to / used to / going to". Do not invent a structure that isn't in the dialogue.
- 3 bullets in the content, each starting with • and covering a distinct mini-rule (form / meaning / use).
- words array has 2-4 examples pulled VERBATIM from the dialogue.
- Adapt the structure difficulty to the CEFR level (A2 → past simple, B1 → present perfect vs past simple, B1+/B2 → conditionals, C1 → subjunctive/inversion).

SLIDE 6 — type: "clip_controlled_practice"
{ type, title: "Controlled practice", subtitle: "{grammar focus name}", phase: "post",
  practiceItems: [ … EXACTLY 8 items … ]
}
HARD RULES for slide 6:
- EXACTLY 8 items covering the 6 formats — distribution:
    1× multiple_selection (multiple choice)
    2× unscramble
    2× verb_form (conjugate the blank)
    1× match_halves
    1× error_correction
    1× open_ended
- Order the items so the ladder climbs from recognition → controlled → productive: start with multiple_selection, alternate unscramble / verb_form / match_halves in the middle, then error_correction, and finish with open_ended.
- Every item drills the SAME grammar structure as slide 5.
- Item content must be tied to the dialogue's scene / setting when possible — use the same characters, place, action.
- multiple_selection: prompt = "Which of these lines uses {focus} correctly?" options = 4 lines (1 correct pattern line + 3 with a subtle grammar mistake). answer = the correct line.
- unscramble: prompt = correct sentence split by " / " (space-slash-space). Do NOT change casing or punctuation. answer = the full sentence.
- verb_form: prompt is a sentence with the LITERAL string "{{blank}}" (two open braces, the word blank, two close braces) where the missing word goes, immediately followed by "(baseverb)" so the student knows WHICH verb to conjugate. Example: "She {{blank}} (leave) the office at eight." options are 4 conjugated forms (correct + 3 plausible wrong tenses/forms of the SAME verb). answer = the correct form. NEVER use "_____" or any other placeholder — the UI only splits on "{{blank}}".
- match_halves: prompt = first half; answer = correct second half. options MUST contain 4 second-halves — the correct one plus 3 plausible wrong-second-halves from different sentence stems.
- error_correction: wrongText contains the sentence WITH the error; answer is the corrected version. prompt = "Correct the mistake:".
- open_ended: prompt = "Complete the sentence in your own words using {focus}." stem = 3–6-word sentence beginning that naturally forces the target structure (e.g. "Yesterday I …", "If I were you, I would …"). answer = "" (no auto-check). No options.
- Adapt sentence length to the CEFR level (A2 → 6-8 words, B1 → 8-11 words, B2+ → 10-14 words).

SLIDE 7 — type: "clip_production"
{ type, title: "Over to you", phase: "post",
  prompt: "A short hook (≤ 14 words) pulling the student back to their own life or opinion after watching.",
  content: "Exactly 3 bullets separated by \\n• — each in the format \"Label — Question\". The label is 2-4 words in Title Case; the question is ≤ 14 words:
    1. THE LINE / MOMENT — a specific line, look or moment from the scene that stayed with them.
    2. IN YOUR LIFE — a personal-experience question that EXPLICITLY invites the student to reuse the grammar structure from slide 4 (append \"Try using {grammar name}.\").
    3. STEAL IT — a phrase from the dialogue the student wants to use this week.
  Example bullet lines (if grammar focus in slide 4 is 'Past perfect'):
    • The Line — Which line stayed with you? Why?
    • In Your Life — Tell me about a time you felt the same. Try using Past perfect.
    • Steal It — Pick one phrase from the clip you want to use this week."
}
HARD RULES for slide 7:
- Each bullet uses the "Label — Question" format with an em dash. Question ≤ 14 words after the em dash.
- LABELS MUST BE BESPOKE to this specific scene. Do NOT ship the generic
  triple "The Line / In Your Life / Steal It" — pick tags that reflect
  the scene's flavour. Examples:
    · AI / tech piece      → The Warning / Your Prediction / Sound Byte
    · News / documentary   → The Headline / Your Take / Sound Byte
    · Thriller / crime     → The Turn / In Your Life / The Line
    · Romantic scene       → The Moment / Your Story / Steal It
    · Comedy / sitcom      → The Punchline / Your Story / Steal It
    · Coming-of-age drama  → The Turn / Your Story / Hold Onto It
- The middle bullet MUST reference the exact grammar-structure name from slide 5 (e.g. "Try using Past perfect.") — this is the through-line to the class objective.
- POST-viewing, so the student CAN reference specific lines / characters / moments.
- No yes/no stems. Open triggers only (Describe / Tell / Pick / Which / Why / How).
- Adapt vocabulary of the bullets to the CEFR level.

SLIDE 8 — type: "friendlyflix_end"
{ type, title: "¡Lección completada!", phase: "post" }

GLOBAL RULES:
- Adapt vocabulary complexity to the CEFR level throughout.
- Every "example" and "contextLine" you cite MUST appear character-for-character in the dialogue you were given. NEVER invent lines.
- Return ONLY valid JSON: { "slides": [...] } — no markdown fences, no explanation.
- Exactly 8 slides, in the order listed above.`;

async function generateWithAI(
  title: string,
  source: string,
  dialogue: string,
  level: LessonLevel,
): Promise<Slide[] | null> {
  if (!ANTHROPIC_API_KEY) return null;

  const userPrompt = `Scene: "${title}" from ${source}\nLevel: ${level}\n\nDialogue (verbatim, one line per row — {{blank}} markers stripped for you):\n${dialogue.slice(0, 3000)}\n\nGenerate the 8-slide CLT deck JSON now (cover, vocab_match, predictions, comprehension, language_focus, controlled_practice, production, end). Do NOT emit the clip_dialogue_game — that comes from the teacher.`;

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
    return parsed.slides.map((s, i) => normalizeSlide({ phase: 'pre' as const, ...s, id: `clip-ai-${i}` }));
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

// Defensive fixups for slides the LLM returns. The most important one is
// converting bare underscore placeholders ("_____") in verb_form prompts
// back to the "{{blank}}" marker that LanguagePracticeSlide.VerbFormCard
// actually splits on. Without this the chosen answer renders at the end of
// the sentence instead of inside the missing-word slot.
function normalizeSlide(slide: Slide): Slide {
  if (slide.type !== 'clip_controlled_practice') return slide;
  if (!Array.isArray(slide.practiceItems)) return slide;
  const fixed = slide.practiceItems.map(it => {
    if (it.type !== 'verb_form' || typeof it.prompt !== 'string') return it;
    let p = it.prompt;
    if (!p.includes('{{blank}}')) {
      // Convert whichever placeholder the AI used to {{blank}} so the UI
      // can splice the chosen answer inline.
      const marker = /_{2,}|\[[Bb]lank\]|<[Bb]lank>|\*\*_+\*\*/;
      if (marker.test(p)) p = p.replace(marker, '{{blank}}');
    }
    return { ...it, prompt: p };
  });
  return { ...slide, practiceItems: fixed };
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
