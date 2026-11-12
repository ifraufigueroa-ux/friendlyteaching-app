// Friendlistenings® — B1 · Planning a surprise party
//
// A ~2:30 planning conversation. Mila and Reuben are organizing a surprise
// 30th birthday party for their friend Amara and need to pin down the
// details — where, how many, what theme, how to get Amara to the venue
// without her suspecting anything, and who handles what.
//
// Grammar focus: modals for suggestion (could / should / what if / why
// don't we), going-to / will for plans, first conditional, and the
// natural chunks that keep a planning conversation moving ("that could
// work", "I was thinking of", "the tricky part", "deal").
//
// 8-step arc, ~45 minute slot:
//   1. Lead-in     · 4 min  — party-planning schema
//   2. Vocab       · 6 min  — 8 planning chunks + 3 checks
//   3. Prediction  · 3 min  — guess the plan from the title
//   4. Gist        · 6 min  — overall plan + division of labor
//   5. Detail      · 10 min — specifics (numbers, times, roles)
//   6. Awareness   · 6 min  — 5 B1 chunks for suggestion + planning
//   7. Controlled  · 5 min  — reuse the chunks
//   8. Production  · 5 min  — 60-sec speaking: plan a mini-event

import type { FLLesson } from '@/types/friendlistenings';

