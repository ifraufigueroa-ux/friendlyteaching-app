// FriendlyTeaching.cl — Teacher: TOEFL lessons catalog
//
// Lists every lesson declared in src/lib/data/toefl-lessons/catalog.ts
// so the teacher can:
//   · copy the shareable public URL to paste into WhatsApp / email
//   · assign the lesson to one or more students (writes
//     studentAssignments with source:'external' + externalUrl — the
//     lesson then surfaces in the student's My Lessons page)
//
// Catalog is static (no Firestore CRUD yet). To publish a new lesson:
//   1. Drop the HTML at public/toefl-lessons/<slug>.html
//   2. Add it to catalog.ts with its audios manifest
//   3. Run `node scripts/bake-toefl-lesson.js <slug>`
//   4. Commit and push → lives at /toefl-lessons/<slug>.html

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Copy, Check, Link2, Users, Clock, BookOpen, Search,
  Filter, ExternalLink, UserPlus, Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useStudents } from '@/hooks/useStudents';
import { useTeacherAssignments, createStudentAssignment } from '@/hooks/useStudentAssignments';
import TopBar from '@/components/layout/TopBar';
import {
  TOEFL_LESSONS, TOEFL_SECTION_LABELS, toeflLessonsBySection,
  type ToeflLesson, type ToeflSection,
} from '@/lib/data/toefl-lessons/catalog';

const SECTION_ORDER: ToeflSection[] = ['mixed', 'reading', 'listening', 'speaking', 'writing'];

const SECTION_TONE: Record<ToeflSection, { chip: string; ring: string }> = {
  mixed:     { chip: 'bg-violet-100 text-violet-700',    ring: 'border-l-violet-500' },
  reading:   { chip: 'bg-amber-100 text-amber-800',      ring: 'border-l-amber-500'  },
  listening: { chip: 'bg-emerald-100 text-emerald-700',  ring: 'border-l-emerald-500'},
  speaking:  { chip: 'bg-sky-100 text-sky-700',          ring: 'border-l-sky-500'    },
  writing:   { chip: 'bg-rose-100 text-rose-700',        ring: 'border-l-rose-500'   },
};

function publicUrlFor(lesson: ToeflLesson): string {
  if (typeof window === 'undefined') return `https://friendlyteaching.cl${lesson.publicPath}`;
  return `${window.location.origin}${lesson.publicPath}`;
}

export default function TeacherToeflLessonsPage() {
  const { profile, firebaseUser } = useAuthStore();
  const teacherId = firebaseUser?.uid ?? profile?.uid ?? '';
  const { students } = useStudents(true);
  const { assignments } = useTeacherAssignments(teacherId);

  const [filter, setFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState<ToeflSection | 'all'>('all');
  const [assignOpenFor, setAssignOpenFor] = useState<string | null>(null);

  const bySection = useMemo(() => toeflLessonsBySection(), []);
  const filtered = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    return TOEFL_LESSONS.filter(l =>
      (sectionFilter === 'all' || l.section === sectionFilter) &&
      (!needle || l.title.toLowerCase().includes(needle) || l.description.toLowerCase().includes(needle) || l.tags?.some(t => t.toLowerCase().includes(needle))),
    );
  }, [filter, sectionFilter]);

  // Map of lessonUrl → set of studentIds the teacher already assigned it to.
  // Used to grey out the "Assign" row and show "Already assigned".
  const alreadyAssignedByUrl = useMemo(() => {
    const m: Record<string, Set<string>> = {};
    for (const a of assignments) {
      if (a.source !== 'external' || !a.externalUrl) continue;
      (m[a.externalUrl] ??= new Set()).add(a.studentId);
    }
    return m;
  }, [assignments]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F5FF] via-white to-[#F0E8FF] p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <TopBar
          title="TOEFL Lessons"
          subtitle="Programa de preparación TOEFL iBT — comparte el link o asigna a tus estudiantes."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard/teacher' },
            { label: 'TOEFL', href: '/dashboard/teacher/toefl' },
            { label: 'Lessons' },
          ]}
        />

        {/* Toolbar */}
        <div className="mt-6 mb-4 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 bg-[#F7EFFF] border border-[#E5D9F2] rounded-full px-3 py-1.5 text-[11px] font-bold text-[#5A3D7A]">
            <BookOpen className="w-3.5 h-3.5" strokeWidth={2.5} /> {TOEFL_LESSONS.length} {TOEFL_LESSONS.length === 1 ? 'lesson' : 'lessons'}
          </div>
          <div className="inline-flex items-center gap-1 bg-white border border-[#E5D9F2] rounded-full px-2 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" strokeWidth={2.5} />
            <select
              value={sectionFilter}
              onChange={e => setSectionFilter(e.target.value as ToeflSection | 'all')}
              className="bg-transparent text-xs font-bold text-[#5A3D7A] py-1 pr-2 focus:outline-none"
            >
              <option value="all">All sections</option>
              {SECTION_ORDER.map(s => (
                <option key={s} value={s}>{TOEFL_SECTION_LABELS[s]} ({bySection[s].length})</option>
              ))}
            </select>
          </div>
          <div className="ml-auto relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={2.25} />
            <input
              type="search"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Buscar título, tag o desc…"
              className="w-full pl-9 pr-3 py-2 rounded-full border-2 border-[#E5D9F2] bg-white text-sm focus:outline-none focus:border-[#9474c4] focus:ring-2 focus:ring-[#C8A8DC]/50 transition-colors"
            />
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#E5D9F2] p-10 text-center">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" strokeWidth={2} />
            <p className="text-sm text-gray-500 font-semibold">Nada que coincida</p>
          </div>
        )}

        {/* Lesson cards */}
        <div className="space-y-3">
          {filtered.map(lesson => {
            const assignedCount = (alreadyAssignedByUrl[lesson.publicPath]?.size ?? 0);
            return (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                assignedCount={assignedCount}
                assignedStudentIds={alreadyAssignedByUrl[lesson.publicPath] ?? new Set()}
                students={students}
                teacherId={teacherId}
                assignOpen={assignOpenFor === lesson.id}
                onToggleAssign={() => setAssignOpenFor(assignOpenFor === lesson.id ? null : lesson.id)}
              />
            );
          })}
        </div>

        {/* Footer: how to add */}
        <div className="mt-8 bg-[#F7EFFF] border border-[#E5D9F2] rounded-2xl p-4 text-xs text-[#5A3D7A] leading-relaxed">
          <p className="font-black uppercase tracking-widest text-[10px] text-[#845ec2] mb-1">Agregar una lesson nueva</p>
          <ol className="list-decimal list-inside space-y-0.5 text-[#4b3869]">
            <li>Suelta el HTML en <code className="bg-white px-1 rounded">public/toefl-lessons/&lt;slug&gt;.html</code></li>
            <li>Agrega el entry en <code className="bg-white px-1 rounded">src/lib/data/toefl-lessons/catalog.ts</code></li>
            <li>Corre <code className="bg-white px-1 rounded">node scripts/bake-toefl-lesson.js &lt;slug&gt;</code></li>
            <li>Commit + push y la lesson queda live.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

