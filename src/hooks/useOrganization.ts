// FriendlyTeaching.cl — useOrganization
//
// Resolves the organization doc for the currently signed-in corporate
// admin. Returns null while loading or if the user isn't attached to an
// org. Also exposes a hook to fetch an org by id (used by the teacher
// admin tooling later).

'use client';
import { useEffect, useState } from 'react';
import { doc, onSnapshot, type DocumentSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { useAuthStore } from '@/store/authStore';
import type { Organization } from '@/types/organization';
import type { FTUser } from '@/types/firebase';

/**
 * Live subscription to the organization the current corporate admin
 * belongs to. Resolves via `profile.corporateData.organizationId`.
 */
export function useMyOrganization() {
  const { profile } = useAuthStore();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  // Fallback auth guard — same pattern as our other hooks: don't trust
  // the Zustand store alone, we still want this to render correctly on
  // first paint before the profile has hydrated.
  const [uid, setUid] = useState<string>(() => auth.currentUser?.uid ?? '');
  useEffect(() => onAuthStateChanged(auth, (u) => setUid(u?.uid ?? '')), []);

  const orgId = profile?.corporateData?.organizationId ?? null;

  useEffect(() => {
    if (!uid || !orgId) {
      setOrg(null);
      setLoading(false);
      return;
    }
    const ref = doc(db, 'organizations', orgId);
    const unsub = onSnapshot(ref, (snap: DocumentSnapshot) => {
      if (snap.exists()) {
        setOrg({ id: snap.id, ...snap.data() } as Organization);
      } else {
        setOrg(null);
      }
      setLoading(false);
    }, (err: Error) => {
      console.warn('[useMyOrganization] listener error:', err.message);
      setLoading(false);
    });
    return unsub;
  }, [uid, orgId]);

  return { org, loading, isCorporateAdmin: profile?.role === 'corporate' };
}

/**
 * Fetches a specific organization once (not real-time). Used by teacher-
 * side admin tools that only need a snapshot.
 */
export function useOrganization(orgId: string | null | undefined) {
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) {
      setOrg(null);
      setLoading(false);
      return;
    }
    const ref = doc(db, 'organizations', orgId);
    const unsub = onSnapshot(ref, (snap: DocumentSnapshot) => {
      if (snap.exists()) {
        setOrg({ id: snap.id, ...snap.data() } as Organization);
      } else {
        setOrg(null);
      }
      setLoading(false);
    }, (err: Error) => {
      console.warn('[useOrganization] listener error:', err.message);
      setLoading(false);
    });
    return unsub;
  }, [orgId]);

  return { org, loading };
}

/** Convenience: resolves a user's FTUser doc from its uid. */
export function useUserProfile(uid: string | null | undefined) {
  const [user, setUser] = useState<FTUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setUser(null);
      setLoading(false);
      return;
    }
    const ref = doc(db, 'users', uid);
    const unsub = onSnapshot(ref, (snap: DocumentSnapshot) => {
      if (snap.exists()) {
        setUser({ uid: snap.id, ...snap.data() } as FTUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [uid]);

  return { user, loading };
}
