// FriendlyTeaching.cl — SlideViewer
'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { Lesson, Course, Slide } from '@/types/firebase';
import SlideRenderer from './SlideRenderer';
import SlideErrorBoundary from './SlideErrorBoundary';
import PhaseIndicator from './PhaseIndicator';
import PresentationProjector from './PresentationProjector';
import LiveSessionPanel       from './LiveSessionPanel';
import WhiteboardPanel        from './WhiteboardPanel';
import TeacherNotesPanel      from './TeacherNotesPanel';
import { useAuthStore }       from '@/store/authStore';
import { updateProgress }     from '@/hooks/useProgress';
import { useTeacherLiveSession } from '@/hooks/useLiveSession';
import { useGamification }    from '@/hooks/useGamification';
import BadgeUnlockToast       from '@/components/gamification/BadgeUnlockToast';
import LivePollTeacher        from './LivePollTeacher';
import LivePollStudent        from './LivePollStudent';
import LiveChatTeacher        from './LiveChatTeacher';
import LiveChatStudent        from './LiveChatStudent';
import SyncStatusIndicator    from './SyncStatusIndicator';
import { sendPresenterMessage } from '@/lib/utils/presenterChannel';

/** Compute a 1–7 score from the student's interactive answers.
 *  Returns null when there are no scoreable slides (mc / true_false). */
function calculateObjectiveScore(slides: Slide[], answers: Record<number, boolean>): number | null {
  const scoreable = slides.reduce<number[]>((acc, s, i) => {
    if (s.type === 'multiple_choice' || s.type === 'true_false') acc.push(i);
    return acc;
  }, []);
  if (scoreable.length === 0) return null;
  const answered = scoreable.filter((i) => i in answers);
  if (answered.length === 0) return null;
  const correct = answered.filter((i) => answers[i]).length;
  return Math.max(1, Math.round(1 + (correct / answered.length) * 6));
}

interface Props {
  lesson: Lesson;
  course?: Course | null;
  progressId?: string | null;
  initialSlideIndex?: number;
  previewAsStudent?: boolean;
  onComplete?: (score?: number) => void;
}

const SCORE_LABELS: Record<number, string> = {
  1: 'Muy difícil', 2: 'Difícil', 3: 'Algo difícil',
  4: 'Regular', 5: 'Bastante bien', 6: 'Bien', 7: 'Muy bien',
};

