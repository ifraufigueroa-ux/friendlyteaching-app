// FriendlyTeaching.cl — Lesson Planner (Kanban Board)
'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useLessons } from '@/hooks/useLessons';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import TopBar from '@/components/layout/TopBar';
import type { Lesson, LessonPlannerStatus, LessonLevel } from '@/types/firebase';

// ── Column config ─────────────────────────────────────────────────────────────

const COLUMNS: { id: LessonPlannerStatus; label: string; icon: string; color: string; bg: string }[] = [
  { id: 'backlog',  label: 'Por preparar', icon: '📋', color: 'text-gray-600',   bg: 'bg-gray-50' },
  { id: 'upcoming', label: 'Próximas',      icon: '📅', color: 'text-blue-700',   bg: 'bg-blue-50' },
  { id: 'ready',    label: 'Listas',        icon: '✅', color: 'text-green-700',  bg: 'bg-green-50' },
  { id: 'archived', label: 'Archivadas',    icon: '🗃️', color: 'text-gray-400',   bg: 'bg-gray-100' },
];

const LEVEL_COLORS: Record<string, string> = {
  A0:'bg-gray-100 text-gray-500', A1:'bg-blue-100 text-blue-700',
  A2:'bg-sky-100 text-sky-700', B1:'bg-green-100 text-green-700',
  'B1+':'bg-emerald-100 text-emerald-700', B2:'bg-amber-100 text-amber-700',
  C1:'bg-purple-100 text-purple-700',
};

// ── Lesson card note modal ────────────────────────────────────────────────────

