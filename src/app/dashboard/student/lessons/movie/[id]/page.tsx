// FriendlyTeaching.cl — Student Movie Lesson Player (Friendlyflix®)
//
// Mirror of the Friendlyrics music player at /dashboard/student/music/[id].
// The My Lessons grid sends Friendlyflix assignments here; the previous
// build was missing this route, so clicks 404'd.
'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, type DocumentSnapshot, type DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/store/authStore';
import { Clapperboard, PartyPopper, Maximize2, Minimize2, ArrowLeft, ArrowRight } from 'lucide-react';
import SlideRenderer from '@/components/classroom/SlideRenderer';
import TopBar from '@/components/layout/TopBar';
import type { MovieLesson, Slide } from '@/types/firebase';

export default function MovieLessonPlayerPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { firebaseUser, isInitialized } = useAuthStore();
  const [lesson, setLesson] = useState<MovieLesson | null>(null);
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
  }, [isInitialized, firebaseUser, router]);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, 'movieLessons', id)).then((snap: DocumentSnapshot<DocumentData>) => {
      if (snap.exists()) setLesson({ id: snap.id, ...snap.data() } as MovieLesson);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#F9F5FF] to-[#F0E8FF]">
        <TopBar title="Friendlyflix®" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#C8A8DC] border-t-[#5A3D7A] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#F9F5FF] to-[#F0E8FF]">
        <TopBar title="Friendlyflix®" />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <div className="mb-2 flex justify-center"><Clapperboard className="w-10 h-10" strokeWidth={2} /></div>
            <p>Lesson not found.</p>
            <button onClick={() => router.back()} className="mt-3 text-sm text-[#5A3D7A] underline">Back</button>
          </div>
        </div>
      </div>
    );
  }

  const slides = lesson.slides;
  const slide: Slide = slides[currentSlide];
  const isLast = currentSlide === slides.length - 1;
  const titleLine = lesson.clip?.title ?? lesson.title ?? 'Clip lesson';
  const subtitleLine = lesson.clip?.source ?? '';

  if (completed) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#F9F5FF] to-[#F0E8FF]">
        <TopBar title="Friendlyflix®" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-lg p-8 max-w-sm w-full text-center border border-[#F0E5FF]">
            {lesson.clip?.posterUrl && (
              <Image src={lesson.clip.posterUrl} alt={titleLine} width={96} height={96} className="w-24 h-24 rounded-2xl mx-auto mb-4 shadow-md object-cover" />
            )}
            <div className="mb-2 flex justify-center"><PartyPopper className="w-8 h-8 text-[#5A3D7A]" strokeWidth={2} /></div>
            <h2 className="text-xl font-bold text-[#5A3D7A] mb-1">Lesson complete!</h2>
            <p className="text-gray-500 text-sm mb-1">{titleLine}</p>
            {subtitleLine && <p className="text-gray-400 text-xs mb-6">{subtitleLine}</p>}
            <button
              onClick={() => router.push('/dashboard/student/lessons')}
              className="w-full py-3 rounded-xl bg-[#5A3D7A] text-white font-semibold hover:bg-[#4A2D6A] transition-colors"
            >
              Back to My Lessons
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
      {!isFullscreen && <TopBar title={subtitleLine ? `${titleLine} – ${subtitleLine}` : titleLine} />}

      <div className="w-full h-1.5 bg-[#F0E5FF] flex-shrink-0">
        <div
          className="h-full bg-gradient-to-r from-[#5A3D7A] to-[#9B7CB8] transition-all duration-500"
          style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
        />
      </div>

      <div className="flex items-center justify-between px-4 py-1 text-xs text-gray-400 flex-shrink-0">
        <span>{currentSlide + 1} / {slides.length}</span>
        <div className="flex items-center gap-2">
          <span className="capitalize">{slide.type?.replace(/_/g, ' ')}</span>
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            className="px-2 py-0.5 rounded-md border border-[#E0D5FF] text-[#5A3D7A] hover:bg-[#F9F5FF] transition-colors text-[11px] font-semibold inline-flex items-center gap-1"
          >
            {isFullscreen ? <><Minimize2 className="w-3 h-3" strokeWidth={2.5} /> Salir</> : <><Maximize2 className="w-3 h-3" strokeWidth={2.5} /> Full</>}
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden px-8 pb-6">
        <div className="h-full rounded-2xl overflow-hidden shadow-sm">
          <SlideRenderer
            slide={slide}
            isTeacher={false}
            slideIndex={currentSlide}
            youtubeUrl={lesson.clip?.youtubeUrl}
          />
        </div>
      </div>

      <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-t border-[#F0E5FF] px-4 py-2.5 flex gap-3 w-full">
        <button
          onClick={() => setCurrentSlide((v) => Math.max(0, v - 1))}
          disabled={currentSlide === 0}
          className="flex-1 py-2 rounded-xl text-sm font-medium border border-[#E0D5FF] text-gray-600 hover:bg-[#F9F5FF] disabled:opacity-30 transition-all inline-flex items-center justify-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.25} /> Back
        </button>
        <button
          onClick={() => {
            if (isLast) setCompleted(true);
            else setCurrentSlide((v) => v + 1);
          }}
          className="flex-1 py-2 rounded-xl text-sm font-semibold bg-[#5A3D7A] text-white hover:bg-[#4A2D6A] transition-colors inline-flex items-center justify-center gap-1.5"
        >
          {isLast ? <><PartyPopper className="w-4 h-4" strokeWidth={2.25} /> Finish</> : <>Next <ArrowRight className="w-4 h-4" strokeWidth={2.25} /></>}
        </button>
      </div>
    </div>
  );
}
