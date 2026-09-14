// FriendlyTeaching.cl — TOEFL Writing sub-task 1: Build a Sentence
//
// Chip-based reorder: each item shows the target sentence's words as
// shuffled chips. Student clicks a chip in the bank to append it to
// the built row; clicking a chip inside the built row sends it back to
// the bank. This avoids HTML5 drag-and-drop, which is fussy on touch
// devices and inside the fullscreen container. Auto-graded via exact
// normalised-string match against `correct` / `altCorrect`.
//
// Timer: shared across all items in the bank (~4 min default). When it
// expires — or the student submits — we lock in whatever they have,
// score it, and emit a BuildSentenceAnswer[] to the parent.

'use client';
import { useEffect, useMemo, useState } from 'react';
import type { TOEFLBuildSentenceItem, BuildSentenceAnswer } from '@/types/toefl';
import { useCountdown } from '@/hooks/useCountdown';

const B = {
  purple:    '#5A3D7A',
  purpleMed: '#9B7CB8',
};

export interface BuildSentenceSectionProps {
  items:       TOEFLBuildSentenceItem[];
  timerMin?:   number;     // defaults to 4
  onDone:      (answers: BuildSentenceAnswer[]) => void;
  /** Autosave: called on every chip change with the current answers. */
  onSnapshot?: (answersById: Record<string, string>) => void;
  /** Prefill from a saved snapshot. */
  initial?:    Record<string, string>;
  /** Practice mode: timer is hidden and doesn't auto-submit. Student
   *  advances only by clicking Continuar. */
  practiceMode?: boolean;
}

function normalise(s: string): string {
  return s.trim().toLowerCase().replace(/[.,;:!?]/g, '').replace(/\s+/g, ' ');
}

function isCorrect(answer: string, item: TOEFLBuildSentenceItem): boolean {
  const norm = normalise(answer);
  if (norm === normalise(item.correct)) return true;
  return (item.altCorrect ?? []).some(alt => norm === normalise(alt));
}

