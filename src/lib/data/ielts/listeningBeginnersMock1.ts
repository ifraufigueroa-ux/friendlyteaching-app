// FriendlyTeaching.cl — IELTS GT Beginners · Listening Mock 1 (A2)
//
// IELTS-shaped 4-section Listening mock designed for A2 students. The
// format matches the real exam (Part 1 transactional → Part 2 monologue
// → Part 3 discussion → Part 4 short talk), but the vocabulary, sentence
// length and question load are trimmed for CEFR A2.
//
// Per-section budget:
//   • ~90-120 seconds of audio per section
//   • 5 questions per section (20 total, not 40)
//   • Question types: only form-completion, short-answer, note-completion,
//     table-completion and simple MCQ. No matching, flow-chart or map
//     labelling — those overwhelm A2 processing capacity.
//
// TTS: cefrLevel:'A2' signals generate-ielts-audios.ts to render at
// voice_settings.speed = 0.80 con pausas de 0.6s entre turnos — pausado
// y legible para A2 en su primera exposición al examen, sin sonar robótico.

import type {
  ListeningMock, ListeningSection, ListeningQuestion, PreListeningPrep,
} from '@/types/ielts';

// ─── SECTION 1 · Library card call ───────────────────────────────────

const s1Questions: ListeningQuestion[] = [
  {
    id: 'la1-s1-q1',
    section: 1,
    type: 'form-completion',
    prompt: 'Family name: ____',
    contextBefore: 'Family name:',
    wordLimit: 1,
    allowNumbers: false,
    accepted: ['Garcia', 'García'],
    audioTimestamp: 28,
    cognitiveLoad: 'literal',
    difficulty: 'easy',
    teacherNote: 'Family name is stated directly, no spelling. Both spellings (with/without accent) are accepted.',
  },
  {
    id: 'la1-s1-q2',
    section: 1,
    type: 'form-completion',
    prompt: 'Street number: ____',
    contextBefore: 'Address:',
    contextAfter: 'Green Road',
    wordLimit: 1,
    allowNumbers: true,
    accepted: ['47'],
    audioTimestamp: 44,
    cognitiveLoad: 'literal',
    difficulty: 'easy',
  },
  {
    id: 'la1-s1-q3',
    section: 1,
    type: 'form-completion',
    prompt: 'Phone number: ____',
    contextBefore: 'Phone:',
    wordLimit: 1,
    allowNumbers: true,
    accepted: ['554092'],
    audioTimestamp: 58,
    cognitiveLoad: 'literal',
    difficulty: 'medium',
    teacherNote: '"Oh" is used for zero — a common A2 spot. Also digits are grouped in threes, not spelled all at once.',
    distractorRisks: ['5540902', '554902'],
  },
  {
    id: 'la1-s1-q4',
    section: 1,
    type: 'multiple-choice',
    prompt: 'Which card does the caller choose?',
    options: [
      { id: 'a', text: 'Adult card' },
      { id: 'b', text: 'Student card' },
      { id: 'c', text: 'Child card' },
    ],
    correct: 'b',
    audioTimestamp: 75,
    cognitiveLoad: 'literal',
    difficulty: 'easy',
    teacherNote: 'The caller says "student card" clearly and adds "I study at the university".',
  },
  {
    id: 'la1-s1-q5',
    section: 1,
    type: 'short-answer',
    prompt: 'Which day will the caller visit the library?',
    wordLimit: 1,
    allowNumbers: false,
    accepted: ['Friday'],
    audioTimestamp: 105,
    cognitiveLoad: 'literal',
    difficulty: 'easy',
    teacherNote: 'Monday and Wednesday are mentioned as opening days but the caller chooses Friday.',
    distractorRisks: ['Monday', 'Wednesday', 'Saturday'],
  },
];

