// FriendlyTeaching.cl — Upgrade The Office · Time Prank clip_vocab_match
// slide to the English-For-Devs style: English definitions in the
// translation field + IPA pronunciation, examples preserved, subtitle
// added. Component and gamification unchanged — data is now richer.
//
// Usage: node scripts/upgrade-time-prank-vocab-match.js [--dry-run]

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const DRY_RUN   = process.argv.includes('--dry-run');
const LESSON_ID = 'tZl9Y5N4BRiCnXRMPRoj'; // The Office — Time Prank

// 10 terms, all fields required — matches ClipVocabMatchSlide contract.
// translation = English definition (this is what the right column shows).
const WORDS = [
  {
    word: 'prank',
    pronunciation: 'præŋk',
    translation: 'a trick played on someone to make people laugh',
    example: "Jim's prank on Dwight was hilarious.",
  },
  {
    word: 'coworker',
    pronunciation: 'ˈkəʊˌwɜː.kər',
    translation: 'a person you work with, especially at the same level',
    example: 'She had lunch with her coworkers.',
  },
  {
    word: 'to mess with',
    pronunciation: 'mes wɪð',
    translation: 'to tease or annoy someone on purpose, usually for fun',
    example: 'Jim loves to mess with Dwight.',
  },
  {
    word: 'to trick',
    pronunciation: 'trɪk',
    translation: 'to make someone believe something that is not true',
    example: 'He tricked his brother into cleaning the room.',
  },
  {
    word: 'to notice',
    pronunciation: 'ˈnəʊ.tɪs',
    translation: 'to see or become aware of something',
    example: "Dwight didn't notice that the clock was wrong.",
  },
  {
    word: 'to pretend',
    pronunciation: 'prɪˈtend',
    translation: 'to behave as if something is true when it is not',
    example: 'Jim pretended it was late in the afternoon.',
  },
  {
    word: 'annoying',
    pronunciation: 'əˈnɔɪ.ɪŋ',
    translation: 'making you feel slightly angry or impatient',
    example: 'Dwight can be very annoying in the office.',
  },
  {
    word: 'boring',
    pronunciation: 'ˈbɔː.rɪŋ',
    translation: 'not interesting or exciting in any way',
    example: 'Office work can be boring sometimes.',
  },
  {
    word: 'boss',
    pronunciation: 'bɒs',
    translation: 'the person who is in charge of a company or team',
    example: 'Michael is the boss of the branch.',
  },
  {
    word: 'to figure out',
    pronunciation: 'ˈfɪɡ.ər aʊt',
    translation: 'to understand something after thinking about it',
    example: 'It took Dwight a while to figure out the prank.',
  },
];

(async () => {
  initAdmin();
  const db = getFirestore();

  const ref  = db.collection('movieLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) { console.error(`✗ ${LESSON_ID} not found`); process.exit(1); }
  const data = snap.data();
  const slides = Array.isArray(data.slides) ? data.slides : [];

  const idx = slides.findIndex(s => s.type === 'clip_vocab_match');
  if (idx < 0) { console.error('No clip_vocab_match slide found'); process.exit(1); }

  const nextSlide = {
    ...slides[idx],
    subtitle: 'Tap each card to reveal the meaning. You will hear these in the video.',
    words: WORDS,
  };

  console.log(`\n${LESSON_ID} — ${data.title}`);
  console.log(`slide[${idx}] (clip_vocab_match): upgrading ${slides[idx].words.length} words → ${WORDS.length}`);
  console.log('First 3 samples:');
  WORDS.slice(0, 3).forEach((w, j) => {
    console.log(`  [${j}] ${w.word} /${w.pronunciation}/`);
    console.log(`      def: ${w.translation}`);
    console.log(`      ex:  ${w.example}`);
  });

  if (DRY_RUN) { console.log('\n--dry-run — no writes.'); process.exit(0); }

  await backupLessonDoc(db, LESSON_ID, 'upgrade-vocab-match-to-en-ipa');
  const nextSlides = slides.map((s, i) => i === idx ? nextSlide : s);
  await ref.update({ slides: nextSlides });
  console.log('\n✓ Vocab match upgraded (EN + IPA + subtitle).');
  process.exit(0);
})().catch(e => { console.error('ERR:', e); process.exit(1); });
