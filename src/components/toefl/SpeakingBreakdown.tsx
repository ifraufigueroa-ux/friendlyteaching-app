// FriendlyTeaching.cl — TOEFL Speaking per-task breakdown
//
// Reusable results view: renders each recording with prompt, rubric,
// transcript, feedback, strengths/improvements and audio player.
// Used by the live full-mock results screen and by the teacher's
// assignment review modal.

'use client';
import type { SpeakingRecording, TOEFLSpeakingPrompt } from '@/types/toefl';

const B = {
  purple:       '#5A3D7A',
  lavenderDark: '#E0D5FF',
};

export function SpeakingBreakdown({
  recordings, prompts,
}: {
  recordings: SpeakingRecording[];
  prompts:    TOEFLSpeakingPrompt[];
}) {
  const anyError = recordings.some(r => r.aiError);
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-3" style={{ color: B.purple }}>
        🎤 Detalle por task
      </p>
      {anyError && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
          Al menos una task falló al calificarse. Se ven los detalles debajo.
        </div>
      )}
      <div className="space-y-3">
        {recordings.map((r, i) => {
          const prompt = prompts.find(p => p.id === r.promptId);
          const errored = !!r.aiError;
          return (
            <details
              key={r.promptId}
              className="rounded-xl border overflow-hidden bg-white"
              style={{ borderColor: errored ? '#FCA5A5' : B.lavenderDark }}
              open={errored}
            >
              <summary className="cursor-pointer px-3 py-2 flex items-center justify-between gap-2 select-none"
                style={{ background: errored ? '#FEF2F2' : '#FDFAFF' }}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#5A3D7A] shrink-0">
                    Task {i + 1}
                  </span>
                  <span className="text-[10px] text-gray-500 truncate">
                    {prompt?.category ?? ''} · {r.durationSec.toFixed(0)}s
                  </span>
                </div>
                <span className={`text-sm font-black tabular-nums shrink-0 ${errored ? 'text-red-600' : 'text-[#5A3D7A]'}`}>
                  {errored ? '⚠' : `${r.aiScore ?? 0}/4`}
                </span>
              </summary>
              <div className="p-3 space-y-2 border-t" style={{ borderColor: errored ? '#FECACA' : B.lavenderDark }}>
                {prompt && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#5A3D7A]/60 mb-0.5">Prompt</p>
                    <p className="text-[11px] text-gray-600 leading-snug">{prompt.prompt}</p>
                  </div>
                )}
                {r.aiRubric && (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {(['delivery', 'languageUse', 'topicDevelopment'] as const).map((k) => (
                      <div key={k} className="rounded-lg border p-2 text-center" style={{ borderColor: B.lavenderDark }}>
                        <p className="text-[8px] font-black uppercase tracking-widest text-[#5A3D7A]/60">
                          {k === 'delivery' ? 'Delivery' : k === 'languageUse' ? 'Language' : 'Topic dev'}
                        </p>
                        <p className="text-lg font-black tabular-nums" style={{ color: B.purple }}>{r.aiRubric![k]}/4</p>
                      </div>
                    ))}
                  </div>
                )}
                {r.transcript && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#5A3D7A]/60 mb-0.5">Transcripción</p>
                    <p className="text-[11px] text-gray-700 italic leading-snug">&ldquo;{r.transcript}&rdquo;</p>
                  </div>
                )}
                {r.aiFeedback && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#5A3D7A]/60 mb-0.5">Feedback</p>
                    <p className={`text-[11px] leading-snug ${errored ? 'text-red-700' : 'text-gray-700'}`}>{r.aiFeedback}</p>
                  </div>
                )}
                {r.aiStrengths && r.aiStrengths.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700 mb-0.5">✓ Fortalezas</p>
                    <ul className="text-[11px] text-emerald-800 list-disc pl-4 space-y-0.5">
                      {r.aiStrengths.map((s, si) => <li key={si}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {r.aiImprovements && r.aiImprovements.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-700 mb-0.5">↗ Para mejorar</p>
                    <ul className="text-[11px] text-amber-800 list-disc pl-4 space-y-0.5">
                      {r.aiImprovements.map((s, si) => <li key={si}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {r.audioUrl && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#5A3D7A]/60 mb-1">Audio</p>
                    <audio src={r.audioUrl} controls className="w-full h-8" />
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
