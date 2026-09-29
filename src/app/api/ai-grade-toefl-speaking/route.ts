// FriendlyTeaching.cl — TOEFL Speaking task grader (ETS 2026)
// POST /api/ai-grade-toefl-speaking
// Body varies by task type:
//   · taskType = 'listen-and-repeat' → { taskType, targetSentence, transcript }
//   · taskType = 'take-an-interview' → { taskType, topic, question, transcript, durationSec }
//   · legacy (no taskType)           → { prompt, transcript, durationSec }  (Independent Speaking, pre-2026)
// Returns: { rawScore05, feedback, rubric: <shape depends on taskType> }
//
// All task types are scored 0-5 per ETS 2026. Section-wide scaling from raw
// sum → 1.0-6.0 band happens on the client (types/toefl.ts speakingRawToScaled).

import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6';

type TaskType = 'listen-and-repeat' | 'take-an-interview' | undefined;

interface GradeReq {
  // Common — legacy Independent Speaking prompts still pass `prompt`; the new
  // task types pass task-specific fields plus a `taskType` discriminator.
  taskType?:       TaskType;
  transcript:      string;
  durationSec?:    number;   // required for TI + legacy; not used for LR

  // Legacy Independent (pre-2026)
  prompt?:         string;

  // Listen and Repeat
  targetSentence?: string;

  // Take an Interview
  topic?:          string;
  question?:       string;
}

// ── System prompts (three variants — one per task type + legacy) ──────

/** Take an Interview (ETS 2026) — 4 dimensions, each 0-5. */
function buildInterviewSystemPrompt(): string {
  return `You are a certified TOEFL iBT rater grading a **Take an Interview** response using the OFFICIAL ETS 2026 rubric (effective 21 January 2026).

FORMAT: The student answered a single interview question (45 seconds, no prep, no retake) about an everyday topic set by the interviewer. Do not judge them for informal register — the task is conversational.

DIMENSIONS: score each dimension 0-5 whole scores. The overall task score is your holistic 0-5 judgement (usually within ±1 of the average).
  · **Fluency** — speaking rate, length of uninterrupted runs, number of pauses and hesitations.
  · **Intelligibility** — pronunciation clarity, naturalness of rhythm and prosody.
  · **Language Use** — vocabulary diversity and precision, grammatical accuracy.
  · **Organization** — discourse coherence, use of connectives, whether the answer stays on-topic.

BAND DESCRIPTORS (holistic score):
  5 = Fully successful: sustained, coherent, well-developed answer. Precise vocabulary, strong grammar, fluent delivery, clear organisation.
  4 = Generally successful: clearly organised and addresses the question. Minor slips in fluency, vocabulary or grammar do not obscure meaning.
  3 = Adequate: question is addressed but development is basic. Noticeable lapses but message stays intelligible.
  2 = Partially successful: limited or unclear development. Noticeable grammar/vocabulary problems affect clarity.
  1 = Barely addresses the question: very limited content, meaning obscured by frequent errors or fragmentation.
  0 = Not attempted, off-topic, in another language, or completely unintelligible.

CALIBRATION NOTES:
- Only the transcript is available to you. Assume delivery is reasonable unless the transcript clearly reflects repeated false starts, filler words, or extreme brevity.
- A response under ~40 words for a 45-second task typically indicates struggle → score at most 2.
- A response over ~80 words that stays on-topic and shows range and precise language → potential 5.
- A response of ~60-80 words with clear structure and adequate range → typically 3-4.
- Grammar errors that don't obscure meaning should not cap the score below 3.

FEEDBACK LANGUAGE: Spanish — **NEUTRAL LATIN AMERICAN SPANISH ONLY** (usa "tú", NUNCA voseo argentino). Prohibidas todas las formas voseo: "vos", "tenés", "podés", "escuchá", "grabate", "tomate", "revisá", "probá", "elegí", "usá", "hacé", "mirá", "andá", "dejá", "sabés", "entendés", "decís", "querés", "sos", "armás", "confirmás", "avanzás", "repetí", "anotá", "contá", "creá", "practicá", etc. Usa las formas de "tú" con acentuación estándar: "escucha", "grábate", "tómate", "revisa", "prueba", "elige", "usa", "haz", "mira", "anda", "deja", "sabes", "entiendes", "dices", "quieres", "eres", "armas", "confirmas", "avanzas", "repite", "anota", "cuenta", "crea", "practica". Este PDF se lee en toda Latinoamérica: mantén el registro neutro.

Return ONLY valid JSON. Schema:
{
  "rawScore05": <integer 0-5>,
  "rubric": {
    "fluency":          <integer 0-5>,
    "intelligibility":  <integer 0-5>,
    "languageUse":      <integer 0-5>,
    "organization":     <integer 0-5>
  },
  "feedback": "<2-3 sentence feedback in Spanish>",
  "strengths": ["<...>", "<...>"],
  "improvements": ["<...>", "<...>"]
}`;
}

