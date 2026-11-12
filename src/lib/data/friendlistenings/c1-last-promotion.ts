// Friendlistenings® — C1 · The last promotion
//
// A ~3:00 adult conversation between two colleagues at the hotel bar of a
// company off-site. Iris was promoted to Head of Product last month;
// Dante was the other candidate and didn't get it. After six weeks of
// quiet avoidance, Dante initiates the honest conversation he's been
// putting off.
//
// Rich C1 language surface: hedged speech acts ("I'd be lying if I said…",
// "cards on the table"), nominalization ("the story I was telling myself",
// "with the benefit of hindsight"), mitigated disagreement, vulnerability
// without self-pity, and the sophisticated discourse markers an
// examiner listens for.
//
// 8-step arc, ~50 minute slot:
//   1. Lead-in     · 5 min — ambition + fairness schema
//   2. Vocab       · 8 min — 8 C1 chunks + 3 nuance checks
//   3. Prediction  · 3 min — tone + resolution
//   4. Gist        · 7 min — the arc of the conversation
//   5. Detail      · 10 min — specifics + inference
//   6. Awareness   · 7 min — 5 high-register chunks
//   7. Controlled  · 5 min — reuse the chunks
//   8. Production  · 5 min — 90-sec speaking: a hard conversation you'd have

import type { FLLesson } from '@/types/friendlistenings';