// ── Lesson card ────────────────────────────────────────────────

function LessonCard({
  lesson, assignedCount, assignedStudentIds, students, teacherId, assignOpen, onToggleAssign,
}: {
  lesson:             ToeflLesson;
  assignedCount:      number;
  assignedStudentIds: Set<string>;
  students:           { uid: string; fullName: string; email: string; studentData?: { level?: string } }[];
  teacherId:          string;
  assignOpen:         boolean;
  onToggleAssign:     () => void;
}) {
  const [copied, setCopied] = useState(false);
  const tone = SECTION_TONE[lesson.section];
  const url = publicUrlFor(lesson);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  }

  return (
    <article className={`bg-white rounded-2xl border border-[#E5D9F2] border-l-4 ${tone.ring} p-5 shadow-sm`}>
      <header className="flex items-start gap-3 mb-2 flex-wrap">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${tone.chip}`}>
          {TOEFL_SECTION_LABELS[lesson.section]}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">
          {lesson.level}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-slate-500 border border-slate-200">
          <Clock className="w-3 h-3" strokeWidth={2.5} /> {lesson.durationMinutes} min
        </span>
        {assignedCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Users className="w-3 h-3" strokeWidth={2.5} /> asignada a {assignedCount}
          </span>
        )}
      </header>

      <h3 className="font-bold text-base text-[#3D1F6B] leading-tight mb-1">{lesson.title}</h3>
      <p className="text-sm text-slate-600 leading-snug mb-3">{lesson.description}</p>

      {lesson.tags && lesson.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {lesson.tags.map(t => (
            <span key={t} className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">#{t}</span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <a
          href={lesson.publicPath}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 bg-[#5A3D7A] text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-[#4b3869] transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.5} /> Abrir lesson
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-1 bg-white border border-[#E5D9F2] text-[#5A3D7A] text-xs font-bold px-3 py-2 rounded-xl hover:bg-[#F7EFFF] transition-colors"
        >
          {copied
            ? <><Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Copiado</>
            : <><Copy className="w-3.5 h-3.5" strokeWidth={2.5} /> Copiar link</>}
        </button>
        <button
          type="button"
          onClick={onToggleAssign}
          className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl transition-colors ${
            assignOpen
              ? 'bg-[#845ec2] text-white border border-[#845ec2]'
              : 'bg-white border border-[#E5D9F2] text-[#5A3D7A] hover:bg-[#F7EFFF]'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" strokeWidth={2.5} /> {assignOpen ? 'Cerrar' : 'Asignar'}
        </button>
        <div className="ml-auto text-[11px] text-slate-400 font-mono truncate max-w-[200px]" title={url}>
          <Link2 className="inline w-3 h-3 mr-1" strokeWidth={2.5} />{lesson.publicPath}
        </div>
      </div>

      {assignOpen && (
        <AssignPanel
          lesson={lesson}
          students={students}
          teacherId={teacherId}
          alreadyAssignedTo={assignedStudentIds}
          onDone={onToggleAssign}
        />
      )}
    </article>
  );
}

// ── Assign panel (inline) ──────────────────────────────────────

function AssignPanel({
  lesson, students, teacherId, alreadyAssignedTo, onDone,
}: {
  lesson:           ToeflLesson;
  students:         { uid: string; fullName: string; studentData?: { level?: string } }[];
  teacherId:        string;
  alreadyAssignedTo: Set<string>;
  onDone:           () => void;
}) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const list = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return students
      .filter(s => !needle || s.fullName.toLowerCase().includes(needle))
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'es'));
  }, [students, search]);

  function toggle(uid: string) {
    setPicked(prev => {
      const n = new Set(prev);
      if (n.has(uid)) n.delete(uid); else n.add(uid);
      return n;
    });
  }

  async function handleSave() {
    if (picked.size === 0 || !teacherId) return;
    setSaving(true); setMsg(null);
    let ok = 0, failed = 0;
    for (const sid of picked) {
      try {
        await createStudentAssignment({
          studentId:   sid,
          teacherId,
          source:      'external',
          title:       `TOEFL · ${lesson.title}`,
          externalUrl: lesson.publicPath,
          level:       (lesson.level as 'B1' | 'B2' | 'C1'),
          notes:       `Pensada para una sesión de ${lesson.durationMinutes} minutos.`,
        });
        ok += 1;
      } catch (err) {
        console.warn('[assign]', err);
        failed += 1;
      }
    }
    setSaving(false);
    setMsg(`${ok} asignada${ok === 1 ? '' : 's'}${failed > 0 ? ` · ${failed} fallaron` : ''}.`);
    if (failed === 0) {
      setPicked(new Set());
      window.setTimeout(onDone, 1200);
    }
  }

  return (
    <div className="mt-4 bg-[#FBF8F3] border border-[#E5D9F2] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <p className="font-bold text-xs text-[#3D1F6B]">Asignar a tus estudiantes</p>
        {picked.size > 0 && (
          <span className="text-[10px] font-black text-[#845ec2] bg-white border border-[#E5D9F2] rounded-full px-2 py-0.5">
            {picked.size} seleccionado{picked.size === 1 ? '' : 's'}
          </span>
        )}
        <div className="ml-auto relative w-48">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" strokeWidth={2.5} />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar…"
            className="w-full pl-7 pr-2 py-1 rounded-full border border-[#E5D9F2] bg-white text-[11px] focus:outline-none focus:border-[#9474c4]"
          />
        </div>
      </div>

      <div className="max-h-60 overflow-y-auto border border-[#E5D9F2] rounded-lg bg-white divide-y divide-[#f3eefc]">
        {list.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-6">Nadie que coincida.</p>
        )}
        {list.map(s => {
          const already = alreadyAssignedTo.has(s.uid);
          const checked = picked.has(s.uid);
          return (
            <label
              key={s.uid}
              className={`flex items-center gap-2 px-3 py-2 text-xs cursor-pointer transition-colors ${
                already ? 'bg-emerald-50/40 opacity-60' : 'hover:bg-[#F7EFFF]'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={already}
                onChange={() => toggle(s.uid)}
                className="accent-[#845ec2]"
              />
              <span className="font-semibold text-[#3D1F6B] flex-1 truncate">{s.fullName}</span>
              {s.studentData?.level && (
                <span className="text-[10px] font-black bg-slate-100 text-slate-700 rounded px-1.5 py-0.5">{s.studentData.level}</span>
              )}
              {already && (
                <span className="text-[10px] font-black text-emerald-700 inline-flex items-center gap-0.5">
                  <Check className="w-3 h-3" strokeWidth={3} /> Asignada
                </span>
              )}
            </label>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mt-3">
        {msg && <p className="text-[11px] text-emerald-700 font-bold">{msg}</p>}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || picked.size === 0}
          className="ml-auto inline-flex items-center gap-1 bg-[#845ec2] text-white text-xs font-black px-4 py-2 rounded-xl hover:bg-[#6b4c9a] disabled:opacity-40 transition-colors"
        >
          {saving
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.5} /> Asignando…</>
            : <><UserPlus className="w-3.5 h-3.5" strokeWidth={2.5} /> Asignar</>}
        </button>
      </div>
    </div>
  );
}
