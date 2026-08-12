// FriendlyTeaching.cl — One-shot: restore the teacher-authored
// comprehension of AI2027 Part 1/2 from the pre-regen-practice-v2
// snapshot. Replaces whatever comprehension is currently on the doc.

const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const LESSON_ID = 'o1MIyhVForfaxeUcPlL0';
const SNAPSHOT  = path.join(__dirname, 'lesson-snapshots', LESSON_ID,
  '2026-08-11T01-06-53-424Z--pre-regen-practice-v2.json');

initAdmin();
const db = getFirestore();

(async () => {
  const original = require(SNAPSHOT).data;
  const originalComp = original.slides.find(s => s?.type === 'clip_comprehension');
  if (!originalComp) throw new Error('Snapshot has no comprehension slide');

  console.log(`Restoring ${originalComp.questions?.length ?? 0} teacher-authored questions:`);
  (originalComp.questions || []).forEach((q, i) => {
    console.log(`  Q${i+1}: ${q.question}`);
  });

  const ref = db.collection('movieLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Lesson ${LESSON_ID} not found`);
  const data = snap.data();
  const slides = Array.isArray(data.slides) ? [...data.slides] : [];

  await backupLessonDoc(db, LESSON_ID, 'pre-restore-teacher-comprehension');

  const idx = slides.findIndex(s => s?.type === 'clip_comprehension');
  if (idx >= 0) {
    slides[idx] = originalComp;
    console.log(`\n✓ Replaced comprehension at index ${idx}`);
  } else {
    const gameIdx = slides.findIndex(s => s?.type === 'clip_dialogue_game');
    const at = gameIdx >= 0 ? gameIdx + 1 : 4;
    slides.splice(at, 0, originalComp);
    console.log(`\n✓ Inserted comprehension at index ${at}`);
  }
  await ref.update({ slides });
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
