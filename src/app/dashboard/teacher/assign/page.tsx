// FriendlyTeaching.cl — Assign Lesson hub
//
// Single landing for the teacher to assign any material to students —
// FT Library lesson, FT product (Friendlistenings, Writing, Tales,
// Rics, Flix), external link (Ellii, Off2Class, Drive, YouTube…) or
// an uploaded HTML file. Each card either opens a scoped modal or
// hands off to the product catalog that already owns that flow.

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen, Link2, FileText, Headphones, PenLine, Music, BookMarked,
  Clapperboard, ArrowRight, Sparkles, History, Inbox, ExternalLink,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { useAuthStore } from '@/store/authStore';
import AssignFromLibraryModal     from '@/components/teacher/AssignFromLibraryModal';
import AssignExternalModal        from '@/components/teacher/AssignExternalModal';
import UploadAndAssignHtmlModal   from '@/components/teacher/UploadAndAssignHtmlModal';
import { useTeacherAssignments }  from '@/hooks/useStudentAssignments';
import { useStudents }            from '@/hooks/useStudents';
import type { StudentAssignment } from '@/types/firebase';

type Modal = 'library' | 'external' | 'html' | null;

const FT_TOOLS: {
  id: string; label: string; href: string;
  Icon: typeof Headphones; iconColor: string; iconBg: string;
  blurb: string;
}[] = [
  { id: 'listenings', label: 'Friendlistenings',  href: '/dashboard/teacher/listenings',  Icon: Headphones,  iconColor: 'text-purple-700', iconBg: 'bg-purple-100',  blurb: 'Listening lessons CLT con 8 pasos.' },
  { id: 'writing',    label: 'FriendlyWriting',   href: '/dashboard/teacher/writing',     Icon: PenLine,     iconColor: 'text-sky-600',    iconBg: 'bg-sky-100',     blurb: 'Escritura scaffolded hacia IELTS.' },
  { id: 'texts',      label: 'FriendlyTales',     href: '/dashboard/teacher/texts',       Icon: BookMarked,  iconColor: 'text-slate-700',  iconBg: 'bg-slate-100',   blurb: 'Lecturas con comprensión y vocabulario.' },
  { id: 'music',      label: 'Friendlyrics',      href: '/dashboard/teacher/music',       Icon: Music,       iconColor: 'text-pink-600',   iconBg: 'bg-pink-100',    blurb: 'Lecciones a partir de canciones.' },
  { id: 'movies',     label: 'Friendlyflix',      href: '/dashboard/teacher/friendlyflix',Icon: Clapperboard,iconColor: 'text-rose-600',   iconBg: 'bg-rose-100',    blurb: 'Clips de video con prácticas.' },
];

export default function AssignLessonPage() {
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
          title="Assign Lesson"
          subtitle="Elegí el tipo de material y asignalo a uno o varios alumnos."
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Assign Lesson' },
          ]}
        />

        <div className="max-w-5xl mx-auto mt-6 space-y-8">

          {/* ── Primary assign surfaces ───────────────────── */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AssignCard
              Icon={BookOpen}
              iconColor="text-[#5A3D7A]"
              iconBg="bg-[#F0E5FF]"
              title="Librería FT"
              blurb="Una lección interna que ya creaste o importaste. Guarda progreso."
              cta="Elegir y asignar"
              onClick={() => setOpenModal('library')}
            />
            <AssignCard
              Icon={FileText}
              iconColor="text-emerald-700"
              iconBg="bg-emerald-100"
              title="Subir HTML"
              blurb="Subí un .html propio y asignalo. Guarda progreso + respuestas de los inputs."
              cta="Subir y asignar"
              onClick={() => setOpenModal('html')}
            />
            <AssignCard
              Icon={Link2}
              iconColor="text-sky-700"
              iconBg="bg-sky-100"
              title="Link externo"
              blurb="Ellii, Off2Class, Drive, YouTube, Canva... Se abre en una pestaña nueva. Sin tracking."
              cta="Pegar link y asignar"
              onClick={() => setOpenModal('external')}
            />
          </section>

          {/* ── FT Tools (route to product catalog) ──────── */}
          <section>
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#9B7CB8]">FT Tools</p>
                <h2 className="font-bold text-[#5A3D7A] text-lg inline-flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#9B7CB8]" strokeWidth={2.25} />
                  Nuestros productos
                </h2>
              </div>
              <p className="text-[11px] text-gray-400">Cada catálogo tiene su propio botón <span className="font-semibold text-[#5A3D7A]">Assign</span> en la card de la lección.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {FT_TOOLS.map(t => (
                <Link
                  key={t.id}
                  href={t.href}
                  className="group bg-white rounded-2xl border border-[#E8D5F0] hover:border-[#5A3D7A] hover:shadow-md transition-all p-4 flex items-start gap-3"
                >
                  <span className={`w-10 h-10 rounded-xl ${t.iconBg} ${t.iconColor} flex items-center justify-center flex-shrink-0`}>
                    <t.Icon className="w-5 h-5" strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-[#2D1B4E] truncate">{t.label}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{t.blurb}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#9B7CB8] mt-1 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
                </Link>
              ))}
            </div>
          </section>

          {/* ── Assignment history ─────────────────────── */}
          <AssignmentHistory teacherId={teacherId} />

          {/* ── Footer hint ──────────────────────────────── */}
          <div className="bg-white/60 rounded-2xl border border-dashed border-[#E8D5F0] p-4 text-center">
            <p className="text-xs text-[#5A3D7A]/70">
              Cada asignación crea un <span className="font-semibold">studentAssignment</span> por alumno. Para HTML y lecciones de la Librería el progreso se guarda automáticamente; los links externos quedan registrados pero sin tracking porque se abren fuera de la plataforma.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {openModal === 'library' && teacherId && (
        <AssignFromLibraryModal
          teacherId={teacherId}
          onClose={() => setOpenModal(null)}
          onSaved={({ assignedCount }) =>
            showToast(`Lección asignada a ${assignedCount} estudiante${assignedCount === 1 ? '' : 's'}.`)
          }
        />
      )}
      {openModal === 'external' && teacherId && (
        <AssignExternalModal
          teacherId={teacherId}
          onClose={() => setOpenModal(null)}
          onSaved={({ assignedCount }) =>
            showToast(`Link asignado a ${assignedCount} estudiante${assignedCount === 1 ? '' : 's'}.`)
          }
        />
      )}
      {openModal === 'html' && teacherId && (
        <UploadAndAssignHtmlModal
          teacherId={teacherId}
          onClose={() => setOpenModal(null)}
          onSaved={({ assignedCount }) =>
            showToast(`HTML creado y asignado a ${assignedCount} estudiante${assignedCount === 1 ? '' : 's'}.`)
          }
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#5A3D7A] text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg animate-ft-pop">
          {toast}
        </div>
      )}
    </div>
  );
}

