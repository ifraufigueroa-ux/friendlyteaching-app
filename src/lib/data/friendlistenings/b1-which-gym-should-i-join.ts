// Friendlistenings® — A2+/B1- · Which gym should I join?
//
// A ~2:45 casual chat between two friends. Zoe visited three different
// gyms over the weekend and talks Sam through them. The whole dialogue
// is a natural pretext for comparatives and superlatives: short adj.
// (cheaper, closer, smaller), long adj. (more expensive, friendlier),
// irregular (better, farther), superlatives (the cheapest, the most
// expensive, the farthest), and the common modifiers B1 learners miss
// (a bit, much, way + comparative; not as X as).
//
// Target grammar focus: comparatives + superlatives at A2+/B1- level.
// Fits a ~40-minute class slot or self-study.

import type { FLLesson } from '@/types/friendlistenings';

export const lessonB1WhichGymShouldIJoin: FLLesson = {
  id:           'b1-which-gym-should-i-join',
  title:        'Which gym should I join?',
  subtitle:     'Two friends comparing three gyms',
  level:        'B1',
  topic:        'Comparing options · daily life',
  scenario:     'Zoe visited three gyms over the weekend and walks Sam through the pros and cons of each.',
  estimatedMin: 35,
  tags:         ['comparatives', 'superlatives', 'grammar-focus', 'daily-life'],
  createdAt:    '2026-11-16',

  cover: {
    accent: '#3C9D7A',
    emoji:  '🏋️',
  },

  audio: {
    durationSec: 115,
    speakers: [
      {
        id: 'sam', displayName: 'Sam', accent: 'US', gender: 'm',
        suggestedVoice: { voiceId: 'iP95p4xoKVk53GoZ742B', name: 'Chris', note: 'ElevenLabs · casual conversational US male — easy pace, friendly curiosity' },
      },
      {
        id: 'zoe', displayName: 'Zoe', accent: 'US', gender: 'f',
        suggestedVoice: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', note: 'ElevenLabs · warm soft US female — thinks out loud, A2/B1-friendly pace' },
      },
    ],
    script: [
      { speakerId: 'sam', approxStartSec:   0, text: 'Hey! So, did you visit the gyms this weekend?' },
      { speakerId: 'zoe', approxStartSec:   4, text: 'Yes — three of them. I\'m more confused now than before.' },
      { speakerId: 'sam', approxStartSec:  10, text: 'Haha. Start with the closest one — Pulse, right?' },
      { speakerId: 'zoe', approxStartSec:  15, text: 'Yeah, Pulse is the closest — a five-minute walk from my place. And the cheapest, twenty-eight dollars a month. But it\'s also the smallest, and at seven p.m. it was way too crowded.' },
      { speakerId: 'sam', approxStartSec:  33, text: 'Not great. What about Core and Flow?' },
      { speakerId: 'zoe', approxStartSec:  37, text: 'Core and Flow is the biggest one I saw. They have a pool, newer equipment, and the staff is much friendlier than at Pulse.' },
      { speakerId: 'sam', approxStartSec:  50, text: 'More expensive?' },
      { speakerId: 'zoe', approxStartSec:  53, text: 'A bit — forty-five a month. Not as bad as Pulse on crowding, but Saturdays get busy.' },
      { speakerId: 'sam', approxStartSec:  63, text: 'And the third one?' },
      { speakerId: 'zoe', approxStartSec:  66, text: 'Iron Garden. The farthest — twenty-five minutes — and the most expensive, fifty-five dollars. Oldest building, but it has a lovely terrace and it was the quietest of the three.' },
      { speakerId: 'sam', approxStartSec:  84, text: 'Quieter than Pulse? That\'s easy!' },
      { speakerId: 'zoe', approxStartSec:  87, text: 'Way quieter. But for the price, I don\'t think it\'s worth it.' },
      { speakerId: 'sam', approxStartSec:  95, text: 'So… Core and Flow?' },
      { speakerId: 'zoe', approxStartSec:  98, text: 'Yeah. Not the cheapest, but the best value. Better equipment than Pulse, friendlier than Iron Garden, and the pool sold me.' },
      { speakerId: 'sam', approxStartSec: 110, text: 'When are you joining?' },
      { speakerId: 'zoe', approxStartSec: 113, text: 'Tomorrow!' },
    ],
  },

  steps: [
    // ─── Step 1 · Lead-in ─────────────────────────────────────
    {
      kind:      'lead-in',
      title:     'Before we start',
      intro:     'Think about the last time you had to choose between two or three similar places — a gym, a café, an apartment, a school. You probably compared them in your head: closer, cheaper, nicer, better. Today you\'ll hear a friend do exactly that out loud.',
      hookEmoji: '🏋️',
      openQuestions: [
        { id: 'li1', prompt: 'Do you go to the gym — or do any regular exercise? How often?' },
        { id: 'li2', prompt: 'When you choose a place (gym, café, apartment), what matters most to you: price, location, quality, or the people?' },
        { id: 'li3', prompt: 'Is the cheapest option always the best? Think of an example where paying a bit more was worth it.', hint: 'Or an example where cheap turned out to be a mistake.' },
      ],
    },

    // ─── Step 2 · Vocab ───────────────────────────────────────
    {
      kind:  'vocab',
      title: 'Key vocabulary',
      intro: 'Before you listen, learn these 8 words. They come up naturally in the conversation and are very common when people compare services or places.',
      items: [
        { id: 'v1', word: 'membership',        pos: 'noun',         translation: 'La suscripción mensual o anual que pagas para pertenecer a un gimnasio, club, etc.',    example: 'Membership is twenty-eight dollars a month.',    soundsLike: 'MEM-ber-ship',  definition: 'the fee you pay to be part of a club or gym' },
        { id: 'v2', word: 'equipment',         pos: 'noun',         translation: 'Las máquinas y aparatos (en un gimnasio, una oficina, etc.). Siempre singular en inglés.', example: 'They have newer equipment.',                     soundsLike: 'ee-KWIP-ment',  definition: 'the machines and tools you need to do something' },
        { id: 'v3', word: 'crowded',           pos: 'adjective',    translation: 'Lleno de gente.',                                                                        example: 'It was way too crowded.',                        soundsLike: 'CROW-ded',      definition: 'full of people' },
        { id: 'v4', word: 'staff',             pos: 'noun',         translation: 'El personal, el equipo de trabajadores. Siempre singular aunque se refiera a varias personas.', example: 'The staff is much friendlier.',             soundsLike: 'STAF',          definition: 'the people who work at a place' },
        { id: 'v5', word: 'to work out',       pos: 'phrasal-verb', translation: 'Entrenar, hacer ejercicio físico (normalmente en un gimnasio).',                          example: 'I like to work out in the morning.',             definition: 'to exercise, usually at a gym' },
        { id: 'v6', word: 'convenient',        pos: 'adjective',    translation: 'Cómodo, práctico — fácil de acceder o que te queda bien.',                                example: 'Pulse is very convenient — just five minutes away.', soundsLike: 'con-VEE-nyent', definition: 'easy to reach or useful for your situation' },
        { id: 'v7', word: 'worth it',          pos: 'phrase',       translation: 'Que vale la pena — el precio o el esfuerzo se justifica.',                                example: 'I don\'t think it\'s worth it.',                 definition: 'good enough to justify the price or effort' },
        { id: 'v8', word: 'value for money',   pos: 'phrase',       translation: 'Relación precio-calidad. Lo que recibes por lo que pagas.',                               example: 'It\'s the best value for money.',                definition: 'what you get compared to what you pay' },
      ],
      quiz: [
        {
          kind: 'mcq',
          id: 'vq1',
          prompt: 'If a place is "crowded", it is…',
          options: [
            { id: 'a', text: 'full of people' },
            { id: 'b', text: 'empty' },
            { id: 'c', text: 'expensive' },
          ],
          correct: 'a',
          explain: 'Crowded = lleno de gente. The opposite is "empty" or "quiet".',
        },
        {
          kind: 'mcq',
          id: 'vq2',
          prompt: '"The staff is friendly" refers to…',
          options: [
            { id: 'a', text: 'the equipment' },
            { id: 'b', text: 'the price' },
            { id: 'c', text: 'the people who work there' },
          ],
          correct: 'c',
          explain: '"Staff" is always the group of workers. Note: in English it\'s singular — "the staff IS", not "are".',
        },
        {
          kind: 'mcq',
          id: 'vq3',
          prompt: 'If something is "good value for money", it…',
          options: [
            { id: 'a', text: 'is very cheap but bad quality' },
            { id: 'b', text: 'gives you a lot for the price you pay' },
            { id: 'c', text: 'is the most expensive option' },
          ],
          correct: 'b',
          explain: 'It\'s not about being cheap — it\'s about the balance between price and what you get.',
        },
      ],
    },

    // ─── Step 3 · Prediction ─────────────────────────────────
    {
      kind:  'prediction',
      title: 'What will you hear?',
      intro: 'Don\'t press play yet. You know Zoe visited three gyms. Based on how most people shop around, take a guess.',
      questions: [
        {
          kind: 'mcq',
          id: 'p1',
          prompt: 'Which gym do you think will be the CHEAPEST?',
          options: [
            { id: 'a', text: 'The biggest one, with a pool' },
            { id: 'b', text: 'The one in the oldest building' },
            { id: 'c', text: 'The smallest one, closest to home' },
          ],
          correct: 'c',
        },
        {
          kind: 'mcq',
          id: 'p2',
          prompt: 'Which gym do you think Zoe will LIKE THE MOST?',
          options: [
            { id: 'a', text: 'The one with a pool and friendly staff' },
            { id: 'b', text: 'The cheapest one' },
            { id: 'c', text: 'The one that is the farthest away' },
          ],
          correct: 'a',
        },
        {
          kind: 'mcq',
          id: 'p3',
          prompt: 'What do you think will be the MAIN problem with the cheapest gym?',
          options: [
            { id: 'a', text: 'The staff doesn\'t speak English' },
            { id: 'b', text: 'It\'s too small and too crowded' },
            { id: 'c', text: 'It only opens at night' },
          ],
          correct: 'b',
        },
      ],
    },

    // ─── Step 4 · Gist ───────────────────────────────────────
    {
      kind:      'gist',
      title:     'Listen for the gist',
      intro:     'Press play and listen to the whole audio ONCE. Don\'t stop for details — just catch the general picture.',
      listenFor: [
        'How many gyms Zoe visited and their names',
        'Which gym she chose in the end',
        'The main reason for her choice',
      ],
      allowTranscript: false,
      questions: [
        {
          kind: 'mcq',
          id: 'g1',
          prompt: 'How many gyms did Zoe visit?',
          options: [
            { id: 'a', text: 'Two' },
            { id: 'b', text: 'Four' },
            { id: 'c', text: 'Three' },
          ],
          correct: 'c',
        },
        {
          kind: 'mcq',
          id: 'g2',
          prompt: 'Which gym does Zoe decide to join?',
          options: [
            { id: 'a', text: 'Core and Flow' },
            { id: 'b', text: 'Pulse' },
            { id: 'c', text: 'Iron Garden' },
          ],
          correct: 'a',
        },
        {
          kind: 'mcq',
          id: 'g3',
          prompt: 'Why does she choose that one?',
          options: [
            { id: 'a', text: 'Because it\'s the cheapest' },
            { id: 'b', text: 'Because it\'s the best value — pool, friendly staff, newer equipment' },
            { id: 'c', text: 'Because it\'s the closest to her home' },
          ],
          correct: 'b',
        },
      ],
    },

    // ─── Step 5 · Detail ─────────────────────────────────────
    {
      kind:             'detail',
      title:            'Listen for detail',
      intro:            'Now listen again, stopping where you need to. Open the transcript if it helps.',
      allowTranscript:  true,
      questions: [
        {
          kind:     'gap-fill',
          id:       'd1',
          sentence: 'Pulse is a ___-minute walk from Zoe\'s place.',
          answers:  ['five'],
          alts:     [['5']],
        },
        {
          kind:     'gap-fill',
          id:       'd2',
          sentence: 'The three monthly prices are: Pulse $___, Core and Flow $___, Iron Garden $___.',
          answers:  ['28', '45', '55'],
          alts:     [['twenty-eight', 'twenty eight'], ['forty-five', 'forty five'], ['fifty-five', 'fifty five']],
          hint:     'Numbers only is fine.',
        },
        {
          kind: 'mcq',
          id: 'd3',
          prompt: 'Which gym has a pool?',
          options: [
            { id: 'a', text: 'Pulse' },
            { id: 'b', text: 'Iron Garden' },
            { id: 'c', text: 'Core and Flow' },
          ],
          correct: 'c',
        },
        {
          kind:     'gap-fill',
          id:       'd4',
          sentence: 'Iron Garden is in the ___ building, but has a lovely outdoor ___.',
          answers:  ['oldest', 'terrace'],
          hint:     'Superlative for the building — and a nice outdoor space.',
        },
        {
          kind: 'mcq',
          id: 'd5',
          prompt: 'When was Pulse the most crowded for Zoe?',
          options: [
            { id: 'a', text: 'Seven p.m.' },
            { id: 'b', text: 'Six p.m.' },
            { id: 'c', text: 'Saturday morning' },
          ],
          correct: 'a',
        },
        {
          kind:     'true-false',
          id:       'd6',
          prompt:   'Iron Garden was quieter than Pulse.',
          correct:  'T',
          explain:  'Zoe: "Way quieter!" — meaning MUCH quieter.',
        },
        {
          kind:     'true-false',
          id:       'd7',
          prompt:   'Zoe thinks Iron Garden is worth the price.',
          correct:  'F',
          explain:  'She says: "for the price, I don\'t think it\'s worth it."',
        },
      ],
    },

    // ─── Step 6 · Language Awareness ─────────────────────────
    {
      kind:  'language-awareness',
      title: 'Notice how she compares',
      intro: 'Look at these patterns from the transcript. They cover the main shapes of comparatives and superlatives — plus the little words native speakers add before them to sound natural.',
      chunks: [
        {
          id:       'c1',
          chunk:    'short adjective + -er than',
          category: 'grammar-pattern',
          gloss:    'comparativo con adjetivos cortos',
          example:  '"Quieter than Pulse?" / "Saturdays get busy."',
          notice:   'One syllable or two ending in -y: add -er. cheap → cheaper, close → closer, quiet → quieter, busy → busier (y → i), big → bigger (double the g).',
        },
        {
          id:       'c2',
          chunk:    'more + long adjective + than',
          category: 'grammar-pattern',
          gloss:    'comparativo con adjetivos largos',
          example:  '"More expensive… much friendlier than at Pulse."',
          notice:   'Three syllables or more → use "more": more expensive, more convenient. Watch out: "friendly" is 2 syllables ending in -y, so it still takes -ier → "friendlier", not "more friendly".',
        },
        {
          id:       'c3',
          chunk:    'irregular comparatives: better / worse / farther',
          category: 'grammar-pattern',
          gloss:    'comparativos irregulares',
          example:  '"Better equipment than Pulse… the farthest."',
          notice:   'good → better / the best. bad → worse / the worst. far → farther (or further) / the farthest. These do NOT take -er.',
        },
        {
          id:       'c4',
          chunk:    'the + -est / the most + adjective',
          category: 'grammar-pattern',
          gloss:    'superlativos',
          example:  '"The closest, the cheapest, the smallest… the most expensive."',
          notice:   'Short → the + -est. Long → the + most + adjective. The article "the" is almost always there: "THE biggest", not just "biggest".',
        },
        {
          id:       'c5',
          chunk:    'a bit / much / way + comparative',
          category: 'grammar-pattern',
          gloss:    'intensificadores antes del comparativo',
          example:  '"A bit — forty-five… much friendlier… way too crowded… way quieter."',
          notice:   'How big is the difference? a bit = slightly. much = significantly. way = a LOT (informal). Always BEFORE the comparative: "much friendlier", not "friendlier much".',
        },
        {
          id:       'c6',
          chunk:    '(not) as X as',
          category: 'grammar-pattern',
          gloss:    'equativo — igual de / no tan',
          example:  '"Not as bad as Pulse at seven."',
          notice:   'Use for "equally X" (as cheap as) or, with "not", for "less X" (not as crowded as = less crowded than). Natural alternative to the comparative.',
        },
      ],
    },

    // ─── Step 7 · Controlled Practice ────────────────────────
    {
      kind:  'controlled-practice',
      title: 'Guided practice',
      intro: 'Use the patterns from the previous step. Short adjective → -er / the -est. Long → more / the most. And watch for irregulars.',
      activities: [
        {
          kind:     'gap-fill',
          id:       'cp1',
          sentence: 'My new apartment is much ___ (quiet) than the old one.',
          answers:  ['quieter'],
          hint:     'Short adjective → add -er.',
        },
        {
          kind:     'gap-fill',
          id:       'cp2',
          sentence: 'This café is ___ (expensive) than the one on the corner, but the coffee is ___ (good).',
          answers:  ['more expensive', 'better'],
          hint:     'One long adjective, one irregular.',
        },
        {
          kind: 'mcq',
          id: 'cp3',
          prompt: 'Which sentence is CORRECT?',
          options: [
            { id: 'a', text: 'My phone is more newer than yours.' },
            { id: 'b', text: 'My phone is newer than yours.' },
            { id: 'c', text: 'My phone is the more new than yours.' },
          ],
          correct: 'b',
          explain: '"New" is short — just add -er. Never combine "more" with "-er".',
        },
        {
          kind:     'gap-fill',
          id:       'cp4',
          sentence: 'Of all the restaurants in my neighborhood, this is ___ (good). It\'s also ___ (busy) — you need to book.',
          answers:  ['the best', 'the busiest'],
          hint:     'Both superlatives. Don\'t forget "the".',
        },
        {
          kind: 'mcq',
          id: 'cp5',
          prompt: 'Your sister ran 10 km. You ran 5 km. The most natural way to say this is:',
          options: [
            { id: 'a', text: 'My sister ran much farther than me.' },
            { id: 'b', text: 'My sister ran more far than me.' },
            { id: 'c', text: 'My sister ran the farther than me.' },
          ],
          correct: 'a',
          explain: '"Far" is irregular → farther / further. And "much" adds emphasis: much farther = una distancia bastante mayor.',
        },
        {
          kind:     'gap-fill',
          id:       'cp6',
          sentence: 'The new café is almost ___ good ___ the old one — maybe even a bit better.',
          answers:  ['as', 'as'],
          hint:     'Equative — same quality.',
        },
      ],
    },

    // ─── Step 8 · Production ─────────────────────────────────
    {
      kind:         'production',
      title:        'Now you',
      intro:        'Your turn to compare like Zoe. You\'re going to speak for 60 seconds. Pick 2 or 3 things you know well and compare them.',
      mode:         'speaking',
      prompt:       'Compare 2 or 3 of the following (your choice): cafés, restaurants, phones, apps, neighborhoods, cities you\'ve visited, or jobs you\'ve had. Use at least 3 different patterns from this lesson — a comparative (-er than / more… than), a superlative (the -est / the most…), and a modifier (a bit / much / way + comparative). Minimum 60 seconds.',
      targetChunks: ['c1', 'c2', 'c3', 'c4', 'c5'],
      minSeconds:   60,
    },
  ],
};
