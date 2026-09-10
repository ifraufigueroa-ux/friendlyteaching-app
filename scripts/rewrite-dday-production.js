// Rewrites the clip_production of "The Unsung Heroines of D-Day" with 3
// short critical-thinking questions. Each question sets up a two-past-
// events scenario that naturally pulls the student into the past perfect
// (had + past participle), without ever naming the grammar.
//
// v2 — reemplaza el pass anterior con ángulos nuevos:
//   Q1 · curriculum / meta-cognición  ("what was missing from the textbooks")
//   Q2 · ética personal              ("could you keep a secret for 50 years?")
//   Q3 · transferencia a su país     ("who back home had done something similar?")
//
// Backup label bumped a v2 para no sobreescribir el snapshot pre-v1.
//
// Usage: node scripts/rewrite-dday-production.js

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const LESSON_ID = 'SwuIDrEAh9iuEyAhdz8l';

// 3 cards. Format matches ClipPredictionsSlide parser: "• Label — Question"
// Past-perfect triggers used (implicit, never stated):
//   Q1 → "had already left" / "had been left out"      (curriculum framing)
//   Q2 → "had signed" / "hadn't broken"                (personal ethics)
//   Q3 → "had done" / "had made"                       (transfer to own country)
const CONTENT_LINES = [
  "• Missing from the textbooks — For decades, British schoolbooks didn't include these women. By the time their story finally appeared in class, thousands of students had already left school without ever knowing it. Think back: what else do you feel had been left out of the history you were taught?",
  "• A promise kept for 50 years — These women had signed an official secrecy pledge as teenagers, and many kept it their whole lives — even from their husbands and children. Would you have kept a promise like that? Why do you think most of them hadn't broken their silence, even after the war was over?",
  "• Closer to home — Think about your own country's history. Who had done important work — before you were born, or before your parents were born — that people only started to talk about recently? What do you think had made their story invisible for so long?",
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

  await backupLessonDoc(db, LESSON_ID, 'pre-production-rewrite-critical-thinking-v2');

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
