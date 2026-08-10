// FriendlyTeaching.cl — Read the production + language_focus slides of
// AI2027 Part 1/2 so we know which grammar to weave into the new bullets.
const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin } = require('./_lessonBackup');
initAdmin();
const db = getFirestore();
const LESSON_ID = 'o1MIyhVForfaxeUcPlL0';

(async () => {
  const snap = await db.collection('movieLessons').doc(LESSON_ID).get();
  if (!snap.exists) { console.log('not found'); process.exit(1); }
  const slides = snap.data().slides ?? [];
  const lf = slides.find(s => s?.type === 'clip_language_focus');
  const pr = slides.find(s => s?.type === 'clip_production');
  console.log('language_focus:');
  console.log('  title:    ', lf?.title);
  console.log('  subtitle: ', lf?.subtitle);
  console.log('\nproduction:');
  console.log('  title:  ', pr?.title);
  console.log('  prompt: ', pr?.prompt);
  console.log('  content:');
  console.log(pr?.content);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
