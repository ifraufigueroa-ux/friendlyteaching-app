// FriendlyTeaching.cl — AssignFriendlyLessonModal
//
// Shared "Assign to students" modal for Friendlistenings and FriendlyWriting.
// Those products' lessons live as static files (not Firestore docs), so
// instead of flipping an assignedTo[] on the lesson we diff the picked
// uids against the existing per-student assignment docs: new picks create
// a doc, removed picks delete the matching doc.

'use client';
import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import {
  assignListening, unassignListening,
} from '@/hooks/useFriendlisteningAssignments';
import {
  assignWriting, unassignWriting,
} from '@/hooks/useFriendlywritingAssignments';
import type {
  FriendlisteningAssignment, FriendlywritingAssignment,
} from '@/types/firebase';

export type FriendlyProduct = 'listening' | 'writing';

interface Student {
  uid: string;
  fullName: string;
}

interface Props {
  product: FriendlyProduct;
  teacherId: string;
  lesson: {
    id: string;
    title: string;
    level?: string;
  };
  students: Student[];
  // Pre-existing assignment docs for this specific lesson (either product).
  // The modal uses them to seed the picker and diff on save.
  existingAssignments: (FriendlisteningAssignment | FriendlywritingAssignment)[];
  onClose: () => void;
  onSaved?: () => void;
}

export default function AssignFriendlyLessonModal({
  product, teacherId, lesson, students, existingAssignments, onClose, onSaved,
}: Props) {
  // Map studentId → existing assignment doc id, used both to seed the
  // initial pick-set and to find which doc to delete on removal.
  const existingByStudent = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of existingAssignments) {
      if (a.lessonId === lesson.id) m.set(a.studentId, a.id);
    }
    return m;
  }, [existingAssignments, lesson.id]);

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(existingByStudent.keys()),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(uid: string) {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(uid)) n.delete(uid); else n.add(uid);
      return n;
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const toAdd: string[] = [];
      const toRemove: string[] = []; // assignment doc ids
      for (const s of students) {
        const wasAssigned = existingByStudent.has(s.uid);
        const nowAssigned = selected.has(s.uid);
        if (nowAssigned && !wasAssigned) toAdd.push(s.uid);
        if (!nowAssigned && wasAssigned) toRemove.push(existingByStudent.get(s.uid)!);
      }

      const doAssign = product === 'listening' ? assignListening : assignWriting;
      const doUnassign = product === 'listening' ? unassignListening : unassignWriting;

      await Promise.all([
        ...toAdd.map(studentId =>
          doAssign({
            teacherId,
            studentId,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            lessonLevel: lesson.level,
          }),
        ),
        ...toRemove.map(id => doUnassign(id)),
      ]);
      onSaved?.();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div className="min-w-0">
            <h3 className="font-bold text-[#5A3D7A] truncate">Assign to students</h3>
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              {lesson.title}{lesson.level ? ` · ${lesson.level}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X className="w-5 h-5" strokeWidth={2.25} />
          </button>
        </div>

        <div className="p-4 max-h-80 overflow-y-auto space-y-1.5">
          {students.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No active students.</p>
          ) : (
            students.map(s => (
              <label
                key={s.uid}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F0E5FF]/40 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.has(s.uid)}
                  onChange={() => toggle(s.uid)}
                  className="accent-[#5A3D7A] w-4 h-4"
                />
                <span className="text-sm text-gray-700">{s.fullName}</span>
              </label>
            ))
          )}
        </div>

        {error && (
          <p className="text-xs text-red-600 px-4 pb-2">{error}</p>
        )}

        <div className="p-4 border-t border-gray-100 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#5A3D7A] text-white hover:bg-[#4A2D6A] disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
