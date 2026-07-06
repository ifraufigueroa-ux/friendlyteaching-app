// FriendlyTeaching.cl — Add a cover slide at position 0 for two
// Friendlyflix lessons that were missing one. Follows the same shape
// as the English-for-Devs and Naruto covers (cover type, YouTube
// thumbnail, level pill via slide.content).
//
// Usage: node scripts/add-covers-tms-and-time-prank.js [--dry-run]

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const DRY_RUN = process.argv.includes('--dry-run');

const LESSONS = [
  {
    id: 'ehLwwdBg6XwBItvSaHqM',
    cover: {
      type: 'cover',
      title: 'Logistics — TMS',
      subtitle: 'How Transportation Management Systems keep modern supply chains moving.',
      content: 'B2',
      imageUrl: 'https://img.youtube.com/vi/ZHr0dTapcX4/maxresdefault.jpg',
    },
  },
  {
    id: 'tZl9Y5N4BRiCnXRMPRoj',
    cover: {
      type: 'cover',
      title: 'The Office — Time Prank',
      subtitle: "Jim pulls one of his classic pranks: he messes with time to drive Dwight crazy.",
      content: 'B1',
      imageUrl: 'https://img.youtube.com/vi/b1RoMfysruQ/maxresdefault.jpg',
    },
  },
];

(async () => {
  initAdmin();
  const db = getFirestore();

  for (const { id, cover } of LESSONS) {
    const ref = db.collection('movieLessons').doc(id);
    const snap = await ref.get();
    if (!snap.exists) { console.error(`Skipping ${id} — not found`); continue; }
    const data = snap.data();
    const existing = Array.isArray(data.slides) ? data.slides : [];

    if (existing[0]?.type === 'cover') {
      console.log(`⚠  ${id} already has a cover — leaving as-is`);
      continue;
    }

    const nextSlides = [cover, ...existing];

    console.log(`\n${id} — ${data.title}`);
    console.log('  Prepending cover:');
    console.log(`    title:    ${cover.title}`);
    console.log(`    subtitle: ${cover.subtitle}`);
    console.log(`    level:    ${cover.content}`);
    console.log(`    imageUrl: ${cover.imageUrl}`);
    console.log(`  New slide count: ${nextSlides.length}`);

    if (DRY_RUN) continue;

    await backupLessonDoc(db, id, 'add-cover');
    await ref.update({ slides: nextSlides });
    console.log(`  ✓ Cover added to ${data.title}`);
  }

  if (DRY_RUN) console.log('\n--dry-run — no writes performed.');
  process.exit(0);
})().catch(e => { console.error('ERR:', e); process.exit(1); });
