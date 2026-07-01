// One-shot: set English for Devs clip startTime to 0 so the audio plays
// from the very beginning of the video, matching the transcript timings
// array which starts at 1s (line 0 = "From clean code to clear communication…").
//
// Updates: clip.startTime AND every slide.clipData.startTime that mirrors it.
const admin = require('firebase-admin');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const fs = require('fs');
const { backupLessonDoc } = require('./_lessonBackup');

const json = fs.readFileSync('C:/Users/UsuarioPC/Downloads/friendly-scheduling-firebase-adminsdk-fbsvc-cb5f5ea061.json', 'utf8');
admin.initializeApp({ credential: admin.cert(JSON.parse(json)) });
const db = getFirestore();

const LESSON_ID = 'riGpqOqSghZMesGDCTND'; // ESL – English for Devs
const NEW_START = 0;

(async () => {
  await backupLessonDoc(db, LESSON_ID, 'before-set-start-to-zero');
  const ref = db.collection('movieLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) { console.error('Lesson not found'); process.exit(1); }
  const lesson = snap.data();

  console.log('Current clip.startTime =', lesson.clip?.startTime);

  const newClip = { ...lesson.clip, startTime: NEW_START };

  let slidesUpdated = 0;
  const slides = (lesson.slides || []).map((s) => {
    if (s.clipData && typeof s.clipData.startTime === 'number') {
      slidesUpdated++;
      return { ...s, clipData: { ...s.clipData, startTime: NEW_START } };
    }
    return s;
  });

  await ref.update({
    clip: newClip,
    slides,
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log(`Updated clip.startTime → ${NEW_START}`);
  console.log(`Updated ${slidesUpdated} slide(s) with mirrored clipData.startTime`);
})().catch((e) => { console.error('ERR:', e.message); process.exit(1); });
