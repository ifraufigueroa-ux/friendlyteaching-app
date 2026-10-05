// FriendlyTeaching.cl — Random Topic Simulator
// General-purpose speaking prompt roulette. Multi-select category chips
// plus a per-topic picker modal let the teacher curate exactly which
// subset of topics the deck draws from. Preferences persist in
// localStorage so the setup survives reloads.
'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import TopBar from '@/components/layout/TopBar';
import FullscreenButton from '@/components/ui/FullscreenButton';
import {
  RANDOM_TOPICS,
  RANDOM_TOPIC_CATEGORIES,
  RANDOM_TOPIC_CATEGORY_META,
  randomTopicCounts,
  type RandomTopic,
  type RandomTopicCategory,
} from '@/lib/data/randomTopics';

// localStorage keys. v2 bump because the old key stored a single
// category string; now we store multi-select state as JSON.
const LS_CATS   = 'rt-sim:selectedCategories:v2';
const LS_DISA   = 'rt-sim:disabledTopicIds:v1';

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
  // Multi-select de categorías. Set vacío = "todas" (default). Set no
  // vacío = solo esas categorías. Persistido en localStorage.
  const [selectedCats, setSelectedCats] = useState<Set<RandomTopicCategory>>(new Set());
  // Topics individualmente apagados dentro del pool filtrado. Permite
  // excluir prompts específicos sin tocar toda la categoría.
  const [disabledIds, setDisabledIds] = useState<Set<string>>(new Set());
  const [showPicker, setShowPicker] = useState(false);

  const [pickedId, setPickedId] = useState<string | null>(null);
  const [practiced, setPracticed] = useState(0);
  const [deckSeed, setDeckSeed] = useState(0);
  const [rollKey, setRollKey] = useState(0); // forces reveal animation on re-roll

  // ── Hydrate preferences from localStorage (client-only). ────────────
  useEffect(() => {
    try {
      const rawC = localStorage.getItem(LS_CATS);
      if (rawC) {
        const arr = JSON.parse(rawC) as string[];
        const valid = new Set<RandomTopicCategory>();
        arr.forEach(s => {
          if (RANDOM_TOPIC_CATEGORIES.includes(s as RandomTopicCategory)) {
            valid.add(s as RandomTopicCategory);
          }
        });
        setSelectedCats(valid);
      }
      const rawD = localStorage.getItem(LS_DISA);
      if (rawD) {
        const arr = JSON.parse(rawD) as string[];
        setDisabledIds(new Set(arr));
      }
    } catch { /* corrupt JSON — ignore */ }
  }, []);

  // ── Persist on change. ──────────────────────────────────────────────
  useEffect(() => {
    try { localStorage.setItem(LS_CATS, JSON.stringify([...selectedCats])); } catch {}
  }, [selectedCats]);
  useEffect(() => {
    try { localStorage.setItem(LS_DISA, JSON.stringify([...disabledIds])); } catch {}
  }, [disabledIds]);

  // Pool efectivo = topics cuya categoría está seleccionada (o todas si
  // el set está vacío) Y cuyo id no está en el blacklist por topic.
  const pool = useMemo(() => {
    const bySet = selectedCats.size === 0
      ? RANDOM_TOPICS
      : RANDOM_TOPICS.filter(t => selectedCats.has(t.category));
    return bySet.filter(t => !disabledIds.has(t.id));
  }, [selectedCats, disabledIds]);

  // Shuffled indices into `pool` — kept stable while the pool doesn't change
  // so cards don't jump around every time we open a topic.
  const shuffled = useMemo(
    () => shuffleIndices(pool.length),
    [pool, deckSeed],
  );

  const picked = pickedId ? RANDOM_TOPICS.find(t => t.id === pickedId) ?? null : null;

  const counts = useMemo(() => randomTopicCounts(), []);

  function toggleCategory(cat: RandomTopicCategory) {
    setSelectedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
    backToDeck();
  }
  function selectAllCategories() {
    setSelectedCats(new Set());  // empty = all
    backToDeck();
  }
  function resetAllTopics() {
    setDisabledIds(new Set());
  }

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
      {/* ── Ambient background — beefed up so the glass TopBar has vivid
          color behind it to blur through. Two overlapping wide blobs of
          purple and gold anchored to the top of the page + a rotating
          conic sweep add depth without noise. ───────────────────────────── */}
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
      {/* Wide radial glows — pulled up so the top half of the page has
          real color for the header glassmorphism to filter. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(70rem 45rem at 50% -5%, rgba(155,124,184,0.55) 0%, transparent 60%),' +
            'radial-gradient(50rem 32rem at 8% 8%, rgba(232,181,71,0.35) 0%, transparent 65%),' +
            'radial-gradient(50rem 32rem at 92% 12%, rgba(99,102,241,0.35) 0%, transparent 65%),' +
            'radial-gradient(45rem 30rem at 15% 92%, rgba(232,181,71,0.20) 0%, transparent 60%)',
        }}
      />
      {/* Dedicated glow band sitting exactly behind the TopBar so the
          glass reads as a translucent panel instead of a flat white card. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-72 pointer-events-none"
        style={{
          background:
            'radial-gradient(35rem 18rem at 20% 40%, rgba(232,181,71,0.5) 0%, transparent 65%),' +
            'radial-gradient(35rem 18rem at 80% 40%, rgba(155,124,184,0.55) 0%, transparent 65%),' +
            'radial-gradient(28rem 14rem at 50% 55%, rgba(236,72,153,0.28) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 p-6">
        <FullscreenButton />
        <TopBar
          title="Random Topic Simulator"
          subtitle={`Ruleta de temas de conversación · ${RANDOM_TOPICS.length} topics · follow-ups incluidos`}
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Tools', href: '/dashboard/teacher/tools' },
            { label: 'Random Topic Simulator' },
          ]}
          leading={
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#E8B547]/40 to-[#9B7CB8]/40 blur-md" />
              <div className="relative w-11 h-11 rounded-full overflow-hidden ring-2 ring-white/70 shadow-lg shadow-[#9B7CB8]/30">
                <Image
                  src="/logo-friendlyteaching.jpg"
                  alt="FriendlyTeaching"
                  width={44}
                  height={44}
                  className="object-cover w-full h-full"
                  priority
                />
              </div>
            </div>
          }
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

          {/* ── Category filter chips (multi-select) ──────────────────── */}
          {/* Set vacío = "All" implícito. Chips individuales toggleables.
              Un botón al final abre el picker fino por topic. */}
          <div className="max-w-3xl mx-auto mb-3">
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={selectAllCategories}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-full border transition-all ${
                  selectedCats.size === 0
                    ? 'bg-[#5A3D7A] text-white border-transparent shadow'
                    : 'bg-white text-[#5A3D7A] border-[#E8D5F0] hover:border-[#C8A8DC]'
                }`}
              >
                All · {RANDOM_TOPICS.length - disabledIds.size}
              </button>
              {RANDOM_TOPIC_CATEGORIES.map(cat => {
                const meta = RANDOM_TOPIC_CATEGORY_META[cat];
                const active = selectedCats.has(cat);
                // Si no se seleccionaron categorías explícitamente, todas
                // están "implícitamente activas" — las mostramos neutras.
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`text-xs font-bold px-3.5 py-1.5 rounded-full border transition-all inline-flex items-center gap-1.5 ${
                      active
                        ? `${meta.chipBg} ${meta.chipText} border-transparent shadow`
                        : 'bg-white text-[#5A3D7A] border-[#E8D5F0] hover:border-[#C8A8DC]'
                    }`}
                    aria-pressed={active}
                  >
                    <span>{meta.icon}</span>
                    <span>{cat}</span>
                    <span className={active ? 'text-white/80' : 'text-gray-400'}>· {counts[cat]}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-center gap-3 mt-3 text-[11px] text-[#5A3D7A]/70">
              <button
                onClick={() => setShowPicker(true)}
                className="font-semibold hover:text-[#5A3D7A] underline decoration-dotted"
              >
                🎯 Elegir topics ({pool.length} en el mazo)
              </button>
              {disabledIds.size > 0 && (
                <button
                  onClick={resetAllTopics}
                  className="font-semibold hover:text-[#5A3D7A] underline decoration-dotted"
                >
                  Reactivar los {disabledIds.size} excluidos
                </button>
              )}
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

      {/* ── Topic picker modal ─────────────────────────────────────── */}
      {showPicker && (
        <TopicPickerModal
          disabledIds={disabledIds}
          onToggleTopic={(id) => {
            setDisabledIds(prev => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id); else next.add(id);
              return next;
            });
          }}
          onToggleCategory={(cat, enable) => {
            setDisabledIds(prev => {
              const next = new Set(prev);
              RANDOM_TOPICS.forEach(t => {
                if (t.category === cat) {
                  if (enable) next.delete(t.id);
                  else        next.add(t.id);
                }
              });
              return next;
            });
          }}
          onResetAll={resetAllTopics}
          onClose={() => { setShowPicker(false); backToDeck(); }}
        />
      )}
    </div>
  );
}

// ── Topic picker modal ────────────────────────────────────────────────
// Lista completa de los 130 topics agrupados por categoría, cada uno con
// un checkbox para incluir/excluir individualmente. Permite también
// toggle-all por categoría (botón "Todos" / "Ninguno" por sección).

function TopicPickerModal({
  disabledIds,
  onToggleTopic,
  onToggleCategory,
  onResetAll,
  onClose,
}: {
  disabledIds:      Set<string>;
  onToggleTopic:    (id: string) => void;
  onToggleCategory: (cat: RandomTopicCategory, enable: boolean) => void;
  onResetAll:       () => void;
  onClose:          () => void;
}) {
  const [query, setQuery] = useState('');
  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const g = {} as Record<RandomTopicCategory, RandomTopic[]>;
    RANDOM_TOPIC_CATEGORIES.forEach(c => { g[c] = []; });
    for (const t of RANDOM_TOPICS) {
      if (q && !t.topic.toLowerCase().includes(q)) continue;
      g[t.category].push(t);
    }
    return g;
  }, [query]);
  const totalEnabled = RANDOM_TOPICS.length - disabledIds.size;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D1B4E]/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E8D5F0] bg-gradient-to-r from-[#F0E5FF] to-[#FBF8F0] flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-xl font-bold text-[#2D1B4E]">🎯 Elegir topics</h2>
            <p className="text-[11px] text-[#5A3D7A]/70 mt-0.5">
              {totalEnabled} activos · {disabledIds.size} excluidos · {RANDOM_TOPICS.length} totales
            </p>
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar topic…"
            className="text-xs px-3 py-1.5 rounded-full border border-[#C8A8DC] bg-white/80 text-[#2D1B4E] placeholder:text-[#5A3D7A]/40 focus:outline-none focus:ring-2 focus:ring-[#9B7CB8]/30 w-40"
          />
          <button
            onClick={onResetAll}
            disabled={disabledIds.size === 0}
            className="text-xs font-bold px-3 py-1.5 rounded-full bg-white border border-[#C8A8DC] text-[#5A3D7A] hover:bg-[#F0E5FF] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Resetear
          </button>
          <button
            onClick={onClose}
            className="text-xs font-bold px-4 py-1.5 rounded-full bg-[#5A3D7A] text-white hover:bg-[#2D1B4E]"
          >
            Listo
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {RANDOM_TOPIC_CATEGORIES.map(cat => {
            const topics = grouped[cat];
            if (!topics || topics.length === 0) return null;
            const meta = RANDOM_TOPIC_CATEGORY_META[cat];
            const enabledInCat = topics.filter(t => !disabledIds.has(t.id)).length;
            const allEnabled = enabledInCat === topics.length;
            return (
              <section key={cat}>
                <header className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#5A3D7A] inline-flex items-center gap-2">
                    <span className={`inline-flex w-6 h-6 rounded-full ${meta.chipBg} ${meta.chipText} items-center justify-center text-[11px]`}>
                      {meta.icon}
                    </span>
                    {cat}
                    <span className="text-[10px] text-gray-400 font-semibold">
                      {enabledInCat}/{topics.length}
                    </span>
                  </h3>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onToggleCategory(cat, true)}
                      disabled={allEnabled}
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Todos
                    </button>
                    <span className="text-gray-300">·</span>
                    <button
                      onClick={() => onToggleCategory(cat, false)}
                      disabled={enabledInCat === 0}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-800 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Ninguno
                    </button>
                  </div>
                </header>
                <ul className="space-y-1">
                  {topics.map(t => {
                    const disabled = disabledIds.has(t.id);
                    return (
                      <li key={t.id}>
                        <label className={`flex items-start gap-2 p-2 rounded-lg hover:bg-[#F0E5FF]/50 cursor-pointer ${disabled ? 'opacity-45' : ''}`}>
                          <input
                            type="checkbox"
                            checked={!disabled}
                            onChange={() => onToggleTopic(t.id)}
                            className="mt-1 w-4 h-4 accent-[#5A3D7A]"
                          />
                          <span className="text-sm leading-snug flex-1 min-w-0 text-[#2D1B4E]">
                            <span className="mr-1.5">{t.emoji}</span>
                            {t.topic}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
