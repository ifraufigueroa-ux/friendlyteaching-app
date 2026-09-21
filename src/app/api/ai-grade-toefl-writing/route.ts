// FriendlyTeaching.cl — TOEFL Writing grader (Email + Academic Discussion)
// POST /api/ai-grade-toefl-writing
// Body: { prompt, studentAnswer, wordCount, minWords, taskType? }
// Returns: { rawScore05, sectionScore030, feedback, rubric }
//
// taskType 'academic-discussion' (default, legacy) → rubric with
// {development, organisation, languageUse}. 'email' → rubric with
// {taskResponse, organisation, languageUse}. Callers should pass the
// correct taskType so the AI uses the right rating scale; behavior is
// identical wire-shape wise (same JSON keys) so the caller can just
// spread the rubric.

import { NextRequest, NextResponse } from 'next/server';
import { writingRawToScaled } from '@/types/toefl';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6';

type WritingTaskType = 'academic-discussion' | 'email';

interface GradeReq {
  prompt:        string;   // Serialised task context (varies by taskType)
  studentAnswer: string;
  wordCount:     number;
  minWords:      number;
  taskType?:     WritingTaskType;
}

function buildDiscussionSystemPrompt(): string {
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

FEEDBACK LANGUAGE: Spanish — **NEUTRAL LATIN AMERICAN SPANISH ONLY** (usa "tú", NUNCA voseo argentino). Prohibidas formas voseo: "vos", "tenés", "podés", "escuchá", "grabate", "tomate", "revisá", "probá", "elegí", "usá", "hacé", "sabés", "entendés", "decís", "querés", "sos". Usa las formas de "tú" con acentuación estándar. Puedes citar frases cortas en inglés del texto del estudiante.

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

function buildEmailSystemPrompt(): string {
  return `You are a certified TOEFL iBT rater grading a Writing — Write an Email task. Use the OFFICIAL ETS descriptors for email-writing tasks.

SCALE: 0-5 whole scores (no half points).
  5 = Fully successful reply: addresses ALL required points clearly, register matches the received email (formal/neutral), well organised, precise vocabulary and consistent grammar.
  4 = Successful: covers all points, minor register slips or minor errors, mostly natural language use.
  3 = Partially successful: covers most points but one is thin or missed, some register/organisation issues, some errors that occasionally interfere with clarity.
  2 = Largely unsuccessful: misses one or more required points, register clearly off, frequent language errors.
  1 = Not successful: little engagement with the email, incoherent, pervasive errors.
  0 = Off-topic, in another language, or blank.

CALIBRATION NOTES:
- The reply should mirror the register of the received email (professor → formal; office → neutral formal).
- Missing one required key point caps the score at 3.
- Under length (< 90 words) caps at 3.
- Off-topic reply (didn't address the received email) → 0 or 1.

FEEDBACK LANGUAGE: Spanish — **NEUTRAL LATIN AMERICAN SPANISH ONLY** (usa "tú", NUNCA voseo argentino). Prohibidas formas voseo: "vos", "tenés", "podés", "escuchá", "grabate", "tomate", "revisá", "probá", "elegí", "usá", "hacé", "sabés", "entendés", "decís", "querés", "sos". Usa las formas de "tú" con acentuación estándar. Puedes citar frases cortas en inglés del texto del estudiante.

Return ONLY valid JSON. NO markdown fences. NO commentary. Schema:
{
  "rawScore05": <integer 0-5>,
  "rubric": {
    "taskResponse": <integer 0-5>,   // coverage of the required key points and register match
    "organisation": <integer 0-5>,   // paragraph structure, opening/closing, cohesion
    "languageUse":  <integer 0-5>    // grammar, vocabulary, sentence variety
  },
  "feedback": "<3-4 sentence overall feedback in Spanish>",
  "strengths": ["<...>", "<...>"],
  "improvements": ["<...>", "<...>"]
}`;
}

function buildUserPrompt(body: GradeReq): string {
  const taskType = body.taskType ?? 'academic-discussion';
  const contextLabel = taskType === 'email'
    ? 'TASK CONTEXT (scenario + received email + key points to cover)'
    : "TASK CONTEXT (professor post + classmates' comments)";
  const rubricLine = taskType === 'email'
    ? 'Rate this reply against the TOEFL Writing Email rubric and return your assessment as JSON.'
    : 'Rate this response against the TOEFL Writing Task 2 rubric and return your assessment as JSON.';
  return `${contextLabel}:
"""
${body.prompt}
"""

STUDENT RESPONSE (${body.wordCount} words):
"""
${body.studentAnswer}
"""

${rubricLine}`;
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
        system:     body.taskType === 'email' ? buildEmailSystemPrompt() : buildDiscussionSystemPrompt(),
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

    // Rubric keys differ by taskType. Email → taskResponse; AD → development.
    const rubric = body.taskType === 'email'
      ? {
          taskResponse: clampInt(raw.rubric?.taskResponse, 0, 5),
          organisation: clampInt(raw.rubric?.organisation, 0, 5),
          languageUse:  clampInt(raw.rubric?.languageUse,  0, 5),
        }
      : {
          development:  clampInt(raw.rubric?.development,  0, 5),
          organisation: clampInt(raw.rubric?.organisation, 0, 5),
          languageUse:  clampInt(raw.rubric?.languageUse,  0, 5),
        };

    return NextResponse.json({
      rawScore05:      rawScore,
      sectionScore030: writingRawToScaled(rawScore),
      rubric,
      feedback:        String(raw.feedback ?? ''),
      strengths:       Array.isArray(raw.strengths)    ? raw.strengths.map(String)    : [],
      improvements:    Array.isArray(raw.improvements) ? raw.improvements.map(String) : [],
    });
  } catch (err) {
    console.error('[toefl-writing-grader] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
