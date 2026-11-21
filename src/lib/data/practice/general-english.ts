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
import { QUICK_LESSONS } from './quick-lessons';
import { C1_UNITS } from './c1-units';
import { EXTRA_UNITS_WAVE_1 } from './extra-units-wave1';

// Base A0..B2+ units authored inline. The exported PRACTICE_UNITS at the
// bottom of this file merges in the Quick Lesson explainers from
// ./quick-lessons and appends the C1 content from ./c1-units.
const BASE_UNITS: PracticeUnit[] = [

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

  // ─── A2 · Daily Routines + Minimal Pairs (listening) ────────
  {
    id: 'a2-daily-routines',
    level: 'A2',
    skill: 'listening',
    title: 'Routines & minimal pairs',
    description: 'Hear and distinguish common A2 sounds that trip Spanish speakers up.',
    icon: '👂',
    exercises: [
      {
        id: 'a2-dr-01',
        type: 'listen-choose',
        prompt: 'Which word did you hear?',
        audioScript: 'ship',
        options: ['ship', 'sheep', 'cheap', 'chip'],
        correctIndex: 0,
        explain: 'Short /ɪ/ in "ship" vs. long /iː/ in "sheep".',
      },
      {
        id: 'a2-dr-02',
        type: 'listen-choose',
        prompt: 'Which word did you hear?',
        audioScript: 'sheep',
        options: ['ship', 'sheep', 'shape', 'shop'],
        correctIndex: 1,
      },
      {
        id: 'a2-dr-03',
        type: 'listen-choose',
        prompt: 'What does she usually have for breakfast?',
        audioScript: 'I usually have toast and coffee for breakfast.',
        options: ['Cereal and tea', 'Toast and coffee', 'Eggs and juice', 'Pancakes and milk'],
        correctIndex: 1,
      },
      {
        id: 'a2-dr-04',
        type: 'listen-choose',
        prompt: 'Which verb did you hear?',
        audioScript: 'He lives near the station.',
        options: ['leaves', 'lives', 'loves', 'lives in'],
        correctIndex: 1,
        explain: '/ɪ/ (lives) vs. /iː/ (leaves) — a very common A2 confusion.',
      },
      {
        id: 'a2-dr-05',
        type: 'fill-blank',
        prompt: 'Complete with a frequency adverb.',
        sentence: 'I ___ go to the gym on Mondays. (100% — every Monday)',
        answers: ['always'],
        alts: [['allways']],
      },
      {
        id: 'a2-dr-06',
        type: 'listen-choose',
        prompt: 'What time does the speaker wake up?',
        audioScript: 'I wake up at seven fifteen on weekdays.',
        options: ['7:00', '7:15', '7:50', '8:15'],
        correctIndex: 1,
      },
      {
        id: 'a2-dr-07',
        type: 'multiple-choice',
        prompt: 'Pick the most natural sentence for a daily routine.',
        options: [
          'I am go to work every day.',
          'I goes to work every day.',
          'I go to work every day.',
          'I going to work every day.',
        ],
        correctIndex: 2,
      },
      {
        id: 'a2-dr-08',
        type: 'listen-choose',
        prompt: 'Did the speaker say "men" or "man"?',
        audioScript: 'The man is waiting outside.',
        options: ['man', 'men', 'main', 'mine'],
        correctIndex: 0,
      },
    ],
  },

  // ─── B1 · Past Simple vs. Present Perfect ────────────────────
  {
    id: 'b1-past-vs-present-perfect',
    level: 'B1',
    skill: 'grammar',
    title: 'Past simple vs. present perfect',
    description: 'Finished vs. unfinished time — the single biggest B1 tense confusion.',
    icon: '⏳',
    exercises: [
      {
        id: 'b1-pp-01',
        type: 'multiple-choice',
        prompt: 'Which is correct?',
        options: [
          'I have seen that film yesterday.',
          'I saw that film yesterday.',
          'I was seeing that film yesterday.',
          'I have been seeing that film yesterday.',
        ],
        correctIndex: 1,
        explain: '"Yesterday" is a finished time marker → past simple.',
      },
      {
        id: 'b1-pp-02',
        type: 'multiple-choice',
        prompt: 'Which is correct?',
        options: [
          'She has lived in Berlin since 2019.',
          'She lived in Berlin since 2019.',
          'She is living in Berlin since 2019.',
          'She lives in Berlin since 2019.',
        ],
        correctIndex: 0,
      },
      {
        id: 'b1-pp-03',
        type: 'fill-blank',
        prompt: 'Complete with the correct tense.',
        sentence: 'I ___ (never / try) sushi before.',
        answers: ['have never tried'],
        alts: [['\'ve never tried', 'havent tried', "haven't tried"]],
      },
      {
        id: 'b1-pp-04',
        type: 'fill-blank',
        prompt: 'Complete with the correct tense.',
        sentence: 'He ___ (finish) the report at six last night.',
        answers: ['finished'],
      },
      {
        id: 'b1-pp-05',
        type: 'listen-choose',
        prompt: 'What does the speaker mean?',
        audioScript: 'I\'ve just finished the report.',
        options: [
          'The report is still not done.',
          'The report was done a long time ago.',
          'The report was done a moment ago.',
          'The report is being written now.',
        ],
        correctIndex: 2,
        explain: '"Just" with present perfect = a moment ago.',
      },
      {
        id: 'b1-pp-06',
        type: 'match-pairs',
        prompt: 'Match each sentence with its correct time marker category.',
        pairs: [
          { left: 'I have been there twice.',          right: 'unfinished / life experience' },
          { left: 'I went there in 2022.',             right: 'finished time' },
          { left: 'They have lived here for 5 years.', right: 'unfinished / still true' },
          { left: 'She called me an hour ago.',        right: 'finished time' },
        ],
      },
      {
        id: 'b1-pp-07',
        type: 'multiple-choice',
        prompt: 'Which signals present perfect?',
        options: ['yesterday', 'last week', 'in 1999', 'ever'],
        correctIndex: 3,
      },
      {
        id: 'b1-pp-08',
        type: 'listen-choose',
        prompt: 'Did the speaker use past simple or present perfect?',
        audioScript: 'I\'ve already called her.',
        options: ['Past simple', 'Present perfect', 'Past continuous', 'Future'],
        correctIndex: 1,
      },
    ],
  },

  // ─── B2 · Conditionals (second & third) ──────────────────────
  {
    id: 'b2-conditionals',
    level: 'B2',
    skill: 'grammar',
    title: 'Second & third conditionals',
    description: 'Hypothetical present/future vs. counterfactual past.',
    icon: '🔀',
    exercises: [
      {
        id: 'b2-c-01',
        type: 'multiple-choice',
        prompt: 'Complete: "If I ___ you, I would take the job."',
        options: ['am', 'was', 'were', 'had been'],
        correctIndex: 2,
        explain: 'Second conditional often uses "were" for all persons in careful English.',
      },
      {
        id: 'b2-c-02',
        type: 'fill-blank',
        prompt: 'Complete with the correct form.',
        sentence: 'If she ___ (study) harder, she would have passed.',
        answers: ['had studied'],
      },
      {
        id: 'b2-c-03',
        type: 'multiple-choice',
        prompt: 'Which is a third conditional?',
        options: [
          'If I have time, I\'ll call you.',
          'If I had time, I would call you.',
          'If I had had time, I would have called you.',
          'When I have time, I call you.',
        ],
        correctIndex: 2,
      },
      {
        id: 'b2-c-04',
        type: 'fill-blank',
        prompt: 'Mixed conditional — past cause, present result.',
        sentence: 'If he ___ (not / miss) the train, he ___ (be) here now.',
        answers: ['had not missed', 'would be'],
        alts: [['hadn\'t missed', 'hadnt missed'], ['\'d be', 'would be']],
      },
      {
        id: 'b2-c-05',
        type: 'listen-choose',
        prompt: 'Which conditional did the speaker use?',
        audioScript: 'If I had known, I would have told you.',
        options: ['First conditional', 'Second conditional', 'Third conditional', 'Zero conditional'],
        correctIndex: 2,
      },
      {
        id: 'b2-c-06',
        type: 'multiple-choice',
        prompt: 'Which sentence refuses a request politely in a hypothetical frame?',
        options: [
          'I don\'t help you.',
          'I didn\'t help you.',
          'I\'d rather not help you.',
          'I won\'t have helped you.',
        ],
        correctIndex: 2,
      },
      {
        id: 'b2-c-07',
        type: 'fill-blank',
        prompt: 'Second conditional — unreal present.',
        sentence: 'If I ___ (speak) Japanese, I ___ (move) to Tokyo.',
        answers: ['spoke', 'would move'],
        alts: [[], ['\'d move']],
      },
      {
        id: 'b2-c-08',
        type: 'listen-choose',
        prompt: 'What does the speaker regret?',
        audioScript: 'I wish I had taken that job offer.',
        options: [
          'They took the job and dislike it.',
          'They turned the job down and now regret it.',
          'They are considering the job.',
          'They have been offered a new job.',
        ],
        correctIndex: 1,
      },
    ],
  },

  // ─── A0 · Colors & everyday objects ──────────────────────────
  {
    id: 'a0-colors',
    level: 'A0',
    skill: 'vocabulary',
    title: 'Colors around us',
    description: 'Basic colors, matched to objects you see every day.',
    icon: '🎨',
    exercises: [
      { id: 'a0-c-01', type: 'multiple-choice', prompt: 'The sky is usually…', options: ['red', 'blue', 'green', 'black'], correctIndex: 1 },
      { id: 'a0-c-02', type: 'multiple-choice', prompt: 'Bananas are…',          options: ['yellow', 'orange', 'blue', 'purple'], correctIndex: 0 },
      { id: 'a0-c-03', type: 'match-pairs',     prompt: 'Match each color to a common object.',
        pairs: [
          { left: 'white', right: 'milk'  },
          { left: 'black', right: 'coal'  },
          { left: 'red',   right: 'apple' },
          { left: 'green', right: 'grass' },
        ] },
      { id: 'a0-c-04', type: 'fill-blank', prompt: 'Complete.', sentence: 'The grass is ___.', answers: ['green'] },
      { id: 'a0-c-05', type: 'listen-choose', prompt: 'Which colour did you hear?',
        audioScript: 'My car is black.',
        options: ['black', 'blue', 'brown', 'back'], correctIndex: 0,
        explain: 'Watch out — "black" and "back" sound similar at A0.',
      },
      { id: 'a0-c-06', type: 'multiple-choice', prompt: 'A lemon is…',
        options: ['red', 'yellow', 'purple', 'brown'], correctIndex: 1 },
      { id: 'a0-c-07', type: 'fill-blank', prompt: 'Complete.', sentence: 'An elephant is ___.', answers: ['grey'], alts: [['gray']] },
      { id: 'a0-c-08', type: 'multiple-choice', prompt: 'Which is NOT a primary color?',
        options: ['red', 'blue', 'yellow', 'green'], correctIndex: 3 },
    ],
  },

  // ─── A1 · Have got / have ────────────────────────────────────
  {
    id: 'a1-have-got',
    level: 'A1',
    skill: 'grammar',
    title: 'Have got / have',
    description: 'Say what you own, who is in your family, and what you look like.',
    icon: '👪',
    exercises: [
      { id: 'a1-hg-01', type: 'multiple-choice', prompt: 'Complete: "She ___ a new bike."',
        options: ['have', 'has', 'is', 'got'], correctIndex: 1 },
      { id: 'a1-hg-02', type: 'multiple-choice', prompt: 'Which is British English for "I have a car"?',
        options: ['I have got a car.', 'I has a car.', 'I has got a car.', 'I have car.'], correctIndex: 0 },
      { id: 'a1-hg-03', type: 'fill-blank', prompt: 'Complete with the correct form.',
        sentence: 'They ___ (have) two children.', answers: ['have'] },
      { id: 'a1-hg-04', type: 'fill-blank', prompt: 'Complete with the contracted form.',
        sentence: 'My brother ___ (have got) brown eyes.',
        answers: ['\'s got'], alts: [['has got']] },
      { id: 'a1-hg-05', type: 'listen-choose', prompt: 'How many sisters does she have?',
        audioScript: 'I have got two sisters and one brother.',
        options: ['One', 'Two', 'Three', 'Four'], correctIndex: 1 },
      { id: 'a1-hg-06', type: 'multiple-choice', prompt: 'Which question is correct?',
        options: ['Do you got a pen?', 'Have you got a pen?', 'Are you got a pen?', 'Got you a pen?'], correctIndex: 1 },
      { id: 'a1-hg-07', type: 'fill-blank', prompt: 'Make it negative with "haven\'t got".',
        sentence: 'I ___ ___ ___ any money.', answers: ['have', 'not', 'got'], alts: [['haven\'t', 'haven\'t', 'got']] },
      { id: 'a1-hg-08', type: 'multiple-choice', prompt: 'Pick the natural short answer to "Has she got a dog?"',
        options: ['Yes, she have.', 'Yes, she does.', 'Yes, she has.', 'Yes, she had.'], correctIndex: 2 },
    ],
  },

  // ─── A2 · Past Simple — irregular verbs ──────────────────────
  {
    id: 'a2-past-simple',
    level: 'A2',
    skill: 'grammar',
    title: 'Past simple (irregular verbs)',
    description: 'The classic A2 jump — 12 top irregulars in context.',
    icon: '📜',
    exercises: [
      { id: 'a2-pst-01', type: 'fill-blank', prompt: 'Past simple.',  sentence: 'Yesterday I ___ (go) to the gym.', answers: ['went'] },
      { id: 'a2-pst-02', type: 'fill-blank', prompt: 'Past simple.',  sentence: 'She ___ (eat) pizza for dinner.',   answers: ['ate'] },
      { id: 'a2-pst-03', type: 'fill-blank', prompt: 'Past simple.',  sentence: 'We ___ (see) a great movie.',       answers: ['saw'] },
      { id: 'a2-pst-04', type: 'multiple-choice', prompt: 'Past of "take" is…',
        options: ['taked', 'took', 'taken', 'tooken'], correctIndex: 1 },
      { id: 'a2-pst-05', type: 'match-pairs', prompt: 'Match each verb to its past form.',
        pairs: [
          { left: 'buy',   right: 'bought' },
          { left: 'drive', right: 'drove'  },
          { left: 'write', right: 'wrote'  },
          { left: 'drink', right: 'drank'  },
        ] },
      { id: 'a2-pst-06', type: 'listen-choose', prompt: 'When did he arrive?',
        audioScript: 'He arrived at eight thirty last night.',
        options: ['7:30', '8:30', '9:30', '10:30'], correctIndex: 1 },
      { id: 'a2-pst-07', type: 'multiple-choice', prompt: 'Which sentence uses the past simple correctly?',
        options: [
          'I did went home early.',
          'I went home early.',
          'I have went home early.',
          'I was going home early yesterday.',
        ], correctIndex: 1 },
      { id: 'a2-pst-08', type: 'fill-blank', prompt: 'Question in past simple.',
        sentence: '___ you ___ (have) a good weekend?', answers: ['Did', 'have'] },
    ],
  },

  // ─── B1 · Phrasal verbs — top 10 ─────────────────────────────
  {
    id: 'b1-phrasal-verbs',
    level: 'B1',
    skill: 'vocabulary',
    title: 'Everyday phrasal verbs',
    description: 'The 10 phrasals a B1 student actually uses — meaning, not grammar.',
    icon: '🔁',
    exercises: [
      { id: 'b1-pv-01', type: 'multiple-choice', prompt: '"Put off" means…',
        options: ['to start', 'to postpone', 'to finish quickly', 'to repair'], correctIndex: 1 },
      { id: 'b1-pv-02', type: 'multiple-choice', prompt: '"Look after" means…',
        options: ['to search for', 'to take care of', 'to admire', 'to follow'], correctIndex: 1 },
      { id: 'b1-pv-03', type: 'fill-blank', prompt: 'Complete.',
        sentence: 'Can you ___ me ___ at the station at 7?', answers: ['pick', 'up'] },
      { id: 'b1-pv-04', type: 'multiple-choice', prompt: '"Run out of" something means…',
        options: ['to buy more', 'to use the last of it', 'to spill it', 'to hide it'], correctIndex: 1 },
      { id: 'b1-pv-05', type: 'match-pairs', prompt: 'Match each phrasal to its meaning.',
        pairs: [
          { left: 'give up',    right: 'stop trying' },
          { left: 'turn down',  right: 'reject' },
          { left: 'work out',   right: 'exercise / solve' },
          { left: 'get along',  right: 'have a good relationship' },
        ] },
      { id: 'b1-pv-06', type: 'listen-choose', prompt: 'What does the speaker want to do?',
        audioScript: 'I need to catch up on some emails this afternoon.',
        options: ['read', 'answer late', 'delete', 'forward'], correctIndex: 1,
        explain: '"Catch up on" = deal with things you\'re behind on.',
      },
      { id: 'b1-pv-07', type: 'fill-blank', prompt: 'Complete.',
        sentence: 'I\'ll ___ ___ my new boss tomorrow for the first time.',
        answers: ['meet', 'up'] },
      { id: 'b1-pv-08', type: 'multiple-choice', prompt: 'Choose the natural reply: "Do you want to cancel the meeting?"',
        options: ['Yes, let\'s call it in.', 'Yes, let\'s call it off.', 'Yes, let\'s call it out.', 'Yes, let\'s call it over.'],
        correctIndex: 1 },
    ],
  },

  // ─── B1 · Reported speech (basics) ───────────────────────────
  {
    id: 'b1-reported-speech',
    level: 'B1',
    skill: 'grammar',
    title: 'Reported speech',
    description: 'Shift the tense back one step: he said (that)…',
    icon: '💬',
    exercises: [
      { id: 'b1-rs-01', type: 'multiple-choice', prompt: 'Report: "I am tired," she said.',
        options: [
          'She said she am tired.',
          'She said that she was tired.',
          'She said that she is tired.',
          'She told that she tired.',
        ], correctIndex: 1 },
      { id: 'b1-rs-02', type: 'fill-blank', prompt: 'Report.',
        sentence: 'Tom said, "I will call you." → Tom said he ___ ___ me.',
        answers: ['would', 'call'] },
      { id: 'b1-rs-03', type: 'multiple-choice', prompt: '"Said" vs. "told" — which is correct?',
        options: [
          'She told that she was busy.',
          'She said me that she was busy.',
          'She told me that she was busy.',
          'She told to me that she was busy.',
        ], correctIndex: 2 },
      { id: 'b1-rs-04', type: 'fill-blank', prompt: 'Shift: present perfect → past perfect.',
        sentence: '"I have finished." → He said he ___ ___.',
        answers: ['had', 'finished'] },
      { id: 'b1-rs-05', type: 'listen-choose', prompt: 'Which report matches what you heard?',
        audioScript: 'She said she had already paid the bill.',
        options: [
          'She will pay the bill.',
          'She has not paid the bill yet.',
          'She paid the bill some time earlier.',
          'She is paying the bill now.',
        ], correctIndex: 2 },
      { id: 'b1-rs-06', type: 'multiple-choice', prompt: 'Report the question: "Where do you live?"',
        options: [
          'He asked where do I live.',
          'He asked where I lived.',
          'He asked me where did I live.',
          'He asked where was I living.',
        ], correctIndex: 1 },
      { id: 'b1-rs-07', type: 'fill-blank', prompt: 'Change pronoun + tense.',
        sentence: '"I can help." → She said she ___ help.',
        answers: ['could'] },
      { id: 'b1-rs-08', type: 'multiple-choice', prompt: 'Pick the natural reported suggestion.',
        options: [
          'He suggested me to go.',
          'He suggested going.',
          'He suggested that I going.',
          'He suggested me going.',
        ], correctIndex: 1 },
    ],
  },

  // ─── B2 · Passive voice ──────────────────────────────────────
  {
    id: 'b2-passive-voice',
    level: 'B2',
    skill: 'grammar',
    title: 'Passive voice across tenses',
    description: 'Form, use, and when to prefer the passive over the active.',
    icon: '🔄',
    exercises: [
      { id: 'b2-pv-01', type: 'multiple-choice', prompt: 'Passive of "They build houses."',
        options: ['Houses build.', 'Houses are built.', 'Houses have built.', 'Houses were built.'], correctIndex: 1 },
      { id: 'b2-pv-02', type: 'fill-blank', prompt: 'Past passive.',
        sentence: 'The cake ___ ___ (eat) before I arrived.',
        answers: ['had', 'been eaten'] },
      { id: 'b2-pv-03', type: 'fill-blank', prompt: 'Future passive.',
        sentence: 'The report ___ ___ ___ (send) tomorrow.',
        answers: ['will', 'be', 'sent'] },
      { id: 'b2-pv-04', type: 'multiple-choice', prompt: 'When is the passive most natural?',
        options: [
          'When we know and want to highlight the agent.',
          'When the agent is obvious, unknown, or unimportant.',
          'In spoken casual conversation about friends.',
          'When you want to blame someone directly.',
        ], correctIndex: 1 },
      { id: 'b2-pv-05', type: 'listen-choose', prompt: 'What was mentioned?',
        audioScript: 'The decision was made by the board on Friday.',
        options: [
          'The board made the decision.',
          'The decision made the board.',
          'The board will decide Friday.',
          'Someone unknown decided.',
        ], correctIndex: 0 },
      { id: 'b2-pv-06', type: 'match-pairs', prompt: 'Match active → passive (same tense).',
        pairs: [
          { left: 'She writes letters.',        right: 'Letters are written.' },
          { left: 'He is fixing the car.',      right: 'The car is being fixed.' },
          { left: 'They have signed the deal.', right: 'The deal has been signed.' },
          { left: 'Someone stole my phone.',    right: 'My phone was stolen.' },
        ] },
      { id: 'b2-pv-07', type: 'multiple-choice', prompt: 'Which is grammatically correct?',
        options: [
          'The bridge is being repaired now.',
          'The bridge being repaired now.',
          'The bridge is repair now.',
          'The bridge has repairing now.',
        ], correctIndex: 0 },
      { id: 'b2-pv-08', type: 'fill-blank', prompt: 'Passive with "by" + agent.',
        sentence: 'This novel ___ ___ (write) by García Márquez.',
        answers: ['was', 'written'] },
    ],
  },

  // ─── B2+ · Hedging & softening (register) ────────────────────
  {
    id: 'b2plus-hedging',
    level: 'B2+',
    skill: 'vocabulary',
    title: 'Hedging & softening',
    description: 'Say the same thing with more diplomacy — the C1 tells.',
    icon: '🫱',
    exercises: [
      { id: 'b2p-h-01', type: 'multiple-choice', prompt: 'Soften: "That won\'t work."',
        options: [
          '"That won\'t work."',
          '"I\'m not sure that would work."',
          '"That is wrong."',
          '"No, no."',
        ], correctIndex: 1 },
      { id: 'b2p-h-02', type: 'multiple-choice', prompt: 'Which phrase hedges a claim?',
        options: ['It is a fact that…', 'It tends to be the case that…', 'Obviously…', 'Clearly…'], correctIndex: 1 },
      { id: 'b2p-h-03', type: 'fill-blank', prompt: 'Soften the opinion.',
        sentence: '"I ___ ___ ___ a different approach might work better."',
        answers: ['would', 'say', 'that'] },
      { id: 'b2p-h-04', type: 'multiple-choice', prompt: 'Which is the most diplomatic rejection?',
        options: [
          'No, that\'s a bad idea.',
          'That\'s not going to happen.',
          'I can see where you\'re coming from, but I\'m not sure it\'s the right fit.',
          'Impossible.',
        ], correctIndex: 2 },
      { id: 'b2p-h-05', type: 'listen-choose', prompt: 'What is the speaker doing?',
        audioScript: 'I wonder if we might look at this from a different angle.',
        options: ['giving an order', 'softly suggesting a change', 'complimenting', 'refusing'], correctIndex: 1 },
      { id: 'b2p-h-06', type: 'match-pairs', prompt: 'Match each hedge to its pragmatic effect.',
        pairs: [
          { left: 'arguably',          right: 'opens space for disagreement' },
          { left: 'with respect,',     right: 'signals polite pushback before dissent' },
          { left: 'in some sense,',    right: 'adds qualification without retracting' },
          { left: 'if I may,',         right: 'asks for the floor before speaking' },
        ] },
      { id: 'b2p-h-07', type: 'fill-blank', prompt: 'Soften a stat.',
        sentence: 'Sales are ___ down about ten percent.',
        answers: ['roughly'], alts: [['around', 'about']] },
      { id: 'b2p-h-08', type: 'multiple-choice', prompt: 'Which replaces "you\'re wrong" diplomatically?',
        options: [
          '"You\'re wrong."',
          '"That\'s not correct."',
          '"That\'s not quite right, I think."',
          '"Nope."',
        ], correctIndex: 2 },
    ],
  },

  // ─── B2+ · Inversion & cleft sentences ───────────────────────
  {
    id: 'b2plus-inversion-cleft',
    level: 'B2+',
    skill: 'grammar',
    title: 'Inversion & cleft emphasis',
    description: 'Fronted negatives, "not only…", "it is X that…", "what we need is…".',
    icon: '🎯',
    exercises: [
      {
        id: 'b2p-ic-01',
        type: 'multiple-choice',
        prompt: 'Rewrite with inversion: "I had never heard such a story."',
        options: [
          'Never I had heard such a story.',
          'Never I heard such a story.',
          'Never had I heard such a story.',
          'Never I was heard such a story.',
        ],
        correctIndex: 2,
      },
      {
        id: 'b2p-ic-02',
        type: 'fill-blank',
        prompt: 'Complete the inversion.',
        sentence: 'Not only ___ (she / speak) three languages, but she also plays the cello.',
        answers: ['does she speak'],
      },
      {
        id: 'b2p-ic-03',
        type: 'multiple-choice',
        prompt: 'Which cleft sentence emphasises the time?',
        options: [
          'It was John who fixed the bug.',
          'It was the bug that John fixed.',
          'It was yesterday that John fixed the bug.',
          'What John did was fix the bug.',
        ],
        correctIndex: 2,
      },
      {
        id: 'b2p-ic-04',
        type: 'fill-blank',
        prompt: 'Cleft with "what".',
        sentence: '___ (I / need) is a weekend off.',
        answers: ['What I need'],
      },
      {
        id: 'b2p-ic-05',
        type: 'listen-choose',
        prompt: 'What is the speaker emphasising?',
        audioScript: 'What saved the project was Priya\'s rewrite.',
        options: ['the timing', 'the person — Priya', 'the project', 'the budget'],
        correctIndex: 1,
      },
      {
        id: 'b2p-ic-06',
        type: 'match-pairs',
        prompt: 'Match each structure to its effect.',
        pairs: [
          { left: 'It is X that…',        right: 'Emphasises the subject / object X' },
          { left: 'What we need is…',    right: 'Delays and spotlights a solution' },
          { left: 'Rarely do we see…',    right: 'Fronts a negative for dramatic effect' },
          { left: 'Had I known…',         right: 'Formal conditional without "if"' },
        ],
      },
      {
        id: 'b2p-ic-07',
        type: 'multiple-choice',
        prompt: 'Which sounds most natural in formal writing?',
        options: [
          'If I had known, I would have come.',
          'Had I known, I would have come.',
          'Would I had known, I would have come.',
          'I would have come if had I known.',
        ],
        correctIndex: 1,
      },
      {
        id: 'b2p-ic-08',
        type: 'listen-choose',
        prompt: 'Which inversion did the speaker use?',
        audioScript: 'Only after the deploy did we spot the bug.',
        options: [
          '"Only after the deploy we spotted the bug."',
          '"Only after the deploy did we spot the bug."',
          '"Only after the deploy had we spot the bug."',
          '"After the deploy only we spotted the bug."',
        ],
        correctIndex: 1,
      },
    ],
  },

];

// ── Final export: base units + C1 + quick lessons merged ──────
//
// Overlays the QUICK_LESSONS map onto each unit by id so every unit
// that has an explainer picks it up without touching the exercise
// data above. C1 units from ./c1-units.ts are concatenated at the
// end so they appear below B2+ in the level-grouped grid.

function withQuickLesson(u: PracticeUnit): PracticeUnit {
  const ql = QUICK_LESSONS[u.id];
  return ql ? { ...u, quickLesson: u.quickLesson ?? ql } : u;
}

export const PRACTICE_UNITS: PracticeUnit[] = [
  ...BASE_UNITS.map(withQuickLesson),
  ...EXTRA_UNITS_WAVE_1.map(withQuickLesson),
  ...C1_UNITS.map(withQuickLesson),
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
