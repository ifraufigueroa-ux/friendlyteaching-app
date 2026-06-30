'use client';
// FriendlyTeaching.cl — VocabularySlide (gamified)
//
// Three phases:
//   1. preview  → grid of cards, tap to flip and study each entry
//   2. playing  → match game (word ↔ meaning) with attempts + timer
//   3. finished → results with medal, accuracy, attempts, time
//
// The match game is the canonical Quizlet-style "pick two, they lock in if
// they're a pair, flash red otherwise". Reaches the finished phase when
// every pair has been locked.

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Slide, VocabWord } from '@/types/firebase';

type Phase = 'preview' | 'playing' | 'finished';

interface Props { slide: Slide; }

// ── Helpers ────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const r = [...arr];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s - m * 60}s` : `${s}s`;
}

export default function VocabularySlide({ slide }: Props) {
  const words = slide.words ?? [];

  if (words.length === 0) {
    return (
      <div className="flex flex-col h-full overflow-auto p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-[#5A3D7A]">{slide.title}</h2>
          {slide.subtitle && <p className="text-gray-500 mt-1">{slide.subtitle}</p>}
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-400">
          No hay vocabulario en esta slide.
        </div>
      </div>
    );
  }

  return <VocabularyGame slide={slide} words={words} />;
}

function VocabularyGame({ slide, words }: { slide: Slide; words: VocabWord[] }) {
  const [phase, setPhase] = useState<Phase>('preview');

  // ─── Preview state ──────────────────────────────────────
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  // ─── Game state ─────────────────────────────────────────
  const [wordOrder,   setWordOrder]   = useState<number[]>([]);
  const [meaningOrder, setMeaningOrder] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set()); // indices of matched pairs (canonical word index)
  const [selectedWord, setSelectedWord]       = useState<number | null>(null);
  const [selectedMeaning, setSelectedMeaning] = useState<number | null>(null);
  const [wrongPulse, setWrongPulse] = useState<{ w: number; m: number } | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [finishedAt, setFinishedAt] = useState(0);
  const [streak, setStreak] = useState(0);

  // ─── Helpers ────────────────────────────────────────────
  const startGame = () => {
    setWordOrder(shuffle(words.map((_, i) => i)));
    setMeaningOrder(shuffle(words.map((_, i) => i)));
    setMatched(new Set());
    setSelectedWord(null);
    setSelectedMeaning(null);
    setWrongPulse(null);
    setAttempts(0);
    setStreak(0);
    setStartedAt(Date.now());
    setFinishedAt(0);
    setPhase('playing');
  };

  const resetAll = () => {
    setRevealed(new Set());
    setPhase('preview');
  };

  // Check pair when both sides have a selection
  useEffect(() => {
    if (selectedWord === null || selectedMeaning === null) return;

    const isMatch = selectedWord === selectedMeaning;
    setAttempts(a => a + 1);

    if (isMatch) {
      const newMatched = new Set(matched);
      newMatched.add(selectedWord);
      setMatched(newMatched);
      setStreak(s => s + 1);
      setSelectedWord(null);
      setSelectedMeaning(null);
      if (newMatched.size === words.length) {
        setFinishedAt(Date.now());
        // Brief delay so the last match animation plays before switching phase
        const t = setTimeout(() => setPhase('finished'), 700);
        return () => clearTimeout(t);
      }
    } else {
      setStreak(0);
      setWrongPulse({ w: selectedWord, m: selectedMeaning });
      const t = setTimeout(() => {
        setWrongPulse(null);
        setSelectedWord(null);
        setSelectedMeaning(null);
      }, 600);
      return () => clearTimeout(t);
    }
  }, [selectedWord, selectedMeaning]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Phase: preview ─────────────────────────────────────
  if (phase === 'preview') {
    return (
      <div className="flex flex-col h-full overflow-auto p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#5A3D7A]">{slide.title ?? 'Vocabulary'}</h2>
            {slide.subtitle && <p className="text-gray-500 mt-1">{slide.subtitle}</p>}
          </div>
          <button
            onClick={startGame}
            className="flex-shrink-0 px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #5A3D7A, #9B7CB8)' }}
          >
            🎯 Jugar
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {words.map((word, i) => (
            <button
              key={i}
              onClick={() => setRevealed(prev => {
                const n = new Set(prev);
                if (n.has(i)) n.delete(i); else n.add(i);
                return n;
              })}
              className={`rounded-2xl p-5 text-left transition-all shadow-sm border-2 cursor-pointer ${
                revealed.has(i)
                  ? 'bg-[#F0E5FF] border-[#C8A8DC]'
                  : 'bg-white border-gray-100 hover:border-[#C8A8DC]'
              }`}
            >
              <div className="text-lg font-bold text-[#5A3D7A] mb-1">{word.word}</div>
              {revealed.has(i) ? (
                <>
                  <div className="text-base text-gray-600 font-medium">{word.translation}</div>
                  {word.pronunciation && (
                    <div className="text-sm text-[#9B7CB8] mt-1">/{word.pronunciation}/</div>
                  )}
                  {word.example && (
                    <div className="text-sm text-gray-400 mt-2 italic">{word.example}</div>
                  )}
                </>
              ) : (
                <div className="text-sm text-gray-400 mt-1">toca para ver</div>
              )}
            </button>
          ))}
        </div>

        <p className="text-xs text-center text-gray-400 mt-6">Tap each card to study, then hit <strong className="text-[#5A3D7A]">Jugar</strong> to start the match game.</p>
      </div>
    );
  }

  // ─── Phase: playing ─────────────────────────────────────
  if (phase === 'playing') {
    return (
      <div className="flex flex-col h-full overflow-hidden p-4 sm:p-6">

        {/* ── Header ───────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <div>
              <p className="text-xs font-bold text-[#9B7CB8] uppercase tracking-widest">Match game</p>
              <p className="text-base font-bold text-[#5A3D7A]">{matched.size} / {words.length} pares</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {streak >= 2 && (
              <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-extrabold shadow-md">
                🔥 {streak}
              </span>
            )}
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Intentos</p>
              <p className="text-lg font-extrabold text-[#5A3D7A] leading-tight">{attempts}</p>
            </div>
            <button
              onClick={startGame}
              title="Reiniciar"
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold transition-colors"
            >
              ↺
            </button>
          </div>
        </div>

        {/* ── Progress bar ─────────────────────────────── */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-5 flex-shrink-0">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#5A3D7A] to-[#C8A8DC] transition-all duration-500"
            style={{ width: `${(matched.size / words.length) * 100}%` }}
          />
        </div>

        {/* ── Two columns ──────────────────────────────── */}
        <div className="flex-1 overflow-auto grid grid-cols-2 gap-3 sm:gap-4">
          {/* Words column */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1 text-center">Palabra</p>
            {wordOrder.map(i => (
              <Tile
                key={`w-${i}`}
                text={words[i].word}
                matched={matched.has(i)}
                selected={selectedWord === i}
                wrong={wrongPulse?.w === i}
                onClick={() => {
                  if (matched.has(i)) return;
                  if (wrongPulse) return;
                  setSelectedWord(i);
                }}
                bold
              />
            ))}
          </div>

          {/* Meanings column */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1 text-center">Significado</p>
            {meaningOrder.map(i => (
              <Tile
                key={`m-${i}`}
                text={words[i].translation}
                matched={matched.has(i)}
                selected={selectedMeaning === i}
                wrong={wrongPulse?.m === i}
                onClick={() => {
                  if (matched.has(i)) return;
                  if (wrongPulse) return;
                  setSelectedMeaning(i);
                }}
              />
            ))}
          </div>
        </div>

        <p className="text-[11px] text-center text-gray-400 mt-3 flex-shrink-0">
          Selecciona una palabra y su significado. Los pares correctos se quedan verdes.
        </p>
      </div>
    );
  }

  // ─── Phase: finished ────────────────────────────────────
  const elapsed = finishedAt - startedAt;
  const perfectAttempts = words.length;
  const accuracy = attempts > 0 ? Math.round((perfectAttempts / attempts) * 100) : 100;

  let medal       = '🎓';
  let medalLabel  = 'Bien hecho';
  let medalColor  = '#5A3D7A';
  if (attempts === perfectAttempts)    { medal = '🏆'; medalLabel = '¡Perfecto!';   medalColor = '#D97706'; }
  else if (attempts <= perfectAttempts + 2) { medal = '🥇'; medalLabel = 'Excelente';   medalColor = '#D97706'; }
  else if (attempts <= perfectAttempts + 5) { medal = '🥈'; medalLabel = 'Muy bien';    medalColor = '#6B7280'; }
  else if (attempts <= perfectAttempts + 10){ medal = '🥉'; medalLabel = 'Sólido';      medalColor = '#B45309'; }

  return (
    <div className="flex flex-col h-full overflow-auto p-6 items-center justify-center text-center bg-gradient-to-br from-[#F9F5FF] via-white to-[#F0E5FF]">

      {/* Confetti-ish floating emojis */}
      <div className="relative">
        <div className="text-7xl mb-3 animate-bounce">{medal}</div>
      </div>

      <p className="text-sm font-bold uppercase tracking-widest mb-1" style={{ color: medalColor }}>{medalLabel}</p>
      <h2 className="text-3xl font-extrabold text-[#5A3D7A] mb-2">¡Match completo!</h2>
      <p className="text-sm text-gray-500 mb-6">Emparejaste las {words.length} palabras con su significado.</p>

      <div className="grid grid-cols-3 gap-3 w-full max-w-md mb-6">
        <Stat label="Pares" value={`${words.length}`} />
        <Stat label="Intentos" value={`${attempts}`} />
        <Stat label="Tiempo" value={formatTime(elapsed)} />
      </div>

      <div className="bg-white border border-[#E8D5F0] rounded-2xl p-4 mb-6 max-w-md w-full">
        <p className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-1">Precisión</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000" style={{ width: `${accuracy}%` }} />
          </div>
          <span className="font-extrabold text-lg text-[#5A3D7A] tabular-nums">{accuracy}%</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
        <button
          onClick={startGame}
          className="flex-1 py-3 rounded-2xl text-white text-sm font-bold shadow-lg transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #5A3D7A, #9B7CB8)' }}
        >
          🔁 Jugar otra vez
        </button>
        <button
          onClick={resetAll}
          className="flex-1 py-3 rounded-2xl bg-white border-2 border-[#E8D5F0] text-[#5A3D7A] text-sm font-bold hover:border-[#9B7CB8] transition-colors"
        >
          📖 Volver a estudiar
        </button>
      </div>
    </div>
  );
}

// ── Tile & Stat ────────────────────────────────────────────────────────

function Tile({
  text, matched, selected, wrong, onClick, bold,
}: {
  text:     string;
  matched:  boolean;
  selected: boolean;
  wrong:    boolean;
  onClick:  () => void;
  bold?:    boolean;
}) {
  let className =
    'w-full text-left rounded-xl px-3 py-3 sm:px-4 sm:py-3.5 border-2 transition-all text-sm sm:text-base leading-snug';

  if (matched) {
    className += ' bg-emerald-50 border-emerald-300 text-emerald-800 cursor-default opacity-90';
  } else if (wrong) {
    className += ' bg-red-50 border-red-400 text-red-700 animate-pulse';
  } else if (selected) {
    className += ' bg-[#F0E5FF] border-[#5A3D7A] text-[#2D1B4E] shadow-md scale-[1.02]';
  } else {
    className += ' bg-white border-[#E8D5F0] text-gray-700 hover:border-[#9B7CB8] hover:bg-[#F9F5FF] cursor-pointer';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={matched}
      className={className}
    >
      <span className={bold ? 'font-bold' : 'font-medium'}>{text}</span>
      {matched && <span className="ml-2 text-emerald-600 font-bold">✓</span>}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-[#E8D5F0] rounded-2xl p-3">
      <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-extrabold text-[#5A3D7A] tabular-nums">{value}</p>
    </div>
  );
}
