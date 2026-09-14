// FriendlyTeaching.cl — Sample answer modal (TOEFL Writing)
//
// Shared between EmailSection and WritingSection (Academic Discussion) so
// both can offer a "Ver ejemplo" button that reveals the high-score sample
// answer + "why it works" bullets. Gated to practice mode by the caller —
// this component just renders.
//
// Click on the backdrop or the ✕ closes.

'use client';

export interface SampleAnswerModalProps {
  title:       string;
  text:        string;
  whyItWorks?: string[];
  onClose:     () => void;
}

export function SampleAnswerModal({
  title, text, whyItWorks, onClose,
}: SampleAnswerModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3 border-b border-emerald-100 bg-emerald-50 flex items-center justify-between gap-3">
          <p className="text-[11px] font-black uppercase tracking-widest text-emerald-800">
            ⭐ {title}
          </p>
          <button
            onClick={onClose}
            className="text-xl text-emerald-800/50 hover:text-emerald-900 leading-none px-2"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto p-5 space-y-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700/70 mb-1.5">
              Texto modelo
            </p>
            <div className="rounded-lg bg-emerald-50/40 border border-emerald-100 p-4 text-[13px] text-gray-800 whitespace-pre-wrap leading-relaxed">
              {text}
            </div>
          </div>
          {whyItWorks && whyItWorks.length > 0 && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700/70 mb-1.5">
                Por qué funciona
              </p>
              <ul className="text-[12px] text-gray-700 list-disc pl-5 space-y-1">
                {whyItWorks.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          <p className="text-[10px] text-emerald-800/60 italic pt-1">
            💡 Usa el modelo como referencia, no lo copies. El AI grader detecta respuestas que replican el ejemplo.
          </p>
        </div>
      </div>
    </div>
  );
}
