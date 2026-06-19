// Manually capture a snapshot of a movieLessons doc.
// Run BEFORE any session of hand-edits in the editor.
//
//   node scripts/snapshot-lesson.js <lessonId> [note]
//
// Example:
//   node scripts/snapshot-lesson.js gLtuWtn86IvTKe9U6G90 "manual alternatives v1"
const { initAdmin, backupLessonDoc } = require('./_lessonBackup');

const [, , lessonId, ...noteParts] = process.argv;
if (!lessonId) {
  console.error('Usage: node scripts/snapshot-lesson.js <lessonId> [note]');
  process.exit(1);
}
const note = noteParts.join(' ').trim() || 'manual';

(async () => {
  const admin = initAdmin();
  const db = admin.firestore();
  try {
    await backupLessonDoc(db, lessonId, note);
  } catch (e) {
    console.error('✗', e.message);
    process.exit(1);
  }
  process.exit(0);
})();
