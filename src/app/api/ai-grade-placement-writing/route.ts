// FriendlyTeaching.cl — Placement Writing grader
// POST /api/ai-grade-placement-writing
// Body: { promptLevel, promptText, studentAnswer, wordCount, minWords }
// Returns: { placedLevel, feedback, strengths, improvements, rubric: {task, grammar, lexis, cohesion} }
//
// Grades an unstructured student response against the six CEFR levels
// (A1 → C1) and returns the level that best fits. Uses Claude Sonnet.

import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6';

type CEFR = 'A1' | 'A2' | 'B1' | 'B1+' | 'B2' | 'C1';

interface GradeReq {
  promptLevel:   CEFR;       // level the prompt targets
  promptText:    string;
  studentAnswer: string;
  wordCount:     number;
  minWords:      number;
}

function systemPrompt(): string {
  return `You are a CEFR-trained English writing rater. Grade an unstructured student response and place it at ONE of these six CEFR levels: A1, A2, B1, B1+, B2, C1.

Use the public CEFR "Written Production" descriptors to guide the placement:
- A1: Can write short, simple postcard-style messages. Simple sentences with basic verbs. Frequent errors that don't obscure meaning at this level.
- A2: Can write short, simple notes and messages, connect ideas with basic connectors (and, but, because), describe events and personal experiences in a series of simple linked sentences.
- B1: Can write straightforward connected text on familiar topics. Simple linear description of experiences, feelings and events with reasons and short explanations. Some flexibility in structure and vocabulary.
- B1+: Can produce detailed descriptions on a range of subjects. Coherent linking, though topic-shift within paragraph may be limited. Grammar generally accurate for familiar language.
- B2: Can write clear, detailed text on a wide range of subjects. Can argue a case, evaluate ideas and provide supporting details. Good grammatical control despite occasional slips.
- C1: Can write clear, well-structured text on complex subjects with controlled use of organisational patterns, connectors and cohesive devices. Wide, accurate vocabulary. Errors are rare and don't obscure meaning.

CALIBRATION RULES:
- Under length (< minWords) caps the placement one level below the intended prompt level.
- A truly off-topic response caps at A1.
- Do NOT anchor to promptLevel. Place based on the response ITSELF. promptLevel is context so you understand what was asked.
- If the response is clearly better than the prompt targeted, place higher (up to C1).
- If it is clearly weaker, place lower (down to A1).

Return ONLY valid JSON. NO markdown fences. Schema:
{
  "placedLevel": "A1" | "A2" | "B1" | "B1+" | "B2" | "C1",
  "rubric": {
    "task":     "<one short sentence about relevance and completeness>",
    "grammar":  "<one sentence about grammatical range and accuracy>",
    "lexis":    "<one sentence about vocabulary range and precision>",
    "cohesion": "<one sentence about organisation and connectors>"
  },
  "feedback":     "<2-3 sentence overall feedback in Spanish>",
  "strengths":    ["<...>", "<...>"],
  "improvements": ["<...>", "<...>"]
}`;
}

function userPrompt(body: GradeReq): string {
  return `PROMPT SHOWN TO STUDENT (targeted at ${body.promptLevel}):
"""
${body.promptText}
"""

STUDENT RESPONSE (${body.wordCount} words, minimum requested: ${body.minWords}):
"""
${body.studentAnswer}
"""

Place this response at the CEFR level that best fits the text itself, using the descriptors above. Return the JSON.`;
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

  if (!body.promptText?.trim() || !body.studentAnswer?.trim()) {
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
        max_tokens: 1200,
        system:     systemPrompt(),
        messages:   [{ role: 'user', content: userPrompt(body) }],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[placement-writing-grader] Claude error:', resp.status, errText);
      return NextResponse.json({ error: 'AI service temporarily unavailable' }, { status: 502 });
    }

    const data = await resp.json();
    const text: string = data?.content?.[0]?.text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[placement-writing-grader] no JSON:', text.slice(0, 300));
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const raw = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      placedLevel: normalizeLevel(raw.placedLevel),
      rubric: {
        task:     String(raw.rubric?.task     ?? ''),
        grammar:  String(raw.rubric?.grammar  ?? ''),
        lexis:    String(raw.rubric?.lexis    ?? ''),
        cohesion: String(raw.rubric?.cohesion ?? ''),
      },
      feedback:     String(raw.feedback ?? ''),
      strengths:    Array.isArray(raw.strengths)    ? raw.strengths.map(String)    : [],
      improvements: Array.isArray(raw.improvements) ? raw.improvements.map(String) : [],
    });
  } catch (err) {
    console.error('[placement-writing-grader] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
