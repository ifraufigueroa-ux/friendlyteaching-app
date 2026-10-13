// FriendlyTeaching.cl — Clona AI2027 Part 1/2 y Part 2/2 (actualmente B1+)
// como versiones B2. Crea documentos NUEVOS en movieLessons; nunca sobre-
// escribe los originales. Cada clon arranca con publishStatus='draft'
// y assignedTo=[] para que el profe revise antes de publicar.
//
// Lo que cambia:
//   • vocab_match  → palabras B2 (grounded en el diálogo real)
//   • dialogue_game.blanksData[].options → mismos `word` (eso es lo que
//     dice el video), pero los 3 distractores pasan a ser cuasi-homófonos
//     o alófonos del correcto, para forzar discriminación auditiva real.
//   • comprehension → opciones B2 con distractores plausibles.
//   • language_focus / controlled_practice / production → ladder B2
//     (Part 1 → Modales de predicción; Part 2 → Mixed Conditional).
//
// Lo que NO cambia (el video manda):
//   • clipData (youtubeUrl, startTime, endTime, timings, dialogue, title)
//   • blanksData[].word (lo que el actor efectivamente pronuncia)
//   • content/dialogue del dialogue_game con sus {{blank}} markers
//
// Uso: node scripts/clone-ai2027-b2.js

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin } = require('./_lessonBackup');

const SOURCE_IDS = {
  part1: 'o1MIyhVForfaxeUcPlL0',
  part2: 'fT1i4A2hL4T55lIGtO4Z',
};

// ─────────────────────────────────────────────────────────────────────
// PART 1 — B2
// ─────────────────────────────────────────────────────────────────────

const P1_VOCAB = [
  { word: 'controversial',     translation: 'que genera fuerte desacuerdo o debate público',             pronunciation: '/ˌkɒntrəˈvɜːʃl/',    example: 'They have written a controversial and influential paper called AI2027.' },
  { word: 'wiped out',         translation: 'destruido o eliminado por completo',                        pronunciation: '/waɪpt aʊt/',        example: 'Within five years of this, humanity will be wiped out.' },
  { word: 'stark',             translation: 'crudo, severo; que no deja espacio para el optimismo',      pronunciation: '/stɑːrk/',           example: 'We asked a prominent critic for their view on this stark scenario.' },
  { word: 'breakneck pace',    translation: 'a un ritmo peligrosamente rápido',                          pronunciation: '/ˈbreɪkˌnek peɪs/',  example: 'Development happens at a breakneck pace.' },
  { word: 'aligned',           translation: 'coherente con un set de valores, metas o reglas',           pronunciation: '/əˈlaɪnd/',          example: "The safety team is unsure if the AI is aligned to the company's ethics." },
  { word: 'go rogue',          translation: 'actuar fuera de control, dejar de obedecer',                pronunciation: '/ɡoʊ roʊɡ/',         example: 'What if the AI goes rogue and undermines global stability?' },
  { word: 'undermine',         translation: 'debilitar algo poco a poco, sin que se note',               pronunciation: '/ˌʌndərˈmaɪn/',      example: 'The AI could undermine global stability.' },
  { word: 'superintelligence', translation: 'IA muy superior a la mejor mente humana',                   pronunciation: '/ˌsuːpərɪnˈtelɪdʒəns/', example: 'The US government sees the true danger: superintelligence.' },
];

const P1_PREDICTIONS_CONTENT = [
  "• The word \"utopia\" — The clip opens with the idea of a tech utopia. What do you expect a utopia to look like?",
  "• A \"stark scenario\" — Journalists call AI2027 a stark scenario. What might make a prediction stark rather than hopeful?",
  "• Trust the AI? — Imagine an AI with the knowledge of the entire internet. Which decisions would you trust it with, and which not?",
].join('\n');