export default function SlideViewer({ lesson, course, progressId, initialSlideIndex, previewAsStudent, onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [slideAnswers, setSlideAnswers] = useState<Record<number, boolean>>({});
  // Presentation mode: show external presentation (Canva / Google Slides / PPTX) instead of slides
  const effectivePresentationUrl = lesson.presentationUrl || lesson.canvaEmbed || '';
  const hasPresentationUrl = Boolean(effectivePresentationUrl);
  const [showPresentation, setShowPresentation] = useState(Boolean(lesson.canvaMode && hasPresentationUrl));
  const { role, firebaseUser, profile } = useAuthStore();
  const studentUid = role === 'student' ? firebaseUser?.uid : undefined;
  const { recordLessonComplete, newBadges, dismissBadges } = useGamification(studentUid);
  const [xpAwarded, setXpAwarded] = useState(false);

  const handleAnswer = useCallback((idx: number, isCorrect: boolean) => {
    setSlideAnswers((prev) => (idx in prev ? prev : { ...prev, [idx]: isCorrect }));
  }, []);

  const slides = lesson.slides ?? [];
  const slide = slides[currentIndex];
  const isTeacher = role === 'teacher' && !previewAsStudent;
  const isLastSlide = currentIndex === slides.length - 1;

  // ── Presenter View (teacher only) ────────────────────────────
  const [presenterOpen, setPresenterOpen] = useState(false);

  // Sync slide changes to presenter window via BroadcastChannel
  useEffect(() => {
    if (!isTeacher || !presenterOpen) return;
    sendPresenterMessage({
      type: 'SLIDE_CHANGE',
      slideIndex: currentIndex,
      totalSlides: slides.length,
      lessonId: lesson.id,
    });
  }, [currentIndex, isTeacher, presenterOpen, slides.length, lesson.id]);

  // Also forward answer events to presenter
  const handleAnswerWithPresenter = useCallback((idx: number, isCorrect: boolean) => {
    setSlideAnswers((prev) => (idx in prev ? prev : { ...prev, [idx]: isCorrect }));
    if (presenterOpen) {
      sendPresenterMessage({ type: 'ANSWER_UPDATE', slideIndex: idx, isCorrect });
    }
  }, [presenterOpen]);

  function openPresenterView() {
    const url = `/classroom/${lesson.id}/presenter`;
    window.open(url, 'ft-presenter', 'width=1200,height=800');
    setPresenterOpen(true);
    sendPresenterMessage({
      type: 'SESSION_START',
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      totalSlides: slides.length,
    });
  }

  // ── Live Polls + Chat ──────────────────────────────────────
  const [showPollPanel, setShowPollPanel] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);

  // ── Whiteboard (teacher only) ────────────────────────────────
  const [showWhiteboard, setShowWhiteboard] = useState(false);

  // ── Live session (teacher only) ─────────────────────────────
  const [showLivePanel, setShowLivePanel] = useState(false);
  const { session: liveSession, isLive, syncCanvas, syncStatus } =
    useTeacherLiveSession(isTeacher ? lesson.id : '');

  // Track the highest slide index visited (for resume support)
  const maxVisitedRef = useRef(currentIndex);
  // Ensure we only jump to the resume slide once
  const resumeApplied = useRef(false);

  // Jump to the last visited slide when resuming a lesson
  useEffect(() => {
    if (!resumeApplied.current && initialSlideIndex && initialSlideIndex > 0) {
      setCurrentIndex(initialSlideIndex);
      maxVisitedRef.current = initialSlideIndex;
      resumeApplied.current = true;
    }
  }, [initialSlideIndex]);

  // Save slide progress to Firestore when student advances (debounced)
  useEffect(() => {
    if (!progressId || isTeacher) return;
    if (currentIndex > maxVisitedRef.current) {
      maxVisitedRef.current = currentIndex;
    }
    const timer = setTimeout(() => {
      const maxVisited = maxVisitedRef.current;
      updateProgress(progressId, {
        slideProgress: Array.from({ length: maxVisited + 1 }, (_, i) => ({
          slideIndex: i,
          // A slide is "completed" once the student has moved past it,
          // OR if it's the current slide being viewed (they've at least seen it)
          completed: i <= maxVisited,
        })),
      }).catch(() => {/* non-critical */});
    }, 1500);
    return () => clearTimeout(timer);
  }, [progressId, currentIndex, isTeacher]);

  const prev = useCallback(() => setCurrentIndex((i) => Math.max(0, i - 1)), []);
  const next = useCallback(() => {
    if (isLastSlide) {
      setShowComplete(true);
    } else {
      setCurrentIndex((i) => Math.min(slides.length - 1, i + 1));
    }
  }, [isLastSlide, slides.length]);

  function handleFinish() {
    // Award gamification XP on lesson completion (once)
    if (!xpAwarded && studentUid) {
      setXpAwarded(true);
      recordLessonComplete().catch(() => {/* non-critical */});
    }
    onComplete?.(selectedScore ?? undefined);
  }

  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <p className="text-5xl mb-3">📭</p>
          <p className="font-medium">Esta lección no tiene slides.</p>
        </div>
      </div>
    );
  }

  // ── Completion screen ──────────────────────────────────────
  if (showComplete && !isTeacher) {
    const objScore = calculateObjectiveScore(slides, slideAnswers);
    // Pre-fill selected score with objective score on first render of completion screen
    if (objScore !== null && selectedScore === null) {
      setSelectedScore(objScore);
    }

    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-[#5A3D7A] to-[#8B5CF6] text-white p-6">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-extrabold mb-1 text-center">¡Lección completada!</h2>
        <p className="text-white/70 text-sm mb-6 text-center">
          {lesson.code} · {lesson.title}
        </p>

        {objScore !== null && (
          <div className="bg-white/10 rounded-2xl px-5 py-3 w-full max-w-sm mb-3 flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <p className="text-xs text-white/70">Puntaje objetivo</p>
              <p className="text-lg font-extrabold">{objScore}/7 <span className="text-sm font-normal text-white/70">— {SCORE_LABELS[objScore]}</span></p>
            </div>
          </div>
        )}

        <div className="bg-white/10 rounded-2xl p-5 w-full max-w-sm mb-6">
          <p className="text-sm font-semibold text-white/80 mb-3 text-center">
            {objScore !== null ? 'Ajustar puntaje si quieres' : '¿Cómo te fue? (escala 1–7)'}
          </p>
          <div className="grid grid-cols-7 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <button
                key={n}
                onClick={() => setSelectedScore(n)}
                className={`aspect-square flex items-center justify-center rounded-xl text-sm font-bold transition-all ${
                  selectedScore === n
                    ? 'bg-white text-[#5A3D7A] scale-110 shadow-lg'
                    : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {selectedScore && (
            <p className="text-center text-xs text-white/70 mt-2">{SCORE_LABELS[selectedScore]}</p>
          )}
        </div>

        <div className="flex flex-col gap-3 w-full max-w-sm">
          <button
            onClick={handleFinish}
            className="w-full py-3 bg-white text-[#5A3D7A] rounded-2xl font-bold text-sm hover:bg-white/90 transition-colors"
          >
            {selectedScore ? `Terminar — Puntaje: ${selectedScore}/7` : 'Terminar sin puntaje'}
          </button>
          <button
            onClick={() => setShowComplete(false)}
            className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-sm font-semibold transition-colors"
          >
            ← Volver a repasar
          </button>
        </div>

        <div className="mt-6 flex items-center gap-2 text-white/50 text-xs">
          <span>🎞️ {slides.length} slides</span>
          {lesson.duration && <span>· ⏱ {lesson.duration} min</span>}
        </div>

        {/* Badge unlock toast */}
        <BadgeUnlockToast badgeIds={newBadges} onDismiss={dismissBadges} />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full outline-none"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prev();
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') next();
        if (e.key === 'Escape' && showComplete) setShowComplete(false);
      }}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-bold text-[#5A3D7A] leading-tight">{lesson.title}</p>
            <p className="text-xs text-gray-400">
              {course?.title && `${course.title} · `}{lesson.code}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!showPresentation && <PhaseIndicator phase={slide?.phase} />}
          {isTeacher && !showPresentation && (
            <button
              onClick={() => setShowNotes((v) => !v)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${showNotes ? 'bg-[#FFF5C8] text-[#7A5E00]' : 'bg-gray-100 text-gray-500 hover:bg-[#FFF5C8]'}`}
            >
              🎓 {showNotes ? 'Cerrar notas' : 'Notas'}
            </button>
          )}
          {isTeacher && (
            <button
              onClick={() => setShowWhiteboard((v) => !v)}
              title="Abrir / cerrar pizarra"
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${showWhiteboard ? 'bg-[#C8A8DC] text-white' : 'bg-gray-100 text-gray-500 hover:bg-[#F0E5FF] hover:text-[#5A3D7A]'}`}
            >
              🖊️ Pizarra
            </button>
          )}
          {isTeacher && (
            <button
              onClick={openPresenterView}
              title="Abrir vista de presentador en otra ventana"
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${presenterOpen ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-[#F0E5FF] hover:text-[#5A3D7A]'}`}
            >
              🖥️ Presentador
            </button>
          )}
          {isTeacher && isLive && (
            <button
              onClick={() => setShowPollPanel((v) => !v)}
              title="Encuestas en vivo"
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${showPollPanel ? 'bg-[#C8A8DC] text-white' : 'bg-gray-100 text-gray-500 hover:bg-[#F0E5FF] hover:text-[#5A3D7A]'}`}
            >
              📊 Encuestas
            </button>
          )}
          {isTeacher && isLive && (
            <button
              onClick={() => setShowChatPanel((v) => !v)}
              title="Chat de clase en vivo"
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${showChatPanel ? 'bg-[#C8A8DC] text-white' : 'bg-gray-100 text-gray-500 hover:bg-[#F0E5FF] hover:text-[#5A3D7A]'}`}
            >
              💬 Chat
            </button>
          )}
          {isTeacher && isLive && (
            <SyncStatusIndicator status={syncStatus} compact />
          )}
          {!showPresentation && (
            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
              {currentIndex + 1} / {slides.length}
            </span>
          )}
        </div>
      </div>

      {/* ── PRESENTATION MODE: branded projector with annotation tools ── */}
      {showPresentation && (
        <div className="flex-1 overflow-hidden relative">
          <PresentationProjector
            src={effectivePresentationUrl}
            title={lesson.title}
            isTeacher={isTeacher}
            onFinish={!isTeacher ? () => setShowComplete(true) : undefined}
            /* Live session wiring */
            isLive={isLive}
            onOpenLivePanel={isTeacher ? () => setShowLivePanel((v) => !v) : undefined}
            onCanvasChange={isTeacher && isLive ? syncCanvas : undefined}
          />
          {/* Live session panel (teacher) */}
          {isTeacher && showLivePanel && (
            <LiveSessionPanel
              lessonId={lesson.id}
              lessonTitle={lesson.title}
              presentationUrl={effectivePresentationUrl}
              onClose={() => setShowLivePanel(false)}
            />
          )}
        </div>
      )}

      {/* ── SLIDES MODE ── */}
      {!showPresentation && (
        <>
          <div className="flex flex-1 overflow-hidden">
            {/* Slide Content */}
            <div className="flex-1 overflow-hidden relative bg-[#FFFCF7]">
              {slide && (
                <SlideErrorBoundary
                  slideIndex={currentIndex}
                  slideType={slide.type}
                  onRetry={!isLastSlide ? next : undefined}
                >
                  <SlideRenderer
                    slide={slide}
                    courseTitle={course?.title}
                    isTeacher={isTeacher}
                    slideIndex={currentIndex}
                    onAnswer={isTeacher ? undefined : handleAnswer}
                  />
                </SlideErrorBoundary>
              )}
            </div>

            {/* Teacher Notes Side Panel */}
            {isTeacher && showNotes && slide && (
              <TeacherNotesPanel
                slide={slide}
                slideIndex={currentIndex}
                totalSlides={slides.length}
                onClose={() => setShowNotes(false)}
              />
            )}

            {/* Live Poll Panel (teacher) */}
            {isTeacher && showPollPanel && isLive && (
              <LivePollTeacher
                sessionId={lesson.id}
                teacherId={firebaseUser?.uid ?? ''}
                onClose={() => setShowPollPanel(false)}
              />
            )}

            {/* Live Chat Panel (teacher) */}
            {isTeacher && showChatPanel && isLive && (
              <LiveChatTeacher
                sessionId={lesson.id}
                teacherId={firebaseUser?.uid ?? ''}
                teacherName={profile?.fullName ?? 'Profesor'}
                onClose={() => setShowChatPanel(false)}
              />
            )}
          </div>

          {/* Live Poll Widget (student, floating) */}
          {!isTeacher && studentUid && (
            <LivePollStudent sessionId={lesson.id} studentUid={studentUid} />
          )}

          {/* Live Chat Widget (student, floating) */}
          {!isTeacher && studentUid && (
            <LiveChatStudent
              sessionId={lesson.id}
              studentUid={studentUid}
              studentName={profile?.fullName ?? 'Estudiante'}
            />
          )}

          {/* Bottom navigation */}
          <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-100 flex-shrink-0">
            {/* Progress bar */}
            <div className="hidden sm:flex items-center gap-1 flex-1 max-w-xs">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    i === currentIndex ? 'bg-[#C8A8DC]' :
                    i <= maxVisitedRef.current ? 'bg-[#E0D5FF]' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <button
                onClick={prev}
                disabled={currentIndex === 0}
                className="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-gray-200 text-gray-500 hover:border-[#C8A8DC] hover:text-[#5A3D7A] disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-lg"
              >
                ‹
              </button>
              <button
                onClick={next}
                disabled={isTeacher && currentIndex === slides.length - 1}
                className={`w-10 h-10 flex items-center justify-center rounded-xl text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-sm ${
                  isLastSlide && !isTeacher
                    ? 'bg-[#A8E6A1] hover:bg-[#8DD67E] text-[#2D6E2A] w-auto px-4 text-sm'
                    : 'bg-[#C8A8DC] hover:bg-[#9B7CB8]'
                }`}
              >
                {isLastSlide && !isTeacher ? '✓ Terminar' : '›'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Whiteboard — teacher only, floating panel over entire classroom */}
      {isTeacher && showWhiteboard && (
        <WhiteboardPanel onClose={() => setShowWhiteboard(false)} />
      )}
    </div>
  );
}
