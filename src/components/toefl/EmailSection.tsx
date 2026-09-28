// FriendlyTeaching.cl — TOEFL Writing sub-task 2: Write an Email
//
// Split view: received email on the left (with sender/subject/body and
// the 3 key points the student must address), student's reply textarea
// on the right. 7-minute timer, ≥90-word soft floor. AI-graded on
// task response + organisation + language use (0-5).
//
// Same autosave contract as WritingSection so a mid-task refresh keeps
// the draft.

'use client';
import { useEffect, useMemo, useState } from 'react';
import type { TOEFLEmailPrompt, EmailSubmission } from '@/types/toefl';
import { useCountdown } from '@/hooks/useCountdown';
import { SampleAnswerModal } from './SampleAnswerModal';
import {
  B, TaskRibbon, TimerPill, WordCountMeter, AutosaveChip, SubmitButton, BrandCard,
} from './MockShell';

export interface EmailSectionProps {
  prompt:      TOEFLEmailPrompt;
  onDone:      (submission: EmailSubmission) => void;
  initialText?: string;
  onSnapshot?: (text: string) => void;
  confirmSubmit?: boolean;
  practiceMode?: boolean;
}

export function EmailSection({
  prompt, onDone, initialText, onSnapshot, confirmSubmit, practiceMode,
}: EmailSectionProps) {
  const [text, setText] = useState(initialText ?? '');
  const [sampleOpen, setSampleOpen] = useState(false);
  const totalSec = prompt.timerMin * 60;
  const left = useCountdown(totalSec, !practiceMode, practiceMode ? undefined : () => submit(true));
  const wordCount = useMemo(() => text.trim().split(/\s+/).filter(Boolean).length, [text]);
  const canShowSample = practiceMode && !!prompt.sampleAnswer;

  useEffect(() => {
    onSnapshot?.(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  function submit(auto = false) {
    if (!auto && confirmSubmit && wordCount < prompt.minWords) {
      const ok = confirm(
        `Solo llevas ${wordCount} palabras (mínimo ${prompt.minWords}). ¿Enviar igual?`,
      );
      if (!ok) return;
    }
    const submission: EmailSubmission = { promptId: prompt.id, text, wordCount };
    onDone(submission);
  }

  return (
    <div className="w-full max-w-5xl pb-24 space-y-4">
      <TaskRibbon
        taskNumber={2}
        taskName="Write an Email"
        emoji="📧"
        title="Responde el email — resuelve, no describas."
        subtitle={`Mínimo ${prompt.minWords} palabras · ${prompt.timerMin} min · cubre los 3 puntos`}
        right={<TimerPill leftSec={left} practiceMode={practiceMode} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Prompt panel (received email + key points) ─────── */}
        <BrandCard scroll>
          {prompt.scenario && (
            <p className="text-[12px] text-gray-600 leading-relaxed mb-4">{prompt.scenario}</p>
          )}

          {/* Fake email client — inbox card */}
          <div
            className="rounded-2xl overflow-hidden mb-4"
            style={{
              background: '#FDFAFF',
              border:     '1px solid #E8D5F0',
              boxShadow:  'inset 0 1px 0 rgba(255,255,255,0.9)',
            }}
          >
            <div className="px-3.5 py-2.5 flex items-center gap-2"
              style={{ background: B.lavenderBg, borderBottom: '1px solid #E8D5F0' }}>
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] ml-1"
                style={{ color: B.purple }}>
                Inbox · 1 new
              </span>
            </div>

            <div className="px-4 py-3 space-y-2 text-[12px]">
              <div className="grid grid-cols-[46px_1fr] gap-x-2 gap-y-1 items-baseline">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#5A3D7A]/60">From</span>
                <span className="text-[#2D1B4E] truncate">{prompt.receivedEmail.from}</span>

                <span className="text-[9px] font-black uppercase tracking-widest text-[#5A3D7A]/60">Subj.</span>
                <span className="font-bold text-[#2D1B4E]">{prompt.receivedEmail.subject}</span>
              </div>
              <div className="pt-2 border-t border-[#F0E5FF] text-gray-700 leading-relaxed whitespace-pre-line">
                {prompt.receivedEmail.body}
              </div>
            </div>
          </div>

          {/* 3 key points — big numbered cards */}
          <div className="rounded-2xl p-4"
            style={{
              background: 'linear-gradient(135deg, rgba(232,181,71,0.12) 0%, rgba(232,181,71,0.04) 100%)',
              border:     `1px solid ${B.gold}55`,
            }}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-3"
              style={{ color: B.goldDeep }}>
              ✦ Cubre estos 3 puntos
            </p>
            <ol className="space-y-2">
              {prompt.keyPoints.map((k, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span
                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-white"
                    style={{ background: `linear-gradient(135deg,${B.gold},${B.goldDeep})` }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-[12px] text-[#2D1B4E] leading-relaxed">{k}</span>
                </li>
              ))}
            </ol>
            {prompt.taskInstruction && (
              <p className="text-[10px] text-[#78350F]/80 mt-3 italic border-t border-[#F5E5C4] pt-2">
                {prompt.taskInstruction}
              </p>
            )}
          </div>
        </BrandCard>

        {/* ── Editor panel ───────────────────────────────────── */}
        <BrandCard className="self-start">
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <span
              className="text-[10px] font-black uppercase tracking-[0.3em]"
              style={{ color: B.purpleMed }}
            >
              📮 Tu respuesta
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
                  title="Ver un email modelo score 5/5"
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
            placeholder={'Hola…\n\n(Contesta directo. Salúdalo, resuelve los 3 puntos y cierra con una línea de despedida.)'}
            spellCheck
            className="w-full min-h-[420px] px-4 py-3.5 rounded-2xl text-[15px] text-[#2D1B4E] leading-relaxed focus:outline-none resize-y transition-shadow"
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
              ✓ Continuar al Debate →
            </SubmitButton>
          </div>
        </BrandCard>
      </div>

      {sampleOpen && prompt.sampleAnswer && (
        <SampleAnswerModal
          title="Email modelo · score 5/5"
          text={prompt.sampleAnswer.text}
          whyItWorks={prompt.sampleAnswer.whyItWorks}
          onClose={() => setSampleOpen(false)}
        />
      )}
    </div>
  );
}
