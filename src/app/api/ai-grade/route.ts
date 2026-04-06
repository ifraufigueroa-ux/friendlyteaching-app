// FriendlyTeaching.cl — AI Grading API Route
// Uses Claude API to grade writing prompts and speaking transcriptions.
// POST /api/ai-grade
// Body: { slideType, studentAnswer, prompt, rubric?, level?, language? }
// Returns: { score7, feedback, strengths, improvements, correctedVersion? }

import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-20250514';

export interface AIGradeRequest {
  slideType: 'writing_prompt' | 'speaking';
  studentAnswer: string;
  prompt: string;           // The original question/prompt shown to the student
  rubric?: string;          // Optional teacher-defined rubric
  level?: string;           // CEFR level (A1-C1) for calibrated feedback
  language?: 'en' | 'es';   // Feedback language
}

export interface AIGradeResponse {
  score7: number;           // 1-7 FriendlyTeaching scale
  feedback: string;         // Overall feedback paragraph
  strengths: string[];      // What the student did well
  improvements: string[];   // Areas to improve
  correctedVersion?: string; // For writing: corrected text with fixes
  grammarErrors?: string[]; // Specific grammar issues found
}

function buildSystemPrompt(level: string, language: string): string {
  const lang = language === 'es' ? 'español' : 'English';
  return `You are an expert ESL/EFL teacher evaluating a student's work on the FriendlyTeaching platform.

STUDENT LEVEL: ${level} (CEFR scale)
RESPOND IN: ${lang}

SCORING SCALE (1-7):
1 = No attempt or incomprehensible
2 = Major errors, barely addresses the prompt
3 = Significant errors, partially addresses the prompt
4 = Some errors, addresses the prompt adequately
5 = Minor errors, good response to the prompt
6 = Very few errors, strong response
7 = Near-perfect, excellent command of language

CALIBRATE your expectations to the student's CEFR level. A B1 student writing simple sentences correctly deserves a higher score than a C1 student doing the same.

Return ONLY valid JSON matching this schema:
{
  "score7": <number 1-7>,
  "feedback": "<2-3 sentence overall feedback>",
  "strengths": ["<strength1>", "<strength2>"],
  "improvements": ["<improvement1>", "<improvement2>"],
  "correctedVersion": "<corrected text if writing_prompt, null if speaking>",
  "grammarErrors": ["<error1: explanation>", "<error2: explanation>"]
}`;
}

function buildUserPrompt(req: AIGradeRequest): string {
  let prompt = `TASK TYPE: ${req.slideType === 'writing_prompt' ? 'Written Response' : 'Speaking Transcription'}\n\n`;
  prompt += `PROMPT GIVEN TO STUDENT:\n"${req.prompt}"\n\n`;
  if (req.rubric) {
    prompt += `TEACHER'S RUBRIC/CRITERIA:\n${req.rubric}\n\n`;
  }
  prompt += `STUDENT'S RESPONSE:\n"${req.studentAnswer}"\n\n`;
  prompt += `Please evaluate this response and return your assessment as JSON.`;
  return prompt;
}

export async function POST(request: NextRequest) {
  // Check API key
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'AI grading not configured. Set ANTHROPIC_API_KEY in environment variables.' },
      { status: 503 },
    );
  }

  let body: AIGradeRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { slideType, studentAnswer, prompt } = body;
  if (!slideType || !studentAnswer?.trim() || !prompt?.trim()) {
    return NextResponse.json({ error: 'Missing required fields: slideType, studentAnswer, prompt' }, { status: 400 });
  }

  if (slideType !== 'writing_prompt' && slideType !== 'speaking') {
    return NextResponse.json({ error: 'slideType must be "writing_prompt" or "speaking"' }, { status: 400 });
  }

  const level = body.level ?? 'B1';
  const language = body.language ?? 'es';

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
        max_tokens: 1024,
        system: buildSystemPrompt(level, language),
        messages: [
          { role: 'user', content: buildUserPrompt(body) },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'AI service temporarily unavailable' },
        { status: 502 },
      );
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text ?? '';

    // Parse JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to parse AI response:', text);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const result: AIGradeResponse = JSON.parse(jsonMatch[0]);

    // Validate score range
    result.score7 = Math.max(1, Math.min(7, Math.round(result.score7)));

    return NextResponse.json(result);
  } catch (err) {
    console.error('AI grading error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
