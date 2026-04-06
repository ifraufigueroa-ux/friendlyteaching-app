// FriendlyTeaching.cl — Student Homework Page
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useStudentHomework, submitHomework } from '@/hooks/useHomework';
import { usePublishedLessons } from '@/hooks/useLessons';
import { useGamification } from '@/hooks/useGamification';
import TopBar from '@/components/layout/TopBar';
import BadgeUnlockToast from '@/components/gamification/BadgeUnlockToast';
import type { Homework } from '@/types/firebase';
import type { Timestamp } from 'firebase/firestore';

function formatDate(ts: Timestamp | undefined) {
  if (!ts) return '—';
  return ts.toDate().toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
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
  assigned:  { label: 'Pendiente',  color: 'bg-blue-100 text-blue-700' },
  submitted: { label: 'Entregada',  color: 'bg-amber-100 text-amber-700' },
  reviewed:  { label: 'Revisada',   color: 'bg-green-100 text-green-700' },
  pending:   { label: 'Pendiente',  color: 'bg-gray-100 text-gray-500' },
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

  const pending = homework.filter(h => h.status === 'assigned' || h.status === 'pending');
  const submitted = homework.filter(h => h.status === 'submitted');
  const reviewed = homework.filter(h => h.status === 'reviewed');

  const displayed = filterStatus === 'pending' ? pending
    : filterStatus === 'submitted' ? submitted
    : filterStatus === 'reviewed' ? reviewed
    : homework;

  const lessonTitle = (id?: string) => lessons.find(l => l.id === id)?.title ?? '';

  return (
    <div className="min-h-screen bg-[#FFFCF7]">
      <TopBar
        title="Mis Tareas"
        subtitle={`${pending.length} tarea${pending.length !== 1 ? 's' : ''} pendiente${pending.length !== 1 ? 's' : ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Tareas' }
        ]}
      />
      <div className="p-6">

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Pendientes', value: pending.length, icon: '📋', color: pending.length > 0 ? 'text-amber-600' : 'text-gray-400' },
          { label: 'Entregadas', value: submitted.length, icon: '📤', color: 'text-blue-600' },
          { label: 'Revisadas', value: reviewed.length, icon: '✅', color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <p className="text-xl mb-0.5">{s.icon}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[['pending', 'Pendientes'], ['submitted', 'Entregadas'], ['reviewed', 'Revisadas'], ['all', 'Todas']].map(([v, l]) => (
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
          <p className="text-4xl mb-3">{filterStatus === 'pending' ? '🎉' : '📭'}</p>
          <p className="text-gray-500 text-sm">
            {filterStatus === 'pending' ? '¡No tienes tareas pendientes!' : 'No hay tareas en esta sección.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(hw => {
            const cfg = STATUS_CONFIG[hw.status] ?? STATUS_CONFIG.pending;
            const overdue = isOverdue(hw.dueDate) && hw.status !== 'submitted' && hw.status !== 'reviewed';
            const dueSoon = isDueSoon(hw.dueDate) && hw.status !== 'submitted' && hw.status !== 'reviewed';

            return (
              <div key={hw.id} className={`bg-white rounded-2xl p-4 shadow-sm border ${overdue ? 'border-red-200' : dueSoon ? 'border-amber-200' : 'border-gray-100'}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                      {overdue && <span className="text-xs font-bold text-red-500">⚠️ Vencida</span>}
                      {dueSoon && <span className="text-xs font-bold text-amber-500">⏰ Vence pronto</span>}
                      <p className="text-sm font-bold text-[#5A3D7A]">{hw.title}</p>
                    </div>
                    {hw.lessonId && <p className="text-xs text-gray-400">📚 {lessonTitle(hw.lessonId)}</p>}
                    {hw.description && <p className="text-sm text-gray-600 mt-1">{hw.description}</p>}
                    <p className="text-xs text-gray-400 mt-1">📅 Fecha de entrega: {formatDate(hw.dueDate)}</p>

                    {/* Reviewed: show feedback */}
                    {hw.status === 'reviewed' && hw.feedback && (
                      <div className="mt-2 bg-green-50 rounded-xl p-3">
                        <p className="text-xs font-bold text-green-700 mb-1">Feedback del profesor:</p>
                        <p className="text-sm text-green-700">{hw.feedback}</p>
                        {hw.score !== undefined && <p className="text-xs font-bold text-green-700 mt-1">Nota: {hw.score}/7</p>}
                      </div>
                    )}

                    {/* Submitted */}
                    {hw.status === 'submitted' && (
                      <p className="text-xs text-amber-600 mt-1 font-medium">✓ Entregada el {formatDate(hw.submittedAt)} · Esperando revisión</p>
                    )}
                  </div>

                  {/* CTA */}
                  {(hw.status === 'assigned' || hw.status === 'pending') && (
                    <button
                      onClick={() => { setActiveHw(hw); setAnswer(''); }}
                      className="flex-shrink-0 px-4 py-2 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-bold transition-colors"
                    >
                      Entregar
                    </button>
                  )}
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
            <h2 className="text-lg font-bold text-[#5A3D7A] mb-1">Entregar tarea</h2>
            <p className="text-sm text-gray-500 mb-4">{activeHw.title}</p>
            {activeHw.description && (
              <div className="bg-[#F9F5FF] rounded-xl p-3 mb-4">
                <p className="text-xs font-bold text-[#5A3D7A] mb-1">Instrucciones:</p>
                <p className="text-sm text-gray-700">{activeHw.description}</p>
              </div>
            )}
            <div>
              <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1">Tu respuesta</label>
              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                rows={5}
                className="w-full border border-[#C8A8DC] rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
                placeholder="Escribe tu respuesta aquí..."
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setActiveHw(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!answer.trim() || submitting}
                className="flex-1 py-2.5 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-bold disabled:opacity-40 transition-colors"
              >
                {submitting ? 'Enviando...' : '📤 Entregar'}
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
