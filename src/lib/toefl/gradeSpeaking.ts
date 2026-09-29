// FriendlyTeaching.cl — TOEFL Speaking grading pipeline (ETS 2026)
//
// Runs the same Whisper → Claude flow the live mock uses, packaged so both
// the live mock runner and the assigned-mock student flow can call it. Also
// used by the teacher's assignment panel when re-triggering a failed grade.
//
// ETS 2026 Speaking section: 7 Listen-and-Repeat items + 4 Take-an-Interview
// items (11 total). Each item scored 0-5; the overall raw sum → 1.0-6.0 band
// via speakingRawToScaled.
//
// Design notes:
// - Empty audioUrl means "skipped by student" → score 0 without hitting APIs.
// - We enrich each recording with transcript + rubric + feedback (+ aiError
//   on failure) so the teacher can see what happened per-task.
// - Progress is reported via an optional callback so UIs can render a
//   per-task status list without duplicating the loop.
// - Accepts both the new TOEFLSpeakingSection and the legacy Independent
//   prompt array so historical mocks + the migration period keep working.

import type {
  SpeakingRecording, TOEFLSpeakingPrompt, TOEFLSpeakingSection, TOEFLSpeakingItem,
} from '@/types/toefl';
import { speakingRawToScaled, speakingSectionItems } from '@/types/toefl';

export type SpeakingTaskProgressStatus =
  | 'pending' | 'transcribing' | 'grading' | 'done' | 'error' | 'skipped';

export interface SpeakingTaskProgress {
  promptId: string;
  status:   SpeakingTaskProgressStatus;
  message?: string;
}

export interface GradeSpeakingResult {
  enriched:     SpeakingRecording[];
  overallScore: number;   // 1.0-6.0 in 0.5 steps (ETS 2026 band)
}

export interface GradeSpeakingOptions {
  /** If given, ONLY these prompt IDs are re-graded. Recordings with other
   *  prompt IDs are passed through unchanged (their existing aiScore etc.
   *  are preserved). Used by the teacher "retry failed tasks only" flow so
   *  we don't waste Whisper/Claude calls on tasks that already graded fine. */
  onlyPromptIds?: string[];
}

/** Union of the two shapes callers can pass:
 *   · ETS 2026 section (preferred for new content)
 *   · Legacy Independent Speaking prompt array (pre-2026)
 */
export type SpeakingContent = TOEFLSpeakingSection | TOEFLSpeakingPrompt[];

// Turn a heterogeneous SpeakingContent into a flat lookup table for the loop.
function itemsFromContent(content: SpeakingContent): TOEFLSpeakingItem[] {
  if (Array.isArray(content)) {
    // Legacy Independent prompts don't carry a task-type discriminator, so we
    // map them to a minimal Interview-shaped record just for the grader call.
    return content.map((p): TOEFLSpeakingItem => ({
      id:       p.id,
      type:     'take-an-interview',
      question: p.prompt,
      speakSec: p.speakSec,
    }));
  }
  return speakingSectionItems(content);
}

function graderRequestFor(
  item:  TOEFLSpeakingItem,
  ctx:   { transcript: string; durationSec: number; interviewTopic?: string },
): Record<string, unknown> {
  if (item.type === 'listen-and-repeat') {
    return {
      taskType:       'listen-and-repeat',
      targetSentence: item.targetSentence,
      transcript:     ctx.transcript,
    };
  }
  return {
    taskType:    'take-an-interview',
    topic:       ctx.interviewTopic ?? '',
    question:    item.question,
    transcript:  ctx.transcript,
    durationSec: ctx.durationSec,
  };
}

