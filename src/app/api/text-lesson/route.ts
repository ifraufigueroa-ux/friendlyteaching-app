// FriendlyTeaching.cl — Friendlytext CLT Lesson Generator
// 10-slide CLT format for a piece of text (article, dialogue, script, story).
//
// Strategy: Claude AI first → structured JSON of 10 slides. No algorithmic
// fallback for now — CLT lessons need too much interpretation to synthesise
// naively. If ANTHROPIC_API_KEY is missing the route returns 503 and the
// teacher can still save a minimal 2-slide deck client-side.
import { NextRequest, NextResponse } from 'next/server';
import type { Slide, LessonLevel, ComprehensionMode, PracticeItem } from '@/types/firebase';
import { generateTextLessonAlgorithmically } from '@/lib/utils/textLessonGenerator';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? '';
const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6';

export interface TextLessonRequest {
  title: string;
  source: string;       // author / publication / "Original TTS script"
  text: string;         // raw text (multi-line ok)
  level: LessonLevel;
  hasAudio?: boolean;   // if true, we mention "before you listen / read"; else "before you read"
  comprehensionMode?: ComprehensionMode;  // shapes cues in the deck (text-only / audio-only / both)
  useAI?: boolean;      // false → skip Claude and run the algorithmic generator (text-only)
}

