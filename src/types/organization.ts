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
  /** CEFR level from the EARLIEST placement test on record. Used with
   *  `currentLevel` to derive the "subió de nivel" count. Null if no
   *  placement has ever been recorded. */
  firstPlacementLevel: LessonLevel | null;
  /** YYYY-MM-DD of the earliest placement — the program's starting line. */
  firstPlacementAt:   string | null;
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

// ─── Groups ──────────────────────────────────────────────────────
//
// A group bundles 4-5 employees that take class together. Each employee
// belongs to at most ONE group (unassigned ones still show in the "Por
// persona" view). Group identity is level + weekly slot — "A2 · Miércoles
// 10:00". Stored as a subcollection under the org so queries stay scoped
// and the org doc stays cheap.

export interface OrgGroup {
  /** Doc id of `organizations/{orgId}/groups/{groupId}`. */
  id:         string;
  /** Parent org id — mirrored here for simpler client code. */
  orgId:      string;
  /** Free-text name the admin edits — defaults to "{level} · {day} {hh:mm}". */
  name:       string;
  /** CEFR target for the group. Drives the level pill. */
  level:      LessonLevel | null;
  /** 1 = Monday … 7 = Sunday. Null if no fixed slot yet. */
  dayOfWeek:  number | null;
  /** 0–23. Null if no fixed slot yet. */
  hour:       number | null;
  /** UIDs of employees in this group. Subset of org.studentUids. */
  memberUids: string[];
  /** Optional free-text note shown on the group detail page. */
  notes?:     string;
  createdAt:  Timestamp;
  updatedAt?: Timestamp;
}

// ─── Change requests ─────────────────────────────────────────────
//
// Corporate admins raise these from the Estudiantes tab when something
// needs the teacher's attention: move someone to another group, re-run
// placement, or swap an employee out. They land on a per-org queue the
// teacher can resolve. No scheduling happens automatically — this is a
// communication channel, not a self-serve action.

export type ChangeRequestType =
  | 'change-group'
  | 'reevaluation'
  | 'replacement';

export type ChangeRequestStatus =
  | 'pending'
  | 'approved'
  | 'declined'
  | 'resolved';

export interface ChangeRequest {
  id:              string;
  orgId:           string;
  type:            ChangeRequestType;
  studentUid:      string;
  studentName:     string;
  /** Group the student is currently in (null if unassigned). */
  currentGroupId:  string | null;
  currentGroupName: string | null;
  /** Only set for `change-group`: where the admin wants them moved. */
  targetGroupId?:  string | null;
  targetGroupName?: string | null;
  note:            string;
  status:          ChangeRequestStatus;
  createdByUid:    string;
  createdByName:   string;
  createdAt:       Timestamp;
  resolvedAt?:     Timestamp;
  resolvedByUid?:  string;
  teacherNote?:    string;
}

/** Aggregate numbers derived from a group's RosterEntry members. */
export interface GroupStats {
  size:               number;
  activeLast30Days:   number;
  classesLast30Days:  number;
  attendancePct:      number;   // weighted mean across members
  practiceActive:     number;   // members with streak >= 1
  /** Distribution of currentLevel inside the group. */
  levelDistribution:  Record<string, number>;
}
