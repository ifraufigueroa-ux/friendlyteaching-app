// FriendlyTeaching.cl — Random Tongue Twisters
// Pronunciation warm-up tool. Teacher picks a target sound (or leaves it
// open) and a difficulty, then draws a random twister. Browser TTS plays
// it at slow/normal/fast speed so the student can hear the model before
// repeating. A "say it 3× fast" counter tracks clean repetitions.
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import TopBar from '@/components/layout/TopBar';
import FullscreenButton from '@/components/ui/FullscreenButton';
import {
  TONGUE_TWISTERS,
  TWISTER_SOUNDS,
  TWISTER_SOUND_META,
  TWISTER_DIFFICULTIES,
  tongueTwisterCounts,
  type TongueTwister,
  type TwisterSound,
  type TwisterDifficulty,
} from '@/lib/data/tongueTwisters';

// localStorage keys. v1 — new tool, no migration.
const LS_SOUNDS = 'tt-sim:selectedSounds:v1';
const LS_DIFFS  = 'tt-sim:selectedDiffs:v1';
const LS_PRACT  = 'tt-sim:practicedCount:v1';

type TTSSpeed = 'slow' | 'normal' | 'fast';
const SPEED_RATE: Record<TTSSpeed, number> = { slow: 0.65, normal: 0.95, fast: 1.3 };
const SPEED_LABEL: Record<TTSSpeed, string> = { slow: '🐢 Slow', normal: '👂 Normal', fast: '🏃 Fast' };

// Difficulty chip styling — four-step ladder from easy green to diabolic red.
const DIFF_META: Record<TwisterDifficulty, { bg: string; text: string; label: string }> = {
  'Easy':     { bg: 'bg-emerald-500',  text: 'text-white', label: 'Easy' },
  'Medium':   { bg: 'bg-sky-500',      text: 'text-white', label: 'Medium' },
  'Hard':     { bg: 'bg-amber-500',    text: 'text-white', label: 'Hard' },
  'Diabolic': { bg: 'bg-red-600',      text: 'text-white', label: 'Diabolic' },
};

// ── Helpers ───────────────────────────────────────────────────────────

function shuffleIndices(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Pick the best English voice we can find — prefer en-US/en-GB female voices
// if available, fall back to any English voice, else the browser default.
function pickEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  if (!voices.length) return undefined;
  const en = voices.filter(v => /^en(-|_|$)/i.test(v.lang));
  if (!en.length) return voices[0];
  const preferred = en.find(v => /female|samantha|zira|aria|jenny|google.*us/i.test(v.name));
  return preferred ?? en[0];
}

// ── Twister card ──────────────────────────────────────────────────────

