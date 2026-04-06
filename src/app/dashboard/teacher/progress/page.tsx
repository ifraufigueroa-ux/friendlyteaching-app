// FriendlyTeaching.cl — Teacher Progress Overview
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useAllProgress } from '@/hooks/useProgress';
import { useStudents } from '@/hooks/useStudents';
import { useLessons } from '@/hooks/useLessons';
import TopBar from '@/components/layout/TopBar';
import type { Timestamp } from 'firebase/firestore';
import type { Progress } from '@/types/firebase';

function formatDate(ts: Timestamp | undefined) {
  if (!ts) return '—';
  return ts.toDate().toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
}

function formatDuration(mins?: number) {
  if (!mins) return '—';
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function TeacherProgressPage() {
  const router = useRouter();
  const { firebaseUser, role, isInitialized } = useAuthStore();
  const uid = firebaseUser?.uid ?? '';

  const { progress, loading } = useAllProgress(uid);
  const { students } = useStudents();
  const { lessons } = useLessons(uid, 'teacher');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (isInitialized && !firebaseUser) router.replace('/auth/login');
    if (isInitialized && role === 'student') router.replace('/dashboard');
  }, [isInitialized, firebaseUser, role, router]);

  const completed = progress.filter(p => p.status === 'completed');
  const inProgress = progress.filter(p => p.status === 'in_progress');
  const avgScore = completed.length > 0
    ? Math.round(completed.filter(p => p.overallScore).reduce((acc, p) => acc + (p.overallScore ?? 0), 0) / completed.filter(p => p.overallScore).length)
    : null;

  // Group by student
  const byStudent = students.map(s => {
    const sp = progress.filter(p => p.studentId === s.uid);
    const sc = sp.filter(p => p.status === 'completed');
    const scores = sc.filter(p => p.overallScore).map(p => p.overallScore ?? 0);
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    return { student: s, total: sp.length, completed: sc.length, avgScore: avg, lastActivity: sp[0] };
  }).filter(r => r.total > 0);

  const studentName = (id: string) => students.find(s => s.uid === id)?.fullName ?? id;
  const lessonTitle = (id: string) => lessons.find(l => l.id === id)?.title ?? id;

  return (
    <div className="min-h-screen bg-[#FFFCF7] p-6">
      <TopBar
        title="📊 Progreso de estudiantes"
        subtitle="Visualiza el avance de todos tus estudiantes en las lecciones"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Progreso' }
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Lecciones completadas', value: completed.length, icon: '✅', color: 'text-green-600' },
          { label: 'En progreso', value: inProgress.length, icon: '⏳', color: 'text-amber-600' },
          { label: 'Estudiantes activos', value: byStudent.length, icon: '👥', color: 'text-[#5A3D7A]' },
          { label: 'Nota promedio', value: avgScore !== null ? avgScore : '—', icon: '⭐', color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <p className="text-2xl mb-0.5">{s.icon}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : progress.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-500 text-sm">Aún no hay registro de progreso.</p>
          <p className="text-xs text-gray-400 mt-1">El progreso se registra automáticamente cuando los estudiantes usan el classroom.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By student */}
          <div>
            <h2 className="text-sm font-bold text-[#5A3D7A] uppercase tracking-wider mb-3">Por estudiante</h2>
            <div className="space-y-3">
              {byStudent.map(({ student, total, completed: comp, avgScore: avg }) => {
                const pct = total > 0 ? Math.round((comp / total) * 100) : 0;
                const isExpanded = expandedStudentId === student.uid;
                const studentProgress = progress
                  .filter(p => p.studentId === student.uid)
                  .sort((a, b) => {
                    const ta = (a.startedAt as { seconds?: number })?.seconds ?? 0;
                    const tb = (b.startedAt as { seconds?: number })?.seconds ?? 0;
                    return tb - ta;
                  });

                return (
                  <div key={student.uid} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    {/* Card header — clickable */}
                    <button
                      onClick={() => setExpandedStudentId(isExpanded ? null : student.uid)}
                      className="w-full p-4 text-left hover:bg-[#FAFAFF] transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-full bg-[#F0E5FF] flex items-center justify-center text-sm font-bold text-[#5A3D7A] flex-shrink-0">
                          {student.fullName[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[#5A3D7A] truncate">{student.fullName}</p>
                          <p className="text-xs text-gray-400">{comp}/{total} lecciones · {avg !== null ? `⭐ ${avg}` : 'sin nota'}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm font-bold text-[#9B7CB8]">{pct}%</span>
                          <span className="text-gray-300 text-xs">{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-[#C8A8DC] h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 px-4 pb-4 pt-3 bg-[#FAFAFF]">
                        <p className="text-[10px] font-bold text-[#5A3D7A] uppercase tracking-wider mb-2">Historial de sesiones</p>
                        {studentProgress.length === 0 ? (
                          <p className="text-xs text-gray-400">Sin sesiones registradas.</p>
                        ) : (
                          <div className="space-y-2">
                            {studentProgress.map((p: Progress) => {
                              const lesson = lessons.find(l => l.id === p.lessonId);
                              const slidesDone = (p.slideProgress ?? []).length;
                              const totalSlides = lesson?.slides?.length ?? 0;
                              const slidePct = totalSlides > 0 ? Math.round((slidesDone / totalSlides) * 100) : null;
                              return (
                                <div key={p.id} className="flex items-center gap-2 py-1">
                                  <span className="text-sm flex-shrink-0">
                                    {p.status === 'completed' ? '✅' : p.status === 'in_progress' ? '⏳' : '❌'}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-[#5A3D7A] truncate">{lesson?.title ?? p.lessonId}</p>
                                    <p className="text-[10px] text-gray-400">
                                      {lesson?.code && `${lesson.code} · `}
                                      {formatDate(p.startedAt)}
                                      {p.duration ? ` · ${formatDuration(p.duration)}` : ''}
                                      {p.overallScore ? ` · ⭐${p.overallScore}` : ''}
                                      {slidePct !== null && p.status !== 'completed' ? ` · ${slidePct}% slides` : ''}
                                    </p>
                                  </div>
                                  {p.status !== 'completed' && lesson && (
                                    <Link
                                      href={`/classroom/${p.lessonId}`}
                                      className="text-[10px] text-[#9B7CB8] hover:text-[#5A3D7A] font-semibold flex-shrink-0"
                                    >
                                      Ver →
                                    </Link>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent activity */}
          <div>
            <h2 className="text-sm font-bold text-[#5A3D7A] uppercase tracking-wider mb-3">Actividad reciente</h2>
            <div className="space-y-2">
              {progress.slice(0, 15).map(p => (
                <div key={p.id} className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3">
                  <span className="text-xl">
                    {p.status === 'completed' ? '✅' : p.status === 'in_progress' ? '⏳' : '❌'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#5A3D7A] truncate">{lessonTitle(p.lessonId)}</p>
                    <p className="text-[10px] text-gray-400">
                      {studentName(p.studentId)} · {formatDate(p.startedAt)}
                      {p.duration ? ` · ${formatDuration(p.duration)}` : ''}
                      {p.overallScore ? ` · ⭐${p.overallScore}` : ''}
                    </p>
                  </div>
                  {p.status !== 'completed' && (
                    <Link
                      href={`/classroom/${p.lessonId}`}
                      className="text-xs text-[#9B7CB8] hover:text-[#5A3D7A] font-semibold transition-colors flex-shrink-0"
                    >
                      Ver →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
