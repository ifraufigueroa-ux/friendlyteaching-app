// FriendlyTeaching.cl — One-shot: restore the previous Key vocabulary
// list for AI2027 Part 1/2 (the one that included 'wiped out' and
// 'superintelligence'). Only touches the clip_vocab_match slide.

const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const LESSON_ID = 'o1MIyhVForfaxeUcPlL0';
const SNAPSHOT  = path.join(__dirname, 'lesson-snapshots', LESSON_ID,
  '2026-08-12T23-51-49-476Z--pre-restore-teacher-comprehension.json');

initAdmin();
const db = getFirestore();

(async () => {
  const original = require(SNAPSHOT).data;
  const originalVocab = original.slides.find(s => s?.type === 'clip_vocab_match');
  if (!originalVocab) throw new Error('Snapshot has no vocab_match slide');

  console.log(`Restoring ${originalVocab.words?.length ?? 0} vocab items:`);
  (originalVocab.words || []).forEach((w, i) => console.log(`  ${i+1}. ${w.word}`));

  const ref  = db.collection('movieLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Lesson ${LESSON_ID} not found`);
  const data   = snap.data();
  const slides = Array.isArray(data.slides) ? [...data.slides] : [];

  await backupLessonDoc(db, LESSON_ID, 'pre-restore-vocab');

  const idx = slides.findIndex(s => s?.type === 'clip_vocab_match');
  if (idx < 0) throw new Error('No clip_vocab_match slide on the live doc');
  slides[idx] = originalVocab;
  console.log(`\n✓ Replaced vocab_match at index ${idx}`);

  await ref.update({ slides });
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