function NoteModal({
  lesson,
  onSave,
  onClose,
}: {
  lesson: Lesson;
  onSave: (note: string) => Promise<void>;
  onClose: () => void;
}) {
  const [note, setNote] = useState(lesson.plannerNote ?? '');
  const [saving, setSaving] = useState(false);
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl">
        <h3 className="font-bold text-[#5A3D7A] mb-1">{lesson.title}</h3>
        <p className="text-xs text-gray-400 mb-3">{lesson.code}</p>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={3}
          placeholder="Ej: Revisar vocab de U2 antes, agregar actividad de speaking..."
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] focus:border-transparent mb-4"
          autoFocus
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={async () => {
              setSaving(true);
              try { await onSave(note); }
              finally { setSaving(false); }
            }}
            disabled={saving}
            className="flex-1 py-2.5 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
          >
            {saving ? '...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Kanban card ───────────────────────────────────────────────────────────────

function LessonCard({
  lesson,
  onDragStart,
  onNoteEdit,
}: {
  lesson: Lesson;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onNoteEdit: (lesson: Lesson) => void;
}) {
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, lesson.id)}
      className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing active:opacity-60 select-none group"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0">
          <p className="text-[10px] text-gray-400 font-medium">{lesson.code}</p>
          <p className="text-xs font-bold text-gray-800 leading-snug truncate">{lesson.title}</p>
        </div>
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${LEVEL_COLORS[lesson.level] ?? 'bg-gray-100 text-gray-400'}`}>
          {lesson.level}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-1.5">
        {lesson.isPublished ? (
          <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full font-semibold">✓ Publicada</span>
        ) : (
          <span className="text-[10px] bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded-full">Borrador</span>
        )}
        {lesson.slides?.length > 0 && (
          <span className="text-[10px] text-gray-400">🎴 {lesson.slides.length}</span>
        )}
      </div>

      {lesson.plannerNote && (
        <p className="text-[10px] text-gray-500 italic bg-[#FDFAFF] rounded-lg px-2 py-1 mb-1.5 line-clamp-2">
          {lesson.plannerNote}
        </p>
      )}

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={e => { e.stopPropagation(); onNoteEdit(lesson); }}
          className="text-[10px] text-gray-400 hover:text-[#5A3D7A] px-1.5 py-0.5 rounded hover:bg-[#F0E5FF] transition-colors"
        >
          📝 Nota
        </button>
        <Link
          href={`/dashboard/teacher/lessons/${lesson.id}/edit`}
          onClick={e => e.stopPropagation()}
          className="text-[10px] text-gray-400 hover:text-[#5A3D7A] px-1.5 py-0.5 rounded hover:bg-[#F0E5FF] transition-colors"
        >
          ✏️ Editar
        </Link>
      </div>
    </div>
  );
}

// ── Kanban column ─────────────────────────────────────────────────────────────

function KanbanColumn({
  column,
  lessons,
  onDragStart,
  onDrop,
  onDragOver,
  onNoteEdit,
}: {
  column: typeof COLUMNS[0];
  lessons: Lesson[];
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, target: LessonPlannerStatus) => void;
  onDragOver: (e: React.DragEvent) => void;
  onNoteEdit: (lesson: Lesson) => void;
}) {
  const [isOver, setIsOver] = useState(false);

  return (
    <div
      className={`flex-1 min-w-[220px] rounded-2xl flex flex-col transition-all ${column.bg} ${isOver ? 'ring-2 ring-[#C8A8DC] ring-offset-2' : ''}`}
      onDragOver={e => { e.preventDefault(); onDragOver(e); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={e => { onDrop(e, column.id); setIsOver(false); }}
    >
      {/* Column header */}
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{column.icon}</span>
          <span className={`text-xs font-bold ${column.color}`}>{column.label}</span>
        </div>
        <span className="text-[10px] font-bold text-gray-400 bg-white/80 px-1.5 py-0.5 rounded-full">
          {lessons.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 px-3 pb-3 space-y-2 min-h-[120px]">
        {lessons.length === 0 && (
          <div className="flex items-center justify-center h-20 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-[10px] text-gray-300">Arrastra aquí</p>
          </div>
        )}
        {lessons.map(lesson => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            onDragStart={onDragStart}
            onNoteEdit={onNoteEdit}
          />
        ))}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PlannerPage() {
  const { profile } = useAuthStore();
  const teacherId = profile?.uid ?? '';
  const { lessons, loading } = useLessons(teacherId, 'teacher');

  const [noteLesson, setNoteLesson] = useState<Lesson | null>(null);
  const [levelFilter, setLevelFilter] = useState('');
  const draggingId = useRef<string | null>(null);

  // Group lessons by plannerStatus (default: unpublished → backlog, published → ready)
  function getStatus(l: Lesson): LessonPlannerStatus {
    if (l.plannerStatus) return l.plannerStatus;
    return l.isPublished ? 'ready' : 'backlog';
  }

  const LEVELS: LessonLevel[] = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];
  const filtered = levelFilter ? lessons.filter(l => l.level === levelFilter) : lessons;
  const byColumn = (col: LessonPlannerStatus) =>
    filtered.filter(l => getStatus(l) === col);

  function handleDragStart(e: React.DragEvent, id: string) {
    draggingId.current = id;
    e.dataTransfer.effectAllowed = 'move';
  }

  async function handleDrop(e: React.DragEvent, targetCol: LessonPlannerStatus) {
    e.preventDefault();
    const id = draggingId.current;
    if (!id) return;
    draggingId.current = null;
    await updateDoc(doc(db, 'lessons', id), {
      plannerStatus: targetCol,
      updatedAt: serverTimestamp(),
    });
  }

  async function handleSaveNote(lesson: Lesson, note: string) {
    await updateDoc(doc(db, 'lessons', lesson.id), {
      plannerNote: note,
      updatedAt: serverTimestamp(),
    });
    setNoteLesson(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFCF7] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="🗂️ Planner de Lecciones"
        subtitle="Arrastra las lecciones entre columnas para organizar tu semana"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/teacher' },
          { label: 'Planificador' },
        ]}
      />

      {/* Filters */}
      <div className="px-6 pt-4 pb-2 flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setLevelFilter('')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${!levelFilter ? 'bg-[#C8A8DC] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-[#C8A8DC]'}`}
        >
          Todos ({lessons.length})
        </button>
        {LEVELS.filter(l => lessons.some(les => les.level === l)).map(l => (
          <button
            key={l}
            onClick={() => setLevelFilter(levelFilter === l ? '' : l)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${levelFilter === l ? 'bg-[#C8A8DC] text-white' : `${LEVEL_COLORS[l]} opacity-80 hover:opacity-100 border border-transparent`}`}
          >
            {l} ({lessons.filter(les => les.level === l).length})
          </button>
        ))}
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-6 pt-2">
        <div className="flex gap-4 h-full min-h-[500px]" style={{ minWidth: `${COLUMNS.length * 240}px` }}>
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.id}
              column={col}
              lessons={byColumn(col.id)}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onNoteEdit={setNoteLesson}
            />
          ))}
        </div>
      </div>

      {/* Note modal */}
      {noteLesson && (
        <NoteModal
          lesson={noteLesson}
          onSave={note => handleSaveNote(noteLesson, note)}
          onClose={() => setNoteLesson(null)}
        />
      )}
    </div>
  );
}
