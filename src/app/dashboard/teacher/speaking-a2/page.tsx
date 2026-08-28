// FriendlyTeaching.cl — A1-A2+ Speaking Simulator
//
// Three-part practice that mirrors the IELTS Speaking Simulator but is
// calibrated for elementary learners. Grammar-focused Part 3 chips
// (present · past · future · preferences · experiences) replace the
// IELTS band picker so the teacher can drill a specific tense.
//
// Timers are shorter than the IELTS mock:
//   · Part 1 — 4 min interview
//   · Part 2 — 45 s prep + 90 s speaking
//   · Part 3 — 3 min discussion
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import TopBar from '@/components/layout/TopBar';
import FullscreenButton from '@/components/ui/FullscreenButton';
import { A2_CUE_CARDS, type A2CueCard } from '@/lib/data/a2Speaking/cueCards';
import { A2_PART1_TOPICS, A2_PART1_CORE_TOPIC_IDS, type A2Part1Topic } from '@/lib/data/a2Speaking/part1Topics';
import { A2_PART3_QUESTIONS, type A2Focus, type A2Part3Question } from '@/lib/data/a2Speaking/part3Questions';
import {
  deleteCueCardProgress, listCueCardStudents, loadCueCardProgress,
  saveCueCardProgress, type CueCardProgress,
} from '@/lib/ielts/cueCardProgress';

type Part = 1 | 2 | 3;
type Part2Phase = 'idle' | 'revealed' | 'prep' | 'speaking' | 'done';
type SimplePhase = 'idle' | 'running' | 'done';

const PREP_SECONDS      = 45;
const SPEAKING_SECONDS  = 90;
const PART1_SECONDS     = 4 * 60;
const PART3_SECONDS     = 3 * 60;

// ─── Tips (Spanish — this is teacher-facing coaching) ─────────────────
const TIPS: Record<Part, { title: string; intro: string; tips: string[] }> = {
  1: {
    title: 'Part 1 · Tips para el alumno',
    intro: 'Preguntas simples sobre su vida. Respuestas cortas pero completas (2-3 oraciones).',
    tips: [
      'Nunca contestar con una sola palabra: siempre agregar un detalle.',
      'Usar "because" para justificar: "I like it because…".',
      'Frecuencia: always, usually, sometimes, never.',
      'Modelar tiempos verbales: presente para hábitos, pasado para "yesterday", "last week".',
      'Si no entiende: "Sorry, can you repeat?" o "Can you say that again?"',
    ],
  },
  2: {
    title: 'Part 2 · Tips para el long turn',
    intro: '45 segundos para preparar, 90 segundos para hablar sin parar.',
    tips: [
      'Aprovechar el prep para escribir 3-4 palabras clave (no oraciones completas).',
      'Empezar con "I want to talk about..." o "The thing I chose is...".',
      'Cubrir los 4 bullets del cue card — cada uno con al menos 1 oración.',
      'Usar conectores simples: and, but, so, because, then, after that.',
      'Si se queda sin ideas: describir con "There is…", "It has…", "I feel…".',
      'No parar antes de tiempo: seguir agregando detalles ("It reminds me of…", "One time…").',
    ],
  },
  3: {
    title: 'Part 3 · Tips para preguntas de opinión',
    intro: 'Preguntas de gramática puntual. Enfocarse en el tiempo verbal del chip.',
    tips: [
      'Estructura simple: OPINIÓN + RAZÓN + EJEMPLO.',
      'Presente → hábitos generales ("People usually…", "Most people…").',
      'Pasado → "When I was…", "Last year I…", "The last time…".',
      'Futuro → "I\'m going to…", "I think I will…", "Next week…".',
      'Preferencias → "I prefer X because…", "I like X better than Y".',
      'Experiencias → "I have never…", "Yes, once I…", "It was in…".',
    ],
  },
};

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

// A2 palette — softer greens/teals to differentiate from IELTS purple.
const BACK_GRADIENTS = [
  'from-[#0F766E] via-[#2DD4BF] to-[#5EEAD4]',
  'from-[#059669] via-[#34D399] to-[#A7F3D0]',
  'from-[#0891B2] via-[#22D3EE] to-[#A5F3FC]',
  'from-[#EA580C] via-[#FB923C] to-[#FED7AA]',
  'from-[#14B8A6] via-[#5EEAD4] to-[#CCFBF1]',
];

const FOCUS_STYLES: Record<A2Focus, { gradient: string; label: string; tagline: string; emoji: string }> = {
  present:     { gradient: 'from-emerald-400 to-teal-600',    label: 'Present',     tagline: 'Rutinas · gustos actuales',      emoji: '🟢' },
  past:        { gradient: 'from-amber-400 to-orange-500',    label: 'Past',        tagline: 'Recuerdos · ayer · el otro día', emoji: '🟠' },
  future:      { gradient: 'from-sky-400 to-blue-600',        label: 'Future',      tagline: 'Planes · going to · will',       emoji: '🔵' },
  preferences: { gradient: 'from-rose-400 to-pink-600',       label: 'Preferences', tagline: 'Prefer · like better · why',     emoji: '🩷' },
  experiences: { gradient: 'from-violet-400 to-purple-600',   label: 'Experiences', tagline: 'Have you ever…? · once',         emoji: '🟣' },
};

