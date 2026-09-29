// FriendlyTeaching.cl — TOEFL Speaking per-task breakdown
//
// Reusable results view: renders each recording with prompt, rubric,
// transcript, feedback, strengths/improvements and audio player.
// Used by the live full-mock results screen and by the teacher's
// assignment review modal.
//
// Handles all three rubric shapes:
//   · Listen and Repeat (ETS 2026, holistic — no rubric object)
//   · Take an Interview (ETS 2026, 4 dims: fluency/intelligibility/languageUse/organization)
//   · Legacy Independent Speaking (pre-2026, 3 dims: delivery/languageUse/topicDevelopment)

'use client';
import type {
  SpeakingRecording, TOEFLSpeakingPrompt, TOEFLSpeakingSection, TOEFLSpeakingItem,
} from '@/types/toefl';
import { speakingSectionItems } from '@/types/toefl';

const B = {
  purple:       '#5A3D7A',
  lavenderDark: '#E0D5FF',
};

/** Item lookup that accepts both the 2026 section and the legacy prompt array. */
function itemsFor(content: TOEFLSpeakingSection | TOEFLSpeakingPrompt[] | undefined): {
  byId: Map<string, TOEFLSpeakingItem>;
  topic: string | null;
} {
  const byId = new Map<string, TOEFLSpeakingItem>();
  if (!content) return { byId, topic: null };
  if (Array.isArray(content)) {
    for (const p of content) {
      byId.set(p.id, { id: p.id, type: 'take-an-interview', question: p.prompt, speakSec: p.speakSec });
    }
    return { byId, topic: null };
  }
  for (const it of speakingSectionItems(content)) byId.set(it.id, it);
  return { byId, topic: content.interviewTopic };
}

// Human-friendly labels for whatever rubric fields are present on a record.
const RUBRIC_LABELS: Record<string, string> = {
  // Take an Interview (ETS 2026)
  fluency:          'Fluency',
  intelligibility:  'Intelligibility',
  languageUse:      'Language',
  organization:     'Organization',
  // Legacy Independent (pre-2026) — languageUse re-used
  delivery:         'Delivery',
  topicDevelopment: 'Topic dev',
};
const RUBRIC_ORDER = ['fluency', 'intelligibility', 'languageUse', 'organization', 'delivery', 'topicDevelopment'] as const;

export function SpeakingBreakdown({
  recordings, prompts, section,
}: {
  recordings: SpeakingRecording[];
  /** Legacy prompt array (pre-2026 content). */
  prompts?:   TOEFLSpeakingPrompt[];
  /** ETS 2026 section content. Preferred over `prompts`. */
  section?:   TOEFLSpeakingSection;
}) {
  const { byId, topic } = itemsFor(section ?? prompts);
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
          const item    = byId.get(r.promptId);
          const errored = !!r.aiError;
          const isLR    = (r.taskType ?? item?.type) === 'listen-and-repeat';
          const targetSentence = item && item.type === 'listen-and-repeat' ? item.targetSentence : null;
          const questionText   = item && item.type === 'take-an-interview' ? item.question       : null;
          const promptCategory = isLR ? 'Listen & Repeat' : (topic ?? 'Interview');
          const rubricEntries  = r.aiRubric
            ? RUBRIC_ORDER.filter(k => typeof r.aiRubric?.[k] === 'number')
            : [];

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
                    {promptCategory} · {r.durationSec.toFixed(0)}s
                  </span>
                </div>
                <span className={`text-sm font-black tabular-nums shrink-0 ${errored ? 'text-red-600' : 'text-[#5A3D7A]'}`}>
                  {errored ? '⚠' : `${r.aiScore ?? 0}/5`}
                </span>
              </summary>
              <div className="p-3 space-y-2 border-t" style={{ borderColor: errored ? '#FECACA' : B.lavenderDark }}>
                {targetSentence && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#5A3D7A]/60 mb-0.5">Target</p>
                    <p className="text-[11px] text-gray-700 leading-snug">&ldquo;{targetSentence}&rdquo;</p>
                  </div>
                )}
                {questionText && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#5A3D7A]/60 mb-0.5">Question</p>
                    <p className="text-[11px] text-gray-600 leading-snug">{questionText}</p>
                  </div>
                )}
                {rubricEntries.length > 0 && (
                  <div className={`grid gap-2 pt-1 ${rubricEntries.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
                    {rubricEntries.map((k) => (
                      <div key={k} className="rounded-lg border p-2 text-center" style={{ borderColor: B.lavenderDark }}>
                        <p className="text-[8px] font-black uppercase tracking-widest text-[#5A3D7A]/60">
                          {RUBRIC_LABELS[k]}
                        </p>
                        <p className="text-lg font-black tabular-nums" style={{ color: B.purple }}>
                          {r.aiRubric?.[k]}/5
                        </p>
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
