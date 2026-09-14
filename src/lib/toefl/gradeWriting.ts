// FriendlyTeaching.cl — TOEFL Writing grading pipeline
//
// Packaged so the live full-mock runner, the async assignment flow, and the
// teacher's retry-grade button all call the same code path.
//
// After the Writing section grew to three sub-tasks (Build a Sentence,
// Write an Email, Academic Discussion), this module composes them:
//   • BAS is graded locally by the client (exact-string match), so the
//     grader only needs to compute the pct-correct.
//   • Email + AD each hit /api/ai-grade-toefl-writing with their own
//     prompt shape.
// The final 0-30 section score is a weighted sum via
// writingSectionRawToScaled.

import type {
  WritingSubmission, EmailSubmission, WritingSectionSubmission,
  TOEFLWritingPrompt, TOEFLEmailPrompt, TOEFLWritingSequence,
} from '@/types/toefl';
import { writingSectionRawToScaled } from '@/types/toefl';

/** Legacy writing submissions stored before the BAS + Email tasks landed
 *  are just a WritingSubmission (the AD). Lift them into the composite
 *  shape so the breakdown UI can render them without null-checks. Passes
 *  through anything that already has the new shape. */
export function upgradeWritingSubmission(
  sub: WritingSectionSubmission | WritingSubmission | null | undefined,
): WritingSectionSubmission | null {
  if (!sub) return null;
  // New shape has `discussion`; legacy has `text`.
  if ('discussion' in sub && 'buildSentence' in sub && 'email' in sub) {
    return sub;
  }
  const legacy = sub as WritingSubmission;
  return {
    buildSentence: [],
    email:         { promptId: '', text: '', wordCount: 0 },
    discussion:    legacy,
  };
}

// ── Legacy single-task grader (kept for backward compat) ───────────────

export interface GradeWritingResult {
  enriched:     WritingSubmission;
  sectionScore: number;   // 0-30
}

export async function gradeWritingSubmission(
  submission: WritingSubmission,
  prompt:     TOEFLWritingPrompt,
): Promise<GradeWritingResult> {
  const enriched = await gradeDiscussion(submission, prompt);
  return {
    enriched,
    sectionScore: Math.round(((enriched.aiScore ?? 0) / 5) * 30),
  };
}

// ── Composite grader — used by the writing-section flow ────────────────

export interface GradeWritingSectionResult {
  enriched:     WritingSectionSubmission;
  sectionScore: number;   // 0-30
}

export async function gradeWritingSection(
  submission: WritingSectionSubmission,
  seq:        TOEFLWritingSequence,
): Promise<GradeWritingSectionResult> {
  // BAS is client-graded already; recount to be safe against tampering.
  const basTotal   = seq.buildSentence.length;
  const basCorrect = submission.buildSentence.filter(a => a.correct).length;
  const basPct     = basTotal > 0 ? basCorrect / basTotal : 0;

  // Email + AD in parallel — independent AI calls.
  const [emailEnriched, adEnriched] = await Promise.all([
    gradeEmail(submission.email, seq.email).catch(err => ({
      ...submission.email,
      aiError: err instanceof Error ? err.message : String(err),
    } satisfies EmailSubmission)),
    gradeDiscussion(submission.discussion, seq.discussion).catch(err => ({
      ...submission.discussion,
      aiError: err instanceof Error ? err.message : String(err),
    } satisfies WritingSubmission)),
  ]);

  const sectionScore = writingSectionRawToScaled({
    basCorrectPct: basPct,
    emailRaw05:    emailEnriched.aiScore ?? 0,
    adRaw05:       adEnriched.aiScore ?? 0,
  });

  return {
    enriched: {
      buildSentence: submission.buildSentence,
      email:         emailEnriched,
      discussion:    adEnriched,
    },
    sectionScore,
  };
}

// ── Sub-task graders (private) ─────────────────────────────────────────

async function gradeDiscussion(
  submission: WritingSubmission,
  prompt:     TOEFLWritingPrompt,
): Promise<WritingSubmission> {
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
      taskType:      'academic-discussion',
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Grade ${res.status}: ${json?.error ?? 'sin respuesta'}`);

  return {
    ...submission,
    aiScore:        Number(json.rawScore05 ?? 0),
    aiFeedback:     String(json.feedback ?? ''),
    aiRubric:       json.rubric,
    aiStrengths:    Array.isArray(json.strengths)    ? json.strengths.map(String)    : undefined,
    aiImprovements: Array.isArray(json.improvements) ? json.improvements.map(String) : undefined,
  };
}

async function gradeEmail(
  submission: EmailSubmission,
  prompt:     TOEFLEmailPrompt,
): Promise<EmailSubmission> {
  const promptText = [
    `Scenario: ${prompt.scenario}`,
    `\n\nReceived email from: ${prompt.receivedEmail.from}`,
    `\nSubject: ${prompt.receivedEmail.subject}`,
    `\n\n${prompt.receivedEmail.body}`,
    `\n\nTask: ${prompt.taskInstruction}`,
    `\n\nKey points to cover:\n- ${prompt.keyPoints.join('\n- ')}`,
  ].join('');

  const res = await fetch('/api/ai-grade-toefl-writing', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      prompt:        promptText,
      studentAnswer: submission.text,
      wordCount:     submission.wordCount,
      minWords:      prompt.minWords,
      taskType:      'email',
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Grade ${res.status}: ${json?.error ?? 'sin respuesta'}`);

  return {
    ...submission,
    aiScore:        Number(json.rawScore05 ?? 0),
    aiFeedback:     String(json.feedback ?? ''),
    aiRubric:       json.rubric,
    aiStrengths:    Array.isArray(json.strengths)    ? json.strengths.map(String)    : undefined,
    aiImprovements: Array.isArray(json.improvements) ? json.improvements.map(String) : undefined,
  };
}
