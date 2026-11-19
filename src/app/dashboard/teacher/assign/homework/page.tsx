// FriendlyTeaching.cl — Assign Homework hub
//
// Mirror of the Assign Lesson hub, but writes to the `homework` collection.
// Every path lands in the student's My Homework page, routed by the shape
// of the homework doc:
//   - externalUrl  → "Open" opens the link in a new tab, "Mark as done"
//                    closes it (Off2Class / Ellii / Drive / YouTube).
//   - lessonId     → the student sees the linked FT lesson and submits
//                    text back (the slide-based auto-grade flow lives in
//                    the legacy /dashboard/teacher/homework page).
//   - plain        → just title + description + due date, text answer.

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen, Link2, ClipboardList, ArrowRight, Sparkles, X, UserPlus,
  Inbox, History, ExternalLink, GraduationCap, FileText,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { useAuthStore } from '@/store/authStore';
import { useStudents } from '@/hooks/useStudents';
import { useTeacherHomework, createHomework } from '@/hooks/useHomework';
import { usePublishedLessons } from '@/hooks/useLessons';
import type {
  Homework, HomeworkExternalPlatform, LessonLevel,
} from '@/types/firebase';

// ─── Hub ───────────────────────────────────────────────────────────────

type Modal = 'custom' | 'external' | 'library' | null;

