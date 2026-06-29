// FriendlyTeaching.cl — useLessons + useLesson hooks
'use client';
import { useEffect, useState } from 'react';
import {
  collection, doc, getDoc, query, onSnapshot, updateDoc, setDoc, deleteDoc,
  serverTimestamp, writeBatch,
  where, orderBy, type DocumentData, type QuerySnapshot, type QueryDocumentSnapshot,
  type FirestoreError,
} from 'firebase/firestore';
import { db, storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { Lesson, Course } from '@/types/firebase';

// ── Get a single lesson by ID ─────────────────────────────────

export function useLesson(lessonId: string) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lessonId) return;
    setLoading(true);

    async function fetchLesson() {
      try {
        const snap = await getDoc(doc(db, 'lessons', lessonId));
        if (!snap.exists()) {
          setError('Lección no encontrada');
          return;
        }
        const lessonData = { id: snap.id, ...snap.data() } as Lesson;
        setLesson(lessonData);

        if (lessonData.courseId) {
          const courseSnap = await getDoc(doc(db, 'courses', lessonData.courseId));
          if (courseSnap.exists()) {
            setCourse({ id: courseSnap.id, ...courseSnap.data() } as Course);
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al cargar la lección');
      } finally {
        setLoading(false);
      }
    }

    fetchLesson();
  }, [lessonId]);

  return { lesson, course, loading, error };
}

// ── Get lessons — real-time, filtered by teacherId and/or courseId ──

export function useLessons(teacherIdOrCourseId?: string, mode: 'teacher' | 'course' = 'teacher') {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q;

    if (!teacherIdOrCourseId) {
      // No filter — all lessons ordered by level
      q = query(collection(db, 'lessons'), orderBy('level'), orderBy('lessonNumber'));
    } else if (mode === 'course') {
      // Filter by courseId
      q = query(
        collection(db, 'lessons'),
        where('courseId', '==', teacherIdOrCourseId),
        orderBy('lessonNumber')
      );
    } else {
      // Filter by teacherId (default)
      q = query(
        collection(db, 'lessons'),
        where('teacherId', '==', teacherIdOrCourseId),
        orderBy('level'),
        orderBy('lessonNumber')
      );
    }

    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        setLessons(
          snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({
            id: d.id,
            ...d.data(),
          } as Lesson))
        );
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.error('Error loading lessons:', err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [teacherIdOrCourseId, mode]);

  return { lessons, loading };
}

// ── Student: get published lessons for a given level ─────────

export function usePublishedLessons(level?: string) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q;
    if (level) {
      q = query(
        collection(db, 'lessons'),
        where('isPublished', '==', true),
        where('level', '==', level),
        orderBy('lessonNumber')
      );
    } else {
      q = query(
        collection(db, 'lessons'),
        where('isPublished', '==', true),
        orderBy('level'),
        orderBy('lessonNumber')
      );
    }

    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        setLessons(
          snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({
            id: d.id,
            ...d.data(),
          } as Lesson))
        );
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [level]);

  return { lessons, loading };
}

// ── Toggle publish/unpublish ──────────────────────────────────

export async function toggleLessonPublished(lessonId: string, isPublished: boolean) {
  await updateDoc(doc(db, 'lessons', lessonId), {
    isPublished,
    updatedAt: serverTimestamp(),
  });
}

// ── Delete lesson ─────────────────────────────────────────────

export async function deleteLesson(lessonId: string) {
  const { deleteDoc, updateDoc, increment } = await import('firebase/firestore');
  const lessonSnap = await getDoc(doc(db, 'lessons', lessonId));
  const courseId = lessonSnap.data()?.courseId as string | undefined;
  await deleteDoc(doc(db, 'lessons', lessonId));
  if (courseId && courseId !== 'uncategorized') {
    await updateDoc(doc(db, 'courses', courseId), { lessonCount: increment(-1) });
  }
}

// ── Duplicate lesson ──────────────────────────────────────────

export async function duplicateLesson(lessonId: string, teacherId: string): Promise<string> {
  const { collection: col, doc: newDoc, setDoc, serverTimestamp: sTs } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'lessons', lessonId));
  if (!snap.exists()) throw new Error('Lección no encontrada');

  const original = snap.data();
  const ref = newDoc(col(db, 'lessons'));
  await setDoc(ref, {
    ...original,
    title: `${original.title} (copia)`,
    code: `${original.code}-COPY`,
    isPublished: false,
    teacherId,
    version: 1,
    createdAt: sTs(),
    updatedAt: sTs(),
    lastEditedBy: teacherId,
  });
  return ref.id;
}

// ── Create new empty lesson ──────────────────────────────────

