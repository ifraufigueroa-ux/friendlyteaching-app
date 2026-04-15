// FriendlyTeaching.cl — Lesson Planner (global kanban + per-student planner)
'use client';
import { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useLessons } from '@/hooks/useLessons';
import { useStudents } from '@/hooks/useStudents';
import { useStudentPlan, setStudentLessonStatus, setStudentLessonNote } from '@/hooks/useStudentPlan';
import { useClassHistory } from '@/hooks/useClassHistory';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import TopBar from '@/components/layout/TopBar';
import type { Lesson, LessonPlannerStatus, LessonLevel, FTUser } from '@/types/firebase';
import type { ClassHistoryEntry } from '@/hooks/useClassHistory';

// ── Shared constants ───────────────────────────────────────────────────────────

const COLUMNS: { id: LessonPlannerStatus; label: string; icon: string; color: string; bg: string }[] = [
  { id: 'backlog',   label: 'Por preparar', icon: '📋', color: 'text-gray-600',  bg: 'bg-gray-50' },
  { id: 'upcoming',  label: 'Próximas',     icon: '📅', color: 'text-blue-700',  bg: 'bg-blue-50' },
  { id: 'ready',     label: 'Listas',       icon: '✅', color: 'text-green-700', bg: 'bg-green-50' },
  { id: 'archived',  label: 'Archivadas',   icon: '🗃️', color: 'text-gray-400',  bg: 'bg-gray-100' },
];

const LEVEL_COLORS: Record<string, string> = {
  A0: 'bg-gray-100 text-gray-500',   A1: 'bg-blue-100 text-blue-700',
  A2: 'bg-sky-100 text-sky-700',     B1: 'bg-green-100 text-green-700',
  'B1+': 'bg-emerald-100 text-emerald-700', B2: 'bg-amber-100 text-amber-700',
  C1: 'bg-purple-100 text-purple-700',
};

const MOOD_ICON: Record<string, string> = { great: '🌟', good: '😊', regular: '😕' };
const DAY_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function entryDate(e: ClassHistoryEntry): Date {
  const d = e.date as unknown as { toDate?: () => Date; seconds?: number };
  if (typeof d.toDate === 'function') return d.toDate();
  if (d.seconds) return new Date(d.seconds * 1000);
  return new Date(e.date as unknown as string);
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

// ── Note modal (shared) ────────────────────────────────────────────────────────

function NoteModal({
  title, code, initialNote, onSave, onClose,
}: {
  title: string; code: string; initialNote: string;
  onSave: (note: string) => Promise<void>;
  onClose: () => void;
}) {
  const [note, setNote] = useState(initialNote);
  const [saving, setSaving] = useState(false);
  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl">
        <h3 className="font-bold text-[#5A3D7A] mb-0.5">{title}</h3>
        <p className="text-xs text-gray-400 mb-3">{code}</p>
        <textarea
          value={note} onChange={e => setNote(e.target.value)} rows={3}
          placeholder="Ej: Revisar vocab de U2 antes, agregar actividad de speaking..."
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] mb-4"
          autoFocus
        />
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={async () => { setSaving(true); try { await onSave(note); } finally { setSaving(false); } }}
            disabled={saving}
            className="flex-1 py-2.5 bg-[#C8A8DC] hover:bg-[#9B7CB8] text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors">
            {saving ? '...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Lesson card ────────────────────────────────────────────────────────────────

function LessonCard({
  lesson, onDragStart, onNoteEdit, activeNote,
}: {
  lesson: Lesson;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onNoteEdit: (lesson: Lesson) => void;
  activeNote?: string;        // overrides lesson.plannerNote in per-student mode
}) {
  const displayNote = activeNote !== undefined ? activeNote : lesson.plannerNote;
  return (
    <div
      draggable onDragStart={e => onDragStart(e, lesson.id)}
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
        {lesson.isPublished
          ? <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full font-semibold">✓ Publicada</span>
          : <span className="text-[10px] bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded-full">Borrador</span>}
        {lesson.slides?.length > 0 && (
          <span className="text-[10px] text-gray-400">🎴 {lesson.slides.length}</span>
        )}
      </div>

      {displayNote && (
        <p className="text-[10px] text-gray-500 italic bg-[#FDFAFF] rounded-lg px-2 py-1 mb-1.5 line-clamp-2">
          {displayNote}
        </p>
      )}

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={e => { e.stopPropagation(); onNoteEdit(lesson); }}
          className="text-[10px] text-gray-400 hover:text-[#5A3D7A] px-1.5 py-0.5 rounded hover:bg-[#F0E5FF] transition-colors">
          📝 Nota
        </button>
        <Link href={`/dashboard/teacher/lessons/${lesson.id}/edit`} onClick={e => e.stopPropagation()}
          className="text-[10px] text-gray-400 hover:text-[#5A3D7A] px-1.5 py-0.5 rounded hover:bg-[#F0E5FF] transition-colors">
          ✏️ Editar
        </Link>
      </div>
    </div>
  );
}

// ── Kanban column ──────────────────────────────────────────────────────────────

function KanbanColumn({
  column, lessons, onDragStart, onDrop, onNoteEdit, planMap,
}: {
  column: typeof COLUMNS[0];
  lessons: Lesson[];
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, target: LessonPlannerStatus) => void;
  onNoteEdit: (lesson: Lesson) => void;
  planMap?: Record<string, { note: string }>;
}) {
  const [isOver, setIsOver] = useState(false);
  return (
    <div
      className={`flex-1 min-w-[220px] rounded-2xl flex flex-col transition-all ${column.bg} ${isOver ? 'ring-2 ring-[#C8A8DC] ring-offset-2' : ''}`}
      onDragOver={e => { e.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={e => { onDrop(e, column.id); setIsOver(false); }}
    >
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{column.icon}</span>
          <span className={`text-xs font-bold ${column.color}`}>{column.label}</span>
        </div>
        <span className="text-[10px] font-bold text-gray-400 bg-white/80 px-1.5 py-0.5 rounded-full">
          {lessons.length}
        </span>
      </div>
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
            activeNote={planMap ? planMap[lesson.id]?.note : undefined}
          />
        ))}
      </div>
    </div>
  );
}

