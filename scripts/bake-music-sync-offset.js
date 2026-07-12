// FriendlyTeaching.cl — Bake a per-song sync offset into a music lesson.
//
// Used when the YouTube video was cropped/re-encoded and the vocals now
// start N seconds later than the original song. The offset is applied on
// top of LRC/fallback timings at render time by LyricsGameSlide.
//
// The offset is written to `song.syncOffsetSeconds` (canonical, survives
// slide regeneration) and mirrored onto every `slide.songData.syncOffsetSeconds`
// on the doc so it takes effect immediately without a re-gen.
//
// Usage:
//   node scripts/bake-music-sync-offset.js <lessonId> <seconds> [--dry-run]
//
// Example — Wannabe (cropped intro; lyrics start at 0:49):
//   node scripts/bake-music-sync-offset.js UjUKLpWC2qKLT8UQn0Dj 49

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const COLLECTION = 'musicLessons';
const DRY_RUN    = process.argv.includes('--dry-run');

const positional = process.argv.slice(2).filter(a => !a.startsWith('--'));
const LESSON_ID = positional[0];
const OFFSET    = Number(positional[1]);

if (!LESSON_ID || !Number.isFinite(OFFSET)) {
  console.error('Usage: node scripts/bake-music-sync-offset.js <lessonId> <seconds> [--dry-run]');
  process.exit(1);
}

(async () => {
  initAdmin();
  const db  = getFirestore();
  const ref = db.collection(COLLECTION).doc(LESSON_ID);
  const snap = await ref.get();
  if (!snap.exists) {
    console.error(`✗ ${COLLECTION}/${LESSON_ID} not found`);
    process.exit(1);
  }
  const data = snap.data();
  const slides = Array.isArray(data.slides) ? data.slides : [];

  const currentSong  = data.song?.syncOffsetSeconds ?? 0;
  const nextSong     = { ...(data.song || {}), syncOffsetSeconds: OFFSET };

  const nextSlides = slides.map((s) => {
    if (!s?.songData) return s;
    return { ...s, songData: { ...s.songData, syncOffsetSeconds: OFFSET } };
  });

  const touchedSlides = nextSlides.reduce(
    (n, s, i) => n + (s !== slides[i] ? 1 : 0),
    0,
  );

  console.log(`\n${LESSON_ID} — ${data.song?.title} · ${data.song?.artist}`);
  console.log(`  lesson.song.syncOffsetSeconds : ${currentSong}s  →  ${OFFSET}s`);
  console.log(`  slides with songData patched  : ${touchedSlides} / ${slides.length}`);

  if (DRY_RUN) {
    console.log('\n--dry-run — no writes.');
    process.exit(0);
  }

  await backupLessonDoc(db, LESSON_ID, `bake-sync-offset-${OFFSET}s`, COLLECTION);
  await ref.update({ song: nextSong, slides: nextSlides });
  console.log(`\n✓ Baked ${OFFSET}s sync offset into ${LESSON_ID}.`);
  process.exit(0);
})().catch((e) => { console.error('ERR:', e); process.exit(1); });
