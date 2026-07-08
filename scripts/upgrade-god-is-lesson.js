// FriendlyTeaching.cl — Upgrade "God Is" by Kanye West (musicLessons)
// to the Friendlyflix gamified format for the post-listening stages.
//
// What changes:
//   slide[4] listening_quiz    → clip_comprehension    (real lyric-based Qs)
//   slide[5] language_focus    → clip_language_focus   (imagery, repetition,
//                                                       colloquial contractions)
//   slide[6] language_practice → clip_controlled_practice (unscramble +
//                                                          match_halves rooted
//                                                          in the actual lines)
//   slide[7] translation_game  → clip_production        (personal reflection)
//
// Slides preserved as-is: 0 song_cover, 1 vocab_match, 2 predictions,
// 3 lyrics_game, 8 wrapup, 9 friendlyrics_end.
//
// Usage: node scripts/upgrade-god-is-lesson.js [--dry-run]

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const DRY_RUN   = process.argv.includes('--dry-run');
const LESSON_ID = 'a69NE3OKQ9lfVl7KJnJq'; // God Is — Kanye West
const COLLECTION = 'musicLessons';

// ── Slide 4 — Comprehension (Friendlyflix flip-card style) ──────────────
// Questions test meaning + imagery of the lyrics, not just line-matching.

const comprehensionSlide = {
  type: 'clip_comprehension',
  title: 'Comprehension',
  questions: [
    {
      question: "What does the singer promise he will 'never' do?",
      options: [
        { id: 'q0o0', text: 'Turn back',           isCorrect: true  },
        { id: 'q0o1', text: 'Sing this song again', isCorrect: false },
        { id: 'q0o2', text: 'Forget his fans',      isCorrect: false },
        { id: 'q0o3', text: 'Return to church',     isCorrect: false },
      ],
      correctAnswer: 'Turn back',
    },
    {
      question: "In the line 'He's the strength in this race that I run', what does 'this race' stand for?",
      options: [
        { id: 'q1o0', text: 'A track competition',    isCorrect: false },
        { id: 'q1o1', text: "The singer's life",       isCorrect: true  },
        { id: 'q1o2', text: 'A musical rivalry',       isCorrect: false },
        { id: 'q1o3', text: 'The Sunday Service tour', isCorrect: false },
      ],
      correctAnswer: "The singer's life",
    },
    {
      question: "Who does the song say is welcome 'through the door'?",
      options: [
        { id: 'q2o0', text: 'Only the rich',            isCorrect: false },
        { id: 'q2o1', text: 'Only the poor',            isCorrect: false },
        { id: 'q2o2', text: 'From the rich to the poor', isCorrect: true },
        { id: 'q2o3', text: 'Only true believers',      isCorrect: false },
      ],
      correctAnswer: 'From the rich to the poor',
    },
    {
      question: "According to the lyrics, what happens 'when you call on Jesus' name'?",
      options: [
        { id: 'q3o0', text: 'You will get rich',           isCorrect: false },
        { id: 'q3o1', text: "You won't ever be the same",  isCorrect: true  },
        { id: 'q3o2', text: 'You will forget your past',   isCorrect: false },
        { id: 'q3o3', text: 'You will find a job',         isCorrect: false },
      ],
      correctAnswer: "You won't ever be the same",
    },
    {
      question: "The line 'This ain't 'bout a dead religion, Jesus brought a revolution' contrasts religion with what?",
      options: [
        { id: 'q4o0', text: 'A revolution', isCorrect: true  },
        { id: 'q4o1', text: 'A war',        isCorrect: false },
        { id: 'q4o2', text: 'A book',       isCorrect: false },
        { id: 'q4o3', text: 'A tradition',  isCorrect: false },
      ],
      correctAnswer: 'A revolution',
    },
  ],
};

// ── Slide 5 — Language Focus (rooted in the actual lyric devices) ───────
// Three high-value features you can hear in the song:
//   1. Metaphor for spiritual experience  (light in darkness / race /
//      force that picked me up / fountain that filled my cup)
//   2. Anaphora — repeating "I know…" and "This my…" for testimony
//   3. Colloquial contractions common in hip-hop lyrics
//      ('em, 'bout, ain't)

