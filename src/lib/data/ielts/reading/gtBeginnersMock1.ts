// FriendlyTeaching.cl — IELTS GT Beginners · Reading Mock 1 (A2)
//
// IELTS-shaped 3-section Reading mock designed for A2 students. The format
// mirrors the real GT paper (Section 1 social survival → Section 2 workplace
// → Section 3 general interest), but every dimension is trimmed for CEFR A2:
//
//   • ~150-220 words per passage (real GT is 700-900).
//   • 5 questions per section (15 total, not 40).
//   • Duration target: 30 minutes (real GT is 60).
//   • Question types kept to the A2-friendly set:
//       true-false-not-given, multiple-choice (3 options),
//       matching-features (visible option bank), sentence-completion
//       and short-answer.
//     No matching-headings, matching-information, YNNG, flow-chart or
//     diagram-label — those overwhelm A2 processing capacity.
//   • Everyday, high-frequency vocabulary (schedules, food, workplace
//     signage, short factual text about animals).
//
// Grading: the shared grader scales the raw score to /40 before mapping to
// the official GT band table, so a 12/15 is treated as ~32/40 (Band 6.5).
// The band shown is still a rough estimate; the value for A2 students is the
// per-section and per-type diagnostic more than the number itself.

import type {
  ReadingMock, ReadingSection, ReadingQuestion,
} from '@/types/ielts-reading';

// ─── SECTION 1 · Social survival · Community centre notices ────────────
//
// Two short "notice board" texts. Text A is a list of five weekly classes
// (matching-features fodder — five clearly named items in a shared bank).
// Text B is a short "About us" paragraph so we can add one TFNG and one
// short-answer without stretching Text A. The whole section stays under
// ~180 words to keep A2 scanning tractable.

const s1Questions: ReadingQuestion[] = [
  {
    id: 'rb1-s1-q1',
    section: 1,
    type: 'matching-features',
    prompt: 'Which class costs the most?',
    leftItem: 'Most expensive class',
    options: [
      { id: 'a', text: 'Yoga for Beginners' },
      { id: 'b', text: 'Kids Football' },
      { id: 'c', text: 'Spanish Conversation' },
      { id: 'd', text: 'Baby Music' },
      { id: 'e', text: 'Digital Skills for Seniors' },
    ],
    correct: 'c',
    reusable: true,
    cognitiveLoad: 'detail',
    difficulty: 'easy',
    answerLocator: 'Spanish Conversation — £5 per session (highest listed price).',
    teacherNote: 'Two classes cost £0 (Baby Music, Digital Skills). Yoga is £4 and Kids Football is £3, so Spanish at £5 is the winner. A2 students should scan the price column.',
    distractorRisks: ['Yoga for Beginners (£4, close to £5)'],
  },
  {
    id: 'rb1-s1-q2',
    section: 1,
    type: 'matching-features',
    prompt: 'Which class is on Wednesday?',
    leftItem: 'On Wednesday',
    options: [
      { id: 'a', text: 'Yoga for Beginners' },
      { id: 'b', text: 'Kids Football' },
      { id: 'c', text: 'Spanish Conversation' },
      { id: 'd', text: 'Baby Music' },
      { id: 'e', text: 'Digital Skills for Seniors' },
    ],
    correct: 'b',
    reusable: true,
    cognitiveLoad: 'literal',
    difficulty: 'easy',
    answerLocator: 'Kids Football — Wednesday, 5:00 pm.',
  },
  {
    id: 'rb1-s1-q3',
    section: 1,
    type: 'matching-features',
    prompt: 'Which class is for very young children?',
    leftItem: 'For very young children',
    options: [
      { id: 'a', text: 'Yoga for Beginners' },
      { id: 'b', text: 'Kids Football' },
      { id: 'c', text: 'Spanish Conversation' },
      { id: 'd', text: 'Baby Music' },
      { id: 'e', text: 'Digital Skills for Seniors' },
    ],
    correct: 'd',
    reusable: true,
    cognitiveLoad: 'literal',
    difficulty: 'easy',
    answerLocator: 'Baby Music — for children under 2 years old.',
    teacherNote: 'Kids Football is also "for kids", but the age is 7-10. "Very young" points to Baby Music.',
    distractorRisks: ['Kids Football (also for children, but older)'],
  },
  {
    id: 'rb1-s1-q4',
    section: 1,
    type: 'true-false-not-given',
    prompt: 'You must be a member of the centre to join a class.',
    correct: 'false',
    cognitiveLoad: 'inferential',
    difficulty: 'medium',
    answerLocator: 'Text B: "You do not need a membership card. Everyone is welcome."',
    teacherNote: 'A2 twist: the text uses "You do not need..." — students must map that to FALSE. Common A2 trap is to say NOT GIVEN because the word "member" appears in the question but not the passage.',
    distractorRisks: ['Guessing NOT GIVEN because "member" is not in the exact text'],
  },
  {
    id: 'rb1-s1-q5',
    section: 1,
    type: 'short-answer',
    prompt: 'Which day is the centre closed?',
    wordLimit: 1,
    allowNumbers: false,
    accepted: ['Sunday'],
    cognitiveLoad: 'literal',
    difficulty: 'easy',
    answerLocator: 'Text B: "We are open every day except Sunday."',
  },
];

