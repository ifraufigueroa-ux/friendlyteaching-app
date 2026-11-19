// Friendlistenings® — A2 · The weekend in Puerto Varas
//
// A late-A2 storytelling scene. Clara came back from a two-day trip
// to Puerto Varas (south of Chile — lake, volcano, famously quiet in
// November) and tells her friend Mateo what she did. The arc trains
// the single most important A2+ move: telling a connected past-simple
// story to a friend, with reactions and follow-up questions keeping
// the conversation alive.
//
// Grammar/function focus — all A2 or late-A2:
//   · past simple heavy (went, stayed, ate, saw, took, was/were)
//   · comparatives + superlatives ("way busier", "the best salmon…")
//   · basic time expressions ("on Saturday morning", "that night")
//   · ONE light brush with present perfect for experience
//     ("Have you ever been to…?" / "I've never been to the south")
//     to notice but not drill
//   · reactions that turn a monologue into a dialogue
//     ("Wow.", "Really?", "That sounds perfect.", "Lucky you.")
//
// A ~2:10 two-speaker scene, calibrated above the 1:40–1:55 of the
// starter A2s but clearly not yet B1 (no past continuous frames, no
// discourse markers, no business register).
//
// 8-step arc, ~40 minute slot:
//   1. Lead-in     · 3 min  — weekend trips + reactions schema
//   2. Vocab       · 6 min  — 8 travel chunks + 3 checks
//   3. Prediction  · 3 min  — guess the arc from the title
//   4. Gist        · 6 min  — overall tone + highlights
//   5. Detail      · 9 min  — specifics (where, what, how much)
//   6. Awareness   · 6 min  — 5 chunks for telling past stories
//   7. Controlled  · 5 min  — reuse chunks in short tasks
//   8. Production  · 3 min  — 50-word writing: a recent short trip

import type { FLLesson } from '@/types/friendlistenings';

