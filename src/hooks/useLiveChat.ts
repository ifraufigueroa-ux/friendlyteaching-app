// FriendlyTeaching.cl — useLiveChat hook
// Real-time chat/Q&A for live class sessions.

'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  collection, doc, query, where, orderBy, onSnapshot,
  addDoc, updateDoc, Timestamp,
  QuerySnapshot, DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { ChatMessage } from '@/types/firebase';

export function useLiveChat(sessionId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }
    const q = query(
      collection(db, 'liveChat'),
      where('sessionId', '==', sessionId),
      orderBy('createdAt', 'asc'),
    );
    const unsub = onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
      setMessages(snap.docs.map((d: { id: string; data: () => DocumentData }) => ({ id: d.id, ...d.data() } as ChatMessage)));
      setLoading(false);
    });
    return unsub;
  }, [sessionId]);

  const sendMessage = useCallback(async (
    authorId: string,
    authorName: string,
    authorRole: 'teacher' | 'student',
    text: string,
    isQuestion = false,
  ) => {
    if (!sessionId || !text.trim()) return;
    await addDoc(collection(db, 'liveChat'), {
      sessionId,
      authorId,
      authorName,
      authorRole,
      text: text.trim(),
      isQuestion,
      isAnswered: false,
      isPinned: false,
      createdAt: Timestamp.now(),
    });
  }, [sessionId]);

  const markAnswered = useCallback(async (msgId: string) => {
    await updateDoc(doc(db, 'liveChat', msgId), { isAnswered: true });
  }, []);

  const togglePin = useCallback(async (msgId: string, pinned: boolean) => {
    await updateDoc(doc(db, 'liveChat', msgId), { isPinned: !pinned });
  }, []);

  // Derived: unanswered questions
  const questions = messages.filter((m) => m.isQuestion);
  const unansweredCount = questions.filter((m) => !m.isAnswered).length;

  return { messages, questions, unansweredCount, loading, sendMessage, markAnswered, togglePin };
}