const s1: ReadingSection = {
  number: 1,
  contextType: 'social-survival',
  title: 'Riverside Community Centre — weekly classes',
  scenario: 'A student is looking at the notice board at Riverside Community Centre to find a class. The board lists five weekly classes and a short "About us" note.',
  instructions: 'Questions 1-5. Read the two texts below and answer the questions. For questions 1-3 choose ONE class from the list. For question 4 write TRUE, FALSE or NOT GIVEN. For question 5 write ONE WORD only.',
  passages: [
    {
      id: 'rb1-s1-pA',
      title: 'This week at Riverside Community Centre',
      subtitle: 'Text A · Class timetable',
      paragraphs: [
        {
          label: '1',
          text: 'Yoga for Beginners — Monday, 7:00 pm. Small class in Studio 1. £4 per session. Bring your own mat.',
        },
        {
          label: '2',
          text: 'Kids Football — Wednesday, 5:00 pm. For children aged 7 to 10. Meet on the outside pitch. £3 per child.',
        },
        {
          label: '3',
          text: 'Spanish Conversation — Tuesday, 6:30 pm. Talk with a native teacher in a friendly group of six. £5 per session.',
        },
        {
          label: '4',
          text: 'Baby Music — Thursday, 10:00 am. For children under 2 years old with a parent. Songs and simple instruments. Free.',
        },
        {
          label: '5',
          text: 'Digital Skills for Seniors — Friday, 2:00 pm. Learn to use email and video calls. For people over 60. Free.',
        },
      ],
    },
    {
      id: 'rb1-s1-pB',
      title: 'About the centre',
      subtitle: 'Text B',
      paragraphs: [
        {
          label: 'A',
          text: 'Riverside Community Centre is a small building next to the river. We are open every day except Sunday, from 9:00 am to 9:00 pm. You do not need a membership card. Everyone is welcome.',
        },
        {
          label: 'B',
          text: 'To join a class, come to the office 10 minutes before it starts. You can pay in cash or with your phone. The classes have limited places, so please arrive early.',
        },
      ],
    },
  ],
  questions: s1Questions,
  targetDurationMin: 8,
};

// ─── SECTION 2 · Workplace · Kitchen staff notice ──────────────────────
//
// A single short workplace notice — a memo from a café manager to new
// kitchen staff. All A2 vocabulary (wash, wear, phones, break, sick,
// manager). Five questions: three TFNG and two sentence-completion. This
// section trains students on rule/instruction texts, a very common GT
// Section 2 shape.

const s2Questions: ReadingQuestion[] = [
  {
    id: 'rb1-s2-q6',
    section: 2,
    type: 'true-false-not-given',
    prompt: 'Kitchen staff must wash their hands before starting work.',
    correct: 'true',
    cognitiveLoad: 'literal',
    difficulty: 'easy',
    answerLocator: 'Rule 1: "Wash your hands with soap when you arrive."',
  },
  {
    id: 'rb1-s2-q7',
    section: 2,
    type: 'true-false-not-given',
    prompt: 'You can use your phone in the kitchen for short calls.',
    correct: 'false',
    cognitiveLoad: 'inferential',
    difficulty: 'medium',
    answerLocator: 'Rule 3: "No phones in the kitchen. Leave your phone in your bag."',
    teacherNote: 'The passage bans phones entirely, so any use is false. Some A2 students may pick NOT GIVEN because "short calls" is not mentioned; the point is that the text is absolute.',
    distractorRisks: ['NOT GIVEN because "short calls" is not the exact wording'],
  },
  {
    id: 'rb1-s2-q8',
    section: 2,
    type: 'true-false-not-given',
    prompt: 'New staff earn more money after three months.',
    correct: 'not-given',
    cognitiveLoad: 'literal',
    difficulty: 'medium',
    answerLocator: 'The passage does not mention salary or pay increases.',
    teacherNote: 'Classic NOT GIVEN — the memo is about hygiene and schedule rules, not pay. A2 students often want to guess TRUE because "three months" appears (probation period).',
    distractorRisks: ['Guessing TRUE because "three months" appears in the passage'],
  },
  {
    id: 'rb1-s2-q9',
    section: 2,
    type: 'sentence-completion',
    prompt: 'Kitchen staff must wear a ____ on their head.',
    contextBefore: 'Kitchen staff must wear a',
    contextAfter: 'on their head.',
    wordLimit: 1,
    allowNumbers: false,
    accepted: ['hat'],
    cognitiveLoad: 'literal',
    difficulty: 'easy',
    answerLocator: 'Rule 2: "Please wear a clean hat when you cook."',
  },
  {
    id: 'rb1-s2-q10',
    section: 2,
    type: 'sentence-completion',
    prompt: 'The break for staff starts at ____ o\'clock.',
    contextBefore: 'The break for staff starts at',
    contextAfter: "o'clock.",
    wordLimit: 1,
    allowNumbers: true,
    accepted: ['3', 'three'],
    cognitiveLoad: 'literal',
    difficulty: 'easy',
    answerLocator: 'Rule 4: "Your break is at 3 o\'clock. It is 20 minutes long."',
  },
];

