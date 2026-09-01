// FriendlyTeaching.cl — TOEFL Writing Task 2 (Academic Discussion) runner
//
// Reusable across the live full-mock (/toefl-mock/…) and the async
// assignment flow (/toefl-writing/…). 10-minute timer, split view
// (prompt on the left, editor on the right), word-count meter vs
// minWords, and — critical for classroom use — a debounced autosave
// callback so a mid-task refresh or crash doesn't wipe 200 words.

'use client';
import { useEffect, useMemo, useState } from 'react';
import type {
  TOEFLWritingPrompt, WritingSubmission, TOEFLLiveSnapshot,
} from '@/types/toefl';
import { useCountdown } from '@/hooks/useCountdown';

const B = {
  purple:      '#5A3D7A',
  purpleMed:   '#9B7CB8',
};

export interface WritingSectionProps {
  prompt:      TOEFLWritingPrompt;
  onDone:      (submission: WritingSubmission) => void;
  /** If present, prefill the textarea (hydration from a saved snapshot). */
  initialText?: string;
  /** Called on every text change (debounced by the parent if needed). */
  onSnapshot?: (snap: Omit<TOEFLLiveSnapshot, 'section'>) => void;
  /** When true, prompt the user to confirm before submitting a short draft.
   *  Off by default so the live mock timer's auto-submit doesn't get blocked. */
  confirmSubmit?: boolean;
}

export function WritingSection({
  prompt, onDone, initialText, onSnapshot, confirmSubmit,
}: WritingSectionProps) {
  const [text, setText] = useState(initialText ?? '');
  const totalSec = prompt.timerMin * 60;
  const left = useCountdown(totalSec, true, () => submit(/* auto */ true));
  const wordCount = useMemo(() => text.trim().split(/\s+/).filter(Boolean).length, [text]);
  const meets = wordCount >= prompt.minWords;

  // Autosave: emit a snapshot on every text change. Parent debounces.
  useEffect(() => {
    if (!onSnapshot) return;
    onSnapshot({
      outerIdx:    0,
      innerIdx:    0,
      timeLeftSec: left,
      writingText: text,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  function submit(auto = false) {
    if (!auto && confirmSubmit && wordCount < prompt.minWords) {
      const ok = confirm(
        `Solo llevas ${wordCount} palabras (mínimo ${prompt.minWords}). ¿Enviar igual?`,
      );
      if (!ok) return;
    }
    onDone({ promptId: prompt.id, text, wordCount });
  }

  return (
    <>
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-4 pb-24">
        <div className="bg-white rounded-2xl p-5 shadow-lg max-h-[80vh] overflow-y-auto"
          style={{ boxShadow: '0 8px 32px -8px rgba(90,61,122,0.15)' }}>
          <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: B.purpleMed }}>
            Writing Task 2 · Academic Discussion
          </span>
          <p className="text-xs text-gray-600 mt-2 whitespace-pre-line leading-relaxed">{prompt.professorPost}</p>

          <div className="mt-4 space-y-3">
            <div className="rounded-lg bg-[#F0E5FF] p-3">
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: B.purple }}>Prof.</p>
              <p className="text-xs text-[#2D1B4E] mt-1 leading-relaxed">{prompt.question}</p>
            </div>
            <div className="rounded-lg bg-white border border-gray-200 p-3">
              <p className="text-[10px] font-bold" style={{ color: B.purpleMed }}>{prompt.studentA.name}</p>
              <p className="text-xs text-gray-700 mt-1 leading-relaxed">{prompt.studentA.text}</p>
            </div>
            <div className="rounded-lg bg-white border border-gray-200 p-3">
              <p className="text-[10px] font-bold" style={{ color: B.purpleMed }}>{prompt.studentB.name}</p>
              <p className="text-xs text-gray-700 mt-1 leading-relaxed">{prompt.studentB.text}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-lg self-start"
          style={{ boxShadow: '0 8px 32px -8px rgba(90,61,122,0.15)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: B.purpleMed }}>Tu respuesta</span>
            <span className={`text-xs font-mono tabular-nums font-bold ${meets ? 'text-emerald-600' : 'text-amber-600'}`}>
              {wordCount} / {prompt.minWords} palabras {meets && '✓'}
            </span>
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            autoFocus
            placeholder="Escribí tu contribución al debate…"
            spellCheck
            className="w-full min-h-[420px] px-4 py-3 rounded-xl border border-[#E8D5F0] text-sm text-[#2D1B4E] leading-relaxed focus:outline-none focus:border-[#9B7CB8] focus:ring-2 focus:ring-[#C8A8DC]/40 font-mono resize-y"
          />
          <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500">
            <span>⏱ {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')} restantes</span>
            {onSnapshot && <span className="text-emerald-600">✓ Autoguardado</span>}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => submit(false)}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all"
            >
              ✓ Submit Writing
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
