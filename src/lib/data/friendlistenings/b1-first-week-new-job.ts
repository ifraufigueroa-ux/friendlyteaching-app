// Friendlistenings® — B1 · My first week at a new job
//
// A ~2:30 café catch-up. Priya tells her friend Oscar how her first week at
// a new job went — the team, the open-plan office, the awful first commute,
// an embarrassing moment with the CEO, and a clear "no regrets" verdict.
//
// B1 targets the move from isolated vocabulary to short connected
// narrative. The script leans on past-simple storytelling + present perfect
// for recent experience ("I've been cycling", "I've met everyone"), with
// natural chunks the student will reuse all the time: "make the right
// call", "turns out", "a bit worried about", "figure out", "I should have".
//
// 8-step arc, ~45 minute class slot:
//   1. Lead-in     · 4 min  — new-job schema + opinion warm-up
//   2. Vocab       · 6 min  — 8 workplace items + 3-question check
//   3. Prediction  · 3 min  — guess the arc from the title
//   4. Gist        · 6 min  — overall verdict + relationship with manager
//   5. Detail      · 10 min — specific numbers, names, decisions
//   6. Awareness   · 7 min  — notice-the-gap on 5 B1 chunks
//   7. Controlled  · 5 min  — reuse the chunks in short tasks
//   8. Production  · 4 min  — 60-sec speaking: a "first week" story

import type { FLLesson } from '@/types/friendlistenings';

