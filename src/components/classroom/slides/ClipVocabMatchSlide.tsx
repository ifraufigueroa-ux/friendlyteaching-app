// FriendlyTeaching.cl — Friendlyflix: Vocabulary Matching (gamified)
//
// Word/definition matching game with Friendlyflix red/dark theme,
// micro-animations, streak + speed bonus scoring, confetti burst on
// match, screen shake on miss, and a stars + perfect-round summary.
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Slide } from '@/types/firebase';

interface Props { slide: Slide }

const MATCH_BASE_PTS    = 10;
const SPEED_BONUS_MAX   = 10;    // adds up to +10 when matched within 1.5 s
const SPEED_BONUS_WINDOW = 1500; // ms — after this, no speed bonus
const STREAK_BONUS_STEP = 5;     // +5 per consecutive correct match starting at streak 3
const WRONG_PENALTY     = 5;     // points lost per wrong attempt

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

// ── Confetti burst (DOM-only, no library) ─────────────────────────────

interface Particle { id: number; x: number; y: number; hue: number; spinDuration: number; angle: number; distance: number }

function ConfettiBurst({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 22 }, (_, i) => ({
      id: i,
      x, y,
      hue: 350 + Math.floor(Math.random() * 30) - 15, // red-ish
      spinDuration: 600 + Math.random() * 400,
      angle: (i / 22) * Math.PI * 2 + Math.random() * 0.3,
      distance: 60 + Math.random() * 90,
    }));
  }, [x, y]);
  useEffect(() => {
    const t = setTimeout(onDone, 1200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="pointer-events-none absolute inset-0 z-50">
      {particles.map(p => {
        const dx = Math.cos(p.angle) * p.distance;
        const dy = Math.sin(p.angle) * p.distance;
        return (
          <span
            key={p.id}
            className="absolute block rounded-sm"
            style={{
              left: p.x, top: p.y, width: 8, height: 12,
              background: `hsl(${p.hue}, 85%, 60%)`,
              animation: `clipBurst ${p.spinDuration}ms ease-out forwards`,
              ['--dx' as string]: `${dx}px`,
              ['--dy' as string]: `${dy + 80}px`,
            } as React.CSSProperties}
          />
        );
      })}
      <style>{`
        @keyframes clipBurst {
          0%   { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) rotate(540deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ── Slide ─────────────────────────────────────────────────────────────

interface FloatScore { id: number; pts: number; x: number; y: number }

export default function ClipVocabMatchSlide({ slide }: Props) {
  const words = slide.words ?? [];
  // Stable shuffled order for the definitions column.
  const shuffledDefs = useMemo(() => [...words].sort(() => Math.random() - 0.5), [words]);

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [matched, setMatched]           = useState<Record<string, true>>({});
  const [wrongFlash, setWrongFlash]     = useState<string | null>(null);
  const [score, setScore]               = useState(0);
  const [streak, setStreak]             = useState(0);
  const [bestStreak, setBestStreak]     = useState(0);
  const [wrongs, setWrongs]             = useState(0);
  const [elapsed, setElapsed]           = useState(0);
  const [started, setStarted]           = useState(false);
  const [shake, setShake]               = useState(false);
  const [bursts, setBursts]             = useState<{ id: number; x: number; y: number }[]>([]);
  const [floats, setFloats]             = useState<FloatScore[]>([]);

  const selectionTsRef = useRef<number | null>(null);
  const intervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef   = useRef<HTMLDivElement | null>(null);
  const total   = words.length;
  const done    = Object.keys(matched).length;
  const allDone = done === total && total > 0;

  // Run timer once the student touches anything.
  useEffect(() => {
    if (started && !allDone) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [started, allDone]);

  function stars(): { count: 1 | 2 | 3; emoji: string } {
    if (wrongs === 0) return { count: 3, emoji: '⭐⭐⭐' };
    if (wrongs <= 2)  return { count: 2, emoji: '⭐⭐' };
    return { count: 1, emoji: '⭐' };
  }

  function popFloat(pts: number, fromX: number, fromY: number) {
    const id = Date.now() + Math.random();
    setFloats(prev => [...prev, { id, pts, x: fromX, y: fromY }]);
    setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 1100);
  }

  function popBurst(x: number, y: number) {
    const id = Date.now() + Math.random();
    setBursts(prev => [...prev, { id, x, y }]);
    setTimeout(() => setBursts(prev => prev.filter(b => b.id !== id)), 1200);
  }

  function handleWordClick(word: string, evt: React.MouseEvent<HTMLButtonElement>) {
    if (matched[word]) return;
    if (!started) setStarted(true);
    setSelectedWord(prev => {
      if (prev === word) { selectionTsRef.current = null; return null; }
      selectionTsRef.current = Date.now();
      return word;
    });
    evt.currentTarget.blur();
  }

  function handleDefClick(defWord: string, evt: React.MouseEvent<HTMLButtonElement>) {
    if (!selectedWord) return;
    if (matched[defWord]) return;
    if (!started) setStarted(true);

    if (selectedWord === defWord) {
      const ts = selectionTsRef.current ?? Date.now();
      const elapsedMs = Date.now() - ts;
      const speedBonus = elapsedMs <= SPEED_BONUS_WINDOW
        ? Math.round(SPEED_BONUS_MAX * (1 - elapsedMs / SPEED_BONUS_WINDOW))
        : 0;
      const streakNext  = streak + 1;
      const streakBonus = streakNext >= 3 ? (streakNext - 2) * STREAK_BONUS_STEP : 0;
      const pts         = MATCH_BASE_PTS + speedBonus + streakBonus;

      setMatched(m => ({ ...m, [defWord]: true }));
      setSelectedWord(null);
      selectionTsRef.current = null;
      setScore(s => s + pts);
      setStreak(streakNext);
      setBestStreak(b => Math.max(b, streakNext));

      const rect = evt.currentTarget.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
        const cx = rect.left - containerRect.left + rect.width / 2;
        const cy = rect.top - containerRect.top + rect.height / 2;
        popBurst(cx, cy);
        popFloat(pts, cx, cy);
      }
    } else {
      setStreak(0);
      setWrongs(w => w + 1);
      setScore(s => Math.max(0, s - WRONG_PENALTY));
      setWrongFlash(defWord);
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setTimeout(() => setWrongFlash(null), 600);

      const rect = evt.currentTarget.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
        popFloat(-WRONG_PENALTY, rect.left - containerRect.left + rect.width / 2, rect.top - containerRect.top + rect.height / 2);
      }
    }
    evt.currentTarget.blur();
  }

  function restart() {
    setSelectedWord(null);
    setMatched({});
    setWrongFlash(null);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setWrongs(0);
    setElapsed(0);
    setStarted(false);
    setShake(false);
  }

  if (words.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-[#1E0F35] to-[#0A0A12] text-white">
        <div className="text-center max-w-md p-8">
          <p className="text-5xl mb-3">📚</p>
          <p className="text-lg font-bold mb-1">No vocabulary configured</p>
          <p className="text-sm text-white/50">The teacher has not added vocab to this clip yet.</p>
        </div>
      </div>
    );
  }

  const progressPct = total > 0 ? (done / total) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`relative h-full flex flex-col bg-gradient-to-br from-[#1E0F35] via-[#0A0A12] to-[#0F0F18] text-white overflow-hidden ${shake ? 'animate-[clipShake_400ms_ease-in-out]' : ''}`}
    >
      <style>{`
        @keyframes clipShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        @keyframes clipFloatUp {
          0%   { transform: translate(-50%, 0)    scale(0.7); opacity: 0; }
          15%  { transform: translate(-50%, -10px) scale(1.1); opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translate(-50%, -90px) scale(1);   opacity: 0; }
        }
        @keyframes clipPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(229, 9, 20, 0.5); }
          50%      { box-shadow: 0 0 0 14px rgba(229, 9, 20, 0); }
        }
      `}</style>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 pt-5 pb-3 border-b border-white/10 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF6B6B]">Friendlyflix · Vocabulary match</p>
          <h2 className="text-base font-bold text-white">{slide.title ?? 'Key Vocabulary'}</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-center px-3 py-1.5 rounded-xl bg-black/40 border border-white/10">
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Time</p>
            <p className="text-sm font-mono font-bold">{fmt(elapsed)}</p>
          </div>
          <div className="text-center px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 relative">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#FF6B6B]">Score</p>
            <p className="text-sm font-bold transition-transform">{score}</p>
          </div>
          {streak >= 2 && (
            <div className="text-center px-3 py-1.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-400/40">
              <p className="text-[9px] font-bold uppercase tracking-widest text-orange-300">Streak</p>
              <p className="text-sm font-bold text-orange-300">🔥 {streak}</p>
            </div>
          )}
          <div className="text-center px-3 py-1.5 rounded-xl bg-[#E50914]/15 border border-[#E50914]/40">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#FF6B6B]">Done</p>
            <p className="text-sm font-bold">{done}/{total}</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex-shrink-0 px-6 py-2 bg-black/30 border-b border-white/5">
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#E50914] to-[#FF6B6B] rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Active word banner */}
      <div className="flex-shrink-0 px-6 py-2 text-center">
        {allDone ? null : selectedWord ? (
          <p className="text-sm font-semibold text-white">
            Matching <span className="text-[#FF6B6B] font-bold">&ldquo;{selectedWord}&rdquo;</span> — tap its definition →
          </p>
        ) : (
          <p className="text-xs text-white/40">Tap a word on the left to start matching.</p>
        )}
      </div>

      {/* ── Main game / completion ──────────────────────────────── */}
      <div className="flex-1 px-6 pb-6 min-h-0 overflow-y-auto">

        {allDone ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4">
            <p className="text-6xl mb-1">{stars().emoji}</p>
            <h3 className="text-2xl font-bold">All matched!</h3>
            <div className="grid grid-cols-3 gap-3 max-w-md w-full">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-widest text-white/40">Score</p>
                <p className="text-xl font-bold text-[#FF6B6B]">{score}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-widest text-white/40">Time</p>
                <p className="text-xl font-bold">{fmt(elapsed)}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-widest text-white/40">Best streak</p>
                <p className="text-xl font-bold text-orange-300">🔥 {bestStreak}</p>
              </div>
            </div>
            <p className="text-sm text-white/60 mt-2">
              {wrongs} mistake{wrongs !== 1 && 's'}
            </p>
            {wrongs === 0 && (
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/40 rounded-2xl px-5 py-2 text-green-300 font-bold mt-1">
                🎉 Perfect round — no mistakes!
              </div>
            )}
            <button
              onClick={restart}
              className="mt-3 px-6 py-2.5 bg-gradient-to-r from-[#E50914] to-[#FF6B6B] rounded-full text-sm font-bold shadow-lg shadow-red-900/30 active:scale-95"
            >
              ↻ Play again
            </button>
          </div>

        ) : (
          <div className="grid grid-cols-[1fr_36px_1fr] gap-x-2 gap-y-2 items-stretch">

            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 col-start-1 self-end pb-1 px-1">Words</p>
            <span />
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 col-start-3 self-end pb-1 px-1">Definitions</p>

            {words.map((w, i) => {
              const def         = shuffledDefs[i];
              const wordMatched = !!matched[w.word];
              const defMatched  = !!matched[def.word];
              const isSelected  = selectedWord === w.word;
              const defClickable = !!selectedWord && !defMatched;
              const isWrong     = wrongFlash === def.word;

              return [
                <button
                  key={`w-${w.word}`}
                  onClick={(e) => handleWordClick(w.word, e)}
                  disabled={wordMatched}
                  className={`relative py-3.5 px-4 rounded-2xl text-left border-2 w-full flex flex-col gap-0.5 transition-all duration-200
                    ${wordMatched
                      ? 'bg-green-500/15 border-green-500/50 text-green-200 cursor-default'
                      : isSelected
                        ? 'bg-gradient-to-br from-[#E50914] to-[#7B1F23] border-[#FF6B6B] text-white shadow-2xl shadow-red-900/40 scale-[1.04]'
                        : 'bg-white/5 border-white/15 text-white hover:bg-white/10 hover:border-white/30 hover:scale-[1.01]'
                    }`}
                  style={isSelected ? { animation: 'clipPulse 1.4s ease-out infinite' } : undefined}
                >
                  <span className="text-base font-bold leading-tight">
                    {wordMatched ? '✓ ' : ''}{w.word}
                  </span>
                  {w.pronunciation && (
                    <span className={`text-[10px] font-normal ${wordMatched ? 'text-green-300/60' : isSelected ? 'text-white/70' : 'text-white/40'}`}>
                      /{w.pronunciation}/
                    </span>
                  )}
                </button>,

                <div key={`arr-${w.word}`} className="flex items-center justify-center">
                  {isSelected && <span className="text-[#FF6B6B] font-bold text-xl animate-pulse">→</span>}
                </div>,

                <button
                  key={`d-${def.word}`}
                  onClick={(e) => handleDefClick(def.word, e)}
                  disabled={defMatched || !defClickable}
                  className={`py-3.5 px-4 rounded-2xl text-left border-2 leading-snug w-full transition-all duration-200
                    ${defMatched
                      ? 'bg-green-500/15 border-green-500/50 text-green-200 text-sm font-medium cursor-default'
                      : isWrong
                        ? 'bg-red-500/15 border-red-500/60 text-red-200 scale-[0.98] text-sm'
                        : defClickable
                          ? 'bg-[#FBF8F0] border-[#F0C040] text-[#2D1B4E] hover:bg-gradient-to-br hover:from-[#E50914] hover:to-[#FF6B6B] hover:text-white hover:border-[#E50914] cursor-pointer text-sm font-medium hover:scale-[1.02]'
                          : 'bg-white/3 border-white/10 text-white/30 cursor-default text-sm'
                    }`}
                >
                  {def.translation}
                </button>,
              ];
            })}
          </div>
        )}

      </div>

      {/* Bursts + floating scores ────────────────────────────────── */}
      {bursts.map(b => (
        <ConfettiBurst key={b.id} x={b.x} y={b.y} onDone={() => { /* cleaned via timeout in component */ }} />
      ))}
      {floats.map(f => (
        <span
          key={f.id}
          className="pointer-events-none absolute font-bold text-2xl select-none"
          style={{
            left: f.x, top: f.y - 10,
            color: f.pts >= 0 ? '#4ade80' : '#f87171',
            textShadow: '0 2px 6px rgba(0,0,0,0.6)',
            animation: 'clipFloatUp 1100ms ease-out forwards',
          }}
        >
          {f.pts >= 0 ? `+${f.pts}` : `${f.pts}`}
        </span>
      ))}
    </div>
  );
}
