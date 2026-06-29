// FriendlyTeaching.cl — Slide 8: Translation Game with YouTube auto-sync
'use client';
import { useEffect, useRef, useState, Fragment } from 'react';
import type { Slide, LyricsBlank } from '@/types/firebase';

interface Props { slide: Slide; }

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
  const blanksData: LyricsBlank[] = slide.blanksData ?? [];
  const numBlanks = blanksData.length;
  // content = Spanish text with {{blank}} markers
  // translationText = original English text to show above
  const spanishText = slide.content ?? '';
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
  const parts = spanishText.split('{{blank}}');

  return (
    <div className="flex flex-col min-h-[480px] bg-[#1E0F35] rounded-2xl text-white p-4">
      {/* Score bar */}
      <div className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-2 mb-3 text-xs font-bold gap-3 flex-wrap">
        <span>🏆 {score} pts</span>
        <span className="text-[#C8A8DC]">Huecos {answeredCount}/{numBlanks}</span>
        <span className="text-green-400">✓ {correct}</span>
        <span className="text-red-400">✗ {wrong}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-white/20 rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-300"
          style={{ width: `${ytProgress * 100}%` }}
        />
      </div>

      {/* Content + YouTube */}
      <div className="flex gap-3 flex-1 overflow-hidden mb-3">
        <div className="flex-1 overflow-auto pr-1 space-y-4">
          {/* English original (small, gray) */}
          {englishText && (
            <div className="bg-white/5 rounded-xl p-3 border border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">English</p>
              <p className="text-white/50 text-xs leading-relaxed whitespace-pre-wrap">{englishText}</p>
            </div>
          )}

          {/* Spanish with blanks (large, white) */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#C8A8DC] mb-1">Español</p>
            <div className="text-base leading-loose font-medium">
              {parts.map((part, i) => (
                <Fragment key={i}>
                  <span className="text-white whitespace-pre-wrap">{part}</span>
                  {i < numBlanks && (
                    <span
                      onClick={() => { if (answers[i] === null) goToBlank(i); }}
                      className={`inline-block min-w-[72px] text-center px-2 py-0.5 mx-0.5 rounded font-bold text-sm transition-all
                        ${answers[i] !== null
                          ? answerStates[i] === 'correct'
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                          : i === currentIdx
                            ? `bg-pink-300 text-[#1E0F35] ring-2 ring-pink-200 shadow-md ${wrongFlash ? 'scale-110' : ''}`
                            : 'bg-white/15 text-white/40 cursor-pointer hover:bg-white/25'
                        }`}
                    >
                      {answers[i] ?? '•••'}
                    </span>
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        </div>

        {videoId && (
          <div className="flex-shrink-0 self-start sticky top-0">
            <div id={playerDivId.current} className="rounded-lg overflow-hidden w-40 h-[90px] bg-black" />
            <p className="text-[10px] text-white/30 text-center mt-1">▲ Click play to sync</p>
          </div>
        )}
      </div>

      {/* Answer buttons */}
      {!allAnswered && blanksData[currentIdx] ? (
        <div>
          <p className="text-[10px] text-white/40 text-center mb-1.5">
            Blank {currentIdx + 1} of {numBlanks}
          </p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {blanksData[currentIdx].options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
                className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition-all border
                  ${wrongFlash
                    ? 'bg-red-900/30 border-red-700/40 text-white/70'
                    : 'bg-white/10 hover:bg-pink-800/40 border-white/20 hover:border-pink-400/60 text-white active:scale-95'
                  }`}
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => goToBlank(currentIdx - 1)}
              disabled={currentIdx === 0}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 disabled:opacity-30"
            >
              ← Back
            </button>
            <button
              onClick={() => {
                const next = answers.findIndex((a, i) => i > currentIdx && a === null);
                goToBlank(next >= 0 ? next : currentIdx + 1);
              }}
              disabled={currentIdx >= numBlanks - 1}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 disabled:opacity-30"
            >
              Skip →
            </button>
          </div>
        </div>
      ) : allAnswered ? (
        <div className="text-center py-3">
          <p className="text-pink-400 font-bold text-lg">🎉 ¡Excelente!</p>
          <p className="text-white/60 text-sm mt-1">{score} pts · {correct}/{numBlanks} correct</p>
        </div>
      ) : null}
    </div>
  );
}
