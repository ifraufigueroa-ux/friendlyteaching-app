// FriendlyTeaching.cl — Slide 4: Lyrics Game
'use client';
import { useEffect, useRef, useState } from 'react';
import type { Slide, LyricsBlank } from '@/types/firebase';

interface Props { slide: Slide; youtubeUrl?: string; }

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

type Segment = { type: 'text'; text: string } | { type: 'blank'; idx: number };

interface ParsedLyrics {
  lines: Segment[][];
  blankLineIdx: number[]; // for each blank index → slide line index it lives in
}

function parseLines(text: string): ParsedLyrics {
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

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Weight-based timing: lines with more words get proportionally more time.
// This is a better model than equal spacing because singers spend more time
// on lines with many syllables and less on short lines or breaths.
function buildLineTimings(lyricsLines: Segment[][], dur: number): number[] {
  const n = lyricsLines.length;
  if (n === 0) return [];

  const weights = lyricsLines.map(line => {
    const text = line.map(s => s.type === 'text' ? s.text : '___').join('');
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    return Math.max(0.5, words); // empty/short lines still get a small slot
  });

  const totalW = weights.reduce((a, b) => a + b, 0);
  const start  = 0.08 * dur;
  const end    = 0.93 * dur;
  const span   = end - start;

  const timings: number[] = [];
  let cumW = 0;
  for (let i = 0; i < n; i++) {
    timings.push(start + (cumW / totalW) * span);
    cumW += weights[i];
  }
  return timings;
}

// Blank timings estimated from word-weighted line timings (fallback when no
// LRC has loaded yet). Uses the word-aware estimator with line-end derived
// from the next line's start time.
function buildBlankTimingsFallback(
  blanksData: LyricsBlank[],
  blankLineIdx: number[],
  originalLines: string[],
  lyricsLines: Segment[][],
  dur: number,
): number[] {
  const lt = buildLineTimings(lyricsLines, dur);
  return buildBlankTimingsWordAware(blanksData, blankLineIdx, originalLines, lt);
}

// ── LRC sync helpers ──────────────────────────────────────────────────────

interface LrcLine { time: number; text: string; endTime?: number }

function parseLrc(lrc: string): LrcLine[] {
  const out: LrcLine[] = [];
  for (const raw of lrc.split('\n')) {
    const m = raw.match(/^\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)$/);
    if (!m) continue;
    const time = parseInt(m[1]) * 60 + parseFloat(m[2]);
    const text = m[3].trim();
    if (text) out.push({ time, text });
  }
  return out;
}

