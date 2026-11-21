// FriendlyTeaching.cl — Feed de "Palabra del día" para el profe
'use client';
import { useMemo, useState } from 'react';
import { Inbox, BookOpen, MessageSquare, Check, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTeacherWordSubmissions } from '@/hooks/useTeacherWordSubmissions';
import {
  saveWordSubmissionFeedback, type WordSubmission,
} from '@/hooks/useWordOfDay';
import type { FTUser } from '@/types/firebase';
import type { Timestamp } from 'firebase/firestore';

interface Props {
  students: FTUser[];
  /** Número máximo de respuestas a mostrar. Default 15. */
  max?: number;
  /** Si true, muestra un estado vacío en lugar de auto-esconderse. Útil para la
   *  página dedicada; en el dashboard queremos que la card no aparezca vacía. */
  showEmpty?: boolean;
}

function formatDate(ts?: Timestamp): string {
  if (!ts || typeof ts.toDate !== 'function') return '';
  return ts.toDate().toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
}

export default function TeacherWordOfDayFeed({ students, max = 15, showEmpty = false }: Props) {
  const studentIds = useMemo(
    () => students.filter(s => s.status === 'approved').map(s => s.uid),
    [students],
  );
  const { submissions, loading } = useTeacherWordSubmissions(studentIds, max);
  const { firebaseUser } = useAuthStore();
  const teacherId = firebaseUser?.uid ?? '';

  if (loading) return null;

  if (submissions.length === 0) {
    if (!showEmpty) return null;
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <Inbox className="w-10 h-10 mx-auto mb-3 text-gray-300" strokeWidth={2} />
        <p className="text-sm text-gray-500">
          Aún no hay respuestas de la palabra del día.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Cuando tus estudiantes envíen ejemplos, van a aparecer acá.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-bold text-gray-700 text-sm inline-flex items-center gap-1.5"><BookOpen className="w-4 h-4" strokeWidth={2.25} /> Palabra del día — respuestas recientes</p>
        <span className="text-xs text-gray-400">{submissions.length}</span>
      </div>
      <div className="space-y-2">
        {submissions.map(sub => {
          const student = students.find(s => s.uid === sub.studentId);
          return (
            <SubmissionCard
              key={sub.id}
              sub={sub}
              studentName={student?.fullName}
              teacherId={teacherId}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── One submission row with inline feedback editor ─────────────

function SubmissionCard({
  sub, studentName, teacherId,
}: {
  sub:         WordSubmission;
  studentName?: string;
  teacherId:   string;
}) {
  const hasFeedback = !!sub.feedback;
  const [open, setOpen]         = useState(false);
  const [draft, setDraft]       = useState(sub.feedback ?? '');
  const [saving, setSaving]     = useState(false);
  const [savedAt, setSavedAt]   = useState<number | null>(null);

  async function save() {
    if (!draft.trim() || saving || !teacherId) return;
    setSaving(true);
    try {
      await saveWordSubmissionFeedback(sub.id, draft, teacherId);
      setSavedAt(Date.now());
      setOpen(false);
      window.setTimeout(() => setSavedAt(null), 2500);
    } catch (err) {
      console.warn('[TeacherWordOfDayFeed] save failed:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-3 py-2.5 bg-[#F9F5FF] border border-[#EADBFB] rounded-xl">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-bold text-[#5A3D7A] truncate">
          {studentName ?? 'Estudiante'}
        </p>
        <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
          {formatDate(sub.createdAt)}
        </span>
      </div>
      <p className="text-[10px] text-[#9B7CB8] font-bold uppercase tracking-wider mb-0.5">
        {sub.word}
      </p>
      <p className="text-sm text-gray-700 italic mb-2">&ldquo;{sub.example}&rdquo;</p>

      {/* Existing feedback readout — green tint so profe sees at a glance
          which submissions still need review. */}
      {hasFeedback && !open && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 flex items-start gap-2">
          <MessageSquare className="w-3 h-3 text-emerald-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
          <p className="text-[11px] text-emerald-800 leading-snug flex-1">{sub.feedback}</p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-[10px] font-bold text-emerald-700 hover:underline flex-shrink-0"
          >
            Edit
          </button>
        </div>
      )}

      {/* Editor */}
      {open ? (
        <div className="mt-1">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Write short feedback for the student…"
            className="w-full px-2.5 py-2 border border-[#E0D5FF] rounded-lg text-xs focus:outline-none focus:border-[#5A3D7A] bg-white resize-none"
          />
          <div className="flex items-center gap-2 mt-1.5">
            <button
              type="button"
              onClick={save}
              disabled={!draft.trim() || saving}
              className="px-3 py-1 rounded-lg bg-[#5A3D7A] hover:bg-[#3D1F6B] disabled:opacity-50 text-white text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
            >
              {saving
                ? <><Loader2 className="w-3 h-3 animate-spin" strokeWidth={2.5} /> Saving</>
                : <>Save feedback</>}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setDraft(sub.feedback ?? ''); }}
              className="px-3 py-1 rounded-lg text-[11px] font-semibold text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        !hasFeedback && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-[#5A3D7A] hover:text-[#3D1F6B]"
          >
            <MessageSquare className="w-3 h-3" strokeWidth={2.5} />
            Add feedback
          </button>
        )
      )}

      {savedAt && (
        <p className="text-[10px] text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
          <Check className="w-3 h-3" strokeWidth={2.5} /> Sent to student
        </p>
      )}
    </div>
  );
}
