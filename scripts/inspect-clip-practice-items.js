// Dump the practiceItems + comprehension of a movieLessons doc.
// Usage: node scripts/inspect-clip-practice-items.js <lessonId>
const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin } = require('./_lessonBackup');
initAdmin();
const db = getFirestore();
const id = process.argv[2];
if (!id) { console.error('Usage: node scripts/inspect-clip-practice-items.js <lessonId>'); process.exit(1); }

(async () => {
  const snap = await db.collection('movieLessons').doc(id).get();
  if (!snap.exists) { console.log('not found'); process.exit(1); }
  const slides = snap.data().slides ?? [];
  console.log(`${slides.length} slides — types: ${slides.map(s => s?.type).join(', ')}\n`);
  const p = slides.find(s => s?.type === 'clip_controlled_practice');
  if (p) {
    console.log(`Practice: title="${p.title}" subtitle="${p.subtitle}"`);
    console.log(`Items: ${p.practiceItems?.length ?? 0}\n`);
    (p.practiceItems || []).forEach((it, i) => {
      console.log(`--- ${i+1}. type=${it.type}`);
      console.log(JSON.stringify(it, null, 2));
    });
  } else {
    console.log('No practice slide.');
  }
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
