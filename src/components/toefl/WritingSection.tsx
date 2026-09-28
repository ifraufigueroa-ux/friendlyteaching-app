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
import { SampleAnswerModal } from './SampleAnswerModal';
import {
  B, TaskRibbon, TimerPill, WordCountMeter, AutosaveChip, SubmitButton, BrandCard,
} from './WritingTaskShell';

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
  /** Practice mode: timer hidden, no auto-submit. */
  practiceMode?: boolean;
}

// Turn "Kelly M." → "KM" for the avatar circle.
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function WritingSection({
  prompt, onDone, initialText, onSnapshot, confirmSubmit, practiceMode,
}: WritingSectionProps) {
  const [text, setText] = useState(initialText ?? '');
  const [sampleOpen, setSampleOpen] = useState(false);
  const totalSec = prompt.timerMin * 60;
  const left = useCountdown(totalSec, !practiceMode, practiceMode ? undefined : () => submit(/* auto */ true));
  const wordCount = useMemo(() => text.trim().split(/\s+/).filter(Boolean).length, [text]);
  const canShowSample = practiceMode && !!prompt.sampleAnswer;

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
      <div className="w-full max-w-5xl pb-24 space-y-4">
        <TaskRibbon
          taskNumber={3}
          taskName="Academic Discussion"
          emoji="💬"
          title="Únete al debate — argumenta con claridad."
          subtitle={`Mínimo ${prompt.minWords} palabras · ${prompt.timerMin} min recomendados`}
          right={<TimerPill leftSec={left} practiceMode={practiceMode} />}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ── Prompt panel ─────────────────────────────── */}
          <BrandCard scroll>
            {prompt.professorPost && (
              <p className="text-[12px] text-gray-600 leading-relaxed whitespace-pre-line mb-4">
                {prompt.professorPost}
              </p>
            )}

            {/* Professor question — the anchor of the whole debate */}
            <div
              className="rounded-2xl p-4 mb-3 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${B.lavenderBg} 0%, #E8DBFF 100%)`,
                border:     `1px solid rgba(155,124,184,0.35)`,
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white"
                  style={{ background: `linear-gradient(135deg, ${B.purpleDeep}, ${B.purple})`, boxShadow: '0 4px 10px -4px rgba(90,61,122,0.5)' }}
                >
                  Pf
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.25em]" style={{ color: B.gold }}>
                    Professor
                  </p>
                  <p className="text-[13px] text-[#2D1B4E] mt-0.5 leading-relaxed font-medium">
                    {prompt.question}
                  </p>
                </div>
              </div>
            </div>

            {/* Student A + Student B — chat-style bubbles */}
            {[prompt.studentA, prompt.studentB].map((s, i) => (
              <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
                <div
                  className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-black text-white"
                  style={{
                    background: i === 0
                      ? 'linear-gradient(135deg,#E8B547,#B8860B)'
                      : 'linear-gradient(135deg,#9B7CB8,#5A3D7A)',
                    boxShadow: '0 4px 10px -4px rgba(0,0,0,0.15)',
                  }}
                >
                  {initialsOf(s.name)}
                </div>
                <div
                  className="flex-1 rounded-2xl px-3.5 py-2.5"
                  style={{
                    background: '#FDFAFF',
                    border:     '1px solid #E8D5F0',
                  }}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: B.purpleMed }}>
                    {s.name}
                  </p>
                  <p className="text-[12px] text-gray-700 mt-1 leading-relaxed">{s.text}</p>
                </div>
              </div>
            ))}
          </BrandCard>

          {/* ── Editor panel ─────────────────────────────── */}
          <BrandCard className="self-start">
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <span
                className="text-[10px] font-black uppercase tracking-[0.3em]"
                style={{ color: B.purpleMed }}
              >
                ✍️ Tu contribución
              </span>
              <div className="flex items-center gap-2">
                {canShowSample && (
                  <button
                    type="button"
                    onClick={() => setSampleOpen(true)}
                    className="shrink-0 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full transition-colors"
                    style={{
                      background: 'rgba(232,181,71,0.15)',
                      color:      B.goldDeep,
                      border:     `1px solid ${B.gold}66`,
                    }}
                    title="Ver una respuesta modelo score 5/5"
                  >
                    ⭐ Ver ejemplo
                  </button>
                )}
                <WordCountMeter count={wordCount} min={prompt.minWords} />
              </div>
            </div>

            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              autoFocus
              placeholder="Responde al profe y a tus compañeros — toma postura, da una razón y un ejemplo…"
              spellCheck
              className="w-full min-h-[420px] px-4 py-3.5 rounded-2xl text-[15px] text-[#2D1B4E] leading-relaxed focus:outline-none focus:ring-4 resize-y transition-shadow"
              style={{
                background:  '#FDFAFF',
                border:      '1px solid #E8D5F0',
                fontFamily:  '"Georgia", "Cambria", serif',
                boxShadow:   'inset 0 2px 6px -2px rgba(90,61,122,0.08)',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = B.purpleMed; e.currentTarget.style.boxShadow = `0 0 0 4px ${B.lavenderBg}, inset 0 2px 6px -2px rgba(90,61,122,0.10)`; }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = '#E8D5F0';   e.currentTarget.style.boxShadow = 'inset 0 2px 6px -2px rgba(90,61,122,0.08)'; }}
            />

            <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <TimerPill leftSec={left} practiceMode={practiceMode} />
                {onSnapshot && <AutosaveChip />}
              </div>
              <SubmitButton onClick={() => submit(false)}>
                ✓ Enviar Writing
              </SubmitButton>
            </div>
          </BrandCard>
        </div>
      </div>

      {sampleOpen && prompt.sampleAnswer && (
        <SampleAnswerModal
          title="Respuesta modelo · score 5/5"
          text={prompt.sampleAnswer.text}
          whyItWorks={prompt.sampleAnswer.whyItWorks}
          onClose={() => setSampleOpen(false)}
        />
      )}
    </>
  );
}
