// FriendlyTeaching.cl — One-shot: prepend 2 verb_form items to the
// language_practice slide of "The Last Bus to San Pedro". Snapshots the
// full doc first so the change is trivially reversible.
//
// The two items drill Past Perfect vs Past Simple in the tone of the
// story (Detective Rojas + Camila) so students recognise the through-line
// from Language Focus.

const { getFirestore } = require('firebase-admin/firestore');
const fs   = require('fs');
const path = require('path');
const { initAdmin } = require('./_lessonBackup');

const LESSON_ID = 'pWkEupdXGiRLXJnEfJuR';

initAdmin();
const db = getFirestore();

const NEW_ITEMS = [
  {
    type: 'verb_form',
    prompt: 'Detective Rojas discovered that Camila {{blank}} her ticket with cash.',
    answer: 'had bought',
    options: ['bought', 'had bought', 'has bought'],
    grammarTopic: 'Past Perfect vs Past Simple',
    contextLine: 'Detective Rojas discovered that Camila had bought her ticket with cash.',
  },
  {
    type: 'verb_form',
    prompt: 'Before the bus arrived, the suspect {{blank}} all official records.',
    answer: 'had altered',
    options: ['had altered', 'altered', 'was altering'],
    grammarTopic: 'Past Perfect vs Past Simple',
    contextLine: 'Before the bus arrived, the suspect had altered all official records.',
  },
];

(async () => {
  const ref  = db.collection('textLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Lesson ${LESSON_ID} not found`);
  const data = snap.data();

  const slides = Array.isArray(data.slides) ? [...data.slides] : [];
  const idx = slides.findIndex(s => s?.type === 'language_practice');
  if (idx < 0) throw new Error('No language_practice slide in this lesson');

  const existing = Array.isArray(slides[idx].practiceItems) ? slides[idx].practiceItems : [];
  const alreadyThere = existing.some(it => it?.type === 'verb_form');
  if (alreadyThere) {
    console.log('verb_form items already present — nothing to do.');
    process.exit(0);
  }

  // Snapshot before writing.
  const SNAP_ROOT = path.join(__dirname, 'text-lesson-snapshots', LESSON_ID);
  fs.mkdirSync(SNAP_ROOT, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const snapPath = path.join(SNAP_ROOT, `${stamp}--pre-add-verb-form.json`);
  fs.writeFileSync(snapPath, JSON.stringify({
    lessonId:  LESSON_ID,
    capturedAt: new Date().toISOString(),
    note:      'pre-add-verb-form',
    data,
  }, null, 2));
  console.log(`✓ Snapshot: ${path.relative(process.cwd(), snapPath)}`);

  // Prepend the new items so they show up first — they are the recognition
  // rung of the ladder and belong at the top before the productive drills.
  const practiceItems = [...NEW_ITEMS, ...existing];
  slides[idx] = {
    ...slides[idx],
    practiceItems,
    // Also refresh the header copy so the slide reads as "Fix the Timeline".
    title:    'Interactive Practice: Fix the Timeline',
    subtitle: "Choose the correct verb form to complete Detective Rojas's case notes.",
  };
  await ref.update({ slides });

  console.log(`\n✓ Practice slide now has ${practiceItems.length} items:`);
  practiceItems.forEach((it, i) => {
    console.log(`  ${i + 1}. [${it.type}]  ${it.prompt}`);
  });
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
