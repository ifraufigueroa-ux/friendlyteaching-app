// FriendlyTeaching.cl — Friendlyflix: Clip Comprehension
//
// Plays after the dialogue game. Shows 3-5 question cards face-down
// (same flip aesthetic as the IELTS Speaking Mocks cue cards), the
// student picks one → flips → reveals question + 4 options → answers
// → feedback → next card → score summary.
'use client';
import { useEffect, useMemo, useState } from 'react';
import type { Slide, QuizQuestion } from '@/types/firebase';
import SubtitleCover from '../SubtitleCover';

const ANSWERED_STRIP_STORAGE_KEY = 'fcAnsweredStripCollapsed';

interface Props { slide: Slide }

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

const BACK_GRADIENTS = [
  'from-[#E50914] via-[#FF6B6B] to-[#7B1F23]',
  'from-[#7B1F23] via-[#E50914] to-[#FF6B6B]',
  'from-[#FF6B6B] via-[#E50914] to-[#1E0F35]',
  'from-[#E50914] via-[#7B1F23] to-[#FF6B6B]',
  'from-[#9B5DE5] via-[#E50914] to-[#FF6B6B]',
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
}) {
  // NOTE: outer element must be a <div>, not a <button>, because the
  // face-up side contains <button> children (the 4 options). Nested
  // buttons are invalid HTML and silently break click handling on the
  // inner buttons in most browsers.
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
        {/* Back face ────────────────────────────────────────────── */}
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${backGradient} shadow-2xl border-2 border-white/20 overflow-hidden flex flex-col items-center justify-center text-white p-6 group-hover:scale-[1.02] group-disabled:group-hover:scale-100 transition-transform`}
          style={{ backfaceVisibility: 'hidden', pointerEvents: flipped ? 'none' : 'auto' }}
        >
          <div className="absolute inset-3 border-2 border-white/15 rounded-xl" />
          <div className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest text-white/40">Friendlyflix®</div>
          <div className="absolute bottom-3 right-3 text-[10px] font-bold uppercase tracking-widest text-white/40">Comprehension</div>
          <div className={`${small ? 'text-5xl' : 'text-7xl'} mb-3`}>❓</div>
          <p className={`${small ? 'text-xs' : 'text-sm'} font-semibold uppercase tracking-widest text-white/70`}>Question</p>
          {!small && <p className="text-[11px] text-white/40 mt-2">Click to reveal</p>}
        </div>

        {/* Front face ─────────────────────────────────────────────── */}
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-[#FBF8F0] to-[#F0E5D8] shadow-2xl border-2 border-[#E50914]/30 overflow-hidden flex flex-col ${small ? 'p-3' : 'p-7'}`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', pointerEvents: flipped ? 'auto' : 'none' }}
        >
          <div className={`absolute top-2 left-3 ${small ? 'text-[8px]' : 'text-[10px]'} font-bold uppercase tracking-widest text-[#7B1F23]/60`}>
            {small ? 'Answered' : 'Friendlyflix · Comprehension'}
          </div>
          {cardNumber != null && totalCards != null && !small && (
            <div className="absolute top-3 right-4 text-[10px] font-bold uppercase tracking-widest text-[#7B1F23]/60">
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
                            : 'bg-white/30 border-gray-200 text-gray-400'
                        : 'bg-white hover:bg-[#E50914] hover:text-white border-[#E50914]/30 hover:border-[#E50914] text-[#2D1B4E] hover:scale-[1.02] cursor-pointer shadow-sm hover:shadow-lg'
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

export default function ClipComprehensionSlide({ slide }: Props) {
  const questions: QuizQuestion[] = useMemo(() => slide.questions ?? [], [slide.questions]);
  const total = questions.length;
  const videoId = slide.clipData?.youtubeUrl ? extractVideoId(slide.clipData.youtubeUrl) : null;

  const [deckOrder, setDeckOrder] = useState<number[]>(() => shuffleIndices(total));
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [answeredByIdx, setAnsweredByIdx] = useState<Map<number, AnsweredCard>>(new Map());
  const [videoOpen, setVideoOpen] = useState(false);
  // Summary is only shown when the player explicitly taps "Complete" on
  // the LAST card's feedback view. Otherwise answering the last question
  // would auto-jump to the results without letting the player see whether
  // their final answer was correct.
  const [summaryShown, setSummaryShown] = useState(false);
  const [answeredStripCollapsed, setAnsweredStripCollapsed] = useState(false);

  // Restore the collapsed state from a previous session so the panel stays
  // out of the way for teachers who prefer more room for the current card.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = window.localStorage.getItem(ANSWERED_STRIP_STORAGE_KEY);
      if (saved === '1') setAnsweredStripCollapsed(true);
    } catch { /* localStorage unavailable — fall back to expanded */ }
  }, []);

  function toggleAnsweredStrip() {
    setAnsweredStripCollapsed(prev => {
      const next = !prev;
      try { window.localStorage.setItem(ANSWERED_STRIP_STORAGE_KEY, next ? '1' : '0'); } catch { /* ignore */ }
      return next;
    });
  }

  const backGradients = useMemo(
    () => questions.map((_, i) => BACK_GRADIENTS[i % BACK_GRADIENTS.length]),
    [questions],
  );

  const allAnswered = answeredByIdx.size === total;
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
    // No more cards: this CTA was "Complete" — reveal the summary now.
    if (remaining.length === 0) {
      setPickedIdx(null);
      setSummaryShown(true);
      return;
    }
    // Otherwise clear, then auto-pick the next random unanswered so the
    // bottom-strip animation is visible between questions.
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

  // ── Empty state (no questions configured) ─────────────────────────
  if (total === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-[#1E0F35] to-[#0A0A12] text-white">
        <div className="text-center max-w-md p-8">
          <p className="text-5xl mb-3">❓</p>
          <p className="text-lg font-bold mb-1">Sin preguntas configuradas</p>
          <p className="text-sm text-white/50">
            El profesor todavía no agregó preguntas de comprensión a este clip.
          </p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#5A3D7A] via-[#4A2D6A] to-[#3D2660] text-white overflow-hidden">

      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-5 pb-3 border-b border-white/10 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF6B6B]">Friendlyflix · Comprehension</p>
          <h2 className="text-base font-bold text-white">
            {answeredByIdx.size} / {total} answered · {correctCount} correct
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {videoId && (
            <button
              onClick={() => setVideoOpen(o => !o)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                videoOpen
                  ? 'bg-[#E50914] text-white border-[#E50914]'
                  : 'bg-white/8 text-white/80 border-white/15 hover:bg-white/15'
              }`}
            >
              🎬 {videoOpen ? 'Hide clip' : 'Re-watch clip'}
            </button>
          )}
          <div className="flex items-center gap-1.5">
            {questions.map((_, i) => {
              const a = answeredByIdx.get(i);
              return (
                <div
                  key={i}
                  title={a ? (a.correct ? 'Correct' : 'Wrong') : 'Pending'}
                  className={`w-2 h-2 rounded-full ${
                    a ? (a.correct ? 'bg-green-500' : 'bg-red-500') : 'bg-white/15'
                  } ${i === pickedIdx ? 'ring-2 ring-yellow-300' : ''}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Collapsible re-watch panel */}
      {videoOpen && videoId && (
        <div className="flex-shrink-0 border-b border-white/10 bg-black px-4 py-3">
          <div className="relative max-w-3xl mx-auto" style={{ aspectRatio: '16 / 9' }}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1${slide.clipData?.startTime ? `&start=${Math.floor(slide.clipData.startTime)}` : ''}${slide.clipData?.endTime ? `&end=${Math.floor(slide.clipData.endTime)}` : ''}`}
              className="w-full h-full rounded-xl shadow-lg shadow-red-900/20"
              style={{ border: 'none' }}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
            {/* Hardcoded-subtitle cover (draggable + resizable, persisted in localStorage) */}
            <SubtitleCover />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex items-center justify-center p-6 min-h-0">

        {summaryShown ? (
          // ── Score summary ─────────────────────────────────────────
          <div className="text-center space-y-4 max-w-md">
            <p className="text-7xl">🎯</p>
            <p className="text-2xl font-bold">Comprehension complete!</p>
            <p className="text-white/70">
              You got <strong className="text-green-400">{correctCount}</strong> out of <strong>{total}</strong> right.
            </p>
            <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#E50914] to-[#FF6B6B] rounded-full transition-[width] duration-700"
                style={{ width: `${(correctCount / total) * 100}%` }}
              />
            </div>
            <button
              onClick={restart}
              className="mt-4 px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-full text-sm font-bold border border-white/20 transition-all active:scale-95"
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
            />
            {answeredByIdx.has(pickedIdx) && (
              <div className="flex flex-col items-center gap-3">
                <p className={`text-sm font-bold ${answeredByIdx.get(pickedIdx)!.correct ? 'text-green-400' : 'text-red-400'}`}>
                  {answeredByIdx.get(pickedIdx)!.correct ? '✓ Correct!' : `✗ Correct answer: ${pickedQuestion.correctAnswer}`}
                </p>
                <button
                  onClick={nextCard}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#E50914] to-[#FF6B6B] text-white rounded-full text-sm font-bold shadow-lg shadow-red-900/30 active:scale-95"
                >
                  {answeredByIdx.size === total ? '🎯 Complete' : '🎴 Next question'}
                </button>
              </div>
            )}
          </div>

        ) : (
          // ── Deck of face-down REMAINING cards ─────────────────────
          <div className="flex flex-col items-center gap-5">
            <p className="text-center text-white/70 text-sm">
              Pick a question card to reveal it.
            </p>
            <button
              onClick={pickRandom}
              className="px-5 py-2.5 bg-gradient-to-r from-[#E50914] to-[#FF6B6B] text-white rounded-full text-sm font-bold shadow-lg hover:shadow-xl active:scale-95"
            >
              🎲 Random
            </button>
            {/* Show ONLY the remaining face-down cards in the deck —
                answered ones live in the bottom strip below. */}
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
                    />
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom strip: answered cards face-up ─────────────────────── */}
      {answeredByIdx.size > 0 && !summaryShown && (
        <div className="flex-shrink-0 border-t border-white/15 bg-black/30 backdrop-blur">
          {/* Header row (always visible) — clickable to toggle the strip.
              At high browser zoom the answered strip used to overlap the
              current question card, so teachers can minimise it here. */}
          <button
            type="button"
            onClick={toggleAnsweredStrip}
            title={answeredStripCollapsed ? 'Expandir respuestas' : 'Minimizar respuestas'}
            aria-expanded={!answeredStripCollapsed}
            className="w-full flex items-center justify-between px-5 py-2 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-baseline gap-3">
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Answered</span>
              <span className="text-sm font-bold text-white leading-none">
                {answeredByIdx.size}<span className="text-white/40 text-xs">/{total}</span>
              </span>
            </div>
            <span
              className="text-white/60 text-xs w-6 h-6 flex items-center justify-center rounded-full border border-white/15 bg-white/5"
              aria-hidden
            >
              {answeredStripCollapsed ? '▲' : '▼'}
            </span>
          </button>

          {!answeredStripCollapsed && (
            <div className="px-5 pb-3 overflow-x-auto">
              <div className="flex items-end gap-4">
                {Array.from(answeredByIdx.entries())
                  .sort((a, b) => a[0] - b[0])
                  .map(([qIdx]) => (
                    <div
                      key={qIdx}
                      className="flex-shrink-0"
                      style={{ animation: 'fcChipIn 360ms cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
                    >
                      <QuestionCard
                        q={questions[qIdx]}
                        flipped
                        backGradient={backGradients[qIdx]}
                        answered={answeredByIdx.get(qIdx)}
                        small
                      />
                    </div>
                  ))}
              </div>
              <style>{`
                @keyframes fcChipIn {
                  from { opacity: 0; transform: translateY(28px) scale(0.85); }
                  to   { opacity: 1; transform: translateY(0)    scale(1);    }
                }
              `}</style>
            </div>
          )}
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
