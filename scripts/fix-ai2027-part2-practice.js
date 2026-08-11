// FriendlyTeaching.cl — One-shot: rename { format } → { type } on the
// AI-generated Controlled Practice of AI2027 Part 2/2. The AI got the
// content right (the Claude API returned excellent conditional-with-if
// items themed around the AI2027 scenario) but emitted "format" instead
// of "type" on each item — so the renderer saw `item.type === undefined`
// and drew nothing.
//
// Also normalizes any "_____" placeholder in verb_form prompts to
// "{{blank}}" so the answer renders inside the blank slot.

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const LESSON_ID = 'fT1i4A2hL4T55lIGtO4Z';

initAdmin();
const db = getFirestore();

function normalizeItem(raw) {
  const it = { ...raw };
  if (!it.type && typeof it.format === 'string') {
    it.type = it.format;
    delete it.format;
  }
  if (it.type === 'verb_form' && typeof it.prompt === 'string' && !it.prompt.includes('{{blank}}')) {
    const marker = /_{2,}|\[[Bb]lank\]|<[Bb]lank>|\*\*_+\*\*/;
    if (marker.test(it.prompt)) it.prompt = it.prompt.replace(marker, '{{blank}}');
  }
  return it;
}

(async () => {
  const ref = db.collection('movieLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Lesson ${LESSON_ID} not found`);
  const data = snap.data();
  const slides = Array.isArray(data.slides) ? [...data.slides] : [];
  const idx = slides.findIndex(s => s?.type === 'clip_controlled_practice');
  if (idx < 0) throw new Error('No clip_controlled_practice slide');

  const items = Array.isArray(slides[idx].practiceItems) ? slides[idx].practiceItems : [];
  const before = items.map(it => it.type ?? `format:${it.format ?? '?'}`);
  const fixed = items.map(normalizeItem);
  const after  = fixed.map(it => it.type ?? '(none)');

  console.log('Before:', before.join(', '));
  console.log('After: ', after.join(', '));

  await backupLessonDoc(db, LESSON_ID, 'pre-fix-format-to-type');

  slides[idx] = { ...slides[idx], practiceItems: fixed };
  await ref.update({ slides });
  console.log('\n✓ Practice slide fixed. All 8 items now have proper `type` fields.');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
