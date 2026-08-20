// FriendlyTeaching.cl — Random Topic Simulator
// General-purpose speaking prompt roulette. Category-filterable deck
// where each card reveals a topic + 3 follow-up questions the teacher
// can use to steer the conversation. No timer — this is a conversation
// tool, not an exam simulator.
'use client';

import { useMemo, useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import FullscreenButton from '@/components/ui/FullscreenButton';
import {
  RANDOM_TOPICS,
  RANDOM_TOPIC_CATEGORIES,
  RANDOM_TOPIC_CATEGORY_META,
  filterRandomTopics,
  randomTopicCounts,
  type RandomTopic,
  type RandomTopicCategory,
} from '@/lib/data/randomTopics';

// ── Card view ─────────────────────────────────────────────────────────
// Face-down: coloured gradient by category, "TOPIC" label + big emoji.
// Face-up: same gradient, big topic + 3 numbered follow-ups.
// Uses the same 3D flip mechanic as IELTS Cue Cards.

function TopicCard({
  topic,
  flipped,
  onClick,
  small,
}: {
  topic: RandomTopic;
  flipped: boolean;
  onClick?: () => void;
  small?: boolean;
}) {
  const meta = RANDOM_TOPIC_CATEGORY_META[topic.category];

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`relative ${small ? 'w-40 h-56' : 'w-[26rem] h-[34rem]'} cursor-pointer disabled:cursor-default group focus:outline-none`}
      style={{ perspective: '1500px' }}
    >
      <div
        className="absolute inset-0 transition-transform duration-700"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)',
        }}
      >
        {/* ── Face-down ─────────────────────────────────────────────── */}
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${meta.gradient} shadow-2xl border-2 border-white/20 overflow-hidden flex flex-col items-center justify-center text-white p-6 group-hover:scale-[1.03] group-disabled:group-hover:scale-100 transition-transform`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="absolute inset-3 border-2 border-white/15 rounded-xl" />
          <div className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest text-white/40">Topic</div>
          <div className="absolute bottom-3 right-3 text-[10px] font-bold uppercase tracking-widest text-white/40">Speak</div>
          <div className={`${small ? 'text-5xl' : 'text-7xl'} mb-2`}>{meta.icon}</div>
          <p className={`${small ? 'text-[10px]' : 'text-xs'} font-black uppercase tracking-[0.3em] text-white/70`}>
            {topic.category}
          </p>
          {!small && <p className="text-[11px] text-white/40 mt-3">Click to reveal</p>}
        </div>

        {/* ── Face-up ───────────────────────────────────────────────── */}
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#FBF8F0] to-[#F0E5D8] shadow-2xl border-2 border-[#C8A8DC]/40 overflow-hidden p-7 flex flex-col"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${meta.gradient}`} />
          <div className="absolute top-4 left-5 text-[10px] font-bold uppercase tracking-widest text-[#5A3D7A]/50 inline-flex items-center gap-1.5">
            <span>{meta.icon}</span>
            <span>{topic.category}</span>
          </div>
          <div className="absolute top-4 right-5 text-[10px] font-bold uppercase tracking-widest text-[#5A3D7A]/50">Random topic</div>

          <div className="flex-1 flex flex-col justify-center mt-4">
            <div className={`${small ? 'text-4xl' : 'text-6xl'} mb-3`}>{topic.emoji}</div>
            <h2 className={`${small ? 'text-sm' : 'text-2xl md:text-[26px]'} font-bold text-[#2D1B4E] mb-5 leading-tight font-serif`}>
              {topic.topic}
            </h2>
            {!small && (
              <>
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#5A3D7A]/70 mb-2">Follow-ups</p>
                <ul className="space-y-2">
                  {topic.followUps.map((q, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className={`flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br ${meta.gradient} text-white text-[11px] font-bold flex items-center justify-center mt-0.5`}>
                        {i + 1}
                      </span>
                      <p className="text-[#2D1B4E] text-[15px] leading-snug pt-0.5">{q}</p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────

function shuffleIndices(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Page ──────────────────────────────────────────────────────────────

export default function RandomTopicsPage() {
  const [activeCategory, setActiveCategory] = useState<RandomTopicCategory | null>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [practiced, setPracticed] = useState(0);
  const [deckSeed, setDeckSeed] = useState(0);
  const [rollKey, setRollKey] = useState(0); // forces reveal animation on re-roll

  // The current filtered pool. When "All" is active this is the full bank.
  const pool = useMemo(
    () => filterRandomTopics(activeCategory),
    [activeCategory],
  );

  // Shuffled indices into `pool` — kept stable while the pool doesn't change
  // so cards don't jump around every time we open a topic.
  const shuffled = useMemo(
    () => shuffleIndices(pool.length),
    [pool, deckSeed],
  );

  const picked = pickedId ? RANDOM_TOPICS.find(t => t.id === pickedId) ?? null : null;

  const counts = useMemo(() => randomTopicCounts(), []);

  function pickCard(topic: RandomTopic) {
    setPickedId(topic.id);
    setRollKey(k => k + 1);
  }

  function pickRandom() {
    if (pool.length === 0) return;
    // Avoid drawing the same card twice in a row when possible.
    const candidates = picked && pool.length > 1 ? pool.filter(t => t.id !== picked.id) : pool;
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    pickCard(next);
  }

  function backToDeck() {
    setPickedId(null);
    setDeckSeed(s => s + 1); // reshuffle so the next draw isn't visually obvious
  }

  function markDoneAndDraw() {
    setPracticed(n => n + 1);
    // Auto-draw the next random card from the same filtered pool.
    if (pool.length <= 1) {
      backToDeck();
      return;
    }
    const candidates = picked ? pool.filter(t => t.id !== picked.id) : pool;
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    pickCard(next);
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#FFFCF7] text-[#2D1B4E]">
      {/* ── Ambient background — matches IELTS Speaking tone ───────────── */}
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
          title="Random Topic Simulator"
          subtitle="Ruleta de temas de conversación · 40 topics · follow-ups incluidos"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Tools', href: '/dashboard/teacher/tools' },
            { label: 'Random Topic Simulator' },
          ]}
          actions={
            <span className="text-xs text-gray-500 hidden sm:inline">
              Practicados: <strong className="text-[#5A3D7A]">{practiced}</strong>
            </span>
          }
        />

        <div className="max-w-6xl mx-auto mt-8">

          {/* ── Hero ──────────────────────────────────────────────────── */}
          <div className="text-center mb-6 space-y-3">
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#5A3D7A] bg-[#F0E5FF] border border-[#C8A8DC]/60 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8B547] animate-pulse" />
              Speaking Roulette
            </span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#2D1B4E] leading-tight tracking-tight">
              Random Topic Simulator
            </h1>
            <p className="text-sm text-[#5A3D7A]/70 max-w-lg mx-auto">
              Saca una carta al azar y conversa. Cada topic viene con 3 follow-ups
              por si la charla necesita un empujón.
            </p>
          </div>

          {/* ── Category filter chips ─────────────────────────────────── */}
          <div className="max-w-3xl mx-auto mb-6">
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => { setActiveCategory(null); backToDeck(); }}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-full border transition-all ${
                  activeCategory === null
                    ? 'bg-[#5A3D7A] text-white border-transparent shadow'
                    : 'bg-white text-[#5A3D7A] border-[#E8D5F0] hover:border-[#C8A8DC]'
                }`}
              >
                All · {RANDOM_TOPICS.length}
              </button>
              {RANDOM_TOPIC_CATEGORIES.map(cat => {
                const meta = RANDOM_TOPIC_CATEGORY_META[cat];
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => { setActiveCategory(cat); backToDeck(); }}
                    className={`text-xs font-bold px-3.5 py-1.5 rounded-full border transition-all inline-flex items-center gap-1.5 ${
                      active
                        ? `${meta.chipBg} ${meta.chipText} border-transparent shadow`
                        : 'bg-white text-[#5A3D7A] border-[#E8D5F0] hover:border-[#C8A8DC]'
                    }`}
                  >
                    <span>{meta.icon}</span>
                    <span>{cat}</span>
                    <span className={active ? 'text-white/80' : 'text-gray-400'}>· {counts[cat]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Deck vs. picked card ──────────────────────────────────── */}
          {!picked ? (
            <div className="space-y-6">
              <div className="flex justify-center gap-3">
                <button
                  onClick={pickRandom}
                  className="px-6 py-3 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white rounded-full text-sm font-bold shadow-lg shadow-[#5A3D7A]/25 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 inline-flex items-center gap-2"
                >
                  🎲 Pick random
                </button>
                <button
                  onClick={() => setDeckSeed(s => s + 1)}
                  className="px-6 py-3 bg-white border-2 border-[#C8A8DC] text-[#5A3D7A] rounded-full text-sm font-bold hover:bg-[#F0E5FF] active:scale-95"
                >
                  🔀 Shuffle
                </button>
              </div>

              {pool.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-12">
                  No topics in this category yet.
                </div>
              ) : (
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  {shuffled.map((poolIdx, deckPos) => (
                    <div
                      key={`${pool[poolIdx].id}-${deckPos}`}
                      style={{
                        transform: `rotate(${(deckPos - (shuffled.length - 1) / 2) * 1.4}deg)`,
                      }}
                      className="transition-transform"
                    >
                      <TopicCard
                        topic={pool[poolIdx]}
                        flipped={false}
                        onClick={() => pickCard(pool[poolIdx])}
                        small
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6" key={`picked-${rollKey}`}>
              <style>{`
                @keyframes rtRevealIn {
                  0%   { opacity: 0; transform: translateY(14px) scale(0.96); }
                  60%  { opacity: 1; transform: translateY(0)    scale(1.02); }
                  100% { opacity: 1; transform: translateY(0)    scale(1);    }
                }
              `}</style>
              <div style={{ animation: 'rtRevealIn 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>
                <TopicCard topic={picked} flipped />
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={markDoneAndDraw}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-sm font-bold shadow active:scale-95"
                >
                  ✓ Done · draw next
                </button>
                <button
                  onClick={pickRandom}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white rounded-full text-sm font-bold shadow-lg shadow-[#5A3D7A]/25 hover:shadow-xl active:scale-95"
                >
                  🔀 Skip · another random
                </button>
                <button
                  onClick={backToDeck}
                  className="px-4 py-2.5 bg-white border-2 border-[#C8A8DC] text-[#5A3D7A] rounded-full text-sm font-bold hover:bg-[#F0E5FF] active:scale-95"
                >
                  ← Back to deck
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
