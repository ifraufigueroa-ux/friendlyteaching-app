// FriendlyTeaching.cl — Friendlyrics: Listening Comprehension Quiz
//
// Plays after the lyrics game. Mirrors the ClipComprehensionSlide deck
// pattern: 3-5 question cards face-down, the student picks one →
// 3D flip → reveals question + options → answers → feedback → next →
// score summary. Rebranded for Friendlyrics with the light purple-pink
// palette and 🎼 cue. Same `slide.questions` / `slide.title` shape so
// existing song lessons keep working unchanged.
'use client';
import { useMemo, useState } from 'react';
import type { Slide, QuizQuestion } from '@/types/firebase';

interface Props { slide: Slide }

const BACK_GRADIENTS = [
  'from-[#5A3D7A] via-[#7B5EA7] to-[#9B7CB8]',
  'from-[#9B5DE5] via-[#C8A8DC] to-[#5A3D7A]',
  'from-[#7B5EA7] via-[#5A3D7A] to-[#1E0F35]',
  'from-[#F472B6] via-[#9B5DE5] to-[#5A3D7A]',
  'from-[#5A3D7A] via-[#9B5DE5] to-[#C8A8DC]',
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
  // Outer is a <div> because the front face contains <button> children
  // (the options); nested buttons would silently break click handling.
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
          <div className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest text-white/40">Friendlyrics®</div>
          <div className="absolute bottom-3 right-3 text-[10px] font-bold uppercase tracking-widest text-white/40">Comprehension</div>
          <div className={`${small ? 'text-5xl' : 'text-7xl'} mb-3`}>🎼</div>
          <p className={`${small ? 'text-xs' : 'text-sm'} font-semibold uppercase tracking-widest text-white/70`}>Question</p>
          {!small && <p className="text-[11px] text-white/40 mt-2">Click to reveal</p>}
        </div>

        {/* Front face ─────────────────────────────────────────────── */}
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-[#FBF8F0] to-[#F0E5D8] shadow-2xl border-2 border-[#9B5DE5]/30 overflow-hidden flex flex-col ${small ? 'p-3' : 'p-7'}`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', pointerEvents: flipped ? 'auto' : 'none' }}
        >
          <div className={`absolute top-2 left-3 ${small ? 'text-[8px]' : 'text-[10px]'} font-bold uppercase tracking-widest text-[#5A3D7A]/60`}>
            {small ? 'Answered' : 'Friendlyrics · Comprehension'}
          </div>
          {cardNumber != null && totalCards != null && !small && (
            <div className="absolute top-3 right-4 text-[10px] font-bold uppercase tracking-widest text-[#5A3D7A]/60">
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
                        : 'bg-white hover:bg-gradient-to-br hover:from-[#9B5DE5] hover:to-[#5A3D7A] hover:text-white border-[#9B5DE5]/30 hover:border-[#5A3D7A] text-[#2D1B4E] hover:scale-[1.02] cursor-pointer shadow-sm hover:shadow-lg'
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

export default function ListeningQuizSlide({ slide }: Props) {
  const questions: QuizQuestion[] = useMemo(() => slide.questions ?? [], [slide.questions]);
  const total = questions.length;

  const [deckOrder, setDeckOrder] = useState<number[]>(() => shuffleIndices(total));
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [answeredByIdx, setAnsweredByIdx] = useState<Map<number, AnsweredCard>>(new Map());
  // Summary is only shown when the player explicitly taps "Complete" on
  // the last card's feedback view, never as an auto-jump.
  const [summaryShown, setSummaryShown] = useState(false);

  const backGradients = useMemo(
    () => questions.map((_, i) => BACK_GRADIENTS[i % BACK_GRADIENTS.length]),
    [questions],
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

  // ── Empty state ─────────────────────────────────────────────────
  if (total === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-[#F9F5FF] via-[#F3EEFF] to-[#FFE8F0] text-[#2D1B4E]">
        <div className="text-center max-w-md p-8">
          <p className="text-5xl mb-3">🎼</p>
          <p className="text-lg font-bold mb-1">Sin preguntas configuradas</p>
          <p className="text-sm text-[#5A3D7A]/50">
            El profesor todavía no agregó preguntas de comprensión a esta canción.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#F9F5FF] via-[#F3EEFF] to-[#FFE8F0] text-[#2D1B4E] overflow-hidden">

      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-5 pb-3 border-b border-[#C8A8DC]/30 bg-white/40 backdrop-blur flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9B5DE5]">Friendlyrics · Comprehension</p>
          <h2 className="text-base font-bold text-[#2D1B4E]">
            {answeredByIdx.size} / {total} answered · {correctCount} correct
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          {questions.map((_, i) => {
            const a = answeredByIdx.get(i);
            return (
              <div
                key={i}
                title={a ? (a.correct ? 'Correct' : 'Wrong') : 'Pending'}
                className={`w-2 h-2 rounded-full ${
                  a ? (a.correct ? 'bg-green-500' : 'bg-red-500') : 'bg-[#C8A8DC]/40'
                } ${i === pickedIdx ? 'ring-2 ring-[#9B5DE5]' : ''}`}
              />
            );
          })}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center p-6 min-h-0">

        {summaryShown ? (
          // ── Score summary ─────────────────────────────────────────
          <div className="text-center space-y-4 max-w-md">
            <p className="text-7xl">🎯</p>
            <p className="text-2xl font-bold text-[#2D1B4E]">Comprehension complete!</p>
            <p className="text-[#5A3D7A]/70">
              You got <strong className="text-green-600">{correctCount}</strong> out of <strong className="text-[#5A3D7A]">{total}</strong> right.
            </p>
            <div className="w-full bg-white/70 border border-[#C8A8DC]/40 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#9B5DE5] via-[#C8A8DC] to-[#F472B6] rounded-full transition-[width] duration-700"
                style={{ width: `${(correctCount / total) * 100}%` }}
              />
            </div>
            {correctCount === total && (
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-300 rounded-2xl px-5 py-2 text-green-700 font-bold">
                🎉 Perfect score — every question right!
              </div>
            )}
            <button
              onClick={restart}
              className="mt-4 px-6 py-2.5 bg-gradient-to-r from-[#5A3D7A] to-[#9B5DE5] text-white rounded-full text-sm font-bold shadow-lg shadow-[#5A3D7A]/30 active:scale-95"
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
                <p className={`text-sm font-bold ${answeredByIdx.get(pickedIdx)!.correct ? 'text-green-600' : 'text-red-600'}`}>
                  {answeredByIdx.get(pickedIdx)!.correct ? '✓ Correct!' : `✗ Correct answer: ${pickedQuestion.correctAnswer}`}
                </p>
                <button
                  onClick={nextCard}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#5A3D7A] to-[#9B5DE5] text-white rounded-full text-sm font-bold shadow-lg shadow-[#5A3D7A]/30 active:scale-95"
                >
                  {answeredByIdx.size === total ? '🎯 Complete' : '🎴 Next question'}
                </button>
              </div>
            )}
          </div>

        ) : (
          // ── Deck of face-down REMAINING cards ─────────────────────
          <div className="flex flex-col items-center gap-5">
            <p className="text-center text-[#5A3D7A]/70 text-sm">
              Pick a question card to reveal it.
            </p>
            <button
              onClick={pickRandom}
              className="px-5 py-2.5 bg-gradient-to-r from-[#5A3D7A] to-[#9B5DE5] text-white rounded-full text-sm font-bold shadow-lg hover:shadow-xl active:scale-95"
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
                    />
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom strip: answered cards face-up ─────────────────────── */}
      {answeredByIdx.size > 0 && !summaryShown && (
        <div className="flex-shrink-0 border-t border-[#C8A8DC]/30 bg-white/60 backdrop-blur px-5 py-3 overflow-x-auto">
          <div className="flex items-end gap-4">
            <div className="flex-shrink-0 pr-2 pb-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#5A3D7A]/50 mb-1">Answered</p>
              <p className="text-xl font-bold text-[#5A3D7A] leading-none">
                {answeredByIdx.size}<span className="text-[#5A3D7A]/40 text-sm">/{total}</span>
              </p>
            </div>
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
                  />
                </div>
              ))}
          </div>
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
