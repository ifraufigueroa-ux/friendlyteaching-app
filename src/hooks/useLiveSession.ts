// FriendlyTeaching.cl — Live Session hooks
'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
  startLiveSession,
  endLiveSession,
  updateTeacherCanvas,
  setStudentAnnotationsEnabled,
  updateStudentCanvas,
  subscribeToLiveSession,
  subscribeToStudentActiveSessions,
} from '@/lib/firebase/liveSessions';
import type { LiveSession } from '@/types/firebase';
import { createDeltaSync, type CanvasSyncState, type SyncStatus } from '@/lib/utils/canvasSync';

// ── Teacher hook ───────────────────────────────────────────────

/**
 * Used inside PresentationProjector (teacher mode) to manage a live session.
 * lessonId acts as the session document key.
 */
export function useTeacherLiveSession(lessonId: string) {
  const { profile } = useAuthStore();
  const teacherId = profile?.uid ?? '';

  const [session, setSession] = useState<LiveSession | null>(null);
  const [loading, setLoading]  = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('connected');
  const [syncState, setSyncState] = useState<CanvasSyncState>({
    status: 'connected', lastSyncAt: 0, pendingFrames: 0, bytesSaved: 0,
  });

  // Delta sync manager
  const deltaSyncRef = useRef<ReturnType<typeof createDeltaSync> | null>(null);

  useEffect(() => {
    if (!lessonId) { setLoading(false); return; }
    const unsub = subscribeToLiveSession(lessonId, (s: LiveSession | null) => {
      setSession(s);
      setLoading(false);
    });
    return unsub;
  }, [lessonId]);

  // Initialize delta sync when session becomes active
  useEffect(() => {
    if (!lessonId || !session?.active) {
      if (deltaSyncRef.current) {
        deltaSyncRef.current.destroy();
        deltaSyncRef.current = null;
      }
      return;
    }

    const deltaSync = createDeltaSync(
      async (dataUrl: string) => {
        await updateTeacherCanvas(lessonId, dataUrl);
      },
      500, // throttle ms
    );

    deltaSync.setStatusListener((state: CanvasSyncState) => {
      setSyncStatus(state.status);
      setSyncState(state);
    });

    deltaSyncRef.current = deltaSync;

    return () => {
      deltaSync.destroy();
    };
  }, [lessonId, session?.active]);

  /** Start a new live session inviting the given student IDs. */
  const start = useCallback(async (
    studentIds: string[],
    lessonTitle: string,
    presentationUrl: string,
  ) => {
    if (!teacherId || !lessonId) return;
    await startLiveSession({ lessonId, teacherId, lessonTitle, presentationUrl, studentIds });
  }, [lessonId, teacherId]);

  /** End the current session. */
  const end = useCallback(async () => {
    if (!lessonId) return;
    await endLiveSession(lessonId);
  }, [lessonId]);

  /** Toggle whether students can annotate. */
  const toggleStudentAnnotations = useCallback(async () => {
    if (!lessonId || !session) return;
    await setStudentAnnotationsEnabled(lessonId, !session.studentAnnotationsEnabled);
  }, [lessonId, session]);

  /**
   * Improved canvas sync using delta encoding + compression.
   * Accepts raw canvas element for optimal compression.
   * Falls back to dataUrl string for backward compatibility.
   */
  const syncCanvas = useCallback((canvasOrDataUrl: HTMLCanvasElement | string) => {
    if (!lessonId || !session?.active) return;

    if (typeof canvasOrDataUrl === 'string') {
      // Legacy: direct dataUrl. Use old throttle approach as fallback.
      updateTeacherCanvas(lessonId, canvasOrDataUrl).catch(() => {});
      return;
    }

    // New: delta sync with compression
    if (deltaSyncRef.current) {
      deltaSyncRef.current.sync(canvasOrDataUrl);
    }
  }, [lessonId, session?.active]);

  return {
    session,
    loading,
    isLive: session?.active === true,
    syncStatus,
    syncState,
    start,
    end,
    toggleStudentAnnotations,
    syncCanvas,
  };
}

// ── Student hook — active sessions discovery (dashboard banner) ──

/**
 * Returns any live sessions currently active for this student.
 * Used on the student dashboard to show the "join live class" banner.
 */
export function useStudentActiveSessions() {
  const { firebaseUser } = useAuthStore();
  const studentId = firebaseUser?.uid ?? '';

  const [activeSessions, setActiveSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) { setLoading(false); return; }
    const unsub = subscribeToStudentActiveSessions(studentId, (sessions) => {
      setActiveSessions(sessions);
      setLoading(false);
    });
    return unsub;
  }, [studentId]);

  return { activeSessions, loading };
}

// ── Student hook — single session (live view page) ─────────────

/**
 * Subscribes to one live session for the student's live view page.
 * Also provides throttled student canvas sync.
 */
export function useStudentLiveSession(lessonId: string) {
  const { firebaseUser } = useAuthStore();
  const studentId = firebaseUser?.uid ?? '';

  const [session, setSession] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Throttle refs for student canvas sync
  const syncTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncTimeRef = useRef<number>(0);
  const pendingDataRef  = useRef<string>('');

  useEffect(() => {
    if (!lessonId) { setLoading(false); return; }
    const unsub = subscribeToLiveSession(lessonId, (s) => {
      setSession(s);
      setLoading(false);
    });
    return unsub;
  }, [lessonId]);

  /** Throttled sync of student's own annotation canvas. */
  const syncCanvas = useCallback((canvasDataUrl: string) => {
    if (!lessonId || !studentId || !session?.studentAnnotationsEnabled) return;
    pendingDataRef.current = canvasDataUrl;

    const now = Date.now();
    const elapsed = now - lastSyncTimeRef.current;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);

    if (elapsed >= 500) {
      lastSyncTimeRef.current = now;
      updateStudentCanvas(lessonId, studentId, canvasDataUrl).catch(() => {});
    } else {
      syncTimerRef.current = setTimeout(() => {
        lastSyncTimeRef.current = Date.now();
        updateStudentCanvas(lessonId, studentId, pendingDataRef.current).catch(() => {});
      }, 500 - elapsed);
    }
  }, [lessonId, studentId, session?.studentAnnotationsEnabled]);

  const isAssigned = session?.assignedStudents?.includes(studentId) ?? false;

  return { session, loading, isAssigned, syncCanvas, studentId };
}
