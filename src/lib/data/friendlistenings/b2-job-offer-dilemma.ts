// Friendlistenings® — B2 · The job offer dilemma
//
// A ~2:45 phone-call conversation. Elena just got a dream job offer in
// Berlin and calls her older, trusted friend Nico for advice. The decision
// isn't just professional — it affects her partner Pablo, her mother, and
// the flat she just bought in Mexico City.
//
// Rich B2 grammar surface: second conditional for hypothetical reasoning
// ("if I took it… / if I turned it down…"), modal perfects for regret
// ("I should have asked"), hedging ("the thing is…"), nominalization
// ("the Berlin thing", "the hard part"), and advice-shaped questions
// ("Have you actually had the conversation?").
//
// 8-step arc, ~45 minute slot:
//   1. Lead-in     · 4 min — advice-giving schema
//   2. Vocab       · 6 min — 8 B2 chunks + 3 checks
//   3. Prediction  · 3 min — what will Nico advise?
//   4. Gist        · 6 min — the core tension + Nico's verdict
//   5. Detail      · 10 min — specifics (money, timeline, people affected)
//   6. Awareness   · 6 min — 5 B2 chunks for hypothetical reasoning
//   7. Controlled  · 5 min — reuse the chunks
//   8. Production  · 5 min — 60-sec speaking: your own dilemma

import type { FLLesson } from '@/types/friendlistenings';

