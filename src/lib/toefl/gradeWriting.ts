// FriendlyTeaching.cl — TOEFL Writing grading pipeline
//
// Packaged so the live full-mock runner, the async assignment flow, and the
// teacher's retry-grade button all call the same code path. Serialises the
// discussion prompt (professor post + question + both classmates) into the
// single-string format the API expects, and enriches the submission with
// the AI rubric / feedback so the caller can render it directly.

import type { WritingSubmission, TOEFLWritingPrompt } from '@/types/toefl';

export interface GradeWritingResult {
  enriched:     WritingSubmission;
  sectionScore: number;   // 0-30 (already scaled by the API)
}

export async function gradeWritingSubmission(
  submission: WritingSubmission,
  prompt:     TOEFLWritingPrompt,
): Promise<GradeWritingResult> {
  const promptText = [
    prompt.professorPost,
    `\n\nProfesor: ${prompt.question}`,
    `\n\n${prompt.studentA.name}: ${prompt.studentA.text}`,
    `\n\n${prompt.studentB.name}: ${prompt.studentB.text}`,
  ].join('');

  const res = await fetch('/api/ai-grade-toefl-writing', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      prompt:        promptText,
      studentAnswer: submission.text,
      wordCount:     submission.wordCount,
      minWords:      prompt.minWords,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Grade ${res.status}: ${json?.error ?? 'sin respuesta'}`);

  const enriched: WritingSubmission = {
    ...submission,
    aiScore:        Number(json.rawScore05 ?? 0),
    aiFeedback:     String(json.feedback ?? ''),
    aiRubric:       json.rubric,
    aiStrengths:    Array.isArray(json.strengths)    ? json.strengths.map(String)    : undefined,
    aiImprovements: Array.isArray(json.improvements) ? json.improvements.map(String) : undefined,
  };
  return { enriched, sectionScore: Number(json.sectionScore030 ?? 0) };
}
