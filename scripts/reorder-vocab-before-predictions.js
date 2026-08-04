// FriendlyTeaching.cl — Migrate movieLessons so clip_vocab_match precedes clip_predictions.
//
// Historically the deck generator emitted [cover, predictions, vocab, ...]. As
// of commit cf483cd it emits [cover, vocab, predictions, ...] because vocab
// gives students the language they need for richer predictions. This script
// migrates any existing lesson stuck in the old order.
//
// Usage:
//   node scripts/reorder-vocab-before-predictions.js            # dry run (default)
//   node scripts/reorder-vocab-before-predictions.js --apply    # write changes
//
// For every lesson with predictionsIdx < vocabIdx we:
//   1. Snapshot the doc via backupLessonDoc().
//   2. Swap slides[predictionsIdx] ↔ slides[vocabIdx].
//   3. Write the updated slides array back.
//
// Idempotent: lessons already in the new order (or missing either slide) are
// skipped.

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const APPLY = process.argv.includes('--apply');

initAdmin();
const db = getFirestore();

(async () => {
  const snap = await db.collection('movieLessons').get();
  console.log(`Scanning ${snap.size} movieLessons doc(s)…\n`);

  let toMigrate = 0;
  let alreadyOk = 0;
  let missingOne = 0;
  const migrated = [];

  for (const doc of snap.docs) {
    const data   = doc.data();
    const slides = Array.isArray(data.slides) ? [...data.slides] : [];
    const predIdx  = slides.findIndex(s => s?.type === 'clip_predictions');
    const vocabIdx = slides.findIndex(s => s?.type === 'clip_vocab_match');

    if (predIdx < 0 || vocabIdx < 0) {
      missingOne++;
      const title = data.title || '(untitled)';
      const types = slides.map(s => s?.type ?? '?').join(',');
      console.log(`  · skip ${doc.id} — "${title}"  pred=${predIdx} vocab=${vocabIdx}  [${types}]`);
      continue;
    }
    if (vocabIdx < predIdx) {
      alreadyOk++;
      continue;
    }
    // Old order — vocab is after predictions. Swap them in place.
    toMigrate++;
    const title = data.title || '(untitled)';
    console.log(`• ${doc.id} — "${title}"  pred@${predIdx} ↔ vocab@${vocabIdx}`);

    if (!APPLY) continue;

    await backupLessonDoc(db, doc.id, 'pre-vocab-before-predictions');
    const tmp = slides[predIdx];
    slides[predIdx]  = slides[vocabIdx];
    slides[vocabIdx] = tmp;
    await doc.ref.update({ slides });
    migrated.push(doc.id);
    console.log(`  ↳ updated slides array`);
  }

  console.log('\n──── Summary ────');
  console.log(`already in new order : ${alreadyOk}`);
  console.log(`missing pred or vocab: ${missingOne}`);
  console.log(`needing migration    : ${toMigrate}`);
  if (APPLY) {
    console.log(`migrated             : ${migrated.length}`);
  } else {
    console.log(`\n(dry run — pass --apply to actually write)`);
  }
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