function AssignCard({
  Icon, iconColor, iconBg, title, blurb, cta, onClick,
}: {
  Icon:      typeof BookOpen;
  iconColor: string;
  iconBg:    string;
  title:     string;
  blurb:     string;
  cta:       string;
  onClick:   () => void;
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

// ─── Assignment history ──────────────────────────────────────

function formatAssignedAgo(a: StudentAssignment): string {
  const d = a.createdAt?.toDate?.();
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

function AssignmentHistory({ teacherId }: { teacherId: string }) {
  const { assignments, loading } = useTeacherAssignments(teacherId);
  const { students } = useStudents();
  const [studentFilter, setStudentFilter] = useState<string>('all');

  const nameByUid = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of students) m.set(s.uid, s.fullName);
    return m;
  }, [students]);

  // Only show students that actually have an assignment, sorted by name.
  const assignedStudentUids = useMemo(() => {
    const set = new Set<string>();
    for (const a of assignments) set.add(a.studentId);
    return [...set].sort((a, b) =>
      (nameByUid.get(a) ?? a).localeCompare(nameByUid.get(b) ?? b),
    );
  }, [assignments, nameByUid]);

  const filtered = useMemo(() => {
    const pool = studentFilter === 'all'
      ? assignments
      : assignments.filter(a => a.studentId === studentFilter);
    return [...pool].sort((a, b) =>
      (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0),
    );
  }, [assignments, studentFilter]);

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#9B7CB8]">Historial</p>
          <h2 className="font-bold text-[#5A3D7A] text-lg inline-flex items-center gap-1.5">
            <History className="w-4 h-4 text-[#9B7CB8]" strokeWidth={2.25} />
            Asignaciones recientes
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-semibold text-gray-500">Estudiante</label>
          <select
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            className="px-3 py-1.5 border border-[#E8D5F0] rounded-xl text-xs font-semibold text-[#5A3D7A] bg-white focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
          >
            <option value="all">Todos ({assignments.length})</option>
            {assignedStudentUids.map(uid => (
              <option key={uid} value={uid}>
                {nameByUid.get(uid) ?? uid}
              </option>
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
              ? 'Todavía no asignaste material a nadie.'
              : 'Este estudiante no tiene asignaciones aún.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((a) => {
            const isFT  = a.source === 'lesson';
            const href  = isFT
              ? (a.refId ? `/classroom/${a.refId}` : null)
              : (a.externalUrl ?? null);
            const SourceIcon = isFT ? BookOpen : Link2;
            return (
              <li key={a.id} className="bg-white rounded-xl border border-[#E8D5F0] p-3 hover:border-[#C8A8DC] transition-colors">
                <div className="flex items-start gap-3">
                  <span className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center ${isFT ? 'bg-[#F0E5FF] text-[#5A3D7A]' : 'bg-sky-100 text-sky-700'}`}>
                    <SourceIcon className="w-4 h-4" strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#2D1B4E] truncate">{a.title}</p>
                    <p className="text-[11px] text-gray-500 inline-flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="font-semibold text-[#5A3D7A]">{nameByUid.get(a.studentId) ?? a.studentId}</span>
                      <span>·</span>
                      <span>{isFT ? 'FT Library' : 'Externo'}</span>
                      {a.level && <><span>·</span><span>{a.level}</span></>}
                      <span>·</span>
                      <span>{formatAssignedAgo(a)}</span>
                    </p>
                    {a.notes && (
                      <p className="text-[11px] text-gray-500 italic mt-1 line-clamp-2">“{a.notes}”</p>
                    )}
                  </div>
                  {href && (
                    isFT ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-[#5A3D7A] hover:underline inline-flex items-center gap-0.5 flex-shrink-0"
                      >
                        Abrir <ExternalLink className="w-2.5 h-2.5" strokeWidth={2.5} />
                      </a>
                    ) : (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-sky-700 hover:underline inline-flex items-center gap-0.5 flex-shrink-0"
                      >
                        Link <ExternalLink className="w-2.5 h-2.5" strokeWidth={2.5} />
                      </a>
                    )
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
