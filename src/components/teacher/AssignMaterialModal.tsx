// FriendlyTeaching.cl — AssignMaterialModal
// Dos tabs claros: "Assign FT lessons" (interno — Librería) y "Assign
// other lessons" (externo — Off2Class, Ellii, Drive, YouTube, etc.).
// Escribe a la colección `studentAssignments` a través del hook
// useStudentAssignments.

'use client';
import { useMemo, useState } from 'react';
import { useLessons } from '@/hooks/useLessons';
import { createStudentAssignment } from '@/hooks/useStudentAssignments';
import { detectMaterialType } from '@/components/planner/bookingUtils';
import type { LessonLevel } from '@/types/firebase';

const LEVEL_COLORS: Record<string, string> = {
  A0: 'bg-gray-100 text-gray-600',
  A1: 'bg-blue-100 text-blue-700',
  A2: 'bg-sky-100 text-sky-700',
  B1: 'bg-green-100 text-green-700',
  'B1+': 'bg-emerald-100 text-emerald-700',
  B2: 'bg-amber-100 text-amber-700',
  C1: 'bg-purple-100 text-purple-700',
};
const LEVELS: LessonLevel[] = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];

interface Props {
  studentId: string;
  studentName: string;
  teacherId: string;
  onClose: () => void;
  onAssigned?: () => void;
}

