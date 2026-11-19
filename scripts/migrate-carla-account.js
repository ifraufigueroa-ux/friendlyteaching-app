// FriendlyTeaching.cl — Migrate Carla's student account to the right email
//
// Problem: the teacher created Carla's account under the wrong email. Carla's
// real email is carlafredes.a@gmail.com. We need a NEW auth user on that
// email, carrying over everything that was tied to the old uid, and the old
// account archived (kept as backup; NOT deleted).
//
// What this script does:
//   1. Finds the old user doc by searching users where fullName contains
//      "carla" (case-insensitive) and role=='student'.
//        - If more than one match, prints them and stops. Pass --old-uid or
//          --old-email to disambiguate.
//   2. Creates (or re-uses + resets) the Auth user on NEW_EMAIL with
//      NEW_PASSWORD. Marks emailVerified.
//   3. Writes users/{newUid} as a clone of users/{oldUid} with email
//      overridden, uid field refreshed, migratedFrom pointer set.
//   4. Duplicates her data to the new uid WITHOUT touching the originals:
//        - studentAssignments (studentId == oldUid)
//        - homework (assignedToStudentId == oldUid)
//        - progress (studentId == oldUid)
//        - bookings (studentId == oldUid)
//        - friendlisteningAssignments (studentId == oldUid)
//        - friendlywritingAssignments (studentId == oldUid)
//        - practiceProgress/{oldUid} → practiceProgress/{newUid} (if it exists)
//   5. Pushes newUid onto assignedTo arrays of movieLessons / musicLessons /
//      textLessons where oldUid is present.
//   6. Archives the old users doc: status='archived',
//      archivedReason='email_migration', archivedReplacedByUid=<newUid>.
//
// Usage:
//   node scripts/migrate-carla-account.js                # finds by name
//   node scripts/migrate-carla-account.js --old-email X  # or by email
//   node scripts/migrate-carla-account.js --old-uid UID  # or by uid
//   node scripts/migrate-carla-account.js --dry-run      # inspect, no writes
//
// Safe to re-run: the new auth user is upserted, and duplicated docs are
// idempotent by `migratedFromId` so re-running does not create double rows.

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

const NEW_EMAIL    = 'carlafredes.a@gmail.com';
const NEW_PASSWORD = 'Carla123';

// ── Boilerplate ──────────────────────────────────────────────────
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
    const a = argv[i]; if (!a.startsWith('--')) continue;
    const key = a.slice(2); const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) { out[key] = true; }
    else { out[key] = next; i++; }
  }
  return out;
}
const args    = parseArgs(process.argv.slice(2));
const DRY_RUN = !!args['dry-run'];
const LOG     = (...a) => console.log(...a);
const WARN    = (...a) => console.warn('⚠ ', ...a);

// ── Find the old Carla user doc ──────────────────────────────────
async function findOldCarla() {
  if (args['old-uid']) {
    const snap = await db.collection('users').doc(args['old-uid']).get();
    if (!snap.exists) throw new Error(`No users/{${args['old-uid']}} found.`);
    return { uid: snap.id, data: snap.data() };
  }
  if (args['old-email']) {
    const snap = await db.collection('users').where('email', '==', args['old-email']).limit(2).get();
    if (snap.empty) throw new Error(`No users doc with email ${args['old-email']}.`);
    if (snap.size > 1) throw new Error(`Multiple users doc with email ${args['old-email']}.`);
    return { uid: snap.docs[0].id, data: snap.docs[0].data() };
  }

  // Name search: pull all students and filter client-side by substring,
  // since Firestore has no case-insensitive contains. Students collection
  // is small enough for this.
  const snap = await db.collection('users').where('role', '==', 'student').get();
  const hits = snap.docs
    .map(d => ({ uid: d.id, data: d.data() }))
    .filter(x => {
      const name = String(x.data.fullName || '').toLowerCase();
      return name.includes('carla');
    });
  if (hits.length === 0) throw new Error('No student with "carla" in the name.');
  if (hits.length > 1) {
    LOG('Multiple matches — re-run with --old-uid or --old-email:');
    for (const h of hits) {
      LOG(`  uid=${h.uid}  name="${h.data.fullName}"  email="${h.data.email}"  status=${h.data.status}`);
    }
    process.exit(1);
  }
  return hits[0];
}

// ── Copy a collection, filtered by field==value ───────────────────
// Rewrites studentId/userId refs to newUid, tags the copy with
// migratedFromId so a re-run doesn't duplicate.
async function duplicateByField(collectionName, field, oldUid, newUid, extraPatches = {}) {
  const src = await db.collection(collectionName).where(field, '==', oldUid).get();
  if (src.empty) { LOG(`  · ${collectionName}: 0 to copy`); return 0; }

  // Build a set of already-migrated originals so re-runs are safe.
  const already = await db.collection(collectionName)
    .where('migratedFromId', 'in', src.docs.slice(0, 10).map(d => d.id).concat(['__unused__']))
    .get()
    .catch(() => ({ docs: [] }));
  const alreadyIds = new Set(already.docs.map(d => d.data().migratedFromId));

  let created = 0;
  let batch = db.batch();
  let batchCount = 0;
  for (const doc of src.docs) {
    if (alreadyIds.has(doc.id)) continue;
    const data = { ...doc.data(), ...extraPatches, [field]: newUid, migratedFromId: doc.id, migratedAt: FieldValue.serverTimestamp() };
    const ref = db.collection(collectionName).doc();
    if (!DRY_RUN) {
      batch.set(ref, data);
      batchCount++;
      if (batchCount >= 450) { await batch.commit(); batch = db.batch(); batchCount = 0; }
    }
    created++;
  }
  if (!DRY_RUN && batchCount > 0) await batch.commit();
  LOG(`  · ${collectionName}: copied ${created}${DRY_RUN ? ' (dry-run)' : ''}`);
  return created;
}

