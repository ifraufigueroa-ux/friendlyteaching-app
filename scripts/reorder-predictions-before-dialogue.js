// FriendlyTeaching.cl — Migrate movieLessons so predictions sits BEFORE
// the teacher-authored dialogue_game + comprehension pair.
//
// Old TranscriptClipEditor spliced the game + quiz right after
// vocab_match, which left predictions stuck at the end of the pre-
// viewing block:
//   cover → vocab → dialogue_game → comprehension → predictions → …
// The CLT intent is that the student predicts BEFORE watching, so the
// correct order is:
//   cover → vocab → predictions → dialogue_game → comprehension → …
//
// Usage:
//   node scripts/reorder-predictions-before-dialogue.js            # dry run
//   node scripts/reorder-predictions-before-dialogue.js --apply    # write
//
// For every lesson where predictions sits AFTER dialogue_game (or the
// legacy lyrics_game) or comprehension we:
//   1. Snapshot the doc via backupLessonDoc().
//   2. Remove predictions from its current index.
//   3. Re-insert predictions right after vocab_match (or at the
//      earliest suitable spot before any teacher-authored slide).
//
// Idempotent: lessons already in the new order are skipped.

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
  let noPredictions = 0;
  const migrated = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    const slides = Array.isArray(data.slides) ? [...data.slides] : [];
    const predIdx = slides.findIndex(s => s?.type === 'clip_predictions');
    const gameIdx = slides.findIndex(
      s => s?.type === 'clip_dialogue_game' || s?.type === 'lyrics_game',
    );
    const compIdx = slides.findIndex(s => s?.type === 'clip_comprehension');

    if (predIdx < 0) { noPredictions++; continue; }

    const wrongOrder =
      (gameIdx >= 0 && gameIdx < predIdx) ||
      (compIdx >= 0 && compIdx < predIdx);

    if (!wrongOrder) { alreadyOk++; continue; }

    // Reorder: pull predictions out, re-insert right after the last
    // pre-viewing generator slide (vocab_match) — or after cover if
    // vocab is missing, or at index 0 as last resort.
    const vocabIdx = slides.findIndex(s => s?.type === 'clip_vocab_match');
    const coverIdx = slides.findIndex(s => s?.type === 'clip_cover');
    const anchor   = vocabIdx >= 0 ? vocabIdx : coverIdx >= 0 ? coverIdx : -1;

    toMigrate++;
    const title = data.title || '(untitled)';
    console.log(`• ${doc.id} — "${title}"  pred@${predIdx}  game@${gameIdx}  comp@${compIdx}  anchor@${anchor}`);

    if (!APPLY) continue;

    await backupLessonDoc(db, doc.id, 'pre-predictions-before-dialogue');
    const [prediction] = slides.splice(predIdx, 1);
    // Recompute anchor index because we just spliced a slide out.
    const newAnchor = anchor < predIdx ? anchor : anchor - 1;
    slides.splice(newAnchor + 1, 0, prediction);
    await doc.ref.update({ slides });
    migrated.push(doc.id);
    console.log(`  ↳ moved predictions to index ${newAnchor + 1}`);
  }

  console.log('\n──── Summary ────');
  console.log(`already in new order : ${alreadyOk}`);
  console.log(`missing predictions  : ${noPredictions}`);
  console.log(`needing migration    : ${toMigrate}`);
  if (APPLY) console.log(`migrated             : ${migrated.length}`);
  else       console.log(`\n(dry run — pass --apply to actually write)`);
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
