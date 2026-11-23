// FriendlyTeaching.cl — Pronunciation exercise runner
//
// Student flow:
//   1. Tap "Listen" → ElevenLabs TTS generates the reference phrase (one
//      POST to /api/tts/elevenlabs). Audio is cached per-exercise in a
//      sessionStorage blob URL so a retry doesn't burn another API call.
//   2. Tap "Record" → MediaRecorder starts (webm/opus). Tap "Stop" to
//      finish; the blob gets POSTed to /api/transcribe-speech (Whisper).
//   3. The returned transcript is normalised and compared word-by-word
//      with the target phrase. Each target word renders green or red
//      depending on whether the student hit it; overall % drives the
//      pass/fail verdict that ExerciseRunner reads.
//
// Keeps the heavy work in-browser; the API endpoints are already
// shipped (see src/app/api/transcribe-speech and src/app/api/tts/
// elevenlabs). Falls back to showing a friendly message if the
// browser doesn't expose MediaRecorder.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Mic, Square, RotateCcw, Loader2, Check, X as XIcon } from 'lucide-react';
import type { PronunciationExercise } from '@/types/practice';

type Verdict = 'correct' | 'incorrect' | null;

interface Props {
  ex:      PronunciationExercise;
  verdict: Verdict;
  onGrade: (correct: boolean) => void;
}

// ── Helpers ──────────────────────────────────────────────────

/** Normalise a phrase for scoring: lowercase, strip punctuation,
 *  collapse whitespace, trim common polite fillers. */
function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,!?;:"“”'()\\[\\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenise(s: string): string[] {
  const n = normalise(s);
  return n.length === 0 ? [] : n.split(' ');
}

/** Word-level alignment: for each target word, is there a match in the
 *  transcript? Allows one-word look-ahead so an inserted filler
 *  ("umm") doesn't throw off the rest of the sentence. */
function scorePerWord(target: string[], said: string[]): boolean[] {
  const hits: boolean[] = [];
  let j = 0;
  for (let i = 0; i < target.length; i++) {
    const want = target[i];
    let matched = false;
    // Look at the next up-to-3 said-words starting at j.
    for (let k = j; k < Math.min(said.length, j + 3); k++) {
      if (said[k] === want) {
        matched = true;
        j = k + 1;
        break;
      }
    }
    hits.push(matched);
  }
  return hits;
}

// ── Component ─────────────────────────────────────────────────

