// Friendlistenings® — B1 · Running into an old classmate
//
// An A2 → B1 bridge lesson. Students sitting at solid A2 already own
// present simple, past simple with regular verbs, "going to" for plans
// and the common everyday chunks. What trips them up on the climb to
// B1 is:
//   · past continuous as a FRAME for an action in the past
//     ("I was working at the bank when they offered me the startup")
//   · present perfect for recent life changes
//     ("I've started something on the side")
//   · informal intensifiers before comparatives
//     ("way better", "a bit more", "a lot longer")
//   · opinion/hedging discourse markers A2 syllabi don't surface
//     ("to be honest", "actually", "sort of", "I guess")
//   · phrasal verbs for everyday reunions and plans
//     ("catch up", "pick up", "grab a coffee")
//
// A ~2:10 bumping-into-an-old-classmate scene at a corner bakery —
// casual, high-frequency, zero business jargon — gives each of those
// features a natural slot without crossing into B1-core territory
// (relative clauses, third conditional, reported speech) that would
// overwhelm the A2 ear.
//
// 8-step arc, ~40 minute slot (sits between a2-the-new-neighbor's 35
// and b1-surprise-party's 45):
//   1. Lead-in     · 3 min  — catching up + life changes schema
//   2. Vocab       · 6 min  — 8 bridge chunks + 3 checks
//   3. Prediction  · 3 min  — guess the arc from the title
//   4. Gist        · 5 min  — relationship + overall outcome
//   5. Detail      · 9 min  — specifics (jobs, places, side projects)
//   6. Awareness   · 6 min  — 5 B1 chunks spotlighting the A2→B1 pivot
//   7. Controlled  · 5 min  — reuse the chunks
//   8. Production  · 3 min  — 50-word writing: catch someone up

import type { FLLesson } from '@/types/friendlistenings';

