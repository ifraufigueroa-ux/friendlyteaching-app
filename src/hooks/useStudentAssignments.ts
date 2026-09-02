// FriendlyTeaching.cl — useStudentAssignments
// Colección unificada de asignaciones de material para un estudiante:
// lecciones internas (Librería FT) + material externo (Off2Class, Ellii,
// Drive, YouTube, etc.). Reemplaza al enfoque anterior de mostrar TODAS
// las lecciones publicadas sin filtro real de asignación.
//
// Nota: Friendlyflix / Friendlyrics / FriendlyTales usan su propio
// `assignedTo: string[]` en el doc. La página del estudiante hace merge
// de las cuatro fuentes.

'use client';
import { useEffect, useState } from 'react';
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, query, updateDoc, where,
  serverTimestamp, Timestamp,
  type QuerySnapshot, type DocumentData, type QueryDocumentSnapshot,
  type FirestoreError,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { StudentAssignment, LessonLevel } from '@/types/firebase';

// ── Read: por estudiante ──────────────────────────────────────
export function useStudentAssignments(studentId: string) {
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) { setLoading(false); return; }
    const q = query(collection(db, 'studentAssignments'), where('studentId', '==', studentId));
    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        const rows = snap.docs.map(
          (d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as StudentAssignment),
        );
        // Newest first (createdAt desc). Docs sin createdAt van al final.
        rows.sort((a: StudentAssignment, b: StudentAssignment) => {
          const ta = a.createdAt?.toMillis?.() ?? 0;
          const tb = b.createdAt?.toMillis?.() ?? 0;
          return tb - ta;
        });
        setAssignments(rows);
        setLoading(false);
      },
      (e: FirestoreError) => { setError(e.message); setLoading(false); },
    );
    return unsub;
  }, [studentId]);

  return { assignments, loading, error };
}

// ── Read: por profe (para el UI de asignar / listar lo que dió) ──
export function useTeacherAssignments(teacherId: string) {
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) { setLoading(false); return; }
    const q = query(collection(db, 'studentAssignments'), where('teacherId', '==', teacherId));
    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        setAssignments(snap.docs.map(
          (d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as StudentAssignment),
        ));
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [teacherId]);

  return { assignments, loading };
}

// ── Create ─────────────────────────────────────────────────────
export interface NewAssignmentInput {
  studentId: string;
  teacherId: string;
  source: 'lesson' | 'external';
  title: string;
  refId?: string;         // requerido si source==='lesson'
  externalUrl?: string;   // requerido si source==='external'
  level?: LessonLevel;
  notes?: string;
  dueAt?: Date;
}

export async function createStudentAssignment(input: NewAssignmentInput): Promise<string> {
  if (!input.studentId || !input.teacherId) throw new Error('studentId y teacherId son requeridos');
  if (!input.title.trim()) throw new Error('Title requerido');
  if (input.source === 'lesson' && !input.refId) throw new Error('refId requerido para asignaciones internas');
  if (input.source === 'external' && !input.externalUrl) throw new Error('externalUrl requerido para asignaciones externas');

  const payload: Record<string, unknown> = {
    studentId: input.studentId,
    teacherId: input.teacherId,
    source: input.source,
    title: input.title.trim(),
    status: 'assigned',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (input.refId)        payload.refId = input.refId;
  if (input.externalUrl)  payload.externalUrl = input.externalUrl.trim();
  if (input.level)        payload.level = input.level;
  if (input.notes)        payload.notes = input.notes.trim();
  if (input.dueAt)        payload.dueAt = Timestamp.fromDate(input.dueAt);

  const ref = await addDoc(collection(db, 'studentAssignments'), payload);
  return ref.id;
}

// ── Update ─────────────────────────────────────────────────────
export async function updateStudentAssignment(
  id: string,
  patch: Partial<Pick<StudentAssignment, 'status' | 'notes' | 'title' | 'level' | 'externalUrl'>>,
): Promise<void> {
  await updateDoc(doc(db, 'studentAssignments', id), { ...patch, updatedAt: serverTimestamp() });
}

// ── Delete ─────────────────────────────────────────────────────
export async function deleteStudentAssignment(id: string): Promise<void> {
  await deleteDoc(doc(db, 'studentAssignments', id));
}

// ── Helper: bulk assign to many students ───────────────────────
export async function bulkAssignLesson(
  base: Omit<NewAssignmentInput, 'studentId'>,
  studentIds: string[],
): Promise<string[]> {
  const results: string[] = [];
  for (const sid of studentIds) {
    try {
      const id = await createStudentAssignment({ ...base, studentId: sid });
      results.push(id);
    } catch (e) {
      console.warn('[bulkAssignLesson] fallo para', sid, e);
    }
  }
  return results;
}

