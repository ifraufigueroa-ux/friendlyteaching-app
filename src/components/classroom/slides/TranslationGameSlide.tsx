// FriendlyTeaching.cl — Slide 8: Translation Game (karaoke line-by-line)
'use client';
import { useEffect, useMemo, useRef, useState, Fragment } from 'react';
import type { Slide, LyricsBlank } from '@/types/firebase';

interface Props {
  slide: Slide;
  // Not rendered yet — accepted so mount points can thread the parent
  // lesson brand uniformly across all shared slides.
  brand?: 'Friendlyrics' | 'FriendlyTales' | 'Friendlyflix';
}

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

type YTPlayer = {
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
};

export default function TranslationGameSlide({ slide }: Props) {
  // AI-generated Friendlytext lessons occasionally ship malformed blanksData:
  // options list that doesn't contain the correct word, so no button can ever
  // resolve the blank. Patch it here — swap the last distractor for the answer
  // when the answer is missing, so the game is always winnable.
  const blanksData: LyricsBlank[] = useMemo(() => {
    const raw = slide.blanksData ?? [];
    return raw.map((b) => {
      const opts = b.options ?? [];
      const answer = b.word ?? '';
      const hasAnswer = opts.some(
        (o) => o.toLowerCase().trim() === answer.toLowerCase().trim(),
      );
      if (hasAnswer || !answer) return b;
      const fixed = [...opts];
      if (fixed.length === 0) return { ...b, options: [answer] };
      // Replace a random slot so the answer position isn't always predictable.
      const slot = Math.floor(Math.random() * fixed.length);
      fixed[slot] = answer;
      return { ...b, options: fixed };
    });
  }, [slide.blanksData]);
  const numBlanks = blanksData.length;
  // Normalise every `{{…}}` marker down to the canonical `{{blank}}` token
  // BEFORE anything downstream touches it. AI-generated Friendlytext lessons
  // often ship with the answer word inside the braces (`{{investigaba}}`)
  // instead of the marker, so a literal `.split('{{blank}}')` would never
  // find them. Doing the replace here means every consumer sees clean data.
  const spanishText = (slide.content ?? '').replace(/\{\{[^}]+\}\}/g, '{{blank}}');
  const englishText = slide.translationText ?? '';
  const videoId = slide.songData?.youtubeUrl ? extractVideoId(slide.songData.youtubeUrl) : null;

  const [answers, setAnswers] = useState<(string | null)[]>(() => Array(numBlanks).fill(null));
  const [answerStates, setAnswerStates] = useState<('correct' | 'wrong' | null)[]>(() => Array(numBlanks).fill(null));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [ytProgress, setYtProgress] = useState(0);
  const [wrongFlash, setWrongFlash] = useState(false);

  const answersRef = useRef<(string | null)[]>(Array(numBlanks).fill(null));
  const currentIdxRef = useRef(0);
  const playerRef = useRef<YTPlayer | null>(null);
  const blankTimingsRef = useRef<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playerDivId = useRef(`yt-trans-${Math.random().toString(36).slice(2)}`);

  // ─── Line-based structure: split ES/EN by \n and map blanks to lines ───
  // `spanishText` is already normalised above, so every marker is the
  // canonical `{{blank}}` token here.
  const lines = useMemo(() => {
    const esLines = spanishText.split('\n');
    const enLines = englishText.split('\n');
    const out: {
      english: string;
      parts: string[];          // text parts around blanks (parts.length = blanks + 1)
      blankIdxs: number[];       // global blank indexes contained in this line
    }[] = [];
    let running = 0;
    for (let i = 0; i < esLines.length; i++) {
      const raw = esLines[i] ?? '';
      const parts = raw.split('{{blank}}');
      const blankCount = parts.length - 1;
      const blankIdxs: number[] = [];
      for (let k = 0; k < blankCount; k++) blankIdxs.push(running + k);
      running += blankCount;
      out.push({ english: enLines[i] ?? '', parts, blankIdxs });
    }
    return out;
  }, [spanishText, englishText]);

  const currentLineIdx = useMemo(() => {
    const idx = lines.findIndex(l => l.blankIdxs.includes(currentIdx));
    return idx >= 0 ? idx : Math.max(0, lines.length - 1);
  }, [lines, currentIdx]);

  function goToBlank(idx: number) {
    const c = Math.max(0, Math.min(numBlanks - 1, idx));
    setCurrentIdx(c);
    currentIdxRef.current = c;
  }

  useEffect(() => {
    if (!videoId || typeof window === 'undefined') return;

    const initPlayer = () => {
      const YT = (window as Record<string, any>).YT;
      if (!YT?.Player) return;
      playerRef.current = new YT.Player(playerDivId.current, {
        videoId,
        height: 90,
        width: 160,
        playerVars: { controls: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: (e: { target: { getDuration(): number } }) => {
            const dur = e.target.getDuration();
            if (dur > 0 && numBlanks > 0) {
              blankTimingsRef.current = Array.from({ length: numBlanks }, (_, i) =>
                (0.10 + (i / Math.max(numBlanks - 1, 1)) * 0.75) * dur,
              );
            }
            intervalRef.current = setInterval(() => {
              if (!playerRef.current?.getCurrentTime) return;
              const t = playerRef.current.getCurrentTime();
              const d = playerRef.current.getDuration() || 1;
              setYtProgress(t / d);
              const timings = blankTimingsRef.current;
              for (let i = 0; i < numBlanks; i++) {
                if (
                  t >= (timings[i] ?? Infinity) &&
                  answersRef.current[i] === null &&
                  i > currentIdxRef.current
                ) {
                  setCurrentIdx(i);
                  currentIdxRef.current = i;
                  break;
                }
              }
            }, 200);
          },
        },
      });
    };

    const win = window as Record<string, any>;
    if (win.YT?.Player) {
      initPlayer();
    } else {
      const prev = win.onYouTubeIframeAPIReady;
      win.onYouTubeIframeAPIReady = () => { prev?.(); initPlayer(); };
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const s = document.createElement('script');
        s.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(s);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      try { playerRef.current?.destroy(); } catch { /* ignore */ }
    };
  }, [videoId, numBlanks]);

  function handleAnswer(option: string) {
    if (currentIdx >= numBlanks) return;
    if (answerStates[currentIdx] === 'correct') return;
    const blank = blanksData[currentIdx];
    const isCorrect = option.toLowerCase().trim() === blank.word.toLowerCase().trim();

    if (isCorrect) {
      const na = [...answersRef.current];
      na[currentIdx] = option;
      answersRef.current = na;
      setAnswers([...na]);
      setAnswerStates(prev => { const n = [...prev]; n[currentIdx] = 'correct'; return n; });
      setScore(s => s + 10);
      setCorrect(c => c + 1);
      const next = na.findIndex((a, i) => i > currentIdx && a === null);
      if (next >= 0) { setCurrentIdx(next); currentIdxRef.current = next; }
    } else {
      setWrong(w => w + 1);
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 500);
    }
  }

  const allAnswered = numBlanks > 0 && answers.every(a => a !== null);
  const answeredCount = answers.filter(a => a !== null).length;

  // Render a single karaoke line (Spanish with inline blanks + English above)
  function renderLine(
    line: typeof lines[number],
    lineIdx: number,
    variant: 'current' | 'next' | 'past',
  ) {
    const isCurrent = variant === 'current';
    const dimmed = variant !== 'current';

    return (
      <div
        key={lineIdx}
        className={`transition-all duration-300 ${
          isCurrent ? 'opacity-100 scale-100' : 'opacity-40 scale-95'
        }`}
      >
        {/* English hint */}
        {line.english && (
          <p
            className={`text-center font-medium ${
              isCurrent ? 'text-[#FFC857] text-lg md:text-xl' : 'text-[#FFC857]/60 text-base md:text-lg'
            }`}
          >
            {line.english}
          </p>
        )}
        {/* Spanish with inline blanks */}
        <div
          className={`text-center font-bold leading-tight ${
            isCurrent ? 'text-2xl md:text-3xl mt-1' : 'text-lg md:text-xl mt-0.5'
          }`}
        >
          {line.parts.map((part, i) => (
            <Fragment key={i}>
              <span className="whitespace-pre-wrap">{part}</span>
              {i < line.parts.length - 1 && (() => {
                const bIdx = line.blankIdxs[i];
                const isActive = bIdx === currentIdx;
                const filled = answers[bIdx];
                if (filled !== null && answerStates[bIdx] === 'correct') {
                  return (
                    <span className="inline-block mx-1 px-2 text-emerald-300">
                      {filled}
                    </span>
                  );
                }
                return (
                  <span
                    onClick={() => { if (!dimmed) goToBlank(bIdx); }}
                    className={`inline-flex items-center justify-center align-middle mx-1 rounded-full transition-all
                      ${isActive
                        ? `bg-white/10 ring-2 ring-white/70 shadow-[0_0_20px_rgba(255,255,255,0.4)] w-9 h-9 ${wrongFlash ? 'ring-red-400 scale-110' : ''}`
                        : dimmed
                          ? 'bg-white/10 w-2.5 h-2.5'
                          : 'bg-white/20 w-6 h-6 cursor-pointer hover:bg-white/30'
                      }`}
                  >
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-white/70" />
                    )}
                  </span>
                );
              })()}
            </Fragment>
          ))}
        </div>
      </div>
    );
  }

  // ─── Stat card component ──────────────────────────────────
  const StatCard = ({ label, value }: { label: string; value: string | number }) => (
    <div className="flex-1 min-w-[80px]">
      <p className="text-white/80 font-bold text-sm mb-1">{label}</p>
      <div className="bg-[#2A1650] rounded-xl px-4 py-3 text-center">
        <span className="text-white font-black text-xl">{value}</span>
      </div>
    </div>
  );

  return (
    <div className="relative h-full min-h-[560px] bg-[#1E0F35] text-white overflow-hidden">
      {/* Top stats + progress */}
      <div className="px-6 pt-5 pb-3">
        <div className="flex gap-3 mb-2">
          <StatCard label="Puntos"  value={score} />
          <StatCard label="Huecos"  value={`${answeredCount}/${numBlanks}`} />
          <StatCard label="Aciertos" value={correct} />
          <StatCard label="Fallos"   value={wrong} />
        </div>
        <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-400 rounded-full transition-all duration-300"
            style={{ width: `${Math.max(ytProgress * 100, (answeredCount / Math.max(numBlanks, 1)) * 100)}%` }}
          />
        </div>
      </div>

      {/* Floating YouTube player */}
      {videoId && (
        <div className="absolute top-5 right-6 z-10">
          <div id={playerDivId.current} className="rounded-lg overflow-hidden w-40 h-[90px] bg-black shadow-lg" />
        </div>
      )}

      {/* Karaoke line stack */}
      <div className="px-6 pt-4 pb-40 flex flex-col items-center gap-5">
        {/* Past indicator */}
        {currentLineIdx > 0 && (
          <div className="flex flex-col items-center gap-1 opacity-40">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
            </div>
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            </div>
          </div>
        )}

        {/* Current line highlight card */}
        <div className="w-full max-w-2xl bg-[#2A1650]/70 border border-white/10 rounded-2xl px-6 py-5">
          {lines[currentLineIdx] && renderLine(lines[currentLineIdx], currentLineIdx, 'current')}
        </div>

        {/* Next lines preview */}
        {lines.slice(currentLineIdx + 1, currentLineIdx + 4).map((line, i) =>
          renderLine(line, currentLineIdx + 1 + i, 'next'),
        )}
      </div>

      {/* Bottom answer buttons */}
      {!allAnswered && blanksData[currentIdx] ? (
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 pt-4 bg-gradient-to-t from-[#1E0F35] via-[#1E0F35] to-transparent">
          <div className="flex gap-3 max-w-3xl mx-auto">
            {blanksData[currentIdx].options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
                className={`flex-1 py-4 px-4 rounded-2xl text-lg font-bold transition-all
                  ${wrongFlash
                    ? 'bg-red-800/40 text-white/80'
                    : 'bg-[#6D3FBF] hover:bg-[#7E4FD5] text-white active:scale-95 shadow-md'
                  }`}
              >
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            ))}
          </div>
        </div>
      ) : allAnswered ? (
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 pt-4 text-center bg-gradient-to-t from-[#1E0F35] to-transparent">
          <p className="text-pink-400 font-black text-2xl">🎉 ¡Excelente!</p>
          <p className="text-white/70 text-sm mt-1">{score} pts · {correct}/{numBlanks} correctos</p>
        </div>
      ) : null}
    </div>
  );
}
