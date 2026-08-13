// FriendlyTeaching.cl — Peek at the current comprehension slide of AI2027 Part 1/2.
const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin } = require('./_lessonBackup');
initAdmin();
const db = getFirestore();
const LESSON_ID = 'o1MIyhVForfaxeUcPlL0';

(async () => {
  const snap = await db.collection('movieLessons').doc(LESSON_ID).get();
  if (!snap.exists) { console.log('not found'); process.exit(1); }
  const slides = snap.data().slides ?? [];
  const comp = slides.find(s => s?.type === 'clip_comprehension');
  if (!comp) { console.log('NO clip_comprehension slide'); process.exit(0); }
  console.log(`comprehension has ${comp.questions?.length ?? 0} questions`);
  console.log('First question preview:');
  console.log(JSON.stringify(comp.questions?.[0] ?? null, null, 2));
  console.log('\nAll question stems:');
  (comp.questions || []).forEach((q, i) => console.log(`  Q${i+1}: ${q.question}`));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
