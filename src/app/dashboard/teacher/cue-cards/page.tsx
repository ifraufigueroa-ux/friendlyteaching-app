// FriendlyTeaching.cl — IELTS Cue Cards practice tool
// Gamified flip-the-card UX for IELTS Speaking Part 2.
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import { IELTS_CUE_CARDS, type CueCard } from '@/lib/data/ieltsCueCards';

type Phase = 'idle' | 'revealed' | 'prep' | 'speaking' | 'done';

const PREP_SECONDS     = 60;
const SPEAKING_SECONDS = 120;

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

// Card back patterns — rotated so the deck has visual variety.
const BACK_GRADIENTS = [
  'from-[#5A3D7A] via-[#7B5EA7] to-[#9B7CB8]',
  'from-[#9B5DE5] via-[#C8A8DC] to-[#5A3D7A]',
  'from-[#7B5EA7] via-[#5A3D7A] to-[#1E0F35]',
  'from-[#C8A8DC] via-[#9B7CB8] to-[#5A3D7A]',
  'from-[#5A3D7A] via-[#9B5DE5] to-[#7B5EA7]',
];

// ─── Single card component (face-down + face-up, 3D flip) ──────────────

function CueCardView({
  card,
  flipped,
  onClick,
  backGradient,
  small,
}: {
  card: CueCard;
  flipped: boolean;
  onClick?: () => void;
  backGradient: string;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`relative ${small ? 'w-44 h-64' : 'w-[26rem] h-[34rem]'} cursor-pointer disabled:cursor-default group focus:outline-none`}
      style={{ perspective: '1500px' }}
    >
      <div
        className="absolute inset-0 transition-transform duration-700"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)',
        }}
      >
        {/* Back face (face-down) ─────────────────────────────────── */}
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${backGradient} shadow-2xl border-2 border-white/20 overflow-hidden flex flex-col items-center justify-center text-white p-6 group-hover:scale-[1.02] group-disabled:group-hover:scale-100 transition-transform`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Subtle pattern */}
          <div className="absolute inset-3 border-2 border-white/15 rounded-xl" />
          <div className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest text-white/40">IELTS</div>
          <div className="absolute bottom-3 right-3 text-[10px] font-bold uppercase tracking-widest text-white/40">Part 2</div>
          <div className={`${small ? 'text-5xl' : 'text-7xl'} mb-3`}>🎴</div>
          <p className={`${small ? 'text-xs' : 'text-sm'} font-semibold uppercase tracking-widest text-white/70`}>Cue Card</p>
          {!small && <p className="text-[11px] text-white/40 mt-2">Click para revelar</p>}
        </div>

        {/* Front face (face-up) ────────────────────────────────────── */}
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#FBF8F0] to-[#F0E5D8] shadow-2xl border-2 border-[#C8A8DC]/40 overflow-hidden p-7 flex flex-col"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="absolute top-3 left-4 text-[10px] font-bold uppercase tracking-widest text-[#5A3D7A]/50">IELTS Speaking · Part 2</div>
          <div className="absolute top-3 right-4 text-[10px] font-bold uppercase tracking-widest text-[#5A3D7A]/50">1-2 min</div>

          <div className="flex-1 flex flex-col justify-center mt-4">
            <h2 className={`${small ? 'text-base' : 'text-3xl'} font-bold text-[#2D1B4E] mb-4 leading-tight font-serif`}>
              {card.topic}
            </h2>
            {!small && (
              <>
                <p className="text-sm font-semibold text-[#5A3D7A] mb-2">You should say:</p>
                <ul className="space-y-1.5 mb-5">
                  {card.bullets.map((b, i) => (
                    <li key={i} className="text-[#2D1B4E] text-base leading-snug flex items-start gap-2">
                      <span className="text-[#9B7CB8] mt-1">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-[#2D1B4E] text-base italic mt-3">
                  {card.explainPrompt}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────

export default function CueCardsPage() {
  const [deckOrder, setDeckOrder] = useState<number[]>(() => shuffleIndices(IELTS_CUE_CARDS.length));
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [phase, setPhase]         = useState<Phase>('idle');
  const [timeLeft, setTimeLeft]   = useState(0);
  const [cardsPracticed, setCardsPracticed] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pre-assign each card a stable back gradient so re-shuffling doesn't
  // change visual identity from the student's perspective.
  const backGradients = useMemo(
    () => IELTS_CUE_CARDS.map((_, i) => BACK_GRADIENTS[i % BACK_GRADIENTS.length]),
    [],
  );

  const pickedCard = pickedIdx != null ? IELTS_CUE_CARDS[pickedIdx] : null;

  function pickCard(deckPos: number) {
    if (phase !== 'idle') return;
    const cardIdx = deckOrder[deckPos];
    setPickedIdx(cardIdx);
    setPhase('revealed');
  }

  function pickRandom() {
    if (phase !== 'idle') return;
    const pos = Math.floor(Math.random() * deckOrder.length);
    pickCard(pos);
  }

  function shuffleDeck() {
    if (phase !== 'idle') return;
    setDeckOrder(shuffleIndices(IELTS_CUE_CARDS.length));
  }

  function startPrep() {
    setPhase('prep');
    setTimeLeft(PREP_SECONDS);
  }

  function startSpeaking() {
    setPhase('speaking');
    setTimeLeft(SPEAKING_SECONDS);
  }

  function finishCard() {
    setPhase('done');
    setCardsPracticed(n => n + 1);
  }

  function nextCard() {
    setPickedIdx(null);
    setPhase('idle');
    setTimeLeft(0);
    // Reshuffle so the next pick is fresh.
    setDeckOrder(shuffleIndices(IELTS_CUE_CARDS.length));
  }

  function resetAll() {
    setPickedIdx(null);
    setPhase('idle');
    setTimeLeft(0);
  }

  // Countdown driver — single interval reused across phases.
  useEffect(() => {
    if (phase !== 'prep' && phase !== 'speaking') {
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
      return;
    }
    tickRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          // Auto-advance: prep → speaking → done
          if (phase === 'prep') {
            queueMicrotask(() => startSpeaking());
            return 0;
          }
          if (phase === 'speaking') {
            queueMicrotask(() => finishCard());
            return 0;
          }
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const totalSeconds = phase === 'prep' ? PREP_SECONDS : phase === 'speaking' ? SPEAKING_SECONDS : 0;
  const progressPct  = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#F9F5FF] via-[#F3EEFF] to-[#EEF2FF]">
      <TopBar
        title="Cue Cards — IELTS Speaking Part 2"
        subtitle={`${IELTS_CUE_CARDS.length} cards · 1 min prep + 1-2 min speaking`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Herramientas', href: '/dashboard/teacher/tools' },
          { label: 'Cue Cards IELTS' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 hidden sm:inline">
              Practicadas hoy: <strong className="text-[#5A3D7A]">{cardsPracticed}</strong>
            </span>
          </div>
        }
      />

      <div className="max-w-6xl mx-auto mt-6">

        {phase === 'idle' && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-[#5A3D7A] font-bold text-lg mb-1">Elige una cue card</p>
              <p className="text-gray-500 text-sm">Click sobre cualquiera para flipearla, o deja que la suerte decida.</p>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={pickRandom}
                className="px-5 py-2.5 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white rounded-full text-sm font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                🎲 Pick random
              </button>
              <button
                onClick={shuffleDeck}
                className="px-5 py-2.5 bg-white border border-[#C8A8DC] text-[#5A3D7A] rounded-full text-sm font-bold shadow hover:bg-[#F0E5FF] transition-all active:scale-95"
              >
                🔀 Shuffle
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-4 pt-4">
              {deckOrder.map((cardIdx, deckPos) => (
                <div
                  key={`${cardIdx}-${deckPos}`}
                  style={{
                    transform: `rotate(${(deckPos - (deckOrder.length - 1) / 2) * 4}deg)`,
                  }}
                  className="transition-transform"
                >
                  <CueCardView
                    card={IELTS_CUE_CARDS[cardIdx]}
                    flipped={false}
                    onClick={() => pickCard(deckPos)}
                    backGradient={backGradients[cardIdx]}
                    small
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {phase !== 'idle' && pickedCard && (
          <div className="flex flex-col items-center gap-6">
            <CueCardView
              card={pickedCard}
              flipped
              backGradient={backGradients[pickedIdx!]}
            />

            {/* Timer + controls */}
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-md p-5 space-y-4">

              {phase === 'revealed' && (
                <div className="text-center space-y-3">
                  <p className="text-sm text-[#5A3D7A] font-semibold">
                    🕐 1 minuto para preparar · luego 1-2 minutos para hablar
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Cuando estés listo/a, presiona el botón. El timer cuenta hacia atrás.
                  </p>
                  <div className="flex gap-2 justify-center pt-1">
                    <button
                      onClick={startPrep}
                      className="px-5 py-2.5 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white rounded-full text-sm font-bold shadow active:scale-95"
                    >
                      ⏱ Start prep (1 min)
                    </button>
                    <button
                      onClick={startSpeaking}
                      className="px-5 py-2.5 bg-white border border-[#C8A8DC] text-[#5A3D7A] rounded-full text-sm font-bold hover:bg-[#F0E5FF] active:scale-95"
                    >
                      Skip → Speak (2 min)
                    </button>
                  </div>
                </div>
              )}

              {(phase === 'prep' || phase === 'speaking') && (
                <div className="text-center space-y-3">
                  <p className="text-xs text-gray-400 uppercase tracking-widest">
                    {phase === 'prep' ? 'Preparation' : 'Speaking'}
                  </p>
                  <p className={`text-5xl font-bold font-mono ${phase === 'prep' ? 'text-[#9B7CB8]' : 'text-[#5A3D7A]'}`}>
                    {fmt(timeLeft)}
                  </p>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-[width] ${phase === 'prep' ? 'bg-[#9B7CB8]' : 'bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8]'}`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="flex gap-2 justify-center pt-1">
                    {phase === 'prep' ? (
                      <button
                        onClick={startSpeaking}
                        className="px-5 py-2.5 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white rounded-full text-sm font-bold shadow active:scale-95"
                      >
                        ▶ Empezar a hablar
                      </button>
                    ) : (
                      <button
                        onClick={finishCard}
                        className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-full text-sm font-bold shadow active:scale-95"
                      >
                        ✓ Terminado
                      </button>
                    )}
                    <button
                      onClick={resetAll}
                      className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {phase === 'done' && (
                <div className="text-center space-y-3">
                  <p className="text-2xl">🎉</p>
                  <p className="text-[#5A3D7A] font-bold">¡Buen trabajo!</p>
                  <p className="text-sm text-gray-500">Total practicadas en esta sesión: <strong className="text-[#5A3D7A]">{cardsPracticed}</strong></p>
                  <div className="flex gap-2 justify-center pt-1">
                    <button
                      onClick={nextCard}
                      className="px-5 py-2.5 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white rounded-full text-sm font-bold shadow active:scale-95"
                    >
                      🎴 Siguiente cue card
                    </button>
                    <button
                      onClick={() => setPhase('revealed')}
                      className="px-5 py-2.5 bg-white border border-[#C8A8DC] text-[#5A3D7A] rounded-full text-sm font-bold hover:bg-[#F0E5FF] active:scale-95"
                    >
                      Repetir esta
                    </button>
                  </div>
                </div>
              )}
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
