// FriendlyTeaching.cl — One-shot: shorten the clip_predictions questions
// on the AI2027 Part 1/2 movie lesson (movieLessons/o1MIyhVForfaxeUcPlL0).
//
// The current questions are too wordy for B1+ students. Replace them with
// shorter, punchier prompts that use the "Title — question" format so the
// FriendlyFlix theme renders a clean label instead of the generic
// "Question N" fallback.

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const LESSON_ID = 'o1MIyhVForfaxeUcPlL0';

const NEW_QUESTIONS = [
  "The Vibe — What tone do you expect from a BBC piece called 'Could AI eliminate humans in 10 years?' — hopeful, scary, or somewhere in between?",
  "AI Gone Wrong — Name a film or news story where AI got out of control. Why did it stick with you?",
  "A Personal Moment — When did technology make a task so easy that you wondered if human skill still mattered?",
];

initAdmin();
const db = getFirestore();

(async () => {
  const ref  = db.collection('movieLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Lesson ${LESSON_ID} not found`);
  const data = snap.data();

  const slides = Array.isArray(data.slides) ? [...data.slides] : [];
  const idx = slides.findIndex(s => s?.type === 'clip_predictions');
  if (idx < 0) throw new Error('No clip_predictions slide in this lesson');

  console.log('Current content:');
  console.log(slides[idx].content);
  console.log('\nNew content:');
  const newContent = NEW_QUESTIONS.map(q => `• ${q}`).join('\n');
  console.log(newContent);

  await backupLessonDoc(db, LESSON_ID, 'pre-simplify-part1-predictions');

  slides[idx] = { ...slides[idx], content: newContent };
  await ref.update({ slides });
  console.log('\n✓ Predictions slide updated.');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
