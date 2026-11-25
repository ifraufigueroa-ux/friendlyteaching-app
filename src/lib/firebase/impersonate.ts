// FriendlyTeaching.cl — Teacher-to-student impersonation (client side)
//
// Flow:
//   1. Teacher clicks "Login as" next to a student on the Students page.
//   2. We POST /api/students/impersonate with the teacher's id token and
//      the target studentId. The server validates both and returns a
//      Firebase custom token for the student.
//   3. We remember the teacher's email in sessionStorage so the
//      ImpersonationBanner can offer a one-tap "Return to your account"
//      that lands back on the login page with the field prefilled.
//   4. We sign the teacher out and signInWithCustomToken as the student.
//   5. The AuthProvider picks up the new user; a global banner shows
//      the teacher that they are impersonating.
//
// The teacher never sees the student's password. The student's data is
// read under the student's own uid, so Firestore rules enforce the same
// permissions the student would have.

'use client';

import { signInWithCustomToken, signOut } from 'firebase/auth';
import { auth } from './config';

/** sessionStorage key — the teacher's email the moment they entered
 *  impersonation mode. Read by ImpersonationBanner to prefill login. */
export const IMPERSONATION_PARENT_EMAIL_KEY = 'ft-impersonation:parentEmail';

export async function impersonateStudent(input: {
  studentId: string;
}): Promise<{ studentName: string; studentEmail: string }> {
  const current = auth.currentUser;
  if (!current) throw new Error('No teacher session — reinicia sesión y volvé a intentar.');

  // Capture the teacher's own email before we burn the session so the
  // banner can prefill the login page when they exit.
  const parentEmail = current.email ?? '';

  const idToken = await current.getIdToken();
  const res = await fetch('/api/students/impersonate', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ idToken, studentId: input.studentId }),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error ?? `impersonation failed (${res.status})`);
  }
  const { customToken, studentName, studentEmail } = payload as {
    customToken:  string;
    studentName:  string;
    studentEmail: string;
  };

  // Remember who to return to — must happen BEFORE signOut so the
  // session value survives the auth state swap.
  try {
    if (parentEmail) {
      window.sessionStorage.setItem(IMPERSONATION_PARENT_EMAIL_KEY, parentEmail);
    }
  } catch { /* ignore */ }

  await signOut(auth);
  await signInWithCustomToken(auth, customToken);

  return { studentName, studentEmail };
}

/** Called by the banner's "Return to your account" button. Clears the
 *  impersonation session and sends the teacher back to the login page
 *  with their email prefilled. */
export async function endImpersonation(): Promise<void> {
  let parentEmail = '';
  try {
    parentEmail = window.sessionStorage.getItem(IMPERSONATION_PARENT_EMAIL_KEY) ?? '';
  } catch { /* ignore */ }
  try {
    window.sessionStorage.removeItem(IMPERSONATION_PARENT_EMAIL_KEY);
  } catch { /* ignore */ }
  await signOut(auth);
  const url = parentEmail
    ? `/auth/login?email=${encodeURIComponent(parentEmail)}`
    : '/auth/login';
  window.location.replace(url);
}

/** Reads the current session's id token and returns the impersonation
 *  claims on it, if any. Used by the banner to decide whether to show. */
export async function readImpersonationClaims(): Promise<{
  impersonatedBy:      string | null;
  impersonatedByEmail: string | null;
  impersonatedByName:  string | null;
} | null> {
  const u = auth.currentUser;
  if (!u) return null;
  try {
    const t = await u.getIdTokenResult();
    const claims = t.claims as Record<string, unknown>;
    const by = typeof claims.impersonatedBy === 'string' ? claims.impersonatedBy : null;
    if (!by) return null;
    return {
      impersonatedBy:      by,
      impersonatedByEmail: typeof claims.impersonatedByEmail === 'string' ? claims.impersonatedByEmail : null,
      impersonatedByName:  typeof claims.impersonatedByName  === 'string' ? claims.impersonatedByName  : null,
    };
  } catch {
    return null;
  }
}
