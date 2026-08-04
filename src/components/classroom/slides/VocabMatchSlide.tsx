// FriendlyTeaching.cl — Friendlyrics: Vocabulary Matching (gamified)
//
// Word/definition matching game with light-purple Friendlyrics theme,
// musical-note burst on match, screen shake on miss, speed + streak
// bonuses, floating score popups at the click point, and a stars +
// best-streak summary with restart. Same `slide.words` shape as the
// legacy version, so existing song lessons keep working unchanged.
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Slide } from '@/types/firebase';

interface Props {
  slide: Slide;
  brand?: 'Friendlyrics' | 'FriendlyTales' | 'Friendlyflix';
}

const MATCH_BASE_PTS     = 10;
const SPEED_BONUS_MAX    = 10;
const SPEED_BONUS_WINDOW = 1500;
const STREAK_BONUS_STEP  = 5;
const WRONG_PENALTY      = 5;

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

// ── Musical-note burst (replaces generic confetti) ────────────────────

const NOTE_GLYPHS = ['♪', '♫', '♬', '𝅘𝅥', '𝅘𝅥𝅮', '🎵', '🎶'] as const;
// Friendlyrics palette: purples, pinks, golds, hot-pink accents.
const NOTE_COLORS = ['#9B5DE5', '#C8A8DC', '#7B5EA7', '#F0C040', '#F472B6', '#5A3D7A'];

interface Particle {
  id: number;
  glyph: string;
  color: string;
  angle: number;
  distance: number;
  spinDuration: number;
  fontSize: number;
}

