// FriendlyTeaching.cl — IELTS Writing grader
// POST /api/ai-grade-ielts-writing
// Body: { version, task, essayType?, letterTone?, prompt, studentAnswer, wordCount }
// Returns: WritingGradeResult (see src/types/ielts-writing.ts)

import { NextRequest, NextResponse } from 'next/server';
import type { WritingGradeResult, IELTSVersion, IELTSLetterTone, IELTSBand } from '@/types/ielts-writing';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6';

interface GradeReqBody {
  version:       IELTSVersion;
  task:          1 | 2;
  taskId:        string;
  essayType?:    string;             // T2
  letterTone?:   IELTSLetterTone;    // GT T1
  prompt:        string;
  studentAnswer: string;
  wordCount:     number;
  minWords:      number;
}

function buildSystemPrompt(body: GradeReqBody): string {
  const taskLabel =
    body.task === 2 ? 'Task 2 essay'
    : body.version === 'academic' ? 'Academic Task 1 report'
    : `General Training Task 1 letter (${body.letterTone ?? 'formal'} tone)`;

  const criterionKey = body.task === 1 ? 'Task Achievement' : 'Task Response';

  return `You are a certified IELTS examiner grading a ${taskLabel}. Apply the OFFICIAL public band descriptors — do not invent your own criteria.

BAND SCALE: whole and half bands from 0.0 to 9.0 (e.g. 5, 5.5, 6, 6.5, 7).
FOUR CRITERIA (each scored independently, then averaged and rounded to the nearest 0.5 for the overall band):
  1) ${criterionKey}
  2) Coherence and Cohesion
  3) Lexical Resource
  4) Grammatical Range and Accuracy

CALIBRATION ANCHORS (public descriptors, condensed):
- Band 5: limited response, noticeable errors that sometimes impede meaning, limited range.
- Band 6: addresses the task but coverage may be uneven; generally coherent; some errors but meaning clear; adequate lexis with occasional inaccuracy.
- Band 7: covers the task with clear position/overview; well organised with a range of cohesive devices; flexible lexis with occasional error; mix of complex structures with mostly error-free sentences.
- Band 8: fully addresses all parts; well managed paragraphing; wide range of lexis used naturally with rare errors; wide range of structures, majority error-free.
- Band 9: fully developed response, cohesion attracts no attention, wide and precise lexis, wide and fully accurate grammar.

TASK-SPECIFIC RULES:
${body.task === 1 && body.version === 'academic' ? `- Academic T1: must include an overview of main trends/features (no overview = ceiling of band 5 for TA).
- Must select and compare key features accurately. Must not describe every detail.
- Data must be accurate; misrepresenting figures caps TA at band 5.` : ''}
${body.task === 1 && body.version === 'general-training' ? `- GT T1 letter: must address ALL bullet points. Missing a bullet caps TA at band 5.
- Tone must match the situation (${body.letterTone ?? 'formal'}). Mismatched tone caps TA at band 6.
- Must include appropriate greeting/sign-off for the tone.` : ''}
${body.task === 2 ? `- T2 essay: must present a clear position/answer throughout, with relevant supported ideas.
- Under-length responses (< 250 words) get a Task Response penalty.
- Fully off-topic or memorised responses cap all criteria at band 4.` : ''}

LENGTH: student wrote ${body.wordCount} words (minimum ${body.minWords}). If below minimum, apply the standard IELTS under-length penalty to the task criterion.

FEEDBACK LANGUAGE: Spanish (español), with English quotes when referencing the student's text.

Return ONLY valid JSON matching this schema. NO markdown code fences. NO commentary.
{
  "overallBand": <number, half-band 0-9>,
  "taskAchievement":   { "band": <number>, "summary": "<2 sentences in Spanish>", "strengths": ["<...>", "<...>"], "improvements": ["<...>", "<...>"] },
  "coherenceCohesion": { "band": <number>, "summary": "<2 sentences>", "strengths": [...], "improvements": [...] },
  "lexicalResource":   { "band": <number>, "summary": "<2 sentences>", "strengths": [...], "improvements": [...] },
  "grammarAccuracy":   { "band": <number>, "summary": "<2 sentences>", "strengths": [...], "improvements": [...] },
  "correctedVersion":  "<the student's text rewritten to band 8+, preserving their ideas and structure>",
  "keyErrors":         ["<Error type — 'incorrect' → 'correct' (short explanation in Spanish)>", ...]
}`;
}

