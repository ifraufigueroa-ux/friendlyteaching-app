// FriendlyTeaching.cl — Friendlyflix: Clip Comprehension
//
// Plays after the dialogue game. Shows 3-5 question cards face-down
// (same flip aesthetic as the IELTS Speaking Mocks cue cards), the
// student picks one → flips → reveals question + 4 options → answers
// → feedback → next card → score summary.
'use client';
import { useMemo, useState } from 'react';
import type { Slide, QuizQuestion } from '@/types/firebase';

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
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#FBF8F0] to-[#F0E5D8] shadow-2xl border-2 border-[#E50914]/30 overflow-hidden p-7 flex flex-col"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', pointerEvents: flipped ? 'auto' : 'none' }}
        >
          <div className="absolute top-3 left-4 text-[10px] font-bold uppercase tracking-widest text-[#7B1F23]/60">Friendlyflix · Comprehension</div>
          {cardNumber != null && totalCards != null && (
            <div className="absolute top-3 right-4 text-[10px] font-bold uppercase tracking-widest text-[#7B1F23]/60">
              {cardNumber} / {totalCards}
            </div>
          )}

          <div className="flex-1 flex flex-col mt-6 min-h-0">
            <h3 className="text-xl font-bold text-[#2D1B4E] leading-snug mb-5">
              {q.question}
            </h3>

            <div className="grid grid-cols-1 gap-2 mt-auto">
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
                    className={`text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 w-full
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
    setPickedIdx(null);
    setDeckOrder(shuffleIndices(total));
  }
  function restart() {
    setPickedIdx(null);
    setAnsweredByIdx(new Map());
    setDeckOrder(shuffleIndices(total));
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
    <div className="h-full flex flex-col bg-gradient-to-br from-[#1E0F35] via-[#0A0A12] to-[#0F0F18] text-white overflow-y-auto">

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
          <div className="max-w-3xl mx-auto" style={{ aspectRatio: '16 / 9' }}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1${slide.clipData?.startTime ? `&start=${Math.floor(slide.clipData.startTime)}` : ''}${slide.clipData?.endTime ? `&end=${Math.floor(slide.clipData.endTime)}` : ''}`}
              className="w-full h-full rounded-xl shadow-lg shadow-red-900/20"
              style={{ border: 'none' }}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex items-center justify-center p-6 min-h-0">

        {allAnswered ? (
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
                  {answeredByIdx.size === total ? '🎯 See score' : '🎴 Next question'}
                </button>
              </div>
            )}
          </div>

        ) : (
          // ── Deck of face-down cards ───────────────────────────────
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
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {deckOrder.map((qIdx, deckPos) => {
                const isAnswered = answeredByIdx.has(qIdx);
                return (
                  <div
                    key={`${qIdx}-${deckPos}`}
                    style={{
                      transform: `rotate(${(deckPos - (deckOrder.length - 1) / 2) * 3}deg)`,
                      opacity: isAnswered ? 0.35 : 1,
                    }}
                    className="transition-transform"
                  >
                    <QuestionCard
                      q={questions[qIdx]}
                      flipped={false}
                      onClick={isAnswered ? undefined : () => pickCard(deckPos)}
                      backGradient={backGradients[qIdx]}
                      small
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
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
