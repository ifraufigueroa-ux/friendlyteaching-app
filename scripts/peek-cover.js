// One-shot: dump the first slide of a movie lesson so we can copy the
// cover shape (subtitle/content/imageUrl conventions).
const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin } = require('./_lessonBackup');

const NARUTO_ID = process.argv[2];
if (!NARUTO_ID) { console.error('Usage: node peek-cover.js <lessonId>'); process.exit(1); }

(async () => {
  initAdmin();
  const db = getFirestore();
  const snap = await db.collection('movieLessons').doc(NARUTO_ID).get();
  const d = snap.data();
  console.log('lesson.title:', d.title);
  console.log('lesson.level:', d.level);
  console.log('lesson.clip:', JSON.stringify(d.clip, null, 2));
  console.log('slides[0]:', JSON.stringify(d.slides[0], null, 2));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
