// Clona la lección Naruto – Pain's Cycle of Hatred (B1+,
// movieLessons/gLtuWtn86IvTKe9U6G90) como una versión A2:
//   - Vocab más simple (10 palabras A2 presentes en el clip)
//   - Dialogue game con las mismas 29 blanks, pero NUEVAS opciones
//     (alofonía / homofonía / parecidas al sonido correcto) y evitando
//     que todas empiecen con la misma letra
//   - Comprehension más corta y directa
//   - Language focus → Future with "going to" (encaja con los "gonna"
//     del script: "I'm gonna kill you", "I'M GONNA BRING PEACE...")
//   - Controlled practice reescrita para "going to" con contexto Naruto
//   - Free production: preguntas simples conectadas al tema, que invitan
//     a usar "going to" implícitamente
//
// Crea un NUEVO documento (no toca el B1+). publishStatus = 'published'
// para que quede visible al profesor como las otras, pero con level=A2.
//
// Usage: node scripts/clone-pain-a2.js

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin } = require('./_lessonBackup');

const SOURCE_ID = 'gLtuWtn86IvTKe9U6G90';

// ─── A2 content ─────────────────────────────────────────────────────

// 10 palabras A2 que realmente aparecen (o aparecen conceptualmente) en el clip.
// Evité vocab B1/B2 del original: vengeance, hatred (sustantivo), foretell,
// vicious, confront, entrust, envisioned.
const A2_VOCAB = [
  { word: 'peace',       translation: 'un tiempo sin guerra ni peleas',               pronunciation: '/piːs/',           example: 'What I want is to create peace.' },
  { word: 'hate',        translation: 'un sentimiento muy fuerte y malo',             pronunciation: '/heɪt/',           example: "There's too much hate in this shinobi world." },
  { word: 'kill',        translation: 'hacer que alguien muera',                      pronunciation: '/kɪl/',            example: "First, I'm gonna kill you!" },
  { word: 'hurt',        translation: 'causar dolor a alguien',                       pronunciation: '/hɜːrt/',          example: 'Hurt my friends...' },
  { word: 'destroy',     translation: 'romper algo por completo',                     pronunciation: '/dɪˈstrɔɪ/',       example: 'Destroyed my village!' },
  { word: 'future',      translation: 'el tiempo que viene después de ahora',         pronunciation: '/ˈfjuː.tʃər/',     example: 'I know the past and can foretell our future.' },
  { word: 'past',        translation: 'el tiempo antes de ahora',                     pronunciation: '/pæst/',           example: 'I know the past.' },
  { word: 'same',        translation: 'no diferente; igual',                          pronunciation: '/seɪm/',           example: 'You and I are the same.' },
  { word: 'understand',  translation: 'saber qué significa algo',                     pronunciation: '/ˌʌn.dərˈstænd/',  example: 'Human beings simply cannot understand each other.' },
  { word: 'feel',        translation: 'tener una emoción',                            pronunciation: '/fiːl/',           example: 'Everyone feels the same pain.' },
];

const A2_PREDICTIONS_PROMPT = 'What do you think these two men are going to talk about?';
const A2_PREDICTIONS_CONTENT = [
  'Who are these two men? Are they friends or enemies?',
  'What is the big problem between them?',
  'Is Naruto going to be happy or angry?',
  'Is this scene going to be about love, hate, or peace?',
].join('\n');

