// FriendlyTeaching.cl — TOEFL Writing section review
//
// Post-submit breakdown for the composite Writing section:
//   Task 1 · Build a Sentence (auto-graded)
//   Task 2 · Write an Email (AI-graded)
//   Task 3 · Academic Discussion (AI-graded, keeps its high-score sample)
//
// Reused across the live-mock ResultsScreen, the teacher's async
// assignment review modal, and the "Ver Writing" modal on the Sesiones
// TOEFL table. The parent passes the whole composite submission and the
// sequence definition; each sub-panel is self-rendered here so the three
// call sites stay one-liners.

'use client';
import type {
  WritingSectionSubmission, TOEFLWritingSequence,
  BuildSentenceAnswer, EmailSubmission, WritingSubmission,
  TOEFLBuildSentenceItem, TOEFLEmailPrompt, TOEFLWritingPrompt,
} from '@/types/toefl';

const B = {
  purple:       '#5A3D7A',
  lavenderDark: '#E0D5FF',
};

// ── Task 1 · Build a Sentence ────────────────────────────────────────

function BuildSentencePanel({
  answers, items,
}: {
  answers: BuildSentenceAnswer[];
  items?:  TOEFLBuildSentenceItem[];
}) {
  const total   = answers.length;
  const correct = answers.filter(a => a.correct).length;
  const itemById = new Map((items ?? []).map(it => [it.id, it]));

  return (
    <div className="rounded-xl border overflow-hidden bg-white"
      style={{ borderColor: B.lavenderDark }}>
      <div className="px-3 py-2 flex items-center justify-between gap-2 bg-[#FDFAFF]">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#5A3D7A]">
          Task 1 · Build a Sentence
        </span>
        <span className="text-sm font-black tabular-nums text-[#5A3D7A]">
          {correct} / {total}
        </span>
      </div>
      <ul className="p-3 space-y-2 border-t" style={{ borderColor: B.lavenderDark }}>
        {answers.map((a, i) => {
          const item = itemById.get(a.itemId);
          return (
            <li key={a.itemId} className="text-[12px] leading-snug">
              <div className="flex items-start gap-2">
                <span className={`shrink-0 mt-0.5 text-[10px] font-black uppercase tracking-widest ${a.correct ? 'text-emerald-600' : 'text-red-600'}`}>
                  {a.correct ? '✓' : '✗'} {i + 1}
                </span>
                <div className="min-w-0 space-y-0.5">
                  <p className={a.correct ? 'text-gray-800' : 'text-red-700 line-through decoration-red-300'}>
                    {a.answer || <em className="text-gray-400 not-italic">(sin respuesta)</em>}
                  </p>
                  {!a.correct && item && (
                    <p className="text-[11px] text-emerald-700">
                      <span className="font-black tracking-widest text-[9px] uppercase">Correcto:</span> {item.correct}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Task 2 · Write an Email ──────────────────────────────────────────

function EmailPanel({
  submission, prompt,
}: {
  submission: EmailSubmission;
  prompt?:    TOEFLEmailPrompt;
}) {
  const errored = !!submission.aiError;
  return (
    <div className="space-y-2">
      {prompt && (
        <details className="rounded-xl border overflow-hidden bg-white"
          style={{ borderColor: B.lavenderDark }}>
          <summary className="cursor-pointer px-3 py-2 text-[11px] font-black uppercase tracking-widest text-[#5A3D7A] select-none bg-[#FDFAFF]">
            Ver email recibido
          </summary>
          <div className="p-3 border-t text-[11px] text-gray-700 space-y-1.5" style={{ borderColor: B.lavenderDark }}>
            <p><span className="font-black uppercase tracking-widest text-[9px] text-[#5A3D7A]">De:</span> {prompt.receivedEmail.from}</p>
            <p><span className="font-black uppercase tracking-widest text-[9px] text-[#5A3D7A]">Asunto:</span> {prompt.receivedEmail.subject}</p>
            <p className="whitespace-pre-line leading-relaxed">{prompt.receivedEmail.body}</p>
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 mt-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-800">Puntos a cubrir</p>
              <ol className="list-decimal pl-4 text-emerald-900 space-y-0.5 mt-0.5">
                {prompt.keyPoints.map((k, i) => <li key={i}>{k}</li>)}
              </ol>
            </div>
          </div>
        </details>
      )}

      <div className="rounded-xl border overflow-hidden bg-white"
        style={{ borderColor: errored ? '#FCA5A5' : B.lavenderDark }}>
        <div className="px-3 py-2 flex items-center justify-between gap-2"
          style={{ background: errored ? '#FEF2F2' : '#FDFAFF' }}>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#5A3D7A]">
            Task 2 · Write an Email · {submission.wordCount} palabras
          </span>
          <span className={`text-sm font-black tabular-nums ${errored ? 'text-red-600' : 'text-[#5A3D7A]'}`}>
            {errored ? '⚠' : submission.aiScore != null ? `${submission.aiScore}/5` : '—'}
          </span>
        </div>
        <div className="p-3 space-y-3 border-t" style={{ borderColor: errored ? '#FECACA' : B.lavenderDark }}>
          {submission.aiRubric && (
            <div className="grid grid-cols-3 gap-2">
              {(['taskResponse', 'organisation', 'languageUse'] as const).map((k) => (
                <div key={k} className="rounded-lg border p-2 text-center" style={{ borderColor: B.lavenderDark }}>
                  <p className="text-[8px] font-black uppercase tracking-widest text-[#5A3D7A]/60">
                    {k === 'taskResponse' ? 'Task response' : k === 'organisation' ? 'Organisation' : 'Language'}
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
              <div className="rounded-lg bg-[#FDFAFF] border border-[#E8D5F0] p-3 max-h-60 overflow-y-auto text-[12px] text-gray-800 whitespace-pre-wrap leading-relaxed">
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

      {prompt?.sampleAnswer && (
        <details className="rounded-xl border overflow-hidden bg-white"
          style={{ borderColor: '#A7F3D0' }}>
          <summary className="cursor-pointer px-3 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-800 select-none bg-emerald-50">
            ⭐ Ver email modelo (score {prompt.sampleAnswer.scoreOn5}/5)
          </summary>
          <div className="p-3 border-t border-emerald-100 space-y-3">
            <div className="rounded-lg bg-emerald-50/40 border border-emerald-100 p-3 text-[12px] text-gray-800 whitespace-pre-wrap leading-relaxed">
              {prompt.sampleAnswer.text}
            </div>
            {prompt.sampleAnswer.whyItWorks && prompt.sampleAnswer.whyItWorks.length > 0 && (
              <ul className="text-[11px] text-gray-700 list-disc pl-4 space-y-0.5">
                {prompt.sampleAnswer.whyItWorks.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            )}
          </div>
        </details>
      )}
    </div>
  );
}

// ── Task 3 · Academic Discussion ─────────────────────────────────────

function DiscussionPanel({
  submission, prompt,
}: {
  submission: WritingSubmission;
  prompt?:    TOEFLWritingPrompt;
}) {
  const errored = !!submission.aiError;
  return (
    <div className="space-y-2">
      {prompt && (
        <details className="rounded-xl border overflow-hidden bg-white"
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
            Task 3 · Academic Discussion · {submission.wordCount} palabras
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

      {prompt?.sampleAnswer && (
        <details className="rounded-xl border overflow-hidden bg-white"
          style={{ borderColor: '#A7F3D0' }}>
          <summary className="cursor-pointer px-3 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-800 select-none bg-emerald-50 flex items-center justify-between">
            <span>⭐ Ver respuesta modelo (score {prompt.sampleAnswer.scoreOn5}/5)</span>
            <span className="text-[9px] font-medium text-emerald-700 normal-case tracking-normal">Cómo se ve una respuesta de alto puntaje</span>
          </summary>
          <div className="p-3 border-t border-emerald-100 space-y-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700/70 mb-1">Texto modelo</p>
              <div className="rounded-lg bg-emerald-50/40 border border-emerald-100 p-3 text-[12px] text-gray-800 whitespace-pre-wrap leading-relaxed">
                {prompt.sampleAnswer.text}
              </div>
            </div>
            {prompt.sampleAnswer.whyItWorks && prompt.sampleAnswer.whyItWorks.length > 0 && (
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700/70 mb-1">Por qué funciona</p>
                <ul className="text-[11px] text-gray-700 list-disc pl-4 space-y-0.5">
                  {prompt.sampleAnswer.whyItWorks.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}

// ── Top-level breakdown ──────────────────────────────────────────────

export function WritingBreakdown({
  submission, prompt,
}: {
  submission: WritingSectionSubmission;
  prompt?:    TOEFLWritingSequence;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-3" style={{ color: B.purple }}>
        ✍️ Writing
      </p>
      <div className="space-y-3">
        <BuildSentencePanel answers={submission.buildSentence} items={prompt?.buildSentence} />
        <EmailPanel        submission={submission.email}      prompt={prompt?.email} />
        <DiscussionPanel   submission={submission.discussion} prompt={prompt?.discussion} />
      </div>
    </div>
  );
}
