// FriendlyTeaching.cl — TOEFL Speaking Independent task grader
// POST /api/ai-grade-toefl-speaking
// Body: { prompt, transcript, durationSec }
// Returns: { rawScore04, feedback, rubric: {delivery, languageUse, topicDevelopment} }
//
// Score 0-4 per task, per the official TOEFL Speaking rubric. Section-wide
// scaling from raw sum → 0-30 happens on the client after all 4 tasks.

import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6';

interface GradeReq {
  prompt:      string;
  transcript:  string;
  durationSec: number;
}

function buildSystemPrompt(): string {
  return `You are a certified TOEFL iBT rater grading an Independent Speaking response. Use the OFFICIAL public ETS rubric.

SCALE: 0-4 whole scores.
  4 = Fully successful: sustained, coherent, well-developed response. Effective use of grammar and vocabulary. Fluid delivery with only minor lapses.
  3 = Generally successful: response addresses the task with mostly clear expression. Some limitations in fluency, vocabulary or grammar do not seriously interfere with meaning.
  2 = Partially successful: response addresses the task but development is limited or unclear. Noticeable problems with vocabulary or grammar affect clarity.
  1 = Barely addresses task: very limited content, meaning obscured by frequent errors or fragmented delivery.
  0 = Not attempted, off-topic, in another language, or completely unintelligible.

CALIBRATION NOTES:
- Only the transcript is available to you. Assume delivery is reasonable unless the transcript clearly reflects repeated false starts, filler words, or extreme brevity.
- A response under ~40 words for a 45-second task typically indicates struggle → score at most 2.
- A response over ~80 words that stays on-topic and shows range → potential 4.
- Grammar errors that don't obscure meaning should not cap the score below 3.

FEEDBACK LANGUAGE: Spanish (español).

Return ONLY valid JSON. Schema:
{
  "rawScore04": <integer 0-4>,
  "rubric": {
    "delivery":         <integer 0-4>,   // fluency, pacing (inferred from transcript density)
    "languageUse":      <integer 0-4>,   // grammar, vocabulary, sentence variety
    "topicDevelopment": <integer 0-4>    // relevance, completeness, coherence
  },
  "feedback": "<2-3 sentence feedback in Spanish>",
  "strengths": ["<...>", "<...>"],
  "improvements": ["<...>", "<...>"]
}`;
}

function buildUserPrompt(body: GradeReq): string {
  return `PROMPT SHOWN TO STUDENT:
"""
${body.prompt}
"""

STUDENT TRANSCRIPT (from Whisper, ${body.durationSec.toFixed(1)}s of audio, ~${body.transcript.split(/\s+/).filter(Boolean).length} words):
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

  if (!body.prompt?.trim() || !body.transcript?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
        system:     buildSystemPrompt(),
        messages:   [{ role: 'user', content: buildUserPrompt(body) }],
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
    return NextResponse.json({
      rawScore04: clampInt(raw.rawScore04, 0, 4),
      rubric: {
        delivery:         clampInt(raw.rubric?.delivery,         0, 4),
        languageUse:      clampInt(raw.rubric?.languageUse,      0, 4),
        topicDevelopment: clampInt(raw.rubric?.topicDevelopment, 0, 4),
      },
      feedback:     String(raw.feedback ?? ''),
      strengths:    Array.isArray(raw.strengths)    ? raw.strengths.map(String)    : [],
      improvements: Array.isArray(raw.improvements) ? raw.improvements.map(String) : [],
    });
  } catch (err) {
    console.error('[toefl-speaking-grader] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
