// FriendlyTeaching.cl — useLessons + useLesson hooks
'use client';
import { useEffect, useState } from 'react';
import {
  collection, doc, getDoc, getDocs, query, onSnapshot, updateDoc, setDoc, serverTimestamp,
  where, orderBy, type DocumentData, type QuerySnapshot, type QueryDocumentSnapshot,
  type FirestoreError,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
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
  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, 'lessons', lessonId));
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
  const { collection: col, doc: newDoc, setDoc, serverTimestamp: sTs } = await import('firebase/firestore');
  const ref = newDoc(col(db, 'lessons'));
  await setDoc(ref, {
    teacherId,
    courseId: data.courseId ?? 'uncategorized',
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
  const { collection: col, doc: newDoc, setDoc, serverTimestamp: sTs } = await import('firebase/firestore');
  const ref = newDoc(col(db, 'lessons'));
  await setDoc(ref, {
    teacherId,
    courseId: data.courseId ?? 'uncategorized',
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
  const { collection: col, doc: newDoc, setDoc, serverTimestamp: sTs } = await import('firebase/firestore');
  const ref = newDoc(col(db, 'lessons'));
  await setDoc(ref, {
    teacherId,
    courseId: data.courseId ?? 'uncategorized',
    unit: 1,
    lessonNumber: 1,
    code: data.code,
    title: data.title,
    level: data.level,
    isPublished: false,
    // A cover slide is created so the lesson is never empty
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
    getDocs(collection(db, 'courses'))
      .then((snap: QuerySnapshot<DocumentData>) => {
        setCourses(snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as Course)));
      })
      .finally(() => setLoading(false));
  }, []);

  return { courses, loading };
}