export const lessonB2JobOfferDilemma: FLLesson = {
  id:           'b2-job-offer-dilemma',
  title:        'The job offer',
  subtitle:     'A late-night call for advice',
  level:        'B2',
  topic:        'Hypothetical reasoning · life decisions · asking for advice',
  scenario:     'Elena just got offered a dream job in Berlin and calls her friend Nico to think through whether to take it.',
  estimatedMin: 45,
  tags:         ['second-conditional', 'modal-perfect', 'discourse-markers', 'advice'],
  createdAt:    '2026-11-12',

  cover: {
    accent: '#5A6DD6',
    emoji:  '📞',
  },

  audio: {
    durationSec: 165,
    speakers: [
      {
        id: 'nico', displayName: 'Nico', accent: 'US', gender: 'm',
        suggestedVoice: { voiceId: 'cjVigY5qzO86Huf0OWal', name: 'Eric', note: 'ElevenLabs · mature US male — steady, thoughtful advisor tone' },
      },
      {
        id: 'elena', displayName: 'Elena', accent: 'US', gender: 'f',
        suggestedVoice: { voiceId: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', note: 'ElevenLabs · calm, reflective US female — late-20s professional' },
      },
    ],
    script: [
      { speakerId: 'nico',  approxStartSec:   0, text: 'Hey. What\'s up? You sounded off in your message.' },
      { speakerId: 'elena', approxStartSec:   5, text: 'I don\'t even know where to start. So — remember I mentioned the Berlin thing?' },
      { speakerId: 'nico',  approxStartSec:  12, text: 'The job you interviewed for. Did it come through?' },
      { speakerId: 'elena', approxStartSec:  17, text: 'Yeah. They made me the offer last night. It\'s… it\'s everything I said I wanted. Better title, nearly double what I\'m making now, and a product team I\'d kill to work with.' },
      { speakerId: 'nico',  approxStartSec:  31, text: 'That\'s incredible. So what\'s the problem?' },
      { speakerId: 'elena', approxStartSec:  35, text: 'The problem is Pablo. And the flat. And my mom. And honestly, me. I\'ve built this whole life here, and now I\'m supposed to just pack it up?' },
      { speakerId: 'nico',  approxStartSec:  48, text: 'Okay. Walk me through it. If you took it, what does month one look like?' },
      { speakerId: 'elena', approxStartSec:  55, text: 'I\'d have to move by February. Pablo can\'t come right away — his restaurant is doing well, he\'d want to wait at least six months. My mom would be alone for the first time since dad died. And we\'d have to sublet the flat, which is doable but stressful.' },
      { speakerId: 'nico',  approxStartSec:  78, text: 'And if you turned it down?' },
      { speakerId: 'elena', approxStartSec:  82, text: 'Then I stay. Same job. Same life. Which isn\'t bad. But I know myself — I\'d be angry with myself in a year. I\'d always wonder.' },
      { speakerId: 'nico',  approxStartSec:  95, text: 'Elena, you\'ve just told me what your gut thinks. You just don\'t want to say it out loud.' },
      { speakerId: 'elena', approxStartSec: 104, text: 'The thing is, it\'s not JUST my decision. If I take it, Pablo\'s life changes too.' },
      { speakerId: 'nico',  approxStartSec: 113, text: 'Sure. But he\'s a grown man with his own agency. Have you actually had the conversation with him, or are you deciding for him in your head?' },
      { speakerId: 'elena', approxStartSec: 127, text: '…I haven\'t properly asked him. I\'ve been avoiding it.' },
      { speakerId: 'nico',  approxStartSec: 135, text: 'There\'s your first step. Talk to him tonight. Then come back to me.' },
    ],
  },

  steps: [
    // ─── Step 1 · Lead-in ─────────────────────────────────────
    {
      kind:      'lead-in',
      title:     'Before we start',
      intro:     'A big life decision is rarely about just you. Today you\'ll hear Elena call her friend Nico because she\'s been offered her dream job in Berlin — and the decision isn\'t simple.',
      hookEmoji: '📞',
      openQuestions: [
        { id: 'li1', prompt: 'Who do you call when you have a BIG decision to make? Why that person?' },
        { id: 'li2', prompt: 'Have you ever had to choose between a career opportunity and your personal life? What did you decide?' },
        { id: 'li3', prompt: 'When someone asks you for advice, do you tell them what to do, or do you ask questions until they figure it out themselves?', hint: 'Notice what Nico does here — he mostly asks questions.' },
      ],
    },

    // ─── Step 2 · Vocab ───────────────────────────────────────
    {
      kind:  'vocab',
      title: 'Key vocabulary',
      intro: 'These 8 chunks drive the conversation. They\'re the kind of language B2 speakers need for real adult conversations — work, big decisions, honest talk.',
      items: [
        { id: 'v1', word: 'to sound off',           pos: 'phrase',    translation: 'Sonar raro / mal (en un mensaje o llamada).',                       example: 'You sounded off in your message.',                            definition: 'to seem different / not right' },
        { id: 'v2', word: 'to come through',        pos: 'phrasal-verb', translation: 'Concretarse (una oferta, un trabajo, una promesa).',              example: 'Did the offer come through?',                                  definition: 'to happen or be delivered as expected' },
        { id: 'v3', word: 'I\'d kill to + verb',     pos: 'phrase',    translation: 'Mataría por (hacer algo). Hiperbólico, informal, positivo.',         example: 'A product team I\'d kill to work with.',                       definition: 'I really want to — dramatic emphasis' },
        { id: 'v4', word: 'to pack (sth) up',       pos: 'phrasal-verb', translation: 'Empacar / recoger — literal o figurado (desarmar una vida).',    example: 'I\'m supposed to just pack it up?',                             definition: 'to gather and put away' },
        { id: 'v5', word: 'to walk (sb) through',   pos: 'phrasal-verb', translation: 'Explicar paso a paso.',                                            example: 'Walk me through it.',                                          definition: 'to explain in detail, step by step' },
        { id: 'v6', word: 'doable but stressful',    pos: 'phrase',   translation: 'Hacible pero estresante. Combinación muy natural.',                 example: '…which is doable but stressful.',                              definition: 'possible to do, but difficult emotionally' },
        { id: 'v7', word: 'to turn (sth) down',     pos: 'phrasal-verb', translation: 'Rechazar — una oferta, una invitación.',                          example: 'And if you turned it down?',                                   definition: 'to refuse / say no to' },
        { id: 'v8', word: 'your gut',                pos: 'noun',     translation: 'La intuición. "My gut says…" = "me dice la intuición…".',           example: 'You\'ve just told me what your gut thinks.',                   soundsLike: 'GUHT',           definition: 'instinct / intuition' },
      ],
      quiz: [
        {
          kind: 'mcq',
          id: 'vq1',
          prompt: 'Your friend\'s text "You sounded off in your message" means they noticed…',
          options: [
            { id: 'a', text: 'your voice was literally muted' },
            { id: 'b', text: 'something seemed wrong / not like you' },
            { id: 'c', text: 'you were singing' },
          ],
          correct: 'b',
          explain: '"Off" here means "not right", "unusual". The friend picked up on an emotional signal.',
        },
        {
          kind: 'mcq',
          id: 'vq2',
          prompt: '"I\'d kill to work with that team" means…',
          options: [
            { id: 'a', text: 'I literally want to harm someone' },
            { id: 'b', text: 'I would rather die than work with them' },
            { id: 'c', text: 'I really, really want to work with them' },
          ],
          correct: 'c',
          explain: 'Hyperbolic emphasis — it means strong positive desire. The opposite is "I wouldn\'t touch it with a ten-foot pole".',
        },
        {
          kind: 'mcq',
          id: 'vq3',
          prompt: 'Which phrase is the SOFTEST way to decline a job offer?',
          options: [
            { id: 'a', text: 'I\'m going to turn it down.' },
            { id: 'b', text: 'I reject the offer.' },
            { id: 'c', text: 'No.' },
          ],
          correct: 'a',
          explain: '"Turn (something) down" is natural + neutral; "reject" sounds legal; a bare "no" is blunt.',
        },
      ],
    },

    // ─── Step 3 · Prediction ─────────────────────────────────
    {
      kind:  'prediction',
      title: 'What will you hear?',
      intro: 'Elena got offered her dream job in another country. She\'s calling her friend for advice.',
      questions: [
        {
          kind: 'mcq',
          id: 'p1',
          prompt: 'What will Nico probably do during the call?',
          options: [
            { id: 'a', text: 'Tell her exactly what to do' },
            { id: 'b', text: 'Ask her questions so she figures it out herself' },
            { id: 'c', text: 'Refuse to talk about it' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'p2',
          prompt: 'What will probably be the hardest part of the decision?',
          options: [
            { id: 'a', text: 'The money' },
            { id: 'b', text: 'The job responsibilities' },
            { id: 'c', text: 'The people in her life' },
          ],
          correct: 'c',
        },
        {
          kind: 'mcq',
          id: 'p3',
          prompt: 'By the end of the call, Elena will probably…',
          options: [
            { id: 'a', text: 'realize she needs to talk to someone else first' },
            { id: 'b', text: 'have made the final decision' },
            { id: 'c', text: 'feel more confused than before' },
          ],
          correct: 'a',
        },
      ],
    },

    // ─── Step 4 · Gist ───────────────────────────────────────
    {
      kind:      'gist',
      title:     'Listen for the gist',
      intro:     'Listen to the whole call ONCE. Catch the big picture — numbers come next.',
      listenFor: [
        'What Elena really wants deep down',
        'Nico\'s overall approach — does he tell her what to do?',
        'What Nico suggests she does NEXT, before deciding',
      ],
      allowTranscript: false,
      questions: [
        {
          kind: 'mcq',
          id: 'g1',
          prompt: 'What is Elena\'s gut telling her, according to Nico?',
          options: [
            { id: 'a', text: 'That she should stay' },
            { id: 'b', text: 'That she wants to take the job but doesn\'t want to admit it' },
            { id: 'c', text: 'That she should ask for more money' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'g2',
          prompt: 'What does Nico suggest Elena do FIRST?',
          options: [
            { id: 'a', text: 'Accept the job today' },
            { id: 'b', text: 'Ask her mother\'s permission' },
            { id: 'c', text: 'Talk properly to her partner Pablo' },
          ],
          correct: 'c',
        },
        {
          kind:    'true-false',
          id:      'g3',
          prompt:  'Elena\'s main hesitation is the salary.',
          correct: 'F',
          explain: 'The salary is almost double her current one — the hesitation is about people (Pablo, her mother) and her life in Mexico City.',
        },
      ],
    },

    // ─── Step 5 · Detail ─────────────────────────────────────
    {
      kind:             'detail',
      title:            'Listen for detail',
      intro:            'Now listen again, pausing as needed. Transcript is available.',
      allowTranscript:  true,
      questions: [
        {
          kind: 'mcq',
          id: 'd1',
          prompt: 'The Berlin salary is…',
          options: [
            { id: 'a', text: 'nearly double her current one' },
            { id: 'b', text: 'about the same as her current one' },
            { id: 'c', text: 'three times her current one' },
          ],
          correct: 'a',
        },
        {
          kind:     'gap-fill',
          id:       'd2',
          sentence: 'If she took the job, she\'d have to move by ___.',
          answers:  ['February'],
          alts:     [['february', 'Feb', 'feb']],
        },
        {
          kind: 'mcq',
          id: 'd3',
          prompt: 'Why can\'t Pablo move to Berlin right away?',
          options: [
            { id: 'a', text: 'He\'s afraid of flying.' },
            { id: 'b', text: 'His restaurant is doing well and he\'d want to wait.' },
            { id: 'c', text: 'He doesn\'t like Berlin.' },
          ],
          correct: 'b',
        },
        {
          kind:     'gap-fill',
          id:       'd4',
          sentence: 'Pablo would want to wait at least ___ months before joining her.',
          answers:  ['six'],
          alts:     [['6']],
        },
        {
          kind: 'mcq',
          id: 'd5',
          prompt: 'What makes Elena worried about her mother?',
          options: [
            { id: 'a', text: 'Her mother is sick.' },
            { id: 'b', text: 'Her mother doesn\'t speak English.' },
            { id: 'c', text: 'It would be her first time alone since her dad died.' },
          ],
          correct: 'c',
        },
        {
          kind: 'mcq',
          id: 'd6',
          prompt: 'What would Elena have to do with her flat if she took the job?',
          options: [
            { id: 'a', text: 'Sublet it' },
            { id: 'b', text: 'Sell it immediately' },
            { id: 'c', text: 'Leave it empty' },
          ],
          correct: 'a',
        },
        {
          kind:    'true-false',
          id:      'd7',
          prompt:  'Elena has already had a proper conversation with Pablo about the move.',
          correct: 'F',
          explain: 'She admits she\'s been avoiding the conversation: "I haven\'t properly asked him."',
        },
      ],
    },

    // ─── Step 6 · Language Awareness ─────────────────────────
    {
      kind:  'language-awareness',
      title: 'Notice these expressions',
      intro: 'Five B2 chunks that do the heavy lifting in a conversation like this one.',
      chunks: [
        {
          id:       'c1',
          chunk:    'If + past simple, (subject) would + verb',
          category: 'grammar-pattern',
          gloss:    'Segundo condicional — hipotético',
          example:  '"If you took it, what does month one look like?" / "I\'d have to move by February."',
          notice:   'Second conditional reasons about an imaginary / hypothetical present or future. Note the mixed form here — Nico asks with a present-tense consequence ("what does month one look like?") to keep it vivid.',
        },
        {
          id:       'c2',
          chunk:    'Walk me through it',
          category: 'collocation',
          gloss:    'Explicame paso a paso (un proceso o una situación)',
          example:  '"Walk me through it. If you took it, what does month one look like?"',
          notice:   'Invites the person to lay out the specifics, not jump to conclusions. Perfect move when someone is feeling overwhelmed.',
        },
        {
          id:       'c3',
          chunk:    'The thing is, …',
          category: 'discourse-marker',
          gloss:    'Lo que pasa es que… — introducir una complicación',
          example:  '"The thing is, it\'s not JUST my decision."',
          notice:   'Signals that something important or complicated is coming next. More natural than "but" because it frames the next sentence as an insight, not a contradiction.',
        },
        {
          id:       'c4',
          chunk:    'Have you actually + past participle?',
          category: 'register',
          gloss:    'Pregunta que confronta suavemente',
          example:  '"Have you actually had the conversation with him?"',
          notice:   '"Actually" here does the work. It signals "I suspect the answer is no". A kind but direct move when a friend is avoiding something.',
        },
        {
          id:       'c5',
          chunk:    'Your gut thinks / says',
          category: 'idiom',
          gloss:    'Tu intuición piensa/dice',
          example:  '"You\'ve just told me what your gut thinks."',
          notice:   '"Gut" = intuition. Also works as "my gut says yes/no", "trust your gut", "go with your gut". Very common when discussing big decisions.',
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
          kind: 'mcq',
          id: 'cp1',
          prompt: 'Which sentence is a correct second conditional?',
          options: [
            { id: 'a', text: 'If I will have more time, I would travel more.' },
            { id: 'b', text: 'If I had more time, I would travel more.' },
            { id: 'c', text: 'If I had more time, I will travel more.' },
          ],
          correct: 'b',
          explain: 'If + PAST SIMPLE, would + verb. The past simple is just a form marker — it doesn\'t mean actual past time.',
        },
        {
          kind:     'gap-fill',
          id:       'cp2',
          sentence: 'I don\'t really understand the problem — can you ___ me ___ it?',
          answers:  ['walk', 'through'],
          hint:     'Ask someone to explain step by step.',
        },
        {
          kind:     'gap-fill',
          id:       'cp3',
          sentence: '"Sure, the offer is great. ___ ___ ___, I\'d have to leave my team behind."',
          answers:  ['The', 'thing', 'is'],
          hint:     'Introduce the complication.',
        },
        {
          kind: 'mcq',
          id: 'cp4',
          prompt: 'Your friend keeps saying they\'ll apply to the new course. You suspect they haven\'t. Ask them:',
          options: [
            { id: 'a', text: '"Did you apply?"' },
            { id: 'b', text: '"Please apply."' },
            { id: 'c', text: '"Have you actually applied yet?"' },
          ],
          correct: 'c',
          explain: '"Have you actually…" softly confronts the gap between intention and action.',
        },
        {
          kind:     'gap-fill',
          id:       'cp5',
          sentence: 'I can\'t explain why, but my ___ says I shouldn\'t take the job.',
          answers:  ['gut'],
          hint:     'Instinct / intuition.',
        },
      ],
    },

    // ─── Step 8 · Production ─────────────────────────────────
    {
      kind:         'production',
      title:        'Now you',
      intro:        'Think of a real decision you\'ve been putting off (or a past one you can replay). Record yourself walking a friend through it.',
      mode:         'speaking',
      prompt:       'Record 60 seconds explaining a dilemma to an imaginary friend. Cover: (1) what the opportunity is, (2) what you\'d do if you took it, (3) what you\'d do if you turned it down, (4) what your gut is telling you. Use at least 3 of: "Walk me through it", "If I took it / turned it down", "The thing is…", "Have you actually…?", "my gut says".',
      targetChunks: ['c1', 'c2', 'c3', 'c4', 'c5'],
      minSeconds:   60,
    },
  ],
};
