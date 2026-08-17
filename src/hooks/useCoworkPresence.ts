// FriendlyTeaching.cl — useCoworkPresence hook
// Presencia en vivo del equipo docente. Cada profe hace heartbeat cada
// 30 s escribiendo su propio doc en `coworkPresence`. Consideramos online
// si `lastSeen` está dentro de los últimos 60 s.

'use client';
import { useEffect, useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import {
  collection, doc, onSnapshot, setDoc, serverTimestamp, Timestamp,
  type QuerySnapshot, type DocumentData, type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { CoworkPresence } from '@/types/firebase';

const HEARTBEAT_MS   = 30_000;
const ONLINE_WINDOW  = 60_000; // < 60 s desde lastSeen => online

export function useCoworkPresence(
  uid: string,
  fullName: string,
  photoUrl?: string,
) {
  const [presences, setPresences] = useState<CoworkPresence[]>([]);
  const pathname = usePathname();

  // Suscripción a todos los docs de presencia
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'coworkPresence'),
      (snap: QuerySnapshot<DocumentData>) => {
        setPresences(
          snap.docs.map(
            (d: QueryDocumentSnapshot<DocumentData>) =>
              ({ id: d.id, ...d.data() } as CoworkPresence),
          ),
        );
      },
    );
    return unsub;
  }, []);

  // Heartbeat propio — solo si tenemos uid.
  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, 'coworkPresence', uid);

    const beat = () => {
      const payload: Record<string, unknown> = {
        uid,
        fullName,
        lastSeen: serverTimestamp(),
        currentPath: pathname ?? '',
      };
      if (photoUrl) payload.photoUrl = photoUrl;
      // merge=true para no pisar campos futuros (ej. status manual)
      setDoc(ref, payload, { merge: true }).catch(() => {
        // Silencioso: la vista sigue funcionando aunque falle el heartbeat.
      });
    };

    beat();
    const interval = setInterval(beat, HEARTBEAT_MS);
    // Al desmontar/cerrar pestaña, marcamos lastSeen inmediatamente para
    // que otros vean el drop más rápido.
    const onHide = () => beat();
    document.addEventListener('visibilitychange', onHide);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [uid, fullName, photoUrl, pathname]);

  const onlineNow = useMemo(() => {
    const cutoff = Date.now() - ONLINE_WINDOW;
    return presences.filter((p) => {
      const ts = (p.lastSeen as Timestamp | undefined)?.toMillis?.() ?? 0;
      return ts >= cutoff;
    });
  }, [presences]);

  return { presences, onlineNow };
}
