// FriendlyTeaching.cl — Student Text Lessons feed (Friendlytext®)
'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useStudentTextLessons } from '@/hooks/useTextLessons';
import TopBar from '@/components/layout/TopBar';
import type { TextLesson } from '@/types/firebase';

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

function thumb(lesson: TextLesson): string | null {
  const yt = lesson.text?.youtubeUrl;
  const id = yt ? extractVideoId(yt) : null;
  if (id) return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
  return lesson.text?.posterUrl ?? null;
}

export default function StudentTextsPage() {
  const router = useRouter();
  const { firebaseUser, role, isInitialized } = useAuthStore();
  const uid = firebaseUser?.uid ?? '';
  const { lessons, loading } = useStudentTextLessons(uid);

  useEffect(() => {
    if (isInitialized && !firebaseUser) router.replace('/auth/login');
    if (isInitialized && role === 'teacher') router.replace('/dashboard');
  }, [isInitialized, firebaseUser, role, router]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#F5F9FC] to-[#EEF3F8]">
      <TopBar title="📖 Friendlytext®" />
      <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
        <p className="text-sm text-gray-500 mb-5">
          Aprende inglés a través de textos — completa los ejercicios de cada lectura.
        </p>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-44 rounded-2xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : lessons.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-3">📖</p>
            <p className="font-medium text-gray-500">No text lessons yet</p>
            <p className="text-sm mt-1">Tu profe te asignará lecturas aquí pronto.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {lessons.map(lesson => <TextCard key={lesson.id} lesson={lesson} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function TextCard({ lesson }: { lesson: TextLesson }) {
  const cover = thumb(lesson);
  return (
    <Link
      href={`/dashboard/student/texts/${lesson.id}`}
      className="group flex flex-col bg-white rounded-2xl border border-[#D9E6F0] shadow-sm overflow-hidden hover:shadow-md hover:border-[#4B6A85] transition-all"
    >
      <div className="relative w-full aspect-square overflow-hidden bg-gradient-to-br from-[#1B2C3F] to-[#4B6A85]">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={lesson.text?.title ?? ''} className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl text-white/70">📖</div>
        )}
        <div className="absolute top-2 right-2 bg-[#1B2C3F]/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
          {lesson.level}
        </div>
      </div>
      <div className="p-3">
        <p className="font-semibold text-gray-800 text-sm truncate">{lesson.text?.title ?? lesson.title}</p>
        <p className="text-xs text-gray-400 truncate">{lesson.text?.source ?? ''}</p>
        <p className="text-[10px] text-[#4B6A85] mt-1">{lesson.slides?.length ?? 0} exercises</p>
      </div>
    </Link>
  );
}
