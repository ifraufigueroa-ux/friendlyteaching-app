// ============================================================
// FriendlyTeaching.cl — TypeScript Types para Firebase/Firestore
// ============================================================

import { Timestamp } from 'firebase/firestore';

// ─── Roles y Estados ────────────────────────────────────────

export type UserRole = 'teacher' | 'student' | 'admin';
export type UserStatus = 'active' | 'pending' | 'approved' | 'inactive';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type AttendanceStatus = 'attended' | 'absent' | 'late';
export type LessonLevel = 'A0' | 'A1' | 'A2' | 'B1' | 'B1+' | 'B2' | 'C1';
export type SlidePhase = 'pre' | 'while' | 'post';
export type LessonPlannerStatus = 'backlog' | 'upcoming' | 'ready' | 'archived';

// ─── Usuario ─────────────────────────────────────────────────

export interface FTUser {
  uid: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  profileImage?: string;
  timezone?: string;
  language?: 'es' | 'en';
  preferences?: {
    emailNotifications: boolean;
    lessonsPerWeek?: number;
  };
  teacherData?: {
    bio?: string;
    specializations?: string[];
  };
  studentData?: {
    approvedByTeacherId?: string;
    level?: LessonLevel;
    joinedAt?: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// ─── Booking (Clase agendada) ─────────────────────────────────

export type BookingType = 'class' | 'interview';

export interface Booking {
  id: string;
  teacherId: string;
  studentId?: string;
  studentName: string;
  studentEmail?: string;
  dayOfWeek: number;   // 1=Lunes … 6=Sábado
  hour: number;        // 7-21
  minute?: number;     // 0 or 30 — defaults to 0 (on the hour)
  bookingType?: BookingType; // 'class' (default) | 'interview'
  weekStart: Timestamp;
  status: BookingStatus;
  isRecurring: boolean;
  recurringName?: string;
  lessonId?: string;
  notes?: string;
  timezone?: string;       // IANA timezone of the teacher when booking was created
  attendance?: AttendanceStatus;
  sessionNotes?: string;
  cancellationReason?: string;
  createdAt: Timestamp;
  confirmedAt?: Timestamp;
  cancelledAt?: Timestamp;
  completedAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ─── Horario semanal ──────────────────────────────────────────

export interface WeeklySchedule {
  id: string;
  teacherId: string;
  dayOfWeek: number;
  hour: number;
  isAvailable: boolean;
  createdAt?: Timestamp;
}

// ─── Slides ───────────────────────────────────────────────────

export type SlideType =
  | 'cover'
  | 'free_text'
  | 'vocabulary'
  | 'multiple_choice'
  | 'grammar_table'
  | 'selection'
  | 'listening'
  | 'true_false'
  | 'matching'
  | 'drag_drop'
  | 'writing_prompt'
  | 'speaking'
  | 'image_label'
  | 'video'
  | 'cloze_test'
  | 'image_hotspot'
  | 'sorting';

export interface VocabWord {
  word: string;
  translation: string;
  pronunciation?: string;
  example?: string;
}

export interface MultipleChoiceOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface GrammarRow {
  col1: string;
  col2: string;
  col3?: string;
  col4?: string;
}

export interface MatchingPair {
  left: string;
  right: string;
}

export interface Slide {
  id?: string;
  type: SlideType;
  phase?: SlidePhase;
  title?: string;
  subtitle?: string;
  content?: string;
  teacherNotes?: string;
  tips?: string;
  audioUrl?: string;
  imageUrl?: string;
  // Tipo-específico
  words?: VocabWord[];
  question?: string;
  options?: MultipleChoiceOption[];
  correctAnswer?: string;
  tableHeaders?: string[];
  tableRows?: GrammarRow[];
  pairs?: MatchingPair[];
  blanks?: string[];
  prompt?: string;
  dialogLines?: { speaker: string; text: string }[];
}

// ─── Lección ─────────────────────────────────────────────────

export interface Lesson {
  id: string;
  teacherId?: string;    // UID del profesor propietario
  courseId: string;
  unit: number;
  lessonNumber: number;
  code: string;          // e.g. "U1.L1"
  title: string;
  level: LessonLevel;
  duration?: number;     // minutos
  slides: Slide[];
  slidesJson?: string;   // backup JSON
  objectives?: string[];
  isPublished?: boolean;
  version?: number;
  canvaMode?: boolean;
  canvaEmbed?: string;       // Canva embed URL (legacy — use presentationUrl)
  presentationUrl?: string;  // Primary presentation URL (Google Slides, Canva, Office 365, etc.)
  lastEditedBy?: string;
  plannerStatus?: LessonPlannerStatus;  // kanban column
  plannerNote?: string;                 // optional note visible on kanban card
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ─── Curso ───────────────────────────────────────────────────

export interface Course {
  id: string;
  title: string;
  level: LessonLevel;
  icon?: string;
  description?: string;
  lessonCount?: number;
  createdAt?: Timestamp;
}

// ─── Progreso ────────────────────────────────────────────────

export interface SlideProgress {
  slideIndex: number;
  completed: boolean;
  answers?: Record<string, string>;
  score?: number;
}

export interface Progress {
  id: string;
  studentId: string;
  teacherId?: string;    // UID del profesor propietario (para filtrar)
  lessonId: string;
  bookingId?: string;
  startedAt: Timestamp;
  completedAt?: Timestamp;
  duration?: number;
  slideProgress?: SlideProgress[];
  overallScore?: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  notes?: string;
  updatedAt?: Timestamp;
}

// ─── Sesión en vivo ───────────────────────────────────────────

export interface LiveSession {
  id: string;           // = lessonId (one active session per lesson at a time)
  teacherId: string;
  lessonId: string;
  lessonTitle: string;
  presentationUrl: string;
  active: boolean;
  studentAnnotationsEnabled: boolean;
  assignedStudents: string[];   // student UIDs invited to the session
  teacherCanvas: string;        // base64 PNG of teacher's annotation canvas (throttled)
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ─── Live Polls ─────────────────────────────────────────────

export type PollType = 'multiple_choice' | 'true_false' | 'open_text' | 'emoji_reaction';

export interface PollOption {
  id: string;
  text: string;
  emoji?: string;
}

export interface LivePoll {
  id: string;
  sessionId: string;        // = lessonId (links to LiveSession)
  teacherId: string;
  question: string;
  type: PollType;
  options: PollOption[];     // For mc / tf / emoji
  correctOptionId?: string;  // Optional: highlight correct answer
  isActive: boolean;         // Currently accepting responses
  showResults: boolean;      // Show results to students
  responses: Record<string, string>;  // studentUid → optionId or text
  createdAt: Timestamp;
  closedAt?: Timestamp;
}

// ─── Live Chat / Q&A ────────────────────────────────────────

export interface ChatMessage {
  id: string;
  sessionId: string;       // = lessonId (links to LiveSession)
  authorId: string;
  authorName: string;
  authorRole: 'teacher' | 'student';
  text: string;
  isQuestion: boolean;     // Student explicitly marks as question
  isAnswered: boolean;     // Teacher marks as answered
  isPinned: boolean;       // Teacher pins important message
  createdAt: Timestamp;
}

// ─── Facturación (Billing) ────────────────────────────────────

export type PaymentStatus = 'pending' | 'paid' | 'overdue';
export type PaymentMethod = 'transfer' | 'cash' | 'other';
export type PaymentCurrency = 'CLP' | 'USD' | 'EUR';

export interface PaymentRecord {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  amount: number;
  currency: PaymentCurrency;
  period: string;       // 'YYYY-MM' — one record per student per month
  status: PaymentStatus;
  paidAt?: Timestamp;
  method?: PaymentMethod;
  notes?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// ─── Historial de nivel (Level Tracking) ─────────────────────

export interface LevelHistoryEntry {
  id: string;
  studentId: string;
  teacherId: string;
  fromLevel: LessonLevel | null;  // null = initial assignment
  toLevel: LessonLevel;
  notes?: string;
  changedAt: Timestamp;
  createdAt: Timestamp;
}

// ─── Evaluación de habilidades (Gap Analysis) ────────────────

export interface SkillScores {
  speaking: number;     // 1–5
  listening: number;    // 1–5
  reading: number;      // 1–5
  writing: number;      // 1–5
  grammar: number;      // 1–5
  vocabulary: number;   // 1–5
}

export interface SkillAssessment {
  id: string;
  studentId: string;
  teacherId: string;
  bookingId?: string;   // optional: link to a specific class session
  scores: SkillScores;
  notes?: string;
  assessedAt: Timestamp;
  createdAt: Timestamp;
}

// ─── Tarea ───────────────────────────────────────────────────

export interface AutoGradeSlideResult {
  slideIndex: number;
  slideType: string;
  isCorrect: boolean;
  studentAnswer: unknown;
  correctAnswer: unknown;
  explanation?: string;
}

export interface AutoGradeResult {
  results: AutoGradeSlideResult[];
  totalGradeable: number;
  totalCorrect: number;
  percentage: number;
  score7: number;
}

// ─── Gamificación ────────────────────────────────────────────

export type BadgeId =
  | 'first_lesson'       // Complete your first lesson
  | 'five_lessons'       // Complete 5 lessons
  | 'ten_lessons'        // Complete 10 lessons
  | 'perfect_score'      // Get 100% on any homework
  | 'streak_3'           // 3-day study streak
  | 'streak_7'           // 7-day study streak
  | 'streak_30'          // 30-day study streak
  | 'homework_hero'      // Submit 10 homeworks on time
  | 'early_bird'         // Submit homework before due date 5 times
  | 'vocabulary_master'  // Complete 5 vocabulary slides
  | 'grammar_guru'       // Complete 5 grammar slides
  | 'level_up'           // Level up for the first time
  | 'all_skills';        // Score 4+ in all skill areas

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;          // emoji
  xpReward: number;
  unlockedAt?: Timestamp;
}

export interface StudentGamification {
  id: string;            // = studentId
  studentId: string;
  totalXp: number;
  level: number;         // Derived: floor(totalXp / 100) + 1
  currentStreak: number; // consecutive days with activity
  longestStreak: number;
  lastActivityDate: string; // 'YYYY-MM-DD'
  lessonsCompleted: number;
  homeworksSubmitted: number;
  homeworksOnTime: number;
  perfectScores: number;
  badges: BadgeId[];
  weeklyXp: Record<string, number>; // 'YYYY-Www' → xp earned that week
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// XP reward constants
export const XP_REWARDS = {
  LESSON_COMPLETE: 25,
  HOMEWORK_SUBMIT: 20,
  HOMEWORK_ON_TIME: 10,     // bonus
  PERFECT_SCORE: 30,        // bonus
  DAILY_LOGIN: 5,
  STREAK_BONUS_3: 15,
  STREAK_BONUS_7: 40,
  STREAK_BONUS_30: 150,
  BADGE_UNLOCK: 10,         // base badge bonus (each badge also has xpReward)
} as const;

export interface Homework {
  id: string;
  assignedToStudentId?: string;
  assignedByTeacherId: string;
  lessonId?: string;
  bookingId?: string;
  title: string;
  description?: string;
  dueDate: Timestamp;
  slides?: Slide[];
  status: 'assigned' | 'submitted' | 'reviewed' | 'pending';
  submittedAt?: Timestamp;
  submittedAnswers?: Record<string, unknown>;
  autoGradeResult?: AutoGradeResult;
  feedback?: string;
  score?: number;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
