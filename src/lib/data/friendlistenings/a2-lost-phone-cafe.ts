// Friendlistenings® — A2 · Lost phone at the café
//
// A ~1:55 service-encounter dialogue. Nora went to the Palm Café yesterday
// and left her phone on a table. She comes back the next day, asks the
// barista Milo if anyone found it, and (lucky her) walks out with it.
//
// Real-world A2 payoff: service encounters are the first English the
// student USES outside the classroom. Chunks like "Excuse me, I think I
// left…", "What does it look like?", "Here you go", "Thank you so much" go
// directly into real life.
//
// 8-step arc, ~35 minute slot:
//   1. Lead-in     · 3 min — losing things + café schema
//   2. Vocab       · 6 min — 8 everyday service chunks + 3 checks
//   3. Prediction  · 2 min — will she get the phone back?
//   4. Gist        · 5 min — overall story
//   5. Detail      · 8 min — specifics (color, where, who found it)
//   6. Awareness   · 5 min — 5 service-register chunks
//   7. Controlled  · 4 min — reuse chunks in short tasks
//   8. Production  · 2 min — 30-sec writing: ask about a lost item

import type { FLLesson } from '@/types/friendlistenings';

export const lessonA2LostPhoneCafe: FLLesson = {
  id:           'a2-lost-phone-cafe',
  title:        'The lost phone',
  subtitle:     'A short conversation at a café',
  level:        'A2',
  topic:        'Service encounters · asking for help',
  scenario:     'Nora goes back to the Palm Café the day after losing her phone to ask the barista if anyone found it.',
  estimatedMin: 35,
  tags:         ['service-encounter', 'past-simple', 'polite-requests', 'everyday'],
  createdAt:    '2026-11-12',

  cover: {
    accent: '#F4A261',
    emoji:  '📱',
  },

  audio: {
    durationSec: 115,
    speakers: [
      {
        id: 'nora', displayName: 'Nora', accent: 'US', gender: 'f',
        suggestedVoice: { voiceId: 'oWAxZDx7w5VEj9dCyTzz', name: 'Grace', note: 'ElevenLabs · soft, warm US female — slightly nervous customer energy' },
      },
      {
        id: 'milo', displayName: 'Milo', accent: 'US', gender: 'm',
        suggestedVoice: { voiceId: 'ErXwobaYiN019PkySvjV', name: 'Antoni', note: 'ElevenLabs · warm US male — helpful barista tone' },
      },
    ],
    script: [
      { speakerId: 'nora', approxStartSec:   0, text: 'Hi, excuse me. I think I left my phone here yesterday.' },
      { speakerId: 'milo', approxStartSec:   6, text: 'Oh, hi! Yes, I remember you. You were sitting over there by the window.' },
      { speakerId: 'nora', approxStartSec:  13, text: 'Yes, exactly! It was in the afternoon. Did anyone find it?' },
      { speakerId: 'milo', approxStartSec:  20, text: 'Let me check our lost-and-found box. What does your phone look like?' },
      { speakerId: 'nora', approxStartSec:  27, text: 'It\'s a black iPhone with a blue case. The case has small stars on it.' },
      { speakerId: 'milo', approxStartSec:  34, text: 'A black iPhone with a blue case… stars on it, okay. Give me one minute. Let me see.' },
      { speakerId: 'milo', approxStartSec:  48, text: 'Here. Is this your phone?' },
      { speakerId: 'nora', approxStartSec:  52, text: 'Yes! Oh my goodness, thank you so much. I was so worried.' },
      { speakerId: 'milo', approxStartSec:  59, text: 'No problem. You\'re lucky — someone found it under the table last night. Our manager put it in the box.' },
      { speakerId: 'nora', approxStartSec:  69, text: 'Please thank the manager for me. Can I see her?' },
      { speakerId: 'milo', approxStartSec:  75, text: 'She\'s not here right now. She works in the evenings. But I can tell her for you.' },
      { speakerId: 'nora', approxStartSec:  84, text: 'That\'s very kind of you. And thank you again. I really appreciate it.' },
      { speakerId: 'milo', approxStartSec:  93, text: 'You\'re welcome. Have a great day!' },
      { speakerId: 'nora', approxStartSec:  98, text: 'You too!' },
    ],
  },

  steps: [
    // ─── Step 1 · Lead-in ─────────────────────────────────────
    {
      kind:      'lead-in',
      title:     'Before we start',
      intro:     'Think about the last time you lost something important. Maybe your phone, your keys, your wallet. Today you\'ll hear Nora go back to a café to ask if anyone found her phone.',
      hookEmoji: '📱',
      openQuestions: [
        { id: 'li1', prompt: 'Have you ever lost your phone or your keys? Did you find them again?' },
        { id: 'li2', prompt: 'In your country, do people usually return lost things at cafés and shops?' },
        { id: 'li3', prompt: 'How do you ask for something politely in English? Do you know any phrases?', hint: 'Think about "excuse me", "could I…", "sorry to bother you".' },
      ],
    },

    // ─── Step 2 · Vocab ───────────────────────────────────────
    {
      kind:  'vocab',
      title: 'Key words & phrases',
      intro: 'These are the exact chunks you need for any "I lost something" conversation.',
      items: [
        { id: 'v1', word: 'Excuse me',                translation: 'Fórmula para llamar la atención educadamente antes de pedir algo.',       example: 'Excuse me, I think I left my phone here.',          soundsLike: 'ex-KYOOZ me',    definition: 'polite way to get someone\'s attention', pos: 'phrase' },
        { id: 'v2', word: 'to leave (left)',          translation: 'Olvidar / dejar algo en algún lugar. Verbo irregular: leave → left.',    example: 'I left my phone on the table.',                     definition: 'to forget something in a place', pos: 'verb' },
        { id: 'v3', word: 'lost-and-found',           translation: 'La caja / sección de objetos perdidos.',                                  example: 'Let me check our lost-and-found box.',              soundsLike: 'LOST and FOWND', definition: 'where lost items are kept', pos: 'noun' },
        { id: 'v4', word: 'to look like',             translation: 'Verse / parecer. Para describir cómo es algo físicamente.',                example: 'What does your phone look like?',                   definition: 'to have the appearance of', pos: 'phrase' },
        { id: 'v5', word: 'to find (found)',          translation: 'Encontrar. Verbo irregular: find → found.',                                example: 'Did anyone find it?',                               definition: 'to discover something lost', pos: 'verb' },
        { id: 'v6', word: 'worried',                  translation: 'Preocupado/a. "Was so worried" = estaba muy preocupada.',                  example: 'I was so worried!',                                 definition: 'feeling anxious or concerned', pos: 'adjective' },
        { id: 'v7', word: 'Here you go / There you go', translation: 'Aquí tienes. Se dice al entregar algo a alguien.',                          example: 'Here. Is this your phone?',                         definition: 'phrase used when handing someone something', pos: 'phrase' },
        { id: 'v8', word: 'I really appreciate it',    translation: 'Te lo agradezco mucho. Más fuerte que "thank you".',                      example: 'Thank you again. I really appreciate it.',          soundsLike: 'ap-PREE-shee-ate', definition: 'strong, sincere thanks', pos: 'phrase' },
      ],
      quiz: [
        {
          kind: 'mcq',
          id: 'vq1',
          prompt: 'You want to ask a stranger a question. The best opener is…',
          options: [
            { id: 'a', text: 'Hey you!' },
            { id: 'b', text: 'Excuse me,' },
            { id: 'c', text: 'Listen up!' },
          ],
          correct: 'b',
          explain: '"Excuse me" is the standard polite way to get attention.',
        },
        {
          kind: 'mcq',
          id: 'vq2',
          prompt: '"I left my phone at the café" means…',
          options: [
            { id: 'a', text: 'I forgot my phone at the café.' },
            { id: 'b', text: 'I took my phone out of the café.' },
            { id: 'c', text: 'I bought a phone at the café.' },
          ],
          correct: 'a',
          explain: '"Leave / left" = forget something in a place. Past of "leave" is "left".',
        },
        {
          kind: 'mcq',
          id: 'vq3',
          prompt: 'Someone hands you your coat back. They probably say…',
          options: [
            { id: 'a', text: '"Sorry."' },
            { id: 'b', text: '"Finally."' },
            { id: 'c', text: '"Here you go."' },
          ],
          correct: 'c',
          explain: '"Here you go" / "There you go" is the standard phrase when giving someone something.',
        },
      ],
    },

    // ─── Step 3 · Prediction ─────────────────────────────────
    {
      kind:  'prediction',
      title: 'What will you hear?',
      intro: 'Nora goes back to the café to ask about her phone. Make your guesses before listening.',
      questions: [
        {
          kind: 'mcq',
          id: 'p1',
          prompt: 'Does the barista remember Nora?',
          options: [
            { id: 'a', text: 'No, he\'s never seen her.' },
            { id: 'b', text: 'Yes, he remembers her.' },
            { id: 'c', text: 'He\'s not sure.' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'p2',
          prompt: 'Will Nora get her phone back?',
          options: [
            { id: 'a', text: 'Yes, she will.' },
            { id: 'b', text: 'No, it\'s lost forever.' },
            { id: 'c', text: 'The phone is broken.' },
          ],
          correct: 'a',
        },
        {
          kind: 'mcq',
          id: 'p3',
          prompt: 'Who probably found the phone?',
          options: [
            { id: 'a', text: 'Nora\'s friend' },
            { id: 'b', text: 'The police' },
            { id: 'c', text: 'Another customer' },
          ],
          correct: 'c',
        },
      ],
    },

    // ─── Step 4 · Gist ───────────────────────────────────────
    {
      kind:      'gist',
      title:     'Listen for the gist',
      intro:     'Press play and listen to the whole conversation once. Don\'t worry about details.',
      listenFor: [
        'The general outcome: does Nora get the phone back?',
        'The tone: friendly or unfriendly?',
        'Who is the main person helping Nora?',
      ],
      allowTranscript: false,
      questions: [
        {
          kind: 'mcq',
          id: 'g1',
          prompt: 'What happens at the end?',
          options: [
            { id: 'a', text: 'Nora leaves without her phone.' },
            { id: 'b', text: 'Nora gets her phone back.' },
            { id: 'c', text: 'Nora buys a new phone.' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'g2',
          prompt: 'How is the overall tone of the conversation?',
          options: [
            { id: 'a', text: 'Friendly and polite' },
            { id: 'b', text: 'Angry and tense' },
            { id: 'c', text: 'Short and cold' },
          ],
          correct: 'a',
        },
        {
          kind: 'true-false',
          id: 'g3',
          prompt: 'The barista is the person who originally found the phone.',
          correct: 'F',
          explain: 'Another customer found it under the table. The manager put it in the lost-and-found box.',
        },
      ],
    },

    // ─── Step 5 · Detail ─────────────────────────────────────
    {
      kind:             'detail',
      title:            'Listen for detail',
      intro:            'Listen again, pausing when you need to. You can open the transcript.',
      allowTranscript:  true,
      questions: [
        {
          kind: 'mcq',
          id: 'd1',
          prompt: 'When was Nora at the café?',
          options: [
            { id: 'a', text: 'This morning' },
            { id: 'b', text: 'Last week' },
            { id: 'c', text: 'Yesterday afternoon' },
          ],
          correct: 'c',
        },
        {
          kind:     'gap-fill',
          id:       'd2',
          sentence: 'Nora\'s phone is a ___ iPhone with a ___ case.',
          answers:  ['black', 'blue'],
          alts:     [['Black'], ['Blue']],
        },
        {
          kind: 'mcq',
          id: 'd3',
          prompt: 'What is on the phone case?',
          options: [
            { id: 'a', text: 'Flowers' },
            { id: 'b', text: 'Small stars' },
            { id: 'c', text: 'Cats' },
          ],
          correct: 'b',
        },
        {
          kind: 'mcq',
          id: 'd4',
          prompt: 'Who found the phone?',
          options: [
            { id: 'a', text: 'Another customer, under the table' },
            { id: 'b', text: 'The barista' },
            { id: 'c', text: 'The manager' },
          ],
          correct: 'a',
          explain: '"Someone found it under the table last night."',
        },
        {
          kind: 'mcq',
          id: 'd5',
          prompt: 'Why can\'t Nora speak to the manager?',
          options: [
            { id: 'a', text: 'The manager is sick.' },
            { id: 'b', text: 'The manager is in a meeting.' },
            { id: 'c', text: 'The manager only works in the evenings.' },
          ],
          correct: 'c',
        },
        {
          kind:    'true-false',
          id:      'd6',
          prompt:  'Nora was sitting near the door.',
          correct: 'F',
          explain: 'The barista says: "You were sitting over there by the window."',
        },
      ],
    },

    // ─── Step 6 · Language Awareness ─────────────────────────
    {
      kind:  'language-awareness',
      title: 'Notice these expressions',
      intro: 'Go back to the transcript. These five chunks make any service conversation sound natural.',
      chunks: [
        {
          id:       'c1',
          chunk:    'Excuse me, I think I…',
          category: 'register',
          gloss:    'apertura educada + hedging con "I think" (suaviza)',
          example:  '"Excuse me, I think I left my phone here yesterday."',
          notice:   'Say "I think" even when you\'re sure — it sounds more polite and leaves room for the other person. Bare "I left my phone" sounds like an accusation.',
        },
        {
          id:       'c2',
          chunk:    'What does it look like?',
          category: 'collocation',
          gloss:    '¿cómo es? / ¿cómo se ve?',
          example:  '"What does your phone look like?"',
          notice:   'Question with "look like" + what/who. Compare: "What does he look like?" (physical) vs "What is he like?" (personality).',
        },
        {
          id:       'c3',
          chunk:    'Let me + verb',
          category: 'discourse-marker',
          gloss:    'dejame + infinitivo (suave, servicial)',
          example:  '"Let me check our lost-and-found box."',
          notice:   'Common when someone is about to help you. "Let me see", "let me check", "let me call". Softer than "I will check".',
        },
        {
          id:       'c4',
          chunk:    'Here you go / There you go',
          category: 'register',
          gloss:    'frase fija al entregar algo',
          example:  '"Here. Is this your phone?"',
          notice:   'Say "Here you go" when you\'re handing something over. "There you go" works too. "Take it" sounds rude by comparison.',
        },
        {
          id:       'c5',
          chunk:    'I really appreciate it',
          category: 'register',
          gloss:    'te lo agradezco mucho (más fuerte que "thanks")',
          example:  '"Thank you again. I really appreciate it."',
          notice:   'Use this after real help, not for small things. Pairs beautifully with a second "thank you" for an extra warm close.',
        },
      ],
    },

    // ─── Step 7 · Controlled Practice ────────────────────────
    {
      kind:  'controlled-practice',
      title: 'Guided practice',
      intro: 'Reuse the chunks from the previous step.',
      activities: [
        {
          kind:     'gap-fill',
          id:       'cp1',
          sentence: '___ me, is this your bag?',
          answers:  ['Excuse'],
          hint:     'Polite opener.',
        },
        {
          kind:     'gap-fill',
          id:       'cp2',
          sentence: '"I can\'t find my keys. Have you seen them?" — "What do they ___ ___?"',
          answers:  ['look', 'like'],
          hint:     'Asking for a description.',
        },
        {
          kind: 'mcq',
          id: 'cp3',
          prompt: 'Your friend asks for her book. You hand it to her and say…',
          options: [
            { id: 'a', text: '"Fine."' },
            { id: 'b', text: '"Here you go."' },
            { id: 'c', text: '"What?"' },
          ],
          correct: 'b',
        },
        {
          kind:     'gap-fill',
          id:       'cp4',
          sentence: 'The receptionist smiles and says, "I don\'t know, but ___ ___ check for you."',
          answers:  ['let', 'me'],
          hint:     'Soft offer of help.',
        },
        {
          kind: 'mcq',
          id: 'cp5',
          prompt: 'Someone brings back your lost wallet. The warmest reply is…',
          options: [
            { id: 'a', text: '"Thank you so much. I really appreciate it."' },
            { id: 'b', text: '"Thanks."' },
            { id: 'c', text: '"Okay, bye."' },
          ],
          correct: 'a',
        },
      ],
    },

    // ─── Step 8 · Production ─────────────────────────────────
    {
      kind:         'production',
      title:        'Now you',
      intro:        'Imagine you left your umbrella at a restaurant yesterday. You go back today to ask. Write the conversation between YOU and the waiter. Try to use at least 3 of the chunks from this lesson.',
      mode:         'writing',
      prompt:       'Write the conversation (6–8 lines) to ask about an umbrella you left at a restaurant. Include: a polite opener, a description, and a warm thank-you if they find it. Use "Excuse me", "I think I left", "What does it look like?", "Here you go", and/or "I really appreciate it".',
      targetChunks: ['c1', 'c2', 'c3', 'c4', 'c5'],
      minWords:     50,
    },
  ],
};
