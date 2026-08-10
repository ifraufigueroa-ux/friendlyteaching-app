// Show current controlled_practice subtitle and language_focus title
// for every movieLessons doc, so we know what to preserve.
const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin } = require('./_lessonBackup');
initAdmin();
const db = getFirestore();
(async () => {
  const snap = await db.collection('movieLessons').get();
  snap.forEach(doc => {
    const d = doc.data();
    const cp = d.slides?.find(s => s?.type === 'clip_controlled_practice');
    const lf = d.slides?.find(s => s?.type === 'clip_language_focus');
    console.log('─'.repeat(70));
    console.log(`${doc.id} — ${d.title}`);
    console.log(`  practice.subtitle : ${cp?.subtitle ?? '(none)'}`);
    console.log(`  language.title    : ${lf?.title ?? '(none)'}`);
  });
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