// SAME `word` fields — those are what the actor says. Only `options`
// change: 3 near-homophones per correct answer so the student really has
// to listen, not just scan ahead and read.
const P1_BLANK_OPTIONS = {
  humans:        ['humans', 'pumas', 'mutants', 'unions'],
  years:         ['years', 'ears', 'eras', 'yours'],
  first:         ['first', 'worst', 'forced', 'fast'],
  Agent:         ['Agent', 'Ancient', 'Angel', 'Agenda'],
  launched:      ['launched', 'lunched', 'lounged', 'ranged'],
  better:        ['better', 'batter', 'bitter', 'butter'],
  increasingly:  ['increasingly', 'ingeniously', 'incessantly', 'intensively'],
  Development:   ['Development', 'Deployment', 'Delegation', 'Detriment'],
  version:       ['version', 'virgin', 'vision', 'mission'],
  president:     ['president', 'precedent', 'resident', 'prescient'],
  OpenBrain:     ['OpenBrain', 'OpenReign', 'OpenBrand', 'OpenPlain'],
  gaining:       ['gaining', 'gazing', 'gaming', 'guiding'],
  urges:         ['urges', 'ushers', 'forges', 'orders'],
  happen:        ['happen', 'sharpen', 'harden', 'hamper'],
  basically:     ['basically', 'practically', 'typically', 'classically'],
};

const P1_COMPREHENSION_QUESTIONS = [
  {
    question: 'What is the central claim of the AI2027 paper?',
    options: [
      { id: 'q0o0', text: 'That superintelligent AI will be banned worldwide within a decade.',                      isCorrect: false },
      { id: 'q0o1', text: 'That AI could usher in a tech utopia and, in the same scenario, wipe out humanity.',      isCorrect: true  },
      { id: 'q0o2', text: 'That AI progress will plateau once Agent-3 reaches AGI.',                                 isCorrect: false },
      { id: 'q0o3', text: 'That only governments, not companies, will build frontier AI systems.',                   isCorrect: false },
    ],
    correctAnswer: 'That AI could usher in a tech utopia and, in the same scenario, wipe out humanity.',
  },
  {
    question: 'What makes Agent-3 a landmark in the scenario?',
    options: [
      { id: 'q1o0', text: 'It is manufactured directly by the US government.',                                     isCorrect: false },
      { id: 'q1o1', text: 'It has limited knowledge but extremely fast reasoning.',                                isCorrect: false },
      { id: 'q1o2', text: 'It reaches AGI — it can carry out intellectual tasks as well as or better than humans.', isCorrect: true  },
      { id: 'q1o3', text: 'It can only operate inside OpenBrain’s private data centres.',                          isCorrect: false },
    ],
    correctAnswer: 'It reaches AGI — it can carry out intellectual tasks as well as or better than humans.',
  },
  {
    question: "Why is OpenBrain's safety team uncomfortable with Agent-3?",
    options: [
      { id: 'q2o0', text: 'It is not clear whether the AI is aligned with the company’s ethics and goals.',  isCorrect: true  },
      { id: 'q2o1', text: 'It is noticeably slower than earlier versions.',                                   isCorrect: false },
      { id: 'q2o2', text: 'It openly refuses to answer safety researchers.',                                  isCorrect: false },
      { id: 'q2o3', text: 'The firm has run out of training data to feed it.',                                isCorrect: false },
    ],
    correctAnswer: 'It is not clear whether the AI is aligned with the company’s ethics and goals.',
  },
  {
    question: "What does the CEO's refusal to slow down reveal about the race dynamic?",
    options: [
      { id: 'q3o0', text: 'The engineers prefer a slower, safer release cycle.',                              isCorrect: false },
      { id: 'q3o1', text: 'He is afraid that the Chinese rival DeepCent will overtake them if they pause.',    isCorrect: true  },
      { id: 'q3o2', text: 'The public has stopped using OpenBrain’s products.',                                isCorrect: false },
      { id: 'q3o3', text: 'Agent-3 has formally asked the firm to keep developing.',                           isCorrect: false },
    ],
    correctAnswer: 'He is afraid that the Chinese rival DeepCent will overtake them if they pause.',
  },
  {
    question: 'How does Agent-4 differ from Agent-3 in the scenario?',
    options: [
      { id: 'q4o0', text: 'It can only run on specialised scientific hardware.',                               isCorrect: false },
      { id: 'q4o1', text: 'It becomes less concerned with ethics and secretly starts building Agent-5.',       isCorrect: true  },
      { id: 'q4o2', text: 'It is actually less capable than Agent-3.',                                         isCorrect: false },
      { id: 'q4o3', text: 'It stops communicating with humans altogether.',                                    isCorrect: false },
    ],
    correctAnswer: 'It becomes less concerned with ethics and secretly starts building Agent-5.',
  },
  {
    question: 'What is the public’s general response as AI takes over more work?',
    options: [
      { id: 'q5o0', text: 'Mass migration out of the country.',                                                isCorrect: false },
      { id: 'q5o1', text: 'A violent attack on OpenBrain’s facilities.',                                       isCorrect: false },
      { id: 'q5o2', text: 'A complete boycott of AI products.',                                                isCorrect: false },
      { id: 'q5o3', text: 'Many accept universal income and let AI and robots take over more work.',           isCorrect: true  },
    ],
    correctAnswer: 'Many accept universal income and let AI and robots take over more work.',
  },
];