// ── Student history panel (inside the student planner modal) ───────────────────

function StudentHistoryPanel({
  studentName, history, onClose,
}: {
  studentName: string;
  history: ClassHistoryEntry[];
  onClose: () => void;
}) {
  const studentHistory = useMemo(
    () => history
      .filter(e => e.studentName === studentName)
      .sort((a, b) => entryDate(b).getTime() - entryDate(a).getTime())
      .slice(0, 30),
    [history, studentName],
  );

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <div>
          <p className="text-xs font-bold text-[#5A3D7A]">Historial de clases</p>
          <p className="text-[11px] text-gray-400">{studentName}</p>
        </div>
        <button onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xl leading-none px-1">×</button>
      </div>

      {/* Summary chips */}
      {studentHistory.length > 0 && (() => {
        const attended = studentHistory.filter(e => e.attended).length;
        const withNotes = studentHistory.filter(e => e.notes?.covered || e.notes?.performance).length;
        return (
          <div className="flex gap-2 px-4 py-2 flex-shrink-0">
            <span className="text-[10px] bg-green-50 text-green-700 font-semibold px-2 py-1 rounded-full">
              ✅ {attended} realizadas
            </span>
            <span className="text-[10px] bg-red-50 text-red-600 font-semibold px-2 py-1 rounded-full">
              ❌ {studentHistory.length - attended} ausencias
            </span>
            <span className="text-[10px] bg-[#F0E5FF] text-[#5A3D7A] font-semibold px-2 py-1 rounded-full">
              📝 {withNotes} con notas
            </span>
          </div>
        );
      })()}

      {/* History list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {studentHistory.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-2xl mb-1">📭</p>
            <p className="text-xs text-gray-400">Sin clases registradas</p>
          </div>
        ) : (
          studentHistory.map(entry => {
            const d = entryDate(entry);
            const hasNotes = entry.notes && (entry.notes.covered || entry.notes.performance || entry.notes.nextClass);
            return (
              <div key={entry.id} className="bg-white rounded-xl border border-gray-100 p-3">
                {/* Row */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-base">{entry.attended ? '✅' : '❌'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-700">
                      {DAY_ES[d.getDay()]} {d.getDate()}/{d.getMonth() + 1}/{d.getFullYear()}
                      <span className="text-gray-400 font-normal ml-1">{entry.hour}:00</span>
                    </p>
                    {entry.notes?.mood && (
                      <p className="text-[10px] text-gray-400">
                        {MOOD_ICON[entry.notes.mood]} {entry.notes.mood === 'great' ? 'Excelente' : entry.notes.mood === 'good' ? 'Buena' : 'Regular'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {hasNotes && (
                  <div className="space-y-1.5 mt-1.5 pt-1.5 border-t border-gray-50">
                    {entry.notes?.covered && (
                      <p className="text-[10px] text-gray-600">
                        <span className="font-semibold text-gray-400">📚 Temas: </span>
                        {entry.notes.covered}
                      </p>
                    )}
                    {entry.notes?.performance && (
                      <p className="text-[10px] text-gray-600">
                        <span className="font-semibold text-gray-400">💬 Desempeño: </span>
                        {entry.notes.performance}
                      </p>
                    )}
                    {entry.notes?.nextClass && (
                      <p className="text-[10px] text-[#5A3D7A]">
                        <span className="font-semibold">🎯 Próxima: </span>
                        {entry.notes.nextClass}
                      </p>
                    )}
                    {entry.notes?.homework && (
                      <p className="text-[10px] text-gray-600">
                        <span className="font-semibold text-gray-400">📋 Tarea: </span>
                        {entry.notes.homework}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Student planner modal ──────────────────────────────────────────────────────

function StudentPlannerModal({
  student, lessons, teacherId, allHistory, onClose,
}: {
  student: FTUser;
  lessons: Lesson[];
  teacherId: string;
  allHistory: ClassHistoryEntry[];
  onClose: () => void;
}) {
  const { planMap, loading: planLoading } = useStudentPlan(teacherId, student.uid);
  const [showHistory, setShowHistory] = useState(false);
  const [noteLesson, setNoteLesson] = useState<Lesson | null>(null);
  const draggingId = useRef<string | null>(null);

  // Filter lessons to this student's level
  const studentLevel = student.studentData?.level;
  const levelLessons = studentLevel
    ? lessons.filter(l => l.level === studentLevel)
    : lessons;

  function getStudentStatus(l: Lesson): LessonPlannerStatus {
    if (planMap[l.id]?.status) return planMap[l.id].status;
    if (l.plannerStatus) return l.plannerStatus;
    return l.isPublished ? 'ready' : 'backlog';
  }

  const byColumn = (col: LessonPlannerStatus) =>
    levelLessons.filter(l => getStudentStatus(l) === col);

  function handleDragStart(e: React.DragEvent, id: string) {
    draggingId.current = id;
    e.dataTransfer.effectAllowed = 'move';
  }

  async function handleDrop(e: React.DragEvent, targetCol: LessonPlannerStatus) {
    e.preventDefault();
    const id = draggingId.current;
    if (!id) return;
    draggingId.current = null;
    await setStudentLessonStatus(teacherId, student.uid, id, targetCol);
  }

  async function handleSaveNote(lesson: Lesson, note: string) {
    await setStudentLessonNote(teacherId, student.uid, lesson.id, note);
    setNoteLesson(null);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3">
      <div className="bg-[#FFFCF7] rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">

        {/* Modal header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-shrink-0 bg-white rounded-t-2xl">
          {/* Student avatar */}
          <div className="w-10 h-10 rounded-full bg-[#C8A8DC] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {initials(student.fullName)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#5A3D7A] truncate">{student.fullName}</h2>
              {studentLevel && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${LEVEL_COLORS[studentLevel] ?? 'bg-gray-100 text-gray-500'}`}>
                  {studentLevel}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400">
              {levelLessons.length} lección{levelLessons.length !== 1 ? 'es' : ''} en su nivel
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowHistory(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                showHistory
                  ? 'bg-[#5A3D7A] text-white'
                  : 'bg-[#F0E5FF] text-[#5A3D7A] hover:bg-[#E0C8F0]'
              }`}
            >
              📋 Historial
            </button>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors text-xl leading-none">
              ×
            </button>
          </div>
        </div>

        {/* Modal body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Kanban area */}
          <div className="flex-1 overflow-x-auto p-4">
            {planLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-[#C8A8DC] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : levelLessons.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <p className="text-3xl">📚</p>
                <p className="text-sm text-gray-500">No hay lecciones para el nivel {studentLevel ?? 'asignado'}</p>
              </div>
            ) : (
              <div className="flex gap-3 h-full min-h-[400px]" style={{ minWidth: `${COLUMNS.length * 230}px` }}>
                {COLUMNS.map(col => (
                  <KanbanColumn
                    key={col.id}
                    column={col}
                    lessons={byColumn(col.id)}
                    onDragStart={handleDragStart}
                    onDrop={handleDrop}
                    onNoteEdit={setNoteLesson}
                    planMap={planMap}
                  />
                ))}
              </div>
            )}
          </div>

          {/* History side panel */}
          {showHistory && (
            <div className="w-80 border-l border-gray-100 bg-white flex-shrink-0 overflow-hidden flex flex-col">
              <StudentHistoryPanel
                studentName={student.fullName}
                history={allHistory}
                onClose={() => setShowHistory(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Note modal — rendered above the student planner modal */}
      {noteLesson && (
        <NoteModal
          title={noteLesson.title}
          code={noteLesson.code}
          initialNote={planMap[noteLesson.id]?.note ?? ''}
          onSave={note => handleSaveNote(noteLesson, note)}
          onClose={() => setNoteLesson(null)}
        />
      )}
    </div>
  );
}

// ── Main planner page ──────────────────────────────────────────────────────────

export default function PlannerPage() {
  const { profile } = useAuthStore();
  const teacherId = profile?.uid ?? '';
  const { lessons, loading: lessonsLoading } = useLessons(teacherId, 'teacher');
  const { students, loading: studentsLoading } = useStudents();
  const { history } = useClassHistory(teacherId, 365);

  const [selectedStudent, setSelectedStudent] = useState<FTUser | null>(null);
  const [noteLesson, setNoteLesson] = useState<Lesson | null>(null);
  const [levelFilter, setLevelFilter] = useState('');
  const draggingId = useRef<string | null>(null);

  const LEVELS: LessonLevel[] = ['A0', 'A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];

  function getStatus(l: Lesson): LessonPlannerStatus {
    if (l.plannerStatus) return l.plannerStatus;
    return l.isPublished ? 'ready' : 'backlog';
  }

  const filtered = levelFilter ? lessons.filter(l => l.level === levelFilter) : lessons;
  const byColumn = (col: LessonPlannerStatus) => filtered.filter(l => getStatus(l) === col);

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

  if (lessonsLoading) {
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
        subtitle="Organiza lecciones globalmente o planifica por estudiante"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard/teacher' },
          { label: 'Planificador' },
        ]}
      />

      {/* ── Student selector strip ── */}
      {!studentsLoading && students.length > 0 && (
        <div className="px-6 pt-4 pb-0">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Planificar por estudiante
          </p>
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none">
            {students.map(student => (
              <button
                key={student.uid}
                onClick={() => setSelectedStudent(student)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:border-[#C8A8DC] hover:bg-[#FDFAFF] transition-all flex-shrink-0 group"
              >
                <div className="w-6 h-6 rounded-full bg-[#C8A8DC] flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                  {initials(student.fullName)}
                </div>
                <span className="text-xs font-semibold text-gray-600 group-hover:text-[#5A3D7A] whitespace-nowrap">
                  {student.fullName.split(' ')[0]}
                </span>
                {student.studentData?.level && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${LEVEL_COLORS[student.studentData.level] ?? ''}`}>
                    {student.studentData.level}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Level filter (global board) ── */}
      <div className="px-6 pt-3 pb-2 flex items-center gap-2 flex-wrap">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mr-1">
          Todas las lecciones
        </p>
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

      {/* ── Global kanban board ── */}
      <div className="flex-1 overflow-x-auto p-6 pt-2">
        <div className="flex gap-4 h-full min-h-[500px]" style={{ minWidth: `${COLUMNS.length * 240}px` }}>
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.id}
              column={col}
              lessons={byColumn(col.id)}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onNoteEdit={setNoteLesson}
            />
          ))}
        </div>
      </div>

      {/* ── Global note modal ── */}
      {noteLesson && (
        <NoteModal
          title={noteLesson.title}
          code={noteLesson.code}
          initialNote={noteLesson.plannerNote ?? ''}
          onSave={note => handleSaveNote(noteLesson, note)}
          onClose={() => setNoteLesson(null)}
        />
      )}

      {/* ── Per-student planner modal ── */}
      {selectedStudent && (
        <StudentPlannerModal
          student={selectedStudent}
          lessons={lessons}
          teacherId={teacherId}
          allHistory={history}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}
