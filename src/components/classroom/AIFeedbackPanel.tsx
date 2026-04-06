// FriendlyTeaching.cl — AI Feedback Panel
// Displays AI-generated grading results for writing/speaking submissions.
'use client';
import type { AIGradeResponse } from '@/app/api/ai-grade/route';

interface Props {
  result: AIGradeResponse;
  slideType: 'writing_prompt' | 'speaking';
  onClose?: () => void;
}

const SCORE_COLORS: Record<number, string> = {
  1: 'bg-red-500',    2: 'bg-red-400',    3: 'bg-orange-400',
  4: 'bg-amber-400',  5: 'bg-yellow-400', 6: 'bg-green-400',  7: 'bg-green-500',
};

const SCORE_LABELS: Record<number, string> = {
  1: 'Insuficiente', 2: 'Bajo', 3: 'En desarrollo',
  4: 'Aceptable', 5: 'Bueno', 6: 'Muy bueno', 7: 'Excelente',
};

export default function AIFeedbackPanel({ result, slideType, onClose }: Props) {
  const scoreColor = SCORE_COLORS[result.score7] ?? 'bg-gray-400';
  const scoreLabel = SCORE_LABELS[result.score7] ?? '';

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-[#E0D5FF] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#C8A8DC] to-[#9B7CB8] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <span className="text-sm font-bold text-white">
            {slideType === 'writing_prompt' ? 'Corrección de escritura' : 'Evaluación oral'} · IA
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/70 hover:text-white text-lg">×</button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Score */}
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl ${scoreColor} flex items-center justify-center shadow-md`}>
            <span className="text-2xl font-extrabold text-white">{result.score7}</span>
          </div>
          <div>
            <p className="text-lg font-bold text-[#5A3D7A]">{scoreLabel}</p>
            <p className="text-xs text-gray-500">Puntaje {result.score7}/7 en escala FT</p>
          </div>
          {/* Score bar */}
          <div className="flex-1 ml-2">
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${scoreColor}`}
                style={{ width: `${(result.score7 / 7) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Feedback */}
        <div className="bg-[#F0E5FF] rounded-xl p-3">
          <p className="text-xs font-bold text-[#5A3D7A] mb-1">💬 Feedback</p>
          <p className="text-sm text-gray-700 leading-relaxed">{result.feedback}</p>
        </div>

        {/* Strengths + Improvements */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Strengths */}
          {result.strengths && result.strengths.length > 0 && (
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-xs font-bold text-green-700 mb-1.5">✅ Fortalezas</p>
              <ul className="space-y-1">
                {result.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-green-800 flex items-start gap-1.5">
                    <span className="text-green-400 mt-0.5 flex-shrink-0">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {result.improvements && result.improvements.length > 0 && (
            <div className="bg-amber-50 rounded-xl p-3">
              <p className="text-xs font-bold text-amber-700 mb-1.5">🔧 Por mejorar</p>
              <ul className="space-y-1">
                {result.improvements.map((s, i) => (
                  <li key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
                    <span className="text-amber-400 mt-0.5 flex-shrink-0">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Grammar errors */}
        {result.grammarErrors && result.grammarErrors.length > 0 && (
          <div className="bg-red-50 rounded-xl p-3">
            <p className="text-xs font-bold text-red-700 mb-1.5">📝 Errores gramaticales</p>
            <ul className="space-y-1">
              {result.grammarErrors.map((e, i) => (
                <li key={i} className="text-xs text-red-800 flex items-start gap-1.5">
                  <span className="text-red-400 mt-0.5 flex-shrink-0">{i + 1}.</span>
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Corrected version */}
        {result.correctedVersion && (
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-xs font-bold text-blue-700 mb-1.5">✍️ Versión corregida</p>
            <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap font-mono">
              {result.correctedVersion}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
