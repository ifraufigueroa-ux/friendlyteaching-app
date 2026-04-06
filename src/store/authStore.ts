// FriendlyTeaching.cl — Auth Store (Zustand)
import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { FTUser, UserRole } from '@/types/firebase';

interface AuthState {
  firebaseUser: User | null;
  profile: FTUser | null;
  role: UserRole | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  setFirebaseUser: (user: User | null) => void;
  setProfile: (profile: FTUser | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  profile: null,
  role: null,
  isLoading: true,
  isInitialized: false,
  error: null,

  setFirebaseUser: (user) => set({ firebaseUser: user }),
  setProfile: (profile) => set({ profile, role: profile?.role ?? null }),
  setLoading: (isLoading) => set({ isLoading }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  setError: (error) => set({ error }),
  clearAuth: () => set({ firebaseUser: null, profile: null, role: null, error: null }),
}));
