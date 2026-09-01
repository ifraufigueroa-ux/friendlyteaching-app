// FriendlyTeaching.cl — useCoworkChatUnread
// Cuenta mensajes del chat COWORK creados después de la última visita
// del usuario a la sección. La marca "última vista" vive en
// localStorage por dispositivo (no queremos escribir a Firestore por
// cada mensaje — el chat es de alta frecuencia).

'use client';
import { useEffect, useState } from 'react';
import {
  collection, query, orderBy, limit as fbLimit, onSnapshot,
  Timestamp,
  type QuerySnapshot, type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const STORAGE_KEY = 'cowork_chat_last_seen';

export function markCoworkChatSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    window.dispatchEvent(new Event('cowork-chat-seen'));
  } catch { /* ignore */ }
}

function readLastSeen(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch { return 0; }
}

export function useCoworkChatUnread(currentUid: string, pageSize = 50): number {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!currentUid) { setUnread(0); return; }

    let lastSeen = readLastSeen();
    // First visit ever: treat "now" as the baseline so we don't flag
    // historical messages as unread.
    if (!lastSeen) {
      lastSeen = Date.now();
      try { localStorage.setItem(STORAGE_KEY, String(lastSeen)); } catch { /* ignore */ }
    }

    const q = query(
      collection(db, 'coworkMessages'),
      orderBy('createdAt', 'desc'),
      fbLimit(pageSize),
    );

    let latestSeen = lastSeen;
    const recompute = (snap: QuerySnapshot<DocumentData>) => {
      let count = 0;
      for (const d of snap.docs) {
        const data = d.data() as { authorId?: string; createdAt?: Timestamp };
        const t = data.createdAt?.toMillis?.() ?? 0;
        if (t > latestSeen && data.authorId !== currentUid) count++;
      }
      setUnread(count);
    };

    const unsub = onSnapshot(q, recompute);

    // If the user marks the section as seen while this hook is mounted,
    // recompute against the new timestamp without waiting for a new snapshot.
    const onSeen = () => {
      latestSeen = readLastSeen();
      setUnread(0);
    };
    window.addEventListener('cowork-chat-seen', onSeen);
    window.addEventListener('storage', onSeen);

    return () => {
      unsub();
      window.removeEventListener('cowork-chat-seen', onSeen);
      window.removeEventListener('storage', onSeen);
    };
  }, [currentUid, pageSize]);

  return unread;
}