function NoteBurst({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  const particles = useMemo<Particle[]>(() => Array.from({ length: 18 }, (_, i) => ({
    id: i,
    glyph: NOTE_GLYPHS[Math.floor(Math.random() * NOTE_GLYPHS.length)],
    color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
    angle: (i / 18) * Math.PI * 2 + Math.random() * 0.3,
    distance: 65 + Math.random() * 80,
    spinDuration: 700 + Math.random() * 500,
    fontSize: 18 + Math.random() * 12,
  })), []);

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
            className="absolute block select-none"
            style={{
              left: x, top: y,
              color: p.color,
              fontSize: p.fontSize,
              lineHeight: 1,
              textShadow: '0 1px 3px rgba(90, 61, 122, 0.25)',
              animation: `vmNoteBurst ${p.spinDuration}ms ease-out forwards`,
              ['--dx' as string]: `${dx}px`,
              ['--dy' as string]: `${dy + 70}px`,
            } as React.CSSProperties}
          >
            {p.glyph}
          </span>
        );
      })}
      <style>{`
        @keyframes vmNoteBurst {
          0%   { transform: translate(0, 0) rotate(0deg) scale(0.6); opacity: 0; }
          15%  { opacity: 1; transform: translate(calc(var(--dx) * 0.2), calc(var(--dy) * 0.2)) rotate(60deg) scale(1.1); }
          100% { transform: translate(var(--dx), var(--dy)) rotate(540deg) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ── Slide ─────────────────────────────────────────────────────────────

interface FloatScore { id: number; pts: number; x: number; y: number }

export default function VocabMatchSlide({ slide, brand = 'Friendlyrics' }: Props) {
  const words = slide.words ?? [];
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

  const isTales = brand === 'FriendlyTales';

  if (words.length === 0) {
    return (
      <div className={`h-full flex items-center justify-center ${isTales ? 'bg-transparent text-[#F8F5FC]' : 'bg-gradient-to-br from-[#F9F5FF] via-[#F3EEFF] to-[#FFE8F0] text-[#2D1B4E]'}`}>
        <div className="text-center max-w-md p-8">
          <p className="text-5xl mb-3">{isTales ? '🔮' : '🎼'}</p>
          <p className={`text-lg font-bold mb-1 ${isTales ? 'ft-title-gold' : ''}`}>No vocabulary configured</p>
          <p className={`text-sm ${isTales ? 'text-[#A69BB8]' : 'text-[#5A3D7A]/50'}`}>
            The teacher has not added vocab to this {isTales ? 'text' : 'song'} yet.
          </p>
        </div>
      </div>
    );
  }

  const progressPct = total > 0 ? (done / total) * 100 : 0;

  const wrapperBg = isTales
    ? 'bg-transparent text-[#F8F5FC]'
    : 'bg-gradient-to-br from-[#F9F5FF] via-[#F3EEFF] to-[#FFE8F0] text-[#2D1B4E]';

  return (
    <div
      ref={containerRef}
      className={`relative h-full flex flex-col ${wrapperBg} overflow-hidden ${shake ? 'animate-[vmShake_400ms_ease-in-out]' : ''}`}
    >
      <style>{`
        @keyframes vmShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        @keyframes vmFloatUp {
          0%   { transform: translate(-50%, 0)    scale(0.7); opacity: 0; }
          15%  { transform: translate(-50%, -10px) scale(1.15); opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translate(-50%, -90px) scale(1);   opacity: 0; }
        }
        @keyframes vmPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(155, 93, 229, 0.5); }
          50%      { box-shadow: 0 0 0 14px rgba(155, 93, 229, 0); }
        }
      `}</style>

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className={`flex-shrink-0 px-6 pt-5 pb-3 border-b flex items-center justify-between gap-4 ${
        isTales
          ? 'border-[#9B72B8]/25 bg-[rgba(15,10,28,0.65)] backdrop-blur'
          : 'border-[#C8A8DC]/30 bg-white/40 backdrop-blur'
      }`}>
        <div>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${isTales ? 'text-[#F9F0A8]' : 'text-[#9B5DE5]'}`}>
            {brand} · Vocabulary match
          </p>
          <h2 className={`text-base font-bold ${isTales ? 'ft-title-gold' : 'text-[#2D1B4E]'}`}>
            {slide.title ?? 'Key Vocabulary'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className={`text-center px-3 py-1.5 rounded-xl ${isTales ? 'bg-[rgba(30,20,50,0.75)] border border-[#9B72B8]/30' : 'bg-white/70 border border-[#C8A8DC]/40'}`}>
            <p className={`text-[9px] font-bold uppercase tracking-widest ${isTales ? 'text-[#A69BB8]' : 'text-[#5A3D7A]/50'}`}>Time</p>
            <p className={`text-sm font-mono font-bold ${isTales ? 'text-[#F8F5FC]' : 'text-[#5A3D7A]'}`}>{fmt(elapsed)}</p>
          </div>
          <div className={`text-center px-3 py-1.5 rounded-xl ${isTales ? 'bg-[rgba(30,20,50,0.75)] border border-[#9B72B8]/30' : 'bg-white/70 border border-[#C8A8DC]/40'}`}>
            <p className={`text-[9px] font-bold uppercase tracking-widest ${isTales ? 'text-[#F9F0A8]' : 'text-[#9B5DE5]'}`}>Score</p>
            <p className={`text-sm font-bold ${isTales ? 'text-[#F9F0A8]' : 'text-[#5A3D7A]'}`}>{score}</p>
          </div>
          {streak >= 2 && (
            <div className={`text-center px-3 py-1.5 rounded-xl ${
              isTales
                ? 'bg-[rgba(236,0,140,0.20)] border border-[#EC008C]/60'
                : 'bg-gradient-to-br from-orange-100 to-amber-100 border border-orange-300/60'
            }`}>
              <p className={`text-[9px] font-bold uppercase tracking-widest ${isTales ? 'text-[#EC008C]' : 'text-orange-600'}`}>Streak</p>
              <p className={`text-sm font-bold ${isTales ? 'text-[#F9F0A8]' : 'text-orange-600'}`}>🔥 {streak}</p>
            </div>
          )}
          <div className={`text-center px-3 py-1.5 rounded-xl ${
            isTales
              ? 'bg-[rgba(30,20,50,0.75)] border border-[#9B72B8]/40'
              : 'bg-gradient-to-br from-[#F0E5FF] to-[#FFE8F0] border border-[#C8A8DC]/60'
          }`}>
            <p className={`text-[9px] font-bold uppercase tracking-widest ${isTales ? 'text-[#7ED6E0]' : 'text-[#9B5DE5]'}`}>Done</p>
            <p className={`text-sm font-bold ${isTales ? 'text-[#F8F5FC]' : 'text-[#5A3D7A]'}`}>{done}/{total}</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className={`flex-shrink-0 px-6 py-2 border-b ${isTales ? 'bg-[rgba(15,10,28,0.5)] border-[#9B72B8]/25' : 'bg-white/40 border-[#C8A8DC]/20'}`}>
        <div className={`h-1.5 rounded-full overflow-hidden ${isTales ? 'bg-[rgba(30,20,50,0.8)]' : 'bg-[#E0D5FF]/60'}`}>
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isTales
                ? 'bg-gradient-to-r from-[#EC008C] via-[#F9F0A8] to-[#7ED6E0]'
                : 'bg-gradient-to-r from-[#9B5DE5] via-[#C8A8DC] to-[#F472B6]'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Active word banner */}
      <div className="flex-shrink-0 px-6 py-2 text-center">
        {allDone ? null : selectedWord ? (
          <p className={`text-sm font-semibold ${isTales ? 'text-[#F8F5FC]' : 'text-[#5A3D7A]'}`}>
            Matching <span className={`font-bold ${isTales ? 'text-[#F9F0A8]' : 'text-[#9B5DE5]'}`}>&ldquo;{selectedWord}&rdquo;</span> — tap its definition →
          </p>
        ) : (
          <p className={`text-xs ${isTales ? 'text-[#A69BB8]' : 'text-[#5A3D7A]/50'}`}>Tap a word on the left to start matching.</p>
        )}
      </div>

      {/* ── Main game / completion ──────────────────────────────── */}
      <div className="flex-1 px-[2cm] py-[4cm] min-h-0 overflow-y-auto">

        {allDone ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 max-w-2xl mx-auto">
            <p className="text-6xl mb-1">{stars().emoji}</p>
            <h3 className={`text-2xl font-bold ${isTales ? 'ft-title-gold' : 'text-[#2D1B4E]'}`}>All matched!</h3>
            <div className="grid grid-cols-3 gap-3 max-w-md w-full">
              <div className={isTales ? 'ft-glass-card p-3' : 'bg-white/80 border border-[#C8A8DC]/50 rounded-xl p-3'}>
                <p className={`text-[10px] uppercase tracking-widest ${isTales ? 'text-[#A69BB8]' : 'text-[#5A3D7A]/50'}`}>Score</p>
                <p className={`text-xl font-bold ${isTales ? 'text-[#F9F0A8]' : 'text-[#9B5DE5]'}`}>{score}</p>
              </div>
              <div className={isTales ? 'ft-glass-card p-3' : 'bg-white/80 border border-[#C8A8DC]/50 rounded-xl p-3'}>
                <p className={`text-[10px] uppercase tracking-widest ${isTales ? 'text-[#A69BB8]' : 'text-[#5A3D7A]/50'}`}>Time</p>
                <p className={`text-xl font-bold ${isTales ? 'text-[#F8F5FC]' : 'text-[#5A3D7A]'}`}>{fmt(elapsed)}</p>
              </div>
              <div className={isTales ? 'ft-glass-card p-3' : 'bg-white/80 border border-[#C8A8DC]/50 rounded-xl p-3'}>
                <p className={`text-[10px] uppercase tracking-widest ${isTales ? 'text-[#A69BB8]' : 'text-[#5A3D7A]/50'}`}>Best streak</p>
                <p className={`text-xl font-bold ${isTales ? 'text-[#EC008C]' : 'text-orange-500'}`}>🔥 {bestStreak}</p>
              </div>
            </div>
            <p className={`text-sm mt-2 ${isTales ? 'text-[#A69BB8]' : 'text-[#5A3D7A]/60'}`}>
              {wrongs} mistake{wrongs !== 1 && 's'}
            </p>
            {wrongs === 0 && (
              <div className={`rounded-2xl px-5 py-2 font-bold mt-1 ${
                isTales
                  ? 'bg-[rgba(126,214,224,0.15)] border border-[#7ED6E0]/60 text-[#7ED6E0]'
                  : 'bg-gradient-to-r from-green-100 to-emerald-100 border border-green-300 text-green-700'
              }`}>
                🎉 Perfect round — no mistakes!
              </div>
            )}
            <button
              onClick={restart}
              className={`mt-3 px-6 py-2.5 rounded-full text-sm font-bold active:scale-95 ${
                isTales
                  ? 'ft-cta'
                  : 'bg-gradient-to-r from-[#5A3D7A] to-[#9B5DE5] text-white shadow-lg shadow-[#5A3D7A]/30'
              }`}
            >
              ↻ Play again
            </button>
          </div>

        ) : (
          <div className="grid grid-cols-[1fr_36px_1fr] gap-x-4 gap-y-3 items-stretch max-w-5xl mx-auto">

            <p className={`text-[10px] font-bold uppercase tracking-widest col-start-1 self-end pb-1 px-1 ${isTales ? 'text-[#F9F0A8]' : 'text-[#5A3D7A]/50'}`}>Words</p>
            <span />
            <p className={`text-[10px] font-bold uppercase tracking-widest col-start-3 self-end pb-1 px-1 ${isTales ? 'text-[#F9F0A8]' : 'text-[#5A3D7A]/50'}`}>Definitions</p>

            {words.map((w, i) => {
              const def         = shuffledDefs[i];
              const wordMatched = !!matched[w.word];
              const defMatched  = !!matched[def.word];
              const isSelected  = selectedWord === w.word;
              const defClickable = !!selectedWord && !defMatched;
              const isWrong     = wrongFlash === def.word;

              const talesWordClass = wordMatched
                ? 'bg-[rgba(126,214,224,0.18)] border-[#7ED6E0] text-[#7ED6E0] cursor-default'
                : isSelected
                  ? 'bg-gradient-to-br from-[#EC008C] to-[#A70066] border-[#F9F0A8] text-white scale-[1.04] shadow-[0_0_28px_rgba(236,0,140,0.55)]'
                  : 'ft-vocab-row';

              const legacyWordClass = wordMatched
                ? 'bg-green-100 border-green-300 text-green-700 cursor-default'
                : isSelected
                  ? 'bg-gradient-to-br from-[#9B5DE5] to-[#5A3D7A] border-[#9B5DE5] text-white shadow-2xl shadow-[#5A3D7A]/40 scale-[1.04]'
                  : 'bg-white/90 border-[#E0D5FF] text-[#2D1B4E] hover:bg-white hover:border-[#C8A8DC] hover:scale-[1.01]';

              const talesDefClass = defMatched
                ? 'bg-[rgba(126,214,224,0.18)] border-[#7ED6E0] text-[#7ED6E0] text-base font-medium cursor-default'
                : isWrong
                  ? 'bg-[rgba(239,68,68,0.2)] border-red-500 text-red-300 scale-[0.98] text-base'
                  : defClickable
                    ? 'bg-[rgba(30,20,50,0.75)] border-[#F9F0A8]/40 text-[#F8F5FC] hover:bg-[rgba(236,0,140,0.20)] hover:border-[#EC008C] hover:text-white cursor-pointer text-base font-medium hover:scale-[1.02]'
                    : 'bg-[rgba(30,20,50,0.4)] border-[#9B72B8]/25 text-[#A69BB8]/50 cursor-default text-base';

              const legacyDefClass = defMatched
                ? 'bg-green-100 border-green-300 text-green-700 text-base font-medium cursor-default'
                : isWrong
                  ? 'bg-red-100 border-red-400 text-red-600 scale-[0.98] text-base'
                  : defClickable
                    ? 'bg-[#FFF8E8] border-[#F0C040] text-[#2D1B4E] hover:bg-gradient-to-br hover:from-[#9B5DE5] hover:to-[#5A3D7A] hover:text-white hover:border-[#5A3D7A] cursor-pointer text-base font-medium hover:scale-[1.02]'
                    : 'bg-white/60 border-[#E0D5FF] text-[#5A3D7A]/40 cursor-default text-base';

              return [
                <button
                  key={`w-${w.word}`}
                  onClick={(e) => handleWordClick(w.word, e)}
                  disabled={wordMatched}
                  className={`relative py-4 px-5 rounded-2xl text-left border-2 w-full flex flex-col gap-0.5 transition-all duration-200 ${
                    isTales ? talesWordClass : legacyWordClass
                  }`}
                  style={isSelected ? { animation: 'vmPulse 1.4s ease-out infinite' } : undefined}
                >
                  <span className="text-lg font-bold leading-tight">
                    {wordMatched ? '✓ ' : ''}{w.word}
                  </span>
                  {w.pronunciation && (
                    <span className={`text-xs font-normal ${
                      wordMatched
                        ? isTales ? 'text-[#7ED6E0]/70' : 'text-green-600'
                        : isSelected
                          ? 'text-white/80'
                          : isTales ? 'text-[#A69BB8]' : 'text-[#9B7CB8]'
                    }`}>
                      /{w.pronunciation}/
                    </span>
                  )}
                </button>,

                <div key={`arr-${w.word}`} className="flex items-center justify-center">
                  {isSelected && <span className={`font-bold text-xl animate-pulse ${isTales ? 'text-[#F9F0A8]' : 'text-[#9B5DE5]'}`}>→</span>}
                </div>,

                <button
                  key={`d-${def.word}`}
                  onClick={(e) => handleDefClick(def.word, e)}
                  disabled={defMatched || !defClickable}
                  className={`py-4 px-5 rounded-2xl text-left border-2 leading-snug w-full transition-all duration-200 ${
                    isTales ? talesDefClass : legacyDefClass
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
        <NoteBurst key={b.id} x={b.x} y={b.y} onDone={() => { /* cleaned via timeout in component */ }} />
      ))}
      {floats.map(f => (
        <span
          key={f.id}
          className="pointer-events-none absolute font-bold text-2xl select-none"
          style={{
            left: f.x, top: f.y - 10,
            color: f.pts >= 0 ? '#22c55e' : '#ef4444',
            textShadow: '0 2px 6px rgba(90, 61, 122, 0.25)',
            animation: 'vmFloatUp 1100ms ease-out forwards',
          }}
        >
          {f.pts >= 0 ? `+${f.pts}` : `${f.pts}`}
        </span>
      ))}
    </div>
  );
}