export const lessonB1BakeryCatchUp: FLLesson = {
  id:           'b1-bakery-catch-up',
  title:        'Running into an old classmate',
  subtitle:     'A bakery catch-up that bridges A2 → B1',
  level:        'B1',
  topic:        'Catching up · life changes · informal plans',
  scenario:     'Leo and Nora, two old classmates, bump into each other at a corner bakery and catch up on jobs, moves and a possible mini reunion.',
  estimatedMin: 40,
  tags:         ['a2-to-b1-bridge', 'past-continuous', 'present-perfect', 'intensifiers', 'discourse-markers', 'phrasal-verbs'],
  createdAt:    '2026-11-19',

  cover: {
    accent: '#E6A86C',
    emoji:  '🥐',
  },

  audio: {
    durationSec: 130,
    speakers: [
      {
        id: 'leo', displayName: 'Leo', accent: 'US', gender: 'm',
        suggestedVoice: { voiceId: 'ErXwobaYiN019PkySvjV', name: 'Antoni', note: 'ElevenLabs · warm US male, mid-20s — clear, friendly, comfortable at a bridge pace' },
      },
      {
        id: 'nora', displayName: 'Nora', accent: 'US', gender: 'f',
        suggestedVoice: { voiceId: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica', note: 'ElevenLabs · bright US female, mid-20s — natural catch-up energy, fresh voice not used in other FL lessons' },
      },
    ],
    script: [
      { speakerId: 'leo',  approxStartSec:   0, text: 'Oh wow — Nora? Is that you?' },
      { speakerId: 'nora', approxStartSec:   3, text: 'Leo! No way! I was actually just thinking about you last week. How are you?' },
      { speakerId: 'leo',  approxStartSec:  11, text: 'Good! Really good. I was grabbing a coffee before work. What are you doing here?' },
      { speakerId: 'nora', approxStartSec:  19, text: 'Just picking up bread for my mum. She lives around the corner now — she moved in June.' },
      { speakerId: 'leo',  approxStartSec:  28, text: 'Oh, nice. So you\'re back in the neighborhood?' },
      { speakerId: 'nora', approxStartSec:  33, text: 'Sort of. I\'m living in Valparaíso now, but I come up every couple of weeks. What about you? Are you still at that bank?' },
      { speakerId: 'leo',  approxStartSec:  45, text: 'No, I quit in March. I was working there when they offered me a role at a startup — a health app. I took it.' },
      { speakerId: 'nora', approxStartSec:  57, text: 'A health app! That\'s such a jump. Do you like it?' },
      { speakerId: 'leo',  approxStartSec:  63, text: 'Honestly, way more than the bank. The hours are a bit longer, but the people are great. And I\'m learning a lot.' },
      { speakerId: 'nora', approxStartSec:  74, text: 'That\'s amazing. Last time I saw you — was it Carla\'s wedding? — you were saying you wanted a change.' },
      { speakerId: 'leo',  approxStartSec:  84, text: 'Exactly. I finally did it. What about you? Still teaching?' },
      { speakerId: 'nora', approxStartSec:  91, text: 'Yeah, but I\'ve started something on the side. I\'m doing online yoga classes on weekends. Nothing serious — just ten or fifteen people.' },
      { speakerId: 'leo',  approxStartSec: 102, text: 'No way. I didn\'t know you were into yoga.' },
      { speakerId: 'nora', approxStartSec: 107, text: 'I started during the pandemic, and now I actually can\'t stop. It\'s the best part of my week, to be honest.' },
      { speakerId: 'leo',  approxStartSec: 116, text: 'That\'s so cool. Hey, we should grab a proper coffee sometime. I was thinking of a mini reunion next month — just a few of us. Would you come?' },
      { speakerId: 'nora', approxStartSec: 128, text: 'I\'d love to. Send me the date. My number is the same.' },
      { speakerId: 'leo',  approxStartSec: 134, text: 'Perfect. I\'ll text you this week.' },
      { speakerId: 'nora', approxStartSec: 138, text: 'Great. I need to run — my mum is waiting for the bread. But seriously, so good to see you!' },
      { speakerId: 'leo',  approxStartSec: 146, text: 'You too. See you soon.' },
    ],
  },

  steps: [
    // ─── Step 1 · Lead-in ─────────────────────────────────────
    {
      kind:      'lead-in',
      title:     'Before we start',
      intro:     'Think about the last time you unexpectedly ran into someone you hadn\'t seen in a while. What did you talk about? Today you\'ll hear Leo and Nora — old classmates — bump into each other at a bakery and catch up in about two minutes.',
      hookEmoji: '🥐',
      openQuestions: [
        { id: 'li1', prompt: 'When did you last run into an old classmate or coworker by accident? How did it go?' },
        { id: 'li2', prompt: 'When you catch up with someone you haven\'t seen in a year, what do you usually ask about first — their job, their family, or where they live now?' },
        { id: 'li3', prompt: 'Have you changed jobs or cities in the last two years? What was the biggest reason for the change?', hint: 'Think about one concrete thing: a project, a move, a person, a decision.' },
      ],
    },

    // ─── Step 2 · Vocab ───────────────────────────────────────
    {
      kind:  'vocab',
      title: 'Key vocabulary',
      intro: 'Eight bridge chunks that A2 students rarely own but B1 speakers use constantly. You\'ll hear each one in the conversation.',
      items: [
        { id: 'v1', word: 'to catch up (with someone)', pos: 'phrase',    translation: 'Ponerse al día con alguien que no veías hace tiempo.',           example: 'We should catch up soon — it\'s been months.',                     soundsLike: 'CATCH up',       definition: 'to meet and share news with someone you haven\'t seen for a while' },
        { id: 'v2', word: 'to quit (a job)',            pos: 'verb',      translation: 'Renunciar a un trabajo.',                                        example: 'I quit the bank in March.',                                        definition: 'to leave a job because you decide to, not because you are fired' },
        { id: 'v3', word: 'a startup',                  pos: 'noun',      translation: 'Una empresa nueva, normalmente pequeña y de tecnología.',        example: 'They offered me a role at a startup.',                             soundsLike: 'START-up',      definition: 'a new, small company — often in tech — that is still growing' },
        { id: 'v4', word: 'to pick up (something)',     pos: 'phrase',    translation: 'Pasar a buscar algo.',                                           example: 'I\'m just picking up bread for my mum.',                            definition: 'to collect something quickly from a place' },
        { id: 'v5', word: 'on the side',                pos: 'phrase',    translation: 'En paralelo, además de tu trabajo principal.',                   example: 'I\'ve started something on the side — online yoga classes.',       definition: 'in addition to your main job or activity' },
        { id: 'v6', word: 'to be into (something)',     pos: 'phrase',    translation: 'Gustarte mucho algo / estar enganchado con algo.',               example: 'I didn\'t know you were into yoga.',                               definition: 'to be interested in and enjoy a hobby or topic' },
        { id: 'v7', word: 'way (+ comparative)',        pos: 'adverb',    translation: 'Mucho + comparativo (intensificador informal).',                 example: 'Way more than the bank. / Way better. / Way longer.',              definition: 'a lot — used before more / better / bigger / longer, etc.' },
        { id: 'v8', word: 'to be thinking of (+ -ing)', pos: 'phrase',    translation: 'Estar considerando hacer algo (plan tentativo).',                 example: 'I was thinking of a mini reunion next month.',                     definition: 'to be considering doing something — not a firm decision yet' },
      ],
      quiz: [
        {
          kind: 'mcq',
          id: 'vq1',
          prompt: '"We should catch up soon" means we should…',
          options: [
            { id: 'a', text: 'run after someone in the street' },
            { id: 'b', text: 'meet and share news' },
            { id: 'c', text: 'finish our work on time' },
          ],
          correct: 'b',
          explain: '"Catch up" with a person = meet and share news.',
        },
        {
          kind: 'mcq',
          id: 'vq2',
          prompt: 'If you say "I\'ve started something on the side," you mean…',
          options: [
            { id: 'a', text: 'you changed to a completely new career' },
            { id: 'b', text: 'you do it in parallel to your main job' },
            { id: 'c', text: 'you do it only on weekends in secret' },
          ],
          correct: 'b',
          explain: '"On the side" = in parallel to your main thing.',
        },
        {
          kind: 'mcq',
          id: 'vq3',
          prompt: '"The hours are way longer" means the hours are…',
          options: [
            { id: 'a', text: 'a little longer' },
            { id: 'b', text: 'the same' },
            { id: 'c', text: 'a lot longer' },
          ],
          correct: 'c',
          explain: '"Way + comparative" is an informal intensifier = a lot more.',
        },
      ],
    },

    // ─── Step 3 · Prediction ─────────────────────────────────
    {
      kind:  'prediction',
      title: 'What will you hear?',
      intro: 'You know the title — Leo and Nora are old classmates meeting by chance at a bakery. Before you press play, make a guess about where the conversation goes.',
      questions: [
        {
          kind: 'mcq',
          id: 'p1',
          prompt: 'What are they most likely to talk about?',
          options: [
            { id: 'a', text: 'news since the last time they saw each other' },
            { id: 'b', text: 'the price of bread' },
            { id: 'c', text: 'politics and the news' },
          ],
          correct: 'a',
        },
        {
          kind: 'mcq',
          id: 'p2',
          prompt: 'Which pair of topics is most natural in a catch-up like this?',
          options: [
            { id: 'a', text: 'school homework and exams' },
            { id: 'b', text: 'jobs and where they live now' },
            { id: 'c', text: 'who they voted for and religion' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'p3',
          prompt: 'How will the conversation most likely end?',
          options: [
            { id: 'a', text: 'with a plan to meet again' },
            { id: 'b', text: 'with an argument' },
            { id: 'c', text: 'with a formal goodbye and no plan' },
          ],
          correct: 'a',
        },
      ],
    },

    // ─── Step 4 · Gist ───────────────────────────────────────
    {
      kind:      'gist',
      title:     'Listen for the gist',
      intro:     'Press play and listen ONCE. Don\'t worry about details — just get the big picture.',
      listenFor: [
        'What is the relationship between Leo and Nora?',
        'What has changed in their lives since they last met?',
        'Will they see each other again?',
      ],
      allowTranscript: false,
      questions: [
        {
          kind: 'mcq',
          id: 'g1',
          prompt: 'How do Leo and Nora know each other?',
          options: [
            { id: 'a', text: 'they are family' },
            { id: 'b', text: 'they were classmates in the past' },
            { id: 'c', text: 'they are coworkers at the startup' },
          ],
          correct: 'b',
          explain: 'They haven\'t seen each other in a while, Leo mentions "that bank" she used to know about, and they talk about "a mini reunion" with "a few of us" — consistent with old classmates.',
        },
        {
          kind: 'mcq',
          id: 'g2',
          prompt: 'What is the overall mood of the conversation?',
          options: [
            { id: 'a', text: 'warm and surprised' },
            { id: 'b', text: 'tense and uncomfortable' },
            { id: 'c', text: 'cold and professional' },
          ],
          correct: 'a',
        },
        {
          kind:    'true-false',
          id:      'g3',
          prompt:  'Both Leo and Nora have had a change in their life since they last met.',
          correct: 'T',
          explain: 'Leo quit the bank and moved to a startup; Nora moved to Valparaíso and started weekend yoga classes.',
        },
        {
          kind:    'true-false',
          id:      'g4',
          prompt:  'They make a concrete plan to see each other again.',
          correct: 'T',
          explain: 'Leo invites her to a mini reunion next month and promises to text her the date.',
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
          sentence: 'Nora is picking up bread for her mum, who moved to this neighborhood in ___.',
          answers:  ['June'],
          alts:     [['june']],
        },
        {
          kind: 'mcq',
          id: 'd2',
          prompt: 'Where is Nora living now?',
          options: [
            { id: 'a', text: 'in the same neighborhood as her mum' },
            { id: 'b', text: 'in Valparaíso' },
            { id: 'c', text: 'at the bakery' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'd3',
          prompt: 'When did Leo leave the bank?',
          options: [
            { id: 'a', text: 'last year' },
            { id: 'b', text: 'in March' },
            { id: 'c', text: 'during the pandemic' },
          ],
          correct: 'b',
        },
        {
          kind:     'gap-fill',
          id:       'd4',
          sentence: 'Leo\'s new company is a startup that makes a ___ app.',
          answers:  ['health'],
          alts:     [['health']],
        },
        {
          kind: 'mcq',
          id: 'd5',
          prompt: 'According to Leo, how do the hours at the startup compare to the bank?',
          options: [
            { id: 'a', text: 'they are a bit longer' },
            { id: 'b', text: 'they are way shorter' },
            { id: 'c', text: 'they are exactly the same' },
          ],
          correct: 'a',
          explain: 'He says "the hours are a bit longer".',
        },
        {
          kind:    'true-false',
          id:      'd6',
          prompt:  'Nora is no longer a teacher — yoga is her new main job.',
          correct: 'F',
          explain: 'Yoga is "on the side" — teaching is still her main job.',
        },
        {
          kind:     'gap-fill',
          id:       'd7',
          sentence: 'Nora started doing yoga during the ___.',
          answers:  ['pandemic'],
          alts:     [['pandemic']],
        },
        {
          kind: 'mcq',
          id: 'd8',
          prompt: 'What does Leo invite Nora to?',
          options: [
            { id: 'a', text: 'his wedding' },
            { id: 'b', text: 'a yoga class' },
            { id: 'c', text: 'a mini classmate reunion next month' },
          ],
          correct: 'c',
        },
      ],
    },

    // ─── Step 6 · Language Awareness ─────────────────────────
    {
      kind:  'language-awareness',
      title: 'Notice these expressions',
      intro: 'These five patterns are the real A2 → B1 jump. Spot each one in the transcript before you start using them yourself.',
      chunks: [
        {
          id:       'c1',
          chunk:    'I was ___ing when ___',
          category: 'collocation',
          gloss:    'past continuous + past simple — un marco de tiempo más una acción',
          example:  '"I was working there when they offered me a role at a startup."',
          notice:   'The past continuous ("was working") paints the longer background; the past simple ("offered") is the shorter action that interrupts it. A2 students usually tell both parts with past simple — this frame is what makes your English sound B1.',
        },
        {
          id:       'c2',
          chunk:    "I've started… / She's moved…",
          category: 'collocation',
          gloss:    'present perfect para cambios recientes de vida',
          example:  '"I\'ve started something on the side." / "She moved in June."',
          notice:   'Use the present perfect ("I\'ve started", "I\'ve moved") when the change is recent and still relevant now. If you give a finished past time (like "in June", "in 2019"), switch to past simple.',
        },
        {
          id:       'c3',
          chunk:    'way + comparative',
          category: 'collocation',
          gloss:    'intensificador informal: way more / way better / way longer',
          example:  '"Way more than the bank." / "Way longer hours." / "Way better coffee."',
          notice:   '"Way" before a comparative = "a lot". It\'s informal and very common in spoken English. You can scale it down with "a bit" ("a bit longer") or "a lot" ("a lot better").',
        },
        {
          id:       'c4',
          chunk:    'to be honest / actually / sort of',
          category: 'discourse-marker',
          gloss:    'marcadores que suavizan o matizan lo que decís',
          example:  '"To be honest, it\'s the best part of my week." / "Sort of." / "I was actually just thinking about you."',
          notice:   'B1 speakers use these little words to sound natural and not blunt. "To be honest" introduces a real opinion; "actually" corrects or surprises; "sort of" softens a yes/no answer.',
        },
        {
          id:       'c5',
          chunk:    'I was thinking of + -ing',
          category: 'collocation',
          gloss:    'plan tentativo, no cerrado — "estaba pensando en…"',
          example:  '"I was thinking of a mini reunion next month."',
          notice:   'Softer than "I\'m going to" (= decided) or "I\'ll" (= deciding now). Great for pitching an idea without committing yet. Compare: "I was thinking of inviting a few people" vs. "I\'m going to invite a few people".',
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
          sentence: 'I ___ ___ at the café when my manager offered me the new role. (past continuous of "work")',
          answers:  ['was', 'working'],
          hint:     '"was/were" + -ing.',
        },
        {
          kind: 'mcq',
          id: 'cp2',
          prompt: 'Which sentence uses the present perfect correctly for a recent life change?',
          options: [
            { id: 'a', text: 'I started my own business last year.' },
            { id: 'b', text: 'I\'ve started my own business, and it\'s going well.' },
            { id: 'c', text: 'I am starting my own business in 2015.' },
          ],
          correct: 'b',
          explain: 'Option b uses present perfect ("I\'ve started") for a recent change still relevant now. Option a is correct past simple but with a finished time marker, so no "recent change" frame.',
        },
        {
          kind:     'gap-fill',
          id:       'cp3',
          sentence: 'The new flat is ___ better than the old one — more light and no noise.',
          answers:  ['way'],
          hint:     'Informal intensifier before a comparative.',
        },
        {
          kind: 'mcq',
          id: 'cp4',
          prompt: 'Which word fits best? "I\'m really tired. ___, I think I\'ll go home early."',
          options: [
            { id: 'a', text: 'Also' },
            { id: 'b', text: 'To be honest' },
            { id: 'c', text: 'Although' },
          ],
          correct: 'b',
          explain: '"To be honest" introduces a real opinion or feeling. It makes the sentence sound natural and personal.',
        },
        {
          kind:     'gap-fill',
          id:       'cp5',
          sentence: 'A: "Do you have plans this weekend?" — B: "Yeah, I was ___ of going to the coast."',
          answers:  ['thinking'],
          hint:     '"was thinking of + -ing" = tentative plan.',
        },
      ],
    },

    // ─── Step 8 · Production ─────────────────────────────────
    {
      kind:         'production',
      title:        'Now you',
      intro:        'Imagine you run into an old classmate you haven\'t seen in two years. Write what you\'d tell them about your life — one job/study change, one recent life change, and one plan you\'re considering.',
      mode:         'writing',
      prompt:       'Write 4–6 sentences catching your old classmate up. Use at least 3 of the chunks from this lesson: "I was ___ing when ___", present perfect for a recent change, "way + comparative", a discourse marker ("to be honest" / "actually" / "sort of"), or "I was thinking of + -ing".',
      targetChunks: ['c1', 'c2', 'c3', 'c4', 'c5'],
      minWords:     50,
    },
  ],
};
