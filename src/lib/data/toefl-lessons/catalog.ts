// FriendlyTeaching.cl — TOEFL lessons catalog
//
// Metadata for every TOEFL prep lesson shipped as a standalone HTML
// under /public/toefl-lessons/<slug>.html. The teacher browses this
// list at /dashboard/teacher/toefl/lessons; the generic bake script
// (scripts/bake-toefl-lesson.js <slug>) reads the audios block below
// to regenerate MP3s via ElevenLabs when needed.
//
// Workflow to add a new lesson:
//   1. Drop the HTML at public/toefl-lessons/<slug>.html
//   2. Add an entry here with its audios manifest (voices from the
//      non-IELTS-saturated whitelist — see memory feedback-listening-names-voices)
//   3. Run: node scripts/bake-toefl-lesson.js <slug>
//      → generates MP3s, uploads to Firebase Storage, injects the
//        hosted URLs into the HTML (PREBAKED_AUDIOS short-circuit)
//   4. Commit the HTML + push — lives at
//      https://friendlyteaching.cl/toefl-lessons/<slug>.html

export type ToeflSection = 'reading' | 'listening' | 'speaking' | 'writing' | 'mixed';
export type ToeflLessonLevel = 'B1' | 'B2' | 'C1' | 'C2';

/** A text segment to speak with one of the voices from VOICES below. */
export interface DialogueTurn {
  /** Semantic role ("advisor", "student", "professor") — maps to a voice id. */
  role: string;
  text: string;
}

/** One audio clip the bake script will generate for this lesson. */
export interface ToeflLessonAudio {
  /** Cache key used in the HTML (`cacheKey` arg to generateElevenLabsAudio). */
  id:            string;
  /** Firebase Storage path (also the HTTPS URL stem). */
  storagePath:   string;
  /** Either a single-speaker text + voiceId, OR a multi-turn dialogue. */
  text?:         string;
  voiceId?:      string;
  dialogue?:     DialogueTurn[];
  /** Voice map for dialogue roles (role → ElevenLabs voice id). */
  roleVoices?:   Record<string, string>;
}

export interface ToeflLesson {
  /** Slug. Matches `public/toefl-lessons/<id>.html`. */
  id:               string;
  title:            string;
  /** One-line blurb for the catalog card. */
  description:      string;
  section:          ToeflSection;
  level:            ToeflLessonLevel;
  /** Suggested pacing, in minutes. */
  durationMinutes:  number;
  /** Public URL fragment — rendered as link. */
  publicPath:       string;
  /** Pedagogical tags (e.g. 'drills', 'dialogue', 'science'). */
  tags?:            string[];
  /** Audios to pre-bake with ElevenLabs. */
  audios?:          ToeflLessonAudio[];
  /** When this lesson was first added — used for sorting. */
  addedOn:          string; // ISO date
}

// Voices consistent with the non-IELTS-saturated whitelist
// (memory: feedback-listening-names-voices).
export const TOEFL_VOICES = {
  // Classroom / lecture
  professor_male:    'nPczCjzI2devNBz1zQrb', // Brian — deep lecturing male
  professor_female:  'XrExE9yKIg1WjnnlVkGX', // Matilda — warm female
  // Student / peer
  student_male:      'pNInz6obpgDQGcFmaJgB', // Adam — mature male
  student_female:    'cgSgspJ2msm6clMCkdW9', // Jessica — young expressive female
  // Advisor / staff
  advisor_female:    'XrExE9yKIg1WjnnlVkGX', // Matilda
  advisor_male:      'IKne3meq5aSn9XLyUdCD', // Charlie — natural male AU
  // Narrator (neutral)
  narrator:          'nPczCjzI2devNBz1zQrb', // Brian
} as const;

export const TOEFL_LESSONS: ToeflLesson[] = [
  {
    id:              'refresh-50min',
    title:           'TOEFL iBT · 50-Min Refresh',
    description:     'Paced for a 50-minute 1:1 session — reset, reading drills, listening drills, writing + speaking drills, strategy match and 12-question quiz.',
    section:         'mixed',
    level:           'B2',
    durationMinutes: 50,
    publicPath:      '/toefl-lessons/refresh-50min.html',
    tags:            ['drills', 'mixed', 'first-session'],
    addedOn:         '2026-11-23',
    audios: [
      {
        id:          'drill-a',
        storagePath: 'audio/toefl-lessons/refresh-50min/drill-a.mp3',
        roleVoices: {
          advisor: TOEFL_VOICES.advisor_female,
          student: TOEFL_VOICES.student_male,
        },
        dialogue: [
          { role: 'advisor', text: 'I see you are thinking of dropping Lab Section B because the eight a.m. start is rough.' },
          { role: 'student', text: "Right — at first I thought switching to the online module would be way easier. Actually, now that I checked the lab schedule, the online version requires two proctored campus exams anyway, so I wouldn't even save the commute on test weeks." },
          { role: 'advisor', text: 'Good catch. Plus, Section B has the equipment you need for your senior project — though if mornings really hurt your focus, ask Professor Lin if swapping into Thursday is open.' },
        ],
      },
      {
        id:          'drill-b',
        storagePath: 'audio/toefl-lessons/refresh-50min/drill-b.mp3',
        voiceId:     TOEFL_VOICES.professor_male,
        text:
          'Many people picture coral reefs purely as colorful rock formations. ' +
          "In reality, reef-building corals depend on microscopic algae living inside their tissues. " +
          "Those algae provide most of the coral's energy through photosynthesis. " +
          'When water stays too warm for too long, stressed corals expel the algae — causing bleaching. ' +
          "Notice that bleached coral isn't dead right away, so if temperatures drop soon enough, recovery is still possible.",
      },
    ],
  },
];

export function findToeflLesson(id: string): ToeflLesson | undefined {
  return TOEFL_LESSONS.find(l => l.id === id);
}

/** Group by section for the teacher catalog view. */
export function toeflLessonsBySection(): Record<ToeflSection, ToeflLesson[]> {
  const out: Record<ToeflSection, ToeflLesson[]> = {
    reading: [], listening: [], speaking: [], writing: [], mixed: [],
  };
  for (const l of TOEFL_LESSONS) out[l.section].push(l);
  return out;
}

export const TOEFL_SECTION_LABELS: Record<ToeflSection, string> = {
  reading:   'Reading',
  listening: 'Listening',
  speaking:  'Speaking',
  writing:   'Writing',
  mixed:     'Mixed / Session',
};
