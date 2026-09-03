// Reemplaza la slide clip_production de Bot Farms con un set de
// preguntas conversacionales (warm-up + opinions/reactions) estilo
// screenshot del profe. Deja la anterior en snapshot antes de escribir.
//
// Usage: node scripts/rewrite-bot-farms-production.js

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const LESSON_ID = 'GskpRCzaMNzPTDKCsCgu';

// 6 preguntas — 3 warm-up + 3 opinions. Formato "Title — question" para
// que ClipPredictionsSlide las parsee en tarjetas con label arriba +
// pregunta debajo.
const CONTENT_LINES = [
  // Warm-up & Personal Experience
  '• Warm-up · Your feed — Do you use social media every day? Which app do you use the most?',
  '• Warm-up · Spot the bot — Have you ever seen a fake profile or a bot on Instagram, TikTok, or X? How did you know it was fake?',
  '• Warm-up · Buying by hype — Have you ever bought something because you saw a lot of good comments or likes on it?',
  // Opinions & Reactions
  '• Opinion · The traffic stat — The video says most internet traffic is not human. Does this surprise you, or did you already expect it?',
  '• Opinion · Perfect vs real — Do you prefer things that look handmade and imperfect, or things that look 100% perfect and clean? Why?',
  '• Opinion · Online argument — Have you ever had an argument with a stranger online? Did you change your mind, or did it feel like a waste of time?',
];

const NEW_PROMPT = 'Pick the question that speaks to you — or answer any two. Talk from your own life.';

(async () => {
  initAdmin();
  const db = getFirestore();
  const ref = db.collection('movieLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) { console.error('Lesson not found:', LESSON_ID); process.exit(1); }
  const data = snap.data();
  const slides = data.slides || [];

  await backupLessonDoc(db, LESSON_ID, 'pre-production-rewrite-conversational');

  const existingProduction = slides.find((s) => s.type === 'clip_production');
  if (!existingProduction) { console.error('No clip_production slide found'); process.exit(1); }

  const newProduction = {
    ...existingProduction,
    type: 'clip_production',
    title: 'Over to you',
    phase: 'post',
    prompt: NEW_PROMPT,
    content: CONTENT_LINES.join('\n'),
  };

  const updatedSlides = slides.map((s) =>
    s.type === 'clip_production' ? newProduction : s,
  );

  await ref.update({ slides: updatedSlides });
  console.log('✓ Rewrote clip_production for Bot Farms');
  console.log('  prompt:', NEW_PROMPT);
  console.log('  cards :', CONTENT_LINES.length);
  process.exit(0);
})();
