// FriendlyTeaching.cl — One-shot: add a comprehension slide to AI2027
// Part 1/2 (movieLessons/o1MIyhVForfaxeUcPlL0). Uses the same 6-anchor
// algorithm the generator ships in clipLessonGenerator.buildComprehensionSlide.
//
// Slot: right after clip_dialogue_game, before clip_language_focus.

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const LESSON_ID = 'o1MIyhVForfaxeUcPlL0';

initAdmin();
const db = getFirestore();

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildComprehensionSlide(dialogue) {
  const rawLines = dialogue
    .split('\n')
    .map(l => l.replace(/\{\{\s*blank\s*\}\}/gi, '').replace(/_{2,}/g, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const lines = rawLines.filter(l => {
    if (/\{\{|\}\}|_{2,}/.test(l)) return false;
    const wc = l.split(/\s+/).length;
    return wc >= 4 && wc <= 22;
  });
  const usable = lines.length >= 4 ? lines : rawLines;
  if (usable.length < 2) return { type: 'clip_comprehension', title: 'Comprehension', phase: 'while', questions: [] };

  function makeQuestion(qText, correctLine, distractors) {
    const opts = shuffle([correctLine, ...distractors.slice(0, 3)]).map((t, i) => ({
      id: `c${i}`,
      text: t,
      isCorrect: t === correctLine,
    }));
    return { question: qText, options: opts, correctAnswer: correctLine };
  }

  const anchorAt = (frac) => usable[Math.max(0, Math.min(usable.length - 1, Math.floor(usable.length * frac)))] ?? usable[0];
  const positions = [0.10, 0.25, 0.40, 0.55, 0.72, 0.88];
  const anchors = [];
  for (const p of positions) {
    const line = anchorAt(p);
    if (!anchors.includes(line)) anchors.push(line);
  }
  const used = new Set(anchors);
  const pool = shuffle(usable.filter(l => !used.has(l)));
  const prompts = [
    'Which line opens the scene?',
    'Which line comes just after the opening?',
    'Which line lands mid-scene?',
    'Which line hits the turning point?',
    'Which line comes near the end?',
    'Which line brings the scene to a close?',
  ];
  const questions = anchors
    .map((line, i) => makeQuestion(prompts[i] ?? 'Which line appears in the scene?', line, pool.slice(i * 3, i * 3 + 3)))
    .filter(q => q.options.length >= 2);

  return { type: 'clip_comprehension', title: 'Comprehension', phase: 'while', questions };
}

(async () => {
  const ref = db.collection('movieLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Lesson ${LESSON_ID} not found`);
  const data = snap.data();
  const slides = Array.isArray(data.slides) ? [...data.slides] : [];

  console.log('Current slide order:');
  slides.forEach((s, i) => console.log(`  ${i}. ${s?.type}`));

  if (slides.some(s => s?.type === 'clip_comprehension')) {
    console.log('\nComprehension slide already present — nothing to do.');
    process.exit(0);
  }

  const dialogue = data.clip?.dialogue;
  if (!dialogue) throw new Error('No dialogue on clip — cannot generate comprehension.');

  const comp = buildComprehensionSlide(dialogue);
  console.log(`\nBuilt comprehension slide with ${comp.questions.length} questions.`);
  comp.questions.forEach((q, i) => {
    console.log(`\n  Q${i + 1}: ${q.question}`);
    console.log(`  correct: "${q.correctAnswer.slice(0, 80)}${q.correctAnswer.length > 80 ? '…' : ''}"`);
  });

  await backupLessonDoc(db, LESSON_ID, 'pre-add-comprehension');

  const gameIdx = slides.findIndex(s => s?.type === 'clip_dialogue_game');
  const insertAt = gameIdx >= 0 ? gameIdx + 1 : Math.min(4, slides.length);
  slides.splice(insertAt, 0, comp);
  await ref.update({ slides });

  console.log('\n✓ Comprehension slide inserted at index', insertAt);
  console.log('New order:');
  slides.forEach((s, i) => console.log(`  ${i}. ${s?.type}`));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