export default function AssignMaterialModal({
  studentId, studentName, teacherId, onClose, onAssigned,
}: Props) {
  const [tab, setTab] = useState<'ft' | 'external'>('ft');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [okMsg, setOkMsg]   = useState<string | null>(null);

  // ── FT tab state ─────────────────────────────────────────────
  const { lessons } = useLessons(teacherId, 'teacher');
  const [ftSearch, setFtSearch]   = useState('');
  const [ftLevel, setFtLevel]     = useState<string>('');
  const [ftPicked, setFtPicked]   = useState<Set<string>>(new Set());
  const [ftNotes, setFtNotes]     = useState('');

  const ftFiltered = useMemo(() => {
    return lessons
      .filter(l => l.isPublished)
      .filter(l => !ftLevel || l.level === ftLevel)
      .filter(l => !ftSearch ||
        l.title.toLowerCase().includes(ftSearch.toLowerCase()) ||
        l.code.toLowerCase().includes(ftSearch.toLowerCase()));
  }, [lessons, ftLevel, ftSearch]);

  function toggleFt(id: string) {
    setFtPicked(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  async function submitFt() {
    if (ftPicked.size === 0) { setError('Selecciona al menos una lección.'); return; }
    setSaving(true); setError(null); setOkMsg(null);
    try {
      let count = 0;
      for (const lessonId of ftPicked) {
        const l = lessons.find(x => x.id === lessonId);
        if (!l) continue;
        await createStudentAssignment({
          studentId, teacherId,
          source: 'lesson',
          refId: l.id,
          title: l.title,
          level: l.level,
          notes: ftNotes.trim() || undefined,
        });
        count++;
      }
      setOkMsg(`✓ ${count} lección${count === 1 ? '' : 'es'} asignada${count === 1 ? '' : 's'} a ${studentName}.`);
      setFtPicked(new Set());
      setFtNotes('');
      onAssigned?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo asignar');
    } finally {
      setSaving(false);
    }
  }

  // ── External tab state ────────────────────────────────────────
  const [extUrl,   setExtUrl]   = useState('');
  const [extTitle, setExtTitle] = useState('');
  const [extLevel, setExtLevel] = useState<string>('');
  const [extNotes, setExtNotes] = useState('');
  const extPreview = extUrl ? detectMaterialType(extUrl) : null;

  async function submitExt() {
    const url = extUrl.trim();
    const title = extTitle.trim();
    if (!url) { setError('URL requerida.'); return; }
    if (!title) { setError('Título requerido.'); return; }
    if (!/^https?:\/\//i.test(url)) { setError('La URL debe empezar con http:// o https://'); return; }
    setSaving(true); setError(null); setOkMsg(null);
    try {
      await createStudentAssignment({
        studentId, teacherId,
        source: 'external',
        externalUrl: url,
        title,
        level: (extLevel || undefined) as LessonLevel | undefined,
        notes: extNotes.trim() || undefined,
      });
      setOkMsg(`✓ Material externo "${title}" asignado a ${studentName}.`);
      setExtUrl(''); setExtTitle(''); setExtLevel(''); setExtNotes('');
      onAssigned?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo asignar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="font-bold text-[#5A3D7A]">Asignar material</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">a {studentName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-3 border-b border-gray-100 flex gap-2">
          {([
            { id: 'ft',       label: 'Assign FT lessons',    icon: '📚' },
            { id: 'external', label: 'Assign other lessons', icon: '🔗' },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setError(null); setOkMsg(null); }}
              className={`px-3.5 py-2 -mb-px border-b-2 text-xs font-bold transition-colors ${
                tab === t.id
                  ? 'border-[#5A3D7A] text-[#5A3D7A]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="mr-1.5">{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          {tab === 'ft' ? (
            <>
              <p className="text-[11px] text-gray-500">
                Elige una o más lecciones de tu Librería. Aparecerán en el panel <b>Mis Lecciones</b> del estudiante.
              </p>

              <div className="flex gap-2">
                <input
                  type="search"
                  value={ftSearch}
                  onChange={e => setFtSearch(e.target.value)}
                  placeholder="Buscar por título o código..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8]"
                />
                <select
                  value={ftLevel}
                  onChange={e => setFtLevel(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8] bg-white"
                >
                  <option value="">Todos</option>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div className="border border-gray-100 rounded-xl max-h-64 overflow-y-auto divide-y divide-gray-50">
                {ftFiltered.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-6">
                    Sin lecciones publicadas que coincidan.
                  </p>
                ) : ftFiltered.map(l => {
                  const on = ftPicked.has(l.id);
                  return (
                    <label
                      key={l.id}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 ${on ? 'bg-[#F0E5FF]/40' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggleFt(l.id)}
                        className="accent-[#5A3D7A] w-4 h-4"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-800 truncate">{l.title}</p>
                        <p className="text-[10px] text-gray-400 truncate">{l.code}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${LEVEL_COLORS[l.level ?? ''] ?? 'bg-gray-100 text-gray-500'}`}>
                        {l.level}
                      </span>
                    </label>
                  );
                })}
              </div>

              <textarea
                value={ftNotes}
                onChange={e => setFtNotes(e.target.value)}
                placeholder="Notas para el estudiante (opcional)..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8] resize-none"
              />
            </>
          ) : (
            <>
              <p className="text-[11px] text-gray-500">
                Pega la URL de cualquier plataforma externa (Off2Class, Ellii, Drive, YouTube, Canva, etc.).
                Se detecta el tipo automáticamente.
              </p>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">URL</label>
                <input
                  type="url"
                  value={extUrl}
                  onChange={e => setExtUrl(e.target.value)}
                  placeholder="https://www.off2class.com/..."
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8]"
                />
                {extPreview && extPreview.type !== 'none' && (
                  <p className="mt-1 text-[10px] text-gray-500">
                    Detectado: <span className="font-semibold">{extPreview.icon} {extPreview.label}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Título</label>
                <input
                  type="text"
                  value={extTitle}
                  onChange={e => setExtTitle(e.target.value)}
                  placeholder='Ej: "Present perfect — Lesson 3"'
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Nivel (opcional)</label>
                <select
                  value={extLevel}
                  onChange={e => setExtLevel(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8] bg-white"
                >
                  <option value="">Sin nivel</option>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Notas (opcional)</label>
                <textarea
                  value={extNotes}
                  onChange={e => setExtNotes(e.target.value)}
                  placeholder="Instrucciones o contexto para el estudiante..."
                  rows={2}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#9B7CB8] resize-none"
                />
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}
          {okMsg && (
            <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2 text-xs text-green-700">
              {okMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-200 rounded-full text-sm font-semibold text-gray-500 hover:bg-gray-50"
          >
            Cerrar
          </button>
          <button
            onClick={tab === 'ft' ? submitFt : submitExt}
            disabled={saving}
            className="flex-1 py-2 bg-[#5A3D7A] hover:bg-[#4A2D6A] text-white rounded-full text-sm font-bold disabled:opacity-50"
          >
            {saving ? 'Asignando…' : tab === 'ft' ? `Asignar (${ftPicked.size})` : 'Asignar material'}
          </button>
        </div>
      </div>
    </div>
  );
}