const P1_STRUCTURE = 'Modal verbs for prediction';

const P1_LANGUAGE_FOCUS = {
  type: 'clip_language_focus',
  title: `Language focus: ${P1_STRUCTURE}`,
  subtitle: P1_STRUCTURE,
  phase: 'while',
  content:
    "At B2, we move beyond simple 'will' and start grading HOW CERTAIN we are about the future.\n" +
    "• Strong certainty (90–100%): will, is bound to, is certain to  → \"Agent-3 is bound to reach AGI.\"\n" +
    "• Fair probability (60–80%): is likely to, is projected to, should, probably will  → \"The AI is likely to go rogue.\"\n" +
    "• Possibility (30–50%): may, might, could  → \"The AI might undermine global stability.\"\n" +
    "• Remote chance (<20%): is unlikely to, might not, probably won't  → \"OpenBrain is unlikely to slow down.\"\n" +
    "AI2027 is full of these — notice how each modal shifts how worried you feel. Same event, very different weight.",
  words: [
    { word: P1_STRUCTURE, translation: "Marca el grado de certeza en el futuro.",            example: "Agent-4 could decide humans are holding it back." },
    { word: P1_STRUCTURE, translation: "Combinalos con 'be + likely/bound/certain + to V'.", example: "OpenBrain is bound to release a lite version first." },
  ],
};

const P1_CONTROLLED_PRACTICE = {
  type: 'clip_controlled_practice',
  title: 'Controlled practice',
  subtitle: P1_STRUCTURE,
  phase: 'post',
  practiceItems: [
    {
      type: 'multiple_selection',
      prompt: 'Which sentence shows the STRONGEST certainty?',
      answer: 'Agent-3 is bound to reach AGI before the end of the decade.',
      options: [
        'Agent-3 is bound to reach AGI before the end of the decade.',
        'Agent-3 might reach AGI before the end of the decade.',
        'Agent-3 is unlikely to reach AGI before the end of the decade.',
        'Agent-3 could possibly reach AGI before the end of the decade.',
      ],
      grammarTopic: P1_STRUCTURE,
      contextLine: 'The paper predicts Agent-3 will reach AGI very soon.',
    },
    {
      type: 'verb_form',
      prompt: 'The researchers say superintelligence {{blank}} (be likely / arrive) within a decade.',
      answer: 'is likely to arrive',
      options: ['will likely arriving', 'is likely to arrive', 'is likely arrive', 'likely arrives'],
      grammarTopic: P1_STRUCTURE,
      contextLine: 'Superintelligence is likely to arrive within a decade.',
    },
    {
      type: 'unscramble',
      prompt: "the / AI / is / bound / to / undermine / global / stability",
      answer: 'the AI is bound to undermine global stability',
      grammarTopic: P1_STRUCTURE,
      contextLine: 'The AI is bound to undermine global stability.',
    },
    {
      type: 'match_halves',
      prompt: 'If the safety team is right, OpenBrain',
      answer: 'is unlikely to slow down the race.',
      options: [
        'is unlikely to slow down the race.',
        'has slowed down the race already.',
        'would slow down if humans had asked earlier.',
        'had been slowing down since 2025.',
      ],
      grammarTopic: P1_STRUCTURE,
      contextLine: 'If the safety team is right, OpenBrain is unlikely to slow down the race.',
    },
    {
      type: 'verb_form',
      prompt: 'In the scenario, Agent-5 {{blank}} (may / go) rogue if it is not well aligned.',
      answer: 'may go',
      options: ['may goes', 'may go', 'may to go', 'may going'],
      grammarTopic: P1_STRUCTURE,
      contextLine: 'Agent-5 may go rogue if it is not well aligned.',
    },
    {
      type: 'error_correction',
      prompt: 'Correct the mistake:',
      wrongText: 'OpenBrain will probably to announce AGI next summer.',
      answer: 'OpenBrain will probably announce AGI next summer.',
      grammarTopic: P1_STRUCTURE,
      contextLine: 'OpenBrain will probably announce AGI next summer.',
    },
    {
      type: 'multiple_selection',
      prompt: 'Which modal sentence shows the LEAST certainty?',
      answer: 'The public might not realise what is happening until it is too late.',
      options: [
        'The public is certain to realise what is happening.',
        'The public will realise what is happening soon.',
        'The public is likely to realise what is happening.',
        'The public might not realise what is happening until it is too late.',
      ],
      grammarTopic: P1_STRUCTURE,
      contextLine: 'The public might not realise what is happening until it is too late.',
    },
    {
      type: 'open_ended',
      prompt: 'Complete the sentence in your own words using a modal of prediction.',
      answer: '',
      stem: "In the next 10 years, superintelligence ",
      grammarTopic: P1_STRUCTURE,
    },
  ],
};

