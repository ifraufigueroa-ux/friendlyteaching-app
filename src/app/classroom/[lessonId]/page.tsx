// FriendlyTeaching.cl — Classroom Page
'use client';
import { use, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLesson } from '@/hooks/useLessons';
import { useAuthStore } from '@/store/authStore';
import { findOrCreateProgress, completeProgress } from '@/hooks/useProgress';
import SlideViewer from '@/components/classroom/SlideViewer';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ lessonId: string }>;
}

export default function ClassroomPage({ params }: PageProps) {
  const { lessonId } = use(params);
  const searchParams = useSearchParams();
  const isPreview = searchParams.get('preview') === 'student';
  const { lesson, course, loading, error } = useLesson(lessonId);
  const { isInitialized, firebaseUser, profile, role } = useAuthStore();
  const router = useRouter();
  const [progressId, setProgressId] = useState<string | null>(null);
  const [resumeSlideIndex, setResumeSlideIndex] = useState(0);
  const startTimeRef = useRef<number>(Date.now());

  // Start (or resume) progress tracking when lesson loads — students only.
  // findOrCreateProgress prevents duplicate docs when re-entering mid-session,
  // and returns the last visited slide so the student can continue where they left off.
  useEffect(() => {
    if (!lesson || !firebaseUser || role !== 'student' || isPreview) return;
    const teacherUid = profile?.studentData?.approvedByTeacherId ?? lesson.teacherId ?? undefined;
    findOrCreateProgress(firebaseUser.uid, lessonId, teacherUid)
      .then(({ id, resumeSlideIndex: rsi }) => {
        setProgressId(id);
        setResumeSlideIndex(rsi);
      })
      .catch(() => {/* non-critical */});
    startTimeRef.current = Date.now();

    return () => {
      // On unmount: mark as completed if not already done via onComplete callback
      setProgressId((pid) => {
        if (pid) {
          const duration = Math.round((Date.now() - startTimeRef.current) / 60000);
          completeProgress(pid, undefined, duration).catch(() => {});
        }
        return null;
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id, firebaseUser?.uid]);

  // Called from SlideViewer when student presses "Terminar"
  async function handleLessonComplete(score?: number) {
    if (isPreview) {
      router.push('/dashboard/teacher/lessons');
      return;
    }
    if (progressId) {
      const duration = Math.round((Date.now() - startTimeRef.current) / 60000);
      await completeProgress(progressId, score, duration).catch(() => {});
      setProgressId(null); // prevent double-complete on unmount
    }
    router.push('/dashboard/student');
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--gradient-hero)' }}>
        <div className="w-10 h-10 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!firebaseUser) {
    router.replace('/auth/login');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--gradient-hero)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#9B7CB8] font-medium text-sm">Cargando lección...</p>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--gradient-hero)' }}>
        <div className="bg-white rounded-2xl p-8 text-center shadow-lg max-w-sm mx-4">
          <div className="text-4xl mb-3">😕</div>
          <h2 className="font-bold text-[#5A3D7A] mb-2">Lección no encontrada</h2>
          <p className="text-gray-400 text-sm mb-4">{error ?? 'Esta lección no existe.'}</p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-2.5 bg-[#C8A8DC] text-white rounded-xl text-sm font-semibold hover:bg-[#9B7CB8] transition-colors"
          >
            Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-screen flex flex-col"
      style={{ background: 'var(--gradient-hero)' }}
    >
      {/* Compact top nav */}
      <div className={`flex items-center justify-between px-4 py-2 backdrop-blur-sm border-b flex-shrink-0 ${isPreview ? 'bg-amber-50/90 border-amber-200' : 'bg-white/80 border-white/50'}`}>
        <Link
          href={isPreview ? '/dashboard/teacher/lessons' : (role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student')}
          className="text-[#9B7CB8] hover:text-[#5A3D7A] text-sm font-semibold flex items-center gap-1 transition-colors"
        >
          ← {isPreview ? 'Volver a lecciones' : (role === 'teacher' ? 'Panel docente' : 'Mi dashboard')}
        </Link>
        {isPreview ? (
          <span className="text-xs font-bold text-amber-700 bg-amber-200 px-3 py-1 rounded-full">
            Vista previa del estudiante
          </span>
        ) : (
          <p className="text-xs text-gray-400 font-medium">
            FriendlyTeaching.cl
          </p>
        )}
      </div>

      {/* Slide viewer */}
      <div className="flex-1 overflow-hidden p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-xl h-full overflow-hidden">
          <SlideViewer
            lesson={lesson}
            course={course}
            progressId={isPreview ? null : progressId}
            initialSlideIndex={resumeSlideIndex}
            previewAsStudent={isPreview}
            onComplete={role === 'student' || isPreview ? handleLessonComplete : undefined}
          />
        </div>
      </div>
    </div>
  );
}
