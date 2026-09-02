// ============================================================
// FriendlyTeaching.cl — TypeScript Types para Firebase/Firestore
// ============================================================

import { Timestamp } from 'firebase/firestore';

// ─── Roles y Estados ────────────────────────────────────────

export type UserRole = 'teacher' | 'student' | 'admin' | 'master';
export type UserStatus = 'active' | 'pending' | 'approved' | 'inactive' | 'archived';
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
    notes?: string;
    platformLinks?: {
      off2class?: string;
      ellii?: string;
      sounter?: string;
    };
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
  // Per-class content metadata registered from the Planner. Optional so
  // legacy bookings and new classes without a topic yet still load fine.
  topic?: string;              // "Present simple be — questions"
  materialUrl?: string;        // link to off2class / ellii / drive / etc.
  materialType?: string;       // short label so the planner can badge it: 'off2class' | 'ellii' | 'friendlytext' | 'other'
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
  | 'sorting'
  | 'lyrics'
  // ── Friendlyrics® 10-slide format ─────────────────────────
  | 'song_cover'
  | 'vocab_match'
  | 'predictions'
  | 'lyrics_game'
  | 'listening_quiz'
  | 'language_focus'
  | 'language_practice'
  | 'translation_game'
  | 'wrapup'
  | 'friendlyrics_end'
  // ── Friendlyflix® clip-based format ───────────────────────
  | 'clip_cover'
  | 'clip_dialogue_game'
  | 'clip_comprehension'
  | 'clip_vocab_match'
  | 'clip_predictions'
  | 'clip_language_focus'
  | 'clip_controlled_practice'
  | 'clip_production'
  | 'friendlyflix_end'
  // ── Friendlytext® CLT text-based format ───────────────────
  | 'text_cover'
  | 'text_comprehension'
  | 'text_reading'  // legacy alias — pre-rename docs still load; renderer treats it as text_comprehension
  | 'friendlytext_end'
  // ── Free-form HTML canvas (author-controlled markup, sanitized) ──
  | 'html_content';

// Presentation mode for the comprehension slide — text only, audio only, or both.
// Also gates what the creation flow requires (audio-only lessons demand an audio source;
// text-only lessons ignore audio configuration entirely).
export type ComprehensionMode = 'text' | 'audio' | 'both';

// ─── Friendlyrics® game types ────────────────────────────────

export interface LyricsBlank {
  word: string;
  options: string[];  // exactly 4 choices including correct
}

export interface QuizQuestion {
  question: string;
  options: MultipleChoiceOption[];
  correctAnswer: string;
}

export type PracticeType =
  | 'unscramble'
  | 'match_halves'
  | 'verb_form'
  | 'error_correction'
  | 'multiple_selection'
  | 'open_ended';

export interface PracticeItem {
  type: PracticeType;
  prompt: string;
  answer: string;
  // For match_halves & multiple_selection: choices shown to the student.
  // For verb_form: 4 verb forms (correct + 3 distractors).
  options?: string[];
  // Grammar structure this item drills — surfaced as an eyebrow in the card
  // so students see the through-line from Language Focus.
  grammarTopic?: string;
  // For error_correction: the sentence-with-error the student must fix.
  // The `answer` field holds the corrected version.
  wrongText?: string;
  // For open_ended: sentence stem the student completes with their own words.
  // No auto-check — item is marked done on non-empty submit.
  stem?: string;
  // Optional line from the source text that anchors this item in context.
  contextLine?: string;
}

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
  // Lyrics slide (music lessons)
  songData?: SongData;
  // Clip slide (Friendlyflix — series/movie clips)
  clipData?: ClipData;
  // Text slide (Friendlytext — CLT text-based lessons)
  textData?: TextData;
  // Friendlyrics® game slides
  blanksData?: LyricsBlank[];
  translationText?: string;
  questions?: QuizQuestion[];
  practiceItems?: PracticeItem[];
  // Free-form HTML canvas — used by 'html_content' slides. Content is
  // sanitized with DOMPurify before render, so <script>, event handlers
  // and dangerous tags are stripped even if the author left them in.
  htmlContent?: string;
  // Cuando el markup no cabe en el doc de Firestore (> 500 KB) lo
  // subimos como archivo a Storage y el slide lo baja on-demand.
  // El sanitizer se corre sobre el resultado del fetch (mismo pipeline).
  hostedHtmlUrl?: string;
}

// ─── Music Lessons ────────────────────────────────────────────