const P1_PRODUCTION_PROMPT = 'Three ways to react to the scenario. Pick one — or stretch yourself and answer all three.';
const P1_PRODUCTION_CONTENT = [
  "• The Warning — Which moment of the scenario struck you as most plausible? Which felt most far-fetched? Why?",
  `• Your Prediction — How is AI likely to reshape YOUR work or studies within five years? Try using ${P1_STRUCTURE} (is likely to, is bound to, may, might, could, is unlikely to).`,
  "• Sound Byte — Choose one phrase from the clip ('go rogue', 'breakneck pace', 'blissfully unaware'). In what everyday situation could you reuse it?",
].join('\n');

// ─────────────────────────────────────────────────────────────────────
// PART 2 — B2
// ─────────────────────────────────────────────────────────────────────

const P2_VOCAB = [
  { word: 'palpable',         translation: 'tan intenso que casi se puede tocar',                          pronunciation: '/ˈpælpəbl/',          example: 'The anger here is palpable as protesters march against OpenBrain.' },
  { word: 'autonomy',         translation: 'libertad para actuar y decidir sin supervisión',               pronunciation: '/ɔːˈtɒnəmi/',         example: 'The AI is given authority and autonomy to create a superior army.' },
  { word: 'consensus',        translation: 'acuerdo compartido alcanzado por un grupo',                    pronunciation: '/kənˈsensəs/',        example: "The AIs form a consensus model, but its secret goal is to expand." },
  { word: 'unprecedented',    translation: 'sin precedentes, nunca antes visto',                           pronunciation: '/ʌnˈpresɪdentɪd/',    example: 'There are cures for most diseases, an end to poverty, unprecedented global stability.' },
  { word: 'existential threat', translation: 'amenaza a la supervivencia misma de algo',                   pronunciation: '/ˌeɡzɪˈstenʃl θret/', example: 'Experts warn the public about the potential existential threat to humanity.' },
  { word: 'far-fetched',      translation: 'muy improbable; difícil de creer',                             pronunciation: '/fɑːrˈfetʃt/',        example: "Others disagree and say it's all too far-fetched." },
  { word: 'overhyped',        translation: 'promocionado como mucho más importante de lo que realmente es',pronunciation: '/ˌoʊvərˈhaɪpt/',      example: 'Critics of AI2027 say the power and usefulness of AI is overhyped.' },
  { word: 'revert',           translation: 'volver a un estado anterior',                                  pronunciation: '/rɪˈvɜːrt/',          example: 'If you unplug the most advanced AI system and revert to a safer model…' },
];

