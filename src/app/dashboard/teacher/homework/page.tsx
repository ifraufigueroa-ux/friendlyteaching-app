// FriendlyTeaching.cl — Teacher Homework Page
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';
import { useAuthStore } from '@/store/authStore';
import { useTeacherHomework, createHomework, updateHomeworkFeedback, deleteHomework } from '@/hooks/useHomework';
import { useStudents } from '@/hooks/useStudents';
import { useLessons } from '@/hooks/useLessons';
import { useAIGrade } from '@/hooks/useAIGrade';
import AIFeedbackPanel from '@/components/classroom/AIFeedbackPanel';
import TopBar from '@/components/layout/TopBar';
import type { Homework, Slide } from '@/types/firebase';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  assigned:  { label: 'Asignada',   color: 'bg-blue-100 text-blue-700' },
  submitted: { label: 'Entregada',  color: 'bg-amber-100 text-amber-700' },
  reviewed:  { label: 'Revisada',   color: 'bg-green-100 text-green-700' },
  pending:   { label: 'Pendiente',  color: 'bg-gray-100 text-gray-500' },
};

function formatDate(ts: Timestamp | undefined) {
  if (!ts) return '—';
  return ts.toDate().toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function TeacherHomeworkPage() {
  const router = useRouter();
  const { firebaseUser, role, isInitialized, profile } = useAuthStore();
  const uid = firebaseUser?.uid ?? '';

  const { homework, loading } = useTeacherHomework(uid);
  const { students } = useStudents();
  const { lessons } = useLessons(uid, 'teacher');

  const [showForm, setShowForm] = useState(false);
  const [selectedHw, setSelectedHw] = useState<Homework | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Create form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    assignedToStudentId: '',
    lessonId: '',
    dueDate: '',
  });
  const [importedSlides, setImportedSlides] = useState<Slide[]>([]);
  const [saving, setSaving] = useState(false);

  // Feedback form
  const [feedbackHw, setFeedbackHw] = useState<Homework | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackScore, setFeedbackScore] = useState('');
  const { grade: aiGrade, loading: aiLoading, result: aiResult, reset: aiReset } = useAIGrade();

  useEffect(() => {
    if (isInitialized && !firebaseUser) router.replace('/auth/login');
    if (isInitialized && role === 'student') router.replace('/dashboard');
  }, [isInitialized, firebaseUser, role, router]);

  const handleCreate = async () => {
    if (!form.title || !form.dueDate || saving) return;
    setSaving(true);
    try {
      await createHomework(uid, {
        title: form.title,
        description: form.description,
        assignedToStudentId: form.assignedToStudentId || undefined,
        lessonId: form.lessonId || undefined,
        dueDate: new Date(form.dueDate),
        slides: importedSlides.length > 0 ? importedSlides : undefined,
      });
      setForm({ title: '', description: '', assignedToStudentId: '', lessonId: '', dueDate: '' });
      setImportedSlides([]);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  function handleImportPostSlides() {
    if (!form.lessonId) return;
    const lesson = lessons.find((l) => l.id === form.lessonId);
    const postSlides = (lesson?.slides ?? []).filter((s) => s.phase === 'post');
    setImportedSlides(postSlides);
  }

  const handleFeedback = async () => {
    if (!feedbackHw || !feedbackText) return;
    const student = students.find(s => s.uid === feedbackHw.assignedToStudentId);
    await updateHomeworkFeedback(
      feedbackHw.id,
      feedbackText,
      feedbackScore ? Number(feedbackScore) : undefined,
      student?.email ? {
        studentEmail: student.email,
        studentName: student.fullName,
        teacherName: profile?.fullName ?? 'Tu profesor',
        homeworkTitle: feedbackHw.title,
      } : undefined,
    );
    setFeedbackHw(null);
    setFeedbackText('');
    setFeedbackScore('');
  };

  const filtered = filterStatus === 'all' ? homework : homework.filter(h => h.status === filterStatus);
  const studentName = (id?: string) => students.find(s => s.uid === id)?.fullName ?? 'Todos los estudiantes';
  const lessonTitle = (id?: string) => lessons.find(l => l.id === id)?.title ?? '';

  return (
    <div className="min-h-screen bg-[#FFFCF7] p-6">
      <TopBar
        title="📝 Tareas"
        subtitle="Asigna y revisa las tareas de tus estudiantes"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Tareas' }
        ]}
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-bold transition-colors"
          >
            + Nueva tarea
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: homework.length, color: 'text-[#5A3D7A]' },
          { label: 'Asignadas', value: homework.filter(h => h.status === 'assigned').length, color: 'text-blue-600' },
          { label: 'Entregadas', value: homework.filter(h => h.status === 'submitted').length, color: 'text-amber-600' },
          { label: 'Revisadas', value: homework.filter(h => h.status === 'reviewed').length, color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[['all', 'Todas'], ['assigned', 'Asignadas'], ['submitted', 'Entregadas'], ['reviewed', 'Revisadas']].map(([v, l]) => (
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

      {/* Homework list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-500 text-sm">No hay tareas{filterStatus !== 'all' ? ` con estado "${filterStatus}"` : ''}.</p>
          <button onClick={() => setShowForm(true)} className="mt-4 text-sm font-semibold text-[#9B7CB8] underline">
            Crear primera tarea
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(hw => {
            const s = STATUS_LABELS[hw.status] ?? STATUS_LABELS.pending;
            return (
              <div key={hw.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                    <p className="text-sm font-bold text-[#5A3D7A] truncate">{hw.title}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    👤 {studentName(hw.assignedToStudentId)}
                    {hw.lessonId && <span> · 📚 {lessonTitle(hw.lessonId)}</span>}
                    {' · '} 📅 Vence: {formatDate(hw.dueDate)}
                  </p>
                  {hw.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{hw.description}</p>}
                  {hw.status === 'submitted' && hw.submittedAt && (
                    <p className="text-xs text-amber-600 mt-1 font-medium">⏰ Entregada: {formatDate(hw.submittedAt)}</p>
                  )}
                  {hw.status === 'reviewed' && (
                    <p className="text-xs text-green-600 mt-1">✓ Feedback enviado{hw.score !== undefined ? ` · Nota: ${hw.score}` : ''}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {hw.status === 'submitted' && (
                    <button
                      onClick={() => { setFeedbackHw(hw); setFeedbackText(hw.feedback ?? ''); setFeedbackScore(String(hw.score ?? '')); aiReset(); }}
                      className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      ✍️ Revisar
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedHw(hw)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-[#F0E5FF] text-gray-600 hover:text-[#5A3D7A] rounded-lg text-xs font-semibold transition-colors"
                  >
                    Ver
                  </button>
                  <button
                    onClick={() => { if (confirm('¿Eliminar esta tarea?')) deleteHomework(hw.id); }}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 rounded-lg text-xs font-semibold transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-[#5A3D7A] mb-4">Nueva tarea</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1">Título *</label>
                <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
                  className="w-full border border-[#C8A8DC] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
                  placeholder="Ej: Práctica de gramática - Unit 1" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1">Descripción</label>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
                  rows={2} className="w-full border border-[#C8A8DC] rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
                  placeholder="Instrucciones para el estudiante..." />
              </div>
              <div>
                <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1">Estudiante</label>
                <select value={form.assignedToStudentId} onChange={e => setForm(f => ({...f, assignedToStudentId: e.target.value}))}
                  className="w-full border border-[#C8A8DC] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] bg-white">
                  <option value="">— Todos los estudiantes —</option>
                  {students.map(s => <option key={s.uid} value={s.uid}>{s.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1">Lección relacionada</label>
                <select
                  value={form.lessonId}
                  onChange={e => { setForm(f => ({...f, lessonId: e.target.value})); setImportedSlides([]); }}
                  className="w-full border border-[#C8A8DC] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] bg-white"
                >
                  <option value="">— Sin lección asociada —</option>
                  {lessons.map(l => <option key={l.id} value={l.id}>{l.code} · {l.title}</option>)}
                </select>
                {form.lessonId && (() => {
                  const postCount = (lessons.find(l => l.id === form.lessonId)?.slides ?? []).filter(s => s.phase === 'post').length;
                  return postCount > 0 ? (
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={importedSlides.length > 0 ? () => setImportedSlides([]) : handleImportPostSlides}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          importedSlides.length > 0
                            ? 'bg-[#A8E6A1] text-[#2D6E2A]'
                            : 'bg-[#F0E5FF] text-[#5A3D7A] hover:bg-[#E0CCFF]'
                        }`}
                      >
                        {importedSlides.length > 0 ? `✅ ${importedSlides.length} slides importados` : `📋 Importar ${postCount} slides post-clase`}
                      </button>
                      {importedSlides.length > 0 && (
                        <button type="button" onClick={() => setImportedSlides([])} className="text-xs text-gray-400 hover:text-red-400">✕</button>
                      )}
                    </div>
                  ) : null;
                })()}
              </div>
              <div>
                <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1">Fecha de entrega *</label>
                <input type="date" value={form.dueDate} onChange={e => setForm(f => ({...f, dueDate: e.target.value}))}
                  className="w-full border border-[#C8A8DC] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={handleCreate} disabled={!form.title || !form.dueDate || saving}
                className="flex-1 py-2.5 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-bold disabled:opacity-40 transition-colors">
                {saving ? 'Guardando...' : 'Crear tarea'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback modal */}
      {feedbackHw && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-[#5A3D7A] mb-1">Revisar tarea</h2>
            <p className="text-sm text-gray-500 mb-4">{feedbackHw.title}</p>
            {feedbackHw.submittedAnswers && (() => {
              const ans = feedbackHw.submittedAnswers as Record<string, unknown>;
              const text = typeof ans.textAnswer === 'string' ? ans.textAnswer : null;
              return (
                <div className="bg-gray-50 rounded-xl p-3 mb-4 max-h-40 overflow-y-auto">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Respuesta del estudiante</p>
                  {text ? (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{text}</p>
                  ) : (
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap">{JSON.stringify(ans, null, 2)}</pre>
                  )}
                </div>
              );
            })()}

            {/* AI Grade button */}
            {feedbackHw.submittedAnswers && (() => {
              const ans = feedbackHw.submittedAnswers as Record<string, unknown>;
              const text = typeof ans.textAnswer === 'string' ? ans.textAnswer : null;
              if (!text) return null;
              const student = students.find(s => s.uid === feedbackHw.assignedToStudentId);
              const level = student?.studentData?.level ?? 'B1';
              return (
                <div className="mb-3">
                  {aiResult ? (
                    <div className="mb-3">
                      <AIFeedbackPanel result={aiResult} slideType="writing_prompt" onClose={aiReset} />
                      <button
                        onClick={() => {
                          setFeedbackText(aiResult.feedback + (aiResult.grammarErrors?.length ? '\n\nErrores: ' + aiResult.grammarErrors.join('; ') : ''));
                          setFeedbackScore(String(aiResult.score7));
                        }}
                        className="mt-2 w-full py-2 bg-[#F0E5FF] text-[#5A3D7A] rounded-xl text-xs font-bold hover:bg-[#E0D5FF] transition-colors"
                      >
                        📋 Usar feedback de IA como base
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => aiGrade({
                        slideType: 'writing_prompt',
                        studentAnswer: text,
                        prompt: feedbackHw.description ?? feedbackHw.title,
                        level,
                        language: 'es',
                      })}
                      disabled={aiLoading}
                      className="w-full py-2.5 bg-gradient-to-r from-[#C8A8DC] to-[#9B7CB8] text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {aiLoading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Analizando con IA...
                        </>
                      ) : (
                        <>🤖 Corregir con IA</>
                      )}
                    </button>
                  )}
                </div>
              );
            })()}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1">Feedback</label>
                <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)}
                  rows={3} className="w-full border border-[#C8A8DC] rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
                  placeholder="Escribe tu feedback..." />
              </div>
              <div>
                <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1">Nota (opcional)</label>
                <input type="number" min="1" max="7" value={feedbackScore} onChange={e => setFeedbackScore(e.target.value)}
                  className="w-32 border border-[#C8A8DC] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
                  placeholder="1–7" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setFeedbackHw(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={handleFeedback} disabled={!feedbackText}
                className="flex-1 py-2.5 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-bold disabled:opacity-40 transition-colors">
                Enviar feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selectedHw && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedHw(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-lg font-bold text-[#5A3D7A] flex-1 pr-3">{selectedHw.title}</h2>
              <button onClick={() => setSelectedHw(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>👤 <strong>Estudiante:</strong> {studentName(selectedHw.assignedToStudentId)}</p>
              {selectedHw.lessonId && <p>📚 <strong>Lección:</strong> {lessonTitle(selectedHw.lessonId)}</p>}
              <p>📅 <strong>Vence:</strong> {formatDate(selectedHw.dueDate)}</p>
              <p>📊 <strong>Estado:</strong> {STATUS_LABELS[selectedHw.status]?.label}</p>
              {selectedHw.description && <p className="text-gray-500">{selectedHw.description}</p>}
              {selectedHw.feedback && (
                <div className="bg-green-50 rounded-xl p-3 mt-2">
                  <p className="text-xs font-bold text-green-700 mb-1">Feedback enviado:</p>
                  <p className="text-xs text-green-600">{selectedHw.feedback}</p>
                  {selectedHw.score && <p className="text-xs font-bold text-green-700 mt-1">Nota: {selectedHw.score}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
