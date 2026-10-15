// Traduce al inglés todo el contenido visible al estudiante en la A2 Pain
// (regla del proyecto: friendlyflix English only):
//   - A2_VOCAB.translation  →  English A2 definitions
//   - LANGUAGE_FOCUS.teacherNotes → inglés (visible en teacher view)
//
// Hace backup antes de escribir.
//
// Usage: node scripts/update-pain-a2-english-definitions.js

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const LESSON_ID = 'AzWWulamRJ1HMdvjjUN9';

const EN_VOCAB = [
  { word: 'peace',       translation: 'a time with no war or fighting',                 pronunciation: '/piːs/',           example: 'What I want is to create peace.' },
  { word: 'hate',        translation: 'a very strong bad feeling for someone',          pronunciation: '/heɪt/',           example: "There's too much hate in this shinobi world." },
  { word: 'kill',        translation: 'to make a person or animal die',                 pronunciation: '/kɪl/',            example: "First, I'm gonna kill you!" },
  { word: 'hurt',        translation: 'to cause pain to someone',                       pronunciation: '/hɜːrt/',          example: 'Hurt my friends...' },
  { word: 'destroy',     translation: 'to break something completely',                  pronunciation: '/dɪˈstrɔɪ/',       example: 'Destroyed my village!' },
  { word: 'future',      translation: 'the time that comes after now',                  pronunciation: '/ˈfjuː.tʃər/',     example: 'I know the past and can foretell our future.' },
  { word: 'past',        translation: 'the time before now',                            pronunciation: '/pæst/',           example: 'I know the past.' },
  { word: 'same',        translation: 'not different; equal',                           pronunciation: '/seɪm/',           example: 'You and I are the same.' },
  { word: 'understand',  translation: 'to know what something means',                   pronunciation: '/ˌʌn.dərˈstænd/',  example: 'Human beings simply cannot understand each other.' },
  { word: 'feel',        translation: 'to have an emotion inside you',                  pronunciation: '/fiːl/',           example: 'Everyone feels the same pain.' },
];

const EN_TEACHER_NOTES =
  'Level A2. Elicit "going to" during the controlled practice and the free production. ' +
  'Mention that "gonna" is the fast-speech reduction of "going to" — but ask students to write and say the full form.';

(async () => {
  initAdmin();
  const db = getFirestore();

  await backupLessonDoc(db, LESSON_ID, 'pre-english-definitions-a2');

  const ref = db.collection('movieLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) { console.error('Lesson not found'); process.exit(1); }
  const data = snap.data();

  const newSlides = data.slides.map(s => {
    if (s.type === 'clip_vocab_match') return { ...s, words: EN_VOCAB };
    if (s.type === 'clip_language_focus') return { ...s, teacherNotes: EN_TEACHER_NOTES };
    return s;
  });

  await ref.update({
    slides: newSlides,
    updatedAt: new Date(),
  });

  console.log('\n✓ English definitions applied to', LESSON_ID);
  EN_VOCAB.forEach(w => console.log(' ', w.word.padEnd(14), '→', w.translation));
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
