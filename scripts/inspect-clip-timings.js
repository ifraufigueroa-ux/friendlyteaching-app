// Dump timings + dialogue head so we can eyeball why sync is off.
const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin } = require('./_lessonBackup');
initAdmin();
const db = getFirestore();
const id = process.argv[2];
if (!id) { console.error('Usage: node scripts/inspect-clip-timings.js <lessonId>'); process.exit(1); }

(async () => {
  const snap = await db.collection('movieLessons').doc(id).get();
  if (!snap.exists) { console.log('not found'); process.exit(1); }
  const d = snap.data();
  const clip = d.clip || {};
  console.log('title:      ', d.title);
  console.log('youtubeUrl: ', clip.youtubeUrl);
  console.log('startTime:  ', clip.startTime);
  console.log('endTime:    ', clip.endTime);
  console.log('syncOffset: ', clip.syncOffsetSeconds ?? '(none)');
  const timings = clip.timings ?? [];
  console.log(`timings:     ${timings.length} entries`);
  if (timings.length > 0) {
    console.log('  first 6:', timings.slice(0, 6).map(t => t.toFixed(2)).join(', '));
    console.log('  last 3: ', timings.slice(-3).map(t => t.toFixed(2)).join(', '));
  }

  const lines = (clip.dialogue || '').split('\n');
  console.log(`\ndialogue: ${lines.length} lines total`);
  console.log('  head:');
  lines.slice(0, 12).forEach((l, i) => console.log(`    [${i}] "${l}"`));

  const gs = d.slides?.find(s => s?.type === 'clip_dialogue_game');
  if (gs) {
    console.log('\nclip_dialogue_game slide:');
    console.log('  content head:');
    (gs.content || '').split('\n').slice(0, 8).forEach((l, i) => console.log(`    [${i}] "${l}"`));
    console.log(`  blanksData: ${gs.blanksData?.length ?? 0} blanks`);
    if (gs.blanksData?.length) {
      console.log('  first blank:', JSON.stringify(gs.blanksData[0], null, 2));
    }
  }
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
