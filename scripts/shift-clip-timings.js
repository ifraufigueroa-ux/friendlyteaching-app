// FriendlyTeaching.cl — Bake a per-clip sync offset into the DB.
//
// The dialogue game slide reads `slide.clipData.timings: number[]`
// (per-line start times) and applies a runtime `syncOffset` stored in
// localStorage per teacher. This script persists that offset by adding
// it to every timing entry in every slide that has clipData.timings on
// the given lesson.
//
// Usage:
//   node scripts/shift-clip-timings.js <lessonId> <deltaSeconds> [--dry-run]
//
// Example: bake the +2s Time Prank offset:
//   node scripts/shift-clip-timings.js tZl9Y5N4BRiCnXRMPRoj 2

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const DRY_RUN = process.argv.includes('--dry-run');
const args = process.argv.filter(a => !a.startsWith('--')).slice(2);
const LESSON_ID = args[0];
const DELTA     = Number(args[1]);

if (!LESSON_ID || !Number.isFinite(DELTA)) {
  console.error('Usage: node scripts/shift-clip-timings.js <lessonId> <deltaSeconds> [--dry-run]');
  process.exit(1);
}

(async () => {
  initAdmin();
  const db = getFirestore();

  const ref  = db.collection('movieLessons').doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) { console.error(`✗ ${LESSON_ID} not found`); process.exit(1); }
  const data = snap.data();
  const slides = Array.isArray(data.slides) ? data.slides : [];

  const nextSlides = slides.map((s, i) => {
    const timings = s?.clipData?.timings;
    if (!Array.isArray(timings) || timings.length === 0) return s;
    const shifted = timings.map(t => {
      const n = Number(t) + DELTA;
      // Clamp to 0 — negative timings would break the cursor scan loop.
      return n < 0 ? 0 : Number(n.toFixed(3));
    });
    console.log(`  slide[${i}] (${s.type}): ${timings.length} timings shifted by ${DELTA > 0 ? '+' : ''}${DELTA}s`);
    console.log(`    first 3: ${timings.slice(0, 3).join(', ')} → ${shifted.slice(0, 3).join(', ')}`);
    return { ...s, clipData: { ...s.clipData, timings: shifted } };
  });

  const changedCount = nextSlides.filter((s, i) => s !== slides[i]).length;
  console.log(`\n${LESSON_ID} — ${data.title}`);
  console.log(`Slides with timings shifted: ${changedCount}`);

  if (changedCount === 0) {
    console.log('Nothing to do.');
    process.exit(0);
  }

  if (DRY_RUN) {
    console.log('\n--dry-run — no writes performed.');
    process.exit(0);
  }

  await backupLessonDoc(db, LESSON_ID, `shift-timings-${DELTA > 0 ? 'plus' : 'minus'}${Math.abs(DELTA)}s`);
  await ref.update({ slides: nextSlides });
  console.log('✓ Timings shifted and saved.');
  process.exit(0);
})().catch(e => { console.error('ERR:', e); process.exit(1); });