export const lessonC1LastPromotion: FLLesson = {
  id:           'c1-last-promotion',
  title:        'The last promotion',
  subtitle:     'A late conversation between two colleagues',
  level:        'C1',
  topic:        'Workplace ambition · vulnerability · adult conversation',
  scenario:     'At a company off-site, Dante finally has the honest conversation with Iris about the promotion she got and he didn\'t.',
  estimatedMin: 50,
  tags:         ['workplace', 'vulnerability', 'hedging', 'high-register'],
  createdAt:    '2026-11-12',

  cover: {
    accent: '#4A4452',
    emoji:  '🥃',
  },

  audio: {
    durationSec: 185,
    speakers: [
      {
        id: 'dante', displayName: 'Dante', accent: 'US', gender: 'm',
        suggestedVoice: { voiceId: 'iP95p4xoKVk53GoZ742B', name: 'Chris', note: 'ElevenLabs · natural US male, late 30s — steady, vulnerable' },
      },
      {
        id: 'iris', displayName: 'Iris', accent: 'US', gender: 'f',
        suggestedVoice: { voiceId: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice', note: 'ElevenLabs · calm mature US female — thoughtful, measured' },
      },
    ],
    script: [
      { speakerId: 'dante', approxStartSec:   0, text: 'Hey. Mind if I join you?' },
      { speakerId: 'iris',  approxStartSec:   4, text: 'Not at all. Sit down.' },
      { speakerId: 'dante', approxStartSec:   7, text: 'Look, I\'m not going to beat around the bush. I\'ve been avoiding you for six weeks and it\'s childish. Can we talk about it?' },
      { speakerId: 'iris',  approxStartSec:  17, text: 'I was wondering when this would happen. Yes, please. I\'d rather we did.' },
      { speakerId: 'dante', approxStartSec:  23, text: 'Okay. Cards on the table — I thought it was going to be me. Not because I thought you didn\'t deserve it, but because I\'d convinced myself. For two years I\'d convinced myself. And when Marco called me into his office that Friday, I genuinely thought he was going to tell me.' },
      { speakerId: 'iris',  approxStartSec:  45, text: 'I know. And I\'d be lying if I said I didn\'t feel that from the day it was announced. The air changed.' },
      { speakerId: 'dante', approxStartSec:  54, text: 'It did. And I hated that I let it. Because the thing is, if the decision had gone the other way, you\'d have taken it with grace. I know you. I, on the other hand, went home and spent two weeks being insufferable to my partner.' },
      { speakerId: 'iris',  approxStartSec:  72, text: 'You\'re human. Give yourself a break.' },
      { speakerId: 'dante', approxStartSec:  76, text: 'The hard part isn\'t the title. I can live without the title. It\'s the story I was telling myself — that this was the moment, that I\'d earned it — that I have to let go of.' },
      { speakerId: 'iris',  approxStartSec:  90, text: 'Can I say something that might sound like I\'m being defensive? I don\'t think you should let go of it entirely. The work you did last year was the best thing anyone on the team has shipped. The promotion came down to one meeting — the Q3 strategy session, where I happened to have the slides Marco was looking for. It could just as easily have been reversed.' },
      { speakerId: 'dante', approxStartSec: 115, text: 'With the benefit of hindsight, I keep landing on the same thing. I didn\'t fight for it. You did. I waited to be noticed. You made sure you were in the room.' },
      { speakerId: 'iris',  approxStartSec: 128, text: 'That\'s fair. But it\'s also something you can do next time.' },
      { speakerId: 'dante', approxStartSec: 134, text: 'Next time. Yeah. Here\'s what I came over to say. I want to work for you. Properly. No bitterness, no footnotes. If you\'ll let me, I want to make you look great.' },
      { speakerId: 'iris',  approxStartSec: 148, text: 'Dante, that means more to me than you know. And can I return the favor? When the next thing opens up — and something will — I want to be the one who puts your name forward before anyone else does.' },
      { speakerId: 'dante', approxStartSec: 165, text: 'Deal. Okay. Let\'s get another drink before this gets any more earnest.' },
    ],
  },

  steps: [
    // ─── Step 1 · Lead-in ─────────────────────────────────────
    {
      kind:      'lead-in',
      title:     'Before we start',
      intro:     'When two people compete for the same opportunity and one of them wins, the conversation they eventually have — if they have it at all — is where the real work happens. Today you\'ll hear one of those conversations.',
      hookEmoji: '🥃',
      openQuestions: [
        { id: 'li1', prompt: 'Have you ever lost a promotion, a role, or an opportunity to someone you work with? How did you handle it?' },
        { id: 'li2', prompt: 'Is it harder to be the person who got the promotion or the person who didn\'t? Why?' },
        { id: 'li3', prompt: 'How long does it take you to have a hard conversation that you know you need to have?', hint: 'Dante waits six weeks. That\'s on the longer end but not unusual.' },
      ],
    },

    // ─── Step 2 · Vocab ───────────────────────────────────────
    {
      kind:  'vocab',
      title: 'Key chunks',
      intro: 'These are the eight chunks that make this conversation sound like two real adults talking, not a textbook.',
      items: [
        { id: 'v1', word: 'to beat around the bush',     pos: 'idiom',    translation: 'Dar vueltas / no ir al grano.',                                           example: 'I\'m not going to beat around the bush.',                       definition: 'to avoid the main point', },
        { id: 'v2', word: 'cards on the table',           pos: 'idiom',    translation: 'Cartas sobre la mesa — hablar con total honestidad.',                      example: 'Cards on the table — I thought it was going to be me.',          definition: 'full honesty, no concealment' },
        { id: 'v3', word: 'I\'d be lying if I said…',    pos: 'phrase',    translation: 'Mentiría si dijera… — admitir algo incómodo.',                           example: 'I\'d be lying if I said I didn\'t feel that.',                  definition: 'honest admission of something difficult' },
        { id: 'v4', word: 'to take (sth) with grace',    pos: 'phrase',    translation: 'Tomar algo con elegancia / sin amargura.',                                example: 'You\'d have taken it with grace. I know you.',                   definition: 'to accept something difficult with dignity' },
        { id: 'v5', word: 'to come down to',              pos: 'phrasal-verb', translation: 'Reducirse a / depender de (al final).',                                 example: 'The promotion came down to one meeting.',                        definition: 'to ultimately be determined by' },
        { id: 'v6', word: 'with the benefit of hindsight', pos: 'phrase', translation: 'Con la perspectiva del tiempo / mirando hacia atrás.',                    example: 'With the benefit of hindsight, I keep landing on the same thing.', definition: 'looking back with information you didn\'t have at the time' },
        { id: 'v7', word: 'to let go of (sth)',           pos: 'phrasal-verb', translation: 'Soltar algo — un rencor, una historia, una expectativa.',             example: 'That\'s the story I have to let go of.',                        definition: 'to stop holding on emotionally' },
        { id: 'v8', word: 'to put (sb\'s) name forward',  pos: 'phrase',    translation: 'Postular / nominar a alguien.',                                          example: 'I want to be the one who puts your name forward.',               definition: 'to recommend someone for a role or opportunity' },
      ],
      quiz: [
        {
          kind: 'mcq',
          id: 'vq1',
          prompt: '"Cards on the table" signals that the speaker is about to…',
          options: [
            { id: 'a', text: 'play a game' },
            { id: 'b', text: 'speak with complete honesty, no filter' },
            { id: 'c', text: 'change the topic' },
          ],
          correct: 'b',
          explain: 'An honesty-signal. Often precedes a vulnerable admission.',
        },
        {
          kind: 'mcq',
          id: 'vq2',
          prompt: '"The decision came down to one meeting" means…',
          options: [
            { id: 'a', text: 'The meeting was descended.' },
            { id: 'b', text: 'The decision was ultimately determined by that one meeting.' },
            { id: 'c', text: 'The meeting arrived to make a decision.' },
          ],
          correct: 'b',
          explain: '"Come down to X" = X is the ultimate deciding factor. Common in post-mortem discussions.',
        },
        {
          kind: 'mcq',
          id: 'vq3',
          prompt: '"With the benefit of hindsight" means…',
          options: [
            { id: 'a', text: 'with the help of a report I received' },
            { id: 'b', text: 'looking back with knowledge I didn\'t have then' },
            { id: 'c', text: 'with the advantage of being younger' },
          ],
          correct: 'b',
          explain: 'A slightly formal phrase for "looking back now". Used when evaluating a past choice.',
        },
      ],
    },

    // ─── Step 3 · Prediction ─────────────────────────────────
    {
      kind:  'prediction',
      title: 'What will you hear?',
      intro: 'Two colleagues sit down after six weeks of avoiding each other. Guess the shape of the conversation.',
      questions: [
        {
          kind: 'mcq',
          id: 'p1',
          prompt: 'What tone is most likely?',
          options: [
            { id: 'a', text: 'Angry, with raised voices' },
            { id: 'b', text: 'Formal and cold' },
            { id: 'c', text: 'Honest and vulnerable, but calm' },
          ],
          correct: 'c',
        },
        {
          kind: 'mcq',
          id: 'p2',
          prompt: 'How will Iris (the one who got the promotion) most likely respond?',
          options: [
            { id: 'a', text: 'Defensively — she earned it' },
            { id: 'b', text: 'With empathy, while acknowledging the discomfort' },
            { id: 'c', text: 'By pretending nothing happened' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'p3',
          prompt: 'How will the conversation end?',
          options: [
            { id: 'a', text: 'One of them walks out angry.' },
            { id: 'b', text: 'They quietly agree to stop talking.' },
            { id: 'c', text: 'With a renewed, honest commitment to each other.' },
          ],
          correct: 'c',
        },
      ],
    },

    // ─── Step 4 · Gist ───────────────────────────────────────
    {
      kind:      'gist',
      title:     'Listen for the gist',
      intro:     'Listen once, without stopping. Catch the overall emotional arc — the details come next.',
      listenFor: [
        'Who starts the conversation — and why',
        'What Dante actually wants (it changes during the conversation)',
        'What Iris offers him at the end',
      ],
      allowTranscript: false,
      questions: [
        {
          kind: 'mcq',
          id: 'g1',
          prompt: 'Why does Dante start the conversation?',
          options: [
            { id: 'a', text: 'He wants to complain.' },
            { id: 'b', text: 'He wants to stop avoiding Iris — he calls it childish.' },
            { id: 'c', text: 'His manager told him to.' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'g2',
          prompt: 'What does Dante decide he can\'t keep carrying?',
          options: [
            { id: 'a', text: 'The job title itself' },
            { id: 'b', text: 'The story he was telling himself about being "the one"' },
            { id: 'c', text: 'His workload' },
          ],
          correct: 'b',
        },
        {
          kind:    'true-false',
          id:      'g3',
          prompt:  'By the end, Iris promises to put Dante\'s name forward for the next opportunity.',
          correct: 'T',
          explain: 'Direct quote: "I want to be the one who puts your name forward before anyone else does."',
        },
      ],
    },

    // ─── Step 5 · Detail ─────────────────────────────────────
    {
      kind:             'detail',
      title:            'Listen for detail',
      intro:            'Now listen again. Transcript is available. Watch for the inference questions — some answers aren\'t stated directly.',
      allowTranscript:  true,
      questions: [
        {
          kind:     'gap-fill',
          id:       'd1',
          sentence: 'Dante says he\'s been avoiding Iris for ___ weeks.',
          answers:  ['six'],
          alts:     [['6']],
        },
        {
          kind: 'mcq',
          id: 'd2',
          prompt: 'Who called Dante into their office on the Friday he thought he\'d been promoted?',
          options: [
            { id: 'a', text: 'Iris' },
            { id: 'b', text: 'Marco' },
            { id: 'c', text: 'HR' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'd3',
          prompt: 'According to Iris, what specific meeting tipped the decision?',
          options: [
            { id: 'a', text: 'The annual review' },
            { id: 'b', text: 'The Q3 strategy session' },
            { id: 'c', text: 'A dinner with Marco' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'd4',
          prompt: 'Why did the Q3 meeting work in Iris\'s favor?',
          options: [
            { id: 'a', text: 'She had the exact slides Marco was looking for.' },
            { id: 'b', text: 'Dante was absent that day.' },
            { id: 'c', text: 'She asked for the promotion directly.' },
          ],
          correct: 'a',
          explain: '"I happened to have the slides Marco was looking for."',
        },
        {
          kind: 'mcq',
          id: 'd5',
          prompt: 'In Dante\'s own analysis, what was the key difference between him and Iris?',
          options: [
            { id: 'a', text: 'Iris had more years of experience.' },
            { id: 'b', text: 'Iris fought for it and made sure she was in the room; he waited to be noticed.' },
            { id: 'c', text: 'Iris did better work.' },
          ],
          correct: 'b',
        },
        {
          kind:     'gap-fill',
          id:       'd6',
          sentence: 'Dante says he spent two weeks being ___ to his partner.',
          answers:  ['insufferable'],
          hint:     'Means "impossible to put up with".',
        },
        {
          kind:    'true-false',
          id:      'd7',
          prompt:  'Dante tells Iris he wants to work for her — with no bitterness and no footnotes.',
          correct: 'T',
          explain: '"I want to work for you. Properly. No bitterness, no footnotes."',
        },
      ],
    },

    // ─── Step 6 · Language Awareness ─────────────────────────
    {
      kind:  'language-awareness',
      title: 'Notice these expressions',
      intro: 'Go back to the transcript. These five chunks are high-register moves C1 speakers reach for when the stakes of a conversation matter.',
      chunks: [
        {
          id:       'c1',
          chunk:    'I\'m not going to beat around the bush',
          category: 'discourse-marker',
          gloss:    'Voy a ir directo al grano — meta-move que señala honestidad',
          example:  '"I\'m not going to beat around the bush. I\'ve been avoiding you for six weeks."',
          notice:   'Meta-commentary — telling the listener HOW you\'re about to speak. Sets expectations and asks for permission to be blunt. Variants: "I won\'t sugarcoat it", "I\'ll be straight with you".',
        },
        {
          id:       'c2',
          chunk:    'I\'d be lying if I said + negative clause',
          category: 'register',
          gloss:    'Mentiría si dijera que no… — admitir algo con hedging',
          example:  '"I\'d be lying if I said I didn\'t feel that from the day it was announced."',
          notice:   'Double negative wrapped in conditional — softens a hard admission. The structure buys the speaker distance while still telling the truth. Compare blunt "I felt it" vs the hedged version that invites empathy.',
        },
        {
          id:       'c3',
          chunk:    'came down to + noun phrase',
          category: 'phrasal-verb',
          gloss:    'Se redujo a / dependió finalmente de',
          example:  '"The promotion came down to one meeting."',
          notice:   'Post-mortem register — you use this when explaining AFTER the fact what really drove a result. Pairs with "what it came down to was…", "when it all came down to it…".',
        },
        {
          id:       'c4',
          chunk:    'With the benefit of hindsight,',
          category: 'discourse-marker',
          gloss:    'Con la perspectiva del tiempo, — framing reflexivo',
          example:  '"With the benefit of hindsight, I keep landing on the same thing."',
          notice:   'Signals that you\'re about to say something you couldn\'t have seen at the time. More elegant than "looking back". Buys you honesty without excusing the past decision.',
        },
        {
          id:       'c5',
          chunk:    'the story I was telling myself',
          category: 'collocation',
          gloss:    'La historia que me venía contando — nominalización reflexiva',
          example:  '"It\'s the story I was telling myself — that this was the moment, that I\'d earned it — that I have to let go of."',
          notice:   'Modern self-aware register. Treats your own inner narrative as an object you can hold, examine, and put down. Pairs with "let go of", "reframe", "the version of myself that…".',
        },
      ],
    },

    // ─── Step 7 · Controlled Practice ────────────────────────
    {
      kind:  'controlled-practice',
      title: 'Guided practice',
      intro: 'Reuse the chunks in C1-shaped sentences.',
      activities: [
        {
          kind:     'gap-fill',
          id:       'cp1',
          sentence: 'Let me not ___ ___ ___ bush — the proposal, in its current form, doesn\'t work.',
          answers:  ['beat', 'around', 'the'],
          hint:     'Signal you\'ll be direct.',
        },
        {
          kind:     'gap-fill',
          id:       'cp2',
          sentence: 'I\'d be ___ if I said I wasn\'t disappointed by the outcome.',
          answers:  ['lying'],
          hint:     'Admitting something hard.',
        },
        {
          kind: 'mcq',
          id: 'cp3',
          prompt: 'Which sentence uses "come down to" correctly?',
          options: [
            { id: 'a', text: 'The whole project came down a few key decisions.' },
            { id: 'b', text: 'The whole project came down to a few key decisions.' },
            { id: 'c', text: 'The whole project is coming down to.' },
          ],
          correct: 'b',
          explain: 'Always "come down TO + noun phrase".',
        },
        {
          kind:     'gap-fill',
          id:       'cp4',
          sentence: '___ ___ ___ of hindsight, I should have asked more questions in the interview.',
          answers:  ['With', 'the', 'benefit'],
          hint:     'Reflective framing.',
        },
        {
          kind: 'mcq',
          id: 'cp5',
          prompt: 'Which sounds the most C1-natural?',
          options: [
            { id: 'a', text: '"I need to stop thinking that I should have been promoted."' },
            { id: 'b', text: '"I need to let go of the story I was telling myself about the promotion."' },
            { id: 'c', text: '"I don\'t want to think about the promotion anymore."' },
          ],
          correct: 'b',
        },
      ],
    },

    // ─── Step 8 · Production ─────────────────────────────────
    {
      kind:         'production',
      title:        'Now you',
      intro:        'Think of a hard conversation you\'ve had — or one you still need to have. Record 90 seconds of it as if you were opening it right now.',
      mode:         'speaking',
      prompt:       'Record 90 seconds opening a hard conversation. The listener can be a colleague, a friend, a family member — anyone. Use at least 3 of the chunks from this lesson: "I\'m not going to beat around the bush", "Cards on the table", "I\'d be lying if I said…", "It came down to…", "With the benefit of hindsight…", "The story I was telling myself…". Lean into hedging and vulnerability — this register rewards honesty, not polish.',
      targetChunks: ['c1', 'c2', 'c3', 'c4', 'c5'],
      minSeconds:   90,
    },
  ],
};
