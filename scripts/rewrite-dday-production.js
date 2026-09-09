// Rewrites the clip_production of "The Unsung Heroines of D-Day" with 3
// short critical-thinking questions. Each question sets up a two-past-
// events scenario that naturally pulls the student into the past perfect
// (had + past participle), without ever naming the grammar.
//
// Usage: node scripts/rewrite-dday-production.js

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const LESSON_ID = 'SwuIDrEAh9iuEyAhdz8l';

// 3 cards. Format matches ClipPredictionsSlide parser: "• Label — Question"
// Past-perfect triggers used (implicit, never stated):
//   Q1 → "had already done" / "had worked" (background action before recognition)
//   Q2 → "had stayed hidden" / "had been kept" (past perfect passive over decades)
//   Q3 → "had changed" / "hadn't changed" (scaffolded in the prompt itself)
const CONTENT_LINES = [
  "• Silent contributions — Think of someone in your family or community whose work was only appreciated years later. What had they already done long before anyone thanked them for it?",
  "• The long silence — The clip says these women's story was kept quiet for decades. Why do you think it had stayed hidden for so long before it was finally told?",
  "• One year later — Imagine you meet Ena in 1946, a year after the war. What do you think had changed in her life by then — and what still hadn't?",
];

const NEW_PROMPT = 'Three questions to think aloud with. Pick the one that pulls you in — or answer all three.';

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

  console.log('✓ Rewrote clip_production for The Unsung Heroines of D-Day');
  console.log('  prompt:', NEW_PROMPT);
  console.log('  cards :', CONTENT_LINES.length);
  process.exit(0);
})();
