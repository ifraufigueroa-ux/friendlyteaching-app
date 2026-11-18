'use client';
// FriendlyTeaching.cl — Class Notes Modal
// Guided post-class notes template. Called after recording a class session.

import { useMemo, useState } from 'react';
import {
  Sparkles,
  Smile,
  Frown,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  BookOpen,
  MessageSquare,
  ClipboardList,
  Target,
  Save,
  UserPlus,
  Link2,
  type LucideIcon,
} from 'lucide-react';
import type { ClassNotes, ClassMood } from '@/hooks/useClassHistory';
import { useAuthStore } from '@/store/authStore';
import { useStudents } from '@/hooks/useStudents';
import AssignFromLibraryModal from '@/components/teacher/AssignFromLibraryModal';
import AssignExternalModal from '@/components/teacher/AssignExternalModal';
import UploadAndAssignHtmlModal from '@/components/teacher/UploadAndAssignHtmlModal';

type AssignKind = 'library' | 'html' | 'external' | null;

const MOOD_OPTIONS: { value: ClassMood; label: string; Icon: LucideIcon; color: string }[] = [
  { value: 'great', label: 'Great', Icon: Sparkles, color: 'border-green-400 bg-green-50 text-green-700' },
  { value: 'good', label: 'Good', Icon: Smile, color: 'border-blue-400 bg-blue-50 text-blue-700' },
  { value: 'regular', label: 'So-so', Icon: Frown, color: 'border-amber-400 bg-amber-50 text-amber-700' },
];

type AttendanceValue = 'attended' | 'absent' | 'late';

interface Props {
  studentName: string;
  /** When true, shows the attendance selector and requires it before saving. */
  requireAttendance?: boolean;
  onSave: (notes: ClassNotes, attendance?: AttendanceValue) => Promise<void>;
  onSkip: (attendance?: AttendanceValue) => void | Promise<void>;
}

