// FriendlyTeaching.cl — Organization types
//
// A corporate "Master Account": a company buys the service for N
// employees, and one or more corporate admins get a dashboard to monitor
// the whole group's progress without the teacher having to send manual
// reports.
//
// Data model is intentionally thin — the roster and admin lists are
// stored as uid arrays on the organization doc. For a 40-person company
// that fits comfortably in one Firestore read.

import type { Timestamp } from 'firebase/firestore';
import type { LessonLevel } from './firebase';

export type OrgPlan = 'basic' | 'standard' | 'premium';

export interface Organization {
  /** Doc id; matches `organizations/{id}`. */
  id:                string;
  /** Company name shown everywhere (dashboards, PDFs). */
  name:              string;
  /** Optional dark-mode-ready SVG/PNG uploaded to Storage. */
  logoUrl?:          string;
  /** HR contact for the account — not necessarily an admin user. */
  primaryContactName?:  string;
  primaryContactEmail?: string;
  /** UIDs with role === 'corporate' + corporateData.corporateRole === 'admin'. */
  adminUids:         string[];
  /** UIDs of students (role === 'student') whose progress rolls up here. */
  studentUids:       string[];
  /** Which plan tier they subscribed to. */
  plan:              OrgPlan;
  /** When the program started. Drives "program-to-date" metrics. */
  startedAt:         Timestamp;
  /** Optional end date for the current contract term. */
  endsAt?:           Timestamp;
  /** How many classes per week each employee gets (used by projections). */
  classesPerWeek?:   number;
  createdAt:         Timestamp;
  updatedAt?:        Timestamp;
}

// ─── Derived per-student stats shown on the corporate roster ─────

/** Lightweight summary a corporate admin sees per employee. */
export interface RosterEntry {
  uid:                string;
  fullName:           string;
  email:              string;
  profileImage?:      string;
  currentLevel:       LessonLevel | null;
  /** YYYY-MM-DD of last confirmed class, or null if none. */
  lastClassDate:      string | null;
  /** Classes attended in the last 30 days. */
  classesLast30Days:  number;
  /** Attendance %: attended / (attended + absent) in the last 30 days. 0..100 */
  attendancePct:      number;
  /** Daily Practice current streak, or 0 if the student hasn't started. */
  practiceStreak:     number;
  /** XP from Daily Practice. */
  practiceXp:         number;
  /** CEFR level from latest placement test, or null if none taken. */
  latestPlacementLevel: LessonLevel | null;
  /** YYYY-MM-DD of latest placement test. */
  latestPlacementAt:  string | null;
}

/** Aggregate dashboard numbers the corporate admin sees at the top. */
export interface OrganizationStats {
  totalStudents:      number;
  activeLast30Days:   number;  // completed ≥1 class in the last 30d
  classesLast30Days:  number;  // across the whole org
  classesThisMonth:   number;
  /** Distribution of currentLevel across employees (level → count). */
  levelDistribution:  Record<string, number>;
  /** Students who have improved at least one CEFR band since program start. */
  improvedCount:      number;
}