// ─── Cue card view ────────────────────────────────────────────────────
function CueCardView({
  card,
  flipped,
  onClick,
  backGradient,
  small,
}: {
  card: A2CueCard;
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
          <div className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest text-white/50">A1-A2+</div>
          <div className="absolute bottom-3 right-3 text-[10px] font-bold uppercase tracking-widest text-white/50">Part 2</div>
          <div className={`${small ? 'text-5xl' : 'text-7xl'} mb-3`}>🗣️</div>
          <p className={`${small ? 'text-xs' : 'text-sm'} font-semibold uppercase tracking-widest text-white/80`}>Cue Card</p>
          {!small && <p className="text-[11px] text-white/60 mt-2">Click to reveal</p>}
        </div>

        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#FBFCF0] to-[#E8F5E9] shadow-2xl border-2 border-[#A7F3D0]/60 overflow-hidden p-7 flex flex-col"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="absolute top-3 left-4 text-[10px] font-bold uppercase tracking-widest text-[#0F766E]/70">A1-A2+ · Part 2</div>
          <div className="absolute top-3 right-4 text-[10px] font-bold uppercase tracking-widest text-[#0F766E]/70">1-2 min</div>

          <div className="flex-1 flex flex-col justify-center mt-4">
            <h2 className={`${small ? 'text-base' : 'text-3xl'} font-bold text-[#134E4A] mb-4 leading-tight font-serif`}>
              {card.topic}
            </h2>
            {!small && (
              <>
                <p className="text-sm font-semibold text-[#0F766E] mb-2">You should say:</p>
                <ul className="space-y-1.5 mb-5">
                  {card.bullets.map((b, i) => (
                    <li key={i} className="text-[#134E4A] text-base leading-snug flex items-start gap-2">
                      <span className="text-[#14B8A6] mt-1">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-[#134E4A] text-base italic mt-3">
                  {card.explainPrompt}
                </p>
                <p className="mt-4 inline-block text-[10px] font-bold uppercase tracking-widest text-[#0F766E]/70 bg-[#CCFBF1]/70 rounded-full px-2 py-1 self-start">
                  🎯 {card.focus}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Shared timer panel (Part 1 and Part 3) ──────────────────────────
function TimedPartPanel({
  durationSec, label, sectionLabel, accentClass,
  phase, timeLeft, onStart, onStop, onReset,
}: {
  durationSec: number;
  label: string;
  sectionLabel: string;
  accentClass: string;
  phase: SimplePhase;
  timeLeft: number;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}) {
  const progressPct = phase === 'running' ? ((durationSec - timeLeft) / durationSec) * 100 : phase === 'done' ? 100 : 0;

  if (phase === 'idle') {
    return (
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-md shadow-[#A7F3D0]/30 border border-[#A7F3D0] p-6 space-y-4">
        <p className="text-[10px] text-[#0F766E] uppercase tracking-[0.3em] text-center font-black">{label}</p>
        <p className={`text-6xl font-black font-mono text-center tabular-nums ${accentClass}`}>
          {fmt(durationSec)}
        </p>
        <div className="w-full h-1.5 bg-[#CCFBF1] rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-[#0F766E] to-[#14B8A6]" style={{ width: '0%' }} />
        </div>
        <div className="flex justify-center pt-1">
          <button
            onClick={onStart}
            className="px-6 py-2.5 bg-gradient-to-r from-[#0F766E] to-[#14B8A6] text-white rounded-full text-sm font-bold shadow-lg shadow-[#0F766E]/25 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
          >
            ▶ Start timer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-2xl">
      <div className="bg-white/95 backdrop-blur-md rounded-full shadow-2xl shadow-[#0F766E]/30 border border-[#A7F3D0] pl-5 pr-3 py-2.5 flex items-center gap-3">
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] font-black text-[#0F766E] uppercase tracking-[0.25em] leading-none">
            {sectionLabel}
          </span>
          <span className={`text-lg font-black font-mono tabular-nums leading-tight ${accentClass}`}>
            {fmt(timeLeft)}
          </span>
        </div>
        <div className="flex-1 min-w-0 h-1.5 bg-[#CCFBF1] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] bg-gradient-to-r from-[#0F766E] to-[#14B8A6]"
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
            className="shrink-0 px-4 py-1.5 bg-white border-2 border-[#A7F3D0] text-[#0F766E] rounded-full text-xs font-bold hover:bg-[#CCFBF1] active:scale-95"
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
            <p className="text-xs font-bold text-[#0F766E] uppercase tracking-widest mb-0.5">💡 Tips</p>
            <h3 className="text-lg font-bold text-[#134E4A]">{title}</h3>
            <p className="text-sm text-gray-500 mt-1 leading-snug">{intro}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">
          <ul className="space-y-3">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-700 leading-relaxed">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#CCFBF1] text-[#0F766E] text-[11px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gradient-to-r from-[#0F766E] to-[#14B8A6] text-white rounded-full text-sm font-bold shadow active:scale-95"
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
export default function A2SpeakingSimulatorPage() {
  const [part, setPart] = useState<Part>(1);
  const [tipsOpen, setTipsOpen] = useState<Part | null>(null);

  // Per-part timer state
  const [p1Phase, setP1Phase] = useState<SimplePhase>('idle');
  const [p3Phase, setP3Phase] = useState<SimplePhase>('idle');
  const [p1Time, setP1Time]   = useState(PART1_SECONDS);
  const [p3Time, setP3Time]   = useState(PART3_SECONDS);

  // Part 1 topic chooser
  const [p1Topic, setP1Topic] = useState<A2Part1Topic | null>(null);
  const [p1RollKey, setP1RollKey] = useState(0);
  const [p1MockQueue, setP1MockQueue] = useState<A2Part1Topic[] | null>(null);
  const [p1MockIdx, setP1MockIdx] = useState(0);

  function rollP1Topic() {
    const pool = p1Topic
      ? A2_PART1_TOPICS.filter(t => t.id !== p1Topic.id)
      : A2_PART1_TOPICS;
    const next = pool[Math.floor(Math.random() * pool.length)];
    setP1Topic(next);
    setP1MockQueue(null);
    setP1MockIdx(0);
    setP1RollKey(k => k + 1);
  }

  function startP1Mock() {
    // Slot 1 & 2 are the two universal openers, slot 3 is random.
    const [slot1Id, slot2Id] = A2_PART1_CORE_TOPIC_IDS;
    const byId = (id: string) => A2_PART1_TOPICS.find(t => t.id === id)!;
    const slot1 = byId(slot1Id);
    const slot2 = byId(slot2Id);
    const remaining = A2_PART1_TOPICS.filter(t => t.id !== slot1Id && t.id !== slot2Id);
    const slot3 = remaining[Math.floor(Math.random() * remaining.length)];
    const queue = [slot1, slot2, slot3];
    setP1MockQueue(queue);
    setP1MockIdx(0);
    setP1Topic(queue[0]);
    setP1RollKey(k => k + 1);
    setP1Time(PART1_SECONDS);
    setP1Phase('running');
  }

  function nextP1MockTopic() {
    if (!p1MockQueue) return;
    const nextIdx = p1MockIdx + 1;
    if (nextIdx >= p1MockQueue.length) {
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

  // Part 3 questions
  const [p3Question, setP3Question] = useState<A2Part3Question | null>(null);
  const [p3RollKey, setP3RollKey]   = useState(0);
  const [p3Streak, setP3Streak]     = useState(0);
  const [p3ActiveFocus, setP3ActiveFocus] = useState<A2Focus | null>(null);

  function pickP3Question(focus: A2Focus) {
    setP3ActiveFocus(focus);
    const all = A2_PART3_QUESTIONS.filter(q => q.focus === focus);
    const pool = p3Question && p3Question.focus === focus
      ? all.filter(q => q.question !== p3Question.question)
      : all;
    const final = pool.length > 0 ? pool : all;
    const next = final[Math.floor(Math.random() * final.length)];
    setP3Question(next);
    setP3RollKey(k => k + 1);
    setP3Streak(n => n + 1);
  }

  function clearP3Question() {
    setP3Question(null);
    setP3ActiveFocus(null);
  }

  // Part 2 state
  const [deckOrder, setDeckOrder] = useState<number[]>(() => shuffleIndices(A2_CUE_CARDS.length));
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [p2Phase, setP2Phase]     = useState<Part2Phase>('idle');
  const [p2Time, setP2Time]       = useState(0);
  const [cardsPracticed, setCardsPracticed] = useState(0);
  const [practicedIds, setPracticedIds] = useState<Set<string>>(new Set());

  // ── Student progress (persisted, deck='a2') ──────────────────────
  const [teacherId, setTeacherId] = useState<string>('');
  const [activeStudent, setActiveStudent] = useState<string>('');
  const [studentList, setStudentList] = useState<CueCardProgress[]>([]);
  const [studentPickerOpen, setStudentPickerOpen] = useState(false);
  const [newStudentInput, setNewStudentInput] = useState('');
  const [studentHydrating, setStudentHydrating] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    if (auth.currentUser) { setTeacherId(auth.currentUser.uid); return; }
    const unsub = onAuthStateChanged(auth, (u) => setTeacherId(u?.uid ?? ''));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!teacherId) return;
    let alive = true;
    listCueCardStudents(teacherId, 'a2')
      .then((list) => { if (alive) setStudentList(list); })
      .catch((err) => console.error('[a2-speaking] list students:', err));
    return () => { alive = false; };
  }, [teacherId]);

  useEffect(() => {
    if (!teacherId) return;
    if (!activeStudent) {
      setPracticedIds(new Set());
      return;
    }
    let alive = true;
    setStudentHydrating(true);
    loadCueCardProgress(teacherId, activeStudent, 'a2')
      .then((progress) => {
        if (!alive) return;
        setPracticedIds(new Set(progress?.practicedCardIds ?? []));
      })
      .catch((err) => console.error('[a2-speaking] load progress:', err))
      .finally(() => { if (alive) setStudentHydrating(false); });
    return () => { alive = false; };
  }, [teacherId, activeStudent]);

  function selectStudent(name: string) {
    setActiveStudent(name);
    setStudentPickerOpen(false);
    setNewStudentInput('');
  }

  function clearStudent() {
    setActiveStudent('');
    setStudentPickerOpen(false);
  }

  function addNewStudent() {
    const name = newStudentInput.trim();
    if (!name) return;
    selectStudent(name);
    setStudentList((prev) => {
      const key = name.toLowerCase();
      if (prev.some(s => s.studentName.toLowerCase() === key)) return prev;
      return [
        { teacherId, studentName: name, studentNameKey: key, practicedCardIds: [] },
        ...prev,
      ];
    });
  }

  const backGradients = useMemo(
    () => A2_CUE_CARDS.map((_, i) => BACK_GRADIENTS[i % BACK_GRADIENTS.length]),
    [],
  );

  const pickedCard = pickedIdx != null ? A2_CUE_CARDS[pickedIdx] : null;

  const availableDeck = useMemo(
    () => deckOrder.filter(cardIdx => !practicedIds.has(A2_CUE_CARDS[cardIdx].id)),
    [deckOrder, practicedIds],
  );

  // ── Part 1 / Part 3 timer drivers ──────────────────────────────
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

  // Persist practiced-card set on done — same pattern as IELTS page.
  useEffect(() => {
    if (p2Phase !== 'done' || !pickedCard) return;
    setPracticedIds(prev => {
      if (prev.has(pickedCard.id)) return prev;
      const next = new Set(prev);
      next.add(pickedCard.id);
      if (teacherId && activeStudent) {
        saveCueCardProgress({
          teacherId,
          studentName:      activeStudent,
          practicedCardIds: Array.from(next),
          deck:             'a2',
        }).catch((err) => console.error('[a2-speaking] save progress:', err));
      }
      return next;
    });
  }, [p2Phase, pickedCard, teacherId, activeStudent]);

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
    setDeckOrder(shuffleIndices(A2_CUE_CARDS.length));
  }
  function resetPracticedDeck() {
    if (p2Phase !== 'idle') return;
    setPracticedIds(new Set());
    setDeckOrder(shuffleIndices(A2_CUE_CARDS.length));
    if (teacherId && activeStudent) {
      deleteCueCardProgress(teacherId, activeStudent, 'a2')
        .catch((err) => console.error('[a2-speaking] delete progress:', err));
      setStudentList((prev) => prev.map((s) =>
        s.studentName.toLowerCase() === activeStudent.toLowerCase()
          ? { ...s, practicedCardIds: [] }
          : s,
      ));
    }
  }
  function startPrep()     { setP2Phase('prep'); setP2Time(PREP_SECONDS); }
  function startSpeaking() { setP2Phase('speaking'); setP2Time(SPEAKING_SECONDS); }
  function finishCard()    { setP2Phase('done'); setCardsPracticed(n => n + 1); }
  function nextCard()      { setPickedIdx(null); setP2Phase('idle'); setP2Time(0); setDeckOrder(shuffleIndices(A2_CUE_CARDS.length)); }
  function resetP2()       { setPickedIdx(null); setP2Phase('idle'); setP2Time(0); }

  const p2TotalSec = p2Phase === 'prep' ? PREP_SECONDS : p2Phase === 'speaking' ? SPEAKING_SECONDS : 0;
  const p2Progress = p2TotalSec > 0 ? ((p2TotalSec - p2Time) / p2TotalSec) * 100 : 0;

  const partMeta: Record<Part, { name: string; sub: string; minutes: string }> = {
    1: { name: 'Interview',  sub: 'About you · everyday topics', minutes: '~4 min' },
    2: { name: 'Long turn',  sub: 'Cue card · description',      minutes: '~2 min' },
    3: { name: 'Focus Q&A',  sub: 'Grammar-focused questions',   minutes: '~3 min' },
  };

  const timerFloating =
    (part === 1 && p1Phase !== 'idle') ||
    (part === 2 && (p2Phase === 'prep' || p2Phase === 'speaking')) ||
    (part === 3 && p3Phase !== 'idle');

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#F7FFFB] text-[#134E4A]">
      {/* Ambient background — teal glow to distinguish from IELTS purple. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(15,118,110,1) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(15,118,110,1) 1px, transparent 1px)',
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
            'radial-gradient(60rem 40rem at 50% -10%, rgba(94,234,212,0.35) 0%, transparent 60%),' +
            'radial-gradient(45rem 30rem at 10% 90%, rgba(251,146,60,0.15) 0%, transparent 60%),' +
            'radial-gradient(45rem 30rem at 95% 15%, rgba(20,184,166,0.20) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 p-6">
        <FullscreenButton />
        <TopBar
          title="A1-A2+ Speaking Simulator"
          subtitle="3 parts · present · past · future · preferences · experiences"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Tools', href: '/dashboard/teacher/tools' },
            { label: 'A1-A2+ Speaking' },
          ]}
          actions={
            <span className="text-xs text-gray-500 hidden sm:inline">
              Cards practised: <strong className="text-[#0F766E]">{cardsPracticed}</strong>
            </span>
          }
        />

        <div className={`max-w-6xl mx-auto mt-8 ${timerFloating ? 'pb-28' : ''}`}>

          {/* Hero */}
          <div className="text-center mb-8 space-y-3">
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#0F766E] bg-[#CCFBF1] border border-[#5EEAD4]/60 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FB923C] animate-pulse" />
              Level A1-A2+ · Speaking
            </span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-[#134E4A] leading-tight tracking-tight">
              Speaking<span className="text-[#FB923C]"> ·</span> Elementary Simulator
            </h1>
            <p className="text-sm text-[#0F766E]/80 max-w-lg mx-auto">
              Practice speaking in short, natural exchanges. Grammar-focused
              chips let you drill present, past, future, preferences and
              experiences one at a time.
            </p>
          </div>

          {/* Part selector */}
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
                      ? 'bg-gradient-to-br from-[#0F766E] to-[#14B8A6] border-transparent text-white shadow-lg shadow-[#0F766E]/25'
                      : 'bg-white border-[#A7F3D0] hover:border-[#5EEAD4] hover:shadow-md text-[#0F766E]'
                  }`}
                >
                  {active && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#FB923C]/20 rounded-full blur-2xl pointer-events-none" />
                  )}
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-black tracking-[0.3em] ${active ? 'text-[#FED7AA]' : 'text-[#14B8A6]'}`}>
                      PART {String(p).padStart(2, '0')}
                    </span>
                    <span className={`text-[10px] font-semibold ${active ? 'text-white/80' : 'text-gray-400'}`}>
                      {meta.minutes}
                    </span>
                  </div>
                  <p className={`font-serif text-lg font-bold leading-tight ${active ? 'text-white' : 'text-[#134E4A]'}`}>
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

            <div className="w-full max-w-xl bg-white rounded-2xl shadow-md shadow-[#A7F3D0]/40 border border-[#A7F3D0] p-6 space-y-3 text-[#134E4A]">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[10px] font-black text-[#0F766E] uppercase tracking-[0.25em]">Part 01 · Interview</p>
                <TipsButton onClick={() => setTipsOpen(1)} />
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#134E4A]">Familiar topics about you</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Simple questions about your life. Speak in 2-3 sentences per answer.
                Duration: <strong className="text-[#0F766E]">~4 minutes</strong>.
              </p>
            </div>

            {!p1Topic ? (
              <div className="w-full max-w-xl bg-gradient-to-br from-[#F0FDF4] via-[#ECFDF5] to-[#FEF3E2] rounded-2xl shadow-md shadow-[#A7F3D0]/30 border border-[#A7F3D0] p-7 text-center space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0F766E]/80">Choose how to start</p>
                <p className="text-[#134E4A] text-base font-serif">
                  {A2_PART1_TOPICS.length} topics in the bank · 4 questions each
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
                  <button
                    onClick={startP1Mock}
                    className="px-6 py-3 bg-gradient-to-r from-[#0F766E] to-[#14B8A6] text-white rounded-full text-sm font-bold shadow-lg shadow-[#0F766E]/25 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all inline-flex items-center gap-2 justify-center"
                  >
                    📋 Start full mock (3 topics)
                  </button>
                  <button
                    onClick={rollP1Topic}
                    className="px-6 py-3 bg-white border-2 border-[#5EEAD4] text-[#0F766E] rounded-full text-sm font-bold hover:bg-[#CCFBF1] active:scale-95 inline-flex items-center gap-2 justify-center"
                  >
                    <span style={{ display: 'inline-block', animation: 'p1DiceSpin 600ms ease-in-out' }} key={p1RollKey}>🎲</span>
                    Free practice — random topic
                  </button>
                </div>
                <p className="text-[11px] text-[#0F766E]/60">
                  Mock: About you → Daily routine → 1 random topic. Timer auto-starts.
                </p>
              </div>
            ) : (
              <div className="w-full max-w-xl space-y-4" key={`topic-${p1RollKey}`}>
                {p1MockQueue && (
                  <div className="flex items-center justify-center gap-2">
                    {p1MockQueue.map((_, i) => (
                      <span
                        key={i}
                        className={`h-2 rounded-full transition-all ${
                          i < p1MockIdx
                            ? 'w-6 bg-[#0F766E]'
                            : i === p1MockIdx
                              ? 'w-10 bg-gradient-to-r from-[#0F766E] to-[#14B8A6]'
                              : 'w-6 bg-[#A7F3D0]'
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-[#0F766E] ml-2">
                      Topic {p1MockIdx + 1} of {p1MockQueue.length}
                    </span>
                  </div>
                )}

                <div
                  className="bg-gradient-to-br from-[#0F766E] via-[#14B8A6] to-[#5EEAD4] text-white rounded-2xl shadow-xl shadow-[#0F766E]/30 p-7 text-center space-y-2"
                  style={{ animation: 'p1TopicIn 600ms cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
                >
                  <span className="text-7xl block">{p1Topic.emoji}</span>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/70">
                    {p1MockQueue ? `Mock · topic ${p1MockIdx + 1}` : 'Your topic'}
                  </p>
                  <h2 className="text-2xl md:text-3xl font-serif font-bold leading-tight">
                    {p1Topic.name}
                  </h2>
                </div>

                <div className="bg-white rounded-2xl shadow-md shadow-[#A7F3D0]/30 border border-[#A7F3D0] p-5 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0F766E]/80">Questions to develop</p>
                  <div className="space-y-2">
                    {p1Topic.questions.map((q, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-[#F0FDF4] border border-[#A7F3D0]"
                        style={{
                          animation: `p1QuestionIn 350ms ease-out both`,
                          animationDelay: `${250 + i * 90}ms`,
                        }}
                      >
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[#0F766E] to-[#14B8A6] text-white text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <p className="text-sm md:text-base text-[#134E4A] leading-snug pt-0.5">{q}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 justify-center">
                  {p1MockQueue ? (
                    p1MockIdx < p1MockQueue.length - 1 ? (
                      <button
                        onClick={nextP1MockTopic}
                        className="px-5 py-2 bg-gradient-to-r from-[#0F766E] to-[#14B8A6] text-white rounded-full text-sm font-bold shadow-lg shadow-[#0F766E]/25 hover:shadow-xl active:scale-95"
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
                      className="px-5 py-2 bg-white border-2 border-[#5EEAD4] text-[#0F766E] rounded-full text-sm font-bold hover:bg-[#CCFBF1] active:scale-95"
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
              label="Part 1 timer (4 min)"
              sectionLabel="Part 01 · Interview"
              accentClass="text-[#0F766E]"
              phase={p1Phase}
              timeLeft={p1Time}
              onStart={() => { setP1Time(PART1_SECONDS); setP1Phase('running'); }}
              onStop={() => setP1Phase('done')}
              onReset={() => { setP1Time(PART1_SECONDS); setP1Phase('idle'); }}
            />
          </div>
        )}

        {/* ── Part 2 ──────────────────────────────────────────────── */}
        {part === 2 && p2Phase === 'idle' && (
          <div className="space-y-6">
            <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-md shadow-[#A7F3D0]/40 border border-[#A7F3D0] p-5 space-y-2 text-[#134E4A]">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[10px] font-black text-[#0F766E] uppercase tracking-[0.25em]">Part 02 · Long turn</p>
                <TipsButton onClick={() => setTipsOpen(2)} />
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Pick a cue card. You have <strong className="text-[#0F766E]">45 seconds</strong> to prepare and <strong className="text-[#0F766E]">90 seconds</strong> to speak.
              </p>
            </div>

            {/* Student picker — persisted per (teacher, student) */}
            <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-md shadow-[#A7F3D0]/40 border border-[#A7F3D0] p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-[#0F766E] uppercase tracking-[0.25em]">Progreso del alumno</p>
                  <p className="text-sm text-[#134E4A] truncate">
                    {studentHydrating ? (
                      <span className="text-gray-400">Cargando…</span>
                    ) : activeStudent ? (
                      <>
                        <strong>{activeStudent}</strong>
                        <span className="text-gray-500 font-normal"> · {practicedIds.size} de {A2_CUE_CARDS.length} practicadas</span>
                      </>
                    ) : (
                      <span className="text-gray-500">Práctica libre <span className="text-gray-400">· no se guarda progreso</span></span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setStudentPickerOpen((v) => !v)}
                  className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full bg-[#CCFBF1] text-[#0F766E] hover:bg-[#A7F3D0] active:scale-95 transition-all"
                >
                  {activeStudent ? 'Cambiar' : 'Elegir alumno'}
                </button>
              </div>

              {studentPickerOpen && (
                <div className="space-y-3 pt-1 border-t border-[#CCFBF1]">
                  {studentList.length > 0 && (
                    <div className="pt-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Alumnos guardados</p>
                      <div className="flex flex-wrap gap-1.5">
                        {studentList.map((s) => {
                          const isActive = s.studentName.toLowerCase() === activeStudent.toLowerCase();
                          const count = s.practicedCardIds?.length ?? 0;
                          return (
                            <button
                              key={s.studentNameKey || s.studentName}
                              onClick={() => selectStudent(s.studentName)}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-full transition-all inline-flex items-center gap-1.5 ${
                                isActive
                                  ? 'bg-[#0F766E] text-white'
                                  : 'bg-gray-100 text-[#134E4A] hover:bg-[#CCFBF1]'
                              }`}
                            >
                              <span>{s.studentName}</span>
                              <span className={`text-[10px] font-mono ${isActive ? 'text-white/70' : 'text-gray-400'}`}>
                                {count}/{A2_CUE_CARDS.length}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Nuevo alumno</p>
                    <div className="flex gap-2">
                      <input
                        value={newStudentInput}
                        onChange={(e) => setNewStudentInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') addNewStudent(); }}
                        placeholder="Nombre del alumno"
                        className="flex-1 min-w-0 px-3 py-1.5 border border-[#A7F3D0] rounded-lg text-sm focus:outline-none focus:border-[#14B8A6]"
                      />
                      <button
                        onClick={addNewStudent}
                        disabled={!newStudentInput.trim() || !teacherId}
                        className="px-3 py-1.5 bg-[#0F766E] hover:bg-[#134E4A] text-white rounded-lg text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                      >
                        + Agregar
                      </button>
                    </div>
                    {!teacherId && (
                      <p className="text-[10px] text-red-500 mt-1">Iniciá sesión para guardar progreso.</p>
                    )}
                  </div>

                  {activeStudent && (
                    <button
                      onClick={clearStudent}
                      className="text-[11px] font-semibold text-gray-400 hover:text-gray-600"
                    >
                      Volver a práctica libre
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="text-center">
              <p className="text-[#0F766E] font-serif font-bold text-xl mb-1">Pick a cue card</p>
              <p className="text-gray-500 text-sm">
                {availableDeck.length > 0
                  ? 'Click any card, or let luck decide.'
                  : 'Ya practicaste todas las cue cards de esta sesión.'}
              </p>
            </div>

            {availableDeck.length > 0 ? (
              <>
                <div className="flex justify-center gap-3 flex-wrap">
                  <button onClick={pickRandom} className="px-5 py-2.5 bg-gradient-to-r from-[#0F766E] to-[#14B8A6] text-white rounded-full text-sm font-bold shadow-lg shadow-[#0F766E]/25 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95">
                    🎲 Pick random
                  </button>
                  <button onClick={shuffleDeck} className="px-5 py-2.5 bg-white border-2 border-[#5EEAD4] text-[#0F766E] rounded-full text-sm font-bold hover:bg-[#CCFBF1] active:scale-95">
                    🔀 Shuffle
                  </button>
                  {practicedIds.size > 0 && (
                    <button onClick={resetPracticedDeck} className="px-4 py-2.5 bg-white border-2 border-[#A7F3D0] text-[#14B8A6] rounded-full text-xs font-bold hover:bg-[#F0FDF4] active:scale-95">
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
                        card={A2_CUE_CARDS[cardIdx]}
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
              <div className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-md shadow-[#A7F3D0]/40 border border-[#A7F3D0] p-6 text-center space-y-4">
                <div className="text-5xl">🎉</div>
                <p className="text-[#0F766E] font-serif font-bold text-lg">Deck completo</p>
                <p className="text-sm text-gray-500">
                  Recorriste las {A2_CUE_CARDS.length} cue cards del banco. Reseteá el deck para arrancar otra vuelta.
                </p>
                <button
                  onClick={resetPracticedDeck}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#0F766E] to-[#14B8A6] text-white rounded-full text-sm font-bold shadow active:scale-95"
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

            {(p2Phase === 'revealed' || p2Phase === 'done') && (
              <div className="w-full max-w-xl bg-white rounded-2xl shadow-md shadow-[#A7F3D0]/40 border border-[#A7F3D0] p-5 space-y-4">
                {p2Phase === 'revealed' && (
                  <div className="text-center space-y-3">
                    <p className="text-sm text-[#0F766E] font-semibold">
                      🕐 45 seconds to prepare · then 90 seconds to speak
                    </p>
                    <div className="flex gap-2 justify-center pt-1">
                      <button onClick={startPrep} className="px-5 py-2.5 bg-gradient-to-r from-[#0F766E] to-[#14B8A6] text-white rounded-full text-sm font-bold shadow-lg shadow-[#0F766E]/25 active:scale-95">
                        ⏱ Start prep (45s)
                      </button>
                      <button onClick={startSpeaking} className="px-5 py-2.5 bg-white border-2 border-[#5EEAD4] text-[#0F766E] rounded-full text-sm font-bold hover:bg-[#CCFBF1] active:scale-95">
                        Skip → Speak (90s)
                      </button>
                    </div>
                  </div>
                )}

                {p2Phase === 'done' && (
                  <div className="text-center space-y-3">
                    <p className="text-3xl">🎉</p>
                    <p className="text-[#0F766E] font-serif font-bold text-lg">Great job!</p>
                    <p className="text-sm text-gray-500">Total practised: <strong className="text-[#0F766E]">{cardsPracticed}</strong></p>
                    <div className="flex gap-2 justify-center pt-1">
                      <button onClick={nextCard} className="px-5 py-2.5 bg-gradient-to-r from-[#0F766E] to-[#14B8A6] text-white rounded-full text-sm font-bold shadow active:scale-95">
                        🗣️ Next cue card
                      </button>
                      <button onClick={() => setPart(3)} className="px-5 py-2.5 bg-white border-2 border-[#5EEAD4] text-[#0F766E] rounded-full text-sm font-bold hover:bg-[#CCFBF1] active:scale-95">
                        → Continue to Part 3
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {(p2Phase === 'prep' || p2Phase === 'speaking') && (
              <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-2xl">
                <div className="bg-white/95 backdrop-blur-md rounded-full shadow-2xl shadow-[#0F766E]/30 border border-[#A7F3D0] pl-5 pr-3 py-2.5 flex items-center gap-3">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] font-black text-[#0F766E] uppercase tracking-[0.25em] leading-none">
                      Part 02 · {p2Phase === 'prep' ? 'Preparation' : 'Speaking'}
                    </span>
                    <span className={`text-lg font-black font-mono tabular-nums leading-tight ${p2Phase === 'prep' ? 'text-[#14B8A6]' : 'text-[#0F766E]'}`}>
                      {fmt(p2Time)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 h-1.5 bg-[#CCFBF1] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-[width] ${p2Phase === 'prep' ? 'bg-[#14B8A6]' : 'bg-gradient-to-r from-[#0F766E] to-[#14B8A6]'}`}
                      style={{ width: `${p2Progress}%` }}
                    />
                  </div>
                  {p2Phase === 'prep' ? (
                    <button
                      onClick={startSpeaking}
                      className="shrink-0 px-4 py-1.5 bg-gradient-to-r from-[#0F766E] to-[#14B8A6] text-white rounded-full text-xs font-bold shadow active:scale-95"
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

            <div className="w-full max-w-xl bg-white rounded-2xl shadow-md shadow-[#A7F3D0]/40 border border-[#A7F3D0] p-6 space-y-3 text-[#134E4A]">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[10px] font-black text-[#0F766E] uppercase tracking-[0.25em]">Part 03 · Focus Q&A</p>
                <TipsButton onClick={() => setTipsOpen(3)} />
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#134E4A]">Grammar-focused questions</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Tap a chip to draw a question that drills that grammar point.
                Answers should be 2-4 short sentences.
                Duration: <strong className="text-[#0F766E]">~3 minutes</strong>.
              </p>
            </div>

            {/* Focus picker */}
            <div className="w-full max-w-3xl">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {(['present', 'past', 'future', 'preferences', 'experiences'] as A2Focus[]).map(f => {
                  const style = FOCUS_STYLES[f];
                  const active = p3ActiveFocus === f;
                  return (
                    <button
                      key={f}
                      onClick={() => pickP3Question(f)}
                      className={`relative overflow-hidden rounded-2xl p-4 text-left text-white shadow-lg shadow-black/10 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all bg-gradient-to-br ${style.gradient} ${active ? 'ring-4 ring-white' : ''}`}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">{style.label}</div>
                      <div className="text-lg md:text-xl font-extrabold leading-tight mt-1">{style.emoji} {style.label}</div>
                      <div className="text-[10px] font-medium opacity-80 mt-2 leading-snug">{style.tagline}</div>
                    </button>
                  );
                })}
              </div>
              <p className="text-center text-[11px] text-gray-500 mt-3">
                {A2_PART3_QUESTIONS.length} questions in the bank
                {p3Streak > 0 && <> · drawn this session: <strong className="text-[#0F766E]">{p3Streak}</strong></>}
              </p>
            </div>

            {p3Question && (
              <div className="w-full max-w-xl space-y-3" key={`q3-${p3RollKey}`}>
                <div
                  className={`relative rounded-2xl p-6 text-white shadow-xl shadow-black/15 overflow-hidden bg-gradient-to-br ${FOCUS_STYLES[p3Question.focus].gradient}`}
                  style={{ animation: 'p3QuestionIn 500ms cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
                >
                  <div className="flex items-center justify-between mb-4 gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
                      🎯 {FOCUS_STYLES[p3Question.focus].label}
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
                  <button
                    onClick={() => pickP3Question(p3Question.focus)}
                    className="px-4 py-2 bg-white border-2 border-[#5EEAD4] text-[#0F766E] rounded-full text-sm font-bold hover:bg-[#CCFBF1] active:scale-95"
                  >
                    🔀 Another {FOCUS_STYLES[p3Question.focus].label} question
                  </button>
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
              label="Part 3 timer (3 min)"
              sectionLabel="Part 03 · Focus Q&A"
              accentClass="text-[#0F766E]"
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

function shuffleIndices(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
