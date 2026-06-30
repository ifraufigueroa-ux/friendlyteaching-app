// FriendlyTeaching.cl — Read-only Friendlyflix lesson inspector
// Usage: node scripts/inspect-lesson.js <lessonId>
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const KEY_PATH = 'C:/Users/UsuarioPC/Downloads/friendly-scheduling-firebase-adminsdk-fbsvc-cb5f5ea061.json';
initializeApp({ credential: cert(JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'))) });
const db = getFirestore();

const LESSON_ID = process.argv[2];
if (!LESSON_ID) { console.error('Usage: node scripts/inspect-lesson.js <lessonId>'); process.exit(1); }

(async () => {
  const snap = await db.collection('movieLessons').doc(LESSON_ID).get();
  if (!snap.exists) { console.error(`Lesson ${LESSON_ID} not found`); process.exit(1); }
  const d = snap.data();
  console.log(JSON.stringify(d, null, 2));
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
