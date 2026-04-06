// FriendlyTeaching.cl — AI Lesson Generator API Route
// Uses Claude API to generate complete lessons from topic + level + objectives.
// POST /api/ai-lesson
// Body: { topic, level, objectives?, duration?, slideCount?, language?, includeHomework? }
// Returns: { title, code, slides[], homeworkSuggestion? }

import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-20250514';

export interface AILessonRequest {
  topic: string;              // e.g. "Present Perfect vs Past Simple"
  level: string;              // CEFR: A1-C1
  objectives?: string;        // Optional learning objectives
  duration?: number;          // Minutes (30, 45, 60, 90)
  slideCount?: number;        // Target number of slides (8-20)
  language?: 'en' | 'es';     // Content language (lesson is always in English, UI in this lang)
  includeHomework?: boolean;  // Generate homework suggestion
  focusSkills?: string[];     // e.g. ['speaking', 'grammar', 'vocabulary']
}

export interface AILessonSlide {
  type: string;
  phase: 'pre' | 'while' | 'post';
  title: string;
  subtitle?: string;
  content?: string;
  teacherNotes?: string;
  tips?: string;
  question?: string;
  options?: { id: string; text: string; isCorrect?: boolean }[];
  correctAnswer?: string;
  words?: { word: string; translation: string; pronunciation?: string; example?: string }[];
  tableHeaders?: string[];
  tableRows?: { col1: string; col2: string; col3?: string; col4?: string }[];
  pairs?: { left: string; right: string }[];
  blanks?: string[];
  prompt?: string;
}

export interface AILessonResponse {
  title: string;
  code: string;
  level: string;
  duration: number;
  objectives: string[];
  slides: AILessonSlide[];
  homeworkSuggestion?: {
    title: string;
    description: string;
    slides: AILessonSlide[];
  };
}

function buildSystemPrompt(): string {
  return `You are an expert ESL/EFL curriculum designer for the FriendlyTeaching platform.

You create complete, ready-to-teach English lessons with interactive slides.

AVAILABLE SLIDE TYPES:
- "cover": Title slide (use for lesson intro). Fields: title, subtitle
- "free_text": Reading/explanation. Fields: title, content (markdown OK), teacherNotes
- "vocabulary": Word list. Fields: title, words[{word, translation, pronunciation?, example?}], teacherNotes
- "grammar_table": Grammar rules/patterns. Fields: title, tableHeaders[], tableRows[{col1, col2, col3?, col4?}], teacherNotes
- "multiple_choice": Quiz question. Fields: title, question, options[{id:"a"|"b"|"c"|"d", text, isCorrect}], correctAnswer, teacherNotes
- "true_false": True/false question. Fields: title, question, correctAnswer ("true" or "false"), teacherNotes
- "matching": Match pairs. Fields: title, pairs[{left, right}], teacherNotes
- "drag_drop": Order/categorize words. Fields: title, question, blanks[], correctAnswer, teacherNotes
- "selection": Choose correct option per prompt. Fields: title, content (pipe-separated prompts with options), correctAnswer, teacherNotes
- "writing_prompt": Open writing task. Fields: title, prompt, tips, teacherNotes
- "speaking": Speaking activity. Fields: title, prompt, tips, teacherNotes
- "cloze_test": Fill-in-the-blank. Fields: title, content (use {{blank}} markers), blanks[] (options per blank), correctAnswer (pipe-separated answers)
- "sorting": Categorize items. Fields: title, tableHeaders[] (category names), blanks[] (items to sort), correctAnswer (pipe-separated category indices)

LESSON STRUCTURE:
1. PRE phase (warm-up): 1-2 slides to activate prior knowledge
2. WHILE phase (main): Core teaching content — vocabulary, grammar, practice
3. POST phase (production): Free practice, writing/speaking activities, review

QUALITY RULES:
- Every interactive slide MUST have teacherNotes with answer explanations and teaching tips
- Vocabulary slides should have 4-8 words with translations to Spanish
- Grammar tables should be clear and well-organized
- Multiple choice questions need 4 options with exactly 1 correct
- Calibrate difficulty to the CEFR level
- Include a mix of receptive (reading) and productive (writing/speaking) activities
- Keep teacher notes practical: "Ask students to...", "Elicit...", "Monitor for..."

Return ONLY valid JSON matching the AILessonResponse schema. No markdown fences.`;
}

function buildUserPrompt(req: AILessonRequest): string {
  const slideCount = req.slideCount ?? 12;
  const duration = req.duration ?? 60;
  const skills = req.focusSkills?.join(', ') ?? 'grammar, vocabulary, speaking';

  let prompt = `Generate a complete ${duration}-minute English lesson:\n\n`;
  prompt += `TOPIC: ${req.topic}\n`;
  prompt += `LEVEL: ${req.level} (CEFR)\n`;
  prompt += `TARGET SLIDES: ${slideCount}\n`;
  prompt += `FOCUS SKILLS: ${skills}\n`;

  if (req.objectives) {
    prompt += `OBJECTIVES: ${req.objectives}\n`;
  }

  prompt += `\nGenerate a lesson with approximately ${slideCount} slides following the PRE/WHILE/POST structure.\n`;
  prompt += `Include: 1 cover, 1-2 vocabulary, 1 grammar table, 3-4 interactive exercises (multiple_choice, true_false, matching, cloze_test, drag_drop), 1 writing_prompt or speaking activity.\n`;
  prompt += `Generate a unique lesson code like "AI.${req.level}.${Math.floor(Math.random() * 900) + 100}".\n`;

  if (req.includeHomework) {
    prompt += `\nAlso generate a homework suggestion with 3-5 interactive slides for self-study.\n`;
  }

  prompt += `\nReturn the complete lesson as JSON.`;
  return prompt;
}

export async function POST(request: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'AI lesson generation not configured. Set ANTHROPIC_API_KEY in environment variables.' },
      { status: 503 },
    );
  }

  let body: AILessonRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.topic?.trim() || !body.level?.trim()) {
    return NextResponse.json({ error: 'Missing required fields: topic, level' }, { status: 400 });
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
        max_tokens: 8192,
        system: buildSystemPrompt(),
        messages: [
          { role: 'user', content: buildUserPrompt(body) },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      return NextResponse.json({ error: 'AI service temporarily unavailable' }, { status: 502 });
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text ?? '';

    // Parse JSON (handle potential markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to parse AI lesson response:', text.slice(0, 500));
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const result: AILessonResponse = JSON.parse(jsonMatch[0]);

    // Validate minimum structure
    if (!result.slides || result.slides.length === 0) {
      return NextResponse.json({ error: 'AI generated an empty lesson' }, { status: 500 });
    }

    // Ensure all slides have required fields
    result.slides = result.slides.map((slide, i) => ({
      ...slide,
      phase: slide.phase ?? (i === 0 ? 'pre' : i < result.slides.length - 2 ? 'while' : 'post'),
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error('AI lesson generation error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
