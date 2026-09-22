// FriendlyTeaching.cl — Trim the Fire Drill production prompts to 1-2 tight
// sentences per card. Same 3 titles, same implicit nudge toward modals of
// deduction (could / must / can't be) — just fewer words on screen.

const { initAdmin, backupLessonDoc } = require('./_lessonBackup');
const { getFirestore } = require('firebase-admin/firestore');

const LESSON_ID = '66cq9MCLdxD3B3wZqaez';

const NEW_CONTENT = [
  "Read the Room — You walked in and something felt off. What did you think was going on?",
  "The Overreaction — Someone made a small thing huge. What was really behind it?",
  "Steal a Line — Pick one line from the scene. Where would you drop it this week?",
].join('\n');

const NEW_PROMPT = 'The chaos is over — your turn.';

(async () => {
  initAdmin();
  const db = getFirestore();

  await backupLessonDoc(db, LESSON_ID, 'pre-tighten-production');

  const ref  = db.collection('movieLessons').doc(LESSON_ID);
  const snap = await ref.get();
  const data = snap.data();
  const slides = [...data.slides];
  const prodIdx = slides.findIndex(s => s.type === 'clip_production');
  if (prodIdx < 0) throw new Error('No clip_production slide');

  slides[prodIdx] = {
    ...slides[prodIdx],
    content: NEW_CONTENT,
    prompt:  NEW_PROMPT,
  };

  await ref.update({ slides });
  console.log('✓ Production prompts tightened.');
  process.exit(0);
})().catch(err => { console.error('✗', err); process.exit(1); });
