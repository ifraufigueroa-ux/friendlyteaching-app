// FriendlyTeaching.cl — Friendlyrics: Listening Comprehension Quiz
//
// Plays after the lyrics game. Mirrors the ClipComprehensionSlide deck
// pattern: face-down question cards, student picks one → 3D flip →
// reveals question + options → answers → feedback → next → score
// summary. Rebranded for Friendlyrics with the pink/purple palette,
// 🎼 cue, and a collapsible "re-listen" video panel so the student can
// hear the song again while answering.
'use client';
import { useEffect, useMemo, useState } from 'react';
import type { Slide, QuizQuestion } from '@/types/firebase';

interface Props {
  slide: Slide;
  brand?: 'Friendlyrics' | 'FriendlyTales' | 'Friendlyflix';
}

const ANSWERED_STRIP_STORAGE_KEY = 'lqAnsweredStripCollapsed';

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

// Pink → purple → magenta gradients so each card back feels like a
// different vinyl sleeve (Friendlyrics / Friendlyflix).
const BACK_GRADIENTS = [
  'from-[#EC4899] via-[#F472B6] to-[#9B5DE5]',
  'from-[#F472B6] via-[#EC4899] to-[#5A3D7A]',
  'from-[#9B5DE5] via-[#F472B6] to-[#EC4899]',
  'from-[#5A3D7A] via-[#EC4899] to-[#F472B6]',
  'from-[#EC4899] via-[#9B5DE5] to-[#5A3D7A]',
];

// FriendlyTales — Cinematic Mystery card backs (magenta → dark purple void)
const BACK_GRADIENTS_TALES = [
  'from-[#EC008C] via-[#7B1E5A] to-[#0F0A1C]',
  'from-[#7B1E5A] via-[#EC008C] to-[#25133A]',
  'from-[#25133A] via-[#EC008C] to-[#0F0A1C]',
  'from-[#EC008C] via-[#25133A] to-[#0F0A1C]',
  'from-[#0F0A1C] via-[#7B1E5A] to-[#EC008C]',
];

interface AnsweredCard { idx: number; chosen: string; correct: boolean }

// ─── Question card (face-down + face-up with 3D flip) ──────────────────

