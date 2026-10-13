// FriendlyTeaching.cl — Las respuestas correctas de clip_comprehension
// quedaron amontonadas en la misma posición (sobre todo Part 2: 5 de 7
// en B). Esto repartimos deliberadamente por A/B/C/D para que la
// posición deje de ser una pista. Mueve el option con isCorrect:true al
// índice destino en cada pregunta y re-ID-a los options en orden
// (q{Qidx}o{Oidx}). Idempotente: si la correcta ya está en la posición
// destino, no hace nada.
//
// Uso: node scripts/update-ai2027-b2-shuffle-correct.js

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const PART1_ID = 'sd1LzWGgpYK6GoSSv5j4';
const PART2_ID = 'jTniEfzcunclhXh8v9Z0';

// Distribuciones balanceadas por 7 preguntas, 4 posiciones cada una.
// Cada letra aparece 1-2 veces, nunca 3 seguidas, y los dos sets
// difieren para que un prof no vea el mismo patrón en Part 1 y Part 2.
const PART1_TARGETS = [2, 0, 3, 1, 3, 2, 0]; // Q1..Q7 → C A D B D C A
const PART2_TARGETS = [3, 0, 2, 1, 0, 3, 2]; // Q1..Q7 → D A C B A D C

function moveCorrectTo(options, targetIdx, qIdx) {
  const correctIdx = options.findIndex(o => o?.isCorrect);
  if (correctIdx < 0) throw new Error(`Q${qIdx+1}: no option has isCorrect:true`);
  const reordered = options.slice();
  if (correctIdx !== targetIdx) {
    const [correctOpt] = reordered.splice(correctIdx, 1);
    reordered.splice(targetIdx, 0, correctOpt);
  }
  // Reasignar los ids en orden posicional: q{Q}o0..q{Q}o3
  return reordered.map((o, i) => ({ ...o, id: `q${qIdx}o${i}` }));
}

async function patchLesson(db, id, { targets, label }) {
  const ref  = db.collection('movieLessons').doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Lesson ${id} not found`);
  const data = snap.data();
  const slides = Array.isArray(data.slides) ? [...data.slides] : [];
  const idx = slides.findIndex(s => s?.type === 'clip_comprehension');
  if (idx < 0) throw new Error(`No clip_comprehension slide on ${id}`);
  const comp = { ...slides[idx] };
  const questions = Array.isArray(comp.questions) ? comp.questions.slice() : [];
  if (questions.length !== targets.length) {
    throw new Error(`Mismatch: ${label} has ${questions.length} questions, targets has ${targets.length}`);
  }

  await backupLessonDoc(db, id, 'pre-shuffle-correct-positions');

  const letters = ['A','B','C','D'];
  comp.questions = questions.map((q, qi) => {
    const options = Array.isArray(q.options) ? q.options : [];
    const newOptions = moveCorrectTo(options, targets[qi], qi);
    const correctAnswer = newOptions[targets[qi]]?.text ?? q.correctAnswer;
    console.log(`  Q${qi+1}: correct → ${letters[targets[qi]]}  (${correctAnswer.slice(0, 60)}${correctAnswer.length > 60 ? '…' : ''})`);
    return { ...q, options: newOptions, correctAnswer };
  });
  slides[idx] = comp;
  await ref.update({ slides });
}

(async () => {
  initAdmin();
  const db = getFirestore();

  console.log('\n== Part 1 B2 — redistributing correct positions ==');
  await patchLesson(db, PART1_ID, { targets: PART1_TARGETS, label: 'Part 1' });

  console.log('\n== Part 2 B2 — redistributing correct positions ==');
  await patchLesson(db, PART2_ID, { targets: PART2_TARGETS, label: 'Part 2' });

  console.log('\nDone.\n');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
