// FriendlyTeaching.cl — TeacherNotesPanel
// Side panel visible only to teachers during class, showing notes, tips, and answer keys.
'use client';
import { useState } from 'react';
import type { Slide } from '@/types/firebase';

interface Props {
  slide: Slide;
  slideIndex: number;
  totalSlides: number;
  onClose: () => void;
}

type Tab = 'notes' | 'tips' | 'answers';

export default function TeacherNotesPanel({ slide, slideIndex, totalSlides, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('notes');

  const hasNotes = Boolean(slide.teacherNotes);
  const hasTips = Boolean(slide.tips);
  const hasAnswers = Boolean(getAnswerKey(slide));

  const tabs: { id: Tab; label: string; icon: string; has: boolean }[] = [
    { id: 'notes', label: 'Notas', icon: '🎓', has: hasNotes },
    { id: 'tips', label: 'Tips', icon: '💡', has: hasTips },
    { id: 'answers', label: 'Respuestas', icon: '✅', has: hasAnswers },
  ];

  const activeTabs = tabs.filter((t) => t.has);
  // Auto-switch to a tab that has content
  const activeTab = activeTabs.find((t) => t.id === tab) ? tab : activeTabs[0]?.id ?? 'notes';

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full flex-shrink-0 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-[#FFF5C8] to-[#FFFCF7]">
        <div>
          <p className="text-xs font-bold text-[#7A5E00] uppercase tracking-wider">Panel del Profesor</p>
          <p className="text-[11px] text-[#9A7800]">Slide {slideIndex + 1} de {totalSlides}</p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 text-sm"
        >
          ×
        </button>
      </div>

      {/* Tabs */}
      {activeTabs.length > 1 && (
        <div className="flex border-b border-gray-100 px-2 pt-2">
          {activeTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors ${
                activeTab === t.id
                  ? 'bg-[#FFF5C8] text-[#7A5E00] border-b-2 border-[#FFD84D]'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'notes' && hasNotes && (
          <div className="space-y-3">
            <div className="bg-[#FFF5C8]/50 rounded-xl p-3">
              <p className="text-sm text-[#5A4500] leading-relaxed whitespace-pre-wrap">
                {slide.teacherNotes}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'tips' && hasTips && (
          <div className="space-y-3">
            <div className="bg-[#F0F9FF] rounded-xl p-3">
              <p className="text-xs font-bold text-[#1A6B9A] mb-1">💡 Tips pedagógicos</p>
              <p className="text-sm text-[#1A6B9A]/80 leading-relaxed whitespace-pre-wrap">
                {slide.tips}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'answers' && hasAnswers && (
          <div className="space-y-3">
            <div className="bg-[#F0FFF0] rounded-xl p-3">
              <p className="text-xs font-bold text-[#2D6E2A] mb-2">✅ Clave de respuestas</p>
              <div className="text-sm text-[#2D6E2A]/80 leading-relaxed whitespace-pre-wrap">
                {getAnswerKey(slide)}
              </div>
            </div>
          </div>
        )}

        {!hasNotes && !hasTips && !hasAnswers && (
          <div className="flex flex-col items-center justify-center h-full text-gray-300">
            <p className="text-3xl mb-2">📝</p>
            <p className="text-xs font-medium">Sin notas para este slide</p>
            <p className="text-[11px] text-gray-300 mt-1">
              Agrega teacherNotes o tips en el editor
            </p>
          </div>
        )}
      </div>

      {/* Slide type badge */}
      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 text-[11px] text-gray-400">
          <span className="px-2 py-0.5 bg-[#F0E5FF] text-[#5A3D7A] rounded font-bold uppercase">
            {slide.type.replace('_', ' ')}
          </span>
          {slide.phase && (
            <span className={`px-2 py-0.5 rounded font-bold uppercase ${
              slide.phase === 'pre' ? 'bg-blue-50 text-blue-500' :
              slide.phase === 'while' ? 'bg-green-50 text-green-500' :
              'bg-orange-50 text-orange-500'
            }`}>
              {slide.phase}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** Extracts a human-readable answer key from the slide data */
function getAnswerKey(slide: Slide): string | null {
  switch (slide.type) {
    case 'multiple_choice': {
      const correct = slide.options?.find((o) => o.isCorrect);
      if (correct) return `Respuesta correcta: ${correct.text}`;
      if (slide.correctAnswer) return `Respuesta correcta: ${slide.correctAnswer}`;
      return null;
    }
    case 'true_false': {
      const val = (slide.correctAnswer as unknown) === true || slide.correctAnswer === 'true';
      return `Respuesta: ${val ? 'Verdadero ✅' : 'Falso ❌'}`;
    }
    case 'drag_drop':
      return slide.correctAnswer ? `Orden correcto: ${slide.correctAnswer}` : null;
    case 'matching':
      if (!slide.pairs?.length) return null;
      return slide.pairs.map((p) => `${p.left} → ${p.right}`).join('\n');
    case 'selection': {
      if (!slide.options?.length) return null;
      const prompts = slide.content?.split('|').map((p) => p.trim()).filter(Boolean) ?? [];
      if (prompts.length > 0 && slide.correctAnswer) {
        const parts = slide.correctAnswer.split('|').map((s) => s.trim());
        return prompts.map((p, i) => {
          const answer = parts[i] ?? parts[0] ?? '?';
          const idx = parseInt(answer, 10);
          const text = !isNaN(idx) && slide.options?.[idx] ? slide.options[idx].text : answer;
          return `${p} → ${text}`;
        }).join('\n');
      }
      const correct = slide.options.filter((o) => o.isCorrect);
      return correct.length ? `Correctas: ${correct.map((o) => o.text).join(', ')}` : null;
    }
    default:
      if (slide.correctAnswer) return `Respuesta: ${slide.correctAnswer}`;
      return null;
  }
}