export function ClassNotesModal({ studentName, requireAttendance, onSave, onSkip }: Props) {
  const [covered, setCovered] = useState('');
  const [performance, setPerformance] = useState('');
  const [nextClass, setNextClass] = useState('');
  const [homework, setHomework] = useState('');
  const [mood, setMood] = useState<ClassMood | null>(null);
  const [attendance, setAttendance] = useState<AttendanceValue | null>(null);
  const [saving, setSaving] = useState(false);

  // Resolve the student uid by display name — the pendingClassNotes
  // trigger only passes the name through, and refactoring all call
  // sites to also carry the uid is more surface area than it's
  // worth. When we can't find a match (empty students list before
  // load, or an unusual name), we just hide the "Assign Lesson"
  // affordance rather than guessing.
  const { firebaseUser } = useAuthStore();
  const teacherId = firebaseUser?.uid ?? '';
  const { students } = useStudents();
  const matchedStudent = useMemo(
    () => students.find(s => s.fullName === studentName),
    [students, studentName],
  );
  const [assignMenuOpen, setAssignMenuOpen] = useState(false);
  const [assignKind, setAssignKind] = useState<AssignKind>(null);
  const [assignToast, setAssignToast] = useState<string | null>(null);

  function openAssign(kind: AssignKind) {
    setAssignKind(kind);
    setAssignMenuOpen(false);
  }

  function handleAssignSaved(label: string) {
    setAssignToast(label);
    window.setTimeout(() => setAssignToast(null), 3500);
  }

  const canProceed = !requireAttendance || attendance !== null;

  async function handleSave() {
    if (!canProceed) return;
    if (!covered && !performance && !nextClass && !homework && !mood) {
      await onSkip(attendance ?? undefined);
      return;
    }
    setSaving(true);
    try {
      const notes: ClassNotes = {};
      if (covered.trim()) notes.covered = covered.trim();
      if (performance.trim()) notes.performance = performance.trim();
      if (nextClass.trim()) notes.nextClass = nextClass.trim();
      if (homework.trim()) notes.homework = homework.trim();
      if (mood) notes.mood = mood;
      await onSave(notes, attendance ?? undefined);
    } finally {
      setSaving(false);
    }
  }

  async function handleSkip() {
    if (!canProceed) return;
    await onSkip(attendance ?? undefined);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="glass-strong rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-glass-xl max-h-[90vh] overflow-hidden flex flex-col border border-white/40">

        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-bold text-[#5A3D7A] text-base inline-flex items-center gap-1.5"><FileText className="w-4 h-4" strokeWidth={2.25} /> Class notes</h2>
              <p className="text-xs text-gray-400 mt-0.5">Class with {studentName}</p>
            </div>
            <button
              onClick={handleSkip}
              disabled={!canProceed}
              className="text-xs text-gray-400 hover:text-gray-600 underline disabled:opacity-40"
            >
              {requireAttendance ? 'Skip notes' : 'Skip'}
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Attendance selector (only when requireAttendance) */}
          {requireAttendance && (
            <div>
              <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-2">
                Attendance *
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {([
                  { val: 'attended', Icon: CheckCircle2, label: 'Attended', active: 'bg-green-400 text-white', inactive: 'border border-green-200 text-green-700 hover:bg-green-50' },
                  { val: 'late',     Icon: Clock,        label: 'Late',     active: 'bg-amber-400 text-white', inactive: 'border border-amber-200 text-amber-700 hover:bg-amber-50' },
                  { val: 'absent',   Icon: XCircle,      label: 'No show',  active: 'bg-red-400 text-white',   inactive: 'border border-red-200 text-red-600 hover:bg-red-50' },
                ] as const).map(({ val, Icon, label, active, inactive }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAttendance(a => (a === val ? null : val))}
                    className={`py-2 rounded-full text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5 ${attendance === val ? active : inactive}`}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={2.5} /> {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mood selector */}
          <div>
            <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-2">
              How did the class go?
            </label>
            <div className="flex gap-2">
              {MOOD_OPTIONS.map(opt => {
                const { Icon } = opt;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMood(m => (m === opt.value ? null : opt.value))}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl border-2 text-xs font-semibold transition-all ${
                      mood === opt.value
                        ? opt.color + ' border-opacity-100'
                        : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" strokeWidth={2.25} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Covered topics */}
          <div>
            <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1.5 inline-flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" strokeWidth={2.5} /> What did you cover?
            </label>
            <textarea
              value={covered}
              onChange={e => setCovered(e.target.value)}
              rows={2}
              placeholder="E.g. Emotions vocabulary, Present Perfect with since/for..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] focus:border-transparent"
            />
          </div>

          {/* Student performance */}
          <div>
            <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1.5 inline-flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" strokeWidth={2.5} /> Student performance
            </label>
            <textarea
              value={performance}
              onChange={e => setPerformance(e.target.value)}
              rows={2}
              placeholder="E.g. Strong oral participation, but writing is tough. Pronunciation improved..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] focus:border-transparent"
            />
          </div>

          {/* Homework */}
          <div>
            <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1.5 inline-flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5" strokeWidth={2.5} /> Homework assigned
            </label>
            <input
              type="text"
              value={homework}
              onChange={e => setHomework(e.target.value)}
              placeholder="E.g. Exercises 3–5 p. 42 / No homework"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] focus:border-transparent"
            />
          </div>

          {/* Assign a lesson to this student */}
          {matchedStudent && teacherId && (
            <div className="relative">
              <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1.5 inline-flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5" strokeWidth={2.5} /> Assign a lesson (optional)
              </label>
              <button
                type="button"
                onClick={() => setAssignMenuOpen(v => !v)}
                className="w-full py-2.5 border border-[#C8A8DC] text-[#5A3D7A] rounded-xl text-sm font-semibold hover:bg-[#F0E5FF] transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" strokeWidth={2.25} /> Asignar material a {matchedStudent.fullName.split(' ')[0]}
              </button>
              {assignMenuOpen && (
                <div className="mt-2 border border-[#E8D5F0] rounded-xl bg-white shadow-md overflow-hidden">
                  <button
                    type="button"
                    onClick={() => openAssign('library')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-[#2D1B4E] hover:bg-[#F0E5FF]/60 transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-[#5A3D7A]" strokeWidth={2.25} />
                    <span className="flex-1">Desde la Librería FT</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openAssign('html')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-[#2D1B4E] hover:bg-[#F0E5FF]/60 transition-colors border-t border-[#F0E5FF]"
                  >
                    <FileText className="w-4 h-4 text-emerald-600" strokeWidth={2.25} />
                    <span className="flex-1">Subir un HTML</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openAssign('external')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-[#2D1B4E] hover:bg-[#F0E5FF]/60 transition-colors border-t border-[#F0E5FF]"
                  >
                    <Link2 className="w-4 h-4 text-sky-700" strokeWidth={2.25} />
                    <span className="flex-1">Link externo (Ellii, Off2Class…)</span>
                  </button>
                </div>
              )}
              {assignToast && (
                <p className="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                  {assignToast}
                </p>
              )}
            </div>
          )}

          {/* Next class */}
          <div>
            <label className="text-xs font-bold text-[#5A3D7A] uppercase tracking-wider block mb-1.5 inline-flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" strokeWidth={2.5} /> Focus for next class
            </label>
            <input
              type="text"
              value={nextClass}
              onChange={e => setNextClass(e.target.value)}
              placeholder="E.g. Review Past Simple + introduce Past Continuous..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A8DC] focus:border-transparent"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0 flex gap-3">
          <button
            onClick={handleSkip}
            disabled={saving || !canProceed}
            className="flex-1 py-2.5 border border-gray-200 rounded-full text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            {requireAttendance ? 'Skip notes' : 'Skip'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !canProceed}
            className="flex-1 py-2.5 bg-[#9B7CB8] hover:bg-[#7A5C97] text-white rounded-full text-sm font-bold disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-1.5"
          >
            {saving ? 'Saving…' : <><Save className="w-3.5 h-3.5" strokeWidth={2.5} /> Save notes</>}
          </button>
        </div>
      </div>

      {/* Scoped assign modals — opened from the "Assign a lesson" row */}
      {assignKind === 'library' && matchedStudent && teacherId && (
        <AssignFromLibraryModal
          teacherId={teacherId}
          lockedStudentId={matchedStudent.uid}
          lockedStudentName={matchedStudent.fullName}
          onClose={() => setAssignKind(null)}
          onSaved={({ assignedCount }) =>
            handleAssignSaved(`Lección asignada a ${matchedStudent.fullName.split(' ')[0]}${assignedCount ? '' : ' (0 escrituras)'}.`)
          }
        />
      )}
      {assignKind === 'html' && matchedStudent && teacherId && (
        <UploadAndAssignHtmlModal
          teacherId={teacherId}
          lockedStudentId={matchedStudent.uid}
          lockedStudentName={matchedStudent.fullName}
          onClose={() => setAssignKind(null)}
          onSaved={({ assignedCount }) =>
            handleAssignSaved(`HTML asignado a ${matchedStudent.fullName.split(' ')[0]}${assignedCount ? '' : ' (0 escrituras)'}.`)
          }
        />
      )}
      {assignKind === 'external' && matchedStudent && teacherId && (
        <AssignExternalModal
          teacherId={teacherId}
          lockedStudentId={matchedStudent.uid}
          lockedStudentName={matchedStudent.fullName}
          onClose={() => setAssignKind(null)}
          onSaved={({ assignedCount }) =>
            handleAssignSaved(`Link asignado a ${matchedStudent.fullName.split(' ')[0]}${assignedCount ? '' : ' (0 escrituras)'}.`)
          }
        />
      )}
    </div>
  );
}
