// FriendlyTeaching.cl — Student Homework Page
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  BookOpenCheck,
  Link2,
  ClipboardList,
  Send,
  CheckCircle2,
  PartyPopper,
  Inbox,
  AlertTriangle,
  Clock,
  BookOpen,
  Calendar,
  Check,
  type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useStudentHomework, submitHomework, markExternalHomeworkDone } from '@/hooks/useHomework';
import { usePublishedLessons } from '@/hooks/useLessons';
import { useGamification } from '@/hooks/useGamification';
import TopBar from '@/components/layout/TopBar';
import BadgeUnlockToast from '@/components/gamification/BadgeUnlockToast';
import type { Homework, HomeworkExternalPlatform } from '@/types/firebase';
import type { Timestamp } from 'firebase/firestore';

const EXTERNAL_PLATFORMS: Record<HomeworkExternalPlatform, { label: string; Icon: LucideIcon; badge: string }> = {
  off2class: { label: 'Off2Class',       Icon: GraduationCap, badge: 'bg-orange-100 text-orange-700' },
  ellii:     { label: 'Ellii',           Icon: BookOpenCheck, badge: 'bg-emerald-100 text-emerald-700' },
  other:     { label: 'Own material', Icon: Link2,         badge: 'bg-purple-100 text-[#5A3D7A]' },
};

