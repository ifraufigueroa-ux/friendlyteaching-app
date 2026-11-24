// One-off backfill: students who completed the placement before
// 2026-11-24 ended up with partially-seeded practiceProgress docs
// (totalXp / currentStreak / longestStreak / mastery all missing)
// because useDailyPracticePlacement.complete() did a merge-set with
// only the placement fields. The landing then crashed on
// `progress.totalXp.toLocaleString()`.
//
// This script finds every practiceProgress doc that's missing those
// numeric defaults and fills them in without touching any field that
// already has a value. Idempotent; safe to re-run.

const { initAdmin } = require('./_lessonBackup');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initAdmin();
const db = getFirestore();

(async () => {
  const snap = await db.collection('practiceProgress').get();
  console.log(`Scanning ${snap.size} practiceProgress docs…`);
  let patched = 0;
  for (const d of snap.docs) {
    const data = d.data() || {};
    const patch = {};
    if (typeof data.totalXp        !== 'number') patch.totalXp        = 0;
    if (typeof data.currentStreak  !== 'number') patch.currentStreak  = 0;
    if (typeof data.longestStreak  !== 'number') patch.longestStreak  = 0;
    if (data.mastery == null || typeof data.mastery !== 'object' || Array.isArray(data.mastery)) {
      patch.mastery = {};
    }
    if (data.lastPracticedAt === undefined)      patch.lastPracticedAt = null;
    if (!data.studentId)                         patch.studentId       = d.id;
    if (Object.keys(patch).length === 0) continue;
    patch.updatedAt = FieldValue.serverTimestamp();
    await d.ref.set(patch, { merge: true });
    console.log(`  patched ${d.id} (${Object.keys(patch).filter(k => k !== 'updatedAt').join(', ')})`);
    patched++;
  }
  console.log(`Done. ${patched} docs patched.`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
