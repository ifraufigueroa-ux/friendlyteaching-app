// Read-only diagnostic: prints the shape of a movieLessons doc so we
// can see exactly what slides are stored. Does NOT mutate anything.
//
//   node scripts/inspect-lesson.js <lessonId>
const { initAdmin } = require('./_lessonBackup');

const [, , lessonId] = process.argv;
if (!lessonId) {
  console.error('Usage: node scripts/inspect-lesson.js <lessonId>');
  process.exit(1);
}

(async () => {
  const admin = initAdmin();
  const db = admin.firestore();
  try {
    const snap = await db.collection('movieLessons').doc(lessonId).get();
    if (!snap.exists) {
      console.error(`✗ Lesson ${lessonId} does not exist`);
      process.exit(1);
    }
    const data = snap.data();
    console.log(`── ${data.title ?? '(untitled)'} ─────────────────────────`);
    console.log(`Level     : ${data.level ?? '—'}`);
    console.log(`Clip      : ${data.clip?.source ?? '?'} · ${data.clip?.title ?? '?'}`);
    console.log(`YouTube   : ${data.clip?.youtubeUrl ?? '—'}`);
    console.log(`Slides    : ${(data.slides ?? []).length}`);
    console.log('');
    (data.slides ?? []).forEach((s, i) => {
      const title = s.title ?? '(no title)';
      console.log(`  ${String(i + 1).padStart(2, ' ')}. [${s.type.padEnd(28, ' ')}] ${title}`);
    });
    console.log('');
    // Quick CLT-presence sanity check.
    const types = new Set((data.slides ?? []).map(s => s.type));
    const expected = ['cover', 'clip_vocab_match', 'clip_predictions', 'clip_dialogue_game',
                      'clip_comprehension', 'clip_language_focus', 'clip_controlled_practice'];
    const missing  = expected.filter(t => !types.has(t));
    if (missing.length === 0) {
      console.log('✓ Full CLT structure present.');
    } else {
      console.log(`⚠ Missing CLT stages: ${missing.join(', ')}`);
    }
    // Also surface the vocab fields if present, to confirm distractors.
    const game = (data.slides ?? []).find(s => s.type === 'clip_dialogue_game');
    if (game && Array.isArray(game.blanksData)) {
      console.log(`\n── Dialogue game blanks (${game.blanksData.length}) ──`);
      game.blanksData.forEach((b, i) => {
        console.log(`  ${String(i + 1).padStart(2, ' ')}. ${b.word.padEnd(12, ' ')} → [${(b.options ?? []).join(', ')}]`);
      });
    }
  } catch (e) {
    console.error('✗', e.message);
    process.exit(1);
  }
  process.exit(0);
})();
