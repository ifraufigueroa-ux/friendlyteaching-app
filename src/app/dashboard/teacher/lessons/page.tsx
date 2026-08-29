// FriendlyTeaching.cl — Teacher Lessons Library
'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLessons, useCourses, toggleLessonPublished, deleteLesson, duplicateLesson, createLesson, createLessonFromAI, createCourse, updateCourse, uploadCourseCover, deleteCourse, reorderCourses } from '@/hooks/useLessons';
import { useAuthStore } from '@/store/authStore';
import { auth } from '@/lib/firebase/config';
import TopBar from '@/components/layout/TopBar';
import CreateFromPresentationModal from '@/components/teacher/CreateFromPresentationModal';
import UploadHtmlLessonModal from '@/components/teacher/UploadHtmlLessonModal';
import AILessonWizard from '@/components/editor/AILessonWizard';
import type { AILessonResponse } from '@/app/api/ai-lesson/route';
import type { Lesson, LessonLevel, Slide, Course } from '@/types/firebase';
import { LessonsGridSkeleton } from '@/components/ui/Skeleton';

const LESSON_LEVELS: LessonLevel[] = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];

function NewCourseModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ title: '', level: 'A1' as LessonLevel, icon: '', description: '' });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError('El nombre del curso es requerido.'); return; }
    setSaving(true);
    try {
      const courseId = await createCourse({
        title: form.title.trim(),
        level: form.level,
        icon: form.icon.trim() || undefined,
        description: form.description.trim() || undefined,
      });
      if (coverFile) {
        const url = await uploadCourseCover(courseId, coverFile);
        await updateCourse(courseId, { coverImage: url });
      }
      onClose();
    } catch {
      setError('Error al crear el curso. Intenta de nuevo.');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-[#5A3D7A]">📁 Nuevo curso</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleCreate} className="p-5 space-y-4">
          {error && <p className="text-red-500 text-xs bg-red-50 p-2 rounded-lg">{error}</p>}

          {/* Cover image */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Imagen de portada</label>
            <label className="block cursor-pointer">
              <div className={`w-full h-32 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors ${coverPreview ? 'border-transparent' : 'border-gray-200 hover:border-[#C8A8DC]'}`}>
                {coverPreview
                  ? <img src={coverPreview} alt="cover" className="w-full h-full object-cover rounded-xl" />
                  : <div className="text-center text-gray-400 text-xs"><p className="text-2xl mb-1">🖼️</p><p>Subir imagen</p></div>
                }
              </div>
              <input type="file" accept="image/*" onChange={handleCoverChange} className="sr-only" />
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre del curso *</label>
            <input
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="ej. Inglés Básico A1"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
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
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Ícono (emoji opcional)</label>
            <input
              value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
              placeholder="ej. 🌟"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción (opcional)</label>
            <textarea
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="ej. Curso introductorio para principiantes absolutos"
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] resize-none"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-[#5A3D7A] hover:bg-[#4A2D6A] text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">
              {saving ? 'Creando…' : '📁 Crear curso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
          <h2 className="font-bold text-[#5A3D7A]">📚 Nuevo contenido en blanco</h2>
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

// Metadata visual por tipo de fuente. Docs viejos sin source caen en
// 'manual' por default (asumimos que se hicieron con el editor interno).
const SOURCE_META: Record<string, { icon: string; label: string; badgeClass: string }> = {
  manual:         { icon: '✏️',  label: 'Manual (editor interno)',    badgeClass: 'bg-gray-100 text-gray-600' },
  'ai-generated': { icon: '🤖',  label: 'Generada con IA',            badgeClass: 'bg-violet-100 text-violet-700' },
  canva:          { icon: '🎨',  label: 'Presentación externa (Canva/Slides/PPTX)', badgeClass: 'bg-purple-100 text-purple-700' },
  html:           { icon: '📄',  label: 'HTML inline',                 badgeClass: 'bg-blue-100 text-blue-700' },
  'html-hosted':  { icon: '📄',  label: 'HTML hospedado (Storage)',    badgeClass: 'bg-blue-100 text-blue-700' },
};

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
            {(() => {
              const source = lesson.source ?? 'manual';
              const meta = SOURCE_META[source];
              return (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${meta.badgeClass}`} title={meta.label}>
                  {meta.icon}
                </span>
              );
            })()}
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
            ▶ Proyectar
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

function CourseCard({ course, isSelected, isDragging, onClick, onCoverChange, onDelete,
  onDragStart, onDragOver, onDragEnd }: {
  course: Course;
  isSelected: boolean;
  isDragging: boolean;
  onClick: () => void;
  onCoverChange: (file: File) => Promise<void>;
  onDelete: () => Promise<void>;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { await onCoverChange(file); } finally { setUploading(false); e.target.value = ''; }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try { await onDelete(); } finally { setDeleting(false); setConfirmDelete(false); }
  }

  const bg = course.coverImage ? `url("${course.coverImage}")` : undefined;
  const levelColors: Record<string, string> = {
    A0: '#14b8a6', A1: '#22c55e', A2: '#10b981',
    B1: '#eab308', 'B1+': '#f97316', B2: '#ef4444', C1: '#a855f7',
  };
  const accent = levelColors[course.level] ?? '#C8A8DC';

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-200 aspect-[4/3] flex flex-col justify-end cursor-pointer select-none
        ${isSelected ? 'ring-4 ring-[#C8A8DC] shadow-xl scale-[1.02]' : ''}
        ${isDragging ? 'opacity-40 scale-95' : ''}
      `}
    >
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
        style={bg ? { backgroundImage: bg } : { background: `linear-gradient(135deg, ${accent}33, ${accent}88)` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      {/* Drag handle — top center, shows on hover */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5">
          <svg width="20" height="8" viewBox="0 0 20 8" fill="white" opacity="0.8">
            <circle cx="4" cy="2" r="1.5"/><circle cx="10" cy="2" r="1.5"/><circle cx="16" cy="2" r="1.5"/>
            <circle cx="4" cy="6" r="1.5"/><circle cx="10" cy="6" r="1.5"/><circle cx="16" cy="6" r="1.5"/>
          </svg>
        </div>
      </div>

      {/* Delete button — top-left */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className={`absolute top-2 left-2 z-20 transition-all opacity-0 group-hover:opacity-100 rounded-full text-[10px] font-bold px-2 py-1 backdrop-blur-sm disabled:opacity-50
          ${confirmDelete ? 'bg-red-500 text-white opacity-100' : 'bg-black/40 text-white hover:bg-red-500'}`}
      >
        {deleting ? '…' : confirmDelete ? '¿Eliminar?' : '🗑'}
      </button>
      {confirmDelete && !deleting && (
        <button
          onClick={e => { e.stopPropagation(); setConfirmDelete(false); }}
          className="absolute top-2 left-20 z-20 bg-black/40 text-white text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm opacity-100"
        >
          Cancelar
        </button>
      )}

      {/* Upload cover — top-right */}
      <label
        className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-black/40 backdrop-blur-sm text-white rounded-full p-1.5 hover:bg-black/70 transition-colors">
          {uploading
            ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin block" />
            : <span className="text-xs">🖼️</span>
          }
        </div>
        <input type="file" accept="image/*" onChange={handleFile} className="sr-only" disabled={uploading} />
      </label>

      {/* Info */}
      <div className="relative z-10 p-3">
        <div className="flex items-end justify-between gap-1">
          <div className="min-w-0">
            {course.icon && <p className="text-xl mb-0.5">{course.icon}</p>}
            <h3 className="font-bold text-white text-xs leading-snug line-clamp-2">{course.title}</h3>
          </div>
          <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: accent }}>
            {course.level}
          </span>
        </div>
        <p className="text-white/50 text-[10px] mt-1">
          {course.lessonCount ?? 0} lección{(course.lessonCount ?? 0) !== 1 ? 'es' : ''}
        </p>
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
  const lessonsRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [showNewLesson, setShowNewLesson] = useState(false);
  const [showFromPresentation, setShowFromPresentation] = useState(false);
  const [showUploadHtml, setShowUploadHtml] = useState(false);
  const [showAIWizard, setShowAIWizard] = useState(false);
  // If filtering by course → use course mode; otherwise fetch all teacher's lessons
  const { lessons, loading } = useLessons(
    selectedCourse || (teacherUid ?? undefined),
    selectedCourse ? 'course' : 'teacher'
  );
  // Always fetch all lessons for global cross-course search
  const { lessons: allLessons } = useLessons(teacherUid ?? undefined, 'teacher');
  const { courses } = useCourses();

  // Drag-to-reorder state (must come after useCourses)
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  useEffect(() => {
    if (!draggingId) setOrderedIds(courses.map(c => c.id));
  }, [courses, draggingId]);
  const displayCourses = orderedIds.map(id => courses.find(c => c.id === id)).filter(Boolean) as Course[];

  // All levels present in this teacher's lessons (for level filter chips)
  const LEVELS_ORDER = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];
  const presentLevels = LESSON_LEVELS.filter(l => lessons.some((lesson: Lesson) => lesson.level === l));

  const filtered = lessons.filter((l: Lesson) => {
    if (!l.slides || l.slides.length === 0) return false;
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

  const lessonsWithSlides = lessons.filter((l: Lesson) => l.slides && l.slides.length > 0);
  const published = lessonsWithSlides.filter((l: Lesson) => l.isPublished).length;
  const draft = lessonsWithSlides.length - published;

  const globalFiltered = globalSearch.trim()
    ? allLessons.filter((l: Lesson) => {
        if (!l.slides || l.slides.length === 0) return false;
        const q = globalSearch.toLowerCase();
        return l.title.toLowerCase().includes(q) || l.code.toLowerCase().includes(q);
      })
    : [];

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Librería"
        subtitle={`${lessons.length} items · ${published} publicados · ${draft} borradores`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/teacher' },
          { label: 'Librería' },
        ]}
      />
      <div className="flex-1 p-6 overflow-auto">

        {/* ── Global search bar ────────────────────────────────── */}
        <div className="relative mb-6">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔍</span>
          <input
            type="search"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Buscar en toda la biblioteca..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] bg-white shadow-sm"
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
            >×</button>
          )}
        </div>

        {/* ── Global search results ────────────────────────────── */}
        {globalSearch.trim() && (
          <div className="mb-8">
            <p className="text-sm font-semibold text-gray-500 mb-3">
              {globalFiltered.length === 0
                ? 'Sin resultados'
                : `${globalFiltered.length} resultado${globalFiltered.length !== 1 ? 's' : ''} para "${globalSearch}"`}
            </p>
            {globalFiltered.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {globalFiltered.map((lesson) => {
                  const course = courses.find(c => c.id === lesson.courseId);
                  return (
                    <div key={lesson.id} className="relative">
                      {course && (
                        <span className="absolute -top-2 left-3 z-10 text-[10px] font-bold px-2 py-0.5 rounded-full text-white bg-[#5A3D7A] shadow-sm">
                          {course.icon} {course.title}
                        </span>
                      )}
                      <LessonCard
                        lesson={lesson}
                        teacherId={teacherUid}
                        onRefresh={() => {}}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Course mosaic (hidden while searching) ───────────── */}
        {!globalSearch.trim() && courses.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-gray-700 text-sm">📁 Cursos</p>
              <button
                onClick={() => setShowNewCourse(true)}
                className="text-xs text-[#9B7CB8] font-semibold hover:underline"
              >
                + Nuevo curso
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {displayCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  isSelected={selectedCourse === course.id}
                  isDragging={draggingId === course.id}
                  onClick={() => {
                    if (draggingId) return;
                    const next = selectedCourse === course.id ? '' : course.id;
                    setSelectedCourse(next);
                    if (next) setTimeout(() => lessonsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                  }}
                  onCoverChange={async (file) => {
                    const url = await uploadCourseCover(course.id, file);
                    await updateCourse(course.id, { coverImage: url });
                  }}
                  onDelete={async () => {
                    if (selectedCourse === course.id) setSelectedCourse('');
                    await deleteCourse(course.id);
                  }}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    setDraggingId(course.id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!draggingId || draggingId === course.id) return;
                    setOrderedIds(prev => {
                      const arr = [...prev];
                      const from = arr.indexOf(draggingId);
                      const to = arr.indexOf(course.id);
                      if (from === -1 || to === -1) return prev;
                      arr.splice(from, 1);
                      arr.splice(to, 0, draggingId);
                      return arr;
                    });
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    reorderCourses(orderedIds);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Lessons section (only visible when a course is selected and not searching) ── */}
        {!globalSearch.trim() && selectedCourse && (<div key={selectedCourse} className="animate-slide-in">

        <div ref={lessonsRef} className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <p className="font-bold text-gray-700 text-sm">📚 Contenido</p>
            {(() => {
              const c = courses.find(x => x.id === selectedCourse);
              return c ? (
                <span className="flex items-center gap-1 bg-[#F0E5FF] text-[#5A3D7A] text-xs font-semibold px-2 py-0.5 rounded-full">
                  {c.icon} {c.title}
                  <button onClick={() => setSelectedCourse('')} className="ml-0.5 text-[#9B7CB8] hover:text-[#5A3D7A]">×</button>
                </span>
              ) : null;
            })()}
          </div>
        </div>

        {/* Filters + New button */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {/* Action buttons — right-aligned on sm+ */}
          <div className="sm:order-last flex gap-2 flex-shrink-0">
            <button
              onClick={() => setShowNewCourse(true)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap"
            >
              📁 Crear curso
            </button>
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
              onClick={() => setShowUploadHtml(true)}
              className="px-4 py-2 bg-white border border-[#5A3D7A] text-[#5A3D7A] hover:bg-purple-50 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap"
            >
              📄 Desde HTML
            </button>
            <button
              onClick={() => setShowNewLesson(true)}
              className="px-4 py-2 bg-[#5A3D7A] hover:bg-[#4A2D6A] text-white rounded-xl text-sm font-semibold transition-colors whitespace-nowrap"
            >
              + Contenido en blanco
            </button>
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código o título..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC]"
          />
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
            <p className="font-semibold text-gray-700">No hay contenido {filter !== 'all' ? 'con este filtro' : 'todavía'}</p>
            <p className="text-sm text-gray-500 mt-1">Crea una lección nueva o usa la herramienta de importación</p>
            <button
              onClick={() => setShowNewLesson(true)}
              className="mt-4 px-5 py-2.5 bg-[#5A3D7A] hover:bg-[#4A2D6A] text-white rounded-xl text-sm font-semibold transition-colors"
            >
              + Contenido en blanco
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

        </div>)}
      </div>

      {showNewCourse && (
        <NewCourseModal onClose={() => setShowNewCourse(false)} />
      )}

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

      {showUploadHtml && (
        <UploadHtmlLessonModal
          teacherId={teacherUid}
          onClose={() => setShowUploadHtml(false)}
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
