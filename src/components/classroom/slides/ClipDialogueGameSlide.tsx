// FriendlyTeaching.cl — Friendlyflix: Clip Dialogue Game
//
// Mirror of LyricsGameSlide adapted for short series/movie clips:
//   • Video gets the central stage (≈ 55 % of the viewport)
//   • Dialogue strip with blanks sits BELOW the video
//   • Choices appear under the dialogue, full-width
//
// Differences from the lyrics version on purpose:
//   • No LRC fetching — clips have no public sync database. Timings come
//     from clipData.timings (if the teacher / captions API pre-supplied
//     them) or are interpolated from the YouTube duration.
//   • No sub-positioning passes — manual or caption-sourced timings are
//     already exact.
//   • Layout flipped so the moving picture dominates and the dialogue is
//     a quick reference strip the student reads in parallel.
'use client';
import { useEffect, useRef, useState } from 'react';
import type { Slide, LyricsBlank } from '@/types/firebase';
import SubtitleCover from '../SubtitleCover';

interface Props { slide: Slide; youtubeUrl?: string; }

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

// ── Dialogue parsing — same {{blank}} marker format as Lyrics ──────────

type Segment = { type: 'text'; text: string } | { type: 'blank'; idx: number };
interface Parsed { lines: Segment[][]; blankLineIdx: number[]; }

function parseLines(text: string): Parsed {
  let idx = 0;
  const blankLineIdx: number[] = [];
  const lines = text.split('\n').map((line, lineI) => {
    const parts = line.split('{{blank}}');
    const segs: Segment[] = [];
    parts.forEach((p, i) => {
      segs.push({ type: 'text', text: p });
      if (i < parts.length - 1) {
        blankLineIdx[idx] = lineI;
        segs.push({ type: 'blank', idx: idx++ });
      }
    });
    return segs;
  });
  return { lines, blankLineIdx };
}

// Weight-based per-line timings, used when no per-line timings were supplied.
function buildLineTimings(lines: Segment[][], dur: number): number[] {
  const n = lines.length;
  if (n === 0) return [];
  const weights = lines.map(line => {
    const text = line.map(s => s.type === 'text' ? s.text : '___').join('');
    const w = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(0.5, w);
  });
  const totalW = weights.reduce((a, b) => a + b, 0);
  const start = 0.05 * dur;
  const end   = 0.95 * dur;
  const span  = end - start;
  const out: number[] = [];
  let cumW = 0;
  for (let i = 0; i < n; i++) {
    out.push(start + (cumW / totalW) * span);
    cumW += weights[i];
  }
  return out;
}

// Per-line END times — used by the debug overlay only.
// Movie dialogue ends when the next line starts (or at clip end). The
// previous word-budget formula was too tight and pausing 1-2 s before
// the actor finished the blank line. We now trust the next-line anchor
// directly: a generous fallback only kicks in for the last line.
function buildLineEndTimes(lines: Segment[][], lt: number[], dur: number): number[] {
  const out: number[] = new Array(lines.length);
  for (let i = 0; i < lines.length; i++) {
    const nextStart = i + 1 < lt.length ? lt[i + 1] : Math.min(lt[i] + 6, dur);
    out[i] = nextStart;
  }
  return out;
}

// Per-blank trigger time. Subtitle timestamps in YouTube transcripts
// mark when each caption APPEARS, not when the previous line ENDS.
// Anime dubs and emotional monologues regularly have the actor still
// speaking 0.5-1.5 s after the next caption appears, so pausing right
// before the next line cuts the blank word mid-utterance.
//
// We therefore pause a generous POST_NEXT_PAD AFTER the next line
// starts. The student briefly hears the start of the following line
// (extra context, not a problem) and the blank word is guaranteed to
// have been spoken in full. The teacher can fine-tune per clip with
// the sync ± buttons (persisted to localStorage).
const POST_NEXT_PAD = 0.8;

function buildBlankTimings(
  blanksData: LyricsBlank[],
  blankLineIdx: number[],
  lineTimings: number[],
  dur: number,
): number[] {
  return blanksData.map((_, i) => {
    const li = blankLineIdx[i] ?? 0;
    // For blanks on the LAST dialogue line (or when timings are
    // missing) return Infinity so no programmatic pause ever fires —
    // tick() skips any non-finite timing. The video then plays to its
    // natural clipData.endTime, letting the student hear the entire
    // final line. The hard +6 s fallback used here previously cut off
    // long dramatic closing lines.
    if (lineTimings.length === 0 || li + 1 >= lineTimings.length) return Infinity;
    const nextStart = lineTimings[li + 1];
    // Guarantee at least 2.5 s of audio for the blank line even if
    // back-to-back subtitles would otherwise trigger too early.
    return Math.max(lineTimings[li] + 2.5, nextStart + POST_NEXT_PAD);
  });
}

