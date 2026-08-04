// FriendlyTeaching.cl — Teacher-side deep-linkable FriendlyTales player
//
// Replaces the in-page PlayModal so lessons have their own URL a teacher
// can copy, paste, and share. Loads the lesson by Firestore doc ID, so
// `/dashboard/teacher/texts/<id>` works without any slug migration.
'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, type DocumentSnapshot, type DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import SlideRenderer from '@/components/classroom/SlideRenderer';
import FullscreenButton from '@/components/ui/FullscreenButton';
import type { TextLesson } from '@/types/firebase';

const SLIDE_LABEL: Record<string, string> = {
  text_cover:         'Cover',
  vocab_match:        'Vocab match',
  predictions:        'Predictions',
  text_comprehension: 'Comprehension',
  text_reading:       'Comprehension',
  listening_quiz:     'Check',
  language_focus:     'Language focus',
  language_practice:  'Practice',
  translation_game:   'Translation',
  wrapup:             'Wrap-up',
  friendlytext_end:   'End',
};

export default function TeacherTextLessonPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<TextLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    getDoc(doc(db, 'textLessons', id))
      .then((snap: DocumentSnapshot<DocumentData>) => {
        if (!alive) return;
        if (snap.exists()) {
          setLesson({ id: snap.id, ...snap.data() } as TextLesson);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => { if (alive) setNotFound(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  function closeToList() {
    router.push('/dashboard/teacher/texts');
  }

  if (loading) {
    return (
      <div className="theme-friendly-tales fixed inset-0 z-50 flex items-center justify-center text-[#A69BB8] text-sm">
        Cargando lección…
      </div>
    );
  }

  if (notFound || !lesson) {
    return (
      <div className="theme-friendly-tales fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 text-center px-6">
        <p className="text-5xl">📖</p>
        <p className="text-[#F8F5FC] font-bold text-lg">Lección no encontrada</p>
        <p className="text-[#A69BB8] text-sm">El link puede estar roto o la lección fue eliminada.</p>
        <button
          onClick={closeToList}
          className="mt-2 px-5 py-2 rounded-full text-sm font-bold bg-white/10 border border-white/20 text-[#F8F5FC] hover:bg-white/20"
        >
          ← Volver al listado
        </button>
      </div>
    );
  }

  const slides = lesson.slides ?? [];
  const slide  = slides[slideIdx];
  const multi  = slides.length > 1;
  const canPrev = slideIdx > 0;
  const canNext = slideIdx < slides.length - 1;

  if (!slide) {
    return (
      <div className="theme-friendly-tales fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 text-center px-6">
        <p className="text-5xl">🚧</p>
        <p className="text-[#F8F5FC] font-bold text-lg">Esta lección no tiene slides</p>
        <button
          onClick={closeToList}
          className="mt-2 px-5 py-2 rounded-full text-sm font-bold bg-white/10 border border-white/20 text-[#F8F5FC] hover:bg-white/20"
        >
          ← Volver al listado
        </button>
      </div>
    );
  }

  return (
    <div className="theme-friendly-tales fixed inset-0 z-50 flex flex-col">
      <div className="relative z-10 flex items-center justify-between gap-3 px-4 py-2 border-b border-[#9B72B8]/20 bg-[rgba(15,10,28,0.95)] backdrop-blur">
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-[#F8F5FC] text-sm font-semibold truncate">{lesson.title}</div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#F9F0A8] flex-shrink-0">
            {SLIDE_LABEL[slide.type] ?? slide.type}{multi ? ` · ${slideIdx + 1}/${slides.length}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {multi && (
            <>
              <button
                onClick={() => setSlideIdx(i => Math.max(0, i - 1))}
                disabled={!canPrev}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  canPrev
                    ? 'bg-white/10 hover:bg-white/20 text-[#F8F5FC] border-white/10 cursor-pointer'
                    : 'bg-white/5 text-white/25 border-white/5 cursor-not-allowed'
                }`}
                title="Previous slide"
              >
                ← Prev
              </button>
              <button
                onClick={() => setSlideIdx(i => Math.min(slides.length - 1, i + 1))}
                disabled={!canNext}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  canNext
                    ? 'bg-gradient-to-r from-[#EC008C] to-[#A70066] hover:opacity-90 text-white border-[#EC008C]/60 cursor-pointer shadow-[0_0_16px_rgba(236,0,140,0.35)]'
                    : 'bg-white/5 text-white/25 border-white/5 cursor-not-allowed'
                }`}
                title="Next slide"
              >
                Next →
              </button>
            </>
          )}
          <FullscreenButton variant="inline" className="!bg-white/10 !border-white/20 !text-[#F8F5FC] hover:!bg-white/20 hover:!border-white/30" />
          <button
            onClick={closeToList}
            className="ml-2 text-white/60 hover:text-white text-2xl px-2 leading-none"
            title="Close"
          >
            ×
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 relative z-0 overflow-y-auto">
        <SlideRenderer slide={slide} youtubeUrl={lesson.text?.youtubeUrl} brand="FriendlyTales" />
      </div>
    </div>
  );
}