const s2: ReadingSection = {
  number: 2,
  contextType: 'workplace',
  title: 'Notice for new kitchen staff — Blue Cup Café',
  scenario: 'A new kitchen assistant reads the rules the café manager has left on the staff notice board. Very short, clear rules on hygiene, phones, break time and sickness.',
  instructions: 'Questions 6-10. Read the notice and answer the questions. For questions 6-8 write TRUE, FALSE or NOT GIVEN. For questions 9-10 write ONE WORD OR A NUMBER only.',
  passages: [
    {
      id: 'rb1-s2-p1',
      title: 'Kitchen rules — please read before your first day',
      subtitle: 'From: Maria, Manager · Blue Cup Café',
      paragraphs: [
        {
          label: 'A',
          text: 'Welcome to the Blue Cup Café. All new kitchen staff work three months as a trainee. Your first week is with Chef Ana. Please read and follow these rules every day.',
        },
        {
          label: 'B',
          text: 'Rule 1. Wash your hands with soap when you arrive and after every break. Clean hands are the most important rule in the kitchen.',
        },
        {
          label: 'C',
          text: 'Rule 2. Please wear a clean hat when you cook. Also wear the black apron from the office, not your own clothes.',
        },
        {
          label: 'D',
          text: 'Rule 3. No phones in the kitchen. Leave your phone in your bag. If your family needs you, they can call the café phone.',
        },
        {
          label: 'E',
          text: 'Rule 4. Your break is at 3 o\'clock. It is 20 minutes long. You can eat in the small room next to the office. Please do not eat in the kitchen.',
        },
        {
          label: 'F',
          text: 'Rule 5. If you are sick, do not come to work. Call me before 8 in the morning. Do not send a message with a friend.',
        },
      ],
    },
  ],
  questions: s2Questions,
  targetDurationMin: 10,
};

// ─── SECTION 3 · General interest · Sea otters ─────────────────────────
//
// The "long text" of the paper, still short by A2 standards (~220 words),
// on a friendly, concrete topic. Question mix: two MCQs (3 options each),
// two sentence-completion, one short-answer. This section is where students
// meet the "read the whole thing before answering" habit.