export const lessonB1FirstWeekNewJob: FLLesson = {
  id:           'b1-first-week-new-job',
  title:        'My first week at a new job',
  subtitle:     'A café catch-up with a friend',
  level:        'B1',
  topic:        'Work · new beginnings · routines',
  scenario:     'Priya meets her friend Oscar for coffee after her first week at a new job and tells him how it went.',
  estimatedMin: 45,
  tags:         ['work', 'past-narratives', 'present-perfect', 'chunks'],
  createdAt:    '2026-11-12',

  cover: {
    accent: '#E8906A',
    emoji:  '💼',
  },

  audio: {
    durationSec: 150,
    speakers: [
      {
        id: 'oscar', displayName: 'Oscar', accent: 'US', gender: 'm',
        suggestedVoice: { voiceId: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', note: 'ElevenLabs · warm younger male, casual catch-up pace' },
      },
      {
        id: 'priya', displayName: 'Priya', accent: 'US', gender: 'f',
        suggestedVoice: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', note: 'ElevenLabs · clear expressive female, late-20s' },
      },
    ],
    script: [
      { speakerId: 'oscar', approxStartSec:   0, text: 'So, how was your first week? You look tired.' },
      { speakerId: 'priya', approxStartSec:   5, text: 'Yeah, I am. But in a good way. Honestly, I think I made the right call switching jobs.' },
      { speakerId: 'oscar', approxStartSec:  13, text: 'Yeah? Tell me about the team.' },
      { speakerId: 'priya', approxStartSec:  17, text: 'They\'re great, actually. The team\'s smaller than I expected — just six of us. My manager, Zara, picked me up from reception on Monday and walked me through everything. She\'s really hands-on, but not in a micromanaging way.' },
      { speakerId: 'oscar', approxStartSec:  36, text: 'That\'s a good sign. What about the office itself?' },
      { speakerId: 'priya', approxStartSec:  41, text: 'Open-plan, which I was a bit worried about — I\'m not great with noise — but they gave everyone noise-cancelling headphones, so it works. The coffee machine is better than the one at my old place, which already tells you everything.' },
      { speakerId: 'oscar', approxStartSec:  59, text: 'Ha! Priorities. And the commute?' },
      { speakerId: 'priya', approxStartSec:  63, text: 'Awful at first. I took the bus on Monday and it was packed. By Tuesday I\'d figured out I could cycle in thirty minutes — much better. I\'ve been cycling the rest of the week.' },
      { speakerId: 'oscar', approxStartSec:  80, text: 'Nice. Any embarrassing moments?' },
      { speakerId: 'priya', approxStartSec:  84, text: 'Oh, one. On day two I called the CEO "Miguel" in the kitchen. Super casual — "hey Miguel, mind if I grab the oat milk?" Turns out he\'s the CEO. He was really chill about it, but I wanted to disappear.' },
      { speakerId: 'oscar', approxStartSec: 103, text: 'That\'s actually hilarious.' },
      { speakerId: 'priya', approxStartSec: 106, text: 'Easy for you to say. Anyway — overall, it\'s been a great week. I\'ve learned a lot already, I\'ve met everyone on my floor, and nobody has given me the feeling I don\'t belong there.' },
      { speakerId: 'oscar', approxStartSec: 123, text: 'So no regrets about leaving the old job?' },
      { speakerId: 'priya', approxStartSec: 127, text: 'Zero. I should have done it a year ago.' },
    ],
  },

  steps: [
    // ─── Step 1 · Lead-in ─────────────────────────────────────
    {
      kind:      'lead-in',
      title:     'Before we start',
      intro:     'The first week at a new job is strange — you don\'t know the people, the coffee machine is weird, and you worry about stupid details. Today you\'ll listen to Priya tell her friend Oscar how her first week went.',
      hookEmoji: '💼',
      openQuestions: [
        { id: 'li1', prompt: 'Have you ever started a new job or a new school? How was the first week?' },
        { id: 'li2', prompt: 'What would be the hardest part of a new workplace for you: the people, the work, or the commute?' },
        { id: 'li3', prompt: 'Would you prefer a strict manager, a hands-on manager, or a very distant one? Why?', hint: 'A "hands-on" manager is involved day-to-day — but not always a micromanager.' },
      ],
    },

    // ─── Step 2 · Vocab ───────────────────────────────────────
    {
      kind:  'vocab',
      title: 'Key vocabulary',
      intro: 'These 8 items come up in the conversation. They\'re the kind of workplace vocabulary B1 speakers meet all the time at real jobs — worth owning.',
      items: [
        { id: 'v1', word: 'to switch jobs',        pos: 'phrase',    translation: 'Cambiar de trabajo.',                                                   example: 'I think I made the right call switching jobs.', soundsLike: 'SWITCH jobs',   definition: 'to change from one job to another' },
        { id: 'v2', word: 'hands-on',              pos: 'adjective', translation: 'Involucrado/a, muy presente (manager o rol).',                           example: 'She\'s really hands-on.',                      definition: 'closely involved in the work, not distant' },
        { id: 'v3', word: 'to micromanage',        pos: 'verb',      translation: 'Microgestionar — controlar cada detalle del trabajo de otro/a.',         example: 'Not in a micromanaging way.',                  definition: 'to control every small detail of someone\'s work' },
        { id: 'v4', word: 'open-plan',             pos: 'adjective', translation: 'De planta abierta (una oficina sin paredes internas).',                  example: 'The office is open-plan.',                     definition: 'with few or no internal walls' },
        { id: 'v5', word: 'the commute',           pos: 'noun',      translation: 'El trayecto diario al trabajo.',                                         example: 'And the commute?',                             soundsLike: 'kuh-MYOOT',     definition: 'the daily journey from home to work' },
        { id: 'v6', word: 'packed',                pos: 'adjective', translation: 'Lleno hasta el tope.',                                                   example: 'The bus was packed.',                          definition: 'very full of people' },
        { id: 'v7', word: 'to figure (sth) out',   pos: 'phrase',    translation: 'Darse cuenta de algo / resolver algo.',                                  example: 'I\'d figured out I could cycle.',              definition: 'to understand or solve something' },
        { id: 'v8', word: 'chill',                 pos: 'adjective', translation: 'Relajado, piola (informal).',                                            example: 'He was really chill about it.',                definition: 'relaxed, easy-going (informal)' },
      ],
      quiz: [
        {
          kind: 'mcq',
          id: 'vq1',
          prompt: 'A "hands-on" manager is one who…',
          options: [
            { id: 'a', text: 'is involved in the work day-to-day' },
            { id: 'b', text: 'is almost never in the office' },
            { id: 'c', text: 'only sends emails' },
          ],
          correct: 'a',
          explain: 'Hands-on = closely involved. Different from "micromanaging", which is negative.',
        },
        {
          kind: 'mcq',
          id: 'vq2',
          prompt: '"The train was packed" means it was…',
          options: [
            { id: 'a', text: 'almost empty' },
            { id: 'b', text: 'very full of people' },
            { id: 'c', text: 'broken' },
          ],
          correct: 'b',
          explain: 'Packed is a very common informal way to say "extremely full".',
        },
        {
          kind: 'mcq',
          id: 'vq3',
          prompt: '"I figured out a shortcut" means that…',
          options: [
            { id: 'a', text: 'someone told me the shortcut' },
            { id: 'b', text: 'I discovered the shortcut by thinking about it' },
            { id: 'c', text: 'I lost the shortcut' },
          ],
          correct: 'b',
          explain: '"Figure out" = work something out for yourself.',
        },
      ],
    },

    // ─── Step 3 · Prediction ─────────────────────────────────
    {
      kind:  'prediction',
      title: 'What will you hear?',
      intro: 'Priya just finished her first week at a new job and is meeting a friend for coffee. Make some guesses before pressing play.',
      questions: [
        {
          kind: 'mcq',
          id: 'p1',
          prompt: 'Overall, how do you think Priya will describe the week?',
          options: [
            { id: 'a', text: 'A terrible disaster — she wants to quit' },
            { id: 'b', text: 'Tiring but positive — she made the right choice' },
            { id: 'c', text: 'Completely boring' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'p2',
          prompt: 'Which of these do you think will come up in the story?',
          options: [
            { id: 'a', text: 'her manager' },
            { id: 'b', text: 'her grandmother' },
            { id: 'c', text: 'a political meeting' },
          ],
          correct: 'a',
        },
        {
          kind: 'mcq',
          id: 'p3',
          prompt: 'What kind of embarrassing moment is most likely in a first week?',
          options: [
            { id: 'a', text: 'getting lost in the building' },
            { id: 'b', text: 'calling someone by the wrong name or title' },
            { id: 'c', text: 'winning a prize' },
          ],
          correct: 'b',
        },
      ],
    },

    // ─── Step 4 · Gist ───────────────────────────────────────
    {
      kind:      'gist',
      title:     'Listen for the gist',
      intro:     'Press play and listen to the whole conversation ONCE. Don\'t pause. Catch the big picture — details come next.',
      listenFor: [
        'Priya\'s overall verdict on the new job',
        'Her relationship with her manager',
        'Whether she regrets leaving the old job',
      ],
      allowTranscript: false,
      questions: [
        {
          kind: 'mcq',
          id: 'g1',
          prompt: 'How does Priya describe her first week overall?',
          options: [
            { id: 'a', text: 'Awful — she regrets switching' },
            { id: 'b', text: 'Tiring but great — she made the right call' },
            { id: 'c', text: 'Completely boring and slow' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'g2',
          prompt: 'Her manager Zara is…',
          options: [
            { id: 'a', text: 'hands-on but not micromanaging' },
            { id: 'b', text: 'never in the office' },
            { id: 'c', text: 'strict and distant' },
          ],
          correct: 'a',
        },
        {
          kind:    'true-false',
          id:      'g3',
          prompt:  'Priya regrets leaving her old job.',
          correct: 'F',
          explain: 'She says "zero regrets" and even that she should have done it a year ago.',
        },
      ],
    },

    // ─── Step 5 · Detail ─────────────────────────────────────
    {
      kind:             'detail',
      title:            'Listen for detail',
      intro:            'Now listen again, and pause when you need to. You can open the transcript to help.',
      allowTranscript:  true,
      questions: [
        {
          kind:     'gap-fill',
          id:       'd1',
          sentence: 'The team is smaller than Priya expected — just ___ of them.',
          answers:  ['six'],
          alts:     [['6']],
        },
        {
          kind: 'mcq',
          id: 'd2',
          prompt: 'Who is Zara?',
          options: [
            { id: 'a', text: 'a colleague on the same level as Priya' },
            { id: 'b', text: 'Priya\'s manager' },
            { id: 'c', text: 'the CEO' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'd3',
          prompt: 'What did Priya worry about regarding the office?',
          options: [
            { id: 'a', text: 'the lighting' },
            { id: 'b', text: 'the noise in the open-plan space' },
            { id: 'c', text: 'the temperature' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'd4',
          prompt: 'How did the office solve that problem?',
          options: [
            { id: 'a', text: 'built private offices' },
            { id: 'b', text: 'gave everyone noise-cancelling headphones' },
            { id: 'c', text: 'turned down the music' },
          ],
          correct: 'b',
        },
        {
          kind:     'gap-fill',
          id:       'd5',
          sentence: 'By Tuesday Priya had figured out she could cycle to work in ___ minutes.',
          answers:  ['thirty'],
          alts:     [['30']],
        },
        {
          kind: 'mcq',
          id: 'd6',
          prompt: 'What happened on day two in the kitchen?',
          options: [
            { id: 'a', text: 'Priya spilled coffee on her laptop' },
            { id: 'b', text: 'Priya called the CEO by the wrong name' },
            { id: 'c', text: 'Priya forgot her lunch' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'd7',
          prompt: 'How did the CEO react?',
          options: [
            { id: 'a', text: 'He was angry' },
            { id: 'b', text: 'He was really chill about it' },
            { id: 'c', text: 'He asked her to leave' },
          ],
          correct: 'b',
        },
        {
          kind:    'true-false',
          id:      'd8',
          prompt:  'Priya says she should have switched jobs a year ago.',
          correct: 'T',
          explain: 'Direct quote: "I should have done it a year ago."',
        },
      ],
    },

    // ─── Step 6 · Language Awareness ─────────────────────────
    {
      kind:  'language-awareness',
      title: 'Notice these expressions',
      intro: 'Go back to the transcript and spot these five chunks. They\'re the reason Priya sounds natural, not textbook.',
      chunks: [
        {
          id:       'c1',
          chunk:    'to make the right call',
          category: 'idiom',
          gloss:    'tomar la decisión correcta',
          example:  '"I think I made the right call switching jobs."',
          notice:   '"Call" here = decision. Opposite: "the wrong call". Very common in work contexts, in past or present.',
        },
        {
          id:       'c2',
          chunk:    'a bit worried about (sth)',
          category: 'collocation',
          gloss:    'un poco preocupado/a por algo (hedging, suaviza la idea)',
          example:  '"Open-plan, which I was a bit worried about."',
          notice:   '"A bit" softens the worry — sounds more natural than "very worried" at B1. Also works with other adjectives: "a bit tired", "a bit late".',
        },
        {
          id:       'c3',
          chunk:    'turns out (that)…',
          category: 'discourse-marker',
          gloss:    'resulta que…',
          example:  '"Turns out he\'s the CEO."',
          notice:   'Introduces a surprising fact you discovered later. Present simple even when you\'re telling a past story. "That" is optional.',
        },
        {
          id:       'c4',
          chunk:    'to figure (sth) out',
          category: 'phrasal-verb',
          gloss:    'resolver algo / darse cuenta',
          example:  '"I\'d figured out I could cycle in thirty minutes."',
          notice:   'Separable: "figure it out" ✓ but NOT "figure out it". With a noun, both orders work: "figure out the answer" / "figure the answer out".',
        },
        {
          id:       'c5',
          chunk:    'I should have + past participle',
          category: 'grammar-pattern',
          gloss:    'arrepentimiento o reproche sobre el pasado',
          example:  '"I should have done it a year ago."',
          notice:   'Regret about something you DIDN\'T do (or did badly). "Should\'ve" sounds more natural in speech than "should have". Pronounced "SHOUL-dev".',
        },
      ],
    },

    // ─── Step 7 · Controlled Practice ────────────────────────
    {
      kind:  'controlled-practice',
      title: 'Guided practice',
      intro: 'Reuse the chunks in short tasks.',
      activities: [
        {
          kind:     'gap-fill',
          id:       'cp1',
          sentence: 'Quitting that toxic job was the ___ call I\'ve made all year.',
          answers:  ['right'],
          hint:     'Opposite of "wrong".',
        },
        {
          kind:     'gap-fill',
          id:       'cp2',
          sentence: 'I thought he was a tourist, but it ___ out he\'s the new teacher.',
          answers:  ['turns', 'turned'],
          hint:     'Discourse marker — present or past both work.',
        },
        {
          kind:     'gap-fill',
          id:       'cp3',
          sentence: 'I\'m a bit ___ about the presentation tomorrow — I haven\'t prepared enough.',
          answers:  ['worried', 'nervous'],
          hint:     'Soft hedging adjective.',
        },
        {
          kind: 'mcq',
          id: 'cp4',
          prompt: 'Which sentence sounds the most natural?',
          options: [
            { id: 'a', text: 'I figured out it quickly.' },
            { id: 'b', text: 'I figured it out quickly.' },
            { id: 'c', text: 'I out figured it quickly.' },
          ],
          correct: 'b',
          explain: 'With a pronoun ("it", "that"), the object goes BETWEEN "figure" and "out".',
        },
        {
          kind: 'mcq',
          id: 'cp5',
          prompt: 'You missed a friend\'s birthday and feel bad. The most natural sentence is:',
          options: [
            { id: 'a', text: 'I should go to her party.' },
            { id: 'b', text: 'I should have gone to her party.' },
            { id: 'c', text: 'I must go to her party.' },
          ],
          correct: 'b',
          explain: '"Should have + past participle" expresses regret about the past.',
        },
        {
          kind:     'gap-fill',
          id:       'cp6',
          sentence: 'The café was ___ — we couldn\'t find a table anywhere.',
          answers:  ['packed'],
          hint:     'Full of people.',
        },
      ],
    },

    // ─── Step 8 · Production ─────────────────────────────────
    {
      kind:         'production',
      title:        'Now you',
      intro:        'Your turn to tell a story like Priya. Record 60 seconds about your own "first week" experience — at a job, a school, a course, a gym, a new city. Try to use at least 3 of the chunks from this lesson.',
      mode:         'speaking',
      prompt:       'Tell a 60-second story about your first week at a new job, school, or activity. Include: how you felt at first, one specific detail (a person, a place, a moment), one embarrassing or unexpected thing, and your overall verdict. Use at least 3 of: "I made the right call", "I was a bit worried about", "turns out", "I figured out", "I should have…".',
      targetChunks: ['c1', 'c2', 'c3', 'c4', 'c5'],
      minSeconds:   60,
    },
  ],
};
