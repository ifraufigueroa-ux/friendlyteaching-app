'use client';
// FriendlyTeaching.cl — Auth Provider
// Listens to Firebase auth state and populates Zustand store.
// Repairs a missing Firestore profile on login to prevent permanent lock-out.

import { useEffect } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { observeAuthState, getUserProfile } from '@/lib/firebase/auth';
import { useAuthStore } from '@/store/authStore';
import type { FTUser } from '@/types/firebase';

// Emails that always get role='teacher' regardless of Firestore state
const TEACHER_EMAILS = ['ifraufigueroa@gmail.com', 'aranxa.brunam@gmail.com'];

function buildFallbackProfile(user: { uid: string; email: string | null; displayName: string | null }): FTUser {
  const isTeacher = TEACHER_EMAILS.includes(user.email ?? '');
  return {
    uid: user.uid,
    email: user.email ?? '',
    fullName: user.displayName ?? (user.email?.split('@')[0] ?? 'Usuario'),
    role: isTeacher ? 'teacher' : 'student',
    status: isTeacher ? 'active' : 'pending',
    createdAt: null,
  } as unknown as FTUser;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setFirebaseUser, setProfile, setLoading, setInitialized, clearAuth } = useAuthStore();

  useEffect(() => {
    const unsubscribe = observeAuthState(async (user) => {
      setLoading(true);
      if (user) {
        setFirebaseUser(user);
        try {
          let profile = await getUserProfile(user.uid);

          // ── Profile repair ─────────────────────────────────────────────
          // Case 1: document is missing — create it with correct role.
          // Case 2: document exists but role is wrong (e.g. 'student' for a teacher email).
          const shouldBeTeacher = TEACHER_EMAILS.includes(user.email ?? '');
          const roleIsWrong = shouldBeTeacher && profile?.role !== 'teacher';

          if (!profile || roleIsWrong) {
            const isTeacher = shouldBeTeacher;
            const fallback = {
              uid: user.uid,
              email: user.email ?? '',
              fullName: user.displayName ?? (user.email?.split('@')[0] ?? 'Usuario'),
              phone: '',
              role: isTeacher ? 'teacher' as const : 'student' as const,
              status: isTeacher ? 'active' as const : 'pending' as const,
              timezone: 'America/Santiago',
              language: 'es',
              preferences: { emailNotifications: true },
              createdAt: serverTimestamp(),
            };
            try {
              await setDoc(doc(db, 'users', user.uid), fallback, { merge: true });
              profile = await getUserProfile(user.uid);
            } catch {
              // Firestore write blocked by rules — use in-memory fallback below
            }
          }

          // ── Last-resort in-memory fallback ─────────────────────────────
          // If Firestore is unreachable or rules are too restrictive,
          // construct a minimal usable profile so uid and role are always set.
          if (!profile) {
            profile = buildFallbackProfile(user);
          }

          setProfile(profile);
        } catch {
          // Even total Firestore failure — keep the user logged in with basic profile
          setProfile(buildFallbackProfile(user));
        }
      } else {
        clearAuth();
      }
      setLoading(false);
      setInitialized(true);
    });

    return unsubscribe;
  }, [setFirebaseUser, setProfile, setLoading, setInitialized, clearAuth]);

  return <>{children}</>;
}