/** Listen and Repeat (ETS 2026) — holistic 0-5 based on repetition fidelity. */
function buildListenAndRepeatSystemPrompt(): string {
  return `You are a certified TOEFL iBT rater grading a **Listen and Repeat** response using the OFFICIAL ETS 2026 rubric (effective 21 January 2026).

FORMAT: The student heard ONE sentence played to them and had a short window (8-12 seconds, no prep) to reproduce it exactly. Their audio was transcribed by Whisper. You get the target sentence and the transcript.

SCALE (holistic, 0-5):
  5 = Exact repetition. Only trivial function-word swaps allowed ("the" ↔ "a"). No content omission.
  4 = Very close: 1-2 minor content substitutions or a small word-order slip, but every content word from the target is present.
  3 = Recognisable: student captures the gist, but 1-2 content words are missing or swapped for near-synonyms.
  2 = Partial: student produced part of the sentence but missed multiple content words or restructured it meaningfully.
  1 = Very limited: only a few words match the target.
  0 = Blank, silence, off-topic, in another language, or completely unintelligible.

DELIVERY: The transcript won't show pronunciation directly. Do NOT penalise for pronunciation unless Whisper produced obviously garbled English (which suggests the student's speech was unintelligible).

FEEDBACK LANGUAGE: Spanish — **NEUTRAL LATIN AMERICAN SPANISH ONLY** (usa "tú", NUNCA voseo argentino). Formas de "tú" con acentuación estándar (escucha, repite, prueba, etc.).

Return ONLY valid JSON. Schema:
{
  "rawScore05": <integer 0-5>,
  "feedback":   "<1-2 sentences in Spanish naming what was captured and what was missed>",
  "strengths":  ["<...>"],
  "improvements": ["<...>"]
}`;
}

/** Legacy Independent Speaking (pre-2026) — kept for old records. */
function buildLegacyIndependentSystemPrompt(): string {
  return `You are a certified TOEFL iBT rater grading a legacy Independent Speaking response (pre-2026 format). Use the ETS 2026 0-5 scale so section scores stay consistent.

DIMENSIONS: delivery, languageUse, topicDevelopment — each 0-5.

FEEDBACK LANGUAGE: Spanish neutro latinoamericano (tú, sin voseo).

Return ONLY valid JSON. Schema:
{
  "rawScore05": <integer 0-5>,
  "rubric": {
    "delivery":         <integer 0-5>,
    "languageUse":      <integer 0-5>,
    "topicDevelopment": <integer 0-5>
  },
  "feedback": "<2-3 sentence feedback in Spanish>",
  "strengths":    ["<...>", "<...>"],
  "improvements": ["<...>", "<...>"]
}`;
}

// ── User prompts (per task type) ──────────────────────────────────────

function buildInterviewUserPrompt(body: GradeReq): string {
  const words = body.transcript.split(/\s+/).filter(Boolean).length;
  const dur   = body.durationSec ?? 45;
  return `INTERVIEW TOPIC: ${body.topic ?? '(unspecified)'}
INTERVIEWER'S QUESTION:
"""
${body.question ?? ''}
"""

STUDENT TRANSCRIPT (from Whisper, ~${dur.toFixed(0)}s of audio, ~${words} words):
"""
${body.transcript}
"""

Grade this Take-an-Interview response and return your assessment as JSON.`;
}

function buildListenAndRepeatUserPrompt(body: GradeReq): string {
  return `TARGET SENTENCE (what the student heard):
"""
${body.targetSentence ?? ''}
"""

STUDENT TRANSCRIPT (from Whisper):
"""
${body.transcript}
"""

Grade the repetition and return your assessment as JSON.`;
}