const s1PreListening: PreListeningPrep = {
  headline: 'Antes de escuchar · Llamando a la biblioteca',
  scenarioPreview: 'Un estudiante llama a la biblioteca de la ciudad para pedir una tarjeta de socio. La bibliotecaria le pide sus datos personales y le pregunta qué día va a visitar la biblioteca.',
  vocabulary: [
    { word: 'library card',   pos: 'noun',   translation: 'tarjeta de la biblioteca',    example: 'I want a new library card, please.', soundsLike: 'LAI-brer-i card' },
    { word: 'family name',    pos: 'noun',   translation: 'apellido',                     example: 'What is your family name?' },
    { word: 'address',        pos: 'noun',   translation: 'dirección (donde vives)',      example: 'I live at 47 Green Road.', soundsLike: 'a-DRES' },
    { word: 'phone number',   pos: 'noun',   translation: 'número de teléfono',           example: 'And your phone number?' },
    { word: 'student card',   pos: 'noun',   translation: 'tarjeta de estudiante',        example: 'A student card, please.' },
    { word: 'adult card',     pos: 'noun',   translation: 'tarjeta de adulto',            example: 'Adult card or student card?' },
    { word: 'oh (for zero)',  pos: 'number', translation: 'se dice "oh" en vez de "zero" en números de teléfono',  example: 'Five, five, four, OH, nine, two.', soundsLike: 'oh (= 0)' },
    { word: 'photo',          pos: 'noun',   translation: 'foto',                          example: 'Bring your ID and a photo.' },
  ],
  listenFor: [
    'El apellido — se deletrea letra por letra.',
    'El número de la calle y el número de teléfono.',
    'Qué tipo de tarjeta elige el estudiante.',
    'El día de la semana que va a visitar la biblioteca.',
  ],
};

