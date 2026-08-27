// FriendlyTeaching.cl — IELTS Speaking Mocks
// Three-part simulator:
//   • Part 1 — interview-style timer with brief instructions
//   • Part 2 — flip-the-cue-card with 1 min prep + 2 min speaking
//   • Part 3 — discussion-style timer with brief instructions
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import FullscreenButton from '@/components/ui/FullscreenButton';
import { IELTS_CUE_CARDS, type CueCard } from '@/lib/data/ieltsCueCards';
import { IELTS_PART1_TOPICS, IELTS_PART1_CORE_TOPIC_IDS, type Part1Topic } from '@/lib/data/ieltsPart1Topics';
import { IELTS_PART3_QUESTIONS, type IELTSBand, type Part3Question } from '@/lib/data/ieltsPart3Questions';
import { IELTS_MOCKS, getIeltsMockOrDefault } from '@/lib/data/ielts/mocks';

type Part = 1 | 2 | 3;
type Part2Phase = 'idle' | 'revealed' | 'prep' | 'speaking' | 'done';
type SimplePhase = 'idle' | 'running' | 'done';

const PREP_SECONDS         = 60;
const SPEAKING_SECONDS     = 120;
const PART1_SECONDS        = 5 * 60;   // 5 minutes (typical 4-5 min)
const PART3_SECONDS        = 5 * 60;   // 5 minutes (typical 4-5 min)

// ─── Tips bank ────────────────────────────────────────────────────────

const TIPS: Record<Part, { title: string; intro: string; tips: string[] }> = {
  1: {
    title: 'Part 1 · Examiner tips',
    intro: 'Short, natural answers about familiar topics. Aim for ~20-30 seconds per question.',
    tips: [
      'Answer in full sentences, not single words.',
      'Always add a brief reason or example after your main answer.',
      'Use natural fillers to sound fluent: "Well", "Actually", "To be honest", "I suppose".',
      'Show a range of tenses — present, past and future where appropriate.',
      'Don\'t over-prepare: examiners notice memorised speeches and penalise them.',
      'If you don\'t catch a question, ask politely: "Sorry, could you repeat that?".',
    ],
  },
  2: {
    title: 'Part 2 · Long-turn tips',
    intro: 'You have 1 minute to prepare, then speak for 1-2 minutes without interruption.',
    tips: [
      'Use the full prep minute. Jot down 4-6 keywords, one per bullet — not full sentences.',
      'Open with a clear hook: "I\'d like to talk about...", "The thing that comes to mind is...".',
      'Cover all four bullets, but spend the most time on "and explain why" — that\'s where the band score is decided.',
      'Use past narrative tenses if the topic is a memory: past simple, past continuous, past perfect.',
      'Add sensory detail (what you saw, heard, felt) — examiners reward vivid description.',
      'Aim for at least 1:30 of speaking. Don\'t stop early even if you feel you\'re done.',
      'If you blank, paraphrase: "What I mean is..." or "In other words...". Don\'t go silent.',
    ],
  },
  3: {
    title: 'Part 3 · Discussion tips',
    intro: 'Two-way abstract discussion, ~4-5 minutes. Talk about society and ideas, not just yourself.',
    tips: [
      'Always justify your opinion: POSITION + REASON + EXAMPLE (the "PRE" framework).',
      'Use opinion phrases: "In my view", "I\'d argue that", "From my perspective".',
      'Compare with linking words: "Whereas", "On the other hand", "Similarly", "By contrast".',
      'Hedging is OK and natural: "It depends", "It\'s hard to say but...", "Broadly speaking...".',
      'Show complex grammar: conditionals ("If we did X, we\'d see Y"), passives, relative clauses.',
      'Talk abstractly — discuss trends, society, the future — not your personal anecdotes.',
      'If a question feels too broad, narrow it: "Let me focus on the educational angle...".',
    ],
  },
};

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

