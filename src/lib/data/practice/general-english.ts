// FriendlyTeaching.cl — General English practice content
//
// Seed curriculum for the autonomous Daily Practice module. Covers A0
// through B2 for a general-English learner (NOT exam-specific; the IELTS
// specialization is a separate track).
//
// Keep units ~10 exercises each and mix exercise types so the learner
// gets variety. Vocabulary + grammar first (A0-A1), listening and
// reading drills come in a later content pass.

import type { PracticeUnit } from '@/types/practice';

export const PRACTICE_UNITS: PracticeUnit[] = [

  // ── A0 ─────────────────────────────────────────────────────

  {
    id: 'a0-greetings',
    level: 'A0',
    skill: 'vocabulary',
    title: 'Hello & My Name',
    description: 'Basic greetings and introducing yourself.',
    icon: '👋',
    exercises: [
      {
        id: 'a0-greetings-01',
        type: 'multiple-choice',
        prompt: 'Someone says "Hello" to you. What do you say back?',
        options: ['Goodbye.', 'Hello!', 'Thank you.', 'Sorry.'],
        correctIndex: 1,
      },
      {
        id: 'a0-greetings-02',
        type: 'fill-blank',
        prompt: 'Complete the sentence.',
        sentence: '___ name is Anna.',
        answers: ['my'],
      },
      {
        id: 'a0-greetings-03',
        type: 'multiple-choice',
        prompt: 'Which is the most natural first thing to say when you meet someone new?',
        options: ['Goodbye.', 'See you tomorrow.', 'Nice to meet you.', 'I am fine.'],
        correctIndex: 2,
        explain: '"Nice to meet you" is the standard greeting the first time you meet someone.',
      },
      {
        id: 'a0-greetings-04',
        type: 'fill-blank',
        prompt: 'Reply to "How are you?"',
        sentence: 'I ___ fine, thanks.',
        answers: ['am'],
        alts: [["'m"]],
      },
      {
        id: 'a0-greetings-05',
        type: 'match-pairs',
        prompt: 'Match the greeting with its reply.',
        pairs: [
          { left: 'Hello!',          right: 'Hi!' },
          { left: 'How are you?',    right: "I'm fine, thanks." },
          { left: "What's your name?", right: 'My name is Anna.' },
          { left: 'Nice to meet you.', right: 'Nice to meet you too.' },
        ],
      },
      {
        id: 'a0-greetings-06',
        type: 'multiple-choice',
        prompt: 'You are leaving. What do you say?',
        options: ['Hello.', 'Please.', 'Goodbye.', 'Yes.'],
        correctIndex: 2,
      },
      {
        id: 'a0-greetings-07',
        type: 'fill-blank',
        prompt: "Ask for someone's name.",
        sentence: 'What ___ your name?',
        answers: ['is'],
        alts: [["'s"]],
      },
      {
        id: 'a0-greetings-08',
        type: 'multiple-choice',
        prompt: 'Which greeting is used in the morning?',
        options: ['Good evening.', 'Good night.', 'Good morning.', 'Goodbye.'],
        correctIndex: 2,
      },
      {
        id: 'a0-greetings-09',
        type: 'fill-blank',
        prompt: 'Say where you are from.',
        sentence: 'I ___ from Chile.',
        answers: ['am'],
        alts: [["'m"]],
      },
      {
        id: 'a0-greetings-10',
        type: 'multiple-choice',
        prompt: 'The teacher helps you. What do you say?',
        options: ['Hello.', 'Thank you.', 'Please.', 'Sorry.'],
        correctIndex: 1,
      },
    ],
  },

  {
    id: 'a0-numbers',
    level: 'A0',
    skill: 'vocabulary',
    title: 'Numbers 1–20',
    description: 'Reading, writing and using numbers from 1 to 20.',
    icon: '🔢',
    exercises: [
      {
        id: 'a0-numbers-01',
        type: 'multiple-choice',
        prompt: 'How do you write 5?',
        options: ['four', 'five', 'six', 'nine'],
        correctIndex: 1,
      },
      {
        id: 'a0-numbers-02',
        type: 'multiple-choice',
        prompt: 'How do you write 12?',
        options: ['twenty', 'two', 'twelve', 'ten'],
        correctIndex: 2,
      },
      {
        id: 'a0-numbers-03',
        type: 'fill-blank',
        prompt: 'Complete the number.',
        sentence: 'Seven, eight, ___, ten.',
        answers: ['nine'],
      },
      {
        id: 'a0-numbers-04',
        type: 'match-pairs',
        prompt: 'Match the number with the word.',
        pairs: [
          { left: '1',  right: 'one' },
          { left: '7',  right: 'seven' },
          { left: '13', right: 'thirteen' },
          { left: '20', right: 'twenty' },
        ],
      },
      {
        id: 'a0-numbers-05',
        type: 'multiple-choice',
        prompt: '"How old are you?" — I am 15.',
        options: ['five',  'fifteen',  'fifty',  'four'],
        correctIndex: 1,
      },
      {
        id: 'a0-numbers-06',
        type: 'fill-blank',
        prompt: 'Write the number in words.',
        sentence: '3 = ___',
        answers: ['three'],
      },
      {
        id: 'a0-numbers-07',
        type: 'multiple-choice',
        prompt: 'Which is the number eleven?',
        options: ['10', '12', '11', '21'],
        correctIndex: 2,
      },
      {
        id: 'a0-numbers-08',
        type: 'fill-blank',
        prompt: 'Fill in the missing number.',
        sentence: 'Eighteen, nineteen, ___.',
        answers: ['twenty'],
      },
      {
        id: 'a0-numbers-09',
        type: 'match-pairs',
        prompt: 'Match the pairs.',
        pairs: [
          { left: '4',  right: 'four' },
          { left: '8',  right: 'eight' },
          { left: '14', right: 'fourteen' },
          { left: '18', right: 'eighteen' },
        ],
      },
      {
        id: 'a0-numbers-10',
        type: 'multiple-choice',
        prompt: 'Which number comes after sixteen?',
        options: ['fifteen', 'seventeen', 'eighteen', 'nineteen'],
        correctIndex: 1,
      },
    ],
  },

  // ── A1 ─────────────────────────────────────────────────────

  {
    id: 'a1-verb-to-be',
    level: 'A1',
    skill: 'grammar',
    title: 'The verb "to be"',
    description: 'am / is / are in positive, negative and questions.',
    icon: '🔤',
    exercises: [
      {
        id: 'a1-be-01',
        type: 'fill-blank',
        prompt: 'Complete with am / is / are.',
        sentence: 'I ___ a student.',
        answers: ['am'],
      },
      {
        id: 'a1-be-02',
        type: 'fill-blank',
        prompt: 'Complete with am / is / are.',
        sentence: 'She ___ my sister.',
        answers: ['is'],
      },
      {
        id: 'a1-be-03',
        type: 'fill-blank',
        prompt: 'Complete with am / is / are.',
        sentence: 'They ___ from Brazil.',
        answers: ['are'],
      },
      {
        id: 'a1-be-04',
        type: 'multiple-choice',
        prompt: 'Choose the correct form.',
        options: [
          'He are tall.',
          'He is tall.',
          'He am tall.',
          'He be tall.',
        ],
        correctIndex: 1,
      },
      {
        id: 'a1-be-05',
        type: 'multiple-choice',
        prompt: 'Which is the negative of "I am happy"?',
        options: [
          'I not am happy.',
          'I am no happy.',
          "I'm not happy.",
          "I don't am happy.",
        ],
        correctIndex: 2,
        explain: "Negatives of 'to be' use not after the verb: am not → I'm not.",
      },
      {
        id: 'a1-be-06',
        type: 'fill-blank',
        prompt: 'Make a question.',
        sentence: '___ you tired?',
        answers: ['are'],
      },
      {
        id: 'a1-be-07',
        type: 'match-pairs',
        prompt: 'Match subject + form of "to be".',
        pairs: [
          { left: 'I',    right: 'am' },
          { left: 'He',   right: 'is' },
          { left: 'We',   right: 'are' },
          { left: 'They', right: 'are' },
        ],
      },
      {
        id: 'a1-be-08',
        type: 'fill-blank',
        prompt: 'Complete the short answer.',
        sentence: '"Is she your teacher?" — "Yes, she ___."',
        answers: ['is'],
      },
      {
        id: 'a1-be-09',
        type: 'multiple-choice',
        prompt: 'Choose the correct question.',
        options: [
          'Is you from Mexico?',
          'Are you from Mexico?',
          'Am you from Mexico?',
          'Be you from Mexico?',
        ],
        correctIndex: 1,
      },
      {
        id: 'a1-be-10',
        type: 'fill-blank',
        prompt: 'Complete with am / is / are.',
        sentence: 'My brothers ___ at school.',
        answers: ['are'],
      },
    ],
  },

  {
    id: 'a1-family',
    level: 'A1',
    skill: 'vocabulary',
    title: 'Family',
    description: 'Family members and talking about relationships.',
    icon: '👨‍👩‍👧',
    exercises: [
      {
        id: 'a1-family-01',
        type: 'match-pairs',
        prompt: 'Match the family word with its meaning.',
        pairs: [
          { left: 'mother',  right: 'mamá' },
          { left: 'father',  right: 'papá' },
          { left: 'sister',  right: 'hermana' },
          { left: 'brother', right: 'hermano' },
        ],
      },
      {
        id: 'a1-family-02',
        type: 'multiple-choice',
        prompt: 'My father\'s father is my ___.',
        options: ['uncle', 'cousin', 'grandfather', 'brother'],
        correctIndex: 2,
      },
      {
        id: 'a1-family-03',
        type: 'fill-blank',
        prompt: 'Complete the sentence.',
        sentence: 'My mother\'s sister is my ___.',
        answers: ['aunt'],
      },
      {
        id: 'a1-family-04',
        type: 'multiple-choice',
        prompt: 'The children of your aunt and uncle are your ___.',
        options: ['siblings', 'parents', 'cousins', 'grandparents'],
        correctIndex: 2,
      },
      {
        id: 'a1-family-05',
        type: 'match-pairs',
        prompt: 'Match the pair.',
        pairs: [
          { left: 'son',       right: 'hijo' },
          { left: 'daughter',  right: 'hija' },
          { left: 'husband',   right: 'esposo' },
          { left: 'wife',      right: 'esposa' },
        ],
      },
      {
        id: 'a1-family-06',
        type: 'fill-blank',
        prompt: 'Complete the sentence.',
        sentence: 'My parents\' parents are my ___.',
        answers: ['grandparents'],
      },
      {
        id: 'a1-family-07',
        type: 'multiple-choice',
        prompt: 'Which word means "brothers and sisters"?',
        options: ['parents', 'siblings', 'cousins', 'friends'],
        correctIndex: 1,
      },
      {
        id: 'a1-family-08',
        type: 'fill-blank',
        prompt: 'Complete the sentence.',
        sentence: 'My brother\'s son is my ___.',
        answers: ['nephew'],
      },
      {
        id: 'a1-family-09',
        type: 'multiple-choice',
        prompt: 'My sister\'s daughter is my ___.',
        options: ['nephew', 'niece', 'cousin', 'daughter'],
        correctIndex: 1,
      },
      {
        id: 'a1-family-10',
        type: 'match-pairs',
        prompt: 'Match the pair.',
        pairs: [
          { left: 'uncle',       right: 'tío' },
          { left: 'aunt',        right: 'tía' },
          { left: 'grandmother', right: 'abuela' },
          { left: 'grandfather', right: 'abuelo' },
        ],
      },
    ],
  },

  // ── A2 ─────────────────────────────────────────────────────

  {
    id: 'a2-present-simple',
    level: 'A2',
    skill: 'grammar',
    title: 'Present Simple',
    description: 'Routines, habits and facts in the present.',
    icon: '🔁',
    exercises: [
      {
        id: 'a2-ps-01',
        type: 'fill-blank',
        prompt: 'Complete with the correct form.',
        sentence: 'She ___ coffee every morning. (drink)',
        answers: ['drinks'],
      },
      {
        id: 'a2-ps-02',
        type: 'fill-blank',
        prompt: 'Complete with the correct form.',
        sentence: 'They ___ in a small town. (live)',
        answers: ['live'],
      },
      {
        id: 'a2-ps-03',
        type: 'multiple-choice',
        prompt: 'Which sentence is correct?',
        options: [
          'He play football on Sundays.',
          'He plays football on Sundays.',
          'He playing football on Sundays.',
          'He is play football on Sundays.',
        ],
        correctIndex: 1,
      },
      {
        id: 'a2-ps-04',
        type: 'fill-blank',
        prompt: 'Make a negative with "do not" or "does not".',
        sentence: 'I ___ eat meat.',
        answers: ["don't"],
        alts: [['do not']],
      },
      {
        id: 'a2-ps-05',
        type: 'fill-blank',
        prompt: 'Make a question.',
        sentence: '___ he work on Saturdays?',
        answers: ['does'],
      },
      {
        id: 'a2-ps-06',
        type: 'multiple-choice',
        prompt: 'Which is the correct question?',
        options: [
          'What time do you wake up?',
          'What time you wake up?',
          'What time are you wake up?',
          'What time does you wake up?',
        ],
        correctIndex: 0,
      },
      {
        id: 'a2-ps-07',
        type: 'fill-blank',
        prompt: 'Complete with the correct form.',
        sentence: 'My brother ___ watch TV at night. (negative)',
        answers: ["doesn't"],
        alts: [['does not']],
      },
      {
        id: 'a2-ps-08',
        type: 'match-pairs',
        prompt: 'Match the subject with the correct verb.',
        pairs: [
          { left: 'I',    right: 'go' },
          { left: 'She',  right: 'goes' },
          { left: 'They', right: 'go' },
          { left: 'It',   right: 'goes' },
        ],
      },
      {
        id: 'a2-ps-09',
        type: 'fill-blank',
        prompt: 'Spelling: he / do / his homework → he ___ his homework.',
        sentence: 'He ___ his homework every day.',
        answers: ['does'],
      },
      {
        id: 'a2-ps-10',
        type: 'multiple-choice',
        prompt: 'Which adverb of frequency means ~90% of the time?',
        options: ['never', 'sometimes', 'usually', 'rarely'],
        correctIndex: 2,
      },
    ],
  },

];

// ── Helpers ────────────────────────────────────────────────────

export function findUnit(id: string): PracticeUnit | undefined {
  return PRACTICE_UNITS.find(u => u.id === id);
}

/** Units in CEFR order, grouped by level. */
export function unitsByLevel(): Record<string, PracticeUnit[]> {
  const by: Record<string, PracticeUnit[]> = {};
  for (const u of PRACTICE_UNITS) {
    (by[u.level] ??= []).push(u);
  }
  return by;
}
