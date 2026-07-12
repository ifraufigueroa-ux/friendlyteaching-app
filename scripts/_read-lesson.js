const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin } = require('./_lessonBackup');

const [LESSON_ID, COLLECTION = 'musicLessons'] = process.argv.slice(2);
if (!LESSON_ID) { console.error('Usage: node scripts/_read-lesson.js <lessonId> [collection]'); process.exit(1); }

(async () => {
  initAdmin();
  const snap = await getFirestore().collection(COLLECTION).doc(LESSON_ID).get();
  if (!snap.exists) { console.error('not found'); process.exit(1); }
  const d = snap.data();
  console.log('song.syncOffsetSeconds:', d.song?.syncOffsetSeconds);
  (d.slides || []).forEach((s, i) => {
    if (s.songData) console.log(i, s.type, 'songData.syncOffsetSeconds:', s.songData.syncOffsetSeconds);
  });
  process.exit(0);
})();