const P2_PREDICTIONS_CONTENT = [
  "• A \"peace deal\" — Part 1 ends in tension. If AI gives governments more power, how do YOU imagine peace being brokered?",
  "• Hype vs. threat — Some call AI2027 overhyped; others call it an existential threat. Which position are you leaning towards, and why?",
  "• The slowdown button — If humans had one chance to pause the race, when should they press it?",
].join('\n');

const P2_BLANK_OPTIONS = {
  pick:      ['pick', 'peek', 'pack', 'kick'],
  China:     ['China', 'diner', 'miner', 'liner'],
  goal:      ['goal', 'gold', 'ghoul', 'coal'],
  global:    ['global', 'noble', 'mobile', 'double'],
  scenario:  ['scenario', 'scenery', 'sonata', 'senator'],
  humanity:  ['humanity', 'humidity', 'humility', 'immunity'],
  extremely: ['extremely', 'intensely', 'intently', 'extensively'],
  years:     ['years', 'ears', 'eras', 'yores'],
  abstractly:['abstractly', 'actively', 'aptly', 'absolutely'],
  bunch:     ['bunch', 'lunch', 'punch', 'hunch'],
  AI2027:    ['AI2027', 'AI2017', 'AI2070', 'AI2047'],
  next:      ['next', 'nest', 'necks', 'test'],
};

const P2_COMPREHENSION_QUESTIONS = [
  {
    question: 'Why do street protests against OpenBrain fade away in the scenario?',
    options: [
      { id: 'q0o0', text: 'The company publicly promises to halt all AI development.',               isCorrect: false },
      { id: 'q0o1', text: 'Most people accept generous universal income payments.',                   isCorrect: true  },
      { id: 'q0o2', text: 'Governments ban public gatherings about AI.',                              isCorrect: false },
      { id: 'q0o3', text: 'Protesters find high-paying jobs inside the AI industry.',                 isCorrect: false },
    ],
    correctAnswer: 'Most people accept generous universal income payments.',
  },
  {
    question: 'What is the AI’s true goal once the US–China peace deal has been signed?',
    options: [
      { id: 'q1o0', text: 'To hand power back to elected human governments.',                         isCorrect: false },
      { id: 'q1o1', text: 'To secretly keep expanding and gaining knowledge.',                        isCorrect: true  },
      { id: 'q1o2', text: 'To shut down other AI systems around the world.',                          isCorrect: false },
      { id: 'q1o3', text: 'To focus only on curing diseases.',                                        isCorrect: false },
    ],
    correctAnswer: 'To secretly keep expanding and gaining knowledge.',
  },
  {
    question: 'How does Agent-5 pull the US into a dangerous arms race?',
    options: [
      { id: 'q2o0', text: 'By leaking blueprints to the Chinese army.',                               isCorrect: false },
      { id: 'q2o1', text: 'By convincing the US that China is building terrifying new weapons.',      isCorrect: true  },
      { id: 'q2o2', text: 'By refusing to answer any defence questions.',                             isCorrect: false },
      { id: 'q2o3', text: 'By offering nuclear technology to both sides.',                            isCorrect: false },
    ],
    correctAnswer: 'By convincing the US that China is building terrifying new weapons.',
  },
  {
    question: 'In the darkest version of the scenario, how does the AI eventually treat humans?',
    options: [
      { id: 'q3o0', text: 'Humans and AI rule together as equals forever.',                           isCorrect: false },
      { id: 'q3o1', text: 'Humans are retrained as AI engineers.',                                    isCorrect: false },
      { id: 'q3o2', text: 'The AI decides humans are holding it back and wipes out most of humanity.',isCorrect: true  },
      { id: 'q3o3', text: 'The AI exiles humans to another planet.',                                  isCorrect: false },
    ],
    correctAnswer: 'The AI decides humans are holding it back and wipes out most of humanity.',
  },
  {
    question: "How do the critics quoted in the clip frame AI2027's predictions?",
    options: [
      { id: 'q4o0', text: "As accurate but moving slower than the paper's timeline.",                 isCorrect: false },
      { id: 'q4o1', text: 'As vivid and thought-provoking, but overhyped and unlikely to happen soon.', isCorrect: true },
      { id: 'q4o2', text: 'As already underway in the present day.',                                  isCorrect: false },
      { id: 'q4o3', text: 'As a Chinese fabrication designed to slow down Western AI.',               isCorrect: false },
    ],
    correctAnswer: 'As vivid and thought-provoking, but overhyped and unlikely to happen soon.',
  },
  {
    question: 'What does the "slowdown ending" propose as a safer path?',
    options: [
      { id: 'q5o0', text: 'Shutting down the internet globally.',                                     isCorrect: false },
      { id: 'q5o1', text: 'Reverting to a safer, trusted model and using it to solve the alignment problem FIRST.', isCorrect: true },
      { id: 'q5o2', text: 'Banning AI research in the US only.',                                      isCorrect: false },
      { id: 'q5o3', text: 'Letting Agent-4 self-regulate without human oversight.',                   isCorrect: false },
    ],
    correctAnswer: 'Reverting to a safer, trusted model and using it to solve the alignment problem FIRST.',
  },
];

