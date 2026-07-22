// FriendlyTeaching.cl — Friendlyflix Teacher Dashboard
// List + create + play movie clip lessons (Phase 2).
'use client';
import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useStudents } from '@/hooks/useStudents';
import {
  useMovieLessons,
  publishMovieLesson,
  assignMovieLesson,
  deleteMovieLesson,
} from '@/hooks/useMovieLessons';
import SlideRenderer from '@/components/classroom/SlideRenderer';
import TopBar from '@/components/layout/TopBar';
import TranscriptClipEditor from '@/components/teacher/TranscriptClipEditor';
import FullscreenButton from '@/components/ui/FullscreenButton';
import type { MovieLesson, LessonLevel } from '@/types/firebase';

const LEVELS: LessonLevel[] = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];

const LEVEL_COLORS: Record<string, string> = {
  A0: 'bg-gray-100 text-gray-600',
  A1: 'bg-blue-100 text-blue-700',
  A2: 'bg-sky-100 text-sky-700',
  B1: 'bg-green-100 text-green-700',
  'B1+': 'bg-emerald-100 text-emerald-700',
  B2: 'bg-amber-100 text-amber-700',
  C1: 'bg-purple-100 text-purple-700',
};

function extractVideoId(url: string): string | null {
  const m = url.match(/(?:v=|\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] ?? null;
}

function ytThumbnail(url: string): string | null {
  const id = extractVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}


// ─── Play modal ─────────────────────────────────────────────────────────

function PlayModal({ lesson, onClose }: { lesson: MovieLesson; onClose: () => void }) {
  const slides = lesson.slides ?? [];
  const [slideIdx, setSlideIdx] = useState(0);
  const slide = slides[slideIdx];
  if (!slide) return null;

  const canPrev = slideIdx > 0;
  const canNext = slideIdx < slides.length - 1;

  const SLIDE_LABEL: Record<string, string> = {
    cover:              'Cover',
    clip_cover:         'Cover',
    vocabulary:         'Vocabulary',
    clip_vocab_match:   'Vocab match',
    predictions:        'Predictions',
    clip_predictions:   'Predictions',
    clip_dialogue_game: 'Listening game',
    clip_comprehension: 'Comprehension',
    language_focus:     'Language focus',
    clip_language_focus:'Language focus',
    language_practice:  'Controlled practice',
    clip_controlled_practice: 'Controlled practice',
    clip_production:    'Free production',
    friendlyflix_end:   'Wrap-up',
  };

  const multi = slides.length > 1;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top nav — sticks above the slide content with an explicit z-index */}
      <div className="relative z-10 flex items-center justify-between gap-3 px-4 py-2 border-b border-white/10 bg-black/95">
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-white/80 text-sm font-semibold truncate">{lesson.title}</div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF6B6B] flex-shrink-0">
            {SLIDE_LABEL[slide.type] ?? slide.type}{multi ? ` · ${slideIdx + 1}/${slides.length}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Only show navigation arrows when there is somewhere to navigate */}
          {multi && (
            <>
              <button
                onClick={() => setSlideIdx(i => Math.max(0, i - 1))}
                disabled={!canPrev}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  canPrev
                    ? 'bg-white/8 hover:bg-white/15 text-white/80 border-white/10 cursor-pointer'
                    : 'bg-white/4 text-white/25 border-white/5 cursor-not-allowed'
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
                    ? 'bg-gradient-to-r from-[#E50914] to-[#FF6B6B] hover:opacity-90 text-white border-[#E50914] cursor-pointer'
                    : 'bg-white/4 text-white/25 border-white/5 cursor-not-allowed'
                }`}
                title="Next slide"
              >
                Next →
              </button>
            </>
          )}
          <FullscreenButton variant="inline" className="!bg-white/10 !border-white/20 !text-white hover:!bg-white/20 hover:!border-white/30" />
          <button onClick={onClose} className="ml-2 text-white/60 hover:text-white text-2xl px-2 leading-none" title="Close">×</button>
        </div>
      </div>
      <div className="flex-1 min-h-0 relative z-0 overflow-y-auto bg-white">
        <SlideRenderer slide={slide} youtubeUrl={lesson.clip?.youtubeUrl} brand="Friendlyflix" />
      </div>
    </div>
  );
}

// ─── Assign modal ───────────────────────────────────────────────────────