function QuestionCard({
  q,
  flipped,
  onClick,
  backGradient,
  small,
  answered,
  onAnswer,
  cardNumber,
  totalCards,
  brand,
}: {
  q: QuizQuestion;
  flipped: boolean;
  onClick?: () => void;
  backGradient: string;
  small?: boolean;
  answered?: AnsweredCard;
  onAnswer?: (option: string) => void;
  cardNumber?: number;
  totalCards?: number;
  brand: string;
}) {
  const interactive = !!onClick && !flipped;
  return (
    <div
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : -1}
      onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } } : undefined}
      className={`relative ${small ? 'w-44 h-64' : 'w-[28rem] h-[36rem]'} ${interactive ? 'cursor-pointer' : 'cursor-default'} group focus:outline-none`}
      style={{ perspective: '1500px' }}
    >
      <div
        className="absolute inset-0 transition-transform duration-700"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)',
        }}
      >
        {/* Back face — vinyl-sleeve gradient with concentric ring detail ─── */}
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${backGradient} shadow-2xl border-2 border-white/20 overflow-hidden flex flex-col items-center justify-center text-white p-6 group-hover:scale-[1.02] group-disabled:group-hover:scale-100 transition-transform`}
          style={{ backfaceVisibility: 'hidden', pointerEvents: flipped ? 'none' : 'auto' }}
        >
          {/* Subtle vinyl-record rings */}
          <div className="absolute inset-6 rounded-full border border-white/15" />
          <div className="absolute inset-10 rounded-full border border-white/10" />
          <div className="absolute inset-14 rounded-full border border-white/5" />
          <div className="absolute inset-3 border-2 border-white/15 rounded-xl" />
          <div className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest text-white/50">{brand}®</div>
          <div className="absolute bottom-3 right-3 text-[10px] font-bold uppercase tracking-widest text-white/50">Comprehension</div>
          <div className={`${small ? 'text-5xl' : 'text-7xl'} mb-3 drop-shadow-lg`}>🎼</div>
          <p className={`${small ? 'text-xs' : 'text-sm'} font-semibold uppercase tracking-widest text-white/80`}>Question</p>
          {!small && <p className="text-[11px] text-white/50 mt-2">Click to reveal</p>}
        </div>

        {/* Front face ─────────────────────────────────────────────── */}
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-[#FFFCFB] to-[#FFE8F0] shadow-2xl border-2 border-[#EC4899]/30 overflow-hidden flex flex-col ${small ? 'p-3' : 'p-7'}`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', pointerEvents: flipped ? 'auto' : 'none' }}
        >
          <div className={`absolute top-2 left-3 ${small ? 'text-[8px]' : 'text-[10px]'} font-bold uppercase tracking-widest text-[#EC4899]/70`}>
            {small ? 'Answered' : `${brand} · Comprehension`}
          </div>
          {cardNumber != null && totalCards != null && !small && (
            <div className="absolute top-3 right-4 text-[10px] font-bold uppercase tracking-widest text-[#EC4899]/70">
              {cardNumber} / {totalCards}
            </div>
          )}
          {small && answered && (
            <div className={`absolute top-2 right-3 text-xs font-bold ${answered.correct ? 'text-green-700' : 'text-red-600'}`}>
              {answered.correct ? '✓' : '✗'}
            </div>
          )}

          <div className={`flex-1 flex flex-col min-h-0 ${small ? 'mt-4' : 'mt-6'}`}>
            <h3 className={`font-bold text-[#2D1B4E] leading-snug ${small ? 'text-[11px] mb-2 line-clamp-3' : 'text-xl mb-5'}`}>
              {q.question}
            </h3>

            <div className={`grid grid-cols-1 mt-auto ${small ? 'gap-1' : 'gap-2'}`}>
              {q.options.map((opt) => {
                const chosen     = answered?.chosen === opt.text;
                const isCorrect  = opt.text.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
                const revealed   = !!answered;
                const showRight  = revealed && isCorrect;
                const showWrong  = revealed && chosen && !isCorrect;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); if (!answered && onAnswer) onAnswer(opt.text); }}
                    disabled={revealed}
                    className={`text-left rounded-lg font-semibold transition-all border-2 w-full
                      ${small ? 'px-2 py-1 text-[10px] leading-tight' : 'px-4 py-3 text-sm'}
                      ${revealed
                        ? showRight
                          ? 'bg-green-500/20 border-green-500 text-green-900'
                          : showWrong
                            ? 'bg-red-500/15 border-red-400 text-red-900 line-through'
                            : 'bg-white/50 border-gray-200 text-gray-400'
                        : 'bg-white hover:bg-gradient-to-br hover:from-[#EC4899] hover:to-[#F472B6] hover:text-white border-[#EC4899]/30 hover:border-[#EC4899] text-[#2D1B4E] hover:scale-[1.02] cursor-pointer shadow-sm hover:shadow-lg'
                      }`}
                  >
                    {revealed && showRight && '✓ '}
                    {revealed && showWrong && '✗ '}
                    {opt.text}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Slide ─────────────────────────────────────────────────────────────

