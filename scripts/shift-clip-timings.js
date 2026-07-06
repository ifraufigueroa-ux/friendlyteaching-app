// FriendlyTeaching.cl — Bake a per-clip sync offset into the DB.
//
// The dialogue game slide reads `slide.clipData.timings: number[]`
// (per-line start times) and applies a runtime `syncOffset` stored in
// localStorage per teacher. This script persists that offset by adding
// it to every entry (or a subrange) of slide.clipData.timings on the
// given lesson.
//
// Usage:
//   node scripts/shift-clip-timings.js <lessonId> <deltaSeconds> [--from N] [--to N] [--dry-run]
//
// --from N   inclusive line index start (default 0)
// --to N     inclusive line index end   (default last)
//
// Examples:
//   Whole clip +2s:
//     node scripts/shift-clip-timings.js tZl9Y5N4BRiCnXRMPRoj 2
//   Only lines 32 onward +1s (fix a drift from that point):
//     node scripts/shift-clip-timings.js ehLwwdBg6XwBItvSaHqM 1 --from 32

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const DRY_RUN = process.argv.includes('--dry-run');

function parseFlag(name) {
  const i = process.argv.indexOf(name);
  if (i < 0) return null;
  const v = process.argv[i + 1];
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const FROM = parseFlag('--from');
const TO   = parseFlag('--to');

const positional = process.argv
  .slice(2)
  .filter((a, i, arr) => !a.startsWith('--') && arr[i - 1] !== '--from' && arr[i - 1] !== '--to');
const LESSON_ID = positional[0];
const DELTA     = Number(positional[1]);

if (!LESSON_ID || !Number.isFinite(DELTA)) {
  console.error('Usage: node scripts/shift-clip-timings.js <lessonId> <deltaSeconds> [--from N] [--to N] [--dry-run]');
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
    const from = FROM ?? 0;
    const to   = TO ?? (timings.length - 1);
    const shifted = timings.map((t, idx) => {
      if (idx < from || idx > to) return Number(t);
      const n = Number(t) + DELTA;
      return n < 0 ? 0 : Number(n.toFixed(3));
    });
    console.log(`  slide[${i}] (${s.type}): shifted lines [${from}..${to}] by ${DELTA > 0 ? '+' : ''}${DELTA}s (of ${timings.length} total)`);
    // Preview a few around the range boundary if it's a subrange, else first 3.
    if (FROM != null || TO != null) {
      const preview = [Math.max(0, from - 1), from, to, Math.min(timings.length - 1, to + 1)]
        .filter((v, i, arr) => v >= 0 && v < timings.length && arr.indexOf(v) === i);
      preview.forEach(idx => console.log(`    line ${idx}: ${timings[idx]} → ${shifted[idx]}`));
    } else {
      console.log(`    first 3: ${timings.slice(0, 3).join(', ')} → ${shifted.slice(0, 3).join(', ')}`);
    }
    return { ...s, clipData: { ...s.clipData, timings: shifted } };
  });

  const changedCount = nextSlides.filter((s, i) => s !== slides[i]).length;
  console.log(`\n${LESSON_ID} — ${data.title}`);
  console.log(`Slides with timings shifted: ${changedCount}`);

  if (changedCount === 0) { console.log('Nothing to do.'); process.exit(0); }

  if (DRY_RUN) {
    console.log('\n--dry-run — no writes performed.');
    process.exit(0);
  }

  const rangeTag = (FROM != null || TO != null) ? `-lines${FROM ?? 0}-${TO ?? 'end'}` : '';
  const noteTag  = `shift-timings-${DELTA > 0 ? 'plus' : 'minus'}${Math.abs(DELTA)}s${rangeTag}`;
  await backupLessonDoc(db, LESSON_ID, noteTag);
  await ref.update({ slides: nextSlides });
  console.log('✓ Timings shifted and saved.');
  process.exit(0);
})().catch(e => { console.error('ERR:', e); process.exit(1); });
