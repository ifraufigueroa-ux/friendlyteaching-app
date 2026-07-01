// One-shot: bump English for Devs clip startTime from 43 → 46 so the audio
// begins on the first line of the standup dialogue ("All right, team.
// Let's kick off our daily standup...") instead of 3 seconds early.
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
const OLD_START = 43;
const NEW_START = 46;

(async () => {
  await backupLessonDoc(db, LESSON_ID, 'before-bump-start-time');
  const ref = db.collection('movieLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) { console.error('Lesson not found'); process.exit(1); }
  const lesson = snap.data();

  const currentStart = lesson.clip?.startTime;
  console.log('Current clip.startTime =', currentStart);
  if (currentStart !== OLD_START) {
    console.warn(`Expected startTime=${OLD_START}, got ${currentStart}. Proceeding anyway.`);
  }

  const newClip = { ...lesson.clip, startTime: NEW_START };

  // Mirror the bump into every slide that keeps its own clipData snapshot.
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
