// Reescribe el slide de comprehension de la lección A2
// (Naruto – Pain's Cycle of Hatred, movieLessons/AzWWulamRJ1HMdvjjUN9):
//   - Preguntas y opciones más simples (A2 real)
//   - Correcta NO siempre la opción más larga
//   - Posiciones de la correcta variadas (no siempre la misma letra)
//
// Hace backup antes de escribir (regla del proyecto).
//
// Usage: node scripts/update-pain-a2-comprehension.js

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const LESSON_ID = 'AzWWulamRJ1HMdvjjUN9';

// Posiciones de la correcta por pregunta: [2, 0, 3, 1, 0] — distribuidas
// entre las 4 letras. Longitudes diseñadas para que la correcta NO sea
// nunca la más larga (en varias es incluso la más corta).
const A2_COMPREHENSION_QUESTIONS = [
  {
    question: 'What does Pain want?',
    options: [
      { id: 'q0o0', text: 'To be a famous ninja',       isCorrect: false },
      { id: 'q0o1', text: 'To find his old friends',    isCorrect: false },
      { id: 'q0o2', text: 'Peace and justice',          isCorrect: true  },
      { id: 'q0o3', text: "To kill Naruto's friends",   isCorrect: false },
    ],
    correctAnswer: 'Peace and justice',
  },
  {
    question: "Who killed Naruto's master?",
    options: [
      { id: 'q1o0', text: 'Pain',    isCorrect: true  },
      { id: 'q1o1', text: 'Jiraiya', isCorrect: false },
      { id: 'q1o2', text: 'Naruto',  isCorrect: false },
      { id: 'q1o3', text: 'Sasuke',  isCorrect: false },
    ],
    correctAnswer: 'Pain',
  },
  {
    question: 'What is Naruto going to do?',
    options: [
      { id: 'q2o0', text: 'Join Pain forever',                    isCorrect: false },
      { id: 'q2o1', text: 'Leave the Leaf for new lands',         isCorrect: false },
      { id: 'q2o2', text: 'Look for his old teacher Jiraiya',     isCorrect: false },
      { id: 'q2o3', text: 'Fight Pain',                           isCorrect: true  },
    ],
    correctAnswer: 'Fight Pain',
  },
  {
    question: 'Why is Pain angry at the Leaf village?',
    options: [
      { id: 'q3o0', text: 'Because he hates every ninja in the world',    isCorrect: false },
      { id: 'q3o1', text: 'The Leaf hurt his family',                     isCorrect: true  },
      { id: 'q3o2', text: 'Because Naruto is too young to understand',    isCorrect: false },
      { id: 'q3o3', text: "He really wants Naruto's power",               isCorrect: false },
    ],
    correctAnswer: 'The Leaf hurt his family',
  },
  {
    question: 'What did Jiraiya want?',
    options: [
      { id: 'q4o0', text: 'Less hate',                     isCorrect: true  },
      { id: 'q4o1', text: 'To be the best ninja',          isCorrect: false },
      { id: 'q4o2', text: 'To fight with Pain',            isCorrect: false },
      { id: 'q4o3', text: 'To leave the Leaf for good',    isCorrect: false },
    ],
    correctAnswer: 'Less hate',
  },
];

// Sanity-check: ninguna correcta debe ser la opción más larga, y las
// posiciones de la correcta no deben ser todas la misma letra.
function auditQuestions(qs) {
  const correctPositions = [];
  qs.forEach((q, qi) => {
    const correctIdx = q.options.findIndex(o => o.isCorrect);
    correctPositions.push(correctIdx);
    const maxLen = Math.max(...q.options.map(o => o.text.length));
    const correctLen = q.options[correctIdx].text.length;
    if (correctLen === maxLen) {
      // No es un error fatal si hay empate, pero avisamos si es
      // ESTRICTAMENTE la más larga.
      const strictLongest =
        q.options.filter(o => o.text.length === maxLen).length === 1;
      if (strictLongest) {
        throw new Error(
          `Q${qi + 1}: correct answer is strictly the longest option (${correctLen} chars). Fix lengths.`
        );
      }
    }
  });
  const uniquePositions = new Set(correctPositions);
  if (uniquePositions.size === 1) {
    throw new Error(
      `All correct answers share position ${correctPositions[0]}. Spread them.`
    );
  }
  console.log('  correct positions :', correctPositions.join(', '));
  console.log('  unique positions  :', [...uniquePositions].sort().join(', '));
}

(async () => {
  initAdmin();
  const db = getFirestore();

  auditQuestions(A2_COMPREHENSION_QUESTIONS);

  await backupLessonDoc(db, LESSON_ID, 'pre-simplify-comprehension-a2');

  const ref = db.collection('movieLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) { console.error('Lesson not found'); process.exit(1); }
  const data = snap.data();

  const newSlides = data.slides.map(s =>
    s.type === 'clip_comprehension'
      ? { ...s, questions: A2_COMPREHENSION_QUESTIONS }
      : s
  );

  await ref.update({
    slides: newSlides,
    updatedAt: new Date(),
  });

  console.log('\n✓ Updated comprehension for', LESSON_ID);
  console.log('  questions :', A2_COMPREHENSION_QUESTIONS.length);
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