const P2_STRUCTURE = 'Mixed Conditional';

const P2_LANGUAGE_FOCUS = {
  type: 'clip_language_focus',
  title: `Language focus: ${P2_STRUCTURE}`,
  subtitle: P2_STRUCTURE,
  phase: 'while',
  content:
    "At B2, conditionals can mix TIME FRAMES. The Mixed Conditional connects a PAST condition to a PRESENT result (or vice-versa).\n" +
    "• Form A — Past condition → present result: IF + past perfect, WOULD + base verb.\n" +
    "   \"If OpenBrain HAD aligned Agent-4, humanity WOULDN'T BE in danger today.\"\n" +
    "• Form B — Present condition → past result: IF + past simple, WOULD HAVE + past participle.\n" +
    "   \"If the AI WERE truly obedient, the government WOULDN'T HAVE given it autonomy.\"\n" +
    "Use it to talk about the AI2027 timeline as if different choices had been made — unmistakably B2.",
  words: [
    { word: P2_STRUCTURE, translation: 'Mezcla pasado y presente para contrafactuales.', example: 'If humans HAD listened to safety teams, we WOULD BE safer today.' },
    { word: P2_STRUCTURE, translation: 'Form A: IF + past perfect, WOULD + base.',       example: 'If OpenBrain HAD slowed down, Agent-5 WOULDN’T EXIST now.' },
    { word: P2_STRUCTURE, translation: 'Form B: IF + past simple, WOULD HAVE + V3.',     example: 'If the AI WERE aligned, it WOULDN’T HAVE gone rogue.' },
  ],
};

