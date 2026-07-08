// Read-only: dump every dialogue line of Time Prank with its baked timing
// so we can identify the exact line index for a shift.
const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin } = require('./_lessonBackup');

const LESSON_ID = 'tZl9Y5N4BRiCnXRMPRoj';

(async () => {
  initAdmin();
  const db = getFirestore();
  const snap = await db.collection('movieLessons').doc(LESSON_ID).get();
  if (!snap.exists) { console.error('not found'); process.exit(1); }
  const data = snap.data();
  const game = (data.slides ?? []).find(s => s.type === 'clip_dialogue_game');
  if (!game || !game.clipData) { console.error('no clip_dialogue_game'); process.exit(1); }
  const dialogue = String(game.clipData.dialogue ?? '');
  const timings  = Array.isArray(game.clipData.timings) ? game.clipData.timings : [];
  const lines = dialogue.split('\n');
  console.log(`Lines: ${lines.length}, timings: ${timings.length}\n`);
  lines.forEach((l, i) => {
    const t = timings[i];
    const mm = Math.floor(t / 60), ss = (t % 60).toFixed(1).padStart(4, '0');
    console.log(`  [${String(i).padStart(2)}] ${mm}:${ss} (${t}) — ${l}`);
  });
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
