// FriendlyTeaching.cl — TOEFL Speaking grading pipeline
//
// Runs the same Whisper → Claude flow the live mock uses, packaged so both
// the live mock runner and the assigned-mock student flow can call it. Also
// used by the teacher's assignment panel when re-triggering a failed grade.
//
// Design notes:
// - Empty audioUrl means "skipped by student" → score 0 without hitting APIs.
// - We enrich each recording with transcript + rubric + feedback (+ aiError
//   on failure) so the teacher can see what happened per-task.
// - Progress is reported via an optional callback so UIs can render a
//   per-task status list without duplicating the loop.

import type { SpeakingRecording, TOEFLSpeakingPrompt } from '@/types/toefl';
import { speakingRawToScaled } from '@/types/toefl';

export type SpeakingTaskProgressStatus =
  | 'pending' | 'transcribing' | 'grading' | 'done' | 'error' | 'skipped';

export interface SpeakingTaskProgress {
  promptId: string;
  status:   SpeakingTaskProgressStatus;
  message?: string;
}

export interface GradeSpeakingResult {
  enriched:     SpeakingRecording[];
  overallScore: number;   // 0-30
}

export async function gradeSpeakingRecordings(
  recordings: SpeakingRecording[],
  prompts:    TOEFLSpeakingPrompt[],
  onProgress?: (progress: SpeakingTaskProgress[]) => void,
): Promise<GradeSpeakingResult> {
  const progress: SpeakingTaskProgress[] = recordings.map(r => ({ promptId: r.promptId, status: 'pending' }));
  onProgress?.(progress);

  const enriched: SpeakingRecording[] = [];
  const rawScores: number[] = [];

  for (let i = 0; i < recordings.length; i++) {
    const rec = recordings[i];
    const prompt = prompts.find(p => p.id === rec.promptId);
    if (!prompt) { enriched.push(rec); continue; }

    if (!rec.audioUrl) {
      rawScores.push(0);
      enriched.push({ ...rec, aiScore: 0, aiFeedback: 'Task saltada por el estudiante.' });
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
          ...rec, transcript: '', aiScore: 0,
          aiFeedback: 'No se detectó voz en el audio grabado. Revisá el micrófono.',
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
        body:    JSON.stringify({ prompt: prompt.prompt, transcript, durationSec: rec.durationSec }),
      });
      const gJson = await gRes.json().catch(() => ({}));
      if (!gRes.ok) throw new Error(`Grade ${gRes.status}: ${gJson?.error ?? 'sin respuesta'}`);

      const rawScore = Number(gJson.rawScore04 ?? 0);
      rawScores.push(rawScore);
      enriched.push({
        ...rec, transcript,
        aiScore:        rawScore,
        aiFeedback:     String(gJson.feedback ?? ''),
        aiRubric:       gJson.rubric,
        aiStrengths:    Array.isArray(gJson.strengths)    ? gJson.strengths    : undefined,
        aiImprovements: Array.isArray(gJson.improvements) ? gJson.improvements : undefined,
      });
      progress[i] = { ...progress[i], status: 'done', message: `Score ${rawScore}/4` };
      onProgress?.(progress);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[grade-speaking] task err:', msg);
      rawScores.push(0);
      enriched.push({
        ...rec, aiScore: 0,
        aiFeedback: `Error al calificar: ${msg}`,
        aiError:    msg,
      });
      progress[i] = { ...progress[i], status: 'error', message: msg };
      onProgress?.(progress);
    }
  }

  while (rawScores.length < prompts.length) rawScores.push(0);
  const overallScore = speakingRawToScaled(rawScores);

  return { enriched, overallScore };
}