export async function createLesson(teacherId: string, data: {
  title: string;
  code: string;
  level: string;
  courseId?: string;
}): Promise<string> {
  const { collection: col, doc: newDoc, setDoc, updateDoc, increment, serverTimestamp: sTs } = await import('firebase/firestore');
  const courseId = data.courseId ?? 'uncategorized';
  const ref = newDoc(col(db, 'lessons'));
  await setDoc(ref, {
    teacherId,
    courseId,
    unit: 1,
    lessonNumber: 1,
    code: data.code,
    title: data.title,
    level: data.level,
    isPublished: false,
    slides: [{ type: 'cover', phase: 'pre', title: data.title, subtitle: data.code }],
    slidesJson: '[]',
    objectives: [],
    version: 1,
    createdAt: sTs(),
    updatedAt: sTs(),
    lastEditedBy: teacherId,
  });
  if (courseId !== 'uncategorized') {
    await updateDoc(doc(db, 'courses', courseId), { lessonCount: increment(1) });
  }
  return ref.id;
}

// ── Create lesson from AI-generated content ─────────────────

export async function createLessonFromAI(teacherId: string, data: {
  title: string;
  code: string;
  level: string;
  duration?: number;
  objectives?: string[];
  slides: Record<string, unknown>[];
  courseId?: string;
}): Promise<string> {
  const { collection: col, doc: newDoc, setDoc, updateDoc, increment, serverTimestamp: sTs } = await import('firebase/firestore');
  const courseId = data.courseId ?? 'uncategorized';
  const ref = newDoc(col(db, 'lessons'));
  await setDoc(ref, {
    teacherId,
    courseId,
    unit: 1,
    lessonNumber: 1,
    code: data.code,
    title: data.title,
    level: data.level,
    duration: data.duration ?? 60,
    isPublished: false,
    slides: data.slides,
    slidesJson: JSON.stringify(data.slides),
    objectives: data.objectives ?? [],
    version: 1,
    createdAt: sTs(),
    updatedAt: sTs(),
    lastEditedBy: teacherId,
  });
  if (courseId !== 'uncategorized') {
    await updateDoc(doc(db, 'courses', courseId), { lessonCount: increment(1) });
  }
  return ref.id;
}

// ── Create lesson from external presentation (PPT / Canva / Google Slides) ──

export async function createLessonFromPresentation(teacherId: string, data: {
  title: string;
  code: string;
  level: string;
  courseId?: string;
  presentationUrl?: string;
  canvaMode?: boolean;
  canvaEmbed?: string;
}): Promise<string> {
  const { collection: col, doc: newDoc, setDoc, updateDoc, increment, serverTimestamp: sTs } = await import('firebase/firestore');
  const courseId = data.courseId ?? 'uncategorized';
  const ref = newDoc(col(db, 'lessons'));
  await setDoc(ref, {
    teacherId,
    courseId,
    unit: 1,
    lessonNumber: 1,
    code: data.code,
    title: data.title,
    level: data.level,
    isPublished: false,
    slides: [{ type: 'cover', phase: 'pre', title: data.title, subtitle: data.code }],
    slidesJson: '[]',
    objectives: [],
    version: 1,
    presentationUrl: data.presentationUrl ?? '',
    canvaMode: data.canvaMode ?? false,
    canvaEmbed: data.canvaEmbed ?? '',
    createdAt: sTs(),
    updatedAt: sTs(),
    lastEditedBy: teacherId,
  });
  if (courseId !== 'uncategorized') {
    await updateDoc(doc(db, 'courses', courseId), { lessonCount: increment(1) });
  }
  return ref.id;
}

// ── Get all courses (real-time) ───────────────────────────────

export async function createCourse(data: {
  title: string;
  level: import('@/types/firebase').LessonLevel;
  icon?: string;
  description?: string;
}): Promise<string> {
  const ref = doc(collection(db, 'courses'));
  await setDoc(ref, {
    title:       data.title.trim(),
    level:       data.level,
    icon:        data.icon ?? '📚',
    description: data.description?.trim() ?? '',
    lessonCount: 0,
    createdAt:   serverTimestamp(),
  });
  return ref.id;
}

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'courses'),
      (snap: QuerySnapshot<DocumentData>) => {
        const list = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as Course));
        list.sort((a: Course, b: Course) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
        setCourses(list);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsub();
  }, []);

  return { courses, loading };
}

export async function deleteCourse(courseId: string): Promise<void> {
  await deleteDoc(doc(db, 'courses', courseId));
}

export async function reorderCourses(orderedIds: string[]): Promise<void> {
  const batch = writeBatch(db);
  orderedIds.forEach((id, index) => {
    batch.update(doc(db, 'courses', id), { sortOrder: index });
  });
  await batch.commit();
}

export async function uploadCourseCover(courseId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const storageRef = ref(storage, `courses/${courseId}/cover.${ext}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function updateCourse(courseId: string, patch: {
  title?: string;
  level?: import('@/types/firebase').LessonLevel;
  icon?: string;
  description?: string;
  coverImage?: string;
}): Promise<void> {
  await updateDoc(doc(db, 'courses', courseId), { ...patch, updatedAt: serverTimestamp() });
}