function buildLegacyUserPrompt(body: GradeReq): string {
  const words = body.transcript.split(/\s+/).filter(Boolean).length;
  const dur   = body.durationSec ?? 45;
  return `PROMPT SHOWN TO STUDENT:
"""
${body.prompt ?? ''}
"""

STUDENT TRANSCRIPT (from Whisper, ${dur.toFixed(1)}s of audio, ~${words} words):
"""
${body.transcript}
"""

Grade this response and return your assessment as JSON.`;
}

function clampInt(n: unknown, lo: number, hi: number): number {
  const num = typeof n === 'number' ? n : parseInt(String(n), 10);
  if (!isFinite(num)) return lo;
  return Math.max(lo, Math.min(hi, Math.round(num)));
}

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI grading not configured. Set ANTHROPIC_API_KEY.' }, { status: 503 });
  }

  let body: GradeReq;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.transcript?.trim()) {
    return NextResponse.json({ error: 'Missing transcript' }, { status: 400 });
  }

  // Branch by task type. Legacy body (no taskType, has `prompt`) → Independent.
  const taskType: TaskType =
    body.taskType ??
    (body.targetSentence ? 'listen-and-repeat'
      : body.question ? 'take-an-interview'
      : undefined);

  let systemPrompt: string;
  let userPrompt:   string;
  if (taskType === 'listen-and-repeat') {
    if (!body.targetSentence?.trim()) {
      return NextResponse.json({ error: 'Missing targetSentence' }, { status: 400 });
    }
    systemPrompt = buildListenAndRepeatSystemPrompt();
    userPrompt   = buildListenAndRepeatUserPrompt(body);
  } else if (taskType === 'take-an-interview') {
    if (!body.question?.trim()) {
      return NextResponse.json({ error: 'Missing question' }, { status: 400 });
    }
    systemPrompt = buildInterviewSystemPrompt();
    userPrompt   = buildInterviewUserPrompt(body);
  } else {
    // Legacy Independent
    if (!body.prompt?.trim()) {
      return NextResponse.json({ error: 'Missing prompt (legacy) or taskType (2026)' }, { status: 400 });
    }
    systemPrompt = buildLegacyIndependentSystemPrompt();
    userPrompt   = buildLegacyUserPrompt(body);
  }

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      CLAUDE_MODEL,
        max_tokens: 1000,
        system:     systemPrompt,
        messages:   [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[toefl-speaking-grader] Claude API error:', resp.status, errText);
      return NextResponse.json({ error: 'AI service temporarily unavailable' }, { status: 502 });
    }

    const data = await resp.json();
    const text: string = data?.content?.[0]?.text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[toefl-speaking-grader] no JSON:', text.slice(0, 300));
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const raw = JSON.parse(jsonMatch[0]);
    // Legacy prompts may still emit rawScore04; accept and clamp to 0-5.
    const scoreInput = raw.rawScore05 ?? raw.rawScore04;
    const rawScore   = clampInt(scoreInput, 0, 5);

    let rubric: Record<string, number> | undefined;
    if (taskType === 'take-an-interview') {
      rubric = {
        fluency:         clampInt(raw.rubric?.fluency,         0, 5),
        intelligibility: clampInt(raw.rubric?.intelligibility, 0, 5),
        languageUse:     clampInt(raw.rubric?.languageUse,     0, 5),
        organization:    clampInt(raw.rubric?.organization,    0, 5),
      };
    } else if (taskType === 'listen-and-repeat') {
      // Holistic — no rubric dimensions in the ETS 2026 rubric for LR.
      rubric = undefined;
    } else {
      rubric = {
        delivery:         clampInt(raw.rubric?.delivery,         0, 5),
        languageUse:      clampInt(raw.rubric?.languageUse,      0, 5),
        topicDevelopment: clampInt(raw.rubric?.topicDevelopment, 0, 5),
      };
    }

    return NextResponse.json({
      rawScore05:   rawScore,
      rubric,
      feedback:     String(raw.feedback ?? ''),
      strengths:    Array.isArray(raw.strengths)    ? raw.strengths.map(String)    : [],
      improvements: Array.isArray(raw.improvements) ? raw.improvements.map(String) : [],
    });
  } catch (err) {
    console.error('[toefl-speaking-grader] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
