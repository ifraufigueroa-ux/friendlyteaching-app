// FriendlyTeaching.cl — Auth Service Functions (Modular Firebase SDK)
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
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

const TEACHER_CODE = process.env.NEXT_PUBLIC_TEACHER_CODE ?? 'FT-PROFESOR-2026';

export async function signIn(email: string, password: string) {
  return await signInWithEmailAndPassword(auth, email, password);
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