function formatDate(ts: Timestamp | undefined) {
  if (!ts) return '—';
  return ts.toDate().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function isDueSoon(ts: Timestamp | undefined) {
  if (!ts) return false;
  const diff = ts.toDate().getTime() - Date.now();
  return diff > 0 && diff < 1000 * 60 * 60 * 48; // within 48 hours
}

function isOverdue(ts: Timestamp | undefined) {
  if (!ts) return false;
  return ts.toDate().getTime() < Date.now();
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  assigned:  { label: 'Pending',    color: 'bg-blue-100 text-blue-700' },
  submitted: { label: 'Submitted',  color: 'bg-amber-100 text-amber-700' },
  reviewed:  { label: 'Reviewed',   color: 'bg-green-100 text-green-700' },
  pending:   { label: 'Pending',    color: 'bg-gray-100 text-gray-500' },
};

export default function StudentHomeworkPage() {
  const router = useRouter();
  const { firebaseUser, role, isInitialized } = useAuthStore();
  const uid = firebaseUser?.uid ?? '';

  const { homework, loading } = useStudentHomework(uid);
  const { lessons } = usePublishedLessons();
  const { recordHomeworkSubmit, newBadges, dismissBadges } = useGamification(uid);

  const [activeHw, setActiveHw] = useState<Homework | null>(null);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  // Guarda el id de la tarea externa que se está marcando para desactivar
  // el botón y evitar doble click mientras Firestore responde.
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    if (isInitialized && !firebaseUser) router.replace('/auth/login');
    if (isInitialized && role === 'teacher') router.replace('/dashboard/teacher');
  }, [isInitialized, firebaseUser, role, router]);

  const handleSubmit = async () => {
    if (!activeHw || !answer.trim() || submitting) return;
    setSubmitting(true);
    try {
      await submitHomework(activeHw.id, { textAnswer: answer });
      // Award gamification XP
      const onTime = activeHw.dueDate ? activeHw.dueDate.toDate().getTime() > Date.now() : true;
      recordHomeworkSubmit(onTime, false).catch(() => {/* non-critical */});
      setActiveHw(null);
      setAnswer('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkExternalDone = async (hw: Homework) => {
    if (markingId) return;
    setMarkingId(hw.id);
    try {
      await markExternalHomeworkDone(hw.id);
      const onTime = hw.dueDate ? hw.dueDate.toDate().getTime() > Date.now() : true;
      recordHomeworkSubmit(onTime, false).catch(() => {/* non-critical */});
    } finally {
      setMarkingId(null);
    }
  };

  const pending = homework.filter(h => h.status === 'assigned' || h.status === 'pending');
  const submitted = homework.filter(h => h.status === 'submitted');
  const reviewed = homework.filter(h => h.status === 'reviewed');

  const displayed = filterStatus === 'pending' ? pending
    : filterStatus === 'submitted' ? submitted
    : filterStatus === 'reviewed' ? reviewed
    : homework;

  const lessonTitle = (id?: string) => lessons.find(l => l.id === id)?.title ?? '';

  return (
    <div className="min-h-screen">
      <TopBar
        title="My Homework"
        subtitle={`${pending.length} pending task${pending.length !== 1 ? 's' : ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Homework' }
        ]}
      />
      <div className="p-6">

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Pending', value: pending.length, Icon: ClipboardList, color: pending.length > 0 ? 'text-amber-600' : 'text-gray-400' },
          { label: 'Submitted', value: submitted.length, Icon: Send, color: 'text-blue-600' },
          { label: 'Reviewed', value: reviewed.length, Icon: CheckCircle2, color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <div className={`mb-0.5 flex justify-center ${s.color}`}><s.Icon className="w-5 h-5" strokeWidth={2.25} /></div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[['pending', 'Pending'], ['submitted', 'Submitted'], ['reviewed', 'Reviewed'], ['all', 'All']].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilterStatus(v)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              filterStatus === v ? 'bg-[#C8A8DC] text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-[#C8A8DC]'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <div className="mb-3 flex justify-center text-gray-400">{filterStatus === 'pending' ? <PartyPopper className="w-10 h-10 text-amber-500" strokeWidth={2} /> : <Inbox className="w-10 h-10" strokeWidth={2} />}</div>
          <p className="text-gray-500 text-sm">
            {filterStatus === 'pending' ? 'No pending homework!' : 'No homework in this section.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(hw => {
            const cfg = STATUS_CONFIG[hw.status] ?? STATUS_CONFIG.pending;
            const overdue = isOverdue(hw.dueDate) && hw.status !== 'submitted' && hw.status !== 'reviewed';
            const dueSoon = isDueSoon(hw.dueDate) && hw.status !== 'submitted' && hw.status !== 'reviewed';

            const isExternal = !!hw.externalUrl;
            const platform = isExternal ? EXTERNAL_PLATFORMS[hw.externalPlatform ?? 'other'] : null;
            const PlatformIcon = platform?.Icon;
            const canAct = hw.status === 'assigned' || hw.status === 'pending';

            return (
              <div key={hw.id} className={`bg-white rounded-2xl p-4 shadow-sm border ${overdue ? 'border-red-200' : dueSoon ? 'border-amber-200' : 'border-gray-100'}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                      {platform && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${platform.badge}`}>
                          <platform.Icon className="w-3 h-3" strokeWidth={2.25} /> {platform.label}
                        </span>
                      )}
                      {overdue && <span className="text-xs font-bold text-red-500 inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3" strokeWidth={2.5} /> Overdue</span>}
                      {dueSoon && <span className="text-xs font-bold text-amber-500 inline-flex items-center gap-1"><Clock className="w-3 h-3" strokeWidth={2.5} /> Due soon</span>}
                      <p className="text-sm font-bold text-[#5A3D7A]">{hw.title}</p>
                    </div>
                    {hw.lessonId && <p className="text-xs text-gray-400 inline-flex items-center gap-1"><BookOpen className="w-3 h-3" strokeWidth={2.25} /> {lessonTitle(hw.lessonId)}</p>}
                    {hw.description && <p className="text-sm text-gray-600 mt-1">{hw.description}</p>}
                    <p className="text-xs text-gray-400 mt-1 inline-flex items-center gap-1"><Calendar className="w-3 h-3" strokeWidth={2.25} /> Due: {formatDate(hw.dueDate)}</p>

                    {/* Reviewed: show feedback */}
                    {hw.status === 'reviewed' && hw.feedback && (
                      <div className="mt-2 bg-green-50 rounded-xl p-3">
                        <p className="text-xs font-bold text-green-700 mb-1">Teacher feedback:</p>
                        <p className="text-sm text-green-700">{hw.feedback}</p>
                        {hw.score !== undefined && <p className="text-xs font-bold text-green-700 mt-1">Grade: {hw.score}/7</p>}
                      </div>
                    )}

                    {/* Submitted */}
                    {hw.status === 'submitted' && (
                      <p className="text-xs text-amber-600 mt-1 font-medium inline-flex items-center gap-1"><Check className="w-3 h-3" strokeWidth={2.5} /> Submitted on {formatDate(hw.submittedAt)} · Awaiting review</p>
                    )}
                  </div>

                  {/* CTAs */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {isExternal && (
                      <a
                        href={hw.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-[#F0E5FF] hover:bg-[#E0CCFF] text-[#5A3D7A] rounded-xl text-sm font-bold transition-colors text-center inline-flex items-center justify-center gap-1.5"
                      >
                        {PlatformIcon && <PlatformIcon className="w-3.5 h-3.5" strokeWidth={2.25} />} Open
                      </a>
                    )}
                    {canAct && (
                      isExternal ? (
                        <button
                          onClick={() => handleMarkExternalDone(hw)}
                          disabled={markingId === hw.id}
                          className="px-4 py-2 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-bold disabled:opacity-40 transition-colors"
                        >
                          {markingId === hw.id ? 'Saving…' : <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Mark as done</span>}
                        </button>
                      ) : (
                        <button
                          onClick={() => { setActiveHw(hw); setAnswer(''); }}
                          className="px-4 py-2 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-bold transition-colors"
                        >
                          Submit
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit modal */}
      {activeHw && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-[#5A3D7A] mb-1">Submit homework</h2>
            <p className="text-sm text-gray-500 mb-4">{activeHw.title}</p>
            {activeHw.description && (
              <div className="bg-[#F9F5FF] rounded-xl p-3 mb-4">
                <p className="text-xs font-bold text-[#5A3D7A] mb-1">Instructions:</p>
                <p className="text-sm text-gray-700">{activeHw.description}</p>
              </div>
            )}
            <div>
              <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1">Your answer</label>
              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                rows={5}
                className="w-full border border-[#C8A8DC] rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
                placeholder="Write your answer here…"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setActiveHw(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!answer.trim() || submitting}
                className="flex-1 py-2.5 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-bold disabled:opacity-40 transition-colors"
              >
                {submitting ? 'Sending…' : <span className="inline-flex items-center gap-1.5"><Send className="w-3.5 h-3.5" strokeWidth={2.25} /> Submit</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Badge unlock toast */}
      <BadgeUnlockToast badgeIds={newBadges} onDismiss={dismissBadges} />
      </div>
    </div>
  );
}
