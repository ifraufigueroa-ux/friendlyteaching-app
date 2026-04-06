// FriendlyTeaching.cl — useLivePolls hook
// Real-time poll management for live class sessions.

'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  collection, doc, query, where, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, Timestamp,
  QuerySnapshot, DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { LivePoll, PollOption, PollType } from '@/types/firebase';

// ── Teacher: manage polls for a session ────────────────────────

export function useTeacherPolls(sessionId: string | undefined) {
  const [polls, setPolls] = useState<LivePoll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }
    const q = query(
      collection(db, 'livePolls'),
      where('sessionId', '==', sessionId),
      orderBy('createdAt', 'desc'),
    );
    const unsub = onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
      setPolls(snap.docs.map((d: { id: string; data: () => DocumentData }) => ({ id: d.id, ...d.data() } as LivePoll)));
      setLoading(false);
    });
    return unsub;
  }, [sessionId]);

  const createPoll = useCallback(async (
    teacherId: string,
    question: string,
    type: PollType,
    options: PollOption[],
    correctOptionId?: string,
  ) => {
    if (!sessionId) return;
    await addDoc(collection(db, 'livePolls'), {
      sessionId,
      teacherId,
      question,
      type,
      options,
      correctOptionId: correctOptionId ?? null,
      isActive: true,
      showResults: false,
      responses: {},
      createdAt: Timestamp.now(),
    });
  }, [sessionId]);

  const closePoll = useCallback(async (pollId: string) => {
    await updateDoc(doc(db, 'livePolls', pollId), {
      isActive: false,
      closedAt: Timestamp.now(),
    });
  }, []);

  const toggleResults = useCallback(async (pollId: string, show: boolean) => {
    await updateDoc(doc(db, 'livePolls', pollId), { showResults: show });
  }, []);

  const deletePoll = useCallback(async (pollId: string) => {
    await deleteDoc(doc(db, 'livePolls', pollId));
  }, []);

  const activePoll = polls.find((p) => p.isActive);

  return { polls, activePoll, loading, createPoll, closePoll, toggleResults, deletePoll };
}

// ── Student: view active poll and submit response ──────────────

export function useStudentPoll(sessionId: string | undefined) {
  const [activePoll, setActivePoll] = useState<LivePoll | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }
    const q = query(
      collection(db, 'livePolls'),
      where('sessionId', '==', sessionId),
      where('isActive', '==', true),
    );
    const unsub = onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
      const active = snap.docs.map((d: { id: string; data: () => DocumentData }) => ({ id: d.id, ...d.data() } as LivePoll));
      setActivePoll(active[0] ?? null);
      setLoading(false);
    });
    return unsub;
  }, [sessionId]);

  const submitResponse = useCallback(async (pollId: string, studentUid: string, response: string) => {
    await updateDoc(doc(db, 'livePolls', pollId), {
      [`responses.${studentUid}`]: response,
    });
  }, []);

  return { activePoll, loading, submitResponse };
}
