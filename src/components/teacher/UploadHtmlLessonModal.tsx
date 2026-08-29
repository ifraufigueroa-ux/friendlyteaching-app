// FriendlyTeaching.cl — UploadHtmlLessonModal
//
// Sube un archivo .html/.htm o pega HTML crudo para crear una lección
// con una sola slide de tipo 'html_content'. El HTML se guarda tal
// cual y el sanitizado corre en el render (ver HtmlContentSlide.tsx),
// así el teacher puede editar el markup después sin perder cosas que
// el sanitizer strippearía en storage.
//
// Extracción de título: si el HTML contiene <title> o <h1>, se pre-
// carga el input de título con lo que se encuentre. Eso ahorra un
// paso cuando el archivo ya trae metadata coherente.
'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { createLessonFromHtml } from '@/hooks/useLessons';
import type { LessonLevel } from '@/types/firebase';

const LESSON_LEVELS: LessonLevel[] = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];

interface Props {
  teacherId: string;
  onClose: () => void;
}

function extractTitleFromHtml(html: string): string | null {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch?.[1]) {
    const cleaned = titleMatch[1].replace(/\s+/g, ' ').trim();
    if (cleaned.length > 0) return cleaned.slice(0, 120);
  }
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match?.[1]) {
    const cleaned = h1Match[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (cleaned.length > 0) return cleaned.slice(0, 120);
  }
  return null;
}

// Genera un código corto tipo "HTM-A3F9" cuando el teacher no completa
// uno. Los códigos son sólo para display en la grilla; no hay uniqueness
// enforcement en Firestore, así que basta con que se vea distinto.
function generateAutoCode(): string {
  const rand = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `HTM-${rand}`;
}

export default function UploadHtmlLessonModal({ teacherId, onClose }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [html, setHtml] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [level, setLevel] = useState<LessonLevel>('A1');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!/\.(html?|xhtml)$/i.test(file.name)) {
      setError('El archivo debe ser .html, .htm o .xhtml.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError(`El archivo es muy grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Máximo 2 MB.`);
      return;
    }
    const text = await file.text();
    setHtml(text);
    setFileName(file.name);
    if (!title) {
      const extracted = extractTitleFromHtml(text);
      if (extracted) setTitle(extracted);
    }
  }

  function handlePaste(v: string) {
    setHtml(v);
    setFileName(null);
    if (!title && v.trim().length > 0) {
      const extracted = extractTitleFromHtml(v);
      if (extracted) setTitle(extracted);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedTitle = title.trim();
    const trimmedHtml = html.trim();
    if (!trimmedTitle) { setError('El título es requerido.'); return; }
    if (!trimmedHtml) { setError('Subí un archivo HTML o pegá el markup.'); return; }
    setSaving(true);
    try {
      const finalCode = code.trim().toUpperCase() || generateAutoCode();
      const id = await createLessonFromHtml(teacherId, {
        title: trimmedTitle,
        code: finalCode,
        level,
        html: trimmedHtml,
      });
      router.push(`/dashboard/teacher/lessons/${id}/edit`);
    } catch (err) {
      console.error('[upload-html] createLessonFromHtml failed:', err);
      setError('No se pudo crear la lección. Revisá la consola para más detalle.');
      setSaving(false);
    }
  }

  const charCount = html.length;
  const previewSnippet = html.slice(0, 300);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-[#5A3D7A]">📄 Nueva lección desde HTML</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleCreate} className="p-5 space-y-4">
          {error && <p className="text-red-500 text-xs bg-red-50 p-2 rounded-lg">{error}</p>}

          {/* File input + drop zone */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Archivo HTML
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              className="cursor-pointer border-2 border-dashed border-[#C8A8DC] rounded-xl px-4 py-6 text-center hover:bg-[#F0E5FF]/40 transition-colors"
            >
              <p className="text-2xl mb-1">📄</p>
              {fileName ? (
                <>
                  <p className="text-sm font-semibold text-[#5A3D7A]">{fileName}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Click o arrastrá otro archivo para reemplazar</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-gray-700">Arrastrá un .html acá o hacé click</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Máx 2 MB · .html · .htm · .xhtml</p>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".html,.htm,.xhtml,text/html"
                className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
              />
            </div>
          </div>

          {/* Paste HTML fallback */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              O pegá el HTML directamente
            </label>
            <textarea
              value={html}
              onChange={(e) => handlePaste(e.target.value)}
              placeholder="<div class='...'>...</div>"
              rows={5}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              {charCount > 0 ? `${charCount.toLocaleString('es-CL')} caracteres cargados` : 'Vacío'}
            </p>
          </div>

          {/* Preview snippet */}
          {previewSnippet && (
            <details className="bg-gray-50 border border-gray-200 rounded-xl">
              <summary className="text-xs font-semibold text-gray-600 cursor-pointer px-3 py-2">
                Ver primeros 300 caracteres
              </summary>
              <pre className="text-[10px] text-gray-700 font-mono p-3 overflow-x-auto whitespace-pre-wrap border-t border-gray-200">
                {previewSnippet}{html.length > 300 && '…'}
              </pre>
            </details>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Título *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ej. OACI Class 1 — Aircraft parts"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
              />
              {title && title === extractTitleFromHtml(html) && (
                <p className="text-[10px] text-gray-400 mt-1">Extraído de &lt;title&gt; o &lt;h1&gt; del HTML.</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Código</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="ej. OACI.V1"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] uppercase"
              />
              <p className="text-[10px] text-gray-400 mt-1">Se auto-genera si lo dejás vacío.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nivel</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as LessonLevel)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] bg-white"
              >
                {LESSON_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || html.trim().length === 0 || title.trim().length === 0}
              className="flex-1 py-2.5 bg-[#5A3D7A] hover:bg-[#4A2D6A] text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
            >
              {saving ? 'Creando…' : '📄 Crear y abrir editor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
