// FriendlyTeaching.cl — LessonAssigneesModal
//
// Shows which students have a given FT Library lesson assigned and
// their current status (assigned / in_progress / completed, plus
// the matching `progress` doc when there is one so we can surface
// "last opened Xm ago" and completion score). Opened from the
// lesson card in /dashboard/teacher/lessons.
//
// External-link assignments (source:'external') never appear here
// — this modal is per-lesson and only lesson-id assignments carry
// a refId pointing to the FT Library.

'use client';
import { useMemo } from 'react';
import { X, Inbox, Users as UsersIcon, Clock, CheckCircle2, Hourglass } from 'lucide-react';
import { useTeacherAssignments } from '@/hooks/useStudentAssignments';
import { useStudents } from '@/hooks/useStudents';
import { useAllProgress } from '@/hooks/useProgress';
import type { StudentAssignment, Progress } from '@/types/firebase';

interface Props {
  lessonId:    string;
  lessonTitle: string;
  teacherId:   string;
  onClose:     () => void;
}

function formatAgo(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.round(diff / 60000);
  if (mins < 1)  return 'recién';
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `hace ${days}d`;
  return new Date(ms).toLocaleDateString('es-CL', { month: 'short', day: '2-digit', year: 'numeric' });
}

function rowStatus(a: StudentAssignment, p?: Progress) {
  // Prefer the Progress doc status (ground truth of what the student
  // actually did in /classroom) over the assignment flag.
  const effective = p?.status ?? a.status ?? 'assigned';
  if (effective === 'completed') {
    return { label: 'Completado', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2 };
  }
  if (effective === 'in_progress') {
    return { label: 'En curso',   className: 'bg-amber-50 text-amber-700 border-amber-200',       Icon: Hourglass };
  }
  return { label: 'Asignado',    className: 'bg-[#F0E5FF] text-[#5A3D7A] border-[#D0B8E8]', Icon: Clock };
}

export default function LessonAssigneesModal({ lessonId, lessonTitle, teacherId, onClose }: Props) {
  const { assignments, loading: aLoading } = useTeacherAssignments(teacherId);
  const { progress, loading: pLoading }    = useAllProgress(teacherId);
  const { students }                       = useStudents();

  const rows = useMemo(() => {
    const filtered = assignments.filter(a => a.source === 'lesson' && a.refId === lessonId);
    const byStudentUid = new Map<string, string>();
    for (const s of students) byStudentUid.set(s.uid, s.fullName);
    // For each assignment, find the latest progress doc for that student+lesson.
    return filtered.map(a => {
      const studentProgress = progress
        .filter(p => p.studentId === a.studentId && p.lessonId === lessonId)
        .sort((x, y) => (y.startedAt?.toMillis?.() ?? 0) - (x.startedAt?.toMillis?.() ?? 0));
      const latest = studentProgress[0];
      return {
        assignment: a,
        latestProgress: latest,
        studentName: byStudentUid.get(a.studentId) ?? a.studentId,
      };
    }).sort((r1, r2) => {
      // Most recently assigned first.
      const t1 = r1.assignment.createdAt?.toMillis?.() ?? 0;
      const t2 = r2.assignment.createdAt?.toMillis?.() ?? 0;
      return t2 - t1;
    });
  }, [assignments, progress, students, lessonId]);

  const loading = aLoading || pLoading;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#9B7CB8] mb-0.5">Asignaciones</p>
            <h2 className="font-bold text-[#5A3D7A] truncate inline-flex items-center gap-2">
              <UsersIcon className="w-4 h-4" strokeWidth={2.25} /> {lessonTitle}
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {loading ? 'Cargando…' : `${rows.length} estudiante${rows.length === 1 ? '' : 's'} con la lección asignada`}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0" aria-label="Cerrar">
            <X className="w-5 h-5" strokeWidth={2.25} />
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-7 h-7 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <div className="bg-[#FAFAFF] border border-[#F0E5FF] rounded-2xl py-10 text-center">
              <Inbox className="w-7 h-7 text-[#C8A8DC] mx-auto mb-2.5" strokeWidth={1.8} />
              <p className="text-sm font-semibold text-[#5A3D7A]">Todavía no la asignaste a nadie.</p>
              <p className="text-xs text-gray-400 mt-1">Asignala desde <span className="font-semibold">Assign Lesson</span> o desde las class notes.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {rows.map(({ assignment, latestProgress, studentName }) => {
                const st = rowStatus(assignment, latestProgress);
                const lastOpenMs = latestProgress?.startedAt?.toMillis?.() ?? assignment.createdAt?.toMillis?.() ?? 0;
                return (
                  <li key={assignment.id} className="border border-[#E8D5F0] rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#F0E5FF] text-[#5A3D7A] flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {studentName[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#2D1B4E] truncate">{studentName}</p>
                        <p className="text-[11px] text-gray-500 inline-flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" strokeWidth={2.5} />
                          {latestProgress ? 'Última actividad' : 'Asignado'} {formatAgo(lastOpenMs)}
                          {latestProgress?.overallScore != null && (
                            <>
                              <span className="mx-1 text-gray-300">·</span>
                              <span>Score {latestProgress.overallScore}</span>
                            </>
                          )}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border inline-flex items-center gap-1 flex-shrink-0 ${st.className}`}>
                        <st.Icon className="w-3 h-3" strokeWidth={2.5} /> {st.label}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
