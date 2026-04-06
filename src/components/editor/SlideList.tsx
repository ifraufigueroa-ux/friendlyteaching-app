// FriendlyTeaching.cl — SlideList (panel izquierdo del editor)
'use client';
import { useLessonStore } from '@/store/lessonStore';
import type { SlideType } from '@/types/firebase';

const TYPE_ICONS: Record<SlideType, string> = {
  cover: '🏷️', free_text: '📄', vocabulary: '📖', multiple_choice: '🔤',
  grammar_table: '📊', selection: '☑️', listening: '🎧', true_false: '✅',
  matching: '🔗', drag_drop: '🔀', writing_prompt: '✍️', speaking: '🗣️', image_label: '🖼️',
  video: '🎬', cloze_test: '📝', image_hotspot: '🎯', sorting: '📂',
};

const TYPE_LABELS: Record<SlideType, string> = {
  cover: 'Portada', free_text: 'Texto libre', vocabulary: 'Vocabulario',
  multiple_choice: 'Opción múltiple', grammar_table: 'Tabla gramática',
  selection: 'Selección', listening: 'Escuchar', true_false: 'Verdadero/Falso',
  matching: 'Relacionar', drag_drop: 'Ordenar palabras', writing_prompt: 'Escritura',
  speaking: 'Hablar', image_label: 'Imagen + texto',
  video: 'Video', cloze_test: 'Completar (Cloze)', image_hotspot: 'Hotspot imagen', sorting: 'Clasificar',
};

const PHASE_DOT: Record<string, string> = {
  pre: 'bg-[#7EB8D8]', while: 'bg-[#8DC8A0]', post: 'bg-[#C8A8DC]',
};

const SLIDE_TYPES: SlideType[] = [
  'cover', 'free_text', 'vocabulary', 'multiple_choice', 'grammar_table',
  'selection', 'listening', 'true_false', 'matching', 'drag_drop',
  'writing_prompt', 'speaking', 'image_label',
  'video', 'cloze_test', 'image_hotspot', 'sorting',
];

export default function SlideList() {
  const { lesson, currentSlideIndex, setCurrentSlide, addSlide, removeSlide, moveSlide, duplicateSlide } = useLessonStore();
  const slides = lesson?.slides ?? [];

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100">
      {/* Header */}
      <div className="px-3 py-3 border-b border-gray-100">
        <p className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider">
          Slides ({slides.length})
        </p>
      </div>

      {/* Slide list */}
      <div className="flex-1 overflow-y-auto py-2">
        {slides.map((slide, i) => {
          const isActive = i === currentSlideIndex;
          return (
            <div
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`group relative mx-2 mb-1 rounded-xl px-3 py-2.5 cursor-pointer transition-all
                ${isActive ? 'bg-[#F0E5FF] border border-[#C8A8DC]' : 'hover:bg-gray-50 border border-transparent'}`}
            >
              <div className="flex items-center gap-2">
                {/* Phase dot */}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PHASE_DOT[slide.phase ?? 'while'] ?? 'bg-gray-300'}`} />
                {/* Type icon + number */}
                <span className="text-sm">{TYPE_ICONS[slide.type]}</span>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-bold truncate ${isActive ? 'text-[#5A3D7A]' : 'text-gray-700'}`}>
                    {i + 1}. {slide.title || TYPE_LABELS[slide.type]}
                  </p>
                  <p className="text-[10px] text-gray-400">{TYPE_LABELS[slide.type]}</p>
                </div>
              </div>

              {/* Action buttons (show on hover) */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); moveSlide(i, Math.max(0, i - 1)); }}
                  disabled={i === 0}
                  title="Subir"
                  className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-[#5A3D7A] hover:bg-white disabled:opacity-20 text-xs"
                >↑</button>
                <button
                  onClick={(e) => { e.stopPropagation(); moveSlide(i, Math.min(slides.length - 1, i + 1)); }}
                  disabled={i === slides.length - 1}
                  title="Bajar"
                  className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-[#5A3D7A] hover:bg-white disabled:opacity-20 text-xs"
                >↓</button>
                <button
                  onClick={(e) => { e.stopPropagation(); duplicateSlide(i); }}
                  title="Duplicar"
                  className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-[#5A3D7A] hover:bg-white text-xs"
                >⧉</button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (slides.length > 1 && confirm('¿Eliminar esta slide?')) removeSlide(i);
                  }}
                  title="Eliminar"
                  className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-white text-xs"
                >✕</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add slide dropdown */}
      <div className="p-3 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Añadir slide</p>
        <div className="grid grid-cols-2 gap-1">
          {SLIDE_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => addSlide(type, currentSlideIndex)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-semibold text-gray-600 hover:bg-[#F0E5FF] hover:text-[#5A3D7A] transition-colors text-left"
            >
              <span>{TYPE_ICONS[type]}</span>
              <span className="truncate">{TYPE_LABELS[type]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
