// FriendlyTeaching.cl — one-off tool to set a lesson's level + sync
// every outstanding studentAssignment that points at it.
//
// Usage: node scripts/_set-lesson-level.js <lessonId> <level>
//        node scripts/_set-lesson-level.js LXT51tG2yyeqhYxVZHnH "B1+"

const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { initAdmin } = require('./_lessonBackup');

const [LESSON_ID, LEVEL] = process.argv.slice(2);
if (!LESSON_ID || !LEVEL) {
  console.error('Usage: node scripts/_set-lesson-level.js <lessonId> <level>');
  process.exit(1);
}

(async () => {
  initAdmin();
  const db = getFirestore();

  const lessonRef = db.collection('lessons').doc(LESSON_ID);
  const snap = await lessonRef.get();
  if (!snap.exists) {
    console.error(`Lesson ${LESSON_ID} does not exist.`);
    process.exit(1);
  }
  const old = snap.data().level;
  if (old === LEVEL) {
    console.log(`Lesson ${LESSON_ID} already at level ${LEVEL}. Still syncing assignments.`);
  } else {
    await lessonRef.update({ level: LEVEL, updatedAt: FieldValue.serverTimestamp() });
    console.log(`Lesson ${LESSON_ID}: level ${old} → ${LEVEL}`);
  }

  const assignSnap = await db
    .collection('studentAssignments')
    .where('refId', '==', LESSON_ID)
    .get();
  console.log(`Updating ${assignSnap.size} studentAssignment${assignSnap.size === 1 ? '' : 's'}…`);
  let updated = 0;
  for (const d of assignSnap.docs) {
    if (d.data().level === LEVEL) continue;
    await d.ref.update({ level: LEVEL, updatedAt: FieldValue.serverTimestamp() });
    updated += 1;
  }
  console.log(`Done. Assignment levels updated: ${updated}`);
  process.exit(0);
})();