const DEFAULT_DURATION = 180; // seconds — typical clip length until YT reports real duration

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function ClipDialogueGameSlide({ slide, youtubeUrl: youtubeUrlProp }: Props) {
  const blanksData: LyricsBlank[] = slide.blanksData ?? [];
  const numBlanks   = blanksData.length;
  const dialogueText = slide.content ?? slide.clipData?.dialogue ?? '';
  const rawUrl      = youtubeUrlProp ?? slide.clipData?.youtubeUrl ?? null;
  const videoId     = rawUrl ? extractVideoId(rawUrl) : null;
  const parsed         = parseLines(dialogueText);
  const dialogueLines  = parsed.lines;
  const blankLineIdx   = parsed.blankLineIdx;
  const totalLines     = dialogueLines.length;

  // ── Game state ──────────────────────────────────────────────────────────
  const [answers, setAnswers]                 = useState<(string | null)[]>(() => Array(numBlanks).fill(null));
  const [answerOk, setAnswerOk]               = useState<boolean[]>(() => Array(numBlanks).fill(false));
  const [currentBlankIdx, setCurrentBlankIdx] = useState(0);
  const [currentLineIdx, setCurrentLineIdx]   = useState(0);
  const [score, setScore]                     = useState(0);
  const [correct, setCorrect]                 = useState(0);
  const [wrong, setWrong]                     = useState(0);
  const [progress, setProgress]               = useState(0);
  const [elapsed, setElapsed]                 = useState(0);
  const [waiting, setWaiting]                 = useState(false);
  const [timerRunning, setTimerRunning]       = useState(false);
  const [started, setStarted]                 = useState(false);
  const [wrongFlash, setWrongFlash]           = useState(false);
  const [videoKey, setVideoKey]               = useState('idle');
  const [videoAutoplay, setVideoAutoplay]     = useState(false);
  const [syncOffset, setSyncOffset]           = useState(0);
  const [syncStatus, setSyncStatus]           = useState<'loading'|'manual'|'estimated'>('loading');
  const [videoBlocked, setVideoBlocked]       = useState(false);
  const [debugOpen, setDebugOpen]             = useState(false);

  // Per-clip sync offset persistence (localStorage).
  const clipOffsetKey = (() => {
    const t = slide.clipData?.title?.trim();
    const s = slide.clipData?.source?.trim();
    return t ? `ft_clip_offset:${(s ?? '').toLowerCase()}::${t.toLowerCase()}` : null;
  })();

  useEffect(() => {
    if (!clipOffsetKey || typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(clipOffsetKey);
    const n = raw != null ? parseInt(raw, 10) : NaN;
    if (Number.isFinite(n) && n !== 0) {
      syncOffsetRef.current = n;
      setSyncOffset(n);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clipOffsetKey]);

  function applySyncOffsetDelta(delta: number) {
    const n = syncOffsetRef.current + delta;
    syncOffsetRef.current = n;
    setSyncOffset(n);
    if (clipOffsetKey && typeof window !== 'undefined') {
      window.localStorage.setItem(clipOffsetKey, String(n));
    }
  }

  // ── Refs ────────────────────────────────────────────────────────────────
  const answersRef        = useRef<(string | null)[]>(Array(numBlanks).fill(null));
  const currentIdxRef     = useRef(0);
  const waitingRef        = useRef(false);
  const cooldownRef       = useRef(false);
  const timerRunningRef   = useRef(false);
  const intentPausedRef   = useRef(false);
  const intervalRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTsRef        = useRef<number | null>(null);
  const pausedPosRef      = useRef(0);
  const lineEls           = useRef<(HTMLDivElement | null)[]>([]);
  const dialogueRef       = useRef<HTMLDivElement | null>(null);
  const iframeRef         = useRef<HTMLIFrameElement | null>(null);
  const durationSetRef    = useRef(false);
  const clipDurationRef   = useRef(DEFAULT_DURATION);
  const syncOffsetRef     = useRef(0);
  const timingsLoadedRef  = useRef(false);
  const ytStateRef        = useRef<number>(-1);
  const ytLastCtRef       = useRef<number>(0);
  const pauseRetryRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initial timings — recomputed when real duration arrives.
  const lineTimings  = useRef(buildLineTimings(dialogueLines, DEFAULT_DURATION));
  const lineEndTimes = useRef(buildLineEndTimes(dialogueLines, lineTimings.current, DEFAULT_DURATION));
  const timings      = useRef(buildBlankTimings(blanksData, blankLineIdx, lineTimings.current, DEFAULT_DURATION));

  // Apply pre-supplied timings (from clipData or captions) if any.
  // We accept partial / mismatched arrays so the sync isn't lost entirely
  // when an admin script changes the dialogue line count without also
  // updating timings (the symptom: 25 lines + 33 stale timings would
  // previously fall back to weight-based estimation across the whole
  // video, making the cursor wildly out of sync).
  useEffect(() => {
    const supplied = slide.clipData?.timings;
    if (supplied && supplied.length > 0) {
      let lt: number[];
      if (supplied.length === totalLines) {
        lt = supplied.slice();
      } else if (supplied.length > totalLines) {
        // Too many timings — truncate to the first totalLines entries.
        // This handles the common case where lines were merged but the
        // timings array was left unchanged.
        lt = supplied.slice(0, totalLines);
      } else {
        // Too few timings — use what we have, extrapolate the rest at
        // the cadence of the last known gap so the cursor still moves
        // forward at a believable speed.
        lt = supplied.slice();
        const last = lt[lt.length - 1] ?? 0;
        const prev = lt[lt.length - 2] ?? Math.max(0, last - 6);
        const gap  = Math.max(3, last - prev);
        for (let i = lt.length; i < totalLines; i++) {
          lt.push(lt[i - 1] + gap);
        }
      }
      const let_ = buildLineEndTimes(dialogueLines, lt, clipDurationRef.current);
      lineTimings.current  = lt;
      lineEndTimes.current = let_;
      timings.current      = buildBlankTimings(blanksData, blankLineIdx, lt, clipDurationRef.current);
      timingsLoadedRef.current = true;
      // Status reflects whether the supplied data perfectly covers the
      // dialogue — 'manual' for exact match, 'estimated' otherwise so
      // the teacher knows the sync may need a ± nudge.
      setSyncStatus(supplied.length === totalLines ? 'manual' : 'estimated');
    } else {
      setSyncStatus('estimated');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── YouTube postMessage helpers ─────────────────────────────────────────
  function ytCmd(func: string, args: unknown[] = []) {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args }), '*',
    );
  }
  function pauseYT() { ytCmd('pauseVideo'); }
  function playYT()  { ytCmd('playVideo'); }
  function seekYT(t: number) { ytCmd('seekTo', [Math.max(0, t), true]); }

  function firePauseAndRetry() {
    if (pauseRetryRef.current) clearInterval(pauseRetryRef.current);
    pauseYT();
    let attempts = 0;
    pauseRetryRef.current = setInterval(() => {
      if (!waitingRef.current || ytStateRef.current === 2 || attempts++ > 15) {
        if (pauseRetryRef.current) clearInterval(pauseRetryRef.current);
        pauseRetryRef.current = null;
        return;
      }
      pauseYT();
    }, 150);
  }

  function stopPauseRetry() {
    if (pauseRetryRef.current) {
      clearInterval(pauseRetryRef.current);
      pauseRetryRef.current = null;
    }
  }

  // ── YouTube listener — onStateChange + infoDelivery ─────────────────────
  useEffect(() => {
    function applyYTPause(ct?: number) {
      if (intentPausedRef.current) { intentPausedRef.current = false; return; }
      if (!timerRunningRef.current) return;
      pausedPosRef.current = ct ?? (pausedPosRef.current + (startTsRef.current ? (Date.now() - startTsRef.current) / 1000 : 0));
      startTsRef.current = null;
      timerRunningRef.current = false;
      setTimerRunning(false);
    }
    function applyYTPlay(ct?: number) {
      if (waitingRef.current || intentPausedRef.current) return;
      if (ct !== undefined) {
        pausedPosRef.current = ct;
        startTsRef.current = Date.now();
      }
      if (!timerRunningRef.current) {
        if (startTsRef.current === null) startTsRef.current = Date.now();
        timerRunningRef.current = true;
        setTimerRunning(true);
      }
    }

    function onMessage(e: MessageEvent) {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data.event === 'onError' && (data.info === 101 || data.info === 150)) {
          setVideoBlocked(true);
          return;
        }
        if (data.event === 'onStateChange') {
          const state = typeof data.info === 'number' ? data.info : data.info?.playerState;
          if (typeof state === 'number') ytStateRef.current = state;
          if (state === 2) applyYTPause();
          else if (state === 1) applyYTPlay();
          return;
        }
        if (data.event !== 'infoDelivery' || !data.info) return;
        const { currentTime, duration, playerState } = data.info;
        if (typeof playerState === 'number') ytStateRef.current = playerState;
        if (typeof currentTime === 'number')  ytLastCtRef.current = currentTime;

        if (duration && duration > 0 && !durationSetRef.current) {
          durationSetRef.current = true;
          clipDurationRef.current = duration;
          if (!timingsLoadedRef.current) {
            const lt = buildLineTimings(dialogueLines, duration);
            const let_ = buildLineEndTimes(dialogueLines, lt, duration);
            lineTimings.current  = lt;
            lineEndTimes.current = let_;
            timings.current      = buildBlankTimings(blanksData, blankLineIdx, lt, duration);
          }
        }

        if (playerState === 1) applyYTPlay(currentTime);
        else if (playerState === 2) applyYTPause(currentTime);
      } catch { /* ignore */ }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalLines]);

  // ── Auto-scroll script strip ───────────────────────────────────────────
  // We use getBoundingClientRect to compute the line's position relative
  // to the scroll container — el.offsetTop bubbles up to the nearest
  // positioned ancestor, which in our layout is way outside the script
  // container, so the old math produced enormous scrollTop targets that
  // the browser clamped to the end of the content (the "jumps to last
  // line" bug).
  //
  // Wild jumps (e.g. YouTube reporting non-zero currentTime on first
  // play) still use instant scroll instead of smooth so the script
  // doesn't visibly animate across many lines.
  const prevLineIdxRef = useRef(0);
  useEffect(() => {
    const container = dialogueRef.current;
    const el = lineEls.current[currentLineIdx];
    if (!container || !el) return;
    const delta = Math.abs(currentLineIdx - prevLineIdxRef.current);
    prevLineIdxRef.current = currentLineIdx;

    const containerRect = container.getBoundingClientRect();
    const elRect        = el.getBoundingClientRect();
    // Position of the line within the container's scrollable coordinate
    // system = current scrollTop + (visible offset from container top).
    const elTopInContainer = container.scrollTop + (elRect.top - containerRect.top);
    const targetTop        = elTopInContainer - container.clientHeight / 2 + el.clientHeight / 2;

    container.scrollTo({
      top: Math.max(0, targetTop),
      behavior: delta > 3 ? 'auto' : 'smooth',
    });
  }, [currentLineIdx]);

  // ── Timer helpers ──────────────────────────────────────────────────────
  function getCurrentPos(): number {
    if (startTsRef.current === null) return pausedPosRef.current;
    return pausedPosRef.current + (Date.now() - startTsRef.current) / 1000;
  }
  function startTimer() {
    startTsRef.current = Date.now();
    timerRunningRef.current = true;
    intentPausedRef.current = false;
    setTimerRunning(true);
  }
  function pauseTimer() {
    pausedPosRef.current = getCurrentPos();
    startTsRef.current = null;
    timerRunningRef.current = false;
    intentPausedRef.current = true;
    setTimerRunning(false);
  }
  function resumeTimer() {
    startTsRef.current = Date.now();
    timerRunningRef.current = true;
    intentPausedRef.current = false;
    setTimerRunning(true);
  }
  function shiftTimer(deltaSec: number) {
    // Clamp to the clip's startTime so rewind never lands before the
    // configured clip start (which would leave the student watching an
    // intro they were never meant to see).
    const floor = Math.max(0, slide.clipData?.startTime ?? 0);
    const next  = Math.max(floor, getCurrentPos() + deltaSec);
    pausedPosRef.current = next;
    if (startTsRef.current !== null) startTsRef.current = Date.now();
    seekYT(next);
  }

  // ── Polling — advance cursor + trigger blank ───────────────────────────
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (!timerRunningRef.current) return;
      const t = getCurrentPos();
      const dur = clipDurationRef.current;
      // Progress bar tracks progress WITHIN the clip subset
      // [startTime, endTime] rather than within the whole video, so the
      // bar starts at 0% when the clip begins even when startTime is
      // deep into the source video. Falls back to (t / dur) when the
      // subset isn't fully defined.
      const startT = slide.clipData?.startTime ?? 0;
      const endT   = slide.clipData?.endTime;
      const span   = endT && endT > startT ? endT - startT : Math.max(dur - startT, 1);
      setProgress(Math.min(Math.max((t - startT) / span, 0), 1));
      setElapsed(t);

      const lt = lineTimings.current;
      const off = syncOffsetRef.current;
      if (lt.length > 0) {
        let li = 0;
        for (let i = 0; i < lt.length; i++) if (t >= lt[i] + off) li = i;
        li = Math.max(0, Math.min(li, lt.length - 1));
        setCurrentLineIdx(prev => {
          if (prev !== li && Math.abs(li - prev) > 5) {
            console.warn(`[clip] suspicious cursor jump: ${prev} → ${li} at t=${t.toFixed(2)}s, off=${off}, lt.length=${lt.length}, lt[0..3]=${lt.slice(0, 4).join(',')}, lt[last]=${lt[lt.length - 1]}`);
          }
          return li;
        });
      }

      if (waitingRef.current || cooldownRef.current) return;
      const bi = currentIdxRef.current;
      if (bi < numBlanks && Number.isFinite(timings.current[bi]) && t >= timings.current[bi] + off) {
        pauseTimer();
        waitingRef.current = true;
        setWaiting(true);
        // Snap cursor to the blank's line so the highlighted line matches
        // the question being asked. Without this, POST_NEXT_PAD can push
        // the pause 0.8 s into the next line — the previous line appears
        // "skipped" even though its blank is still active.
        const blankLine = blankLineIdx[bi];
        if (blankLine != null) setCurrentLineIdx(blankLine);
        firePauseAndRetry();
      }
    }, 50);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopPauseRetry();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numBlanks]);

  // ── Controls ──────────────────────────────────────────────────────────
  function handleStart() {
    setStarted(true);
    setVideoAutoplay(true);
    setVideoKey('playing');
    // Seed the internal clock at the clip's startTime so the script is
    // already aligned with the video the instant playback begins. Timings
    // in clipData are absolute video positions; without this seed the
    // internal timer starts at 0 while the video jumps to startTime,
    // and the game waits `startTime` seconds before the first line
    // triggers. YT infoDelivery messages re-sync every ~250 ms after
    // this, so the seed only has to bridge the initial gap.
    const seed = Math.max(0, slide.clipData?.startTime ?? 0);
    pausedPosRef.current = seed;
    startTimer();
  }
  function handlePause()  { pauseTimer(); firePauseAndRetry(); }
  function handleResume() { stopPauseRetry(); resumeTimer(); playYT(); }
  function handleRewind() {
    stopPauseRetry();
    shiftTimer(-5);
    waitingRef.current = false;
    cooldownRef.current = true;
    setWaiting(false);
    resumeTimer();
    playYT();
    setTimeout(() => { cooldownRef.current = false; }, 1200);
  }
  function handleForward() { shiftTimer(5); }

  function isBlankAccessible(idx: number): boolean {
    if (idx >= numBlanks || answerOk[idx]) return false;
    if (waiting) return true;
    const lineIdx = blankLineIdx[idx];
    return lineIdx != null && currentLineIdx >= lineIdx;
  }

  function handleAnswer(option: string) {
    if (currentBlankIdx >= numBlanks || answerOk[currentBlankIdx]) return;
    const earlyMode = !waiting;
    if (earlyMode && !isBlankAccessible(currentBlankIdx)) return;
    const blank = blanksData[currentBlankIdx];
    const ok = option.toLowerCase().trim() === blank.word.toLowerCase().trim();
    if (ok) {
      const na = [...answersRef.current];
      na[currentBlankIdx] = option;
      answersRef.current = na;
      setAnswers([...na]);
      setAnswerOk(prev => { const n = [...prev]; n[currentBlankIdx] = true; return n; });
      setScore(s => s + 10);
      setCorrect(c => c + 1);
      const next = currentBlankIdx + 1;
      setCurrentBlankIdx(next);
      currentIdxRef.current = next;
      if (next < numBlanks) {
        const minNext = getCurrentPos() + 2.0;
        if ((timings.current[next] ?? 0) < minNext) timings.current[next] = minNext;
      }
      cooldownRef.current = true;
      if (!earlyMode) {
        stopPauseRetry();
        waitingRef.current = false;
        setWaiting(false);
        resumeTimer();
        playYT();
      }
      setTimeout(() => { cooldownRef.current = false; }, 800);
    } else {
      setWrong(w => w + 1);
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 500);
    }
  }

  const allDone        = numBlanks > 0 && answers.every(a => a !== null);
  const answeredCount  = answers.filter(a => a !== null).length;
  const currentOptions = !allDone && blanksData[currentBlankIdx]?.options
    ? blanksData[currentBlankIdx].options
    : [];
  const canAnswerNow   = !allDone && isBlankAccessible(currentBlankIdx);
  const earlyChance    = canAnswerNow && !waiting;

  const currentBlankLineText = (() => {
    for (const line of dialogueLines) {
      for (const seg of line) {
        if (seg.type === 'blank' && seg.idx === currentBlankIdx) {
          return line.map(s => s.type === 'text' ? s.text : '____').join('');
        }
      }
    }
    return '';
  })();

  // ── JSX ────────────────────────────────────────────────────────────────
  // Accuracy % for the header chip.
  const accuracyPct = numBlanks > 0 && (correct + wrong) > 0
    ? Math.round((correct / (correct + wrong)) * 100)
    : 100;
  const streakBadge = correct >= 2 ? correct : 0;

  return (
    <div
      className="relative flex flex-col bg-transparent text-[#F8F5FC] overflow-hidden"
      style={{ height: '100%', minHeight: 520 }}
    >
      {/* Top thin bar — brand strip + yellow progress + stat chips */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-1.5 bg-[rgba(15,10,28,0.85)] backdrop-blur border-b border-[#EC008C]/20">
        <div className="flex-1 min-w-0">
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FCEE21] to-[#FFB800] transition-all duration-300 rounded-full"
              style={{ width: `${progress * 100}%`, boxShadow: '0 0 8px rgba(252,238,33,0.55)' }}
            />
          </div>
        </div>
        <p className="text-[10px] text-[#A69BB8] flex-shrink-0 truncate max-w-[260px]">
          {slide.clipData?.title} · {slide.clipData?.source}
        </p>
        <span className="ff-stat-chip is-score">⭐ {score}<span className="opacity-70 font-normal ml-0.5">pts</span></span>
        {streakBadge > 0 && (
          <span className="ff-stat-chip is-streak">🔥 {streakBadge}x</span>
        )}
        {(correct + wrong) > 0 && (
          <span className="ff-stat-chip is-accuracy">🎯 {accuracyPct}%</span>
        )}
        <span className={`text-[9px] font-semibold flex-shrink-0 px-1.5 py-0.5 rounded-full
          ${syncStatus === 'manual'    ? 'bg-[#7BC67E]/25 text-[#7BC67E]'
          : syncStatus === 'estimated' ? 'bg-white/10 text-white/30'
                                       : 'bg-white/5 text-white/20'}`}>
          {syncStatus === 'manual' ? '♪ sync' : syncStatus === 'estimated' ? '~ est' : '…'}
        </span>
        <button
          onClick={() => setDebugOpen(o => !o)}
          title="Debug de sincronía"
          className={`text-[9px] font-bold flex-shrink-0 px-1.5 py-0.5 rounded-full transition-all
            ${debugOpen ? 'bg-amber-500/30 text-amber-300' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}
        >
          🛠
        </button>
      </div>

      {/* ── Video centered (main stage) — diagram block 1 ─────────────── */}
      <div className="flex-1 flex items-center justify-center bg-black px-4 py-3 min-h-0">
        <div className="relative w-full h-full max-w-5xl mx-auto" style={{ aspectRatio: '16 / 9' }}>
          {videoId && !videoBlocked ? (
            <iframe
              key={videoKey}
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${videoId}?${videoAutoplay ? 'autoplay=1&' : ''}controls=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1${slide.clipData?.startTime ? `&start=${Math.floor(slide.clipData.startTime)}` : ''}${slide.clipData?.endTime ? `&end=${Math.floor(slide.clipData.endTime)}` : ''}&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
              className="absolute inset-0 w-full h-full rounded-xl shadow-2xl shadow-[#EC008C]/25"
              style={{ border: 'none' }}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : videoBlocked ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center bg-black/50 rounded-xl">
              <p className="text-white/60 text-sm">
                Este video no permite reproducción embebida.<br />
                Ábrelo en YouTube y usa el timer manual.
              </p>
              <a
                href={`https://www.youtube.com/watch?v=${videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#EC008C] hover:bg-[#D0007D] text-white text-xs font-bold rounded-xl"
              >
                Abrir en YouTube ↗
              </a>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm bg-black/40 rounded-xl">
              Agrega una URL de YouTube en clipData.youtubeUrl
            </div>
          )}

          {/* Hardcoded-subtitle cover (draggable + resizable, persisted in localStorage) */}
          {videoId && !videoBlocked && <SubtitleCover />}
        </div>
      </div>

      {/* ── Scrolling Script — diagram block 2 ─────────────────────────── */}
      {/* Prominent strip: current line big and centered, prev/next faded
          above and below to hint context without stealing focus. */}
      <div
        ref={dialogueRef}
        className="flex-shrink-0 overflow-y-auto bg-gradient-to-b from-black/0 via-black/50 to-black/0 border-y border-white/10"
        style={{ height: 150, scrollbarWidth: 'none' }}
      >
        <div style={{ height: 50 }} />
        {dialogueLines.map((line, lineIdx) => {
          const dist     = lineIdx - currentLineIdx;
          const isActive = dist === 0;
          const isNear   = Math.abs(dist) === 1;
          const isPast   = dist < 0;
          return (
            <div
              key={lineIdx}
              ref={el => { lineEls.current[lineIdx] = el; }}
              className={`text-center px-6 transition-all duration-500 leading-tight select-none
                ${isActive ? 'text-white font-bold text-[1.5rem] py-2'
                  : isNear  ? 'text-white/45 font-medium text-[1rem] py-1'
                  : isPast  ? 'text-white/15 text-sm py-0.5'
                             : 'text-white/20 text-sm py-0.5'}`}
            >
              {line.map((seg, segIdx) => {
                if (seg.type === 'text') return <span key={segIdx}>{seg.text}</span>;
                const i         = seg.idx;
                const answered  = answers[i] !== null;
                const isCurrent = i === currentBlankIdx;
                return (
                  <span
                    key={segIdx}
                    className={`inline-block min-w-[80px] text-center px-3 py-0.5 mx-1.5 rounded-xl font-bold transition-all duration-300
                      ${isActive ? 'text-lg' : 'text-base'}
                      ${answered
                        ? 'bg-[#7BC67E] text-[#0F0A1C] shadow-[0_0_18px_rgba(123,198,126,0.55)]'
                        : isCurrent
                          ? `bg-[#FCF7D8] text-[#0F0A1C] shadow-[0_0_18px_rgba(252,238,33,0.5)] scale-105 border-2 border-dashed ${wrongFlash ? 'border-red-400 animate-[ffBlankShake_380ms_ease-in-out]' : 'border-[#FCEE21]'}`
                          : i < currentBlankIdx ? 'bg-white/5 text-white/25' : 'bg-white/10 text-white/35'
                      }`}
                  >
                    {answered ? answers[i] : isCurrent ? '?' : '···'}
                  </span>
                );
              })}
            </div>
          );
        })}
        <div style={{ height: 50 }} />
      </div>

      {/* ── Bottom row — diagram block 3 ───────────────────────────────── */}
      {/* alternatives (left, 4 buttons) + control botones (right) */}
      <div className="flex-shrink-0 flex items-stretch gap-3 px-4 py-3 bg-[rgba(15,10,28,0.85)] backdrop-blur border-t border-[#EC008C]/20">

        {/* ── Alternatives (left, takes the remaining space) ───────────── */}
        <div className="flex-1 min-w-0">
          {allDone ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-2">
              <p className="ff-title-spotlight font-bold text-xl">🎬 ¡Completado!</p>
              <p className="text-[#A69BB8] text-sm mt-1">
                <span className="text-[#FCEE21] font-bold">{score}</span> pts ·{' '}
                <span className="text-[#7BC67E] font-bold">{correct}</span>/{numBlanks} correctas
              </p>
            </div>
          ) : currentOptions.length > 0 ? (
            <div className="h-full flex flex-col justify-center">
              {canAnswerNow && currentBlankLineText && (
                <p className="text-center text-[#A69BB8] text-xs mb-2 px-2 leading-snug truncate">
                  &ldquo;{currentBlankLineText.trim()}&rdquo;
                  {earlyChance && (
                    <span className="ml-2 text-[9px] text-[#EC008C] uppercase tracking-widest">
                      · responde antes
                    </span>
                  )}
                </p>
              )}
              <div className="grid grid-cols-4 gap-2">
                {currentOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(opt)}
                    disabled={!canAnswerNow}
                    className={`ff-option-btn ${wrongFlash ? 'opacity-60 scale-95' : ''} ${earlyChance ? 'opacity-90' : ''}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-[#A69BB8]/60 text-xs">
              {started ? 'Esperando la siguiente línea con blank…' : 'Presiona ▶ Iniciar para comenzar'}
            </div>
          )}
        </div>

        {/* ── Botones (right column, control cluster + score chip) ────── */}
        <div className="flex-shrink-0 flex flex-col items-stretch justify-between gap-2 w-[260px] border-l border-[#EC008C]/20 pl-3">

          {/* Score + counters mini-row */}
          <div className="flex items-center justify-between text-[11px] flex-wrap gap-2">
            <span className="text-[#A69BB8]/70 uppercase tracking-widest text-[9px]">Puntaje</span>
            <span className="font-bold text-[#FCEE21] text-base">{score}<span className="text-[9px] font-normal text-[#A69BB8]/60"> pts</span></span>
            <span className="text-[#7BC67E] font-semibold">✓ {correct}</span>
            <span className="text-red-400 font-semibold">✗ {wrong}</span>
            <span className="text-[9px] text-[#A69BB8]/50">{answeredCount}/{numBlanks}</span>
          </div>

          {/* Transport row */}
          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={handleRewind}
              disabled={!started}
              title="Retroceder 5 s"
              className="px-2 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-xs font-bold border border-white/10 transition-all active:scale-95 disabled:opacity-25 text-[#F8F5FC]"
            >
              ↺ 5s
            </button>

            {!started ? (
              <button
                onClick={handleStart}
                className="flex-1 px-4 py-1.5 bg-gradient-to-r from-[#EC008C] to-[#A70066] rounded-lg text-sm font-bold shadow-lg shadow-[#EC008C]/40 transition-all active:scale-95 text-white"
              >
                ▶ Iniciar
              </button>
            ) : timerRunning ? (
              <button
                onClick={handlePause}
                className="flex-1 px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold border border-white/15 transition-all active:scale-95 text-[#F8F5FC]"
              >
                ⏸
              </button>
            ) : waiting ? (
              <span className="flex-1 text-center text-[#FCEE21] text-[10px] font-semibold animate-pulse px-2">
                ← elige
              </span>
            ) : (
              <button
                onClick={handleResume}
                className="flex-1 px-4 py-1.5 bg-gradient-to-r from-[#EC008C] to-[#A70066] rounded-lg text-sm font-bold shadow-lg shadow-[#EC008C]/40 transition-all active:scale-95 text-white"
              >
                ▶
              </button>
            )}

            <button
              onClick={handleForward}
              disabled={!started}
              title="Avanzar 5 s"
              className="px-2 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-xs font-bold border border-white/10 transition-all active:scale-95 disabled:opacity-25 text-[#F8F5FC]"
            >
              5s →
            </button>
          </div>

          {/* Sync + timer row */}
          <div className="flex items-center justify-between gap-2 text-[10px]">
            <div className="flex items-center gap-1">
              <button
                onClick={() => applySyncOffsetDelta(-1)}
                disabled={!started}
                title="Preguntas 1 s antes (recordado para este clip)"
                className="px-1.5 py-1 rounded bg-[#EC008C]/15 hover:bg-[#EC008C]/30 font-bold border border-[#EC008C]/30 transition-all active:scale-95 disabled:opacity-25 text-[#EC008C]"
              >
                −1s
              </button>
              <span className="text-[9px] text-[#EC008C] min-w-[28px] text-center font-mono">
                {syncOffset > 0 ? '+' : ''}{syncOffset}s
              </span>
              <button
                onClick={() => applySyncOffsetDelta(1)}
                disabled={!started}
                title="Preguntas 1 s después (recordado para este clip)"
                className="px-1.5 py-1 rounded bg-[#EC008C]/15 hover:bg-[#EC008C]/30 font-bold border border-[#EC008C]/30 transition-all active:scale-95 disabled:opacity-25 text-[#EC008C]"
              >
                +1s
              </button>
            </div>
            <div className="font-mono font-bold text-[#F8F5FC]">{fmt(elapsed)}</div>
          </div>
        </div>
      </div>

      {/* Debug overlay */}
      {debugOpen && (
        <div className="absolute bottom-3 left-3 z-50 bg-black/90 border border-amber-500/40 rounded-xl p-3 font-mono text-[10px] text-amber-100 max-w-[360px] shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <span className="text-amber-300 font-bold uppercase tracking-widest">Sync debug</span>
            <button onClick={() => setDebugOpen(false)} className="text-white/40 hover:text-white">×</button>
          </div>
          {(() => {
            const t       = elapsed;
            const li      = currentLineIdx;
            const lt      = lineTimings.current;
            const lineSt  = lt[li];
            const lineNx  = lt[li + 1];
            const bi      = currentBlankIdx;
            const trig    = timings.current[bi];
            const bword   = blanksData[bi]?.word ?? '—';
            const bLine   = blankLineIdx[bi];
            const dT      = trig != null ? trig - t : null;

            return (
              <div className="space-y-1">
                <div><span className="text-amber-400">t</span> {fmt(t)} ({t.toFixed(2)}s) · offset {syncOffset > 0 ? '+' : ''}{syncOffset}s · status {syncStatus}</div>
                <div className="border-t border-amber-500/20 pt-1">
                  <div><span className="text-amber-400">line</span> {li}/{totalLines - 1} · start {lineSt?.toFixed(2) ?? '?'}s</div>
                  {lineNx != null && <div className="pl-3 text-amber-200/60">next @ {lineNx.toFixed(2)}s (Δ {(lineNx - (lineSt ?? 0)).toFixed(1)}s)</div>}
                </div>
                <div className="border-t border-amber-500/20 pt-1">
                  <div><span className="text-amber-400">blank</span> #{bi}/{numBlanks} word=<span className="text-white">{bword}</span> (line {bLine})</div>
                  {trig != null && Number.isFinite(trig) && (
                    <div className="pl-3 text-amber-200/60">
                      trigger @ {trig.toFixed(2)}s {dT != null && (dT >= 0 ? `(in ${dT.toFixed(1)}s)` : `(${(-dT).toFixed(1)}s ago)`)}
                    </div>
                  )}
                </div>
                <div className="border-t border-amber-500/20 pt-1 text-amber-200/60">
                  YT state <span className="text-white">{ytStateRef.current}</span>{' '}
                  ({ytStateRef.current === 1 ? 'playing' : ytStateRef.current === 2 ? 'paused' : ytStateRef.current === 3 ? 'buffering' : ytStateRef.current === 0 ? 'ended' : '—'})
                  · ytCt <span className="text-white">{ytLastCtRef.current.toFixed(1)}</span>s
                  · pauseRetry <span className="text-white">{pauseRetryRef.current ? 'on' : 'off'}</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
