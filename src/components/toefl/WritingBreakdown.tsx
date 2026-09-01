// FriendlyTeaching.cl — TOEFL Writing submission review
//
// Reusable across the live-mock ResultsScreen, the teacher's async
// assignment review modal, and the "Ver Writing" modal on the Sesiones
// TOEFL table. Renders the student's text, word count, per-dimension
// rubric (development / organisation / language use), overall feedback
// and strengths / improvements.

'use client';
import type { WritingSubmission, TOEFLWritingPrompt } from '@/types/toefl';

const B = {
  purple:       '#5A3D7A',
  lavenderDark: '#E0D5FF',
};

export function WritingBreakdown({
  submission, prompt,
}: {
  submission: WritingSubmission;
  prompt?:    TOEFLWritingPrompt;
}) {
  const errored = !!submission.aiError;
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-3" style={{ color: B.purple }}>
        ✍️ Writing
      </p>
      {prompt && (
        <details className="rounded-xl border overflow-hidden bg-white mb-3"
          style={{ borderColor: B.lavenderDark }}>
          <summary className="cursor-pointer px-3 py-2 text-[11px] font-black uppercase tracking-widest text-[#5A3D7A] select-none bg-[#FDFAFF]">
            Ver prompt del debate
          </summary>
          <div className="p-3 border-t space-y-2 text-[11px] text-gray-700" style={{ borderColor: B.lavenderDark }}>
            <p className="whitespace-pre-line leading-relaxed">{prompt.professorPost}</p>
            <div className="rounded-lg bg-[#F0E5FF] p-2">
              <p className="font-black uppercase tracking-widest text-[9px]" style={{ color: B.purple }}>Prof.</p>
              <p className="mt-0.5">{prompt.question}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-2">
              <p className="font-bold text-[9px]" style={{ color: B.purple }}>{prompt.studentA.name}</p>
              <p className="mt-0.5">{prompt.studentA.text}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-2">
              <p className="font-bold text-[9px]" style={{ color: B.purple }}>{prompt.studentB.name}</p>
              <p className="mt-0.5">{prompt.studentB.text}</p>
            </div>
          </div>
        </details>
      )}

      <div className="rounded-xl border overflow-hidden bg-white"
        style={{ borderColor: errored ? '#FCA5A5' : B.lavenderDark }}>
        <div className="px-3 py-2 flex items-center justify-between gap-2"
          style={{ background: errored ? '#FEF2F2' : '#FDFAFF' }}>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#5A3D7A]">
            Respuesta · {submission.wordCount} palabras
          </span>
          <span className={`text-sm font-black tabular-nums ${errored ? 'text-red-600' : 'text-[#5A3D7A]'}`}>
            {errored ? '⚠' : submission.aiScore != null ? `${submission.aiScore}/5` : '—'}
          </span>
        </div>
        <div className="p-3 space-y-3 border-t" style={{ borderColor: errored ? '#FECACA' : B.lavenderDark }}>
          {submission.aiRubric && (
            <div className="grid grid-cols-3 gap-2">
              {(['development', 'organisation', 'languageUse'] as const).map((k) => (
                <div key={k} className="rounded-lg border p-2 text-center" style={{ borderColor: B.lavenderDark }}>
                  <p className="text-[8px] font-black uppercase tracking-widest text-[#5A3D7A]/60">
                    {k === 'development' ? 'Development' : k === 'organisation' ? 'Organisation' : 'Language'}
                  </p>
                  <p className="text-lg font-black tabular-nums" style={{ color: B.purple }}>
                    {submission.aiRubric![k]}/5
                  </p>
                </div>
              ))}
            </div>
          )}
          {submission.text && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#5A3D7A]/60 mb-1">Texto</p>
              <div className="rounded-lg bg-[#FDFAFF] border border-[#E8D5F0] p-3 max-h-72 overflow-y-auto text-[12px] text-gray-800 whitespace-pre-wrap leading-relaxed">
                {submission.text}
              </div>
            </div>
          )}
          {submission.aiFeedback && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#5A3D7A]/60 mb-0.5">Feedback</p>
              <p className={`text-[11px] leading-snug ${errored ? 'text-red-700' : 'text-gray-700'}`}>{submission.aiFeedback}</p>
            </div>
          )}
          {submission.aiStrengths && submission.aiStrengths.length > 0 && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700 mb-0.5">✓ Fortalezas</p>
              <ul className="text-[11px] text-emerald-800 list-disc pl-4 space-y-0.5">
                {submission.aiStrengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {submission.aiImprovements && submission.aiImprovements.length > 0 && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-700 mb-0.5">↗ Para mejorar</p>
              <ul className="text-[11px] text-amber-800 list-disc pl-4 space-y-0.5">
                {submission.aiImprovements.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
