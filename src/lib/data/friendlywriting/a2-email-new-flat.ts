// FriendlyWriting® — A2 · An email about your new flat
//
// IELTS GT Task 1 (informal letter) is the finish line. At A2 we scaffold
// toward it with a friendly email: describe where you live, who with, and
// invite the friend over. Register is informal; grammar focus is present
// simple, "there is / there are", prepositions of place, and the simplest
// connectors (and / but / also / so).
//
// 6 steps, ~45-minute slot:
//   1. Opening     · 4 min — frame the lesson + CAN-DO outcomes
//   2. Vocab       · 7 min — 8 everyday chunks for an informal email
//   3. Brainstorm  · 8 min — gather ideas with guided questions
//   4. Model       · 8 min — read a model email with annotated parts
//   5. Practice    · 15 min — write the email (60+ words)
//   6. Wrap-up     · 3 min — recap + reflection + submit

import type { FWLesson } from '@/types/friendlywriting';

export const lessonA2EmailNewFlat: FWLesson = {
  id:           'a2-email-new-flat',
  title:        'An email about your new flat',
  subtitle:     'A short informal email to a friend',
  level:        'A2',
  taskType:     'ielts-gt-t1-letter-informal',
  topic:        'Describing a place · informal register',
  scenario:     'Student writes a 60–80 word email to a friend describing their new flat and inviting them over.',
  estimatedMin: 45,
  tags:         ['letter-informal', 'present-simple', 'there-is-are', 'prepositions-of-place'],
  createdAt:    '2026-11-12',

  cover: {
    accent:  '#5BA3D0',
    emoji:   '✉️',
    palette: { from: '#7ECBF2', to: '#5BA3D0' },
  },

  steps: [
    // ─── Step 1 · Opening ──────────────────────────────────────
    {
      kind:             'opening',
      title:            'Today\'s class',
      topic:            'Writing a short informal email',
      purpose:          'By the end of class, you will be able to write a 60–80 word email to a friend describing a place where you live.',
      learningOutcomes: [
        'I can start and end an informal email naturally.',
        'I can describe my home using "there is / there are".',
        'I can use prepositions of place (in, on, next to, near).',
        'I can connect two simple ideas with "and", "but", "also".',
      ],
      grammarFocus: [
        'Present simple (I live / it has / I share)',
        'there is / there are + a / some / any',
        'prepositions of place: in, on, next to, near, between, in front of',
        'connectors: and, but, also, so',
      ],
      heroEmoji: '✉️',
      intro:     'Today you\'re going to write to a friend you haven\'t seen in a while. You just moved into a new flat and you want to tell them about it — where it is, what it\'s like, and invite them to visit. We\'ll gather the words first, brainstorm ideas together, read a model, and then you write your own.',
    },

    // ─── Step 2 · Vocab ────────────────────────────────────────
    {
      kind:  'vocab',
      title: 'Key words & phrases',
      intro: 'These are the building blocks of your email. We\'ll use most of them when you write.',
      items: [
        { id: 'v1', phrase: 'Hi + name, / Hey + name,',       translation: 'Saludo informal para un amigo/a.',                                 example: 'Hi Lucas,',                                             useCase: 'Informal opener',   category: 'opener' },
        { id: 'v2', phrase: 'How are you?',                   translation: 'Pregunta clásica para abrir después del saludo.',                   example: 'How are you? I hope you\'re doing well.',               useCase: 'After the greeting', category: 'opener' },
        { id: 'v3', phrase: 'I\'m writing to tell you…',      translation: 'Te escribo para contarte… (abrir el motivo del email).',            example: 'I\'m writing to tell you about my new flat.',           useCase: 'Say why you\'re writing', category: 'opener' },
        { id: 'v4', phrase: 'There is / there are',           translation: 'Hay (singular / plural). Para describir lo que tiene el lugar.',    example: 'There is a small balcony. There are two bedrooms.',     useCase: 'Describing the place', category: 'content' },
        { id: 'v5', phrase: 'next to / near / in front of',   translation: 'Al lado de / cerca de / enfrente de. Ubicación.',                   example: 'The flat is next to a park, near the metro.',           useCase: 'Where it is',         category: 'content' },
        { id: 'v6', phrase: 'I share it with…',               translation: 'Lo comparto con… (para hablar de compañeros/as de cuarto).',        example: 'I share it with my sister.',                            useCase: 'Who you live with',    category: 'content' },
        { id: 'v7', phrase: 'You should come over / visit',   translation: 'Deberías venir a visitarme. Invitación informal.',                  example: 'You should come over sometime!',                        useCase: 'Inviting a friend',    category: 'request' },
        { id: 'v8', phrase: 'See you soon, / Take care,',     translation: 'Cierres informales antes de firmar.',                               example: 'See you soon,\nCamila',                                 useCase: 'Informal closer',      category: 'closer' },
      ],
      miniCheck: [
        {
          id: 'mc1',
          prompt: 'Which opener is the most natural for an email to a close friend?',
          options: [
            { id: 'a', text: 'Dear Sir or Madam,' },
            { id: 'b', text: 'Hi Lucas,' },
            { id: 'c', text: 'To whom it may concern:' },
          ],
          correct: 'b',
          explain: '"Dear Sir or Madam" is for formal letters. For a friend, use Hi/Hey + name.',
        },
        {
          id: 'mc2',
          prompt: 'Which sentence uses "there is / there are" correctly?',
          options: [
            { id: 'a', text: 'There is two bedrooms in my flat.' },
            { id: 'b', text: 'There are two bedrooms in my flat.' },
            { id: 'c', text: 'There has two bedrooms in my flat.' },
          ],
          correct: 'b',
          explain: '"There are" + plural. "There is" + singular. We don\'t use "there has".',
        },
        {
          id: 'mc3',
          prompt: 'How do you INVITE a friend informally?',
          options: [
            { id: 'a', text: 'I hereby cordially request your presence.' },
            { id: 'b', text: 'You should come over sometime!' },
            { id: 'c', text: 'Please be advised of a visit.' },
          ],
          correct: 'b',
          explain: '"You should come over" is friendly and natural. The others sound robotic.',
        },
      ],
    },

    // ─── Step 3 · Brainstorm ───────────────────────────────────
    {
      kind:  'brainstorm',
      title: 'Let\'s gather ideas',
      intro: 'Before writing, answer these questions in short notes. Your answers go straight into your email later.',
      prompts: [
        { id: 'b1', question: 'Where is your flat? (city, neighborhood, near what?)',               starter: 'My flat is in…',                              carry: true, hint: 'Use "near", "next to", "in front of".' },
        { id: 'b2', question: 'How big is it? How many rooms?',                                     starter: 'It has…',                                     carry: true, hint: 'Use "there is / there are".' },
        { id: 'b3', question: 'Who do you live with?',                                              starter: 'I live with…',                                carry: true, hint: 'Alone? Family? A friend?' },
        { id: 'b4', question: 'What do you like the most about it?',                                starter: 'My favorite part is…',                        carry: true, hint: 'The light? A balcony? The neighborhood?' },
        { id: 'b5', question: 'When could your friend visit? What could you do together?',          starter: 'You could come…',                             carry: true, hint: 'Weekend? Dinner? A walk?' },
      ],
      carryToPractice: true,
    },

    // ─── Step 4 · Model ────────────────────────────────────────
    {
      kind:       'model',
      title:      'A model email',
      intro:      'Read this model email from Camila to her friend Lucas. Notice how each part does one job.',
      modelLabel: 'Example email',
      modelText:  `Hi Lucas,

How are you? I hope you're doing well. I'm writing to tell you about my new flat.

I moved in two weeks ago. It's in the north of the city, next to a small park and near the metro. It's not very big, but there is a nice balcony with a lot of light. There are two bedrooms and a small kitchen. I share it with my sister, and we like it a lot.

My favorite part is the balcony. In the morning I have my coffee there, and it's very quiet.

You should come over one weekend! We can have dinner and go for a walk in the park.

See you soon,
Camila`,
      annotations: [
        { id: 'a1', anchor: 'Hi Lucas,',                                       label: 'Opener',          tip: 'Informal greeting: "Hi" or "Hey" + first name + comma. Never "Dear Mr Lucas".', category: 'register' },
        { id: 'a2', anchor: "I'm writing to tell you about my new flat.",     label: 'Reason to write', tip: 'Tell the friend WHY you\'re writing in one short sentence. This is the "topic sentence" of your email.', category: 'structure' },
        { id: 'a3', anchor: 'next to a small park and near the metro',        label: 'Location',         tip: '"Next to" (= right beside) and "near" (= close to, but not touching). These give the reader a mental map.', category: 'vocab' },
        { id: 'a4', anchor: 'there is a nice balcony',                        label: 'there is + singular', tip: '"There is" + a + singular noun. Use it to describe features of a place.', category: 'grammar' },
        { id: 'a5', anchor: 'There are two bedrooms',                         label: 'there are + plural', tip: '"There are" + number + plural noun. Flip to "there is" when the noun is singular.', category: 'grammar' },
        { id: 'a6', anchor: 'I share it with my sister',                      label: 'Who with',         tip: 'Simple present + "share it with + person". Tells the reader who lives with you.', category: 'grammar' },
        { id: 'a7', anchor: 'You should come over one weekend!',              label: 'Invitation',       tip: 'Friendly invitation using "You should…". The exclamation mark keeps it warm, not pushy.', category: 'register' },
        { id: 'a8', anchor: 'See you soon,',                                  label: 'Closer',           tip: 'Informal sign-off. Alternatives: "Take care,", "Talk soon,", "Hugs,". Finish with your name on a new line.', category: 'register' },
      ],
      tips: [
        { id: 't1', title: 'One paragraph, one idea',    body: 'Each paragraph should do one thing: open, describe, invite, close. Don\'t mix everything into one giant block.' },
        { id: 't2', title: 'Short sentences are fine',    body: 'At A2 your reader will understand you better with 4 clear short sentences than with 1 long messy one.' },
        { id: 't3', title: 'Finish warm, not formal',     body: 'The closer tells the reader who you are. A friend wants "See you soon," — not "Yours faithfully,".' },
      ],
    },

    // ─── Step 5 · Practice ─────────────────────────────────────
    {
      kind:        'practice',
      title:       'Your turn — write the email',
      intro:       'Write your own email. Keep it informal, use your brainstorm notes, and try to include the target phrases from the vocab step.',
      taskTitle:   'Write an email to a friend about your home',
      taskPrompt:  'You have just moved into a new flat and you haven\'t seen your friend for a while. Write an email to your friend.',
      bulletPoints: [
        'Tell your friend about your new flat (where it is, how big it is).',
        'Explain who you live with.',
        'Invite your friend to visit and suggest something to do together.',
      ],
      minWords:         60,
      suggestedMin:     15,
      targetPhraseIds:  ['v1', 'v3', 'v4', 'v5', 'v7', 'v8'],
      targetStructures: ['there is / there are', 'prepositions of place', 'connectors: and / but / also'],
    },

    // ─── Step 6 · Wrap-up ──────────────────────────────────────
    {
      kind:        'wrap-up',
      title:       'Wrap-up',
      intro:       'Before you submit, let\'s review what you learned and how you felt.',
      recapPoints: [
        'You practiced the shape of an informal email: opener → reason → details → invitation → closer.',
        'You used "there is / there are" to describe features of a place.',
        'You connected ideas with "and", "but", "also", "so".',
      ],
      reflection: [
        { id: 'r1', prompt: 'Which phrase from today felt the most useful?',       starter: 'The phrase that felt most useful was…' },
        { id: 'r2', prompt: 'Which part was the hardest for you to write?',        starter: 'The hardest part was…' },
        { id: 'r3', prompt: 'If you wrote this email again, what would you add?',  starter: 'Next time I would add…' },
      ],
      nextClass: 'In our next class we\'ll read a few of your emails together, celebrate what worked, and fix one grammar point per student. Bring your email ready.',
    },
  ],
};
