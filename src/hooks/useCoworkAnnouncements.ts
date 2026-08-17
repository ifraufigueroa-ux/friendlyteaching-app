// FriendlyTeaching.cl — useCoworkAnnouncements hook
// Tablón de avisos del equipo docente. Cualquier profe puede publicar,
// fijar/desfijar y marcar como leído.

'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  collection, doc, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, Timestamp,
  type QuerySnapshot, type DocumentData, type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { CoworkAnnouncement } from '@/types/firebase';

export function useCoworkAnnouncements(currentUid: string) {
  const [announcements, setAnnouncements] = useState<CoworkAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'coworkAnnouncements'),
      orderBy('createdAt', 'desc'),
    );
    const unsub = onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
      setAnnouncements(
        snap.docs.map(
          (d: QueryDocumentSnapshot<DocumentData>) =>
            ({ id: d.id, ...d.data() } as CoworkAnnouncement),
        ),
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  const createAnnouncement = useCallback(async (
    authorId: string,
    authorName: string,
    title: string,
    body: string,
  ) => {
    const t = title.trim();
    const b = body.trim();
    if (!t || !b || !authorId) return;
    await addDoc(collection(db, 'coworkAnnouncements'), {
      authorId,
      authorName,
      title: t,
      body: b,
      pinned: false,
      readBy: { [authorId]: Timestamp.now() },
      createdAt: Timestamp.now(),
    });
  }, []);

  const togglePin = useCallback(async (ann: CoworkAnnouncement) => {
    await updateDoc(doc(db, 'coworkAnnouncements', ann.id), {
      pinned: !ann.pinned,
      updatedAt: Timestamp.now(),
    });
  }, []);

  const markRead = useCallback(async (annId: string, uid: string) => {
    if (!uid) return;
    await updateDoc(doc(db, 'coworkAnnouncements', annId), {
      [`readBy.${uid}`]: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }, []);

  const removeAnnouncement = useCallback(async (annId: string) => {
    await deleteDoc(doc(db, 'coworkAnnouncements', annId));
  }, []);

  const { pinned, recent, unreadCount } = useMemo(() => {
    const pinnedList = announcements.filter((a) => a.pinned);
    const recentList = announcements.filter((a) => !a.pinned);
    const unread = announcements.filter(
      (a) => currentUid && !a.readBy?.[currentUid],
    ).length;
    return { pinned: pinnedList, recent: recentList, unreadCount: unread };
  }, [announcements, currentUid]);

  return {
    announcements, pinned, recent, unreadCount, loading,
    createAnnouncement, togglePin, markRead, removeAnnouncement,
  };
}