const s3Questions: ReadingQuestion[] = [
  {
    id: 'rb1-s3-q11',
    section: 3,
    type: 'multiple-choice',
    prompt: 'Where do sea otters live?',
    options: [
      { id: 'a', text: 'In rivers in Africa.' },
      { id: 'b', text: 'In the cold sea near North America.' },
      { id: 'c', text: 'On beaches in Australia.' },
    ],
    correct: 'b',
    cognitiveLoad: 'literal',
    difficulty: 'easy',
    answerLocator: 'Paragraph A: "They live in the cold sea near the coast of North America."',
  },
  {
    id: 'rb1-s3-q12',
    section: 3,
    type: 'multiple-choice',
    prompt: 'Why do sea otters hold hands when they sleep?',
    options: [
      { id: 'a', text: 'Because they are cold.' },
      { id: 'b', text: 'Because they are hungry.' },
      { id: 'c', text: 'So that the water does not move them apart.' },
    ],
    correct: 'c',
    cognitiveLoad: 'inferential',
    difficulty: 'medium',
    answerLocator: 'Paragraph C: "They hold hands so the water does not carry them away from their family."',
    teacherNote: 'A2 students often pick "cold" because sea otters live in cold water. The passage is explicit about the reason: staying together with the family.',
    distractorRisks: ['Choosing "cold" because "cold sea" appears in the passage'],
  },
  {
    id: 'rb1-s3-q13',
    section: 3,
    type: 'sentence-completion',
    prompt: 'Sea otters use a small ____ to open the shells of their food.',
    contextBefore: 'Sea otters use a small',
    contextAfter: 'to open the shells of their food.',
    wordLimit: 1,
    allowNumbers: false,
    accepted: ['stone', 'rock'],
    cognitiveLoad: 'literal',
    difficulty: 'medium',
    answerLocator: 'Paragraph B: "The otter uses a small stone like a hammer to open the shell."',
    teacherNote: 'Both "stone" and "rock" are accepted — many students translate "piedra" as "rock". The passage uses "stone" so "stone" is the closest match.',
  },
  {
    id: 'rb1-s3-q14',
    section: 3,
    type: 'sentence-completion',
    prompt: 'Sea otters have very ____ fur to keep warm in the cold water.',
    contextBefore: 'Sea otters have very',
    contextAfter: 'fur to keep warm in the cold water.',
    wordLimit: 1,
    allowNumbers: false,
    accepted: ['thick'],
    cognitiveLoad: 'literal',
    difficulty: 'easy',
    answerLocator: 'Paragraph D: "Their fur is very thick — the thickest fur of any animal in the world."',
    distractorRisks: ['warm (from "keep warm" in the sentence itself)'],
  },
  {
    id: 'rb1-s3-q15',
    section: 3,
    type: 'short-answer',
    prompt: 'What is the biggest danger for sea otters today?',
    wordLimit: 2,
    allowNumbers: false,
    accepted: ['dirty water', 'polluted water', 'pollution'],
    cognitiveLoad: 'inferential',
    difficulty: 'medium',
    answerLocator: 'Paragraph E: "The biggest problem for sea otters is dirty water from cities and boats."',
    teacherNote: 'Passage says "dirty water" — accept the direct paraphrase "polluted water" and the noun "pollution". Do NOT accept "boats" alone: boats are one source of the dirty water, not the danger itself.',
    distractorRisks: ['boats', 'cities', 'people'],
  },
];

const s3: ReadingSection = {
  number: 3,
  contextType: 'general-interest',
  title: 'The sea otter — a small animal with a big story',
  scenario: 'A short factual article about sea otters — where they live, what they eat, why they sleep holding hands and what dangers they face.',
  instructions: 'Questions 11-15. Read the passage and answer the questions. For questions 11-12 choose A, B or C. For questions 13-14 write ONE WORD only. For question 15 write NO MORE THAN TWO WORDS.',
  passages: [
    {
      id: 'rb1-s3-p1',
      title: 'The sea otter',
      subtitle: 'From: Ocean Life for Young Readers, Chapter 4',
      paragraphs: [
        {
          label: 'A',
          text: 'The sea otter is a small brown animal with a very cute face. Adults are about one metre long. They live in the cold sea near the coast of North America. Sea otters do not go on the land — they eat, sleep and have their babies in the water.',
        },
        {
          label: 'B',
          text: 'Sea otters eat shellfish, small crabs and other food from the sea. Many of these animals live inside a hard shell. The otter uses a small stone like a hammer to open the shell. Sea otters are one of the few animals in the world that use a tool.',
        },
        {
          label: 'C',
          text: 'When a sea otter sleeps, it lies on its back on top of the water. Sea otters sleep in a big family group, and they hold hands. They hold hands so the water does not carry them away from their family in the night.',
        },
        {
          label: 'D',
          text: 'The water where they live is very cold. Most sea animals have a thick layer of fat to keep warm, but sea otters do not. Instead, they have very thick fur — the thickest fur of any animal in the world. They spend many hours every day cleaning it.',
        },
        {
          label: 'E',
          text: 'Sea otters have some enemies in the sea, like sharks and killer whales. But the biggest problem for sea otters is dirty water from cities and boats. When the water is dirty, the fur does not work well and the otters can get very cold.',
        },
      ],
      sourceNote: 'Original text written for FriendlyTeaching. Free to use with attribution.',
    },
  ],
  questions: s3Questions,
  targetDurationMin: 12,
};

// ─── Mock export ────────────────────────────────────────────────────

export const readingBeginnersMock1: ReadingMock = {
  id: 'reading-beginners-mock-1',
  title: 'Mock 1 · GT Beginners Reading',
  level: 'General Training',
  createdAt: '2026-09-14',
  targetBandRange: [3, 5],
  sections: [s1, s2, s3],
  totalQuestions: 15,
  totalDurationMin: 30,
  cefrLevel: 'A2',
};
