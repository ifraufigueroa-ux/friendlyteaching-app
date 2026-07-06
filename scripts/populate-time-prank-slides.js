// FriendlyTeaching.cl — Populate The Office · Time Prank lesson with
// the same 6 missing Friendlyflix slides (B1 level, comedy/office
// register). Preserves the existing listening + comprehension slides
// and backs up the doc before writing.
//
// Usage: node scripts/populate-time-prank-slides.js
//        node scripts/populate-time-prank-slides.js --dry-run

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const LESSON_ID = 'tZl9Y5N4BRiCnXRMPRoj';
const DRY_RUN = process.argv.includes('--dry-run');

// ── Slide content — B1 comedy/office register ────────────────────────

const vocabSlide = {
  type: 'clip_vocab_match',
  title: 'Vocabulary — Office & Pranks',
  words: [
    { word: 'prank',        translation: 'broma',                    example: "Jim's prank on Dwight was hilarious." },
    { word: 'coworker',     translation: 'compañero de trabajo',     example: 'She had lunch with her coworkers.' },
    { word: 'to mess with', translation: 'molestar / hacer bromas',  example: 'Jim loves to mess with Dwight.' },
    { word: 'to trick',     translation: 'engañar',                  example: 'He tricked his brother into cleaning the room.' },
    { word: 'to notice',    translation: 'darse cuenta / notar',     example: "Dwight didn't notice that the clock was wrong." },
    { word: 'to pretend',   translation: 'fingir',                   example: 'Jim pretended it was late in the afternoon.' },
    { word: 'annoying',     translation: 'molesto / irritante',      example: 'Dwight can be very annoying in the office.' },
    { word: 'boring',       translation: 'aburrido',                 example: 'Office work can be boring sometimes.' },
    { word: 'boss',         translation: 'jefe',                     example: 'Michael is the boss of the branch.' },
    { word: 'to figure out',translation: 'entender / descubrir',     example: 'It took Dwight a while to figure out the prank.' },
  ],
};

const beforeReadingSlide = {
  type: 'clip_predictions',
  title: 'Before You Watch',
  prompt: "Before we watch the clip, let's warm up your brain with a few quick questions.",
  content: [
    'Have you ever played a prank on someone? What did you do?',
    'Do you know the TV series The Office? What do you think it is about?',
    'What kind of things do people do at work when they get bored?',
    "Do you enjoy watching comedies about workplaces? Why or why not?",
  ].join('\n'),
};

const languageAwarenessSlide = {
  type: 'clip_language_focus',
  title: 'Language Awareness — Phrasal Verbs',
  content: [
    'Comedies like The Office are full of phrasal verbs — everyday combinations of a verb and a small word (in, out, up, with) that native speakers use constantly. They often have a meaning you cannot guess from the parts alone.',
    '• verb + preposition → the two words act as one unit',
    '• the meaning is often figurative, not literal',
    '• the object usually goes at the end (mess WITH someone, figure OUT the joke)',
    'Notice the phrasal verbs below and pay attention to which small word follows the verb.',
  ].join('\n'),
  words: [
    { word: 'Jim loves to mess with Dwight during the day.',       translation: '', example: 'Pattern: mess with (someone) = to tease or annoy' },
    { word: "Dwight couldn't figure out why the time was moving so fast.", translation: '', example: 'Pattern: figure out (something) = to understand after thinking' },
    { word: 'They usually get on with their tasks after lunch.',   translation: '', example: 'Pattern: get on with (something) = to continue doing something' },
  ],
};

const controlledPracticeSlide = {
  type: 'clip_controlled_practice',
  title: 'Controlled Practice',
  practiceItems: [
    {
      type: 'unscramble',
      prompt: 'Jim / played / a funny prank / on Dwight / at the office',
      answer: 'Jim played a funny prank on Dwight at the office',
    },
    {
      type: 'unscramble',
      prompt: "Dwight / didn't notice / that / the clock / was wrong",
      answer: "Dwight didn't notice that the clock was wrong",
    },
    {
      type: 'unscramble',
      prompt: 'I / like / to mess with / my coworkers / sometimes',
      answer: 'I like to mess with my coworkers sometimes',
    },
    {
      type: 'match_halves',
      prompt: 'Jim spent the whole morning',
      answer: 'planning the perfect prank on Dwight.',
      options: [
        'planning the perfect prank on Dwight.',
        'fixing the office printer.',
        'calling important clients.',
        'watching the football game.',
      ],
    },
    {
      type: 'match_halves',
      prompt: 'Dwight finally figured out',
      answer: 'that Jim had changed the clocks in the office.',
      options: [
        'that Jim had changed the clocks in the office.',
        'that he had won a big prize.',
        'that Michael had fired the manager.',
        'that the printer was working again.',
      ],
    },
  ],
};

const productionSlide = {
  type: 'clip_production',
  title: 'Free Practice — Production',
  prompt: "Now it's your turn. Answer the questions below in your own words — take your time and be creative.",
  content: [
    'Have you ever played a prank on a friend, family member or coworker? What happened?',
    'Would you enjoy working with a coworker like Jim? Why or why not?',
    "What's the funniest thing that has ever happened to you at work or school?",
    'If you could play a prank on anyone, who would it be and what would you do?',
  ].join('\n'),
};

const wrapupSlide = {
  type: 'wrapup',
  title: "Let's Wrap Up",
  prompt: 'Take a moment to reflect on what we practiced today.',
  content: [
    'Which new word or phrase from today was your favorite?',
    'Which phrasal verb do you want to remember and use this week?',
    "Would you recommend The Office to a friend? Why?",
  ].join('\n'),
};

// ── Main ─────────────────────────────────────────────────────────────

(async () => {
  initAdmin();
  const db = getFirestore();
  const ref = db.collection('movieLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Lesson ${LESSON_ID} not found`);

  const data = snap.data();
  const existing = Array.isArray(data.slides) ? data.slides : [];

  const listening = existing.find(s => s.type === 'clip_dialogue_game');
  const comprehension = existing.find(s => s.type === 'clip_comprehension');
  if (!listening) throw new Error('Existing clip_dialogue_game slide not found — refusing to overwrite');
  if (!comprehension) throw new Error('Existing clip_comprehension slide not found — refusing to overwrite');

  const nextSlides = [
    vocabSlide,
    beforeReadingSlide,
    listening,
    comprehension,
    languageAwarenessSlide,
    controlledPracticeSlide,
    productionSlide,
    wrapupSlide,
  ];

  console.log('Current slides:');
  existing.forEach((s, i) => console.log(`  [${i}] ${s.type}  ${s.title || ''}`));
  console.log('\nProposed slides:');
  nextSlides.forEach((s, i) => console.log(`  [${i}] ${s.type}  ${s.title || ''}`));

  if (DRY_RUN) {
    console.log('\n--dry-run — no write performed.');
    process.exit(0);
  }

  await backupLessonDoc(db, LESSON_ID, 'populate-time-prank-slides');
  await ref.update({ slides: nextSlides });
  console.log('\n✓ Time Prank lesson updated with 6 new slides.');
  process.exit(0);
})().catch(e => { console.error('ERR:', e); process.exit(1); });
