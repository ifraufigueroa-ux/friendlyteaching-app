// FriendlyTeaching.cl — useCoworkChat hook
// Chat común del equipo docente (COWORK). Escucha en tiempo real la
// colección `coworkMessages` y expone helpers para enviar / editar /
// borrar mensajes propios.

'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  collection, doc, query, orderBy, limit as fbLimit, onSnapshot,
  addDoc, updateDoc, Timestamp,
  type QuerySnapshot, type DocumentData, type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { CoworkMessage } from '@/types/firebase';

export function useCoworkChat(pageSize = 200) {
  const [messages, setMessages] = useState<CoworkMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'coworkMessages'),
      orderBy('createdAt', 'asc'),
      fbLimit(pageSize),
    );
    const unsub = onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
      setMessages(
        snap.docs.map(
          (d: QueryDocumentSnapshot<DocumentData>) =>
            ({ id: d.id, ...d.data() } as CoworkMessage),
        ),
      );
      setLoading(false);
    });
    return unsub;
  }, [pageSize]);

  const sendMessage = useCallback(async (
    authorId: string,
    authorName: string,
    text: string,
    authorPhotoUrl?: string,
  ) => {
    const trimmed = text.trim();
    if (!trimmed || !authorId) return;
    // Extraer menciones @nombre — se guardan como strings normalizados
    // (lowercase, sin acentos) para permitir búsquedas futuras.
    const mentions = Array.from(
      trimmed.matchAll(/@([\p{L}0-9_-]+)/gu),
      (m) => m[1].toLowerCase(),
    );
    const payload: Record<string, unknown> = {
      authorId,
      authorName,
      text: trimmed,
      mentions,
      createdAt: Timestamp.now(),
    };
    if (authorPhotoUrl) payload.authorPhotoUrl = authorPhotoUrl;
    await addDoc(collection(db, 'coworkMessages'), payload);
  }, []);

  const editMessage = useCallback(async (msgId: string, newText: string) => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    await updateDoc(doc(db, 'coworkMessages', msgId), {
      text: trimmed,
      editedAt: Timestamp.now(),
    });
  }, []);

  const deleteMessage = useCallback(async (msgId: string) => {
    // Borrado suave: mantenemos el doc para no romper el hilo visual.
    await updateDoc(doc(db, 'coworkMessages', msgId), {
      text: '',
      deletedAt: Timestamp.now(),
    });
  }, []);

  return { messages, loading, sendMessage, editMessage, deleteMessage };
}
