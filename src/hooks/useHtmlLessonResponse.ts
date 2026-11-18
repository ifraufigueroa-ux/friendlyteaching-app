// FriendlyTeaching.cl — HTML lesson response hooks.
//
// HTML lessons are static markup rendered through DOMPurify + inner
// HTML, so any <input>/<textarea>/<select>/<radio>/<checkbox> inside
// is visible but inert. This module gives those inputs persistence:
// a single doc per student per lesson in `htmlLessonResponses`,
// upserted on every change.
//
// Doc id format: `${lessonId}_${studentId}` so look-ups are constant-
// time and avoid listing collections just to find "my answers for
// this lesson". The teacher side can either get() by composite id
// when it knows the student, or list where('teacherId','==',uid) to
// see all submissions across a cohort.

'use client';
import { useEffect, useState } from 'react';
import {
  doc, setDoc, getDoc, onSnapshot, collection, query, where, orderBy,
  serverTimestamp, type DocumentData, type FirestoreError,
  type QuerySnapshot, type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { HtmlLessonResponse } from '@/types/firebase';

function docIdFor(lessonId: string, studentId: string): string {
  return `${lessonId}_${studentId}`;
}

/** Student-side: load + subscribe to this student's answers for this lesson. */
export function useHtmlLessonResponse(studentId: string, lessonId: string) {
  const [response, setResponse] = useState<HtmlLessonResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId || !lessonId) { setLoading(false); return; }
    const ref = doc(db, 'htmlLessonResponses', docIdFor(lessonId, studentId));
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setResponse({ id: snap.id, ...(snap.data() as Omit<HtmlLessonResponse, 'id'>) });
        } else {
          setResponse(null);
        }
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.warn('[useHtmlLessonResponse]', err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [studentId, lessonId]);

  return { response, loading };
}

/** Teacher-side: list every HTML response for this teacher's lessons. */
export function useTeacherHtmlLessonResponses(teacherId: string) {
  const [responses, setResponses] = useState<HtmlLessonResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) { setLoading(false); return; }
    const q = query(
      collection(db, 'htmlLessonResponses'),
      where('teacherId', '==', teacherId),
      orderBy('updatedAt', 'desc'),
    );
    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        setResponses(snap.docs.map(
          (d: QueryDocumentSnapshot<DocumentData>) =>
            ({ id: d.id, ...(d.data() as Omit<HtmlLessonResponse, 'id'>) }),
        ));
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.warn('[useTeacherHtmlLessonResponses]', err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [teacherId]);

  return { responses, loading };
}

/** One-shot get — used when the teacher opens a specific student's view. */
export async function getHtmlLessonResponse(
  studentId: string,
  lessonId: string,
): Promise<HtmlLessonResponse | null> {
  if (!studentId || !lessonId) return null;
  const ref = doc(db, 'htmlLessonResponses', docIdFor(lessonId, studentId));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<HtmlLessonResponse, 'id'>) };
}

/** Upsert a batch of answers. Student-side — only overwrites fields present
 *  in `answers`, leaves the rest intact. teacherId is required on create. */
export async function saveHtmlLessonAnswers(opts: {
  studentId:  string;
  lessonId:   string;
  teacherId?: string;
  answers:    Record<string, string>;
}): Promise<void> {
  if (!opts.studentId || !opts.lessonId) throw new Error('studentId + lessonId required');
  const ref = doc(db, 'htmlLessonResponses', docIdFor(opts.lessonId, opts.studentId));
  const existing = await getDoc(ref);
  const mergedAnswers = {
    ...(existing.exists() ? (existing.data().answers as Record<string, string> ?? {}) : {}),
    ...opts.answers,
  };
  const payload: Record<string, unknown> = {
    lessonId:  opts.lessonId,
    studentId: opts.studentId,
    answers:   mergedAnswers,
    updatedAt: serverTimestamp(),
  };
  if (!existing.exists()) {
    payload.startedAt = serverTimestamp();
    if (opts.teacherId) payload.teacherId = opts.teacherId;
  }
  await setDoc(ref, payload, { merge: true });
}

/** Mark this response as submitted (irreversible from the student's POV — the
 *  teacher can still read the answers but the student indicator flips). */
export async function submitHtmlLessonResponse(
  studentId: string,
  lessonId:  string,
): Promise<void> {
  const ref = doc(db, 'htmlLessonResponses', docIdFor(lessonId, studentId));
  await setDoc(
    ref,
    { submittedAt: serverTimestamp(), updatedAt: serverTimestamp() },
    { merge: true },
  );
}
