// FriendlyTeaching.cl — El clip_dialogue_game de los dos drafts B2 tiene
// la palabra correcta siempre en options[0] (así quedó cuando armé los
// sets de near-homophones). El estudiante aprende a tirar al primer
// botón sin escuchar. Lo repartimos por los 4 slots con un patrón
// cíclico (2,0,3,1,...) que:
//   • evita 3 iguales seguidos
//   • balancea aproximadamente 4 por posición en Part 1 (15 blanks)
//     y 3 por posición en Part 2 (12 blanks)
//   • usa patrones distintos entre Part 1 y Part 2
//
// Nunca toca blanksData[].word (lo que el actor pronuncia). Sólo
// reordena options manteniendo los mismos 4 strings.
//
// Uso: node scripts/update-ai2027-b2-shuffle-game-options.js

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const PART1_ID = 'sd1LzWGgpYK6GoSSv5j4';
const PART2_ID = 'jTniEfzcunclhXh8v9Z0';

const CYCLE_PART1 = [2, 0, 3, 1]; // 15 blanks → distrib 4,4,4,3
const CYCLE_PART2 = [1, 3, 0, 2]; // 12 blanks → distrib 3,3,3,3 (otro patrón)

function moveTo(arr, fromIdx, toIdx) {
  if (fromIdx === toIdx) return arr.slice();
  const out = arr.slice();
  const [item] = out.splice(fromIdx, 1);
  out.splice(toIdx, 0, item);
  return out;
}

async function patchLesson(db, id, { cycle, label }) {
  const ref  = db.collection('movieLessons').doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`Lesson ${id} not found`);
  const data = snap.data();
  const slides = Array.isArray(data.slides) ? [...data.slides] : [];
  const idx = slides.findIndex(s => s?.type === 'clip_dialogue_game');
  if (idx < 0) throw new Error(`No clip_dialogue_game slide on ${id}`);
  const game = { ...slides[idx] };
  const blanks = Array.isArray(game.blanksData) ? game.blanksData : [];

  await backupLessonDoc(db, id, 'pre-shuffle-game-options');

  const distribution = [0, 0, 0, 0];
  game.blanksData = blanks.map((b, i) => {
    const opts = Array.isArray(b.options) ? b.options.slice() : [];
    const correctIdx = opts.findIndex(o => o === b.word);
    if (correctIdx < 0) {
      console.warn(`  ⚠ blank #${i} word="${b.word}" not in options — skipping`);
      return b;
    }
    const target = cycle[i % cycle.length];
    const next = moveTo(opts, correctIdx, target);
    distribution[target]++;
    console.log(`  #${i.toString().padStart(2)} "${b.word}" → slot ${['A','B','C','D'][target]}  [${next.join(' | ')}]`);
    return { ...b, options: next };
  });

  slides[idx] = game;
  await ref.update({ slides });
  console.log(`  distribution: A=${distribution[0]} B=${distribution[1]} C=${distribution[2]} D=${distribution[3]}`);
}

(async () => {
  initAdmin();
  const db = getFirestore();

  console.log('\n== Part 1 B2 — spreading dialogue-game correct across A/B/C/D ==');
  await patchLesson(db, PART1_ID, { cycle: CYCLE_PART1, label: 'Part 1' });

  console.log('\n== Part 2 B2 — spreading dialogue-game correct across A/B/C/D ==');
  await patchLesson(db, PART2_ID, { cycle: CYCLE_PART2, label: 'Part 2' });

  console.log('\nDone.\n');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
