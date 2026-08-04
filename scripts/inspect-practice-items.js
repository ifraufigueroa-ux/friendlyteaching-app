// One-shot: dump the language_practice slide of a given textLesson.
// Usage: node scripts/inspect-practice-items.js <lessonId>
const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin } = require('./_lessonBackup');

initAdmin();
const db = getFirestore();

const id = process.argv[2];
if (!id) { console.error('Usage: node scripts/inspect-practice-items.js <lessonId>'); process.exit(1); }

(async () => {
  const snap = await db.collection('textLessons').doc(id).get();
  if (!snap.exists) { console.log('not found'); process.exit(1); }
  const d = snap.data();
  const practice = d.slides?.find(s => s?.type === 'language_practice');
  if (!practice) { console.log('no language_practice slide'); process.exit(0); }
  console.log(`title:    ${practice.title}`);
  console.log(`subtitle: ${practice.subtitle}`);
  console.log(`items:    ${practice.practiceItems?.length ?? 0}`);
  (practice.practiceItems ?? []).forEach((it, i) => {
    console.log(`  ${i + 1}. [${it.type}]  ${it.prompt}`);
    console.log(`     answer: ${it.answer}`);
    if (it.options) console.log(`     options: [${it.options.join(', ')}]`);
    if (it.grammarTopic) console.log(`     grammar: ${it.grammarTopic}`);
  });
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