export default function PronunciationBody({ ex, verdict, onGrade }: Props) {
  const passRatio = ex.passThreshold ?? 0.75;

  // Reference audio: cached URL per exercise within the session.
  const [refUrl, setRefUrl] = useState<string | null>(null);
  const [loadingRef, setLoadingRef] = useState(false);
  const refAudioRef = useRef<HTMLAudioElement | null>(null);

  // Recording state
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [perWordHits, setPerWordHits] = useState<boolean[]>([]);
  const [accuracyPct, setAccuracyPct] = useState<number | null>(null);
  const [recorderError, setRecorderError] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const targetTokens = tokenise(ex.targetPhrase);

  // Reset everything when exercise changes.
  useEffect(() => {
    setRefUrl(null);
    setRecordedUrl(null);
    setTranscript(null);
    setPerWordHits([]);
    setAccuracyPct(null);
    setRecorderError(null);
  }, [ex.id]);

  const playReference = useCallback(async () => {
    if (loadingRef) return;
    // Cached → just play.
    if (refUrl && refAudioRef.current) {
      refAudioRef.current.currentTime = 0;
      await refAudioRef.current.play().catch(() => undefined);
      return;
    }
    setLoadingRef(true);
    try {
      const res = await fetch('/api/tts/elevenlabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text:    ex.targetPhrase,
          voiceId: ex.voiceId,
        }),
      });
      if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setRefUrl(url);
      // Wait a tick for ref to attach, then play.
      setTimeout(() => {
        refAudioRef.current?.play().catch(() => undefined);
      }, 50);
    } catch (err) {
      console.warn('[PronunciationBody] TTS failed:', err);
      setRecorderError('Could not load the reference audio. Try again.');
    } finally {
      setLoadingRef(false);
    }
  }, [ex.targetPhrase, ex.voiceId, refUrl, loadingRef]);

  const startRecording = useCallback(async () => {
    setRecorderError(null);
    setTranscript(null);
    setPerWordHits([]);
    setAccuracyPct(null);
    setRecordedUrl(null);
    if (typeof window === 'undefined' || !window.MediaRecorder) {
      setRecorderError('Your browser does not support recording. Try Chrome/Edge/Safari.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      mediaRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url  = URL.createObjectURL(blob);
        setRecordedUrl(url);
        stream.getTracks().forEach((t) => t.stop());
        void transcribe(blob);
      };
      rec.start();
      setRecording(true);
    } catch (err) {
      console.warn('[PronunciationBody] mic start failed:', err);
      setRecorderError('Microphone blocked. Allow the site to use the mic and try again.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex.id]);

  const stopRecording = useCallback(() => {
    if (!mediaRef.current) return;
    try { mediaRef.current.stop(); } catch { /* ignore */ }
    setRecording(false);
  }, []);

  const transcribe = useCallback(async (blob: Blob) => {
    setTranscribing(true);
    try {
      const fd = new FormData();
      fd.append('audio',    blob, 'answer.webm');
      fd.append('language', 'en');
      const res = await fetch('/api/transcribe-speech', { method: 'POST', body: fd });
      if (!res.ok) throw new Error(`Whisper failed: ${res.status}`);
      const data = await res.json() as { text?: string };
      const said = tokenise(data.text ?? '');
      setTranscript(data.text ?? '');
      const hits = scorePerWord(targetTokens, said);
      setPerWordHits(hits);
      const pct = targetTokens.length > 0
        ? hits.filter(Boolean).length / targetTokens.length
        : 0;
      setAccuracyPct(Math.round(pct * 100));
      // Emit verdict upward — ExerciseRunner expects onGrade once per
      // attempt. Only grade "correct" if we hit the threshold; the
      // retry button resets local state and the runner can re-grade.
      onGrade(pct >= passRatio);
    } catch (err) {
      console.warn('[PronunciationBody] transcription failed:', err);
      setRecorderError('Could not transcribe your audio. Try recording again.');
    } finally {
      setTranscribing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passRatio, targetTokens.join('|')]);

  const retry = useCallback(() => {
    setTranscript(null);
    setPerWordHits([]);
    setAccuracyPct(null);
    setRecordedUrl(null);
    setRecorderError(null);
  }, []);

  // ── Render ─────────────────────────────────────────────

  const canListen = !recording && !transcribing;
  const canRecord = !recording && !transcribing && verdict === null;

  return (
    <div className="space-y-4">
      {ex.focus && (
        <p className="text-[11px] font-black text-[#9474c4] uppercase tracking-widest">
          {ex.focus}
        </p>
      )}

      {/* Target phrase with per-word colouring once graded */}
      <div className="bg-white rounded-2xl border-2 border-[#e5d9f2] p-5">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
          Say this out loud
        </p>
        <p className="font-fun text-2xl md:text-3xl font-extrabold text-[#4b3869] leading-snug">
          {targetTokens.map((w, i) => {
            const hit = perWordHits[i];
            const cls = hit === undefined
              ? ''
              : hit
                ? 'text-emerald-600'
                : 'text-rose-500 underline decoration-wavy decoration-2 underline-offset-4';
            return <span key={i} className={cls}>{w}{i < targetTokens.length - 1 ? ' ' : ''}</span>;
          })}
        </p>
        {ex.ipa && (
          <p className="text-sm text-slate-500 mt-1 font-mono">/{ex.ipa}/</p>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={playReference}
          disabled={!canListen}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border-2 border-[#e5d9f2] text-[#5A3D7A] text-sm font-bold hover:bg-[#F7EFFF] disabled:opacity-50 transition-colors"
        >
          {loadingRef
            ? <><Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} /> Loading…</>
            : <><Play className="w-4 h-4" strokeWidth={2.5} /> Listen</>}
        </button>

        {!recording ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={!canRecord}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 text-white text-sm font-bold shadow-sm hover:shadow-md disabled:opacity-50 transition-shadow"
          >
            <Mic className="w-4 h-4" strokeWidth={2.5} /> Record
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-slate-900 text-white text-sm font-bold animate-pulse shadow-md"
          >
            <Square className="w-4 h-4 fill-white" strokeWidth={2.5} /> Stop
          </button>
        )}

        {(transcript || recorderError) && (
          <button
            type="button"
            onClick={retry}
            disabled={recording || transcribing}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9474c4] hover:text-[#5A3D7A] px-2 py-1"
          >
            <RotateCcw className="w-3 h-3" strokeWidth={2.5} /> Try again
          </button>
        )}
      </div>

      {/* Transcribing spinner */}
      {transcribing && (
        <div className="text-sm text-slate-500 inline-flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
          Checking your pronunciation…
        </div>
      )}

      {/* Transcript read-out + accuracy */}
      {transcript && accuracyPct !== null && (
        <div className={`rounded-2xl p-4 border-2 ${
          accuracyPct >= Math.round(passRatio * 100)
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            {accuracyPct >= Math.round(passRatio * 100)
              ? <><Check className="w-5 h-5 text-emerald-600" strokeWidth={2.5} /> <span className="font-bold">{accuracyPct}% match — nicely done</span></>
              : <><XIcon  className="w-5 h-5 text-rose-500"    strokeWidth={2.5} /> <span className="font-bold">{accuracyPct}% match — close, try again</span></>}
          </div>
          <p className="text-[12px] italic text-slate-600">
            I heard: &ldquo;{transcript}&rdquo;
          </p>
        </div>
      )}

      {recorderError && (
        <p className="text-sm text-rose-500 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
          {recorderError}
        </p>
      )}

      {/* Playback the student's own recording for comparison */}
      {recordedUrl && (
        <audio controls src={recordedUrl} className="w-full" />
      )}

      {/* Hidden reference audio element — plays when Listen is tapped. */}
      {refUrl && (
        <audio ref={refAudioRef} src={refUrl} hidden />
      )}
    </div>
  );
}
