const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin } = require('./_lessonBackup');
initAdmin();
const db = getFirestore();

const LESSON_ID = 'SwuIDrEAh9iuEyAhdz8l';

(async () => {
  const snap = await db.collection('movieLessons').doc(LESSON_ID).get();
  const d = snap.data();
  const production = (d.slides || []).find(s => s.type === 'clip_production');
  const languageFocus = (d.slides || []).find(s => s.type === 'clip_language_focus' || s.type === 'language_focus');
  console.log('title:', d.title);
  console.log('language_focus:', JSON.stringify(languageFocus, null, 2));
  console.log('----');
  console.log('clip_production:', JSON.stringify(production, null, 2));
  process.exit(0);
})();
