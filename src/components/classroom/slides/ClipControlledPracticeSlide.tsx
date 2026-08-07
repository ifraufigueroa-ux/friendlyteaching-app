// FriendlyTeaching.cl — Friendlyflix: Controlled Practice
//
// Gamified replacement for the Friendlyrics LanguagePracticeSlide.
// Light cream-lavender background matching the language focus slide,
// centred hero, sticky scoreboard with stars, and per-exercise cards
// that animate in with a stagger. Two exercise types are supported:
//
//   - unscramble: tap word chips to build the target sentence; tap a
//     placed word to take it back out; Check button grades it
//   - match_halves: 4 large option buttons under the prompt
//
// Correct answers fire a small confetti burst on the card and a
// floating +pts indicator; wrong answers shake the card and dock pts.
'use client';
import { useMemo, useRef, useState } from 'react';
import type { Slide, PracticeItem } from '@/types/firebase';

interface Props { slide: Slide }

const BASE_PTS  = 10;
const STREAK_STEP = 5; // +5 per consecutive correct starting at streak 2
const WRONG_PENALTY = 4;

interface Particle { id: number; angle: number; distance: number; hue: number; duration: number }

function ConfettiBurst({ x, y, onDone }: { x: number; y: number; onDone: () => void }) {
  const particles = useMemo<Particle[]>(() => Array.from({ length: 18 }, (_, i) => ({
    id: i,
    angle: (i / 18) * Math.PI * 2 + Math.random() * 0.4,
    distance: 50 + Math.random() * 80,
    hue: 270 + Math.random() * 60, // purple-pink range
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
              background: `hsl(${p.hue}, 80%, 60%)`,
              animation: `cpBurst ${p.duration}ms ease-out forwards`,
              ['--dx' as string]: `${dx}px`,
              ['--dy' as string]: `${dy + 60}px`,
            } as React.CSSProperties}
          />
        );
      })}
      <style>{`
        @keyframes cpBurst {
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
  // Tokens come separated by "/" in the prompt. Shuffle once for stability.
  const shuffled = useMemo(() =>
    item.prompt.split('/').map(w => w.trim()).filter(Boolean).sort(() => Math.random() - 0.5),
  [item.prompt]);

  // Word indices currently placed in the sentence (in order).
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
      className={`relative ff-glass-card p-6 space-y-3
        ${checked && !isCorrect ? 'animate-[cpShake_400ms_ease-in-out]' : ''}`}
      style={{
        animation: 'cpCardIn 480ms cubic-bezier(0.16, 1, 0.3, 1) both',
        animationDelay: `${index * 90}ms`,
      }}
    >
      <style>{`
        @keyframes cpCardIn {
          from { opacity: 0; transform: translateY(18px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes cpShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FCEE21]">
          Exercise {index + 1} · Unscramble
        </span>
        {checked && (
          <span className={`text-xs font-bold uppercase ${isCorrect ? 'text-[#00A8E8]' : 'text-red-400'}`}>
            {isCorrect ? '✓ Correct' : '✗ Try again'}
          </span>
        )}
      </div>

      {/* Sentence builder */}
      <div className={`min-h-14 rounded-2xl border-2 border-dashed p-3 flex flex-wrap gap-1.5 items-center transition-colors
        ${checked
          ? isCorrect ? 'border-[#00A8E8]/60 bg-[rgba(0,168,232,0.10)]' : 'border-red-400/60 bg-red-500/10'
          : 'border-[#FCEE21]/40 bg-[rgba(15,10,28,0.55)]'
        }`}>
        {placed.length === 0 ? (
          <span className="text-xs text-[#B8A9D4]/60 italic px-1">Tap a word below to start the sentence…</span>
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
                    ? 'bg-[#00A8E8] border-[#00A8E8] text-[#0F0A1C] cursor-default'
                    : 'bg-red-500/20 border-red-400 text-red-200 cursor-default'
                  : 'bg-gradient-to-br from-[#EC008C] to-[#9333EA] border-[#EC008C] text-white hover:opacity-90 active:scale-95 shadow-[0_0_16px_rgba(236,0,140,0.35)]'
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
            className="px-3 py-1.5 rounded-xl text-sm font-semibold border-2 border-[#9B7CB8]/40 bg-[rgba(15,10,28,0.7)] hover:bg-[rgba(236,0,140,0.18)] hover:border-[#EC008C] active:scale-95 text-[#F8F5FC] transition-all disabled:opacity-40"
          >
            {shuffled[wIdx]}
          </button>
        ))}
        {available.length === 0 && !checked && (
          <span className="text-[11px] text-[#B8A9D4]/60 italic px-1 py-2">All words placed — tap Check.</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] text-[#B8A9D4]/70">
          {placed.length}/{shuffled.length} placed
        </span>
        {checked ? (
          isCorrect ? null : (
            <button
              onClick={retry}
              className="px-4 py-2 rounded-full text-xs font-bold bg-[rgba(15,10,28,0.75)] border-2 border-[#FCEE21]/50 text-[#FCEE21] hover:bg-[rgba(240,192,64,0.15)] active:scale-95"
            >
              ↻ Try again
            </button>
          )
        ) : (
          <button
            onClick={check}
            disabled={placed.length === 0}
            className="ff-cta text-[11px] px-5 py-2 disabled:opacity-40"
          >
            ✓ Check
          </button>
        )}
      </div>

      {checked && !isCorrect && (
        <p className="text-[11px] text-red-300 leading-snug pt-1">
          Hint: re-read the sentence and check the order of cause and effect.
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
  const [chosen, setChosen]   = useState<string | null>(null);
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
      className={`relative ff-glass-card p-6 space-y-3
        ${chosen && !correct ? 'animate-[cpShake_400ms_ease-in-out]' : ''}`}
      style={{
        animation: 'cpCardIn 480ms cubic-bezier(0.16, 1, 0.3, 1) both',
        animationDelay: `${index * 90}ms`,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FCEE21]">
          Exercise {index + 1} · Match halves
        </span>
        {chosen && (
          <span className={`text-xs font-bold uppercase ${correct ? 'text-[#00A8E8]' : 'text-red-400'}`}>
            {correct ? '✓ Correct' : '✗ Wrong'}
          </span>
        )}
      </div>
      <p className="text-base md:text-lg italic text-[#F8F5FC] leading-relaxed" style={{ fontFamily: 'var(--font-cinzel), Georgia, serif' }}>
        &ldquo;{item.prompt}&rdquo; …
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
                    ? 'bg-[#00A8E8] border-[#00A8E8] text-[#0F0A1C] shadow-[0_0_22px_rgba(0,168,232,0.5)]'
                    : showWrong
                      ? 'bg-red-500/20 border-red-400 text-red-300 line-through'
                      : 'bg-[rgba(15,10,28,0.4)] border-[#9B7CB8]/25 text-[#B8A9D4]/50'
                  : 'bg-[rgba(45,27,78,0.65)] border-[#9B7CB8]/40 text-[#F8F5FC] hover:bg-[rgba(236,0,140,0.20)] hover:border-[#EC008C] hover:scale-[1.01] active:scale-95'
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

export default function ClipControlledPracticeSlide({ slide }: Props) {
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
    // Only count first attempt per item.
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
      <div className="h-full flex items-center justify-center bg-transparent text-[#F8F5FC]">
        <div className="text-center max-w-md p-8">
          <p className="text-5xl mb-3">🎯</p>
          <p className="text-lg font-bold ff-title-teal mb-1">No practice configured</p>
          <p className="text-sm text-[#B8A9D4]">The teacher has not added controlled practice items yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-y-auto bg-transparent text-[#F8F5FC]">
      <style>{`
        @keyframes cpFloatUp {
          0%   { transform: translate(-50%, 0)    scale(0.7); opacity: 0; }
          15%  { transform: translate(-50%, -10px) scale(1.1); opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translate(-50%, -90px) scale(1);   opacity: 0; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-6 md:px-10 py-10 md:py-14 flex flex-col items-center text-center gap-6">

        {/* Eyebrow + hero icon */}
        <div className="flex flex-col items-center gap-3">
          <span
            className="text-[11px] font-bold uppercase tracking-[0.25em] px-3 py-1 rounded-full backdrop-blur"
            style={{
              background: 'rgba(45, 27, 78, 0.75)',
              border: '1px solid rgba(76, 216, 204, 0.4)',
              color: '#00A8E8',
            }}
          >
            Friendlyflix · Controlled practice
          </span>
          <span className="text-5xl md:text-6xl">🎯</span>
        </div>

        {/* Title — teal Cinzel per Twilight Reel practice spec */}
        <h1
          className="text-3xl md:text-4xl font-black leading-tight tracking-wide max-w-3xl"
          style={{
            fontFamily: 'var(--font-cinzel), Cinzel, Georgia, serif',
            color: '#00A8E8',
            textShadow: '0 2px 20px rgba(0,0,0,0.6), 0 0 32px rgba(0,168,232,0.20)',
            letterSpacing: '0.05em',
          }}
        >
          {slide.title ?? 'Controlled practice'}
        </h1>

        {slide.subtitle && (
          <p className="text-base md:text-lg text-[#D9CFE6] leading-relaxed max-w-2xl">
            {slide.subtitle}
          </p>
        )}

        {/* Scoreboard */}
        <div className="w-full max-w-3xl ff-glass-card px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#B8A9D4]">Done</p>
            <p className="text-lg font-bold text-[#00A8E8]">{doneCount}/{total}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#B8A9D4]">Score</p>
            <p className="text-lg font-bold text-[#FCEE21]">{score}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#B8A9D4]">Streak</p>
            <p className={`text-lg font-bold ${streak >= 2 ? 'text-[#EC008C]' : 'text-[#B8A9D4]/40'}`}>
              {streak >= 2 ? `🔥 ${streak}` : streak}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#B8A9D4]">Rating</p>
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
          <div
            className="w-full max-w-2xl rounded-3xl p-6 space-y-3 text-center"
            style={{
              background: 'rgba(45, 27, 78, 0.75)',
              border: '1.5px solid rgba(76, 216, 204, 0.6)',
              boxShadow: '0 16px 40px rgba(0,168,232,0.15)',
            }}
          >
            <p className="text-5xl">{stars()}</p>
            <p className="text-xl font-bold ff-title-spotlight">All exercises complete!</p>
            <p className="text-sm text-[#D9CFE6]">
              You got <strong className="text-[#00A8E8]">{correctCount}</strong> of <strong className="text-[#FCEE21]">{total}</strong> right
              {bestStreak >= 2 && <> · best streak <strong className="text-[#EC008C]">🔥 {bestStreak}</strong></>}
            </p>
            <button
              onClick={restart}
              className="mt-2 px-6 py-2.5 bg-[rgba(15,10,28,0.75)] border-2 border-[#FCEE21]/50 text-[#FCEE21] rounded-full text-sm font-bold hover:bg-[rgba(240,192,64,0.15)] active:scale-95"
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
            color: f.pts >= 0 ? '#00A8E8' : '#F87171',
            textShadow: '0 2px 8px rgba(0,0,0,0.5), 0 0 12px currentColor',
            animation: 'cpFloatUp 1100ms ease-out forwards',
          }}
        >
          {f.pts >= 0 ? `+${f.pts}` : `${f.pts}`}
        </span>
      ))}
    </div>
  );
}
