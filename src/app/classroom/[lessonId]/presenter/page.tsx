// FriendlyTeaching.cl — Presenter View (opens in a second window)
// Shows: current slide notes, timer, next slide preview, student answers summary.
// Synced via BroadcastChannel from the main classroom window.
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, DocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Lesson, Slide } from '@/types/firebase';
import { getPresenterChannel } from '@/lib/utils/presenterChannel';
import type { PresenterMessage } from '@/lib/utils/presenterChannel';
import SlideRenderer from '@/components/classroom/SlideRenderer';

export default function PresenterPage() {
  const params = useParams();
  const lessonId = params?.lessonId as string;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { correct: number; total: number }>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [connected, setConnected] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Load lesson data
  useEffect(() => {
    if (!lessonId) return;
    getDoc(doc(db, 'lessons', lessonId)).then((snap: DocumentSnapshot) => {
      if (snap.exists()) setLesson({ id: snap.id, ...snap.data() } as Lesson);
    });
  }, [lessonId]);

  // BroadcastChannel listener
  useEffect(() => {
    const channel = getPresenterChannel();

    function handleMessage(ev: MessageEvent<PresenterMessage>) {
      const msg = ev.data;
      switch (msg.type) {
        case 'SLIDE_CHANGE':
          setCurrentIndex(msg.slideIndex);
          setConnected(true);
          break;
        case 'ANSWER_UPDATE':
          setAnswers((prev) => {
            const existing = prev[msg.slideIndex] ?? { correct: 0, total: 0 };
            return {
              ...prev,
              [msg.slideIndex]: {
                correct: existing.correct + (msg.isCorrect ? 1 : 0),
                total: existing.total + 1,
              },
            };
          });
          break;
        case 'SESSION_START':
          setCurrentIndex(0);
          setAnswers({});
          setElapsedSeconds(0);
          setConnected(true);
          break;
        case 'SESSION_END':
          setConnected(false);
          break;
        case 'PING':
          channel.postMessage({ type: 'PONG' });
          setConnected(true);
          break;
      }
    }

    channel.addEventListener('message', handleMessage);
    // Send ping to check if main window is alive
    channel.postMessage({ type: 'PING' });

    return () => {
      channel.removeEventListener('message', handleMessage);
    };
  }, []);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const resetTimer = useCallback(() => setElapsedSeconds(0), []);

  const slides = lesson?.slides ?? [];
  const currentSlide = slides[currentIndex] as Slide | undefined;
  const nextSlide = slides[currentIndex + 1] as Slide | undefined;
  const totalSlides = slides.length;

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Get answer stats for current slide
  const currentAnswers = answers[currentIndex];
  const accuracy = currentAnswers && currentAnswers.total > 0
    ? Math.round((currentAnswers.correct / currentAnswers.total) * 100)
    : null;

  if (!lesson) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="w-8 h-8 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <span className="text-xs font-medium text-gray-400">
            {connected ? 'Conectado al classroom' : 'Esperando conexión...'}
          </span>
        </div>
        <div className="text-sm font-bold text-[#C8A8DC] truncate mx-4">
          {lesson.code} · {lesson.title}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={resetTimer}
            className="text-xs text-gray-400 hover:text-white transition-colors"
            title="Resetear timer"
          >
            ⏱
          </button>
          <span className="font-mono text-lg font-bold text-white tabular-nums">{timeStr}</span>
          <span className="text-xs text-gray-500">
            {currentIndex + 1}/{totalSlides}
          </span>
        </div>
      </div>

      {/* Main content: 3-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Current slide preview */}
        <div className="flex-1 flex flex-col border-r border-gray-700">
          <div className="px-3 py-2 bg-gray-800/50 flex-shrink-0">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Slide actual</p>
          </div>
          <div className="flex-1 overflow-auto p-3">
            <div className="bg-white rounded-xl overflow-hidden shadow-lg h-full">
              {currentSlide && (
                <SlideRenderer
                  slide={currentSlide}
                  courseTitle={lesson.title}
                  isTeacher
                  slideIndex={currentIndex}
                />
              )}
            </div>
          </div>
        </div>

        {/* Center: Notes + Tips */}
        <div className="w-80 flex flex-col border-r border-gray-700">
          <div className="px-3 py-2 bg-gray-800/50 flex-shrink-0">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Notas del profesor</p>
          </div>
          <div className="flex-1 overflow-auto p-3 space-y-3">
            {/* Teacher Notes */}
            {currentSlide?.teacherNotes ? (
              <div className="bg-gray-800 rounded-xl p-3">
                <p className="text-xs font-bold text-[#C8A8DC] mb-1">📝 Notas</p>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {currentSlide.teacherNotes}
                </p>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500">Sin notas para este slide</p>
              </div>
            )}

            {/* Tips */}
            {currentSlide?.tips && (
              <div className="bg-amber-900/30 rounded-xl p-3">
                <p className="text-xs font-bold text-amber-400 mb-1">💡 Tips</p>
                <p className="text-sm text-amber-200/80 leading-relaxed whitespace-pre-wrap">
                  {currentSlide.tips}
                </p>
              </div>
            )}

            {/* Answer key */}
            {currentSlide?.correctAnswer && (
              <div className="bg-green-900/30 rounded-xl p-3">
                <p className="text-xs font-bold text-green-400 mb-1">✅ Respuesta</p>
                <p className="text-sm text-green-200/80">{currentSlide.correctAnswer}</p>
              </div>
            )}

            {/* Student response stats */}
            {currentAnswers && (
              <div className="bg-blue-900/30 rounded-xl p-3">
                <p className="text-xs font-bold text-blue-400 mb-2">📊 Respuestas de estudiantes</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all"
                      style={{ width: `${accuracy}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-white">{accuracy}%</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {currentAnswers.correct}/{currentAnswers.total} correctas
                </p>
              </div>
            )}

            {/* Slide metadata */}
            <div className="bg-gray-800/50 rounded-xl p-3">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Tipo: <span className="text-gray-400 font-medium">{currentSlide?.type}</span></span>
                {currentSlide?.phase && (
                  <span>· Fase: <span className="text-gray-400 font-medium uppercase">{currentSlide.phase}</span></span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Next slide preview */}
        <div className="w-72 flex flex-col">
          <div className="px-3 py-2 bg-gray-800/50 flex-shrink-0">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Próximo slide</p>
          </div>
          <div className="flex-1 overflow-auto p-3">
            {nextSlide ? (
              <div className="bg-white rounded-xl overflow-hidden shadow-lg h-full opacity-80">
                <SlideRenderer
                  slide={nextSlide}
                  courseTitle={lesson.title}
                  isTeacher
                  slideIndex={currentIndex + 1}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-600">
                  <p className="text-3xl mb-2">🏁</p>
                  <p className="text-xs font-medium">Último slide</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Slide thumbnail strip */}
      <div className="flex-shrink-0 bg-gray-800 border-t border-gray-700 px-3 py-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {slides.map((slide, i) => (
            <button
              key={i}
              className={`flex-shrink-0 w-16 h-10 rounded-lg text-[9px] font-bold flex items-center justify-center transition-all ${
                i === currentIndex
                  ? 'bg-[#C8A8DC] text-white ring-2 ring-white scale-105'
                  : i < currentIndex
                    ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
              title={slide.title ?? `Slide ${i + 1}`}
            >
              {i + 1}
              {answers[i] && (
                <span className="ml-0.5 text-[8px]">
                  ({Math.round((answers[i].correct / answers[i].total) * 100)}%)
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
