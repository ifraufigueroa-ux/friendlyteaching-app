// FriendlyTeaching.cl — Inspect AI2027 Part 1 and Part 2 to prepare a B2 clone.
// Prints: title, level, vocab, dialogue game blanks + options for each lesson.
const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin } = require('./_lessonBackup');
initAdmin();
const db = getFirestore();

const LESSONS = [
  { id: 'sd1LzWGgpYK6GoSSv5j4', label: 'AI2027 Part 1 B2 (clone)' },
  { id: 'jTniEfzcunclhXh8v9Z0', label: 'AI2027 Part 2 B2 (clone)' },
];

(async () => {
  for (const { id, label } of LESSONS) {
    const snap = await db.collection('movieLessons').doc(id).get();
    if (!snap.exists) { console.log(`\n### ${label} (${id}) — NOT FOUND\n`); continue; }
    const d = snap.data();
    console.log(`\n### ${label} (${id})`);
    console.log(`title: ${d.title}`);
    console.log(`level: ${d.level}`);
    console.log(`publishStatus: ${d.publishStatus}`);
    console.log(`slide types: ${(d.slides || []).map(s => s?.type).join(', ')}`);

    const vocab = (d.slides || []).find(s => s?.type === 'clip_vocab_match');
    if (vocab?.words) {
      console.log(`\nVOCAB (${vocab.words.length}):`);
      vocab.words.forEach((w, i) => console.log(`  ${i+1}. ${w.word}  — ${w.translation}`));
    }

    const game = (d.slides || []).find(s => s?.type === 'clip_dialogue_game');
    if (game) {
      const blanks = game.blanksData || [];
      console.log(`\nDIALOGUE GAME blanks (${blanks.length}):`);
      blanks.forEach((b, i) => {
        console.log(`  #${i} word="${b.word}" options=[${(b.options || []).map(o => `"${o}"`).join(', ')}]`);
      });
      // Also dump a few lines of context for the first blanks
      const dialogue = game.content || game.clipData?.dialogue || '';
      console.log(`\nDIALOGUE preview (first 20 lines):`);
      dialogue.split('\n').slice(0, 20).forEach((ln, i) => console.log(`  L${i}: ${ln}`));
    }

    const comp = (d.slides || []).find(s => s?.type === 'clip_comprehension');
    if (comp?.questions) {
      console.log(`\nCOMPREHENSION (${comp.questions.length} Q):`);
      comp.questions.forEach((q, i) => {
        console.log(`  Q${i+1}: ${q.question}`);
        (q.options || []).forEach(o => console.log(`     - ${o.isCorrect ? '✓' : ' '} ${o.text}`));
      });
    }

    const lf = (d.slides || []).find(s => s?.type === 'clip_language_focus');
    if (lf) console.log(`\nLANGUAGE FOCUS: ${lf.title} / ${lf.subtitle}`);
  }
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
