// FriendlyTeaching.cl — useLeads hook
'use client';
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, doc, updateDoc, deleteDoc, serverTimestamp,
  type QuerySnapshot, type DocumentData, type QueryDocumentSnapshot,
  type FirestoreError, type Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export type LeadStatus = 'new' | 'contacted' | 'trial' | 'converted' | 'lost';
export type LeadSource = 'whatsapp' | 'instagram' | 'referral' | 'web' | 'other';

export interface Lead {
  id: string;
  teacherId: string;
  fullName: string;
  email?: string;
  phone?: string;
  source: LeadSource;
  status: LeadStatus;
  notes?: string;
  interestedIn?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  contactedAt?: Timestamp;
  convertedAt?: Timestamp;
}

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let stopFn: (() => void) | null = null;

    function startQuery(uid: string) {
      if (!mounted) return;
      setLoading(true);
      setError(null);

      const q = query(
        collection(db, 'leads'),
        where('teacherId', '==', uid),
        orderBy('createdAt', 'desc'),
      );

      const unsub = onSnapshot(
        q,
        (snap: QuerySnapshot<DocumentData>) => {
          if (!mounted) return;
          const rows = snap.docs.map(
            (d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as Lead),
          );
          setLeads(rows);
          setLoading(false);
        },
        (err: FirestoreError) => {
          if (!mounted) return;
          console.error('[useLeads]', err.code, err.message);
          // Missing index or empty collection → surface empty state, not a hard error
          if (err.code === 'failed-precondition' || err.code === 'permission-denied') {
            setLeads([]);
          } else {
            setError(`Error al cargar leads: ${err.code}`);
          }
          setLoading(false);
        },
      );
      stopFn = unsub;
    }

    const auth = getAuth();
    if (auth.currentUser) {
      startQuery(auth.currentUser.uid);
    } else {
      const authUnsub = onAuthStateChanged(auth, (user) => {
        if (!mounted) return;
        if (user) {
          authUnsub();
          startQuery(user.uid);
        } else {
          setTimeout(() => {
            if (!mounted) return;
            authUnsub();
            setLoading(false);
          }, 2_000);
        }
      });
      stopFn = authUnsub;
    }

    return () => {
      mounted = false;
      stopFn?.();
    };
  }, []);

  return { leads, loading, error };
}

export async function createLead(input: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) {
  const ref = await addDoc(collection(db, 'leads'), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
  const updates: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  };
  if (status === 'contacted') updates.contactedAt = serverTimestamp();
  if (status === 'converted') updates.convertedAt = serverTimestamp();
  await updateDoc(doc(db, 'leads', id), updates);
}

export async function updateLead(id: string, patch: Partial<Omit<Lead, 'id'>>) {
  await updateDoc(doc(db, 'leads', id), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteLead(id: string) {
  await deleteDoc(doc(db, 'leads', id));
}
