// Friendlistenings® — A2 · Dinner at Casa Verde
//
// A late-A2 restaurant scene — a step up in complexity from The New
// Neighbor and The Lost Phone. Still firmly A2 in grammar (present
// simple, past simple for the comment at the end, going-to for plans)
// but the student has to handle decisions, polite requests, a bit of
// comparing ("cheaper", "way better"), and the money/tip bit at the
// end. Three practical pressure points that an early A2 scene dodges:
//
//   · ordering with "I'll have…" and "Could we / Could I get…?"
//   · sharing and splitting ("let's share", "let's split it", "each")
//   · reacting to food + gentle opinion ("it was amazing",
//     "way better than…", "worth it")
//
// A ~2:00 two-speaker scene. Olivia and Theo meet for dinner, decide
// what to share, order, eat, pay and split the bill in natural A2
// register. No third voice — the waiter's lines are quoted or implied
// so the A2 ear tracks only two speakers.
//
// 8-step arc, ~40 minute slot (sits above the 35-min existing A2s):
//   1. Lead-in     · 3 min  — dining out + ordering schema
//   2. Vocab       · 6 min  — 8 restaurant chunks + 3 checks
//   3. Prediction  · 3 min  — guess the arc from the title
//   4. Gist        · 6 min  — overall mood + outcome
//   5. Detail      · 9 min  — specifics (what they ate, prices, drinks)
//   6. Awareness   · 6 min  — 5 restaurant chunks for ordering + paying
//   7. Controlled  · 5 min  — reuse chunks in short tasks
//   8. Production  · 3 min  — 40-word writing: plan dinner with a friend

import type { FLLesson } from '@/types/friendlistenings';