export default function ListeningQuizSlide({ slide, brand = 'Friendlyrics' }: Props) {
  const questions: QuizQuestion[] = useMemo(() => slide.questions ?? [], [slide.questions]);
  const total = questions.length;
  const isTales = brand === 'FriendlyTales';

  // Song can be re-listened via the YouTube URL saved on songData / clipData.
  const youtubeUrl = slide.songData?.youtubeUrl ?? slide.clipData?.youtubeUrl ?? null;
  const videoId = youtubeUrl ? extractVideoId(youtubeUrl) : null;
  const [audioOpen, setAudioOpen] = useState(false);

  const [deckOrder, setDeckOrder] = useState<number[]>(() => shuffleIndices(total));
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [answeredByIdx, setAnsweredByIdx] = useState<Map<number, AnsweredCard>>(new Map());
  const [summaryShown, setSummaryShown] = useState(false);
  const [answeredStripCollapsed, setAnsweredStripCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = window.localStorage.getItem(ANSWERED_STRIP_STORAGE_KEY);
      if (saved === '1') setAnsweredStripCollapsed(true);
    } catch { /* ignore */ }
  }, []);

  function toggleAnsweredStrip() {
    setAnsweredStripCollapsed(prev => {
      const next = !prev;
      try { window.localStorage.setItem(ANSWERED_STRIP_STORAGE_KEY, next ? '1' : '0'); } catch { /* ignore */ }
      return next;
    });
  }

  const backGradients = useMemo(
    () => {
      const pool = isTales ? BACK_GRADIENTS_TALES : BACK_GRADIENTS;
      return questions.map((_, i) => pool[i % pool.length]);
    },
    [questions, isTales],
  );

  const correctCount = Array.from(answeredByIdx.values()).filter(a => a.correct).length;
  const pickedQuestion = pickedIdx != null ? questions[pickedIdx] : null;

  function pickCard(deckPos: number) {
    if (pickedIdx != null) return;
    setPickedIdx(deckOrder[deckPos]);
  }
  function pickRandom() {
    if (pickedIdx != null) return;
    const remaining = deckOrder.filter(i => !answeredByIdx.has(i));
    if (remaining.length === 0) return;
    setPickedIdx(remaining[Math.floor(Math.random() * remaining.length)]);
  }
  function answer(option: string) {
    if (pickedIdx == null) return;
    const q = questions[pickedIdx];
    const correct = option.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
    setAnsweredByIdx(prev => {
      const next = new Map(prev);
      next.set(pickedIdx, { idx: pickedIdx, chosen: option, correct });
      return next;
    });
  }
  function nextCard() {
    const remaining = Array.from({ length: total }, (_, i) => i).filter(i => !answeredByIdx.has(i));
    if (remaining.length === 0) {
      setPickedIdx(null);
      setSummaryShown(true);
      return;
    }
    setPickedIdx(null);
    setTimeout(() => {
      const pick = remaining[Math.floor(Math.random() * remaining.length)];
      setPickedIdx(pick);
    }, 280);
  }
  function restart() {
    setPickedIdx(null);
    setAnsweredByIdx(new Map());
    setDeckOrder(shuffleIndices(total));
    setSummaryShown(false);
  }

  if (total === 0) {
    return (
      <div className={`h-full flex items-center justify-center ${isTales ? 'bg-transparent text-[#F8F5FC]' : 'bg-gradient-to-br from-[#F9F5FF] via-[#FFF0F7] to-[#FFE8F0] text-[#2D1B4E]'}`}>
        <div className="text-center max-w-md p-8">
          <p className="text-5xl mb-3">{isTales ? '🔮' : '🎼'}</p>
          <p className={`text-lg font-bold mb-1 ${isTales ? 'ft-title-gold' : ''}`}>Sin preguntas configuradas</p>
          <p className={`text-sm ${isTales ? 'text-[#A69BB8]' : 'text-[#EC4899]/70'}`}>
            El profesor todavía no agregó preguntas de comprensión.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col overflow-hidden ${
      isTales
        ? 'bg-transparent text-[#F8F5FC]'
        : 'bg-gradient-to-br from-[#F9F5FF] via-[#FFF0F7] to-[#FFE8F0] text-[#2D1B4E]'
    }`}>

      {/* Header ─────────────────────────────────────────────────────── */}
      <div className={`flex-shrink-0 px-6 pt-5 pb-3 border-b backdrop-blur flex items-center justify-between gap-4 ${
        isTales ? 'border-[#9B72B8]/25 bg-[rgba(15,10,28,0.65)]' : 'border-[#F472B6]/30 bg-white/50'
      }`}>
        <div>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${isTales ? 'text-[#F9F0A8]' : 'text-[#EC4899]'}`}>
            {brand} · Comprehension
          </p>
          <h2 className={`text-base font-bold ${isTales ? 'ft-title-gold' : 'text-[#2D1B4E]'}`}>
            {answeredByIdx.size} / {total} answered · {correctCount} correct
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {videoId && (
            <button
              onClick={() => setAudioOpen(o => !o)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                isTales
                  ? audioOpen
                    ? 'ft-badge-magenta border-[#EC008C]'
                    : 'bg-[rgba(30,20,50,0.75)] text-[#F9F0A8] border-[#F9F0A8]/40 hover:bg-[rgba(236,0,140,0.15)]'
                  : audioOpen
                    ? 'bg-[#EC4899] text-white border-[#EC4899] shadow'
                    : 'bg-white/70 text-[#EC4899] border-[#EC4899]/40 hover:bg-[#FFE8F0]'
              }`}
            >
              🎵 {audioOpen ? 'Hide' : 'Re-listen'}
            </button>
          )}
          <div className="flex items-center gap-1.5">
            {questions.map((_, i) => {
              const a = answeredByIdx.get(i);
              const dot = isTales
                ? a
                  ? a.correct ? 'bg-[#7ED6E0]' : 'bg-red-500'
                  : 'bg-[#9B72B8]/50'
                : a
                  ? a.correct ? 'bg-green-500' : 'bg-red-500'
                  : 'bg-[#F472B6]/40';
              return (
                <div
                  key={i}
                  title={a ? (a.correct ? 'Correct' : 'Wrong') : 'Pending'}
                  className={`w-2 h-2 rounded-full ${dot} ${
                    i === pickedIdx ? (isTales ? 'ring-2 ring-[#F9F0A8]' : 'ring-2 ring-[#EC4899]') : ''
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Collapsible re-listen panel ────────────────────────────────── */}
      {audioOpen && videoId && (
        <div className="flex-shrink-0 border-b border-[#F472B6]/30 bg-white/60 px-4 py-3">
          <div className="relative max-w-3xl mx-auto" style={{ aspectRatio: '16 / 9' }}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1${slide.clipData?.startTime ? `&start=${Math.floor(slide.clipData.startTime)}` : ''}${slide.clipData?.endTime ? `&end=${Math.floor(slide.clipData.endTime)}` : ''}`}
              className="w-full h-full rounded-xl shadow-lg shadow-pink-900/10"
              style={{ border: 'none' }}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Main ───────────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 min-h-0">

        {summaryShown ? (
          // ── Score summary ─────────────────────────────────────────
          <div className="text-center space-y-4 max-w-md">
            <p className="text-7xl">🎯</p>
            <p className={`text-2xl font-bold ${isTales ? 'ft-title-gold' : 'text-[#2D1B4E]'}`}>Comprehension complete!</p>
            <p className={isTales ? 'text-[#A69BB8]' : 'text-[#5A3D7A]/80'}>
              You got <strong className={isTales ? 'text-[#7ED6E0]' : 'text-green-600'}>{correctCount}</strong> out of{' '}
              <strong className={isTales ? 'text-[#F9F0A8]' : 'text-[#EC4899]'}>{total}</strong> right.
            </p>
            <div className={`w-full rounded-full h-3 overflow-hidden ${
              isTales ? 'bg-[rgba(30,20,50,0.8)] border border-[#9B72B8]/30' : 'bg-white/70 border border-[#F472B6]/40'
            }`}>
              <div
                className={`h-full rounded-full transition-[width] duration-700 ${
                  isTales
                    ? 'bg-gradient-to-r from-[#EC008C] via-[#F9F0A8] to-[#7ED6E0]'
                    : 'bg-gradient-to-r from-[#EC4899] via-[#F472B6] to-[#9B5DE5]'
                }`}
                style={{ width: `${(correctCount / total) * 100}%` }}
              />
            </div>
            {correctCount === total && (
              <div className={`rounded-2xl px-5 py-2 font-bold ${
                isTales
                  ? 'bg-[rgba(126,214,224,0.15)] border border-[#7ED6E0]/60 text-[#7ED6E0]'
                  : 'bg-gradient-to-r from-green-100 to-emerald-100 border border-green-300 text-green-700'
              }`}>
                🎉 Perfect score — every question right!
              </div>
            )}
            <button
              onClick={restart}
              className={`mt-4 px-6 py-2.5 rounded-full text-sm font-bold active:scale-95 ${
                isTales
                  ? 'ft-cta'
                  : 'bg-gradient-to-r from-[#EC4899] to-[#F472B6] text-white shadow-lg shadow-pink-900/20'
              }`}
            >
              ↻ Try again
            </button>
          </div>

        ) : pickedQuestion && pickedIdx != null ? (
          // ── Card revealed (or revealing) ─────────────────────────
          <div className="flex flex-col items-center gap-5">
            <QuestionCard
              q={pickedQuestion}
              flipped
              backGradient={backGradients[pickedIdx]}
              answered={answeredByIdx.get(pickedIdx)}
              onAnswer={answer}
              cardNumber={answeredByIdx.size + (answeredByIdx.has(pickedIdx) ? 0 : 1)}
              totalCards={total}
              brand={brand}
            />
            {answeredByIdx.has(pickedIdx) && (
              <div className="flex flex-col items-center gap-3">
                <p className={`text-sm font-bold ${
                  answeredByIdx.get(pickedIdx)!.correct
                    ? isTales ? 'text-[#7ED6E0]' : 'text-green-600'
                    : 'text-red-500'
                }`}>
                  {answeredByIdx.get(pickedIdx)!.correct ? '✓ Correct!' : `✗ Correct answer: ${pickedQuestion.correctAnswer}`}
                </p>
                <button
                  onClick={nextCard}
                  className={`px-6 py-2.5 rounded-full text-sm font-bold active:scale-95 ${
                    isTales
                      ? 'ft-cta'
                      : 'bg-gradient-to-r from-[#EC4899] to-[#F472B6] text-white shadow-lg shadow-pink-900/20'
                  }`}
                >
                  {answeredByIdx.size === total ? '🎯 Complete' : '🎴 Next question'}
                </button>
              </div>
            )}
          </div>

        ) : (
          // ── Deck of face-down REMAINING cards ─────────────────────
          <div className="flex flex-col items-center gap-5">
            <p className={`text-center text-sm ${isTales ? 'text-[#A69BB8]' : 'text-[#5A3D7A]/70'}`}>
              Pick a question card to reveal it.
            </p>
            <button
              onClick={pickRandom}
              className={`px-5 py-2.5 rounded-full text-sm font-bold hover:shadow-xl active:scale-95 ${
                isTales
                  ? 'ft-cta'
                  : 'bg-gradient-to-r from-[#EC4899] to-[#F472B6] text-white shadow-lg'
              }`}
            >
              🎲 Random
            </button>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {deckOrder
                .filter(qIdx => !answeredByIdx.has(qIdx))
                .map((qIdx, deckPos, arr) => (
                  <div
                    key={`${qIdx}-${deckPos}`}
                    style={{ transform: `rotate(${(deckPos - (arr.length - 1) / 2) * 3}deg)` }}
                    className="transition-transform"
                  >
                    <QuestionCard
                      q={questions[qIdx]}
                      flipped={false}
                      onClick={() => pickCard(deckOrder.indexOf(qIdx))}
                      backGradient={backGradients[qIdx]}
                      small
                      brand={brand}
                    />
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom strip: answered cards face-up ────────────────────────── */}
      {answeredByIdx.size > 0 && !summaryShown && (
        <div className={`flex-shrink-0 border-t border-[#F472B6]/30 bg-white/70 backdrop-blur ${answeredStripCollapsed ? 'px-5 py-2' : 'px-5 py-3'}`}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-baseline gap-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#EC4899]/70">Answered</p>
              <p className="text-sm font-bold text-[#EC4899] leading-none">
                {answeredByIdx.size}<span className="text-[#EC4899]/40">/{total}</span>
              </p>
            </div>
            <button
              onClick={toggleAnsweredStrip}
              title={answeredStripCollapsed ? 'Mostrar respuestas' : 'Ocultar respuestas'}
              className="w-7 h-7 flex items-center justify-center text-sm font-bold text-[#EC4899]/70 hover:text-[#EC4899] rounded-full hover:bg-[#FFE8F0] transition-colors"
            >
              {answeredStripCollapsed ? '▲' : '▼'}
            </button>
          </div>
          {!answeredStripCollapsed && (
            <div className="flex items-end gap-4 overflow-x-auto pt-1">
              {Array.from(answeredByIdx.entries())
                .sort((a, b) => a[0] - b[0])
                .map(([qIdx]) => (
                  <div
                    key={qIdx}
                    className="flex-shrink-0"
                    style={{ animation: 'lqChipIn 360ms cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
                  >
                    <QuestionCard
                      q={questions[qIdx]}
                      flipped
                      backGradient={backGradients[qIdx]}
                      answered={answeredByIdx.get(qIdx)}
                      small
                      brand={brand}
                    />
                  </div>
                ))}
            </div>
          )}
          <style>{`
            @keyframes lqChipIn {
              from { opacity: 0; transform: translateY(28px) scale(0.85); }
              to   { opacity: 1; transform: translateY(0)    scale(1);    }
            }
          `}</style>
        </div>
      )}

    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────

function shuffleIndices(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