export const lessonB1SurpriseParty: FLLesson = {
  id:           'b1-surprise-party',
  title:        'Planning a surprise party',
  subtitle:     'Two friends plotting a 30th birthday',
  level:        'B1',
  topic:        'Planning · suggestions · informal collaboration',
  scenario:     'Mila and Reuben are organizing a surprise 30th birthday party for their friend Amara and divide up the tasks.',
  estimatedMin: 45,
  tags:         ['planning', 'modals-of-suggestion', 'first-conditional', 'chunks'],
  createdAt:    '2026-11-12',

  cover: {
    accent: '#F9BE3F',
    emoji:  '🎉',
  },

  audio: {
    durationSec: 155,
    speakers: [
      {
        id: 'mila', displayName: 'Mila', accent: 'US', gender: 'f',
        suggestedVoice: { voiceId: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura', note: 'ElevenLabs · sunny US female, mid-30s — planning-friendly energy' },
      },
      {
        id: 'reuben', displayName: 'Reuben', accent: 'US', gender: 'm',
        suggestedVoice: { voiceId: 'bIHbv24MWmeRgasZH58o', name: 'Will', note: 'ElevenLabs · friendly US male — warm, collaborative' },
      },
    ],
    script: [
      { speakerId: 'mila',   approxStartSec:   0, text: 'So, Amara\'s turning thirty next Saturday. We need a plan. Any ideas?' },
      { speakerId: 'reuben', approxStartSec:   7, text: 'I was thinking — what if we do something at my place? I have the garden.' },
      { speakerId: 'mila',   approxStartSec:  14, text: 'That could work. The weather\'s supposed to be good. How many people?' },
      { speakerId: 'reuben', approxStartSec:  21, text: 'I\'d say twenty? Her brother, our team, and a few university friends.' },
      { speakerId: 'mila',   approxStartSec:  29, text: 'Should we go for a theme, or just casual?' },
      { speakerId: 'reuben', approxStartSec:  34, text: 'Casual, I think. She hates fuss. But we could do something small — like, everyone wears one piece of green? That\'s her favorite color.' },
      { speakerId: 'mila',   approxStartSec:  47, text: 'I like that. Simple but personal. Now the tricky part — how do we get her to your place without her suspecting anything?' },
      { speakerId: 'reuben', approxStartSec:  59, text: 'I was going to tell her I\'m cooking dinner for the two of us. If I say it\'s just us, she\'ll show up without expecting anyone.' },
      { speakerId: 'mila',   approxStartSec:  72, text: 'That could work. What time?' },
      { speakerId: 'reuben', approxStartSec:  76, text: 'Eight. Everyone else should be there by seven-thirty. That gives me time to pick her up from the station.' },
      { speakerId: 'mila',   approxStartSec:  86, text: 'Perfect. I\'ll handle the cake and the food — I was thinking of ordering from that Thai place she loves. You handle the music and the garden setup.' },
      { speakerId: 'reuben', approxStartSec: 100, text: 'Deal. And listen — do NOT tell Marcus. He can\'t keep a secret to save his life.' },
      { speakerId: 'mila',   approxStartSec: 110, text: 'Already noted. I\'ll tell him about it the morning of the party. He\'ll still manage to show up late somehow, but at least he won\'t ruin it.' },
      { speakerId: 'reuben', approxStartSec: 124, text: 'Ha! Smart. Okay, we have a plan. Let\'s not screw this up.' },
    ],
  },

  steps: [
    // ─── Step 1 · Lead-in ─────────────────────────────────────
    {
      kind:      'lead-in',
      title:     'Before we start',
      intro:     'Think about the best (or worst) party you\'ve been to recently. What made it work — or not? Today you\'ll hear Mila and Reuben plan a surprise 30th birthday for their friend Amara.',
      hookEmoji: '🎉',
      openQuestions: [
        { id: 'li1', prompt: 'Have you ever helped plan a surprise party? For whom? Did it work?' },
        { id: 'li2', prompt: 'What are the most important things when organizing a party — the food, the music, the people, or the surprise element?' },
        { id: 'li3', prompt: 'Do you prefer small casual gatherings or big loud parties? Why?', hint: 'Introverts and extroverts will give very different answers here.' },
      ],
    },

    // ─── Step 2 · Vocab ───────────────────────────────────────
    {
      kind:  'vocab',
      title: 'Key vocabulary',
      intro: 'These 8 chunks come up in the conversation. They\'re the ones you\'ll reuse in any real-life planning chat — at work, with friends, anywhere.',
      items: [
        { id: 'v1', word: 'to turn (thirty)',       pos: 'phrase',    translation: 'Cumplir (30). Se usa con años.',                                    example: 'Amara\'s turning thirty next Saturday.',                   definition: 'to reach a specific age or state' },
        { id: 'v2', word: 'What if we…?',           pos: 'phrase',    translation: 'Y si nosotros…? — introducir una sugerencia suave.',                 example: 'What if we do something at my place?',                     definition: 'soft way to propose an idea' },
        { id: 'v3', word: 'to go for (a theme)',    pos: 'phrase',    translation: 'Optar por / elegir una temática.',                                  example: 'Should we go for a theme, or just casual?',                definition: 'to choose a specific option' },
        { id: 'v4', word: 'to hate fuss',           pos: 'phrase',    translation: 'Odiar el alboroto / las vueltas.',                                   example: 'She hates fuss.',                                          definition: 'to dislike attention or unnecessary complication' },
        { id: 'v5', word: 'the tricky part',        pos: 'noun',      translation: 'La parte complicada / delicada.',                                   example: 'Now the tricky part — how do we get her here?',            definition: 'the difficult or delicate aspect' },
        { id: 'v6', word: 'to suspect (sth)',       pos: 'verb',      translation: 'Sospechar algo.',                                                   example: '…without her suspecting anything.',                        soundsLike: 'suh-SPEKT',    definition: 'to think something is secretly happening' },
        { id: 'v7', word: 'to handle (sth)',        pos: 'verb',      translation: 'Encargarse de algo. Más fuerte que "do".',                           example: 'I\'ll handle the cake and the food.',                      definition: 'to take responsibility for something' },
        { id: 'v8', word: 'can\'t keep a secret',   pos: 'phrase',    translation: 'No sabe guardar un secreto — ni queriendo.',                         example: 'He can\'t keep a secret to save his life.',                definition: 'to be very bad at not telling secrets' },
      ],
      quiz: [
        {
          kind: 'mcq',
          id: 'vq1',
          prompt: '"She\'s turning thirty" means she…',
          options: [
            { id: 'a', text: 'is going to the age of 30 next birthday' },
            { id: 'b', text: 'moves her body around' },
            { id: 'c', text: 'is 30 for another year' },
          ],
          correct: 'a',
          explain: '"Turn + age" = reach that age on your birthday.',
        },
        {
          kind: 'mcq',
          id: 'vq2',
          prompt: 'Which one is a SUGGESTION, not a command?',
          options: [
            { id: 'a', text: 'Go to my place.' },
            { id: 'b', text: 'What if we go to my place?' },
            { id: 'c', text: 'You must go to my place.' },
          ],
          correct: 'b',
          explain: '"What if…?" invites agreement; the other two are orders.',
        },
        {
          kind: 'mcq',
          id: 'vq3',
          prompt: '"I\'ll handle the music" means…',
          options: [
            { id: 'a', text: 'I\'ll touch the speakers.' },
            { id: 'b', text: 'I\'ll take care of / be in charge of the music.' },
            { id: 'c', text: 'I don\'t like music.' },
          ],
          correct: 'b',
          explain: '"Handle" = take responsibility for something, like a task.',
        },
      ],
    },

    // ─── Step 3 · Prediction ─────────────────────────────────
    {
      kind:  'prediction',
      title: 'What will you hear?',
      intro: 'You know Mila and Reuben are planning a surprise 30th. Guess before pressing play.',
      questions: [
        {
          kind: 'mcq',
          id: 'p1',
          prompt: 'Where will they hold the party?',
          options: [
            { id: 'a', text: 'In a hotel ballroom' },
            { id: 'b', text: 'At one of their homes' },
            { id: 'c', text: 'In a restaurant' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'p2',
          prompt: 'How will they trick the birthday girl into coming?',
          options: [
            { id: 'a', text: 'They\'ll just ask her nicely.' },
            { id: 'b', text: 'They\'ll invent a fake reason — like a small dinner.' },
            { id: 'c', text: 'They\'ll kidnap her from work.' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'p3',
          prompt: 'Who in their friend group CAN\'T be trusted with the secret?',
          options: [
            { id: 'a', text: 'Mila\'s partner' },
            { id: 'b', text: 'Marcus' },
            { id: 'c', text: 'Amara\'s brother' },
          ],
          correct: 'b',
        },
      ],
    },

    // ─── Step 4 · Gist ───────────────────────────────────────
    {
      kind:      'gist',
      title:     'Listen for the gist',
      intro:     'Listen to the whole conversation ONCE. Don\'t stop — just catch the big picture.',
      listenFor: [
        'Where and when the party happens',
        'The division of tasks between Mila and Reuben',
        'The vibe / theme they choose',
      ],
      allowTranscript: false,
      questions: [
        {
          kind: 'mcq',
          id: 'g1',
          prompt: 'What style of party do they decide on?',
          options: [
            { id: 'a', text: 'Formal black-tie' },
            { id: 'b', text: 'Casual, with a small touch of green' },
            { id: 'c', text: 'Costume party' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'g2',
          prompt: 'Who handles the food?',
          options: [
            { id: 'a', text: 'Mila' },
            { id: 'b', text: 'Reuben' },
            { id: 'c', text: 'Amara\'s brother' },
          ],
          correct: 'a',
        },
        {
          kind:    'true-false',
          id:      'g3',
          prompt:  'They plan to tell everyone in the friend group about the surprise.',
          correct: 'F',
          explain: 'They intentionally decide NOT to tell Marcus until the day of the party.',
        },
      ],
    },

    // ─── Step 5 · Detail ─────────────────────────────────────
    {
      kind:             'detail',
      title:            'Listen for detail',
      intro:            'Listen again, pause when you need to. Open the transcript if it helps.',
      allowTranscript:  true,
      questions: [
        {
          kind:     'gap-fill',
          id:       'd1',
          sentence: 'The party is on Saturday, and Amara is turning ___.',
          answers:  ['thirty'],
          alts:     [['30']],
        },
        {
          kind:     'gap-fill',
          id:       'd2',
          sentence: 'Reuben estimates about ___ people in total.',
          answers:  ['twenty'],
          alts:     [['20']],
        },
        {
          kind: 'mcq',
          id: 'd3',
          prompt: 'What colour should everyone wear?',
          options: [
            { id: 'a', text: 'Red' },
            { id: 'b', text: 'Green' },
            { id: 'c', text: 'Black' },
          ],
          correct: 'b',
          explain: '"That\'s her favorite color" — green.',
        },
        {
          kind: 'mcq',
          id: 'd4',
          prompt: 'What excuse will Reuben give Amara to get her to his house?',
          options: [
            { id: 'a', text: 'A quiet dinner just for the two of them' },
            { id: 'b', text: 'A work meeting' },
            { id: 'c', text: 'He needs help with his garden' },
          ],
          correct: 'a',
        },
        {
          kind:     'gap-fill',
          id:       'd5',
          sentence: 'The guests should arrive by ___. Amara arrives at ___.',
          answers:  ['seven-thirty', 'eight'],
          alts:     [['7:30', '7.30', '7:30pm'], ['8', '8pm', '8:00', 'eight o\'clock']],
        },
        {
          kind: 'mcq',
          id: 'd6',
          prompt: 'What is Mila ordering for the food?',
          options: [
            { id: 'a', text: 'Thai food, from a place Amara loves' },
            { id: 'b', text: 'Pizza' },
            { id: 'c', text: 'She\'s cooking everything from scratch' },
          ],
          correct: 'a',
        },
        {
          kind:    'true-false',
          id:      'd7',
          prompt:  'Mila will tell Marcus about the party the morning of the event.',
          correct: 'T',
          explain: 'Direct quote: "I\'ll tell him about it the morning of the party."',
        },
      ],
    },

    // ─── Step 6 · Language Awareness ─────────────────────────
    {
      kind:  'language-awareness',
      title: 'Notice these expressions',
      intro: 'Go back to the transcript and spot these five chunks. They\'re what make this sound like real planning, not a textbook dialogue.',
      chunks: [
        {
          id:       'c1',
          chunk:    'What if we + simple present?',
          category: 'grammar-pattern',
          gloss:    '¿Y si nosotros…? — sugerencia suave',
          example:  '"What if we do something at my place?"',
          notice:   'Followed by SIMPLE PRESENT, not "will" ("What if we do" not "What if we will do"). Invites the other person to agree.',
        },
        {
          id:       'c2',
          chunk:    'That could work',
          category: 'discourse-marker',
          gloss:    'Podría funcionar (aceptar una idea con cautela)',
          example:  '"That could work. The weather\'s supposed to be good."',
          notice:   'Short, flexible agreement. Positive without being over-committed. Compare with "That\'s brilliant!" (strong) or "No way" (strong rejection).',
        },
        {
          id:       'c3',
          chunk:    'I was thinking of + -ing',
          category: 'grammar-pattern',
          gloss:    'Estaba pensando en + -ing (anunciar una idea)',
          example:  '"I was thinking of ordering from that Thai place."',
          notice:   'Past continuous softens a proposal. "I\'ll order from Thai" is a decision; "I was thinking of ordering" opens it for discussion.',
        },
        {
          id:       'c4',
          chunk:    'If + simple present, (subject) will + verb',
          category: 'grammar-pattern',
          gloss:    'Primer condicional — causa/consecuencia',
          example:  '"If I say it\'s just us, she\'ll show up without expecting anyone."',
          notice:   'FIRST conditional: real/possible future. If-clause stays in present even when talking about the future.',
        },
        {
          id:       'c5',
          chunk:    'Deal',
          category: 'register',
          gloss:    'Hecho / trato cerrado (informal)',
          example:  '"Deal. And listen — do NOT tell Marcus."',
          notice:   'One word, closes an agreement between equals. Casual, confident. Overused in formal contexts — save it for friends and trusted colleagues.',
        },
      ],
    },

    // ─── Step 7 · Controlled Practice ────────────────────────
    {
      kind:  'controlled-practice',
      title: 'Guided practice',
      intro: 'Reuse the chunks.',
      activities: [
        {
          kind:     'gap-fill',
          id:       'cp1',
          sentence: 'Instead of cooking, ___ ___ we order sushi?',
          answers:  ['what', 'if'],
          hint:     'Soft suggestion opener.',
        },
        {
          kind: 'mcq',
          id: 'cp2',
          prompt: 'Which sentence uses the first conditional correctly?',
          options: [
            { id: 'a', text: 'If we will leave now, we\'ll catch the train.' },
            { id: 'b', text: 'If we leave now, we\'ll catch the train.' },
            { id: 'c', text: 'If we leave now, we catch the train.' },
          ],
          correct: 'b',
          explain: 'IF + simple present, SUBJECT + will. Never "if + will".',
        },
        {
          kind:     'gap-fill',
          id:       'cp3',
          sentence: 'A: "Let\'s meet at 6." — B: "Yeah, that ___ work."',
          answers:  ['could'],
          hint:     'Cautious agreement.',
        },
        {
          kind:     'gap-fill',
          id:       'cp4',
          sentence: '"I was ___ ___ booking a table at Luna\'s for Friday — any good?"',
          answers:  ['thinking', 'of'],
          hint:     'Soft proposal starter.',
        },
        {
          kind: 'mcq',
          id: 'cp5',
          prompt: '"You bring the drinks, I\'ll bring the dessert." — the natural close is:',
          options: [
            { id: 'a', text: 'Obviously.' },
            { id: 'b', text: 'Deal.' },
            { id: 'c', text: 'Perhaps.' },
          ],
          correct: 'b',
        },
      ],
    },

    // ─── Step 8 · Production ─────────────────────────────────
    {
      kind:         'production',
      title:        'Now you',
      intro:        'Your turn. Plan a mini-event out loud. You can pick: a friend\'s birthday, a going-away dinner, a weekend day out, or a flatmate\'s Sunday roast. Try to use at least 3 of the chunks from this lesson.',
      mode:         'speaking',
      prompt:       'Record 60 seconds planning an event. Include: where / when / how many people / what you\'ll handle / what you want the other person to handle. Use at least 3 of: "What if we…?", "That could work", "I was thinking of…", "If + simple present, …will…", "Deal".',
      targetChunks: ['c1', 'c2', 'c3', 'c4', 'c5'],
      minSeconds:   60,
    },
  ],
};