export const lessonA2RestaurantCasaVerde: FLLesson = {
  id:           'a2-restaurant-casa-verde',
  title:        'Dinner at Casa Verde',
  subtitle:     'Two friends order, share and split the bill',
  level:        'A2',
  topic:        'Restaurants · ordering · sharing the bill',
  scenario:     'Olivia and Theo meet for dinner at Casa Verde. They decide what to share, order drinks, comment on the food and split the bill politely.',
  estimatedMin: 40,
  tags:         ['restaurant', 'ordering', 'polite-requests', 'comparatives', 'late-a2'],
  createdAt:    '2026-11-19',

  cover: {
    accent: '#B8653F',
    emoji:  '🍽️',
  },

  audio: {
    durationSec: 125,
    speakers: [
      {
        id: 'olivia', displayName: 'Olivia', accent: 'US', gender: 'f',
        suggestedVoice: { voiceId: 'SAz9YHcvj6GT2YYXdXww', name: 'River', note: 'ElevenLabs · warm US female, late-20s — relaxed social-dinner energy; fresh voice not yet used elsewhere in the FL catalog' },
      },
      {
        id: 'theo', displayName: 'Theo', accent: 'US', gender: 'm',
        suggestedVoice: { voiceId: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', note: 'ElevenLabs · casual US male, mid-20s — easy, friendly cadence; also fresh in the catalog' },
      },
    ],
    script: [
      { speakerId: 'theo',   approxStartSec:   0, text: 'Wow, this place is really nice. Have you been here before?' },
      { speakerId: 'olivia', approxStartSec:   6, text: 'No, first time. My sister came last week and loved it.' },
      { speakerId: 'theo',   approxStartSec:  12, text: 'Great. Okay, let\'s look at the menu. I\'m starving.' },
      { speakerId: 'olivia', approxStartSec:  18, text: 'Me too. Oh, there are so many things. What do you want to try?' },
      { speakerId: 'theo',   approxStartSec:  25, text: 'The paella looks great. But it\'s for two people only. Do you want to share?' },
      { speakerId: 'olivia', approxStartSec:  33, text: 'Yes, perfect. I don\'t want a huge meal. A sharing plate is a good idea.' },
      { speakerId: 'theo',   approxStartSec:  41, text: 'And maybe a starter? Look — the goat cheese salad, or the garlic bread?' },
      { speakerId: 'olivia', approxStartSec:  49, text: 'Let\'s get the salad. It\'s cheaper, and we can share that too.' },
      { speakerId: 'theo',   approxStartSec:  56, text: 'Deal. And drinks?' },
      { speakerId: 'olivia', approxStartSec:  60, text: 'Just water for me. I have to drive home. You?' },
      { speakerId: 'theo',   approxStartSec:  66, text: 'I\'ll have a small glass of red wine. Just one.' },
      { speakerId: 'olivia', approxStartSec:  72, text: 'Good idea. Oh, excuse me! Could we order, please?' },
      { speakerId: 'theo',   approxStartSec:  79, text: 'She\'s coming. Okay — paella for two, the goat cheese salad, one water and one small glass of red wine.' },
      { speakerId: 'olivia', approxStartSec:  89, text: 'Perfect. Oh, and could you ask if the paella is spicy? I can\'t eat anything very spicy.' },
      { speakerId: 'theo',   approxStartSec:  98, text: 'Sure, no problem.' },
      { speakerId: 'olivia', approxStartSec: 102, text: 'Thanks. Okay, now I\'m really hungry.' },
      { speakerId: 'theo',   approxStartSec: 107, text: 'Me too. That was amazing. I think the paella is way better than at El Patio.' },
      { speakerId: 'olivia', approxStartSec: 115, text: 'Totally. And the salad was so fresh. I\'m so full now.' },
      { speakerId: 'theo',   approxStartSec: 121, text: 'Shall we get the bill?' },
      { speakerId: 'olivia', approxStartSec: 124, text: 'Yes. Let\'s split it, okay? It\'s easier.' },
      { speakerId: 'theo',   approxStartSec: 129, text: 'Of course. Thirty-two each, I think. Plus a small tip — the waiter was really nice.' },
      { speakerId: 'olivia', approxStartSec: 137, text: 'Perfect. We should come back. Next time, I\'ll try the fish.' },
    ],
  },

  steps: [
    // ─── Step 1 · Lead-in ─────────────────────────────────────
    {
      kind:      'lead-in',
      title:     'Before we start',
      intro:     'Think about the last time you went out to eat with a friend. Today you will hear Olivia and Theo at a restaurant called Casa Verde. They are hungry and they need to decide what to order.',
      hookEmoji: '🍽️',
      openQuestions: [
        { id: 'li1', prompt: 'When you go to a new restaurant, do you prefer to try one big dish or share many small things?' },
        { id: 'li2', prompt: 'When you go out with a friend, do you split the bill or does one person pay?' },
        { id: 'li3', prompt: 'What is one thing you really don\'t like to eat? What do you do if the menu only has that?', hint: 'Spicy food? Fish? Mushrooms? How do you explain it to a waiter?' },
      ],
    },

    // ─── Step 2 · Vocab ───────────────────────────────────────
    {
      kind:  'vocab',
      title: 'Key vocabulary',
      intro: 'Eight everyday chunks for eating out. You will hear each one in the conversation.',
      items: [
        { id: 'v1', word: 'to be starving',      pos: 'phrase',    translation: 'Tener muchísima hambre (informal).',                    example: 'I\'m starving — I didn\'t have lunch.',                       soundsLike: 'STAR-ving',       definition: 'to be very hungry' },
        { id: 'v2', word: 'a starter',           pos: 'noun',      translation: 'Una entrada (plato antes del principal).',              example: 'The goat cheese salad is a nice starter.',                     definition: 'a small dish you eat before the main course' },
        { id: 'v3', word: 'to share (a plate)',  pos: 'verb',      translation: 'Compartir (un plato).',                                 example: 'Do you want to share the paella?',                             definition: 'to eat one dish between two or more people' },
        { id: 'v4', word: 'spicy',               pos: 'adjective', translation: 'Picante.',                                              example: 'I can\'t eat anything very spicy.',                            soundsLike: 'SPY-see',         definition: 'with a strong hot flavor, like chili' },
        { id: 'v5', word: 'to order',            pos: 'verb',      translation: 'Hacer el pedido (en un restaurante).',                   example: 'Could we order, please?',                                      definition: 'to ask the waiter to bring food or drink' },
        { id: 'v6', word: "I'll have…",          pos: 'phrase',    translation: 'Yo voy a pedir… (al mozo).',                            example: 'I\'ll have a small glass of red wine.',                        definition: 'a fixed way to say what you want to order' },
        { id: 'v7', word: 'to split the bill',   pos: 'phrase',    translation: 'Dividir la cuenta.',                                    example: 'Let\'s split the bill — it\'s easier.',                        definition: 'to pay half each at a restaurant' },
        { id: 'v8', word: 'a tip',               pos: 'noun',      translation: 'Una propina (para el mozo).',                            example: 'Plus a small tip — the waiter was really nice.',               soundsLike: 'TIP',             definition: 'extra money you give to someone who served you' },
      ],
      quiz: [
        {
          kind: 'mcq',
          id: 'vq1',
          prompt: 'If you say "I\'m starving", you mean…',
          options: [
            { id: 'a', text: 'I am very hungry' },
            { id: 'b', text: 'I am very tired' },
            { id: 'c', text: 'I am very full' },
          ],
          correct: 'a',
          explain: '"Starving" = extremely hungry. Informal.',
        },
        {
          kind: 'mcq',
          id: 'vq2',
          prompt: 'Which sentence orders politely in a restaurant?',
          options: [
            { id: 'a', text: 'Give me a glass of wine.' },
            { id: 'b', text: 'I\'ll have a glass of wine, please.' },
            { id: 'c', text: 'Wine me now.' },
          ],
          correct: 'b',
          explain: '"I\'ll have…" is the natural polite way to order.',
        },
        {
          kind: 'mcq',
          id: 'vq3',
          prompt: '"Let\'s split the bill" means…',
          options: [
            { id: 'a', text: 'you pay everything' },
            { id: 'b', text: 'the waiter pays' },
            { id: 'c', text: 'each person pays half' },
          ],
          correct: 'c',
          explain: '"Split the bill" = divide the total.',
        },
      ],
    },

    // ─── Step 3 · Prediction ─────────────────────────────────
    {
      kind:  'prediction',
      title: 'What will you hear?',
      intro: 'You know Olivia and Theo are at Casa Verde for dinner. Before you press play, make a guess.',
      questions: [
        {
          kind: 'mcq',
          id: 'p1',
          prompt: 'What will they probably do first?',
          options: [
            { id: 'a', text: 'ask for the bill' },
            { id: 'b', text: 'decide what to eat' },
            { id: 'c', text: 'leave the restaurant' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'p2',
          prompt: 'Which topic will they NOT talk about?',
          options: [
            { id: 'a', text: 'drinks' },
            { id: 'b', text: 'sharing a dish' },
            { id: 'c', text: 'politics' },
          ],
          correct: 'c',
        },
        {
          kind: 'mcq',
          id: 'p3',
          prompt: 'How will they probably pay at the end?',
          options: [
            { id: 'a', text: 'Theo pays everything' },
            { id: 'b', text: 'they leave without paying' },
            { id: 'c', text: 'they split the bill' },
          ],
          correct: 'c',
        },
      ],
    },

    // ─── Step 4 · Gist ───────────────────────────────────────
    {
      kind:      'gist',
      title:     'Listen for the gist',
      intro:     'Press play and listen ONCE. Don\'t worry about details — just get the big picture.',
      listenFor: [
        'Is this the first time at this restaurant for both of them?',
        'Do they order one dish each or share?',
        'Do they enjoy the food?',
      ],
      allowTranscript: false,
      questions: [
        {
          kind: 'mcq',
          id: 'g1',
          prompt: 'Is it their first time at Casa Verde?',
          options: [
            { id: 'a', text: 'First time for both of them' },
            { id: 'b', text: 'First time for Theo only' },
            { id: 'c', text: 'First time for Olivia only' },
          ],
          correct: 'a',
          explain: 'Theo asks "Have you been here before?" and Olivia says "No, first time."',
        },
        {
          kind: 'mcq',
          id: 'g2',
          prompt: 'How do they organise the main dish?',
          options: [
            { id: 'a', text: 'they order one each' },
            { id: 'b', text: 'they share one big dish' },
            { id: 'c', text: 'only Theo eats a main' },
          ],
          correct: 'b',
        },
        {
          kind:    'true-false',
          id:      'g3',
          prompt:  'They enjoy the food.',
          correct: 'T',
          explain: 'Theo says the paella is "way better than at El Patio" and Olivia says the salad is "so fresh".',
        },
        {
          kind:    'true-false',
          id:      'g4',
          prompt:  'Theo pays for the whole meal.',
          correct: 'F',
          explain: 'They split the bill — thirty-two each plus a small tip.',
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
          sentence: 'Olivia\'s ___ came to Casa Verde last week and loved it.',
          answers:  ['sister'],
          alts:     [['sister']],
        },
        {
          kind: 'mcq',
          id: 'd2',
          prompt: 'What main dish do they decide to share?',
          options: [
            { id: 'a', text: 'the paella' },
            { id: 'b', text: 'the garlic bread' },
            { id: 'c', text: 'the goat cheese salad' },
          ],
          correct: 'a',
        },
        {
          kind: 'mcq',
          id: 'd3',
          prompt: 'Why do they choose the goat cheese salad instead of the garlic bread?',
          options: [
            { id: 'a', text: 'the salad is more famous' },
            { id: 'b', text: 'the garlic bread is bad' },
            { id: 'c', text: 'the salad is cheaper' },
          ],
          correct: 'c',
        },
        {
          kind:     'gap-fill',
          id:       'd4',
          sentence: 'Olivia orders just ___ because she has to drive home.',
          answers:  ['water'],
          alts:     [['water']],
        },
        {
          kind: 'mcq',
          id: 'd5',
          prompt: 'What does Theo order to drink?',
          options: [
            { id: 'a', text: 'a bottle of beer' },
            { id: 'b', text: 'a small glass of red wine' },
            { id: 'c', text: 'just water' },
          ],
          correct: 'b',
        },
        {
          kind:    'true-false',
          id:      'd6',
          prompt:  'Olivia asks Theo to check if the paella is spicy.',
          correct: 'T',
          explain: 'She says: "could you ask if the paella is spicy? I can\'t eat anything very spicy."',
        },
        {
          kind:     'gap-fill',
          id:       'd7',
          sentence: 'They split the bill — thirty-two ___, plus a small tip.',
          answers:  ['each'],
          alts:     [['each']],
        },
        {
          kind: 'mcq',
          id: 'd8',
          prompt: 'What does Theo say about the paella compared to El Patio?',
          options: [
            { id: 'a', text: 'about the same' },
            { id: 'b', text: 'a bit worse' },
            { id: 'c', text: 'way better' },
          ],
          correct: 'c',
          explain: 'He says: "the paella is way better than at El Patio."',
        },
      ],
    },

    // ─── Step 6 · Language Awareness ─────────────────────────
    {
      kind:  'language-awareness',
      title: 'Notice these expressions',
      intro: 'Go back to the transcript and spot these five chunks. They are the real bricks of ordering and sharing in English.',
      chunks: [
        {
          id:       'c1',
          chunk:    "I'll have… / I'll try…",
          category: 'register',
          gloss:    'frase fija para pedir en un restaurante',
          example:  '"I\'ll have a small glass of red wine." / "Next time, I\'ll try the fish."',
          notice:   'Use "I\'ll have…" the moment the waiter is looking at you. "I\'ll try…" is good for a dish you haven\'t eaten before.',
        },
        {
          id:       'c2',
          chunk:    "Could we / Could I…?",
          category: 'collocation',
          gloss:    'pedir algo con cortesía',
          example:  '"Could we order, please?" / "Could you ask if the paella is spicy?"',
          notice:   '"Could" is softer than "can". Add "please" at the end and you sound like a native customer. Use it for ordering, asking for the bill, or asking a small favour.',
        },
        {
          id:       'c3',
          chunk:    'Do you want to share…?',
          category: 'collocation',
          gloss:    'proponer compartir un plato',
          example:  '"The paella is for two. Do you want to share?"',
          notice:   'Classic restaurant move for A2+. Same frame: "Do you want to split a starter?", "Do you want to share a dessert?".',
        },
        {
          id:       'c4',
          chunk:    "Let's split it / … each",
          category: 'collocation',
          gloss:    'dividir la cuenta en partes iguales',
          example:  '"Let\'s split it, okay?" / "Thirty-two each."',
          notice:   '"Split the bill" is the verb, "each" is the price per person. If you want to pay separately from the start, say "Could we have separate bills?" when you order.',
        },
        {
          id:       'c5',
          chunk:    'way better than… / way more…',
          category: 'collocation',
          gloss:    'intensificador informal antes de un comparativo',
          example:  '"The paella is way better than at El Patio."',
          notice:   '"Way" before a comparative = "a lot". Very common when reacting to food, films, prices. Scale it down with "a bit": "a bit better than…".',
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
          sentence: 'The waiter is coming. You want fish. You say: "I\'ll ___ the fish, please."',
          answers:  ['have'],
          hint:     'Standard way to order.',
        },
        {
          kind: 'mcq',
          id: 'cp2',
          prompt: 'Which request sounds the most polite?',
          options: [
            { id: 'a', text: 'Water. Fast.' },
            { id: 'b', text: 'Could we have some water, please?' },
            { id: 'c', text: 'Bring water now.' },
          ],
          correct: 'b',
          explain: '"Could we have… please" is the polite restaurant move.',
        },
        {
          kind:     'gap-fill',
          id:       'cp3',
          sentence: 'The pizza is huge. You propose: "Do you want to ___ it?"',
          answers:  ['share'],
          hint:     'One dish between two people.',
        },
        {
          kind: 'mcq',
          id: 'cp4',
          prompt: 'The bill is 40. Two people, equal parts. The most natural way to say it:',
          options: [
            { id: 'a', text: 'Let\'s split it — twenty each.' },
            { id: 'b', text: 'Let\'s cut it in half-twenty.' },
            { id: 'c', text: 'Let\'s share the bill in two.' },
          ],
          correct: 'a',
        },
        {
          kind:     'gap-fill',
          id:       'cp5',
          sentence: 'This café is ___ better than the one next door — the coffee is amazing.',
          answers:  ['way'],
          hint:     'Informal intensifier before "better".',
        },
      ],
    },

    // ─── Step 8 · Production ─────────────────────────────────
    {
      kind:         'production',
      title:        'Now you',
      intro:        'Imagine you are planning dinner with a friend tonight. Write a short message proposing the plan: what to share, what to drink, and how to pay.',
      mode:         'writing',
      prompt:       'Write 4–5 sentences inviting a friend to dinner. Use at least 3 of the chunks from this lesson: "I\'ll have / I\'ll try", "Could we…?", "Do you want to share…?", "Let\'s split it", or "way better than…".',
      targetChunks: ['c1', 'c2', 'c3', 'c4', 'c5'],
      minWords:     40,
    },
  ],
};
