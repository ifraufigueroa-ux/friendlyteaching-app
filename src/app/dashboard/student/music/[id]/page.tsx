// FriendlyTeaching.cl — Student Music Lesson Player
'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, type DocumentSnapshot, type DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/store/authStore';
import SlideRenderer from '@/components/classroom/SlideRenderer';
import TopBar from '@/components/layout/TopBar';
import type { MusicLesson, Slide } from '@/types/firebase';

export default function MusicLessonPlayerPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { firebaseUser, isInitialized } = useAuthStore();
  const [lesson, setLesson] = useState<MusicLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [completed, setCompleted] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      playerRef.current?.requestFullscreen().catch(() => { /* ignore */ });
    } else {
      document.exitFullscreen().catch(() => { /* ignore */ });
    }
  }

  useEffect(() => {
    if (isInitialized && !firebaseUser) router.replace('/auth/login');
    // Teachers can open lessons as preview — no redirect needed
  }, [isInitialized, firebaseUser, router]);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, 'musicLessons', id)).then((snap: DocumentSnapshot<DocumentData>) => {
      if (snap.exists()) setLesson({ id: snap.id, ...snap.data() } as MusicLesson);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#F9F5FF] to-[#F0E8FF]">
        <TopBar title="🎵 Friendlyrics®" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#C8A8DC] border-t-[#5A3D7A] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#F9F5FF] to-[#F0E8FF]">
        <TopBar title="🎵 Friendlyrics®" />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <p className="text-4xl mb-2">🎵</p>
            <p>Lección no encontrada.</p>
            <button onClick={() => router.back()} className="mt-3 text-sm text-[#5A3D7A] underline">Volver</button>
          </div>
        </div>
      </div>
    );
  }

  const slides = lesson.slides;
  const slide: Slide = slides[currentSlide];
  const isLast = currentSlide === slides.length - 1;

  if (completed) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#F9F5FF] to-[#F0E8FF]">
        <TopBar title="🎵 Friendlyrics®" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-lg p-8 max-w-sm w-full text-center border border-[#F0E5FF]">
            {lesson.song.albumArt && (
              <Image src={lesson.song.albumArt} alt={lesson.song.title} width={96} height={96} className="w-24 h-24 rounded-2xl mx-auto mb-4 shadow-md" />
            )}
            <p className="text-3xl mb-2">🎉</p>
            <h2 className="text-xl font-bold text-[#5A3D7A] mb-1">¡Lección completada!</h2>
            <p className="text-gray-500 text-sm mb-1">{lesson.song.title}</p>
            <p className="text-gray-400 text-xs mb-6">by {lesson.song.artist}</p>
            <button
              onClick={() => router.push('/dashboard/student/music')}
              className="w-full py-3 rounded-xl bg-[#5A3D7A] text-white font-semibold hover:bg-[#4A2D6A] transition-colors"
            >
              Volver a Friendlyrics®
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={playerRef}
      className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-[#F9F5FF] to-[#F0E8FF]"
    >
      {!isFullscreen && <TopBar title={`🎵 ${lesson.song.title} – ${lesson.song.artist}`} />}

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-[#F0E5FF] flex-shrink-0">
        <div
          className="h-full bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] transition-all duration-500"
          style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
        />
      </div>

      {/* Slide counter */}
      <div className="flex items-center justify-between px-4 py-1 text-xs text-gray-400 flex-shrink-0">
        <span>{currentSlide + 1} / {slides.length}</span>
        <div className="flex items-center gap-2">
          <span className="capitalize">{slide.type?.replace(/_/g, ' ')}</span>
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            className="px-2 py-0.5 rounded-md border border-[#E0D5FF] text-[#5A3D7A] hover:bg-[#F9F5FF] transition-colors text-[11px] font-semibold"
          >
            {isFullscreen ? '⊠ Salir' : '⛶ Full'}
          </button>
        </div>
      </div>

      {/* Slide content */}
      <div className="flex-1 min-h-0 overflow-hidden px-8 pb-6">
        <div className="h-full rounded-2xl overflow-hidden shadow-sm">
        <SlideRenderer
          slide={slide}
          isTeacher={false}
          slideIndex={currentSlide}
          youtubeUrl={lesson.song.youtubeUrl}
        />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-t border-[#F0E5FF] px-4 py-2.5 flex gap-3 w-full">
        <button
          onClick={() => setCurrentSlide(v => Math.max(0, v - 1))}
          disabled={currentSlide === 0}
          className="flex-1 py-2 rounded-xl text-sm font-medium border border-[#E0D5FF] text-gray-600 hover:bg-[#F9F5FF] disabled:opacity-30 transition-all"
        >
          ← Back
        </button>
        <button
          onClick={() => {
            if (isLast) setCompleted(true);
            else setCurrentSlide(v => v + 1);
          }}
          className="flex-1 py-2 rounded-xl text-sm font-semibold bg-[#5A3D7A] text-white hover:bg-[#4A2D6A] transition-colors"
        >
          {isLast ? '🎉 Finish' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
