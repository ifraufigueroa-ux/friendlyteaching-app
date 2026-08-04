// FriendlyTeaching.cl — Student Text Lesson Player (Friendlytext®)
'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, type DocumentSnapshot, type DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/store/authStore';
import SlideRenderer from '@/components/classroom/SlideRenderer';
import TopBar from '@/components/layout/TopBar';
import type { TextLesson, Slide } from '@/types/firebase';

export default function TextLessonPlayerPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { firebaseUser, isInitialized } = useAuthStore();
  const [lesson, setLesson] = useState<TextLesson | null>(null);
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
    getDoc(doc(db, 'textLessons', id)).then((snap: DocumentSnapshot<DocumentData>) => {
      if (snap.exists()) setLesson({ id: snap.id, ...snap.data() } as TextLesson);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="theme-friendly-tales flex flex-col min-h-screen">
        <TopBar title="📖 FriendlyTales®" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#9B72B8]/30 border-t-[#F9F0A8] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="theme-friendly-tales flex flex-col min-h-screen">
        <TopBar title="📖 FriendlyTales®" />
        <div className="flex-1 flex items-center justify-center text-[#A69BB8]">
          <div className="text-center">
            <p className="text-4xl mb-2">📖</p>
            <p>Lección no encontrada.</p>
            <button onClick={() => router.back()} className="mt-3 text-sm text-[#F9F0A8] underline">Volver</button>
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
      <div className="theme-friendly-tales flex flex-col min-h-screen">
        <TopBar title="📖 FriendlyTales®" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="ft-glass-card p-8 max-w-sm w-full text-center">
            <p className="text-3xl mb-2">🎉</p>
            <h2 className="text-xl font-bold ft-title-gold mb-1">¡Lección completada!</h2>
            <p className="text-[#A69BB8] text-sm mb-1">{lesson.text?.title ?? lesson.title}</p>
            <p className="text-[#A69BB8]/70 text-xs mb-6">— {lesson.text?.source ?? ''}</p>
            <button
              onClick={() => router.push('/dashboard/student/texts')}
              className="ft-cta w-full"
            >
              Volver a FriendlyTales®
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={playerRef}
      className="theme-friendly-tales flex flex-col h-screen overflow-hidden"
    >
      {!isFullscreen && <TopBar title={`📖 ${lesson.text?.title ?? lesson.title}`} />}

      <div className="w-full h-1.5 bg-[rgba(30,20,50,0.6)] flex-shrink-0">
        <div
          className="h-full bg-gradient-to-r from-[#EC008C] via-[#F9F0A8] to-[#7ED6E0] transition-all duration-500"
          style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
        />
      </div>

      <div className="flex items-center justify-between px-4 py-1 text-xs text-[#A69BB8] flex-shrink-0">
        <span>{currentSlide + 1} / {slides.length}</span>
        <div className="flex items-center gap-2">
          <span className="capitalize">{slide.type?.replace(/_/g, ' ')}</span>
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            className="px-2 py-0.5 rounded-md border border-[#9B72B8]/40 text-[#F8F5FC] hover:bg-white/10 transition-colors text-[11px] font-semibold"
          >
            {isFullscreen ? '⊠ Salir' : '⛶ Full'}
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden px-8 pb-6">
        <div className="h-full rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          <SlideRenderer
            slide={slide}
            isTeacher={false}
            slideIndex={currentSlide}
            youtubeUrl={lesson.text?.youtubeUrl}
            brand="FriendlyTales"
          />
        </div>
      </div>

      <div className="flex-shrink-0 bg-[rgba(15,10,28,0.85)] backdrop-blur-sm border-t border-[#9B72B8]/25 px-4 py-2.5 flex gap-3 w-full">
        <button
          onClick={() => setCurrentSlide(v => Math.max(0, v - 1))}
          disabled={currentSlide === 0}
          className="flex-1 py-2 rounded-xl text-sm font-medium border border-[#9B72B8]/40 text-[#A69BB8] hover:bg-white/5 hover:text-[#F8F5FC] disabled:opacity-30 transition-all"
        >
          ← Back
        </button>
        <button
          onClick={() => {
            if (isLast) setCompleted(true);
            else setCurrentSlide(v => v + 1);
          }}
          className="flex-1 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-[#EC008C] to-[#A70066] text-white hover:opacity-90 transition-all shadow-[0_0_20px_rgba(236,0,140,0.35)]"
        >
          {isLast ? '🎉 Finish' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
