// FriendlyTeaching.cl — Teacher Lessons Library
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLessons, useCourses, toggleLessonPublished, deleteLesson, duplicateLesson, createLesson, createLessonFromAI } from '@/hooks/useLessons';
import { useAuthStore } from '@/store/authStore';
import { auth } from '@/lib/firebase/config';
import TopBar from '@/components/layout/TopBar';
import CreateFromPresentationModal from '@/components/teacher/CreateFromPresentationModal';
import AILessonWizard from '@/components/editor/AILessonWizard';
import type { AILessonResponse } from '@/app/api/ai-lesson/route';
import type { Lesson, LessonLevel, Slide } from '@/types/firebase';
import { LessonsGridSkeleton } from '@/components/ui/Skeleton';

const LESSON_LEVELS: LessonLevel[] = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];

function NewLessonModal({ teacherId, onClose }: { teacherId: string; onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', code: '', level: 'A1' as LessonLevel });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.code.trim()) {
      setError('Título y código son requeridos.');
      return;
    }
    setSaving(true);
    try {
      const id = await createLesson(teacherId, {
        title: form.title.trim(),
        code: form.code.trim().toUpperCase(),
        level: form.level,
      });
      router.push(`/dashboard/teacher/lessons/${id}/edit`);
    } catch {
      setError('Error al crear la lección. Intenta de nuevo.');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-[#5A3D7A]">📚 Nueva lección</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleCreate} className="p-5 space-y-4">
          {error && <p className="text-red-500 text-xs bg-red-50 p-2 rounded-lg">{error}</p>}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Título *</label>
            <input
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="ej. Greetings & Introductions"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Código *</label>
            <input
              value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
              placeholder="ej. U1.L1"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] uppercase"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nivel</label>
            <select
              value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value as LessonLevel }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] bg-white"
            >
              {LESSON_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">
              {saving ? 'Creando…' : '+ Crear y editar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const LEVEL_COLORS: Record<string, string> = {
  A0: 'bg-teal-100 text-teal-700',
  A1: 'bg-green-100 text-green-700',
  A2: 'bg-emerald-100 text-emerald-700',
  B1: 'bg-yellow-100 text-yellow-700',
  'B1+': 'bg-orange-100 text-orange-700',
  B2: 'bg-red-100 text-red-700',
  C1: 'bg-purple-100 text-purple-700',
};

function LessonCard({ lesson, teacherId, onRefresh }: { lesson: Lesson; teacherId: string; onRefresh: () => void }) {
  const router = useRouter();
  const [toggling, setToggling] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleDuplicate() {
    setDuplicating(true);
    try {
      const newId = await duplicateLesson(lesson.id, teacherId);
      router.push(`/dashboard/teacher/lessons/${newId}/edit`);
    } catch {
      alert('Error al duplicar la lección');
    } finally {
      setDuplicating(false);
    }
  }

  async function handleTogglePublish() {
    setToggling(true);
    try {
      await toggleLessonPublished(lesson.id, !lesson.isPublished);
      onRefresh();
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteLesson(lesson.id);
      onRefresh();
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden">
      {/* Color top bar */}
      <div className={`h-1.5 w-full ${lesson.isPublished ? 'bg-[#A8E6A1]' : 'bg-gray-200'}`} />

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-gray-400 font-mono">{lesson.code}</span>
            <h3 className="font-bold text-gray-800 text-sm leading-snug mt-0.5 truncate" title={lesson.title}>
              {lesson.title}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${LEVEL_COLORS[lesson.level] ?? 'bg-gray-100 text-gray-500'}`}>
              {lesson.level}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-3 text-xs text-gray-400">
          <span>🎞️ {lesson.slides?.length ?? 0} slides</span>
          {lesson.duration && <span>⏱ {lesson.duration}min</span>}
        </div>

        {/* Publish toggle */}
        <button
          onClick={handleTogglePublish}
          disabled={toggling}
          className={`w-full flex items-center justify-center gap-2 py-1.5 rounded-xl text-xs font-semibold mb-2 transition-colors disabled:opacity-50 ${
            lesson.isPublished
              ? 'bg-[#A8E6A1] text-[#2D6E2A] hover:bg-[#8DD67E]'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {toggling ? (
            <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : lesson.isPublished ? (
            <>✅ Publicada — clic para despublicar</>
          ) : (
            <>⬜ No publicada — clic para publicar</>
          )}
        </button>

        <Link
          href={`/classroom/${lesson.id}?preview=student`}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold mb-2 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
        >
          👁 Vista previa del estudiante
        </Link>

        <div className="flex gap-2">
          <Link
            href={`/classroom/${lesson.id}`}
            className="flex-1 text-center py-2 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-xs font-semibold transition-colors"
          >
            ▶ Abrir
          </Link>
          <Link
            href={`/dashboard/teacher/lessons/${lesson.id}/edit`}
            className="flex-1 text-center py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-xs font-semibold transition-colors"
          >
            ✏️ Editar
          </Link>
          <button
            onClick={handleDuplicate}
            disabled={duplicating}
            title="Duplicar lección"
            className="px-3 py-2 border border-[#C8A8DC] text-[#9B7CB8] hover:bg-[#F0E5FF] rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {duplicating ? '…' : '📋'}
          </button>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="px-3 py-2 border border-red-200 text-red-400 hover:bg-red-50 rounded-xl text-xs font-semibold transition-colors"
            >
              🗑
            </button>
          ) : (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-2 bg-red-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
            >
              {deleting ? '…' : '¿Sí?'}
            </button>
          )}
        </div>
        {confirmDelete && (
          <button
            onClick={() => setConfirmDelete(false)}
            className="w-full mt-1 text-xs text-gray-400 hover:text-gray-600 text-center"
          >
            Cancelar eliminación
          </button>
        )}
      </div>
    </div>
  );
}

export default function LessonsLibraryPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  // Use Firebase Auth uid directly — works even if Firestore profile document is missing
  const teacherUid = profile?.uid ?? auth.currentUser?.uid ?? '';
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [showNewLesson, setShowNewLesson] = useState(false);
  const [showFromPresentation, setShowFromPresentation] = useState(false);
  const [showAIWizard, setShowAIWizard] = useState(false);
  // If filtering by course → use course mode; otherwise fetch all teacher's lessons
  const { lessons, loading } = useLessons(
    selectedCourse || (teacherUid ?? undefined),
    selectedCourse ? 'course' : 'teacher'
  );
  const { courses } = useCourses();

  // All levels present in this teacher's lessons (for level filter chips)
  const LEVELS_ORDER = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];
  const presentLevels = LESSON_LEVELS.filter(l => lessons.some((lesson: Lesson) => lesson.level === l));

  const filtered = lessons.filter((l: Lesson) => {
    const matchesSearch = !search ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.code.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'published' && l.isPublished) ||
      (filter === 'draft' && !l.isPublished);
    const matchesLevel = !levelFilter || l.level === levelFilter;
    return matchesSearch && matchesFilter && matchesLevel;
  });

  const published = lessons.filter((l: Lesson) => l.isPublished).length;
  const draft = lessons.length - published;

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Biblioteca de Lecciones"
        subtitle={`${lessons.length} lecciones · ${published} publicadas · ${draft} borradores`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/teacher' },
          { label: 'Lecciones' },
        ]}
      />
      <div className="flex-1 p-6 overflow-auto">
        {/* Filters + New button */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {/* Action buttons — right-aligned on sm+ */}
          <div className="sm:order-last flex gap-2 flex-shrink-0">
            <button
              onClick={() => setShowAIWizard(true)}
              className="px-4 py-2 bg-gradient-to-r from-[#C8A8DC] to-[#9B7CB8] text-white hover:opacity-90 rounded-xl text-sm font-semibold transition-all whitespace-nowrap"
            >
              🤖 Generar con IA
            </button>
            <button
              onClick={() => setShowFromPresentation(true)}
              className="px-4 py-2 bg-white border border-[#5A3D7A] text-[#5A3D7A] hover:bg-purple-50 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap"
            >
              🎨 Desde Canva
            </button>
            <button
              onClick={() => setShowNewLesson(true)}
              className="px-4 py-2 bg-[#5A3D7A] hover:bg-[#4A2D6A] text-white rounded-xl text-sm font-semibold transition-colors whitespace-nowrap"
            >
              + Nueva lección
            </button>
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código o título..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
          />
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] bg-white"
          >
            <option value="">Todos los cursos</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {(['all', 'published', 'draft'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                filter === f ? 'bg-[#5A3D7A] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? `Todas (${lessons.length})` : f === 'published' ? `Publicadas (${published})` : `Borradores (${draft})`}
            </button>
          ))}
        </div>

        {/* Level filter chips (only shown when there are multiple levels) */}
        {presentLevels.length > 1 && (
          <div className="flex gap-1.5 mb-5 flex-wrap">
            <button
              onClick={() => setLevelFilter('')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                !levelFilter ? 'bg-[#C8A8DC] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-[#C8A8DC]'
              }`}
            >
              Todos los niveles
            </button>
            {presentLevels.map(l => (
              <button
                key={l}
                onClick={() => setLevelFilter(levelFilter === l ? '' : l)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  levelFilter === l
                    ? 'bg-[#C8A8DC] text-white'
                    : `${LEVEL_COLORS[l] ?? 'bg-gray-100 text-gray-500'} hover:opacity-100 opacity-75`
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <LessonsGridSkeleton />
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <p className="text-4xl mb-3">📚</p>
            <p className="font-semibold text-gray-700">No hay lecciones {filter !== 'all' ? 'con este filtro' : ''}</p>
            <p className="text-sm text-gray-500 mt-1">Crea una lección nueva o usa la herramienta de importación</p>
            <button
              onClick={() => setShowNewLesson(true)}
              className="mt-4 px-5 py-2.5 bg-[#5A3D7A] hover:bg-[#4A2D6A] text-white rounded-xl text-sm font-semibold transition-colors"
            >
              + Nueva lección
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                teacherId={teacherUid}
                onRefresh={() => {/* real-time via onSnapshot */}}
              />
            ))}
          </div>
        )}
      </div>

      {showNewLesson && (
        <NewLessonModal
          teacherId={teacherUid}
          onClose={() => setShowNewLesson(false)}
        />
      )}

      {showFromPresentation && (
        <CreateFromPresentationModal
          teacherId={teacherUid}
          onClose={() => setShowFromPresentation(false)}
        />
      )}

      {showAIWizard && (
        <AILessonWizard
          onClose={() => setShowAIWizard(false)}
          onImport={async (aiLesson: AILessonResponse) => {
            const lessonId = await createLessonFromAI(teacherUid, {
              title: aiLesson.title,
              code: aiLesson.code,
              level: aiLesson.level,
              duration: aiLesson.duration,
              objectives: aiLesson.objectives,
              slides: aiLesson.slides as unknown as Record<string, unknown>[],
            });
            setShowAIWizard(false);
            router.push(`/dashboard/teacher/editor/${lessonId}`);
          }}
        />
      )}
    </div>
  );
}
