// FriendlyTeaching.cl — Publish lessons that are assigned to students
//
// Context: HTML uploads via the Assign flow saved the lesson with
// isPublished:false. The Firestore rule for /lessons allows student reads
// only when isPublished:true, so the student sees "Lesson not found" when
// opening the assigned lesson from My Lessons.
//
// This script finds every lesson that has at least one row in
// studentAssignments pointing at it (source==='lesson', with refId), and
// flips isPublished to true if it isn't already. Writes are logged; use
// --dry-run to inspect without changing anything.
//
// Usage:
//   node scripts/publish-assigned-lessons.js --dry-run
//   node scripts/publish-assigned-lessons.js

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

function loadServiceAccount() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const raw = fs.readFileSync(envPath, 'utf8');
  const line = raw.split(/\r?\n/).find(l => l.startsWith('FIREBASE_SERVICE_ACCOUNT_JSON='));
  if (!line) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON not in .env.local');
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

  const assigns = await db.collection('studentAssignments')
    .where('source', '==', 'lesson')
    .get();
  const refIds = new Set();
  for (const d of assigns.docs) {
    const ref = d.data().refId;
    if (ref) refIds.add(ref);
  }
  console.log(`Found ${refIds.size} distinct lessonIds referenced by studentAssignments.`);

  let toPublish = 0, missing = 0, alreadyPub = 0;
  let batch = db.batch(); let batchCount = 0;

  for (const lessonId of refIds) {
    const snap = await db.collection('lessons').doc(lessonId).get();
    if (!snap.exists) { missing++; console.log(`  missing: ${lessonId}`); continue; }
    const data = snap.data();
    if (data.isPublished === true) { alreadyPub++; continue; }
    // Narrow scope: only auto-publish HTML uploads that got assigned.
    // Other unpublished lessons may be teacher drafts not meant for
    // students yet — leave those alone.
    if (data.source !== 'html' && data.source !== 'html-hosted') {
      console.log(`  skip (not html): ${lessonId}  source=${data.source}  title="${data.title}"`);
      continue;
    }
    console.log(`  publishing: ${lessonId}  code=${data.code}  title="${data.title}"  source=${data.source}`);
    if (!DRY_RUN) {
      batch.update(snap.ref, {
        isPublished: true,
        publishedAt: data.publishedAt ?? FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      batchCount++;
      if (batchCount >= 450) { await batch.commit(); batch = db.batch(); batchCount = 0; }
    }
    toPublish++;
  }
  if (!DRY_RUN && batchCount > 0) await batch.commit();

  console.log(`\nDone. published=${toPublish}  alreadyPublished=${alreadyPub}  missing=${missing}${DRY_RUN ? ' (dry-run)' : ''}`);
})().catch(err => { console.error('ERROR:', err); process.exit(1); });