export interface SongData {
  title: string;
  artist: string;
  albumArt: string;
  previewUrl?: string;
  youtubeUrl?: string;
  lyrics: string;
  // Baked default offset (seconds) applied on top of LRC/fallback timings.
  // Used when the YouTube video is a cropped/re-encoded version whose vocals
  // start later than the original song. Teacher localStorage nudges still
  // override this at runtime.
  syncOffsetSeconds?: number;
}

// ─── Friendlyflix® — series & movie clips ────────────────────

export interface ClipDialogueLine {
  speaker?: string;       // optional character name
  text: string;           // single dialogue line
  startTime: number;      // seconds from clip start
  endTime?: number;       // optional explicit end (else inferred)
}

export interface ClipData {
  title: string;          // scene title, e.g. "Breaking Bad — Pilot scene"
  source: string;         // show/movie name, e.g. "Breaking Bad"
  posterUrl?: string;     // optional poster/thumbnail
  youtubeUrl: string;     // required for video embed
  startTime?: number;     // optional start offset within the YouTube video
  endTime?: number;       // optional cutoff
  dialogue: string;       // raw dialogue, newline-separated (same format as lyrics — {{blank}} markers)
  // Optional pre-computed per-line timings (mirror of LRC). If absent, the slide
  // falls back to weight-based estimation from video duration.
  timings?: number[];
  // Optional fetched captions raw (kept for re-build)
  captionsSource?: 'youtube' | 'manual' | 'mixed';
}

