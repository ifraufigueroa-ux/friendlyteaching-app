// FriendlyTeaching.cl — Skill Assessments Hook (Gap Analysis)
import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  FirestoreError,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { SkillAssessment, SkillScores } from '@/types/firebase';

export function useSkillAssessments(studentId: string, teacherId: string) {
  const [assessments, setAssessments] = useState<SkillAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId || !teacherId) {
      setAssessments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'skillAssessments'),
      where('studentId', '==', studentId),
      where('teacherId', '==', teacherId),
      orderBy('assessedAt', 'desc'),
    );

    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData>) => {
        setAssessments(
          snap.docs.map((d: DocumentData) => ({ id: d.id, ...d.data() } as SkillAssessment)),
        );
        setLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        console.error('useSkillAssessments error:', err.message);
        setError(err.message);
        setLoading(false);
      },
    );

    return unsub;
  }, [studentId, teacherId]);

  async function addAssessment(
    scores: SkillScores,
    notes?: string,
    bookingId?: string,
  ): Promise<void> {
    await addDoc(collection(db, 'skillAssessments'), {
      studentId,
      teacherId,
      bookingId: bookingId ?? null,
      scores,
      notes: notes ?? '',
      assessedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
  }

  /** Averaged scores across all assessments — null if none exist */
  const averageScores: SkillScores | null =
    assessments.length === 0
      ? null
      : (() => {
          const sum = assessments.reduce(
            (acc, a) => ({
              speaking: acc.speaking + a.scores.speaking,
              listening: acc.listening + a.scores.listening,
              reading: acc.reading + a.scores.reading,
              writing: acc.writing + a.scores.writing,
              grammar: acc.grammar + a.scores.grammar,
              vocabulary: acc.vocabulary + a.scores.vocabulary,
            }),
            { speaking: 0, listening: 0, reading: 0, writing: 0, grammar: 0, vocabulary: 0 },
          );
          const n = assessments.length;
          return {
            speaking: Math.round((sum.speaking / n) * 10) / 10,
            listening: Math.round((sum.listening / n) * 10) / 10,
            reading: Math.round((sum.reading / n) * 10) / 10,
            writing: Math.round((sum.writing / n) * 10) / 10,
            grammar: Math.round((sum.grammar / n) * 10) / 10,
            vocabulary: Math.round((sum.vocabulary / n) * 10) / 10,
          };
        })();

  return { assessments, loading, error, addAssessment, averageScores };
}
