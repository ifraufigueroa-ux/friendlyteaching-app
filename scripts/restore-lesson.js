// Restore a movieLessons doc from a local snapshot file.
//
//   node scripts/restore-lesson.js <lessonId> <snapshotFile> --yes
//
// A pre-restore snapshot of the CURRENT state is taken automatically,
// so a bad restore is still reversible. The --yes flag is required to
// actually write — running without it just prints what would happen.
const { initAdmin, restoreLessonDoc } = require('./_lessonBackup');

const argv = process.argv.slice(2);
const yes  = argv.includes('--yes');
const positional = argv.filter(a => !a.startsWith('--'));
const [lessonId, snapshotFile] = positional;

if (!lessonId || !snapshotFile) {
  console.error('Usage: node scripts/restore-lesson.js <lessonId> <snapshotFile> --yes');
  process.exit(1);
}

if (!yes) {
  console.log('⚠ Dry run.');
  console.log(`   Would overwrite movieLessons/${lessonId}`);
  console.log(`   From snapshot:  ${snapshotFile}`);
  console.log('   A pre-restore snapshot of the current state would be taken first.');
  console.log('\nRe-run with --yes to confirm.');
  process.exit(0);
}

(async () => {
  const admin = initAdmin();
  const db = admin.firestore();
  try {
    await restoreLessonDoc(db, lessonId, snapshotFile);
  } catch (e) {
    console.error('✗', e.message);
    process.exit(1);
  }
  process.exit(0);
})();
