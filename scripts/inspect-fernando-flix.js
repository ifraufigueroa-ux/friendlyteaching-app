// FriendlyTeaching.cl — Inspect Fernando's Friendlyflix assignments
//
// Why nothing is showing in My Lessons under Friendlyflix. Check:
//  - His user doc (uid, email, status)
//  - All movieLessons that contain his uid in assignedTo[]
//  - Also list ALL movieLessons recently updated to see what the teacher
//    actually touched (maybe the assignment went to a different uid).

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
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

(async () => {
  // Find Fernando by name
  const users = await db.collection('users').where('role', '==', 'student').get();
  const hits = users.docs
    .map(d => ({ uid: d.id, ...d.data() }))
    .filter(u => String(u.fullName || '').toLowerCase().includes('fernando'));

  if (hits.length === 0) { console.log('No Fernando found.'); return; }
  console.log('Fernando candidates:');
  for (const u of hits) {
    console.log(`  uid=${u.uid}  name="${u.fullName}"  email="${u.email}"  status=${u.status}  level=${u.studentData?.level}`);
  }

  const target = hits[0];
  console.log(`\nInspecting assignments for ${target.uid} (${target.fullName}):`);

  // Count movie assignments that contain him
  const myMovies = await db.collection('movieLessons')
    .where('assignedTo', 'array-contains', target.uid).get();
  console.log(`  movieLessons with his uid in assignedTo: ${myMovies.size}`);
  for (const d of myMovies.docs) {
    const data = d.data();
    console.log(`    ${d.id}  clip="${data.clip?.title || data.title}"  level=${data.level}  teacher=${data.teacherId}`);
  }

  // Also list the 8 most-recently updated movie lessons in general
  console.log('\nMost recent movieLessons (any student):');
  const recent = await db.collection('movieLessons').orderBy('updatedAt', 'desc').limit(8).get();
  for (const d of recent.docs) {
    const data = d.data();
    const assigned = Array.isArray(data.assignedTo) ? data.assignedTo : [];
    const hasFernando = assigned.includes(target.uid);
    console.log(`  ${d.id}  clip="${data.clip?.title || data.title}"  level=${data.level}  assignedTo=[${assigned.length}]${hasFernando ? '  (INCLUDES FERNANDO)' : ''}`);
    if (assigned.length > 0 && assigned.length <= 8) {
      console.log(`    uids: ${assigned.join(', ')}`);
    }
  }

  // Check for studentAssignments pointing at movie lessons (just in case)
  const sa = await db.collection('studentAssignments')
    .where('studentId', '==', target.uid).get();
  console.log(`\n  studentAssignments for Fernando: ${sa.size}`);
  for (const d of sa.docs) {
    const data = d.data();
    console.log(`    source=${data.source}  title="${data.title}"  refId=${data.refId}`);
  }
})().catch(e => { console.error(e); process.exit(1); });
