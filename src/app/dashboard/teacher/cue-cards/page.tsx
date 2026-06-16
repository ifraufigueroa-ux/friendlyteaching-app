// FriendlyTeaching.cl — IELTS Speaking Mocks
// Three-part simulator:
//   • Part 1 — interview-style timer with brief instructions
//   • Part 2 — flip-the-cue-card with 1 min prep + 2 min speaking
//   • Part 3 — discussion-style timer with brief instructions
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import { IELTS_CUE_CARDS, type CueCard } from '@/lib/data/ieltsCueCards';

type Part = 1 | 2 | 3;
type Part2Phase = 'idle' | 'revealed' | 'prep' | 'speaking' | 'done';
type SimplePhase = 'idle' | 'running' | 'done';

const PREP_SECONDS         = 60;
const SPEAKING_SECONDS     = 120;
const PART1_SECONDS        = 5 * 60;   // 5 minutes (typical 4-5 min)
const PART3_SECONDS        = 5 * 60;   // 5 minutes (typical 4-5 min)

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

// ── Card-back gradients reused so deck identity is stable ────────────
const BACK_GRADIENTS = [
  'from-[#5A3D7A] via-[#7B5EA7] to-[#9B7CB8]',
  'from-[#9B5DE5] via-[#C8A8DC] to-[#5A3D7A]',
  'from-[#7B5EA7] via-[#5A3D7A] to-[#1E0F35]',
  'from-[#C8A8DC] via-[#9B7CB8] to-[#5A3D7A]',
  'from-[#5A3D7A] via-[#9B5DE5] to-[#7B5EA7]',
];

