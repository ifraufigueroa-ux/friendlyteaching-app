// FriendlyTeaching.cl — Live Poll Panel (Teacher side)
// Create, manage, and view results for live classroom polls.
'use client';
import { useState } from 'react';
import { useTeacherPolls } from '@/hooks/useLivePolls';
import type { PollOption, PollType, LivePoll } from '@/types/firebase';

interface Props {
  sessionId: string;
  teacherId: string;
  onClose: () => void;
}

const QUICK_TEMPLATES: { label: string; question: string; type: PollType; options: PollOption[] }[] = [
  {
    label: '👍 Sí / No',
    question: '¿Entendieron?',
    type: 'true_false',
    options: [
      { id: 'yes', text: 'Sí', emoji: '👍' },
      { id: 'no', text: 'No', emoji: '👎' },
    ],
  },
  {
    label: '🎯 A/B/C/D',
    question: '',
    type: 'multiple_choice',
    options: [
      { id: 'a', text: 'A' },
      { id: 'b', text: 'B' },
      { id: 'c', text: 'C' },
      { id: 'd', text: 'D' },
    ],
  },
  {
    label: '😊 Emoji',
    question: '¿Cómo se sienten?',
    type: 'emoji_reaction',
    options: [
      { id: 'great', text: 'Genial', emoji: '🤩' },
      { id: 'good', text: 'Bien', emoji: '😊' },
      { id: 'confused', text: 'Confundido', emoji: '😕' },
      { id: 'lost', text: 'Perdido', emoji: '😰' },
    ],
  },
];

export default function LivePollTeacher({ sessionId, teacherId, onClose }: Props) {
  const { polls, activePoll, createPoll, closePoll, toggleResults, deletePoll } = useTeacherPolls(sessionId);
  const [showCreate, setShowCreate] = useState(!activePoll);
  const [question, setQuestion] = useState('');
  const [selectedType, setSelectedType] = useState<PollType>('multiple_choice');
  const [options, setOptions] = useState<PollOption[]>([
    { id: 'a', text: '' }, { id: 'b', text: '' },
  ]);

  async function handleCreate() {
    if (!question.trim()) return;
    const cleanOptions = options.filter((o) => o.text.trim());
    if (cleanOptions.length < 2) return;
    await createPoll(teacherId, question, selectedType, cleanOptions);
    setQuestion('');
    setOptions([{ id: 'a', text: '' }, { id: 'b', text: '' }]);
    setShowCreate(false);
  }

  function useTemplate(tpl: typeof QUICK_TEMPLATES[0]) {
    setQuestion(tpl.question);
    setSelectedType(tpl.type);
    setOptions(tpl.options);
  }

  function addOption() {
    const id = String.fromCharCode(97 + options.length);
    setOptions([...options, { id, text: '' }]);
  }

  function updateOption(idx: number, text: string) {
    setOptions(options.map((o, i) => (i === idx ? { ...o, text } : o)));
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-[#F0E5FF]">
        <h3 className="text-sm font-bold text-[#5A3D7A]">📊 Encuestas en vivo</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        {/* Active poll */}
        {activePoll && (
          <ActivePollCard
            poll={activePoll}
            onClose={() => closePoll(activePoll.id)}
            onToggleResults={() => toggleResults(activePoll.id, !activePoll.showResults)}
          />
        )}

        {/* Create poll form */}
        {showCreate && !activePoll ? (
          <div className="space-y-3">
            {/* Quick templates */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Plantillas rápidas</p>
              <div className="flex gap-1.5 flex-wrap">
                {QUICK_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.label}
                    onClick={() => useTemplate(tpl)}
                    className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-semibold text-gray-600 hover:bg-[#F0E5FF] hover:text-[#5A3D7A] transition-colors"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question */}
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Escribe tu pregunta..."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
            />

            {/* Options */}
            <div className="space-y-1.5">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-gray-400 w-5">{String.fromCharCode(65 + i)}</span>
                  <input
                    value={opt.text}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Opción ${String.fromCharCode(65 + i)}`}
                    className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#C8A8DC]"
                  />
                </div>
              ))}
              {options.length < 6 && (
                <button onClick={addOption} className="text-xs text-[#9B7CB8] font-semibold hover:text-[#5A3D7A]">
                  + Agregar opción
                </button>
              )}
            </div>

            {/* Create button */}
            <button
              onClick={handleCreate}
              disabled={!question.trim() || options.filter((o) => o.text.trim()).length < 2}
              className="w-full py-2 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-40"
            >
              🚀 Lanzar encuesta
            </button>
          </div>
        ) : !activePoll ? (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-400 hover:border-[#C8A8DC] hover:text-[#5A3D7A] transition-colors"
          >
            + Crear nueva encuesta
          </button>
        ) : null}

        {/* Past polls */}
        {polls.filter((p) => !p.isActive).length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Encuestas anteriores</p>
            <div className="space-y-2">
              {polls.filter((p) => !p.isActive).slice(0, 5).map((poll) => (
                <PastPollCard key={poll.id} poll={poll} onDelete={() => deletePoll(poll.id)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Active Poll Card ──────────────────────────────────────────

function ActivePollCard({ poll, onClose, onToggleResults }: { poll: LivePoll; onClose: () => void; onToggleResults: () => void }) {
  const responses = Object.values(poll.responses ?? {});
  const totalResponses = responses.length;

  // Count per option
  const counts: Record<string, number> = {};
  for (const r of responses) {
    counts[r] = (counts[r] ?? 0) + 1;
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full animate-pulse">
          EN VIVO
        </span>
        <span className="text-xs text-gray-500">{totalResponses} respuesta{totalResponses !== 1 ? 's' : ''}</span>
      </div>

      <p className="text-sm font-bold text-gray-700">{poll.question}</p>

      {/* Results bars */}
      <div className="space-y-1.5">
        {poll.options.map((opt) => {
          const count = counts[opt.id] ?? 0;
          const pct = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
          const isCorrect = poll.correctOptionId === opt.id;
          return (
            <div key={opt.id} className="relative">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold text-gray-600">
                  {opt.emoji ? `${opt.emoji} ` : ''}{opt.text}
                  {isCorrect && poll.showResults && ' ✅'}
                </span>
                <span className="text-xs font-bold text-gray-500">{count} ({pct}%)</span>
              </div>
              <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCorrect && poll.showResults ? 'bg-green-400' : 'bg-[#C8A8DC]'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onToggleResults}
          className="flex-1 py-1.5 text-xs font-bold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {poll.showResults ? '🙈 Ocultar' : '📊 Mostrar'}
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-1.5 text-xs font-bold bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
        >
          ⏹ Cerrar
        </button>
      </div>
    </div>
  );
}

// ── Past Poll Card ────────────────────────────────────────────

function PastPollCard({ poll, onDelete }: { poll: LivePoll; onDelete: () => void }) {
  const totalResponses = Object.keys(poll.responses ?? {}).length;
  return (
    <div className="bg-gray-50 rounded-xl p-2.5 flex items-center justify-between gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-gray-600 truncate">{poll.question}</p>
        <p className="text-[10px] text-gray-400">{totalResponses} respuestas</p>
      </div>
      <button onClick={onDelete} className="text-xs text-gray-400 hover:text-red-500 transition-colors" title="Eliminar">
        🗑
      </button>
    </div>
  );
}