const languageFocusSlide = {
  type: 'clip_language_focus',
  title: 'Language Focus — Imagery, Repetition & Contractions',
  content: [
    'Kanye writes his testimony using three tools you can hear all over "God Is". Spotting them will help you understand hip-hop, gospel and spoken English in general.',
    '• Metaphor — physical images stand for spiritual experiences (light = hope, race = life, fountain = renewal).',
    '• Anaphora — starting several lines with the same words ("I know…", "This my…") to build emotional weight.',
    "• Colloquial contractions — 'em (them), 'bout (about) and ain't (isn't / aren't) are common in songs and casual speech, not in formal writing.",
    'Read each example and notice what the writer really means, not just the literal words.',
  ].join('\n'),
  words: [
    {
      word: 'My light in darkness, oh',
      translation: '',
      example: 'Metaphor: "light" = hope / God; "darkness" = fear or struggle. Not literal light.',
    },
    {
      word: "He's the strength in this race that I run",
      translation: '',
      example: 'Metaphor: life is compared to a long race — endurance, effort, a finish line.',
    },
    {
      word: 'I know God is the force that picked me up / I know Christ is the fountain that filled my cup',
      translation: '',
      example: 'Anaphora: both lines start with "I know" for testimony emphasis. Also two metaphors: force lifting + fountain filling.',
    },
    {
      word: "This my kids, this the crib, this my wife, this my life",
      translation: '',
      example: 'Anaphora: "This my…" repeats four times. In casual/hip-hop English the verb "is" is often dropped ("this [is] my life").',
    },
    {
      word: "All my idols, let 'em go / All the demons, let 'em know",
      translation: '',
      example: "'em = them (colloquial contraction). Common in spoken English and songs — never in academic writing.",
    },
    {
      word: "This ain't 'bout a dead religion",
      translation: '',
      example: "ain't = isn't / aren't; 'bout = about. Two contractions in five words — very informal, very typical of hip-hop.",
    },
  ],
};

// ── Slide 6 — Controlled Practice (unscramble + match_halves) ───────────
// Uses actual lines from the song so students recognise them.

const controlledPracticeSlide = {
  type: 'clip_controlled_practice',
  title: 'Controlled Practice',
  practiceItems: [
    {
      type: 'unscramble',
      prompt: 'My / light / in / darkness, / oh',
      answer: 'My light in darkness, oh',
    },
    {
      type: 'unscramble',
      prompt: 'God / is / the / force / that / picked / me / up',
      answer: 'God is the force that picked me up',
    },
    {
      type: 'unscramble',
      prompt: "You / won't / ever / be / the / same",
      answer: "You won't ever be the same",
    },
    {
      type: 'match_halves',
      prompt: 'King of Kings,',
      answer: 'Lord of Lords',
      options: [
        'Lord of Lords',
        'strength of stones',
        'end of days',
        'light of the world',
      ],
    },
    {
      type: 'match_halves',
      prompt: 'All my idols,',
      answer: "let 'em go",
      options: [
        "let 'em go",
        "call 'em back",
        'hold them close',
        'keep them safe',
      ],
    },
    {
      type: 'match_halves',
      prompt: 'This a mission,',
      answer: 'not a show',
      options: [
        'not a show',
        'not a game',
        'not a chance',
        'not a joke',
      ],
    },
  ],
};

// ── Slide 7 — Production (open, personal reflection) ────────────────────

const productionSlide = {
  type: 'clip_production',
  title: 'Free Practice — Production',
  prompt: "Now it's your turn. Answer in your own words — take your time and be honest.",
  content: [
    "Kanye repeats 'I know' many times. Is there something in your life you feel absolutely certain about? What is it, and why?",
    "The song says 'You won't ever be the same when you call on Jesus' name'. Have you ever had an experience that changed you completely — spiritual, personal or something else?",
    'Kanye lists what matters to him: "This my kids, this the crib, this my wife, this my life". If you had to write a similar line about YOUR life, what four things would you include?',
    "In one sentence, what do you think Kanye is really saying in this song?",
  ].join('\n'),
};

// ── Main ────────────────────────────────────────────────────────────────

(async () => {
  initAdmin();
  const db = getFirestore();
  const ref = db.collection(COLLECTION).doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) { console.error(`✗ ${COLLECTION}/${LESSON_ID} not found`); process.exit(1); }
  const data = snap.data();
  const slides = Array.isArray(data.slides) ? data.slides : [];

  // Replace by index: 4→comprehension, 5→language_focus,
  // 6→controlled_practice, 7→production. Preserve everything else.
  const REPLACEMENTS = {
    4: comprehensionSlide,
    5: languageFocusSlide,
    6: controlledPracticeSlide,
    7: productionSlide,
  };

  const nextSlides = slides.map((s, i) => REPLACEMENTS[i] ?? s);

  console.log(`\n${LESSON_ID} — ${data.song?.title} · ${data.song?.artist}`);
  console.log('Current slides:');
  slides.forEach((s, i) => console.log(`  [${i}] ${s.type.padEnd(24)}  ${s.title || ''}`));
  console.log('\nProposed slides:');
  nextSlides.forEach((s, i) => {
    const changed = REPLACEMENTS[i] ? '  ← REPLACED' : '';
    console.log(`  [${i}] ${s.type.padEnd(24)}  ${s.title || ''}${changed}`);
  });

  if (DRY_RUN) { console.log('\n--dry-run — no writes.'); process.exit(0); }

  await backupLessonDoc(db, LESSON_ID, 'upgrade-post-listening-to-friendlyflix-style', COLLECTION);
  await ref.update({ slides: nextSlides });
  console.log('\n✓ God Is post-listening slides upgraded to Friendlyflix style.');
  process.exit(0);
})().catch(e => { console.error('ERR:', e); process.exit(1); });
