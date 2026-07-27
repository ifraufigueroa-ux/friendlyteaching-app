// FriendlyTeaching.cl — TOEFL Writing Task 2 (Academic Discussion) grader
// POST /api/ai-grade-toefl-writing
// Body: { prompt, studentAnswer, wordCount, minWords }
// Returns: { rawScore05, sectionScore030, feedback, rubric: {development, organisation, languageUse} }

import { NextRequest, NextResponse } from 'next/server';
import { writingRawToScaled } from '@/types/toefl';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6';

interface GradeReq {
  prompt:        string;   // full professor post + question + student A + student B (serialised)
  studentAnswer: string;
  wordCount:     number;
  minWords:      number;
}

function buildSystemPrompt(): string {
  return `You are a certified TOEFL iBT rater grading a Writing Task 2 — Academic Discussion (the 2023+ format). Use the OFFICIAL public ETS rubric for this task.

SCALE: 0-5 whole scores (no half points).
  5 = Fully successful contribution: clear, well-supported opinion, direct engagement with the discussion (agreeing / disagreeing / extending a classmate), consistent facility with grammar and vocabulary.
  4 = Successful: clear position, relevant explanation, mostly natural language use, minor errors that do not obscure meaning.
  3 = Partially successful: relevant contribution, ideas may be underdeveloped or repetitive, some errors that occasionally interfere with clarity.
  2 = Largely unsuccessful: limited elaboration, vague or off-topic in places, frequent language errors.
  1 = Not successful: little to no engagement with the prompt, incoherent, pervasive errors.
  0 = Off-topic, in another language, or blank.

CALIBRATION NOTES:
- The task asks the student to CONTRIBUTE to a discussion, not to write a full essay. A good response is roughly 100-200 words.
- A response should ideally reference or engage with the classmates' views (either directly or by adding a new angle).
- Under length (< 100 words) caps the score at 3.
- Purely copied classmate text with no new content caps at 1.
- Off-topic (didn't address the professor's question) → 0 or 1.

FEEDBACK LANGUAGE: Spanish (español), with brief English quotes when referencing the student's text.

Return ONLY valid JSON. NO markdown fences. NO commentary. Schema:
{
  "rawScore05": <integer 0-5>,
  "rubric": {
    "development":  <integer 0-5>,   // depth of the argument, engagement with the discussion
    "organisation": <integer 0-5>,   // logical flow, cohesion, paragraph structure
    "languageUse":  <integer 0-5>    // grammar, vocabulary, sentence variety
  },
  "feedback": "<3-4 sentence overall feedback in Spanish>",
  "strengths": ["<...>", "<...>"],
  "improvements": ["<...>", "<...>"]
}`;
}

function buildUserPrompt(body: GradeReq): string {
  return `TASK CONTEXT (professor post + classmates' comments):
"""
${body.prompt}
"""

STUDENT RESPONSE (${body.wordCount} words):
"""
${body.studentAnswer}
"""

Rate this response against the TOEFL Writing Task 2 rubric and return your assessment as JSON.`;
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

  if (!body.prompt?.trim() || !body.studentAnswer?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      CLAUDE_MODEL,
        max_tokens: 1500,
        system:     buildSystemPrompt(),
        messages:   [{ role: 'user', content: buildUserPrompt(body) }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[toefl-writing-grader] Claude API error:', response.status, errText);
      return NextResponse.json({ error: 'AI service temporarily unavailable' }, { status: 502 });
    }

    const data = await response.json();
    const text: string = data?.content?.[0]?.text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[toefl-writing-grader] no JSON in response:', text.slice(0, 300));
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const raw = JSON.parse(jsonMatch[0]);
    const rawScore = clampInt(raw.rawScore05, 0, 5);

    return NextResponse.json({
      rawScore05:      rawScore,
      sectionScore030: writingRawToScaled(rawScore),
      rubric: {
        development:  clampInt(raw.rubric?.development,  0, 5),
        organisation: clampInt(raw.rubric?.organisation, 0, 5),
        languageUse:  clampInt(raw.rubric?.languageUse,  0, 5),
      },
      feedback:     String(raw.feedback ?? ''),
      strengths:    Array.isArray(raw.strengths)    ? raw.strengths.map(String)    : [],
      improvements: Array.isArray(raw.improvements) ? raw.improvements.map(String) : [],
    });
  } catch (err) {
    console.error('[toefl-writing-grader] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
