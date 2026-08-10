// FriendlyTeaching.cl — One-shot: shorten the clip_production questions
// on the AI2027 Part 1/2 movie lesson (movieLessons/o1MIyhVForfaxeUcPlL0)
// and weave the grammar focus (will vs present continuous for prediction)
// into the middle bullet.
//
// Companion to simplify-ai2027-part1-predictions.js (already applied for
// the Predictions slide). Snapshots the full doc before writing.

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const LESSON_ID = 'o1MIyhVForfaxeUcPlL0';

const NEW_PROMPT = "Now you have seen the AI2027 scenario — over to you.";
const NEW_BULLETS = [
  "The Moment — Which moment made you most uneasy? Why?",
  "In Your Life — Predict a moment where AI could change your life. Try using will / present continuous for prediction.",
  "Steal It — Pick one line ('blissfully unaware' or 'breakneck pace'). When could you use it?",
];

initAdmin();
const db = getFirestore();

(async () => {
  const ref  = db.collection('movieLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Lesson ${LESSON_ID} not found`);
  const data = snap.data();

  const slides = Array.isArray(data.slides) ? [...data.slides] : [];
  const idx = slides.findIndex(s => s?.type === 'clip_production');
  if (idx < 0) throw new Error('No clip_production slide in this lesson');

  console.log('Current prompt:');
  console.log(' ', slides[idx].prompt);
  console.log('\nCurrent content:');
  console.log(slides[idx].content);
  const newContent = NEW_BULLETS.map(b => `• ${b}`).join('\n');
  console.log('\nNew prompt:');
  console.log(' ', NEW_PROMPT);
  console.log('\nNew content:');
  console.log(newContent);

  await backupLessonDoc(db, LESSON_ID, 'pre-simplify-part1-production');

  slides[idx] = {
    ...slides[idx],
    prompt:  NEW_PROMPT,
    content: newContent,
  };
  await ref.update({ slides });
  console.log('\n✓ Free Production slide updated.');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
