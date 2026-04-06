// FriendlyTeaching.cl — Create Lesson from Embed Modal
// Supports: Canva share link, Google Slides, or any <iframe> embed code

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createLessonFromPresentation, useCourses } from '@/hooks/useLessons';
import type { LessonLevel } from '@/types/firebase';

const LESSON_LEVELS: LessonLevel[] = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];

// ── URL extraction helpers ─────────────────────────────────────

function extractEmbedUrl(input: string): string {
  const trimmed = input.trim();

  // Case 1: <iframe ...src="URL"...> — extract the src attribute
  const srcMatch = trimmed.match(/src=["']([^"']+)["']/);
  if (srcMatch) return srcMatch[1];

  // Case 2: Canva share URL → embed URL
  if (trimmed.includes('canva.com/design/')) {
    const withoutFragment = trimmed.split('#')[0];
    if (!withoutFragment.includes('?embed')) {
      return withoutFragment.includes('?')
        ? withoutFragment + '&embed'
        : withoutFragment.replace(/\/?$/, '') + '?embed';
    }
    return withoutFragment;
  }

  // Case 3: Google Slides share URL → embed URL
  if (trimmed.includes('docs.google.com/presentation/')) {
    return trimmed.replace(/\/(edit|pub|preview)[^?]*/, '/embed?start=false&loop=false&delayms=3000');
  }

  // Case 4: plain URL — return as-is
  return trimmed;
}

// ── Main Modal ─────────────────────────────────────────────────

interface Props {
  teacherId: string;
  onClose: () => void;
}

export default function CreateFromPresentationModal({ teacherId, onClose }: Props) {
  const router = useRouter();
  const { courses } = useCourses();
  const [form, setForm] = useState({
    title: '',
    code: '',
    level: 'A1' as LessonLevel,
    courseId: '',
  });
  const [embedInput, setEmbedInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const detectedUrl = embedInput.trim() ? extractEmbedUrl(embedInput) : '';

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim() || !form.code.trim()) {
      setError('Título y código son requeridos.');
      return;
    }
    if (!teacherId) {
      setError('Sesión no detectada. Recarga la página e intenta de nuevo.');
      return;
    }
    if (!detectedUrl) {
      setError('Ingresa un URL de Canva o un código <iframe> válido.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const id = await createLessonFromPresentation(teacherId, {
        title: form.title.trim(),
        code: form.code.trim().toUpperCase(),
        level: form.level,
        courseId: form.courseId || 'uncategorized',
        presentationUrl: detectedUrl,
        canvaMode: true,
      });
      router.push(`/dashboard/teacher/lessons/${id}/edit`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido.';
      setError(`Error al crear la lección: ${msg}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-bold text-[#5A3D7A] text-base">🎨 Crear desde Canva</h2>
            <p className="text-xs text-gray-400 mt-0.5">Pega el embed de Canva o Google Slides</p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleCreate} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-4">

            {/* Error */}
            {error && (
              <p className="text-red-500 text-xs bg-red-50 border border-red-100 p-3 rounded-xl">{error}</p>
            )}

            {/* Basic info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Título *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="ej. Social Media & The Mind"
                  disabled={saving}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Código *</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="ej. B2.D01"
                  disabled={saving}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] uppercase disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nivel</label>
                <select
                  value={form.level}
                  onChange={(e) => setForm((f) => ({ ...f, level: e.target.value as LessonLevel }))}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] bg-white disabled:opacity-50"
                >
                  {LESSON_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              {courses.length > 0 && (
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Curso (opcional)</label>
                  <select
                    value={form.courseId}
                    onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
                    disabled={saving}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] bg-white disabled:opacity-50"
                  >
                    <option value="">Sin curso</option>
                    {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Embed input */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                URL o código embed *
              </label>
              <textarea
                value={embedInput}
                onChange={(e) => setEmbedInput(e.target.value)}
                disabled={saving}
                rows={4}
                placeholder={`Pega aquí cualquiera de estas opciones:\n• URL de Canva (compartir → ver enlace)\n• URL de Google Slides\n• Código <iframe> completo`}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] resize-none disabled:opacity-50"
              />
            </div>

            {/* URL preview */}
            {detectedUrl && (
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
                <p className="text-xs text-purple-600 font-semibold mb-1">✅ URL detectada:</p>
                <p className="text-xs text-[#5A3D7A] break-all font-mono leading-relaxed">
                  {detectedUrl}
                </p>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 space-y-2">
              <p className="text-xs text-amber-700 font-semibold">📋 Cómo obtener el embed</p>
              <div className="space-y-1.5 text-xs text-amber-600">
                <p><span className="font-semibold">Canva:</span> Compartir → Presentación pública → Copiar enlace</p>
                <p><span className="font-semibold">Google Slides:</span> Archivo → Publicar en la web → Incrustar → Copiar iframe</p>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-100 flex gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !detectedUrl}
              className="flex-1 py-2.5 bg-[#5A3D7A] hover:bg-[#4A2D6A] text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creando…
                </>
              ) : (
                '🎨 Crear lección'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