// Fisher-Yates. Seeded by index so the shuffle is stable across renders
// of the same item — otherwise the chips would re-shuffle on every click.
function shuffled<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// One item — bank of chips at the top, built row at the bottom. Chips can
// appear more than once in the target sentence, so we key by chip *slot*
// (chip + occurrence index) rather than by chip string.
function BuildSentenceItem({
  item, index, initialBuilt, onChange,
}: {
  item:         TOEFLBuildSentenceItem;
  index:        number;
  initialBuilt: number[];       // slot indices in bank order
  onChange:     (builtSlots: number[]) => void;
}) {
  const bank = useMemo(() => shuffled(item.chips, index + 1), [item, index]);
  const [builtSlots, setBuiltSlots] = useState<number[]>(initialBuilt);

  useEffect(() => { onChange(builtSlots); /* eslint-disable-next-line */ }, [builtSlots]);

  const usedSet = new Set(builtSlots);
  const builtSentence = builtSlots.map(i => bank[i]).join(' ');
  const answered = builtSlots.length > 0;

  return (
    <div className="rounded-2xl bg-white border p-4 space-y-3"
      style={{ borderColor: '#E8D5F0' }}>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#5A3D7A]/60">
          {index + 1} / ·
        </span>
        <span className="text-[12px] text-gray-700">{item.prompt}</span>
      </div>

      <div className="rounded-xl border border-dashed border-[#C8A8DC]/60 bg-[#FDFAFF] min-h-[52px] p-2 flex flex-wrap items-center gap-1.5">
        {answered ? (
          builtSlots.map((slot, i) => (
            <button
              key={`built-${i}-${slot}`}
              onClick={() => setBuiltSlots(prev => prev.filter((_, idx) => idx !== i))}
              className="text-[13px] font-medium px-3 py-1.5 rounded-lg bg-[#5A3D7A] text-white hover:bg-[#4A2D6A] active:scale-95 transition-all shadow-sm"
              title="Quitar de la oración"
            >
              {bank[slot]}
            </button>
          ))
        ) : (
          <span className="text-[11px] text-[#5A3D7A]/40 italic pl-2">
            Toca las palabras abajo para armar la oración…
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {bank.map((chip, slot) => {
          const used = usedSet.has(slot);
          return (
            <button
              key={`bank-${slot}`}
              disabled={used}
              onClick={() => setBuiltSlots(prev => [...prev, slot])}
              className={`text-[13px] font-medium px-3 py-1.5 rounded-lg border transition-all ${
                used
                  ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-[#2D1B4E] border-[#E8D5F0] hover:border-[#9B7CB8] hover:bg-[#F0E5FF] active:scale-95'
              }`}
            >
              {chip}
            </button>
          );
        })}
        {answered && (
          <button
            onClick={() => setBuiltSlots([])}
            className="ml-auto text-[10px] font-bold text-gray-400 hover:text-gray-600 px-2 py-1"
          >
            Limpiar
          </button>
        )}
      </div>

      {answered && (
        <p className="text-[11px] text-[#5A3D7A]/70 italic pl-1">
          → <span className="font-medium">{builtSentence}</span>
        </p>
      )}
    </div>
  );
}

export function BuildSentenceSection({
  items, timerMin = 4, onDone, onSnapshot, initial, practiceMode,
}: BuildSentenceSectionProps) {
  // Per-item bank state, keyed by item id → array of bank slot indices.
  // We keep the strings too (via `answersById`) for autosave/scoring.
  const [answersById, setAnswersById] = useState<Record<string, string>>(initial ?? {});

  const totalSec = timerMin * 60;
  // Practice mode: countdown paused, no auto-submit.
  const left = useCountdown(totalSec, !practiceMode, practiceMode ? undefined : () => submit(/* auto */ true));

  useEffect(() => {
    onSnapshot?.(answersById);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answersById]);

  function submit(auto = false) {
    if (!auto) {
      const filled = items.every(it => (answersById[it.id] ?? '').trim().length > 0);
      if (!filled) {
        const ok = confirm('Hay oraciones sin armar. ¿Enviar de todas formas?');
        if (!ok) return;
      }
    }
    const out: BuildSentenceAnswer[] = items.map(it => {
      const answer = (answersById[it.id] ?? '').trim();
      return { itemId: it.id, answer, correct: answer.length > 0 && isCorrect(answer, it) };
    });
    onDone(out);
  }

  return (
    <div className="w-full max-w-3xl pb-24 space-y-4">
      <div className="bg-white rounded-2xl p-5 shadow-lg"
        style={{ boxShadow: '0 8px 32px -8px rgba(90,61,122,0.15)' }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: B.purpleMed }}>
            Writing Task 1 · Build a Sentence
          </span>
          {!practiceMode && (
            <span className={`text-xs font-mono tabular-nums font-bold ${left < 30 ? 'text-red-600' : 'text-[#5A3D7A]'}`}>
              ⏱ {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          Reorganiza las palabras para formar oraciones correctas en inglés.
          {practiceMode
            ? ` Modo práctica: sin timer, tómate el tiempo que necesites para las ${items.length} oraciones.`
            : ` Tienes ${timerMin} minutos para las ${items.length} oraciones.`}
        </p>
      </div>

      {items.map((item, i) => (
        <BuildSentenceItem
          key={item.id}
          item={item}
          index={i}
          initialBuilt={[]}
          onChange={(slots) => {
            // slots → strings requires knowing the bank; recompute here.
            const bank = shuffled(item.chips, i + 1);
            const answer = slots.map(s => bank[s]).join(' ');
            setAnswersById(prev => ({ ...prev, [item.id]: answer }));
          }}
        />
      ))}

      <div className="flex items-center justify-between pt-2">
        {onSnapshot && <span className="text-[10px] text-emerald-600">✓ Autoguardado</span>}
        <button
          onClick={() => submit(false)}
          className="ml-auto px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all"
        >
          ✓ Continuar al Email →
        </button>
      </div>
    </div>
  );
}
