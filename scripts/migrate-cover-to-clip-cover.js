// FriendlyTeaching.cl — Flip a Friendlyflix lesson's first slide from
// the generic `cover` type to the new cinematic `clip_cover` type so it
// renders with ClipCoverSlide.tsx.
//
// Usage:
//   node scripts/migrate-cover-to-clip-cover.js <lessonId> [--dry-run]
//   node scripts/migrate-cover-to-clip-cover.js --all [--dry-run]
//
// --all flips every movieLessons doc whose first slide is a plain
// `cover` and whose course is a Friendlyflix course.

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const DRY_RUN = process.argv.includes('--dry-run');
const ALL     = process.argv.includes('--all');
const LESSON_ID = process.argv.find(a => !a.startsWith('--') && a !== process.argv[0] && a !== process.argv[1]);

async function migrateOne(db, id) {
  const ref = db.collection('movieLessons').doc(id);
  const snap = await ref.get();
  if (!snap.exists) { console.error(`✗ ${id} — not found`); return false; }
  const data = snap.data();
  const slides = Array.isArray(data.slides) ? data.slides : [];
  const first = slides[0];

  if (!first) { console.log(`⚠  ${id} (${data.title}) — no slides`); return false; }
  if (first.type === 'clip_cover') { console.log(`✓ ${id} (${data.title}) — already clip_cover`); return false; }
  if (first.type !== 'cover')      { console.log(`⚠  ${id} (${data.title}) — first slide is "${first.type}", skipping`); return false; }

  const nextSlides = [{ ...first, type: 'clip_cover' }, ...slides.slice(1)];

  console.log(`\n${id} — ${data.title}`);
  console.log(`  cover → clip_cover  (title: "${first.title}")`);

  if (DRY_RUN) return true;

  await backupLessonDoc(db, id, 'migrate-to-clip-cover');
  await ref.update({ slides: nextSlides });
  console.log(`  ✓ migrated`);
  return true;
}

(async () => {
  initAdmin();
  const db = getFirestore();

  if (ALL) {
    const snap = await db.collection('movieLessons').get();
    let touched = 0;
    for (const doc of snap.docs) {
      const data = doc.data();
      const courseId = data.courseId || '';
      // Heuristic: Friendlyflix courses have "friendlyflix" in the id,
      // OR the first slide already looks like a clip lesson.
      const isFriendlyflix = /friendlyflix/i.test(courseId)
        || (Array.isArray(data.slides) && data.slides.some(s => s.type?.startsWith?.('clip_')));
      if (!isFriendlyflix) continue;
      if (await migrateOne(db, doc.id)) touched++;
    }
    console.log(`\n${DRY_RUN ? '[dry-run] would touch' : 'migrated'} ${touched} lesson(s).`);
  } else if (LESSON_ID) {
    await migrateOne(db, LESSON_ID);
  } else {
    console.error('Usage: node scripts/migrate-cover-to-clip-cover.js <lessonId>|--all [--dry-run]');
    process.exit(1);
  }

  if (DRY_RUN) console.log('\n--dry-run — no writes performed.');
  process.exit(0);
})().catch(e => { console.error('ERR:', e); process.exit(1); });
