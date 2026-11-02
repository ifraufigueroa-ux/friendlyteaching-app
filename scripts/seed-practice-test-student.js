// FriendlyTeaching.cl — Daily Practice test student
//
// Creates (or re-uses) a single approved student in Firebase Auth +
// Firestore so we can log in and walk through the Daily Practice flow
// end-to-end from a clean slate (no practiceProgress → see onboarding).
//
// Usage:
//   node scripts/seed-practice-test-student.js
//   node scripts/seed-practice-test-student.js --email alice@test.cl --reset-progress
//
// Flags:
//   --email <email>       override default email
//   --password <pw>       override default password
//   --name <full name>    override default name
//   --reset-progress      delete the practiceProgress/{uid} doc so the
//                         onboarding screen shows again
//   --delete              hard-delete the Auth user + Firestore doc

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
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
const auth = getAuth();
const db   = getFirestore();

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) { out[key] = true; }
    else { out[key] = next; i++; }
  }
  return out;
}
const args = parseArgs(process.argv.slice(2));
const EMAIL    = args.email    || 'practice.tester@friendlytest.cl';
const PASSWORD = args.password || 'PracticeTest2026!';
const NAME     = args.name     || 'Alex Tester';
const resetProgress = !!args['reset-progress'];
const doDelete      = !!args.delete;

(async () => {
  if (doDelete) {
    try {
      const u = await auth.getUserByEmail(EMAIL);
      await auth.deleteUser(u.uid);
      await db.collection('users').doc(u.uid).delete().catch(() => {});
      await db.collection('practiceProgress').doc(u.uid).delete().catch(() => {});
      console.log('✓ Deleted', EMAIL);
    } catch (e) {
      if (e.code === 'auth/user-not-found') console.log('nothing to delete.');
      else throw e;
    }
    return;
  }

  // 1. Auth user (create or re-use, reset password to known value)
  let uid;
  try {
    const u = await auth.getUserByEmail(EMAIL);
    uid = u.uid;
    await auth.updateUser(uid, { password: PASSWORD, displayName: NAME, emailVerified: true });
    console.log(`✓ Reused auth user ${uid} (password reset)`);
  } catch (e) {
    if (e.code !== 'auth/user-not-found') throw e;
    const u = await auth.createUser({
      email: EMAIL, password: PASSWORD, displayName: NAME, emailVerified: true,
    });
    uid = u.uid;
    console.log(`✓ Created new auth user ${uid}`);
  }

  // 2. Firestore profile — approved student, no teacher attached (any
  //    teacher can approve; `useStudents` tolerates null approvedByTeacherId).
  await db.collection('users').doc(uid).set({
    uid,
    email:    EMAIL,
    fullName: NAME,
    role:     'student',
    status:   'approved',
    language: 'en',
    studentData: {
      approvedByTeacherId: null,
      level:               'A1',
      joinedAt:            FieldValue.serverTimestamp(),
      notes:               'Daily Practice test account',
    },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log('✓ Wrote users/' + uid);

  // 3. Clear practiceProgress so we see onboarding again
  if (resetProgress) {
    await db.collection('practiceProgress').doc(uid).delete().catch(() => {});
    console.log('✓ Cleared practiceProgress/' + uid + ' (will see onboarding)');
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Daily Practice test student ready');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  email:    ' + EMAIL);
  console.log('  password: ' + PASSWORD);
  console.log('  uid:      ' + uid);
  console.log('');
  console.log('Login at http://localhost:3000/auth/login and visit');
  console.log('http://localhost:3000/dashboard/student/practice');
})().catch(err => {
  console.error('✗ FAILED:', err.message);
  if (err.stack) console.error(err.stack.split('\n').slice(0, 6).join('\n'));
  process.exit(1);
});
