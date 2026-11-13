// Friendlistenings® — A2 · The new neighbor
//
// A ~1:40 hallway conversation. Camila has just moved into flat 4B and
// bumps into Bruno from 4A. They swap names, origin, jobs, and a quick
// comment about the building before agreeing to grab coffee.
//
// The 8-step arc targets a beginner A2 slot (~35 minutes):
//   1. Lead-in     · 3 min — neighbors + routine schema
//   2. Vocab       · 6 min — 8 everyday items + 3-question check
//   3. Prediction  · 2 min — guess the topic from the title
//   4. Gist        · 5 min — overall tone + situation
//   5. Detail      · 8 min — specific numbers, places, jobs
//   6. Awareness   · 5 min — 5 A2 chunks for small talk
//   7. Controlled  · 4 min — gap-fills reusing the chunks
//   8. Production  · 2 min — 30-sec writing: introduce yourself to a neighbor

import type { FLLesson } from '@/types/friendlistenings';

export const lessonA2TheNewNeighbor: FLLesson = {
  id:           'a2-the-new-neighbor',
  title:        'The new neighbor',
  subtitle:     'A hallway introduction',
  level:        'A2',
  topic:        'Introductions · routines · neighbors',
  scenario:     'Camila just moved into flat 4B and meets Bruno from 4A in the hallway.',
  estimatedMin: 35,
  tags:         ['introductions', 'routines', 'small-talk', 'everyday'],
  createdAt:    '2026-11-12',

  cover: {
    accent: '#5BA3D0',
    emoji:  '🏠',
  },

  audio: {
    durationSec: 100,
    speakers: [
      {
        id: 'bruno', displayName: 'Bruno', accent: 'US', gender: 'm',
        suggestedVoice: { voiceId: 'nPczCjzI2devNBz1zQrb', name: 'Brian', note: 'ElevenLabs · deep confident male, clear and slow — ideal for A2' },
      },
      {
        id: 'camila', displayName: 'Camila', accent: 'US', gender: 'f',
        suggestedVoice: { voiceId: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', note: 'ElevenLabs · warm friendly female, upbeat A2-friendly pace' },
      },
    ],
    script: [
      { speakerId: 'bruno',  approxStartSec:   0, text: 'Oh, hi! You must be the new neighbor. I\'m Bruno. I live in 4A.' },
      { speakerId: 'camila', approxStartSec:   7, text: 'Hi Bruno. Yes, I just moved in. My name is Camila. Nice to meet you.' },
      { speakerId: 'bruno',  approxStartSec:  14, text: 'Nice to meet you too. Welcome to the building. Where are you from?' },
      { speakerId: 'camila', approxStartSec:  21, text: 'I\'m from Córdoba, in Argentina. But I lived in Madrid for two years before here. How about you?' },
      { speakerId: 'bruno',  approxStartSec:  31, text: 'I\'m from here, actually. From this city. My mum is Portuguese, though.' },
      { speakerId: 'camila', approxStartSec:  38, text: 'Oh, nice! Do you speak Portuguese?' },
      { speakerId: 'bruno',  approxStartSec:  42, text: 'A little. Not very well. What do you do, Camila?' },
      { speakerId: 'camila', approxStartSec:  47, text: 'I\'m a graphic designer. I work from home on Mondays and Wednesdays, and I go to the office the other days. What about you?' },
      { speakerId: 'bruno',  approxStartSec:  59, text: 'I\'m a music teacher at the school on Green Street. I start early — I leave at seven every morning.' },
      { speakerId: 'camila', approxStartSec:  69, text: 'Seven? Wow, that\'s early for me.' },
      { speakerId: 'bruno',  approxStartSec:  73, text: 'I know. But I finish at three. That\'s the good part.' },
      { speakerId: 'camila', approxStartSec:  79, text: 'Nice. Hey, is the building quiet?' },
      { speakerId: 'bruno',  approxStartSec:  83, text: 'Very quiet. The neighbors are friendly. There\'s an older lady in 3B — she has a small dog. He barks sometimes, but not much.' },
      { speakerId: 'camila', approxStartSec:  93, text: 'Good to know. Well, I should finish unpacking. It was nice meeting you, Bruno.' },
      { speakerId: 'bruno',  approxStartSec: 100, text: 'You too, Camila. Hey, if you want, we can have a coffee next weekend. There\'s a lovely café on the corner.' },
      { speakerId: 'camila', approxStartSec: 109, text: 'Sure, I\'d love that. See you around!' },
      { speakerId: 'bruno',  approxStartSec: 113, text: 'See you!' },
    ],
  },

  steps: [
    // ─── Step 1 · Lead-in ─────────────────────────────────────
    {
      kind:      'lead-in',
      title:     'Before we start',
      intro:     'Think about your neighbors for a moment. Do you know them? Do you say hi in the hallway? Today you will listen to Camila and Bruno, two neighbors meeting for the first time.',
      hookEmoji: '🏠',
      openQuestions: [
        { id: 'li1', prompt: 'Who are your neighbors? Are they friendly?' },
        { id: 'li2', prompt: 'Do you work from home or do you go to an office?' },
        { id: 'li3', prompt: 'How do people meet new neighbors in your country?', hint: 'In some places people bring food. In others, you just say hi and that\'s it.' },
      ],
    },

    // ─── Step 2 · Vocab ───────────────────────────────────────
    {
      kind:  'vocab',
      title: 'Key vocabulary',
      intro: 'Look at these 8 words. You will hear all of them in the conversation.',
      items: [
        { id: 'v1', word: 'neighbor',             pos: 'noun',      translation: 'Vecino/a — persona que vive cerca de vos.',                    example: 'You must be the new neighbor.',             soundsLike: 'NAY-ber',       definition: 'a person who lives next to or near you' },
        { id: 'v2', word: 'to move in',           pos: 'phrase',    translation: 'Mudarse (a una casa o departamento nuevo).',                    example: 'I just moved in.',                           soundsLike: 'MOOV in',       definition: 'to start living in a new home' },
        { id: 'v3', word: 'to work from home',    pos: 'phrase',    translation: 'Trabajar desde casa.',                                          example: 'I work from home on Mondays.',               definition: 'to do your job from your house' },
        { id: 'v4', word: 'graphic designer',     pos: 'noun',      translation: 'Diseñador/a gráfico/a.',                                        example: 'I\'m a graphic designer.',                   definition: 'a person who creates visual design' },
        { id: 'v5', word: 'to leave (for work)',  pos: 'verb',      translation: 'Salir (de casa, para ir a algún lugar).',                       example: 'I leave at seven every morning.',            definition: 'to go away from a place' },
        { id: 'v6', word: 'to finish',            pos: 'verb',      translation: 'Terminar.',                                                     example: 'I finish at three.',                         definition: 'to end, to stop doing something' },
        { id: 'v7', word: 'friendly',             pos: 'adjective', translation: 'Simpático/a, amable.',                                          example: 'The neighbors are friendly.',                soundsLike: 'FREND-lee',     definition: 'kind and nice to other people' },
        { id: 'v8', word: 'quiet',                pos: 'adjective', translation: 'Tranquilo, con poco ruido.',                                    example: 'The building is very quiet.',                soundsLike: 'KWY-et',        definition: 'with little or no noise' },
      ],
      quiz: [
        {
          kind: 'mcq',
          id: 'vq1',
          prompt: 'If someone says "I just moved in," they are…',
          options: [
            { id: 'a', text: 'starting to live in a new home' },
            { id: 'b', text: 'leaving the apartment' },
            { id: 'c', text: 'visiting a friend' },
          ],
          correct: 'a',
          explain: '"Move in" = start living in a new place.',
        },
        {
          kind: 'mcq',
          id: 'vq2',
          prompt: 'Your "neighbor" is a person who…',
          options: [
            { id: 'a', text: 'works at your job' },
            { id: 'b', text: 'is in your family' },
            { id: 'c', text: 'lives next to or near you' },
          ],
          correct: 'c',
          explain: 'Neighbor = someone who lives near you.',
        },
        {
          kind: 'mcq',
          id: 'vq3',
          prompt: '"The building is quiet" means that…',
          options: [
            { id: 'a', text: 'there is a lot of noise' },
            { id: 'b', text: 'there is very little noise' },
            { id: 'c', text: 'the building is empty' },
          ],
          correct: 'b',
          explain: 'Quiet = little noise. The opposite is "noisy".',
        },
      ],
    },

    // ─── Step 3 · Prediction ─────────────────────────────────
    {
      kind:  'prediction',
      title: 'What will you hear?',
      intro: 'You know Camila just moved in and meets Bruno. Before you press play, make a guess.',
      questions: [
        {
          kind: 'mcq',
          id: 'p1',
          prompt: 'What will they probably talk about first?',
          options: [
            { id: 'a', text: 'their names and where they live' },
            { id: 'b', text: 'their favorite movies' },
            { id: 'c', text: 'politics' },
          ],
          correct: 'a',
        },
        {
          kind: 'mcq',
          id: 'p2',
          prompt: 'What topic do you expect in a conversation like this?',
          options: [
            { id: 'a', text: 'world history' },
            { id: 'b', text: 'serious family problems' },
            { id: 'c', text: 'jobs and daily routine' },
          ],
          correct: 'c',
        },
        {
          kind: 'mcq',
          id: 'p3',
          prompt: 'How will the conversation end?',
          options: [
            { id: 'a', text: 'with an argument' },
            { id: 'b', text: 'with a friendly goodbye' },
            { id: 'c', text: 'with silence' },
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
        'The general tone — are they friendly or unfriendly?',
        'Do they both work?',
        'Will they see each other again?',
      ],
      allowTranscript: false,
      questions: [
        {
          kind: 'mcq',
          id: 'g1',
          prompt: 'What is the overall tone of the conversation?',
          options: [
            { id: 'a', text: 'friendly and relaxed' },
            { id: 'b', text: 'serious and tense' },
            { id: 'c', text: 'angry and short' },
          ],
          correct: 'a',
        },
        {
          kind: 'mcq',
          id: 'g2',
          prompt: 'Do Camila and Bruno plan to meet again?',
          options: [
            { id: 'a', text: 'Maybe, they don\'t say' },
            { id: 'b', text: 'No, they don\'t like each other' },
            { id: 'c', text: 'Yes, for a coffee' },
          ],
          correct: 'c',
        },
        {
          kind:    'true-false',
          id:      'g3',
          prompt:  'Both Camila and Bruno have jobs.',
          correct: 'T',
          explain: 'Camila is a graphic designer; Bruno is a music teacher.',
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
          sentence: 'Camila is from ___, in Argentina.',
          answers:  ['Córdoba'],
          alts:     [['cordoba', 'córdoba']],
        },
        {
          kind: 'mcq',
          id: 'd2',
          prompt: 'Where did Camila live before this city?',
          options: [
            { id: 'a', text: 'Buenos Aires' },
            { id: 'b', text: 'Madrid' },
            { id: 'c', text: 'Lisbon' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'd3',
          prompt: 'What is Camila\'s job?',
          options: [
            { id: 'a', text: 'graphic designer' },
            { id: 'b', text: 'music teacher' },
            { id: 'c', text: 'photographer' },
          ],
          correct: 'a',
        },
        {
          kind:     'gap-fill',
          id:       'd4',
          sentence: 'Camila works from home on Mondays and ___.',
          answers:  ['Wednesdays'],
          alts:     [['wednesday', 'wednesdays']],
        },
        {
          kind:     'gap-fill',
          id:       'd5',
          sentence: 'Bruno leaves home at ___ every morning and finishes at ___.',
          answers:  ['seven', 'three'],
          alts:     [['7', '7:00', 'seven o\'clock'], ['3', '3:00', 'three o\'clock']],
        },
        {
          kind: 'mcq',
          id: 'd6',
          prompt: 'Bruno\'s mother is from…',
          options: [
            { id: 'a', text: 'Brazil' },
            { id: 'b', text: 'Spain' },
            { id: 'c', text: 'Portugal' },
          ],
          correct: 'c',
          explain: 'He says "My mum is Portuguese".',
        },
        {
          kind:    'true-false',
          id:      'd7',
          prompt:  'The building is noisy, according to Bruno.',
          correct: 'F',
          explain: 'Bruno says the building is "very quiet".',
        },
        {
          kind: 'mcq',
          id: 'd8',
          prompt: 'Who lives in flat 3B?',
          options: [
            { id: 'a', text: 'a young family' },
            { id: 'b', text: 'an older lady with a small dog' },
            { id: 'c', text: 'nobody' },
          ],
          correct: 'b',
        },
      ],
    },

    // ─── Step 6 · Language Awareness ─────────────────────────
    {
      kind:  'language-awareness',
      title: 'Notice these expressions',
      intro: 'Go back to the transcript and spot these five chunks. You can use them in any first conversation with someone new.',
      chunks: [
        {
          id:       'c1',
          chunk:    'Nice to meet you / Nice to meet you too',
          category: 'register',
          gloss:    'frase fija para saludar a alguien por primera vez',
          example:  '"Nice to meet you." — "Nice to meet you too."',
          notice:   'Use it only the FIRST time you meet someone. Next time it\'s just "Hi" or "Hey". The reply adds "too".',
        },
        {
          id:       'c2',
          chunk:    'Where are you from? / I\'m from…',
          category: 'collocation',
          gloss:    'preguntar y decir de dónde sos',
          example:  '"Where are you from?" — "I\'m from Córdoba."',
          notice:   'Say "from + city/country". "I\'m from Córdoba." / "I\'m from Argentina." NOT "I\'m Argentina".',
        },
        {
          id:       'c3',
          chunk:    'How about you? / What about you?',
          category: 'discourse-marker',
          gloss:    'devolver la pregunta al otro',
          example:  '"I\'m a graphic designer. What about you?"',
          notice:   'After you answer, use this to pass the question back. Both forms are equally common.',
        },
        {
          id:       'c4',
          chunk:    'What do you do?',
          category: 'collocation',
          gloss:    '¿a qué te dedicás? / ¿en qué trabajás?',
          example:  '"What do you do, Camila?" — "I\'m a graphic designer."',
          notice:   'This is asking about your JOB, not what you\'re doing right now. For that, we say "What are you doing?".',
        },
        {
          id:       'c5',
          chunk:    'See you around',
          category: 'register',
          gloss:    'nos vemos (informal, sin plan concreto)',
          example:  '"See you around!" — "See you!"',
          notice:   'Informal goodbye when you know you\'ll probably see the person again, but you don\'t have a plan. Perfect for neighbors and classmates.',
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
          sentence: 'A: "Hi, I\'m Mia." — B: "Hi Mia, nice to ___ you."',
          answers:  ['meet'],
          hint:     'Fixed greeting.',
        },
        {
          kind:     'gap-fill',
          id:       'cp2',
          sentence: 'A: "Where are you ___?" — B: "I\'m ___ Peru."',
          answers:  ['from', 'from'],
          hint:     'Origin question + answer.',
        },
        {
          kind: 'mcq',
          id: 'cp3',
          prompt: '"I\'m a teacher. ___?" — the most natural way to pass the question is:',
          options: [
            { id: 'a', text: 'What about you?' },
            { id: 'b', text: 'And me?' },
            { id: 'c', text: 'Tell me now' },
          ],
          correct: 'a',
        },
        {
          kind: 'mcq',
          id: 'cp4',
          prompt: 'Your new classmate wants to know your job. They ask:',
          options: [
            { id: 'a', text: '"What are you doing?"' },
            { id: 'b', text: '"What is your doing?"' },
            { id: 'c', text: '"What do you do?"' },
          ],
          correct: 'c',
          explain: '"What do you do?" = What\'s your job? "What are you doing?" = at this moment.',
        },
        {
          kind: 'mcq',
          id: 'cp5',
          prompt: 'You say goodbye to a neighbor in the hallway. The most natural goodbye is:',
          options: [
            { id: 'a', text: '"Goodbye forever."' },
            { id: 'b', text: '"See you around!"' },
            { id: 'c', text: '"Have a safe flight."' },
          ],
          correct: 'b',
        },
      ],
    },

    // ─── Step 8 · Production ─────────────────────────────────
    {
      kind:         'production',
      title:        'Now you',
      intro:        'Imagine you just met a new neighbor in your building. Introduce yourself in writing: your name, where you\'re from, what you do, and ONE question for them.',
      mode:         'writing',
      prompt:       'Write a short introduction (4–6 sentences). Use at least 3 of the chunks from this lesson: "Nice to meet you", "I\'m from…", "What about you?", "What do you do?", or "See you around".',
      targetChunks: ['c1', 'c2', 'c3', 'c4', 'c5'],
      minWords:     40,
    },
  ],
};