const SYSTEM_PROMPT = `You are an expert English teacher creating Friendlytext® CLT text-based lessons. Generate exactly 10 slides in this order.

CONTEXT
- The source material is a piece of TEXT: an article, dialogue, story, short script or news snippet.
- Audio may or may not be present. If hasAudio is false, adapt all cues to READING ("Before you read", "Read again"). If true, cue LISTENING + READING together.
- The lesson follows the same CLT arc as Friendlyrics: pre / while / post.

SLIDE 1 — type: "text_cover"
{ type, title: "{Title}", phase: "pre" }
- Do NOT include a subtitle field on the cover — the source is already shown separately.

SLIDE 2 — type: "vocab_match"
{ type, title: "Key Vocabulary", phase: "pre", words: [ {word, translation: "English definition (NOT Spanish)", pronunciation: "/ˈIPA/", example: "sentence from the text"} ] }
HARD RULES for slide 2:
- Word count: 6 for A0/A1, 6-7 for A2, 7 for B1, 7-8 for B1+/B2/C1.
- Pick COMPREHENSION GATEKEEPERS from the text — content words the student will hit and stumble on. Not showpiece vocabulary.
- Prefer words that repeat across the text — repetition = pedagogical value.
- Content words only: nouns, verbs, adjectives, adverbs. Skip pronouns, articles, prepositions, interjections.
- example field: the ACTUAL sentence from the text where the word appears, COPIED VERBATIM. Never paraphrase.
- pronunciation: IPA phonemic form inside slashes. If unsure, omit rather than invent.

SLIDE 3 — type: "predictions"
{ type, title: "Before You Read...", phase: "pre",
  prompt: "One hook question that INVITES the student to imagine what the text is about — mood, character, message — BEFORE reading it. Pulls production, not yes/no.",
  content: "Exactly 3 bullet points (use \\n• ), one from EACH category, in order:
    1. IMAGINATIVE PREDICTION from title + source — 'Imagine…', 'Picture…', 'Describe the scene…'.
    2. PRIOR EXPERIENCE narrative — 'Tell us about a time…', 'Describe how you feel when…'.
    3. PERSONAL / CULTURAL BRIDGE — 'Think of a text in Spanish that seems to share this theme…', 'Tell us about a moment in your own life this might describe.'
}
HARD RULES for slide 3:
- NEVER ask about vocab or specific lines — the student has NOT read the text yet.
- NO yes/no stems. Ban 'Do you…?', 'Have you…?', 'Is it…?'.
- Every bullet must push OUTPUT (opinion, memory, description, story).
- Weave {Title} into at least two bullets so it never feels generic.
- Do NOT reference {Source} in the bullets. The source is often our own platform
  ("FriendlyTeaching", "Original", "CLT script"); asking the student about it
  turns the slide into a platform survey. Ignore {Source} entirely and pull
  bullets from the TITLE + the reader's OWN life.
- Adapt vocab to CEFR level. Keep each bullet under 25 words.

SLIDE 4 — type: "text_comprehension"
{ type, title: "{{comprehensionTitle}}", phase: "while",
  content: "The FULL text COPIED VERBATIM (preserve line breaks and paragraph structure). Do NOT edit, summarise, or omit any part."
}
HARD RULES for slide 4:
- content MUST be the verbatim text. Nothing added, nothing removed. Even when the lesson is audio-only, we still store the text here so the renderer can decide whether to reveal it.
- title adapts to comprehensionMode: 'text' → "Read the Text"; 'audio' → "Listen to the Text"; 'both' → "Read + Listen".

SLIDE 5 — type: "listening_quiz"
{ type, title: "Comprehension Check", phase: "while",
  questions: [
    { question: "...", options: [{id:"a",text:"...",isCorrect:false},{id:"b",text:"...",isCorrect:true},{id:"c",text:"...",isCorrect:false},{id:"d",text:"...",isCorrect:false}], correctAnswer: "the correct option text" },
    ... EXACTLY 6 questions total ...
  ]
}
HARD RULES for slide 5:
- Focus on INTERPRETATION and UNDERSTANDING — the message, the feelings, the arguments, the narrator's perspective. Do NOT ask trivia about which word appears where.
- Good stems: "What is the writer really saying when they write '{brief quote}'?", "Which statement best captures the main message?", "The phrase '{expression}' most likely means:", "How does the narrator seem to feel in {section}?".
- Every question answerable from the text — no outside knowledge.
- Exactly 4 options per question with exactly one correct interpretation.
- Adapt vocab of questions/options to CEFR level.

SLIDE 6 — type: "language_focus"
{ type, title: "Language Focus: [a specific structure ACTUALLY PRESENT in the text — e.g. 'Past simple', 'Phrasal verbs', 'Present perfect', 'Modals of speculation']", phase: "while",
  content: "Format EXACTLY as: one intro sentence (\"In {Title}, the writer uses…\"), blank line, then 2-3 bullet lines each starting with '• ', each in the shape '• <Pattern name> → <what it does + why it matters in this text>' (use the arrow → literally), blank line, then one closing outro ('Notice how it shifts the mood.' or similar).",
  words: [ {word: "the COMPLETE sentence VERBATIM from the text", translation: "the same short structure label as in the slide title", example: "Pattern: <exact substring from that sentence that shows the structure>"} ] — 3-4 items
}
HARD RULES for slide 6:
- The chosen topic MUST be observable in the provided text. If you can't find 3+ real sentences using it, pick a different topic.
- "word" is ALWAYS the full sentence, verbatim. "example" is ALWAYS "Pattern: <fragment>" and the fragment MUST be a substring of that same sentence. Do NOT swap these fields.
- Bullets carry an arrow → separating pattern name from explanation.
- Adapt vocab to CEFR.

SLIDE 7 — type: "language_practice"
{ type, title: "Let's Practice!", phase: "while",
  content: "Short instruction naming the grammar target from slide 6 (e.g. 'Practise modals of deduction and obligation with sentences from the story.')",
  practiceItems: [ ... exactly 4 items following the CEFR mix below, in order ... ]
}

CORE PRINCIPLE for slide 7 — coherence with slide 6:
Every practiceItem MUST drill the EXACT grammar structure you chose for slide 6 (Language Focus). If slide 6 teaches "Modals of deduction and obligation", every item on slide 7 exercises that structure. If slide 6 teaches "Present perfect", every item exercises present perfect. Do NOT drift into other grammar just because the text has variety — the whole point of this slide is to reinforce THE ONE structure slide 6 just introduced.

ITEM TYPES available (each carries the field grammarTopic: "<same topic name as slide 6, without the 'Language Focus:' prefix>"):

  * unscramble
    { type: "unscramble", prompt: "word1 / word2 / word3 / word4",
      answer: "The correct sentence that uses the target structure",
      grammarTopic: "<topic>" }

  * match_halves
    { type: "match_halves", prompt: "First half of a sentence that uses the target structure",
      answer: "Correct second half (which contains or completes the structure)",
      options: ["Correct second half", "wrong1", "wrong2", "wrong3"],
      grammarTopic: "<topic>" }

  * verb_form — student picks the correct verb form from 4 options
    { type: "verb_form", prompt: "Sentence with {{blank}} where the target verb goes",
      answer: "the correct form (must appear in options)",
      options: ["form1", "form2", "form3", "form4"],   // 4 distinct forms of the same verb
      grammarTopic: "<topic>" }
    // Example for present perfect: prompt "She has {{blank}} the letter", answer "written",
    // options ["write","writes","wrote","written"].

  * error_correction — student rewrites a sentence with a target-structure error
    { type: "error_correction",
      prompt: "This sentence has an error with <topic>. Rewrite it correctly.",
      wrongText: "The sentence WITH the systematic error",
      answer: "The corrected sentence",
      grammarTopic: "<topic>" }
    // Inject a natural learner error OF THE TARGET STRUCTURE only. Examples:
    //   3rd person -s → drop the -s ("she go home")
    //   past 'to be' → swap was/were ("we was tired")
    //   present continuous → drop -ing ("she is run")
    //   present perfect → drop have/has ("she gone home")
    //   past simple irregular → regularize ("he goed home")
    //   modals → add -s after modal ("she can goes home")
    //   used to → wrong form after "used to" ("I used to went")
    //   conditionals → swap will/would
    //   phrasal verbs → wrong particle ("give down" for "give up")

  * multiple_selection — MCQ: which sentence uses the structure correctly?
    { type: "multiple_selection",
      prompt: "Which sentence uses <topic> correctly?",
      answer: "The one grammatically correct sentence",
      options: [correct, wrongA, wrongB, wrongC],   // 3 distractors each with the SAME TYPE of target-structure error
      grammarTopic: "<topic>" }

  * open_ended — no auto-check; student writes their own completion
    { type: "open_ended",
      prompt: "Complete the sentence with your own idea, using <topic>.",
      stem: "Sentence stem that references the story's title/character/setting and invites the target structure (e.g. 'In {Title}, the main character must ')",
      answer: "",
      grammarTopic: "<topic>" }

CEFR ACTIVITY MIX (EXACTLY 4 items, IN THIS ORDER, per level):
  A0/A1: match_halves, multiple_selection, match_halves, unscramble
  A2:    match_halves, unscramble,         multiple_selection, verb_form
  B1:    unscramble,   verb_form,          error_correction,    multiple_selection
  B1+:   unscramble,   verb_form,          error_correction,    multiple_selection
  B2:    verb_form,    error_correction,   multiple_selection, open_ended
  C1:    verb_form,    error_correction,   multiple_selection, open_ended

The ladder walks from RECOGNITION (pick the right option) to CONTROLLED PRODUCTION (verb form / error fix) to FREE PRODUCTION (open_ended). Do NOT rearrange it — the order is the pedagogical progression.

HARD RULES for slide 7:
- COHERENCE FIRST: every item's answer/wrongText/stem must EXAMPLIFY the slide-6 structure. If you cannot cleanly demonstrate the structure in an item, invent a sentence using the story's characters, setting, or vocabulary — do NOT substitute a different grammar.
- Sources for sentences: prefer VERBATIM quotes from the text when they cleanly showcase the target structure; if the text is thin on examples, write new sentences using the story's title, character names, setting, or key vocab. Never leave an item on unrelated grammar just because it's a text quote.
- Use the SAME topic string in grammarTopic across all 4 items — same wording as slide 6's title minus the "Language Focus:" prefix.
- unscramble prompt: take the answer, split on spaces, join with " / ". Do not change casing/punctuation.
- match_halves: split at (or near) the halfway word so the SECOND half contains the target structure. Distractors are second halves of OTHER real sentences (never the same sentence). Length within ±2 words of the answer.
- verb_form: the blanked verb MUST be the target verb of the structure (e.g. for present perfect, blank the past participle; for present continuous, blank the -ing verb). Options include the correct form + 3 other plausible forms of the SAME verb.
- error_correction & multiple_selection distractors: inject ONLY errors that break the target structure. A distractor with a spelling mistake or unrelated tense error doesn't teach the target — it distracts pedagogically.
- open_ended (B2/C1 only): the stem must reference the story ("In '{Title}', the character..."). answer stays "".
- Sentence length by CEFR: A0/A1 → 4-6 words; A2 → 5-7; B1 → 6-9; B1+/B2/C1 → 7-11.

SLIDE 8 — type: "translation_game"
{ type, title: "Translate It!", phase: "post",
  translationText: "The COMPLETE English text COPIED VERBATIM (every line, every paragraph — do not trim).",
  content: "La TRADUCCIÓN al ESPAÑOL del texto COMPLETO — mismo número de líneas, mismo orden de párrafos. Reemplaza aprox. 2 palabras significativas cada 3-4 líneas con {{blank}}, distribuidas por todo el texto (NO agrupadas al inicio).",
  blanksData: [ {word: "palabra_española_reemplazada", options: ["correcta", "distractor1_es", "distractor2_es", "distractor3_es"]} ]
}
HARD RULES for slide 8:
- Translate into IDIOMATIC Latin American Spanish — not word-for-word.
- translationText MUST be the FULL English text, verbatim (every paragraph and line). Do NOT summarise or extract a passage.
- content MUST have the same number of lines as translationText, same order, matching paragraph breaks.
- Blank density: about 2 blanks every 3-4 lines. For a 20-line text expect ~12 blanks; for 30 lines expect ~17; for 40 lines expect ~23. Spread them across the whole text, never cluster at the start.
- Blanks GUESSABLE from context — content words (nouns, verbs, adjectives) that a learner can infer.
- Every option MUST be a real Spanish word. NEVER include English words.
- The correct answer MUST appear in the options array. Distractors same POS as correct, within ±2 letters length.
- blanksData items must appear in the SAME ORDER as the {{blank}} markers in content.

SLIDE 9 — type: "wrapup"
{ type, title: "Wrap Up", phase: "post",
  prompt: "One warm, personal hook question that pulls the student back to their OWN life now that they have read \"{Title}\". Push production.",
  content: "Exactly 3 bullet points (use \\n→ ), one from EACH category:
    1. FELT MOMENT in the text — 'Describe the exact moment in \"{Title}\" that hit you hardest — the line, the image.', 'Tell us how you felt when you reached {section}.'
    2. PREDICTION vs REALITY — 'Compare your prediction with what \"{Title}\" turned out to be. What surprised you?'
    3. CARRY-FORWARD — 'Pick one line from \"{Title}\" you want to remember this week. Say it out loud and explain why.', 'Describe a moment in your own life this text would fit.'
}
HARD RULES for slide 9:
- NO yes/no stems.
- One bullet MUST reference the predictions the student made at the start.
- One bullet MUST push the student to reuse language from the text.
- Weave "{Title}" into at least two bullets. Under 25 words each.
- Do NOT reference {Source} — same reason as slide 3. Focus on the title and the student's life.

SLIDE 10 — type: "friendlytext_end"
{ type, title: "¡Lección completada!", phase: "post" }

GENERAL RULES:
- Adapt vocab complexity, grammar focus, and question difficulty to the CEFR level.
- For translation_game: blanksData items must appear in the SAME ORDER as {{blank}} markers in content.
- For unscramble: separate words with " / " (space-slash-space).
- Return ONLY valid JSON: { "slides": [...] } — no markdown, no explanation.
- All 10 slides must be present.`;

