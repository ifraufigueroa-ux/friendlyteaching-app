// FriendlyTeaching.cl — Weekly IELTS Academic types
//
// A teacher assigns a student a WeeklyIeltsAssignment. The student then
// works through a rotating series of Academic mocks, one module at a
// time (Listening → Reading → Writing → Speaking), on a cadence picked
// at assignment time. When all 4 modules of the current mock are done,
// a "Request new Mock" button serves the next mock from
// mockRotation[]; once the rotation is exhausted it cycles back.
//
// Keeps the student's work tight to what the teacher assigned, and
// mirrors the shape of PracticeProgress so the two features feel
// consistent in the student dashboard.

import type { Timestamp } from 'firebase/firestore';

// ── Intensity + plan shape ──────────────────────────────────

/** Intensity determines the suggested cadence per module. The actual
 *  gating is teacher-driven, but the UI uses this to say "finish in a
 *  week" vs "finish in a month". Pure UX today. */
export const WEEKLY_IELTS_INTENSITIES = ['relaxed', 'regular', 'intensive'] as const;
export type WeeklyIeltsIntensity = typeof WEEKLY_IELTS_INTENSITIES[number];

/** How we present the schedule to the student. */
export const WEEKLY_IELTS_PLAN_SHAPES = ['weekly', 'monthly'] as const;
export type WeeklyIeltsPlanShape = typeof WEEKLY_IELTS_PLAN_SHAPES[number];

/** The 4 IELTS Academic modules — keep these keys stable, the
 *  modulesCompleted map uses them verbatim. */
export const WEEKLY_IELTS_MODULES = ['listening', 'reading', 'writing', 'speaking'] as const;
export type WeeklyIeltsModule = typeof WEEKLY_IELTS_MODULES[number];

// ── Firestore shape ─────────────────────────────────────────

/** Per-mock completion state. Each module key gets a Timestamp when
 *  the student marks that module done. */
export interface WeeklyIeltsMockProgress {
  mockId:   string;
  startedAt: Timestamp | null;
  modulesCompleted: Partial<Record<WeeklyIeltsModule, Timestamp>>;
  completedAt?: Timestamp;
}

/** One document per (teacher, student) in `weeklyIeltsAssignments`.
 *  A student can have only one active assignment at a time (we overwrite
 *  on re-assignment for now; later we can archive old ones). */
export interface WeeklyIeltsAssignment {
  id?: string;
  studentId: string;
  teacherId: string;
  // Chosen at assignment time, can change later.
  intensity: WeeklyIeltsIntensity;
  planShape: WeeklyIeltsPlanShape;
  // Ordered list of mock IDs to serve. The next-mock button walks this
  // array and cycles back to index 0 at the end.
  mockRotation: string[];
  // Index into mockRotation[] of the mock the student is currently on.
  currentMockIndex: number;
  // Live state for the currently-visible mock. Reset when the student
  // asks for a new mock.
  currentMock: WeeklyIeltsMockProgress;
  // History of completed mocks, newest first. Includes scores if the
  // simulator wrote any back.
  completedMocks: Array<{
    mockId: string;
    startedAt?: Timestamp;
    completedAt: Timestamp;
    scores?: Partial<Record<WeeklyIeltsModule, number>>;
  }>;
  // When the teacher originally created the assignment. Never changes.
  assignedAt: Timestamp;
  updatedAt: Timestamp;
  // Soft-archival so the student's sidebar entry drops without losing
  // the history.
  status: 'active' | 'paused' | 'archived';
}

// ── UI helpers ──────────────────────────────────────────────

export const INTENSITY_LABEL: Record<WeeklyIeltsIntensity, string> = {
  relaxed:   'Relaxed',
  regular:   'Regular',
  intensive: 'Intensive',
};

export const INTENSITY_BLURB: Record<WeeklyIeltsIntensity, string> = {
  relaxed:   '1 module per week · finish a mock in a month',
  regular:   '2 modules per week · finish a mock in two weeks',
  intensive: '4 modules per week · finish a mock each week',
};

export const MODULE_LABEL: Record<WeeklyIeltsModule, string> = {
  listening: 'Listening',
  reading:   'Reading',
  writing:   'Writing',
  speaking:  'Speaking',
};

export function isMockComplete(mock: WeeklyIeltsMockProgress): boolean {
  return WEEKLY_IELTS_MODULES.every((m) => !!mock.modulesCompleted[m]);
}

export function completedModuleCount(mock: WeeklyIeltsMockProgress): number {
  return WEEKLY_IELTS_MODULES.filter((m) => !!mock.modulesCompleted[m]).length;
}
