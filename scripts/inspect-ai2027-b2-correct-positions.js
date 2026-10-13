// Confirma la queja: ¿dónde cae el isCorrect:true en cada Q de los dos
// drafts B2? Un solo scan para ver la distribución.
const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin } = require('./_lessonBackup');
initAdmin();
const db = getFirestore();

const IDS = [
  { id: 'sd1LzWGgpYK6GoSSv5j4', label: 'Part 1 B2' },
  { id: 'jTniEfzcunclhXh8v9Z0', label: 'Part 2 B2' },
];

(async () => {
  for (const { id, label } of IDS) {
    const snap = await db.collection('movieLessons').doc(id).get();
    const slides = snap.data()?.slides ?? [];
    const comp = slides.find(s => s?.type === 'clip_comprehension');
    console.log(`\n${label} (${id})`);
    (comp?.questions ?? []).forEach((q, i) => {
      const idx = (q.options ?? []).findIndex(o => o.isCorrect);
      console.log(`  Q${i+1}: correct at index ${idx} (${['A','B','C','D'][idx]})`);
    });
  }
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