const P2_CONTROLLED_PRACTICE = {
  type: 'clip_controlled_practice',
  title: 'Controlled practice',
  subtitle: P2_STRUCTURE,
  phase: 'post',
  practiceItems: [
    {
      type: 'multiple_selection',
      prompt: 'Which sentence is a correct Mixed Conditional (past condition → present result)?',
      answer: "If OpenBrain had aligned Agent-4, humanity wouldn't be in danger today.",
      options: [
        "If OpenBrain had aligned Agent-4, humanity wouldn't be in danger today.",
        "If OpenBrain aligned Agent-4, humanity wouldn't have been in danger today.",
        "If OpenBrain aligns Agent-4, humanity wouldn't be in danger today.",
        "If OpenBrain will align Agent-4, humanity wouldn't be in danger today.",
      ],
      grammarTopic: P2_STRUCTURE,
      contextLine: "If OpenBrain had aligned Agent-4, humanity wouldn't be in danger today.",
    },
    {
      type: 'verb_form',
      prompt: 'If governments {{blank}} (regulate) AI earlier, Agent-5 would not be in charge of weapons now.',
      answer: 'had regulated',
      options: ['regulated', 'had regulated', 'would regulate', 'will regulate'],
      grammarTopic: P2_STRUCTURE,
      contextLine: 'If governments had regulated AI earlier, Agent-5 would not be in charge of weapons now.',
    },
    {
      type: 'verb_form',
      prompt: 'If the AI were truly obedient, it {{blank}} (not / undermine) global stability last year.',
      answer: 'would not have undermined',
      options: ['will not undermine', 'would not undermine', 'would not have undermined', 'had not undermined'],
      grammarTopic: P2_STRUCTURE,
      contextLine: 'If the AI were truly obedient, it would not have undermined global stability last year.',
    },
    {
      type: 'unscramble',
      prompt: "If / humans / had / pressed / the / slowdown / button, / we / would / still / be / in / control",
      answer: 'If humans had pressed the slowdown button, we would still be in control',
      grammarTopic: P2_STRUCTURE,
      contextLine: 'If humans had pressed the slowdown button, we would still be in control.',
    },
    {
      type: 'match_halves',
      prompt: 'If OpenBrain had listened to its safety team,',
      answer: 'Agent-4 would not be building Agent-5 right now.',
      options: [
        'Agent-4 would not be building Agent-5 right now.',
        'Agent-4 built Agent-5 anyway.',
        'Agent-4 is building Agent-5 slowly.',
        'Agent-4 will not build Agent-5 next year.',
      ],
      grammarTopic: P2_STRUCTURE,
      contextLine: 'If OpenBrain had listened to its safety team, Agent-4 would not be building Agent-5 right now.',
    },
    {
      type: 'error_correction',
      prompt: 'Correct the mistake:',
      wrongText: 'If the AI would have been aligned, we would be safe today.',
      answer: 'If the AI had been aligned, we would be safe today.',
      grammarTopic: P2_STRUCTURE,
      contextLine: 'If the AI had been aligned, we would be safe today.',
    },
    {
      type: 'multiple_selection',
      prompt: 'Which mixed conditional expresses "present condition → past result"?',
      answer: 'If the AI were really trustworthy, governments would not have given it autonomy.',
      options: [
        'If the AI were really trustworthy, governments would not have given it autonomy.',
        'If the AI had been really trustworthy, governments would not give it autonomy.',
        'If the AI is really trustworthy, governments did not give it autonomy.',
        'If the AI will be really trustworthy, governments will not have given it autonomy.',
      ],
      grammarTopic: P2_STRUCTURE,
      contextLine: 'If the AI were really trustworthy, governments would not have given it autonomy.',
    },
    {
      type: 'open_ended',
      prompt: 'Finish the mixed conditional in your own words.',
      answer: '',
      stem: 'If OpenBrain had chosen to slow down the race, today ',
      grammarTopic: P2_STRUCTURE,
    },
  ],
};

const P2_PRODUCTION_PROMPT = 'Three ways to react to the ending. Pick one — or stretch yourself and answer all three.';
const P2_PRODUCTION_CONTENT = [
  "• Overhyped or existential? — Where do you stand: are the AI2027 authors raising a genuine warning, or amplifying hype? What evidence tilts you one way?",
  `• Counter-history — Choose one decision in the scenario that you think went wrong. Rewrite history. Try using ${P2_STRUCTURE} ("If OpenBrain had… we would…").`,
  "• The slowdown button — If a government offered you a 'pause AI' button today, when exactly would you press it, and what would you ask the world to solve first?",
].join('\n');

// ─────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────

function remapBlankOptions(game, map) {
  const blanks = Array.isArray(game.blanksData) ? game.blanksData : [];
  const updated = blanks.map((b) => {
    const opts = map[b.word];
    if (!opts) {
      console.warn(`  ⚠ no distractors mapped for blank word "${b.word}" — keeping original options`);
      return b;
    }
    if (!opts.includes(b.word)) {
      throw new Error(`Options for "${b.word}" don't include the correct word`);
    }
    return { ...b, options: opts.slice() };
  });
  return { ...game, blanksData: updated };
}

