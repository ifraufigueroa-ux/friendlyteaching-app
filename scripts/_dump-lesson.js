const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin } = require('./_lessonBackup');
const fs = require('fs');

const [LESSON_ID, OUT] = process.argv.slice(2);
if (!LESSON_ID) { console.error('Usage: node scripts/_dump-lesson.js <lessonId> <out>'); process.exit(1); }

(async () => {
  initAdmin();
  const snap = await getFirestore().collection('movieLessons').doc(LESSON_ID).get();
  if (!snap.exists) { console.error('not found'); process.exit(1); }
  fs.writeFileSync(OUT, JSON.stringify(snap.data(), null, 2));
  console.log('wrote', OUT);
  process.exit(0);
})();
