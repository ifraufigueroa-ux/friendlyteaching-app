// FriendlyTeaching.cl — Slide Editor Page (3-panel layout)
'use client';
import { use, useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, updateDoc, serverTimestamp, type DocumentSnapshot, type DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/store/authStore';
import { useLessonStore } from '@/store/lessonStore';
import SlideList from '@/components/editor/SlideList';
import SlideEditorPanel from '@/components/editor/SlideEditorPanel';
import SlideRenderer from '@/components/classroom/SlideRenderer';
import type { Lesson } from '@/types/firebase';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditLessonPage({ params }: PageProps) {
  const { id: lessonId } = use(params);
  const router = useRouter();
  const { firebaseUser, role, isInitialized } = useAuthStore();
  const {
    lesson,
    currentSlideIndex,
    isDirty,
    isSaving,
    error,
    setLesson,
    setIsSaving,
    setError,
    markSaved,
    updateLessonMeta,
  } = useLessonStore();

  const [loadingLesson, setLoadingLesson] = useState(true);
  const [showMeta, setShowMeta] = useState(false);

  // Auth guard
  useEffect(() => {
    if (isInitialized && !firebaseUser) {
      router.replace('/auth/login');
    }
    if (isInitialized && role === 'student') {
      router.replace('/dashboard');
    }
  }, [isInitialized, firebaseUser, role, router]);

  // Fetch lesson from Firestore
  useEffect(() => {
    if (!lessonId) return;
    setLoadingLesson(true);
    const ref = doc(db, 'lessons', lessonId);
    getDoc(ref)
      .then((snap: DocumentSnapshot<DocumentData>) => {
        if (!snap.exists()) {
          setError('Lección no encontrada');
          return;
        }
        const data = snap.data() as Omit<Lesson, 'id'>;
        setLesson({ id: snap.id, ...data });
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => {
        setLoadingLesson(false);
      });
  }, [lessonId, setLesson, setError]);

  // Save lesson to Firestore
  const handleSave = async () => {
    if (!lesson || isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      const ref = doc(db, 'lessons', lesson.id);
      await updateDoc(ref, {
        title: lesson.title,
        duration: lesson.duration ?? null,
        isPublished: lesson.isPublished ?? false,
        objectives: lesson.objectives ?? [],
        slides: lesson.slides,
        slidesJson: JSON.stringify(lesson.slides),
        canvaMode: lesson.canvaMode ?? false,
        canvaEmbed: lesson.canvaEmbed ?? '',
        presentationUrl: lesson.presentationUrl ?? '',
        updatedAt: serverTimestamp(),
        lastEditedBy: firebaseUser?.uid ?? '',
        teacherId: firebaseUser?.uid ?? '',   // ensure teacherId is always set
        version: (lesson.version ?? 0) + 1,
      });
      markSaved();
    } catch (err) {
      const e = err as Error;
      setError(`Error guardando: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Ctrl+S keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson, isDirty, isSaving]);

  // Auto-save: debounce 3s after last change (with race-condition guard)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastManualSaveRef = useRef<number>(0);
  useEffect(() => {
    if (!isDirty || isSaving) return;
    // Guard: skip autosave if a manual save happened < 2s ago
    const msSinceManual = Date.now() - lastManualSaveRef.current;
    if (msSinceManual < 2000) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      if (!isSaving) handleSave();
    }, 3000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, lesson?.slides, lesson?.title]);

  // Loading states
  if (!isInitialized || loadingLesson) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FFFCF7]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#9B7CB8] text-sm font-medium">Cargando editor...</p>
        </div>
      </div>
    );
  }

  if (error && !lesson) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FFFCF7]">
        <div className="bg-white rounded-2xl p-8 text-center shadow-lg max-w-sm mx-4">
          <div className="text-4xl mb-3">😕</div>
          <h2 className="font-bold text-[#5A3D7A] mb-2">Error al cargar</h2>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <Link
            href="/dashboard/teacher/lessons"
            className="inline-block px-6 py-2.5 bg-[#C8A8DC] text-white rounded-xl text-sm font-semibold hover:bg-[#9B7CB8] transition-colors"
          >
            ← Volver a lecciones
          </Link>
        </div>
      </div>
    );
  }

  const slide = lesson?.slides[currentSlideIndex];

  return (
    <div className="h-screen flex flex-col bg-[#FFFCF7] overflow-hidden">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-100 flex-shrink-0 gap-3">
        {/* Left: back + lesson info */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/dashboard/teacher/lessons"
            className="text-[#9B7CB8] hover:text-[#5A3D7A] text-sm font-semibold flex-shrink-0 transition-colors"
          >
            ← Lecciones
          </Link>
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#5A3D7A] truncate">{lesson?.title ?? '...'}</p>
            <p className="text-[10px] text-gray-400">{lesson?.code} · {lesson?.level} · {lesson?.slides.length} slides</p>
          </div>
          <button
            onClick={() => setShowMeta((v) => !v)}
            className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-500 hover:bg-[#F0E5FF] hover:text-[#5A3D7A] transition-colors flex-shrink-0"
          >
            ⚙️ Meta
          </button>
        </div>

        {/* Right: status + save */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {error && (
            <p className="text-xs text-red-500 font-medium max-w-xs truncate">{error}</p>
          )}
          {isSaving ? (
            <span className="text-xs text-[#9B7CB8] font-semibold animate-pulse">💾 Guardando…</span>
          ) : isDirty ? (
            <span className="text-xs text-amber-500 font-semibold">● Cambios sin guardar · Ctrl+S</span>
          ) : (
            <span className="text-xs text-green-500 font-semibold">✓ Guardado</span>
          )}
          {lesson?.isPublished && (
            <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
              ✓ Publicada
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="px-4 py-1.5 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Guardando...' : '💾 Guardar'}
          </button>
        </div>
      </div>

      {/* ── Meta panel (collapsible) ── */}
      {showMeta && lesson && (
        <div className="bg-[#F9F5FF] border-b border-[#E0D5FF] px-4 py-3 flex flex-wrap gap-4 items-end flex-shrink-0">
          <div>
            <label className="text-[10px] font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1">Título</label>
            <input
              value={lesson.title}
              onChange={(e) => updateLessonMeta({ title: e.target.value })}
              className="text-sm border border-[#C8A8DC] rounded-lg px-3 py-1.5 w-64 focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1">Duración (min)</label>
            <input
              type="number"
              value={lesson.duration ?? ''}
              onChange={(e) => updateLessonMeta({ duration: Number(e.target.value) || undefined })}
              className="text-sm border border-[#C8A8DC] rounded-lg px-3 py-1.5 w-24 focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1">Objetivos (uno por línea)</label>
            <textarea
              value={lesson.objectives?.join('\n') ?? ''}
              onChange={(e) => updateLessonMeta({ objectives: e.target.value.split('\n').filter(Boolean) })}
              rows={2}
              className="text-sm border border-[#C8A8DC] rounded-lg px-3 py-1.5 w-72 resize-none focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={lesson.isPublished ?? false}
              onChange={(e) => updateLessonMeta({ isPublished: e.target.checked })}
              className="w-4 h-4 accent-[#C8A8DC]"
            />
            <span className="text-sm font-semibold text-[#5A3D7A]">Publicada</span>
          </label>

          {/* ── Presentation Mode ── */}
          <div className="w-full border-t border-[#E0D5FF] pt-3 mt-1">
            <p className="text-[10px] font-bold text-[#5A3D7A] uppercase tracking-wider mb-2">📊 Presentación externa</p>
            <div className="flex flex-wrap gap-4 items-start">
              <label className="flex items-center gap-2 cursor-pointer select-none self-center">
                <input
                  type="checkbox"
                  checked={lesson.canvaMode ?? false}
                  onChange={(e) => updateLessonMeta({ canvaMode: e.target.checked })}
                  className="w-4 h-4 accent-[#C8A8DC]"
                />
                <span className="text-sm font-semibold text-[#5A3D7A]">
                  Usar presentación en clase
                </span>
              </label>
              {lesson.canvaMode && (
                <div className="flex flex-col gap-2 flex-1 min-w-[400px]">
                  <div>
                    <label className="text-[10px] font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1">
                      URL de presentación <span className="font-normal normal-case text-gray-400">(Google Slides, Canva, PPT Online)</span>
                    </label>
                    <input
                      value={lesson.presentationUrl ?? ''}
                      onChange={(e) => updateLessonMeta({ presentationUrl: e.target.value })}
                      placeholder="https://docs.google.com/presentation/d/... o https://www.canva.com/..."
                      className="text-sm border border-[#C8A8DC] rounded-lg px-3 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    💡 <strong>Google Slides:</strong> Archivo → Publicar en web → Insertar → copiar URL del src del iframe.&nbsp;
                    <strong>Canva:</strong> Compartir → Presentar e insertar → copiar URL del embed.&nbsp;
                    <strong>OneDrive PPT:</strong> Insertar → Código de inserción → copiar src del iframe.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 3-panel body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Slide list (220px) */}
        <div className="w-[220px] flex-shrink-0 overflow-hidden">
          <SlideList />
        </div>

        {/* CENTER: Preview */}
        <div className="flex-1 overflow-hidden bg-[#FFFCF7] flex flex-col">
          <div className="px-3 py-2 bg-white border-b border-gray-100 flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vista previa</p>
            <span className="text-[10px] text-gray-400">
              Slide {currentSlideIndex + 1} de {lesson?.slides.length ?? 0}
            </span>
          </div>
          <div className="flex-1 overflow-hidden p-4">
            <div className="bg-white rounded-2xl shadow-lg h-full overflow-hidden">
              {slide ? (
                <SlideRenderer slide={slide} isTeacher={true} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <p className="text-4xl mb-2">📭</p>
                    <p className="text-sm">Sin slide seleccionada</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Editor panel (320px) */}
        <div className="w-[320px] flex-shrink-0 overflow-hidden border-l border-gray-100">
          <SlideEditorPanel />
        </div>
      </div>
    </div>
  );
}
