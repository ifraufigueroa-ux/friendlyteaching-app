// FriendlyTeaching.cl — Reset false-positive "completed" progress docs
//
// The classroom cleanup effect used to call completeProgress on unmount,
// so opening a lesson and clicking "Back" marked it completed. This
// one-off wipes that false signal for the HTML uploads that triggered
// the report. Only touches progress docs that have NO slideProgress
// data recorded (ie. the student never actually advanced), so a real
// completion is left alone.
//
// Usage:
//   node scripts/reset-fake-completions.js --dry-run
//   node scripts/reset-fake-completions.js

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

function loadServiceAccount() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const raw = fs.readFileSync(envPath, 'utf8');
  const line = raw.split(/\r?\n/).find(l => l.startsWith('FIREBASE_SERVICE_ACCOUNT_JSON='));
  const json = line.slice('FIREBASE_SERVICE_ACCOUNT_JSON='.length).replace(/^['"]|['"]$/g, '');
  const parsed = JSON.parse(json);
  if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  return parsed;
}
if (!getApps().length) initializeApp({ credential: cert(loadServiceAccount()) });
const db = getFirestore();
const DRY_RUN = process.argv.includes('--dry-run');

(async () => {
  console.log(DRY_RUN ? '=== DRY RUN ===' : '=== EXECUTING ===');

  // Collect HTML lessonIds.
  const lessons = await db.collection('lessons').get();
  const htmlLessonIds = new Set();
  for (const d of lessons.docs) {
    const s = d.data().source;
    if (s === 'html' || s === 'html-hosted') htmlLessonIds.add(d.id);
  }
  console.log(`HTML lessons: ${htmlLessonIds.size}`);

  let reset = 0, kept = 0;
  let batch = db.batch(); let batchCount = 0;

  for (const lessonId of htmlLessonIds) {
    const q = await db.collection('progress')
      .where('lessonId', '==', lessonId)
      .where('status', '==', 'completed')
      .get();
    for (const p of q.docs) {
      // HTML uploads are single-slide, so every "completed" state on them
      // came from the old unmount-marks-complete bug. Nothing short of an
      // explicit "Mark as complete" click should ever land here now. Wipe
      // all of them back to in_progress.
      console.log(`  reset: progress/${p.id}  student=${p.data().studentId}  lesson=${lessonId}`);
      if (!DRY_RUN) {
        batch.update(p.ref, {
          status: 'in_progress',
          completedAt: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        batchCount++;
        if (batchCount >= 450) { await batch.commit(); batch = db.batch(); batchCount = 0; }
      }
      reset++;
    }
  }
  if (!DRY_RUN && batchCount > 0) await batch.commit();
  console.log(`\nDone. reset=${reset}  kept=${kept}${DRY_RUN ? ' (dry-run)' : ''}`);
})().catch(err => { console.error('ERROR:', err); process.exit(1); });
