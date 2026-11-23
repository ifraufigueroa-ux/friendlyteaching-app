// FriendlyTeaching.cl — one-off repair
//
// Guillermo (uid ThZOJr3EFVNYoH6hwrML7CwHQgr2) has legacy bookings
// that were created by name only — `studentId: null, studentName:
// 'Guillermo'`. His student dashboard filters by `studentId === uid`,
// so those legacy bookings are invisible to him. The teacher's
// schedule matches by name and sees them, which is why the user
// reported "Guillermo sees next=Wednesday but the teacher's horario
// says today at 11" — the Monday 11 class is one of the legacy
// orphans.
//
// This script finds every booking with studentName='Guillermo' and
// studentId falsy, and stamps studentId + studentEmail with
// Guillermo's values. Idempotent: running twice is a no-op.
//
// Usage:
//   node scripts/link-guillermo-legacy-bookings.js
//
// Aborts if more than one user is named Guillermo (name collision
// would attribute someone else's bookings to this one).

const { initAdmin } = require('./_lessonBackup');
const { getFirestore } = require('firebase-admin/firestore');
initAdmin();
const db = getFirestore();

const UID   = 'ThZOJr3EFVNYoH6hwrML7CwHQgr2';
const EMAIL = 'ggonzalezsilva472@gmail.com';
const NAME  = 'Guillermo';

(async () => {
  // Guard: exactly one user with this name, and it is who we think.
  const users = await db.collection('users').get();
  const matches = users.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((u) => (u.fullName || '').toLowerCase().includes('guillermo'));
  if (matches.length !== 1 || matches[0].uid !== UID) {
    console.error(`Aborting: expected exactly one user named "Guillermo" with uid=${UID}. Found:`, matches.map(m => ({ uid: m.uid, name: m.fullName })));
    process.exit(1);
  }

  // Fetch all bookings with the exact studentName.
  const snap = await db.collection('bookings').where('studentName', '==', NAME).get();
  const orphans = snap.docs.filter((d) => !d.data().studentId);
  console.log(`Found ${snap.size} bookings with studentName="${NAME}"; ${orphans.length} are orphan (no studentId).`);

  if (orphans.length === 0) {
    console.log('Nothing to update — already linked.');
    process.exit(0);
  }

  let updated = 0;
  for (let i = 0; i < orphans.length; i += 400) {
    const slice = orphans.slice(i, i + 400);
    const batch = db.batch();
    for (const d of slice) {
      batch.update(d.ref, { studentId: UID, studentEmail: EMAIL });
    }
    await batch.commit();
    updated += slice.length;
    console.log(`  committed batch — total so far: ${updated}`);
  }
  console.log(`\nDone. Linked ${updated} bookings to uid=${UID} / email=${EMAIL}.`);
  process.exit(0);
})();
