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

const B = {
  purple:      '#5A3D7A',
  purpleMed:   '#9B7CB8',
};

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
  const meets = wordCount >= prompt.minWords;
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
    <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-4 pb-24">
      <div className="bg-white rounded-2xl p-5 shadow-lg max-h-[80vh] overflow-y-auto"
        style={{ boxShadow: '0 8px 32px -8px rgba(90,61,122,0.15)' }}>
        <div className="flex items-start justify-between gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: B.purpleMed }}>
            Writing Task 2 · Write an Email
          </span>
          {canShowSample && (
            <button
              type="button"
              onClick={() => setSampleOpen(true)}
              className="shrink-0 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              ⭐ Ver ejemplo
            </button>
          )}
        </div>
        <p className="text-xs text-gray-600 mt-2 leading-relaxed">{prompt.scenario}</p>

        <div className="mt-4 rounded-lg border border-[#E8D5F0] bg-[#FDFAFF] overflow-hidden">
          <div className="px-3 py-2 bg-[#F0E5FF] border-b border-[#E8D5F0]">
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: B.purple }}>From</p>
            <p className="text-[11px] text-[#2D1B4E]">{prompt.receivedEmail.from}</p>
          </div>
          <div className="px-3 py-2 border-b border-[#E8D5F0]">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#5A3D7A]/60">Subject</p>
            <p className="text-[12px] font-bold text-[#2D1B4E]">{prompt.receivedEmail.subject}</p>
          </div>
          <div className="px-3 py-3 text-[12px] text-gray-700 leading-relaxed whitespace-pre-line">
            {prompt.receivedEmail.body}
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-800 mb-1.5">
            Cubre estos 3 puntos
          </p>
          <ol className="text-[11px] text-emerald-900 list-decimal pl-5 space-y-1">
            {prompt.keyPoints.map((k, i) => <li key={i}>{k}</li>)}
          </ol>
          <p className="text-[10px] text-emerald-800/80 mt-2 italic">
            {prompt.taskInstruction}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-lg self-start"
        style={{ boxShadow: '0 8px 32px -8px rgba(90,61,122,0.15)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: B.purpleMed }}>Tu email</span>
          <span className={`text-xs font-mono tabular-nums font-bold ${meets ? 'text-emerald-600' : 'text-amber-600'}`}>
            {wordCount} / {prompt.minWords} palabras {meets && '✓'}
          </span>
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          autoFocus
          placeholder="Escribe tu respuesta al email…"
          spellCheck
          className="w-full min-h-[420px] px-4 py-3 rounded-xl border border-[#E8D5F0] text-sm text-[#2D1B4E] leading-relaxed focus:outline-none focus:border-[#9B7CB8] focus:ring-2 focus:ring-[#C8A8DC]/40 font-mono resize-y"
        />
        <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500">
          {practiceMode ? (
            <span className="text-[#5A3D7A]/60 italic">Modo práctica — sin timer</span>
          ) : (
            <span className={left < 30 ? 'text-red-600 font-bold' : ''}>
              ⏱ {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')} restantes
            </span>
          )}
          {onSnapshot && <span className="text-emerald-600">✓ Autoguardado</span>}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => submit(false)}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all"
          >
            ✓ Continuar al Debate →
          </button>
        </div>
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