// ─── Cue card view (face-down + face-up, 3D flip) ─────────────────────

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
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${backGradient} shadow-2xl border-2 border-white/20 overflow-hidden flex flex-col items-center justify-center text-white p-6 group-hover:scale-[1.02] group-disabled:group-hover:scale-100 transition-transform`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="absolute inset-3 border-2 border-white/15 rounded-xl" />
          <div className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest text-white/40">IELTS</div>
          <div className="absolute bottom-3 right-3 text-[10px] font-bold uppercase tracking-widest text-white/40">Part 2</div>
          <div className={`${small ? 'text-5xl' : 'text-7xl'} mb-3`}>🎴</div>
          <p className={`${small ? 'text-xs' : 'text-sm'} font-semibold uppercase tracking-widest text-white/70`}>Cue Card</p>
          {!small && <p className="text-[11px] text-white/40 mt-2">Click para revelar</p>}
        </div>

        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#FBF8F0] to-[#F0E5D8] shadow-2xl border-2 border-[#C8A8DC]/40 overflow-hidden p-7 flex flex-col"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
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

// ─── Shared timer panel (used by Part 1 and Part 3) ──────────────────

function TimedPartPanel({
  durationSec,
  label,
  accentClass,
  phase,
  timeLeft,
  onStart,
  onStop,
  onReset,
}: {
  durationSec: number;
  label: string;
  accentClass: string;
  phase: SimplePhase;
  timeLeft: number;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}) {
  const progressPct = phase === 'running' ? ((durationSec - timeLeft) / durationSec) * 100 : phase === 'done' ? 100 : 0;
  return (
    <div className="w-full max-w-xl bg-white rounded-2xl shadow-md p-6 space-y-4">
      <p className="text-xs text-gray-400 uppercase tracking-widest text-center">{label}</p>
      <p className={`text-6xl font-bold font-mono text-center ${accentClass}`}>
        {fmt(phase === 'idle' ? durationSec : timeLeft)}
      </p>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8]`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <div className="flex gap-2 justify-center pt-1">
        {phase === 'idle' && (
          <button
            onClick={onStart}
            className="px-6 py-2.5 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white rounded-full text-sm font-bold shadow active:scale-95"
          >
            ▶ Start timer
          </button>
        )}
        {phase === 'running' && (
          <>
            <button
              onClick={onStop}
              className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-full text-sm font-bold shadow active:scale-95"
            >
              ✓ Terminado
            </button>
            <button
              onClick={onReset}
              className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              Cancelar
            </button>
          </>
        )}
        {phase === 'done' && (
          <button
            onClick={onReset}
            className="px-5 py-2.5 bg-white border border-[#C8A8DC] text-[#5A3D7A] rounded-full text-sm font-bold hover:bg-[#F0E5FF] active:scale-95"
          >
            ↻ Reiniciar
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────

export default function IELTSSpeakingMocksPage() {
  const [part, setPart] = useState<Part>(2);

  // Per-part timer state (independent so switching tabs doesn't reset).
  const [p1Phase, setP1Phase] = useState<SimplePhase>('idle');
  const [p3Phase, setP3Phase] = useState<SimplePhase>('idle');
  const [p1Time, setP1Time]   = useState(PART1_SECONDS);
  const [p3Time, setP3Time]   = useState(PART3_SECONDS);

  // Part 2 state
  const [deckOrder, setDeckOrder] = useState<number[]>(() => shuffleIndices(IELTS_CUE_CARDS.length));
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [p2Phase, setP2Phase]     = useState<Part2Phase>('idle');
  const [p2Time, setP2Time]       = useState(0);
  const [cardsPracticed, setCardsPracticed] = useState(0);

  const backGradients = useMemo(
    () => IELTS_CUE_CARDS.map((_, i) => BACK_GRADIENTS[i % BACK_GRADIENTS.length]),
    [],
  );

  const pickedCard = pickedIdx != null ? IELTS_CUE_CARDS[pickedIdx] : null;

  // ── Part 1 / Part 3 simple timer driver ──────────────────────────
  const p1TickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const p3TickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (p1Phase !== 'running') {
      if (p1TickRef.current) { clearInterval(p1TickRef.current); p1TickRef.current = null; }
      return;
    }
    p1TickRef.current = setInterval(() => {
      setP1Time(t => {
        if (t <= 1) { queueMicrotask(() => setP1Phase('done')); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (p1TickRef.current) clearInterval(p1TickRef.current); };
  }, [p1Phase]);

  useEffect(() => {
    if (p3Phase !== 'running') {
      if (p3TickRef.current) { clearInterval(p3TickRef.current); p3TickRef.current = null; }
      return;
    }
    p3TickRef.current = setInterval(() => {
      setP3Time(t => {
        if (t <= 1) { queueMicrotask(() => setP3Phase('done')); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (p3TickRef.current) clearInterval(p3TickRef.current); };
  }, [p3Phase]);

  // ── Part 2 timer driver ──────────────────────────────────────────
  const p2TickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (p2Phase !== 'prep' && p2Phase !== 'speaking') {
      if (p2TickRef.current) { clearInterval(p2TickRef.current); p2TickRef.current = null; }
      return;
    }
    p2TickRef.current = setInterval(() => {
      setP2Time(t => {
        if (t <= 1) {
          if (p2Phase === 'prep') { queueMicrotask(() => { setP2Phase('speaking'); setP2Time(SPEAKING_SECONDS); }); return 0; }
          if (p2Phase === 'speaking') { queueMicrotask(() => { setP2Phase('done'); setCardsPracticed(n => n + 1); }); return 0; }
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (p2TickRef.current) clearInterval(p2TickRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p2Phase]);

  // ── Part 2 actions ───────────────────────────────────────────────
  function pickCard(deckPos: number) {
    if (p2Phase !== 'idle') return;
    setPickedIdx(deckOrder[deckPos]);
    setP2Phase('revealed');
  }
  function pickRandom() {
    if (p2Phase !== 'idle') return;
    pickCard(Math.floor(Math.random() * deckOrder.length));
  }
  function shuffleDeck() {
    if (p2Phase !== 'idle') return;
    setDeckOrder(shuffleIndices(IELTS_CUE_CARDS.length));
  }
  function startPrep()     { setP2Phase('prep'); setP2Time(PREP_SECONDS); }
  function startSpeaking() { setP2Phase('speaking'); setP2Time(SPEAKING_SECONDS); }
  function finishCard()    { setP2Phase('done'); setCardsPracticed(n => n + 1); }
  function nextCard()      { setPickedIdx(null); setP2Phase('idle'); setP2Time(0); setDeckOrder(shuffleIndices(IELTS_CUE_CARDS.length)); }
  function resetP2()       { setPickedIdx(null); setP2Phase('idle'); setP2Time(0); }

  const p2TotalSec = p2Phase === 'prep' ? PREP_SECONDS : p2Phase === 'speaking' ? SPEAKING_SECONDS : 0;
  const p2Progress = p2TotalSec > 0 ? ((p2TotalSec - p2Time) / p2TotalSec) * 100 : 0;

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#F9F5FF] via-[#F3EEFF] to-[#EEF2FF]">
      <TopBar
        title="IELTS Speaking Mocks"
        subtitle="Simulacro completo · 3 partes · ~11-14 minutos"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Herramientas', href: '/dashboard/teacher/tools' },
          { label: 'IELTS Speaking Mocks' },
        ]}
        actions={
          <span className="text-xs text-gray-500 hidden sm:inline">
            Cards practicadas: <strong className="text-[#5A3D7A]">{cardsPracticed}</strong>
          </span>
        }
      />

      <div className="max-w-6xl mx-auto mt-6">

        {/* ── Part selector ────────────────────────────────────────── */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-white border border-[#E8D5F0] rounded-full p-1 shadow-sm">
            {([1, 2, 3] as const).map(p => (
              <button
                key={p}
                onClick={() => setPart(p)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                  part === p
                    ? 'bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white shadow'
                    : 'text-[#5A3D7A] hover:bg-[#F0E5FF]'
                }`}
              >
                Part {p}
              </button>
            ))}
          </div>
        </div>

        {/* ── Part 1 ──────────────────────────────────────────────── */}
        {part === 1 && (
          <div className="flex flex-col items-center gap-6">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-md p-6 space-y-3">
              <p className="text-xs font-bold text-[#5A3D7A] uppercase tracking-widest">Part 1 · Introduction & interview</p>
              <h2 className="text-xl font-bold text-[#2D1B4E]">Familiar topics about you</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                El examinador hace preguntas generales sobre temas familiares: trabajo o estudios,
                ciudad natal, hobbies, rutina, planes. Duración: <strong>4-5 minutos</strong>.
              </p>
              <div className="bg-[#F9F5FF] rounded-xl p-3 mt-2">
                <p className="text-[11px] font-bold text-[#5A3D7A] uppercase tracking-widest mb-1.5">Temas comunes</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Work or study', 'Hometown', 'Hobbies', 'Daily routine', 'Family', 'Food', 'Weather', 'Travel'].map(t => (
                    <span key={t} className="text-[11px] bg-white text-[#5A3D7A] px-2 py-0.5 rounded-full border border-[#C8A8DC]/40 font-semibold">{t}</span>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed pt-1">
                Tip al estudiante: responde con frases completas + breve justificación. Evita
                respuestas de una palabra.
              </p>
            </div>

            <TimedPartPanel
              durationSec={PART1_SECONDS}
              label="Part 1 timer (5 min)"
              accentClass="text-[#5A3D7A]"
              phase={p1Phase}
              timeLeft={p1Time}
              onStart={() => { setP1Time(PART1_SECONDS); setP1Phase('running'); }}
              onStop={() => setP1Phase('done')}
              onReset={() => { setP1Time(PART1_SECONDS); setP1Phase('idle'); }}
            />
          </div>
        )}

        {/* ── Part 2 (existing cue cards) ─────────────────────────── */}
        {part === 2 && p2Phase === 'idle' && (
          <div className="space-y-6">
            <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-md p-5 space-y-2">
              <p className="text-xs font-bold text-[#5A3D7A] uppercase tracking-widest">Part 2 · Long turn</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Elige una cue card. Tienes <strong>1 minuto</strong> para preparar y <strong>1-2 minutos</strong> para hablar sin interrupción.
              </p>
            </div>

            <div className="text-center">
              <p className="text-[#5A3D7A] font-bold text-lg mb-1">Elige una cue card</p>
              <p className="text-gray-500 text-sm">Click sobre cualquiera o deja que la suerte decida.</p>
            </div>

            <div className="flex justify-center gap-3">
              <button onClick={pickRandom} className="px-5 py-2.5 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white rounded-full text-sm font-bold shadow-lg hover:shadow-xl transition-all active:scale-95">
                🎲 Pick random
              </button>
              <button onClick={shuffleDeck} className="px-5 py-2.5 bg-white border border-[#C8A8DC] text-[#5A3D7A] rounded-full text-sm font-bold shadow hover:bg-[#F0E5FF] transition-all active:scale-95">
                🔀 Shuffle
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-4 pt-4">
              {deckOrder.map((cardIdx, deckPos) => (
                <div
                  key={`${cardIdx}-${deckPos}`}
                  style={{ transform: `rotate(${(deckPos - (deckOrder.length - 1) / 2) * 4}deg)` }}
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

        {part === 2 && p2Phase !== 'idle' && pickedCard && (
          <div className="flex flex-col items-center gap-6">
            <CueCardView card={pickedCard} flipped backGradient={backGradients[pickedIdx!]} />

            <div className="w-full max-w-xl bg-white rounded-2xl shadow-md p-5 space-y-4">

              {p2Phase === 'revealed' && (
                <div className="text-center space-y-3">
                  <p className="text-sm text-[#5A3D7A] font-semibold">
                    🕐 1 minuto para preparar · luego 1-2 minutos para hablar
                  </p>
                  <div className="flex gap-2 justify-center pt-1">
                    <button onClick={startPrep} className="px-5 py-2.5 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white rounded-full text-sm font-bold shadow active:scale-95">
                      ⏱ Start prep (1 min)
                    </button>
                    <button onClick={startSpeaking} className="px-5 py-2.5 bg-white border border-[#C8A8DC] text-[#5A3D7A] rounded-full text-sm font-bold hover:bg-[#F0E5FF] active:scale-95">
                      Skip → Speak (2 min)
                    </button>
                  </div>
                </div>
              )}

              {(p2Phase === 'prep' || p2Phase === 'speaking') && (
                <div className="text-center space-y-3">
                  <p className="text-xs text-gray-400 uppercase tracking-widest">
                    {p2Phase === 'prep' ? 'Preparation' : 'Speaking'}
                  </p>
                  <p className={`text-5xl font-bold font-mono ${p2Phase === 'prep' ? 'text-[#9B7CB8]' : 'text-[#5A3D7A]'}`}>
                    {fmt(p2Time)}
                  </p>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-[width] ${p2Phase === 'prep' ? 'bg-[#9B7CB8]' : 'bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8]'}`}
                      style={{ width: `${p2Progress}%` }}
                    />
                  </div>
                  <div className="flex gap-2 justify-center pt-1">
                    {p2Phase === 'prep' ? (
                      <button onClick={startSpeaking} className="px-5 py-2.5 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white rounded-full text-sm font-bold shadow active:scale-95">
                        ▶ Empezar a hablar
                      </button>
                    ) : (
                      <button onClick={finishCard} className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-full text-sm font-bold shadow active:scale-95">
                        ✓ Terminado
                      </button>
                    )}
                    <button onClick={resetP2} className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {p2Phase === 'done' && (
                <div className="text-center space-y-3">
                  <p className="text-2xl">🎉</p>
                  <p className="text-[#5A3D7A] font-bold">¡Buen trabajo!</p>
                  <p className="text-sm text-gray-500">Total practicadas: <strong className="text-[#5A3D7A]">{cardsPracticed}</strong></p>
                  <div className="flex gap-2 justify-center pt-1">
                    <button onClick={nextCard} className="px-5 py-2.5 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white rounded-full text-sm font-bold shadow active:scale-95">
                      🎴 Siguiente cue card
                    </button>
                    <button onClick={() => setPart(3)} className="px-5 py-2.5 bg-white border border-[#C8A8DC] text-[#5A3D7A] rounded-full text-sm font-bold hover:bg-[#F0E5FF] active:scale-95">
                      → Continuar a Part 3
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Part 3 ──────────────────────────────────────────────── */}
        {part === 3 && (
          <div className="flex flex-col items-center gap-6">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-md p-6 space-y-3">
              <p className="text-xs font-bold text-[#5A3D7A] uppercase tracking-widest">Part 3 · Discussion</p>
              <h2 className="text-xl font-bold text-[#2D1B4E]">Two-way abstract discussion</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                El examinador hace preguntas más abstractas relacionadas con el tema de la Part 2.
                Es un diálogo: el estudiante puede pedir aclaraciones y dar opiniones extendidas.
                Duración: <strong>4-5 minutos</strong>.
              </p>
              <div className="bg-[#F9F5FF] rounded-xl p-3 mt-2">
                <p className="text-[11px] font-bold text-[#5A3D7A] uppercase tracking-widest mb-1.5">Tipos de pregunta</p>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• <strong>Comparación</strong> — &ldquo;How is X different from Y?&rdquo;</li>
                  <li>• <strong>Causa &amp; efecto</strong> — &ldquo;Why do people prefer ___ nowadays?&rdquo;</li>
                  <li>• <strong>Predicción</strong> — &ldquo;Do you think ___ will change in the future?&rdquo;</li>
                  <li>• <strong>Opinión</strong> — &ldquo;Some people say ___. What do you think?&rdquo;</li>
                  <li>• <strong>Sociedad</strong> — &ldquo;How does ___ affect society?&rdquo;</li>
                </ul>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed pt-1">
                Tip al estudiante: justifica cada respuesta con ejemplo + razonamiento. Usa
                conectores (&ldquo;However&rdquo;, &ldquo;On the other hand&rdquo;, &ldquo;As a result&rdquo;).
              </p>
            </div>

            <TimedPartPanel
              durationSec={PART3_SECONDS}
              label="Part 3 timer (5 min)"
              accentClass="text-[#5A3D7A]"
              phase={p3Phase}
              timeLeft={p3Time}
              onStart={() => { setP3Time(PART3_SECONDS); setP3Phase('running'); }}
              onStop={() => setP3Phase('done')}
              onReset={() => { setP3Time(PART3_SECONDS); setP3Phase('idle'); }}
            />
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────

function shuffleIndices(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
