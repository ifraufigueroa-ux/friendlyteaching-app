// FriendlyTeaching.cl — Student Progress Page
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useStudentProgress } from '@/hooks/useProgress';
import { usePublishedLessons } from '@/hooks/useLessons';
import TopBar from '@/components/layout/TopBar';
import type { Timestamp } from 'firebase/firestore';

function formatDate(ts: Timestamp | undefined) {
  if (!ts) return '—';
  return ts.toDate().toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDuration(mins?: number) {
  if (!mins) return null;
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}min`;
}

const STATUS_CONFIG = {
  completed:   { label: 'Completada', icon: '✅', color: 'text-green-600 bg-green-50' },
  in_progress: { label: 'En progreso', icon: '⏳', color: 'text-amber-600 bg-amber-50' },
  abandoned:   { label: 'Abandonada', icon: '⏸️', color: 'text-gray-400 bg-gray-50' },
};

export default function StudentProgressPage() {
  const router = useRouter();
  const { firebaseUser, role, isInitialized } = useAuthStore();
  const uid = firebaseUser?.uid ?? '';

  const { progress, loading } = useStudentProgress(uid);
  const { lessons } = usePublishedLessons();

  useEffect(() => {
    if (isInitialized && !firebaseUser) router.replace('/auth/login');
    if (isInitialized && role === 'teacher') router.replace('/dashboard/teacher');
  }, [isInitialized, firebaseUser, role, router]);

  const completed = progress.filter(p => p.status === 'completed');
  const scores = completed.filter(p => p.overallScore).map(p => p.overallScore ?? 0);
  const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;
  const totalMinutes = completed.reduce((acc, p) => acc + (p.duration ?? 0), 0);

  // Unique lessons completed
  const uniqueLessons = new Set(completed.map(p => p.lessonId)).size;

  return (
    <div className="min-h-screen bg-[#FFFCF7]">
      <TopBar
        title="Mi Progreso"
        subtitle="Tu historial de aprendizaje"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Progreso' }
        ]}
      />
      <div className="p-6">

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Lecciones completadas', value: uniqueLessons, icon: '🎓', color: 'text-[#5A3D7A]' },
          { label: 'Tiempo total', value: totalMinutes > 0 ? formatDuration(totalMinutes) : '—', icon: '⏱️', color: 'text-blue-600' },
          { label: 'Nota promedio', value: avgScore ?? '—', icon: '⭐', color: 'text-amber-600' },
          { label: 'Sesiones totales', value: progress.length, icon: '📚', color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <p className="text-2xl mb-0.5">{s.icon}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
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
          <p className="text-4xl mb-3">🌱</p>
          <p className="text-gray-500 text-sm">Aún no has completado ninguna lección.</p>
          <p className="text-xs text-gray-400 mt-1">Tu progreso aparecerá aquí después de tus clases.</p>
          <Link
            href="/dashboard/student"
            className="mt-4 inline-block text-sm font-semibold text-[#9B7CB8] underline"
          >
            Ver mis lecciones →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Progress bar por lección */}
          {uniqueLessons > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="text-sm font-bold text-[#5A3D7A] uppercase tracking-wider mb-3">Lecciones</h2>
              <div className="space-y-3">
                {[...new Set(progress.map(p => p.lessonId))].map(lessonId => {
                  const lesson = lessons.find(l => l.id === lessonId);
                  const lp = progress.filter(p => p.lessonId === lessonId);
                  const isComp = lp.some(p => p.status === 'completed');
                  const best = lp.filter(p => p.overallScore).sort((a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0))[0];
                  return (
                    <div key={lessonId} className="flex items-center gap-3">
                      <span className="text-lg flex-shrink-0">{isComp ? '✅' : '⏳'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#5A3D7A] truncate">{lesson?.title ?? lessonId}</p>
                        <p className="text-xs text-gray-400">
                          {lesson?.code} · {lesson?.level}
                          {best?.overallScore ? ` · ⭐ ${best.overallScore}` : ''}
                        </p>
                      </div>
                      {lesson && (
                        <Link
                          href={`/classroom/${lessonId}`}
                          className="text-xs font-semibold text-[#9B7CB8] hover:text-[#5A3D7A] transition-colors flex-shrink-0"
                        >
                          {isComp ? 'Repasar →' : 'Continuar →'}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Historial de sesiones */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="text-sm font-bold text-[#5A3D7A] uppercase tracking-wider mb-3">Historial de sesiones</h2>
            <div className="space-y-2">
              {progress.map(p => {
                const cfg = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.in_progress;
                const lesson = lessons.find(l => l.id === p.lessonId);
                return (
                  <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <span className="text-lg">{cfg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#5A3D7A] truncate">{lesson?.title ?? p.lessonId}</p>
                      <p className="text-xs text-gray-400">
                        {formatDate(p.startedAt)}
                        {p.duration ? ` · ${formatDuration(p.duration)}` : ''}
                        {p.overallScore ? ` · ⭐ ${p.overallScore}` : ''}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color} flex-shrink-0`}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