const section1: ListeningSection = {
  number: 1,
  contextType: 'social-transactional',
  title: 'City Library — new library card',
  scenario: 'A student calls the local library to open a new library card. The librarian takes his personal details, offers card options and confirms a visiting day.',
  preListening: s1PreListening,
  speakers: [
    { id: 'librarian', displayName: 'Anna (librarian)', accent: 'UK', gender: 'f', suggestedVoice: { voiceId: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', note: 'ElevenLabs · warm female voice, clear for A2' } },
    { id: 'caller',    displayName: 'Tomas (caller)',   accent: 'UK', gender: 'm', suggestedVoice: { voiceId: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel',    note: 'ElevenLabs · natural UK male' } },
  ],
  instructions: 'Questions 1-5. Listen and complete the form. Write NO MORE THAN ONE WORD OR A NUMBER for each answer.',
  targetDurationSec: 120,
  script: [
    { speakerId: 'librarian', text: "Good morning, City Library. How can I help you?", approxStartSec: 4 },
    { speakerId: 'caller',    text: "Hi. I want a new library card, please.", approxStartSec: 10 },
    { speakerId: 'librarian', text: "Of course. What is your first name?", approxStartSec: 16 },
    { speakerId: 'caller',    text: "My name is Tomas.", approxStartSec: 21 },
    { speakerId: 'librarian', text: "And your family name?", approxStartSec: 25 },
    { speakerId: 'caller',    text: "Garcia. G-A-R-C-I-A.", approxStartSec: 28 },
    { speakerId: 'librarian', text: "Thank you. Now, your address, please.", approxStartSec: 38 },
    { speakerId: 'caller',    text: "I live at 47 Green Road.", approxStartSec: 44 },
    { speakerId: 'librarian', text: "Perfect. And your phone number?", approxStartSec: 52 },
    { speakerId: 'caller',    text: "It is five, five, four, oh, nine, two.", approxStartSec: 58 },
    { speakerId: 'librarian', text: "Great. Now, do you want an adult card or a student card?", approxStartSec: 68 },
    { speakerId: 'caller',    text: "A student card, please. I study at the university.", approxStartSec: 75 },
    { speakerId: 'librarian', text: "Very good. The student card is free.", approxStartSec: 82 },
    { speakerId: 'caller',    text: "Free? Excellent!", approxStartSec: 88 },
    { speakerId: 'librarian', text: "We open every day, but not on Sunday. Please tell me the day of your visit.", approxStartSec: 92 },
    { speakerId: 'caller',    text: "I have classes on Monday and Wednesday. I want to come on Friday.", approxStartSec: 101 },
    { speakerId: 'librarian', text: "Friday is perfect. Please bring your student ID and a photo.", approxStartSec: 110 },
    { speakerId: 'caller',    text: "Ok. Thank you very much.", approxStartSec: 118 },
    { speakerId: 'librarian', text: "You are welcome. See you on Friday.", approxStartSec: 122 },
  ],
  questions: s1Questions,
  formLayouts: [
    {
      title: 'City Library — new card form',
      sections: [
        {
          heading: 'Personal details',
          rows: [
            { kind: 'text',  label: 'First name:',  value: 'Tomas', isExample: true },
            { kind: 'blank', label: 'Family name:',                  questionId: 'la1-s1-q1' },
            { kind: 'blank', label: 'Address:',   prefix: 'Number', suffix: 'Green Road', questionId: 'la1-s1-q2' },
            { kind: 'blank', label: 'Phone:',                        questionId: 'la1-s1-q3' },
          ],
        },
        {
          heading: 'Card and visit',
          rows: [
            { kind: 'blank', label: 'Type of card:',                 questionId: 'la1-s1-q4' },
            { kind: 'blank', label: 'Day of visit:',                 questionId: 'la1-s1-q5' },
          ],
        },
      ],
    },
  ],
};

// ─── SECTION 2 · Welcome talk at a language school ───────────────────

const s2Questions: ListeningQuestion[] = [
  {
    id: 'la1-s2-q6',
    section: 2,
    type: 'note-completion',
    prompt: 'Course level: ____',
    contextBefore: 'Course:',
    contextAfter: 'English',
    wordLimit: 1,
    allowNumbers: false,
    accepted: ['Beginner', 'beginner'],
    audioTimestamp: 15,
    cognitiveLoad: 'literal',
    difficulty: 'easy',
  },
  {
    id: 'la1-s2-q7',
    section: 2,
    type: 'note-completion',
    prompt: 'Number of students: ____',
    contextBefore: 'Students in class:',
    wordLimit: 1,
    allowNumbers: true,
    accepted: ['12', 'twelve'],
    audioTimestamp: 22,
    cognitiveLoad: 'literal',
    difficulty: 'easy',
  },
  {
    id: 'la1-s2-q8',
    section: 2,
    type: 'note-completion',
    prompt: 'Class start time: ____ o\'clock',
    contextBefore: 'Class starts at',
    contextAfter: "o'clock",
    wordLimit: 1,
    allowNumbers: true,
    accepted: ['10', 'ten'],
    audioTimestamp: 40,
    cognitiveLoad: 'literal',
    difficulty: 'easy',
  },
  {
    id: 'la1-s2-q9',
    section: 2,
    type: 'note-completion',
    prompt: 'Break: ____ minutes',
    contextBefore: 'Break duration:',
    contextAfter: 'minutes',
    wordLimit: 1,
    allowNumbers: true,
    accepted: ['20', 'twenty'],
    audioTimestamp: 72,
    cognitiveLoad: 'literal',
    difficulty: 'easy',
  },
  {
    id: 'la1-s2-q10',
    section: 2,
    type: 'short-answer',
    prompt: 'Which day is the exam?',
    wordLimit: 1,
    allowNumbers: false,
    accepted: ['Thursday'],
    audioTimestamp: 100,
    cognitiveLoad: 'literal',
    difficulty: 'easy',
    teacherNote: 'No distractor days mentioned — the exam day is stated once and clearly.',
  },
];

const s2PreListening: PreListeningPrep = {
  headline: 'Antes de escuchar · Bienvenida en la escuela',
  scenarioPreview: 'Una asistente de la escuela le da la bienvenida a los estudiantes nuevos del curso de inglés Beginner. Explica el horario de clase, dónde está el aula y menciona un examen para la semana siguiente.',
  vocabulary: [
    { word: 'welcome',        pos: 'verb',      translation: 'dar la bienvenida',      example: 'Welcome to Sunrise School.' },
    { word: 'beginner',       pos: 'noun',      translation: 'principiante',           example: 'The Beginner English course.', soundsLike: 'bi-GHI-ner' },
    { word: 'assistant',      pos: 'noun',      translation: 'asistente',              example: 'I am the school assistant.', soundsLike: 'a-SIS-tant' },
    { word: 'classroom',      pos: 'noun',      translation: 'aula, sala de clase',    example: 'The classroom is on the second floor.' },
    { word: 'floor',          pos: 'noun',      translation: 'piso (del edificio)',    example: 'The classroom is on the second floor.' },
    { word: 'break',          pos: 'noun',      translation: 'descanso, recreo',       example: 'A break of twenty minutes.' },
    { word: 'notebook',       pos: 'noun',      translation: 'cuaderno',               example: 'You need a notebook and a pen.' },
    { word: 'exam',           pos: 'noun',      translation: 'examen, prueba',         example: 'The exam is on Thursday.' },
  ],
  listenFor: [
    'El nivel del curso.',
    'Cuántos estudiantes hay en la clase.',
    'A qué hora empieza la clase.',
    'Cuánto dura el descanso.',
    'Qué día es el examen.',
  ],
};

const section2: ListeningSection = {
  number: 2,
  contextType: 'social-monologue',
  title: 'Welcome talk — Sunrise Language School',
  scenario: 'A school assistant welcomes new students to a Beginner English course. She introduces the teacher, gives the class schedule, and reminds students about a small exam.',
  preListening: s2PreListening,
  speakers: [
    { id: 'assistant', displayName: 'Sofia (school assistant)', accent: 'UK', gender: 'f', suggestedVoice: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', note: 'ElevenLabs · clear female voice, ideal for slow monologue' } },
  ],
  instructions: 'Questions 6-10. Complete the notes below. Write NO MORE THAN ONE WORD OR A NUMBER for each answer.',
  targetDurationSec: 115,
  script: [
    { speakerId: 'assistant', text: "Hello, and welcome to Sunrise Language School. My name is Sofia. I am your school assistant this week.", approxStartSec: 4 },
    { speakerId: 'assistant', text: "This is the classroom for the Beginner English course. There are twelve students in this class.", approxStartSec: 15 },
    { speakerId: 'assistant', text: "Your teacher is Mister Brown. He is British and very friendly.", approxStartSec: 30 },
    { speakerId: 'assistant', text: "The class starts at ten o'clock every morning. Please come five minutes early.", approxStartSec: 40 },
    { speakerId: 'assistant', text: "The classroom is on the second floor, room number four.", approxStartSec: 52 },
    { speakerId: 'assistant', text: "Every day, you have three hours of English. In the middle, there is a break of twenty minutes.", approxStartSec: 62 },
    { speakerId: 'assistant', text: "You can go to the café next to the school. The coffee is not free, but it is very good.", approxStartSec: 78 },
    { speakerId: 'assistant', text: "For the class, you need a notebook and a pen. The books are already on your desk.", approxStartSec: 90 },
    { speakerId: 'assistant', text: "Please listen. This week, we do not have homework. But next week, there is a small exam. The exam is on Thursday.", approxStartSec: 100 },
    { speakerId: 'assistant', text: "Any questions? Ok, good luck and have fun.", approxStartSec: 115 },
  ],
  questions: s2Questions,
};

// ─── SECTION 3 · Two students planning a school project ─────────────

const s3Questions: ListeningQuestion[] = [
  {
    id: 'la1-s3-q11',
    section: 3,
    type: 'short-answer',
    prompt: 'What is the topic of the project?',
    wordLimit: 3,
    allowNumbers: false,
    accepted: ['my favorite food', 'my favourite food', 'favorite food', 'favourite food'],
    audioTimestamp: 15,
    cognitiveLoad: 'literal',
    difficulty: 'easy',
    teacherNote: 'Accepts both US ("favorite") and UK ("favourite") spellings.',
  },
  {
    id: 'la1-s3-q12',
    section: 3,
    type: 'note-completion',
    prompt: 'Number of pictures needed: ____',
    contextBefore: 'Pictures:',
    wordLimit: 1,
    allowNumbers: true,
    accepted: ['2', 'two'],
    audioTimestamp: 45,
    cognitiveLoad: 'literal',
    difficulty: 'easy',
  },
  {
    id: 'la1-s3-q13',
    section: 3,
    type: 'note-completion',
    prompt: 'Word count for the poster: ____',
    contextBefore: 'Words:',
    wordLimit: 1,
    allowNumbers: true,
    accepted: ['300', 'three hundred'],
    audioTimestamp: 60,
    cognitiveLoad: 'literal',
    difficulty: 'easy',
  },
  {
    id: 'la1-s3-q14',
    section: 3,
    type: 'multiple-choice',
    prompt: 'When do they need to give the project to the teacher?',
    options: [
      { id: 'a', text: 'Saturday' },
      { id: 'b', text: 'Sunday' },
      { id: 'c', text: 'Monday' },
    ],
    correct: 'c',
    audioTimestamp: 75,
    cognitiveLoad: 'detail',
    difficulty: 'medium',
    teacherNote: 'Saturday is when they meet to work, Sunday is football training. Monday is the deadline.',
    distractorRisks: ['a (Saturday is meeting day)', 'b (Sunday is football training)'],
  },
  {
    id: 'la1-s3-q15',
    section: 3,
    type: 'short-answer',
    prompt: 'Where do they meet on Saturday?',
    wordLimit: 1,
    allowNumbers: false,
    accepted: ['library', 'the library'],
    audioTimestamp: 95,
    cognitiveLoad: 'literal',
    difficulty: 'easy',
  },
];

const s3PreListening: PreListeningPrep = {
  headline: 'Antes de escuchar · Planificando un proyecto escolar',
  scenarioPreview: 'Dos compañeros de clase, Maria y Peter, planifican un proyecto para la escuela sobre su comida favorita. Deciden cuántas fotos y palabras necesitan, y cuándo se van a juntar a trabajar.',
  vocabulary: [
    { word: 'project',        pos: 'noun',      translation: 'proyecto (tarea escolar)', example: 'Are you ready for the school project?' },
    { word: 'topic',          pos: 'noun',      translation: 'tema',                     example: 'What is the topic?' },
    { word: 'poster',         pos: 'noun',      translation: 'afiche, póster',           example: 'We need to make a poster.' },
    { word: 'favorite food',  pos: 'phrase',    translation: 'comida favorita (US) / favourite (UK)', example: 'The topic is My Favorite Food.' },
    { word: 'picture',        pos: 'noun',      translation: 'foto, imagen',             example: 'Two pictures, please.' },
    { word: 'meet',           pos: 'verb',      translation: 'encontrarse, juntarse',    example: 'We can meet on Saturday morning.' },
    { word: 'library',        pos: 'noun',      translation: 'biblioteca',               example: 'The library. It is quiet.', soundsLike: 'LAI-brer-i' },
    { word: 'training',       pos: 'noun',      translation: 'entrenamiento',            example: 'I have football training on Sunday.' },
  ],
  listenFor: [
    'El tema del proyecto.',
    'Cuántas fotos y cuántas palabras necesita el póster.',
    'Cuándo tienen que entregar el proyecto (¡ojo con los días — hay dos distractores!).',
    'Dónde se juntan el sábado.',
  ],
};

const section3: ListeningSection = {
  number: 3,
  contextType: 'academic-discussion',
  title: 'Class project — planning a food poster',
  scenario: 'Two classmates, Maria and Peter, plan a simple school project about their favorite food. They discuss the topic, the poster requirements and when they will meet to work on it.',
  preListening: s3PreListening,
  speakers: [
    { id: 'maria', displayName: 'Maria (student)', accent: 'UK', gender: 'f', suggestedVoice: { voiceId: 'ThT5KcBeYPX3keUQqHPh', name: 'Dorothy', note: 'ElevenLabs · younger UK female' } },
    { id: 'peter', displayName: 'Peter (student)', accent: 'NZ', gender: 'm', suggestedVoice: { voiceId: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam',    note: 'ElevenLabs · male voice, distinct from Maria' } },
  ],
  instructions: 'Questions 11-15. Listen to a conversation between two students. Answer the questions below. Word limits are shown per question.',
  targetDurationSec: 120,
  script: [
    { speakerId: 'maria', text: "Hi Peter. Are you ready for the school project?", approxStartSec: 4 },
    { speakerId: 'peter', text: "Hi Maria. Not yet. What is the topic?", approxStartSec: 10 },
    { speakerId: 'maria', text: "The topic is My Favorite Food. We need to make a poster.", approxStartSec: 15 },
    { speakerId: 'peter', text: "Oh, nice! My favorite food is pizza.", approxStartSec: 24 },
    { speakerId: 'maria', text: "I love apples and salad. But pizza is a good example.", approxStartSec: 30 },
    { speakerId: 'peter', text: "Do we need pictures for the poster?", approxStartSec: 40 },
    { speakerId: 'maria', text: "Yes. Two pictures, please. One picture of the food, and one picture of the country.", approxStartSec: 45 },
    { speakerId: 'peter', text: "Ok. And how many words?", approxStartSec: 56 },
    { speakerId: 'maria', text: "Three hundred words. Not too long.", approxStartSec: 60 },
    { speakerId: 'peter', text: "Good. When do we give the project to the teacher?", approxStartSec: 68 },
    { speakerId: 'maria', text: "The teacher wants the poster on Monday.", approxStartSec: 75 },
    { speakerId: 'peter', text: "Monday? That is fast. I have football training on Sunday.", approxStartSec: 82 },
    { speakerId: 'maria', text: "Don't worry. We can meet on Saturday morning.", approxStartSec: 90 },
    { speakerId: 'peter', text: "Ok. Where?", approxStartSec: 95 },
    { speakerId: 'maria', text: "The library. It is quiet.", approxStartSec: 97 },
    { speakerId: 'peter', text: "Perfect. What time?", approxStartSec: 103 },
    { speakerId: 'maria', text: "Ten o'clock. We can work for two hours.", approxStartSec: 106 },
    { speakerId: 'peter', text: "Great. And after that, we can go for pizza!", approxStartSec: 112 },
    { speakerId: 'maria', text: "Very funny, Peter. See you on Saturday.", approxStartSec: 118 },
  ],
  questions: s3Questions,
};

// ─── SECTION 4 · Short talk — Healthy morning habits ─────────────────

const s4Questions: ListeningQuestion[] = [
  {
    id: 'la1-s4-q16',
    section: 4,
    type: 'note-completion',
    prompt: 'First thing when you wake up: drink ____',
    contextBefore: 'First:',
    wordLimit: 1,
    allowNumbers: false,
    accepted: ['water'],
    audioTimestamp: 22,
    cognitiveLoad: 'literal',
    difficulty: 'easy',
  },
  {
    id: 'la1-s4-q17',
    section: 4,
    type: 'note-completion',
    prompt: 'A good breakfast has fruit, bread and ____',
    contextBefore: 'Breakfast:',
    wordLimit: 1,
    allowNumbers: false,
    accepted: ['eggs', 'egg'],
    audioTimestamp: 42,
    cognitiveLoad: 'literal',
    difficulty: 'easy',
  },
  {
    id: 'la1-s4-q18',
    section: 4,
    type: 'note-completion',
    prompt: 'Minutes of walking recommended: ____',
    contextBefore: 'Walking:',
    contextAfter: 'minutes',
    wordLimit: 1,
    allowNumbers: true,
    accepted: ['10', 'ten'],
    audioTimestamp: 62,
    cognitiveLoad: 'literal',
    difficulty: 'easy',
  },
  {
    id: 'la1-s4-q19',
    section: 4,
    type: 'table-completion',
    prompt: 'Sleep hours for adults',
    contextAfter: 'hours',
    wordLimit: 1,
    allowNumbers: true,
    accepted: ['8', 'eight'],
    audioTimestamp: 85,
    cognitiveLoad: 'detail',
    difficulty: 'medium',
    teacherNote: 'Two numbers close together (8 and 10). Careful with which group.',
    distractorRisks: ['10 (that\'s children\'s hours)'],
  },
  {
    id: 'la1-s4-q20',
    section: 4,
    type: 'table-completion',
    prompt: 'Sleep hours for children',
    contextAfter: 'hours',
    wordLimit: 1,
    allowNumbers: true,
    accepted: ['10', 'ten'],
    audioTimestamp: 92,
    cognitiveLoad: 'detail',
    difficulty: 'medium',
  },
];

const s4PreListening: PreListeningPrep = {
  headline: 'Antes de escuchar · Hábitos saludables por la mañana',
  scenarioPreview: 'Una profesora da una charla corta sobre tres hábitos saludables para empezar el día: agua, un buen desayuno y ejercicio ligero. También menciona cuántas horas de sueño necesitan los adultos y los niños.',
  vocabulary: [
    { word: 'habit',          pos: 'noun',      translation: 'hábito, costumbre',          example: 'Healthy morning habits.', soundsLike: 'HA-bit' },
    { word: 'wake up',        pos: 'phrase',    translation: 'despertarse',                example: 'When you wake up, drink water.' },
    { word: 'breakfast',      pos: 'noun',      translation: 'desayuno',                    example: 'Do not forget breakfast.', soundsLike: 'BREK-fast' },
    { word: 'eggs',           pos: 'noun',      translation: 'huevos',                      example: 'Fruit, bread, and eggs.' },
    { word: 'exercise',       pos: 'noun',      translation: 'ejercicio (físico)',          example: 'Third, exercise.', soundsLike: 'EK-ser-saiz' },
    { word: 'walking',        pos: 'noun',      translation: 'caminar (como actividad)',    example: 'Ten minutes of walking is enough.' },
    { word: 'sleep',          pos: 'noun',      translation: 'sueño, dormir',               example: 'Sleep is very important.' },
    { word: 'adults / children', pos: 'noun',   translation: 'adultos / niños',             example: 'Adults need 8 hours; children need more.' },
  ],
  listenFor: [
    'Qué se toma primero al despertarse.',
    'Los tres alimentos del desayuno.',
    'Cuántos minutos de caminata se recomiendan.',
    'Cuántas horas de sueño necesitan los adultos vs los niños (¡son números cercanos!).',
  ],
};

const section4: ListeningSection = {
  number: 4,
  contextType: 'academic-lecture',
  title: 'Healthy morning habits — short talk',
  scenario: 'A teacher gives a short, simple talk about three healthy morning habits: water, breakfast and light exercise. She also mentions how many hours of sleep adults and children need.',
  preListening: s4PreListening,
  speakers: [
    { id: 'teacher', displayName: 'Ms Clark (teacher)', accent: 'UK', gender: 'f', suggestedVoice: { voiceId: 'ThT5KcBeYPX3keUQqHPh', name: 'Dorothy', note: 'ElevenLabs · calm UK female — clear at slow speed' } },
  ],
  instructions: 'Questions 16-20. Complete the notes and the table. Write NO MORE THAN ONE WORD OR A NUMBER for each answer.',
  targetDurationSec: 110,
  script: [
    { speakerId: 'teacher', text: "Good morning, class. Today I want to talk about healthy morning habits.", approxStartSec: 4 },
    { speakerId: 'teacher', text: "In the morning, our body is tired. So we need three important things: water, food, and exercise.", approxStartSec: 12 },
    { speakerId: 'teacher', text: "First, water. When you wake up, drink a big glass of water. It is very good for you.", approxStartSec: 22 },
    { speakerId: 'teacher', text: "Second, food. Please, do not forget breakfast.", approxStartSec: 36 },
    { speakerId: 'teacher', text: "A good breakfast has fruit, bread, and eggs. Fruit gives you energy for the day.", approxStartSec: 42 },
    { speakerId: 'teacher', text: "Third, exercise. You do not need a gym. Ten minutes of walking is enough.", approxStartSec: 55 },
    { speakerId: 'teacher', text: "Walking is easy, and it is free.", approxStartSec: 68 },
    { speakerId: 'teacher', text: "Also, please do not use your phone in bed. When you wake up, read a book or listen to music.", approxStartSec: 74 },
    { speakerId: 'teacher', text: "Now, sleep. Sleep is very important. Adults need eight hours of sleep every night.", approxStartSec: 85 },
    { speakerId: 'teacher', text: "Children need more sleep. About ten hours.", approxStartSec: 96 },
    { speakerId: 'teacher', text: "So please, remember: water, breakfast, and walking. Small things, big changes.", approxStartSec: 102 },
  ],
  questions: s4Questions,
  tableLayouts: [
    {
      title: 'Sleep hours per group',
      rows: [
        { label: 'Adults',   value: { blank: true, questionId: 'la1-s4-q19', suffix: 'hours' } },
        { label: 'Children', value: { blank: true, questionId: 'la1-s4-q20', suffix: 'hours' } },
      ],
    },
  ],
};

// ─── The mock ────────────────────────────────────────────────────────

export const listeningBeginnersMock1: ListeningMock = {
  id: 'listening-beginners-mock-1',
  title: 'Beginners · Mock 1 (A2)',
  level: 'General Training',
  cefrLevel: 'A2',
  createdAt: '2026-08-27',
  targetBandRange: [3, 4.5],
  sections: [section1, section2, section3, section4],
  totalQuestions: 20,
  totalDurationSec: 120 + 115 + 120 + 110,
};