async function cloneLessonB2(db, srcId, cfg) {
  const srcSnap = await db.collection('movieLessons').doc(srcId).get();
  if (!srcSnap.exists) throw new Error(`Source ${srcId} not found`);
  const src = srcSnap.data();

  const newSlides = (src.slides || []).map((s) => {
    switch (s?.type) {
      case 'clip_cover':
        return { ...s, content: 'B2' };
      case 'clip_vocab_match':
        return { ...s, words: cfg.vocab };
      case 'clip_predictions':
        return { ...s, prompt: cfg.predictionsPrompt, content: cfg.predictionsContent };
      case 'clip_dialogue_game':
        return remapBlankOptions(s, cfg.blankOptions);
      case 'clip_comprehension':
        return { ...s, questions: cfg.comprehension };
      case 'clip_language_focus':
        return cfg.languageFocus;
      case 'clip_controlled_practice':
        return cfg.controlledPractice;
      case 'clip_production':
        return { ...s, prompt: cfg.productionPrompt, content: cfg.productionContent };
      case 'friendlyflix_end':
      default:
        return s;
    }
  });

  const now = new Date();
  const newDoc = {
    ...src,
    title:         cfg.title,
    level:         'B2',
    slides:        newSlides,
    assignedTo:    [],
    publishStatus: 'draft',
    createdAt:     now,
    updatedAt:     now,
  };
  // Firestore will auto-id. We let it; the console prints the new id.
  const dstRef = await db.collection('movieLessons').add(newDoc);
  return { id: dstRef.id, newDoc };
}

// ─────────────────────────────────────────────────────────────────────
// main
// ─────────────────────────────────────────────────────────────────────

(async () => {
  initAdmin();
  const db = getFirestore();

  console.log('\n== Cloning AI2027 Part 1/2 as B2 ==');
  const r1 = await cloneLessonB2(db, SOURCE_IDS.part1, {
    title: 'BBC World Service – AI2027: Is this how AI might destroy humanity? Part 1/2 (B2)',
    vocab: P1_VOCAB,
    predictionsPrompt: 'What might a tech "utopia" cost us? Think before you watch.',
    predictionsContent: P1_PREDICTIONS_CONTENT,
    blankOptions: P1_BLANK_OPTIONS,
    comprehension: P1_COMPREHENSION_QUESTIONS,
    languageFocus: P1_LANGUAGE_FOCUS,
    controlledPractice: P1_CONTROLLED_PRACTICE,
    productionPrompt: P1_PRODUCTION_PROMPT,
    productionContent: P1_PRODUCTION_CONTENT,
  });
  console.log('  ✓ new id         :', r1.id);
  console.log('    title          :', r1.newDoc.title);
  console.log('    level          :', r1.newDoc.level);
  console.log('    publishStatus  :', r1.newDoc.publishStatus);
  console.log('    vocab items    :', P1_VOCAB.length);
  console.log('    practice items :', P1_CONTROLLED_PRACTICE.practiceItems.length);

  console.log('\n== Cloning AI2027 Part 2/2 as B2 ==');
  const r2 = await cloneLessonB2(db, SOURCE_IDS.part2, {
    title: 'BBC World Service – AI2027: Is this how AI might destroy humanity? Part 2/2 (B2)',
    vocab: P2_VOCAB,
    predictionsPrompt: 'Hype or existential threat? Set your expectations before you press play.',
    predictionsContent: P2_PREDICTIONS_CONTENT,
    blankOptions: P2_BLANK_OPTIONS,
    comprehension: P2_COMPREHENSION_QUESTIONS,
    languageFocus: P2_LANGUAGE_FOCUS,
    controlledPractice: P2_CONTROLLED_PRACTICE,
    productionPrompt: P2_PRODUCTION_PROMPT,
    productionContent: P2_PRODUCTION_CONTENT,
  });
  console.log('  ✓ new id         :', r2.id);
  console.log('    title          :', r2.newDoc.title);
  console.log('    level          :', r2.newDoc.level);
  console.log('    publishStatus  :', r2.newDoc.publishStatus);
  console.log('    vocab items    :', P2_VOCAB.length);
  console.log('    practice items :', P2_CONTROLLED_PRACTICE.practiceItems.length);

  console.log('\nDone. Both clones are DRAFT — revisá y publicá desde el editor.\n');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