export async function gradeSpeakingRecordings(
  recordings: SpeakingRecording[],
  content:    SpeakingContent,
  onProgress?: (progress: SpeakingTaskProgress[]) => void,
  options?:   GradeSpeakingOptions,
): Promise<GradeSpeakingResult> {
  const items = itemsFromContent(content);
  const interviewTopic = Array.isArray(content) ? undefined : content.interviewTopic;

  const onlySet = options?.onlyPromptIds ? new Set(options.onlyPromptIds) : null;
  const progress: SpeakingTaskProgress[] = recordings.map(r => ({
    promptId: r.promptId,
    status:   onlySet && !onlySet.has(r.promptId) ? 'done' : 'pending',
  }));
  onProgress?.(progress);

  const enriched: SpeakingRecording[] = [];
  const rawScores: number[] = [];

  for (let i = 0; i < recordings.length; i++) {
    const rec = recordings[i];
    const item = items.find(it => it.id === rec.promptId);
    if (!item) { enriched.push(rec); continue; }

    // Selective retry: keep the existing recording (score, transcript, etc.)
    // and skip the API calls for tasks we weren't asked to re-grade.
    if (onlySet && !onlySet.has(rec.promptId)) {
      rawScores.push(typeof rec.aiScore === 'number' ? rec.aiScore : 0);
      enriched.push(rec);
      continue;
    }

    if (!rec.audioUrl) {
      rawScores.push(0);
      enriched.push({ ...rec, taskType: item.type, aiScore: 0, aiFeedback: 'Task saltada por el estudiante.' });
      progress[i] = { ...progress[i], status: 'skipped' };
      onProgress?.(progress);
      continue;
    }

    try {
      progress[i] = { ...progress[i], status: 'transcribing' };
      onProgress?.(progress);

      const tRes = await fetch('/api/transcribe-speech', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ audioUrl: rec.audioUrl, language: 'en' }),
      });
      const tJson = await tRes.json().catch(() => ({}));
      if (!tRes.ok) throw new Error(`Transcribe ${tRes.status}: ${tJson?.error ?? 'sin respuesta'}`);

      const transcript = String(tJson.text ?? '').trim();
      if (!transcript) {
        rawScores.push(0);
        enriched.push({
          ...rec, taskType: item.type, transcript: '', aiScore: 0,
          aiFeedback: 'No se detectó voz en el audio grabado. Revisa el micrófono.',
          aiError:    'Empty transcript',
        });
        progress[i] = { ...progress[i], status: 'error', message: 'Sin voz detectada' };
        onProgress?.(progress);
        continue;
      }

      progress[i] = { ...progress[i], status: 'grading' };
      onProgress?.(progress);

      const gRes = await fetch('/api/ai-grade-toefl-speaking', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(graderRequestFor(item, {
          transcript,
          durationSec: rec.durationSec,
          interviewTopic,
        })),
      });
      const gJson = await gRes.json().catch(() => ({}));
      if (!gRes.ok) throw new Error(`Grade ${gRes.status}: ${gJson?.error ?? 'sin respuesta'}`);

      const rawScore = Number(gJson.rawScore05 ?? gJson.rawScore04 ?? 0);
      rawScores.push(rawScore);
      // Drop `aiError` from the previous attempt on success — Firestore rejects
      // `undefined` values, so we strip the property with destructuring instead
      // of assigning aiError: undefined.
      const { aiError: _prevErr, ...cleanRec } = rec;
      void _prevErr;
      const nextRec: SpeakingRecording = {
        ...cleanRec,
        taskType:   item.type,
        transcript,
        aiScore:    rawScore,
        aiFeedback: String(gJson.feedback ?? ''),
      };
      // LR is holistic → rubric will be undefined in gJson. TI + legacy carry
      // shape-appropriate rubric objects (Firestore rejects undefined values,
      // so only set when defined).
      if (gJson.rubric) nextRec.aiRubric = gJson.rubric;
      if (Array.isArray(gJson.strengths))    nextRec.aiStrengths    = gJson.strengths;
      if (Array.isArray(gJson.improvements)) nextRec.aiImprovements = gJson.improvements;
      enriched.push(nextRec);
      progress[i] = { ...progress[i], status: 'done', message: `Score ${rawScore}/5` };
      onProgress?.(progress);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[grade-speaking] task err:', msg);
      rawScores.push(0);
      enriched.push({
        ...rec, taskType: item.type,
        aiScore: 0,
        aiFeedback: `Error al calificar: ${msg}`,
        aiError:    msg,
      });
      progress[i] = { ...progress[i], status: 'error', message: msg };
      onProgress?.(progress);
    }
  }

  // Pad missing task scores with 0 so the section band reflects unattempted
  // items honestly (max is items.length * 5).
  while (rawScores.length < items.length) rawScores.push(0);
  const overallScore = speakingRawToScaled(rawScores);

  return { enriched, overallScore };
}