function normT(s: string) {
  // Replace every non-alphanumeric with a space (NOT an empty string) so
  // that "Oh-oh" → "oh oh" (two tokens) and "you're" → "you re" — symmetric
  // for both slide text and LRC text. Stripping to empty produced "ohoh"
  // which couldn't fuzzy-match "Oh oh" in a slide line, leaving songs with
  // dashed/onomatopoeia openers unmatched.
  return s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

type MatchKind = 'exact' | 'prefix' | 'suffix' | 'middle' | 'fuzzy' | 'single';

interface LineMatch {
  lrcLine: LrcLine | null;
  lrcIdx: number;
  // How this slide line was anchored. Drives Pass A sub-positioning: only
  // suffix/middle matches should be shifted forward INSIDE the LRC span,
  // because those slide lines start at a non-zero position in the LRC
  // text. prefix/exact/fuzzy/single anchor naturally at LRC.start.
  kind?: MatchKind;
  // Last LRC index this slide line covers (≥ lrcIdx). Set when one slide
  // line absorbs multiple consecutive LRC lines (e.g. slide merged "From
  // the rich to the poor" + "All are welcome through the door" into one).
  endLrcIdx?: number;
}

// Match slide lines to Spotify/LRC lines.
//
// Strategy in order of preference:
//   1. EXACT or PREFIX/SUFFIX-of-LRC — for each slide line collect every
//      next LRC line whose normalised text either equals it OR starts/ends
//      with it (the latter only for short slide lines). Pick the candidate
//      closest to the expected time. This is the fix for "God Is": slide
//      line 0 = "God is" was matching a later standalone "God is" LRC line
//      (35.7 s) instead of the long opening "God is my light in darkness,
//      oh" (3.2 s) which starts with it. Without this, the cursor stayed
//      stuck on the first slide line for 35 s waiting for the wrong anchor.
//   2. FUZZY word-overlap — when no exact/prefix match is found and the
//      line is unique, fall back to wordOverlap*0.65 + positionProximity*0.35.
//   3. SKIP — repeated lines with no exact match remain null and are
//      interpolated by fillTimings().
function matchLinesToLrc(textLines: string[], lrcLines: LrcLine[]): LineMatch[] {
  const N = textLines.length;
  const M = lrcLines.length;
  if (M === 0) return textLines.map(() => ({ lrcLine: null, lrcIdx: -1 }));

  const firstT   = lrcLines[0].time;
  const lastT    = lrcLines[M - 1].time;
  const songSpan = Math.max(lastT - firstT, 30);

  // Index LRC lines by their normalised text for O(1) exact lookups.
  const lrcByNorm = new Map<string, number[]>();
  for (let j = 0; j < M; j++) {
    const k = normT(lrcLines[j].text);
    if (!k) continue;
    const arr = lrcByNorm.get(k);
    if (arr) arr.push(j); else lrcByNorm.set(k, [j]);
  }

  // Pre-compute normalised LRC texts for prefix/suffix scanning.
  const lrcNormCache: string[] = lrcLines.map(l => normT(l.text));

  // Count slide occurrences so we know which lines are repeated.
  const slideRepeat = new Map<string, number>();
  for (const t of textLines) {
    const k = normT(t);
    slideRepeat.set(k, (slideRepeat.get(k) ?? 0) + 1);
  }

  const result: LineMatch[] = [];
  let cursor = 0;

  for (let si = 0; si < N; si++) {
    const rawText = textLines[si];
    const normKey = normT(rawText);
    const words   = normKey.split(' ').filter(Boolean);

    if (words.length < 2) {
      // 1-word slide lines (e.g. "Pain!", "Yeah!") used to be dropped to
      // avoid false anchors on common interjections. But songs like
      // Believer have many "Pain!" lines that match standalone "Pain!"
      // LRC lines exactly — dropping them left huge interpolation gaps
      // mid-chorus that felt like the cursor was "stuck". Allow the
      // match ONLY when the slide token is ≥ 2 chars AND LRC has the
      // SAME word as a standalone line, picking the cursor-onward
      // occurrence closest to the expected time.
      if (normKey.length >= 2) {
        const exactList = lrcByNorm.get(normKey);
        if (exactList) {
          const expectedT = firstT + (si / Math.max(N - 1, 1)) * songSpan;
          let bestIdx = -1, bestDist = Infinity;
          for (const j of exactList) {
            if (j < cursor) continue;
            const dist = Math.abs(lrcLines[j].time - expectedT);
            if (dist < bestDist) { bestDist = dist; bestIdx = j; }
          }
          if (bestIdx >= 0) {
            result.push({ lrcLine: lrcLines[bestIdx], lrcIdx: bestIdx, kind: 'single' });
            cursor = Math.max(cursor, bestIdx + 1);
            continue;
          }
        }
      }
      result.push({ lrcLine: null, lrcIdx: -1 });
      continue;
    }

    // Helper: if the slide line is significantly longer than the matched LRC
    // line, try to absorb the next 1-3 LRC lines whose words also appear in
    // the slide. Returns the inclusive endLrcIdx.
    const slideSet = new Set(words);
    function extendMatch(startIdx: number): number {
      let end = startIdx;
      const startWords = normT(lrcLines[startIdx].text).split(' ').filter(Boolean);
      // Only consider extension if the slide line has notably more words
      // than the matched LRC line (typical multi-LRC-line case).
      if (words.length < startWords.length * 1.4) return end;
      for (let k = 1; k <= 3 && end + 1 < M; k++) {
        const candWords = normT(lrcLines[end + 1].text).split(' ').filter(Boolean);
        if (!candWords.length) break;
        const hits = candWords.filter(w => slideSet.has(w)).length;
        // Strict overlap to avoid grabbing the next verse by accident.
        if (hits >= 2 && hits / candWords.length >= 0.5) {
          end++;
        } else {
          break;
        }
      }
      return end;
    }

    const expectedT = firstT + (si / Math.max(N - 1, 1)) * songSpan;

    // ── 1. Collect exact / prefix / suffix / middle candidates.
    //
    // Multi-slide-to-one-LRC: a slide often splits one long LRC line
    // ("If we were a movie, you'd be the right guy") into several short
    // ones ("If we were a movie" + "You'd be the right guy"). The cursor
    // must therefore stay on the LRC line until ALL of its sub-pieces are
    // consumed. We allow scanning from `cursor` (not cursor-1) because a
    // prefix-match keeps the cursor on that LRC line; only an EXACT or
    // SUFFIX match advances past it. So scanning from cursor naturally
    // reaches the still-unconsumed LRC line when needed.
    type ScanKind = 'exact' | 'prefix' | 'suffix' | 'middle';
    const candidates: { idx: number; kind: ScanKind }[] = [];
    const scanStart = cursor;

    const exactList = lrcByNorm.get(normKey);
    if (exactList) for (const j of exactList) if (j >= scanStart) candidates.push({ idx: j, kind: 'exact' });

    // Prefix/suffix/middle scan over LRC lines starting from scanStart.
    // No word-count limit — long slide lines can legitimately be prefixes
    // of longer LRC lines too. Pass A sub-positions the final time inside
    // the LRC span using the character offset of the slide text.
    for (let j = scanStart; j < M; j++) {
      const ln = lrcNormCache[j];
      if (!ln || ln === normKey) continue;
      if (ln.startsWith(normKey + ' '))     candidates.push({ idx: j, kind: 'prefix' });
      else if (ln.endsWith(' ' + normKey))  candidates.push({ idx: j, kind: 'suffix' });
      else if (ln.includes(' ' + normKey + ' ')) candidates.push({ idx: j, kind: 'middle' });
    }

    if (candidates.length > 0) {
      // Score each candidate as 0.7 × time-proximity + 0.3 × match-quality.
      //   • Quality alone (exact > prefix > suffix > middle) wrongly picked
      //     a far-future standalone "God is" LRC line over the opening long
      //     "God is my light…" LRC line for slide line 0 of God Is.
      //   • Proximity alone wrongly picked a fuzzy/short overlap inside the
      //     intro span when an exact match existed a little later.
      // The 70/30 blend favours the line at the right TIME and only uses
      // quality to break near-ties.
      const QUALITY: Record<ScanKind, number> = { exact: 3, prefix: 2, suffix: 1.5, middle: 1 };
      function combinedScore(c: { idx: number; kind: ScanKind }): number {
        const dist = Math.abs(lrcLines[c.idx].time - expectedT) / Math.max(songSpan, 1);
        const prox = Math.max(0, 1 - dist);
        const qual = QUALITY[c.kind] / 3;
        return 0.7 * prox + 0.3 * qual;
      }
      candidates.sort((a, b) => {
        const sa = combinedScore(a);
        const sb = combinedScore(b);
        if (sa !== sb) return sb - sa;
        return a.idx - b.idx;
      });
      const best = candidates[0];
      // Only extend when the slide line was an EXACT match (longer slide
      // absorbs multiple short LRC lines). Prefix/suffix/middle matches
      // are subsets of one LRC line, so they don't extend.
      const endIdx = best.kind === 'exact' ? extendMatch(best.idx) : best.idx;
      result.push({ lrcLine: lrcLines[best.idx], lrcIdx: best.idx, kind: best.kind, endLrcIdx: endIdx });
      // Cursor advancement rule:
      //   exact / suffix → LRC line is fully consumed, advance past it.
      //   prefix / middle → more pieces of this LRC line may follow in the
      //                     next slide line, don't advance past it yet.
      if (best.kind === 'exact' || best.kind === 'suffix') {
        cursor = Math.max(cursor, endIdx + 1);
      } else {
        cursor = Math.max(cursor, best.idx);
      }
      continue;
    }

    // ── 2. Fuzzy word-overlap (only for unique slide lines — fuzzy on a
    //      repeated line risks false anchors that drag everything after).
    if ((slideRepeat.get(normKey) ?? 0) > 1) {
      result.push({ lrcLine: null, lrcIdx: -1 });
      continue;
    }

    const wset      = new Set(words);
    const maxDev    = songSpan * 0.25;

    let bestScore = -1, bestIdx = -1;
    const end = Math.min(cursor + 60, M);
    for (let j = cursor; j < end; j++) {
      const src = lrcNormCache[j].split(' ').filter(Boolean);
      if (!src.length) continue;
      const hits      = src.filter(w => wset.has(w)).length;
      const wordScore = hits / Math.max(wset.size, src.length);
      if (wordScore < 0.30) continue;

      const timeDiff  = Math.abs(lrcLines[j].time - expectedT);
      const proxScore = Math.max(0, 1 - timeDiff / maxDev);
      const score     = wordScore * 0.65 + proxScore * 0.35;
      if (score > bestScore) { bestScore = score; bestIdx = j; }
    }

    if (bestScore >= 0.35 && bestIdx >= 0) {
      const endIdx = extendMatch(bestIdx);
      result.push({ lrcLine: lrcLines[bestIdx], lrcIdx: bestIdx, kind: 'fuzzy', endLrcIdx: endIdx });
      cursor = endIdx + 1;
    } else {
      result.push({ lrcLine: null, lrcIdx: -1 });
    }
  }
  return result;
}

// Fill null timestamps by linear interpolation between known anchor points.
// Pre-anchor lines are distributed proportionally between 0 and the first anchor —
// this prevents the old backward fixed-gap extrapolation from placing early lines
// at timestamps that are already deep in the song (causing the "scroll stuck then
// sudden jump" symptom when the first matched anchor is in verse 2 or later).
function fillTimings(raw: (number | null | undefined)[], dur: number): number[] {
  const known: { i: number; t: number }[] = [];
  raw.forEach((t, i) => { if (t != null && Number.isFinite(t)) known.push({ i, t }); });

  if (known.length === 0) {
    // No LRC match at all — fall back to uniform
    const s = 0.08 * dur, e = 0.93 * dur;
    return raw.map((_, i) => s + (i / Math.max(raw.length - 1, 1)) * (e - s));
  }

  const result = new Array<number>(raw.length);
  // Fill known values and interpolate between them
  for (let k = 0; k < known.length; k++) {
    result[known[k].i] = known[k].t;
    const next = known[k + 1];
    if (next) {
      const gap = (next.t - known[k].t) / (next.i - known[k].i);
      for (let i = known[k].i + 1; i < next.i; i++)
        result[i] = known[k].t + gap * (i - known[k].i);
    }
  }
  const first = known[0], last = known[known.length - 1];
  // Before first anchor: extrapolate BACKWARD from first.t using the local
  // per-line pace, instead of distributing from t=0. Distributing from 0
  // makes the cursor crawl through every pre-anchor line during the
  // instrumental intro (line 0 fires the instant the user hits play), which
  // is the "lyrics start running before the singer" symptom. By walking
  // back at the song's actual cadence, line 0 lands close to where the
  // first vocal phrase truly begins.
  if (first.i > 0) {
    const localGap = known.length >= 2
      ? (known[1].t - known[0].t) / Math.max(known[1].i - known[0].i, 1)
      : 2.5;
    const introStart = Math.max(0, first.t - localGap * first.i);
    const introSpan  = first.t - introStart;
    for (let i = 0; i < first.i; i++)
      result[i] = introStart + (i / first.i) * introSpan;
  }
  // After last anchor: proportional between last.t and song end.
  const songEnd = Math.max(last.t + 5, dur * 0.97);
  for (let i = last.i + 1; i < raw.length; i++)
    result[i] = last.t + ((i - last.i) / (raw.length - last.i)) * (songEnd - last.t);
  return result;
}

// Estimate when each LINE ends, balancing three failure modes:
//   • Instrumental gaps   → lt[li+1] - lt[li] can balloon to 8-20 s; must
//                            NOT trust that as the end of the sung line.
//   • Sustained vocals    → "You are" (2 words) can take 5-6 s in a power
//                            ballad; a tight word-budget would pause early.
//   • Long sung phrases   → "My light in darkness, oh" can take 10-13 s
//                            with breaths; an aggressive 0.55 s/word budget
//                            also pauses early.
//
// Heuristic:
//   - Short lines (≤3 words): trust knownEnd up to 8 s, since sustains
//     are common.
//   - Long lines (≥4 words): cap knownEnd at a generous wordCount*1.0+2 s
//     budget. That's enough room for sung English with rests, but tight
//     enough to filter pure instrumental gaps (>15 s).
const SHORT_LINE_MAX_END  = 8.0;  // cap for sustained short lines
const SHORT_LINE_FALLBACK = 4.5;  // fallback when no anchor info

function estimateLineEnd(
  lineStart: number,
  origLine: string,
  nextLineStart: number | undefined,
  knownEnd: number | undefined,
): number {
  const wordCount = origLine.trim().split(/\s+/).filter(Boolean).length;
  const isShort   = wordCount <= 3;
  // Generous budget for sung lyrics with rests/breaths.
  const longCap   = lineStart + Math.max(3.5, wordCount * 1.0 + 2.0);
  // Pure-estimate fallback (used when we have no anchor info at all).
  const fallback  = lineStart + Math.max(3.0, wordCount * 0.65 + 1.2);

  if (knownEnd != null && knownEnd > lineStart + 0.3) {
    return isShort
      ? Math.min(knownEnd, lineStart + SHORT_LINE_MAX_END)
      : Math.min(knownEnd, longCap);
  }
  if (nextLineStart != null && Number.isFinite(nextLineStart) && nextLineStart > lineStart + 0.3) {
    return isShort
      ? Math.min(nextLineStart, lineStart + SHORT_LINE_MAX_END)
      : Math.min(nextLineStart, longCap);
  }
  return isShort ? lineStart + SHORT_LINE_FALLBACK : fallback;
}

// Per-blank trigger time = end of the line that contains the blank + 0.4 s.
// This matches the original "wait until the whole line has been sung" behavior
// so the student hears the blank word in full context before being asked.
// The "answer-before-pause" UX is layered on top: as soon as the karaoke
// cursor reaches the line, the buttons unlock and a correct early answer
// skips the pause entirely.
const POST_LINE_BUFFER = 0.4;

function buildBlankTimingsWordAware(
  blanksData: LyricsBlank[],
  blankLineIdx: number[],
  originalLines: string[],
  lt: number[],
  lineEndTimes?: (number | undefined)[],
): number[] {
  const out: number[] = new Array(blanksData.length);

  for (let i = 0; i < blanksData.length; i++) {
    const li         = blankLineIdx[i] ?? 0;
    const origLine   = originalLines[li] ?? '';
    const lineStart  = lt[li];
    const nextStart  = li + 1 < lt.length ? lt[li + 1] : undefined;
    const knownEnd   = lineEndTimes?.[li];

    const lineEnd = estimateLineEnd(lineStart, origLine, nextStart, knownEnd);
    out[i] = lineEnd + POST_LINE_BUFFER;
  }
  return out;
}

const DEFAULT_DURATION = 200;

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function LyricsGameSlide({ slide, youtubeUrl: youtubeUrlProp }: Props) {
  const blanksData: LyricsBlank[] = slide.blanksData ?? [];
  const numBlanks   = blanksData.length;
  const lyricsText  = slide.content ?? '';
  const rawUrl      = youtubeUrlProp ?? slide.songData?.youtubeUrl ?? null;
  const videoId     = rawUrl ? extractVideoId(rawUrl) : null;
  const parsed         = parseLines(lyricsText);
  const lyricsLines    = parsed.lines;
  const blankLineIdx   = parsed.blankLineIdx;
  const originalLines  = (slide.songData?.lyrics ?? lyricsText.replace(/\{\{blank\}\}/g, '___')).split('\n');
  const totalLines     = lyricsLines.length;

  // ── Game state ────────────────────────────────────────────────────────────
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
  const [lrcStatus, setLrcStatus]             = useState<'loading'|'synced'|'estimated'>('loading');
  const [videoBlocked, setVideoBlocked]       = useState(false);
  const [debugOpen, setDebugOpen]             = useState(false);

  // Per-song sync offset persistence (localStorage). Teacher tunes once;
  // every subsequent run of the same song picks the same offset automatically.
  // The `_v3` suffix invalidates offsets cached before the per-lesson
  // `songData.syncOffsetSeconds` baked default landed — old teacher nudges
  // (often only a few seconds) would otherwise silently override the baked
  // value on lessons like Wannabe where the cropped video needs +49s.
  const songOffsetKey = (() => {
    const t = slide.songData?.title?.trim();
    const a = slide.songData?.artist?.trim();
    return t ? `ft_sync_offset_v3:${(a ?? '').toLowerCase()}::${t.toLowerCase()}` : null;
  })();

  useEffect(() => {
    if (!songOffsetKey || typeof window === 'undefined') return;
    const raw   = window.localStorage.getItem(songOffsetKey);
    const local = raw != null ? parseInt(raw, 10) : NaN;
    const baked = Number(slide.songData?.syncOffsetSeconds ?? 0);
    // localStorage nudges (non-zero) win; otherwise fall back to the baked
    // per-song default so cropped videos work out-of-the-box for everyone.
    const initial = Number.isFinite(local) && local !== 0
      ? local
      : (Number.isFinite(baked) ? baked : 0);
    if (initial !== 0) {
      syncOffsetRef.current = initial;
      setSyncOffset(initial);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songOffsetKey]);

  function applySyncOffsetDelta(delta: number) {
    const n = syncOffsetRef.current + delta;
    syncOffsetRef.current = n;
    setSyncOffset(n);
    if (songOffsetKey && typeof window !== 'undefined') {
      window.localStorage.setItem(songOffsetKey, String(n));
    }
  }

  // ── Refs ──────────────────────────────────────────────────────────────────
  const answersRef        = useRef<(string | null)[]>(Array(numBlanks).fill(null));
  const currentIdxRef     = useRef(0);
  const waitingRef        = useRef(false);
  const cooldownRef       = useRef(false);
  const timerRunningRef   = useRef(false);
  const intentPausedRef   = useRef(false); // true when WE paused (not user)
  const intervalRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTsRef        = useRef<number | null>(null);
  const pausedPosRef      = useRef(0);
  const lineEls           = useRef<(HTMLDivElement | null)[]>([]);
  const lyricsRef         = useRef<HTMLDivElement | null>(null);
  const iframeRef         = useRef<HTMLIFrameElement | null>(null);
  const durationSetRef    = useRef(false);
  const songDurationRef   = useRef(DEFAULT_DURATION);
  const syncOffsetRef     = useRef(0);
  const lrcLoadedRef      = useRef(false);


  // Timings recalculated when real duration arrives
  const lineTimings = useRef(buildLineTimings(lyricsLines, DEFAULT_DURATION));
  const timings     = useRef(buildBlankTimingsFallback(blanksData, blankLineIdx, originalLines, lyricsLines, DEFAULT_DURATION));
  // For debug overlay: which slide lines were matched directly (true) vs interpolated (false).
  const lineMatched     = useRef<boolean[]>(new Array(totalLines).fill(false));
  const lyricsSourceRef = useRef<string>('—'); // 'spotify' | 'lrclib' | 'lrclib-search' | 'musixmatch' | '—'
  // Last YouTube playerState reported back to us (-1 unstarted, 0 ended,
  // 1 playing, 2 paused, 3 buffering). Used to confirm pause acknowledgement
  // and to drive a retry loop when the iframe ignores our first pauseVideo.
  const ytStateRef        = useRef<number>(-1);
  const ytLastCtRef       = useRef<number>(0);
  const pauseRetryRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── YouTube postMessage helpers ───────────────────────────────────────────
  function ytCmd(func: string, args: unknown[] = []) {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args }), '*',
    );
  }
  function pauseYT() { ytCmd('pauseVideo'); }
  function playYT()  { ytCmd('playVideo'); }
  function seekYT(t: number) { ytCmd('seekTo', [Math.max(0, t), true]); }

  // Send pauseVideo repeatedly until YouTube reports state=2 (paused) or we
  // give up (15 attempts × 150 ms = 2.25 s). The first postMessage can be
  // dropped if the player just transitioned states; we keep nudging until
  // the iframe acknowledges. This is the fix for "video keeps playing even
  // though we paused".
  function firePauseAndRetry() {
    if (pauseRetryRef.current) clearInterval(pauseRetryRef.current);
    pauseYT();
    let attempts = 0;
    pauseRetryRef.current = setInterval(() => {
      // Stop retrying if we no longer want a pause, or YouTube confirmed it,
      // or we exhausted attempts.
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

  // ── YouTube message listener (onStateChange + infoDelivery) ─────────────
  // playerState: -1=unstarted, 0=ended, 1=playing, 2=paused, 3=buffering
  useEffect(() => {
    function applyYTPause(ct?: number) {
      if (intentPausedRef.current) {
        // This pause was triggered by our code — consume the flag and ignore.
        intentPausedRef.current = false;
        return;
      }
      if (!timerRunningRef.current) return;
      // User paused via YouTube controls → pause our timer too.
      pausedPosRef.current    = ct ?? (pausedPosRef.current + (startTsRef.current ? (Date.now() - startTsRef.current) / 1000 : 0));
      startTsRef.current      = null;
      timerRunningRef.current = false;
      setTimerRunning(false);
    }

    function applyYTPlay(ct?: number) {
      // CRITICAL: when we are waiting for an answer (or just asked YouTube to
      // pause), YouTube can still emit playerState=1 for ~100-300 ms because
      // the pauseVideo postMessage hasn't propagated yet. If we update
      // pausedPosRef here we silently push the local timer forward past the
      // intended pause point — and our retry pauseYT becomes pointless.
      // Ignore play events entirely while we're in a pause window.
      if (waitingRef.current || intentPausedRef.current) return;

      if (ct !== undefined) {
        pausedPosRef.current = ct;
        startTsRef.current   = Date.now();
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

        // Error codes 101/150 = embedding blocked by rights holder
        if (data.event === 'onError' && (data.info === 101 || data.info === 150)) {
          setVideoBlocked(true);
          return;
        }

        // onStateChange fires immediately on pause/play — most reliable for sync.
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

        // Update timings when real duration arrives (once, skip if LRC already loaded)
        if (duration && duration > 0 && !durationSetRef.current) {
          durationSetRef.current  = true;
          songDurationRef.current = duration;
          if (!lrcLoadedRef.current) {
            lineTimings.current = buildLineTimings(lyricsLines, duration);
            timings.current     = buildBlankTimingsFallback(blanksData, blankLineIdx, originalLines, lyricsLines, duration);
          }
        }

        // Continuously re-sync local timer from YouTube's actual currentTime.
        // This corrects drift even if our timer got out of step.
        if (playerState === 1) applyYTPlay(currentTime);
        else if (playerState === 2) applyYTPause(currentTime);

      } catch { /* ignore non-JSON messages */ }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalLines]);

  // ── Sync timestamps: single backend call (orchestrates spotify/lrclib/musixmatch) ──
  useEffect(() => {
    const title  = slide.songData?.title;
    const artist = slide.songData?.artist;
    if (!title) { setLrcStatus('estimated'); return; }

    function applyLrcLines(lrcLines: LrcLine[]) {
      if (lrcLines.length < 3) { setLrcStatus('estimated'); return; }
      const dur = songDurationRef.current;

      // Use original (unblanked) lyrics for matching — blank markers reduce word overlap
      const originalLyrics = slide.songData?.lyrics ?? '';
      const textForMatching = originalLyrics
        ? originalLyrics.split('\n')
        : lyricsLines.map(line => line.map(s => s.type === 'text' ? s.text : '').join(''));

      const rawMatches = matchLinesToLrc(textForMatching, lrcLines);

      // ── Sub-positioning inside long LRC lines ─────────────────────────
      // Songs like "God Is" have lrclib LRC lines that span multiple slide
      // lines (one 17-second LRC line vs two slide lines: "God is" + "My
      // light in darkness, oh"). Without this fix, fillTimings drops the
      // first slide line at t=0 and the second at the LRC line's start
      // (3.22s) — leaving the cursor stuck 17 s on the second line.
      //
      // For every matched slide line, find where its first content word
      // appears inside the matched LRC line text and shift its anchor
      // proportionally inside the LRC line's time span. For each NULL
      // slide line, if a nearby matched line points to the same long LRC
      // line, anchor the null line at its own char-position within that
      // LRC line too.
      const anchorTimes: (number | null)[] = rawMatches.map(m => m.lrcLine?.time ?? null);
      const lineEndTimes: (number | undefined)[] = new Array(rawMatches.length);

      function lrcSpan(idx: number): { start: number; end: number; text: string } | null {
        if (idx < 0 || idx >= lrcLines.length) return null;
        const l = lrcLines[idx];
        const end = l.endTime ?? lrcLines[idx + 1]?.time;
        if (end == null || end <= l.time) return null;
        return { start: l.time, end, text: l.text };
      }

      function firstWordCharPos(slideText: string, lrcText: string): number {
        const words = slideText.toLowerCase().split(/\s+/).filter(w => w.length >= 2);
        const lower = lrcText.toLowerCase();
        for (const w of words) {
          const re = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
          const m = lower.match(re);
          if (m && typeof m.index === 'number') return m.index;
        }
        return -1;
      }

      const SUB_POS_MIN_SPAN = 2.5; // seconds — only sub-position if LRC line is this long
      // Singers usually take a tiny breath / pause before each phrase that
      // char-position alone can't see, so the sub-positioned anchor would
      // fire JUST before the singer actually arrives at the word — feeling
      // like the cursor "rushes" the lyrics. Nudging each sub-position by
      // 5 % of the LRC span (≈ 0.2-0.3 s on a typical 4-6 s line) puts the
      // cursor flip right on the singer's onset.
      const SUB_POS_NUDGE_FRAC = 0.05;

      // Pass A: adjust matched slide lines whose text starts somewhere
      // INSIDE a long LRC line.
      for (let i = 0; i < rawMatches.length; i++) {
        const lrcIdx = rawMatches[i].lrcIdx;
        if (lrcIdx < 0) continue;
        const span = lrcSpan(lrcIdx);
        if (!span) continue;
        const spanLen = span.end - span.start;
        if (spanLen < SUB_POS_MIN_SPAN) continue;

        const charPos = firstWordCharPos(textForMatching[i] ?? '', span.text);
        if (charPos <= 0) continue; // -1 → no match; 0 → already at start, no shift

        const ratio = charPos / Math.max(span.text.length, 1);
        anchorTimes[i] = span.start + ratio * spanLen + SUB_POS_NUDGE_FRAC * spanLen;
      }

      // Pass B: anchor NULL slide lines that belong to the same long LRC
      // line as a neighbouring matched line.
      //
      // The "God Is" case: slide has two lines "God is" + "My light in
      // darkness, oh" that both correspond to ONE LRC line "God is my
      // light in darkness oh" (spans ~17s). The first slide line matches
      // it; the second goes null. The old heuristic preferred the NEXT
      // neighbour's LRC line, which placed "My light…" inside the NEXT
      // verse — leaving the cursor stuck on "God is" for the whole 17s
      // and then jumping forward several lines at once.
      //
      // New heuristic: try BOTH neighbours; pick whichever LRC line
      // actually contains the slide line's first content word. This
      // correctly anchors continuation lines to the previous (long) LRC
      // line, and falls back to the next neighbour for genuine gaps.
      function tryAnchorFromLrc(lrcIdx: number, slideText: string): number | null {
        if (lrcIdx < 0) return null;
        const span = lrcSpan(lrcIdx);
        if (!span) return null;
        const spanLen = span.end - span.start;
        if (spanLen < SUB_POS_MIN_SPAN) return null;
        const charPos = firstWordCharPos(slideText, span.text);
        if (charPos < 0) return null;
        const ratio = charPos / Math.max(span.text.length, 1);
        // Same anti-rush nudge as Pass A — only when there's actually a
        // shift forward (charPos > 0). A null slide line that anchors at
        // the very start of an LRC line should fire immediately.
        const nudge = charPos > 0 ? SUB_POS_NUDGE_FRAC * spanLen : 0;
        return span.start + ratio * spanLen + nudge;
      }

      for (let i = 0; i < rawMatches.length; i++) {
        if (rawMatches[i].lrcLine != null) continue;

        // Find the matched neighbour on either side.
        let prev = i - 1; while (prev >= 0 && rawMatches[prev].lrcLine == null) prev--;
        let next = i + 1; while (next < rawMatches.length && rawMatches[next].lrcLine == null) next++;

        const prevIdx = prev >= 0 ? rawMatches[prev].lrcIdx : -1;
        const nextIdx = next < rawMatches.length ? rawMatches[next].lrcIdx : -1;
        const slideText = textForMatching[i] ?? '';

        // Prefer prev when its LRC text contains this slide line — that's
        // the multi-LRC-line continuation case. Otherwise try next.
        const prevAnchor = tryAnchorFromLrc(prevIdx, slideText);
        if (prevAnchor != null) {
          anchorTimes[i] = prevAnchor;
          continue;
        }
        const nextAnchor = tryAnchorFromLrc(nextIdx, slideText);
        if (nextAnchor != null) {
          anchorTimes[i] = nextAnchor;
        }
      }

      const rawLt = fillTimings(anchorTimes, dur);

      // lineEndTimes — pick the latest plausible end among:
      //   (a) the LAST LRC line this slide line covers (endLrcIdx ≥ lrcIdx),
      //       endTime of LRC[endLrcIdx]. This is the real end-of-sung-line.
      //   (b) anchorTimes[i+1] — start of the next slide line.
      // Take the MAX of (a) and (b) so we don't cut a sung phrase short when
      // a slide line covers multiple LRC lines.
      for (let i = 0; i < rawMatches.length; i++) {
        const m = rawMatches[i];
        const next = i + 1 < anchorTimes.length ? anchorTimes[i + 1] : null;

        let candA: number | undefined;
        if (m.lrcIdx >= 0) {
          const endIdx = m.endLrcIdx ?? m.lrcIdx;
          candA = lrcLines[endIdx]?.endTime ?? lrcLines[endIdx + 1]?.time;
        }
        const candB = next != null && Number.isFinite(next) ? next : undefined;

        if (candA != null && candB != null) {
          lineEndTimes[i] = Math.max(candA, candB);
        } else {
          lineEndTimes[i] = candA ?? candB;
        }
      }

      const fallbackLt = buildLineTimings(lyricsLines, dur > 10 ? dur : DEFAULT_DURATION);
      const lt = rawLt.map((t, i) => Number.isFinite(t) ? t : fallbackLt[i]);
      lrcLoadedRef.current = true;
      lineTimings.current  = lt;
      lineMatched.current  = rawMatches.map(m => m.lrcIdx >= 0);
      timings.current      = buildBlankTimingsWordAware(blanksData, blankLineIdx, originalLines, lt, lineEndTimes);
      setLrcStatus('synced');
    }

    const sp = new URLSearchParams({ title });
    if (artist) sp.set('artist', artist);

    fetch(`/api/spotify-lyrics?${sp}`)
      .then(r => r.ok ? r.json() : null)
      .then((data: { syncType?: string; lines?: { startTimeMs: string; words: string; endTimeMs?: string }[]; source?: string } | null) => {
        if (data?.lines && data.lines.length > 2) {
          if (data.source) lyricsSourceRef.current = data.source;
          const converted: LrcLine[] = data.lines
            .map(l => ({
              time: parseInt(l.startTimeMs) / 1000,
              text: l.words,
              endTime: l.endTimeMs ? parseInt(l.endTimeMs) / 1000 : undefined,
            }))
            .filter(l => Number.isFinite(l.time) && l.text.trim());
          if (converted.length > 2) {
            applyLrcLines(converted);
            return;
          }
        }
        setLrcStatus('estimated');
      })
      .catch(() => setLrcStatus('estimated'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Spotify auto-scroll ───────────────────────────────────────────────────
  useEffect(() => {
    const container = lyricsRef.current;
    const el = lineEls.current[currentLineIdx];
    if (!container || !el) return;
    container.scrollTo({
      top: el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2,
      behavior: 'smooth',
    });
  }, [currentLineIdx]);

  // ── Timer helpers ─────────────────────────────────────────────────────────
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
    pausedPosRef.current    = getCurrentPos();
    startTsRef.current      = null;
    timerRunningRef.current = false;
    intentPausedRef.current = true;
    setTimerRunning(false);
  }

  function resumeTimer() {
    startTsRef.current      = Date.now();
    timerRunningRef.current = true;
    intentPausedRef.current = false;
    setTimerRunning(true);
  }

  function shiftTimer(deltaSec: number) {
    const next = Math.max(0, getCurrentPos() + deltaSec);
    pausedPosRef.current = next;
    if (startTsRef.current !== null) startTsRef.current = Date.now();
    seekYT(next);
  }

  // ── Polling interval ──────────────────────────────────────────────────────
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (!timerRunningRef.current) return;

      const t   = getCurrentPos();
      const dur = songDurationRef.current;
      setProgress(Math.min(t / dur, 1));
      setElapsed(t);

      // Scroll lyrics
      const lt = lineTimings.current;
      const off = syncOffsetRef.current;
      if (lt.length > 0) {
        let li = 0;
        for (let i = 0; i < lt.length; i++) if (t >= lt[i] + off) li = i;
        setCurrentLineIdx(li);
      }

      // Trigger blank
      if (waitingRef.current || cooldownRef.current) return;
      const bi = currentIdxRef.current;
      if (bi < numBlanks && Number.isFinite(timings.current[bi]) && t >= timings.current[bi] + off) {
        pauseTimer();
        waitingRef.current = true;
        setWaiting(true);
        // Robust pause — keeps nudging YouTube until it confirms state=2.
        firePauseAndRetry();
      }
    }, 50);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopPauseRetry();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numBlanks]);

  // ── Controls ──────────────────────────────────────────────────────────────
  function handleStart() {
    setStarted(true);
    setVideoAutoplay(true);
    setVideoKey('playing');
    startTimer();
  }

  function handlePause()  { pauseTimer(); firePauseAndRetry(); }
  function handleResume() { stopPauseRetry(); resumeTimer(); playYT(); }

  function handleRewind() {
    stopPauseRetry();
    shiftTimer(-5);
    waitingRef.current  = false;
    cooldownRef.current = true;
    setWaiting(false);
    resumeTimer();
    playYT();
    setTimeout(() => { cooldownRef.current = false; }, 1200);
  }

  function handleForward() { shiftTimer(5); }

  // A blank is "accessible" when:
  //   • we are paused waiting for it (classic flow), OR
  //   • the karaoke cursor has already reached its line — so the student can
  //     try to answer BEFORE the pause and skip it entirely.
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
      answersRef.current  = na;
      setAnswers([...na]);
      setAnswerOk(prev => { const n = [...prev]; n[currentBlankIdx] = true; return n; });
      setScore(s => s + 10);
      setCorrect(c => c + 1);

      const next = currentBlankIdx + 1;
      setCurrentBlankIdx(next);
      currentIdxRef.current = next;

      // If next blank would fire immediately (trigger already past), give at
      // least 2 s of audio so the user can hear context before the next pause.
      // `timings.current[i]` is in LRC-time (no offset); the polling triggers
      // when `t >= timings[i] + off`. To ensure the *effective* trigger is 2 s
      // from now, we subtract the sync offset when writing back. Also bumps
      // NaN/undefined anchors so blanks with a missing LRC match still fire.
      if (next < numBlanks) {
        const minNext = getCurrentPos() + 2.0 - syncOffsetRef.current;
        const cur = timings.current[next];
        if (!Number.isFinite(cur) || cur < minNext) timings.current[next] = minNext;
      }

      cooldownRef.current = true;
      if (!earlyMode) {
        // Classic pause-flow: we paused YouTube, now resume it.
        stopPauseRetry();
        waitingRef.current = false;
        setWaiting(false);
        resumeTimer();
        playYT();
      }
      setTimeout(() => { cooldownRef.current = false; }, 800);
    } else {
      // Wrong — flash + count. In early-mode the blank stays open; the student
      // can keep trying until the pause actually fires.
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

  // Build a readable version of the line containing the current blank (shown while waiting)
  const currentBlankLineText = (() => {
    for (const line of lyricsLines) {
      for (const seg of line) {
        if (seg.type === 'blank' && seg.idx === currentBlankIdx) {
          return line.map(s => s.type === 'text' ? s.text : '____').join('');
        }
      }
    }
    return '';
  })();

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div
      className="relative flex flex-col bg-[#1E0F35] text-white overflow-hidden"
      style={{ height: '100%', minHeight: 480 }}
    >

      {/* ── Thin top bar ───────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-1.5 bg-black/50 border-b border-white/10">
        <div className="flex-1 min-w-0">
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#7B5EA7] to-[#C8A8DC] transition-all duration-300 rounded-full"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
        <p className="text-[10px] text-white/45 flex-shrink-0 truncate max-w-[220px]">
          {slide.songData?.title} · {slide.songData?.artist}
        </p>
        <span className={`text-[9px] font-semibold flex-shrink-0 px-1.5 py-0.5 rounded-full
          ${lrcStatus === 'synced'    ? 'bg-green-500/20 text-green-400'
          : lrcStatus === 'estimated' ? 'bg-white/10 text-white/30'
                                      : 'bg-white/5 text-white/20'}`}>
          {lrcStatus === 'synced' ? '♪ sync' : lrcStatus === 'estimated' ? '~ est' : '…'}
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

      {/* ── Main 2-column area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0">

        {/* Left: Lyrics ────────────────────────────────────────────────────── */}
        <div
          ref={lyricsRef}
          className="flex-1 min-w-0 overflow-y-auto"
          style={{ scrollbarWidth: 'none' }}
        >
          <div style={{ height: 72 }} />
          {lyricsLines.map((line, lineIdx) => {
            const dist     = lineIdx - currentLineIdx;
            const isActive = dist === 0;
            const isNear   = Math.abs(dist) === 1;
            const isPast   = dist < 0;
            return (
              <div
                key={lineIdx}
                ref={el => { lineEls.current[lineIdx] = el; }}
                className={`text-center px-6 py-1.5 transition-all duration-500 leading-snug select-none
                  ${isActive ? 'text-white font-bold text-[1.1rem]'
                    : isNear  ? 'text-white/50 font-medium text-[0.92rem]'
                    : isPast  ? 'text-white/20 text-sm'
                               : 'text-white/25 text-sm'}`}
              >
                {line.map((seg, segIdx) => {
                  if (seg.type === 'text') return <span key={segIdx}>{seg.text}</span>;
                  const i         = seg.idx;
                  const answered  = answers[i] !== null;
                  const isCurrent = i === currentBlankIdx;
                  return (
                    <span
                      key={segIdx}
                      className={`inline-block min-w-[68px] text-center px-2 py-0.5 mx-1 rounded-xl font-bold text-base transition-all duration-300
                        ${answered
                          ? 'bg-green-500 text-white shadow-md'
                          : isCurrent
                            ? `bg-yellow-300 text-[#1E0F35] shadow-lg scale-105 ${wrongFlash ? 'ring-2 ring-red-400' : 'ring-2 ring-yellow-100/60'}`
                            : i < currentBlankIdx ? 'bg-white/5 text-white/20' : 'bg-white/10 text-white/30'
                        }`}
                    >
                      {answered ? answers[i] : isCurrent ? '?' : '···'}
                    </span>
                  );
                })}
              </div>
            );
          })}
          <div style={{ height: 72 }} />
        </div>

        {/* Right sidebar ───────────────────────────────────────────────────── */}
        <div className="w-96 flex-shrink-0 flex flex-col border-l border-white/10 bg-[#160C28]">

          {/* Score panel */}
          <div className="flex-shrink-0 p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-white/40 uppercase tracking-widest">Puntaje</span>
              <span className="text-[10px] text-[#C8A8DC]">{answeredCount}/{numBlanks}</span>
            </div>
            <div className="text-3xl font-bold text-white leading-none">
              {score} <span className="text-sm font-normal text-white/35">pts</span>
            </div>
            <div className="flex gap-4 mt-2 text-sm font-semibold">
              <span className="text-green-400">✓ {correct}</span>
              <span className="text-red-400">✗ {wrong}</span>
            </div>
          </div>

          {/* YouTube video */}
          <div className="flex-1 bg-black min-h-0 overflow-hidden">
            {videoId && !videoBlocked ? (
              <iframe
                key={videoKey}
                ref={iframeRef}
                src={`https://www.youtube.com/embed/${videoId}?${videoAutoplay ? 'autoplay=1&' : ''}controls=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(typeof window === 'undefined' ? 'https://friendlyteaching.cl' : window.location.origin)}`}
                className="w-full h-full"
                style={{ border: 'none', display: 'block', minHeight: 150 }}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : videoBlocked ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-5 text-center">
                <p className="text-white/50 text-xs leading-relaxed">
                  Este video no permite reproducción embebida.<br />
                  Ábrelo en YouTube y usa el timer de aquí.
                </p>
                <a
                  href={`https://www.youtube.com/watch?v=${videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Abrir en YouTube ↗
                </a>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/20 text-xs p-4 text-center">
                Agrega una URL de YouTube al crear la lección
              </div>
            )}
          </div>

          {/* Timer */}
          <div className="flex-shrink-0 p-4 border-t border-white/10 text-center">
            <div className="text-[9px] text-white/35 uppercase tracking-widest mb-0.5">Timer</div>
            <div className="text-3xl font-mono font-bold text-white">{fmt(elapsed)}</div>
            {waiting && (
              <div className="text-[10px] text-yellow-300 mt-1 animate-pulse font-semibold">⏸ elige ahora</div>
            )}
            {!started && (
              <div className="text-[10px] text-white/25 mt-1">presiona Iniciar</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom section: alternatives + controls ────────────────────────── */}
      <div className="flex-shrink-0 bg-[#150B28] border-t border-white/10">

        {/* Alternatives — triple size, centered, full width */}
        <div className="px-6 pt-4 pb-2">
          {allDone ? (
            <div className="text-center py-5">
              <p className="text-green-400 font-bold text-xl">🎉 ¡Completado!</p>
              <p className="text-white/40 text-sm mt-1">{score} pts · {correct}/{numBlanks} correctas</p>
            </div>
          ) : currentOptions.length > 0 ? (
            <div className="max-w-3xl mx-auto">
              {canAnswerNow && currentBlankLineText && (
                <p className="text-center text-white/50 text-sm mb-3 px-2 leading-snug">
                  &ldquo;{currentBlankLineText.trim()}&rdquo;
                  {earlyChance && (
                    <span className="ml-2 text-[10px] text-[#C8A8DC]/70 uppercase tracking-widest">
                      · responde antes
                    </span>
                  )}
                </p>
              )}
            <div className="grid grid-cols-4 gap-3">
              {currentOptions.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt)}
                  disabled={!canAnswerNow}
                  className={`py-6 px-4 rounded-2xl text-base font-bold transition-all duration-150 border-2
                    ${canAnswerNow
                      ? wrongFlash
                        ? 'bg-red-900/30 border-red-500/50 text-white/50 scale-95'
                        : earlyChance
                          ? 'bg-white/8 hover:bg-[#7B5EA7] hover:border-[#9B7CB8] hover:scale-[1.03] border-[#7B5EA7]/40 text-white/90 active:scale-95 cursor-pointer shadow'
                          : 'bg-white/10 hover:bg-[#7B5EA7] hover:border-[#9B7CB8] hover:scale-[1.03] border-white/20 text-white active:scale-95 cursor-pointer shadow-lg'
                      : 'bg-white/4 border-white/8 text-white/20 cursor-default'
                    }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            </div>
          ) : (
            <div className="h-[88px]" /> // placeholder height to avoid layout jump
          )}
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-center gap-3 px-4 pb-3">
          {/* Sync offset controls */}
          <div className="flex items-center gap-1 mr-1">
            <button
              onClick={() => applySyncOffsetDelta(-1)}
              disabled={!started}
              title="Preguntas aparecen 1s antes (se recuerda para esta canción)"
              className="px-2 py-1.5 rounded-lg bg-[#7B5EA7]/20 hover:bg-[#7B5EA7]/40 text-[10px] font-bold border border-[#7B5EA7]/30 transition-all active:scale-95 disabled:opacity-25 text-[#C8A8DC]"
            >
              ◀ −1s
            </button>
            <span className="text-[9px] text-[#9B7CB8] min-w-[36px] text-center font-mono">
              {syncOffset > 0 ? '+' : ''}{syncOffset}s
            </span>
            <button
              onClick={() => applySyncOffsetDelta(1)}
              disabled={!started}
              title="Preguntas aparecen 1s después (se recuerda para esta canción)"
              className="px-2 py-1.5 rounded-lg bg-[#7B5EA7]/20 hover:bg-[#7B5EA7]/40 text-[10px] font-bold border border-[#7B5EA7]/30 transition-all active:scale-95 disabled:opacity-25 text-[#C8A8DC]"
            >
              +1s ▶
            </button>
          </div>

          <button
            onClick={handleRewind}
            disabled={!started}
            className="px-3 py-2 rounded-xl bg-white/8 hover:bg-white/15 text-xs font-bold border border-white/10 transition-all active:scale-95 disabled:opacity-25"
          >
            ↺ −5s
          </button>

          {!started ? (
            <button
              onClick={handleStart}
              className="px-6 py-2.5 bg-gradient-to-r from-[#7B5EA7] to-[#9B7CB8] rounded-full text-sm font-bold shadow-lg shadow-[#7B5EA7]/30 transition-all active:scale-95"
            >
              ▶ Iniciar
            </button>
          ) : timerRunning ? (
            <button
              onClick={handlePause}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-full text-sm font-bold border border-white/15 transition-all active:scale-95"
            >
              ⏸ Pausar
            </button>
          ) : waiting ? (
            <span className="text-yellow-300 text-xs font-semibold animate-pulse px-3">
              ↑ elige la respuesta
            </span>
          ) : (
            <button
              onClick={handleResume}
              className="px-6 py-2.5 bg-gradient-to-r from-[#7B5EA7] to-[#9B7CB8] rounded-full text-sm font-bold shadow-lg shadow-[#7B5EA7]/30 transition-all active:scale-95"
            >
              ▶ Continuar
            </button>
          )}

          <button
            onClick={handleForward}
            disabled={!started}
            className="px-3 py-2 rounded-xl bg-white/8 hover:bg-white/15 text-xs font-bold border border-white/10 transition-all active:scale-95 disabled:opacity-25"
          >
            +5s →
          </button>
        </div>
      </div>

      {/* ── Debug overlay (toggleable) ─────────────────────────────────────── */}
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
            const matched = lineMatched.current[li];
            const bi      = currentBlankIdx;
            const trig    = timings.current[bi];
            const bword   = blanksData[bi]?.word ?? '—';
            const bLine   = blankLineIdx[bi];
            const dT      = trig != null ? trig - t : null;
            const matchedCount = lineMatched.current.filter(Boolean).length;

            return (
              <div className="space-y-1">
                <div><span className="text-amber-400">t</span> {fmt(t)} ({t.toFixed(2)}s) · offset {syncOffset > 0 ? '+' : ''}{syncOffset}s · status {lrcStatus}</div>
                <div className="border-t border-amber-500/20 pt-1">
                  <div><span className="text-amber-400">line</span> {li}/{totalLines - 1} · {matched ? '✓ matched' : '∿ interp'} · start {lineSt?.toFixed(2) ?? '?'}s</div>
                  {lineNx != null && <div className="pl-3 text-amber-200/60">next line @ {lineNx.toFixed(2)}s (Δ {(lineNx - (lineSt ?? 0)).toFixed(1)}s)</div>}
                  <div className="pl-3 text-amber-200/60 truncate">&ldquo;{(originalLines[li] ?? '').slice(0, 50)}{(originalLines[li] ?? '').length > 50 ? '…' : ''}&rdquo;</div>
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
                  LRC anchors: {matchedCount}/{totalLines} líneas matched · source <span className="text-white">{lyricsSourceRef.current}</span>
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
