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
import {
  B, TaskRibbon, TimerPill, AutosaveChip, SubmitButton, BrandCard,
} from './MockShell';

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
  item, index, total, initialBuilt, onChange,
}: {
  item:         TOEFLBuildSentenceItem;
  index:        number;
  total:        number;
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
    <div
      className="relative rounded-3xl bg-white overflow-hidden"
      style={{
        border:    '1px solid rgba(200,168,220,0.4)',
        boxShadow: '0 12px 28px -18px rgba(61,37,88,0.20), 0 2px 4px -1px rgba(61,37,88,0.05)',
      }}
    >
      <div aria-hidden className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${B.purple}, ${B.gold})` }} />

      <div className="p-4 space-y-3">
        {/* Item header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black text-white"
              style={{ background: `linear-gradient(135deg,${B.purpleDeep},${B.purpleMed})` }}
            >
              {index + 1}
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.25em]"
              style={{ color: B.purpleMed }}>
              Oración {index + 1} / {total}
            </span>
          </div>
          {answered && (
            <button
              onClick={() => setBuiltSlots([])}
              className="text-[10px] font-bold px-2 py-1 rounded-full hover:bg-[#F0E5FF] transition-colors"
              style={{ color: B.purpleMed }}
            >
              ↺ Limpiar
            </button>
          )}
        </div>

        <p className="text-[13px] text-[#2D1B4E] leading-relaxed font-medium">{item.prompt}</p>

        {/* Built row */}
        <div
          className="rounded-2xl min-h-[56px] p-2.5 flex flex-wrap items-center gap-1.5 transition-all"
          style={{
            background: answered ? '#FDFAFF' : `linear-gradient(135deg, ${B.lavenderBg} 0%, #FDFAFF 100%)`,
            border:     `1.5px dashed ${answered ? B.purpleMed : '#C8A8DC'}`,
          }}
        >
          {answered ? (
            builtSlots.map((slot, i) => (
              <button
                key={`built-${i}-${slot}`}
                onClick={() => setBuiltSlots(prev => prev.filter((_, idx) => idx !== i))}
                className="text-[13px] font-medium px-3 py-1.5 rounded-xl text-white active:scale-95 transition-all"
                style={{
                  background: `linear-gradient(135deg,${B.purple},${B.purpleMed})`,
                  boxShadow:  '0 4px 10px -4px rgba(90,61,122,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
                }}
                title="Quitar de la oración"
              >
                {bank[slot]}
              </button>
            ))
          ) : (
            <span className="text-[11px] italic pl-2" style={{ color: `${B.purple}70` }}>
              Toca las palabras abajo para armar la oración…
            </span>
          )}
        </div>

        {/* Chip bank */}
        <div className="flex flex-wrap items-center gap-1.5">
          {bank.map((chip, slot) => {
            const used = usedSet.has(slot);
            return (
              <button
                key={`bank-${slot}`}
                disabled={used}
                onClick={() => setBuiltSlots(prev => [...prev, slot])}
                className={`text-[13px] font-medium px-3 py-1.5 rounded-xl border transition-all ${
                  used
                    ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-[#2D1B4E] border-[#E8D5F0] hover:border-[#9B7CB8] hover:bg-[#F0E5FF] active:scale-95 hover:-translate-y-0.5'
                }`}
                style={!used ? { boxShadow: '0 2px 6px -2px rgba(90,61,122,0.15)' } : undefined}
              >
                {chip}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="rounded-xl px-3 py-2 text-[11px] italic leading-relaxed"
            style={{
              background: 'rgba(16,185,129,0.08)',
              color:      '#065F46',
              border:     '1px solid rgba(16,185,129,0.25)',
            }}
          >
            → <span className="font-semibold not-italic">{builtSentence}</span>
          </div>
        )}
      </div>
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

  const answeredCount = items.filter(it => (answersById[it.id] ?? '').trim().length > 0).length;

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
      <TaskRibbon
        taskNumber={1}
        taskName="Build a Sentence"
        emoji="🧱"
        title="Reordena las palabras — hazlas sonar naturales."
        subtitle={practiceMode
          ? `Modo práctica · sin timer · ${items.length} oraciones`
          : `${timerMin} min para las ${items.length} oraciones`}
        right={
          <>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#FFF', border: '1px solid rgba(255,255,255,0.25)' }}>
              {answeredCount}/{items.length} listas
            </span>
            <TimerPill leftSec={left} practiceMode={practiceMode} />
          </>
        }
      />

      <BrandCard>
        <p className="text-[12px] text-gray-600 leading-relaxed">
          Toca las palabras <b style={{ color: B.purple }}>de abajo</b> en orden para armar cada oración.
          Toca una palabra ya usada para devolverla al banco.
          {!practiceMode && ' El timer es compartido para las ' + items.length + ' oraciones.'}
        </p>
      </BrandCard>

      {items.map((item, i) => (
        <BuildSentenceItem
          key={item.id}
          item={item}
          index={i}
          total={items.length}
          initialBuilt={[]}
          onChange={(slots) => {
            // slots → strings requires knowing the bank; recompute here.
            const bank = shuffled(item.chips, i + 1);
            const answer = slots.map(s => bank[s]).join(' ');
            setAnswersById(prev => ({ ...prev, [item.id]: answer }));
          }}
        />
      ))}

      <div className="flex items-center justify-between gap-2 pt-2 flex-wrap">
        {onSnapshot && <AutosaveChip />}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[11px] font-bold" style={{ color: B.purple }}>
            {answeredCount}/{items.length} armadas
          </span>
          <SubmitButton onClick={() => submit(false)}>
            ✓ Continuar al Email →
          </SubmitButton>
        </div>
      </div>
    </div>
  );
}