export const lessonA2WeekendInPuertoVaras: FLLesson = {
  id:           'a2-weekend-in-puerto-varas',
  title:        'The weekend in Puerto Varas',
  subtitle:     'Clara tells a friend about her short trip',
  level:        'A2',
  topic:        'Travel · past stories · reacting to news',
  scenario:     'Clara came back from a weekend trip to Puerto Varas and tells Mateo what she did there — the lake, the food, the rainy Sunday and the prices.',
  estimatedMin: 40,
  tags:         ['travel', 'past-simple', 'comparatives', 'reactions', 'late-a2'],
  createdAt:    '2026-11-19',

  cover: {
    accent: '#3F8BBF',
    emoji:  '🏞️',
  },

  audio: {
    durationSec: 135,
    speakers: [
      {
        id: 'clara', displayName: 'Clara', accent: 'US', gender: 'f',
        suggestedVoice: { voiceId: '9BWtsMINqrJLrRacOk9x', name: 'Aria', note: 'ElevenLabs · US female, mid-20s — expressive storyteller, natural reactions; fresh pairing in the FL catalog' },
      },
      {
        id: 'mateo', displayName: 'Mateo', accent: 'US', gender: 'm',
        suggestedVoice: { voiceId: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum', note: 'ElevenLabs · casual US male — curious friend energy, clean at A2 pace' },
      },
    ],
    script: [
      { speakerId: 'mateo', approxStartSec:   0, text: 'So, how was the weekend? Did you go away?' },
      { speakerId: 'clara', approxStartSec:   5, text: 'Yes! I went to Puerto Varas on Saturday morning with my sister. We stayed until Sunday evening.' },
      { speakerId: 'mateo', approxStartSec:  13, text: 'Nice. Have you been there before?' },
      { speakerId: 'clara', approxStartSec:  17, text: 'Once, but just for one afternoon. This time we had two full days. It was amazing.' },
      { speakerId: 'mateo', approxStartSec:  26, text: 'Lucky you. I\'ve never been to the south. What did you do?' },
      { speakerId: 'clara', approxStartSec:  33, text: 'Okay, so on Saturday morning we went straight to the lake. The water was so blue, Mateo — like a postcard. And you can see the volcano from the beach.' },
      { speakerId: 'mateo', approxStartSec:  46, text: 'Wow. Is it very touristy?' },
      { speakerId: 'clara', approxStartSec:  50, text: 'A little, but it was quiet because it\'s November. In summer it\'s way busier.' },
      { speakerId: 'mateo', approxStartSec:  58, text: 'And the food?' },
      { speakerId: 'clara', approxStartSec:  61, text: 'Oh, the food. We ate at a small restaurant on Saturday night. The owner is German, and he made the best salmon I\'ve had in years.' },
      { speakerId: 'mateo', approxStartSec:  72, text: 'Really? Was it expensive?' },
      { speakerId: 'clara', approxStartSec:  76, text: 'A bit more than normal — twenty-five thousand each — but it was worth it.' },
      { speakerId: 'mateo', approxStartSec:  84, text: 'And Sunday?' },
      { speakerId: 'clara', approxStartSec:  87, text: 'On Sunday morning, we took a boat on the lake. It was cold but so beautiful.' },
      { speakerId: 'mateo', approxStartSec:  95, text: 'That sounds perfect. And Sunday afternoon?' },
      { speakerId: 'clara', approxStartSec: 100, text: 'We wanted to go hiking, but it started raining. So we just went to a café and watched the rain.' },
      { speakerId: 'mateo', approxStartSec: 110, text: 'Honestly, that sounds like the best part. A café with a view.' },
      { speakerId: 'clara', approxStartSec: 117, text: 'Exactly. You should go, Mateo. It\'s much more relaxing than Santiago.' },
      { speakerId: 'mateo', approxStartSec: 124, text: 'I know, I know. Are the hotels expensive?' },
      { speakerId: 'clara', approxStartSec: 129, text: 'Not too bad. Ours was sixty thousand a night. There are cheaper places too.' },
      { speakerId: 'mateo', approxStartSec: 138, text: 'Perfect. Thanks for the tip. I\'ll start looking tonight.' },
    ],
  },

  steps: [
    // ─── Step 1 · Lead-in ─────────────────────────────────────
    {
      kind:      'lead-in',
      title:     'Before we start',
      intro:     'Think about the last time you went somewhere for the weekend — even just one night. Today you will hear Clara tell her friend Mateo about her weekend in Puerto Varas, in the south of Chile.',
      hookEmoji: '🏞️',
      openQuestions: [
        { id: 'li1', prompt: 'When a friend comes back from a trip, what is the first question you ask them?' },
        { id: 'li2', prompt: 'What is more important for you on a weekend trip — the place, the food, or the people with you?' },
        { id: 'li3', prompt: 'Have you ever had a rainy day on a trip? What did you do?', hint: 'A café? A museum? Just stayed in the hotel?' },
      ],
    },

    // ─── Step 2 · Vocab ───────────────────────────────────────
    {
      kind:  'vocab',
      title: 'Key vocabulary',
      intro: 'Eight travel chunks you will hear in the conversation.',
      items: [
        { id: 'v1', word: 'to go away (for the weekend)', pos: 'phrase',    translation: 'Irse (de viaje corto, un fin de semana).',               example: 'Did you go away for the weekend?',               definition: 'to travel somewhere, usually for a short break' },
        { id: 'v2', word: 'to stay (at / until)',         pos: 'verb',      translation: 'Quedarse (en un lugar / hasta).',                        example: 'We stayed until Sunday evening.',                 definition: 'to remain somewhere for a period of time' },
        { id: 'v3', word: 'touristy',                     pos: 'adjective', translation: 'Muy turístico (con muchos turistas).',                   example: 'Is it very touristy?',                             soundsLike: 'TOOR-is-tee',    definition: 'full of tourists; popular with visitors' },
        { id: 'v4', word: 'to be worth it',               pos: 'phrase',    translation: 'Valer la pena.',                                         example: 'A bit more expensive — but it was worth it.',      definition: 'to be good enough to justify the money or time' },
        { id: 'v5', word: 'to take a boat / bus / train', pos: 'phrase',    translation: 'Tomar un barco / bus / tren.',                            example: 'We took a boat on the lake.',                     definition: 'to use a boat, bus or train to travel somewhere' },
        { id: 'v6', word: 'to go hiking',                 pos: 'phrase',    translation: 'Hacer trekking / caminata.',                             example: 'We wanted to go hiking, but it started raining.', definition: 'to walk a long distance in nature' },
        { id: 'v7', word: 'a view',                       pos: 'noun',      translation: 'Una vista (del paisaje).',                               example: 'A café with a view.',                             soundsLike: 'VYOO',           definition: 'what you can see from a window or a place' },
        { id: 'v8', word: "Have you ever been to…?",      pos: 'phrase',    translation: '¿Has estado alguna vez en…?',                            example: '"Have you been there before?" — "Once."',          definition: 'a classic way to ask about life experience of a place' },
      ],
      quiz: [
        {
          kind: 'mcq',
          id: 'vq1',
          prompt: 'If a place is "touristy", there are…',
          options: [
            { id: 'a', text: 'no tourists' },
            { id: 'b', text: 'a lot of tourists' },
            { id: 'c', text: 'only children' },
          ],
          correct: 'b',
          explain: '"Touristy" = full of tourists / very popular with visitors.',
        },
        {
          kind: 'mcq',
          id: 'vq2',
          prompt: '"It was worth it" means…',
          options: [
            { id: 'a', text: 'it was too expensive' },
            { id: 'b', text: 'it was a waste of time' },
            { id: 'c', text: 'it was good enough for the money' },
          ],
          correct: 'c',
          explain: '"Worth it" = the result justified the price or the effort.',
        },
        {
          kind: 'mcq',
          id: 'vq3',
          prompt: 'Which question asks about life experience of a place?',
          options: [
            { id: 'a', text: 'Have you ever been to Puerto Varas?' },
            { id: 'b', text: 'Are you going to Puerto Varas?' },
            { id: 'c', text: 'Do you like Puerto Varas?' },
          ],
          correct: 'a',
          explain: '"Have you ever been to…?" is the classic question about life experiences.',
        },
      ],
    },

    // ─── Step 3 · Prediction ─────────────────────────────────
    {
      kind:  'prediction',
      title: 'What will you hear?',
      intro: 'You know Clara is back from Puerto Varas and Mateo wants to hear about it. Guess what topics will come up.',
      questions: [
        {
          kind: 'mcq',
          id: 'p1',
          prompt: 'What will Mateo probably ask about?',
          options: [
            { id: 'a', text: 'what she did and where she stayed' },
            { id: 'b', text: 'Clara\'s family problems' },
            { id: 'c', text: 'her job at the office' },
          ],
          correct: 'a',
        },
        {
          kind: 'mcq',
          id: 'p2',
          prompt: 'Which pair of topics is most natural in a short trip story?',
          options: [
            { id: 'a', text: 'school homework and grades' },
            { id: 'b', text: 'politics and religion' },
            { id: 'c', text: 'food and the weather' },
          ],
          correct: 'c',
        },
        {
          kind: 'mcq',
          id: 'p3',
          prompt: 'How will Mateo most likely feel at the end?',
          options: [
            { id: 'a', text: 'bored and ready to change the subject' },
            { id: 'b', text: 'interested, maybe wanting to go too' },
            { id: 'c', text: 'angry that Clara went without him' },
          ],
          correct: 'b',
        },
      ],
    },

    // ─── Step 4 · Gist ───────────────────────────────────────
    {
      kind:      'gist',
      title:     'Listen for the gist',
      intro:     'Press play and listen ONCE. Don\'t worry about details — just get the big picture.',
      listenFor: [
        'Did Clara enjoy the weekend?',
        'Was the weather good the whole time?',
        'Does Mateo want to visit Puerto Varas now?',
      ],
      allowTranscript: false,
      questions: [
        {
          kind: 'mcq',
          id: 'g1',
          prompt: 'How does Clara feel about the trip overall?',
          options: [
            { id: 'a', text: 'disappointed' },
            { id: 'b', text: 'she loved it' },
            { id: 'c', text: 'she doesn\'t want to go back' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'g2',
          prompt: 'What happens with the weather on Sunday afternoon?',
          options: [
            { id: 'a', text: 'it starts raining' },
            { id: 'b', text: 'it is very sunny' },
            { id: 'c', text: 'it snows' },
          ],
          correct: 'a',
        },
        {
          kind:    'true-false',
          id:      'g3',
          prompt:  'Mateo has been to the south of Chile before.',
          correct: 'F',
          explain: 'He says "I\'ve never been to the south."',
        },
        {
          kind:    'true-false',
          id:      'g4',
          prompt:  'At the end, Mateo is interested in going too.',
          correct: 'T',
          explain: 'He says "Thanks for the tip. I\'ll start looking tonight."',
        },
      ],
    },

    // ─── Step 5 · Detail ─────────────────────────────────────
    {
      kind:             'detail',
      title:            'Listen for detail',
      intro:            'Listen again, and pause when you need to. You can open the transcript if it helps.',
      allowTranscript:  true,
      questions: [
        {
          kind:     'gap-fill',
          id:       'd1',
          sentence: 'Clara went to Puerto Varas with her ___.',
          answers:  ['sister'],
          alts:     [['sister']],
        },
        {
          kind: 'mcq',
          id: 'd2',
          prompt: 'Why is Puerto Varas quiet when Clara visits?',
          options: [
            { id: 'a', text: 'there is a transport strike' },
            { id: 'b', text: 'it is November, not summer' },
            { id: 'c', text: 'the hotels are closed' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'd3',
          prompt: 'What can you see from the beach?',
          options: [
            { id: 'a', text: 'the volcano' },
            { id: 'b', text: 'a shopping centre' },
            { id: 'c', text: 'another beach' },
          ],
          correct: 'a',
        },
        {
          kind:     'gap-fill',
          id:       'd4',
          sentence: 'The owner of the Saturday-night restaurant is ___.',
          answers:  ['German'],
          alts:     [['german']],
        },
        {
          kind: 'mcq',
          id: 'd5',
          prompt: 'How much was the Saturday-night dinner per person?',
          options: [
            { id: 'a', text: 'ten thousand' },
            { id: 'b', text: 'twenty-five thousand' },
            { id: 'c', text: 'sixty thousand' },
          ],
          correct: 'b',
        },
        {
          kind:    'true-false',
          id:      'd6',
          prompt:  'Clara and her sister went hiking on Sunday afternoon.',
          correct: 'F',
          explain: 'They wanted to, but it started raining — they went to a café instead.',
        },
        {
          kind:     'gap-fill',
          id:       'd7',
          sentence: 'The hotel was about ___ thousand a night.',
          answers:  ['sixty'],
          alts:     [['60', '60,000']],
        },
        {
          kind: 'mcq',
          id: 'd8',
          prompt: 'What did they do on Sunday morning?',
          options: [
            { id: 'a', text: 'they went hiking' },
            { id: 'b', text: 'they stayed in the hotel' },
            { id: 'c', text: 'they took a boat on the lake' },
          ],
          correct: 'c',
        },
      ],
    },

    // ─── Step 6 · Language Awareness ─────────────────────────
    {
      kind:  'language-awareness',
      title: 'Notice these expressions',
      intro: 'Five late-A2 chunks that turn a flat past-tense story into a natural conversation.',
      chunks: [
        {
          id:       'c1',
          chunk:    'On Saturday morning, we…',
          category: 'collocation',
          gloss:    'conectar acciones en un relato con marcadores de tiempo',
          example:  '"On Saturday morning we went to the lake." / "On Sunday morning, we took a boat."',
          notice:   'Structure your story around time markers: "On Saturday morning…", "Saturday night…", "On Sunday morning…", "In the afternoon…". It makes you sound organised and easy to follow.',
        },
        {
          id:       'c2',
          chunk:    'Have you (ever) been to…? / I\'ve never been to…',
          category: 'register',
          gloss:    'preguntar y contar experiencias de vida',
          example:  '"Have you been there before?" — "Once." / "I\'ve never been to the south."',
          notice:   'This is a soft taste of present perfect. You don\'t have to use it a lot yet — just notice it. "Have you ever been to X?" / "I\'ve been / I\'ve never been" are the two shapes to recognise.',
        },
        {
          id:       'c3',
          chunk:    'It was worth it',
          category: 'collocation',
          gloss:    'decir que algo valió la pena a pesar del costo',
          example:  '"A bit more expensive — but it was worth it."',
          notice:   'Perfect for food, concerts, trips. Pair it with "a bit more" or "more expensive" to acknowledge the price before defending it.',
        },
        {
          id:       'c4',
          chunk:    'The best ___ I\'ve had in years',
          category: 'collocation',
          gloss:    'destacar algo como lo mejor en mucho tiempo',
          example:  '"The best salmon I\'ve had in years."',
          notice:   'A natural way to praise food/experiences without sounding exaggerated. Swap "salmon" for coffee, pizza, holiday — anything.',
        },
        {
          id:       'c5',
          chunk:    'Wow. / Really? / That sounds perfect.',
          category: 'discourse-marker',
          gloss:    'reacciones breves que mantienen viva la conversación',
          example:  '"Wow." / "Really?" / "That sounds perfect."',
          notice:   'If your friend tells a story and you only nod, they stop. Short reactions keep them going. Mateo does this constantly — notice every time he reacts, Clara adds more.',
        },
      ],
    },

    // ─── Step 7 · Controlled Practice ────────────────────────
    {
      kind:  'controlled-practice',
      title: 'Guided practice',
      intro: 'Use the chunks from the previous step.',
      activities: [
        {
          kind:     'gap-fill',
          id:       'cp1',
          sentence: '___ Saturday morning, we went to the market and bought vegetables.',
          answers:  ['On'],
          hint:     'Time preposition before a day of the week.',
        },
        {
          kind: 'mcq',
          id: 'cp2',
          prompt: 'Which question asks about life experience of a city?',
          options: [
            { id: 'a', text: 'Have you ever been to Lima?' },
            { id: 'b', text: 'Are you going to Lima?' },
            { id: 'c', text: 'Do you like Lima?' },
          ],
          correct: 'a',
          explain: '"Have you ever been to…?" is the question about life experience.',
        },
        {
          kind:     'gap-fill',
          id:       'cp3',
          sentence: 'The tickets were a bit expensive — but honestly, it was ___ it.',
          answers:  ['worth'],
          hint:     'Fixed expression after "it was".',
        },
        {
          kind: 'mcq',
          id: 'cp4',
          prompt: 'Your friend tells you he just climbed a volcano. The most natural short reaction is:',
          options: [
            { id: 'a', text: '"Confirm the statement."' },
            { id: 'b', text: '"Is that so?"' },
            { id: 'c', text: '"Wow. Really?"' },
          ],
          correct: 'c',
          explain: 'Short, natural reactions like "Wow", "Really?", "That sounds perfect" are what keep a conversation alive.',
        },
        {
          kind:     'gap-fill',
          id:       'cp5',
          sentence: 'That was the best coffee I\'ve ___ in years.',
          answers:  ['had'],
          hint:     'Past participle of "have".',
        },
      ],
    },

    // ─── Step 8 · Production ─────────────────────────────────
    {
      kind:         'production',
      title:        'Now you',
      intro:        'Think about the last time you went away — even one night. Imagine a friend asks "Did you go away?". Write what you\'d say.',
      mode:         'writing',
      prompt:       'Write 5–6 sentences telling your friend about a recent short trip. Include: where you went, when, what you did, something you ate or saw, and one opinion. Use at least 3 of the chunks: "On Saturday/Sunday morning we…", "Have you ever been to…?", "It was worth it", "the best ___ I\'ve had in years", or a short reaction like "Wow / Really?".',
      targetChunks: ['c1', 'c2', 'c3', 'c4', 'c5'],
      minWords:     50,
    },
  ],
};
