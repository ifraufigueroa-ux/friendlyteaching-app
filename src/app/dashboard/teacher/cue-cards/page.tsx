// FriendlyTeaching.cl — IELTS Speaking Mocks
// Three-part simulator:
//   • Part 1 — interview-style timer with brief instructions
//   • Part 2 — flip-the-cue-card with 1 min prep + 2 min speaking
//   • Part 3 — discussion-style timer with brief instructions
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import { IELTS_CUE_CARDS, type CueCard } from '@/lib/data/ieltsCueCards';
import { IELTS_PART1_TOPICS, IELTS_PART1_CORE_TOPIC_IDS, type Part1Topic } from '@/lib/data/ieltsPart1Topics';

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
              ✓ Done
            </button>
            <button
              onClick={onReset}
              className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </>
        )}
        {phase === 'done' && (
          <button
            onClick={onReset}
            className="px-5 py-2.5 bg-white border border-[#C8A8DC] text-[#5A3D7A] rounded-full text-sm font-bold hover:bg-[#F0E5FF] active:scale-95"
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
  const [part, setPart] = useState<Part>(2);
  const [tipsOpen, setTipsOpen] = useState<Part | null>(null);

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

            <div className="w-full max-w-xl bg-white rounded-2xl shadow-md p-6 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-bold text-[#5A3D7A] uppercase tracking-widest">Part 1 · Introduction & interview</p>
                <TipsButton onClick={() => setTipsOpen(1)} />
              </div>
              <h2 className="text-xl font-bold text-[#2D1B4E]">Familiar topics about you</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                The examiner asks general questions about familiar topics. Duration: <strong>4-5 minutes</strong>.
                Use the random picker for a topic and four follow-up questions to develop the conversation.
              </p>
            </div>

            {/* ── Random topic picker ──────────────────────────────────── */}
            {!p1Topic ? (
              <div className="w-full max-w-xl bg-gradient-to-br from-[#F9F5FF] via-[#F3EEFF] to-[#FFE8F0] rounded-2xl shadow-md p-7 text-center space-y-4 border border-white">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#5A3D7A]/60">Choose how to start</p>
                <p className="text-[#2D1B4E] text-base">
                  {IELTS_PART1_TOPICS.length} topics in the bank · 4 questions each
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
                  <button
                    onClick={startP1Mock}
                    className="px-6 py-3 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white rounded-full text-sm font-bold shadow-lg shadow-[#5A3D7A]/30 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all inline-flex items-center gap-2 justify-center"
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
                <div className="bg-white rounded-2xl shadow-md p-5 space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#5A3D7A]/60">Questions to develop</p>
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
                        className="px-5 py-2 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white rounded-full text-sm font-bold shadow hover:shadow-lg active:scale-95"
                      >
                        Next topic →
                      </button>
                    ) : (
                      <button
                        onClick={nextP1MockTopic}
                        className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full text-sm font-bold shadow active:scale-95"
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
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-bold text-[#5A3D7A] uppercase tracking-widest">Part 2 · Long turn</p>
                <TipsButton onClick={() => setTipsOpen(2)} />
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Pick a cue card. You have <strong>1 minute</strong> to prepare and <strong>1-2 minutes</strong> to speak without interruption.
              </p>
            </div>

            <div className="text-center">
              <p className="text-[#5A3D7A] font-bold text-lg mb-1">Pick a cue card</p>
              <p className="text-gray-500 text-sm">Click any card, or let luck decide.</p>
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
                    🕐 1 minute to prepare · then 1-2 minutes to speak
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
                        ▶ Start speaking
                      </button>
                    ) : (
                      <button onClick={finishCard} className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-full text-sm font-bold shadow active:scale-95">
                        ✓ Done
                      </button>
                    )}
                    <button onClick={resetP2} className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {p2Phase === 'done' && (
                <div className="text-center space-y-3">
                  <p className="text-2xl">🎉</p>
                  <p className="text-[#5A3D7A] font-bold">Great job!</p>
                  <p className="text-sm text-gray-500">Total practised: <strong className="text-[#5A3D7A]">{cardsPracticed}</strong></p>
                  <div className="flex gap-2 justify-center pt-1">
                    <button onClick={nextCard} className="px-5 py-2.5 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white rounded-full text-sm font-bold shadow active:scale-95">
                      🎴 Next cue card
                    </button>
                    <button onClick={() => setPart(3)} className="px-5 py-2.5 bg-white border border-[#C8A8DC] text-[#5A3D7A] rounded-full text-sm font-bold hover:bg-[#F0E5FF] active:scale-95">
                      → Continue to Part 3
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
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-bold text-[#5A3D7A] uppercase tracking-widest">Part 3 · Discussion</p>
                <TipsButton onClick={() => setTipsOpen(3)} />
              </div>
              <h2 className="text-xl font-bold text-[#2D1B4E]">Two-way abstract discussion</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                The examiner asks more abstract questions related to the Part 2 topic.
                It is a real dialogue: the candidate can ask for clarification and give
                extended opinions. Duration: <strong>4-5 minutes</strong>.
              </p>
              <div className="bg-[#F9F5FF] rounded-xl p-3 mt-2">
                <p className="text-[11px] font-bold text-[#5A3D7A] uppercase tracking-widest mb-1.5">Question types</p>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• <strong>Comparison</strong> — &ldquo;How is X different from Y?&rdquo;</li>
                  <li>• <strong>Cause &amp; effect</strong> — &ldquo;Why do people prefer ___ nowadays?&rdquo;</li>
                  <li>• <strong>Prediction</strong> — &ldquo;Do you think ___ will change in the future?&rdquo;</li>
                  <li>• <strong>Opinion</strong> — &ldquo;Some people say ___. What do you think?&rdquo;</li>
                  <li>• <strong>Society</strong> — &ldquo;How does ___ affect society?&rdquo;</li>
                </ul>
              </div>
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
