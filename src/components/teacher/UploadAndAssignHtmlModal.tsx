// FriendlyTeaching.cl — UploadAndAssignHtmlModal
//
// One-shot version of UploadHtmlLessonModal: the teacher drops an HTML
// file (or pastes markup), picks the students who should receive it,
// and the modal both creates the lesson and writes one studentAssignment
// per picked student in a single submit — no detour through the editor.
//
// Reuses the same HTML title-extraction heuristic and the same lesson
// payload shape as UploadHtmlLessonModal so the two flows stay in sync.
// Keeps the standalone modal for teachers who still want to land in the
// editor; this one is for the "fire-and-forget" assignment use case.

'use client';

import { useMemo, useRef, useState } from 'react';
import { X, FileText, UserPlus } from 'lucide-react';
import { createLessonFromHtml } from '@/hooks/useLessons';
import { createStudentAssignment } from '@/hooks/useStudentAssignments';
import { useStudents } from '@/hooks/useStudents';
import type { LessonLevel } from '@/types/firebase';

const LESSON_LEVELS: LessonLevel[] = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];

interface Props {
  teacherId: string;
  onClose: () => void;
  onSaved?: (summary: { lessonId: string; assignedCount: number }) => void;
  lockedStudentId?:   string;
  lockedStudentName?: string;
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

function generateAutoCode(): string {
  const rand = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `HTM-${rand}`;
}

export default function UploadAndAssignHtmlModal({ teacherId, onClose, onSaved, lockedStudentId, lockedStudentName }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [html, setHtml] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [level, setLevel] = useState<LessonLevel>('A1');
  const [picked, setPicked] = useState<Set<string>>(
    () => lockedStudentId ? new Set([lockedStudentId]) : new Set(),
  );
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { students } = useStudents();
  const activeStudents = useMemo(
    () => students
      .filter(s => s.status === 'active' || s.status === 'approved')
      .sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [students],
  );
  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeStudents;
    return activeStudents.filter(s => s.fullName.toLowerCase().includes(q));
  }, [activeStudents, search]);

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

  function toggleStudent(uid: string) {
    setPicked(prev => {
      const n = new Set(prev);
      if (n.has(uid)) n.delete(uid); else n.add(uid);
      return n;
    });
  }

  function selectAllFiltered() {
    setPicked(prev => {
      const n = new Set(prev);
      for (const s of filteredStudents) n.add(s.uid);
      return n;
    });
  }

  function clearAll() {
    setPicked(new Set());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedTitle = title.trim();
    const trimmedHtml = html.trim();
    if (!trimmedTitle) { setError('El título es requerido.'); return; }
    if (!trimmedHtml)  { setError('Subí un archivo HTML o pegá el markup.'); return; }
    if (picked.size === 0) { setError('Elegí al menos un estudiante.'); return; }

    setSaving(true);
    try {
      setProgress('Creando lección…');
      const finalCode = code.trim().toUpperCase() || generateAutoCode();
      const lessonId = await createLessonFromHtml(teacherId, {
        title: trimmedTitle,
        code:  finalCode,
        level,
        html:  trimmedHtml,
      });

      setProgress(`Asignando a ${picked.size} estudiante${picked.size === 1 ? '' : 's'}…`);
      let assignedCount = 0;
      for (const studentId of picked) {
        try {
          await createStudentAssignment({
            studentId,
            teacherId,
            source: 'lesson',
            refId:  lessonId,
            title:  trimmedTitle,
            level,
          });
          assignedCount += 1;
        } catch (err) {
          console.warn('[upload-and-assign] assignment failed for', studentId, err);
        }
      }

      onSaved?.({ lessonId, assignedCount });
      onClose();
    } catch (err) {
      console.error('[upload-and-assign] failed:', err);
      setError('No se pudo crear o asignar la lección. Revisá la consola para más detalle.');
      setSaving(false);
      setProgress('');
    }
  }

  const charCount = html.length;
  const canSubmit = !saving && html.trim().length > 0 && title.trim().length > 0 && picked.size > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#5A3D7A]" strokeWidth={2.25} />
            <h2 className="font-bold text-[#5A3D7A]">Subir y asignar HTML</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar">
            <X className="w-5 h-5" strokeWidth={2.25} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {error && <p className="text-red-500 text-xs bg-red-50 p-2 rounded-lg">{error}</p>}

          {/* ── Step 1 · HTML source ────────────────────────────── */}
          <section className="space-y-3">
            <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-widest">1 · Contenido HTML</p>

            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              className="cursor-pointer border-2 border-dashed border-[#C8A8DC] rounded-xl px-4 py-5 text-center hover:bg-[#F0E5FF]/40 transition-colors"
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

            <details className="group">
              <summary className="text-xs font-semibold text-gray-500 cursor-pointer hover:text-[#5A3D7A]">
                O pegá el HTML directamente
              </summary>
              <textarea
                value={html}
                onChange={(e) => handlePaste(e.target.value)}
                placeholder="<div class='...'>...</div>"
                rows={4}
                className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                {charCount > 0 ? `${charCount.toLocaleString('es-CL')} caracteres cargados` : 'Vacío'}
              </p>
            </details>
          </section>

          {/* ── Step 2 · Metadata ───────────────────────────────── */}
          <section className="space-y-3">
            <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-widest">2 · Metadata</p>
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Título *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ej. OACI Class 1 — Aircraft parts"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nivel</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as LessonLevel)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] bg-white"
                >
                  {LESSON_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Código (opcional)</label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Se auto-genera si lo dejás vacío"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] uppercase"
                />
              </div>
            </div>
          </section>

          {/* ── Step 3 · Student picker ─────────────────────────── */}
          <section className="space-y-2">
            {lockedStudentId ? (
              <>
                <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-widest">3 · Asignar a estudiante</p>
                <div className="rounded-xl border border-[#E8D5F0] bg-[#F0E5FF]/50 px-3 py-2 text-sm font-semibold text-[#5A3D7A]">
                  {lockedStudentName ?? lockedStudentId}
                </div>
              </>
            ) : (
            <>
            <div className="flex items-end justify-between gap-2">
              <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-widest">
                3 · Asignar a estudiantes
                <span className="ml-2 text-[11px] font-bold text-[#9B7CB8] normal-case tracking-normal">
                  · {picked.size} seleccionado{picked.size === 1 ? '' : 's'}
                </span>
              </p>
              <div className="flex gap-2 text-[10px] font-bold">
                <button type="button" onClick={selectAllFiltered} className="text-[#5A3D7A] hover:underline">
                  Seleccionar visibles
                </button>
                <span className="text-gray-300">·</span>
                <button type="button" onClick={clearAll} className="text-gray-500 hover:underline">
                  Limpiar
                </button>
              </div>
            </div>

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar estudiante por nombre…"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
            />

            <div className="max-h-56 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
              {filteredStudents.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">
                  {activeStudents.length === 0
                    ? 'No tenés estudiantes activos todavía.'
                    : 'Ningún estudiante coincide con la búsqueda.'}
                </p>
              ) : (
                filteredStudents.map(s => (
                  <label
                    key={s.uid}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-[#F0E5FF]/40 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={picked.has(s.uid)}
                      onChange={() => toggleStudent(s.uid)}
                      className="accent-[#5A3D7A] w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 flex-1 truncate">{s.fullName}</span>
                    {s.studentData?.level && (
                      <span className="text-[10px] font-bold text-[#5A3D7A] bg-[#F0E5FF] px-2 py-0.5 rounded-full">
                        {s.studentData.level}
                      </span>
                    )}
                  </label>
                ))
              )}
            </div>
            </>
            )}
          </section>

          {/* ── Footer ─────────────────────────────────────────── */}
          {saving && progress && (
            <p className="text-xs text-[#5A3D7A] font-semibold text-center">{progress}</p>
          )}

          <div className="flex gap-3 pt-1">
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
              disabled={!canSubmit}
              className="flex-1 py-2.5 bg-[#5A3D7A] hover:bg-[#4A2D6A] text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" strokeWidth={2.25} />
              {saving ? 'Guardando…' : `Crear y asignar${picked.size > 0 ? ` (${picked.size})` : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