function TwisterCard({
  twister,
  flipped,
  onClick,
  small,
}: {
  twister: TongueTwister;
  flipped: boolean;
  onClick?: () => void;
  small?: boolean;
}) {
  const meta = TWISTER_SOUND_META[twister.sound];

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
          <div className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest text-white/40">Twister</div>
          <div className="absolute bottom-3 right-3 text-[10px] font-bold uppercase tracking-widest text-white/40">Say it fast</div>
          <div className={`${small ? 'text-5xl' : 'text-7xl'} mb-2`}>{meta.icon}</div>
          <p className={`${small ? 'text-[10px]' : 'text-xs'} font-black uppercase tracking-[0.3em] text-white/70`}>
            {meta.label}
          </p>
          <p className={`${small ? 'text-[9px]' : 'text-[11px]'} text-white/50 mt-1 font-mono`}>{meta.ipa}</p>
          {!small && <p className="text-[11px] text-white/40 mt-3">Click to reveal</p>}
        </div>

        {/* ── Face-up ───────────────────────────────────────────────── */}
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#FBF8F0] to-[#F0E5D8] shadow-2xl border-2 border-[#C8A8DC]/40 overflow-hidden p-7 flex flex-col"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${meta.gradient}`} />
          <div className="absolute top-4 left-5 text-[10px] font-bold uppercase tracking-widest text-[#5A3D7A]/60 inline-flex items-center gap-1.5">
            <span>{meta.icon}</span>
            <span>{meta.label}</span>
            <span className="font-mono text-[#5A3D7A]/40">{meta.ipa}</span>
          </div>
          <div className="absolute top-4 right-5 text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded-full ${DIFF_META[twister.difficulty].bg} ${DIFF_META[twister.difficulty].text} text-[9px]`}>
              {twister.difficulty}
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-center mt-6">
            <blockquote className={`${small ? 'text-sm' : 'text-[26px] md:text-[30px]'} font-bold text-[#2D1B4E] mb-4 leading-tight font-serif`}>
              <span className="text-[#5A3D7A]/40 mr-1 font-serif">“</span>
              {twister.text}
              <span className="text-[#5A3D7A]/40 ml-1 font-serif">”</span>
            </blockquote>
            {!small && twister.hint && (
              <>
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#5A3D7A]/70 mb-2">Coach note</p>
                <p className="text-[#2D1B4E] text-[14px] leading-snug">{twister.hint}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────

export default function TongueTwistersPage() {
  // Multi-select de sonidos target. Set vacío = "todos" (default).
  const [selectedSounds, setSelectedSounds] = useState<Set<TwisterSound>>(new Set());
  // Multi-select de dificultad.
  const [selectedDiffs, setSelectedDiffs] = useState<Set<TwisterDifficulty>>(new Set());

  const [pickedId, setPickedId] = useState<string | null>(null);
  const [practiced, setPracticed] = useState(0);
  const [deckSeed, setDeckSeed] = useState(0);
  const [rollKey, setRollKey] = useState(0); // forces reveal animation on re-roll

  // "Say it 3× fast" streak counter — resets whenever we draw a new card.
  const [attempts, setAttempts] = useState(0);

  // TTS state
  const [speed, setSpeed] = useState<TTSSpeed>('normal');
  const [speaking, setSpeaking] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // ── Hydrate preferences from localStorage. ──────────────────────────
  useEffect(() => {
    try {
      const rawS = localStorage.getItem(LS_SOUNDS);
      if (rawS) {
        const arr = JSON.parse(rawS) as string[];
        const valid = new Set<TwisterSound>();
        arr.forEach(s => {
          if (TWISTER_SOUNDS.includes(s as TwisterSound)) valid.add(s as TwisterSound);
        });
        setSelectedSounds(valid);
      }
      const rawD = localStorage.getItem(LS_DIFFS);
      if (rawD) {
        const arr = JSON.parse(rawD) as string[];
        const valid = new Set<TwisterDifficulty>();
        arr.forEach(s => {
          if (TWISTER_DIFFICULTIES.includes(s as TwisterDifficulty)) valid.add(s as TwisterDifficulty);
        });
        setSelectedDiffs(valid);
      }
      const rawP = localStorage.getItem(LS_PRACT);
      if (rawP) setPracticed(parseInt(rawP, 10) || 0);
    } catch { /* corrupt JSON — ignore */ }
  }, []);

  // ── Persist on change. ──────────────────────────────────────────────
  useEffect(() => {
    try { localStorage.setItem(LS_SOUNDS, JSON.stringify([...selectedSounds])); } catch {}
  }, [selectedSounds]);
  useEffect(() => {
    try { localStorage.setItem(LS_DIFFS, JSON.stringify([...selectedDiffs])); } catch {}
  }, [selectedDiffs]);
  useEffect(() => {
    try { localStorage.setItem(LS_PRACT, String(practiced)); } catch {}
  }, [practiced]);

  // ── Load browser voices (async in some browsers). ───────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const load = () => { voicesRef.current = window.speechSynthesis.getVoices(); };
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', load);
      window.speechSynthesis.cancel();
    };
  }, []);

  // Pool efectivo = twisters cuyo sonido está seleccionado (o todos si el
  // set está vacío) Y cuya dificultad está seleccionada (idem).
  const pool = useMemo(() => {
    let out = TONGUE_TWISTERS;
    if (selectedSounds.size > 0) out = out.filter(t => selectedSounds.has(t.sound));
    if (selectedDiffs.size > 0)  out = out.filter(t => selectedDiffs.has(t.difficulty));
    return out;
  }, [selectedSounds, selectedDiffs]);

  // Shuffled indices into `pool` — stable while the pool doesn't change.
  const shuffled = useMemo(
    () => shuffleIndices(pool.length),
    [pool, deckSeed],
  );

  const picked = pickedId ? TONGUE_TWISTERS.find(t => t.id === pickedId) ?? null : null;

  const counts = useMemo(() => tongueTwisterCounts(), []);

  // Count de twisters por dificultad (respetando el filtro de sonido pero
  // ignorando el de dificultad — así los chips muestran cuántos añadirían
  // si se activaran).
  const diffCounts = useMemo(() => {
    const base = selectedSounds.size === 0
      ? TONGUE_TWISTERS
      : TONGUE_TWISTERS.filter(t => selectedSounds.has(t.sound));
    const c = { Easy: 0, Medium: 0, Hard: 0, Diabolic: 0 } as Record<TwisterDifficulty, number>;
    for (const t of base) c[t.difficulty]++;
    return c;
  }, [selectedSounds]);

  function toggleSound(s: TwisterSound) {
    setSelectedSounds(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
    backToDeck();
  }
  function selectAllSounds() {
    setSelectedSounds(new Set());
    backToDeck();
  }
  function toggleDiff(d: TwisterDifficulty) {
    setSelectedDiffs(prev => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d); else next.add(d);
      return next;
    });
    backToDeck();
  }
  function selectAllDiffs() {
    setSelectedDiffs(new Set());
    backToDeck();
  }

  const stopSpeaking = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speakTwister = useCallback((twister: TongueTwister, rate: number) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(twister.text);
    const voice = pickEnglishVoice(voicesRef.current);
    if (voice) u.voice = voice;
    u.lang = voice?.lang ?? 'en-US';
    u.rate = rate;
    u.pitch = 1;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }, []);

  function pickCard(twister: TongueTwister) {
    stopSpeaking();
    setPickedId(twister.id);
    setAttempts(0);
    setRollKey(k => k + 1);
  }

  function pickRandom() {
    if (pool.length === 0) return;
    const candidates = picked && pool.length > 1 ? pool.filter(t => t.id !== picked.id) : pool;
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    pickCard(next);
  }

  function backToDeck() {
    stopSpeaking();
    setPickedId(null);
    setAttempts(0);
    setDeckSeed(s => s + 1);
  }

  function markDoneAndDraw() {
    setPracticed(n => n + 1);
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
      {/* ── Ambient background ───────────────────────────────────────── */}
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
            'radial-gradient(70rem 45rem at 50% -5%, rgba(236,72,153,0.45) 0%, transparent 60%),' +
            'radial-gradient(50rem 32rem at 8% 8%, rgba(251,146,60,0.35) 0%, transparent 65%),' +
            'radial-gradient(50rem 32rem at 92% 12%, rgba(14,165,233,0.35) 0%, transparent 65%),' +
            'radial-gradient(45rem 30rem at 15% 92%, rgba(232,181,71,0.20) 0%, transparent 60%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-72 pointer-events-none"
        style={{
          background:
            'radial-gradient(35rem 18rem at 20% 40%, rgba(251,146,60,0.4) 0%, transparent 65%),' +
            'radial-gradient(35rem 18rem at 80% 40%, rgba(236,72,153,0.45) 0%, transparent 65%),' +
            'radial-gradient(28rem 14rem at 50% 55%, rgba(99,102,241,0.28) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 p-6">
        <FullscreenButton />
        <TopBar
          title="Random Tongue Twisters"
          subtitle={`Ruleta de trabalenguas · ${TONGUE_TWISTERS.length} twisters · TTS integrado`}
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Tools', href: '/dashboard/teacher/tools' },
            { label: 'Random Tongue Twisters' },
          ]}
          leading={
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#F472B6]/40 to-[#FB923C]/40 blur-md" />
              <div className="relative w-11 h-11 rounded-full overflow-hidden ring-2 ring-white/70 shadow-lg shadow-[#F472B6]/30">
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
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#5A3D7A] bg-[#FFE4E6] border border-[#F472B6]/60 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F472B6] animate-pulse" />
              Pronunciation Warm-up
            </span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#2D1B4E] leading-tight tracking-tight">
              Random Tongue Twisters
            </h1>
            <p className="text-sm text-[#5A3D7A]/70 max-w-lg mx-auto">
              Sacá una carta al azar, escuchá el modelo con TTS y repetilo tres
              veces seguido sin trabarte. Filtrá por sonido target para apuntar
              a /r-l/, /th/ o lo que estén trabajando.
            </p>
          </div>

          {/* ── Target-sound filter chips (multi-select) ───────────────── */}
          <div className="max-w-3xl mx-auto mb-3">
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={selectAllSounds}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-full border transition-all ${
                  selectedSounds.size === 0
                    ? 'bg-[#5A3D7A] text-white border-transparent shadow'
                    : 'bg-white text-[#5A3D7A] border-[#E8D5F0] hover:border-[#C8A8DC]'
                }`}
              >
                All · {TONGUE_TWISTERS.length}
              </button>
              {TWISTER_SOUNDS.map(s => {
                const meta = TWISTER_SOUND_META[s];
                const active = selectedSounds.has(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleSound(s)}
                    className={`text-xs font-bold px-3.5 py-1.5 rounded-full border transition-all inline-flex items-center gap-1.5 ${
                      active
                        ? `${meta.chipBg} ${meta.chipText} border-transparent shadow`
                        : 'bg-white text-[#5A3D7A] border-[#E8D5F0] hover:border-[#C8A8DC]'
                    }`}
                    aria-pressed={active}
                    title={meta.note}
                  >
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                    <span className={active ? 'text-white/80' : 'text-gray-400'}>· {counts[s]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Difficulty chips (segundo eje de filtrado) ─────────────── */}
          <div className="max-w-3xl mx-auto mb-6">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#5A3D7A]/50 mr-1">
                Dificultad
              </span>
              <button
                onClick={selectAllDiffs}
                className={`text-xs font-bold px-3 py-1 rounded-full border transition-all ${
                  selectedDiffs.size === 0
                    ? 'bg-[#5A3D7A] text-white border-transparent shadow'
                    : 'bg-white text-[#5A3D7A] border-[#E8D5F0] hover:border-[#C8A8DC]'
                }`}
              >
                Todas
              </button>
              {TWISTER_DIFFICULTIES.map(d => {
                const meta = DIFF_META[d];
                const active = selectedDiffs.has(d);
                return (
                  <button
                    key={d}
                    onClick={() => toggleDiff(d)}
                    className={`text-xs font-bold px-3 py-1 rounded-full border transition-all inline-flex items-center gap-1.5 ${
                      active
                        ? `${meta.bg} ${meta.text} border-transparent shadow`
                        : 'bg-white text-[#5A3D7A] border-[#E8D5F0] hover:border-[#C8A8DC]'
                    }`}
                    aria-pressed={active}
                  >
                    <span>{meta.label}</span>
                    <span className={active ? 'text-white/80' : 'text-gray-400'}>· {diffCounts[d]}</span>
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
                  className="px-6 py-3 bg-gradient-to-r from-[#F472B6] to-[#FB923C] text-white rounded-full text-sm font-bold shadow-lg shadow-[#F472B6]/25 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 inline-flex items-center gap-2"
                >
                  🎲 Pick random
                </button>
                <button
                  onClick={() => setDeckSeed(s => s + 1)}
                  className="px-6 py-3 bg-white border-2 border-[#F472B6] text-[#9B2C6B] rounded-full text-sm font-bold hover:bg-[#FFE4E6] active:scale-95"
                >
                  🔀 Shuffle
                </button>
              </div>

              {pool.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-12">
                  No twisters match these filters yet.
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
                      <TwisterCard
                        twister={pool[poolIdx]}
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
                @keyframes ttRevealIn {
                  0%   { opacity: 0; transform: translateY(14px) scale(0.96); }
                  60%  { opacity: 1; transform: translateY(0)    scale(1.02); }
                  100% { opacity: 1; transform: translateY(0)    scale(1);    }
                }
                @keyframes ttPulse {
                  0%,100% { transform: scale(1); }
                  50%     { transform: scale(1.08); }
                }
              `}</style>
              <div style={{ animation: 'ttRevealIn 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>
                <TwisterCard twister={picked} flipped />
              </div>

              {/* TTS speed controls — pick a rate, then hit play. */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-1.5 bg-white/80 backdrop-blur rounded-full p-1 border border-[#E8D5F0]">
                  {(['slow', 'normal', 'fast'] as TTSSpeed[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                        speed === s
                          ? 'bg-[#5A3D7A] text-white shadow'
                          : 'text-[#5A3D7A] hover:bg-[#F0E5FF]'
                      }`}
                    >
                      {SPEED_LABEL[s]}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => speaking ? stopSpeaking() : speakTwister(picked, SPEED_RATE[speed])}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold shadow active:scale-95 inline-flex items-center gap-2 ${
                    speaking
                      ? 'bg-rose-500 hover:bg-rose-600 text-white'
                      : 'bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] text-white hover:shadow-lg'
                  }`}
                >
                  {speaking ? (
                    <>
                      <span style={{ animation: 'ttPulse 1s ease-in-out infinite' }}>■</span>
                      Stop
                    </>
                  ) : (
                    <>▶ Play at {SPEED_LABEL[speed].split(' ')[1].toLowerCase()}</>
                  )}
                </button>
              </div>

              {/* "Say it 3× fast" tracker — tap after each clean repetition. */}
              <div className="flex items-center gap-3 bg-white/70 backdrop-blur rounded-2xl border border-[#E8D5F0] px-5 py-3 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[#5A3D7A]/60">
                  Say it 3× fast
                </div>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[11px] font-bold transition-all ${
                        attempts > i
                          ? 'bg-emerald-500 border-emerald-500 text-white scale-110'
                          : 'bg-white border-[#E8D5F0] text-gray-300'
                      }`}
                    >
                      {attempts > i ? '✓' : i + 1}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setAttempts(n => Math.min(3, n + 1))}
                  disabled={attempts >= 3}
                  className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                >
                  +1 clean
                </button>
                <button
                  onClick={() => setAttempts(0)}
                  disabled={attempts === 0}
                  className="text-xs font-bold px-3 py-1 rounded-full bg-white border border-[#E8D5F0] text-[#5A3D7A] hover:bg-[#F0E5FF] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Reset
                </button>
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
                  className="px-5 py-2.5 bg-gradient-to-r from-[#F472B6] to-[#FB923C] text-white rounded-full text-sm font-bold shadow-lg shadow-[#F472B6]/25 hover:shadow-xl active:scale-95"
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
