'use client';
// FriendlyTeaching.cl — Class Notes Modal
// Guided post-class notes template. Called after recording a class session.

import { useState } from 'react';
import type { ClassNotes, ClassMood } from '@/hooks/useClassHistory';

const MOOD_OPTIONS: { value: ClassMood; label: string; emoji: string; color: string }[] = [
  { value: 'great', label: 'Excelente', emoji: '🌟', color: 'border-green-400 bg-green-50 text-green-700' },
  { value: 'good', label: 'Bien', emoji: '😊', color: 'border-blue-400 bg-blue-50 text-blue-700' },
  { value: 'regular', label: 'Regular', emoji: '😕', color: 'border-amber-400 bg-amber-50 text-amber-700' },
];

interface Props {
  studentName: string;
  onSave: (notes: ClassNotes) => Promise<void>;
  onSkip: () => void;
}

export function ClassNotesModal({ studentName, onSave, onSkip }: Props) {
  const [covered, setCovered] = useState('');
  const [performance, setPerformance] = useState('');
  const [nextClass, setNextClass] = useState('');
  const [homework, setHomework] = useState('');
  const [mood, setMood] = useState<ClassMood | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    // Require at least one field filled
    if (!covered && !performance && !nextClass && !homework && !mood) {
      onSkip();
      return;
    }
    setSaving(true);
    try {
      const notes: ClassNotes = {};
      if (covered.trim()) notes.covered = covered.trim();
      if (performance.trim()) notes.performance = performance.trim();
      if (nextClass.trim()) notes.nextClass = nextClass.trim();
      if (homework.trim()) notes.homework = homework.trim();
      if (mood) notes.mood = mood;
      await onSave(notes);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-bold text-[#5A3D7A] text-base">📝 Notas de clase</h2>
              <p className="text-xs text-gray-400 mt-0.5">Clase con {studentName}</p>
            </div>
            <button
              onClick={onSkip}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Saltar
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Mood selector */}
          <div>
            <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-2">
              ¿Cómo fue la clase?
            </label>
            <div className="flex gap-2">
              {MOOD_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMood(m => (m === opt.value ? null : opt.value))}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                    mood === opt.value
                      ? opt.color + ' border-opacity-100'
                      : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                  }`}
                >
                  <span className="text-xl">{opt.emoji}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Covered topics */}
          <div>
            <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1.5">
              📚 ¿Qué cubrimos?
            </label>
            <textarea
              value={covered}
              onChange={e => setCovered(e.target.value)}
              rows={2}
              placeholder="Ej: Vocabulario de emociones, Present Perfect con since/for..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] focus:border-transparent"
            />
          </div>

          {/* Student performance */}
          <div>
            <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1.5">
              💬 Desempeño del estudiante
            </label>
            <textarea
              value={performance}
              onChange={e => setPerformance(e.target.value)}
              rows={2}
              placeholder="Ej: Buena participación oral, pero le cuesta la escritura. Mejoró pronunciación..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] focus:border-transparent"
            />
          </div>

          {/* Homework */}
          <div>
            <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1.5">
              📋 Tarea asignada
            </label>
            <input
              type="text"
              value={homework}
              onChange={e => setHomework(e.target.value)}
              placeholder="Ej: Ejercicios 3-5 pág. 42 / Sin tarea"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] focus:border-transparent"
            />
          </div>

          {/* Next class */}
          <div>
            <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1.5">
              🎯 Foco próxima clase
            </label>
            <input
              type="text"
              value={nextClass}
              onChange={e => setNextClass(e.target.value)}
              placeholder="Ej: Repaso de Past Simple + introducir Past Continuous..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] focus:border-transparent"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0 flex gap-3">
          <button
            onClick={onSkip}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Saltar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-[#9B7CB8] hover:bg-[#7A5C97] text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
          >
            {saving ? 'Guardando...' : '💾 Guardar notas'}
          </button>
        </div>
      </div>
    </div>
  );
}
