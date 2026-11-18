// FriendlyTeaching.cl — AssignExternalModal
//
// Paste any external URL (Ellii, Off2Class, Drive, YouTube, Canva…),
// pick students, and write one studentAssignment per student with
// source:'external'. No progress is tracked for external material —
// the browser tab is outside the app's visibility — but the student
// still sees the card in "My Lessons" with the link.

'use client';

import { useMemo, useState } from 'react';
import { X, Link2, UserPlus } from 'lucide-react';
import { createStudentAssignment } from '@/hooks/useStudentAssignments';
import { useStudents } from '@/hooks/useStudents';
import type { LessonLevel } from '@/types/firebase';

const LEVELS: LessonLevel[] = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];

interface Props {
  teacherId: string;
  onClose:   () => void;
  onSaved?:  (summary: { assignedCount: number }) => void;
}

function normaliseUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function AssignExternalModal({ teacherId, onClose, onSaved }: Props) {
  const [url, setUrl]       = useState('');
  const [title, setTitle]   = useState('');
  const [level, setLevel]   = useState<LessonLevel>('B1');
  const [notes, setNotes]   = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
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
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeStudents;
    return activeStudents.filter(s => s.fullName.toLowerCase().includes(q));
  }, [activeStudents, search]);

  function toggle(uid: string) {
    setPicked(prev => {
      const n = new Set(prev);
      if (n.has(uid)) n.delete(uid); else n.add(uid);
      return n;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const normalised = normaliseUrl(url);
    if (!normalised)       { setError('Pegá una URL válida.');             return; }
    if (!title.trim())     { setError('Poné un título corto para la asignación.'); return; }
    if (picked.size === 0) { setError('Elegí al menos un estudiante.');    return; }

    setSaving(true);
    try {
      setProgress(`Asignando a ${picked.size} estudiante${picked.size === 1 ? '' : 's'}…`);
      let assignedCount = 0;
      for (const studentId of picked) {
        try {
          await createStudentAssignment({
            studentId,
            teacherId,
            source:      'external',
            externalUrl: normalised,
            title:       title.trim(),
            level,
            notes:       notes.trim() || undefined,
          });
          assignedCount += 1;
        } catch (err) {
          console.warn('[assign-external] failed for', studentId, err);
        }
      }
      onSaved?.({ assignedCount });
      onClose();
    } catch (err) {
      console.error('[assign-external] failed:', err);
      setError('No se pudo asignar. Revisá la consola para más detalle.');
      setSaving(false);
      setProgress('');
    }
  }

  const canSubmit = !saving && url.trim() && title.trim() && picked.size > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-[#5A3D7A]" strokeWidth={2.25} />
            <h2 className="font-bold text-[#5A3D7A]">Asignar link externo (Ellii, Off2Class, Drive…)</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar">
            <X className="w-5 h-5" strokeWidth={2.25} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {error && <p className="text-red-500 text-xs bg-red-50 p-2 rounded-lg">{error}</p>}

          {/* ── 1 · Material ──────────────────────────────── */}
          <section className="space-y-3">
            <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-widest">1 · Material</p>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">URL *</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://class.off2class.com/…"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                El alumno abre el link en una pestaña nueva. No se guarda progreso de contenido externo.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Título *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ej. Off2Class · Future Perfect Lesson"
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
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nota (opcional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Mensaje breve que el alumno va a ver con la asignación"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] resize-none"
                />
              </div>
            </div>
          </section>

          {/* ── 2 · Students ──────────────────────────────── */}
          <section className="space-y-2">
            <div className="flex items-end justify-between gap-2">
              <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-widest">
                2 · Estudiantes
                <span className="ml-2 text-[11px] font-bold text-[#9B7CB8] normal-case tracking-normal">
                  · {picked.size} seleccionado{picked.size === 1 ? '' : 's'}
                </span>
              </p>
              <div className="flex gap-2 text-[10px] font-bold">
                <button type="button" onClick={() => setPicked(new Set(filtered.map(s => s.uid)))} className="text-[#5A3D7A] hover:underline">
                  Seleccionar visibles
                </button>
                <span className="text-gray-300">·</span>
                <button type="button" onClick={() => setPicked(new Set())} className="text-gray-500 hover:underline">
                  Limpiar
                </button>
              </div>
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar estudiante…"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
            />
            <div className="max-h-56 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">Ningún estudiante activo.</p>
              ) : (
                filtered.map(s => (
                  <label key={s.uid} className="flex items-center gap-3 px-3 py-2 hover:bg-[#F0E5FF]/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={picked.has(s.uid)}
                      onChange={() => toggle(s.uid)}
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
          </section>

          {saving && progress && (
            <p className="text-xs text-[#5A3D7A] font-semibold text-center">{progress}</p>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={saving}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={!canSubmit}
              className="flex-1 py-2.5 bg-[#5A3D7A] hover:bg-[#4A2D6A] text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-1.5">
              <UserPlus className="w-4 h-4" strokeWidth={2.25} />
              {saving ? 'Guardando…' : `Asignar${picked.size > 0 ? ` (${picked.size})` : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
