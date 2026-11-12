// FriendlyWriting® — B1 · A letter to pause your gym membership
//
// A semi-formal letter: the student is writing to someone they don't know
// personally (gym manager) but with whom they have a service relationship.
// That register — polite but not stiffly formal — is the hardest one for
// B1 learners and the most common shape in IELTS GT Task 1.
//
// Grammar focus: polite requests (I would like / Could you / I was
// wondering if), present perfect vs past simple for recent events,
// reason connectors (because / due to), contrast and result (however /
// therefore / so), and a clean 4-part structure (opener / explain /
// request / offer solution / closer).
//
// 6 steps, ~55-minute slot:
//   1. Opening     · 5 min  — frame the lesson + CAN-DO outcomes
//   2. Vocab       · 10 min — 10 semi-formal chunks the student will reuse
//   3. Brainstorm  · 10 min — guided situation-analysis prompts
//   4. Model       · 10 min — annotated model letter with tips
//   5. Practice    · 17 min — write the letter (120+ words)
//   6. Wrap-up     · 3 min  — recap + reflection + submit

import type { FWLesson } from '@/types/friendlywriting';

export const lessonB1LetterPauseGym: FWLesson = {
  id:           'b1-letter-pause-gym',
  title:        'Pausing your gym membership',
  subtitle:     'A semi-formal service letter',
  level:        'B1',
  taskType:     'ielts-gt-t1-letter-semiformal',
  topic:        'Service requests · semi-formal register',
  scenario:     'Student writes a 120–150 word semi-formal letter to a gym manager explaining why they need to pause their membership and asking for a specific arrangement.',
  estimatedMin: 55,
  tags:         ['letter-semiformal', 'polite-requests', 'present-perfect', 'connectors'],
  createdAt:    '2026-11-12',

  cover: {
    accent:  '#E8906A',
    emoji:   '📝',
    palette: { from: '#F4B88E', to: '#E8906A' },
  },

  steps: [
    // ─── Step 1 · Opening ──────────────────────────────────────
    {
      kind:             'opening',
      title:            'Today\'s class',
      topic:            'A semi-formal service letter',
      purpose:          'By the end of class, you will be able to write a 120–150 word semi-formal letter asking a service provider for a specific arrangement.',
      learningOutcomes: [
        'I can open and close a semi-formal letter appropriately.',
        'I can explain a situation using present perfect for recent events.',
        'I can make a polite request without sounding demanding.',
        'I can offer a solution and connect ideas with however, therefore, so.',
      ],
      grammarFocus: [
        'Present perfect vs past simple ("I\'ve injured my knee" vs "I injured it last week")',
        'Polite requests: "I would like", "Could you", "I was wondering if"',
        'Reason connectors: because, due to, since',
        'Contrast / result: however, therefore, so',
      ],
      heroEmoji: '📝',
      intro:     'Today you\'re writing to the manager of your gym. You can\'t go for a few weeks and you want to pause your membership instead of cancelling it. You don\'t know this person, but you\'re a customer — so your tone is polite, clear, and specific. We\'ll build the chunks, think through the situation, read a model, and then you write.',
    },

    // ─── Step 2 · Vocab ────────────────────────────────────────
    {
      kind:  'vocab',
      title: 'Key phrases for semi-formal writing',
      intro: 'These are the chunks that give a semi-formal letter its shape and tone. Don\'t memorize them — understand WHEN each one is used.',
      items: [
        { id: 'v1', phrase: 'Dear Sir / Madam,',                     translation: 'Estimado/a señor/a — cuando no sabés el nombre de la persona.',                                    example: 'Dear Sir / Madam,',                                             useCase: 'Opener when you don\'t know the name',    category: 'opener' },
        { id: 'v2', phrase: 'I am writing to…',                      translation: 'Le escribo para… (apertura del motivo, más neutra que "I\'m writing").',                             example: 'I am writing to request a temporary pause of my membership.',   useCase: 'State the reason for writing',             category: 'opener' },
        { id: 'v3', phrase: 'I have been a member for…',             translation: 'Soy miembro desde hace… (present perfect para estado que sigue vigente).',                          example: 'I have been a member of your gym for three years.',             useCase: 'Give background / build credibility',      category: 'content' },
        { id: 'v4', phrase: 'Unfortunately,…',                       translation: 'Lamentablemente, — para introducir el problema.',                                                   example: 'Unfortunately, I have injured my knee.',                        useCase: 'Introduce the problem',                    category: 'connector' },
        { id: 'v5', phrase: 'due to / because of',                   translation: 'Debido a / a causa de (seguido de sustantivo, no de oración completa).',                             example: 'I cannot train for six weeks due to a knee injury.',            useCase: 'Give a reason (noun form)',                category: 'connector' },
        { id: 'v6', phrase: 'I would like to request / ask if…',     translation: 'Me gustaría solicitar / preguntar si… — pedido educado.',                                          example: 'I would like to request a two-month pause.',                    useCase: 'The main request',                          category: 'request' },
        { id: 'v7', phrase: 'Would it be possible to…?',             translation: '¿Sería posible…? — forma aún más suave.',                                                          example: 'Would it be possible to freeze my account instead of cancelling it?', useCase: 'Soften the request further',            category: 'request' },
        { id: 'v8', phrase: 'However, / Therefore,',                 translation: 'Sin embargo, / Por lo tanto, — contraste y resultado al inicio de la oración.',                     example: 'However, I would prefer not to cancel the membership entirely.', useCase: 'Connect two ideas formally',             category: 'connector' },
        { id: 'v9', phrase: 'I would be grateful if…',               translation: 'Le agradecería si… — fórmula estándar para pedir algo con cortesía.',                               example: 'I would be grateful if you could confirm this in writing.',     useCase: 'Request a reply or action',                category: 'request' },
        { id: 'v10', phrase: 'Yours faithfully, / Yours sincerely,', translation: 'Cierres formales. Faithfully si abriste con Sir/Madam; sincerely si usaste el nombre.',             example: 'Yours faithfully,\nLeila Ortega',                                useCase: 'Semi-formal / formal closer',               category: 'closer' },
      ],
      miniCheck: [
        {
          id: 'mc1',
          prompt: 'You don\'t know the gym manager\'s name. Which opener/closer pair is correct?',
          options: [
            { id: 'a', text: 'Dear Sir/Madam, … Yours sincerely,' },
            { id: 'b', text: 'Dear Sir/Madam, … Yours faithfully,' },
            { id: 'c', text: 'Hi there, … Cheers,' },
          ],
          correct: 'b',
          explain: 'Sir/Madam pairs with "Yours faithfully". Named person pairs with "Yours sincerely". "Hi there / Cheers" is too informal for a service letter.',
        },
        {
          id: 'mc2',
          prompt: 'Which sentence sounds the most polite in a semi-formal letter?',
          options: [
            { id: 'a', text: 'Freeze my account now.' },
            { id: 'b', text: 'I want you to freeze my account.' },
            { id: 'c', text: 'Would it be possible to freeze my account?' },
          ],
          correct: 'c',
          explain: '"Would it be possible to…" softens the request. "I want you to…" sounds blunt / demanding.',
        },
        {
          id: 'mc3',
          prompt: 'Which sentence uses "due to" correctly?',
          options: [
            { id: 'a', text: 'I can\'t train due to I injured my knee.' },
            { id: 'b', text: 'I can\'t train due to a knee injury.' },
            { id: 'c', text: 'I can\'t train due I injured my knee.' },
          ],
          correct: 'b',
          explain: '"Due to" + noun phrase. For a full clause, use "because" instead: "I can\'t train because I injured my knee."',
        },
      ],
    },

    // ─── Step 3 · Brainstorm ───────────────────────────────────
    {
      kind:  'brainstorm',
      title: 'Think through your situation',
      intro: 'Semi-formal letters work when they are specific. Answer these questions in short notes — they\'ll go straight into the letter.',
      prompts: [
        { id: 'b1', question: 'For how long have you been a member of this gym? Does that matter in the letter?',       starter: 'I have been a member for…',                                                       carry: true, hint: 'Longer memberships give you more weight. Present perfect fits here.' },
        { id: 'b2', question: 'Why do you need to pause? Be specific but short — one real reason.',                     starter: 'The reason is…',                                                                   carry: true, hint: 'Injury? Work trip? Family situation? Pick ONE clear reason.' },
        { id: 'b3', question: 'How long do you need the pause to last? Starting when?',                                 starter: 'I would like to pause from… to…',                                                 carry: true, hint: 'Exact dates make the letter easier for the manager to action.' },
        { id: 'b4', question: 'What exactly are you asking for — a pause, a freeze, a transfer?',                        starter: 'I would like to request…',                                                        carry: true, hint: 'Don\'t cancel if you don\'t have to.' },
        { id: 'b5', question: 'What could be your alternative if they can\'t do exactly what you want?',                 starter: 'If that isn\'t possible, I would also be open to…',                               carry: true, hint: 'Showing flexibility makes the reader more likely to say yes.' },
      ],
      carryToPractice: true,
    },

    // ─── Step 4 · Model ────────────────────────────────────────
    {
      kind:       'model',
      title:      'A model letter',
      intro:      'Read this model letter from Leila. Notice the four-part shape: open → explain → request → offer solution + close.',
      modelLabel: 'Example letter',
      modelText:  `Dear Sir / Madam,

I am writing to request a temporary pause of my gym membership. I have been a member of your Riverside branch for the past two years, and I train three times a week.

Unfortunately, I have recently injured my knee and my doctor has told me not to do any weight-bearing exercise for the next six weeks. Due to this, I will not be able to use the gym during that period.

I would like to request a two-month freeze of my membership, starting from the 20th of November and ending on the 20th of January. However, I would prefer not to cancel it entirely, as I would like to come back as soon as I recover.

If a freeze is not possible, would it be possible to transfer the remaining weeks to a family member instead? I would be grateful if you could confirm what you can offer in writing.

Thank you for your time and understanding.

Yours faithfully,
Leila Ortega`,
      annotations: [
        { id: 'a1', anchor: 'Dear Sir / Madam,',                                                             label: 'Opener',              tip: 'Use "Sir / Madam" when you don\'t know the name. It pairs with "Yours faithfully" at the end.', category: 'register' },
        { id: 'a2', anchor: 'I am writing to request a temporary pause of my gym membership.',             label: 'Reason to write',     tip: 'State the purpose of the letter in ONE clear sentence. This becomes the "thesis" of the letter.', category: 'structure' },
        { id: 'a3', anchor: 'I have been a member of your Riverside branch for the past two years',        label: 'Build credibility',   tip: 'Present perfect ("have been") for a situation that started in the past and continues now. It also shows the reader you\'re a long-term customer.', category: 'grammar' },
        { id: 'a4', anchor: 'Unfortunately, I have recently injured my knee',                               label: 'Introduce problem',   tip: '"Unfortunately," signals bad news is coming. Present perfect ("have injured") because the injury affects NOW.', category: 'grammar' },
        { id: 'a5', anchor: 'Due to this,',                                                                  label: 'Reason connector',    tip: '"Due to + noun / noun phrase / this". Links cause to effect in a semi-formal tone.', category: 'vocab' },
        { id: 'a6', anchor: 'I would like to request a two-month freeze of my membership',                   label: 'Main request',         tip: 'Polite modal "would like to" + specific details. Specific dates and lengths make it easy for the reader to say yes.', category: 'structure' },
        { id: 'a7', anchor: 'However, I would prefer not to cancel it entirely',                             label: 'Contrast',             tip: '"However," at the start of a sentence sets up a contrast with the previous idea. Semi-formal equivalent of "but".', category: 'vocab' },
        { id: 'a8', anchor: 'would it be possible to transfer the remaining weeks to a family member instead?', label: 'Alternative request', tip: 'Offer a plan B. This shows flexibility and gives the reader a second yes they can give you.', category: 'structure' },
        { id: 'a9', anchor: 'I would be grateful if you could confirm what you can offer in writing.',       label: 'Request a reply',       tip: '"I would be grateful if…" is the standard polite request formula. Always ask for the reply in writing for a service matter.', category: 'register' },
        { id: 'a10', anchor: 'Yours faithfully,',                                                             label: 'Closer',                tip: 'Pairs with "Dear Sir / Madam". If you had opened with "Dear Ms Smith" you would close with "Yours sincerely" instead.', category: 'register' },
      ],
      tips: [
        { id: 't1', title: 'Four-part shape',          body: 'Open (1 line) → Explain the situation (1 short paragraph) → Request + specifics (1 paragraph) → Offer plan B + ask for reply (1 paragraph) → Close. Everything else is noise.' },
        { id: 't2', title: 'Faithfully vs sincerely',  body: 'Rule: if you don\'t know the name → "Yours faithfully". If you used the name → "Yours sincerely". Mixing these is a common B1 mistake IELTS examiners spot immediately.' },
        { id: 't3', title: 'Be specific',              body: 'Dates, lengths, branch names. Generic requests get generic replies. A letter that says "from 20 November to 20 January" is easier to approve than "for a while".' },
        { id: 't4', title: 'Avoid contractions',       body: 'In semi-formal writing, prefer "I am" to "I\'m" and "I would" to "I\'d". They set the register. Save contractions for the informal email.' },
      ],
    },

    // ─── Step 5 · Practice ─────────────────────────────────────
    {
      kind:        'practice',
      title:       'Your turn — write the letter',
      intro:       'Use your brainstorm notes, follow the four-part shape, and try to include the target phrases from the vocab step. Aim for 120–150 words.',
      taskTitle:   'Write a letter to your gym manager',
      taskPrompt:  'You have been a member of your local gym for some time, but you cannot attend for the next few weeks. Write a letter to the gym manager.',
      bulletPoints: [
        'Explain how long you have been a member and why you need to stop coming for a while.',
        'Ask for a specific arrangement (freeze / pause / transfer).',
        'Suggest an alternative if your first option is not possible, and ask for a reply in writing.',
      ],
      minWords:         120,
      suggestedMin:     17,
      targetPhraseIds:  ['v1', 'v2', 'v3', 'v4', 'v6', 'v8', 'v9', 'v10'],
      targetStructures: ['present perfect for recent experience', 'polite requests (would like / would it be possible)', 'connectors: however / therefore / due to'],
    },

    // ─── Step 6 · Wrap-up ──────────────────────────────────────
    {
      kind:        'wrap-up',
      title:       'Wrap-up',
      intro:       'Before you submit, take a moment to review what you learned and how you feel about it.',
      recapPoints: [
        'You practiced the semi-formal letter shape: open → explain → request → offer solution → close.',
        'You used present perfect for recent experiences that affect now.',
        'You made polite requests with "I would like", "Would it be possible", "I would be grateful if".',
        'You connected ideas with however, therefore, due to.',
      ],
      reflection: [
        { id: 'r1', prompt: 'Which phrase from today will you use in your real life, outside this class?',    starter: 'I\'ll use…' },
        { id: 'r2', prompt: 'Which part of the letter was hardest to write — the opening, the request, or the alternative?', starter: 'The hardest part was…' },
        { id: 'r3', prompt: 'If a manager receives your letter, what would they say about it?',                starter: 'They would probably think…' },
      ],
      nextClass: 'In our next class we\'ll read a few of your letters, celebrate the chunks that worked, and fix one grammar point per student. Bring your letter ready.',
    },
  ],
};
