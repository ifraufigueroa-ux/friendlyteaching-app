// FriendlyTeaching.cl — Pronunciation exercise runner
//
// Student flow:
//   1. Tap "Listen" → plays the pre-generated reference MP3. The URL
//      comes from usePracticeAudios(unitId) in the runner (seeded by
//      `scripts/generate-practice-audios.js`). No live ElevenLabs
//      calls at student runtime.
//   2. Tap "Record" → MediaRecorder starts. 30-second hard cap so a
//      forgotten Stop can't burn an infinite Whisper call. Tap "Stop"
//      to finish; the blob gets POSTed to /api/transcribe-speech
//      (Whisper) using the recorder's real MIME (Safari produces mp4,
//      Chrome produces webm — we read it from recorder.mimeType).
//   3. The transcript is normalised and compared word-by-word with
//      the target. The grade is only committed to the runner when the
//      student either hits the pass threshold OR gives up via
//      "Move on". Retries in between are free and don't lock a wrong
//      verdict in.

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Mic, Square, RotateCcw, Loader2, Check, X as XIcon, ArrowRight, Sparkles } from 'lucide-react';
import type { PronunciationExercise } from '@/types/practice';
import { logPronunciationAttempt } from '@/hooks/usePronunciationAttempts';
import { hintForWord } from '@/lib/practice/phoneticHints';

type Verdict = 'correct' | 'incorrect' | null;

interface Props {
  ex:        PronunciationExercise;
  verdict:   Verdict;
  onGrade:   (correct: boolean) => void;
  /** Pre-generated reference MP3 URL from Firebase Storage, resolved
   *  by usePracticeAudios(unit.id) in the runner. When absent, we
   *  show the Listen button disabled with an "audio pendiente" note
   *  rather than hitting ElevenLabs from the client. */
  audioUrl?: string;
  /** Student id — needed to persist the attempt for teacher visibility.
   *  When absent (anonymous testing) we skip the write and the runner
   *  still works. */
  studentId?: string | null;
  /** Unit metadata, used only when logging the attempt. */
  unitId?:    string;
  unitLevel?: string;
}

const MAX_RECORD_MS = 30_000;

// ── Helpers ──────────────────────────────────────────────────

/** Normalise a phrase for scoring: lowercase, strip punctuation,
 *  collapse whitespace. */
function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,!?;:"“”'()\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenise(s: string): string[] {
  const n = normalise(s);
  return n.length === 0 ? [] : n.split(' ');
}

/** Word-level alignment: for each target word, is there a match in the
 *  transcript? Allows a 2-word look-ahead so an inserted filler
 *  ("umm") doesn't throw off the rest of the sentence. */