function buildUserPrompt(body: GradeReqBody): string {
  return `PROMPT SHOWN TO STUDENT:
"""
${body.prompt}
"""

STUDENT RESPONSE (${body.wordCount} words):
"""
${body.studentAnswer}
"""

Grade this response according to the official IELTS band descriptors and return your assessment as JSON.`;
}

function clampBand(n: unknown): IELTSBand {
  const num = typeof n === 'number' ? n : parseFloat(String(n));
  if (!isFinite(num)) return 0;
  const rounded = Math.round(num * 2) / 2;
  const clamped = Math.max(0, Math.min(9, rounded));
  return clamped as IELTSBand;
}

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'AI grading not configured. Set ANTHROPIC_API_KEY.' },
      { status: 503 },
    );
  }

  let body: GradeReqBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.version || !body.task || !body.prompt?.trim() || !body.studentAnswer?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

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
        max_tokens: 3000,
        system: buildSystemPrompt(body),
        messages: [{ role: 'user', content: buildUserPrompt(body) }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[ielts-writing-grader] Claude API error:', response.status, errText);
      return NextResponse.json({ error: 'AI service temporarily unavailable' }, { status: 502 });
    }

    const data = await response.json();
    const text: string = data?.content?.[0]?.text ?? '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[ielts-writing-grader] no JSON in response:', text.slice(0, 300));
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const raw = JSON.parse(jsonMatch[0]);

    const result: WritingGradeResult = {
      taskId:            body.taskId,
      version:           body.version,
      task:              body.task,
      wordCount:         body.wordCount,
      overallBand:       clampBand(raw.overallBand),
      taskAchievement:   {
        band:         clampBand(raw.taskAchievement?.band),
        summary:      String(raw.taskAchievement?.summary ?? ''),
        strengths:    Array.isArray(raw.taskAchievement?.strengths) ? raw.taskAchievement.strengths.map(String) : [],
        improvements: Array.isArray(raw.taskAchievement?.improvements) ? raw.taskAchievement.improvements.map(String) : [],
      },
      coherenceCohesion: {
        band:         clampBand(raw.coherenceCohesion?.band),
        summary:      String(raw.coherenceCohesion?.summary ?? ''),
        strengths:    Array.isArray(raw.coherenceCohesion?.strengths) ? raw.coherenceCohesion.strengths.map(String) : [],
        improvements: Array.isArray(raw.coherenceCohesion?.improvements) ? raw.coherenceCohesion.improvements.map(String) : [],
      },
      lexicalResource:   {
        band:         clampBand(raw.lexicalResource?.band),
        summary:      String(raw.lexicalResource?.summary ?? ''),
        strengths:    Array.isArray(raw.lexicalResource?.strengths) ? raw.lexicalResource.strengths.map(String) : [],
        improvements: Array.isArray(raw.lexicalResource?.improvements) ? raw.lexicalResource.improvements.map(String) : [],
      },
      grammarAccuracy:   {
        band:         clampBand(raw.grammarAccuracy?.band),
        summary:      String(raw.grammarAccuracy?.summary ?? ''),
        strengths:    Array.isArray(raw.grammarAccuracy?.strengths) ? raw.grammarAccuracy.strengths.map(String) : [],
        improvements: Array.isArray(raw.grammarAccuracy?.improvements) ? raw.grammarAccuracy.improvements.map(String) : [],
      },
      correctedVersion:  String(raw.correctedVersion ?? ''),
      keyErrors:         Array.isArray(raw.keyErrors) ? raw.keyErrors.map(String) : [],
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('[ielts-writing-grader] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
