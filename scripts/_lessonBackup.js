// FriendlyTeaching.cl — Lesson backup helper
//
// Any script that mutates a movieLessons doc MUST call backupLessonDoc()
// BEFORE its first write. Snapshots land in scripts/lesson-snapshots/<id>/
// and ARE git-tracked so we have a recovery path if a write corrupts
// teacher-curated content.
//
// Usage from a script:
//
//   const { backupLessonDoc } = require('./_lessonBackup');
//   await backupLessonDoc(db, LESSON_ID, 'descriptor-of-this-mutation');
//   // ... now safe to update/set/delete

const fs = require('fs');
const path = require('path');

async function backupLessonDoc(db, lessonId, descriptor) {
  if (!lessonId || typeof lessonId !== 'string') {
    throw new Error('backupLessonDoc: lessonId is required');
  }
  if (!descriptor || typeof descriptor !== 'string') {
    throw new Error('backupLessonDoc: descriptor is required');
  }

  const ref  = db.collection('movieLessons').doc(lessonId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error(`backupLessonDoc: lesson ${lessonId} does not exist`);
  }

  const dir = path.join(__dirname, 'lesson-snapshots', lessonId);
  fs.mkdirSync(dir, { recursive: true });

  const stamp    = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${stamp}--before-${descriptor.replace(/[^a-zA-Z0-9-]/g, '-')}.json`;
  const filepath = path.join(dir, filename);

  // Convert Firestore Timestamps to plain JSON so the snapshot is portable.
  fs.writeFileSync(filepath, JSON.stringify(snap.data(), null, 2));
  console.log(`✓ Backup written: ${path.relative(process.cwd(), filepath)}`);
  return filepath;
}

module.exports = { backupLessonDoc };