// ─── Band styling (Part 3 picker) ────────────────────────────────────
// Cool → warm progression from B6 (entry) to B9 (expert) so the visual
// difficulty cue matches the cognitive load.
const BAND_STYLES: Record<IELTSBand, { gradient: string; label: string; tagline: string }> = {
  6: { gradient: 'from-emerald-400 to-teal-500',                label: 'Foundation', tagline: 'Concrete · personal'        },
  7: { gradient: 'from-sky-400 to-blue-600',                    label: 'Competent',  tagline: 'Compare · explain change'   },
  8: { gradient: 'from-violet-500 to-purple-600',               label: 'Advanced',   tagline: 'Abstract · hypothetical'    },
  9: { gradient: 'from-amber-400 via-rose-500 to-fuchsia-600',  label: 'Expert',     tagline: 'Speculative · philosophical' },
};

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
          {!small && <p className="text-[11px] text-white/40 mt-2">Click to reveal</p>}
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
  sectionLabel,
  accentClass,
  phase,
  timeLeft,
  onStart,
  onStop,
  onReset,
}: {
  durationSec: number;
  label: string;              // full descriptive label — shown in idle card
  sectionLabel: string;       // compact label — shown in floating running bar
  accentClass: string;
  phase: SimplePhase;
  timeLeft: number;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}) {
  const progressPct = phase === 'running' ? ((durationSec - timeLeft) / durationSec) * 100 : phase === 'done' ? 100 : 0;

  // While the mock is idle, render the tall "▶ Start timer" card in the
  // normal flow so the teacher notices it before starting. Once running
  // or done, pop it out as a fixed floating bar at the bottom of the
  // viewport so the countdown stays visible while she scrolls through
  // topic cards, cue cards or Part-3 questions.
  if (phase === 'idle') {
    return (
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-md shadow-[#C8A8DC]/20 border border-[#E8D5F0] p-6 space-y-4">
        <p className="text-[10px] text-[#5A3D7A] uppercase tracking-[0.3em] text-center font-black">{label}</p>
        <p className={`text-6xl font-black font-mono text-center tabular-nums ${accentClass}`}>
          {fmt(durationSec)}
        </p>
        <div className="w-full h-1.5 bg-[#F0E5FF] rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8]" style={{ width: '0%' }} />
        </div>
        <div className="flex justify-center pt-1">
          <button
            onClick={onStart}
            className="px-6 py-2.5 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white rounded-full text-sm font-bold shadow-lg shadow-[#5A3D7A]/25 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
          >
            ▶ Start timer
          </button>
        </div>
      </div>
    );
  }

  // Floating compact bar — pinned to the bottom of the viewport.
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-2xl">
      <div className="bg-white/95 backdrop-blur-md rounded-full shadow-2xl shadow-[#5A3D7A]/30 border border-[#E8D5F0] pl-5 pr-3 py-2.5 flex items-center gap-3">
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] font-black text-[#5A3D7A] uppercase tracking-[0.25em] leading-none">
            {sectionLabel}
          </span>
          <span className={`text-lg font-black font-mono tabular-nums leading-tight ${accentClass}`}>
            {fmt(timeLeft)}
          </span>
        </div>
        <div className="flex-1 min-w-0 h-1.5 bg-[#F0E5FF] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {phase === 'running' && (
          <>
            <button
              onClick={onStop}
              className="shrink-0 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-xs font-bold shadow active:scale-95"
            >
              ✓ Done
            </button>
            <button
              onClick={onReset}
              className="shrink-0 w-7 h-7 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 text-lg leading-none flex items-center justify-center"
              title="Cancel"
            >
              ×
            </button>
          </>
        )}
        {phase === 'done' && (
          <button
            onClick={onReset}
            className="shrink-0 px-4 py-1.5 bg-white border-2 border-[#C8A8DC] text-[#5A3D7A] rounded-full text-xs font-bold hover:bg-[#F0E5FF] active:scale-95"
          >
            ↻ Reset
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Tips modal ───────────────────────────────────────────────────────

function TipsModal({ part, onClose }: { part: Part; onClose: () => void }) {
  const { title, intro, tips } = TIPS[part];
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-[#5A3D7A] uppercase tracking-widest mb-0.5">💡 Tips</p>
            <h3 className="text-lg font-bold text-[#2D1B4E]">{title}</h3>
            <p className="text-sm text-gray-500 mt-1 leading-snug">{intro}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">
          <ul className="space-y-3">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-700 leading-relaxed">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#F0E5FF] text-[#5A3D7A] text-[11px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white rounded-full text-sm font-bold shadow active:scale-95"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

function TipsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
    >
      💡 Tips
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────

export default function IELTSSpeakingMocksPage() {
  const [part, setPart] = useState<Part>(1);
  const [tipsOpen, setTipsOpen] = useState<Part | null>(null);

  // Mock activo — leído de ?mock=X, cambiable in-page con los chips.
  const [activeMockId, setActiveMockId] = useState<string>(IELTS_MOCKS[0].id);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = new URLSearchParams(window.location.search).get('mock');
    if (raw && IELTS_MOCKS.some(m => m.id === raw)) setActiveMockId(raw);
  }, []);
  const activeMock = useMemo(() => getIeltsMockOrDefault(activeMockId), [activeMockId]);

  // Per-part timer state (independent so switching tabs doesn't reset).
  const [p1Phase, setP1Phase] = useState<SimplePhase>('idle');
  const [p3Phase, setP3Phase] = useState<SimplePhase>('idle');
  const [p1Time, setP1Time]   = useState(PART1_SECONDS);
  const [p3Time, setP3Time]   = useState(PART3_SECONDS);

  // Part 1 random topic chooser
  const [p1Topic, setP1Topic] = useState<Part1Topic | null>(null);
  const [p1RollKey, setP1RollKey] = useState(0); // forces a fresh bounce-in animation on re-roll
  // Mock mode: walks the student through 3 topics (Work/Studies → Hometown → 1 random).
  const [p1MockQueue, setP1MockQueue] = useState<Part1Topic[] | null>(null);
  const [p1MockIdx, setP1MockIdx] = useState(0);

  function rollP1Topic() {
    // Don't re-pick the same one back-to-back when re-rolling.
    const pool = p1Topic
      ? IELTS_PART1_TOPICS.filter(t => t.id !== p1Topic.id)
      : IELTS_PART1_TOPICS;
    const next = pool[Math.floor(Math.random() * pool.length)];
    setP1Topic(next);
    setP1MockQueue(null);
    setP1MockIdx(0);
    setP1RollKey(k => k + 1);
  }

  function startP1Mock() {
    // Slot 1 & 2 are the two universal IELTS openers (head of the core list).
    const [slot1Id, slot2Id] = IELTS_PART1_CORE_TOPIC_IDS;
    const byId = (id: string) => IELTS_PART1_TOPICS.find(t => t.id === id)!;
    const slot1 = byId(slot1Id);
    const slot2 = byId(slot2Id);
    const remaining = IELTS_PART1_TOPICS.filter(t => t.id !== slot1Id && t.id !== slot2Id);
    const slot3 = remaining[Math.floor(Math.random() * remaining.length)];
    const queue = [slot1, slot2, slot3];
    setP1MockQueue(queue);
    setP1MockIdx(0);
    setP1Topic(queue[0]);
    setP1RollKey(k => k + 1);
    // Auto-start the 5-min timer — matches real IELTS pacing across all 3 topics.
    setP1Time(PART1_SECONDS);
    setP1Phase('running');
  }

  function nextP1MockTopic() {
    if (!p1MockQueue) return;
    const nextIdx = p1MockIdx + 1;
    if (nextIdx >= p1MockQueue.length) {
      // Last topic finished — close out the mock; keep timer state where it is.
      setP1MockQueue(null);
      setP1MockIdx(0);
      setP1Topic(null);
      return;
    }
    setP1MockIdx(nextIdx);
    setP1Topic(p1MockQueue[nextIdx]);
    setP1RollKey(k => k + 1);
  }

  function clearP1() {
    setP1Topic(null);
    setP1MockQueue(null);
    setP1MockIdx(0);
  }

  // Carga las 3 partes del Speaking Mock activo en una sola acción:
  //   Part 1: queue con los topics del mock
  //   Part 2: cue card del mock pre-seleccionada
  //   Part 3: queue con las preguntas del mock
  // Salta a Part 1 con el timer listo para arrancar.
  function loadCurrentMock() {
    const mockSpeaking = activeMock.speaking;

    setP1MockQueue(mockSpeaking.part1);
    setP1MockIdx(0);
    setP1Topic(mockSpeaking.part1[0]);
    setP1RollKey(k => k + 1);
    setP1Time(PART1_SECONDS);
    setP1Phase('idle');

    // Part 2: buscar el índice de la cue card por id en el deck barajado.
    // También limpiamos practiced para que la card del mock esté disponible
    // aunque el alumno ya la haya recorrido antes en esta sesión.
    const cueIdx = IELTS_CUE_CARDS.findIndex(c => c.id === mockSpeaking.cueCard.id);
    if (cueIdx >= 0) {
      setPickedIdx(cueIdx);
      setP2Phase('idle');
      setP2Time(0);
      setPracticedIds(prev => {
        if (!prev.has(mockSpeaking.cueCard.id)) return prev;
        const next = new Set(prev);
        next.delete(mockSpeaking.cueCard.id);
        return next;
      });
    }

    // Part 3: cargar la queue de preguntas y setear la primera.
    setP3MockQueue(mockSpeaking.part3);
    setP3MockIdx(0);
    setP3Question(mockSpeaking.part3[0]);
    setP3RollKey(k => k + 1);
    setP3Phase('idle');
    setP3Time(PART3_SECONDS);

    setPart(1); // asegurar que arranque en Part 1
  }

  // Part 3 random question by band
  const [p3Question, setP3Question] = useState<Part3Question | null>(null);
  const [p3RollKey, setP3RollKey]   = useState(0);
  const [p3Streak, setP3Streak]     = useState(0); // total questions drawn in this session
  // Cuando Mock 1 está activo, caminamos por una queue fija en lugar de sortear.
  const [p3MockQueue, setP3MockQueue] = useState<Part3Question[] | null>(null);
  const [p3MockIdx, setP3MockIdx]     = useState(0);

  function pickP3Question(band: IELTSBand) {
    // Avoid serving the exact same question back-to-back at the same band.
    const all = IELTS_PART3_QUESTIONS.filter(q => q.band === band);
    const pool = p3Question && p3Question.band === band
      ? all.filter(q => q.question !== p3Question.question)
      : all;
    const final = pool.length > 0 ? pool : all;
    const next = final[Math.floor(Math.random() * final.length)];
    setP3Question(next);
    setP3RollKey(k => k + 1);
    setP3Streak(n => n + 1);
    // Sortear rompe el modo Mock si estaba activo.
    setP3MockQueue(null);
    setP3MockIdx(0);
  }

  function nextP3MockQuestion() {
    if (!p3MockQueue) return;
    const nextIdx = p3MockIdx + 1;
    if (nextIdx >= p3MockQueue.length) {
      setP3MockQueue(null);
      setP3MockIdx(0);
      setP3Question(null);
      return;
    }
    setP3MockIdx(nextIdx);
    setP3Question(p3MockQueue[nextIdx]);
    setP3RollKey(k => k + 1);
    setP3Streak(n => n + 1);
  }

  function clearP3Question() {
    setP3Question(null);
    setP3MockQueue(null);
    setP3MockIdx(0);
  }

  // Part 2 state
  const [deckOrder, setDeckOrder] = useState<number[]>(() => shuffleIndices(IELTS_CUE_CARDS.length));
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [p2Phase, setP2Phase]     = useState<Part2Phase>('idle');
  const [p2Time, setP2Time]       = useState(0);
  const [cardsPracticed, setCardsPracticed] = useState(0);
  // Track which cards the student has already worked through this session so
  // they don't reappear in the deck. Cleared with "Reset deck" or on mock load.
  const [practicedIds, setPracticedIds] = useState<Set<string>>(new Set());

  const backGradients = useMemo(
    () => IELTS_CUE_CARDS.map((_, i) => BACK_GRADIENTS[i % BACK_GRADIENTS.length]),
    [],
  );

  const pickedCard = pickedIdx != null ? IELTS_CUE_CARDS[pickedIdx] : null;

  // Deck positions still available to the student (unpracticed only).
  const availableDeck = useMemo(
    () => deckOrder.filter(cardIdx => !practicedIds.has(IELTS_CUE_CARDS[cardIdx].id)),
    [deckOrder, practicedIds],
  );

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

  // Mark the currently picked card as practiced whenever the mock reaches
  // 'done' — covers both the manual finish button and the auto-timeout path
  // inside the speaking-phase interval. Set semantics keep it idempotent.
  useEffect(() => {
    if (p2Phase !== 'done' || !pickedCard) return;
    setPracticedIds(prev => {
      if (prev.has(pickedCard.id)) return prev;
      const next = new Set(prev);
      next.add(pickedCard.id);
      return next;
    });
  }, [p2Phase, pickedCard]);

  // ── Part 2 actions ───────────────────────────────────────────────
  function pickCardByIndex(cardIdx: number) {
    if (p2Phase !== 'idle') return;
    setPickedIdx(cardIdx);
    setP2Phase('revealed');
  }
  function pickRandom() {
    if (p2Phase !== 'idle') return;
    if (availableDeck.length === 0) return;
    const cardIdx = availableDeck[Math.floor(Math.random() * availableDeck.length)];
    pickCardByIndex(cardIdx);
  }
  function shuffleDeck() {
    if (p2Phase !== 'idle') return;
    setDeckOrder(shuffleIndices(IELTS_CUE_CARDS.length));
  }
  function resetPracticedDeck() {
    if (p2Phase !== 'idle') return;
    setPracticedIds(new Set());
    setDeckOrder(shuffleIndices(IELTS_CUE_CARDS.length));
  }
  function startPrep()     { setP2Phase('prep'); setP2Time(PREP_SECONDS); }
  function startSpeaking() { setP2Phase('speaking'); setP2Time(SPEAKING_SECONDS); }
  function finishCard()    { setP2Phase('done'); setCardsPracticed(n => n + 1); }
  function nextCard()      { setPickedIdx(null); setP2Phase('idle'); setP2Time(0); setDeckOrder(shuffleIndices(IELTS_CUE_CARDS.length)); }
  function resetP2()       { setPickedIdx(null); setP2Phase('idle'); setP2Time(0); }

  const p2TotalSec = p2Phase === 'prep' ? PREP_SECONDS : p2Phase === 'speaking' ? SPEAKING_SECONDS : 0;
  const p2Progress = p2TotalSec > 0 ? ((p2TotalSec - p2Time) / p2TotalSec) * 100 : 0;

  const partMeta: Record<Part, { name: string; sub: string; minutes: string }> = {
    1: { name: 'Interview',  sub: 'Familiar topics about you',   minutes: '4-5 min' },
    2: { name: 'Long turn',  sub: 'Cue card · monologue',        minutes: '3-4 min' },
    3: { name: 'Discussion', sub: 'Two-way abstract exchange',   minutes: '4-5 min' },
  };

  // Timer floats fixed to the viewport bottom while active, so the page
  // needs extra bottom room to prevent the last content block from being
  // hidden behind the floating bar.
  const timerFloating =
    (part === 1 && p1Phase !== 'idle') ||
    (part === 2 && (p2Phase === 'prep' || p2Phase === 'speaking')) ||
    (part === 3 && p3Phase !== 'idle');

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#FFFCF7] text-[#2D1B4E]">
      {/* ── Ambient background (Friendly Teaching — warm cream + soft purple/gold glows) ── */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(90,61,122,1) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(90,61,122,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(circle at 50% 30%, black 40%, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 30%, black 40%, transparent 90%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(60rem 40rem at 50% -10%, rgba(200,168,220,0.35) 0%, transparent 60%),' +
            'radial-gradient(45rem 30rem at 10% 90%, rgba(232,181,71,0.15) 0%, transparent 60%),' +
            'radial-gradient(45rem 30rem at 95% 15%, rgba(155,124,184,0.20) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 p-6">
        <FullscreenButton />
        <TopBar
          title="IELTS Speaking Mocks"
          subtitle="Full mock · 3 parts · ~11-14 minutes"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Tools', href: '/dashboard/teacher/tools' },
            { label: 'IELTS Speaking Mocks' },
          ]}
          actions={
            <span className="text-xs text-gray-500 hidden sm:inline">
              Cards practised: <strong className="text-[#5A3D7A]">{cardsPracticed}</strong>
            </span>
          }
        />

        <div className={`max-w-6xl mx-auto mt-8 ${timerFloating ? 'pb-28' : ''}`}>

          {/* ── Exam hero ────────────────────────────────────────────── */}
          <div className="text-center mb-8 space-y-3">
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#5A3D7A] bg-[#F0E5FF] border border-[#C8A8DC]/60 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8B547] animate-pulse" />
              Mock Exam · Speaking
            </span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#2D1B4E] leading-tight tracking-tight">
              IELTS<span className="text-[#E8B547]">®</span> Speaking Simulator
            </h1>
            <p className="text-sm text-[#5A3D7A]/70 max-w-lg mx-auto">
              Rehearse the three examiner-graded sections under real timing.
              Draw cards, roll topics, ladder up through the bands.
            </p>
          </div>

          {/* ── Mock quick-load ──────────────────────────────────────── */}
          <div className="max-w-3xl mx-auto mb-4 bg-white/70 border border-[#E8D5F0] rounded-2xl px-4 py-2.5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.25em]">
                  Speaking · {activeMock.title.replace('IELTS GT · ', '')}
                </p>
                <p className="text-[11px] text-gray-500 truncate">
                  {activeMock.speaking.part1.map(t => t.name).join(' → ')} · cue &ldquo;{activeMock.speaking.cueCard.topic.replace(/\.$/, '')}&rdquo; · {activeMock.speaking.part3.length} preguntas P3
                </p>
              </div>
              <button
                onClick={loadCurrentMock}
                className="text-xs font-black px-3 py-1.5 rounded-full bg-[#E8B547] text-[#2D1B4E] hover:bg-[#F0C25A] active:scale-95 transition-all shrink-0"
              >
                ⭐ Cargar {activeMock.title.replace('IELTS GT · ', '')}
              </button>
            </div>
            {IELTS_MOCKS.length > 1 && (
              <div className="mt-2 flex gap-1.5 flex-wrap">
                {IELTS_MOCKS.map((m, i) => {
                  const active = activeMockId === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setActiveMockId(m.id)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${
                        active ? 'bg-[#5A3D7A] text-white' : 'bg-gray-100 text-gray-500 hover:bg-[#F0E5FF]'
                      }`}
                    >
                      Mock {i + 1}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Chapter-style part selector ─────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 max-w-3xl mx-auto">
            {([1, 2, 3] as const).map(p => {
              const meta = partMeta[p];
              const active = part === p;
              return (
                <button
                  key={p}
                  onClick={() => setPart(p)}
                  className={`relative group text-left rounded-2xl p-4 border transition-all overflow-hidden ${
                    active
                      ? 'bg-gradient-to-br from-[#5A3D7A] to-[#9B7CB8] border-transparent text-white shadow-lg shadow-[#5A3D7A]/25'
                      : 'bg-white border-[#E8D5F0] hover:border-[#C8A8DC] hover:shadow-md text-[#5A3D7A]'
                  }`}
                >
                  {active && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#E8B547]/20 rounded-full blur-2xl pointer-events-none" />
                  )}
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-black tracking-[0.3em] ${active ? 'text-[#E8B547]' : 'text-[#9B7CB8]'}`}>
                      SECTION {String(p).padStart(2, '0')}
                    </span>
                    <span className={`text-[10px] font-semibold ${active ? 'text-white/80' : 'text-gray-400'}`}>
                      {meta.minutes}
                    </span>
                  </div>
                  <p className={`font-serif text-lg font-bold leading-tight ${active ? 'text-white' : 'text-[#2D1B4E]'}`}>
                    {meta.name}
                  </p>
                  <p className={`text-[11px] mt-0.5 ${active ? 'text-white/70' : 'text-gray-500'}`}>
                    {meta.sub}
                  </p>
                </button>
              );
            })}
          </div>

        {/* ── Part 1 ──────────────────────────────────────────────── */}
        {part === 1 && (
          <div className="flex flex-col items-center gap-6">
            <style>{`
              @keyframes p1TopicIn {
                0%   { opacity: 0; transform: translateY(20px) scale(0.85) rotate(-3deg); }
                65%  { opacity: 1; transform: translateY(0)    scale(1.04) rotate(1deg);  }
                100% { opacity: 1; transform: translateY(0)    scale(1)    rotate(0);     }
              }
              @keyframes p1QuestionIn {
                from { opacity: 0; transform: translateX(-12px); }
                to   { opacity: 1; transform: translateX(0);     }
              }
              @keyframes p1DiceSpin {
                0%   { transform: rotate(0)    scale(1);   }
                30%  { transform: rotate(180deg) scale(1.2);}
                60%  { transform: rotate(360deg) scale(0.9);}
                100% { transform: rotate(540deg) scale(1);  }
              }
            `}</style>

            <div className="w-full max-w-xl bg-white rounded-2xl shadow-md shadow-[#C8A8DC]/20 border border-[#E8D5F0] p-6 space-y-3 text-[#1B2C3F]">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.25em]">Section 01 · Introduction & interview</p>
                <TipsButton onClick={() => setTipsOpen(1)} />
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#2D1B4E]">Familiar topics about you</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                The examiner asks general questions about familiar topics. Duration: <strong className="text-[#5A3D7A]">4-5 minutes</strong>.
                Use the random picker for a topic and four follow-up questions to develop the conversation.
              </p>
            </div>

            {/* ── Random topic picker ──────────────────────────────────── */}
            {!p1Topic ? (
              <div className="w-full max-w-xl bg-gradient-to-br from-[#F9F5FF] via-[#F3EEFF] to-[#FFE8F0] rounded-2xl shadow-md shadow-[#C8A8DC]/25 border border-[#E8D5F0] p-7 text-center space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#5A3D7A]/70">Choose how to start</p>
                <p className="text-[#2D1B4E] text-base font-serif">
                  {IELTS_PART1_TOPICS.length} topics in the bank · 4 questions each
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
                  <button
                    onClick={startP1Mock}
                    className="px-6 py-3 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white rounded-full text-sm font-bold shadow-lg shadow-[#5A3D7A]/25 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all inline-flex items-center gap-2 justify-center"
                  >
                    📋 Start full mock (3 topics)
                  </button>
                  <button
                    onClick={rollP1Topic}
                    className="px-6 py-3 bg-white border-2 border-[#C8A8DC] text-[#5A3D7A] rounded-full text-sm font-bold hover:bg-[#F0E5FF] active:scale-95 inline-flex items-center gap-2 justify-center"
                  >
                    <span style={{ display: 'inline-block', animation: 'p1DiceSpin 600ms ease-in-out' }} key={p1RollKey}>🎲</span>
                    Free practice — random topic
                  </button>
                </div>
                <p className="text-[11px] text-[#5A3D7A]/50">
                  Mock follows real IELTS pacing: Work/Studies → Hometown → 1 curveball. Timer auto-starts.
                </p>
              </div>
            ) : (
              <div className="w-full max-w-xl space-y-4" key={`topic-${p1RollKey}`}>
                {/* Mock progress strip */}
                {p1MockQueue && (
                  <div className="flex items-center justify-center gap-2">
                    {p1MockQueue.map((_, i) => (
                      <span
                        key={i}
                        className={`h-2 rounded-full transition-all ${
                          i < p1MockIdx
                            ? 'w-6 bg-[#5A3D7A]'
                            : i === p1MockIdx
                              ? 'w-10 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8]'
                              : 'w-6 bg-[#E8D5F0]'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-[#5A3D7A] ml-2">
                      Topic {p1MockIdx + 1} of {p1MockQueue.length}
                    </span>
                  </div>
                )}

                {/* Topic hero card */}
                <div
                  className="bg-gradient-to-br from-[#5A3D7A] via-[#7B5EA7] to-[#9B7CB8] text-white rounded-2xl shadow-xl shadow-[#5A3D7A]/30 p-7 text-center space-y-2"
                  style={{ animation: 'p1TopicIn 600ms cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
                >
                  <span className="text-7xl block">{p1Topic.emoji}</span>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/60">
                    {p1MockQueue ? `Mock · topic ${p1MockIdx + 1}` : 'Your topic'}
                  </p>
                  <h2 className="text-2xl md:text-3xl font-serif font-bold leading-tight">
                    {p1Topic.name}
                  </h2>
                </div>

                {/* Development questions */}
                <div className="bg-white rounded-2xl shadow-md shadow-[#C8A8DC]/20 border border-[#E8D5F0] p-5 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#5A3D7A]/70">Questions to develop</p>
                  <div className="space-y-2">
                    {p1Topic.questions.map((q, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-[#F9F5FF]/60 border border-[#E8D5F0]"
                        style={{
                          animation: `p1QuestionIn 350ms ease-out both`,
                          animationDelay: `${250 + i * 90}ms`,
                        }}
                      >
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[#5A3D7A] to-[#9B7CB8] text-white text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <p className="text-sm md:text-base text-[#2D1B4E] leading-snug pt-0.5">{q}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-center">
                  {p1MockQueue ? (
                    p1MockIdx < p1MockQueue.length - 1 ? (
                      <button
                        onClick={nextP1MockTopic}
                        className="px-5 py-2 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white rounded-full text-sm font-bold shadow-lg shadow-[#5A3D7A]/25 hover:shadow-xl active:scale-95"
                      >
                        Next topic →
                      </button>
                    ) : (
                      <button
                        onClick={nextP1MockTopic}
                        className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-sm font-bold shadow active:scale-95"
                      >
                        ✓ Finish mock
                      </button>
                    )
                  ) : (
                    <button
                      onClick={rollP1Topic}
                      className="px-5 py-2 bg-white border-2 border-[#C8A8DC] text-[#5A3D7A] rounded-full text-sm font-bold hover:bg-[#F0E5FF] active:scale-95"
                    >
                      🔀 New topic
                    </button>
                  )}
                  <button
                    onClick={clearP1}
                    className="px-3 py-2 text-xs font-semibold text-gray-400 hover:text-gray-600"
                  >
                    {p1MockQueue ? 'Abort mock' : 'Clear'}
                  </button>
                </div>
              </div>
            )}

            <TimedPartPanel
              durationSec={PART1_SECONDS}
              label="Part 1 timer (5 min)"
              sectionLabel="Section 01 · Interview"
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
            <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-md shadow-[#C8A8DC]/20 border border-[#E8D5F0] p-5 space-y-2 text-[#1B2C3F]">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.25em]">Section 02 · Long turn</p>
                <TipsButton onClick={() => setTipsOpen(2)} />
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Pick a cue card. You have <strong className="text-[#5A3D7A]">1 minute</strong> to prepare and <strong className="text-[#5A3D7A]">1-2 minutes</strong> to speak without interruption.
              </p>
            </div>

            <div className="text-center">
              <p className="text-[#5A3D7A] font-serif font-bold text-xl mb-1">Pick a cue card</p>
              <p className="text-gray-500 text-sm">
                {availableDeck.length > 0
                  ? 'Click any card, or let luck decide.'
                  : 'Ya practicaste todas las cue cards de esta sesión.'}
              </p>
              {practicedIds.size > 0 && (
                <p className="text-[11px] text-[#5A3D7A]/60 mt-2 tabular-nums">
                  {practicedIds.size} / {IELTS_CUE_CARDS.length} practicadas
                </p>
              )}
            </div>

            {availableDeck.length > 0 ? (
              <>
                <div className="flex justify-center gap-3 flex-wrap">
                  <button onClick={pickRandom} className="px-5 py-2.5 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white rounded-full text-sm font-bold shadow-lg shadow-[#5A3D7A]/25 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95">
                    🎲 Pick random
                  </button>
                  <button onClick={shuffleDeck} className="px-5 py-2.5 bg-white border-2 border-[#C8A8DC] text-[#5A3D7A] rounded-full text-sm font-bold hover:bg-[#F0E5FF] active:scale-95">
                    🔀 Shuffle
                  </button>
                  {practicedIds.size > 0 && (
                    <button onClick={resetPracticedDeck} className="px-4 py-2.5 bg-white border-2 border-[#E8D5F0] text-[#9B7CB8] rounded-full text-xs font-bold hover:bg-[#F9F5FF] active:scale-95">
                      ↻ Reset deck
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap justify-center gap-4 pt-4">
                  {availableDeck.map((cardIdx, deckPos) => (
                    <div
                      key={`${cardIdx}-${deckPos}`}
                      style={{ transform: `rotate(${(deckPos - (availableDeck.length - 1) / 2) * 4}deg)` }}
                      className="transition-transform"
                    >
                      <CueCardView
                        card={IELTS_CUE_CARDS[cardIdx]}
                        flipped={false}
                        onClick={() => pickCardByIndex(cardIdx)}
                        backGradient={backGradients[cardIdx]}
                        small
                      />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-md shadow-[#C8A8DC]/20 border border-[#E8D5F0] p-6 text-center space-y-4">
                <div className="text-5xl">🎉</div>
                <p className="text-[#5A3D7A] font-serif font-bold text-lg">Deck completo</p>
                <p className="text-sm text-gray-500">
                  Recorriste las {IELTS_CUE_CARDS.length} cue cards del banco. Reseteá el deck para arrancar otra vuelta.
                </p>
                <button
                  onClick={resetPracticedDeck}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white rounded-full text-sm font-bold shadow active:scale-95"
                >
                  ↻ Reset deck
                </button>
              </div>
            )}
          </div>
        )}

        {part === 2 && p2Phase !== 'idle' && pickedCard && (
          <div className="flex flex-col items-center gap-6">
            <CueCardView card={pickedCard} flipped backGradient={backGradients[pickedIdx!]} />

            {/* Static inline card — shown only during 'revealed' and 'done'.
                While the mock is actively counting (prep / speaking), the
                timer pops out as a floating bar below (fixed to viewport)
                so the countdown stays visible while the teacher walks the
                student through the cue card. */}
            {(p2Phase === 'revealed' || p2Phase === 'done') && (
              <div className="w-full max-w-xl bg-white rounded-2xl shadow-md shadow-[#C8A8DC]/25 border border-[#E8D5F0] p-5 space-y-4">
                {p2Phase === 'revealed' && (
                  <div className="text-center space-y-3">
                    <p className="text-sm text-[#5A3D7A] font-semibold">
                      🕐 1 minute to prepare · then 1-2 minutes to speak
                    </p>
                    <div className="flex gap-2 justify-center pt-1">
                      <button onClick={startPrep} className="px-5 py-2.5 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white rounded-full text-sm font-bold shadow-lg shadow-[#5A3D7A]/25 active:scale-95">
                        ⏱ Start prep (1 min)
                      </button>
                      <button onClick={startSpeaking} className="px-5 py-2.5 bg-white border-2 border-[#C8A8DC] text-[#5A3D7A] rounded-full text-sm font-bold hover:bg-[#F0E5FF] active:scale-95">
                        Skip → Speak (2 min)
                      </button>
                    </div>
                  </div>
                )}

                {p2Phase === 'done' && (
                  <div className="text-center space-y-3">
                    <p className="text-3xl">🎉</p>
                    <p className="text-[#5A3D7A] font-serif font-bold text-lg">Great job!</p>
                    <p className="text-sm text-gray-500">Total practised: <strong className="text-[#5A3D7A]">{cardsPracticed}</strong></p>
                    <div className="flex gap-2 justify-center pt-1">
                      <button onClick={nextCard} className="px-5 py-2.5 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white rounded-full text-sm font-bold shadow active:scale-95">
                        🎴 Next cue card
                      </button>
                      <button onClick={() => setPart(3)} className="px-5 py-2.5 bg-white border-2 border-[#C8A8DC] text-[#5A3D7A] rounded-full text-sm font-bold hover:bg-[#F0E5FF] active:scale-95">
                        → Continue to Part 3
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Floating timer bar — same visual language as TimedPartPanel's
                running state so Part 2 feels consistent with Parts 1 & 3. */}
            {(p2Phase === 'prep' || p2Phase === 'speaking') && (
              <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-2xl">
                <div className="bg-white/95 backdrop-blur-md rounded-full shadow-2xl shadow-[#5A3D7A]/30 border border-[#E8D5F0] pl-5 pr-3 py-2.5 flex items-center gap-3">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] font-black text-[#5A3D7A] uppercase tracking-[0.25em] leading-none">
                      Section 02 · {p2Phase === 'prep' ? 'Preparation' : 'Speaking'}
                    </span>
                    <span className={`text-lg font-black font-mono tabular-nums leading-tight ${p2Phase === 'prep' ? 'text-[#9B7CB8]' : 'text-[#5A3D7A]'}`}>
                      {fmt(p2Time)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 h-1.5 bg-[#F0E5FF] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-[width] ${p2Phase === 'prep' ? 'bg-[#9B7CB8]' : 'bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8]'}`}
                      style={{ width: `${p2Progress}%` }}
                    />
                  </div>
                  {p2Phase === 'prep' ? (
                    <button
                      onClick={startSpeaking}
                      className="shrink-0 px-4 py-1.5 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white rounded-full text-xs font-bold shadow active:scale-95"
                    >
                      ▶ Start speaking
                    </button>
                  ) : (
                    <button
                      onClick={finishCard}
                      className="shrink-0 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-xs font-bold shadow active:scale-95"
                    >
                      ✓ Done
                    </button>
                  )}
                  <button
                    onClick={resetP2}
                    className="shrink-0 w-7 h-7 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 text-lg leading-none flex items-center justify-center"
                    title="Cancel"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Part 3 ──────────────────────────────────────────────── */}
        {part === 3 && (
          <div className="flex flex-col items-center gap-6">
            <style>{`
              @keyframes p3QuestionIn {
                0%   { opacity: 0; transform: translateY(12px) scale(0.96); }
                60%  { opacity: 1; transform: translateY(0)    scale(1.02); }
                100% { opacity: 1; transform: translateY(0)    scale(1);    }
              }
            `}</style>

            <div className="w-full max-w-xl bg-white rounded-2xl shadow-md shadow-[#C8A8DC]/20 border border-[#E8D5F0] p-6 space-y-3 text-[#1B2C3F]">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-[0.25em]">Section 03 · Discussion</p>
                <TipsButton onClick={() => setTipsOpen(3)} />
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#2D1B4E]">Two-way abstract discussion</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Tap a band to draw a real Part 3 question at that difficulty. Higher bands
                push the student into more abstract, hypothetical territory.
                Duration: <strong className="text-[#5A3D7A]">4-5 minutes</strong>.
              </p>
            </div>

            {/* Band picker — 4 buttons, easy → hard */}
            <div className="w-full max-w-2xl">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([6, 7, 8, 9] as IELTSBand[]).map(b => {
                  const style = BAND_STYLES[b];
                  const active = p3Question?.band === b;
                  return (
                    <button
                      key={b}
                      onClick={() => pickP3Question(b)}
                      className={`relative overflow-hidden rounded-2xl p-4 text-left text-white shadow-lg shadow-black/10 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all bg-gradient-to-br ${style.gradient} ${active ? 'ring-4 ring-white' : ''}`}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">{style.label}</div>
                      <div className="text-3xl font-extrabold leading-none mt-1">Band {b}</div>
                      <div className="text-[10px] font-medium opacity-80 mt-2 leading-snug">{style.tagline}</div>
                    </button>
                  );
                })}
              </div>
              <p className="text-center text-[11px] text-gray-500 mt-3">
                {IELTS_PART3_QUESTIONS.length} questions in the bank
                {p3Streak > 0 && <> · drawn this session: <strong className="text-[#5A3D7A]">{p3Streak}</strong></>}
              </p>
            </div>

            {/* Drawn question */}
            {p3Question && (
              <div className="w-full max-w-xl space-y-3" key={`q3-${p3RollKey}`}>
                <div
                  className={`relative rounded-2xl p-6 text-white shadow-xl shadow-black/15 overflow-hidden bg-gradient-to-br ${BAND_STYLES[p3Question.band].gradient}`}
                  style={{ animation: 'p3QuestionIn 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
                >
                  <div className="flex items-center justify-between mb-4 gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
                      Band {p3Question.band} · {BAND_STYLES[p3Question.band].label}
                    </span>
                    <span className="text-[11px] font-semibold opacity-80 inline-flex items-center gap-1.5">
                      <span className="text-base leading-none">{p3Question.emoji}</span>
                      <span className="hidden sm:inline">{p3Question.topic}</span>
                    </span>
                  </div>
                  <p className="text-xl md:text-2xl font-serif leading-snug">
                    &ldquo;{p3Question.question}&rdquo;
                  </p>
                </div>

                <div className="flex gap-2 justify-center flex-wrap">
                  {p3MockQueue ? (
                    <>
                      <span className="text-[11px] font-bold text-[#5A3D7A] bg-[#F0E5FF] px-2.5 py-1.5 rounded-full">
                        Mock 1 · pregunta {p3MockIdx + 1}/{p3MockQueue.length}
                      </span>
                      <button
                        onClick={nextP3MockQuestion}
                        className="px-4 py-2 bg-[#5A3D7A] hover:bg-[#4A3062] text-white rounded-full text-sm font-bold active:scale-95"
                      >
                        {p3MockIdx + 1 >= p3MockQueue.length ? 'Terminar Mock 1' : '→ Siguiente pregunta'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => pickP3Question(p3Question.band)}
                      className="px-4 py-2 bg-white border-2 border-[#C8A8DC] text-[#5A3D7A] rounded-full text-sm font-bold hover:bg-[#F0E5FF] active:scale-95"
                    >
                      🔀 Another Band {p3Question.band}
                    </button>
                  )}
                  <button
                    onClick={clearP3Question}
                    className="px-3 py-2 text-xs font-semibold text-gray-400 hover:text-gray-600"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            <TimedPartPanel
              durationSec={PART3_SECONDS}
              label="Part 3 timer (5 min)"
              sectionLabel="Section 03 · Discussion"
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

      {tipsOpen != null && (
        <TipsModal part={tipsOpen} onClose={() => setTipsOpen(null)} />
      )}
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