export interface MovieLesson {
  id?: string;
  teacherId: string;
  title: string;
  level: LessonLevel;
  clip: ClipData;
  slides: Slide[];
  publishStatus: 'draft' | 'published';
  assignedTo: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface MusicLesson {
  id?: string;
  teacherId: string;
  title: string;
  level: LessonLevel;
  song: SongData;
  slides: Slide[];
  publishStatus: 'draft' | 'published';
  assignedTo: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Friendlytext® — CLT text-based lessons ──────────────────
//
// Source material is a piece of text (article, dialogue, story, script).
// Audio is optional: a teacher can attach a YouTube link, upload a hosted
// audio URL (typically ElevenLabs TTS pushed to Firebase Storage), or run
// the lesson silent — all three combinations are supported downstream.

export type TextAudioSource = 'youtube' | 'hosted' | 'tts' | 'none';

export interface TextData {
  title: string;            // e.g. "The Last Bookshop on Main Street"
  source: string;           // author, publication or "Original TTS script"
  posterUrl?: string;       // optional cover image
  text: string;             // raw text, one paragraph or line per row
  // Optional per-line timestamps in seconds (mirror of ClipData.timings).
  // If present + audio available, the reading slide highlights lines as
  // they play. If absent, playback is untimed.
  timings?: number[];
  // Optional YouTube URL — takes precedence over audioUrl when both exist.
  youtubeUrl?: string;
  startTime?: number;       // optional clip start (seconds)
  endTime?: number;         // optional clip end (seconds)
  // Direct audio URL (Firebase Storage download URL or any CDN link).
  // Set when the teacher runs ElevenLabs TTS or uploads their own file.
  audioUrl?: string;
  // Which channel was used for the audio, for UI badging + analytics.
  audioSource?: TextAudioSource;
  // ElevenLabs voice + model kept alongside audioUrl so the teacher can
  // re-generate later without re-picking. Optional.
  ttsVoiceId?: string;
  ttsModelId?: string;
  syncOffsetSeconds?: number;  // teacher-baked timing nudge (mirrors SongData)
  // How the comprehension slide is presented: text only, audio only, or both.
  // Defaults to 'both' when absent so legacy lessons keep their current behavior.
  comprehensionMode?: ComprehensionMode;
  // CSS object-position for the poster image (e.g. 'center', 'top', '50% 20%').
  // Lets teachers pick which part of the poster survives object-cover cropping.
  posterPosition?: string;
}

export interface TextLesson {
  id?: string;
  teacherId: string;
  title: string;
  level: LessonLevel;
  text: TextData;
  slides: Slide[];
  publishStatus: 'draft' | 'published';
  assignedTo: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Student Assignment (unificado) ──────────────────────────
//
// Un doc por (student, material). Permite asignar tanto lecciones
// internas de FriendlyTeaching (source='lesson') como material externo
// (source='external') — Off2Class, Ellii, Drive, YouTube, etc.
//
// Friendlyflix / Friendlyrics / FriendlyTales siguen usando su propio
// campo `assignedTo: string[]` en el doc de la lección; el student
// dashboard hace merge de ambas fuentes.
export type StudentAssignmentSource = 'lesson' | 'external';
export interface StudentAssignment {
  id: string;
  studentId: string;         // uid del estudiante
  teacherId: string;         // uid del profe que asignó
  source: StudentAssignmentSource;
  // Interno: id del doc en `lessons` (Librería FT).
  refId?: string;
  // Externo: URL directa al material. El icono / label se resuelve con
  // detectMaterialType() de planner/bookingUtils.
  externalUrl?: string;
  // Snapshot de metadata para poder listar sin joins adicionales.
  title: string;
  level?: LessonLevel;
  notes?: string;
  status?: 'assigned' | 'in_progress' | 'completed';
  dueAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// ─── Lección ─────────────────────────────────────────────────

// Fuente de la lección — de dónde salió el contenido. Se usa para
// mostrar el badge correcto en la Librería y decidir qué features
// habilitar (ej. lecciones 'canva' o 'html-uploaded' no ofrecen
// edición interna). undefined en docs viejos → tratar como 'manual'.
export type LessonSource =
  | 'manual'         // Creada vacía + editada en el editor interno
  | 'ai-generated'   // AI Lesson Wizard
  | 'canva'          // CreateFromPresentation (Canva / Google Slides / PPTX embed)
  | 'html'           // UploadHtmlLessonModal (single html_content slide)
  | 'html-hosted';   // Igual que 'html' pero el markup pesa mucho y vive en Storage, no en el doc

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
  source?: LessonSource;     // De dónde salió — para badges y decisiones de UI
  htmlHostedUrl?: string;    // Cuando source==='html-hosted', el markup vive acá
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
  coverImage?: string;
  sortOrder?: number;
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
  | 'all_skills'         // Score 4+ in all skill areas
  | 'word_first'         // Submit first Word of the Day example
  | 'word_streak_7'      // 7-day Word of the Day streak
  | 'word_streak_14'     // 14-day Word of the Day streak
  | 'word_streak_30';    // 30-day Word of the Day streak

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
  wordSubmissions: number;   // total Word of the Day examples submitted
  wordStreak: number;        // current consecutive days of Word of the Day
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
  WORD_OF_DAY: 15,              // Submit a Word of the Day example
  WORD_STREAK_BONUS_7: 25,      // 7-day word streak bonus
  WORD_STREAK_BONUS_14: 50,     // 14-day word streak bonus
  STREAK_BONUS_3: 15,
  STREAK_BONUS_7: 40,
  STREAK_BONUS_30: 150,
  BADGE_UNLOCK: 10,         // base badge bonus (each badge also has xpReward)
} as const;

// Plataforma externa donde vive el material de la tarea (link-only homework).
// 'other' cubre material propio del profe (Drive, PDF hospedado, etc.).
export type HomeworkExternalPlatform = 'off2class' | 'ellii' | 'other';

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
  // Tarea externa: link a Off2Class / Ellii / material propio. Si está seteado,
  // el estudiante ve un botón que abre la URL en pestaña nueva y una acción
  // separada para marcar la tarea como hecha (no hay slides ni auto-corrección).
  externalUrl?: string;
  externalPlatform?: HomeworkExternalPlatform;
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

// ─── COWORK (workspace interno del equipo docente) ──────────────
//
// Espacio privado sólo para profesores: chat común, tablón de avisos
// y presencia en línea. Pensado para escalar cuando la academia crezca
// más allá de dos profes.

export interface CoworkMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoUrl?: string;
  text: string;
  // IDs de profesores mencionados con @nombre (para futuras notificaciones).
  mentions?: string[];
  // Editado / borrado suave — mantenemos el doc para preservar el hilo.
  editedAt?: Timestamp;
  deletedAt?: Timestamp;
  createdAt: Timestamp;
}

export interface CoworkAnnouncement {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  body: string;
  // Anclado al tope del tablón. Cualquier profe puede fijar/desfijar.
  pinned: boolean;
  // uid → timestamp de lectura. Permite mostrar “no leído” por profe.
  readBy?: Record<string, Timestamp>;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface CoworkPresence {
  id: string;              // = uid del profesor
  uid: string;
  fullName: string;
  photoUrl?: string;
  // Última señal de vida (heartbeat cada ~30 s). Se considera online si
  // lastSeen está dentro de los últimos 60 s.
  lastSeen: Timestamp;
  // Ruta que el profe está mirando ahora (para el futuro “¿Dónde está?”).
  currentPath?: string;
}
