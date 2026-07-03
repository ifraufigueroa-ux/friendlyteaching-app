// FriendlyTeaching.cl — Friendlyrics: Language Practice (gamified)
//
// Music-branded mirror of ClipControlledPracticeSlide. Same CLT flow —
// sticky scoreboard with stars + streak, per-exercise cards, confetti
// bursts on correct answers, shake + score docking on wrong — but with
// the Friendlyrics pink/magenta palette instead of the Friendlyflix
// purple. Supports the same two practice types:
//
//   • unscramble    — tap word chips to build the target lyric line
//   • match_halves  — 4 large options for the second half of a lyric
//
// A perfect run (zero wrongs) awards 3 stars; every mistake docks a
// star, floors at 1.
'use client';
import { useMemo, useRef, useState } from 'react';
import type { Slide, PracticeItem } from '@/types/firebase';

interface Props { slide: Slide }

const BASE_PTS      = 10;
const STREAK_STEP   = 5;
const WRONG_PENALTY = 4;

// ─── Confetti burst (positive feedback) ───────────────────────────────

interface Particle { id: number; angle: number; distance: number; hue: number; duration: number }

function ConfettiBurst({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  const particles = useMemo<Particle[]>(() => Array.from({ length: 18 }, (_, i) => ({
    id: i,
    angle: (i / 18) * Math.PI * 2 + Math.random() * 0.4,
    distance: 50 + Math.random() * 80,
    // Pink → magenta hue range for the Friendlyrics brand.
    hue: 320 + Math.random() * 40,
    duration: 600 + Math.random() * 400,
  })), []);
  useMemo(() => { setTimeout(onDone, 1200); return null; }, [onDone]);
  return (
    <div className="pointer-events-none absolute inset-0 z-40">
      {particles.map(p => {
        const dx = Math.cos(p.angle) * p.distance;
        const dy = Math.sin(p.angle) * p.distance;
        return (
          <span
            key={p.id}
            className="absolute block rounded-sm"
            style={{
              left: x, top: y, width: 7, height: 10,
              background: `hsl(${p.hue}, 82%, 62%)`,
              animation: `lpBurst ${p.duration}ms ease-out forwards`,
              ['--dx' as string]: `${dx}px`,
              ['--dy' as string]: `${dy + 60}px`,
            } as React.CSSProperties}
          />
        );
      })}
      <style>{`
        @keyframes lpBurst {
          0%   { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) rotate(540deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Unscramble card ───────────────────────────────────────────────────

function UnscrambleCard({
  item,
  index,
  onResult,
}: {
  item: PracticeItem;
  index: number;
  onResult: (correct: boolean, x: number, y: number) => void;
}) {
  // Words are split on "/" in the prompt and shuffled once for stability.
  const shuffled = useMemo(() =>
    item.prompt.split('/').map(w => w.trim()).filter(Boolean).sort(() => Math.random() - 0.5),
  [item.prompt]);

  const [placed, setPlaced]   = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const available = shuffled.map((_, i) => i).filter(i => !placed.includes(i));
  const sentence  = placed.map(i => shuffled[i]).join(' ');
  const isCorrect = checked && sentence.toLowerCase().replace(/[.,'"]/g, '') === item.answer.toLowerCase().replace(/[.,'"]/g, '');

  function placeWord(i: number) {
    if (checked) return;
    setPlaced(prev => [...prev, i]);
  }
  function unplace(idx: number) {
    if (checked) return;
    setPlaced(prev => prev.filter((_, k) => k !== idx));
  }
  function check() {
    if (placed.length === 0) return;
    setChecked(true);
    const rect = cardRef.current?.getBoundingClientRect();
    const parentRect = cardRef.current?.offsetParent?.getBoundingClientRect();
    const x = rect && parentRect ? rect.left - parentRect.left + rect.width / 2 : 0;
    const y = rect && parentRect ? rect.top  - parentRect.top  + 60                : 0;
    const ok = sentence.toLowerCase().replace(/[.,'"]/g, '') === item.answer.toLowerCase().replace(/[.,'"]/g, '');
    onResult(ok, x, y);
  }
  function retry() {
    setPlaced([]);
    setChecked(false);
  }

  return (
    <div
      ref={cardRef}
      className={`relative bg-white rounded-3xl shadow-md shadow-[#F472B6]/25 border border-white p-6 space-y-3 transition-shadow hover:shadow-xl
        ${checked && !isCorrect ? 'animate-[lpShake_400ms_ease-in-out]' : ''}`}
      style={{
        animation: 'lpCardIn 480ms cubic-bezier(0.16, 1, 0.3, 1) both',
        animationDelay: `${index * 90}ms`,
      }}
    >
      <style>{`
        @keyframes lpCardIn {
          from { opacity: 0; transform: translateY(18px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes lpShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#EC4899]/80">
          Exercise {index + 1} · Unscramble the lyric
        </span>
        {checked && (
          <span className={`text-xs font-bold uppercase ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
            {isCorrect ? '✓ Correct' : '✗ Try again'}
          </span>
        )}
      </div>

      {/* Sentence builder — where placed words go */}
      <div className={`min-h-14 rounded-2xl border-2 border-dashed p-3 flex flex-wrap gap-1.5 items-center transition-colors
        ${checked
          ? isCorrect ? 'border-green-400 bg-green-50' : 'border-red-300 bg-red-50'
          : 'border-[#F472B6]/40 bg-[#FFF0F7]'
        }`}>
        {placed.length === 0 ? (
          <span className="text-xs text-[#EC4899]/60 italic px-1">Tap a word below to start the lyric…</span>
        ) : (
          placed.map((wIdx, slot) => (
            <button
              key={`p-${slot}`}
              type="button"
              onClick={() => unplace(slot)}
              disabled={checked}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all border
                ${checked
                  ? isCorrect
                    ? 'bg-green-100 border-green-300 text-green-800 cursor-default'
                    : 'bg-red-100 border-red-300 text-red-800 cursor-default'
                  : 'bg-gradient-to-br from-[#EC4899] to-[#F472B6] border-[#EC4899] text-white hover:opacity-90 active:scale-95'
                }`}
            >
              {shuffled[wIdx]}
            </button>
          ))
        )}
      </div>

      {/* Available word pool */}
      <div className="flex flex-wrap gap-1.5 min-h-[2.25rem]">
        {available.map(wIdx => (
          <button
            key={`a-${wIdx}`}
            type="button"
            onClick={() => placeWord(wIdx)}
            disabled={checked}
            className="px-3 py-1.5 rounded-xl text-sm font-semibold border-2 border-[#F472B6]/50 bg-white hover:bg-[#FFE8F0] hover:border-[#EC4899] active:scale-95 text-[#2D1B4E] transition-all disabled:opacity-40"
          >
            {shuffled[wIdx]}
          </button>
        ))}
        {available.length === 0 && !checked && (
          <span className="text-[11px] text-[#EC4899]/60 italic px-1 py-2">All words placed — tap Check.</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] text-[#EC4899]/60">
          {placed.length}/{shuffled.length} placed
        </span>
        {checked ? (
          isCorrect ? null : (
            <button
              onClick={retry}
              className="px-4 py-2 rounded-full text-xs font-bold bg-white border-2 border-[#EC4899] text-[#EC4899] hover:bg-[#FFE8F0] active:scale-95"
            >
              ↻ Try again
            </button>
          )
        ) : (
          <button
            onClick={check}
            disabled={placed.length === 0}
            className="px-5 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-[#EC4899] to-[#F472B6] text-white shadow disabled:opacity-40 active:scale-95"
          >
            ✓ Check
          </button>
        )}
      </div>

      {checked && !isCorrect && (
        <p className="text-[11px] text-red-600 leading-snug pt-1">
          Hint: sing the line in your head — the melody usually tells you the word order.
        </p>
      )}
    </div>
  );
}

// ─── Match halves card ─────────────────────────────────────────────────

function MatchHalvesCard({
  item,
  index,
  onResult,
}: {
  item: PracticeItem;
  index: number;
  onResult: (correct: boolean, x: number, y: number) => void;
}) {
  const options = useMemo(() => {
    const opts = item.options ?? [];
    return [...opts].sort(() => Math.random() - 0.5);
  }, [item.options]);
  const [chosen, setChosen] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const correct = chosen != null && chosen.toLowerCase().replace(/[.,'"]/g, '') === item.answer.toLowerCase().replace(/[.,'"]/g, '');

  function pick(opt: string) {
    if (chosen) return;
    setChosen(opt);
    const rect = cardRef.current?.getBoundingClientRect();
    const parentRect = cardRef.current?.offsetParent?.getBoundingClientRect();
    const x = rect && parentRect ? rect.left - parentRect.left + rect.width / 2 : 0;
    const y = rect && parentRect ? rect.top  - parentRect.top  + 60                : 0;
    const ok = opt.toLowerCase().replace(/[.,'"]/g, '') === item.answer.toLowerCase().replace(/[.,'"]/g, '');
    onResult(ok, x, y);
  }

  return (
    <div
      ref={cardRef}
      className={`relative bg-white rounded-3xl shadow-md shadow-[#F472B6]/25 border border-white p-6 space-y-3
        ${chosen && !correct ? 'animate-[lpShake_400ms_ease-in-out]' : ''}`}
      style={{
        animation: 'lpCardIn 480ms cubic-bezier(0.16, 1, 0.3, 1) both',
        animationDelay: `${index * 90}ms`,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#EC4899]/80">
          Exercise {index + 1} · Finish the lyric
        </span>
        {chosen && (
          <span className={`text-xs font-bold uppercase ${correct ? 'text-green-600' : 'text-red-600'}`}>
            {correct ? '✓ Correct' : '✗ Wrong'}
          </span>
        )}
      </div>
      <p className="text-base md:text-lg font-serif italic text-[#2D1B4E] leading-relaxed">
        🎵 &ldquo;{item.prompt}&rdquo; …
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((opt, i) => {
          const isPicked = chosen === opt;
          const isAnswer = opt.toLowerCase().replace(/[.,'"]/g, '') === item.answer.toLowerCase().replace(/[.,'"]/g, '');
          const showRight = chosen && isAnswer;
          const showWrong = chosen && isPicked && !isAnswer;
          return (
            <button
              key={i}
              type="button"
              onClick={() => pick(opt)}
              disabled={!!chosen}
              className={`text-left px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all
                ${chosen
                  ? showRight
                    ? 'bg-green-100 border-green-500 text-green-900'
                    : showWrong
                      ? 'bg-red-100 border-red-400 text-red-900 line-through'
                      : 'bg-white border-gray-200 text-gray-400'
                  : 'bg-white border-[#F472B6]/50 text-[#2D1B4E] hover:bg-[#FFE8F0] hover:border-[#EC4899] hover:scale-[1.01] active:scale-95'
                }`}
            >
              {chosen && showRight && '✓ '}
              {chosen && showWrong && '✗ '}
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Slide ─────────────────────────────────────────────────────────────

interface FloatPts { id: number; x: number; y: number; pts: number }

export default function LanguagePracticeSlide({ slide }: Props) {
  const items: PracticeItem[] = slide.practiceItems ?? [];
  const [results, setResults] = useState<Map<number, boolean>>(new Map());
  const [score, setScore]     = useState(0);
  const [streak, setStreak]   = useState(0);
  const [bestStreak, setBest] = useState(0);
  const [wrongs, setWrongs]   = useState(0);
  const [bursts, setBursts]   = useState<{ id: number; x: number; y: number }[]>([]);
  const [floats, setFloats]   = useState<FloatPts[]>([]);

  const total       = items.length;
  const doneCount   = results.size;
  const allDone     = doneCount === total && total > 0;
  const correctCount = Array.from(results.values()).filter(Boolean).length;

  function stars(): string {
    if (wrongs === 0) return '⭐⭐⭐';
    if (wrongs <= 2)  return '⭐⭐';
    return '⭐';
  }

  function handleResult(idx: number, ok: boolean, x: number, y: number) {
    if (results.has(idx)) return;
    setResults(prev => new Map(prev).set(idx, ok));
    if (ok) {
      const sNext = streak + 1;
      const bonus = sNext >= 2 ? (sNext - 1) * STREAK_STEP : 0;
      const pts   = BASE_PTS + bonus;
      setStreak(sNext);
      setBest(b => Math.max(b, sNext));
      setScore(s => s + pts);
      const id1 = Date.now() + Math.random();
      setBursts(b => [...b, { id: id1, x, y }]);
      setTimeout(() => setBursts(b => b.filter(b2 => b2.id !== id1)), 1300);
      const id2 = Date.now() + 0.5 + Math.random();
      setFloats(f => [...f, { id: id2, x, y, pts }]);
      setTimeout(() => setFloats(f => f.filter(f2 => f2.id !== id2)), 1100);
    } else {
      setStreak(0);
      setWrongs(w => w + 1);
      setScore(s => Math.max(0, s - WRONG_PENALTY));
      const id = Date.now() + Math.random();
      setFloats(f => [...f, { id, x, y, pts: -WRONG_PENALTY }]);
      setTimeout(() => setFloats(f => f.filter(f2 => f2.id !== id)), 1100);
    }
  }

  function restart() {
    setResults(new Map());
    setScore(0);
    setStreak(0);
    setBest(0);
    setWrongs(0);
  }

  if (total === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-[#F9F5FF] via-[#FFF0F7] to-[#FFE8F0]">
        <div className="text-center max-w-md p-8">
          <p className="text-5xl mb-3">🎯</p>
          <p className="text-lg font-bold text-[#EC4899] mb-1">No practice configured</p>
          <p className="text-sm text-[#EC4899]/70">The teacher has not added practice items to this song yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-y-auto bg-gradient-to-br from-[#F9F5FF] via-[#FFF0F7] to-[#FFE8F0] text-[#2D1B4E]">
      <style>{`
        @keyframes lpFloatUp {
          0%   { transform: translate(-50%, 0)     scale(0.7); opacity: 0; }
          15%  { transform: translate(-50%, -10px) scale(1.1); opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translate(-50%, -90px) scale(1);   opacity: 0; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-[2cm] py-[3cm] flex flex-col items-center text-center gap-7">

        {/* Eyebrow + hero icon */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#EC4899]/80 bg-white/70 border border-[#F472B6]/40 px-3 py-1 rounded-full backdrop-blur">
            Friendlyrics · Practice
          </span>
          <span className="text-6xl">🎯</span>
        </div>

        {/* Title */}
        <h1 className="font-serif font-bold text-[#2D1B4E] text-4xl md:text-5xl leading-tight max-w-3xl">
          {slide.title ?? "Let's practice!"}
        </h1>

        {slide.subtitle && (
          <p className="text-base md:text-lg text-[#5A3D7A]/85 leading-relaxed max-w-2xl">
            {slide.subtitle}
          </p>
        )}

        {/* Scoreboard */}
        <div className="w-full max-w-3xl bg-white/70 backdrop-blur rounded-2xl border border-[#F472B6]/40 shadow px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#EC4899]/70">Done</p>
            <p className="text-lg font-bold text-[#EC4899]">{doneCount}/{total}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#EC4899]/70">Score</p>
            <p className="text-lg font-bold text-[#EC4899]">{score}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#EC4899]/70">Streak</p>
            <p className={`text-lg font-bold ${streak >= 2 ? 'text-orange-500' : 'text-[#EC4899]/40'}`}>
              {streak >= 2 ? `🔥 ${streak}` : streak}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#EC4899]/70">Rating</p>
            <p className="text-lg leading-none">{stars()}</p>
          </div>
        </div>

        {/* Exercise cards */}
        <div className="w-full max-w-3xl space-y-4">
          {items.map((item, i) => (
            item.type === 'unscramble' ? (
              <UnscrambleCard
                key={i}
                item={item}
                index={i}
                onResult={(ok, x, y) => handleResult(i, ok, x, y)}
              />
            ) : item.type === 'match_halves' ? (
              <MatchHalvesCard
                key={i}
                item={item}
                index={i}
                onResult={(ok, x, y) => handleResult(i, ok, x, y)}
              />
            ) : null
          ))}
        </div>

        {/* Completion */}
        {allDone && (
          <div className="w-full max-w-2xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-3xl p-6 shadow-xl space-y-3 text-center">
            <p className="text-5xl">{stars()}</p>
            <p className="text-xl font-bold text-[#2D1B4E]">All exercises complete!</p>
            <p className="text-sm text-[#2D1B4E]/70">
              You got <strong className="text-green-700">{correctCount}</strong> of <strong>{total}</strong> right
              {bestStreak >= 2 && <> · best streak <strong className="text-orange-500">🔥 {bestStreak}</strong></>}
            </p>
            <button
              onClick={restart}
              className="mt-2 px-6 py-2.5 bg-white border-2 border-[#EC4899] text-[#EC4899] rounded-full text-sm font-bold hover:bg-[#FFE8F0] active:scale-95"
            >
              ↻ Try again
            </button>
          </div>
        )}

      </div>

      {/* Confetti bursts */}
      {bursts.map(b => (
        <ConfettiBurst
          key={b.id}
          x={b.x}
          y={b.y}
          onDone={() => setBursts(bs => bs.filter(b2 => b2.id !== b.id))}
        />
      ))}

      {/* Floating point popups */}
      {floats.map(f => (
        <span
          key={f.id}
          className="pointer-events-none absolute font-bold text-2xl select-none z-50"
          style={{
            left: f.x, top: f.y,
            color: f.pts >= 0 ? '#16a34a' : '#dc2626',
            textShadow: '0 2px 6px rgba(0,0,0,0.15)',
            animation: 'lpFloatUp 1100ms ease-out forwards',
          }}
        >
          {f.pts >= 0 ? `+${f.pts}` : `${f.pts}`}
        </span>
      ))}
    </div>
  );
}
