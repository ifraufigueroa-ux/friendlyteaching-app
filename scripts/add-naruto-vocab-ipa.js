// Add IPA pronunciations to the vocab slide of Pain's Cycle of Hatred.
//
// The Clip vocab match slide reads `slide.words[].pronunciation` and
// renders it as /…/ under each word. The blueprint used during the
// CLT restore did not carry IPA, so this one-shot script merges in
// IPA values for each known target word without touching anything
// else (translation, example, word, distractors all preserved).
//
//   node scripts/add-naruto-vocab-ipa.js
//
// Runs backupLessonDoc() first via the guard, so reversible.
const admin = require('firebase-admin');
const fs = require('fs');
const { backupLessonDoc } = require('./_lessonBackup');

const json = fs.readFileSync('C:/Users/UsuarioPC/Downloads/friendly-scheduling-firebase-adminsdk-fbsvc-cb5f5ea061.json', 'utf8');
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(json)) });
const db = admin.firestore();

const LESSON_ID = 'gLtuWtn86IvTKe9U6G90';

// British-English IPA following the same dot-syllable style used in
// scripts/naruto-cefr-vocab.js. Keyed by lower-case lemma so it
// matches regardless of capitalisation in the stored word.
const IPA = {
  vengeance:  'ˈven.dʒəns',
  hatred:     'ˈheɪ.trɪd',
  cycle:      'ˈsaɪ.kəl',
  harmony:    'ˈhɑː.mə.ni',
  foretell:   'fɔːˈtel',
  preach:     'priːtʃ',
  confront:   'kənˈfrʌnt',
  entrust:    'ɪnˈtrʌst',
  vicious:    'ˈvɪʃ.əs',
  fate:       'feɪt',
  // Extras in case the user later swaps the word list:
  fulfill:    'fʊlˈfɪl',
  trigger:    'ˈtrɪɡ.ər',
  peace:      'piːs',
  justice:    'ˈdʒʌs.tɪs',
  break:      'breɪk',
  world:      'wɜːld',
  suffered:   'ˈsʌf.əd',
  hidden:     'ˈhɪd.ən',
  starved:    'stɑːvd',
  waste:      'weɪst',
  barely:     'ˈbeə.li',
  seeking:    'ˈsiː.kɪŋ',
  envisioned: 'ɪnˈvɪʒ.ənd',
  delivered:  'dɪˈlɪv.əd',
  driven:     'ˈdrɪv.ən',
  quite:      'kwaɪt',
};

(async () => {
  await backupLessonDoc(db, LESSON_ID, 'before-add-vocab-ipa');

  const ref  = db.collection('movieLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) { console.error('✗ Lesson not found'); process.exit(1); }
  const slides = snap.data().slides ?? [];

  const vocabIdx = slides.findIndex(s =>
    s.type === 'clip_vocab_match' || s.type === 'vocabulary',
  );
  if (vocabIdx < 0) {
    console.error('✗ No vocab slide found in this lesson.');
    process.exit(1);
  }
  const vocab = slides[vocabIdx];
  if (!Array.isArray(vocab.words) || vocab.words.length === 0) {
    console.error('✗ Vocab slide has no words array.');
    process.exit(1);
  }

  const added   = [];
  const missing = [];
  const kept    = [];

  const nextWords = vocab.words.map(w => {
    if (w.pronunciation) {
      kept.push(`${w.word} (already had /${w.pronunciation}/)`);
      return w;
    }
    const ipa = IPA[String(w.word ?? '').toLowerCase()];
    if (ipa) {
      added.push(`${w.word} → /${ipa}/`);
      return { ...w, pronunciation: ipa };
    }
    missing.push(w.word);
    return w;
  });

  const nextSlides = slides.slice();
  nextSlides[vocabIdx] = { ...vocab, words: nextWords };

  await ref.update({
    slides: nextSlides,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`✓ Vocab slide updated.`);
  if (added.length)   console.log(`  Added IPA (${added.length}):\n    ${added.join('\n    ')}`);
  if (kept.length)    console.log(`  Already had IPA (${kept.length}):\n    ${kept.join('\n    ')}`);
  if (missing.length) console.log(`  ⚠ No IPA entry in lookup (${missing.length}): ${missing.join(', ')}\n    (Add them to the IPA map and re-run, or set them by hand in the editor.)`);
})().catch(e => { console.error('ERR:', e); process.exit(1); });
