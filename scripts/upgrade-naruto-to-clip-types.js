// Rename 4 specific slide types so they render with the gamified
// Friendlyflix Clip* components instead of the legacy/Friendlyrics ones.
// Data shapes are identical between the two — only the `type` field
// changes — so this is a safe rename, no content rewritten.
//
//   vocabulary        →  clip_vocab_match
//   predictions       →  clip_predictions
//   language_focus    →  clip_language_focus
//   language_practice →  clip_controlled_practice
//
//   node scripts/upgrade-naruto-to-clip-types.js
//
// Runs backupLessonDoc() first (via the guard), so the rename is
// fully reversible from scripts/lesson-snapshots/.
const admin = require('firebase-admin');
const fs = require('fs');
const { backupLessonDoc } = require('./_lessonBackup');

const json = fs.readFileSync('C:/Users/UsuarioPC/Downloads/friendly-scheduling-firebase-adminsdk-fbsvc-cb5f5ea061.json', 'utf8');
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(json)) });
const db = admin.firestore();

const LESSON_ID = 'gLtuWtn86IvTKe9U6G90';

const TYPE_UPGRADES = {
  vocabulary:        'clip_vocab_match',
  predictions:       'clip_predictions',
  language_focus:    'clip_language_focus',
  language_practice: 'clip_controlled_practice',
};

(async () => {
  await backupLessonDoc(db, LESSON_ID, 'before-clip-type-upgrade');

  const ref  = db.collection('movieLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) { console.error('✗ Lesson not found'); process.exit(1); }
  const existing = snap.data().slides ?? [];

  const changes = [];
  const next = existing.map(s => {
    const target = TYPE_UPGRADES[s.type];
    if (target) {
      changes.push(`${s.type} → ${target}`);
      return { ...s, type: target };
    }
    return s;
  });

  if (changes.length === 0) {
    console.log('· No upgradable slide types found — nothing to do.');
    process.exit(0);
  }

  await ref.update({
    slides: next,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`✓ Upgraded ${changes.length} slide type(s):`);
  changes.forEach(c => console.log(`   · ${c}`));
  console.log(`\nFinal order:`);
  next.forEach((s, i) => console.log(`  ${String(i + 1).padStart(2, ' ')}. [${s.type.padEnd(28, ' ')}] ${s.title ?? '(no title)'}`));
})().catch(e => { console.error('ERR:', e); process.exit(1); });