interface GenerateResult {
  slides?: Slide[];
  error?: string;      // human-facing error to bubble up
  status?: number;     // status to bubble up (401 → invalid key, 429 → rate/credit, etc.)
}

// Sanity-check a single practice item against the shape its renderer needs.
// Returns null for items so broken they'd render as empty/garbage — the
// caller drops those instead of shipping them.
function normalizePracticeItem(raw: PracticeItem): PracticeItem | null {
  const item = { ...raw };
  if (!item.type || typeof item.prompt !== 'string') return null;

  switch (item.type) {
    case 'unscramble':
      // prompt is "word / word / …", answer is the correct sentence.
      if (!item.answer || !item.prompt.includes('/')) return null;
      return item;

    case 'match_halves':
    case 'multiple_selection':
      if (!item.answer || !Array.isArray(item.options) || item.options.length < 2) return null;
      // Guarantee the correct answer is one of the options — swap in if drift.
      if (!item.options.some(o => o.toLowerCase().trim() === item.answer.toLowerCase().trim())) {
        const patched = [...item.options];
        patched[Math.floor(Math.random() * patched.length)] = item.answer;
        return { ...item, options: patched };
      }
      return item;

    case 'verb_form': {
      if (!item.answer || !Array.isArray(item.options) || item.options.length < 2) return null;
      // Ensure {{blank}} marker; if Claude wrote {{answer}} or [answer], normalize.
      let prompt = item.prompt;
      if (!prompt.includes('{{blank}}')) {
        prompt = prompt.replace(/\{\{[^}]+\}\}/g, '{{blank}}');
        if (!prompt.includes('{{blank}}')) {
          // Last-ditch: try to blank the answer word inside the prompt.
          const re = new RegExp(`\\b${item.answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          if (re.test(prompt)) prompt = prompt.replace(re, '{{blank}}');
        }
      }
      if (!prompt.includes('{{blank}}')) return null;
      // Answer must appear in options — same self-heal as MCQ.
      const opts = item.options.some(o => o.toLowerCase().trim() === item.answer.toLowerCase().trim())
        ? item.options
        : (() => {
            const patched = [...item.options];
            patched[Math.floor(Math.random() * patched.length)] = item.answer;
            return patched;
          })();
      return { ...item, prompt, options: opts };
    }

    case 'error_correction':
      if (!item.wrongText || !item.answer) return null;
      // Cheap sanity check — wrongText and answer must actually differ.
      if (item.wrongText.trim().toLowerCase() === item.answer.trim().toLowerCase()) return null;
      return item;

    case 'open_ended':
      // No autograding — just ensure there's a stem to render.
      if (!item.stem) {
        // Fall back to prompt as stem so the student still sees SOMETHING.
        if (!item.prompt) return null;
        return { ...item, stem: item.prompt, answer: item.answer ?? '' };
      }
      return { ...item, answer: item.answer ?? '' };

    default:
      return null;
  }
}

// Post-process AI output before we hand it back — Claude occasionally drifts
// on rules that break slides at render time. Recoverable drift is patched
// here; unrecoverable items are dropped rather than shipped.
//
//   • translation_game: {{answer}} → {{blank}}, ensure answer ∈ options
//   • language_practice: schema-check every practiceItem (verb_form needs
//     {{blank}}, error_correction needs wrongText, MCQs must contain the
//     correct answer, etc.). Dropped items are skipped.
function normalizeSlides(slides: Slide[]): Slide[] {
  return slides.map((s) => {
    if (s.type === 'translation_game') {
      const content = typeof s.content === 'string'
        ? s.content.replace(/\{\{[^}]+\}\}/g, '{{blank}}')
        : s.content;
      const blanksData = (s.blanksData ?? []).map((b) => {
        const opts = b.options ?? [];
        const answer = b.word ?? '';
        const hasAnswer = opts.some(
          (o) => o.toLowerCase().trim() === answer.toLowerCase().trim(),
        );
        if (hasAnswer || !answer) return b;
        if (opts.length === 0) return { ...b, options: [answer] };
        const slot = Math.floor(Math.random() * opts.length);
        const patched = [...opts];
        patched[slot] = answer;
        return { ...b, options: patched };
      });
      return { ...s, content, blanksData };
    }

    if (s.type === 'language_practice' && Array.isArray(s.practiceItems)) {
      const cleaned = s.practiceItems
        .map(normalizePracticeItem)
        .filter((it): it is PracticeItem => it !== null);
      return { ...s, practiceItems: cleaned };
    }

    return s;
  });
}

async function generateWithAI(
  title: string,
  source: string,
  text: string,
  level: LessonLevel,
  hasAudio: boolean,
  comprehensionMode: ComprehensionMode,
): Promise<GenerateResult> {
  if (!ANTHROPIC_API_KEY) return { error: 'ANTHROPIC_API_KEY not configured', status: 503 };

  const modeTitle =
    comprehensionMode === 'audio' ? 'Listen to the Text'
    : comprehensionMode === 'text' ? 'Read the Text'
    : 'Read + Listen';

  const userPrompt = `Text title: "${title}" (source: ${source})
Level: ${level}
Audio available: ${hasAudio ? 'yes' : 'no'}
Comprehension mode: ${comprehensionMode} → slide 4 title MUST be "${modeTitle}".

Text:
${text.slice(0, 4000)}

Generate the 10-slide Friendlytext® CLT lesson JSON now.`;

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
        // Bumped from 6000 because slide 8 now carries the FULL text
        // translated to Spanish (previously just a 2-6 sentence passage),
        // so the total JSON payload nearly doubles for longer texts.
        max_tokens: 10000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const bodyText = await response.text().catch(() => '');
      console.error('[text-lesson] Claude API', response.status, bodyText);
      // Pass Anthropic's own error message through so the teacher sees
      // *why* it failed (credit balance, invalid key, rate limit, etc.)
      // instead of a generic "AI generation failed".
      let humanMsg = `Claude API ${response.status}`;
      try {
        const parsed = JSON.parse(bodyText);
        humanMsg = parsed?.error?.message ?? humanMsg;
      } catch { /* keep default */ }
      return { error: humanMsg, status: 502 };
    }

    const data = await response.json();
    const respText: string = data?.content?.[0]?.text ?? '';
    const jsonMatch = respText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { error: 'AI response did not contain valid JSON', status: 500 };

    const parsed: { slides: Slide[] } = JSON.parse(jsonMatch[0]);
    const normalized = parsed.slides.map((s, i) => ({ phase: 'pre' as const, ...s, id: `ai-slide-${i}` }));
    return { slides: normalizeSlides(normalized) };
  } catch (err) {
    console.error('[text-lesson] Generation error:', err);
    return { error: err instanceof Error ? err.message : String(err), status: 500 };
  }
}

export async function POST(req: NextRequest) {
  let body: TextLessonRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { title, source, text, level, hasAudio, comprehensionMode, useAI } = body;
  if (!title || !source || !text) {
    return NextResponse.json({ error: 'title, source and text required' }, { status: 400 });
  }

  const mode: ComprehensionMode = comprehensionMode ?? 'both';

  // Algorithmic path — teacher opted out of AI, or the algorithmic path is
  // the only text-only option available on this deployment.
  if (useAI === false) {
    try {
      const slides = await generateTextLessonAlgorithmically(title, source, text, level, mode);
      return NextResponse.json({ slides, source: 'algorithmic' });
    } catch (err) {
      console.error('[text-lesson] Algorithmic generation failed:', err);
      return NextResponse.json({ error: 'Algorithmic generation failed' }, { status: 500 });
    }
  }

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'AI text lesson generation not configured. Set ANTHROPIC_API_KEY.' },
      { status: 503 },
    );
  }

  const result = await generateWithAI(title, source, text, level, hasAudio ?? false, mode);
  if (!result.slides) {
    return NextResponse.json({ error: result.error ?? 'AI generation failed' }, { status: result.status ?? 502 });
  }

  return NextResponse.json({ slides: result.slides, source: 'ai' });
}
