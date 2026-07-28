// FriendlyTeaching.cl — Placement Speaking grader
// POST /api/ai-grade-placement-speaking
// Body: { promptLevel, promptText, transcript, durationSec }
// Returns: { placedLevel, feedback, strengths, improvements, rubric: {fluency, grammar, lexis, coherence} }

import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6';

type CEFR = 'A1' | 'A2' | 'B1' | 'B1+' | 'B2' | 'C1';

interface GradeReq {
  promptLevel:  CEFR;
  promptText:   string;
  transcript:   string;
  durationSec:  number;
}

function systemPrompt(): string {
  return `You are a CEFR-trained English speaking rater. You will grade a single speaking response by reading its Whisper transcript. Place it at ONE of these six CEFR levels: A1, A2, B1, B1+, B2, C1.

Use the public CEFR "Spoken Production" descriptors:
- A1: Can produce simple isolated phrases about people and places. Very halting.
- A2: Can give a simple description or presentation of people, living conditions, daily routine as a short series of simple phrases and sentences linked into a list.
- B1: Can reasonably fluently sustain a straightforward description of a familiar topic; can give a simple description of experiences, feelings, events.
- B1+: Can give clear, detailed descriptions on subjects related to their fields of interest. Can develop a short argument well enough to be followed most of the time.
- B2: Can give clear, detailed descriptions and presentations on a wide range of subjects, expanding and supporting ideas with subsidiary points and relevant examples.
- C1: Can give clear, detailed descriptions of complex subjects, integrating sub-themes, developing particular points and rounding off with an appropriate conclusion. Fluent and spontaneous.

You only see the transcript, not the audio. INFER delivery loosely from:
- Word count relative to duration (words/second)
- Transcript coherence and completeness
- Repetitions and false starts that Whisper preserves

CALIBRATION RULES:
- Off-topic or fewer than ~15 words: cap at A1.
- Very short (< 40 words for a 45s+ prompt): cap at A2.
- Grammar and lexis errors that don't obscure meaning should not cap below B1.
- promptLevel is context. Place based on the response ITSELF; place higher if the response is clearly beyond promptLevel, lower if clearly below.

FEEDBACK LANGUAGE: Spanish.

Return ONLY valid JSON. Schema:
{
  "placedLevel": "A1" | "A2" | "B1" | "B1+" | "B2" | "C1",
  "rubric": {
    "fluency":   "<one sentence, inferred from transcript density>",
    "grammar":   "<one sentence about grammatical range and accuracy>",
    "lexis":     "<one sentence about vocabulary range and precision>",
    "coherence": "<one sentence about organisation and relevance>"
  },
  "feedback":     "<2-3 sentence overall feedback in Spanish>",
  "strengths":    ["<...>", "<...>"],
  "improvements": ["<...>", "<...>"]
}`;
}

function userPrompt(body: GradeReq): string {
  const wc = body.transcript.split(/\s+/).filter(Boolean).length;
  return `PROMPT (targeted at ${body.promptLevel}):
"""
${body.promptText}
"""

STUDENT TRANSCRIPT (${wc} words in ${body.durationSec.toFixed(1)}s):
"""
${body.transcript}
"""

Place this response at the CEFR level that best fits and return the JSON.`;
}

const CEFR_ORDER: CEFR[] = ['A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];
function normalizeLevel(v: unknown): CEFR {
  const s = String(v ?? '').trim();
  if ((CEFR_ORDER as string[]).includes(s)) return s as CEFR;
  return 'A1';
}

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI grading not configured. Set ANTHROPIC_API_KEY.' }, { status: 503 });
  }

  let body: GradeReq;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  if (!body.promptText?.trim() || !body.transcript?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      CLAUDE_MODEL,
        max_tokens: 1000,
        system:     systemPrompt(),
        messages:   [{ role: 'user', content: userPrompt(body) }],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[placement-speaking-grader] Claude error:', resp.status, errText);
      return NextResponse.json({ error: 'AI service temporarily unavailable' }, { status: 502 });
    }

    const data = await resp.json();
    const text: string = data?.content?.[0]?.text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[placement-speaking-grader] no JSON:', text.slice(0, 300));
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const raw = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      placedLevel: normalizeLevel(raw.placedLevel),
      rubric: {
        fluency:   String(raw.rubric?.fluency   ?? ''),
        grammar:   String(raw.rubric?.grammar   ?? ''),
        lexis:     String(raw.rubric?.lexis     ?? ''),
        coherence: String(raw.rubric?.coherence ?? ''),
      },
      feedback:     String(raw.feedback ?? ''),
      strengths:    Array.isArray(raw.strengths)    ? raw.strengths.map(String)    : [],
      improvements: Array.isArray(raw.improvements) ? raw.improvements.map(String) : [],
    });
  } catch (err) {
    console.error('[placement-speaking-grader] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
