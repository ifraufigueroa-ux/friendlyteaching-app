// FriendlyTeaching.cl — One-shot: re-inject the teacher-authored comprehension
// slide of AI2027 Part 1/2 into whatever slides array is currently live. The
// TranscriptClipEditor was silently dropping comprehension on save (fix landed
// in the same commit); this restores what got wiped.

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

  console.log(`Teacher-authored questions in snapshot: ${originalComp.questions?.length ?? 0}`);
  (originalComp.questions || []).forEach((q, i) => console.log(`  Q${i+1}: ${q.question}`));

  const ref  = db.collection('movieLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Lesson ${LESSON_ID} not found`);
  const data   = snap.data();
  const slides = Array.isArray(data.slides) ? [...data.slides] : [];

  await backupLessonDoc(db, LESSON_ID, 'pre-restore-comprehension-v2');

  const existing = slides.findIndex(s => s?.type === 'clip_comprehension');
  if (existing >= 0) {
    slides[existing] = originalComp;
    console.log(`\n✓ Replaced existing comprehension at index ${existing}`);
  } else {
    // Slot it right after the dialogue_game slide (CLT order).
    const gameIdx = slides.findIndex(s => s?.type === 'clip_dialogue_game');
    const at = gameIdx >= 0 ? gameIdx + 1 : Math.min(4, slides.length);
    slides.splice(at, 0, originalComp);
    console.log(`\n✓ Inserted comprehension at index ${at} (game was at ${gameIdx})`);
  }

  await ref.update({ slides });
  console.log(`\nFinal slide order:`);
  slides.forEach((s, i) => console.log(`  ${i}: ${s?.type}`));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
