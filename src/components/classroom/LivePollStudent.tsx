// FriendlyTeaching.cl — Live Poll Widget (Student side)
// Shows active poll and allows student to respond in real-time.
'use client';
import { useState } from 'react';
import { useStudentPoll } from '@/hooks/useLivePolls';

interface Props {
  sessionId: string;
  studentUid: string;
}

export default function LivePollStudent({ sessionId, studentUid }: Props) {
  const { activePoll, submitResponse } = useStudentPoll(sessionId);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState('');

  if (!activePoll) return null;

  const myResponse = activePoll.responses?.[studentUid] ?? submitted;
  const hasResponded = !!myResponse;
  const totalResponses = Object.keys(activePoll.responses ?? {}).length;

  // Count per option (only shown when teacher enables showResults)
  const counts: Record<string, number> = {};
  if (activePoll.showResults) {
    for (const r of Object.values(activePoll.responses ?? {})) {
      counts[r] = (counts[r] ?? 0) + 1;
    }
  }

  async function handleSelect(optionId: string) {
    if (hasResponded) return;
    setSubmitted(optionId);
    await submitResponse(activePoll!.id, studentUid, optionId);
  }

  async function handleTextSubmit() {
    if (hasResponded || !textAnswer.trim()) return;
    setSubmitted(textAnswer);
    await submitResponse(activePoll!.id, studentUid, textAnswer);
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm animate-[slideUp_0.3s_ease]">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-[#C8A8DC] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#C8A8DC] to-[#9B7CB8] px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-bold text-white">Encuesta en vivo</span>
          </div>
          <span className="text-[10px] text-white/70">{totalResponses} respuestas</span>
        </div>

        {/* Question */}
        <div className="px-4 py-3">
          <p className="text-sm font-bold text-[#5A3D7A] mb-3">{activePoll.question}</p>

          {/* Options */}
          {activePoll.type !== 'open_text' ? (
            <div className="space-y-2">
              {activePoll.options.map((opt) => {
                const isSelected = myResponse === opt.id;
                const isCorrect = activePoll.correctOptionId === opt.id;
                const count = counts[opt.id] ?? 0;
                const pct = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    disabled={hasResponded}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all relative overflow-hidden ${
                      isSelected
                        ? isCorrect && activePoll.showResults
                          ? 'bg-green-100 text-green-700 ring-2 ring-green-400'
                          : 'bg-[#F0E5FF] text-[#5A3D7A] ring-2 ring-[#C8A8DC]'
                        : hasResponded
                          ? 'bg-gray-50 text-gray-400'
                          : 'bg-gray-50 text-gray-700 hover:bg-[#F0E5FF] hover:text-[#5A3D7A]'
                    }`}
                  >
                    {/* Background bar for results */}
                    {activePoll.showResults && (
                      <div
                        className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                          isCorrect ? 'bg-green-100' : 'bg-gray-100'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    )}
                    <span className="relative z-10 flex items-center justify-between">
                      <span>
                        {opt.emoji ? `${opt.emoji} ` : ''}{opt.text}
                        {isCorrect && activePoll.showResults && ' ✅'}
                      </span>
                      {activePoll.showResults && (
                        <span className="text-xs font-bold text-gray-500">{pct}%</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            // Open text response
            <div className="space-y-2">
              {!hasResponded ? (
                <>
                  <input
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
                    onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
                  />
                  <button
                    onClick={handleTextSubmit}
                    disabled={!textAnswer.trim()}
                    className="w-full py-2 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-40"
                  >
                    Enviar
                  </button>
                </>
              ) : (
                <p className="text-sm text-gray-500 italic">Tu respuesta: &ldquo;{myResponse}&rdquo;</p>
              )}
            </div>
          )}

          {/* Confirmation */}
          {hasResponded && activePoll.type !== 'open_text' && (
            <p className="text-center text-xs text-green-600 font-semibold mt-2">
              ✅ Respuesta enviada
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