// Mismas 29 blanks que el B1+. Mantengo cada `word` (respuesta correcta)
// porque el audio es el mismo. Reemplazo las OPCIONES por alternativas:
//   • foneticamente similares (rima, aloofonía, pares mínimos u homófonos)
//   • A2 / palabras comunes
//   • NO todas con la misma letra inicial
const A2_BLANKS = [
  { word: 'doing',       options: ['going',    'showing',  'moving',    'doing']      }, // /uːɪŋ/
  { word: 'knowledge',   options: ['village',  'knowledge','college',   'message']    }, // /ɪdʒ/
  { word: 'explain',     options: ['remain',   'again',    'explain',   'complain']   }, // /eɪn/
  { word: 'would',       options: ['could',    'wood',     'would',     'should']     }, // homophone wood/would
  { word: 'fulfill',     options: ['feel',     'fulfill',  'fill',      'kill']       }, // /ɪl/, /iːl/
  { word: 'peace',       options: ['piece',    'cheese',   'please',    'peace']      }, // homophone peace/piece
  { word: 'BREAK',       options: ['CAKE',     'MAKE',     'BREAK',     'STEAK']      }, // STEAK homophone-rima
  { word: 'things',      options: ['kings',    'things',   'sings',     'rings']      }, // /ɪŋz/
  { word: 'gonna',       options: ['wanna',    'gonna',    'honey',     'mama']       }, // ritmo /ˈ_ə/
  { word: 'WORLD',       options: ['WORD',     'HEARD',    'WORLD',     'BIRD']       }, // /ɜːrd/
  { word: 'suffered',    options: ['offered',  'covered',  'hurried',   'suffered']   }, // /-ərd/
  { word: 'preach',      options: ['teach',    'preach',   'reach',     'beach']      }, // /iːtʃ/
  { word: 'talking',     options: ['walking',  'cooking',  'taking',    'talking']    }, // /ˈ_kɪŋ/
  { word: 'hidden',      options: ['sudden',   'hidden',   'happen',    'listen']     }, // /-ən/
  { word: 'wage',        options: ['page',     'cage',     'wage',      'stage']      }, // /eɪdʒ/
  { word: 'starved',     options: ['carved',   'saved',    'served',    'starved']    }, // /-vd/
  { word: 'waste',       options: ['taste',    'paste',    'waist',     'waste']      }, // homophone waste/waist
  { word: 'barely',      options: ['rarely',   'nearly',   'early',     'barely']     }, // /-rli/
  { word: 'seeking',     options: ['speaking', 'seeking',  'sleeping',  'meeting']    }, // /iː_ɪŋ/
  { word: 'envisioned',  options: ['mentioned','envisioned','mission',  'vision']     }, // /ʃən/
  { word: 'delivered',   options: ['delivered','remembered','offered',  'discovered'] }, // /-ərd/
  { word: 'something',   options: ['nothing',  'something','anything',  'everything'] }, // /-ɪŋ/
  { word: 'driven',      options: ['given',    'driven',   'broken',    'taken']      }, // past part. /-ən/
  { word: 'cycle',       options: ['circle',   'bicycle',  'simple',    'cycle']      }, // /ˈ_(a)ɪ-/
  { word: 'hatred',      options: ['hated',    'hatred',   'matter',    'patted']     }, // /ˈ_ætɪd/ ritmo
  { word: 'quite',       options: ['quiet',    'kite',     'quite',     'white']      }, // /aɪt/
  { word: 'harmony',     options: ['memory',   'enemy',    'army',      'harmony']    }, // /-mi/ ritmo
  { word: 'entrust',     options: ['instruct', 'trust',    'express',   'entrust']    }, // /strʌ_/
  { word: 'confront',    options: ['comfort',  'confront', 'front',     'content']    }, // /ˈkʌn_/-/kənˈ_/
];

// Comprehension A2: 5 preguntas, redactadas con vocab A2.
const A2_COMPREHENSION_QUESTIONS = [
  {
    question: "What does Pain say he wants?",
    options: [
      { id: 'q0o0', text: 'He wants to make peace and justice',           isCorrect: true  },
      { id: 'q0o1', text: 'He wants to fight Naruto one more time',       isCorrect: false },
      { id: 'q0o2', text: 'He wants to be the strongest ninja',           isCorrect: false },
      { id: 'q0o3', text: 'He wants to find his family',                  isCorrect: false },
    ],
    correctAnswer: 'He wants to make peace and justice',
  },
  {
    question: "Who does Naruto say Pain killed?",
    options: [
      { id: 'q1o0', text: 'His parents and his brother',                  isCorrect: false },
      { id: 'q1o1', text: 'His master and his sensei',                    isCorrect: true  },
      { id: 'q1o2', text: 'His best friend Sasuke',                       isCorrect: false },
      { id: 'q1o3', text: 'The leader of the village',                    isCorrect: false },
    ],
    correctAnswer: 'His master and his sensei',
  },
  {
    question: "What is Naruto going to do?",
    options: [
      { id: 'q2o0', text: 'He is going to join Pain',                     isCorrect: false },
      { id: 'q2o1', text: 'He is going to run away',                      isCorrect: false },
      { id: 'q2o2', text: 'He is going to kill Pain and bring peace',     isCorrect: true  },
      { id: 'q2o3', text: 'He is going to find Jiraiya',                  isCorrect: false },
    ],
    correctAnswer: 'He is going to kill Pain and bring peace',
  },
  {
    question: "Why does Pain say he is also right?",
    options: [
      { id: 'q3o0', text: 'Because his family and village had the same bad fate', isCorrect: true  },
      { id: 'q3o1', text: 'Because he is older than Naruto',              isCorrect: false },
      { id: 'q3o2', text: 'Because he is the strongest',                  isCorrect: false },
      { id: 'q3o3', text: 'Because Naruto is young',                      isCorrect: false },
    ],
    correctAnswer: 'Because his family and village had the same bad fate',
  },
  {
    question: "What did Jiraiya want for the world?",
    options: [
      { id: 'q4o0', text: 'He wanted to be a famous ninja',               isCorrect: false },
      { id: 'q4o1', text: 'He wanted to stop all the hate',               isCorrect: true  },
      { id: 'q4o2', text: 'He wanted to leave the village',               isCorrect: false },
      { id: 'q4o3', text: 'He wanted to fight with Pain',                 isCorrect: false },
    ],
    correctAnswer: 'He wanted to stop all the hate',
  },
];

