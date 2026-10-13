// FriendlyTeaching.cl — Update ya aplicado sobre los dos clones B2 de
// AI2027 (Part 1 → sd1LzWGgpYK6GoSSv5j4, Part 2 → jTniEfzcunclhXh8v9Z0):
//
//   1) Agrega una 7ª pregunta de comprehension pensada para B2
//      (inferencia, no sólo recall).
//   2) Reescribe el clip_production: 3 preguntas más simples y directas,
//      cada una diseñada para que el estudiante use la estructura
//      lingüística aprendida (Part 1 → modales de predicción, Part 2 →
//      Mixed Conditional) IMPLÍCITAMENTE, sin que el prompt la nombre.
//
// Hace backup del doc antes de escribir.
//
// Uso: node scripts/update-ai2027-b2-q7-and-production.js

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const PART1_ID = 'sd1LzWGgpYK6GoSSv5j4';
const PART2_ID = 'jTniEfzcunclhXh8v9Z0';

// ─── Part 1 — Q7 (modal verbs for prediction topic) ───────────────────
// Inferencia sobre lo que el PÚBLICO entiende cuando OpenBrain anuncia
// AGI (combina "lite version" + "blissfully unaware").
const PART1_Q7 = {
  question: 'When OpenBrain announces that AGI has been reached, what does the general public actually understand?',
  options: [
    { id: 'q6o0', text: 'They are given only a "lite" version and remain blissfully unaware of how smart Agent-3 really is.', isCorrect: true  },
    { id: 'q6o1', text: 'They realise immediately that Agent-3 is far more capable than any human expert.',                   isCorrect: false },
    { id: 'q6o2', text: 'They believe AGI has been reached by DeepCent, not OpenBrain.',                                      isCorrect: false },
    { id: 'q6o3', text: 'They march in the streets demanding OpenBrain pause development.',                                   isCorrect: false },
  ],
  correctAnswer: 'They are given only a "lite" version and remain blissfully unaware of how smart Agent-3 really is.',
};

// Simpler production — each card is a direct question whose natural
// answer pulls a modal of prediction (will / might / could / is likely
// to / is bound to / is unlikely to) without the prompt ever naming
// the grammar. Topic stays glued to AI2027.
const PART1_PRODUCTION_PROMPT = 'Three quick questions. Answer the one that pulls you in — or all three.';
const PART1_PRODUCTION_CONTENT = [
  "• Five years from now — What is one way AI will change your daily life?",
  "• AGI tomorrow — Imagine OpenBrain really announces AGI next week. What happens first in your country?",
  "• Your take — A friend asks you if the AI2027 scenario could actually happen. What do you tell them?",
].join('\n');

// ─── Part 2 — Q7 (Mixed Conditional topic) ────────────────────────────
// Testa el analogía de los driverless cars que los críticos usan contra
// AI2027.
const PART2_Q7 = {
  question: 'Why do critics bring up driverless cars when discussing AI2027?',
  options: [
    { id: 'q6o0', text: 'Because driverless cars were predicted to be everywhere by now, but their real-world impact is still small.', isCorrect: true  },
    { id: 'q6o1', text: 'Because driverless cars prove AI is actually advancing faster than researchers expected.',                     isCorrect: false },
    { id: 'q6o2', text: 'Because driverless cars are the first thing Agent-5 is predicted to redesign.',                                 isCorrect: false },
    { id: 'q6o3', text: 'Because driverless cars were secretly built by DeepCent as part of the AI2027 scenario.',                       isCorrect: false },
  ],
  correctAnswer: 'Because driverless cars were predicted to be everywhere by now, but their real-world impact is still small.',
};

// Simpler production — each card is a direct question whose natural
// answer pulls a Mixed Conditional (past condition → present result,
// or present condition → past result). The grammar is NEVER named.
const PART2_PRODUCTION_PROMPT = 'Three quick questions. Answer the one that pulls you in — or all three.';
const PART2_PRODUCTION_CONTENT = [
  "• Rewind — Which decision in the scenario would you undo? What would be different today?",
  "• A different OpenBrain — If the company had listened to its safety team, where would we be right now?",
  "• Your own 2026 — Think of one choice you made last year. How would your life be different today if you had chosen the opposite?",
].join('\n');

// ─── runner ───────────────────────────────────────────────────────────

async function patchLesson(db, id, { q7, prodPrompt, prodContent, tag }) {
  const ref  = db.collection('movieLessons').doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Lesson ${id} not found`);
  const data = snap.data();
  const slides = Array.isArray(data.slides) ? [...data.slides] : [];

  const compIdx = slides.findIndex(s => s?.type === 'clip_comprehension');
  if (compIdx < 0) throw new Error(`No clip_comprehension slide on ${id}`);
  const prodIdx = slides.findIndex(s => s?.type === 'clip_production');
  if (prodIdx < 0) throw new Error(`No clip_production slide on ${id}`);

  await backupLessonDoc(db, id, tag);

  // Append Q7 (guard against double-apply).
  const comp = { ...slides[compIdx] };
  const questions = Array.isArray(comp.questions) ? comp.questions.slice() : [];
  const alreadyThere = questions.some(q => q?.question === q7.question);
  if (!alreadyThere) {
    questions.push(q7);
    console.log(`  ✓ added Q${questions.length}: ${q7.question}`);
  } else {
    console.log('  = Q7 already present, skipping append');
  }
  comp.questions = questions;
  slides[compIdx] = comp;

  // Replace production slide prompt + content.
  slides[prodIdx] = { ...slides[prodIdx], prompt: prodPrompt, content: prodContent };
  console.log('  ✓ production rewritten (3 cards)');

  await ref.update({ slides });
}

(async () => {
  initAdmin();
  const db = getFirestore();

  console.log('\n== Patching AI2027 Part 1 B2 ==');
  await patchLesson(db, PART1_ID, {
    q7: PART1_Q7,
    prodPrompt: PART1_PRODUCTION_PROMPT,
    prodContent: PART1_PRODUCTION_CONTENT,
    tag: 'pre-q7-and-production-simplify',
  });

  console.log('\n== Patching AI2027 Part 2 B2 ==');
  await patchLesson(db, PART2_ID, {
    q7: PART2_Q7,
    prodPrompt: PART2_PRODUCTION_PROMPT,
    prodContent: PART2_PRODUCTION_CONTENT,
    tag: 'pre-q7-and-production-simplify',
  });

  console.log('\nDone.\n');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