function scorePerWord(target: string[], said: string[]): boolean[] {
  const hits: boolean[] = [];
  let j = 0;
  for (let i = 0; i < target.length; i++) {
    const want = target[i];
    let matched = false;
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

export default function PronunciationBody({
  ex, verdict, onGrade, audioUrl, studentId, unitId, unitLevel,
}: Props) {
  const passRatio = ex.passThreshold ?? 0.75;
  const refAudioRef  = useRef<HTMLAudioElement | null>(null);
  const [playingRef, setPlayingRef] = useState(false);

  // Student's own recording, for playback alongside the reference.
  const recordedUrlRef = useRef<string | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  // Recording state
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript]     = useState<string | null>(null);
  const [perWordHits, setPerWordHits]   = useState<boolean[]>([]);
  const [accuracyPct, setAccuracyPct]   = useState<number | null>(null);
  const [attempts, setAttempts]         = useState(0);
  const [bestPct,  setBestPct]          = useState(0);
  const [recorderError, setRecorderError] = useState<string | null>(null);
  /** Which target-word index the student tapped for a phonetic hint. */
  const [focusedWord, setFocusedWord] = useState<number | null>(null);
  const mediaRef    = useRef<MediaRecorder | null>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const maxTimerRef = useRef<number | null>(null);

  const targetTokens = tokenise(ex.targetPhrase);

  // Only commit a grade ONCE per exercise. Later retries can improve
  // the visible score but can't flip the runner's verdict.
  const hasGradedRef = useRef(false);
  /** Last transcript + accuracy per exercise — kept in a ref so the
   *  giveUp handler can read the latest numbers without re-rendering. */
  const lastAttemptRef = useRef<{ transcript: string; accuracy: number }>({ transcript: '', accuracy: 0 });
  /** Target-word indices the student has still not matched across any
   *  attempt — the UI flips an index to "ever matched" the moment a
   *  retry hits it, so the teacher only sees genuinely stubborn words. */
  const everMatchedRef = useRef<Set<number>>(new Set());
  /** Mirrors `attempts` and `bestPct` so the transcribe + giveUp
   *  callbacks don't need them in deps and can't see stale closures. */
  const attemptsRef = useRef(0);
  const bestPctRef  = useRef(0);

  // ── Cleanup on exercise change / unmount ────────────────────
  function revokeRecorded() {
    if (recordedUrlRef.current) {
      try { URL.revokeObjectURL(recordedUrlRef.current); } catch { /* ignore */ }
      recordedUrlRef.current = null;
    }
  }
  function stopStream() {
    try { streamRef.current?.getTracks().forEach(t => t.stop()); } catch { /* ignore */ }
    streamRef.current = null;
  }
  function stopMaxTimer() {
    if (maxTimerRef.current !== null) {
      window.clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
  }

  useEffect(() => {
    // Reset per-exercise state.
    revokeRecorded();
    setRecordedUrl(null);
    setTranscript(null);
    setPerWordHits([]);
    setAccuracyPct(null);
    setAttempts(0);
    setBestPct(0);
    setRecorderError(null);
    setPlayingRef(false);
    setFocusedWord(null);
    hasGradedRef.current = false;
    lastAttemptRef.current = { transcript: '', accuracy: 0 };
    everMatchedRef.current = new Set();
    attemptsRef.current = 0;
    bestPctRef.current  = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex.id]);

  // On unmount: stop any active recording + release the mic + revoke
  // dangling blobs. Belt and suspenders.
  useEffect(() => {
    return () => {
      stopMaxTimer();
      try { mediaRef.current?.state === 'recording' && mediaRef.current.stop(); } catch { /* ignore */ }
      stopStream();
      revokeRecorded();
    };
  }, []);

  // ── Listen (reference audio) ────────────────────────────────

  const playReference = useCallback(async () => {
    if (!audioUrl || !refAudioRef.current) return;
    try {
      refAudioRef.current.currentTime = 0;
      await refAudioRef.current.play();
      setPlayingRef(true);
    } catch {
      setPlayingRef(false);
    }
  }, [audioUrl]);

  // ── Record ──────────────────────────────────────────────────

  const transcribe = useCallback(async (blob: Blob, mime: string) => {
    setTranscribing(true);
    try {
      // File extension from MIME helps Whisper detect the container.
      const ext = mime.includes('mp4') ? 'm4a'
                : mime.includes('ogg') ? 'ogg'
                : mime.includes('wav') ? 'wav'
                : 'webm';
      const fd = new FormData();
      fd.append('audio',    blob, `answer.${ext}`);
      fd.append('language', 'en');
      const res = await fetch('/api/transcribe-speech', { method: 'POST', body: fd });
      if (!res.ok) throw new Error(`Whisper failed: ${res.status}`);
      const data = await res.json() as { text?: string };
      const transcriptText = data.text ?? '';
      const said = tokenise(transcriptText);
      setTranscript(transcriptText);
      const hits = scorePerWord(targetTokens, said);
      setPerWordHits(hits);
      // Accumulate words ever matched across retries — missedWords is
      // the complement at commit time.
      hits.forEach((hit, i) => { if (hit) everMatchedRef.current.add(i); });
      const pct = targetTokens.length > 0
        ? hits.filter(Boolean).length / targetTokens.length
        : 0;
      const pctRounded = Math.round(pct * 100);
      const nextAttempts = attemptsRef.current + 1;
      const nextBest = Math.max(bestPctRef.current, pctRounded);
      attemptsRef.current = nextAttempts;
      bestPctRef.current  = nextBest;
      setAccuracyPct(pctRounded);
      setBestPct(nextBest);
      setAttempts(nextAttempts);
      lastAttemptRef.current = { transcript: transcriptText, accuracy: pctRounded };
      // Only commit the grade ONCE. Pass → correct; otherwise leave
      // it open so the student can retry without being locked wrong.
      if (!hasGradedRef.current && pct >= passRatio) {
        hasGradedRef.current = true;
        onGrade(true);
        // Log the attempt for teacher visibility. Fire-and-forget.
        if (studentId && unitId) {
          const missedWords = targetTokens.filter((_, i) => !everMatchedRef.current.has(i));
          void logPronunciationAttempt({
            studentId,
            unitId,
            unitLevel:     unitLevel ?? '',
            exerciseId:    ex.id,
            targetPhrase:  ex.targetPhrase,
            lastTranscript: transcriptText,
            bestAccuracy:  nextBest,
            lastAccuracy:  pctRounded,
            attempts:      nextAttempts,
            passed:        true,
            missedWords,
          });
        }
      }
    } catch (err) {
      console.warn('[PronunciationBody] transcription failed:', err);
      setRecorderError('Could not transcribe your audio. Try recording again.');
    } finally {
      setTranscribing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passRatio, targetTokens.join('|'), onGrade, studentId, unitId, unitLevel, ex.id, ex.targetPhrase]);

  const startRecording = useCallback(async () => {
    setRecorderError(null);
    setTranscript(null);
    setPerWordHits([]);
    setAccuracyPct(null);
    revokeRecorded();
    setRecordedUrl(null);
    if (typeof window === 'undefined' || !window.MediaRecorder) {
      setRecorderError('Your browser does not support recording. Try Chrome/Edge/Safari.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const rec = new MediaRecorder(stream);
      mediaRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        stopMaxTimer();
        // Trust the recorder's own MIME so iOS Safari (audio/mp4) and
        // Chrome (audio/webm) both produce a blob Whisper can read.
        const mime = rec.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mime });
        const url  = URL.createObjectURL(blob);
        recordedUrlRef.current = url;
        setRecordedUrl(url);
        stopStream();
        void transcribe(blob, mime);
      };
      rec.start();
      setRecording(true);
      // 30-second hard cap — auto-stop if the student forgets.
      stopMaxTimer();
      maxTimerRef.current = window.setTimeout(() => {
        try { rec.state === 'recording' && rec.stop(); } catch { /* ignore */ }
        setRecording(false);
      }, MAX_RECORD_MS);
    } catch (err) {
      console.warn('[PronunciationBody] mic start failed:', err);
      setRecorderError('Microphone blocked. Allow the site to use the mic and try again.');
    }
  }, [transcribe]);

  const stopRecording = useCallback(() => {
    stopMaxTimer();
    try {
      if (mediaRef.current && mediaRef.current.state === 'recording') mediaRef.current.stop();
    } catch { /* ignore */ }
    setRecording(false);
  }, []);

  const retry = useCallback(() => {
    setTranscript(null);
    setPerWordHits([]);
    setAccuracyPct(null);
    revokeRecorded();
    setRecordedUrl(null);
    setRecorderError(null);
  }, []);

  const giveUp = useCallback(() => {
    if (hasGradedRef.current) return;
    hasGradedRef.current = true;
    onGrade(false);
    if (studentId && unitId) {
      const missedWords = targetTokens.filter((_, i) => !everMatchedRef.current.has(i));
      void logPronunciationAttempt({
        studentId,
        unitId,
        unitLevel:     unitLevel ?? '',
        exerciseId:    ex.id,
        targetPhrase:  ex.targetPhrase,
        lastTranscript: lastAttemptRef.current.transcript,
        bestAccuracy:  bestPctRef.current,
        lastAccuracy:  lastAttemptRef.current.accuracy,
        attempts:      attemptsRef.current,
        passed:        false,
        missedWords,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onGrade, studentId, unitId, unitLevel, ex.id, ex.targetPhrase, targetTokens.join('|')]);

  // ── Render ─────────────────────────────────────────────

  const graded    = verdict !== null;
  const canRecord = !recording && !transcribing && !graded;
  const passPct   = Math.round(passRatio * 100);
  const nearPct   = Math.max(0, passPct - 10);
  const passed    = accuracyPct !== null && accuracyPct >= passPct;
  const nearPass  = accuracyPct !== null && !passed && accuracyPct >= nearPct;

  const focusedWordHint = focusedWord !== null && perWordHits[focusedWord] === false
    ? hintForWord(targetTokens[focusedWord])
    : null;

  return (
    <div className="space-y-4">
      {ex.focus && (
        <p className="text-[11px] font-black text-[#9474c4] uppercase tracking-widest">
          {ex.focus}
        </p>
      )}

      {/* Target phrase with per-word colouring once graded. Missed
          words are tappable — the hint card below reveals the sound. */}
      <div className="bg-white rounded-2xl border-2 border-[#e5d9f2] p-5">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
          Say this out loud
        </p>
        <p className="font-fun text-2xl md:text-3xl font-extrabold text-[#4b3869] leading-snug">
          {targetTokens.map((w, i) => {
            const hit = perWordHits[i];
            const trail = i < targetTokens.length - 1 ? ' ' : '';
            if (hit === undefined) {
              return <span key={i}>{w}{trail}</span>;
            }
            if (hit) {
              return <span key={i} className="text-emerald-600">{w}{trail}</span>;
            }
            const isFocused = focusedWord === i;
            return (
              <span key={i}>
                <button
                  type="button"
                  onClick={() => setFocusedWord(isFocused ? null : i)}
                  className={`text-rose-500 underline decoration-wavy decoration-2 underline-offset-4 hover:bg-rose-50 rounded-md transition-colors cursor-help ${
                    isFocused ? 'bg-rose-50' : ''
                  }`}
                  title="Tap para ver cómo pronunciarla"
                >
                  {w}
                </button>
                {trail}
              </span>
            );
          })}
        </p>
        {ex.ipa && (
          <p className="text-sm text-slate-500 mt-1 font-mono">/{ex.ipa}/</p>
        )}

        {focusedWordHint && (
          <div
            className="mt-4 bg-gradient-to-br from-amber-50 to-rose-50 border-2 border-amber-200 rounded-2xl p-4 animate-ft-fade-in"
            role="status"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center text-white">
                <Sparkles className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-fun font-extrabold text-lg text-[#4b3869]">
                    {targetTokens[focusedWord!]}
                  </span>
                  <span className="font-mono text-sm text-amber-700 bg-white border border-amber-200 rounded-full px-2 py-0.5">
                    {focusedWordHint.ipa}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-800">
                    {focusedWordHint.label}
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-snug">
                  {focusedWordHint.tip}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFocusedWord(null)}
                className="flex-shrink-0 w-7 h-7 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white transition-colors flex items-center justify-center"
                aria-label="Cerrar tip"
              >
                <XIcon className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={playReference}
          disabled={!audioUrl || recording || transcribing}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border-2 border-[#e5d9f2] text-[#5A3D7A] text-sm font-bold hover:bg-[#F7EFFF] disabled:opacity-50 transition-colors"
          title={audioUrl ? 'Play the reference' : 'Reference audio not generated yet'}
        >
          <Play className={`w-4 h-4 ${playingRef ? 'animate-pulse' : ''}`} strokeWidth={2.5} />
          Listen
        </button>

        {!recording ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={!canRecord}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 text-white text-sm font-bold shadow-sm hover:shadow-md disabled:opacity-50 transition-shadow"
          >
            <Mic className="w-4 h-4" strokeWidth={2.5} /> {attempts === 0 ? 'Record' : 'Record again'}
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

        {transcript && !passed && (
          <button
            type="button"
            onClick={retry}
            disabled={recording || transcribing}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9474c4] hover:text-[#5A3D7A] px-2 py-1"
          >
            <RotateCcw className="w-3 h-3" strokeWidth={2.5} /> Reset
          </button>
        )}

        {/* "Move on" lets the student accept a wrong verdict after at
            least one honest attempt. The runner still enforces one
            grade only, and this routes to the wrong path cleanly. */}
        {attempts > 0 && !hasGradedRef.current && !passed && !recording && !transcribing && (
          <button
            type="button"
            onClick={giveUp}
            className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-700 px-2 py-1"
          >
            Move on <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {!audioUrl && (
        <p className="text-[10px] text-slate-400">
          Audio de referencia pendiente de generación.
        </p>
      )}

      {/* Transcribing spinner */}
      {transcribing && (
        <div className="text-sm text-slate-500 inline-flex items-center gap-2" role="status" aria-live="polite">
          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
          Checking your pronunciation…
        </div>
      )}

      {/* Transcript read-out + accuracy. Three bands: pass (emerald),
          near-pass yellow zone (amber — "almost there"), low (rose). */}
      {transcript && accuracyPct !== null && (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-2xl p-4 border-2 ${
            passed
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : nearPass
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            {passed
              ? <><Check className="w-5 h-5 text-emerald-600" strokeWidth={2.5} /> <span className="font-bold">{accuracyPct}% match — nicely done</span></>
              : nearPass
                ? <><span className="text-xl">🎯</span><span className="font-bold">{accuracyPct}% match — casi lo logras, un intento más</span></>
                : <><XIcon className="w-5 h-5 text-rose-500" strokeWidth={2.5} /> <span className="font-bold">{accuracyPct}% match — try again, slowly</span></>}
          </div>
          <p className="text-[12px] italic text-slate-600">
            I heard: &ldquo;{transcript}&rdquo;
          </p>
          {!passed && perWordHits.some(h => h === false) && (
            <p className="text-[11px] text-slate-500 mt-1">
              Tip: toca una palabra <span className="text-rose-500 underline decoration-wavy">así</span> para ver cómo pronunciarla.
            </p>
          )}
          {attempts > 1 && (
            <p className="text-[11px] text-slate-500 mt-1">
              Attempt {attempts} · best so far: {bestPct}%
            </p>
          )}
        </div>
      )}

      {recorderError && (
        <p role="alert" className="text-sm text-rose-500 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
          {recorderError}
        </p>
      )}

      {/* Playback the student's own recording for comparison */}
      {recordedUrl && (
        <audio controls src={recordedUrl} className="w-full" />
      )}

      {/* Hidden reference audio element — plays when Listen is tapped. */}
      {audioUrl && (
        <audio
          ref={refAudioRef}
          src={audioUrl}
          preload="auto"
          onEnded={() => setPlayingRef(false)}
          hidden
          aria-hidden="true"
        />
      )}
    </div>
  );
}
