// FriendlyTeaching.cl — AssignFromLibraryModal
//
// Pick one lesson from the FT Library and assign it to one or more
// students in a single modal. Writes `studentAssignments` with
// source:'lesson' + refId so the student lands on `/classroom/[id]`
// and the normal progress tracker kicks in.

'use client';

import { useMemo, useState } from 'react';
import { X, BookOpen, UserPlus } from 'lucide-react';
import { useLessons } from '@/hooks/useLessons';
import { createStudentAssignment } from '@/hooks/useStudentAssignments';
import { useStudents } from '@/hooks/useStudents';
import type { LessonLevel } from '@/types/firebase';

const LESSON_LEVELS: (LessonLevel | 'all')[] = ['all', 'A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];

interface Props {
  teacherId: string;
  onClose:   () => void;
  onSaved?:  (summary: { lessonId: string; assignedCount: number }) => void;
  /** When set, the student picker is pre-filled with this uid and
   *  hidden. Used when this modal is opened from a per-student
   *  context (class notes, student detail). */
  lockedStudentId?: string;
  /** Shown in place of the picker when the student is locked. */
  lockedStudentName?: string;
}

export default function AssignFromLibraryModal({ teacherId, onClose, onSaved, lockedStudentId, lockedStudentName }: Props) {
  const { lessons } = useLessons(teacherId, 'teacher');
  const { students } = useStudents();

  const [pickedLessonId, setPickedLessonId] = useState<string | null>(null);
  const [pickedStudents, setPickedStudents] = useState<Set<string>>(
    () => lockedStudentId ? new Set([lockedStudentId]) : new Set(),
  );
  const [lessonSearch, setLessonSearch]     = useState('');
  const [lessonLevelFilter, setLessonLevelFilter] = useState<LessonLevel | 'all'>('all');
  const [studentSearch, setStudentSearch]   = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving]   = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const activeStudents = useMemo(
    () => students
      .filter(s => s.status === 'active' || s.status === 'approved')
      .sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [students],
  );
  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return activeStudents;
    return activeStudents.filter(s => s.fullName.toLowerCase().includes(q));
  }, [activeStudents, studentSearch]);

  const publishedLessons = useMemo(
    () => lessons
      .filter(l => l.isPublished)
      .filter(l => lessonLevelFilter === 'all' || l.level === lessonLevelFilter)
      .filter(l => {
        const q = lessonSearch.trim().toLowerCase();
        if (!q) return true;
        return l.title.toLowerCase().includes(q) || (l.code ?? '').toLowerCase().includes(q);
      })
      .sort((a, b) => a.title.localeCompare(b.title)),
    [lessons, lessonLevelFilter, lessonSearch],
  );

  const pickedLesson = pickedLessonId ? publishedLessons.find(l => l.id === pickedLessonId) ?? lessons.find(l => l.id === pickedLessonId) : null;

  function toggleStudent(uid: string) {
    setPickedStudents(prev => {
      const n = new Set(prev);
      if (n.has(uid)) n.delete(uid); else n.add(uid);
      return n;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!pickedLesson)             { setError('Elegí una lección.');          return; }
    if (pickedStudents.size === 0) { setError('Elegí al menos un estudiante.'); return; }
    setSaving(true);
    try {
      setProgress(`Asignando a ${pickedStudents.size} estudiante${pickedStudents.size === 1 ? '' : 's'}…`);
      let assignedCount = 0;
      for (const studentId of pickedStudents) {
        try {
          await createStudentAssignment({
            studentId,
            teacherId,
            source: 'lesson',
            refId:  pickedLesson.id,
            title:  pickedLesson.title,
            level:  pickedLesson.level,
            notes:  notes.trim() || undefined,
          });
          assignedCount += 1;
        } catch (err) {
          console.warn('[assign-from-library] failed for', studentId, err);
        }
      }
      onSaved?.({ lessonId: pickedLesson.id, assignedCount });
      onClose();
    } catch (err) {
      console.error('[assign-from-library] failed:', err);
      setError('No se pudo asignar. Revisá la consola para más detalle.');
      setSaving(false);
      setProgress('');
    }
  }

  const canSubmit = !saving && pickedLesson && pickedStudents.size > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#5A3D7A]" strokeWidth={2.25} />
            <h2 className="font-bold text-[#5A3D7A]">Asignar desde la Librería FT</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar">
            <X className="w-5 h-5" strokeWidth={2.25} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
          {error && <p className="lg:col-span-2 text-red-500 text-xs bg-red-50 p-2 rounded-lg">{error}</p>}

          {/* ── Column 1 · Lesson picker ──────────────────────── */}
          <section className="space-y-2">
            <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-widest">
              1 · Lección
              {pickedLesson && (
                <span className="ml-2 text-[11px] font-bold text-emerald-700 normal-case tracking-normal">
                  · {pickedLesson.code} — {pickedLesson.title}
                </span>
              )}
            </p>
            <div className="flex gap-2">
              <input
                type="search"
                value={lessonSearch}
                onChange={(e) => setLessonSearch(e.target.value)}
                placeholder="Buscar por código o título…"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
              />
              <select
                value={lessonLevelFilter}
                onChange={(e) => setLessonLevelFilter(e.target.value as LessonLevel | 'all')}
                className="px-2 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
              >
                {LESSON_LEVELS.map(l => (
                  <option key={l} value={l}>{l === 'all' ? 'Todos los niveles' : l}</option>
                ))}
              </select>
            </div>
            <div className="max-h-72 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
              {publishedLessons.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">
                  No hay lecciones publicadas que coincidan. Publicá o creá una en la Librería primero.
                </p>
              ) : (
                publishedLessons.map(l => {
                  const picked = pickedLessonId === l.id;
                  return (
                    <label
                      key={l.id}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${picked ? 'bg-[#F0E5FF]' : 'hover:bg-[#F0E5FF]/40'}`}
                    >
                      <input
                        type="radio"
                        name="lesson"
                        checked={picked}
                        onChange={() => setPickedLessonId(l.id)}
                        className="accent-[#5A3D7A] w-4 h-4"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#2D1B4E] truncate">{l.title}</p>
                        <p className="text-[11px] text-gray-400 inline-flex items-center gap-2">
                          <span className="font-mono">{l.code}</span>
                          <span>·</span>
                          <span>{l.level}</span>
                        </p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </section>

          {/* ── Column 2 · Student picker + notes ─────────────── */}
          <section className="space-y-2">
            {lockedStudentId ? (
              <>
                <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-widest">2 · Estudiante</p>
                <div className="rounded-xl border border-[#E8D5F0] bg-[#F0E5FF]/50 px-3 py-2 text-sm font-semibold text-[#5A3D7A]">
                  {lockedStudentName ?? lockedStudentId}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-end justify-between gap-2">
                  <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-widest">
                    2 · Estudiantes
                    <span className="ml-2 text-[11px] font-bold text-[#9B7CB8] normal-case tracking-normal">
                      · {pickedStudents.size} seleccionado{pickedStudents.size === 1 ? '' : 's'}
                    </span>
                  </p>
                  <div className="flex gap-2 text-[10px] font-bold">
                    <button type="button" onClick={() => setPickedStudents(new Set(filteredStudents.map(s => s.uid)))} className="text-[#5A3D7A] hover:underline">
                      Seleccionar visibles
                    </button>
                    <span className="text-gray-300">·</span>
                    <button type="button" onClick={() => setPickedStudents(new Set())} className="text-gray-500 hover:underline">
                      Limpiar
                    </button>
                  </div>
                </div>
                <input
                  type="search"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Buscar estudiante…"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
                />
                <div className="max-h-56 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
                  {filteredStudents.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-8">Ningún estudiante activo.</p>
                  ) : (
                    filteredStudents.map(s => (
                      <label key={s.uid} className="flex items-center gap-3 px-3 py-2 hover:bg-[#F0E5FF]/40 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pickedStudents.has(s.uid)}
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

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 mt-2">Nota (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mensaje breve que el alumno va a ver con la asignación"
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] resize-none"
              />
            </div>
          </section>

          {/* ── Footer ────────────────────────────────────────── */}
          {saving && progress && (
            <p className="lg:col-span-2 text-xs text-[#5A3D7A] font-semibold text-center">{progress}</p>
          )}
          <div className="lg:col-span-2 flex gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={saving}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={!canSubmit}
              className="flex-1 py-2.5 bg-[#5A3D7A] hover:bg-[#4A2D6A] text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-1.5">
              <UserPlus className="w-4 h-4" strokeWidth={2.25} />
              {saving ? 'Guardando…' : `Asignar${pickedStudents.size > 0 ? ` (${pickedStudents.size})` : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