// Language focus A2: Future with "going to"
// Encaja perfecto con los "gonna" del clip (reducción informal de going to).
const A2_LANGUAGE_FOCUS = {
  type: 'clip_language_focus',
  title: 'Future with "going to"',
  subtitle: 'Plans and intentions',
  content:
    "In the clip, Naruto says:\n" +
    "  • \"I'm gonna kill you!\"  →  I am going to kill you.\n" +
    "  • \"I'M GONNA BRING PEACE TO THE NINJA WORLD!\"  →  I am going to bring peace…\n\n" +
    "\"gonna\" is the informal way of saying \"going to\".\n\n" +
    "We use \"be going to\" + verb to talk about future PLANS and INTENTIONS.\n\n" +
    "FORM:\n" +
    "  • I am going to + verb\n" +
    "  • You / We / They are going to + verb\n" +
    "  • He / She / It is going to + verb\n\n" +
    "NEGATIVE: I am NOT going to fight.\n" +
    "QUESTION: Are you going to help him?",
  words: [
    {
      word: "I'm gonna kill you!",
      translation: 'I am going to kill you.',
      example: 'A strong plan — Naruto decided this already.',
    },
    {
      word: "I'M GONNA BRING PEACE TO THE NINJA WORLD!",
      translation: 'I am going to bring peace to the ninja world.',
      example: 'A big future intention for the world.',
    },
    {
      word: 'Are you going to help your friend?',
      translation: 'Question with "going to".',
      example: 'Pattern: Am / Is / Are + subject + going to + verb?',
    },
    {
      word: "I am NOT going to hate anymore.",
      translation: 'Negative with "going to".',
      example: 'Pattern: am / is / are + NOT + going to + verb.',
    },
  ],
  teacherNotes:
    'Nivel A2. Elicitá "going to" en el controlled practice y en la production. Mencioná que "gonna" es el habla rápida de "going to" — pero que escriban la forma completa.',
};

const A2_CONTROLLED_PRACTICE = {
  type: 'clip_controlled_practice',
  title: 'Controlled practice',
  subtitle: 'Future with "going to"',
  practiceItems: [
    {
      type: 'multiple_selection',
      prompt: 'Which sentence uses "going to" correctly?',
      answer: 'Naruto is going to fight Pain.',
      options: [
        'Naruto is going to fight Pain.',
        'Naruto going to fight Pain.',
        'Naruto is going fight Pain.',
        'Naruto goes to fight Pain tomorrow.',
      ],
      grammarTopic: 'Future with "going to"',
      contextLine: 'Naruto is going to fight Pain.',
    },
    {
      type: 'unscramble',
      prompt: 'is / going / Naruto / peace / to / bring',
      answer: 'Naruto is going to bring peace',
      grammarTopic: 'Future with "going to"',
      contextLine: 'Naruto is going to bring peace.',
    },
    {
      type: 'verb_form',
      prompt: 'I {{blank}} (kill) you, said Naruto.',
      answer: 'am going to kill',
      options: ['am going to kill', 'going to kill', 'am going kill', 'kill'],
      grammarTopic: 'Future with "going to"',
      contextLine: 'I am going to kill you, said Naruto.',
    },
    {
      type: 'match_halves',
      prompt: 'Pain is going to',
      answer: 'destroy more villages.',
      options: [
        'destroy more villages.',
        'destroyed the village yesterday.',
        'destroys villages every week.',
        'has destroyed the village.',
      ],
      grammarTopic: 'Future with "going to"',
      contextLine: 'Pain is going to destroy more villages.',
    },
    {
      type: 'unscramble',
      prompt: 'to / going / We / understand / are / each / other',
      answer: 'We are going to understand each other',
      grammarTopic: 'Future with "going to"',
      contextLine: 'We are going to understand each other.',
    },
    {
      type: 'verb_form',
      prompt: 'They {{blank}} (make) peace next year.',
      answer: 'are going to make',
      options: ['are going to make', 'is going to make', 'going to make', 'makes'],
      grammarTopic: 'Future with "going to"',
      contextLine: 'They are going to make peace next year.',
    },
    {
      type: 'error_correction',
      prompt: 'Correct the mistake:',
      wrongText: 'Naruto going to help his friends.',
      answer: 'Naruto is going to help his friends.',
      grammarTopic: 'Future with "going to"',
      contextLine: 'Naruto is going to help his friends.',
    },
    {
      type: 'open_ended',
      prompt: 'Complete the sentence in your own words using "going to".',
      answer: '',
      stem: 'To make the world better, I am going to ',
      grammarTopic: 'Future with "going to"',
    },
  ],
};