function AssignModal({
  lesson,
  students,
  onClose,
}: {
  lesson: MovieLesson;
  students: { uid: string; fullName: string }[];
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(lesson.assignedTo ?? []);
  const [saving, setSaving] = useState(false);

  function toggle(uid: string) {
    setSelected(prev => prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid]);
  }

  async function save() {
    setSaving(true);
    await assignMovieLesson(lesson.id!, selected);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-bold text-[#5A3D7A]">Asignar estudiantes</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
          {students.length === 0 ? (
            <p className="text-xs text-gray-400 italic text-center py-4">Aún no tienes estudiantes aprobados.</p>
          ) : students.map(s => (
            <label key={s.uid} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F0E5FF]/40 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(s.uid)}
                onChange={() => toggle(s.uid)}
                className="accent-[#5A3D7A] w-4 h-4"
              />
              <span className="text-sm text-gray-700">{s.fullName}</span>
            </label>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-full text-sm font-semibold text-gray-500 hover:bg-gray-50">Cancelar</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2 bg-[#5A3D7A] text-white rounded-full text-sm font-bold disabled:opacity-50">
            {saving ? 'Guardando…' : 'Asignar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────

export default function MoviesPage() {
  const { profile } = useAuthStore();
  const teacherId   = profile?.uid ?? '';
  const { lessons, loading } = useMovieLessons(teacherId);
  const { students } = useStudents();

  const [showCreate, setShowCreate]   = useState(false);
  const [editing, setEditing]         = useState<MovieLesson | null>(null);
  const [playing, setPlaying]         = useState<MovieLesson | null>(null);
  const [assigning, setAssigning]     = useState<MovieLesson | null>(null);

  const studentList = useMemo(
    () => students.map(s => ({ uid: s.uid, fullName: s.fullName })),
    [students],
  );

  async function togglePublish(lesson: MovieLesson) {
    await publishMovieLesson(lesson.id!, lesson.publishStatus !== 'published');
  }

  async function handleDelete(lesson: MovieLesson) {
    if (!confirm(`¿Eliminar la clip lesson "${lesson.title}"? No se puede deshacer.`)) return;
    await deleteMovieLesson(lesson.id!);
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <FullscreenButton />
      <TopBar
        title="Friendlyflix — Clip lessons"
        subtitle={`${lessons.length} clip${lessons.length !== 1 ? 's' : ''} guardado${lessons.length !== 1 ? 's' : ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Friendlyflix' },
        ]}
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#E50914] to-[#FF6B6B] text-white rounded-full text-xs font-bold shadow-md hover:shadow-lg flex-shrink-0"
          >
            ＋ Crear clip lesson
          </button>
        }
      />

      <div className="max-w-6xl mx-auto mt-4">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Cargando…</div>
        ) : lessons.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
            <p className="text-5xl mb-3">🎬</p>
            <p className="text-[#5A3D7A] font-bold text-lg mb-1">Aún no hay clip lessons</p>
            <p className="text-gray-400 text-sm mb-5">Crea tu primera con un clip de YouTube y un diálogo.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-[#E50914] to-[#FF6B6B] text-white rounded-full text-sm font-bold shadow"
            >
              ＋ Crear clip lesson
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lessons.map(lesson => {
              const thumb = ytThumbnail(lesson.clip?.youtubeUrl ?? '');
              const numBlanks = lesson.slides?.[0]?.blanksData?.length ?? 0;
              const isPub = lesson.publishStatus === 'published';
              return (
                <div key={lesson.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
                  {/* Thumb */}
                  <button
                    onClick={() => setPlaying(lesson)}
                    className="relative w-full aspect-video bg-black overflow-hidden group"
                  >
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt={lesson.clip?.title ?? ''} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/30">🎬</div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
                      <span className="text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity">▶</span>
                    </div>
                    <span className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full ${isPub ? 'bg-green-500 text-white' : 'bg-white/90 text-gray-600'}`}>
                      {isPub ? 'Publicado' : 'Borrador'}
                    </span>
                  </button>
                  {/* Body */}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-gray-800 text-sm leading-snug line-clamp-2">{lesson.clip?.title ?? lesson.title}</h3>
                      <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${LEVEL_COLORS[lesson.level] ?? 'bg-gray-100 text-gray-500'}`}>
                        {lesson.level}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mb-2">{lesson.clip?.source ?? '—'}</p>
                    <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 mb-3">
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full">📝 {numBlanks} blank{numBlanks !== 1 && 's'}</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full">👥 {lesson.assignedTo?.length ?? 0} asign.</span>
                    </div>
                    <div className="mt-auto flex flex-wrap gap-1.5">
                      <button onClick={() => setPlaying(lesson)} className="flex-1 py-1.5 px-2 bg-[#5A3D7A] hover:bg-[#4A2D6A] text-white rounded-full text-[11px] font-bold">▶ Probar</button>
                      <button onClick={() => setEditing(lesson)} className="py-1.5 px-2.5 border border-gray-200 hover:bg-gray-50 rounded-full text-[11px] font-semibold text-gray-600">✎</button>
                      <button onClick={() => setAssigning(lesson)} className="py-1.5 px-2.5 border border-gray-200 hover:bg-gray-50 rounded-full text-[11px] font-semibold text-gray-600" title="Asignar">👥</button>
                      <button onClick={() => togglePublish(lesson)} className={`py-1.5 px-2.5 rounded-full text-[11px] font-bold ${isPub ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                        {isPub ? 'Despub.' : 'Publicar'}
                      </button>
                      <button onClick={() => handleDelete(lesson)} className="py-1.5 px-2 border border-red-100 text-red-500 hover:bg-red-50 rounded-full text-[11px] font-semibold" title="Eliminar">🗑</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {(showCreate || editing) && (
        <TranscriptClipEditor
          mode="movie"
          teacherId={teacherId}
          initial={editing ?? undefined}
          onClose={() => { setShowCreate(false); setEditing(null); }}
        />
      )}
      {playing && <PlayModal lesson={playing} onClose={() => setPlaying(null)} />}
      {assigning && (
        <AssignModal
          lesson={assigning}
          students={studentList}
          onClose={() => setAssigning(null)}
        />
      )}
    </div>
  );
}