export default function AssignHomeworkPage() {
  const { firebaseUser } = useAuthStore();
  const teacherId = firebaseUser?.uid ?? '';

  const [openModal, setOpenModal] = useState<Modal>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  }

  return (
    <div className="min-h-screen">
      <div className="p-6">
        <TopBar
          title="Assign Homework"
          subtitle="Elegí el tipo de tarea y asignala con fecha de entrega."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Assignments', href: '/dashboard/teacher/assign' },
            { label: 'Assign Homework' },
          ]}
        />

        <div className="max-w-5xl mx-auto mt-6 space-y-8">
          {/* ── Primary assign surfaces ───────────────────── */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AssignCard
              Icon={ClipboardList}
              iconColor="text-amber-700"
              iconBg="bg-amber-100"
              title="Tarea rápida"
              blurb="Título, instrucciones, fecha. El alumno responde con texto en la app."
              cta="Crear tarea"
              onClick={() => setOpenModal('custom')}
            />
            <AssignCard
              Icon={Link2}
              iconColor="text-sky-700"
              iconBg="bg-sky-100"
              title="Link externo"
              blurb="Off2Class, Ellii, Drive, YouTube... El alumno abre el link y marca como hecha."
              cta="Pegar link y asignar"
              onClick={() => setOpenModal('external')}
            />
            <AssignCard
              Icon={BookOpen}
              iconColor="text-[#5A3D7A]"
              iconBg="bg-[#F0E5FF]"
              title="Lección de la Librería"
              blurb="Asigná una lección FT como tarea de casa. Queda enlazada al profile del alumno."
              cta="Elegir lección"
              onClick={() => setOpenModal('library')}
            />
          </section>

          {/* ── Review inbox shortcut ──────────────────── */}
          <section>
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#9B7CB8]">Review</p>
                <h2 className="font-bold text-[#5A3D7A] text-lg inline-flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#9B7CB8]" strokeWidth={2.25} />
                  Entregas pendientes de revisar
                </h2>
              </div>
              <Link
                href="/dashboard/teacher/homework"
                className="text-[11px] font-bold text-[#5A3D7A] hover:underline inline-flex items-center gap-1"
              >
                Abrir bandeja <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
              </Link>
            </div>
            <ReviewInboxPreview />
          </section>

          {/* ── Assignment history ─────────────────────── */}
          <HomeworkHistory teacherId={teacherId} />

          {/* ── Footer hint ──────────────────────────────── */}
          <div className="bg-white/60 rounded-2xl border border-dashed border-[#E8D5F0] p-4 text-center">
            <p className="text-xs text-[#5A3D7A]/70">
              Cada tarea aparece en <span className="font-semibold">My Homework</span> del alumno con su fecha de entrega.
              Los links externos se abren en pestaña nueva y el alumno marca &ldquo;hecha&rdquo;; el resto se entrega dentro de la app.
            </p>
          </div>
        </div>
      </div>

      {openModal === 'custom'   && teacherId && (
        <CustomHomeworkModal   teacherId={teacherId} onClose={() => setOpenModal(null)} onSaved={(n) => showToast(`Tarea asignada a ${n} estudiante${n === 1 ? '' : 's'}.`)} />
      )}
      {openModal === 'external' && teacherId && (
        <ExternalHomeworkModal teacherId={teacherId} onClose={() => setOpenModal(null)} onSaved={(n) => showToast(`Link asignado como tarea a ${n} estudiante${n === 1 ? '' : 's'}.`)} />
      )}
      {openModal === 'library'  && teacherId && (
        <LibraryHomeworkModal  teacherId={teacherId} onClose={() => setOpenModal(null)} onSaved={(n) => showToast(`Lección asignada como tarea a ${n} estudiante${n === 1 ? '' : 's'}.`)} />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#5A3D7A] text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg animate-ft-pop">
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── Reusable Assign card ─────────────────────────────────────────────

function AssignCard({
  Icon, iconColor, iconBg, title, blurb, cta, onClick,
}: {
  Icon: typeof BookOpen;
  iconColor: string;
  iconBg: string;
  title: string;
  blurb: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group text-left bg-white rounded-3xl border-2 border-[#E8D5F0] hover:border-[#5A3D7A] hover:shadow-xl transition-all p-5 space-y-3"
    >
      <div className={`w-12 h-12 rounded-2xl ${iconBg} ${iconColor} flex items-center justify-center shadow-sm`}>
        <Icon className="w-6 h-6" strokeWidth={2.25} />
      </div>
      <h3 className="font-bold text-[#2D1B4E] text-base leading-tight">{title}</h3>
      <p className="text-xs text-gray-500 leading-snug min-h-[32px]">{blurb}</p>
      <p className="inline-flex items-center gap-1 text-xs font-bold text-[#5A3D7A] group-hover:gap-2 transition-all">
        {cta} <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
      </p>
    </button>
  );
}

// ─── Review inbox preview ─────────────────────────────────────────────

function ReviewInboxPreview() {
  const { firebaseUser } = useAuthStore();
  const { homework, loading } = useTeacherHomework(firebaseUser?.uid ?? '');
  const submitted = homework.filter((h) => h.status === 'submitted').slice(0, 4);

  if (loading) {
    return <div className="h-20 bg-white/40 rounded-2xl animate-pulse" />;
  }

  if (submitted.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#E8D5F0] p-5 text-center">
        <Inbox className="w-6 h-6 text-[#C8A8DC] mx-auto mb-2" strokeWidth={2} />
        <p className="text-sm font-semibold text-[#5A3D7A]">Nadie entregó tareas pendientes.</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Cuando un alumno entregue, va a aparecer acá.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {submitted.map((hw) => (
        <li key={hw.id} className="bg-white rounded-xl border border-[#E8D5F0] p-3 flex items-start gap-3">
          <span className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#2D1B4E] truncate">{hw.title}</p>
            <p className="text-[11px] text-gray-500 inline-flex items-center gap-1.5 mt-0.5">
              Entregado · esperando revisión
            </p>
          </div>
          <Link
            href="/dashboard/teacher/homework"
            className="text-[11px] font-bold text-[#5A3D7A] hover:underline inline-flex items-center gap-0.5 flex-shrink-0"
          >
            Revisar <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

// ─── History ───────────────────────────────────────────────────────────

function formatAssignedAgo(hw: Homework): string {
  const d = hw.createdAt?.toDate?.();
  if (!d) return '—';
  const diffMs = Date.now() - d.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1)  return 'recién';
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `hace ${days}d`;
  return d.toLocaleDateString('es-CL', { month: 'short', day: '2-digit', year: 'numeric' });
}

function HomeworkHistory({ teacherId }: { teacherId: string }) {
  const { homework, loading } = useTeacherHomework(teacherId);
  const { students } = useStudents();
  const [studentFilter, setStudentFilter] = useState<string>('all');

  const nameByUid = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of students) m.set(s.uid, s.fullName);
    return m;
  }, [students]);

  const assignedStudentUids = useMemo(() => {
    const set = new Set<string>();
    for (const hw of homework) if (hw.assignedToStudentId) set.add(hw.assignedToStudentId);
    return [...set].sort((a, b) =>
      (nameByUid.get(a) ?? a).localeCompare(nameByUid.get(b) ?? b),
    );
  }, [homework, nameByUid]);

  const filtered = useMemo(() => {
    const pool = studentFilter === 'all'
      ? homework
      : homework.filter((hw) => hw.assignedToStudentId === studentFilter);
    return pool.slice(0, 20);
  }, [homework, studentFilter]);

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#9B7CB8]">Historial</p>
          <h2 className="font-bold text-[#5A3D7A] text-lg inline-flex items-center gap-1.5">
            <History className="w-4 h-4 text-[#9B7CB8]" strokeWidth={2.25} />
            Tareas asignadas recientes
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-semibold text-gray-500">Estudiante</label>
          <select
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            className="px-3 py-1.5 border border-[#E8D5F0] rounded-xl text-xs font-semibold text-[#5A3D7A] bg-white focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
          >
            <option value="all">Todos ({homework.length})</option>
            {assignedStudentUids.map(uid => (
              <option key={uid} value={uid}>{nameByUid.get(uid) ?? uid}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/60 rounded-2xl border border-dashed border-[#E8D5F0] py-10 text-center">
          <Inbox className="w-7 h-7 text-[#C8A8DC] mx-auto mb-2.5" strokeWidth={1.8} />
          <p className="text-sm font-semibold text-[#5A3D7A]">
            {studentFilter === 'all'
              ? 'Todavía no asignaste tareas.'
              : 'Este estudiante no tiene tareas asignadas.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((hw) => {
            const kind = hw.externalUrl ? 'external' : hw.lessonId ? 'library' : 'custom';
            const kindLabel = kind === 'external' ? 'Link externo' : kind === 'library' ? 'FT Library' : 'Custom';
            const KindIcon  = kind === 'external' ? Link2 : kind === 'library' ? BookOpen : ClipboardList;
            return (
              <li key={hw.id} className="bg-white rounded-xl border border-[#E8D5F0] p-3 hover:border-[#C8A8DC] transition-colors">
                <div className="flex items-start gap-3">
                  <span className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center ${
                    kind === 'external' ? 'bg-sky-100 text-sky-700' :
                    kind === 'library'  ? 'bg-[#F0E5FF] text-[#5A3D7A]' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    <KindIcon className="w-4 h-4" strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#2D1B4E] truncate">{hw.title}</p>
                    <p className="text-[11px] text-gray-500 inline-flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="font-semibold text-[#5A3D7A]">
                        {hw.assignedToStudentId ? (nameByUid.get(hw.assignedToStudentId) ?? hw.assignedToStudentId) : 'Clase completa'}
                      </span>
                      <span>·</span>
                      <span>{kindLabel}</span>
                      <span>·</span>
                      <span>{formatAssignedAgo(hw)}</span>
                    </p>
                  </div>
                  {hw.externalUrl && (
                    <a
                      href={hw.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-sky-700 hover:underline inline-flex items-center gap-0.5 flex-shrink-0"
                    >
                      Link <ExternalLink className="w-2.5 h-2.5" strokeWidth={2.5} />
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// ─── Shared student picker ────────────────────────────────────────────

function useStudentPicker() {
  const { students } = useStudents();
  const activeStudents = useMemo(
    () => students
      .filter((s) => s.status === 'active' || s.status === 'approved')
      .sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [students],
  );

  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? activeStudents.filter((s) => s.fullName.toLowerCase().includes(q)) : activeStudents;
  }, [activeStudents, search]);

  function toggle(uid: string) {
    setPicked((prev) => {
      const n = new Set(prev);
      if (n.has(uid)) n.delete(uid); else n.add(uid);
      return n;
    });
  }

  return { activeStudents, filtered, picked, setPicked, search, setSearch, toggle };
}

function StudentPickerSection({
  picker,
}: {
  picker: ReturnType<typeof useStudentPicker>;
}) {
  const { filtered, picked, setPicked, search, setSearch, toggle } = picker;
  return (
    <section className="space-y-2">
      <div className="flex items-end justify-between gap-2">
        <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-widest">
          Estudiantes
          <span className="ml-2 text-[11px] font-bold text-[#9B7CB8] normal-case tracking-normal">
            · {picked.size} seleccionado{picked.size === 1 ? '' : 's'}
          </span>
        </p>
        <div className="flex gap-2 text-[10px] font-bold">
          <button type="button" onClick={() => setPicked(new Set(filtered.map((s) => s.uid)))} className="text-[#5A3D7A] hover:underline">
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
          filtered.map((s) => (
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
  );
}

// ─── Custom modal ────────────────────────────────────────────────────

function CustomHomeworkModal({
  teacherId, onClose, onSaved,
}: {
  teacherId: string;
  onClose: () => void;
  onSaved: (assignedCount: number) => void;
}) {
  const picker = useStudentPicker();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(() => defaultDueDate());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim())        { setError('Poné un título corto.'); return; }
    if (picker.picked.size === 0) { setError('Elegí al menos un estudiante.'); return; }
    const due = new Date(dueDate);
    if (Number.isNaN(due.getTime())) { setError('Fecha inválida.'); return; }

    setSaving(true);
    try {
      let assignedCount = 0;
      for (const studentId of picker.picked) {
        try {
          await createHomework(teacherId, {
            assignedToStudentId: studentId,
            title: title.trim(),
            description: description.trim(),
            dueDate: due,
          });
          assignedCount += 1;
        } catch (err) {
          console.warn('[assign-custom-hw] failed for', studentId, err);
        }
      }
      onSaved(assignedCount);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const canSubmit = !saving && title.trim().length > 0 && picker.picked.size > 0;

  return (
    <HomeworkModalShell title="Tarea rápida · con instrucciones" Icon={ClipboardList} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        {error && <p className="text-red-500 text-xs bg-red-50 p-2 rounded-lg">{error}</p>}
        <section className="space-y-3">
          <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-widest">1 · Tarea</p>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Título *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="ej. Resumen capítulo 3"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Instrucciones</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
              placeholder="Qué tiene que hacer el alumno, en formato breve."
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha de entrega *</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
            />
          </div>
        </section>
        <StudentPickerSection picker={picker} />
        <HomeworkFormActions canSubmit={canSubmit} saving={saving} pickedCount={picker.picked.size} onClose={onClose} />
      </form>
    </HomeworkModalShell>
  );
}

// ─── External modal ──────────────────────────────────────────────────

const PLATFORMS: { value: HomeworkExternalPlatform; label: string }[] = [
  { value: 'off2class', label: 'Off2Class' },
  { value: 'ellii',     label: 'Ellii' },
  { value: 'other',     label: 'Otro / material propio' },
];

function normaliseUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function ExternalHomeworkModal({
  teacherId, onClose, onSaved,
}: {
  teacherId: string;
  onClose: () => void;
  onSaved: (assignedCount: number) => void;
}) {
  const picker = useStudentPicker();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<HomeworkExternalPlatform>('off2class');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(() => defaultDueDate());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const normalised = normaliseUrl(url);
    if (!normalised)              { setError('Pegá una URL válida.'); return; }
    if (!title.trim())            { setError('Poné un título corto.'); return; }
    if (picker.picked.size === 0) { setError('Elegí al menos un estudiante.'); return; }
    const due = new Date(dueDate);
    if (Number.isNaN(due.getTime())) { setError('Fecha inválida.'); return; }

    setSaving(true);
    try {
      let assignedCount = 0;
      for (const studentId of picker.picked) {
        try {
          await createHomework(teacherId, {
            assignedToStudentId: studentId,
            title: title.trim(),
            description: description.trim(),
            dueDate: due,
            externalUrl: normalised,
            externalPlatform: platform,
          });
          assignedCount += 1;
        } catch (err) {
          console.warn('[assign-ext-hw] failed for', studentId, err);
        }
      }
      onSaved(assignedCount);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const canSubmit = !saving && url.trim().length > 0 && title.trim().length > 0 && picker.picked.size > 0;

  return (
    <HomeworkModalShell title="Tarea · link externo" Icon={Link2} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        {error && <p className="text-red-500 text-xs bg-red-50 p-2 rounded-lg">{error}</p>}
        <section className="space-y-3">
          <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-widest">1 · Material</p>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">URL *</label>
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://class.off2class.com/…"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Título *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="ej. Future Perfect · ejercicio 3"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Plataforma</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value as HomeworkExternalPlatform)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] bg-white">
                {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Instrucciones (opcional)</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                placeholder="Qué tiene que hacer con el link."
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] resize-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Entrega *</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
              />
            </div>
          </div>
        </section>
        <StudentPickerSection picker={picker} />
        <HomeworkFormActions canSubmit={canSubmit} saving={saving} pickedCount={picker.picked.size} onClose={onClose} />
      </form>
    </HomeworkModalShell>
  );
}

// ─── Library (FT lesson as homework) modal ───────────────────────────

const LEVELS: LessonLevel[] = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];

function LibraryHomeworkModal({
  teacherId, onClose, onSaved,
}: {
  teacherId: string;
  onClose: () => void;
  onSaved: (assignedCount: number) => void;
}) {
  const picker = useStudentPicker();
  const { lessons, loading: lessonsLoading } = usePublishedLessons();
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<LessonLevel | 'all'>('all');
  const [lessonId, setLessonId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(() => defaultDueDate());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredLessons = useMemo(() => {
    const q = search.trim().toLowerCase();
    return lessons
      .filter((l) => levelFilter === 'all' || l.level === levelFilter)
      .filter((l) => !q || `${l.code} ${l.title}`.toLowerCase().includes(q))
      .slice(0, 60);
  }, [lessons, levelFilter, search]);

  const selectedLesson = lessons.find((l) => l.id === lessonId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selectedLesson)         { setError('Elegí una lección.'); return; }
    if (picker.picked.size === 0) { setError('Elegí al menos un estudiante.'); return; }
    const due = new Date(dueDate);
    if (Number.isNaN(due.getTime())) { setError('Fecha inválida.'); return; }

    setSaving(true);
    try {
      let assignedCount = 0;
      for (const studentId of picker.picked) {
        try {
          await createHomework(teacherId, {
            assignedToStudentId: studentId,
            lessonId: selectedLesson.id,
            title: `${selectedLesson.code} · ${selectedLesson.title}`,
            description: description.trim(),
            dueDate: due,
          });
          assignedCount += 1;
        } catch (err) {
          console.warn('[assign-library-hw] failed for', studentId, err);
        }
      }
      onSaved(assignedCount);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const canSubmit = !saving && !!lessonId && picker.picked.size > 0;

  return (
    <HomeworkModalShell title="Tarea · lección de la Librería FT" Icon={BookOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        {error && <p className="text-red-500 text-xs bg-red-50 p-2 rounded-lg">{error}</p>}
        <section className="space-y-3">
          <p className="text-[10px] font-black text-[#5A3D7A] uppercase tracking-widest">1 · Lección</p>
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código o título…"
              className="sm:col-span-4 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
            />
            <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value as typeof levelFilter)}
              className="sm:col-span-2 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]">
              <option value="all">Todos los niveles</option>
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="max-h-56 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
            {lessonsLoading ? (
              <p className="text-xs text-gray-400 text-center py-6">Cargando lecciones…</p>
            ) : filteredLessons.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Ninguna lección coincide.</p>
            ) : (
              filteredLessons.map((l) => (
                <label key={l.id} className="flex items-center gap-3 px-3 py-2 hover:bg-[#F0E5FF]/40 cursor-pointer">
                  <input type="radio" name="lesson" checked={lessonId === l.id}
                    onChange={() => setLessonId(l.id)} className="accent-[#5A3D7A] w-4 h-4" />
                  <span className="text-sm text-gray-700 flex-1 truncate">
                    <span className="font-semibold text-[#5A3D7A]">{l.code}</span> · {l.title}
                  </span>
                  <span className="text-[10px] font-bold text-[#5A3D7A] bg-[#F0E5FF] px-2 py-0.5 rounded-full">{l.level}</span>
                </label>
              ))
            )}
          </div>
          {selectedLesson && (
            <div className="rounded-xl border border-[#E8D5F0] bg-[#F7EFFF] p-2 text-[11px] text-[#5A3D7A] inline-flex items-center gap-2">
              <GraduationCap className="w-3.5 h-3.5" strokeWidth={2.25} />
              <span className="truncate">{selectedLesson.code} · {selectedLesson.title}</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nota para el alumno</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                placeholder="ej. Terminá la lección antes del viernes."
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] resize-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Entrega *</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
              />
            </div>
          </div>
        </section>
        <StudentPickerSection picker={picker} />
        <HomeworkFormActions canSubmit={canSubmit} saving={saving} pickedCount={picker.picked.size} onClose={onClose} />
      </form>
    </HomeworkModalShell>
  );
}

// ─── Shared shell + footer ───────────────────────────────────────────

function HomeworkModalShell({
  title, Icon, onClose, children,
}: {
  title: string;
  Icon: typeof ClipboardList;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-[#5A3D7A]" strokeWidth={2.25} />
            <h2 className="font-bold text-[#5A3D7A]">{title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar">
            <X className="w-5 h-5" strokeWidth={2.25} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function HomeworkFormActions({
  canSubmit, saving, pickedCount, onClose,
}: {
  canSubmit: boolean;
  saving: boolean;
  pickedCount: number;
  onClose: () => void;
}) {
  return (
    <div className="flex gap-3 pt-1">
      <button type="button" onClick={onClose} disabled={saving}
        className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50">
        Cancelar
      </button>
      <button type="submit" disabled={!canSubmit}
        className="flex-1 py-2.5 bg-[#5A3D7A] hover:bg-[#4A2D6A] text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-1.5">
        <UserPlus className="w-4 h-4" strokeWidth={2.25} />
        {saving ? 'Guardando…' : `Asignar${pickedCount > 0 ? ` (${pickedCount})` : ''}`}
      </button>
    </div>
  );
}

function defaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}
