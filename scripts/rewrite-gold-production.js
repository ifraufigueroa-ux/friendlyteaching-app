// Rewrites the clip_production of "Gold is amazing... or not?" with 3
// short critical-thinking questions. Each question describes a scenario
// that naturally pulls the student toward passive constructions
// (is/was + past participle) without ever asking for the grammar by name.
//
// Usage: node scripts/rewrite-gold-production.js

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const LESSON_ID = 'RmJrFOXh6zQfIeLz3Pgu';

// 3 cards. Format matches ClipPredictionsSlide parser:
//   "• Label — Question"
// Passive triggers used (implicit, never stated):
//   Q1 → "is treated" / "is seen" (present passive, cultural framing)
//   Q2 → "would be affected" / "was opened" (past + conditional passive)
//   Q3 → "is replaced" / "could be chosen" / "are judged" (present + modal passive)
const CONTENT_LINES = [
  '• Culture check — In your country, what everyday object is treated as more valuable than it really is? Why do you think it is seen that way?',
  '• Hometown scenario — The clip shows that gold has been fought over for centuries. If a big gold mine was opened near your city today, what would probably be affected?',
  '• A world without gold — Imagine gold is one day replaced by another material as the symbol of wealth. What could be chosen in its place, and how would people be judged differently?',
];

const NEW_PROMPT = 'Three questions to think aloud with. Take the one that pulls you in — or answer all three.';

(async () => {
  initAdmin();
  const db  = getFirestore();
  const ref = db.collection('movieLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) { console.error('Lesson not found:', LESSON_ID); process.exit(1); }
  const data = snap.data();
  const slides = data.slides || [];

  await backupLessonDoc(db, LESSON_ID, 'pre-production-rewrite-critical-thinking');

  const existing = slides.find(s => s.type === 'clip_production');
  if (!existing) { console.error('No clip_production slide found'); process.exit(1); }

  const updated = {
    ...existing,
    type:    'clip_production',
    title:   'Over to you',
    phase:   'post',
    prompt:  NEW_PROMPT,
    content: CONTENT_LINES.join('\n'),
  };

  const updatedSlides = slides.map(s => (s.type === 'clip_production' ? updated : s));
  await ref.update({ slides: updatedSlides });

  console.log('✓ Rewrote clip_production for Gold is amazing... or not?');
  console.log('  prompt:', NEW_PROMPT);
  console.log('  cards :', CONTENT_LINES.length);
  process.exit(0);
})();
