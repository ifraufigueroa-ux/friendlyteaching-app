// FriendlyTeaching.cl — Populate the TMS movieLesson with missing slides.
//
// Preserves the existing clip_dialogue_game (listening) and
// clip_comprehension slides and adds Vocabulary → Before Reading around
// them, then Language Awareness → Controlled Practice → Production →
// Wrap-Up after them. Backs up the current doc before writing.
//
// Usage: node scripts/populate-tms-slides.js
//        node scripts/populate-tms-slides.js --dry-run   (prints diff, no write)

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const LESSON_ID = 'ehLwwdBg6XwBItvSaHqM';
const DRY_RUN = process.argv.includes('--dry-run');

// ── Slide content ────────────────────────────────────────────────────

const vocabSlide = {
  type: 'clip_vocab_match',
  title: 'Vocabulary — Technical Terms',
  words: [
    { word: 'freight',            translation: 'carga / mercancía',      example: 'The freight was delivered ahead of schedule.' },
    { word: 'shipment',           translation: 'envío',                  example: 'Each shipment is tracked in real time.' },
    { word: 'carrier',            translation: 'transportista',          example: 'The carrier reported a delay at the border.' },
    { word: 'fleet',              translation: 'flota',                  example: 'We manage a fleet of over 200 trucks.' },
    { word: 'dispatch',           translation: 'despachar / envío',      example: 'Orders are dispatched within 24 hours.' },
    { word: 'route optimization', translation: 'optimización de rutas',  example: 'TMS software enables route optimization.' },
    { word: 'supply chain',       translation: 'cadena de suministro',   example: 'A resilient supply chain is a competitive advantage.' },
    { word: 'lead time',          translation: 'tiempo de entrega',      example: 'Automation reduces lead time significantly.' },
    { word: 'bottleneck',         translation: 'cuello de botella',      example: 'Customs clearance is often a bottleneck.' },
    { word: 'warehouse',          translation: 'bodega / almacén',       example: 'Goods are stored in a central warehouse.' },
  ],
};

const beforeReadingSlide = {
  type: 'clip_predictions',
  title: 'Before Reading',
  prompt: "Before we dive into today's topic, let's see what you already know.",
  content: [
    'Have you ever heard the term "Transportation Management System" or TMS?',
    'What kind of challenges do you think logistics companies face when moving goods across countries?',
    'In your opinion, how has technology changed the way products reach customers?',
    'What software or apps do you use that involve tracking or delivery?',
  ].join('\n'),
};

const languageAwarenessSlide = {
  type: 'clip_language_focus',
  title: 'Language Awareness — Passive Voice for Processes',
  content: [
    'Notice how the article describes what a TMS does. Business and technical English relies heavily on the passive voice when the process matters more than who performs it.',
    '• is/are + past participle → describes what happens to goods',
    '• modal + be + past participle → describes capability (can be tracked, should be optimized)',
    '• have/has + been + past participle → describes changes and results (costs have been reduced)',
    'Look at the examples below and notice how the focus shifts from the actor to the action itself.',
  ].join('\n'),
  words: [
    { word: 'Shipments are monitored across every stage of the supply chain.', translation: '', example: 'Pattern: is/are + past participle' },
    { word: 'Routes can be optimized based on real-time traffic data.',        translation: '', example: 'Pattern: can be + past participle' },
    { word: 'Delivery times have been reduced significantly since adopting a TMS.', translation: '', example: 'Pattern: have been + past participle' },
  ],
};

const controlledPracticeSlide = {
  type: 'clip_controlled_practice',
  title: 'Controlled Practice',
  practiceItems: [
    {
      type: 'unscramble',
      prompt: 'The company / uses / a TMS / to reduce / operating costs',
      answer: 'The company uses a TMS to reduce operating costs',
    },
    {
      type: 'unscramble',
      prompt: 'Real-time tracking / has / improved / customer satisfaction',
      answer: 'Real-time tracking has improved customer satisfaction',
    },
    {
      type: 'unscramble',
      prompt: 'Shipments / are / dispatched / from / a central warehouse',
      answer: 'Shipments are dispatched from a central warehouse',
    },
    {
      type: 'match_halves',
      prompt: 'The main advantage of route optimization is',
      answer: 'reducing fuel consumption and delivery time.',
      options: [
        'reducing fuel consumption and delivery time.',
        'making the supply chain longer.',
        'increasing warehouse costs.',
        'requiring more manual dispatching.',
      ],
    },
    {
      type: 'match_halves',
      prompt: 'A common bottleneck in international logistics is',
      answer: 'customs clearance at borders.',
      options: [
        'customs clearance at borders.',
        'free real-time tracking.',
        'short lead times.',
        'low fuel prices.',
      ],
    },
  ],
};

const productionSlide = {
  type: 'clip_production',
  title: 'Free Practice — Production',
  prompt: 'Imagine you are the operations manager of a growing e-commerce company. Discuss:',
  content: [
    'Would you invest in a TMS? What benefits would you expect first?',
    'Which features would be non-negotiable for your business?',
    'Describe a time when a delivery went wrong — what could technology have done differently?',
  ].join('\n'),
};

const wrapupSlide = {
  type: 'wrapup',
  title: "Let's Wrap Up",
  prompt: "Let's consolidate what we explored about Transportation Management Systems today.",
  content: [
    'Which piece of vocabulary do you feel most confident using now?',
    'Which grammar pattern do you want to keep practicing this week?',
    'How could a TMS impact daily life for consumers like you?',
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

  // Preserve the existing listening + comprehension slides by type. This
  // is more robust than positional lookup if the array shifts later.
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

  await backupLessonDoc(db, LESSON_ID, 'populate-tms-slides');
  await ref.update({ slides: nextSlides });
  console.log('\n✓ TMS lesson updated with 6 new slides.');
  process.exit(0);
})().catch(e => { console.error('ERR:', e); process.exit(1); });
