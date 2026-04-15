// FriendlyTeaching.cl — Auth Service Functions (Modular Firebase SDK)
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
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

const TEACHER_CODE = process.env.NEXT_PUBLIC_TEACHER_CODE ?? 'FT-PROFESOR-2026';

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
  const isTeacher = teacherCode === TEACHER_CODE;
  const role: UserRole = isTeacher ? 'teacher' : 'student';

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const { uid } = userCredential.user;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userData: Record<string, any> = {
    uid,
    email,
    fullName,
    phone: phone ?? '',
    role,
    status: isTeacher ? 'active' : 'pending',
    timezone: 'America/Santiago',
    language: 'es',
    preferences: { emailNotifications: true },
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'users', uid), userData);
  return { user: userCredential.user, role };
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
