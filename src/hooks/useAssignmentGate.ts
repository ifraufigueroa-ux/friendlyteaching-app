// FriendlyTeaching.cl — useAssignmentGate
//
// Redirects a student away from a Friendlistenings / FriendlyWriting
// runner URL when they don't have that lesson assigned. Teachers and
// anyone whose role isn't 'student' pass through untouched — they use
// the same URLs to preview content from the teacher catalog.

'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useStudentListeningAssignments } from '@/hooks/useFriendlisteningAssignments';
import { useStudentWritingAssignments } from '@/hooks/useFriendlywritingAssignments';

type Product = 'listening' | 'writing';

export function useAssignmentGate(product: Product, lessonId: string) {
  const router = useRouter();
  const { firebaseUser, role, isInitialized } = useAuthStore();
  const uid = firebaseUser?.uid ?? '';
  const isStudent = role === 'student';

  // Call both hooks unconditionally (React rules); each one bails out when
  // its studentId is empty, so the cost is zero for the inactive one.
  const listening = useStudentListeningAssignments(product === 'listening' && isStudent ? uid : '');
  const writing   = useStudentWritingAssignments(product === 'writing'   && isStudent ? uid : '');

  const { assignments, loading } = product === 'listening' ? listening : writing;

  const hasAssignment = assignments.some(a => a.lessonId === lessonId);
  const ready = isInitialized && (!isStudent || !loading);
  const allowed = !isStudent || hasAssignment;

  useEffect(() => {
    if (!ready) return;
    if (allowed) return;
    router.replace('/dashboard/student/lessons');
  }, [ready, allowed, router]);

  return { ready, allowed };
}