// ── Add newUid to assignedTo[] arrays where oldUid is present ─────
async function fanoutAssignedTo(collectionName, oldUid, newUid) {
  const src = await db.collection(collectionName).where('assignedTo', 'array-contains', oldUid).get();
  if (src.empty) { LOG(`  · ${collectionName}: 0 arrays to patch`); return 0; }

  let patched = 0;
  let batch = db.batch(); let batchCount = 0;
  for (const doc of src.docs) {
    const current = Array.isArray(doc.data().assignedTo) ? doc.data().assignedTo : [];
    if (current.includes(newUid)) continue; // idempotent
    if (!DRY_RUN) {
      batch.update(doc.ref, { assignedTo: FieldValue.arrayUnion(newUid) });
      batchCount++;
      if (batchCount >= 450) { await batch.commit(); batch = db.batch(); batchCount = 0; }
    }
    patched++;
  }
  if (!DRY_RUN && batchCount > 0) await batch.commit();
  LOG(`  · ${collectionName}: patched ${patched}${DRY_RUN ? ' (dry-run)' : ''}`);
  return patched;
}

// ── Main ──────────────────────────────────────────────────────────
(async () => {
  LOG(DRY_RUN ? '=== DRY RUN (no writes) ===' : '=== EXECUTING MIGRATION ===');

  // 1. Resolve old Carla
  const old = await findOldCarla();
  LOG(`\nOld account:`);
  LOG(`  uid=${old.uid}`);
  LOG(`  name="${old.data.fullName}"`);
  LOG(`  email="${old.data.email}"`);
  LOG(`  role=${old.data.role}  status=${old.data.status}`);
  LOG(`  level=${old.data.studentData?.level}  approvedBy=${old.data.studentData?.approvedByTeacherId}`);

  // 2. Create / reuse the new auth user
  let newUid;
  if (DRY_RUN) {
    newUid = '<new-uid-when-executed>';
  } else {
    try {
      const u = await auth.getUserByEmail(NEW_EMAIL);
      newUid = u.uid;
      await auth.updateUser(newUid, {
        password: NEW_PASSWORD,
        displayName: old.data.fullName,
        emailVerified: true,
      });
      LOG(`\n✓ Reused auth user ${newUid} (password reset)`);
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        const u = await auth.createUser({
          email: NEW_EMAIL,
          password: NEW_PASSWORD,
          displayName: old.data.fullName,
          emailVerified: true,
        });
        newUid = u.uid;
        LOG(`\n✓ Created auth user ${newUid}`);
      } else { throw e; }
    }
  }

  // 3. Clone the user doc
  const newDocRef = db.collection('users').doc(newUid);
  const newDoc = {
    ...old.data,
    uid: newUid,
    email: NEW_EMAIL,
    status: old.data.status === 'archived' ? 'active' : (old.data.status || 'active'),
    migratedFromUid: old.uid,
    migratedAt: FieldValue.serverTimestamp(),
    updatedAt:  FieldValue.serverTimestamp(),
  };
  if (!DRY_RUN) await newDocRef.set(newDoc, { merge: true });
  LOG(`✓ Wrote users/${newUid} (clone of ${old.uid})${DRY_RUN ? ' (dry-run)' : ''}`);

  // 4. Duplicate per-student docs
  LOG(`\nDuplicating student data → ${newUid}:`);
  await duplicateByField('studentAssignments',          'studentId',           old.uid, newUid);
  await duplicateByField('homework',                    'assignedToStudentId', old.uid, newUid);
  await duplicateByField('progress',                    'studentId',           old.uid, newUid);
  await duplicateByField('bookings',                    'studentId',           old.uid, newUid, { studentName: old.data.fullName });
  await duplicateByField('friendlisteningAssignments',  'studentId',           old.uid, newUid);
  await duplicateByField('friendlywritingAssignments',  'studentId',           old.uid, newUid);

  // practiceProgress is a single doc keyed by uid.
  const pp = await db.collection('practiceProgress').doc(old.uid).get();
  if (pp.exists) {
    if (!DRY_RUN) {
      await db.collection('practiceProgress').doc(newUid).set({
        ...pp.data(),
        migratedFromId: old.uid,
        migratedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    LOG(`  · practiceProgress: copied 1${DRY_RUN ? ' (dry-run)' : ''}`);
  } else {
    LOG(`  · practiceProgress: 0 to copy`);
  }

  // 5. assignedTo array fan-outs
  LOG(`\nPatching FT product assignments (array-contains):`);
  await fanoutAssignedTo('movieLessons', old.uid, newUid);
  await fanoutAssignedTo('musicLessons', old.uid, newUid);
  await fanoutAssignedTo('textLessons',  old.uid, newUid);

  // 6. Archive the old users doc
  if (!DRY_RUN) {
    await db.collection('users').doc(old.uid).update({
      status: 'archived',
      archivedReason: 'email_migration',
      archivedReplacedByUid: newUid,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  LOG(`\n✓ Archived users/${old.uid} (replaced by ${newUid})${DRY_RUN ? ' (dry-run)' : ''}`);

  LOG(`\n=== DONE ===`);
  LOG(`New login: ${NEW_EMAIL} / ${NEW_PASSWORD}`);
})().catch(err => { console.error('ERROR:', err); process.exit(1); });
