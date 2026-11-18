// FriendlyTeaching.cl — one-off diagnostic
// Usage: node scripts/_check-student-assignments.js "<substring of fullName>"
//
// Lists the matching user(s), their role + studentData.approvedByTeacherId,
// and every studentAssignment currently sitting in Firestore for them.

const { getFirestore } = require('firebase-admin/firestore');
const { initAdmin } = require('./_lessonBackup');

const needle = (process.argv[2] || '').trim().toLowerCase();
if (!needle) { console.error('Usage: node scripts/_check-student-assignments.js "<name substring>"'); process.exit(1); }

(async () => {
  initAdmin();
  const db = getFirestore();

  const usersSnap = await db.collection('users').get();
  const matches = usersSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(u => (u.fullName || '').toLowerCase().includes(needle));

  if (matches.length === 0) {
    console.log(`No users match "${needle}"`);
    process.exit(0);
  }

  for (const u of matches) {
    console.log('\n──────────────────────────────────');
    console.log('fullName:', u.fullName);
    console.log('uid:     ', u.uid || u.id);
    console.log('email:   ', u.email);
    console.log('role:    ', u.role, ' · status:', u.status);
    console.log('studentData.approvedByTeacherId:', u.studentData?.approvedByTeacherId ?? '(none)');

    const uid = u.uid || u.id;
    const assignSnap = await db
      .collection('studentAssignments')
      .where('studentId', '==', uid)
      .get();
    console.log(`studentAssignments for ${uid}:`, assignSnap.size);
    assignSnap.docs.forEach(d => {
      const a = d.data();
      console.log(`  - [${a.source}] ${a.title}  (lvl=${a.level || '?'}, status=${a.status || 'assigned'})`);
      console.log(`    refId=${a.refId ?? '-'}  teacherId=${a.teacherId}  createdAt=${a.createdAt?.toDate?.()?.toISOString?.() ?? '?'}`);
    });
  }

  process.exit(0);
})();
