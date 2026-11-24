// FriendlyTeaching.cl — one-off repair
//
// Yesterday Ignacio renamed Daniela Correa's user doc from "D. Correa"
// to "Daniela" (meant to be "Daniela Correa"). Two symptoms:
//
//   1. useStudents' dedupe absorbs any fullName that is a prefix of
//      another student's fullName. "Daniela" is a prefix of
//      "Daniela Ibaceta" AND "Daniela Molina", so she gets removed
//      from the active list silently.
//   2. The 104 bookings linked to her uid still carry
//      studentName='D. Correa' from the legacy name, so the teacher's
//      recurring-schedule view can't attribute them to the renamed
//      user.
//
// This script restores fullName='Daniela Correa' on the user doc AND
// stamps every booking owned by her uid with studentName='Daniela Correa'
// so the two sides agree. Idempotent.

const { initAdmin } = require('./_lessonBackup');
const { getFirestore } = require('firebase-admin/firestore');
initAdmin();
const db = getFirestore();

const UID = 'PzTOuOcCCwfs3Qk4oeCtqAwQr3f1';
const NEW_FULL_NAME = 'Daniela Correa';

(async () => {
  // 1. User doc.
  const userRef = db.collection('users').doc(UID);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    console.error('User doc not found for uid=' + UID); process.exit(1);
  }
  const before = userSnap.data();
  console.log('User doc BEFORE:', { fullName: before.fullName, email: before.email, role: before.role, status: before.status });
  if (before.fullName !== NEW_FULL_NAME) {
    await userRef.update({ fullName: NEW_FULL_NAME });
    console.log(`  ✓ Updated user fullName → "${NEW_FULL_NAME}"`);
  } else {
    console.log('  · user fullName already correct, skipping');
  }

  // 2. Bookings.
  const bSnap = await db.collection('bookings').where('studentId', '==', UID).get();
  console.log(`\nBookings with studentId=${UID}: ${bSnap.size}`);
  const stale = bSnap.docs.filter(d => d.data().studentName !== NEW_FULL_NAME);
  console.log(`  With stale studentName (≠ "${NEW_FULL_NAME}"): ${stale.length}`);

  if (stale.length === 0) { console.log('  Nothing to sync.'); process.exit(0); }

  let written = 0;
  for (let i = 0; i < stale.length; i += 400) {
    const slice = stale.slice(i, i + 400);
    const batch = db.batch();
    for (const d of slice) batch.update(d.ref, { studentName: NEW_FULL_NAME });
    await batch.commit();
    written += slice.length;
    console.log(`  committed batch — total: ${written}`);
  }
  console.log(`\n✓ Done. ${written} bookings renamed to "${NEW_FULL_NAME}".`);
  process.exit(0);
})();
