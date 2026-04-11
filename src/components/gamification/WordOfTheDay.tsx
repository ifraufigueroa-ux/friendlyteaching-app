// FriendlyTeaching.cl — Word of the Day interactive component (Student Dashboard)
'use client';

import { useState } from 'react';
import { useWordOfDay } from '@/hooks/useWordOfDay';
import { XP_REWARDS } from '@/types/firebase';

interface Props {
  studentId: string;
  onXpAwarded?: (xp: number) => void;
  recordWordOfDay?: (wordStreak: number) => Promise<void>;
}

export default function WordOfTheDay({ studentId, onXpAwarded, recordWordOfDay }: Props) {
  const {
    wordOfDay,
    todaySubmission,
    wordStreak,
    totalSubmissions,
    loading,
    submitExample,
    hasSubmittedToday,
  } = useWordOfDay(studentId);

  const [example, setExample] = useState('');
  const [showMeaning, setShowMeaning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!example.trim() || submitting) return;
    setSubmitting(true);
    try {
      const ok = await submitExample(example);
      if (ok) {
        setJustSubmitted(true);
        // Award XP + update word streak in gamification system
        const newStreak = wordStreak + 1;
        if (recordWordOfDay) {
          await recordWordOfDay(newStreak);
        }
        onXpAwarded?.(XP_REWARDS.WORD_OF_DAY);
        setTimeout(() => setJustSubmitted(false), 3000);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-5 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-32 mb-3" />
        <div className="h-6 bg-gray-200 rounded w-48 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-40" />
      </div>
    );
  }

  const streakEmoji = wordStreak >= 30 ? '🏅' : wordStreak >= 14 ? '✍️' : wordStreak >= 7 ? '📝' : wordStreak >= 3 ? '🔥' : '📖';

  return (
    <div className="card-interactive rounded-2xl overflow-hidden">
      {/* Header gradient strip */}
      <div className="h-1.5 bg-gradient-to-r from-[#C8A8DC] via-[#FFB8D9] to-[#C8A8DC]" />

      <div className="p-5">
        {/* Title row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">📖</span>
            <span className="text-xs font-bold text-[#9B7CB8] uppercase tracking-widest">
              Palabra del Día
            </span>
          </div>
          {/* Streak badge */}
          <div className="flex items-center gap-1.5 bg-[#F0E5FF] px-2.5 py-1 rounded-full">
            <span className="text-sm">{streakEmoji}</span>
            <span className="text-xs font-bold text-[#5A3D7A]">
              {wordStreak} día{wordStreak !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Word display */}
        <div className="mb-4">
          <p className="text-2xl font-extrabold text-[#5A3D7A] leading-tight">
            {wordOfDay.word}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-xs text-[#9B7CB8] font-mono">{wordOfDay.ipa}</span>
            <span className="text-[10px] text-gray-400">·</span>
            <span className="text-xs text-gray-500 italic">{wordOfDay.type}</span>
            <span className="text-[10px] text-gray-400">·</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              wordOfDay.level === 'C1' ? 'bg-purple-100 text-purple-700' :
              wordOfDay.level === 'B2' ? 'bg-amber-100 text-amber-700' :
              wordOfDay.level === 'B1' ? 'bg-green-100 text-green-700' :
              'bg-sky-100 text-sky-700'
            }`}>
              {wordOfDay.level}
            </span>
          </div>
        </div>

        {/* Reveal meaning toggle */}
        <button
          onClick={() => setShowMeaning(!showMeaning)}
          className="w-full text-left mb-4 group"
        >
          <div className={`rounded-xl border transition-all duration-300 overflow-hidden ${
            showMeaning
              ? 'bg-gradient-to-br from-[#F0E5FF] to-[#E8DAFF] border-[#C8A8DC]/40 p-4'
              : 'bg-[#F9F5FF] border-[#C8A8DC]/20 p-3 hover:border-[#C8A8DC]/40 hover:bg-[#F0E5FF]/60'
          }`}>
            {showMeaning ? (
              <div className="space-y-2.5">
                <div>
                  <p className="text-[10px] font-bold text-[#9B7CB8] uppercase tracking-wider mb-0.5">Significado</p>
                  <p className="text-sm font-semibold text-[#5A3D7A]">{wordOfDay.meaning}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#9B7CB8] uppercase tracking-wider mb-0.5">Ejemplo</p>
                  <p className="text-sm text-gray-600 italic">&ldquo;{wordOfDay.example}&rdquo;</p>
                </div>
                {wordOfDay.tip && (
                  <div className="flex items-start gap-2 bg-white/60 rounded-lg p-2.5">
                    <span className="text-sm flex-shrink-0">💡</span>
                    <p className="text-xs text-[#5A3D7A] leading-relaxed">{wordOfDay.tip}</p>
                  </div>
                )}
                <p className="text-[10px] text-[#9B7CB8] text-center mt-1">Toca para ocultar ▲</p>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9B7CB8] font-medium">
                  👀 Toca para ver significado, ejemplo y tip
                </span>
                <span className="text-[#C8A8DC] text-lg group-hover:translate-y-0.5 transition-transform">▼</span>
              </div>
            )}
          </div>
        </button>

        {/* Submission area */}
        {hasSubmittedToday || justSubmitted ? (
          <div className="bg-green-50 border border-green-200/60 rounded-xl p-4 text-center">
            <p className="text-2xl mb-1">✅</p>
            <p className="text-sm font-bold text-green-700">
              {justSubmitted ? '¡Ejemplo enviado!' : '¡Ya completaste hoy!'}
            </p>
            {todaySubmission && (
              <p className="text-xs text-green-600 mt-1 italic">
                &ldquo;{todaySubmission.example}&rdquo;
              </p>
            )}
            <div className="flex items-center justify-center gap-4 mt-3">
              <div className="text-center">
                <p className="text-lg font-bold text-green-700">{wordStreak}</p>
                <p className="text-[10px] text-green-600">Racha</p>
              </div>
              <div className="w-px h-8 bg-green-200" />
              <div className="text-center">
                <p className="text-lg font-bold text-green-700">{totalSubmissions}</p>
                <p className="text-[10px] text-green-600">Total</p>
              </div>
              <div className="w-px h-8 bg-green-200" />
              <div className="text-center">
                <p className="text-lg font-bold text-green-700">+{XP_REWARDS.WORD_OF_DAY}</p>
                <p className="text-[10px] text-green-600">XP</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-[#5A3D7A] mb-1.5 block">
                Escribe una oración usando &ldquo;{wordOfDay.word}&rdquo;
              </label>
              <textarea
                value={example}
                onChange={e => setExample(e.target.value)}
                placeholder={`Ej: "${wordOfDay.word} is..."` }
                rows={2}
                maxLength={300}
                className="w-full px-3 py-2.5 border border-[#C8A8DC]/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] bg-white/70 backdrop-blur-sm resize-none placeholder:text-gray-300"
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-[10px] text-gray-400">{example.length}/300</p>
                <p className="text-[10px] text-[#9B7CB8] font-medium">+{XP_REWARDS.WORD_OF_DAY} XP al enviar</p>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!example.trim() || submitting}
              className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                example.trim()
                  ? 'bg-gradient-to-r from-[#C8A8DC] to-[#9B7CB8] text-white shadow-purple-sm hover:shadow-purple-md hover:scale-[1.01] active:scale-[0.99]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando...
                </span>
              ) : (
                'Enviar ejemplo 📝'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
