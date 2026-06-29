// FriendlyTeaching.cl — Student Music Lessons feed
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useStudentMusicLessons } from '@/hooks/useMusicLessons';
import TopBar from '@/components/layout/TopBar';
import type { MusicLesson } from '@/types/firebase';

export default function StudentMusicPage() {
  const router = useRouter();
  const { firebaseUser, role, isInitialized, profile } = useAuthStore();
  const uid = firebaseUser?.uid ?? '';
  const teacherId = profile?.studentData?.approvedByTeacherId ?? '';
  const { lessons, loading } = useStudentMusicLessons(teacherId, uid);

  useEffect(() => {
    if (isInitialized && !firebaseUser) router.replace('/auth/login');
    if (isInitialized && role === 'teacher') router.replace('/dashboard');
  }, [isInitialized, firebaseUser, role, router]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#F9F5FF] to-[#F0E8FF]">
      <TopBar title="🎵 Friendlyrics®" />
      <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
        <p className="text-sm text-gray-500 mb-5">Aprende inglés a través de la música — completa los ejercicios de cada canción.</p>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-44 rounded-2xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : lessons.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-3">🎵</p>
            <p className="font-medium text-gray-500">No music lessons yet</p>
            <p className="text-sm mt-1">Tu profe asignará canciones aquí pronto.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {lessons.map(lesson => (
              <MusicCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MusicCard({ lesson }: { lesson: MusicLesson }) {
  return (
    <Link
      href={`/dashboard/student/music/${lesson.id}`}
      className="group flex flex-col bg-white rounded-2xl border border-[#F0E5FF] shadow-sm overflow-hidden hover:shadow-md hover:border-[#C8A8DC] transition-all"
    >
      <div className="relative w-full aspect-square overflow-hidden bg-[#F0E5FF]">
        {lesson.song.albumArt
          ? <Image src={lesson.song.albumArt} alt={lesson.song.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="absolute inset-0 flex items-center justify-center text-4xl">🎵</div>
        }
        <div className="absolute top-2 right-2 bg-[#5A3D7A]/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
          {lesson.level}
        </div>
      </div>
      <div className="p-3">
        <p className="font-semibold text-gray-800 text-sm truncate">{lesson.song.title}</p>
        <p className="text-xs text-gray-400 truncate">{lesson.song.artist}</p>
        <p className="text-[10px] text-[#9B7CB8] mt-1">{lesson.slides.length} exercises</p>
      </div>
    </Link>
  );
}
