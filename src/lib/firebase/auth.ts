// FriendlyTeaching.cl — Auth Service Functions (Modular Firebase SDK)
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  type User,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './config';
import type { FTUser, UserRole } from '@/types/firebase';

const HARDCODED_TEACHER_EMAILS = [
  'ifraufigueroa@gmail.com',
  'aranxa.brunam@gmail.com',
];

// Audit 2026-11-23 C1: the teacher signup code used to live in
// NEXT_PUBLIC_TEACHER_CODE, which shipped in the browser bundle. Any
// visitor could grep the JS, grab the string and self-register as
// teacher. The real check is now behind the /api/auth/claim-teacher-role
// endpoint, which validates against the server-only TEACHER_SIGNUP_CODE
// env var and uses the Admin SDK to promote the user doc.

export async function signIn(email: string, password: string) {
  return await signInWithEmailAndPassword(auth, email, password);
}

/**
 * Returns true if the given email is registered exclusively via Google
 * (i.e. no password credential is linked). Used to show a targeted error
 * message when email/password login fails for a Google-linked account.
 */
export async function isGoogleOnlyAccount(email: string): Promise<boolean> {
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    return methods.length > 0 && !methods.includes('password');
  } catch {
    return false;
  }
}

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  teacherCode?: string;
}

export async function signUp({ email, password, fullName, phone, teacherCode }: SignUpData) {
  // Always create as 'student'; the teacher promotion happens via the
  // server endpoint below so the code never ships in the browser bundle
  // and client-side Firestore rules can block any direct role='teacher'
  // write. See audit [[audit-C1]].
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const { uid } = userCredential.user;

  const userData: Record<string, unknown> = {
    uid,
    email,
    fullName,
    phone: phone ?? '',
    role: 'student' as UserRole,
    status: 'pending',
    timezone: 'America/Santiago',
    language: 'es',
    preferences: { emailNotifications: true },
    createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'users', uid), userData);

  // If they typed a teacher code, ask the server whether it matches
  // the private one. The endpoint uses the Admin SDK to flip the
  // role → 'teacher' / status → 'active'. On a wrong code it 403s
  // and the account stays a pending student.
  let finalRole: UserRole = 'student';
  if (teacherCode && teacherCode.trim()) {
    try {
      const idToken = await userCredential.user.getIdToken();
      const res = await fetch('/api/auth/claim-teacher-role', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ idToken, teacherCode: teacherCode.trim() }),
      });
      if (res.ok) {
        finalRole = 'teacher';
        // Force-refresh the token so downstream calls see any custom
        // claims the server may have set later.
        await userCredential.user.getIdToken(true);
      }
    } catch (err) {
      console.warn('[signUp] teacher-code check failed:', err);
    }
  }

  if (finalRole === 'student') {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://friendlyteaching.cl';
    await sendEmailVerification(userCredential.user, {
      url: `${appUrl}/auth/login?activated=1`,
      handleCodeInApp: false,
    });
  }

  return { user: userCredential.user, role: finalRole };
}

export async function logOut() {
  return await signOut(auth);
}

export async function resetPassword(email: string) {
  return await sendPasswordResetEmail(auth, email);
}

export async function getUserProfile(uid: string): Promise<FTUser | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as FTUser) : null;
}

export function observeAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function signInWithGoogle(): Promise<{ user: User; role: UserRole; isNewUser: boolean }> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  const { user } = result;

  const existingProfile = await getUserProfile(user.uid);

  if (!existingProfile) {
    const isTeacher = HARDCODED_TEACHER_EMAILS.includes(user.email?.toLowerCase() ?? '');
    const role: UserRole = isTeacher ? 'teacher' : 'student';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userData: Record<string, any> = {
      uid: user.uid,
      email: user.email ?? '',
      fullName: user.displayName ?? '',
      phone: '',
      role,
      status: isTeacher ? 'active' : 'pending',
      timezone: 'America/Santiago',
      language: 'es',
      preferences: { emailNotifications: true },
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', user.uid), userData);
    return { user, role, isNewUser: true };
  }

  return { user, role: existingProfile.role, isNewUser: false };
}
