// FriendlyTeaching.cl — Corporate change requests
//
// Lets a Master Account admin raise a request (move someone to another
// group, re-run placement, or swap an employee out) and lets the
// teacher-side view that same queue once it's built. Phase 1 just
// writes/reads the queue; approving / declining is a later pass.

'use client';
import { useEffect, useState } from 'react';
import {
  addDoc, collection, onSnapshot, serverTimestamp,
  type QuerySnapshot, type DocumentData, type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { ChangeRequest, ChangeRequestType } from '@/types/organization';

/** Live list of pending + resolved requests for one org. Newest first. */
export function useChangeRequests(orgId: string | null | undefined) {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) { setRequests([]); setLoading(false); return; }
    const ref = collection(db, 'organizations', orgId, 'changeRequests');
    const unsub = onSnapshot(ref,
      (snap: QuerySnapshot<DocumentData>) => {
        const list = snap.docs.map(
          (d: QueryDocumentSnapshot<DocumentData>) =>
            ({ id: d.id, ...d.data() } as ChangeRequest),
        );
        list.sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? 0;
          const tb = b.createdAt?.toMillis?.() ?? 0;
          return tb - ta;
        });
        setRequests(list);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [orgId]);

  return { requests, loading };
}

/** Inputs the modal passes through. Null-able fields are only required
 *  for `change-group`; the others ignore them. */
export interface CreateChangeRequestInput {
  orgId:            string;
  type:             ChangeRequestType;
  studentUid:       string;
  studentName:      string;
  currentGroupId:   string | null;
  currentGroupName: string | null;
  targetGroupId?:   string | null;
  targetGroupName?: string | null;
  note:             string;
  createdByUid:     string;
  createdByName:    string;
}

export async function createChangeRequest(input: CreateChangeRequestInput): Promise<string> {
  const ref = await addDoc(
    collection(db, 'organizations', input.orgId, 'changeRequests'),
    {
      orgId:           input.orgId,
      type:            input.type,
      studentUid:      input.studentUid,
      studentName:     input.studentName,
      currentGroupId:  input.currentGroupId,
      currentGroupName:input.currentGroupName,
      targetGroupId:   input.targetGroupId ?? null,
      targetGroupName: input.targetGroupName ?? null,
      note:            input.note,
      status:          'pending',
      createdByUid:    input.createdByUid,
      createdByName:   input.createdByName,
      createdAt:       serverTimestamp(),
    },
  );
  return ref.id;
}

/** Human-readable label for each request type — used across the UI. */
export const CHANGE_REQUEST_LABELS: Record<ChangeRequestType, { title: string; verb: string; emoji: string }> = {
  'change-group': { title: 'Cambio de grupo',           verb: 'mover',       emoji: '🔀' },
  'reevaluation': { title: 'Solicitar reevaluación',    verb: 'reevaluar',   emoji: '📝' },
  'replacement':  { title: 'Reemplazar estudiante',     verb: 'reemplazar',  emoji: '🔁' },
};