// Free practice: preguntas simples, A2, conectadas al tema del video
// (hate / peace / revenge / friends / family). Cada pregunta invita
// implícitamente a usar "going to" sin nombrar la estructura.
const A2_PRODUCTION_PROMPT = 'Think about peace, friends and family. What are YOU going to do?';
const A2_PRODUCTION_CONTENT = [
  '• Your friend — If someone hurts your best friend, what are you going to do? Are you going to fight, or are you going to talk?',
  '• Your enemy — Think of a person you do not like. Are you going to understand them? What are you going to say to them next time?',
  '• A better world — Pain says the world has too much hate. What is ONE thing you are going to do this week to make your world better?',
].join('\n');

// ─── main ───────────────────────────────────────────────────────────

(async () => {
  initAdmin();
  const db = getFirestore();
  const srcRef = db.collection('movieLessons').doc(SOURCE_ID);
  const srcSnap = await srcRef.get();
  if (!srcSnap.exists) { console.error('Source lesson not found:', SOURCE_ID); process.exit(1); }
  const src = srcSnap.data();

  const newSlides = src.slides.map((s) => {
    switch (s.type) {
      case 'cover':
      case 'clip_cover':
        return {
          ...s,
          subtitle: 'A scene about hate, peace, and understanding.',
          content: 'A2',
        };
      case 'clip_vocab_match':
        return { ...s, words: A2_VOCAB };
      case 'clip_predictions':
        return {
          ...s,
          prompt: A2_PREDICTIONS_PROMPT,
          content: A2_PREDICTIONS_CONTENT,
        };
      case 'clip_dialogue_game':
        // Mantengo el dialogue, timings, clipData — sólo cambio las OPCIONES
        // del juego para que suenen similares y sean A2-friendly.
        return {
          ...s,
          blanksData: A2_BLANKS.map(b => ({ word: b.word, options: b.options })),
        };
      case 'clip_comprehension':
        return { ...s, questions: A2_COMPREHENSION_QUESTIONS };
      case 'clip_language_focus':
        return A2_LANGUAGE_FOCUS;
      case 'clip_controlled_practice':
        return A2_CONTROLLED_PRACTICE;
      case 'clip_production':
        return {
          ...s,
          prompt: A2_PRODUCTION_PROMPT,
          content: A2_PRODUCTION_CONTENT,
        };
      default:
        return s;
    }
  });

  // Sanity: cada blank del A2 debe incluir su respuesta en options.
  for (const b of A2_BLANKS) {
    if (!b.options.includes(b.word)) {
      console.error(`✗ Blank "${b.word}" is missing from its options:`, b.options);
      process.exit(1);
    }
    // No todas las opciones deben empezar con la misma letra.
    const firstLetters = new Set(b.options.map(o => o[0].toLowerCase()));
    if (firstLetters.size === 1) {
      console.error(`✗ Blank "${b.word}" has all options starting with the same letter:`, b.options);
      process.exit(1);
    }
  }

  const now = new Date();
  const newDoc = {
    ...src,
    title:         "Naruto – Pain's Cycle of Hatred (A2)",
    level:         'A2',
    slides:        newSlides,
    assignedTo:    [],
    publishStatus: 'published',
    createdAt:     now,
    updatedAt:     now,
  };

  const dstRef = await db.collection('movieLessons').add(newDoc);
  console.log('\n✓ Cloned Pain\'s Cycle as A2');
  console.log('  new lesson id :', dstRef.id);
  console.log('  title         :', newDoc.title);
  console.log('  level         :', newDoc.level);
  console.log('  publishStatus :', newDoc.publishStatus);
  console.log('  slides        :', newDoc.slides.length);
  console.log('  vocab items   :', A2_VOCAB.length);
  console.log('  blanks        :', A2_BLANKS.length);
  console.log('  practice items:', A2_CONTROLLED_PRACTICE.practiceItems.length);
  console.log('  production    :', A2_PRODUCTION_CONTENT.split('\n').length, 'critical-thinking cards');
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
