// FriendlyTeaching.cl — AI Lesson Generator Wizard
// Step-by-step form: Topic → Level → Options → Generate → Preview → Import
'use client';
import { useState } from 'react';
import { useAILesson } from '@/hooks/useAILesson';
import type { AILessonResponse } from '@/app/api/ai-lesson/route';
import type { LessonLevel } from '@/types/firebase';

interface Props {
  onImport: (lesson: AILessonResponse) => void;
  onClose: () => void;
}

const LEVELS: LessonLevel[] = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];

const SKILLS = [
  { id: 'grammar', label: 'Gramática', icon: '✏️' },
  { id: 'vocabulary', label: 'Vocabulario', icon: '📚' },
  { id: 'speaking', label: 'Speaking', icon: '🗣️' },
  { id: 'listening', label: 'Listening', icon: '👂' },
  { id: 'reading', label: 'Reading', icon: '📖' },
  { id: 'writing', label: 'Writing', icon: '✍️' },
];

export default function AILessonWizard({ onImport, onClose }: Props) {
  const { generate, loading, result, error, reset } = useAILesson();
  const [step, setStep] = useState(0);

  // Form state
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<LessonLevel>('B1');
  const [objectives, setObjectives] = useState('');
  const [duration, setDuration] = useState(60);
  const [slideCount, setSlideCount] = useState(12);
  const [focusSkills, setFocusSkills] = useState<string[]>(['grammar', 'vocabulary', 'speaking']);
  const [includeHomework, setIncludeHomework] = useState(true);

  function toggleSkill(id: string) {
    setFocusSkills((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  async function handleGenerate() {
    const res = await generate({
      topic,
      level,
      objectives: objectives || undefined,
      duration,
      slideCount,
      focusSkills,
      includeHomework,
      language: 'es',
    });
    if (res) setStep(2);
  }

  // ── Step 0: Topic + Level ───────────────────────────────────
  if (step === 0) {
    return (
      <Overlay onClose={onClose}>
        <h2 className="text-lg font-bold text-[#5A3D7A] mb-1">🤖 Generar lección con IA</h2>
        <p className="text-xs text-gray-500 mb-5">Paso 1 de 2: Define el tema y nivel</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1">Tema de la lección *</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder='e.g. "Present Perfect vs Past Simple", "Food & Restaurant vocabulary"'
              className="w-full px-4 py-2.5 border border-[#C8A8DC] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-2">Nivel CEFR *</label>
            <div className="flex gap-2 flex-wrap">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    level === l
                      ? 'bg-[#C8A8DC] text-white shadow-md scale-105'
                      : 'bg-gray-100 text-gray-500 hover:bg-[#F0E5FF] hover:text-[#5A3D7A]'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1">Objetivos (opcional)</label>
            <textarea
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              placeholder="e.g. Students will be able to use present perfect to talk about life experiences"
              rows={2}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={() => setStep(1)}
            disabled={!topic.trim()}
            className="flex-1 py-2.5 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-bold disabled:opacity-40 transition-colors"
          >
            Siguiente →
          </button>
        </div>
      </Overlay>
    );
  }

  // ── Step 1: Options ─────────────────────────────────────────
  if (step === 1) {
    return (
      <Overlay onClose={onClose}>
        <h2 className="text-lg font-bold text-[#5A3D7A] mb-1">🤖 Generar lección con IA</h2>
        <p className="text-xs text-gray-500 mb-5">Paso 2 de 2: Opciones de generación</p>

        <div className="space-y-4">
          <div className="bg-[#F0E5FF] rounded-xl p-3">
            <p className="text-xs font-bold text-[#5A3D7A]">📌 {topic}</p>
            <p className="text-[10px] text-gray-500">Nivel {level}</p>
          </div>

          <div>
            <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-2">Habilidades a enfocar</label>
            <div className="flex gap-2 flex-wrap">
              {SKILLS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => toggleSkill(s.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    focusSkills.includes(s.id)
                      ? 'bg-[#C8A8DC] text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-[#F0E5FF]'
                  }`}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1">Duración</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
              >
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1">Slides</label>
              <select
                value={slideCount}
                onChange={(e) => setSlideCount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
              >
                <option value={8}>8 slides</option>
                <option value={10}>10 slides</option>
                <option value={12}>12 slides</option>
                <option value={15}>15 slides</option>
                <option value={20}>20 slides</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeHomework}
              onChange={(e) => setIncludeHomework(e.target.checked)}
              className="rounded border-gray-300 text-[#C8A8DC] focus:ring-[#C8A8DC]"
            />
            <span className="text-xs font-semibold text-gray-600">Incluir sugerencia de tarea</span>
          </label>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={() => setStep(0)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50">
            ← Atrás
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex-1 py-2.5 bg-gradient-to-r from-[#C8A8DC] to-[#9B7CB8] text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-all hover:opacity-90 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generando...
              </>
            ) : (
              '🤖 Generar lección'
            )}
          </button>
        </div>

        {error && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}
      </Overlay>
    );
  }

  // ── Step 2: Preview + Import ────────────────────────────────
  if (step === 2 && result) {
    return (
      <Overlay onClose={onClose} wide>
        <h2 className="text-lg font-bold text-[#5A3D7A] mb-1">🤖 Lección generada</h2>
        <p className="text-xs text-gray-500 mb-4">Revisa y edita antes de importar</p>

        {/* Lesson summary */}
        <div className="bg-[#F0E5FF] rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#5A3D7A]">{result.title}</p>
              <p className="text-xs text-gray-500">{result.code} · Nivel {result.level} · {result.duration} min</p>
            </div>
            <span className="text-xs font-bold px-2 py-1 bg-white rounded-lg text-[#9B7CB8]">
              {result.slides.length} slides
            </span>
          </div>
          {result.objectives && result.objectives.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] font-bold text-[#5A3D7A] uppercase tracking-wider">Objetivos:</p>
              {result.objectives.map((obj, i) => (
                <p key={i} className="text-xs text-gray-600">• {obj}</p>
              ))}
            </div>
          )}
        </div>

        {/* Slide list preview */}
        <div className="space-y-2 max-h-60 overflow-auto mb-4">
          {result.slides.map((slide, i) => (
            <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-2.5 border border-gray-100">
              <span className="w-7 h-7 flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700 truncate">{slide.title || `Slide ${i + 1}`}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-medium">{slide.type}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    slide.phase === 'pre' ? 'bg-blue-50 text-blue-600' :
                    slide.phase === 'post' ? 'bg-amber-50 text-amber-600' :
                    'bg-green-50 text-green-600'
                  }`}>
                    {slide.phase?.toUpperCase()}
                  </span>
                </div>
              </div>
              {slide.teacherNotes && (
                <span className="text-[10px] text-gray-400" title={slide.teacherNotes}>📝</span>
              )}
            </div>
          ))}
        </div>

        {/* Homework suggestion */}
        {result.homeworkSuggestion && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
            <p className="text-xs font-bold text-amber-700 mb-1">📝 Tarea sugerida: {result.homeworkSuggestion.title}</p>
            <p className="text-[10px] text-amber-600">{result.homeworkSuggestion.description}</p>
            <p className="text-[10px] text-amber-500 mt-1">{result.homeworkSuggestion.slides.length} slides de práctica</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => { reset(); setStep(1); }}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50"
          >
            🔄 Regenerar
          </button>
          <button
            onClick={() => onImport(result)}
            className="flex-1 py-2.5 bg-gradient-to-r from-[#C8A8DC] to-[#9B7CB8] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all"
          >
            ✅ Importar al editor
          </button>
        </div>
      </Overlay>
    );
  }

  return null;
}

// ── Overlay wrapper ───────────────────────────────────────────

function Overlay({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-2xl p-6 shadow-2xl ${wide ? 'w-full max-w-lg' : 'w-full max-w-md'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
